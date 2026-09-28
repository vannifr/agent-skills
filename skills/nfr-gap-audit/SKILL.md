---
name: nfr-gap-audit
description: Use when running a systematic, self-directed skill-and-NFR audit on a website/web-app project, covering non-functional-requirement domains (performance, accessibility, security, SEO, testing, privacy, i18n, ...). Trigger on "skill audit", "NFR audit", "audit this project for skills/gaps", "what skills am I missing", or before starting a multi-phase quality-improvement effort on a site.
---

# NFR & Skill Gap Audit

A systematic, self-directed audit for any website/web-app project (static
site, SPA, SSR, backend API, mobile, library): which skills are missing,
which NFRs are relevant but uncovered, and how to fix that in small,
verified steps without breaking CI.

Works on any stack — the commands below are examples ("or equivalent"),
swap them for the project's actual package manager/tools.

## When not to use this

This is a **deliberate, periodic full audit**, not a replacement for a
reactive per-feature gap check. Many projects already have an active Tessl
chain (gap-analysis + skill-search + skill-classifier + self-review) that
triggers automatically on a new feature or 3+ new files — leave that
reactive flow alone and reach for this skill only for an explicit,
project-wide audit including NFR checklists and skill installation.

## Pick the mode first

| Mode | Use when | Runs |
|---|---|---|
| **Full audit** | First audit, stack or project type changed, major framework upgrade, or the last audit is 6+ months old | Phases 0-6 below |
| **Recheck** | A prior report with an ID'd baseline exists and none of the above applies | Re-measure baseline, re-walk touched domains, report fixed/still open/regressed/new — see [recheck-mode.md](references/recheck-mode.md) |

State the chosen mode and why in the first line of the report. When in
doubt, recheck-mode.md's entry conditions decide; a failed condition
means full audit.

## Definition of done

A change counts as done only when all of these are true and checked,
not assumed:

1. It is committed and pushed to the main line.
2. The CI pipeline **for that exact commit** has finished green. A
   failure is fixed before the next change; never make it green by
   skipping or disabling a test, lowering a threshold or removing a
   gate without explicit approval.
3. It is deployed, and the **live application** shows the fix: the
   GAP's metric re-measured on the live URL, the header or element
   present in the live response, the flow working end to end.
4. No baseline row got worse (Phase 5 step 4).

"Tests pass" or "pushed" is not done. When a step can't be completed —
no deploy access, a manual release, CI unreachable — report the change
as **not verified** with the reason and the missing step, never as done.
The report lists per change: commit, pipeline result, and the live
check (URL and what was observed).

## Phase 0 — Project discovery

1. **Determine the tech stack**: read the project's dependency
   manifest and the main documentation (`README.md`, the project's
   agent instruction files). Determine project type (static/SPA/SSR/backend/mobile/
   library), framework, language, hosting, CI/CD.
2. **Inventory current skills**: read `tessl.json` (or equivalent) and
   the project's local skill-install directory (e.g. `.agents/skills/`)
   — note which domains are already covered. An installed skill ≠
   correctly applied: Phase 3 tests the application, not just the
   installation.
3. **Identify relevant NFRs** — see [nfr-domains.md](references/nfr-domains.md)
   for the full list (performance, accessibility, security, SEO, testing,
   reliability, maintainability, scalability, privacy/compliance, i18n,
   monitoring, content quality) and
   [project-type-reference.md](references/project-type-reference.md) for
   which NFRs are critical/relevant/not-relevant per project type — that
   determines which domains you skip in Phase 2 and 3.
4. **Check prerequisites once**, before Phase 2: a lab performance/
   accessibility audit tool, an automated accessibility scanner, and a
   headless browser, extra browser engines if cross-browser checks
   apply, a coverage reporter, a reachable staging/preview URL, CI
   status access (CLI, API or MCP), and any login or API key a
   companion needs (a real-user field-data key, hosting/CDN CLI or
   MCP). Ask the user for everything missing in **one** message. What
   stays missing becomes ⏸️ baseline rows plus an open action; never
   create credentials yourself.

## Phase 1 — Skill discovery (dual-source)

