// Claims: the database half of layer 3. Paste the claim code, it's checked and
// recorded. First claim wins; after that the TT is gone from everyone's radar.
//
// Until Census Day the public only sees each claim's route: the last 30 m of the
// walk, as steps from the TT, drawn as a constellation on black. Which TT, where,
// and who stay sealed until the year's Census Day.

import { DatabaseSync } from "node:sqlite";
import { timingSafeEqual } from "node:crypto";
import { spawnAt } from "../../engine/src/spawn.ts";
import { censusDay, weekYear } from "../../engine/src/week.ts";
import type { TT } from "../../engine/src/roll.ts";
import { RARITY_CAPS, type Rarity } from "../../engine/src/catalogue.ts";
import { FOUNDER_SERIAL } from "../../engine/src/roll.ts";
import { claimKey } from "./key.ts";

export const ROUTE_M = 30;     // how much of the walk is kept
const MAX_POINTS = 200;

// A route point: metres east, metres north of the TT. Never GPS coordinates.
export type Point = [number, number];

// Keep only the last ROUTE_M metres of walking, rounded to the metre.
export function trimRoute(route: unknown): Point[] {
  if (!Array.isArray(route)) return [];
  const pts = route
    .filter((p): p is Point => Array.isArray(p) && p.length === 2 && p.every((n) => Number.isFinite(n)))
    .slice(-MAX_POINTS);
  const out: Point[] = [];
  let walked = 0;
  for (let i = pts.length - 1; i >= 0; i--) {
    if (out.length) {
      const [x, y] = out[0];
      walked += Math.hypot(pts[i][0] - x, pts[i][1] - y);
      if (walked > ROUTE_M) break;
    }
    out.unshift(pts[i]);
  }
  return out.map(([x, y]) => [Math.round(x), Math.round(y)]);
}

// Claim code = the TT's 8-char cell + its key: "sqdwtk7f-7689-719b-0d17-3af4".
const CODE = /^([0-9bcdefghjkmnpqrstuvwxyz]{8})-([0-9a-f]{4}(?:-[0-9a-f]{4}){3})$/;

export type ClaimResult = { ok: true; tt: TT; serial: number } | { ok: false; error: string };

// Serial numbers count up inside each tier: the first Legendary claimed is #1.
// #555 of every tier belongs to the founder, so players skip straight over it.
export function nextSerial(claimedInTier: number): number {
  const n = claimedInTier + 1;
  return n >= FOUNDER_SERIAL ? n + 1 : n;
}

// `caps`: how many of each tier can ever be claimed. Only tests pass anything else.
export function openClaims(file: string | URL, caps: Record<Rarity, number> = RARITY_CAPS) {
  const db = new DatabaseSync(file instanceof URL ? file.pathname : file);
  db.exec(`CREATE TABLE IF NOT EXISTS claims (
    week  TEXT NOT NULL,
    cell  TEXT NOT NULL,
    rarity TEXT NOT NULL,
    serial INTEGER NOT NULL,
    name  TEXT NOT NULL,
    route TEXT NOT NULL,
    at    TEXT NOT NULL,
    PRIMARY KEY (week, cell),
    UNIQUE (rarity, serial)
  )`);

  const isClaimed = (week: string, cell: string) =>
    !!db.prepare("SELECT 1 FROM claims WHERE week = ? AND cell = ?").get(week, cell);

  const claimedIn = (rarity: Rarity) =>
    (db.prepare("SELECT COUNT(*) AS n FROM claims WHERE rarity = ?").get(rarity) as { n: number }).n;

  // A tier is full once its cap is claimed (the founder's #555 counts as one);
  // its TTs stop showing on the radar.
  const tierFull = (rarity: Rarity) => claimedIn(rarity) + 1 >= caps[rarity];

  function claim(input: { code?: unknown; name?: unknown; route?: unknown },
                 week: string, seed: string, now = new Date()): ClaimResult {
    const m = CODE.exec(String(input.code ?? "").trim().toLowerCase());
    if (!m) return { ok: false, error: "that's not a claim code" };
    const [, cell, key] = m;

    // The TT must really be there this week, and the key must be its key.
    const s = spawnAt(cell.slice(0, 6), week, seed);
    const want = Buffer.from(claimKey(seed, cell));
    const got = Buffer.from(key);
    if (!s || s.cell !== cell || got.length !== want.length || !timingSafeEqual(got, want))
      return { ok: false, error: "wrong code (or it's from another week)" };

    const r = s.tt.rarity;
    if (tierFull(r)) return { ok: false, error: `all ${caps[r].toLocaleString("en")} ${r} TTs are claimed` };

    if (isClaimed(week, cell)) return { ok: false, error: "someone already claimed this one" };

    const name = String(input.name ?? "").trim().slice(0, 40) || "anonymous";
    const serial = nextSerial(claimedIn(r));
    db.prepare("INSERT INTO claims (week, cell, rarity, serial, name, route, at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(week, cell, r, serial, name, JSON.stringify(trimRoute(input.route)), now.toISOString());
    return { ok: true, tt: s.tt, serial };
  }

  // The public feed. Sealed claims show only their constellation; once their
  // year's Census Day has passed, who, where and what are shown too.
  // `seedOf` returns a week's seed (to re-roll the TT), only asked for opened years.
  function feed(seedOf: (week: string) => string | undefined, now = new Date()) {
    const rows = db.prepare("SELECT week, cell, serial, name, route, at FROM claims ORDER BY at DESC").all() as
      { week: string; cell: string; serial: number; name: string; route: string; at: string }[];
    return rows.map((r) => {
      const route = JSON.parse(r.route) as Point[];
      if (censusDay(weekYear(r.week)) > now) return { sealed: true, week: r.week, route };
      const seed = seedOf(r.week);
      const tt = seed ? spawnAt(r.cell.slice(0, 6), r.week, seed)?.tt : undefined;
      return { sealed: false, week: r.week, route, cell: r.cell, serial: r.serial, name: r.name, at: r.at, tt };
    });
  }

  return { claim, isClaimed, tierFull, feed };
}
