const fs=require('fs');
const html=fs.readFileSync('market.html','utf8');
const css=fs.readFileSync('css/market.css','utf8');
const js=fs.readFileSync('js/market.js','utf8');
const contract=fs.readFileSync('js/market-discovery-contract.js','utf8');
const sot=fs.readFileSync('docs/core/01-SOURCE-OF-TRUTH.md','utf8');
function ok(c,m){if(!c) throw new Error(m)}

ok(html.includes('id="market-map-topbar"'),'Map header missing');
ok(html.includes('id="market-map-fullscreen-menu"'),'Fullscreen control missing');
ok(html.includes('id="market-map-3d-toggle"'),'3D/flat control missing');
ok(css.includes('grid-template-columns:minmax(0,2fr) minmax(320px,1fr)'),'Desktop right-side workspace missing');
ok(css.includes('grid-template-rows:auto auto 76dvh auto auto'),'Fullscreen 76dvh workspace missing');
ok(css.includes('grid-column:2;grid-row:3/6'),'Desktop discovered-card rail must remain beside the map');
ok(css.includes('@media(max-width:1000px)'),'Tablet responsive breakpoint missing');
ok(js.includes('location.replace("broker-hq.html")'),'Broker Market gate missing');
ok(!js.includes('Broker Market: property and wanted listings are combined'),'Obsolete Broker dual-feed UI copy remains');
ok(!js.includes('function filterBroker'),'Obsolete Broker Market filter path remains');
ok(!js.includes('allListings, ...allWanted'),'Obsolete Broker Market merged pool remains');
ok(contract.includes('broker -> Broker HQ'),'Discovery contract still advertises Broker dual-feed Market');
ok(js.includes('function firstListingImage'),'Expanded card image support is not unified');
ok(js.includes('hidden = !!group && g !== "general" && g !== group'),'Amenity visibility must preserve selections');
ok(sot.includes('Patch 07 implementation alignment'),'SoT Patch 07 alignment note missing');
console.log('Patch 07 Market dedupe/rewiring tests: PASS');
