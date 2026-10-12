---
name: ci-hardening
description: Use when auditing, reviewing or tightening an existing CI pipeline (e.g. Woodpecker, GitHub Actions, GitLab CI), when guarding the pipeline file itself with a test, or when asked to make CI "stricter", "more reliable" or "trustworthy" — checks that every gate really verifies something (non-zero counts in the log, a must-fail proof), covers every file, runs at a strict level, and is pinned and ratcheted. Also use when a gate has been green for a long time without ever catching anything. Not for setting up a new pipeline or closing local/CI drift — that is ci-local-parity.
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

0. **Orientation (cheap).** Fetch, then `git log origin/<default>..HEAD`
   (unpushed commits of others) and `git log HEAD..origin/<default>`
   (someone may have pushed the same fix). Is the default branch green now,
   and how does the last green run relate to HEAD? Did a scheduled run ever
   succeed? Are local hooks really active
   (`git config --show-origin --get-all core.hooksPath`; `/dev/null` means
   every local gate is off, so CI is the only reliable gate until fixed;
   test hook logic by running the scripts directly)? A default branch that is already red is its own
   finding at the top of the report. Findings go stale while an audit stays
   open (a scheduled run fires, someone pushes): re-check the schedule and
   `HEAD..origin/<default>` right before fixing. Triage a red default
   branch from the failed step (`pipeline ps`) before adopting the
   hypothesis of an earlier report; a flaky step shows as the same commit
   red in one run and green in the next. To locate a silently aborted test,
   diff the CI log against a local run in the exact image.
   Repository governance wins over this skill: look for protected paths
   (`git grep -n -i protected` in the agent rules and governance docs). When
   the pipeline, hooks or gate scripts are protected (operator signing), a
   blocked commit is an outcome, not an obstacle: deliver a patch plus a
   handover note, do not bypass the block, and report the finding as
   "operator-gated", separate from "unproven".
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
   | medium | partial or unproven | 1 of N commits scanned; no must-fail proof; unpinned image; half the files linted |
   | low | strictness and hygiene | default rule set; advisory step with a written reason that is not the only check of a critical property |

   Edge cases: a local-only gate (e.g. a live-site test) is "n/a" with a
   reason; when the last green run is a scheduled run, compare with the last
   green push run on the default branch; without a checkout, audit from a
   read-only clone in a scratch directory.
