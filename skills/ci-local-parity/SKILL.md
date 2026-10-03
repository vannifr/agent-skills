---
name: ci-local-parity
description: Use when setting up, auditing or repairing a project's CI pipeline together with local verification — ensures the local verify command covers everything CI checks, adds pre-commit/pre-push hooks that enforce this, and keeps trunk-based development honest (small commits, frequent pushes, CI checked per push). Load before creating or changing a CI pipeline file, before adding a quality gate (coverage, static analysis, security scan), and whenever a CI gate fails that local checks passed — including a single failing coverage or quality gate, not only a full pipeline setup.
---

# CI/local parity: the local gate must truly cover everything CI checks

**The core rule:** "local green" and "CI green" are two separate claims
until you've explicitly verified that the local gate covers *everything*
CI checks. Every time a CI step checks something local can't trivially do
(network access, an external service, a slow scan), that's an explicitly
named gap — never an implicit assumption.

> **Not the same thing:** tools like `claude-pre-commit` and
> `config-drift-checker` validate Claude Code's own configuration. This
> skill is about an *application's* CI pipeline and its local
> verification staying in sync.

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
- [ ] **Is parity itself enforced by a test, not just agreed?** A test
      that parses the CI config and the `verify` script and fails when a
      sub-script of `verify` is not called by any CI step, or when a CI
      step calls a project script that `verify` neither runs nor lists as
      a documented exception. It runs in `verify` and in CI. Without it,
      parity is a convention that drifts at the next change.
- [ ] **Does a local check that can't run (tool missing, service
      unreachable) degrade only when CI blocks on the same check?** With
      a blocking CI counterpart, a visible warning locally is fine. With
      none, the local check is the only gate and must fail hard. Never
      skip silently, and never choose warn-or-fail by habit.
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
      environment?** See "Local green ≠ CI-container green" below.
