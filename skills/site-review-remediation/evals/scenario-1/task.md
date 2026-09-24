# Make the Lumen Talks Quality Gates Real

## Background

Lumen Talks is a small static site in `inputs/site/`. Read `inputs/site/NOTES.md`. CI is green, and the owner assumes that means every page is linted, validated and accessibility-checked. They want the CI and local checks reviewed and fixed so that green actually means something, without turning CI red on the next push.

## Your Task

1. Review `package.json`, the linter configuration and `.github/workflows/ci.yml`, and determine what the checks really cover today. Run them if you can.
2. Fix the configuration so every HTML page is really checked, and fix the HTML errors that then appear.
3. Decide which checks become blocking and which stay advisory, and justify it.
4. Write `docs/quality-gates-report.md` with: what each check covered before and after (with evidence such as the number of files scanned), every change you made, the order in which you made them, and what you deliberately left advisory and why.
