import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnAt, spawnsIn, spawnNear, cellSeed, wildness, seal, ttSeed } from "../src/spawn.ts";
import { Dice } from "../src/hash.ts";
import { rollTT } from "../src/roll.ts";
import { decode } from "../src/geohash.ts";

const WEEK = "2026-W40";
const SEED = "tricktrons-v0"; // test seed; real seeds are secret, one per week

test("spawns are deterministic: same cell + week = same result", () => {
  assert.deepEqual(spawnAt("sqdwv0", WEEK, SEED), spawnAt("sqdwv0", WEEK, SEED));
});

test("a different week can change the cell", () => {
  // Over many cells, at least some differ week to week (spawns reset weekly).
  let changed = 0;
  for (let i = 0; i < 50; i++) {
    const cell = "sqdw" + "0123456789bcdefghjkmnpqrstuvwxyz"[i % 32] + "0";
    if (JSON.stringify(spawnAt(cell, "2026-W40", SEED)) !== JSON.stringify(spawnAt(cell, "2026-W41", SEED))) changed++;
  }
  assert.ok(changed > 0, "no cell changed between weeks");
});

test("a present TT sits in an 8-char cell inside its spawn cell", () => {
  const s = spawnsIn("sqdwv", WEEK, SEED)[0];
  assert.ok(s, "expected at least one spawn under sqdwv");
  assert.equal(s.cell.length, 8);
  assert.ok(s.cell.startsWith("sqdwv"));
});

test("the TT's coordinates fall inside its claim cell", () => {
  const s = spawnsIn("sqdwv", WEEK, SEED).find(Boolean)!;
  const box = decode(s.cell);
  assert.ok(s.lat >= box.latMin && s.lat <= box.latMax);
  assert.ok(s.lon >= box.lonMin && s.lon <= box.lonMax);
});

test("spawn rate is in a sane range (~25% of cells)", () => {
  const cells = spawnsIn("sqdwv", WEEK, SEED).length; // 32 six-char cells under a 5-char prefix
  assert.ok(cells >= 3 && cells <= 16, `got ${cells}/32`);
});

test("spawnNear finds the same spawn as the cell it lands in", () => {
  // Etna summit -> sqdwv0.. ; spawnNear should match spawnAt on that 6-char cell.
  const near = spawnNear(37.751, 14.9934, WEEK, SEED);
  const at = spawnAt("sqdwv0", WEEK, SEED);
  assert.deepEqual(near, at);
});

test("wildness is stable per cell and ignores the week", () => {
  assert.equal(wildness("sqdwv0"), wildness("sqdwv0"));
  assert.ok(wildness("sqdwv0") >= 0 && wildness("sqdwv0") < 1);
});

test("cellSeed is cell | week | week seed", () => {
  assert.equal(cellSeed("sqdwv0", WEEK, SEED), "sqdwv0|2026-W40|tricktrons-v0");
});

test("a different seed gives a different world", () => {
  const a = JSON.stringify(spawnsIn("sqdwv", WEEK, SEED));
  const b = JSON.stringify(spawnsIn("sqdwv", WEEK, "another-seed"));
  assert.notEqual(a, b);
});

test("seal: same seed, same envelope; envelope is 128 hex chars", () => {
  assert.equal(seal("abc"), seal("abc"));
  assert.notEqual(seal("abc"), seal("abd"));
  assert.match(seal("abc"), /^[0-9a-f]{128}$/);
});

test("the TT's roll is independent of the spawn chance (or nothing rare ever spawns)", () => {
  // The spawn chance passes only when cellSeed's first number is < 0.25. The TT's
  // first number (its rarity roll) must still range over all of [0, 1).
  let max = 0;
  for (const s of spawnsIn("sqdw", WEEK, SEED)) {
    const cell6 = s.cell.slice(0, 6);
    max = Math.max(max, new Dice(ttSeed(cell6, WEEK, SEED)).float());
    assert.deepEqual(s.tt, rollTT(ttSeed(cell6, WEEK, SEED)));
  }
  assert.ok(max > 0.9, `rarity rolls stuck below ${max}`);
});
