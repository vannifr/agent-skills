# Execution Patterns — prerequisites, coverage, CI monitoring, token budget

Patterns for the parts of an audit that cost the most time and tokens
when improvised: discovering mid-run that a tool is missing, guessing
which files to test first, and polling CI.

## Prerequisites check (end of Phase 0)

Before Phase 2, list every tool, access and credential the relevant
domains and companions need, check each one once, and ask the user for
all missing items **in one message** — not one at a time as each phase
hits them.

| Needed for | Check | If missing |
|---|---|---|
| Lighthouse/axe (Performance, A11y, SEO) | `npx lighthouse --version`, a headless browser starts | Baseline rows ⏸️; offer the install command |
| Cross-browser (Firefox/WebKit) | Playwright engines installed (`npx playwright install --dry-run` or equivalent) | `cross-browser-render-check` ⏸️ |
| Field data (CrUX/RUM) | CrUX API key in env, or access to the project's RUM/analytics dashboard or its MCP/API | `production-cwv-review` ⏸️; PageSpeed Insights UI as manual fallback |
| CDN/hosting data (cache, edge headers, analytics) | The provider's CLI or MCP authenticated (e.g. `wrangler whoami`, `vercel whoami`) | Rows that need it ⏸️; name the setup step |
| CI status | CI CLI or API token works (e.g. `gh run list`, the CI's own CLI or MCP) | Phase 5 step 6 falls back to the CI web UI; say so up front |
| Coverage | Test runner has a coverage reporter configured | `B-TEST-2` ⏸️; adding the reporter becomes a Quick Win |
| Staging/preview URL | URL responds | Measure a local production build instead; note it in the baseline header |

Record the result as a short table in the report's Executive Summary. A
domain whose tools are missing isn't skipped silently: its rows are ⏸️
with the missing prerequisite named, and the setup step goes into Open
Actions. Setting up an MCP, API key or CLI login needs the user; never
create credentials yourself.

## Coverage improvement pattern

When `B-TEST-2` (coverage) is below target, don't write tests for
whichever file is open. Rank first:

1. **Per-file report**: generate per-file uncovered lines
   (`coverage report --sort=miss` / `pytest --cov --cov-report=term-missing`,
   `vitest --coverage` / `jest --coverage` with the `text` reporter,
   `cargo llvm-cov --summary-only`).
2. **Criticality weight** per file, 1-3:
   3 = money, auth, data writes, input parsing, anything a Critical/High
   GAP touches; 2 = core business logic and shared utilities;
   1 = glue, presentation, generated or config code.
3. **Priority = uncovered lines × weight.** Work the list top-down.
   Skip files that are dead code — delete them instead, which raises
   coverage honestly.
4. **Test type per file**: pure functions and parsers → unit tests;
   code whose risk is in wiring (DB, HTTP, filesystem) → one integration
   test per path beats many mocked unit tests; UI → leave to E2E/visual
   tests, don't chase line coverage there.
5. **Track per file**, not only the total:

   | File | Weight | Uncovered before | After | Tests added |
   |---|---|---|---|---|
   | `app/billing.py` | 3 | 84 | 12 | `test_billing_rounding.py` |

6. **Measure coverage once per phase**, at the end of the phase — not
   after every test file. Run only the new tests while writing them.

## CI monitoring pattern (Phase 5 step 6)

One push → one wait → one result. Per push:

1. Get the pipeline for the pushed commit SHA — not "the latest
   pipeline", which may belong to another push.
2. Start **one** blocking wait that exits on any terminal state
   (success, failure, error, killed, cancelled), with a hard timeout
   (e.g. 15 minutes). Prefer the CI's own watch command where it has
   one (`gh run watch <id> --exit-status`, or the CI CLI/MCP
   equivalent); otherwise a single poll loop with a 15-30 s interval
   against the API.
3. Never start a second watcher for the same pipeline, and don't run
   several background shells that each poll. If the wait times out,
   check the status once and report it as still running — don't
   silently re-arm in a loop.
4. On failure, fetch **only the failing step's log** (tail it), not all
   steps.
5. Don't push again until the result is in; if several small verified
   changes are ready, it's fine to push them together so CI runs once,
   as long as each commit on its own is green locally.

## Token budget

A full audit plus implementation is expensive; most of the cost is
repetition, not the audit itself:

- Prefer recheck mode ([recheck-mode.md](recheck-mode.md)) whenever its
  entry conditions hold.
- Save tool output to files (`docs/audit/*.json`) and read summaries or
  the specific fields you need, not the full JSON back into context.
- Re-run a measurement only at the end of a phase (Phase 5 step 4), not
  after every edit.
- Read logs from the tail or by grep for errors, not in full.
