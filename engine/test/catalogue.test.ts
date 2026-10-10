import { test } from "node:test";
import assert from "node:assert/strict";
import { ELEMENTS, TYPES, NATIONALS, NATIONALS_PLANNED, SPECIES, RARITY_WEIGHTS, RARITY_CAPS, TOTAL_TTS } from "../src/catalogue.ts";

test("6 elements x 6 types + 195 Nationals = 231 species", () => {
  assert.equal(ELEMENTS.length * TYPES.length, 36);
  assert.equal(SPECIES, 36 + NATIONALS_PLANNED);
  assert.equal(SPECIES, 231);
});

test("no country appears twice", () => {
  assert.equal(new Set(NATIONALS.map((n) => n.country)).size, NATIONALS.length);
});

test("all 195 Nationals are listed, each with one element and a reason", () => {
  assert.equal(NATIONALS.length, NATIONALS_PLANNED);
  for (const n of NATIONALS) assert.ok(ELEMENTS.includes(n.element) && n.why, n.name);
});

test("National elements stay balanced: the six differ by at most 2", () => {
  const count = ELEMENTS.map((e) => NATIONALS.filter((n) => n.element === e).length);
  assert.ok(Math.max(...count) - Math.min(...count) <= 2, `${count}`);
});

test("Salah's picks hold", () => {
  const el = (c: string) => NATIONALS.find((n) => n.country === c)!.element;
  assert.equal(el("SO"), "Water");
  assert.equal(el("EG"), "Light");
  assert.equal(el("KE"), "Earth");
});

test("Common is the most likely rarity by far", () => {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(RARITY_WEIGHTS.Common / total > 0.95);
});

test("the tier caps add up to exactly 555,000,000, with 555 Legendaries", () => {
  assert.equal(RARITY_CAPS.Common + RARITY_CAPS.Rare + RARITY_CAPS.Legendary, TOTAL_TTS);
  assert.equal(RARITY_CAPS.Legendary, 555);
});
