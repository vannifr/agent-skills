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
- **Target measured:** https://staging.example.com (or `localhost:4321` after `npm run build && npm run preview`)
- **Environment:** Lighthouse mobile preset, simulated throttling, Chrome 1xx
- **Runs per metric:** 3, median reported
```

A score without the commit, the URL and the throttling preset can't be
compared later — a recheck against a different preset measures the
preset, not the project.

## Table

Keep the columns and their order. The `ID` column is what a recheck
joins on; never renumber an existing ID, only append new ones.

| ID | Domain | Metric | Command / source | Current | Target | Status | Evidence |
|---|---|---|---|---|---|---|---|
| B-PERF-1 | Performance | Lighthouse Performance (mobile, median of 3) | `npx lighthouse <url> --preset=perf --output=json` | 62 | ≥90 | ⚠️ | `docs/audit/lh-home.json` |
| B-PERF-2 | Performance | LCP p75 (field) | `production-cwv-review` | 3.1 s | ≤2.5 s | ❌ | companion finding #1 |
| B-PERF-3 | Performance | Total JS transferred (home) | Lighthouse `total-byte-weight` | 410 KB | ≤300 KB | ⚠️ | same JSON |
| B-PERF-4 | Performance | INP p75 (field) | `production-cwv-review` | 180 ms | ≤200 ms | ✅ | |
| B-PERF-5 | Performance | CLS p75 (field) | `production-cwv-review` | 0.04 | ≤0.1 | ✅ | |
| B-A11Y-1 | Accessibility | axe violations (serious+critical), all pages | `npx axe <url> ...` | 7 | 0 | ❌ | `docs/audit/axe.json` |
| B-A11Y-2 | Accessibility | Lighthouse Accessibility | Lighthouse | 88 | ≥95 | ⚠️ | |
| B-SEO-1 | SEO | Lighthouse SEO | Lighthouse | 92 | ≥95 | ⚠️ | |
| B-SEO-2 | SEO | Broken internal links | `npx linkinator <url> --recurse` | 2 | 0 | ❌ | |
| B-SEC-1 | Security | Dependency vulns (high+critical) | `npm audit --audit-level=high` / `pip-audit` / `cargo audit` | 3 | 0 | ❌ | |
| B-SEC-2 | Security | Security headers grade | `curl -sI <url>` checked against the Security checklist | 3/7 headers | 7/7 | ⚠️ | |
| B-SEC-3 | Security | Third-party scripts without SRI | `third-party-script-audit` | 2 | 0 | ❌ | companion finding #2 |
| B-SEC-4 | Security | CSP drift (loaded origins not in CSP, or stale CSP entries) | `third-party-script-audit` | 1 | 0 | ⚠️ | |
| B-TEST-1 | Testing | Unit test pass rate | `npm test` | 100% | 100% | ✅ | |
| B-TEST-2 | Testing | Line coverage | `npm test -- --coverage` / `pytest --cov` | 41% | ≥80% | ⚠️ | |
| B-TEST-3 | Testing | Performance budget test | `load-test-bootstrap` | not run | p95 ≤ 500 ms @ 50 VU | ⏸️ | awaiting consent |
| B-TEST-4 | Testing | Engine-specific render defects | `cross-browser-render-check` | 1 | 0 | ⚠️ | |
| B-DS-1 | Design System | Layout breaks at 375/768/1440 | `responsive-visual-review` | 4 | 0 | ❌ | |
| B-CI-1 | CI/CD | Last 10 pipelines green | CI API/UI | 8/10 | 10/10 | ⚠️ | |
| B-BUILD-1 | Maintainability | Build succeeds, zero warnings | `npm run build` | 4 warnings | 0 | ⚠️ | |
| B-LINT-1 | Maintainability | Lint errors | `npm run lint` | 0 | 0 | ✅ | |
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
| ❌ | Misses target by more than that, or any Critical-class count > 0 (high+ vulns, serious+ axe violations, broken HTTPS) |
| ⏸️ | Not run — tool unavailable, companion missing, or needs consent (load test). State why in Evidence; it becomes an open action |
| ➖ | Deliberately skipped for this project, with the reason in Evidence (e.g. no public traffic, so no field data) |

"Not run" is never ✅. A missing measurement is recorded as ⏸️, not
guessed from the code.

## Default targets

Use these unless the project already states its own (a budget file, a
CI threshold, an SLA) — the project's own number always wins, and the
Target column records which one applied.

| Metric | Default target |
|---|---|
| Lighthouse Performance / Accessibility / SEO / Best Practices | ≥90 / ≥95 / ≥95 / ≥95 |
| LCP / INP / CLS (p75 field, or lab if no field data) | ≤2.5 s / ≤200 ms / ≤0.1 |
| axe serious+critical violations | 0 |
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
    { "id": "B-PERF-1", "metric": "Lighthouse Performance", "current": 62, "target": ">=90", "status": "warn" }
  ]
}
```

Status values in JSON: `pass`, `warn`, `fail`, `not_run`, `skipped`.