3. **Tighten in small commits**, one gate per commit, only when changes were
   asked for. After each push, fetch the CI log for that exact commit and
   quote the evidence line.
   - Order for a gate fix: copy or write the check script, point the CI step
     at it (plus the clone fix), run it locally in the exact CI image
     (override the user to root, mark the workspace a safe directory), then
     push. Worked example for a secret scan, with its self-test:
     [secret-scan.sh](references/secret-scan.sh). A copy of a reference
     script goes stale: after every change to the reference, find the copies
     (`git grep -l <script name>` per repository), compare them with `cmp`
     and sync the deviating ones, one commit per repository. Start with
     `git ls-tree origin/<default> <script path>`: no copy means a new gate
     with its own order of work, not a sync. Per repository
     first run the step 0 orientation (hooks path included). A repository
     with its own baseline lookup inside the script migrates to the
     `GITLEAKS_BASELINE` variable: set it in the CI step and in the local
     wrapper, for the real scan only, and check that the log shows
     `baseline: <path> (N entries)`; without the baseline the scan reports
     the known hits again. A repository with a rule register or parity
     test needs the register change in the same commit, or its verify run
     turns red.
   - Before putting a scan on full history, run it locally and triage the
     hits (real, or a variable reference). The same false positive on a
     variable reference in several repositories is better handled by one
     scanner-config rule than by repeated baseline entries. A baseline entry is only for a
     demonstrable false positive, with the reason in the commit. A baseline
     is a limited, documented exception: apply it to the real scan only,
     never to the self-test; generate it with redaction like the scan, and
     regenerate it after a history rewrite or author
     change (entries match on all fields); log which baseline was used and
     how many entries it has. The same goes for any allowlist or ignore file
     the scanner loads by itself: review it like a baseline, and let the
     self-test run with the repository's own config.
   - If a wrapper script exists, let the CI step call the new check directly
     and keep the wrapper branch only as local parity (no dead CI branch); a
     staged-only local hook may stay as a fast complement as long as CI scans
     the full history. Remove
     the wrapper's other superseded paths too (a previous-commit range
     branch, a `--full` mode, a staged-only fallback), not just the CI one.
     A guard the wrapper already had is replaced by the new script, and its
     old tests move with it; they are not left behind as duplicate logic.
   - Replacing a gate means extending its parity or guard tests, never
     loosening them: replace the assertions of the old structure by stricter
     ones, say so in the commit, and never remove an assertion to get green.
     Adding a guard test can require a change to the test step itself (a
     tool the guard needs in the image); that stays within the scope of the
     gate fix.
   - A new gate script must fall inside the coverage of the existing lint
     step: compare the glob's count with `git ls-files` right away.
   - Pre-flight: run the other existing gates (above all the dependency
     audit and the new-code quality gate) locally, and again after adding a
     tool dependency for a new gate (it drags in its own advisories); new
     tests in the repository's own suite can trip quality rules too so the gate commit does not turn red for an unrelated
     reason. For a red audit one lookup decides the route: patched version
     available (fix-available field, advisory's first-patched version) means
     override or update; none means a documented ignore.
   - A new working gate exposes existing debt. When the pipeline turns red
     after a gate push, first separate the cause (your change, or an
     advisory or finding underneath), read the details (severity, attack
     vector), look for an override path (resolver override, lockfile-only
     fix, pinned transitive version), fix, document. Never weaken the gate;
     an ignore comes last, with a reason and an expiry. A recurring recipe
     for a red dependency audit: [dependency-audit.md](references/dependency-audit.md).
   - Verify each commit landed (`git log -1`, clean `git status`), check its
     author is the intended commit identity (older commits stay as they are;
     never rewrite shared history for it), and report the hash actually
     pushed (a rebase changes it). With bots or parallel sessions pushing,
     rebase onto the remote first. If the working directory is dirty or
     behind (someone else's work in progress), do the change in a temporary
     detached worktree of the remote default branch and push from there,
     leaving the checkout untouched (read `git log -- <pipeline file>` and
     `git status` first, and stage explicitly, when another session edits the
     same file); clean up afterwards (container output in
     the scratch area may be root-owned). A worktree does not work as a
     bind-mounted test directory (its `.git` file points to an absolute host
     path): use a fresh `git clone file://` with the changed files copied in.
     A worktree is for commit and push, not a test environment: in it `.git`
     is a file, so a full-history scan in the image fails as a shallow
     clone, and a build in it needs its own install, not a symlinked
     dependency directory.
4. **Evidence report** in one place: pushed hash, CI run number, the quoted
   log lines, before/after numbers (see Report form), never "improved". Tie
   the run to the commit by its sha (JSON output or the API), never by the
   commit message. Take
   the evidence from the run that contains the hash and exactly that gate
   (a red or failed earlier step in a sequential pipeline makes the gate
   steps after it `skipped`: then there is no evidence for them yet)
   (an earlier run may still hold the old, broken version): with auto-cancel
   on quick successive pushes a run can end `killed`, which is no evidence.
   Take every number in a commit message or report from the run, never an
   estimate: a wrong figure in a pushed commit cannot be corrected.

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
      (e.g. `git --version`) instead.
- [ ] Does a wrapper script or a git hook exit 0 with a warning when its
      tool is missing (`command -v tool || exit 0`)? Acceptable locally only
      with a blocking CI counterpart (the boundary is whether one exists);
      in CI it must fail, and a hook that is the only barrier should fail
      too. Test a hook-run self-test
      under a simulated hook environment (`GIT_DIR` exported) and prove that
      the real repository stays untouched. The repository's own test suite
      is the same leak path: look for fixtures that run `git init` or
      `commit` with the inherited environment
      (`grep -rnE 'git.*(init|commit)' tests/`), and compare `core.bare`,
      `rev-list --all --count` and `.git/config` before and after the first
      commit attempt in the real repository.
- [ ] Is every advisory step (`failure: ignore`, `allow_failure`) listed
      with a written reason? Otherwise it is a gate that cannot fail.
- [ ] Does the step run the intended binary? A package runner can resolve
      the name to an unrelated package that prints a greeting and exits 0.
      Require a tool-specific evidence line (version, score, count).
- [ ] Is the expected count derived from an independent source? A threshold
      computed from the same shallow clone the scan sees is circular; check
      the clone state explicitly and list known exceptions instead of
      loosening the threshold.

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
      guarded for first and forced pushes? Does change detection (which
      directories changed) behave? Log `range: A..B (N files changed)`:
      begin equal to end (a restart) with 0 changed files is fine, an
      invalid range must mean "run everything", and a gate that processed 0
      items may only be green when N changed files is also 0.
- [ ] For a range scan, is the logged count at least the commits with added
      non-binary lines in that range? An invalid or empty range is a failed
      scan that exited 0, never "legitimately 1 commit".
- [ ] Is there also a full-history scan (scheduled or on the default
      branch)? A range scan legitimately scans few commits, but then the
      full history is never covered. Take the proof from the CI run, not
      from a local count: a local clone can hold extra remote branches and
      other refs (even a notes ref counts as a commit to a history scanner)
      that CI never sees, so the numbers differ; the minimum belongs to the
      CI clone itself.

**Supply chain**
- [ ] Are images and plugins pinned by digest, with the real value looked up
      from the registry, never invented?
- [ ] Is the tool version in CI equal to the local one, pinned in a lockfile
      or requirements file rather than installed unpinned? A gate running in
      a minimal tool image must not lean on tools that image lacks (git, a
      package manager). Run every new or changed CI script, with real input
      and every scenario it handles, in the exact image of its step before
      pushing: a script that passes locally can crash in the step image. A
      guard test can encode the requirement per image family (a slim image
      installs what the script needs), and the script should degrade visibly
      rather than crash. Run a new gate
      first locally in the exact CI image: linter rules differ per release.
- [ ] Do floating specs exist: `>=` ranges without a lockfile, `npx --yes
      <tool>`, binaries fetched by `curl` without a checksum, git-URL
      dependencies? Does the dependency audit find at least one manifest?
- [ ] Do language/runtime versions match between CI and local, or is the
      difference deliberate and written down?

**Pipeline shape**
- [ ] Is any gate, above all the secret scan, behind a pipeline-level path
      or event filter? A docs-only commit then triggers no run. When moving
      the filter to step level, check that every other step keeps its own
      exclude and that steps depending on a skipped step behave as intended. With no path filter present, the item is "n/a".
      Read the
      filter and verify with a real documentation change (the run's step
      list must show only the gate steps); a noise commit to trunk is not
      acceptable, so without a real change and the owner's consent report
      "not verified".
- [ ] Do cheap blocking gates (secret scans) run first, with later steps
      depending on them? Does a flaky external-network gate (a link check)
      run before them, so its failure skips every later security step?
      Network gates go last or non-blocking with a written reason.
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
- [ ] Does a vulnerability scan also run on a schedule, and does the
      scheduled run include the gates and not only unrelated jobs? A
      scheduled gate is proven only by a run with the schedule event on a
      commit that contains the fix (a restart reuses the old commit). When
      that is impossible (no manual trigger, schedule not due), report "not
      verified" with the reason; an optional manual event on the scheduled
      pipeline makes it provable.

**Regression**
- [ ] Is there a test-count floor or ratchet (a falling count only with an
      explicit waiver such as a commit trailer or editing the floor file in
      the same commit), per suite when there are several? Count passed plus
      skipped, and add a separate ceiling for skipped tests (silent skips
      hide a shrinking suite). In CI it must fail hard when its base is
      missing, not skip silently.
- [ ] Are scripts copied between sibling repositories identical? Compare them with `cmp` (a wrapper may rewrite `diff`
      output);
      silent divergence means one repository runs an older, weaker gate.
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

Per gate: claim, evidence line from the log (quoted), must-fail proof (commit
or run number), gap, fix commit. End with before/after numbers and what
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
