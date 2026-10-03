# CI implementation examples

Supporting detail for [../SKILL.md](../SKILL.md) — named-step CI syntax
for Woodpecker/GitLab, the two Gitleaks CI options, and the exact command
to reproduce a CI container image locally.

## Named steps: Woodpecker and GitLab CI

Same "each named step calls the same underlying script as local"
principle as the GitHub Actions example in SKILL.md, different syntax:

Woodpecker:
```yaml
steps:
  - name: lint
    commands: [pnpm lint]
  - name: test
    commands: [pnpm test:coverage]
  - name: <external-check>
    commands: [<external-scanner> ...]
```

GitLab CI:
```yaml
lint:
  script: pnpm lint

test:
  script: pnpm test:coverage

<external-check>:
  script: <external-scanner> ...
```

## Gitleaks in CI: two options, choose based on repo visibility

**Public repo → `gitleaks/gitleaks-action@v3` (check
[the releases page](https://github.com/gitleaks/gitleaks-action/releases)
for the current major before pinning), no hand-built diff-range logic.**
That action reads the push/PR event context and automatically scans the
right commit range — that's exactly the "diff-scoped in CI" principle
from the main skill, ready-made. It does require `actions/checkout` with
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
  - uses: actions/checkout@<full-commit-sha>  # v6.0.1 — pin by SHA, not tag
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
        ./gitleaks git --log-opts="-1 $HEAD_SHA" -v --redact
      else
        ./gitleaks git --log-opts="$BEFORE_SHA..$HEAD_SHA" -v --redact
      fi
```

Then actually make build and/or deploy wait on this job (`needs:
secret-scan` on every job that would otherwise proceed without the scan)
— otherwise CI does scan, but blocks nothing on a finding.

Woodpecker equivalent (the clone is shallow by default, so deepen it
first; `CI_PREV_COMMIT_SHA` is empty on a first pipeline):

```yaml
- name: secret-scan
  image: <image-with-git-and-gitleaks>
  commands:
    - git fetch --deepen=50 || git fetch --unshallow || true
    - |
      if [ -z "$CI_PREV_COMMIT_SHA" ] || [ "$CI_PREV_COMMIT_SHA" = "0000000000000000000000000000000000000000" ] || ! git cat-file -e "$CI_PREV_COMMIT_SHA^{commit}" 2>/dev/null; then
        gitleaks git --log-opts="-1 $CI_COMMIT_SHA" -v --redact
      else
        gitleaks git --log-opts="$CI_PREV_COMMIT_SHA..$CI_COMMIT_SHA" -v --redact
      fi
```

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

## Test-count ratchet (Node built-ins)

Usage: `node scripts/test-ratchet.mjs <base> <head>`; in CI pass the
push range, in `pre-push` the range being pushed.

```js
import { execFileSync } from 'node:child_process';
const [base, head] = process.argv.slice(2);
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const skip = (why) => { console.warn(`WARN: ${why} — ratchet skipped.`); process.exit(0); };
if (!base || /^0+$/.test(base)) skip('no base commit (first push)');
try { git('cat-file', '-e', `${base}^{commit}`); } catch { skip('base commit unknown'); }
const range = `${base}..${head}`;
const TESTS = /\b(?:it|test)(?:\.\w+)?\s*\(/g;
const ASSERTS = /\b(?:expect|assert[\w.]*)\s*\(/g;
const count = (line, re) => (line.match(re) ?? []).length;
const files = git('diff', '--name-only', range)
  .split('\n').filter((f) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(f));
let tests = 0, asserts = 0;
for (const f of files) {
  for (const line of git('diff', '-U0', range, '--', f).split('\n')) {
    if (/^(\+\+\+|---)/.test(line)) continue;
    const sign = line[0] === '+' ? 1 : line[0] === '-' ? -1 : 0;
    tests += sign * count(line, TESTS);
    asserts += sign * count(line, ASSERTS);
  }
}
if (tests < 0 || asserts < 0) {
  const msg = `Test count dropped (tests ${tests}, assertions ${asserts})`;
  if (/^Test-Removal: \S/m.test(git('log', '--format=%B', range))) {
    console.warn(`${msg} — waived by Test-Removal trailer`);
  } else {
    console.error(`${msg}. Add a "Test-Removal: <reason>" trailer if intended.`);
    process.exit(1);
  }
}
```
