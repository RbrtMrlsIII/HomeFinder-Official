import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const htmlFiles = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
const triad = [
  'cinematic-3d-adapter.js',
  'cinematic-3d-asset-loader.js',
  'cinematic-3d-renderer.js',
];

test('M1: product HTML does not script-load WebGL/Three triad', () => {
  for (const f of htmlFiles) {
    const t = fs.readFileSync(path.join(root, f), 'utf8');
    for (const name of triad) {
      assert.equal(
        t.includes(`src="js/${name}"`) || t.includes(`src="js/reference-3d/${name}"`),
        false,
        `${f} must not load ${name}`
      );
    }
  }
});

test('M1: triad modules live only under js/reference-3d/', () => {
  for (const name of triad) {
    assert.equal(fs.existsSync(path.join(root, 'js', name)), false, `js/${name} must not exist`);
    assert.equal(fs.existsSync(path.join(root, 'js/reference-3d', name)), true, `reference-3d/${name} required`);
  }
});

test('M1: cinematic-ui keeps optional mount (no hard dependency)', () => {
  const ui = fs.readFileSync(path.join(root, 'js/cinematic-ui.js'), 'utf8');
  assert.match(ui, /hfCinematic3D\?\.mount/);
});
