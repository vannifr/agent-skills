#!/usr/bin/env python3
"""Final all-URL check against a live site.

Checks every URL in the sitemap (plus --extra-url pages): HTTP 200, a
unique <title>, exactly one <h1>, valid JSON-LD, every FAQPage question
visible on the page, every <img> with alt/width/height and a working
same-site src, no forbidden names anywhere in the HTML, no forbidden
terms in the visible main text (quotes excluded) of pages outside
--term-skip-prefix, and each --require-snippet present on every page.
Launch blockers: noindex (meta robots or X-Robots-Tag) on a sitemap
page, a robots.txt that disallows the whole site, placeholder text, and
links or resources pointing at a local host.
Also checks that repository files outside the build output are not
publicly served: every top-level entry of --private-from that is not in
--build-dir (for a directory, the directory and its first file), plus
each --private-path.

--base can be a local preview server of the build, to catch problems
before the deploy.

Usage:
  final_check.py --base https://example.org \
      [--sitemap /sitemap-0.xml] [--extra-url /about/ ...] \
      [--forbid-name "Jane Doe" ...] [--forbid-term givens ...] \
      [--term-skip-prefix /en/ ...] [--require-snippet 'data-site="x"' ...] \
      [--private-from . --build-dir dist] [--private-path /tools/ ...]

Exit code 1 when any problem is found.
"""
import argparse
from html import unescape
import json
import os
import random
import re
import sys
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (site-revision final check)"}


