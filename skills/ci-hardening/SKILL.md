---
name: ci-hardening
description: Use when auditing, reviewing or tightening an existing CI pipeline (e.g. Woodpecker, GitHub Actions, GitLab CI), or when asked to make CI "stricter", "more reliable" or "trustworthy" — checks that every gate really verifies something (non-zero counts in the log, a must-fail proof), covers every file, runs at a strict level, and is pinned and ratcheted. Also use when a gate has been green for a long time without ever catching anything. Not for setting up a new pipeline or local/CI drift — that is ci-local-parity.
---

# CI hardening: a green gate proves nothing until it has checked something

**The core rule:** a green step proves nothing until its log shows what it
checked (a count above zero) **and** it has failed at least once on a
deliberate violation.

`ci-local-parity` asks "does local check the same as CI?". This skill asks
the other question: "does each gate really check anything, and as strictly
as is reasonable?". A secret scanner that was green for weeks while logging
"0 commits scanned" passes every parity check. For setting up a pipeline or
closing local/CI drift, use `ci-local-parity` first.

## Workflow

1. **Inventory.** For each pipeline step, write down what it claims to
   check, what its log shows it actually checked (files, commits, tests,
   rules), and which files it ran on versus which exist in the repository
   (`git ls-files`). Evidence per tool: [log-evidence.md](references/log-evidence.md).
2. **Gap analysis.** Walk the checklist below. Record each gap with a
   severity and one concrete failure scenario ("a leaked key in commit N
   would pass because the scan sees 0 commits").
3. **Tighten in small commits**, one gate per commit. After each push,
   fetch the CI log for that exact commit and quote the evidence line.
4. **Evidence report.** Before/after in numbers (files covered, commits
   scanned, pinned images n/m, tests, strictness level), never "improved".

## Checklist

**Effectiveness**
- [ ] Does every scanner/test step log a count above zero?
- [ ] Does every gate have a must-fail corpus or self-test that runs in CI?
      Templates: [selftest-patterns.md](references/selftest-patterns.md).
- [ ] Does a step fail hard on a tool error, not only on a finding?
- [ ] Does no step silently fall back (`|| true`, `2>/dev/null`,
      `continue-on-error`, an early `exit 0`) on a path that disables the
      check? Includes install-and-ignore (`<install tool> || true`): it can
      hide that the image lacks the installer or the tool entirely. Assert
      what the step needs instead (e.g. `git --version`).
- [ ] Is the expected count derived from an independent source? A
      threshold computed from the same shallow clone the scan sees is
      circular; check the clone state explicitly (shallow? partial?) and
      list known exceptions (e.g. empty commits) instead of loosening the
      threshold.

**Coverage**
- [ ] Is every file of every type covered? Compare the step's glob or file
      list against `git ls-files` mechanically, not by a hand-kept list.
- [ ] Are hooks, init/bootstrap scripts, templates and helper scripts
      included, not only the main source tree?

**Strictness**
- [ ] Do linters run at their strictest level, with exceptions only
      centrally (a config file) or per line with a reason?
- [ ] Does the quality gate demand "no new issues" and a coverage floor on
      new code?

**Clone and history**
- [ ] Do diff-based scans have the previous commit available (shallow or
      partial clone defeats them)?
- [ ] Do steps have the credentials they need, or does the clone step have
      to provide the history?

**Supply chain**
- [ ] Are images and plugins pinned by digest, with the real value looked up
      from the registry, never invented?
- [ ] Is the tool version in CI equal to the local one, with no placeholders?
      A new gate is first run locally in the exact CI image: a version
      difference (linter rules differ per release) otherwise surfaces as a
      red pipeline on a file that was clean locally. Pin tool versions in a
      lockfile or requirements file, not `install <tool>` unpinned.
- [ ] Do language/runtime versions match between CI and local, or is the
      difference deliberate and written down?

**Pipeline shape**
- [ ] Do cheap blocking gates (secret scans) run first, with later steps
      depending on them, and does the quality-server step wait on the test
      and vulnerability steps it reports on?
- [ ] Does a vulnerability scan also run on a schedule, so it finds new
      advisories without a commit? Verify the schedule actually fired once.
- [ ] Does the analysis scope (e.g. a quality server's source list) include
      every code directory that exists in the repository?

**Regression**
- [ ] Is there a test-count ratchet (a falling count only with an explicit
      `Test-Removal:` trailer)? In CI it must fail hard when its base
      reference is missing, not skip silently.
- [ ] Is there a parity test that parses the CI file and checks it against
      the local verify command?

**Local**
- [ ] Are the git hooks really active? Check
      `git config --show-origin --get-all core.hooksPath`; agent worktrees
      sometimes set it to `/dev/null`, and `git config --worktree` without
      `extensions.worktreeConfig` writes to the shared config.

**After mechanical changes**
- [ ] After a formatter or autofix run, re-run the quality gate: formatters
      can move an inline suppression away from the line it covers and
      resurface an old finding as new.

**Concurrency**
- [ ] Do local pre-push and CI post to the same analysis project (e.g. a
      code-quality server)? Then analyses collide ("date of analysis cannot
      be older than the last known analysis"). Fix: a separate project key
      for local runs.

## Report form

Per gate: claim, evidence line from the log (quoted), must-fail proof
(commit or pipeline number), gap, fix commit. End with the before/after
numbers and what remains open. A gate with no must-fail proof is reported
as "unproven", not as passing.

## Definition of done

Each tightening is committed, the CI run for that exact commit is green
(checked from the CI system, never made green by weakening a gate), and the
evidence line is quoted. What could not be verified is reported as "not
verified" with the reason.

CI-specific pitfalls (clone depth, credentials, variable escaping, linting
the pipeline file): [woodpecker.md](references/woodpecker.md).
