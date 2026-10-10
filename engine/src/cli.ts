#!/usr/bin/env node
// Tricktrons engine CLI. Run: node src/cli.ts <command>
//
//   week                         the current ISO week
//   roll   <seed>                roll one TT from any seed
//   seal   <seed>                a week seed's sealed envelope
//   verify <seed> <envelope>     Census Day check: does this seed open this envelope?
//   census [year]                when that year's seeds open
//   founders                     the founder's TTs: #555 of each tier
//   spawn  <cell6> [week]        does this spawn cell hold a TT this week?
//   near   <lat> <lon> [week]    the spawn cell a coordinate falls in
//   radar  <prefix> [week]       every TT in a region this week
//
// spawn / near / radar need the week's seed in TT_SEED. Seeds are secret until
// Census Day; after that, anyone can replay any week with the revealed seed.

import { isoWeek, censusDay, weekYear } from "./week.ts";
import { rollTT, describe, founderTT, FOUNDER_SERIAL } from "./roll.ts";
import { RARITIES } from "./catalogue.ts";
import { spawnAt, spawnsIn, spawnNear, seal } from "./spawn.ts";

function weekSeed(): string {
  const seed = process.env.TT_SEED;
  if (!seed) { console.error("need the week's seed: TT_SEED=<seed> (secret until Census Day)"); process.exit(1); }
  return seed;
}

const [cmd, ...args] = process.argv.slice(2);

function showSpawn(s: ReturnType<typeof spawnAt>, cell: string) {
  if (!s) return console.log(`${cell}: empty this week`);
  console.log(`${s.cell}  (${s.lat.toFixed(5)}, ${s.lon.toFixed(5)})  wildness ${s.wildness.toFixed(2)}`);
  console.log(`  ${describe(s.tt)}`);
}

switch (cmd) {
  case "week":
    console.log(isoWeek());
    break;

  case "roll":
    if (!args[0]) { console.error("need a seed"); process.exit(1); }
    console.log(describe(rollTT(args[0])));
    break;

  case "seal":
    if (!args[0]) { console.error("need a seed"); process.exit(1); }
    console.log(seal(args[0]));
    break;

  case "verify": {
    const [seed, envelope] = args;
    if (!seed || !envelope) { console.error("need a seed and an envelope"); process.exit(1); }
    const ok = seal(seed) === envelope.toLowerCase();
    console.log(ok ? "OK: this seed opens this envelope" : "FAKE: this seed does not match");
    process.exit(ok ? 0 : 1);
  }

  case "founders":
    for (const r of [...RARITIES].reverse()) console.log(`${r} #${FOUNDER_SERIAL}: ${describe(founderTT(r))}`);
    break;

  case "census": {
    const year = args[0] ? Number(args[0]) : weekYear(isoWeek());
    console.log(`Census Day ${year}: ${censusDay(year).toISOString()}`);
    break;
  }

  case "spawn": {
    const [cell, week = isoWeek()] = args;
    if (!cell) { console.error("need a 6-char cell"); process.exit(1); }
    showSpawn(spawnAt(cell, week, weekSeed()), cell);
    break;
  }

  case "near": {
    const [lat, lon, week = isoWeek()] = args;
    if (!lat || !lon) { console.error("need lat and lon"); process.exit(1); }
    showSpawn(spawnNear(Number(lat), Number(lon), week, weekSeed()), `${lat},${lon}`);
    break;
  }

  case "radar": {
    const [prefix, week = isoWeek()] = args;
    if (!prefix) { console.error("need a geohash prefix"); process.exit(1); }
    const spawns = spawnsIn(prefix, week, weekSeed());
    console.log(`${spawns.length} TT(s) under ${prefix} in ${week}:`);
    for (const s of spawns.sort((a, b) => b.tt.power - a.tt.power)) showSpawn(s, s.cell);
    break;
  }

  default:
    console.log("commands: week | roll <seed> | seal <seed> | verify <seed> <envelope> | census [year] | founders | spawn <cell6> [week] | near <lat> <lon> [week] | radar <prefix> [week]");
}
