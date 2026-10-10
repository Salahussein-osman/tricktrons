import { test } from "node:test";
import assert from "node:assert/strict";
import { encode, decode, center } from "../src/geohash.ts";

test("Mount Etna summit encodes to sqdwv0mg", () => {
  assert.equal(encode(37.751, 14.9934, 8), "sqdwv0mg");
});

test("shorter hash is a prefix of the longer one", () => {
  assert.equal(encode(37.751, 14.9934, 4), "sqdw");
});

test("decode gives a box containing the original point", () => {
  const b = decode("sqdwv0mg");
  assert.ok(b.latMin <= 37.751 && 37.751 <= b.latMax);
  assert.ok(b.lonMin <= 14.9934 && 14.9934 <= b.lonMax);
});

test("encode(center(h)) round-trips", () => {
  for (const h of ["sqdwv0", "sxk3", "u4pruydq", "0", "zzzz"]) {
    const c = center(h);
    assert.equal(encode(c.lat, c.lon, h.length), h);
  }
});

test("bad characters are rejected", () => {
  assert.throws(() => decode("sqda")); // 'a' is not in geohash base32
});
