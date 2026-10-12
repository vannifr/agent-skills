import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync, mkdirSync, chmodSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const SCRIPT = resolve('scripts/secret-scan.sh');
const COPY = resolve('skills/ci-hardening/references/secret-scan.sh');

function cleanEnv(extra = {}) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('GIT_')) env[key] = value;
  }
  return { ...env, ...extra };
}

function git(cwd, ...args) {
  return execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...args], {
    cwd,
    env: cleanEnv(),
    encoding: 'utf8',
  });
}

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'secret-scan-test-'));
  git(dir, 'init', '-q');
  writeFileSync(join(dir, 'a.txt'), 'text\n');
  git(dir, 'add', '.');
  git(dir, 'commit', '-q', '-m', 'text');
  writeFileSync(join(dir, 'img.bin'), Buffer.from([0, 1, 2, 3, 0, 255]));
  git(dir, 'add', '.');
  git(dir, 'commit', '-q', '-m', 'binary only');
  git(dir, 'rm', '-q', 'a.txt');
  git(dir, 'commit', '-q', '-m', 'delete only');
  return dir;
}

test('the bundled copy is identical to the repository script', () => {
  assert.equal(readFileSync(COPY, 'utf8'), readFileSync(SCRIPT, 'utf8'));
});

test('expected count only includes commits with added non-binary lines', () => {
  const dir = makeRepo();
  const out = execFileSync('sh', [SCRIPT, 'expected-count'], { cwd: dir, env: cleanEnv(), encoding: 'utf8' }).trim();
  rmSync(dir, { recursive: true, force: true });
  assert.equal(out, '1');
});

test('baseline entry count also works for a baseline on a single line', () => {
  const dir = mkdtempSync(join(tmpdir(), 'secret-scan-baseline-'));
  const file = join(dir, 'baseline.json');
  writeFileSync(file, '[{"RuleID":"a"},{"RuleID":"b"},{"RuleID":"c"}]');
  const out = execFileSync('sh', [SCRIPT, 'baseline-count', file], { env: cleanEnv(), encoding: 'utf8' }).trim();
  rmSync(dir, { recursive: true, force: true });
  assert.equal(out, '3');
});

const STUB_GITLEAKS = `#!/bin/sh
report=""
dir=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --report-path) report=$2; shift ;;
    --*) ;;
    *) dir=$1 ;;
  esac
  shift
done
echo "1:23AM INF \${STUB_COUNT:-1} commits scanned."
[ -z "\${STUB_LOG_LINE:-}" ] || echo "\$STUB_LOG_LINE"
if [ -f "$dir/planted.txt" ]; then
  echo '[{"RuleID":"stub"}]' > "$report"
  exit 1
fi
echo '[]' > "$report"
`;

test('the self-test leaves the real repository untouched when it runs under a git hook environment', () => {
  const base = mkdtempSync(join(tmpdir(), 'secret-scan-hook-'));
  const real = join(base, 'real');
  const bin = join(base, 'bin');
  mkdirSync(real);
  mkdirSync(bin);
  writeFileSync(join(bin, 'gitleaks'), STUB_GITLEAKS);
  chmodSync(join(bin, 'gitleaks'), 0o755);
  git(real, 'init', '-q');
  writeFileSync(join(real, 'a.txt'), 'text\n');
  git(real, 'add', '.');
  git(real, 'commit', '-q', '-m', 'first');
  const snapshot = () => [
    git(real, 'config', '--local', '--get', 'core.bare').trim(),
    git(real, 'rev-list', '--all', '--count').trim(),
    git(real, 'for-each-ref').trim(),
    git(real, 'config', '--local', '--list').split('\n').filter((l) => l.startsWith('user.')).length,
  ].join('|');
  const before = snapshot();
  const hookEnv = cleanEnv({
    PATH: `${bin}:${process.env.PATH}`,
    GIT_DIR: join(real, '.git'),
    GIT_INDEX_FILE: join(real, '.git', 'index'),
  });
  const out = execFileSync('sh', [SCRIPT, 'selftest'], { cwd: real, env: hookEnv, encoding: 'utf8' });
  const after = snapshot();
  rmSync(base, { recursive: true, force: true });
  assert.match(out, /selftest ok/);
  assert.equal(after, before);
});

function stubBin() {
  const base = mkdtempSync(join(tmpdir(), 'secret-scan-stub-'));
  const bin = join(base, 'bin');
  mkdirSync(bin);
  writeFileSync(join(bin, 'gitleaks'), STUB_GITLEAKS);
  chmodSync(join(bin, 'gitleaks'), 0o755);
  return { base, bin };
}

