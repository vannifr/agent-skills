# Must-fail templates (self-tests that run in CI)

A gate is proven when it fails on a deliberate violation. Put these in the
pipeline (or in a script the pipeline calls) so the proof is re-run on
every push, not shown once.

## Planted secret

Assemble the fake secret at runtime from parts, so the repository scan does
not flag the self-test itself:

```sh
part1='AKIA'; part2='IOSFODNN7EXAMPLE'
printf 'key = "%s%s"\n' "$part1" "$part2" > "$tmp/planted.txt"
```

The planted value in the bundled script is built the same way, in two
parts. If a scanner still flags the script itself, allow that one path in
the scanner config; do not add it to a baseline.

Run the scanner on `$tmp` with a JSON report, using the repository's own
scanner config when it has one: an allowlist that excludes everything would
otherwise disable the real scan while the self-test stays green. Assert on the **finding in
the report** (e.g. grep for `"RuleID"`), not on the exit code: a tool crash
also exits non-zero and would make a broken scanner look healthy.

## Tracked sensitive files

Create a throwaway repository, `git add` a set of planted files, and assert
the guard reports each one by name. Cover more than `.env`: environment
files (except an example file), browser profile and cookie files, session
and storage-state files, token files. Keep an explicit exception list for
scripts that legitimately carry such words in their name. The guard must
also fail when it finds 0 tracked files at all (a blind guard), and its
success line should state how many tracked files it checked.

## Deliberate lint error

Write a file with a known violation (e.g. an unquoted variable in a shell
script) into a temp directory and assert the linter exits non-zero **and**
names the rule.

## Test-count ratchet

In a temp repository, delete a test without the waiver (e.g. a commit
trailer) and assert the ratchet fails; repeat with the waiver and assert it
passes.
Also assert it fails hard (not skips) when the base reference is missing.

## Impossible-assertion self-test (score or report based gates)

For a gate that evaluates reports (e.g. a performance or accessibility
audit): require one report per configured URL, print the scores, and in CI
also run the gate against an assertion that cannot hold (a score above the
maximum) and require that it fails. A tool resolved to the wrong package, or
a gate that reads no report, then fails instead of printing a greeting.

## Test the shallow-clone guard with a real shallow clone

Make the `--depth=1` test clone (from the working tree with `file://`) of a
repository that contains the script itself, or the test fails on "file not
found" instead of on the guard. Assert the exact failure message and exit
code of the guard, not only a non-zero exit.

## Prove the guards of a gate script without the real tool

The checks around a scanner (shallow or partial clone, 0 scanned, a count
below the lower bound, a blind scanner) can be tested with a stub scanner on
the PATH: it prints a "N commits scanned" line, and reports a finding only
when it sees the planted file. Each guard then gets a test that provokes
exactly that failure, so the guards themselves are proven, next to the
self-test that proves the scan. The pattern is language independent (it
has been written in Python, Node and bats): the stub keeps its state in the
test's own temporary directory. The stub must not grep its own source for a
token prefix (a fixture script containing `ghp_` reported a false secret):
match a complete token pattern. Docker or drill output (dependency
directories) can be root-owned and stays in the scratch area.

## Baseline recipe (secret scanner)

Generate it once with redaction (`<scanner> git --redact --report-format
json --report-path <baseline-file> .`), triage every entry (placeholders such
as `YOUR_API_KEY` in vendored documentation are false positives; anything
else is a real finding to rotate, not to baseline), keep the reason in the
commit, and review it like an allowlist. When the same vendored directory
produces the entries in several repositories, excluding that directory in
the scanner config is one line instead of one baseline each.

## Rules

- Self-tests run in CI and locally, from one script.
- The clean run must also pass: assert both the failing and the passing
  case, otherwise a gate that always fails looks proven.
