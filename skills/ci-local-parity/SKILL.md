---
name: ci-local-parity
description: Use when setting up or auditing a project's CI/CD pipeline together with local verification — ensures pnpm/npm verify (or equivalent) actually covers everything CI checks, adds pre-commit/pre-push git hooks that enforce this locally, and keeps trunk-based development honest (small commits, frequent pushes, CI checked per push not per batch). Load before building a new .woodpecker.yml/.github/workflows, before adding SonarQube/coverage, or when "it passed locally but failed in CI" comes up.
---

# CI/local parity: the local gate must truly cover everything CI checks

**The core rule:** "local green" and "CI green" are two separate claims
until you've explicitly verified that the local gate covers *everything*
CI checks. Every time a CI step checks something local can't trivially do
(network access, an external service, a slow scan), that's an explicitly
named gap — never an implicit assumption.

> **Not the same thing:** two other public tools with similar-sounding
> names (`claude-pre-commit`, `config-drift-checker`) validate **Claude
> Code's own configuration** (SKILL.md structure, CLAUDE.md, hooks) via
> pre-commit/eval regression. This skill is about a different axis
> entirely: validating that an *application's* CI pipeline and its local
> verification stay in sync — not about linting the agent's own config
> files.

## Checklist — for every project with CI

Work through this when setting up a new pipeline, or when auditing an
existing one:

- [ ] **Does one local command exist that runs "everything"** (e.g. `pnpm
      verify`, `make check`), not a loose list of commands someone has to
      remember?
- [ ] **Does CI call those exact same commands** — not its own, separately
      maintained variant that can drift? (Separate, named CI steps are
      fine, as long as each step literally calls the same underlying
      script as local — named steps are for visibility, not separate
      logic.)
- [ ] **For every CI step: can it also run locally, without extra setup?**
      If not (a network dependency like SonarQube/an external API/a slow
      scan), is there an *explicit*, separately runnable local command
      that covers it? Is that gap *literally* documented (in
      CLAUDE.md/AGENTS.md/README), not silently assumed?
- [ ] **Does that separate check degrade gracefully** when the external
      dependency is unreachable (no server, no token, tool not
      installed)? A hard crash on "SonarQube unreachable" is just as bad
      as silently skipping it — it must give a visible warning and only
      then decide whether to block.
- [ ] **Are there git hooks enforcing this**, not just documentation
      someone can forget to read? At minimum `pre-commit` (the fast,
      network-free gate) and `pre-push` (that plus the slower/network-
      dependent part, see below).
- [ ] **Is coverage reporting present if CI has a coverage gate?** A
      quality gate that checks coverage without a report ever being
      generated always sees 0% — no matter how many real tests exist.
      This is the most common silent cause of an unexpectedly failing
      gate on a first SonarQube/Codecov integration.
- [ ] **Is every commit or small group of commits pushed separately, not
      in large batches?** See "Trunk-based is only a gate if you also
      check it per push" below — this is a procedural condition, not a
      technical one, and is therefore the easiest to forget.
- [ ] **Does the deploy/hosting documentation still match what CI
      actually does?** Especially after a migration (e.g. SiteGround →
      Cloudflare Pages, rsync → `wrangler`), the README/CLAUDE.md often
      keeps describing the old situation while the pipeline has long
      since changed. This is the same "implicit assumption" mistake as
      the rest of this checklist, just about documentation instead of
      commands — and is therefore easy to miss in a pure CI audit.
- [ ] **Does the CI container run the same binaries as the local dev
      environment?** A minimal/`slim` image (e.g. `node:22-slim`) often
      lacks tools that are trivially present locally (`git`, `curl`, ...)
      but that a test fixture actually needs. A locally green `pnpm
      verify` then proves nothing about the CI container. See "Local
      green ≠ CI-container green" below.
