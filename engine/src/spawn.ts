// Spawning: which squares have a TT this week, and exactly where it sits.
// This is DESIGN.md section 4.3 — deterministic spawns. Same cell + week + seed
// gives the same spawn on every device, and nobody can invent one.
//
// The seed is SECRET: one per week, kept by the server. Each week only its sealed
// envelope, seal(seed), is published. On Census Day every seed opens, and anyone
// can rerun the year with this engine and check every spawn was real.

import { Dice, hash555, toHex } from "./hash.ts";
import { rollTT, type TT } from "./roll.ts";
import { encode, center } from "./geohash.ts";

// The sealed envelope for a week's seed. Published when the week starts; on
// Census Day, hashing the revealed seed must give back exactly this.
export function seal(seed: string): string {
  return toHex(hash555(`seal|${seed}`));
}

// Wildness is geography, not a secret, so it uses a fixed public seed.
const GEO_SEED = "tricktrons-v0";

// Spawn cells are 6 chars (~1.2 x 0.6 km). The TT itself sits at an 8-char
// sub-cell (~38 x 19 m) — precise enough to walk to, per DESIGN.md section 3.
const SPAWN_CELL_LEN = 6;
const CLAIM_CELL_LEN = 8;

// PLACEHOLDER: roughly what fraction of cells hold a TT in a given week.
// Real tuning (density, depletion, habitats) is a design call + open problem 4.2/4.4.
const SPAWN_CHANCE = 0.25;

export type Spawn = {
  cell: string;      // the 8-char claim cell the TT sits in
  lat: number;       // center of that cell
  lon: number;
  wildness: number;  // 0..1, how remote this place is (placeholder, see below)
  tt: TT;
};

// The seed every spawn is rolled from. Cell + week + week seed, nothing else.
export function cellSeed(cell: string, week: string, seed: string): string {
  return `${cell}|${week}|${seed}`;
}

// The seed the TT itself is rolled from. It MUST differ from cellSeed: the spawn
// chance uses cellSeed's first number, so rolling the TT from the same seed made
// rarity reuse it — every spawned TT came out Common (bug found 2026-10-10).
export function ttSeed(cell: string, week: string, seed: string): string {
  return `tt|${cellSeed(cell, week, seed)}`;
}

// Wildness: how remote/wild a cell is. Rarer TTs are meant to favor wilder places.
// PLACEHOLDER — a stable per-cell roll. The real score comes from open datasets
// (population, cell towers, night lights); that's open problem 4.2, not invented here.
// No week tag: geography doesn't change week to week.
export function wildness(cell: string): number {
  return new Dice(`wild|${cell}|${GEO_SEED}`).float();
}

// Does this 6-char cell have a TT this week? If so, where exactly, and what is it?
export function spawnAt(cell6: string, week: string, seed: string): Spawn | null {
  const cs = cellSeed(cell6, week, seed);
  const dice = new Dice(cs);
  if (!dice.chance(SPAWN_CHANCE)) return null; // empty cell this week

  // Place the TT: two more base32 chars pick one of 32x32 sub-cells.
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let cell = cell6;
  while (cell.length < CLAIM_CELL_LEN) cell += BASE32[dice.int(32)];

  const { lat, lon } = center(cell);
  return { cell, lat, lon, wildness: wildness(cell6), tt: rollTT(ttSeed(cell6, week, seed)) };
}

// All spawns inside a region this week. `prefix` is a short geohash (e.g. "sqdw",
// ~39 x 20 km); this enumerates every 6-char spawn cell under it. Used by the radar.
export function spawnsIn(prefix: string, week: string, seed: string): Spawn[] {
  const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  const depth = SPAWN_CELL_LEN - prefix.length;
  if (depth < 0) throw new Error(`prefix longer than a spawn cell: ${prefix}`);

  const out: Spawn[] = [];
  const walk = (cell: string) => {
    if (cell.length === SPAWN_CELL_LEN) {
      const s = spawnAt(cell, week, seed);
      if (s) out.push(s);
      return;
    }
    for (const c of BASE32) walk(cell + c);
  };
  walk(prefix);
  return out;
}

// Find the spawn cell a lat/lon falls in, then check it.
export function spawnNear(lat: number, lon: number, week: string, seed: string): Spawn | null {
  return spawnAt(encode(lat, lon, SPAWN_CELL_LEN), week, seed);
}
