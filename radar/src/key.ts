// The claim key: what you get for physically standing on a TT.
//
// It comes from the week's secret seed, so until Census Day only the server can
// make it, and only hands it over to someone standing in the TT's cell. Hash555
// is a sponge, so putting the secret in front is safe (no length extension).

import { hash555, toHex } from "../../engine/src/hash.ts";

// 16 hex chars, shown as 4 groups: "3f9a-01c2-..." — short enough to copy by hand.
// The seed is already one per week, so a new week means new keys.
export function claimKey(seed: string, cell: string): string {
  return toHex(hash555(`key|${seed}|${cell}`)).slice(0, 16).match(/.{4}/g)!.join("-");
}
