#!/usr/bin/env node
// Structure-only skill lint — no secrets required, safe to run on fork PRs.
// Checks: frontmatter present with name+description, SKILL.md line limit,
// relative links in the body resolve to real files, no placeholder markers,
// English-only and generic text (no personal paths or e-mail addresses),
// and a local simulation record plus a registry overlap record
// (evals/simulation.md, evals/overlap.md) per skill unless exempt.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, basename, dirname } from 'node:path';

const SKILLS_DIR = 'skills';
const MAX_LINES = 500;
const EXEMPT_FILE = join('scripts', 'simulation-exempt.txt');
const PLACEHOLDER_PATTERNS = [/\bTBD\b/, /\bTODO\b/, /\bFIXME\b/, /\[fill in/i, /\[placeholder/i];

const NON_ENGLISH = [
  ['dutch', ['het', 'een', 'niet', 'voor', 'met', 'zijn', 'wordt', 'ook', 'naar', 'maar', 'deze', 'geen', 'worden', 'heeft', 'moet', 'bij', 'dit', 'een']],
  ['french', ['les', 'des', 'une', 'pour', 'avec', 'dans', 'est', 'pas', 'sur', 'sont', 'nous', 'vous', 'qui', 'que']],
  ['german', ['der', 'und', 'nicht', 'ist', 'das', 'ein', 'eine', 'mit', 'für', 'auf', 'wird', 'sind']],
];
const NON_ENGLISH_MIN_HITS = 8;
const NON_ENGLISH_MIN_RATIO = 0.03;
const NOT_GENERIC = [
  [/\/home\/[a-z][\w.-]*/i, 'a personal path (/home/...)'],
  [/\/Users\/[A-Za-z][\w.-]*/, 'a personal path (/Users/...)'],
  [/~\/projects\b/, 'a personal path (~/projects)'],
  [/[\w.+-]+@(?!example\.(com|org|net)\b)[\w-]+\.[\w.-]+/, 'an e-mail address'],
];

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

  const linked = new Set();
  const markdownFiles = [skillMdPath, ...markdownIn(join(skillDir, 'references'))];
  for (const file of markdownFiles) {
    const body = file === skillMdPath ? content : readFileSync(file, 'utf8');
    const linkPattern = /\]\(([^)]+)\)/g;
    let linkMatch;
    while ((linkMatch = linkPattern.exec(body)) !== null) {
      const target = linkMatch[1];
      if (/^https?:\/\//.test(target) || target.startsWith('#')) continue;
      const targetPath = resolve(dirname(file), target.split('#')[0]);
      if (!existsSync(targetPath)) {
        errors.push(`${file}: broken relative link "${target}" (resolved to ${targetPath})`);
      } else if (file !== targetPath) {
        linked.add(targetPath);
      }
    }
  }
  for (const file of markdownFiles.slice(1)) {
    if (!linked.has(resolve(file))) {
      errors.push(`${file}: reference file is not linked from SKILL.md or another reference`);
    }
  }
}

function proseFiles(skillDir) {
  const found = [join(skillDir, 'SKILL.md'), ...markdownIn(join(skillDir, 'references'))];
  const evalsDir = join(skillDir, 'evals');
  if (existsSync(evalsDir)) {
    for (const file of markdownIn(evalsDir)) {
      if (!file.split(/[\\/]/).includes('inputs')) found.push(file);
    }
  }
  return found.filter((f) => existsSync(f));
}

function checkLanguageAndGeneric(skillDir) {
  for (const file of proseFiles(skillDir)) {
    const text = readFileSync(file, 'utf8');
    const words = text.toLowerCase().replace(/```[\s\S]*?```/g, ' ').match(/[a-zà-ÿ]+/g) || [];
    for (const [language, list] of NON_ENGLISH) {
      const set = new Set(list);
      const hits = words.filter((w) => set.has(w)).length;
      if (hits >= NON_ENGLISH_MIN_HITS && hits / words.length >= NON_ENGLISH_MIN_RATIO) {
        errors.push(`${file}: not English (${hits} ${language} function words in ${words.length}); skills are written in English`);
        break;
      }
    }
    for (const [pattern, label] of NOT_GENERIC) {
      const m = text.match(pattern);
      if (m) errors.push(`${file}: not generic, contains ${label}: "${m[0]}"`);
    }
  }
}

function markdownIn(dir) {
  if (!existsSync(dir)) return [];
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...markdownIn(full));
    else if (entry.name.endsWith('.md')) found.push(full);
  }
  return found;
}

function jsonFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...jsonFiles(full));
    else if (entry.name.endsWith('.json')) found.push(full);
  }
  return found;
}

function checkJson(skillDir) {
  for (const file of jsonFiles(skillDir)) {
    try {
      JSON.parse(readFileSync(file, 'utf8'));
    } catch (err) {
      errors.push(`${file}: invalid JSON (${err.message})`);
    }
  }
  const pluginPath = join(skillDir, '.tessl-plugin', 'plugin.json');
  if (existsSync(pluginPath)) {
    try {
      const plugin = JSON.parse(readFileSync(pluginPath, 'utf8'));
      if (!/^[^/]+\/[^/]+$/.test(plugin.name || '') || plugin.name.split('/')[1] !== basename(skillDir)) {
        errors.push(`${pluginPath}: "name" must be "<workspace>/${basename(skillDir)}", found "${plugin.name}"`);
      }
    } catch {
    }
  }
}

function simulationProblems(skillDir) {
  const evalsDir = join(skillDir, 'evals');
  const scenarios = existsSync(evalsDir)
    ? readdirSync(evalsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && /^scenario-\d+$/.test(e.name))
        .map((e) => e.name)
    : [];
  if (scenarios.length === 0) return ['no evals/scenario-N directories'];
  const recordPath = join(evalsDir, 'simulation.md');
  if (!existsSync(recordPath)) return [`${recordPath}: missing (run the local simulation, see CONTRIBUTING.md)`];
  const record = readFileSync(recordPath, 'utf8');
  const problems = [];
  for (const field of ['date', 'model', 'scorer']) {
    if (!new RegExp(`^${field}:\\s*\\S`, 'm').test(record)) problems.push(`${recordPath}: missing "${field}:" line`);
  }
  const rows = new Map();
  for (const m of record.matchAll(/^\|\s*(scenario-\d+)\s*\|\s*(\d{1,3})\s*\|\s*(\d{1,3})\s*\|\s*$/gm)) {
    rows.set(m[1], [Number(m[2]), Number(m[3])]);
  }
  for (const scenario of scenarios) {
    const row = rows.get(scenario);
    if (!row) {
      problems.push(`${recordPath}: ${scenario}: no row in the simulation record`);
    } else if (row[0] > 100 || row[1] > 100) {
      problems.push(`${recordPath}: ${scenario}: scores must be 0-100`);
    } else if (row[1] <= row[0]) {
      problems.push(`${recordPath}: ${scenario}: with skill ${row[1]} does not beat baseline ${row[0]}`);
    }
  }
  return problems;
}

function overlapProblems(skillDir) {
  const recordPath = join(skillDir, 'evals', 'overlap.md');
  if (!existsSync(recordPath)) return [`${recordPath}: missing (search the registry first, see CONTRIBUTING.md)`];
  const record = readFileSync(recordPath, 'utf8');
  const problems = [];
  for (const field of ['date', 'query', 'closest']) {
    if (!new RegExp(`^${field}:\\s*\\S`, 'm').test(record)) problems.push(`${recordPath}: missing "${field}:" line`);
  }
  const different = record.match(/^different:\s*(.+)$/m);
  if (!different || different[1].trim().split(/\s+/).length < 8) {
    problems.push(`${recordPath}: "different:" must be a sentence of at least 8 words that stays true after reading the closest match`);
  }
  return problems;
}

function checkSimulations(names) {
  const exempt = existsSync(EXEMPT_FILE)
    ? readFileSync(EXEMPT_FILE, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean)
    : [];
  for (const name of exempt) {
    if (!names.includes(name)) {
      errors.push(`${name}: listed in ${EXEMPT_FILE} but no such skill`);
    }
  }
  for (const name of names) {
    const problems = simulationProblems(join(SKILLS_DIR, name));
    if (exempt.includes(name)) {
      if (problems.length === 0) errors.push(`${name}: remove from ${EXEMPT_FILE}, the simulation record is valid`);
    } else {
      for (const problem of problems) errors.push(problem.startsWith(SKILLS_DIR) ? problem : `${name}: ${problem}`);
      for (const problem of overlapProblems(join(SKILLS_DIR, name))) errors.push(problem);
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
  checkJson(join(SKILLS_DIR, name));
  checkLanguageAndGeneric(join(SKILLS_DIR, name));
}

checkSimulations(skillDirs);

if (errors.length > 0) {
  console.error(`structure-lint found ${errors.length} issue(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`structure-lint passed for ${skillDirs.length} skill(s): ${skillDirs.join(', ')}`);
