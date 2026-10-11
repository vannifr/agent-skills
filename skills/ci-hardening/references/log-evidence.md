# Which log line counts as evidence

A step is only evidence when its log shows a count above zero. If the tool
prints nothing countable, add a line that does (e.g. count the inputs
before running it) or reject the step as unproven.

Examples per tool class; the pattern is always "a count above zero, plus
a red flag". Add rows for your own stack.

| Tool class | Evidence line | Red flag |
|---|---|---|
| Secret scanner (e.g. gitleaks) | "N commits scanned" with N > 0; a full-history run equals the commit count | "0 commits scanned", "no leaks found" without a count. "1 commit" is legitimate for a range scan, but then a full-history scan must exist elsewhere |
| Shell linter (e.g. shellcheck) | the file list or a count equal to the `git ls-files` shell files | fewer files than the repository has |
| Bats | TAP plan `1..N` with N equal to the expected test count | missing plan, N lower than the ratchet baseline |
| Node test runner (`node --test`) | `# pass N` and `# fail 0`, N > 0 | `# tests 0` |
| Code-quality server (e.g. SonarQube) | `QUALITY GATE STATUS: PASSED` plus the new-code condition values | analysis submitted but no gate status fetched |
| Python linter/formatter (e.g. ruff) | files checked/formatted count, rule families selected | "All checks passed" with no count, default rules only |
| Python test runner (e.g. pytest) | "N passed" with coverage % against a floor | N below the floor file, coverage with no floor |
| Secret scanner in directory mode | no commit count exists, so a separate history scan is required | directory mode as the only secret scan |
| Static analyzer in quiet mode (e.g. semgrep `--quiet`) | a rules/files count or a summary line | quiet output with no summary |
| Lighthouse-style audit | the score per category and the tool version | greeting or help text only, exit 0 |
| Load test (e.g. k6) | check/threshold results with counts | thresholds undefined, so nothing can fail |
| E2E or accessibility run | pass count, and the job fails on serious findings | findings logged but the step still exits 0 |
| Container/config linters | a printed file count or finding list | header line only, no output |
| Dependency audit | the number of packages/lockfiles scanned | scanned 0 lockfiles |

Red flags that look like success:
- `stderr is not empty`, `invalid revision range` or a fetch error printed
  by a step that still exits 0: the tool failed and a fallback or an
  ignored status hid it.
- A fallback chain where step A fails and fallback B scans 0 items
  (`A 2>/dev/null || B`): exit 0, zero coverage.

Mandatory check per scan step, also when the step exits 0: the "scanned"
count is above zero **and** the log has no error lines (`ERR`, `fatal`,
`could not read Username`, `invalid revision range`). Count them with
`grep -c`; an error line next to a green status is a failed scan.

Rules of thumb:
- Quote the line with the pipeline number; do not paraphrase.
- Compare the count against an independent source (`git ls-files | wc -l`,
  `git rev-list --count HEAD`), not against the tool's own idea of its input.
- A count that is correct today can fall to zero tomorrow (a moved
  directory, a shallow clone): put the "> 0" check in the pipeline itself.
- When the independent count has known exceptions (e.g. commits without a
  diff that a history scanner skips), encode the exception in the check
  rather than loosening it, and assert the clone is complete separately.

## Pull the evidence from every step in one go

List the step names first (the pipeline info command of your CI CLI), then
loop over them and grep the evidence patterns:

```sh
for step in <step names>; do
  echo "== $step"
  <log command> "$run" "$step" | grep -iE 'scanned|passed|files|tests|# pass|checked'
done
```

Inventory template: step | claim | log evidence (quoted) | files seen vs
`git ls-files` | must-fail proof | gap.
