import { strict as assert } from "node:assert";
import {
  isMarketPublic,
  listingCoordinates,
  normalizePropertyMarketRecord,
  normalizeWantedMarketRecord,
  normalizeMarketRecords,
} from "../js/market-discovery-contract.js";

const base = { id: "a", data: { status: "active", lat: 7.1, lng: 125.6 } };
assert.equal(isMarketPublic(base.data), true);
assert.equal(isMarketPublic({status:"draft"}), false);
assert.deepEqual(listingCoordinates(base.data), {lat:7.1,lng:125.6});

const p = normalizePropertyMarketRecord({
  id:"p1", data:{
    status:"active", lat:7.1,lng:125.6, property_classification:"condo_studio",
    monthly_price:25000, amenities:["Wi-Fi","parking"], description:"test"
  }
});
assert.equal(p.marketKind, "property");
assert.deepEqual(p.marketData.amenities, ["wifi","parking"]);
assert.equal(p.marketData.priceMin, 25000);
assert.equal(p.marketData.priceMax, 25000);

const w = normalizeWantedMarketRecord({
  id:"w1", data:{
    status:"active", lat:7.1,lng:125.6, wanted_classification:"condo_studio",
    budget_min:10000,budget_max:20000, preferredAmenities:["wifi"]
  }
});
assert.equal(w.marketKind, "wanted");
assert.equal(w.marketData.priceMin, 10000);
assert.equal(w.marketData.priceMax, 20000);

assert.equal(normalizeMarketRecords([
  base,
  {id:"b",data:{status:"draft",lat:7,lng:125}}
], "property").length, 1);
console.log("Patch 03 discovery contract tests passed.");
