import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('./structure-lint.mjs', import.meta.url));

function makeFixture(skillMdContent, extraFiles = {}) {
  const root = mkdtempSync(join(tmpdir(), 'structure-lint-test-'));
  const skillDir = join(root, 'skills', 'example-skill');
  mkdirSync(skillDir, { recursive: true });
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
