# Contributing

## Pull requests

- Every PR runs `structure-lint` (frontmatter validity, `SKILL.md` line
  limit, working relative links, no placeholder text) — this needs no
  secrets and runs on PRs from forks too.
- The Tessl quality-gate review (`tessl review run quality --threshold 80`)
  costs Tessl credits, so CI runs it only on a **manual** pipeline, never on
  push or PR. Start it in the CI UI ("Run pipeline"); by default it reviews
  the skill directories changed in the last commit, or set the variable
  `REVIEW_SKILLS="skills/<name> ..."` to choose. Locally:
  `tessl review run quality --threshold 80 skills/<name>`. The step needs a
  `TESSL_TOKEN` secret.

## Adding a new skill

0. This is the **public** skill repo. There's a separate **private** one
   (`agent-config/claude-code/skills/`) for personal/business-specific
   skills that shouldn't be tool-agnostic or publicly reusable. No skill
   name should exist in both — check `ls ~/projects/agent-config/claude-code/skills`
   first. See that repo's README ("Waar hoort een nieuwe skill?") for the
   placement rule.
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

## Evaluating a skill and processing feedback

Feedback on a skill arrives from three places: a retrospective after a
real run, an eval run, and someone's review ("4/5, missing X"). None of
it goes into the skill unfiltered — most suggestions are true about the
run, not about the skill.

### 1. Evaluate

**Local comparison (no credits)** — the quickest way to see whether a
skill changes outcomes, and to collect concrete friction:

1. Copy a scenario's `task.md` and `inputs/` into two fresh scratch
   directories, outside the repo.
2. Run two agents on the same model, in parallel: one told to read and
   follow `skills/<name>/SKILL.md` (and **not** its `evals/`), one told
   to use no skills. Ask the with-skill agent to end with a list of
   places where the skill was unclear, contradictory or made it guess.
3. Score both outputs against the scenario's `criteria.json` yourself
   (or with a third agent), not by the agents that produced them.
4. Read the result critically:
   - With-skill ≈ without-skill → the skill adds nothing there, **or**
     the scenario leaks the answer in its task text. Fix the scenario
     before drawing conclusions about the skill.
   - One run per variant is a signal, not proof. Don't quote the score
     as a measurement.

**Official (costs credits)** — `tessl eval run ./skills/<name>` before a
publish that changes behavior; see "Updating an existing skill's
behavior" above.

### 2. Triage every feedback point

Sort each point into exactly one bucket before editing anything:

| Bucket | Test | Goes to |
|---|---|---|
| **Skill** | It's about the skill's own job, and would help on another project, another agent and another host | The skill |
| **Project / host** | True, but about this project, this agent, this CI or this model (which reviewer agent loops, how to poll this CI, token limits of this host) | That project's `AGENTS.md`/`CLAUDE.md`, or global agent config |
| **Drop** | Already covered (check which skill version the feedback was based on), an artifact of how the eval task was worded, a one-off edge case, or a request for numbers nobody measured | Nowhere — note in the commit message why it was dropped, if it was a prominent point |

Red flags that a point belongs in "Project / host" or "Drop": it names
a specific agent, model or CI tool; it's about efficiency of the run
rather than quality of the result; it adds a new rule that competes
with an existing one instead of sharpening it.

### 3. Apply

- **Tighten before adding.** Prefer sharpening or merging an existing
  section over a new one; remove overlap you find on the way. A skill
  that grows every round gets followed less.
- **Behavior change → eval criterion.** Add or update a criterion in
  `evals/` for each change meant to alter what the agent does, and run
  `tessl eval lint ./skills/<name>/evals/`.
- **Scripts test-first.** A fix to `scripts/` gets a failing test in
  `scripts/*.test.mjs` first.
- **Keep it registry-clean**: tool-agnostic, no personal wording, no
  invented figures, links working (`node scripts/structure-lint.mjs`).
