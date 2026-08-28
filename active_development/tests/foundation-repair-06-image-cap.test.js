import fs from 'fs';
const src = fs.readFileSync('firebase/functions/index.js','utf8');
if (!src.includes('tiers.totalImagesPerListing(tierIndex, packageId)')) throw new Error('missing server image entitlement calculation');
if (!src.includes('if (listing.images !== undefined)')) throw new Error('missing image array enforcement');
if (!src.includes('Image capacity reached')) throw new Error('missing image capacity rejection');
if (!src.includes('Math.min(10, tiers.totalImagesPerListing')) throw new Error('missing hard image ceiling');
console.log('foundation-repair-06-image-cap: PASS');
