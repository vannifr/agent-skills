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
- **Branch names in examples:** a `when: branch:` copied from an example
  must match the repository's default branch (`main` or `master`).
- **Variable names:** the previous commit is `CI_PREV_COMMIT_SHA` (empty on
  a first or forced push). A variable like `CI_COMMIT_BEFORE` does not
  exist; it expands to empty and turns the diff branch into dead code that
  always takes the "first push" path. A step often calls a repository script
  that scopes itself by this variable: audit that script too.
- **Escape runtime variables with `$$`.** A single `$VAR` in the pipeline
  file is substituted at parse time, usually to an empty string.

## Shape

- **Declare dependencies** (`depends_on`) so cheap blocking gates run first
  and reporting steps wait for the results they report on. Note that
  `depends_on` on one step makes every step without it run in parallel, not
  in file order; to keep a flaky external gate from skipping anything,
  either order the steps sequentially in the file and guard "external gate
  last" with a test, or give every step a `depends_on`.
- **Path filters on individual steps only.** A pipeline-level
  `when: path: exclude` skips the whole pipeline, secret scan included. A
  YAML anchor (a list under a `variables:` key, referenced with an alias on
  the heavy steps) avoids repeating an identical filter on many steps.
  Check that every other step keeps its own exclude and that steps
  depending on a skipped step behave as intended. Verify with the step list
  of a run for a real documentation change (`pipeline ps`): only the gate
  steps should have run. A noise commit to trunk is not acceptable: without
  a real change and the owner's consent report "not verified".
- **Scheduled runs** use `event: cron`; confirm one ever ran with
  `woodpecker-cli pipeline ls <repo> --event cron` (older CLI versions have
  no cron subcommand to list or trigger schedules). A scheduled gate is
  proven only by a run with the schedule event on a commit that contains the
  fix; when that is impossible (no manual trigger, schedule not due) report
  "not verified" with the reason. An optional manual event on the scheduled
  pipeline makes it provable.
- **A scheduled gate that never finishes is unproven.** List the runs of the
  schedule and check their status: `killed` on the repository time-out
  counts as no run (seen: three of three runs killed). A schedule in YAML
  without a run proves nothing, and the run list of an API or MCP is paged
  and often has no timestamps, so count runs per event instead of reading
  the first page. The schedules themselves come from the CLI's cron
  listing, not from the YAML.
- **The first finished run of a gate that used to be killed exposes the
  existing findings.** Decide beforehand whether the step stays blocking or
  becomes advisory, and plan the repair: fixing the time-out does not fix
  the findings. Splitting the work over parallel steps (sharding) needs a
  parity test: every input exactly once, the sum equal to the unsharded
  count, and a log line per shard with its share (`shard i/n: K items`).
- **A skipped step drags its dependants along and the pipeline stays
  `success`.** A path filter on one step makes every step that depends on
  it skip too, so a skipped gate counts as green. Keep gates without a
  filter, filter per step (never at workflow level), guard the filter list
  with a parity test and keep one scheduled full run.
- **A restart that turns a flake green hides it.** Same sha red then green
  is a gap: record it as open, not as passed. That includes a runner
  infrastructure error such as a full disk: record it as an infrastructure
  gap with an owner.
- **A restart reuses the old commit.** Restarting a scheduled run after a
  fix does not test the fix; trigger a new run on the fixed commit.
- **A dependency install in parallel steps that share a directory** can
  fail with a missing-file error: an infrastructure flake. Restart the same
  sha and keep the cause separate; a repeat is structural.
- **`woodpecker-cli repo secret update`** does not read `@-` as stdin and
  needs `--event`: pass `--value @<file>` and the existing events (`repo
  secret show`).
- **A hanging or network-failed step:** stop the run and restart it
  (`pipeline stop` / `pipeline start <repo> <number>`), after first proving
  that the gate you changed was already green. Give such steps a timeout.
- **Orphaned workflow slots:** a step that stays "running" with no
  container while a restart stays "pending" can mean the agent's capacity is
  held by orphaned tasks (check the agent log). Restart the agent, stop the
  orphaned run, start it again.
- **Advisory steps:** list every step with `failure: ignore`; each needs a
  written reason.
- **Secret-fetching steps failing with an auth error** and no code cause
  often mean the secret store is sealed or unreachable; fix that before
  touching the pipeline.

## Tooling

- **In a sandbox** the CLI may lose its server variables or credentials
  (use the CI system's API or MCP server instead), docker may only run
  outside it, and a hook that reads a secrets file (a `lint` that loads
  `.env`) or fetches over an https remote without credentials fails there:
  run the sync test in a fresh clone without that file, and expect that the
  commit or push needs the owner's shell.
- **Lint the pipeline file** before pushing: `woodpecker-cli lint
  .woodpecker.yml`. It accepts what that CLI version accepts; a pipeline can
  pass lint locally and still fail on a newer or older server.
- **Test a step in its exact CI image** with the user overridden to root and
  the workspace bind-mounted: add
  `git config --global --add safe.directory <path>` first, or git refuses
  to read the mounted repository. Run every new or changed CI script there
  with real input and every scenario it handles: a script that passes
  locally can crash in a minimal image that lacks git or a package manager,
  and linter rules differ per release. A guard test can encode the
  requirement per image family (a slim image installs what the script
  needs), and the script should degrade visibly rather than crash.
- **Pin by digest.** Look digests up in the registry, never type a
  plausible-looking hash:
  `for i in <image:tag> ...; do skopeo inspect --format '{{.Digest}}' docker://$i; done`
- **Step names:** `woodpecker-cli pipeline ps <repo> <number>` (in older CLI
  versions `pipeline show` does not list steps; take them from the pipeline
  file). `--output table=<columns>` selects columns in list commands.
- **Do not fetch the log of a running step** (an API or MCP call returns
  the whole noisy log): poll the step states of the run and fetch one log
  after it has finished. A loaded agent host can stretch a run by tens of
  minutes.
- **Wrappers of the CI API (MCP servers) can use other parameter names**
  than the CLI: for example the repository as `owner/name`, a run `number`,
  and a step id taken from the run's details. Read the tool schema before
  the first call.
- **Wait for a run with a foreground `until` loop or a background run**,
  not a bare `sleep` (some agent environments block it) and not a
  background subshell that dies at the end of the call (it leaves an empty
  log). Poll until the run's status is
  final (pending and running both mean wait).
- **A large log may come back as a file** instead of text (API or MCP
  wrappers): search it with a script run in isolated mode instead of
  printing it.
- **Fetch every step log of a run into files, then grep the files:**
  `for step in <names>; do woodpecker-cli pipeline log show <repo> <number> "$step" > "logs/$step.txt"; done`
  The CLI may print a version-warning JSON line into the stream; filter it
  out before grepping. For very short steps the CLI (or an API wrapper) can
  return an empty log: fetch again or read the step in the web UI before
  concluding that a step logged nothing. Right after a run ends the
  log can still be empty while the run already reports success: ask again
  later, it is no evidence gap. Judge "is CI hanging" by the run status,
  not by the clock: an agent host's clock can be hours off.
