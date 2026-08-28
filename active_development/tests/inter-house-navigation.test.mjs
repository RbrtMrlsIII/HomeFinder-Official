import assert from "node:assert/strict";
import test from "node:test";
import { canTravelBetween, destinationFor, planInterHouseTransition, planJourney } from "../js/inter-house-navigation.js";

test("House 1 is the only inter-house hub", () => {
  assert.equal(canTravelBetween("house-1", "house-2"), true);
  assert.equal(canTravelBetween("house-1", "house-3"), true);
  assert.equal(canTravelBetween("house-2", "house-3"), false);
  assert.equal(canTravelBetween("house-3", "house-2"), false);
});

test("direct House 2↔House 3 travel is forbidden", () => {
  assert.equal(planInterHouseTransition("house-2", "house-3", "broker").allowed, false);
  assert.equal(planInterHouseTransition("house-3", "house-2", "seeker").allowed, false);
});

test("cross-house journey is hub-routed without changing role", () => {
  const plan = planJourney("house-2", "house-3", "broker");
  assert.equal(plan.allowed, true);
  assert.equal(plan.mode, "hub-routed");
  assert.deepEqual(plan.legs.map(x => [x.fromHouse, x.toHouse]), [["house-2", "house-1"], ["house-1", "house-3"]]);
  assert.equal(plan.legs[0].role, "broker");
  assert.equal(plan.legs[1].role, "broker");
});

test("role-aware destinations respect the existing route boundary", () => {
  assert.equal(destinationFor("house-2", "broker"), "broker-hq.html");
  assert.equal(destinationFor("house-3", "seeker"), "market.html");
  assert.equal(destinationFor("house-3", "guest"), "login.html");
});
