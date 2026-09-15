# Add Secret Scanning to a Private Repository

## Problem Description

Your team's private GitHub repository has been growing fast. After a recent incident where a developer accidentally committed an API key that slipped through code review, the team has decided to add gitleaks secret scanning to both the local developer workflow and the CI pipeline.

The repository is private and does **not** have a `GITLEAKS_LICENSE`. The existing pipeline has a `build` job and a `deploy` job in `.github/workflows/ci.yml`. There are already git hooks in `.githooks/` that run `pnpm verify` — you should extend these rather than replace them.

The team's priorities are:
- Developers get fast local feedback before a commit lands
- The CI scan covers only the commits introduced in each push — the history is long and a full rescan every time is unnecessary and potentially dangerous for a repo with a long history
- A finding in CI must actually stop the build and deploy from proceeding, not just log a warning
- New branches and first pushes must be handled safely without the scan crashing or silently skipping

Because this is an existing project with history, you also need to leave written guidance for the team on how to safely bootstrap gitleaks on a repo that already has commits.

## Output Specification

Starting from the files in `inputs/`, make the following changes in-place (copy them to your working directory and modify them):

- Update `.githooks/pre-commit` to add gitleaks scanning at the appropriate stage
- Update `.githooks/pre-push` if needed (or leave it unchanged if gitleaks does not belong there)
- Update `.github/workflows/ci.yml` to add a gitleaks scanning job and ensure the existing jobs depend on it
- Write a `SCANNING.md` file at the repository root that explains:
  - Which git hook contains gitleaks and why that hook was chosen
  - What steps the team should take before enabling gitleaks on this existing repo for the first time
  - What the `--baseline-path` flag does and why it matters

Leave all created and modified files in your working directory when done.
