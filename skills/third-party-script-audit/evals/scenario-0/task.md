# Third-Party Script Audit for a Community Recipe Blog

## Problem Description

A small recipe-blog site owner wants to know what's actually running on
their pages before a planned redesign. They've added a few embeds over
the years (a newsletter widget, a recipe-rating script, Google Fonts)
without keeping track, and someone recently asked in a blog comment why
their browser's network tab shows a request to an unfamiliar analytics
domain they don't remember approving.

## Provided data (already captured, do not re-fetch)

Network requests observed while loading `/recipes/sourdough-starter`
(Playwright network capture, third-party origins only):

1. `https://fonts.googleapis.com/css2?family=Merriweather` — loaded via
   `<link rel="stylesheet">`, no `integrity` attribute.
2. `https://fonts.gstatic.com/s/merriweather/v30/....woff2` — font file,
   no `integrity` attribute.
3. `https://cdn.ratemyrecipe-widget.example/widget.v3.js` — loaded via
   `<script src="...">`, no `integrity`/`crossorigin` attributes, but a
   versioned URL (`v3` pinned in the filename). Sends the visitor's page
   URL and a randomly-generated visitor ID (stored in a first-party
   cookie the widget itself sets) to
   `https://api.ratemyrecipe-widget.example/track` on every page load,
   including pages the visitor never rates anything on.
4. `https://static.adnetwork-unknown.example/pixel.gif?uid=...` — a 1x1
   tracking pixel, loading with a `uid` query parameter that matches the
   same visitor ID cookie set in #3. This domain does not appear anywhere
   in the site's own documentation, CMS embed list, or `_headers`/CSP
   configuration.

Site's current CSP (from `_headers`):

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.ratemyrecipe-widget.example; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.ratemyrecipe-widget.example
```

## Your Task

1. Classify each of the 4 observed origins: what it is, what it can
   plausibly access/collect, and whether it appears in the current CSP
   allowlist.
2. Check SRI status for each script/stylesheet origin, and note which
   missing-SRI cases are a real gap versus a known, accepted limitation
   (some origins can't support a static SRI hash — say which and why).
3. Identify any CSP drift: an origin loading that the CSP doesn't cover,
   or an allowlist entry unused by anything actually observed.
4. Flag the origin that has no explanation anywhere in the site's own
   configuration or documentation as the most serious finding, and
   explain what makes it different from the other three (which are all
   at least partially declared/expected).
5. Produce a severity-ranked findings report. Do not treat the two
   Google Fonts requests as equally severe as the undeclared ad-network
   pixel — they are a fundamentally different kind of finding.
