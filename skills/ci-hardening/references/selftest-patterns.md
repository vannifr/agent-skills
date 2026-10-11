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

Run the scanner on `$tmp` with a JSON report, using the repository's own
scanner config when it has one: an allowlist that excludes everything would
otherwise disable the real scan while the self-test stays green. Assert on the **finding in
the report** (e.g. grep for `"RuleID"`), not on the exit code: a tool crash
also exits non-zero and would make a broken scanner look healthy.

## Tracked environment file

Create a throwaway repository, `git add` a `.env`, and assert the
"no env files tracked" check fails on it.

## Deliberate lint error

Write a file with a known violation (e.g. an unquoted variable in a shell
script) into a temp directory and assert the linter exits non-zero **and**
names the rule.

## Test-count ratchet

In a temp repository, delete a test without the waiver (e.g. a commit
trailer) and assert the ratchet fails; repeat with the waiver and assert it
passes.
Also assert it fails hard (not skips) when the base reference is missing.

## Rules

- Self-tests run in CI and locally, from one script.
- The clean run must also pass: assert both the failing and the passing
  case, otherwise a gate that always fails looks proven.
- Never commit the planted violation to the real tree.
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
  HEAD: use "at least", never equality. Measure the floor in a fresh clone
  with only the default branch, not in a working repository.
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
