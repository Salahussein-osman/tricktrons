import { test } from "node:test";
import assert from "node:assert/strict";
import { hash555, toHex, Dice } from "../src/hash.ts";

// Reference outputs from hash555.py. The TypeScript port must match them bit for bit.
const enc = (n: number) => new Uint8Array([n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
const VECTORS: [string | Uint8Array, string][] = [
  ["", "ef5252669f7bd5b269cff1708c11172f25627eee49c53edaee22328bd81f5636f21ed1a7647bc0576c9f7bb0abc172a82dd099634dc9f5cb2f0f3b1012ed32ad"],
  ["abc", "1b1f0800f6ffd7ebd9f2036ff7bd588913cc2c63556af20cc1dd25590063dda94b3be03855b4b72c6e11dad04e44fd57966cabd37301fa10a9a414f8671761ff"],
  ["sqdwv0|2026-W40|world", "e63669f22c5c45492abab7f0b0e585f5a97ea69badd19f1e13778f8830d24cbfe2a184e8b8cb5a7969a7db51a88b4530db558e689d4d0d99f95fe6b39e2e4253"],
  ["x".repeat(31), "0684b1e7c6a04385e9cc09e3e16bbe4ee6716b1e009b3a44eff2f52747e1f1152bbee746483f4c9e4c93a17521c64d7967365743e7bb33b10e700166647f9391"],
  ["x".repeat(32), "ac7c48bd1c57321cc64e237c00ef73bd0f08a8e2cd0eeb02009b7fe374e685890f9c803fddb9f821dee744416b8fbd0f2a7e27ecf6883507f500c5d89ec1d087"],
  ["x".repeat(100), "d08e7ebaedc98c20573d21bfa571c44656eb44103031f05bedb486fcf2ac755a157747c3893dba71e8d9290e03e4920afdff08d8dec5ec4a202b182089e473d3"],
  [enc(1), "56364392225320e846d06e35fcaa1f9fe6d065e54fd23772f6858d01ea7aae2fff0a2f806708378ca4effe5fc6f82ae7db6ffe3b3027850746d9a83858978073"],
  [enc(40075), "570ac20c38ea138462ce0222c0d75ee63fe25238313368608d6ea6a7a3f2925fdd365cb9282f955cd78ae56df1acf3b1ab666c9c5cb5bbe4fe88b79c5285cb3f"],
];

test("matches hash555.py bit for bit", () => {
  for (const [input, expected] of VECTORS) assert.equal(toHex(hash555(input)), expected, `input ${String(input).slice(0, 12)}`);
});

test("output is 512 bits", () => {
  assert.equal(hash555("etna").length, 64);
});

test("one character changes about half the output bits", () => {
  const a = hash555("sqdwv0|2026-W40|world");
  const b = hash555("sqdwv0|2026-W41|world");
  let flipped = 0;
  for (let i = 0; i < 64; i++) for (let x = a[i] ^ b[i]; x; x &= x - 1) flipped++;
  assert.ok(flipped > 200 && flipped < 312, `${flipped} of 512`);
});

test("same seed gives the same rolls", () => {
  const a = new Dice("sqdwv0|2026-W40|world");
  const b = new Dice("sqdwv0|2026-W40|world");
  for (let i = 0; i < 50; i++) assert.equal(a.float(), b.float());
});

test("different seed gives different rolls", () => {
  const a = new Dice("sqdwv0|2026-W40|world");
  const b = new Dice("sqdwv0|2026-W41|world");
  assert.notEqual(a.float(), b.float());
});

test("int stays in range and looks evenly spread", () => {
  const d = new Dice("spread");
  const counts = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 60_000; i++) counts[d.int(6)]++;
  for (const c of counts) assert.ok(c > 9_500 && c < 10_500, `count ${c}`);
});

test("weighted follows the weights", () => {
  const d = new Dice("weights");
  let common = 0;
  for (let i = 0; i < 10_000; i++) if (d.weighted(["common", "rare"], [9, 1]) === "common") common++;
  assert.ok(common > 8_800 && common < 9_200, `common ${common}`);
});
