const fs=require('fs');
const html=fs.readFileSync('market.html','utf8');
const css=fs.readFileSync('css/market.css','utf8');
const js=fs.readFileSync('js/market.js','utf8');

function ok(condition,msg){if(!condition) throw new Error(msg);}
ok(html.includes('id="market-header"'), 'Market Header missing');
ok(html.includes('id="market-map-topbar"'), 'Map Header missing');
ok(css.includes('grid-template-columns:minmax(0,2fr) minmax(320px,1fr)'), 'Desktop right rail contract missing');
ok(css.includes('grid-column:2'), 'Desktop discovery rail column missing');
ok(css.includes('scroll-snap-type:x proximity'), 'Responsive horizontal rail missing');
ok(js.includes('lastFocusedMarketCard'), 'Modal focus return missing');
ok(js.includes('scrollIntoView'), 'Card/marker scroll synchronization missing');
ok(js.includes('aria-modal'), 'Modal accessibility state missing');
console.log('Patch 06 presentation contract tests: PASS');
