import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const SCRIPT = resolve('scripts/secret-scan.sh');
const COPY = resolve('skills/ci-hardening/references/secret-scan.sh');

function git(cwd, ...args) {
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...args], { cwd, stdio: 'pipe' });
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
  const out = execFileSync('sh', [SCRIPT, 'expected-count'], { cwd: dir, encoding: 'utf8' }).trim();
  rmSync(dir, { recursive: true, force: true });
  assert.equal(out, '1');
});

test('baseline entry count also works for a baseline on a single line', () => {
  const dir = mkdtempSync(join(tmpdir(), 'secret-scan-baseline-'));
  const file = join(dir, 'baseline.json');
  writeFileSync(file, '[{"RuleID":"a"},{"RuleID":"b"},{"RuleID":"c"}]');
  const out = execFileSync('sh', [SCRIPT, 'baseline-count', file], { encoding: 'utf8' }).trim();
  rmSync(dir, { recursive: true, force: true });
  assert.equal(out, '3');
});
