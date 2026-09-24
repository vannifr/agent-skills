---
name: production-cwv-review
description: Use when comparing real-user field performance data (CrUX/RUM) against lab Lighthouse data to find divergences where pages score well in the lab but are slow for real users. NOT a replacement for the Lighthouse/lab baseline, NOT for setting up RUM/analytics from scratch, NOT for synthetic load/stress testing.
---

# Production Core Web Vitals Review

Lighthouse measures one page load, once, under fixed lab conditions. Real
users load the same page on a huge range of devices, networks, and cache
states. This skill closes that gap: pull real-user field data and compare
it against the lab numbers to find pages that look fine in a lab report
but are actually slow (or vice versa) for real visitors.

Works on any public site — CrUX needs no setup, just enough real traffic
for Google to have collected a stable sample for that origin/URL.

## When not to use this

- **No lab baseline exists yet** → run the Lighthouse pass first (this
  project's own baseline step, or `npx lighthouse`/`lhci autorun`); this
  skill needs something to compare field data against.
- **Setting up RUM/analytics that doesn't exist yet** → that's
  implementation work, not an audit. Report "no field data available" as
  the finding and stop there.
- **Synthetic load testing** (how does the site behave under N concurrent
  users) → `load-test-bootstrap`. CrUX/RUM data is about real historical
  traffic, not a controlled stress scenario.

## Phase 0 — Data source discovery

1. Check whether the site has enough traffic for CrUX: query the public
   Chrome UX Report API
   (`https://chromeuxreport.googleapis.com/v1/records:queryRecord`,
   free, needs only a Google API key — ask the user if they have one
   configured, or use the PageSpeed Insights UI as a manual fallback,
   which surfaces the same CrUX data without a key) for the site's origin
   and up to 5 key URLs.
2. In parallel, check whether the project already has its own RUM/field
   data: a GA4 property with the Web Vitals event, a Cloudflare Web
   Analytics Core Web Vitals panel, Sentry Performance, Datadog RUM, or
   similar — read the project's own docs (AGENTS.md/README/analytics
   setup notes) before assuming nothing exists.
3. If neither source has usable data (too little traffic for CrUX, no RUM
   tool installed) — that absence IS the Phase 3 finding. Stop here
   rather than fabricating a comparison.

## Phase 1 — Compare

For each URL with field data available, pull the p75 values for LCP, INP,
and CLS (CrUX and most RUM tools report p75, matching Google's own "Good"
threshold methodology) and line them up against the lab Lighthouse values
for the same URL.

| URL | Metric | Lab (Lighthouse) | Field p75 | Threshold | Status |
|-----|--------|-------------------|-----------|-----------|--------|
| ... | LCP | ... | ... | <2.5s | ✅/⚠️/❌ |
| ... | INP | ... | ... | <200ms | ✅/⚠️/❌ |
| ... | CLS | ... | ... | <0.1 | ✅/⚠️/❌ |

## Phase 2 — Diagnose divergence

If field is meaningfully worse than lab, the usual causes, roughly in
order of likelihood:
- **Device/network mix**: lab uses one fixed throttling profile; real
  users include low-end devices and slow/lossy mobile networks the lab
  profile doesn't represent.
- **Third-party scripts**: lab runs can execute a clean, warm-cache run;
  real users hit cold caches and slow-loading third-party origins (ties
  into `third-party-script-audit` if this looks like the cause).
- **CDN edge cache misses / geographic latency**: field data blends every
  visitor's actual edge location; lab always tests from one location.
- **INP specifically**: lab tools often approximate or don't fully
  capture real interaction responsiveness under real usage patterns
  (scrolling while a heavy script runs, rapid taps) — a real INP problem
  can be invisible in a lab run entirely.

If field is *better* than lab, note it and move on — don't manufacture a
fix for a lab-only artifact nobody actually experiences.

## Phase 3 — Findings

One row per URL/metric combination that fails its field threshold, with
the suspected cause from Phase 2 and a link back to the raw comparison
table. If no field data exists at all, that gap itself is the sole
finding — say so plainly rather than silently skipping the review.
