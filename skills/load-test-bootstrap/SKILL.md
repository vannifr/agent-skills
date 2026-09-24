---
name: load-test-bootstrap
description: Use when load-testing a site's or API's critical endpoints — the "performance budget test" NFR checklists ask for but a Lighthouse-only audit never exercises, since Lighthouse simulates exactly one user. Works on any HTTP-reachable site or API (k6 by default, Artillery as alternative). Trigger on "load test this", "how does this hold up under traffic", "stress test the API", "set up performance budget tests", or when an NFR audit flags load-testing as unverified. NOT for browser-rendering performance (use nfr-gap-audit's baseline or production-cwv-review). NOT against production without explicit, scoped authorization — real load has real cost and risk; always confirm target, intensity, and time window first, and prefer staging when available.
---

# Load Test Bootstrap

Most NFR audits ask "is there a performance budget test?" and then move
on without one existing. This skill actually builds and runs a small,
bounded load test — the thing that would catch a database connection pool
exhausting at 50 concurrent users, or a serverless function's cold-start
tax showing up only under real concurrency, neither of which Lighthouse
can ever find (it tests one page load, alone, once).

Works against any HTTP target: a static site's CDN edge, a backend API,
a serverless function endpoint — k6 and Artillery are both just HTTP load
generators underneath.

## When not to use this

- **Single-user page-load performance** (LCP, TBT, bundle size) →
  Lighthouse / `nfr-gap-audit`'s baseline, or `production-cwv-review` for
  real-world field data. This skill measures throughput and latency under
  concurrency, not single-load render performance.
- **Production, without the user's explicit go-ahead on target and
  intensity** — never assume authorization. Real load against a live site
  is not a read-only audit action; treat it with the same care as any
  other action with real external effect.
- **A one-off "is the site up" check** → that's a health check, not a
  load test; way overkill for the question being asked.

## Phase 0 — Scope & consent (never skip)

Before writing or running anything, confirm explicitly with the user:
1. **Target**: which 2-5 endpoints (homepage, one form POST, one API
   route) — critical paths, not everything.
2. **Environment**: staging/preview URL strongly preferred; production
   only with explicit, informed agreement to a bounded intensity.
3. **Intensity**: a conservative default proposal — e.g. ramp 0→20
   virtual users over 30s, hold 1 minute, ramp down over 15s — and let
   the user raise or lower it. Never default to an aggressive profile
   against a target you don't control the infrastructure cost of.
4. **Timing**: avoid peak traffic hours if testing production; ask if
   there's a known low-traffic window.

If the user hasn't given clear, specific answers to all four, stop and
ask — this is the one phase in this skill (and arguably in this whole
audit family) where proceeding on an assumption is a real-world mistake,
not just a wasted review cycle.

## Phase 1 — Scaffold

Write a k6 script (`load-test.js`, saved locally — not committed unless
the user wants it kept as a repeatable asset) with:
- The agreed ramp profile (`stages` in k6's `options`)
- One scenario per agreed endpoint
- Thresholds that make the run pass/fail objectively:
  `http_req_duration: ['p(95)<800']`, `http_req_failed: ['rate<0.01']`
  (adjust the numbers to the site's own stated performance targets if it
  has any, e.g. this project's Lighthouse `total-blocking-time` budget)

Artillery is a reasonable alternative if the project already uses it or
the user prefers YAML config over k6's JS.

## Phase 2 — Run

Execute against the agreed target at the agreed intensity.
- If k6/Artillery isn't installed locally, ask before installing (per the
  project's own "ask before installing tools" convention) — a Docker
  fallback (`docker run --rm -i grafana/k6 run - <load-test.js`) avoids a
  local install entirely if Docker is already available.
- Watch the run live if possible; abort immediately if error rates spike
  well beyond the threshold or the target shows signs of real distress
  (this is production-adjacent risk management, not just test hygiene).

## Phase 3 — Findings

Report per endpoint: p50/p95/p99 latency, error rate, and — if the ramp
was steep enough to find it — the approximate VU count where the target
started degrading (rising error rate or latency knee). Compare against
the thresholds set in Phase 1 and call out any that failed.

Do not extrapolate beyond what was actually run — "held up fine to 20 VUs
over 1 minute" is the honest scope of the finding, not "the site can
handle production traffic."
