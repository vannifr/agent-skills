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
echo "1 commits scanned."
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