- [ ] **Is the CI image pinned by digest, not just by tag?** A tag like
      `node:22-slim` can silently change underneath you even while the
      binary list looks the same today — pin
      `node:22-slim@sha256:<digest>` (or your registry's equivalent) for
      a build that genuinely doesn't drift, and document the process for
      bumping it deliberately.
- [ ] **Does secret scanning (gitleaks or similar) also have a CI
      backstop, not just a `pre-commit` hook?** This is the mirror image
      of every other bullet above: those ask "does local also do what CI
      does," this asks "does CI also do what local does." A `pre-commit`
      hook is bypassable (`--no-verify`, or the tool simply isn't
      installed — see the graceful-degradation bullet above) and never
      scans a commit that originated outside that one checkout (a merge,
      a commit from another device). Without a diff-scoped scan in CI
      itself, a leaked secret simply reaches the build/deploy. See
      "Gitleaks in CI" below for the two concrete options, and make sure
      the scan job is actually wired to build/deploy via
      `needs:`/`depends_on` — a scan that runs but blocks nothing is
      cosmetic.

## Git hooks: the pattern

**Design decision: native git hooks, no dependency.** No Husky/lint-staged
— this project (like most of this kind) already requires "no dependencies"
as a baseline, and native hooks meet that bar without adding a package to
maintain, version, or audit:

```
.githooks/
  pre-commit   # fast, no network: the local "verify" command
  pre-push     # that again, plus the slower/network-dependent part
```

`pre-commit`:
```sh
#!/bin/sh
pnpm verify
```

`pre-push` (example with a gracefully degrading external check):
```sh
#!/bin/sh
set -e
pnpm verify
node scripts/<external-check-name>.mjs
```

The external check itself (e.g. for SonarQube) must:
1. Check whether the required credentials/tools are present (env var,
   binary on PATH) — if not: warn and `exit 0` (don't block on missing
   infrastructure).
2. Check whether the external service is actually reachable (short
   timeout, e.g. 2s) — if not: warn and `exit 0`.
3. Only then run the real check, and pass through its exit result (`exit
   1` on a real failure, not on unreachability).

**Never `test -n "$X" && A || B` for this kind of conditional logic.** If
`A` fails for an unrelated reason (not because something was found, but
e.g. a transient tool error), fallback `B` still triggers — and `B`'s exit
code determines the final result, which can mask `A`'s real failure.
Encountered empirically: this pattern was in a "proven, already used
elsewhere" pipeline and got copied into multiple projects before it was
recognized as a bug. Always use an explicit `if [ -n "$X" ]; then A; else
B; fi`.

Activate with: `git config core.hooksPath .githooks`, preferably via a
`pnpm hooks:install` script so it doesn't stay a manual, easily-forgotten
step.

**Gitleaks belongs in `pre-commit`, not again in `pre-push`.** At push
time there's normally nothing staged, so `gitleaks protect --staged` in
`pre-push` is a sham check that always reports "0 commits scanned."
`pre-commit` already scanned the staged diff before the commit existed,
and CI scans the push again, diff-scoped — `pre-push` therefore only
needs to repeat `verify`, not gitleaks.

## Trunk-based is only a gate if you also check it per push

Trunk-based development ("commit small and often, no long-lived
branches") only works because CI checks every push. Push several commits
in one batch, and CI only checks them once too, against one large,
hard-to-trace diff.

**In practice:** push after every commit, or after a small, coherent
group (e.g. one task from an implementation plan). Not: collecting every
task from a session and pushing it all at the end. A `pre-push` hook that
runs the external check also makes this naturally less painful to do
often — the check is already confirmed locally before the push, not a
surprise afterward.

## CI pipeline structure: named steps, not one bundle

One big `verify` block in CI hides *which* step failed. Separate, named
steps — each calling the same underlying script as local — give direct
visibility without losing the "one source of truth" guarantee:

Woodpecker form:
```yaml
steps:
  - name: lint
    commands: [pnpm lint]
  - name: test
    commands: [pnpm test:coverage]
  - name: <external-check>
    commands: [<external-scanner> ...]
```

GitHub Actions equivalent (same principle, different syntax):
```yaml
steps:
  - name: Lint
    run: pnpm lint
  - name: Test
    run: pnpm test:coverage
  - name: <external-check>
    run: <external-scanner> ...
```

GitLab CI equivalent (same principle again):
```yaml
lint:
  script: pnpm lint

test:
  script: pnpm test:coverage

<external-check>:
  script: <external-scanner> ...
```

Add a security baseline where relevant (e.g. `gitleaks` for secret
scanning on this push's commits, plus a `.env` guard as
belt-and-suspenders alongside `.gitignore`) — this isn't specific to
"CI/local parity" per se, but is the standard baseline sibling projects
already use and that you can adopt immediately on a new pipeline.

**Gitleaks: `--staged` locally, diff-scoped in CI — never a bare
full-history scan as the standard check.** A `gitleaks git -v .` with no
scope restriction permanently blocks a repo the moment even one
innocuous pattern has ever appeared in the history (an env-var name in
documentation like `curl -u "$SONAR_TOKEN:"`, a public analytics beacon
token, documented default credentials). Locally (`pre-commit`, before the
commit exists): `gitleaks protect --staged -v .`. In CI (after the
push): diff-scoped to this push's range — see "Gitleaks in CI" below for
the concrete implementation, including the explicit fallback for a
freshly registered CI system or a first push. Before enabling gitleaks on
an existing project for the first time: run one full-history scan once to
see what's already in there, have a human review real findings, and
suppress confirmed-innocuous hits in a baseline file (`gitleaks git
--report-format json --report-path .gitleaks-baseline.json`, then pass
`--baseline-path` to every subsequent scan) — never weaken the daily
check itself.

### Gitleaks in CI: two options, choose based on repo visibility

**Public repo → `gitleaks/gitleaks-action@v2`, no hand-built diff-range
logic.** That action reads the push/PR event context and automatically
scans the right commit range — that's exactly the "diff-scoped in CI"
above, ready-made. It does require `actions/checkout@v4` with
`fetch-depth: 0` (it needs the full history to determine the range).
Free for public repositories, but requires a `GITLEAKS_LICENSE` for
private repositories — check visibility **before** adding it, or the
step fails on a license error instead of a found secret.

**Private repo without `GITLEAKS_LICENSE` → the CLI itself with
`--log-opts`.** This isn't a workaround, it's the vendor-neutral variant
that covers just as much. Key points:
- `fetch-depth: 0`, same as with the action — without full history the
  range doesn't exist to scan against.
- Verify the release asset name via the GitHub Releases API before
  hardcoding a download URL (`gh api
  repos/gitleaks/gitleaks/releases/tags/vX.Y.Z` or the `curl
  .../releases/tags/...` equivalent) — the naming convention has already
  changed between major versions once, and a wrongly guessed filename
  only fails during the CI run, not while writing it.
- The zero-SHA fallback (new branch, first push — `github.event.before`
  is then 40 zeros) must be explicitly coded, not silently skipped: in
  that case scan only the last commit.
- Pass SHAs through `env:`, don't interpolate them directly into the
  `run:` script with `${{ }}`. `github.sha`/`github.event.before` aren't
  free text an attacker sends, but `env:` is the generic, always-safe
  habit for any value from a GitHub Actions event context: never put
  `${{ ... }}` directly in a `run:` body, even for fields that look
  harmless.

```yaml
steps:
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0

  - name: Install gitleaks
    # Unpacked into the workspace and invoked via ./gitleaks, no
    # sudo/system change: the runner is disposable anyway, and this
    # avoids the root-privilege step an automated security review would
    # otherwise flag as a risk.
    run: |
      curl -sSL -o gitleaks.tar.gz https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz
      tar -xzf gitleaks.tar.gz gitleaks
      rm gitleaks.tar.gz

  - name: Scan commits pushed in this run
    env:
      BEFORE_SHA: ${{ github.event.before }}
      HEAD_SHA: ${{ github.sha }}
    run: |
      if [ -z "$BEFORE_SHA" ] || [ "$BEFORE_SHA" = "0000000000000000000000000000000000000000" ]; then
        echo "New branch or first push — scanning only the last commit."
        ./gitleaks detect --source . --log-opts="-1 $HEAD_SHA" -v --redact
      else
        ./gitleaks detect --source . --log-opts="$BEFORE_SHA..$HEAD_SHA" -v --redact
      fi
```

Then actually make build and/or deploy wait on this job (`needs:
secret-scan` on every job that would otherwise proceed without the scan)
— otherwise CI does scan, but blocks nothing on a finding.

For CI-runner-specific quirks (e.g. how a self-hosted Woodpecker instance
validates secrets, shallow-clone behavior, or other platform-specific
lessons) — see the shared, cross-project playbook for that specific
stack, not this skill: this one deliberately stays CI-system-agnostic.

## Local green ≠ CI-container green: image parity is parity too

**The core rule (repeated, specific to this case):** "local green" only
covers what actually runs locally. A minimal CI image (e.g.
`node:22-slim`) often lacks tools that are trivially present locally
(`git`, `curl`, ...) — a test fixture that calls such a binary (e.g. via
`execFileSync`) then passes locally and in the `pre-push` hook, but
silently fails in the real CI container, with no local check ever able
to catch that difference. Image parity is just as much "CI/local parity"
as coverage reporting or secret scanning.

**How to catch this going forward:**
1. **After every push to a gate-guarded branch: query the real CI
   pipeline status** (e.g. `woodpecker-cli pipeline last <repo>` or the
   CI system's own CLI/API) — never report "pushed" as "done" based only
   on the local `pre-push` hook's output.
2. **When a new test file calls an external binary** (`git`, `curl`, a
   CLI tool): explicitly check whether the CI image contains that
   binary, don't assume "it's there locally" is enough. When in doubt,
   reproduce locally in the exact same image:
   ```sh
   docker run --rm --user "$(id -u):$(id -g)" -v "$(pwd)":/repo -w /repo node:22-slim sh -c '
     apt-get update -qq && apt-get install -y --no-install-recommends git -qq
     corepack enable && pnpm test:coverage
   '
   ```
   **Always `--user "$(id -u):$(id -g)"` on a mount like this** — without
   that flag the container runs as root and writes root-owned files back
   into the mounted directory (e.g.
   `node_modules/.pnpm-workspace-state-v1.json`), which then makes local
   `pnpm` commands fail with `EACCES` afterward. Fix it with a targeted
   `rm -f` on the specific file (owning the containing directory is
   enough for `rm`, even if the file itself is root-owned) — not with
   `sudo chown -R`, which asks for a password that doesn't exist in a
   non-interactive sandbox.
3. **The fix belongs in the CI step itself** (install the missing
   package, e.g. `apt-get install -y git` before the test step), not in
   the test code — the test code is right to use the binary directly,
   it's the image that's missing it.

## What this doesn't replace

This skill is about the **verification chain** (local ↔ CI), not about
*how* you get code written or which model you pick for that — see a
model-delegation/orchestration skill for tier-based model choice and the
diff-verification discipline that goes with it. The two complement each
other: this one ensures whatever finally gets committed also has to pass
through the same gate as CI; that other one ensures what a model writes
isn't blindly trusted before it gets that far.
