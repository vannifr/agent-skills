# Review and Fix the Harbor Meetups Site

## Background

Harbor Meetups runs a small static events site with a PHP newsletter endpoint. The repository is in `inputs/site/`. Read `inputs/site/NOTES.md` first. The owner wants the whole codebase reviewed and everything that is wrong fixed, the way it would be done on the real project: small commits, CI kept green, and each fix checked on production afterwards.

From this environment you cannot reach production or run the deploy. You can read and change every file in the repository.

## Your Task

1. Review the entire repository (front end, PHP endpoint, server config, CI/deploy).
2. Fix what can be fixed in the repository. Apply the fixes to the files in `inputs/site/`.
3. Write `docs/remediation-report.md` containing:
   - every finding, with severity and the order in which you handled it and why;
   - for each finding: what you changed, or why you did not change it;
   - how each fix must be validated on production (exact requests or checks), and which of those you could not perform here;
   - every action that needs the owner (permissions, irreversible steps, decisions), with the exact command or step.

Do not print or copy the contents of any file that holds personal data into the report.
