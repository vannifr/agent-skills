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
- **Fetch log evidence** for a finished pipeline:
  `woodpecker-cli pipeline log show <repo> <number> <step>`.
- **Pin by digest.** Look the digest up in the registry (e.g. `skopeo
  inspect docker://<image>:<tag>`); never type a plausible-looking hash.
- **Secret-fetching steps failing with an auth error** and no code cause
  often mean the secret store is sealed or unreachable; fix that before
  touching the pipeline.
- **Declare dependencies between steps** (`depends_on`) so cheap blocking
  gates run first and reporting steps wait for the results they report on.
- **Scheduled runs** use `event: cron`; confirm the first scheduled run
  actually executed, since the CLI may lack a way to trigger it on demand.
- **Local lint version:** `woodpecker-cli lint` accepts what that CLI
  version accepts; keep the CLI version in mind when a pipeline passes lint
  locally but fails on the server.
