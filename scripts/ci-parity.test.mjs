import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ci = readFileSync('.woodpecker.yml', 'utf8');
const hooks = readFileSync('.githooks/pre-push', 'utf8');

const SHARED_GATES = ['node scripts/structure-lint.mjs', 'node scripts/test-floor.mjs', 'shellcheck -S style'];

for (const gate of SHARED_GATES) {
  test(`gate "${gate}" runs in CI and in the pre-push hook`, () => {
    assert.ok(ci.includes(gate), `missing in .woodpecker.yml`);
    assert.ok(hooks.includes(gate), `missing in .githooks/pre-push`);
  });
}

test('every CI image is pinned by digest', () => {
  const images = [...ci.matchAll(/^\s*image:\s*(\S+)/gm)].map((m) => m[1]);
  assert.ok(images.length > 0);
  for (const image of images) assert.match(image, /@sha256:[0-9a-f]{64}$/, `${image} is not pinned`);
});

test('no silent fallback in the pipeline', () => {
  assert.doesNotMatch(ci, /\|\|\s*true/);
});

test('the secret scan step runs its self-test before the real scan', () => {
  const selftest = ci.indexOf('scripts/secret-scan.sh selftest');
  const scan = ci.indexOf('sh scripts/secret-scan.sh\n');
  assert.ok(selftest > -1 && scan > selftest);
});
