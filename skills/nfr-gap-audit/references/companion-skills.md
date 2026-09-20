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
