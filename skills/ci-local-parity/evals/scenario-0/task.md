# CI and Local Verification Pipeline Setup

## Problem/Feature Description

Your team is launching a new open-source Node.js library on GitHub under a public repository. The project uses `pnpm` for package management and already has `lint` and `test:coverage` scripts defined in `inputs/package.json`. As the project grows and new contributors join, the team needs reliable assurance that everyone — and the CI system — runs exactly the same checks, with no drift between "passes locally" and "passes in CI."

You have been asked to complete the verification and CI pipeline setup. Concretely, the team wants:

- One unified local command that runs all checks, so contributors don't need to remember a sequence of separate commands.
- Git hooks that automatically enforce that unified verification step before commits and pushes reach the remote.
- A convenient, scriptable way to activate those hooks in a fresh checkout, so developers don't have to remember a manual setup step.
- A GitHub Actions workflow that executes the same checks with clear visibility into which specific step fails when something breaks.
- Secret scanning as an additional safety net (the team has had accidental credential commits in the past). Any secret scanning job in CI must actually gate the build — a scan that runs but doesn't block the build on a finding defeats the purpose.

The repository is public. Do not introduce Husky or any other third-party hook management package as a dependency.

## Output Specification

Produce all the files needed to complete this setup, including:

- An updated `package.json` (starting from `inputs/package.json`) with any new scripts added
- Git hook files in the appropriate location
- A GitHub Actions workflow at `.github/workflows/ci.yml`
- Any other supporting configuration files

Leave all created files in the workspace.
