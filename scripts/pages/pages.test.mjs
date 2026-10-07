import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { verifyDist, probe, startPagesLikeServer, REQUIRED_FILES } from './lib.mjs';

const GOOD_INDEX = `<!doctype html><html><head><title>HomeFinder</title><meta name="description" content="Production lives on GitHub Pages — Vercel is not a production host."></head>
<body><a href="active_development/3d/viewer/SweetHome3DJSViewer-7.5.2/HomeFinderViewer.html">Walk</a> <a href="./">Home</a> <a href="https://github.com/RbrtMrlsIII/HomeFinder-Official">Repo</a></body></html>`;
const GOOD_404 = '<!doctype html><html><head><title>HomeFinder — page not found</title></head><body><a href="./">Home</a></body></html>';

function build(over = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pages-'));
  const files = {
    'index.html': GOOD_INDEX,
    '404.html': GOOD_404,
    'active_development/3d/viewer/SweetHome3DJSViewer-7.5.2/HomeFinderViewer.html': '<html>viewer</html>',
    'master/HomeFinder.sh3d': 'x'.repeat(2000),
    ...over
  };
  for (const [name, content] of Object.entries(files)) {
    if (content === null) continue;
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

test('a correct artifact passes', () => {
  const dir = build();
  try { assert.deepEqual(verifyDist(dir).problems, []); } finally { rmSync(dir, { recursive: true, force: true }); }
});

for (const [name, over, expected] of [
  ['a missing required file', { 'master/HomeFinder.sh3d': null }, /missing required file: master/],
  ['a root-absolute link', { 'index.html': GOOD_INDEX.replace('href="./"', 'href="/app"') }, /root-absolute/],
  ['an auto-redirect landing', { 'index.html': `${GOOD_INDEX}<meta http-equiv="refresh" content="0;url=x">` }, /auto-redirect/],
  ['a broken relative link', { 'index.html': GOOD_INDEX.replace('Home</a>', 'Home</a><a href="nope.html">x</a>') }, /broken relative/],
  ['a Vercel link', { 'index.html': GOOD_INDEX.replace('github.com/RbrtMrlsIII/HomeFinder-Official', 'home-finder.vercel.app') }, /Vercel host/],
  ['a landing without the revival markers', { 'index.html': '<html><body><a href="./">x</a></body></html>' }, /missing the marker/]
]) {
  test(`verifyDist rejects ${name}`, () => {
    const dir = build(over);
    try {
      const result = verifyDist(dir);
      assert.equal(result.ok, false);
      assert.ok(result.problems.some((p) => expected.test(p)), result.problems.join(' | '));
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

test('required files list matches the workflow checks', () => {
  assert.equal(REQUIRED_FILES.length, 4);
});

test('a correct artifact passes the probe when served under the project path', async () => {
  const dir = build();
  const { server, url } = await startPagesLikeServer(dir);
  try {
    const result = await probe(url, { attempts: 1, delayMs: 0 });
    assert.equal(result.ok, true, JSON.stringify(result.results.filter((r) => !r.ok)));
  } finally { server.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('the probe rejects the legacy redirect page that is live today', async () => {
  const legacy = '<!doctype html><html><head><meta http-equiv="refresh" content="0; url=active_development/3d/viewer/SweetHome3DJSViewer-7.5.2/HomeFinderViewer.html"><title>HomeFinder</title></head><body>Opening the HomeFinder 3D viewer…</body></html>';
  const dir = build({ 'index.html': legacy });
  const { server, url } = await startPagesLikeServer(dir);
  try {
    const result = await probe(url, { attempts: 1, delayMs: 0 });
    assert.equal(result.ok, false);
    const failed = result.results.filter((r) => !r.ok).map((r) => r.name);
    assert.ok(failed.includes('landing is the revival page'));
    assert.ok(failed.includes('landing does not auto-redirect'));
  } finally { server.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('the probe rejects a site whose unknown paths do not serve the HomeFinder 404 page', async () => {
  const dir = build({ '404.html': null });
  const { server, url } = await startPagesLikeServer(dir);
  try {
    const result = await probe(url, { attempts: 1, delayMs: 0 });
    assert.equal(result.ok, false);
    assert.ok(result.results.some((r) => !r.ok && /404 page/.test(r.name)));
  } finally { server.close(); rmSync(dir, { recursive: true, force: true }); }
});
