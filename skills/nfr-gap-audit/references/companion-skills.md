# Companion Skills (optional, install separately if not already available)

These are not part of the Tessl or VoltAgent discovery sources in Phase 1
— they won't show up in a `tessl_search` or the VoltAgent README grep,
because they're a personal skill set, not (yet, for all of them) on the
public registry. They exist to cover a few things this skill's own
checklists can flag as a gap but can't quantitatively verify on their
own. Treat this list the same way as any Phase 1 source: if a skill
here isn't installed and can't be reached, note it as an open action and
continue — never block the audit on it.

Source: `github:vannifr/agent-skills` (`tessl install vannifr/<name>`
for the ones already published, or symlink from a local clone
otherwise).

| Skill | Use when | Feeds into |
|---|---|---|
| `responsive-visual-review` | The project is a live/local website with layout to check across breakpoints | Design System GAP (responsive design tested?) |
| `cross-browser-render-check` | Same, and the project has enough traffic/complexity that engine-specific rendering bugs are a real risk | Design System GAP, Testing GAP (cross-browser tests?) |
| `production-cwv-review` | The project type has Performance marked ✅/⚠️ in [project-type-reference.md](project-type-reference.md) AND has real traffic (CrUX-eligible) or an existing RUM/analytics tool | Performance GAP — cross-checks the Phase 2 Lighthouse baseline against real-user field data |
| `load-test-bootstrap` | Testing GAP flags "performance budget tests" as unverified, and the project has a backend/API surface worth exercising under concurrency | Testing GAP |
| `third-party-script-audit` | The project loads any third-party script/embed (analytics, fonts, widgets, ads) | Security GAP (SRI, CSP allowlist), and supplies factual input to a Privacy/GDPR review |
| `translation-quality-review` | Internationalization is marked ✅/⚠️ in project-type-reference.md AND the project already has automated key-parity checks passing | Internationalization GAP — goes beyond key-parity to actual translation quality |

None of these are required for a complete audit — they exist because a
checklist item like "cross-browser tests?" or "responsive design
tested?" is otherwise answered by a yes/no guess rather than an actual
review. If none are installed, the audit still runs correctly using only
Phase 1's Tessl/VoltAgent discovery and the checklist-based Phase 3
GAP analysis.

## Unified workflow — running all 7 as one audit

Don't run the companions as 7 separate, disconnected reports. Fold them
into the same phases and the same final report `nfr-gap-audit` already
produces:

**0. Availability check** — before starting, confirm which companions are
actually installed (e.g. `opencode debug skill` / the Claude Code skill
listing). Missing ones are an open action, not a blocker — proceed with
whichever are available.

**1. Phase 0 (project discovery) decides which companions even apply** —
cross-reference the project type against [project-type-reference.md](project-type-reference.md)'s
✅/⚠️/❌ table and this file's "Use when" column *before* Phase 2 starts.
Skip a companion the same way you'd skip a ❌ domain — don't run
`translation-quality-review` on a single-language site, don't run
`production-cwv-review` on a project with no public traffic.

**2. Phase 1 (Tessl/VoltAgent discovery)** runs unchanged — companions
aren't part of that search, they were already decided in step 1.

**3. Phase 2 (baseline measurement) is where companions actually run** —
alongside Lighthouse/tests/etc., invoke each relevant companion and treat
its output as additional baseline rows, not a separate document:
- `production-cwv-review` → add its field-vs-lab p75 table as extra
  Performance baseline rows.
- `load-test-bootstrap` → run it (its own mandatory scope-and-consent
  step still applies) and record the result as the Testing baseline's
  "performance budget test" row — this is usually the only way that row
  is ever anything but "not run".
- `responsive-visual-review` / `cross-browser-render-check` → record
  findings as Design System / Testing baseline evidence.
- `third-party-script-audit` → record findings as Security baseline
  evidence (SRI/CSP status becomes a fact, not a guess).
