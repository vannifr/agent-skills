# Phase 2 — Standardized Baseline Template

One fixed shape for every baseline, so a later recheck can diff it row by
row instead of re-reading prose. Copy the table below into the report's
"Baseline Scores" section and fill it; delete rows for domains marked ❌
in [project-type-reference.md](project-type-reference.md) — don't leave
them as "n/a" noise.

## Header block

Record this above the table, every time:

```markdown
- **Measured on:** 2026-09-27 (commit `abc1234`)
- **Target measured:** https://staging.example.com (or a local URL, e.g. `localhost:4321`, serving a production build)
- **Environment:** lab audit tool mobile preset (e.g. Lighthouse), simulated throttling, browser engine + version
- **Runs per metric:** 3, median reported
```

A score without the commit, the URL and the throttling preset can't be
compared later — a recheck against a different preset measures the
preset, not the project.

## Measurement conditions for timing rows

Timing metrics (LCP, load time) move with how they're measured, so record
the conditions next to the number:

- **Simulated vs real throttling.** A lab tool's simulated timing can be
  several times off a throttled real-browser run of the same page. For a
  timing row record both; a large gap is itself a finding — trace it
  (e.g. many parallel downloads, a big non-critical payload) before
  trusting either value.
- **One measurement per URL.** A hosted measurement service may cache by
  URL: give every run a unique query string, or three "runs" are one.
- **Cold caches after a deploy.** The first minutes after a deploy run
  slower (cold edge cache). Re-measure a few minutes later before
  recording.
- **Record what, not only how long.** For LCP also record the LCP element
  and its phase breakdown (e.g. load delay vs render delay): the element
  and the phase say what to fix, the number only says it is slow.

## Table

Keep the columns and their order. The `ID` column is what a recheck
joins on; never renumber an existing ID, only append new ones.

| ID | Domain | Metric | Command / source | Current | Target | Status | Evidence |
|---|---|---|---|---|---|---|---|
| B-PERF-1 | Performance | Lab performance score (mobile, median of 3) | lab performance audit | 62 | ≥90 | ⚠️ | `docs/audit/perf-home.json` |
| B-PERF-2 | Performance | LCP p75 (field) | `production-cwv-review` | 3.1 s | ≤2.5 s | ❌ | companion finding #1 |
| B-PERF-3 | Performance | Total JS transferred (home) | same lab audit, byte-weight metric | 410 KB | ≤300 KB | ⚠️ | same JSON |
| B-PERF-4 | Performance | INP p75 (field) | `production-cwv-review` | 180 ms | ≤200 ms | ✅ | |
| B-PERF-5 | Performance | CLS p75 (field) | `production-cwv-review` | 0.04 | ≤0.1 | ✅ | |
| B-PERF-6 | Performance | First-view transfer by origin (first- vs third-party), home | same lab audit, network-request summary | 1.6 MB, of which 1.4 MB third-party | project budget; 0 KB from widgets needed only below the fold | ❌ | request list in `docs/audit/perf-home.json` |
| B-A11Y-1 | Accessibility | Automated accessibility scan (e.g. axe) violations (serious+critical), all pages | automated accessibility scan | 7 | 0 | ❌ | `docs/audit/a11y-scan.json` |
| B-A11Y-2 | Accessibility | Lab accessibility score | same lab audit | 88 | ≥95 | ⚠️ | |
| B-SEO-1 | SEO | Lab SEO score | same lab audit | 92 | ≥95 | ⚠️ | |
| B-SEO-2 | SEO | Broken internal links | a link checker (e.g. linkinator) | 2 | 0 | ❌ | |
| B-SEC-1 | Security | Dependency vulns (high+critical) | the project's dependency audit | 3 | 0 | ❌ | |
| B-SEC-2 | Security | Security headers grade | HTTP header check against the Security checklist | 3/7 headers | 7/7 | ⚠️ | |
| B-SEC-3 | Security | Third-party scripts without SRI | `third-party-script-audit` | 2 | 0 | ❌ | companion finding #2 |
| B-SEC-4 | Security | CSP drift (loaded origins not in CSP, or stale CSP entries) | `third-party-script-audit` | 1 | 0 | ⚠️ | |
| B-TEST-1 | Testing | Unit test pass rate | the project's test command | 100% | 100% | ✅ | |
| B-TEST-2 | Testing | Line coverage | the project's test command with coverage | 41% | ≥80% | ⚠️ | |
| B-TEST-3 | Testing | Performance budget test | `load-test-bootstrap` | not run | p95 ≤ 500 ms @ 50 VU | ⏸️ | awaiting consent |
| B-TEST-4 | Testing | Engine-specific render defects | `cross-browser-render-check` | 1 | 0 | ⚠️ | |
| B-DS-1 | Design System | Layout breaks or overflow at 360/768/1440 | `responsive-visual-review` | 4 | 0 | ❌ | |
| B-CI-1 | CI/CD | Last 10 pipelines green | CI API/UI | 8/10 | 10/10 | ⚠️ | |
| B-BUILD-1 | Maintainability | Build succeeds, zero warnings | a production build | 4 warnings | 0 | ⚠️ | |
| B-LINT-1 | Maintainability | Lint errors | the project's lint command | 0 | 0 | ✅ | |
| B-I18N-1 | Internationalization | Missing translation keys | project's key-parity script | 0 | 0 | ✅ | |
| B-I18N-2 | Internationalization | Translation defects (major+) | `translation-quality-review` | 3 | 0 | ❌ | |

