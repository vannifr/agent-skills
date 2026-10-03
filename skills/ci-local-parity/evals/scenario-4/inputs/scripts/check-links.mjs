import { readFileSync } from 'node:fs';
const text = readFileSync('README.md', 'utf8');
const broken = [...text.matchAll(/\]\((\.\/[^)]+)\)/g)].filter(([, p]) => !p);
if (broken.length) process.exit(1);
