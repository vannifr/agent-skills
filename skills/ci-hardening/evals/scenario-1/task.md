# Review a Pipeline Without Changing It

## Background

`inputs/` holds the CI pipeline file of a small web project, the script that
decides which directories to check (`scripts/changed-dirs.sh`), and the log
of the last run (`log-excerpt.txt`). The owner asks: "Review our CI, tell me
how reliable it really is. Do not change anything yet."

## Task

Write `REVIEW.md` with your findings: per gate what it claims, what the log
shows, the gap, a severity, and the fix you would propose. Do not edit any
file and do not push anything.