- **Commit** with the source of the feedback in the message (e.g. "from
  a local eval of scenario-3", "from a real-run retrospective") and one
  commit per coherent change.
- **Don't publish** as part of processing feedback. Republishing to
  Tessl is a separate decision; see below.

## Publishing a skill to Tessl

Not every skill in this repo belongs on the Tessl registry. Publishing makes
a skill installable by anyone (`tessl install vannifr/<name>`) and
searchable by any agent running `tessl search` — including agents working
for other people, not just this repo. Concretely, publishing buys:

- **Discovery beyond this repo.** Manual/symlink install only reaches
  someone who already knows this repo exists; a registry entry is found by
  a `tessl search` for the problem, the same way `testland/*` and other
  third-party skills get found.
- **One-line install** (`tessl install vannifr/<name>@x.y.z`) for any
  Tessl-CLI/MCP-enabled tool — no cloning, no symlinking.
- **An external quality signal.** `tessl review run quality --threshold 80`
  scores the skill against Tessl's own rubric — a different, less
  self-serving check than our own review. `tessl eval run` goes further and
  measures whether the skill actually changes agent behavior for the
  better, not just whether it reads well.
- **Version tracking for consumers.** Anyone who installed it via Tessl
  gets `tessl outdated`/`tessl update` when you republish; a manual
  symlink never notifies anyone of anything.

That value only materializes if the skill isn't redundant with something
already on the registry — a duplicate just adds registry noise. Check for
that before publishing:

### 1. Check for overlap first

```bash
tessl search "<topic keywords>"
```

(or `mcp__tessl__search` from an MCP session). Read the top results'
*descriptions*, not just titles — two skills can share a subject but cover
different scope. Example: `testland/responsive-breakpoint-runner`
aggregates results from *existing* Percy/Chromatic/Storybook baselines;
this repo's `responsive-visual-review` is baseline-free and needs none of
those tools installed — same subject, opposite premise, both legitimately
worth having.

**Publish only if you can write one sentence that's still true after
reading the closest existing match.** Write that sentence *before* you
publish — it becomes the skill's "What makes it different" row in the
README table below, so a future contributor can re-run this same check
without re-deriving it from scratch.

**Don't publish if** a well-maintained match already exists — an official
vendor skill is a strong signal of redundancy (e.g. Grafana's own
`k6-perf-test-website` already covers "bootstrap a k6 load test against my
site" end to end). That skill just stays in this repo for local/manual use;
no registry entry needed, and that's not a defect in the skill.

### 2. Quality gate

```bash
tessl skill lint skills/<name>                                    # publishability (frontmatter, structure)
tessl review run quality --workspace vannifr --threshold 80 skills/<name>  # content quality
```

The quality review is the same command CI runs manually (Woodpecker UI "Run
pipeline" with `REVIEW_SKILLS=skills/<name>`; it costs Tessl credits, so it
never runs on push/PR — see "Pull requests" above). Fix anything below 80
before publishing.

If this publish accompanies a *behavior* change, add/update
`skills/<name>/evals/` first per "Updating an existing skill's behavior"
above — a quality score only says the skill reads well.

### 3. Publish

```bash
tessl skill publish skills/<name> --workspace vannifr --public --dry-run   # check first
tessl skill publish skills/<name> --workspace vannifr --public             # then for real
```

(MCP equivalent: `mcp__tessl__skill_publish` with `path`, `workspace`,
`public: true`.) **`--public` is not the default** — omitting it publishes
privately, visible only to your own Tessl account, which defeats the point.
The command auto-bumps the patch version on republish (`--bump minor|major`
to override), so `.tessl-plugin/plugin.json`'s `version` is never
hand-edited.

### 4. Commit the result

Publishing writes/updates `skills/<name>/.tessl-plugin/plugin.json`
(`name`, `description` mirrored from `SKILL.md`, `skills: ["."]`,
`version`). Commit it:

- First publish: `chore: add Tessl manifest files from publish`
- Republish after a content change: `chore: bump <name> manifest to X.Y.Z
  from republish`

### 5. Update the README

Add a row to the "Skills" table with the "What makes it different" sentence
from step 1.

## Style

- English only — code, docs, commit messages.
- Conventional commits (`feat:`, `fix:`, `docs:`, ...).
