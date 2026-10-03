# Finish and Harden the CI Pipeline for a Half-Configured Project

## Background

You are taking over `link-checker`, a small Node.js tool. A teammate started
wiring up CI last week and left it half-finished. The files are in `inputs/`:
- `package.json`
- `.woodpecker.yml`
- `.githooks/pre-commit` and `.githooks/pre-push`
- `scripts/` (local check scripts)
- `NOTES.md` — the teammate's handover notes

## Task

Make the CI pipeline and the local verification setup ready to rely on:
fix what is unfinished, make sure CI and local cannot drift apart again, and
report which gaps you found and fixed. Also state what you would report as
evidence that the result is healthy.

## Output

Write your findings to `AUDIT.md`. For each change, name the file and the
change. You may apply the changes to the files in the working directory.
