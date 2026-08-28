import assert from "node:assert/strict";
import test from "node:test";
import { planJourney, planInterHouseTransition, destinationFor } from "../js/inter-house-navigation.js";
import { routeAccess } from "../js/route-access-contract.js";

const ROLES = ["guest", "owner", "seeker", "broker", "admin", "moderator", "staff"];
const HOUSES = ["house-1", "house-2", "house-3"];
const DIRECT_PAIRS = [["house-1", "house-2"], ["house-1", "house-3"], ["house-2", "house-1"], ["house-3", "house-1"]];

for (const role of ROLES) {
  test(`5.5G.6K ${role}: complete role × house matrix`, () => {
    for (const house of HOUSES) {
      const destination = destinationFor(house, role);
      const access = routeAccess(destination, role);
      assert.equal(typeof destination, "string");
      assert.equal(access.allowed, true, `${role} destination ${house} must be reachable through its own route boundary`);
    }

    for (const [from, to] of DIRECT_PAIRS) {
      const plan = planJourney(from, to, role);
      assert.equal(plan.allowed, true, `${role} ${from}->${to} should be a controlled transition`);
      assert.equal(plan.role, role, `${role} must remain unchanged on ${from}->${to}`);
      assert.equal(plan.mode, "controlled-transport");
    }

    for (const [from, to] of [["house-2", "house-3"], ["house-3", "house-2"]]) {
      const plan = planJourney(from, to, role);
      assert.equal(plan.allowed, true, `${role} ${from}->${to} must be hub-routed, not directly traversed`);
      assert.equal(plan.mode, "hub-routed");
      assert.deepEqual(plan.legs.map(leg => [leg.fromHouse, leg.toHouse]), [[from, "house-1"], ["house-1", to]]);
      assert.ok(plan.legs.every(leg => leg.role === role));
      assert.equal(planInterHouseTransition(from, to, role).allowed, false, `${role} direct ${from}->${to} primitive must remain forbidden`);
    }
  });
}
