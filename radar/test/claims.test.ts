import { test } from "node:test";
import assert from "node:assert/strict";
import { openClaims, trimRoute, nextSerial } from "../src/claims.ts";
import { claimKey } from "../src/key.ts";
import { spawnsIn } from "../../engine/src/spawn.ts";

const WEEK = "2026-W41";
const SEED = "test-seed";
const tt = spawnsIn("sqdwv", WEEK, SEED)[0];
const code = `${tt.cell}-${claimKey(SEED, tt.cell)}`;
const IN_2026 = new Date("2026-10-10Z");
const AFTER_CENSUS = new Date("2027-01-05Z");

test("a real code claims the TT and returns what it is", () => {
  const c = openClaims(":memory:");
  const r = c.claim({ code, name: "salah" }, WEEK, SEED, IN_2026);
  assert.ok(r.ok);
  assert.equal(r.ok && r.serial, 1);
  assert.deepEqual(r.ok && r.tt, tt.tt);
  assert.ok(c.isClaimed(WEEK, tt.cell));
});

test("first claim wins", () => {
  const c = openClaims(":memory:");
  assert.ok(c.claim({ code }, WEEK, SEED).ok);
  assert.deepEqual(c.claim({ code }, WEEK, SEED), { ok: false, error: "someone already claimed this one" });
});

test("wrong key, wrong week, garbage: all refused", () => {
  const c = openClaims(":memory:");
  const bad = code.slice(0, -1) + (code.endsWith("0") ? "1" : "0");
  assert.equal(c.claim({ code: bad }, WEEK, SEED).ok, false);
  assert.equal(c.claim({ code }, "2026-W42", SEED).ok, false);
  assert.equal(c.claim({ code }, WEEK, "another-seed").ok, false);
  assert.equal(c.claim({ code: "lol" }, WEEK, SEED).ok, false);
});

test("a route keeps only the last 30 m, rounded to the metre", () => {
  const walk = Array.from({ length: 101 }, (_, i) => [0, -(100 - i) + 0.4]); // 100 m walk north to the TT
  const r = trimRoute(walk);
  assert.deepEqual(r[r.length - 1], [0, 0]);
  assert.deepEqual(r[0], [0, -30]);
  assert.deepEqual(trimRoute("nope"), []);
  assert.deepEqual(trimRoute([[1, 2], ["x", 3], [NaN, 1]]), [[1, 2]]);
});

test("feed: sealed shows only the route; after Census Day, who/where/what", () => {
  const c = openClaims(":memory:");
  c.claim({ code, name: "salah", route: [[0, -5], [0, 0]] }, WEEK, SEED, IN_2026);
  assert.deepEqual(c.feed(() => SEED, IN_2026), [{ sealed: true, week: WEEK, route: [[0, -5], [0, 0]] }]);
  const open = c.feed(() => SEED, AFTER_CENSUS)[0];
  assert.equal(open.sealed, false);
  assert.equal(!open.sealed && open.name, "salah");
  assert.equal(!open.sealed && open.cell, tt.cell);
  assert.deepEqual(!open.sealed && open.tt, tt.tt);
});

test("tier cap: once a tier is all claimed, no more of it", () => {
  // cap 2 = one for a player + the founder's #555
  const c = openClaims(":memory:", { Common: 2, Rare: 555_000, Legendary: 555 });
  const [a, b] = spawnsIn("sqdwv", WEEK, SEED).filter((s) => s.tt.rarity === "Common");
  assert.ok(c.claim({ code: `${a.cell}-${claimKey(SEED, a.cell)}` }, WEEK, SEED).ok);
  assert.ok(c.tierFull("Common"));
  assert.ok(!c.tierFull("Legendary"));
  assert.deepEqual(c.claim({ code: `${b.cell}-${claimKey(SEED, b.cell)}` }, WEEK, SEED),
    { ok: false, error: "all 2 Common TTs are claimed" });
});

test("serials count up per tier and skip the founder's #555", () => {
  assert.equal(nextSerial(0), 1);
  assert.equal(nextSerial(553), 554);
  assert.equal(nextSerial(554), 556); // #555 is the founder's
  assert.equal(nextSerial(1000), 1002);
});
