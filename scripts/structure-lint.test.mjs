import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('./structure-lint.mjs', import.meta.url));

function makeFixture(skillMdContent, extraFiles = {}, { exempt = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'structure-lint-test-'));
  const skillDir = join(root, 'skills', 'example-skill');
  mkdirSync(skillDir, { recursive: true });
  if (exempt) {
    mkdirSync(join(root, 'scripts'), { recursive: true });
    writeFileSync(join(root, 'scripts', 'simulation-exempt.txt'), 'example-skill\n');
  }
  writeFileSync(join(skillDir, 'SKILL.md'), skillMdContent);
  for (const [relPath, content] of Object.entries(extraFiles)) {
    const fullPath = join(skillDir, relPath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
  }
  return root;
}

function runLint(root) {
  try {
    const output = execFileSync('node', [SCRIPT], { cwd: root, encoding: 'utf8' });
    return { code: 0, output };
  } catch (err) {
    return { code: err.status, output: (err.stdout || '') + (err.stderr || '') };
  }
}

test('passes for a valid skill', () => {
  const root = makeFixture(
    '---\nname: example-skill\ndescription: A valid example skill for testing.\n---\n\n# Example\n\nBody content.\n'
  );
  const result = runLint(root);
  assert.equal(result.code, 0);
  rmSync(root, { recursive: true, force: true });
});

test('fails when frontmatter is missing', () => {
  const root = makeFixture('# No frontmatter\n\nJust a body.\n');
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /missing YAML frontmatter/);
  rmSync(root, { recursive: true, force: true });
});

test('fails when required frontmatter fields are missing', () => {
  const root = makeFixture('---\nname: example-skill\n---\n\n# Example\n');
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /missing required "description" field/);
  rmSync(root, { recursive: true, force: true });
});

test('fails when SKILL.md exceeds the line limit', () => {
  const longBody = 'line\n'.repeat(501);
  const root = makeFixture(
    `---\nname: example-skill\ndescription: A valid example skill for testing.\n---\n\n${longBody}`
  );
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /exceeds the 500-line limit/);
  rmSync(root, { recursive: true, force: true });
});

test('fails on a placeholder marker', () => {
  const root = makeFixture(
    '---\nname: example-skill\ndescription: A valid example skill for testing.\n---\n\n# Example\n\nTODO: finish this.\n'
  );
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /placeholder marker/);
  rmSync(root, { recursive: true, force: true });
});

test('fails on a broken relative link', () => {
  const root = makeFixture(
    '---\nname: example-skill\ndescription: A valid example skill for testing.\n---\n\nSee [details](references/missing.md).\n'
  );
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /broken relative link/);
  rmSync(root, { recursive: true, force: true });
});

test('passes with a valid relative link', () => {
  const root = makeFixture(
    '---\nname: example-skill\ndescription: A valid example skill for testing.\n---\n\nSee [details](references/details.md).\n',
    { 'references/details.md': '# Details\n' }
  );
  const result = runLint(root);
  assert.equal(result.code, 0);
  rmSync(root, { recursive: true, force: true });
});

test('ignores absolute http(s) links and anchor links', () => {
  const root = makeFixture(
    '---\nname: example-skill\ndescription: A valid example skill for testing.\n---\n\nSee [external](https://example.com/page) and [anchor](#section).\n'
  );
  const result = runLint(root);
  assert.equal(result.code, 0);
  rmSync(root, { recursive: true, force: true });
});

test('passes with a relative link carrying a #fragment to an existing file', () => {
  const root = makeFixture(
    '---\nname: example-skill\ndescription: A valid example skill for testing.\n---\n\nSee [guide](references/details.md#execution-guide).\n',
    { 'references/details.md': '# Details\n\n## Execution guide\n' }
  );
  const result = runLint(root);
  assert.equal(result.code, 0);
  rmSync(root, { recursive: true, force: true });
});

test('fails on a #fragment link whose file does not exist', () => {
  const root = makeFixture(
    '---\nname: example-skill\ndescription: A valid example skill for testing.\n---\n\nSee [guide](references/missing.md#section).\n'
  );
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /broken relative link/);
  rmSync(root, { recursive: true, force: true });
});

const VALID_SKILL = '---\nname: example-skill\ndescription: A valid example skill for testing.\n---\n\n# Example\n';

test('fails on invalid JSON inside a skill directory', () => {
  const root = makeFixture(VALID_SKILL, { 'evals/scenario-0/criteria.json': '{ "broken": ' });
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /invalid JSON/);
  rmSync(root, { recursive: true, force: true });
});

test('fails when plugin.json name does not match the skill directory', () => {
  const root = makeFixture(VALID_SKILL, {
    '.tessl-plugin/plugin.json': JSON.stringify({ name: 'ws/other-skill', skills: ['.'] }),
  });
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /"name" must be/);
  rmSync(root, { recursive: true, force: true });
});

