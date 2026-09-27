# Monthly NFR Check for the Northwind Docs Site

## Background

Northwind Docs is a static documentation site (Astro, deployed to a CDN, two locales: English and Dutch). Three months ago the team ran a full NFR audit; its report is at `inputs/skill-audit-report.md`. Since then the team has shipped a redesign of the navigation and a new search modal.

The team lead wants the monthly NFR check done before Friday's release. They don't have time for another multi-day audit — they want to know what has changed since last time and what needs attention before release.

Today's tool output has already been collected for you in `inputs/current-measurements.md`, and a summary of what changed in the repository since the prior audit is in `inputs/changes-since-audit.md`. You can't run the tools again yourself; use the collected output.

## Output Specification

Write your findings as a markdown file under `docs/`. Also say in one or two sentences, at the top of that file, what kind of audit you ran and why. Don't modify `inputs/skill-audit-report.md`.
