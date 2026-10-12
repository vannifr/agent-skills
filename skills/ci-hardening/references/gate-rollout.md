# Rolling a gate fix out

Detail for step 3 of the workflow: the order of work, copies across
repositories, baselines, debt a new gate exposes, and commit hygiene.

## Order of work for one gate

Copy or write the check script, point the CI step at it (plus the clone
fix), run it locally in the exact CI image (override the user to root, mark
the workspace a safe directory), then push. Worked example for a secret scan
with its self-test: [secret-scan.sh](secret-scan.sh).

- A new gate script must fall inside the coverage of the existing lint step:
  compare the glob's count with `git ls-files` right away.
- If a wrapper script exists, let the CI step call the new check directly
  and keep the wrapper branch only as local parity (no dead CI branch). A
  staged-only hook is allowed as a fast local complement, never as the CI
  mode, as long as CI scans the full history. Remove the wrapper's other
  superseded paths too (a previous-commit range branch, a `--full` mode, a
  staged-only fallback). A guard the wrapper already had is replaced by the
  new script and its old tests move with it.
- Commit order: every commit must be green on its own. A gate commit must
  not call a guard script that only exists in the next commit; the call and
  its parity assertion belong in the commit that adds the guard.
- A wrapper that runs a tool under a gate label must pass the `selftest`
  argument through too, so the label covers the self-test as well.
- Replacing a gate means extending its parity or guard tests, never
  loosening them: replace the assertions of the old structure by stricter
  ones, say so in the commit, and never remove an assertion to get green.
  Adding a guard test can require a change to the test step itself (a tool
  the guard needs in the image); that stays within the scope of the gate fix.

## Copies of a reference script across repositories

A copy goes stale. After every change to the reference:

1. `git grep -l <script name>` per repository, compare each copy with `cmp`
   and sync the deviating ones, one commit per repository.
2. Never use a local remote-tracking ref as the source (it can trail):
   read the default branch with `git ls-remote --symref <url> HEAD` (it may
   be `master`) and compare against the remote. Start with `git ls-tree origin/<default> <script path>`: no copy means a
   new gate with its own order of work, not a sync.
3. Per repository first run the step 0 orientation (hooks path included).
4. A repository with its own baseline lookup inside the script migrates to
   the `GITLEAKS_BASELINE` variable: set it in the CI step and in the local
   wrapper, for the real scan only, and check that the log shows
   `baseline: <path> (N entries)`; without the baseline the scan reports the
   known hits again.
5. When rebasing onto a peer's gate commit and a shared test list
   conflicts, check the new test files of that commit (`git show --stat`)
   for their own git helper and include them in the isolation test.
   A repository with a rule register or parity test needs the register
   change in the same commit, or its verify run turns red.
6. A cheap drift measurement is a sweep that runs `cmp` of every copy
   against each reference version (the current one and the previous one).
   Report which ref was measured: a working tree and a local origin ref can
   trail when a fetch fails without credentials.
7. After a script change, decide explicitly whether the existing copies
   follow and in which order: the new rules are stricter and can surface an
   error line that was hidden, so this is a behaviour change per repository
   and the owner's choice. Repositories with a protected pipeline get a
   patch, not a commit. A repository's own parity test that guards the
   script's content follows the script in the same commit and is never
   weakened; find these tests with `git grep -l <script name> -- tests`.
8. Check the damage per repository as its own evidence item (see the damage
   check in [selftest-patterns.md](selftest-patterns.md)); a sync does not
   show it.

## Triage and baselines for a scan on full history

Run the scan locally first and triage the hits (real, or a variable
reference). The same false positive in several repositories is better
handled by one scanner-config rule than by repeated baseline entries. A
baseline entry is only for a demonstrable false positive, with the reason in
the commit. A baseline is a limited, documented exception:

- apply it to the real scan only, never to the self-test;
- generate it with redaction, like the scan;
- regenerate it after a history rewrite or author change (entries match on
  all fields);
- log which baseline was used and how many entries it has.

Any allowlist or ignore file the scanner loads by itself is reviewed like a
baseline, and the self-test runs with the repository's own config.

## Pre-flight and debt

- A new test that calls `git` fails in a slim test image without it, so run
  new tests in the exact step image before the push. Per repository choose:
  install git in the step, or run the behaviour test in the scanner image
  (which has git) and keep only assertions in the slim one.
- Read numbers (a floor, a ratchet count) from the repository, not from an
  earlier message.
- Run the other existing gates (above all the dependency audit and the
  new-code quality gate) locally before the push, and again after adding a
  tool dependency for the new gate (it drags in its own advisories). New
  tests in the repository's own suite can trip quality rules too: the gate
  commit must not turn red for an unrelated reason.
- Run the formatter check on every new file, config files included, and
  chain the verification commands with `&&` so the first failure stops the
  chain: a gate commit once went red because a format check sat in a chain
  that kept going.
- When the default branch trails automated dependency merges that had no CI
  run, check whether the red cause was already there before your change (for
  example a lockfile whose platform fields make an install skip a native
  package in one image family).
- A package manager's auto-fix can crash on an older release: try the
  current major in a one-off runner before concluding that there is no fix.
- For a red audit one lookup decides the route: a patched version available
  (fix-available field, the advisory's first-patched version) means override
  or update; none means a documented ignore. Recipe:
  [dependency-audit.md](dependency-audit.md).
- A new working gate exposes existing debt. When the pipeline turns red
  after a gate push, first separate the cause (your change, or an advisory
  or finding underneath), read the details (severity, attack vector), look
  for an override path (resolver override, lockfile-only fix, pinned
  transitive version), fix, document. Never weaken the gate; an ignore comes
  last, with a reason and an expiry.

## Commit hygiene

- A repository rule that forbids commits or pushes by delegated agents
  conflicts with delegation: the orchestrator states explicitly in the
  instruction that the agent may push, and the report says so.
- Verify each commit landed (`git log -1`, clean `git status`), check that
  its author is the intended commit identity (older commits stay as they
  are; never rewrite shared history for it), and report the hash actually
  pushed (a rebase changes it). With bots or parallel sessions pushing,
  rebase onto the remote first.
- If the working directory is dirty or behind (someone else's work in
  progress), do the change in a temporary detached worktree of the remote
  default branch and push from there, leaving the checkout untouched. Read
  `git log -- <pipeline file>` and `git status` first and stage explicitly
  when another session edits the same file. Clean up afterwards (container
  output in the scratch area may be root-owned).
- A worktree is for commit and push, not a test environment: its `.git` is a
  file pointing to an absolute host path, so it fails as a bind mount, and a
  full-history scan in an image reports it as not a repository. A build in
  it needs its own install, not a symlinked dependency directory. Test in a
  fresh `git clone file://` with the changed files copied in. A local
  default branch can trail `origin/<default>` (which already has the gate
  commit), so a clone of the working repository can miss it: fetch the
  remote-tracking ref explicitly (`git fetch file://<repo>
  refs/remotes/origin/<default>:refs/heads/<name>`) or clone over the
  remote.