Search **two** sources, classify results in a table (category / skill /
source / relevance High-Medium-Low / install command), and install
everything with relevance High and Medium (skip what's already installed):

- **Tessl registry**: a series of `tessl_search` queries across
  performance, a11y, SEO, testing, security, design system, CI, analytics,
  copywriting, CRO, GDPR, i18n, error tracking, visual regression — e.g.
  `tessl_search "accessibility WCAG"`, full query set in
  [skill-discovery-searches.md](references/skill-discovery-searches.md).
- **VoltAgent awesome-agent-skills**: fetch and grep
  `https://raw.githubusercontent.com/VoltAgent/awesome-agent-skills/main/README.md`
  for the same domain terms — the exact grep pattern is in the same
  reference file.

Three rules that always apply here:
- **Source unreachable** (no Tessl access, network/rate-limit on
  VoltAgent): skip that source, continue with the other, and note the
  missed domain as an open action in the final report — don't block the
  audit on it.
- **Credit-aware**: `tessl_search`/`tessl_install` and any
  `tessl review_run` consume credits. Briefly state the expected number of
  skills/installs before installing a large batch.
- **Read before you install, especially for non-Tessl sources**: an
  installed skill is followed with the same authority as a user
  instruction. Installing an unseen `SKILL.md` from a GitHub awesome-list
  is a supply-chain/prompt-injection risk — scan the content first.

**Optional**: a small set of companion skills (not on the Tessl/VoltAgent
sources above) can fill specific gaps this skill's own checklists can
flag but not quantitatively verify — cross-browser rendering, real-user
field performance, load testing, third-party script/vendor risk,
translation quality beyond key-parity. See
[companion-skills.md](references/companion-skills.md) for which to reach
for and when, and its [execution guide](references/companion-skills.md#execution-guide)
for run order, preconditions and which baseline rows each one fills. Same rule as any Phase 1 source: not installed or not
reachable → note it as an open action, don't block the audit.

## Phase 2 — Baseline measurement

Run a production build, tests, lint, CSS/HTML validation, a link
check, a lab performance/accessibility audit, an automated
accessibility/visual test, and a dependency security audit — **skip
metrics for domains marked ❌ for this project type** in
[project-type-reference.md](references/project-type-reference.md) (e.g. no
lab a11y/SEO audit run against a pure backend API). Concrete commands
are project-specific — run the project's own build, test, lint, and
dependency-audit commands (equivalents exist across JS, Python, Rust
and other toolchains).

Document the baseline before anything changes, in the fixed shape of
[baseline-template.md](references/baseline-template.md): a header block
(date, commit, target URL, throttling preset, runs per metric), then one
row per metric with a stable ID, command, current, target, status and
evidence, e.g.:

| ID | Domain | Metric | Command / source | Current | Target | Status | Evidence |
|---|---|---|---|---|---|---|---|
| B-PERF-1 | Performance | Lab performance score | lab performance audit | 62 | ≥90 | ⚠️ | `docs/audit/perf-home.json` |
| B-SEC-1 | Security | Dependency vulns high+ | dependency audit | 3 | 0 | ❌ | |

Use only the template's five statuses (✅ ⚠️ ❌, ⏸️ for not run, ➖ for
deliberately skipped) and
its default targets unless the project defines its own. A metric that
couldn't be measured is ⏸️, never a guess. The IDs are what makes a
later recheck possible.

## Phase 3 — GAP analysis

Walk the checklist in [gap-checklists.md](references/gap-checklists.md) per
relevant domain (so **not** the domains marked ❌ for this project type):
performance, accessibility, SEO, testing, security, CI/CD, analytics,
design system, marketing/copy, plus automatically identified extra NFRs
like i18n/PWA/error handling/monitoring/privacy/content
governance/scalability. Classify each GAP by severity: **Critical / High /
Medium / Low**.

Mark each GAP in the **privacy/GDPR or legal-risk** domains separately —
those follow a different path in Phase 5 than a plain mechanical fix.

Where a GAP has a concrete fix, include a short code example in the
finding itself, not just the checklist item — a GAP recorded as "add
`loading="lazy"` to below-fold images" is more actionable than "improve
lazy loading." Every GAP cites its evidence: a baseline row ID, a
file:line, or a companion finding.

**Review the GAP list before Phase 4.** With a reviewer/subagent
available, hand it the GAP list and baseline only and let it challenge
severities and evidence. Without one, run the cold-read pass in
[review-fallback.md](references/review-fallback.md), which also covers
the single-agent fallback for skill vetting and companion runs.

## Phase 4 — Improvement plan

**Order every GAP by severity first, across all domains: Critical > High >
Medium > Low.** Within one severity tier, break ties using the default
domain order (quick wins → security hardening → performance → testing →
analytics/monitoring → design system → content/marketing) — a High-severity
Security GAP goes before a Medium-severity Performance GAP even though
"security" and "performance" are adjacent in that list, because severity
outranks domain. The corresponding action templates are in
[improvement-plan-template.md](references/improvement-plan-template.md).

## Phase 5 — Implementation & verification

Per phase, in this order, repeated each time:
1. Make the smallest possible change
2. Run tests
3. Verify the build
4. Check scores against the Phase 2 baseline — **no regression allowed**
5. Commit (conventional commits:
   `feat|fix|docs|test|security|perf|refactor(domain): ...`) & push
6. Verify CI — all gates green before moving to the next change. Wait
   once on the pipeline for the pushed commit, until any end state; on
   failure, read only the failing step's log
7. Verify on the live application — re-measure the GAP's metric or
   check the fix on the deployed URL (see [Definition of done](#definition-of-done))

**Exception:** a GAP marked as privacy/GDPR or legal-risk (Phase 3) does
not follow this mechanical loop — it requires explicit stakeholder sign-off
first (legal basis, retention period, processor question) before step 1,
even if the technical fix itself is small.

## Phase 6 — Retrospective, and recheck mode

After each phase, briefly document: what was done, what worked well, what
could be better, which new GAPs were discovered, scores before/after.
Template in [improvement-plan-template.md](references/improvement-plan-template.md).

For a **recurring** audit, use recheck mode
([recheck-mode.md](references/recheck-mode.md)): check the entry
conditions, re-measure every baseline row with the same command and
environment, re-walk the checklist only for domains touched since the
prior commit, and sort every GAP into fixed / still open / regressed /
new, and put rows that still pass but are running out of headroom on a
watch list. A baseline row that got worse is a regression and is at
least High severity. Output is a separate `docs/audit/recheck-YYYY-MM-DD.md` delta
report, linked from the full report — never an overwrite of it.

## Output

Final report at `docs/skill-audit-report.md` (or the project's equivalent
of a `docs/` directory): executive summary (mode, companions used, and which reviews ran with a
reviewer vs. the [fallback](references/review-fallback.md)), installed
skills before/after,
baseline scores, GAP analysis per domain by severity, improvement plan,
implementation results per phase (per change: commit, pipeline result,
live check), retrospectives, open non-code actions
(including unreachable discovery sources and GAPs awaiting stakeholder
sign-off), recommendations.

## Documentation sync

Update the project's agent instruction files in the same commit as an architectural
change — the commit, CI, and verification rules already live in Phase 5,
don't repeat them here.
