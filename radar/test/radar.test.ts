import { test } from "node:test";
import assert from "node:assert/strict";
import { distance, bearing, spawnsAround, blip, radar, RANGE_M, NEAR_M } from "../src/radar.ts";
import { claimKey } from "../src/key.ts";
import { spawnsIn } from "../../engine/src/spawn.ts";

const WEEK = "2026-W40";
const SEED = "test-seed"; // real seeds are secret, one per week
const ETNA = { lat: 37.751, lon: 14.9934 };

test("distance and bearing: one degree of latitude due north", () => {
  assert.ok(Math.abs(distance(0, 0, 1, 0) - 111195) < 10);
  assert.ok(Math.abs(bearing(0, 0, 1, 0) - 0) < 1e-9);
  assert.ok(Math.abs(bearing(0, 0, 0, 1) - 90) < 1e-9);
});

test("radar only returns TTs inside its range", () => {
  for (const b of radar(ETNA.lat, ETNA.lon, WEEK, SEED)) assert.ok(b.distance <= RANGE_M + 250);
});

test("radar finds every engine spawn within range (no cell missed)", () => {
  const found = new Set(spawnsAround(ETNA.lat, ETNA.lon, WEEK, SEED).map((s) => s.cell));
  for (const s of spawnsIn("sqdw", WEEK, SEED))
    if (distance(ETNA.lat, ETNA.lon, s.lat, s.lon) <= RANGE_M) assert.ok(found.has(s.cell), `missed ${s.cell}`);
});

test("far blips give no exact spot and no TT", () => {
  const s = spawnsAround(ETNA.lat, ETNA.lon, WEEK, SEED).find((s) => distance(ETNA.lat, ETNA.lon, s.lat, s.lon) > NEAR_M)!;
  const b = blip(ETNA.lat, ETNA.lon, s, SEED);
  assert.equal(b.level, "far");
  assert.equal(Object.keys(b).sort().join(), "bearing,distance,level");
});

test("close but not on it: exact spot, no key", () => {
  const s = spawnsAround(ETNA.lat, ETNA.lon, WEEK, SEED)[0];
  const b = blip(s.lat + 0.001, s.lon, s, SEED); // ~110 m north
  assert.equal(b.level, "near");
  assert.ok(!("key" in b));
});

test("standing on it: the key appears and matches claimKey", () => {
  const s = spawnsAround(ETNA.lat, ETNA.lon, WEEK, SEED)[0];
  const b = blip(s.lat, s.lon, s, SEED);
  assert.equal(b.level, "here");
  assert.equal(b.level === "here" && b.key, claimKey(SEED, s.cell));
});

test("keys differ by cell and by seed, and look like xxxx-xxxx-xxxx-xxxx", () => {
  assert.match(claimKey(SEED, "sqdwv0mg"), /^[0-9a-f]{4}(-[0-9a-f]{4}){3}$/);
  assert.notEqual(claimKey(SEED, "sqdwv0mg"), claimKey(SEED, "sqdwv0mh"));
  assert.notEqual(claimKey(SEED, "sqdwv0mg"), claimKey("next-week-seed", "sqdwv0mg"));
});
