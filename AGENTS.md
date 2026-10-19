# Agent Rules

Rules for an agent working in this repo: privacy, skill evaluation and working conventions.

## Privacy — full name in content

- Never add the full name "Frederik Vannieuwenhuyse" to files in this repo (code, docs, configs, UI copy, generated content) without an explicit check.
- Two cases don't need confirmation: LICENSE/copyright attribution, and content where the name is the byline/attribution of a public speaker or author on his own material (e.g. a speaker bio, a personal site's own content).
- Any other case — and always before making this repo public — requires searching the repo for the name and getting explicit confirmation before adding or keeping it.
- Commit author identity is a separate concern (see the git identity rule) and is not covered by this rule.

## Skill evaluation and feedback

- Before changing a skill based on an evaluation, retrospective or review, follow CONTRIBUTING.md "Evaluating a skill and processing feedback": triage every point into skill / project-host / drop first, and don't publish as part of it.
- Every skill needs a valid `evals/simulation.md` (local RED-GREEN simulation) before `tessl eval run` or publication; `structure-lint` enforces it. Do not add a skill to `scripts/simulation-exempt.txt`.
- A skill is public from its first commit: English only, generic (no names, hosts, domains or figures from one run), a registry overlap record in `evals/overlap.md`, and every row of CONTRIBUTING.md "Definition of done for a public skill". Start from `templates/skill/`.

## Agent working rules

- The global working rules (session goal, mandate, learning loop, open-question format, cross-session communication) live in `~/.claude/CLAUDE.md` and the `goal` skill; do not copy them into this file.
- Formulate a goal with criteria that a command can check before substantial work; stop and write an open decision for a user-owned decision or a high-impact assumption without evidence.
- Other Claude sessions can work on this machine: check `ListAgents` before editing a repo another session changes.
- Repository conventions are checked by `scripts/docs-check/check_repo_docs.py` (AGENTS.md, CLAUDE.md, README.md); keep `AGENTS.md` under 200 lines and put long procedures in a document or skill.

## Backlog

- This repo has no `BACKLOG.md` yet. Add one when open work is queued, and keep open items there rather than in plans or notes.
