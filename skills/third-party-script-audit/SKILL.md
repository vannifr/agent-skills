---
name: third-party-script-audit
description: Use when auditing third-party scripts, resources (analytics, fonts, chat widgets), and their data access — checking SRI coverage, CSP allowlist alignment, and vendor data leakage risks. NOT a full penetration test or server-side dependency-vulnerability scan, NOT a standalone GDPR/consent-banner completeness check.
---

# Third-Party Script Audit

Every third-party `<script>`, font, widget, or embed is a data-access
grant to a vendor and a supply-chain dependency the site doesn't control.
This skill inventories what's actually loaded, checks it against what's
declared (CSP), and flags what's missing the one mitigation available for
mutable third-party code (SRI).

Works on any website — the audit is entirely observational (network
requests + response headers), no special access needed.

## When not to use this

- **Server-side dependency vulnerabilities** (npm/pip packages) → `npm
  audit`, `pip-audit`, or a dedicated security-baseline skill. This skill
  only looks at what a browser actually fetches from third-party origins.
- **Full penetration testing** → out of scope entirely; this is a
  factual inventory, not an attack simulation.
- **Deciding whether the site's data collection is GDPR-compliant** →
  pair with `gdpr-test-patterns` or route to the person responsible for
  that legal judgment. This skill answers "what is actually being sent
  where", not "is that lawful".

## Phase 0 — Inventory

For each sampled page (reuse the page set from `responsive-visual-review`
if a recent run exists), capture every network request the page makes
while loading and interacting normally:
- Playwright MCP `browser_network_requests`, or `page.on('request')` in a
  short script if no MCP tool is available.
- List every request whose origin is NOT the site's own domain or its own
  CDN/asset host.

## Phase 1 — Classify

For each distinct third-party origin found:
- **What is it** — analytics, web font, chat/support widget, ad network,
  payment/consent widget (e.g. Turnstile), CDN-hosted library, embedded
  media (YouTube, Vimeo)?
- **What can it plausibly collect** — does it set cookies, use
  fingerprinting-capable APIs, receive PII in URL query params or POST
  bodies (check what data the page actually sends it, not just that it's
  loaded)?
- **Is it already declared** — cross-check against the site's CSP
  allowlist (`_headers`, meta CSP tag, or server-set header) if one
  exists. An origin loading without being in the allowlist either means
  the CSP is misconfigured (too permissive, e.g. a wildcard) or the
  browser should be blocking it — check which.

## Phase 2 — SRI check

For every `<script>`/`<link>` served from a third-party origin at a
static, versioned URL, check for `integrity` + `crossorigin` attributes.
- Flag any missing SRI on a script the vendor supports SRI for (most
  CDN-hosted libraries with pinned versions do).
- Note, don't flag, the known legitimate exceptions: some vendors (Google
  Fonts CSS endpoint, most analytics beacons, most chat-widget loaders)
  serve dynamic/personalized responses that can't have a static SRI hash
  — that's an accepted limitation, not a finding.

## Phase 3 — CSP drift check

If the site has a CSP, diff the allowlist against what Phase 0 actually
observed:
- **Under-permissive** (missing entries): would break in a stricter
  browser or a future CSP tightening — though if the resource loads fine
  today, this usually means the CSP is more permissive elsewhere
  (`unsafe-inline`, a broad `https:` source) than it looks.
- **Over-permissive** (stale entries): origins allowlisted but no longer
  actually loaded anywhere in the sampled pages — safe to remove, reduces
  attack surface.

## Phase 4 — Findings

| Severity | Examples |
|----------|----------|
| Critical | PII sent to an undisclosed third party, or a CSP wildcard/`unsafe-eval` allowing arbitrary script origins |
| High | Missing SRI on a mutable, vendor-SRI-supported third-party script |
| Medium | CSP allowlist drift (stale entries, or an origin loading outside the declared allowlist) |
| Low | A legitimate, documented SRI exception worth noting for future reference (not a real gap) |

Report the full origin inventory alongside the findings — even entries
with no issue are useful groundwork for the next audit and for whoever
owns the GDPR/consent review.
