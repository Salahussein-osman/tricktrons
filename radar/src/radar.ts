// The radar: what a player at (lat, lon) is allowed to see. DESIGN.md section 3,
// "Dragon Radar style" — blips and a direction from far away, the exact spot only
// when you're close, and the key only when you're standing in the claim cell.
//
// The engine knows the whole world. This file decides how much of it to show.

import { encode } from "../../engine/src/geohash.ts";
import { spawnAt, type Spawn } from "../../engine/src/spawn.ts";
import type { TT } from "../../engine/src/roll.ts";
import { claimKey } from "./key.ts";

// PLACEHOLDERS: tune freely.
export const RANGE_M = 3000;   // how far the radar reaches
export const NEAR_M = 200;     // inside this, the exact spot is shown
const FAR_BEARING_STEP = 15;   // far blips: direction rounded to this many degrees
const FAR_DIST_STEP = 250;     // far blips: distance rounded to this many metres

const EARTH_R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

// Great-circle distance in metres.
export function distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(a));
}

// Compass bearing from 1 to 2, degrees clockwise from north.
export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(rad(lon2 - lon1)) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lon2 - lon1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Every spawn whose 6-char cell overlaps the radar circle. Walks a grid of points
// across the circle's bounding box and collects the cells they land in.
export function spawnsAround(lat: number, lon: number, week: string, seed: string): Spawn[] {
  const STEP_M = 250; // smaller than the shortest side of a 6-char cell (~600 m)
  const dLat = STEP_M / 111320;
  const dLon = STEP_M / (111320 * Math.max(Math.cos(rad(lat)), 0.01));
  const n = Math.ceil(RANGE_M / STEP_M) + 2;

  const cells = new Set<string>();
  for (let i = -n; i <= n; i++)
    for (let j = -n; j <= n; j++) cells.add(encode(lat + i * dLat, lon + j * dLon, 6));

  const out: Spawn[] = [];
  for (const c of cells) {
    const s = spawnAt(c, week, seed);
    if (s && distance(lat, lon, s.lat, s.lon) <= RANGE_M) out.push(s);
  }
  return out;
}

// One blip, at whatever level of detail the player has earned.
export type Blip =
  | { level: "far"; bearing: number; distance: number }
  | { level: "near"; bearing: number; distance: number; lat: number; lon: number; tt: TT }
  | { level: "here"; bearing: number; distance: number; lat: number; lon: number; tt: TT; cell: string; key: string };

export function blip(lat: number, lon: number, s: Spawn, seed: string): Blip {
  const d = distance(lat, lon, s.lat, s.lon);
  const b = bearing(lat, lon, s.lat, s.lon);

  // Standing in the TT's own 8-char claim cell: the key appears.
  if (encode(lat, lon, 8) === s.cell)
    return { level: "here", bearing: b, distance: d, lat: s.lat, lon: s.lon, tt: s.tt, cell: s.cell, key: claimKey(seed, s.cell) };

  if (d <= NEAR_M) return { level: "near", bearing: b, distance: d, lat: s.lat, lon: s.lon, tt: s.tt };

  // Far: rough direction and rough distance only. Nothing about what it is.
  const roundTo = (v: number, step: number) => Math.round(v / step) * step;
  return { level: "far", bearing: roundTo(b, FAR_BEARING_STEP) % 360, distance: Math.max(roundTo(d, FAR_DIST_STEP), FAR_DIST_STEP) };
}

// `gone` says whether a TT can no longer be had (claimed, or its tier is full);
// those vanish from the radar.
export function radar(lat: number, lon: number, week: string, seed: string,
                      gone: (s: Spawn) => boolean = () => false): Blip[] {
  return spawnsAround(lat, lon, week, seed)
    .filter((s) => !gone(s))
    .map((s) => blip(lat, lon, s, seed))
    .sort((a, b) => a.distance - b.distance);
}
