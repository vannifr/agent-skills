# Companion Skills (optional)

A small set of sibling skills that turn a few checklist items this
skill can only flag ("cross-browser tests?", "responsive design
tested?") into measured baseline rows. They are not part of the Phase 1
discovery search — decide on them in Phase 0. Treat them like any
Phase 1 source: not installed or not reachable → open action, never a
blocker.

Source: `github:vannifr/agent-skills`; install with
`tessl install vannifr/<name>` where published, otherwise from a clone
of that repository.

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

## Execution guide

Companions don't produce separate reports; they feed the same baseline,
GAP list and plan as the rest of the audit.

**Phase 0 — decide and prepare.** Confirm which companions are
installed (missing = open action, not a blocker), and drop the ones
whose precondition below fails, the same way you skip a ❌ domain.
Collect their shared inputs once, so findings line up across
companions: target URL (staging/preview, or a local production build
for render checks), a 3-5 page sample (home, one detail page, one form
page, one long-form page), and the locales the site ships. Ask the
load-test consent questions now, so the answer is in by Phase 2.

**Phase 2 — run them, in this order** (read-only first, the one that
needs consent last, so a blocked companion never holds up the others):

| # | Companion | Precondition (else ⏸️/➖) | Fills baseline rows |
|---|---|---|---|
| 1 | `third-party-script-audit` | Site loads ≥1 external script/embed | `B-SEC-3` (no SRI), `B-SEC-4` (CSP drift) |
| 2 | `responsive-visual-review` | Browser automation available | `B-DS-1` (layout breaks) |
| 3 | `cross-browser-render-check` | As #2, plus Firefox/WebKit engines; skip on low-traffic brochure sites | `B-TEST-4` (engine-specific defects) |
| 4 | `translation-quality-review` | ≥2 locales AND `B-I18N-1` (key parity) is ✅ | `B-I18N-2` (translation defects) |
| 5 | `production-cwv-review` | CrUX data for the origin, or an existing RUM tool | `B-PERF-2`/`-4`/`-5` (LCP/INP/CLS p75 field) |
| 6 | `load-test-bootstrap` | User answered its four scope-and-consent questions | `B-TEST-3` (performance budget test) |

No consent answer by the time #6 is up → `B-TEST-3` is ⏸️ "awaiting
consent". A companion that fails midway: keep what it produced, mark
its remaining rows ⏸️ with the error, continue with the next one.

**Phase 3 — cite, don't guess.** A checklist item a companion covered
is answered from its output ("SRI missing on `cdn.widget.example/v3.js`
— third-party-script-audit #2"), tagged `source: <companion>`, with the
companion's severity unless the [severity mapping](gap-checklists.md#mapping-tool-severities-to-gap-severity)
says otherwise. Link the companion's own report
(`docs/audit/<companion>.md`) instead of copying it.

**Phase 4-6 — no special treatment.** Companion GAPs go through the
same severity ordering as checklist GAPs; there is no separate
"companion" section in the plan. The final report adds one line under
Executive Summary listing which companions ran and how many findings
each contributed.
