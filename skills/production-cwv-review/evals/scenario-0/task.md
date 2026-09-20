# Production vs Lab Performance Check for a Ticketing Platform

## Problem Description

A mid-sized event-ticketing company's engineering team just finished a
performance sprint on their public event-listing pages. Their Lighthouse
CI pipeline reports a Performance score of 94 for the three
highest-traffic URLs, and the team is ready to declare the sprint a
success and move on.

Before doing that, an engineer pulls up the site's CrUX dashboard (the
exact numbers are provided below) and notices something that doesn't sit
right: the real-user Core Web Vitals numbers don't match the confidence
the lab score suggests. Nobody has reconciled the two data sources yet.

The team wants an actual comparison, not just "trust the Lighthouse
number" or "trust the CrUX number" — they want to know exactly which
pages/metrics diverge, by how much, and a plausible, evidence-based
explanation for why lab and field disagree, before they decide whether
the sprint is actually done.

## Provided data (already collected, do not re-fetch)

Lighthouse lab results (most recent CI run, desktop preset):

| URL | LCP | INP | CLS |
|---|---|---|---|
| /events/summer-music-fest | 1.8s | (lab has no real interaction) | 0.02 |
| /events/tech-conf-2027 | 2.1s | (lab has no real interaction) | 0.03 |
| /events | 1.6s | (lab has no real interaction) | 0.01 |

CrUX field data (p75, last 28 days, mobile — the majority of this site's
real traffic):

| URL | LCP p75 | INP p75 | CLS p75 |
|---|---|---|---|
| /events/summer-music-fest | 4.1s | 340ms | 0.04 |
| /events/tech-conf-2027 | 3.9s | 310ms | 0.05 |
| /events | 2.0s | 180ms | 0.02 |

Additional context the team can share if asked: the Lighthouse CI runs on
a fixed "Fast 4G" desktop-preset throttling profile from a US-East data
center; roughly 70% of this site's real traffic is mobile, and about 40%
of sessions come from regions more than 3000km from the nearest CDN edge
with a cache-miss rate around 18% during peak event-announcement traffic
spikes. The listing pages embed a third-party ticket-availability widget
that lab runs load from a warm cache but that frequently cold-loads for
real first-time visitors.

## Your Task

1. Compare the lab and field data above per URL and per metric against
   the standard "Good" CWV thresholds (LCP < 2.5s, INP < 200ms,
   CLS < 0.1).
2. Identify which URL/metric combinations pass in the lab but fail in
   the field.
3. For each divergence, give a specific, evidence-grounded diagnosis of
   the likely cause — using the additional context provided, not a
   generic list of possible causes.
4. Produce a findings report structured with a comparison table and one
   specific, actionable recommendation per genuine divergence.
5. Do not fabricate additional field data beyond what's provided, and do
   not claim a page "passes" overall if any of its three metrics fails.
