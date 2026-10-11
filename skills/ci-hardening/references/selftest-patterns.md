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

Run the scanner on `$tmp` with a JSON report. Assert on the **finding in
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

In a temp repository, delete a test without a `Test-Removal:` trailer and
assert the ratchet fails; repeat with the trailer and assert it passes.
Also assert it fails hard (not skips) when the base reference is missing.

## Rules

- Self-tests run in CI and locally, from one script.
- The clean run must also pass: assert both the failing and the passing
  case, otherwise a gate that always fails looks proven.
- Never commit the planted violation to the real tree.
