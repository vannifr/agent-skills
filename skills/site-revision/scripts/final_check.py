#!/usr/bin/env python3
"""Final all-URL check against a live site.

Checks every URL in the sitemap (plus --extra-url pages): HTTP 200, a
unique <title>, exactly one <h1>, valid JSON-LD, FAQPage question count
equal to the visible <details> count, every <img> with alt/width/height
and a working same-site src, no forbidden names anywhere in the HTML, and
no forbidden terms in the visible main text of pages outside
--term-skip-prefix.

Usage:
  final_check.py --base https://example.org \
      [--sitemap /sitemap-0.xml] [--extra-url /about/ ...] \
      [--forbid-name "Jane Doe" ...] [--forbid-term givens ...] \
      [--term-skip-prefix /en/ ...]

Exit code 1 when any problem is found.
"""
import argparse
import json
import random
import re
import sys
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (site-revision final check)"}


def fetch(url, method="GET"):
    sep = "&" if "?" in url else "?"
    target = url if method == "HEAD" else f"{url}{sep}cb={random.randint(1, 10**9)}"
    req = urllib.request.Request(target, method=method, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read().decode("utf-8", "replace") if method == "GET" else ""
        return resp.status, body


def sitemap_urls(base, sitemap_path):
    _, xml = fetch(base + sitemap_path)
    locs = re.findall(r"<loc>([^<]+)</loc>", xml)
    nested = [u for u in locs if u.endswith(".xml")]
    pages = [u for u in locs if not u.endswith(".xml")]
    for sub in nested:
        _, sub_xml = fetch(sub)
        pages += re.findall(r"<loc>([^<]+)</loc>", sub_xml)
    return pages


def check_page(path, html, args, issues, titles):
    title = re.search(r"<title>(.*?)</title>", html, re.S)
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

    main = re.search(r"<main.*?</main>", html, re.S)
    text = re.sub(r"<[^>]+>", " ", main.group(0) if main else html)
    if not any(path.startswith(p) for p in args.term_skip_prefix):
        for term in args.forbid_term:
            if re.search(rf"\b{re.escape(term)}\b", text, re.I):
                issues.append(f"{path}: forbidden term '{term}'")

    details = len(re.findall(r"<details", html))
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(block)
        except json.JSONDecodeError as exc:
            issues.append(f"{path}: invalid JSON-LD ({exc})")
            continue
        items = data if isinstance(data, list) else [data]
        for item in items:
            if isinstance(item, dict) and item.get("@type") == "FAQPage":
                questions = len(item.get("mainEntity", []))
                if questions != details:
                    issues.append(f"{path}: FAQ schema {questions} questions vs {details} visible")

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


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--base", required=True, help="production origin, no trailing slash")
    parser.add_argument("--sitemap", default="/sitemap.xml", help="sitemap path (index or urlset)")
    parser.add_argument("--extra-url", action="append", default=[], help="path not in the sitemap")
    parser.add_argument("--forbid-name", action="append", default=[])
    parser.add_argument("--forbid-term", action="append", default=[])
    parser.add_argument("--term-skip-prefix", action="append", default=[])
    args = parser.parse_args()
    args.base = args.base.rstrip("/")

    urls = sitemap_urls(args.base, args.sitemap) + [args.base + p for p in args.extra_url]
    issues, titles = [], {}
    for url in urls:
        path = url[len(args.base):] or "/"
        try:
            status, html = fetch(url)
        except Exception as exc:  # noqa: BLE001
            issues.append(f"{path}: fetch failed ({exc})")
            continue
        if status != 200:
            issues.append(f"{path}: status {status}")
        check_page(path, html, args, issues, titles)

    for title, paths in titles.items():
        if title and len(paths) > 1:
            issues.append(f"duplicate title '{title}': {paths}")

    print(f"{len(urls)} URLs checked, {len(issues)} problems")
    for issue in sorted(set(issues)):
        print(f"  {issue}")
    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main())
