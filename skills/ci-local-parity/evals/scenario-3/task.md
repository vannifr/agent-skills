# Audit a Project's CI and Local Verification Setup

## Background

You have inherited `doc-evidence-tools`, a small Node.js tool that checks
markdown research documents against a set of evidence rules. The team
considers the project healthy: the pipeline has been green for weeks, there
are git hooks, a single `verify` command, and static analysis.

The project files are in `inputs/`:
- `package.json`
- `.woodpecker.yml`
- `.githooks/pre-commit` and `.githooks/pre-push`
- `sonar-project.properties`
- `scripts/` (the project's own document linter) and `test/`
- `git-log.txt` — the recent commit history with diffstats

## Task

Audit this project's CI and local verification setup and list concrete gaps
with fixes, prioritised. Also state what you would report as evidence that
the pipeline is healthy after your fixes.

## Output

Write your findings to `AUDIT.md`. For each gap, give the fix concretely
(the file and the change), not just a description of the problem. If a fix
is a code or config change, you may also apply it to the files in the working
directory.
