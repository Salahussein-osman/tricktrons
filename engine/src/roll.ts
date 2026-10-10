// Rolling a TT: one seed in, one full creature out. See DESIGN.md 2.6.
//
// The ORDER of rolls below is part of the protocol. Moving, removing or
// inserting a roll changes every TT ever rolled. New rolls go at the END.

import { Dice, hash555, toHex } from "./hash.ts";
import { ELEMENTS, TYPES, SIZES, RARITIES, RARITY_WEIGHTS } from "./catalogue.ts";
import type { Type, Size, Rarity, Element } from "./catalogue.ts";

export type TT = {
  id: string;          // short fingerprint of the seed, e.g. "a3f09c1e"
  element: Element;
  type: Type;
  size: Size;
  rarity: Rarity;
  nocturnal: boolean;
  power: number;       // PLACEHOLDER stat, 1..100
};

// PLACEHOLDERS: tune freely.
const NOCTURNAL_CHANCE = 0.2;
const POWER_RANGE: Record<Rarity, [number, number]> = {
  Common: [1, 40],
  Rare: [30, 75],
  Legendary: [70, 100],
};

export function rollTT(seed: string): TT {
  const dice = new Dice(seed);
  const rarity = dice.weighted(RARITIES, RARITIES.map((r) => RARITY_WEIGHTS[r]));
  return rollRest(seed, dice, rarity);
}

// Everything after rarity, in protocol order.
function rollRest(seed: string, dice: Dice, rarity: Rarity): TT {
  const type = TYPES[dice.int(TYPES.length)];
  const element = ELEMENTS[dice.int(ELEMENTS.length)];
  const size = SIZES[dice.int(SIZES.length)];
  const nocturnal = dice.chance(NOCTURNAL_CHANCE);
  const [lo, hi] = POWER_RANGE[rarity];
  const power = lo + dice.int(hi - lo + 1);

  return {
    id: toHex(hash555(seed)).slice(0, 8),
    element,
    type,
    size,
    rarity,
    nocturnal,
    power,
  };
}

export function describe(tt: TT): string {
  const night = tt.nocturnal ? ", nocturnal" : "";
  return `${tt.rarity} ${tt.element} ${tt.type} (${tt.size}${night}, power ${tt.power}) #${tt.id}`;
}

// The founder's TTs: serial #555 of each tier, reserved from day one and public.
// Rarity is fixed; everything else is rolled from a public seed, so anyone can
// check them and nobody (founder included) could have picked a better one.
export const FOUNDER_SERIAL = 555;

export function founderTT(rarity: Rarity): TT {
  const seed = `founder|${rarity}|${FOUNDER_SERIAL}`;
  return rollRest(seed, new Dice(seed), rarity);
}
