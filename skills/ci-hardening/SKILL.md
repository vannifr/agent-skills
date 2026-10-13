---
name: ci-hardening
description: Use when auditing, reviewing or tightening an existing CI pipeline (e.g. Woodpecker, GitHub Actions, GitLab CI), when a secret scan or other gate logs 0 items or has no self-test or must-fail proof, when guarding the pipeline file itself with a test, when pipeline or gate files are protected or operator-signed, or when asked to make CI "stricter", "more reliable" or "trustworthy" — checks that every gate really verifies something (non-zero counts in the log, a must-fail proof), covers every file, runs at a strict level, and is pinned and ratcheted. Also use when a gate has been green for a long time without ever catching anything. Not for setting up a new pipeline or closing local/CI drift — that is ci-local-parity.
---

# CI hardening: a green gate proves nothing until it has checked something

**The core rule:** a green step proves nothing until its log shows what it
checked (a count above zero) **and** it has failed at least once on a
deliberate violation.

`ci-local-parity` asks "does local check the same as CI?". This skill asks
the other question: "does each gate really check anything, and as strictly
as is reasonable?". A secret scanner that was green for weeks while logging
"0 commits scanned" passes every parity check. For setting up a pipeline or
closing local/CI drift, use `ci-local-parity` first; hand parity findings
(a local gate CI lacks, or the reverse) to it instead of fixing them here.

## Workflow

**Default to audit-only** (steps 0-2, report, stop) unless the user asked
for changes. Pushing to the default branch needs the owner's go-ahead.
Audit-only still delivers each fix as a ready-to-apply patch (a diff or a
file), never as prose; "you may edit" is permission, not a request.

**Highest yield first** when time is short: how many items each scan step
logged (0 or 1 means vacuous); whether the secret scan has a self-test and
full history; whether hooks are active; which files the lint steps skip
versus `git ls-files`; which images are unpinned. Then walk the checklist.

0. **Orientation (cheap).** Fetch, then `git log origin/<default>..HEAD`
   (unpushed commits of others) and `git log HEAD..origin/<default>`
   (someone may have pushed the same fix). Is the default branch green now,
   and how does the last green run relate to HEAD? Did a scheduled run ever
   succeed? A default branch that is already red is its own finding at the
   top of the report; triage it from the failed step
   ([log-evidence.md](references/log-evidence.md)). Are local hooks really
   active (`git config --show-origin --get-all core.hooksPath`; `/dev/null`
   means every local gate is off, so CI is the only reliable gate until
   fixed; test hook logic by running the scripts directly)? Findings go
   stale while an audit stays open (a scheduled run fires, someone pushes):
   re-check the schedule and `HEAD..origin/<default>` right before fixing.
   Also read the role and commit rules in the agent rules (for example
   "the orchestrator commits, executing agents never do"); when in doubt
   have the owner confirm who may commit.
   Repository governance wins over this skill: when the pipeline, hooks or
   gate scripts are protected, a blocked commit is an outcome ("operator-gated"), not
   an obstacle: [protected-pipelines.md](references/protected-pipelines.md).
1. **Inventory.** Read the scripts the pipeline calls, not only the pipeline
   file: a wrapper decides what really runs, and a non-strict mode can make a
   skipped tool exit 0. For each step write down what it claims, what its
   log shows it checked (files, commits, tests, rules) and which files it ran
   on versus `git ls-files`. Evidence per tool class and a loop to pull it
   from every step log: [log-evidence.md](references/log-evidence.md).
