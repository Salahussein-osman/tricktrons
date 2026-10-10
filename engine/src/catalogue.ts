// Everything that can exist, before anything spawns. See DESIGN.md section 2.

export const ELEMENTS = ["Fire", "Water", "Earth", "Wind", "Light", "Dark"] as const;
export type Element = (typeof ELEMENTS)[number];

// Every TT is ONE element + ONE type: "Fire Dragon", "Dark Spirit". 6 x 6 = 36 species.
export const TYPES = ["Dragon", "Serpent", "Giant", "Spirit", "Beast", "Winged"] as const;
export type Type = (typeof TYPES)[number] | "National";

export const SIZES = ["small", "human", "door", "building"] as const;
export type Size = (typeof SIZES)[number];

export const RARITIES = ["Common", "Rare", "Legendary"] as const;
export type Rarity = (typeof RARITIES)[number];

// How many of each tier can ever be claimed. Adds up to TOTAL_TTS. Salah's pick:
// only 555 Legendaries in the whole world, ever.
export const RARITY_CAPS: Record<Rarity, number> = {
  Common: 554_444_445,
  Rare: 555_000,
  Legendary: 555,
};

// Spawn odds follow the caps, so offers come in the same proportions as the
// supply: a Legendary is about 1 spawn in a million, a Rare about 1 in 1,000.
export const RARITY_WEIGHTS: Record<Rarity, number> = RARITY_CAPS;

export { NATIONALS, type National } from "./nationals.ts";

export const NATIONALS_PLANNED = 195;
export const SPECIES = ELEMENTS.length * TYPES.length + NATIONALS_PLANNED; // 36 + 195 = 231

// Total TTs that can ever exist: 555,000,000, after Hash555. Hard cap. Spawns are
// offers that come and go every week; a TT only counts once it's claimed, and
// after the 555,000,000th claim no more can be made. DESIGN.md 2.4.
export const TOTAL_TTS = 555_000_000;
// (RARITY_CAPS sums to exactly this; a test checks it.)
