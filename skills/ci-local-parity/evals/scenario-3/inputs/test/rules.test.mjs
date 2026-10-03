import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../scripts/rules.mjs';

const valid = '## Findings\n| Claim [P] |\n> "exact quote"\n';

for (const rule of RULES) {
  test(`${rule.id} accepts a valid document`, () => {
    assert.equal(rule.check(valid), null);
  });
}

test('valid document with several rows passes', () => {
  const doc = '## Findings\n| A [P] |\n| B [D] |\n> "quote"\n';
  for (const rule of RULES) assert.equal(rule.check(doc), null);
});
