#!/usr/bin/env python3
"""Structural parity check between language versions in a built site.

Pairs pages through their <link rel="alternate" hreflang="..."> tags and
compares, per pair: h2, h3, <details> (FAQ), <img>, <blockquote>, links,
list items, table rows, and word count of the <main> element. Prints only
pairs that differ, or whose word ratio falls outside --ratio.

Usage:
  parity_check.py --dist dist --base https://example.org \
      --from-lang nl --to-lang en [--ratio 0.8 1.25]
"""
import argparse
import glob
import os
import re
import sys

COUNTS = {
    "h2": r"<h2[\s>]",
    "h3": r"<h3[\s>]",
    "faq": r"<details[\s>]",
    "img": r"<img\s",
    "quote": r"<blockquote[\s>]",
    "link": r"<a\s",
    "li": r"<li[\s>]",
    "tr": r"<tr[\s>]",
}


def stats(html):
    main = re.search(r"<main.*?</main>", html, re.S)
    body = main.group(0) if main else html
    result = {k: len(re.findall(p, body)) for k, p in COUNTS.items()}
    result["words"] = len(re.sub(r"<[^>]+>", " ", body).split())
    return result


def file_for(dist, url_path):
    candidate = os.path.join(dist, url_path.strip("/"), "index.html")
    return candidate if os.path.exists(candidate) else None


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dist", required=True)
    parser.add_argument("--base", required=True, help="origin used in hreflang hrefs")
    parser.add_argument("--from-lang", required=True)
    parser.add_argument("--to-lang", required=True)
    parser.add_argument("--ratio", nargs=2, type=float, default=[0.8, 1.25])
    args = parser.parse_args()
    base = args.base.rstrip("/")

    href_re = re.compile(
        rf'<link[^>]+hreflang="{re.escape(args.to_lang)}"[^>]+href="{re.escape(base)}([^"]*)"'
        rf'|<link[^>]+href="{re.escape(base)}([^"]*)"[^>]+hreflang="{re.escape(args.to_lang)}"'
    )
    lang_re = re.compile(rf'<html[^>]+lang="{re.escape(args.from_lang)}')
    pairs, differences = 0, 0
    for path in sorted(glob.glob(os.path.join(args.dist, "**", "index.html"), recursive=True)):
        html = open(path, encoding="utf-8").read()
        if not lang_re.search(html):
            continue
        match = href_re.search(html)
        if not match:
            continue
        other = file_for(args.dist, match.group(1) or match.group(2) or "/")
        if not other or os.path.samefile(other, path):
            continue
        pairs += 1
        a = stats(html)
        b = stats(open(other, encoding="utf-8").read())
        diffs = [f"{k} {a[k]}/{b[k]}" for k in COUNTS if a[k] != b[k]]
        ratio = a["words"] / max(b["words"], 1)
        if diffs or not args.ratio[0] <= ratio <= args.ratio[1]:
            differences += 1
            rel = os.path.relpath(path, args.dist)
            print(f"{rel}: {', '.join(diffs) or 'structure equal'}; words {a['words']}/{b['words']} ({ratio:.2f})")
    print(f"{pairs} pairs compared, {differences} with differences")
    return 1 if differences else 0


if __name__ == "__main__":
    sys.exit(main())
