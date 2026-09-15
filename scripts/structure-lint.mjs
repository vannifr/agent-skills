#!/usr/bin/env node
// Structure-only skill lint — no secrets required, safe to run on fork PRs.
// Checks: frontmatter present with name+description, SKILL.md line limit,
// relative links in the body resolve to real files, no placeholder markers.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SKILLS_DIR = 'skills';
const MAX_LINES = 500;
const PLACEHOLDER_PATTERNS = [/\bTBD\b/, /\bTODO\b/, /\bFIXME\b/, /\[fill in/i, /\[placeholder/i];

const errors = [];

function parseFrontmatter(content, filePath) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    errors.push(`${filePath}: missing YAML frontmatter (--- block at top of file)`);
    return null;
  }
  const raw = match[1];
  const fields = {};
  let currentKey = null;
  for (const line of raw.split('\n')) {
    const topLevel = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (topLevel) {
      currentKey = topLevel[1];
      fields[currentKey] = topLevel[2].trim();
    } else if (currentKey && /^\s+\S/.test(line)) {
      fields[currentKey] += ' ' + line.trim();
    }
  }
  return fields;
}

function checkSkill(skillDir) {
  const skillMdPath = join(skillDir, 'SKILL.md');
  if (!existsSync(skillMdPath)) {
    errors.push(`${skillDir}: missing SKILL.md`);
    return;
  }
  const content = readFileSync(skillMdPath, 'utf8');
  const lines = content.split('\n');

  if (lines.length > MAX_LINES) {
    errors.push(`${skillMdPath}: ${lines.length} lines, exceeds the ${MAX_LINES}-line limit`);
  }

  const frontmatter = parseFrontmatter(content, skillMdPath);
  if (frontmatter) {
    if (!frontmatter.name) errors.push(`${skillMdPath}: frontmatter missing required "name" field`);
    if (!frontmatter.description) errors.push(`${skillMdPath}: frontmatter missing required "description" field`);
  }

  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`${skillMdPath}: contains a placeholder marker matching ${pattern}`);
    }
  }

  const linkPattern = /\]\(([^)]+)\)/g;
  let linkMatch;
  while ((linkMatch = linkPattern.exec(content)) !== null) {
    const target = linkMatch[1];
    if (/^https?:\/\//.test(target) || target.startsWith('#')) continue;
    const targetPath = resolve(skillDir, target);
    if (!existsSync(targetPath)) {
      errors.push(`${skillMdPath}: broken relative link "${target}" (resolved to ${targetPath})`);
    }
  }
}

if (!existsSync(SKILLS_DIR)) {
  console.log(`No "${SKILLS_DIR}/" directory found — nothing to lint.`);
  process.exit(0);
}

const skillDirs = readdirSync(SKILLS_DIR).filter((name) =>
  statSync(join(SKILLS_DIR, name)).isDirectory()
);

if (skillDirs.length === 0) {
  console.log(`No skill directories found under ${SKILLS_DIR}/ — nothing to lint.`);
  process.exit(0);
}

for (const name of skillDirs) {
  checkSkill(join(SKILLS_DIR, name));
}

if (errors.length > 0) {
  console.error(`structure-lint found ${errors.length} issue(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`structure-lint passed for ${skillDirs.length} skill(s): ${skillDirs.join(', ')}`);
