# Recheck Mode — the lightweight recurring audit

A recheck answers one question: **what changed since the last full
audit?** It reuses the prior report's baseline and GAP list instead of
rebuilding them, so it fits a pre-deploy, weekly or monthly slot.

## When a recheck is allowed

Run a recheck only if **all** of these hold; otherwise run the full
audit:

- A prior report exists (`docs/skill-audit-report.md` or equivalent)
  with a "Baseline Scores" table in the
  [baseline template](baseline-template.md) shape — IDs included.
  An older report without IDs: keep its GAP labels (P1, S1, ...) as the
  GAP IDs, assign `B-<DOMAIN>-n` IDs to the baseline rows only, and note
  for each prior GAP which baseline row measures it (or "not
  measurable") — then recheck.
- The project type and framework are unchanged (no SPA→SSR move, no new
  backend, no new locale).
- No major-version upgrade of the framework or build tool since the
  prior audit.
- The prior audit is less than 6 months old.

Check the stack quickly against the prior report's Executive Summary
(read the dependency manifest and `git log --since=<prior date>
--stat -- <dependency manifest>` or the lockfile). If any condition
fails, say which one and switch to the full audit.

## Steps

1. **Load the prior state.** Read the prior report's Baseline Scores,
   GAP Analysis and Open Actions sections (or the JSON twin in
   `docs/audit/`). Note its date and commit.
2. **Scope by change.** List files changed since the prior commit
   (`git diff --stat <prior-commit>..HEAD`). Map them to domains:
   templates/components → Accessibility, SEO, Performance; dependency
   manifests → Security; CI files → CI/CD; locale files → i18n. Every
   domain is re-measured in step 3, but only the touched domains get
   the full checklist walk in step 4.
3. **Re-measure every baseline row** by running the project's baseline
   script from the prior audit (if there is none, write it now from the
   prior report's Command column), with the same target and environment
   recorded in the prior header block. Same preset, same
   URL, same number of runs — otherwise the delta is noise. A row whose
   tool is now unavailable becomes ⏸️, not a copy of the old value.
4. **Re-walk the GAP checklist** from [gap-checklists.md](gap-checklists.md)
   for the touched domains only. For untouched domains, only re-verify
   the open GAPs from the prior report (fixed or still open?).
5. **Classify every GAP** into exactly one bucket:
   - **Fixed** — was open, now passes
   - **Still open** — unchanged (keep its original severity and ID)
   - **Regressed** — was fixed or passing, now fails again
   - **New** — not in the prior report

   A GAP that improved without closing (3/7 → 5/7 headers) stays
   **Still open**, with "partially fixed: <what changed>" in its note;
   its baseline row shows the Δ.
6. **Report deltas** (template below). Regressions and new
   Critical/High GAPs go to the top, regardless of domain.

Skipped in a recheck: Phase 0 discovery beyond the stack check, Phase 1
skill discovery/installation, and Phase 4/5 unless there are new or
regressed Critical/High GAPs — those go straight into the Phase 4
ordering and the Phase 5 loop like any GAP.

## Regression rule

A baseline row that moves from ✅ to ⚠️/❌, or from ⚠️ to ❌, is a
**regression** and is reported as at least High severity, even if the
underlying GAP was Medium on first discovery — something that used to
work broke, which usually means a missing test or CI gate. Record the
likely cause (the commit range from step 2) and add "add a CI gate for
this metric" to the fix. Before recording one, rule out a change in how
the row is measured — see
[Measurement sanity](baseline-template.md#measurement-sanity).

## Watch list: passing but trending toward failure

A row can stay ✅ while its headroom disappears (JS 120 KB → 265 KB
against a 300 KB budget). Put a row on the **watch list** — not the GAP
list — when it still passes but has used more than 80% of its budget,
or has moved more than half the remaining distance to its threshold
since the prior run. A watch item carries no severity; it names the
likely cause and the next measurement. It becomes a GAP (and a
regression) only when the row actually fails.

## Delta report template

Write to `docs/audit/recheck-YYYY-MM-DD.md` and link it from the main
report's Open Actions — don't overwrite the full report.

```markdown
# NFR recheck — 2026-09-27

- **Compared to:** full audit of 2026-06-14 (commit `abc1234`)
- **Now:** commit `def5678`, 47 commits, 112 files changed
- **Touched domains:** Performance, Security, Accessibility
- **Verdict:** 1 regression, 2 new GAPs (1 High), 3 fixed, 5 still open, 1 on watch

## Regressions
| ID | Metric | Before | Now | Likely cause |
|---|---|---|---|---|
| B-A11Y-1 | Automated accessibility scan serious+critical | 0 ✅ | 3 ❌ | new `Modal` component, commits `e1f..9a2` |

## Watch list
| ID | Metric | Before | Now | Target | Why watch |
|---|---|---|---|---|---|
| B-PERF-3 | Total JS (home) | 120 KB | 265 KB | ≤300 KB | 88% of budget; a new third-party search script |

## Baseline delta
| ID | Metric | Before | Now | Δ | Status |
|---|---|---|---|---|---|
| B-PERF-1 | Lab performance score | 62 | 81 | +19 | ⚠️ |
| B-SEC-1 | Dependency vulns high+ | 3 | 0 | −3 | ✅ |

## GAPs
| GAP | Severity | Bucket | Note |
|---|---|---|---|
| G-SEC-2 CSP unsafe-inline | High | Still open | |
| G-A11Y-4 Modal focus trap missing | High | New | fix: `inert` on background, return focus on close |
| G-PERF-1 Images not lazy-loaded | Medium | Fixed | |

## Next actions
1. ...
```

## Cadence guide

| Trigger | Scope |
|---|---|
| Pre-deploy of a large release | Recheck, touched domains only |
| Weekly/monthly | Recheck, all baseline rows |
| Every 6 months, stack change, or new project type | Full audit |
