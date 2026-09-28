import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPTS = fileURLToPath(new URL('../skills/site-revision/scripts/', import.meta.url));

function writeTree(root, files) {
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
}

function page({ lang = 'en', title = 'Home', body = '', head = '' }) {
  return `<!doctype html><html lang="${lang}"><head>${title}${head}</head><body><main><h1>Heading</h1>${body}</main></body></html>`;
}

async function serve(root) {
  const proc = spawn('python3', ['-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '-d', root]);
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server did not start')), 5000);
    proc.stdout.on('data', (chunk) => {
      const m = String(chunk).match(/port (\d+)/);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
  });
  return { base: `http://127.0.0.1:${port}`, stop: () => proc.kill() };
}

function finalCheck(base, extra = []) {
  const r = spawnSync('python3', [join(SCRIPTS, 'final_check.py'), '--base', base, ...extra], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}

function siteFixture(pages, extraFiles = {}) {
  const root = mkdtempSync(join(tmpdir(), 'site-revision-test-'));
  const locs = Object.keys(pages).map((p) => `<url><loc>__BASE__${p}</loc></url>`).join('');
  const files = { ...extraFiles };
  for (const [p, html] of Object.entries(pages)) files[join(p, 'index.html')] = html;
  writeTree(root, files);
  return { root, locs };
}

async function runSite(pages, extraFiles = {}, args = []) {
  const { root, locs } = siteFixture(pages, extraFiles);
  const server = await serve(root);
  writeFileSync(join(root, 'sitemap.xml'), `<urlset>${locs.replaceAll('__BASE__', server.base)}</urlset>`);
  try {
    return finalCheck(server.base, args);
  } finally {
    server.stop();
    rmSync(root, { recursive: true, force: true });
  }
}

const faqSchema = (names) => `<script type="application/ld+json">${JSON.stringify({
  '@type': 'FAQPage',
  mainEntity: names.map((name) => ({ '@type': 'Question', name })),
})}</script>`;

test('final_check: FAQ questions rendered as headings are not a false alarm', async () => {
  const html = page({
    title: '<title>FAQ</title>',
    head: faqSchema(['How long does a session take?']),
    body: '<h2>How long does a session take?</h2><p>Two hours.</p>',
  });
  const r = await runSite({ '/faq/': html });
  assert.doesNotMatch(r.out, /FAQ/, r.out);
});

test('final_check: FAQ schema question missing from the visible text is reported', async () => {
  const html = page({
    title: '<title>FAQ</title>',
    head: faqSchema(['How long does a session take?', 'What does it cost?']),
    body: '<h2>How long does a session take?</h2>',
  });
  const r = await runSite({ '/faq/': html });
  assert.match(r.out, /FAQ schema question not visible: 'What does it cost\?'/, r.out);
});

test('final_check: FAQ question with HTML entities in the page is matched', async () => {
  const html = page({
    title: '<title>FAQ</title>',
    head: faqSchema(['Comment démarrer ?']),
    body: '<h2>Comment d&eacute;marrer&nbsp;?</h2>',
  });
  const r = await runSite({ '/faq/': html });
  assert.doesNotMatch(r.out, /FAQ schema question not visible/, r.out);
});

test('final_check: <title> with attributes is recognised', async () => {
  const html = page({ title: '<title data-i18n="home.title">Home</title>' });
  const r = await runSite({ '/': html });
  assert.doesNotMatch(r.out, /no <title>/, r.out);
});

test('final_check: forbidden term inside a quote is not reported, outside it is', async () => {
  const quoted = page({ title: '<title>A</title>', body: '<blockquote>we love synergy</blockquote>' });
  const plain = page({ title: '<title>B</title>', body: '<p>we love synergy</p>' });
  const r = await runSite({ '/a/': quoted, '/b/': plain }, {}, ['--forbid-term', 'synergy']);
  assert.doesNotMatch(r.out, /\/a\/: forbidden term/, r.out);
  assert.match(r.out, /\/b\/: forbidden term 'synergy'/, r.out);
});

test('final_check: repository files outside the build output are reported when served', async () => {
  const repo = mkdtempSync(join(tmpdir(), 'repo-'));
  const build = join(repo, 'build');
  writeTree(repo, {
    'notes.md': 'internal', 'tools/run.sh': 'echo', 'secret.env': 'KEY=1', 'build/index.html': 'x',
  });
  const html = page({ title: '<title>Home</title>' });
  const r = await runSite({ '/': html }, { 'notes.md': 'internal', 'tools/run.sh': 'echo' },
    ['--private-from', repo, '--build-dir', build, '--private-path', '/extra.txt']);
  rmSync(repo, { recursive: true, force: true });
  assert.match(r.out, /internal file publicly served: \/notes\.md/, r.out);
  assert.match(r.out, /internal file publicly served: \/tools\/run\.sh/, r.out);
  assert.doesNotMatch(r.out, /publicly served: \/secret\.env/, r.out);
  assert.doesNotMatch(r.out, /publicly served: \/index\.html/, r.out);
});

test('final_check: no hard-coded private paths without flags', async () => {
  const html = page({ title: '<title>Home</title>' });
  const r = await runSite({ '/': html }, { 'AGENTS.md': '# rules' });
  assert.doesNotMatch(r.out, /publicly served/, r.out);
});

test('final_check: --require-snippet reports pages without the analytics snippet', async () => {
  const withIt = page({ title: '<title>A</title>', head: '<script src="/stats.js" data-site="x"></script>' });
  const without = page({ title: '<title>B</title>' });
  const r = await runSite({ '/a/': withIt, '/b/': without }, {}, ['--require-snippet', 'data-site="x"']);
  assert.doesNotMatch(r.out, /\/a\/: missing snippet/, r.out);
  assert.match(r.out, /\/b\/: missing snippet 'data-site="x"'/, r.out);
});

test('final_check: launch blockers are reported', async () => {
  const blocked = page({
    title: '<title>A</title>',
    head: '<meta name="robots" content="noindex, nofollow">',
    body: '<p>Lorem ipsum dolor sit amet</p><a href="http://localhost:3000/contact/">contact</a>',
  });
  const clean = page({ title: '<title>B</title>', body: '<p>Real text</p>' });
  const r = await runSite({ '/a/': blocked, '/b/': clean }, { 'robots.txt': 'User-agent: *\nDisallow: /\n' });
  assert.match(r.out, /\/a\/: noindex on a sitemap page/, r.out);
  assert.match(r.out, /\/a\/: placeholder text 'lorem ipsum'/, r.out);
  assert.match(r.out, /\/a\/: link to a local host: http:\/\/localhost:3000/, r.out);
  assert.match(r.out, /robots\.txt disallows the whole site/, r.out);
  assert.doesNotMatch(r.out, /\/b\/: (noindex|placeholder|link to a local)/, r.out);
});

test('final_check: --placeholder reports project-specific placeholder markers', async () => {
  const html = page({ title: '<title>A</title>', body: '<form action="https://forms.example/YOUR_FORM_ID"></form>' });
  const r = await runSite({ '/a/': html }, {}, ['--placeholder', 'YOUR_FORM_ID']);
  assert.match(r.out, /\/a\/: placeholder text 'YOUR_FORM_ID'/, r.out);
});

test('final_check: --term-allow exempts an exact phrase but not other uses of the term', async () => {
  const allowed = page({ title: '<title>A</title>', body: '<p>This is not a framework.</p>' });
  const other = page({ title: '<title>B</title>', body: '<p>Our framework helps. This is not a framework.</p>' });
  const r = await runSite({ '/a/': allowed, '/b/': other }, {}, ['--forbid-term', 'framework', '--term-allow', 'not a framework']);
  assert.doesNotMatch(r.out, /\/a\/: forbidden term/, r.out);
  assert.match(r.out, /\/b\/: forbidden term 'framework'/, r.out);
});

test('parity_check: --pairs pairs pages with different slugs when hreflang is absent', () => {
  const root = mkdtempSync(join(tmpdir(), 'parity-test-'));
  writeTree(root, {
    'over-ons/index.html': page({ lang: 'nl', body: '<h2>a</h2><h2>b</h2><p>een twee drie</p>' }),
    'en/about/index.html': page({ lang: 'en', body: '<h2>a</h2><p>one two three</p>' }),
    'pairs.txt': '/over-ons/ /en/about/\n',
  });
  const r = spawnSync('python3', [join(SCRIPTS, 'parity_check.py'), '--dist', root, '--base', 'https://example.org',
    '--from-lang', 'nl', '--to-lang', 'en', '--pairs', join(root, 'pairs.txt')], { encoding: 'utf8' });
  rmSync(root, { recursive: true, force: true });
  assert.match(r.stdout, /1 pairs compared, 1 with differences/, r.stdout + r.stderr);
  assert.match(r.stdout, /h2 2\/1/, r.stdout);
});
