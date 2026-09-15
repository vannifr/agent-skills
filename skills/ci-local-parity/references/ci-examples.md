# CI implementation examples

Supporting detail for [../SKILL.md](../SKILL.md) — the two Gitleaks CI
options, and the exact command to reproduce a CI container image locally.

## Gitleaks in CI: two options, choose based on repo visibility

**Public repo → `gitleaks/gitleaks-action@v2`, no hand-built diff-range
logic.** That action reads the push/PR event context and automatically
scans the right commit range — that's exactly the "diff-scoped in CI"
principle from the main skill, ready-made. It does require
`actions/checkout@v4` with `fetch-depth: 0` (it needs the full history to
determine the range). Free for public repositories, but requires a
`GITLEAKS_LICENSE` for private repositories — check visibility **before**
adding it, or the step fails on a license error instead of a found secret.

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

## Reproducing the CI container image locally

When a new test file calls an external binary (`git`, `curl`, a CLI tool)
that might be missing from a minimal CI image, reproduce the exact image
locally rather than guessing:

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
`rm -f` on the specific file (owning the containing directory is enough
for `rm`, even if the file itself is root-owned) — not with
`sudo chown -R`, which asks for a password that doesn't exist in a
non-interactive sandbox.

The fix for a genuine missing-binary case belongs in the CI step itself
(install the missing package, e.g. `apt-get install -y git` before the
test step), not in the test code — the test code is right to use the
binary directly, it's the image that's missing it.
