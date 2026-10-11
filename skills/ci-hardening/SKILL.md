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

0. **Orientation (first, cheap).** Fetch and look at
   `git log HEAD..origin/<default>` before starting: another session or a
   bot may have pushed the same fix minutes ago. Is the default branch
   green now, and how
   does the last green run relate to HEAD? Did a scheduled run ever
   succeed? Are the local hooks really active
   (`git config --show-origin --get-all core.hooksPath`; a value of
   `/dev/null` means every local gate is off)? A default branch that is
   already red is reported as its own finding at the top of the report.

1. **Inventory.** Read the scripts the pipeline calls, not only the
   pipeline file: a wrapper often decides what really runs, and a
   non-strict mode can make a skipped tool exit 0 (check how the strict
   flag reaches CI). For each pipeline step, write down what it claims to
   check, what its log shows it actually checked (files, commits, tests,
   rules), and which files it ran on versus which exist in the repository
   (`git ls-files`). Evidence per tool class and a one-liner to pull it from
   every step log: [log-evidence.md](references/log-evidence.md).
2. **Gap analysis.** Walk the checklist below; mark an item "n/a" with a
   reason when it does not fit the repository (proportionality: a ratchet
   or parity test is heavy for a small content repo) or cannot be audited
   read-only (needs history or a quality server). Record each gap with a
   severity and one concrete failure scenario ("a leaked key in commit N
   would pass because the scan sees 0 commits"). Severity ladder:

   | Level | Meaning | Examples |
   |---|---|---|
   | high | the gate cannot fail | 0 items scanned and exit 0 (always high, even with a pinned tool); silently skipped; tool crash passes |
   | medium | partial or unproven | 1 of N commits scanned; no must-fail proof; unpinned image; half the files linted |
   | low | strictness and hygiene | default rule set; advisory step with a written reason that is not the only check of a critical property |

   Edge cases: a local-only gate (e.g. a live-site test) is "n/a" with a
   reason; when the last green run is a scheduled run, compare with the
   last green push run on the default branch; without a checkout, audit
   from a read-only clone in a scratch directory.
3. **Tighten in small commits**, one gate per commit. After each push,
   fetch the CI log for that exact commit and quote the evidence line.
   - Order for a gate fix: copy or write the check script, point the CI
     step at it (plus the clone fix), run it locally in the exact CI image
     (override the user to root and mark the workspace as a safe
     directory), then push. Worked example for a secret scan:
     [secret-scan.sh](references/secret-scan.sh).
   - When a wrapper script already exists, let the CI step call the new
     check directly and keep the wrapper branch only as local parity;
     otherwise a dead CI branch stays behind.
   - A new gate script must fall inside the coverage of the existing lint
     step: check the glob's count against `git ls-files` right away.
   - An existing findings baseline (old, documented leaks) is a limited,
     documented exception: apply it to the real scan only, never to the
     self-test (the example reads it from an optional environment variable
     and logs which baseline it used, so a dropped baseline is visible).
     When replacing a wrapper that auto-detected a baseline, pass it
     explicitly.
   - Verify every commit with `git log` and `git status` and never pipe a
     commit's output through a filter: a hook failure vanishes, the commit
     does not happen, and the staged files land in the next commit.
   - In repositories with bots that push (dependency updates), pull with
     rebase before pushing. Parallel sessions share a working directory:
     if the rebase fails on someone else's uncommitted changes, check
     `git log HEAD..origin/<default>`; when nothing new is there, push
     without a rebase. A rebase changes the hash: report the hash that
     was actually pushed and find the CI run by that hash.
   - Pre-flight before a gate push: run the other existing gates (above
     all the dependency audit) locally, so the gate commit does not turn
     red for an unrelated reason. For a red audit, one lookup decides the
     route: if a patched version exists (the audit's fix-available field,
     the advisory's first-patched version), use an override or update; if
     none exists, a documented ignore is the only option.
   - A new working gate exposes existing debt. When the pipeline turns red
     after a gate push, first separate cause: your change or a new
     advisory or finding underneath? Then: read the details (severity,
     attack vector), look for an override path (a resolver override, a
     lockfile-only fix, a pinned transitive version), fix, and document
     the result. Never weaken the gate; an explicit ignore comes last,
     with a reason and an expiry. An allowlist entry without a reason or
     an expiry is itself a finding (low to medium).
4. **Evidence report.** Before/after in numbers (files covered, commits
   scanned, pinned images n/m, tests, strictness level), never "improved".

**Audit-only mode:** when asked only to review, stop after step 2 and
report the gaps with fixes proposed, not applied. A historical red run
counts as must-fail proof only when it failed for that gate's reason;
otherwise the gate is "unproven"; items that need history
or a server are marked "n/a (not auditable read-only)".

## Checklist

**Effectiveness**
- [ ] Does every scanner/test step log a count above zero?
- [ ] Does every gate have a must-fail corpus or self-test that runs in CI?
      Templates: [selftest-patterns.md](references/selftest-patterns.md).
      A test suite is its own proof for the code it tests, but its count
      still needs a floor (see Regression).
- [ ] Does stderr redirection hide a tool crash and trigger a fallback
      (`tool 2>/dev/null || other-tool`)? In CI the fallback may check an
      empty input and exit 0, so a crash and a real finding both pass.
- [ ] Is every advisory step (`failure: ignore`, `allow_failure`) listed
      with a written reason? Otherwise it is a gate that cannot fail.
- [ ] Does a wrapper script exit 0 with a warning when its tool is missing
      from the image? That is acceptable locally only with a blocking CI
      counterpart; in CI it must fail.
- [ ] Does the step run the intended binary? A package runner can resolve
      the name to an unrelated package that prints a greeting and exits 0.
      Require a tool-specific evidence line (tool version, score, count).
- [ ] Does every step print something countable? A step whose log is empty
      on success is unproven; add a count line.
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
      list against `git ls-files` mechanically (extensionless files such as
      git hooks escape an `*.sh` glob: compare the glob's count with the
      `git ls-files` count per file type); hand-kept lists inside
      scripts (a compile list, a test file list) drift when a file is added.
- [ ] Are vendored, generated and tooling directories excluded explicitly
      and centrally, so "every file" means every file the team owns?
- [ ] Are non-code languages linted too (container files, YAML, JSON,
      pipeline files, shell), and is every lint or test config actually
      wired into a step or the active hook path rather than sitting unused?
- [ ] Are hooks, init/bootstrap scripts, templates and helper scripts
      included, not only the main source tree?

**Strictness**
- [ ] Do linters run at their strictest level, with exceptions only
      centrally (a config file) or per line with a reason?
- [ ] Does the quality gate demand "no new issues" and a coverage floor on
      new code?

**Clone and history**
- [ ] Do gates that scan an input really have input? Examples: a
      vulnerability scan that finds no supported manifest (only dev
      dependencies, no lockfile), a link checker whose skip pattern leaves 0
      links, a linter whose `files` list covers 1 of 18 source files. Log
      count of inputs > 0 and compare with `git ls-files`.
- [ ] Do diff-based scans have the previous commit available (shallow or
      partial clone defeats them)? Is a range built from a possibly empty
      variable (`${PREV:-}..HEAD`) guarded for first pushes and force pushes?
- [ ] Does change detection (which files or directories changed, built
      from a commit range) behave? An invalid range followed by "nothing
      changed" makes every downstream gate vacuous, not only secret scans.
- [ ] For a range scan, does the logged count equal
      `git rev-list --count PREV..SHA`? An invalid range ("invalid revision
      range", an empty `PREV`) is never "legitimately 1 commit"; it is a
      failed scan that exited 0.
- [ ] Is there also a full-history scan (scheduled or on the default
      branch)? A range scan legitimately scans few commits, but then the
      full history is never covered.
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
- [ ] Do floating specs exist: `>=` ranges without a lockfile, `npx --yes
      <tool>`, binaries fetched by `curl` without a checksum, git-URL
      dependencies (pin by version, checksum or commit)? Does the
      dependency audit find at least one lockfile/manifest in the log?
- [ ] Do language/runtime versions match between CI and local, or is the
      difference deliberate and written down?

**Pipeline shape**
- [ ] Is any gate, above all the secret scan, behind a pipeline-level path
      filter (`path: exclude`) or an event filter? A docs-only commit then
      triggers no run at all. Verify with a docs-only commit: the run list
      must show a run.
- [ ] Does a blocking, flaky external-network gate (e.g. a link check) run
      before the secret scan? Its failure then skips every later security
      step. Put network gates last or non-blocking with a written reason.
- [ ] Do cheap blocking gates (secret scans) run first, with later steps
      depending on them, and does the quality-server step wait on the test
      and vulnerability steps it reports on?
- [ ] Does a vulnerability scan also run on a schedule, so it finds new
      advisories without a commit, and does the scheduled run include the
      gates and not only unrelated jobs? Verify the schedule fired once.
- [ ] Does the analysis scope (e.g. a quality server's source list) include
      every code directory that exists in the repository? Compare it with
      the tracked directories.

**Regression**
- [ ] Is there a test-count ratchet (a falling count only with an explicit
      waiver, e.g. a commit trailer or editing a floor file in the same
      commit)? In CI it must fail hard when its base
      reference is missing, not skip silently.
- [ ] With several test suites, is there a floor per suite (or one
      combined floor stated explicitly)?
- [ ] Are scripts copied between sibling repositories ("single source"
      scripts) identical? Diff them as an audit step; silent divergence
      means one repository runs an older, weaker gate.
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

**Concurrency** (n/a without an analysis server)
- [ ] Do local pre-push and CI post to the same analysis project? Then analyses collide ("date of analysis cannot
      be older than the last known analysis"). Fix: a separate project key
      for local runs.

## Guarding the pipeline definition

The pipeline file itself is code without a safety net; lint only checks
syntax. A guard test in the normal test suite (dependency graph, image
pins, producers before consumers, ignore allowlist with deadline) catches
what shows up otherwise only after a push: see
[pipeline-definition-guard.md](references/pipeline-definition-guard.md).

## Report form

Start with a standard summary table: images pinned n/m, files linted vs
`git ls-files` per language (shell, config, container), commits scanned n
vs the scan's own expected lower bound m (commits with added lines), never
vs `git rev-list --all`, gates with a must-fail proof n/m, floors present.
Local gates that CI lacks (and the reverse) are parity findings: hand them
to `ci-local-parity` instead of fixing them here.

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

## What good looks like

A reference shape to compare against: every image pinned by digest; a gate
script that fails when a tool is missing instead of skipping; coverage
floors per file glob, not one global number; the quality gate proven red at
least once on a deliberate violation (quote the run numbers); a scan that
logs its input count and exits non-zero on an error line.
