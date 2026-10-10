import { test } from "node:test";
import assert from "node:assert/strict";
import { reveal, type Vault } from "../src/seeds.ts";
import { seal } from "../../engine/src/spawn.ts";

const v = (seed: string) => ({ seed, envelope: seal(seed) });
const VAULT: Vault = { "2026-W52": v("a"), "2026-W41": v("b"), "2027-W01": v("c") };

test("before Census Day nothing opens", () => {
  assert.deepEqual(reveal(VAULT, new Date("2027-01-03T23:59:59Z")), []);
});

test("on Census Day the whole year opens, the next year stays sealed", () => {
  const out = reveal(VAULT, new Date("2027-01-04T00:00:00Z"));
  assert.deepEqual(out.map((r) => r.week), ["2026-W41", "2026-W52"]);
});

test("every revealed seed matches the envelope published for it", () => {
  for (const r of reveal(VAULT, new Date("2030-01-01Z"))) assert.equal(seal(r.seed), r.envelope);
});