- `translation-quality-review` → record findings as Internationalization
  baseline evidence (only after confirming key-parity is already green,
  per that skill's own precondition).

**4. Phase 3 (GAP analysis) cites companion findings directly** — a
checklist item a companion covered gets answered from its actual output
("SRI missing on `cdn.widget.example/v3.js` — see third-party-script-audit
finding #2"), not "unclear" or a guess. Tag each such GAP entry with its
source skill for traceability.

**5. Phase 4 (improvement plan) merges everything into one list** —
companion-sourced GAPs go through the exact same severity ordering
(Critical > High > Medium > Low, then domain tie-break) as checklist-
sourced ones. There is no separate "companion skills" section in the
plan — a Critical finding from `third-party-script-audit` outranks a
Medium finding from the Performance checklist regardless of which skill
found it.

**6. Phase 5 (implementation) and Phase 6 (retrospective, Output)** run
unchanged. The final `docs/skill-audit-report.md` gets one addition: a
short "Companion skills used" line under Executive Summary listing which
ran and how many findings each contributed — so a reader can tell this
was an enriched run, not a checklist-only one, without digging through
the whole report.

## Execution guide

Per companion: what it needs before it can start, in which order to run
them, and exactly which [baseline](baseline-template.md) rows and GAP
domains its output fills. Run them in the order below — cheap,
read-only checks first, the one that needs consent last — so a blocked
companion never holds up the others.

### Shared inputs (collect once, in Phase 0)

- **Target URL** — staging/preview preferred; a local build
  (`npm run build && npm run preview` or equivalent) for render checks.
- **Page sample** — 3-5 URLs: home, one detail page, one form page, one
  long-form page. Every companion that takes pages uses this same
  sample, so findings line up across companions.
- **Locales** — which ones the site ships.

Hand these to each companion instead of letting each re-derive its own
scope; that is what makes the output one audit, not six.

### Order and mapping

| # | Companion | Precondition (else ⏸️/➖ in baseline) | Input from the audit | Writes baseline rows | Typical effort |
|---|---|---|---|---|---|
| 1 | `third-party-script-audit` | Site loads ≥1 external script/embed | Target URL, page sample, current CSP header (from `curl -sI`) | `B-SEC-3` (scripts without SRI), plus `B-SEC-4` CSP drift count | ~10 min, read-only |
| 2 | `responsive-visual-review` | Browser automation available (Playwright or equivalent) | Page sample, project's CSS breakpoints if defined | `B-DS-1` layout breaks (count at 375/768/1440) | ~15 min |
| 3 | `cross-browser-render-check` | Same as #2, plus Firefox/WebKit engines installable; skip on low-traffic brochure sites | Same page sample; reuse #2's screenshots as the Chromium reference | `B-TEST-4` engine-specific render defects | ~15 min |
| 4 | `translation-quality-review` | ≥2 locales AND `B-I18N-1` (key parity) is ✅ | Locales, page sample, style guide if present | `B-I18N-2` translation defects (count, by severity) | ~10 min per locale |
| 5 | `production-cwv-review` | Public traffic: CrUX data for the origin, or an existing RUM tool | Origin + page sample; the Phase 2 Lighthouse JSON for the lab side | `B-PERF-2`/`-4`/`-5` (LCP/INP/CLS p75 field) | ~10 min; needs a CrUX API key or the PageSpeed Insights UI |
| 6 | `load-test-bootstrap` | User has answered its four scope-and-consent questions (target, environment, intensity, timing) | 2-5 critical endpoints, staging URL | `B-TEST-3` performance budget test (p95 latency, error rate at N VUs) | ~20 min + consent round-trip |

Ask the load-test consent questions early (in Phase 0), so the answer
is in by the time companion #6 runs; if there is no answer by then,
record `B-TEST-3` as ⏸️ "awaiting consent" and move on.

### Turning companion output into audit entries

For each finding a companion returns:

1. **Count it into its baseline row** (table above). The row's Evidence
   column cites the companion and finding number:
   `third-party-script-audit #2`.
2. **Create or enrich a GAP** in the mapped domain, keeping the
   companion's severity unless the cold-read anchors in
   [review-fallback.md](review-fallback.md#cold-read-pass-gap-list-self-review)
   say otherwise. Tag it `source: <companion>`.
3. **Don't copy the companion's own report into the audit report.**
   Link to it (e.g. `docs/audit/third-party-scripts.md`) and keep only
   the rows and GAPs in the main report.

### When a companion fails midway

Record what it did produce, mark its remaining rows ⏸️ with the error in
Evidence, and continue with the next companion. A partial companion
result still beats a guessed checklist answer; a crashed one is an open
action, not a reason to restart Phase 2.
