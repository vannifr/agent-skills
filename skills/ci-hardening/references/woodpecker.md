# Woodpecker CI pitfalls

Written for Woodpecker; the same questions apply to other CI systems.

- **Default clone is shallow and partial** (`--depth=1 --filter=tree:0`).
  Diff-based scans see one commit, and steps have **no** forge credentials,
  so a `git fetch` inside a step fails. Fix: a `clone:` block with the git
  clone plugin pinned by digest and `settings: partial: false` (and a
  `depth` large enough for the scan).
- **Escape runtime variables with `$$`.** A single `$VAR` in the pipeline
  file is substituted at parse time, usually to an empty string.
- **Lint the pipeline file** before pushing: `woodpecker-cli lint
  .woodpecker.yml`.
- **Symptom of the missing credentials:** `could not read Username` in the
  log, followed by a green step because the fetch ended in `|| true`.
- **Fetch log evidence** for a finished pipeline:
  `woodpecker-cli pipeline log show <repo> <number> <step>`; the step name
  is required. List the step names with `pipeline ps <repo> <number>` (`pipeline show` does not list steps in
  older CLI versions, then take them from the pipeline file); `--output table=<columns>` selects
  columns in list commands.
- **Pin by digest.** Look the digest up in the registry (e.g. `skopeo
  inspect docker://<image>:<tag>`); never type a plausible-looking hash.
- **Secret-fetching steps failing with an auth error** and no code cause
  often mean the secret store is sealed or unreachable; fix that before
  touching the pipeline.
- **Declare dependencies between steps** (`depends_on`) so cheap blocking
  gates run first and reporting steps wait for the results they report on.
- **Scheduled runs** use `event: cron`; confirm one ever ran with
  `woodpecker-cli pipeline ls <repo> --event cron` (older CLI versions have
  no cron subcommand to trigger or list schedules).
- **Wrapper scripts:** a step often calls a repository script that scopes
  itself by `CI_PREV_COMMIT_SHA` (empty on a first or forced push); audit
  that script, not only the pipeline file.
- **Local lint version:** `woodpecker-cli lint` accepts what that CLI
  version accepts; keep the CLI version in mind when a pipeline passes lint
  locally but fails on the server.
- **Log output noise:** the CLI may print a version-warning JSON line into
  the log stream; filter it out before grepping.
- **Advisory steps:** list every step with `failure: ignore`; each needs a
  written reason, otherwise it is a gate that cannot fail.
- **Look up digests in a loop:**
  `for i in <image:tag> ...; do skopeo inspect --format '{{.Digest}}' docker://$i; done`
- **Shallow clone without credentials is the most common failure:** a range
  scan built from `CI_PREV_COMMIT_SHA` fails ("invalid revision range") or
  scans 0 commits, and a fallback then checks an empty staged diff. Fix the
  clone (see above), then make the wrapper count what it scanned and fail
  when the count is 0 or differs from `git rev-list --count PREV..SHA`.
- **Change detection is the same trap:** a step that lists changed
  directories from `CI_PREV_COMMIT_SHA..CI_COMMIT_SHA` and prints "invalid
  revision range" followed by "no changes" is vacuous. Treat an empty or
  invalid range as "run everything", not "nothing changed".
- **Pipeline-level `when: path: exclude`** skips the whole pipeline,
  secret scan included; put path filters on individual steps instead.