The rows above are the default set; add project-specific ones with the
next free number in their domain (`B-PERF-4`, ...).

## Status legend

Use exactly these five — a recheck counts them, so synonyms break the
count:

| Status | Meaning |
|---|---|
| ✅ | Meets target |
| ⚠️ | Misses target, within 25% of it (or a single step away on a count) |
| ❌ | Misses target by more than that, or any Critical-class count > 0 (high+ vulns, serious+ accessibility-scan violations, broken HTTPS) |
| ⏸️ | Not run — tool unavailable, companion missing, or needs consent (load test). State why in Evidence; it becomes an open action |
| ➖ | Deliberately skipped for this project, with the reason in Evidence (e.g. no public traffic, so no field data) |

**Count and fraction metrics** ("5/7 headers", "3 broken links"):
for a "N of M present" metric, ⚠️ means at least half of M present, ❌
less than half; for a count with target 0, ⚠️ means 1-2, ❌ means 3 or
more. The Critical-class rule above overrides both.

**Partial evidence**: if the collected output covers only part of a
metric (e.g. 6 of the 7 expected headers are named), record what was
measured, keep the status it supports, and add "partial: <what's
missing>" in Evidence. Don't guess the missing part.

**In a recheck, the prior report's status for a row wins** over a
re-derivation from this legend when the two disagree at the same value
— statuses have to stay comparable across runs. Note the disagreement
once and fix the legend or the row going forward.

"Not run" is never ✅. A missing measurement is recorded as ⏸️, not
guessed from the code.

## Measurement sanity

Before a number becomes a GAP, check that it measures the project and
not the measurement:

- **An order-of-magnitude jump against the prior run** (a duplicate-title
  count going from single digits to hundreds) is a measurement suspect
  first: trace it to its source before recording anything.
- **Scan tracked source only** — the files version control lists (e.g.
  `git ls-files`) — never build output, coverage or vendored
  directories; generated copies inflate counts.
- **A heuristic check is a hypothesis.** Before counting a pattern-based
  finding (a regex, a DOM heuristic), open 2-3 flagged instances and
  confirm they're real. Intentional cases — a deliberately eager-loaded
  hero image, an input wrapped by its own label — are exclusions, not
  GAPs.

## Default targets

Use these unless the project already states its own (a budget file, a
CI threshold, an SLA) — the project's own number always wins, and the
Target column records which one applied.

| Metric | Default target |
|---|---|
| Lab Performance / Accessibility / SEO / Best Practices score | ≥90 / ≥95 / ≥95 / ≥95 |
| LCP / INP / CLS (p75 field, or lab if no field data) | ≤2.5 s / ≤200 ms / ≤0.1 |
| Automated accessibility scan serious+critical violations | 0 |
| Dependency vulns high+critical | 0 |
| Line coverage | ≥80% (or the project's existing threshold) |
| Broken internal links | 0 |
| Build/lint warnings | 0 |

## Machine-readable twin (optional, recommended for recurring audits)

Also write the same rows to `docs/audit/baseline-YYYY-MM-DD.json` so a
recheck diffs data, not markdown:

```json
{
  "measured_on": "2026-09-27",
  "commit": "abc1234",
  "target": "https://staging.example.com",
  "rows": [
    { "id": "B-PERF-1", "metric": "Lab performance score", "current": 62, "target": ">=90", "status": "warn" }
  ]
}
```

Status values in JSON: `pass`, `warn`, `fail`, `not_run`, `skipped`.