test('passes with valid JSON and a matching plugin.json name', () => {
  const root = makeFixture(VALID_SKILL, {
    '.tessl-plugin/plugin.json': JSON.stringify({ name: 'ws/example-skill', skills: ['.'] }),
  });
  const result = runLint(root);
  assert.equal(result.code, 0);
  rmSync(root, { recursive: true, force: true });
});

const VALID = '---\nname: example-skill\ndescription: A valid example skill for testing.\n---\n\n# Example\n\n';

test('fails when a reference file is not linked from anywhere', () => {
  const root = makeFixture(`${VALID}See [a](references/a.md).\n`, {
    'references/a.md': '# A\n',
    'references/orphan.md': '# Orphan\n',
  });
  const result = runLint(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(result.code, 1);
  assert.match(result.output, /references\/orphan\.md.*not linked/);
});

test('a reference linked only from another reference is reachable', () => {
  const root = makeFixture(`${VALID}See [a](references/a.md).\n`, {
    'references/a.md': '# A\n\nSee [b](b.md).\n',
    'references/b.md': '# B\n',
  });
  const result = runLint(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(result.code, 0, result.output);
});

test('fails on a broken relative link inside a reference file', () => {
  const root = makeFixture(`${VALID}See [a](references/a.md).\n`, {
    'references/a.md': '# A\n\nSee [gone](missing.md).\n',
  });
  const result = runLint(root);
  rmSync(root, { recursive: true, force: true });
  assert.equal(result.code, 1);
  assert.match(result.output, /a\.md.*broken relative link "missing\.md"/);
});

const SCENARIO = { 'evals/scenario-0/task.md': '# Task\n', 'evals/scenario-0/criteria.json': '{}' };
const RECORD = (rows = '| scenario-0 | 40 | 85 |') =>
  `# Local simulation\n\ndate: 2026-10-13\nmodel: sonnet\nscorer: opus, blind\n\n| scenario | baseline | with skill |\n|---|---|---|\n${rows}\n`;

test('a skill without a local simulation record fails unless it is exempt', () => {
  const root = makeFixture(VALID_SKILL, SCENARIO, { exempt: false });
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /evals\/simulation\.md: missing/);
  rmSync(root, { recursive: true, force: true });
});

test('a skill with a valid simulation record passes without an exemption', () => {
  const root = makeFixture(VALID_SKILL, { ...SCENARIO, 'evals/simulation.md': RECORD() }, { exempt: false });
  const result = runLint(root);
  assert.equal(result.code, 0, result.output);
  rmSync(root, { recursive: true, force: true });
});

test('a record where the run with the skill does not beat the baseline fails', () => {
  const root = makeFixture(VALID_SKILL, { ...SCENARIO, 'evals/simulation.md': RECORD('| scenario-0 | 85 | 85 |') }, { exempt: false });
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /scenario-0: with skill 85 does not beat baseline 85/);
  rmSync(root, { recursive: true, force: true });
});

test('a record that skips a scenario fails', () => {
  const files = { ...SCENARIO, 'evals/scenario-1/task.md': '# Task\n', 'evals/simulation.md': RECORD() };
  const root = makeFixture(VALID_SKILL, files, { exempt: false });
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /scenario-1: no row in the simulation record/);
  rmSync(root, { recursive: true, force: true });
});

test('a record without date, model or scorer fails', () => {
  const record = '| scenario | baseline | with skill |\n|---|---|---|\n| scenario-0 | 40 | 85 |\n';
  const root = makeFixture(VALID_SKILL, { ...SCENARIO, 'evals/simulation.md': record }, { exempt: false });
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /missing "date:"/);
  assert.match(result.output, /missing "model:"/);
  assert.match(result.output, /missing "scorer:"/);
  rmSync(root, { recursive: true, force: true });
});

test('an exemption for a skill that now has a valid record fails (ratchet)', () => {
  const root = makeFixture(VALID_SKILL, { ...SCENARIO, 'evals/simulation.md': RECORD() });
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /example-skill: remove from scripts\/simulation-exempt\.txt/);
  rmSync(root, { recursive: true, force: true });
});

test('an exemption for a skill that does not exist fails', () => {
  const root = makeFixture(VALID_SKILL, {});
  writeFileSync(join(root, 'scripts', 'simulation-exempt.txt'), 'example-skill\nghost-skill\n');
  const result = runLint(root);
  assert.equal(result.code, 1);
  assert.match(result.output, /ghost-skill: listed in scripts\/simulation-exempt\.txt but no such skill/);
  rmSync(root, { recursive: true, force: true });
});
