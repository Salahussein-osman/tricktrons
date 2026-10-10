// The seed vault. One secret seed per week, made when the week starts and kept
// only here, in radar/.seeds.json. The world can see each week's sealed envelope,
// never the seed. On Census Day (end of the ISO year) every seed of that year opens.

import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { seal } from "../../engine/src/spawn.ts";
import { isoWeek, censusDay, weekYear } from "../../engine/src/week.ts";

const VAULT = new URL("../.seeds.json", import.meta.url);

export type Vault = Record<string, { seed: string; envelope: string }>;

function load(): Vault {
  return existsSync(VAULT) ? JSON.parse(readFileSync(VAULT, "utf8")) : {};
}

// This week's seed. Made on first use and written down before anyone sees a spawn,
// so it can never change. Only the current week can be made: no seeds ahead of
// time, no inventing a seed for a week that's already over.
export function currentSeed(): { week: string; seed: string } {
  const week = isoWeek();
  const vault = load();
  if (!vault[week]) {
    const seed = randomBytes(32).toString("hex");
    vault[week] = { seed, envelope: seal(seed) };
    writeFileSync(VAULT, JSON.stringify(vault, null, 2), { mode: 0o600 });
  }
  return { week, seed: vault[week].seed };
}

// Every week's envelope, oldest first. Public: this is what the server published.
export function envelopes(): { week: string; envelope: string }[] {
  return Object.entries(load())
    .map(([week, v]) => ({ week, envelope: v.envelope }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

// Census Day: every week whose year has ended is opened — seed and envelope side
// by side, so anyone can check seal(seed) === envelope and replay the week.
// Weeks of the running year stay sealed. Pure (vault + time in), so it's testable.
export function reveal(vault: Vault, now: Date = new Date()) {
  return Object.entries(vault)
    .filter(([week]) => censusDay(weekYear(week)) <= now)
    .map(([week, v]) => ({ week, seed: v.seed, envelope: v.envelope }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

// What the server shows: when the next Census Day is, and every seed opened so far.
export function census(now: Date = new Date()) {
  return { next: censusDay(weekYear(isoWeek(now))).toISOString(), revealed: reveal(load(), now) };
}

// One week's seed, or undefined. Server-side only: used to re-roll TTs of weeks
// whose Census Day has already passed.
export function seedOf(week: string): string | undefined {
  return load()[week]?.seed;
}