function runScan(cwd, extra = {}) {
  const { base, bin } = stubBin();
  let status = 0;
  let out = '';
  try {
    out = execFileSync('sh', [SCRIPT], {
      cwd,
      env: cleanEnv({ PATH: `${bin}:${process.env.PATH}`, ...extra }),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    status = error.status;
    out = `${error.stdout}${error.stderr}`;
  }
  rmSync(base, { recursive: true, force: true });
  return { status, out };
}

function twoCommitRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'secret-scan-guard-'));
  git(dir, 'init', '-q');
  for (const name of ['a', 'b']) {
    writeFileSync(join(dir, `${name}.txt`), `${name}\n`);
    git(dir, 'add', '.');
    git(dir, 'commit', '-q', '-m', name);
  }
  return dir;
}

test('a full clone with enough scanned commits passes', () => {
  const dir = twoCommitRepo();
  const { status, out } = runScan(dir, { STUB_COUNT: '2' });
  rmSync(dir, { recursive: true, force: true });
  assert.equal(status, 0, out);
  assert.match(out, /secret scan covered 2 commits \(at least 2 expected\)/);
});

test('the shallow guard fails on a shallow clone', () => {
  const src = twoCommitRepo();
  const dir = mkdtempSync(join(tmpdir(), 'secret-scan-shallow-'));
  execFileSync('git', ['clone', '-q', '--depth', '1', `file://${src}`, join(dir, 'c')], { env: cleanEnv() });
  const { status, out } = runScan(join(dir, 'c'), { STUB_COUNT: '2' });
  rmSync(src, { recursive: true, force: true });
  rmSync(dir, { recursive: true, force: true });
  assert.notEqual(status, 0);
  assert.match(out, /shallow clone/);
});

test('the partial guard fails on a partial clone', () => {
  const dir = twoCommitRepo();
  git(dir, 'config', 'remote.origin.partialclonefilter', 'tree:0');
  const { status, out } = runScan(dir, { STUB_COUNT: '2' });
  rmSync(dir, { recursive: true, force: true });
  assert.notEqual(status, 0);
  assert.match(out, /partial clone/);
});

test('a directory that is not a repository is reported as such, not as shallow', () => {
  const dir = mkdtempSync(join(tmpdir(), 'secret-scan-norepo-'));
  const { status, out } = runScan(dir, { GIT_CEILING_DIRECTORIES: tmpdir() });
  rmSync(dir, { recursive: true, force: true });
  assert.notEqual(status, 0);
  assert.match(out, /FAIL: not a git repository/);
});

test('zero scanned commits fails', () => {
  const dir = twoCommitRepo();
  const { status, out } = runScan(dir, { STUB_COUNT: '0' });
  rmSync(dir, { recursive: true, force: true });
  assert.notEqual(status, 0);
  assert.match(out, /no commits scanned/);
});

test('a count below the lower bound fails', () => {
  const dir = twoCommitRepo();
  const { status, out } = runScan(dir, { STUB_COUNT: '1' });
  rmSync(dir, { recursive: true, force: true });
  assert.notEqual(status, 0);
  assert.match(out, /expected at least 2/);
});

test('an error line in the scanner log fails even when the exit code is 0', () => {
  const dir = twoCommitRepo();
  const { status, out } = runScan(dir, { STUB_COUNT: '2', STUB_LOG_LINE: '1:23AM ERR Could not load baseline' });
  rmSync(dir, { recursive: true, force: true });
  assert.notEqual(status, 0);
  assert.match(out, /error line/);
});

test('a missing baseline file fails', () => {
  const dir = twoCommitRepo();
  const { status, out } = runScan(dir, { STUB_COUNT: '2', GITLEAKS_BASELINE: join(dir, 'missing.json') });
  rmSync(dir, { recursive: true, force: true });
  assert.notEqual(status, 0);
  assert.match(out, /baseline .* not readable/);
});

test('the self-test ignores a global hooks path and commit signing', () => {
  const { base, bin } = stubBin();
  const dir = mkdtempSync(join(tmpdir(), 'secret-scan-global-'));
  const config = join(dir, 'gitconfig');
  writeFileSync(config, `[core]\n\thooksPath = ${join(dir, 'hooks')}\n[commit]\n\tgpgsign = true\n[gpg]\n\tprogram = false\n`);
  mkdirSync(join(dir, 'hooks'));
  writeFileSync(join(dir, 'hooks', 'pre-commit'), '#!/bin/sh\nexit 1\n');
  chmodSync(join(dir, 'hooks', 'pre-commit'), 0o755);
  const out = execFileSync('sh', [SCRIPT, 'selftest'], {
    cwd: dir,
    env: cleanEnv({ PATH: `${bin}:${process.env.PATH}`, GIT_CONFIG_GLOBAL: config }),
    encoding: 'utf8',
  });
  rmSync(base, { recursive: true, force: true });
  rmSync(dir, { recursive: true, force: true });
  assert.match(out, /selftest ok/);
});