2. **Gap analysis.** Walk the checklist. Mark an item "n/a" with a reason
   when it does not fit (proportionality: a ratchet or parity test is heavy
   for a small content repo) or cannot be audited read-only (needs history or
   a quality server); a historical red run is must-fail proof only when it
   failed for that gate's reason, otherwise the gate is "unproven". Record
   each gap with a severity and one concrete failure scenario ("a leaked key
   in commit N would pass because the scan sees 0 commits").

   | Level | Meaning | Examples |
   |---|---|---|
   | high | the gate cannot fail | 0 items scanned and exit 0 (always high, even with a pinned tool); silently skipped; a tool crash passes |
   | medium | partial or unproven | 1 of N commits scanned (high when no full-history scan exists anywhere); no must-fail proof; unpinned image; half the files linted |
   | low | strictness and hygiene | default rule set; advisory step with a written reason that is not the only check of a critical property |

   Edge cases: a local-only gate (e.g. a live-site test) is "n/a" with a
   reason; when the last green run is a scheduled run, compare with the last
   green push run on the default branch; without a checkout, audit from a
   read-only clone in a scratch directory.
3. **Tighten in small commits**, one gate per commit, only when changes were
   asked for. After each push, fetch the CI log for that exact commit and
   quote the evidence line. Order of work, copies across repositories,
   baselines, pre-flight, debt a new gate exposes, worktrees and commit
   hygiene: [gate-rollout.md](references/gate-rollout.md). Worked example of a
   gate script with its self-test: [secret-scan.sh](references/secret-scan.sh).
4. **Evidence report** in one place: pushed hash, CI run number, the quoted
   log lines, before/after numbers (see Report form), never "improved". Tie
   the run to the commit by its sha and take the evidence from the run that
   contains the hash and exactly that gate
   ([log-evidence.md](references/log-evidence.md)). Take every number in a
   commit message or report from the run, never an estimate: a wrong figure
   in a pushed commit cannot be corrected.

## Checklist

**Effectiveness**
- [ ] Does every scanner/test step log a count above zero, and is the step
      unproven when it prints nothing countable? Add a count line.
- [ ] Does every gate have a must-fail corpus or self-test that runs in CI?
      Templates: [selftest-patterns.md](references/selftest-patterns.md). A
      test suite is its own proof for the code it tests, but its count needs
      a floor (see Regression).
- [ ] Does a step fail hard on a tool error, not only on a finding? Hunt
      silent fallbacks: `|| true`, `2>/dev/null || other-tool` (in CI the
      fallback may check an empty input and exit 0, so a crash and a real
      finding both pass), `continue-on-error`, an early `exit 0`, and
      install-and-ignore (`<install tool> || true`, which can hide that the
      image lacks the installer or the tool). Assert what the step needs
      (e.g. `git --version`) instead. A scanner that logs an error line must
      fail even when its exit code is 0. Run the same hunt over your own
      patch before reporting: a fix that adds `2>/dev/null || echo 1` has
      only moved the gap.
- [ ] Does a wrapper script or a git hook exit 0 with a warning when its
      tool is missing (`command -v tool || exit 0`)? Acceptable locally only
      with a blocking CI counterpart (the boundary is whether one exists);
      in CI it must fail, and a hook that is the only barrier should fail
      too. Enabling, testing and degrading hooks:
      [local-hooks.md](references/local-hooks.md).
- [ ] Is every self-test and test that runs `git init` or `commit` isolated
      from a git hook environment (`GIT_DIR` exported)? That includes the
      repository's own test fixtures
      (`grep -rnE 'git.*(init|commit)' tests/`). Proof and damage check:
      [selftest-patterns.md](references/selftest-patterns.md).
- [ ] Is every advisory step (`failure: ignore`, `allow_failure`) listed
      with a written reason? Otherwise it is a gate that cannot fail.
- [ ] Does the step run the intended binary? A package runner can resolve
      the name to an unrelated package that prints a greeting and exits 0.
      Require a tool-specific evidence line (version, score, count).
- [ ] Is the expected count derived from an independent source, as a lower
      bound, with the clone state checked explicitly? A threshold computed
      from the same shallow clone the scan sees is circular. Rules and
      pitfalls: [selftest-patterns.md](references/selftest-patterns.md).

**Coverage**
- [ ] Is every file of every type covered? Compare the step's glob or file
      list with `git ls-files` per file type (extensionless files such as git
      hooks escape an `*.sh` glob). Hand-kept lists inside scripts (a compile
      list, a test file list) drift when a file is added.
- [ ] Do test suites exist that run nowhere in CI or in a hook? A suite
      outside the gate is a coverage gap; list each with its test count.
- [ ] Does the repository track file types the scanner cannot inspect
      (office documents, PDFs, spreadsheets, images with text)? Report it as
      a coverage finding: convert to text before the scan, or an explicit
      decision by the owner, above all for customer material.
- [ ] Are vendored, generated and tooling directories excluded explicitly and
      centrally, so "every file" means every file the team owns?
- [ ] Are non-code languages linted (container files, YAML, JSON, pipeline
      files, shell, hooks, init scripts, templates), and is every lint or
      test config actually wired into a step or the active hook path?
- [ ] Do gates that scan an input really have input? Examples: a
      vulnerability scan that finds no supported manifest, a link checker
      whose skip pattern leaves 0 links, a linter whose `files` list covers
      1 of 18 source files. Log the input count and compare with `git ls-files`.

**Strictness**
- [ ] Do linters run at their strictest level, with exceptions only
      centrally (a config file) or per line with a reason?
- [ ] Does the quality gate demand "no new issues" and a coverage floor on
      new code?
- [ ] Is every allowlist entry documented with a reason and an expiry? One
      without is itself a finding (low to medium), and so is an entry the
      audit tool itself reports as unnecessary (clean the list periodically).


**Clone and history**
- [ ] Do diff-based scans have the previous commit available (shallow or
      partial clone defeats them), and do steps have the credentials they
      need, or does the clone step have to provide the history?
- [ ] Is a range built from a possibly empty variable (`${PREV:-}..HEAD`)
      guarded for first and forced pushes? Log `range: A..B (N files
      changed)`: begin equal to end (a restart) with 0 changed files is
      fine, an invalid range must mean "run everything", and a gate that
      processed 0 items may only be green when N changed files is also 0.
      For a range scan the logged count is at least the commits with added
      non-binary lines in that range.
- [ ] Is there also a full-history scan (scheduled or on the default
      branch)? A range scan legitimately scans few commits, but then the
      full history is never covered. Take the proof from the CI run, not
      from a local count.

**Supply chain**
- [ ] Are images and plugins pinned by digest, with the real value looked up
      from the registry, never invented?
- [ ] Is the tool version in CI equal to the local one, pinned in a lockfile
      or requirements file rather than installed unpinned? Was every new or
      changed CI script run, with real input and every scenario it handles,
      in the exact image of its step before pushing? A script that passes
      locally can crash in a minimal image that lacks git or a package
      manager; linter rules also differ per release
      ([woodpecker.md](references/woodpecker.md)).
- [ ] Do floating specs exist: `>=` ranges without a lockfile, `npx --yes
      <tool>`, binaries fetched by `curl` without a checksum, git-URL
      dependencies? Does the dependency audit find at least one manifest?
- [ ] Do language/runtime versions match between CI and local, or is the
      difference deliberate and written down?

**Pipeline shape**
- [ ] Is any gate, above all the secret scan, behind a pipeline-level path
      or event filter? A docs-only commit then triggers no run. Move the
      filter to step level and verify it with a real documentation change
      (path filter absent: "n/a"; no real change and no consent: "not
      verified"): [woodpecker.md](references/woodpecker.md).
- [ ] Do cheap blocking gates (secret scans) run first, with later steps
      depending on them? A flaky external-network gate (a link check) goes
      last or non-blocking with a written reason, so its failure skips no
      security step.
- [ ] Does the quality-server step wait on the test and vulnerability steps
      it reports on, and does its scope include every code directory? More:
      [quality-server.md](references/quality-server.md).
- [ ] Does the gate also run on the pull-request path when the repository
      uses pull requests? Without a provable PR run (or in a trunk-only
      repository) report "PR path: not verified" with the reason.
- [ ] Does the deploy step depend on every blocking gate (secret scan,
      env guard, audit, quality gate)? A deploy that does not wait for them
      ships what the gates would have stopped.
- [ ] Does every step have an upper bound on its runtime (a timeout)? A step
      that can hang for tens of minutes is a gap (low to medium).
- [ ] Does a vulnerability scan also run on a schedule, including the gates
      and not only unrelated jobs? A scheduled gate is proven only by a run
      with the schedule event on a commit that contains the fix; otherwise
      "not verified". A run that ends `killed` on the time-out is no run, and
      a scanner without a failing exit code on findings is a report, not a
      gate ([woodpecker.md](references/woodpecker.md),
      [dependency-audit.md](references/dependency-audit.md)).

**Regression**
- [ ] Is there a test-count floor or ratchet (a falling count only with an
      explicit waiver such as a commit trailer or editing the floor file in
      the same commit), per suite when there are several? Count passed plus
      skipped, and add a separate ceiling for skipped tests (silent skips
      hide a shrinking suite). In CI it must fail hard when its base is
      missing, not skip silently.
- [ ] Are scripts copied between sibling repositories identical? Compare
      them with `cmp` (a wrapper may rewrite `diff` output); silent
      divergence means one repository runs an older, weaker gate.
- [ ] Is there a parity test that parses the CI file and checks it against
      the local verify command?

## Guarding the pipeline definition

The pipeline file is code without a safety net; lint only checks syntax. A
guard test in the normal test suite (dependency graph, image pins, producers
before consumers, ignore allowlist with deadline) catches what otherwise
shows up only after a push:
[pipeline-definition-guard.md](references/pipeline-definition-guard.md).

## Report form

Start with a summary table: images pinned n/m, files linted vs `git ls-files`
per language (shell, config, container), commits scanned n vs the scan's own
expected lower bound m (never vs `git rev-list --all`), gates with a
must-fail proof n/m, floors present.

Per gate: claim, evidence line from the log (quoted), status (proven,
unproven, n/a or not verified, always one of these words), must-fail proof
(commit or run number), gap, fix commit. A finding that needs an operator
carries both labels: unproven and operator-gated. End with before/after numbers and what
remains open. A gate with no must-fail proof is "unproven", not passing.

A reference shape to compare with: every image pinned by digest; a gate
script that fails when a tool is missing; coverage floors per glob; the
quality gate proven red once on a deliberate violation; a scan that logs its
input count and exits non-zero on an error line.

## Definition of done

Each tightening is committed, the CI run for that exact commit is green
(checked from the CI system, never made green by weakening a gate), and the
evidence line is quoted. What could not be verified is reported as "not
verified" with the reason.

CI-specific pitfalls (clone depth, credentials, variables, log fetching):
[woodpecker.md](references/woodpecker.md).

