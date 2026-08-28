import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith('.html'));
const css = fs.readFileSync(path.join(root, 'css', 'variables.css'), 'utf8');
const roots = JSON.parse(fs.readFileSync(path.join(root, 'data', 'design-roots.json'), 'utf8'));
const theme = JSON.parse(fs.readFileSync(path.join(root, 'data', 'theme-system.json'), 'utf8'));

if (!css.includes('--hf-surface-page') || !css.includes('--hf-duration-cinematic') || !css.includes('--hf-camera-transition-duration')) {
  throw new Error('design root tokens are incomplete');
}
if (roots.legacyBinaryThemeMode !== 'removed' || theme.legacy_ui_mode !== 'removed_from_active_source') {
  throw new Error('legacy binary theme mode is not retired');
}
for (const html of htmlFiles) {
  const text = fs.readFileSync(path.join(root, html), 'utf8');
  if (!text.includes('js/design-roots.js')) throw new Error(`${html}: missing design root runtime`);
}
for (const file of ['js/design-roots.js', 'data/design-roots.json', 'docs/34-DESIGN-ROOTS-IMPLEMENTATION.md']) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`missing ${file}`);
}
if (/data-theme\s*=|hf_theme|prefers-color-scheme|theme-toggle|light-mode|dark-mode/.test(
  htmlFiles.map((name) => fs.readFileSync(path.join(root, name), 'utf8')).join('\n') +
  fs.readFileSync(path.join(root, 'js', 'cinematic-ui.js'), 'utf8') +
  css
)) {
  throw new Error('legacy binary theme trace found in active source');
}
console.log(`design-roots-contract: PASS (${htmlFiles.length} pages wired)`);
