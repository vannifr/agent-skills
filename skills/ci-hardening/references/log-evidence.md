# Which log line counts as evidence

A step is only evidence when its log shows a count above zero. If the tool
prints nothing countable, add a line that does (e.g. count the inputs
before running it) or reject the step as unproven.

| Tool | Evidence line | Red flag |
|---|---|---|
| Secret scanner (e.g. gitleaks) | "N commits scanned" with N > 0 | "0 commits scanned", "no leaks found" without a count |
| Shell linter (e.g. shellcheck) | the file list or a count equal to the `git ls-files` shell files | fewer files than the repository has |
| Bats | TAP plan `1..N` with N equal to the expected test count | missing plan, N lower than the ratchet baseline |
| Node test runner (`node --test`) | `# pass N` and `# fail 0`, N > 0 | `# tests 0` |
| Code-quality server (e.g. SonarQube) | `QUALITY GATE STATUS: PASSED` plus the new-code condition values | analysis submitted but no gate status fetched |
| Dependency audit | the number of packages/lockfiles scanned | scanned 0 lockfiles |

Rules of thumb:
- Quote the line with the pipeline number; do not paraphrase.
- Compare the count against an independent source (`git ls-files | wc -l`,
  `git rev-list --count HEAD`), not against the tool's own idea of its input.
- A count that is correct today can fall to zero tomorrow (a moved
  directory, a shallow clone): put the "> 0" check in the pipeline itself.
