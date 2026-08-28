import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredRoutes = ['privacy.html', 'terms.html'];
for (const route of requiredRoutes) {
  assert.ok(fs.existsSync(path.join(root, route)), `Missing repaired legal route: ${route}`);
}

const htmlFiles = fs.readdirSync(root).filter(name => name.endsWith('.html'));
for (const file of htmlFiles) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of text.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
    const target = match[1].split('#')[0].split('?')[0];
    if (!target || /^(?:https?:|mailto:|tel:|javascript:|data:|#)/i.test(target)) continue;
    const resolved = path.resolve(root, path.dirname(file), target);
    assert.ok(resolved.startsWith(path.resolve(root) + path.sep) || resolved === path.resolve(root), `${file}: unsafe local reference ${target}`);
    if (target.startsWith('assets/') && !fs.existsSync(path.join(root, 'assets'))) continue;
    assert.ok(fs.existsSync(resolved), `${file}: broken local reference ${target}`);
  }
}

console.log('Patch 33 foundation repair checks passed.');
