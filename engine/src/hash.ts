// Hash555 — the Tricktrons world hash. 512-bit sponge, zeta/pi/factorial core.
// 555 = SSS = triple Salah (S looks like 5; "Salah" is 5 letters). Born on a random Saturday.
// Port of hash555.py (was salah_hash_v4.py), locked bit-for-bit by test/hash.test.ts.
//
// 512-bit state = 8 lanes x 64 bits, 12 rounds. Each round:
//   1. math chain (POWER -> ZETA -> FACT), only on rounds 0, 4, 8
//   2. ergodic tent map + rotations
//   3. cross-lane mixing
//   4. chi S-box, split into lane groups of 5 + 3 (odd groups never lose state)
//   5. round constant (digits of pi)

const P = (1n << 61n) - 1n; // Mersenne prime for the math steps
const E = 65537n;
const M64 = (1n << 64n) - 1n;
const LANES = 8;
const ROUNDS = 12;
const ZT = 4; // zeta terms
const MATH_EVERY = 4; // gate by round number, never by data
const ROT = [1n, 7n, 13n, 19n, 29n, 37n, 43n, 53n];

// Round constants: the first 768 bits of pi (hex digits after "3.").
const RC = [
  "243f6a8885a308d3", "13198a2e03707344", "a4093822299f31d0", "082efa98ec4e6c89",
  "452821e638d01377", "be5466cf34e90c6c", "c0ac29b7c97c50dd", "3f84d5b5b5470917",
  "9216d5d98979fb1b", "d1310ba698dfb5ac", "2ffd72dbd01adfb7", "b8e1afed6a267e96",
].map((h) => BigInt("0x" + h));

// x mod (2^61 - 1) without dividing: fold the high bits onto the low bits.
function modP(x: bigint): bigint {
  while (x > P) x = (x & P) + (x >> 61n);
  return x === P ? 0n : x;
}

function powMod(base: bigint, exp: bigint): bigint {
  let result = 1n;
  base = modP(base);
  while (exp > 0n) {
    if (exp & 1n) result = modP(result * base);
    base = modP(base * base);
    exp >>= 1n;
  }
  return result;
}

const FACT: bigint[] = [1n];
for (let i = 1; i < 1000; i++) FACT.push(modP(FACT[i - 1] * BigInt(i)));
const INV = [0n, ...Array.from({ length: ZT }, (_, n) => powMod(BigInt(n + 1), P - 2n))]; // 1/n mod P

const rotl = (x: bigint, k: bigint) => ((x << k) | (x >> (64n - k))) & M64;

// Ergodic integer tent map: double, fold if the top bit was set. Reversible.
const tent = (x: bigint) => (x >> 63n ? ~(x << 1n) & M64 : (x << 1n) & M64);

function chi(L: bigint[], lanes: number[]) {
  const old = lanes.map((i) => L[i]);
  const n = lanes.length;
  lanes.forEach((i, k) => {
    L[i] = old[k] ^ (~old[(k + 1) % n] & old[(k + 2) % n] & M64);
  });
}

function permute(L: bigint[]): bigint[] {
  for (let r = 0; r < ROUNDS; r++) {
    // 1) math chain, gated
    if (r % MATH_EVERY === 0) {
      for (let i = 0; i < LANES; i++) {
        let a = L[i] % P;
        a = powMod(a + BigInt(r + i + 1), E); // POWER  (pi^(2x)/6)
        const x = a & 0xffffn; // 16-bit exponent
        let z = 0n;
        for (let n = 1; n <= ZT; n++) z += powMod(INV[n], x);
        a = (a + z) % P; // ZETA   (sum 1/n^x)
        a = modP(a * FACT[Number((L[i] >> 13n) % 999n) + 1]); // FACT   (factorial)
        L[i] ^= a;
      }
    }
    // 2) ergodic shift + rotations
    L = L.map((v, i) => rotl(tent(v), ROT[i]));
    // 3) cross-lane mixing
    L = L.map((v, i) => v ^ rotl(L[(i + 7) % 8] ^ L[(i + 3) % 8], 1n));
    // 4) S-box, 5 + 3
    chi(L, [0, 1, 2, 3, 4]);
    chi(L, [5, 6, 7]);
    // 5) round constant
    L[0] ^= RC[r];
  }
  return L;
}

export function hash555(input: string | Uint8Array): Uint8Array {
  const msg = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const padded = new Uint8Array(Math.ceil((msg.length + 1) / 32) * 32);
  padded.set(msg);
  padded[msg.length] = 0x80;
  const view = new DataView(padded.buffer);

  let L: bigint[] = new Array(LANES).fill(0n);
  for (let off = 0; off < padded.length; off += 32) {
    for (let j = 0; j < 4; j++) L[j] ^= view.getBigUint64(off + 8 * j);
    L = permute(L);
  }
  L = permute(L);

  const out = new Uint8Array(64);
  const outView = new DataView(out.buffer);
  L.forEach((v, i) => outView.setBigUint64(i * 8, v));
  return out;
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Dice: an endless stream of random-looking numbers grown from one seed.
// Block n = hash555(seed | n). Same seed -> same rolls, in the same order.
export class Dice {
  private seed: string;
  private block = new Uint8Array(0);
  private pos = 0;
  private counter = 0;

  constructor(seed: string) {
    this.seed = seed;
  }

  // A whole number 0 .. 2^32-1.
  private next32(): number {
    if (this.pos + 4 > this.block.length) {
      this.block = hash555(`${this.seed}|${this.counter++}`);
      this.pos = 0;
    }
    const v = new DataView(this.block.buffer).getUint32(this.pos);
    this.pos += 4;
    return v;
  }

  // A fraction in [0, 1).
  float(): number {
    return this.next32() / 2 ** 32;
  }

  // A whole number in [0, n).
  int(n: number): number {
    return Math.floor(this.float() * n);
  }

  // True with the given probability (0..1).
  chance(p: number): boolean {
    return this.float() < p;
  }

  // Pick an item where each one has a weight; bigger weight = more likely.
  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((s, w) => s + w, 0);
    let roll = this.float() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i];
      if (roll < 0) return items[i];
    }
    return items[items.length - 1];
  }
}