- Never commit the planted violation to the real tree.
- A self-test or test that runs `git init` or `git commit` itself must be
  isolated when a git hook starts it. A hook exports `GIT_DIR` and other
  `GIT_*` variables; without isolation the "temporary" commands act on the
  real repository (seen: extra planted commits, and `core.bare` flipped to
  true so `git status` failed). Unset them first (in shell: `for v in $(git
  rev-parse --local-env-vars); do unset "$v"; done`) and use a temporary
  directory. Prove it with a test that starts the self-test with `GIT_DIR`
  and `GIT_INDEX_FILE` pointing at a real scratch repository and asserts
  that its config, commit count and refs are unchanged (a stub scanner on
  the PATH keeps that test free of the real tool). Inside the self-test,
  asserting that `git rev-parse --show-toplevel` equals the temporary
  directory catches a leak early. Reusable form, in any test language:
  make a scratch repository with one commit, record `git -C $s config
  core.bare`, `git -C $s rev-list --all --count` and `git -C $s
  for-each-ref | sha1sum`, run `GIT_DIR=$s/.git GIT_INDEX_FILE=$s/.git/index
  sh scripts/secret-scan.sh selftest`, then assert that all three are
  unchanged. Also record a hash of `.git/config` and of the index: a script that only
  runs `git config` leaks into the config without changing commits or refs.
  Mutation proof: the test fails against the old script; a fixture that
  already scrubbed legitimately gives no red mutation, which is a valid
  per-file outcome and not a test defect.
- Damage check after such a leak, as its own evidence item per repository
  (a sync does not show it): `core.bare` is false, no `user.*` section that
  the repository did not have in its config, and no commits with the exact
  subjects the self-test uses (`git log --all --grep='^planted$'
  --grep='^clean$'`; a loose `clean` grep gives false alarms). `git fsck
  --lost-found` always lists dangling stash and amend leftovers, so it is no
  signal without a look at their content. After removing stray `user.*`
  keys the effective identity falls back to the global one: check it, and
  commit with an explicit inline identity. Also check
  `git config --local --list | grep -E '^user\.'`: restoring `core.bare`
  can leave a stray `user.name` or `user.email` behind. A worktree shares
  the repository config with the main checkout and other worktrees, so that
  damage reaches peer sessions too. An isolation-test fixture must not
  inherit a user section: assert that no local `user.*` key appears. Cover
  the global-config variant too: through `GIT_CONFIG_GLOBAL` set a failing
  pre-commit hook and `commit.gpgsign=true` and require that the self-test
  still passes (a second mutation proof next to the `GIT_DIR` leak). A
  helper alone is not enough: product code under test that calls git itself
  also inherits `GIT_*`, so scrub the variables for the whole suite (an
  autouse fixture or the runner's environment). A fixture leak shows in the
  mutation proof as a setup error rather than an assertion failure: a
  non-zero exit with no passing test is the proof.
- The error-line guard of the script matches `' (ERR|FTL) '` with a
  leading space: a stub must write its error line with a timestamp prefix
  (`10:00AM ERR ...`) or the guard does not trigger.
- The self-test's own log line (e.g. "selftest ok: clean passes, planted
  secret reported") is the must-fail proof in CI: it re-runs on every push.
  A real leak turning a pipeline red once is nice evidence, not a
  requirement.

## Expected-count pitfalls (history scanners)

- A history scanner skips commits without added lines (delete-only) and
  binary-only commits. Derive the expected count from commits with at least
  one added non-binary line (`git log --numstat`, where binary files show
  `-`), and test that logic on a temp repository holding a text, a
  binary-only and a delete-only commit.
- It scans all refs by default, so the logged count can exceed the count on
  HEAD: use "at least", never equality. The script computes the floor in the
  CI clone itself; to reproduce it locally use a fresh clone with only the
  default branch. A local clone can hold extra remote branches and notes
  refs that CI never sees, so local numbers differ: take the proof from the
  CI run.
- Use a unique commit marker in `git log` parsing; `@` collides with hunk
  headers (`@@`) when patches are printed.
- A shell wrapper or hook may truncate or rewrite `git log` output; compute
  counts with the raw command, ideally in the CI image.

## Reproduce a vacuous diff scan mechanically

Prove the failure on a depth-1 clone instead of trusting the log:

```sh
git clone --depth=1 file://"$PWD" "$tmp/shallow"
cd "$tmp/shallow" && <scanner> <range scan over PREV..HEAD>
```

The scan must fail or report a count above zero. If it exits 0 with
"0 scanned", the gate is vacuous in CI for the same reason.
