# Integrate SonarQube Quality Analysis

## Background

The platform team has provisioned a SonarQube server at `https://sonar.example.com` and is rolling it out across all internal Node.js projects. You have been asked to wire up SonarQube analysis for `acme-core-lib`, a library with an existing CI pipeline and local verification workflow.

The project files are already in your working directory:
- `package.json` — defines `verify`, `lint`, and `test:coverage` scripts
- `.githooks/pre-commit` — runs `pnpm verify` before commits
- `.githooks/pre-push` — currently only runs `pnpm verify`
- `.github/workflows/ci.yml` — has named Lint and Test steps

SonarQube analysis requires the `SONAR_TOKEN` environment variable to be set and the `sonar-scanner` CLI tool to be installed. These are available in CI via secrets, but many developers do not have them configured locally. The server is also on the corporate network and may not be reachable from every machine or environment.

## Task

Extend the project to include SonarQube quality analysis in both local development and CI:

1. Create `scripts/sonarqube.sh` — a shell script that runs the SonarQube scan. It should handle the case where credentials or the scanner tool are not present, and where the server cannot be reached, without making the local workflow unusable or silently swallowing failures.

2. Update `.githooks/pre-push` to include the SonarQube check alongside the existing verification step.

3. Update `.github/workflows/ci.yml` to add SonarQube analysis. The SonarQube step needs coverage data produced by the test run, so placement matters.

4. Update `CLAUDE.md` with developer guidance covering the SonarQube integration — what it requires, and what happens when those requirements are not met.

## Output

The following files should be present in the working directory when you finish:
- `scripts/sonarqube.sh`
- `.githooks/pre-push`
- `.github/workflows/ci.yml`
- `CLAUDE.md`
