# Woodpecker CI pitfalls

Written for Woodpecker; the same questions apply to other CI systems.

## Clone and variables

- **The default clone is shallow and partial** (`--depth=1 --filter=tree:0`)
  and steps have **no** forge credentials, so a `git fetch` inside a step
  fails (symptom in the log: `could not read Username`, followed by a green
  step because the fetch ended in `|| true`). Diff-based and history scans
  see one commit, or fail with "invalid revision range" and a fallback then
  checks an empty staged diff. Fix: a `clone:` block with the git clone
  plugin pinned by digest, `depth: 0` and `partial: false`; then make the
  wrapper count what it scanned and fail on 0 or on fewer than the commits
  with added non-binary lines in the range.
- **Change detection is the same trap:** a step that lists changed
  directories from `CI_PREV_COMMIT_SHA..CI_COMMIT_SHA` and prints "invalid
  revision range" followed by "no changes" is vacuous. An invalid range
  means "run everything"; begin equal to end (a restart) with 0 changed
  files is a legitimate no-op, and the step should log it as such.
- **Variable names:** the previous commit is `CI_PREV_COMMIT_SHA` (empty on
  a first or forced push). A variable like `CI_COMMIT_BEFORE` does not
  exist; it expands to empty and turns the diff branch into dead code that
  always takes the "first push" path. A step often calls a repository script
  that scopes itself by this variable: audit that script too.
- **Escape runtime variables with `$$`.** A single `$VAR` in the pipeline
  file is substituted at parse time, usually to an empty string.

## Shape

- **Declare dependencies** (`depends_on`) so cheap blocking gates run first
  and reporting steps wait for the results they report on.
- **Path filters on individual steps only.** A pipeline-level
  `when: path: exclude` skips the whole pipeline, secret scan included. A
  YAML anchor (a list under a `variables:` key, referenced with an alias on
  the heavy steps) avoids repeating an identical filter on many steps.
  Verify with the step list of a run for a real documentation change
  (`pipeline ps`): only the gate steps should have run.
- **Scheduled runs** use `event: cron`; confirm one ever ran with
  `woodpecker-cli pipeline ls <repo> --event cron` (older CLI versions have
  no cron subcommand to list or trigger schedules).
- **A restart reuses the old commit.** Restarting a scheduled run after a
  fix does not test the fix; trigger a new run on the fixed commit.
- **A hanging or network-failed step:** stop the run and restart it
  (`pipeline stop` / `pipeline start <repo> <number>`), after first proving
  that the gate you changed was already green. Give such steps a timeout.
- **Phantom workflow slots:** a step that stays "running" with no container
  while a restart stays "pending", and the agent log shows `task not found`,
  means the agent's workflow capacity is held by phantoms. Restart the agent,
  stop the orphaned run, start it again.
- **Advisory steps:** list every step with `failure: ignore`; each needs a
  written reason.
- **Secret-fetching steps failing with an auth error** and no code cause
  often mean the secret store is sealed or unreachable; fix that before
  touching the pipeline.

## Tooling

- **Lint the pipeline file** before pushing: `woodpecker-cli lint
  .woodpecker.yml`. It accepts what that CLI version accepts; a pipeline can
  pass lint locally and still fail on a newer or older server.
- **Test a step in its exact CI image** with the user overridden to root and
  the workspace bind-mounted: add
  `git config --global --add safe.directory <path>` first, or git refuses
  to read the mounted repository.
- **Pin by digest.** Look digests up in the registry, never type a
  plausible-looking hash:
  `for i in <image:tag> ...; do skopeo inspect --format '{{.Digest}}' docker://$i; done`
- **Step names:** `woodpecker-cli pipeline ps <repo> <number>` (in older CLI
  versions `pipeline show` does not list steps; take them from the pipeline
  file). `--output table=<columns>` selects columns in list commands.
- **Fetch every step log of a run into files, then grep the files:**
  `for step in <names>; do woodpecker-cli pipeline log show <repo> <number> "$step" > "logs/$step.txt"; done`
  The CLI may print a version-warning JSON line into the stream; filter it
  out before grepping.
