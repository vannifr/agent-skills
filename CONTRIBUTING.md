# Contributing

## Pull requests

- Every PR runs `structure-lint` (frontmatter validity, `SKILL.md` line
  limit, working relative links, no placeholder text) — this needs no
  secrets and runs on PRs from forks too.
- A PR that touches `skills/**` also runs a Tessl quality-gate review
  (`tessl review run quality --threshold 80`) on the changed skill
  directories. That step needs a `TESSL_TOKEN` repository secret, which
  isn't available to fork PRs by GitHub's own design — on a fork PR you'll
  see it skip with an explicit note, not fail silently. A maintainer runs
  it manually before merging in that case.

## Adding a new skill

1. Create `skills/<name>/SKILL.md` with YAML frontmatter (`name`,
   `description` — see any existing skill for the format).
2. Keep it tool-agnostic: no instructions specific to one coding agent's
   tool names or CLI flags unless the skill's entire subject *is* that
   tool.
3. Keep `SKILL.md` under 500 lines; split detail into `references/` files
   linked from the body.
4. Run `node scripts/structure-lint.mjs` locally before opening a PR.

## Updating an existing skill's behavior

If a change is meant to alter how the agent behaves (not just wording), a
matching `evals/` scenario is the way to actually verify it worked —
a passing `structure-lint`/content review only says the skill reads well,
not that it changes outcomes. Add or update a scenario under
`skills/<name>/evals/`, run `tessl eval lint ./skills/<name>/evals/` to
validate it, and — if you have Tessl credits available —
`tessl eval run ./skills/<name>` to confirm the fix actually moves the
score. Eval runs consume real credits (roughly 100/scenario to generate,
tens of credits to run), so this step is encouraged, not required, for
every PR; a maintainer may run it before merging a significant change if
the contributor can't.

## Style

- English only — code, docs, commit messages.
- Conventional commits (`feat:`, `fix:`, `docs:`, ...).
