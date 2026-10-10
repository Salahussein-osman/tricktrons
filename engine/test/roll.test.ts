import { test } from "node:test";
import assert from "node:assert/strict";
import { rollTT, describe, founderTT } from "../src/roll.ts";
import { Dice } from "../src/hash.ts";
import { RARITIES, RARITY_WEIGHTS } from "../src/catalogue.ts";

const LOCKED = "Common Light Winged (human, nocturnal, power 39) #e63669f2"; // one element + one type, 2026-10-10

test("same seed rolls the same TT", () => {
  assert.deepEqual(rollTT("sqdwv0|2026-W40|world"), rollTT("sqdwv0|2026-W40|world"));
});

test("a known seed always rolls this exact TT (protocol lock)", () => {
  // If this test breaks, the hash or the roll order changed, and every TT ever rolled changed with it.
  assert.equal(describe(rollTT("sqdwv0|2026-W40|world")), LOCKED);
});

test("power stays inside its rarity's range", () => {
  for (let i = 0; i < 1_000; i++) {
    const tt = rollTT(`range-${i}`);
    const [lo, hi] = { Common: [1, 40], Rare: [30, 75], Legendary: [70, 100] }[tt.rarity];
    assert.ok(tt.power >= lo && tt.power <= hi, describe(tt));
  }
});

test("rarity comes out close to its weights over many rolls", () => {
  const n = 200_000;
  const dice = new Dice("rarity");
  const weights = RARITIES.map((r) => RARITY_WEIGHTS[r]);
  let rare = 0;
  for (let i = 0; i < n; i++) if (dice.weighted(RARITIES, weights) === "Rare") rare++;
  const total = weights.reduce((a, b) => a + b, 0);
  const expected = (n * RARITY_WEIGHTS.Rare) / total; // ~200 (Legendary is 1 in a million: too rare to sample here)
  assert.ok(rare > expected * 0.7 && rare < expected * 1.3, `${rare}`);
});

test("founder TTs: fixed rarity, same every time", () => {
  for (const r of RARITIES) {
    assert.equal(founderTT(r).rarity, r);
    assert.deepEqual(founderTT(r), founderTT(r));
  }
});
