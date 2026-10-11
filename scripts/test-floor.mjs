#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const FLOOR = Number(readFileSync(new URL('./test-floor.txt', import.meta.url), 'utf8').trim());
const files = readdirSync('scripts').filter((f) => f.endsWith('.test.mjs')).map((f) => `scripts/${f}`);
const run = spawnSync('node', ['--test', ...files], { encoding: 'utf8' });
process.stdout.write(run.stdout);
process.stderr.write(run.stderr);
if (run.status !== 0) process.exit(run.status ?? 1);

const count = Number((run.stdout.match(/^# tests (\d+)/m) || [])[1]);
if (!Number.isInteger(count) || count <= 0) {
  console.error('test-floor: could not read a test count above zero from the runner output');
  process.exit(1);
}
if (count < FLOOR) {
  console.error(`test-floor: ${count} tests ran, floor is ${FLOOR}. Lower scripts/test-floor.txt only in the commit that deliberately removes tests.`);
  process.exit(1);
}
console.log(`test-floor ok: ${count} tests (floor ${FLOOR})`);