- [ ] **Is the CI image pinned by digest, not just by tag?** A tag like
      `node:22-slim` can silently change underneath you even while the
      binary list looks the same today — pin
      `node:22-slim@sha256:<digest>` (or your registry's equivalent) for
      a build that genuinely doesn't drift, and document the process for
      bumping it deliberately. The package manager version counts too
      (e.g. `packageManager` in `package.json` when CI uses corepack).
      **Look the real value up** from the registry
      (e.g. `docker buildx imagetools inspect <image>`) or the package
      manager; a local cache or an invented value is not a pin. If you
      cannot look it up, say so and leave the task open. Then make CI
      fail on placeholder markers (e.g. `REPLACE_WITH…`, `<version>`)
      in the CI files and manifest: a committed placeholder is worse than
      a floating tag, because it breaks the pull or corepack outright.
- [ ] **Are third-party GitHub Actions pinned to a commit SHA, not a
      version tag?** `actions/checkout@v6` can be repointed after the
      fact; `actions/checkout@<full-sha>` can't. Same principle as the
      image-digest bullet above, applied to the CI supply chain.
- [ ] **Can the gate be weakened by deleting tests?** A gate that can be
      weakened by deleting tests isn't a gate — see "Test-count ratchet"
      below.
- [ ] **Does every custom gate (linter, validator, policy check) have a
      must-fail corpus?** Fixtures that must be rejected, each naming
      the expected rule, plus a meta-test that every rule has at least
      one failing fixture. A gate proven only on valid input is
      unproven: a rule that always passes goes unnoticed.
- [ ] **Does secret scanning (gitleaks or similar) also have a CI
      backstop, not just a `pre-commit` hook?** A `pre-commit` hook is
      bypassable and never scans a commit from outside that checkout —
      see "Gitleaks in CI" below, and confirm the scan job actually
      blocks build/deploy via `needs:`/`depends_on`.

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

The external check itself (e.g. `scripts/<external-check-name>.mjs` for
SonarQube) follows this shape — credentials/tool present, then service
reachable, only then the real check:

```sh
#!/bin/sh
set -e

# (Skip-with-warning is only valid because CI runs this check blocking.)
# 1. Credentials/tool present? Not "installed", "usable right now".
if [ -z "$SONAR_TOKEN" ] || ! command -v sonar-scanner >/dev/null 2>&1; then
  echo "WARN: SonarQube credentials/tool missing — skipping (not blocking)."
  exit 0
fi

# 2. Service actually reachable? Short timeout — don't hang CI on a dead host.
if ! curl -sf --max-time 2 "$SONAR_HOST_URL/api/system/status" >/dev/null; then
  echo "WARN: SonarQube unreachable — skipping (not blocking)."
  exit 0
fi

# 3. Only now run the real check, and pass through ITS exit code
#    (exit 1 on a real failure, not on unreachability).
sonar-scanner
```

In CI the same step must wait for and fail on the quality gate
(`-Dsonar.qualitygate.wait=true`); otherwise it is green whatever the
gate says.

A skip like the above is only legitimate with a blocking CI step for
the same check. Without one, replace the `exit 0` branches with `exit 1`.

**Never `test -n "$X" && A || B` for this kind of conditional logic.** If
`A` fails for an unrelated reason (a transient tool error, not "nothing
found"), fallback `B` still triggers and its exit code masks `A`'s real
failure. Always use an explicit `if [ -n "$X" ]; then A; else B; fi`.

Activate with: `git config core.hooksPath .githooks`, preferably via a
`pnpm hooks:install` script so it doesn't stay a manual, easily-forgotten
step.

**Gitleaks belongs in `pre-commit`, not again in `pre-push`.** At push
time there's normally nothing staged, so `gitleaks git --pre-commit --staged`
in `pre-push` is a sham check that always reports "0 commits scanned."
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

GitHub Actions form:
```yaml
steps:
  - name: Lint
    run: pnpm lint
  - name: Test
    run: pnpm test:coverage
  - name: <external-check>
    run: <external-scanner> ...
```

Same principle, different syntax, for Woodpecker and GitLab CI:
[ci-examples.md](references/ci-examples.md).

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
commit exists): `gitleaks git --pre-commit --staged -v`. In CI (after the
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

**Public repo → `gitleaks/gitleaks-action@v3` (verify the current major at
[github.com/gitleaks/gitleaks-action/releases](https://github.com/gitleaks/gitleaks-action/releases)
before pinning — this one has moved before), no hand-built diff-range
logic.** Reads the push/PR event context and automatically scans the
right commit range — needs `fetch-depth: 0`, free for public repos,
requires a `GITLEAKS_LICENSE` for private ones.

**Pin third-party GitHub Actions to a commit SHA, not a floating version
tag** (`uses: actions/checkout@<full-sha>  # v6.0.1`, not
`actions/checkout@v6`) — a version tag can be moved to point at different
code after the fact, a commit SHA can't. This applies to every action in
the pipeline, not just gitleaks — it's the same "pin, don't float"
principle as the container-image-digest bullet above, applied to the
supply chain instead of the runtime image.

**Private repo without `GITLEAKS_LICENSE` → the CLI itself with
`--log-opts`.** Vendor-neutral, same diff-scoping, plus the zero-SHA
first-push fallback and SHAs passed via `env:` (never interpolated
directly into `run:` with `${{ }}`).

Full YAML for both options, and why each key point matters:
[ci-examples.md](references/ci-examples.md).

## Test-count ratchet: deleting tests must not pass silently

Refactors and agent-written fix commits quietly drop tests, and
reviewers (human or model) routinely miss a deleted test because the
remaining tests still pass. Enforce mechanically, in `pre-push` and in
CI on the push range, that the net number of test declarations and
assertions in test files does not decrease — unless a commit in the
range carries an explicit trailer (e.g. `Test-Removal: <reason>`).
Node sketch, including the first-push fallback (warn, exit 0):
[ci-examples.md](references/ci-examples.md).

The ratchet only sees test and assertion counts, not deleted fixtures;
the must-fail corpus meta-test (every rule has a failing fixture)
covers that. They complement each other.

## Local green ≠ CI-container green: image parity is parity too

**"Local green" only covers what actually runs locally.** A minimal CI
image (e.g. `node:22-slim`) often lacks tools that are trivially present
locally (`git`, `curl`, ...) — a test fixture that calls such a binary
(e.g. via `execFileSync`) then passes locally and in the `pre-push` hook,
but silently fails in the real CI container, with no local check ever
able to catch that difference. Image parity is just as much "CI/local
parity" as coverage reporting or secret scanning.

**How to catch this going forward:**
1. **After every push to a gate-guarded branch: query the real CI
   pipeline status** (e.g. `woodpecker-cli pipeline last <repo>` or the
   CI system's own CLI/API) — never report "pushed" as "done" based only
   on the local `pre-push` hook's output.
2. **When a new test file calls an external binary** (`git`, `curl`, a
   CLI tool): explicitly check whether the CI image contains that
   binary, don't assume "it's there locally" is enough. When in doubt,
   reproduce locally in the exact same image — exact command and the
   `--user` gotcha: [ci-examples.md](references/ci-examples.md).
3. **The fix belongs in the CI step itself** (install the missing
   package, e.g. `apt-get install -y git` before the test step), not in
   the test code — the test code is right to use the binary directly,
   it's the image that's missing it.

## Report evidence in a fixed form

"Pushed" and "local verify is green" are not evidence. After the push,
query the real CI system and report: commit SHA, pipeline number, status
per step, and the gate values (test count, coverage %, quality-gate or
audit result). When a gate is new, also show it failing once on a
deliberate violation.

## What this doesn't replace

This skill is about the **verification chain** (local ↔ CI), not about
*how* you get code written or which model you pick for that — see a
model-delegation/orchestration skill for tier-based model choice and the
diff-verification discipline that goes with it. The two complement each
other: this one ensures whatever finally gets committed also has to pass
through the same gate as CI; that other one ensures what a model writes
isn't blindly trusted before it gets that far.
