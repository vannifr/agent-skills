# Agent Rules

Rules for an agent working in this repo: privacy, skill evaluation and working conventions.

## Profiel

- profiel: poort (public repo on GitHub, publishes skills to the Tessl registry; the design lists it as extern, own remote and CI make it poort in practice)
- kritiek: published skill content (public from its first commit), `.woodpecker.yml`, `scripts/simulation-exempt.txt`
- deploy: Tessl registry publication from this repo, only after the full "Definition of done for a public skill" in `CONTRIBUTING.md`; never as part of feedback processing
- gevoeligheid: public, English only, generic (no names, hosts, domains or figures from one run)
- check: `structure-lint`, `structure-tests`, `shellcheck`, `docs-check` (the steps in `.woodpecker.yml`)

## Privacy

- Never add the full name to files in this repo without an explicit check; LICENSE/copyright attribution and a public speaker's or author's byline on his own material are exceptions. Search the repo for the name before making anything public.

## Skill evaluation and feedback

- Before changing a skill based on an evaluation, retrospective or review, follow `CONTRIBUTING.md` "Evaluating a skill and processing feedback": triage every point into skill / project-host / drop first, and do not publish as part of it.
- Every skill needs a valid `skills/<name>/evals/simulation.md` (local RED-GREEN simulation) before `tessl eval run` or publication; `structure-lint` enforces it. Do not add a skill to `scripts/simulation-exempt.txt`.
- A new skill starts from `templates/skill/` and needs a registry overlap record in `skills/<name>/evals/overlap.md`.

## Agent working rules

- Global working rules: `~/.claude/CLAUDE.md`; not repeated here. Repository conventions: `~/projects/agent-config/tools/docs-check/check_repo_docs.py`.

## Backlog

- This repo has no `BACKLOG.md` yet. Add one when open work is queued, following `~/projects/backlog-system/docs/convention.md`; keep open items there rather than in plans or notes.
