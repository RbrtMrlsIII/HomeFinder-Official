import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const js = read('js/home/physical-ui-objects.js');
const css = read('css/cinematic-ui.css');
const data = JSON.parse(read('data/physical-ui-objects.json'));
const book = data.objects.find(o => o.kind === 'book');

assert.ok(book, 'Listings book object missing');
assert.match(js, /hf:physical-object-activate/);
assert.match(js, /data-object-action/);
assert.match(css, /hf-physical-object/);
assert.equal(book.id, 'listings-book');
assert.equal(book.action, 'navigate');
assert.equal(book.href, 'market.html');

console.log('A.4.4-B listings book contract: 4/4');