def fetch(url, method="GET", with_headers=False):
    sep = "&" if "?" in url else "?"
    target = url if method == "HEAD" else f"{url}{sep}cb={random.randint(1, 10**9)}"
    req = urllib.request.Request(target, method=method, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read().decode("utf-8", "replace") if method == "GET" else ""
        if with_headers:
            return resp.status, body, resp.headers
        return resp.status, body


LOCAL_HOST = re.compile(r'(?:href|src)="(https?://(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?)')
PLACEHOLDERS = ["lorem ipsum"]


def check_launch_blockers(path, html, headers, in_sitemap, args, issues):
    robots = headers.get("X-Robots-Tag", "") if headers else ""
    for tag in re.findall(r"<meta\s[^>]*>", html, re.I):
        if re.search(r'name="robots"', tag, re.I):
            content = re.search(r'content="([^"]*)"', tag, re.I)
            robots += " " + (content.group(1) if content else "")
    if in_sitemap and "noindex" in robots.lower():
        issues.append(f"{path}: noindex on a sitemap page")
    text = visible_text(html).lower()
    for placeholder in PLACEHOLDERS:
        if placeholder in text:
            issues.append(f"{path}: placeholder text '{placeholder}'")
    for origin in set(LOCAL_HOST.findall(html)):
        if not args.base.startswith(origin):
            issues.append(f"{path}: link to a local host: {origin}")


def check_robots_txt(args, issues):
    try:
        status, body = fetch(args.base + "/robots.txt")
    except Exception:  # noqa: BLE001 - no robots.txt means nothing is blocked
        return
    agents, group_started = set(), False
    for raw in body.splitlines():
        line = raw.split("#", 1)[0].strip()
        key, _, value = line.partition(":")
        key, value = key.strip().lower(), value.strip()
        if key == "user-agent":
            if group_started:
                agents, group_started = set(), False
            agents.add(value)
        elif key in ("allow", "disallow"):
            group_started = True
            if key == "disallow" and value == "/" and "*" in agents:
                issues.append("robots.txt disallows the whole site")
                return


def sitemap_urls(base, sitemap_path):
    _, xml = fetch(base + sitemap_path)
    locs = re.findall(r"<loc>([^<]+)</loc>", xml)
    nested = [u for u in locs if u.endswith(".xml")]
    pages = [u for u in locs if not u.endswith(".xml")]
    for sub in nested:
        _, sub_xml = fetch(sub)
        pages += re.findall(r"<loc>([^<]+)</loc>", sub_xml)
    return pages


def visible_text(html):
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", html))).strip()


def check_page(path, html, args, issues, titles):
    title = re.search(r"<title[^>]*>(.*?)</title>", html, re.S)
    title = title.group(1).strip() if title else ""
    if not title:
        issues.append(f"{path}: no <title>")
    titles.setdefault(title, []).append(path)

    h1_count = len(re.findall(r"<h1[\s>]", html))
    if h1_count != 1:
        issues.append(f"{path}: {h1_count} <h1> elements")

    for name in args.forbid_name:
        if re.search(re.escape(name), html, re.I):
            issues.append(f"{path}: forbidden name '{name}'")

    for snippet in args.require_snippet:
        if snippet not in html:
            issues.append(f"{path}: missing snippet '{snippet}'")

    main = re.search(r"<main.*?</main>", html, re.S)
    main_html = main.group(0) if main else html
    unquoted = re.sub(r"<(blockquote|q)[\s>].*?</\1>", " ", main_html, flags=re.S)
    text = visible_text(unquoted)
    if not any(path.startswith(p) for p in args.term_skip_prefix):
        for term in args.forbid_term:
            if re.search(rf"\b{re.escape(term)}\b", text, re.I):
                issues.append(f"{path}: forbidden term '{term}'")

    page_text = visible_text(main_html).lower()
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(block)
        except json.JSONDecodeError as exc:
            issues.append(f"{path}: invalid JSON-LD ({exc})")
            continue
        items = data if isinstance(data, list) else [data]
        for item in items:
            if isinstance(item, dict) and item.get("@type") == "FAQPage":
                for question in item.get("mainEntity", []):
                    name = re.sub(r"\s+", " ", unescape(str(question.get("name", "")))).strip()
                    if name and name.lower() not in page_text:
                        issues.append(f"{path}: FAQ schema question not visible: '{name}'")

    for img in re.findall(r"<img [^>]*>", html):
        if "alt=" not in img or "width=" not in img or "height=" not in img:
            issues.append(f"{path}: <img> without alt/width/height: {img[:90]}")
        src = re.search(r'src="([^"]+)"', img)
        if src and src.group(1).startswith("/"):
            try:
                status, _ = fetch(args.base + src.group(1), method="HEAD")
                if status != 200:
                    issues.append(f"{path}: image {src.group(1)} returned {status}")
            except Exception as exc:  # noqa: BLE001 - report any fetch failure
                issues.append(f"{path}: image {src.group(1)} failed ({exc})")


def private_paths(args):
    paths = list(args.private_path)
    if not args.private_from:
        return paths
    build = os.path.abspath(args.build_dir) if args.build_dir else None
    for entry in sorted(os.listdir(args.private_from)):
        full = os.path.join(args.private_from, entry)
        if build and (os.path.abspath(full) == build or os.path.exists(os.path.join(build, entry))):
            continue
        if not os.path.isdir(full):
            paths.append(f"/{entry}")
            continue
        paths.append(f"/{entry}/")
        for root, dirs, files in os.walk(full):
            dirs.sort()
            if files:
                rel = os.path.relpath(os.path.join(root, sorted(files)[0]), args.private_from)
                paths.append("/" + rel.replace(os.sep, "/"))
                break
    return paths


def check_private_paths(args, issues):
    def fingerprint(body):
        title = re.search(r"<title[^>]*>(.*?)</title>", body, re.S)
        return title.group(1).strip() if title else body[:200]

    try:
        status, body = fetch(f"{args.base}/__not-found-{random.randint(1, 10**9)}")
        fallback = fingerprint(body) if status == 200 else None
    except Exception:  # noqa: BLE001 - a 404 raises; no fallback page then
        fallback = None
    for path in private_paths(args):
        try:
            status, body = fetch(args.base + path)
        except Exception:  # noqa: BLE001 - 403/404 raise: not served, fine
            continue
        if status == 200 and fingerprint(body) != fallback:
            issues.append(f"internal file publicly served: {path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--base", required=True, help="production origin, no trailing slash")
    parser.add_argument("--sitemap", default="/sitemap.xml", help="sitemap path (index or urlset)")
    parser.add_argument("--extra-url", action="append", default=[], help="path not in the sitemap")
    parser.add_argument("--forbid-name", action="append", default=[])
    parser.add_argument("--forbid-term", action="append", default=[])
    parser.add_argument("--term-skip-prefix", action="append", default=[])
    parser.add_argument("--require-snippet", action="append", default=[], help="text every page must contain, e.g. the analytics tag")
    parser.add_argument("--private-path", action="append", default=[], help="path that must not be served")
    parser.add_argument("--private-from", help="repository root; its top-level entries must not be served")
    parser.add_argument("--build-dir", help="build output dir; entries present there are site content")
    args = parser.parse_args()
    args.base = args.base.rstrip("/")

    sitemap = sitemap_urls(args.base, args.sitemap)
    urls = sitemap + [args.base + p for p in args.extra_url]
    issues, titles = [], {}
    for url in urls:
        path = url[len(args.base):] or "/"
        try:
            status, html, headers = fetch(url, with_headers=True)
        except Exception as exc:  # noqa: BLE001
            issues.append(f"{path}: fetch failed ({exc})")
            continue
        if status != 200:
            issues.append(f"{path}: status {status}")
        check_page(path, html, args, issues, titles)
        check_launch_blockers(path, html, headers, url in sitemap, args, issues)

    check_private_paths(args, issues)
    check_robots_txt(args, issues)

    for title, paths in titles.items():
        if title and len(paths) > 1:
            issues.append(f"duplicate title '{title}': {paths}")

    print(f"{len(urls)} URLs checked, {len(issues)} problems")
    for issue in sorted(set(issues)):
        print(f"  {issue}")
    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main())
