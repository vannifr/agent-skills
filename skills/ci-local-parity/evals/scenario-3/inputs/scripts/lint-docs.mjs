import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { RULES } from './rules.mjs';

const dir = process.argv[2];
let failed = 0;
for (const name of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
  const text = readFileSync(join(dir, name), 'utf8');
  for (const rule of RULES) {
    const problem = rule.check(text);
    if (problem) {
      console.error(`${name}: ${rule.id}: ${problem}`);
      failed++;
    }
  }
}
process.exit(failed ? 1 : 0);
