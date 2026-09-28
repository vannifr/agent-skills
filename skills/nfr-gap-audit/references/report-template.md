# Audit Report Template

Copy this skeleton to `docs/skill-audit-report.md` (or the project's
equivalent) at the start of Phase 0 and fill each section as its phase
finishes. Keep the headings: a recheck reads "Baseline Scores", "GAP
Analysis" and "Open Actions" by name.

```markdown
# Skill & NFR Audit — <project>

## 1. Executive Summary
- **Mode:** full audit | recheck (reason: ...)
- **Project type / stack / hosting / CI:** ...
- **Prerequisites missing:** ... (each also under Open Actions)
- **Companion skills used:** <name> (<n> findings), ...
- **Review:** GAP list reviewed by <reviewer> | cold-read fallback
- **Overall:** <n> Critical, <n> High, <n> Medium, <n> Low; <n> fixed and verified live

## 2. Installed Skills
| Skill | Source | Relevance | Before/After | Reviewed |
|---|---|---|---|---|

## 3. Baseline Scores
<header block + ID'd table, see baseline-template.md>

## 4. GAP Analysis
### <Domain>
| Checklist item | Answer | Evidence |
|---|---|---|
| <item from gap-checklists.md> | ✅ / ❌ → G-<DOM>-<n> / n.a. | <baseline ID, file:line, companion finding> |

| GAP | Severity | Finding | Fix (with code example) | Privacy/legal |
|---|---|---|---|---|

(one block per relevant domain; domains marked ❌ for this project type
are listed once as "not relevant: <reason>")

## 5. Improvement Plan
| Order | GAP | Severity | Domain | Action |
|---|---|---|---|---|

## 6. Implementation Results
| GAP | Commit | CI (this commit) | Live check (URL: observed) | Baseline row before → after | Status |
|---|---|---|---|---|---|
Status is "done" only when CI is green and the live check passed;
otherwise "not verified: <missing step>".

## 7. Retrospectives
<one per phase, template in improvement-plan-template.md>

## 8. Open Actions
- Every ⏸️ baseline row, with what's missing
- GAPs awaiting stakeholder sign-off
- Unreachable discovery sources
- Links to later recheck reports

## 9. Recommendations
```
