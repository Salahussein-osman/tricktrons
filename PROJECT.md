# Tricktrons — Project

**You can't cheat existence.** Real-world creature hunt: every TT lives at a real
place, you have to physically go there, and faking it costs more than the trip.

See [README.md](README.md) for the pitch and [DESIGN.md](DESIGN.md) for the full design.
This file is the build map. [DEVLOG.md](DEVLOG.md) is the running log.

## The layers

The thing is built bottom-up. Each layer only needs the one under it.

| Layer | What | Status |
|-------|------|--------|
| 1. Engine | geohash grid, world hash, catalogue, rolling, spawning | **done** |
| 2. Map | web radar: blips, direction far / exact spot near, shows the key at the spot | **done** |
| 3. Claim | paste the key on the web, it's checked + recorded (DB first, chain later) | **DB done**, chain on hold |
| 4. Open source | README, help-wanted list, issues per open problem, let people cook | README done; issues next |

The app only *finds* the TT. Claiming happens on the web, so the app never touches
money — that keeps it out of app-store money rules and keeps it forkable.

## The engine (layer 1, `engine/`)

TypeScript, zero dependencies, Node 24 runs the `.ts` files directly.

```
cd engine
npm test                              # 39 tests
TT_SEED=<seed> npm run tt -- radar sqdwv           # every TT in a region
TT_SEED=<seed> npm run tt -- spawn sqdwv0          # one spawn cell
TT_SEED=<seed> npm run tt -- near 37.751 14.9934   # by coordinate
npm run tt -- seal <seed>                          # a seed's sealed envelope
npm run tt -- verify <seed> <envelope>             # Census Day check: OK or FAKE
npm run tt -- census [year]                        # when that year's seeds open
npm run tt -- founders                             # the founder's #555 of each tier
```

Files: `geohash` (squares on Earth) · `hash` (**Hash555**, the world hash) ·
`catalogue` (6 elements × 6 types, rarities, caps) · `nationals` (195 countries, element + why) ·
`roll` (seed → TT, founder TTs) ·
`week` (ISO week tag) · `spawn` (which cell, where, what) · `cli`.

## The radar (layer 2, `radar/`)

Zero deps. A Node server that serves one page and answers "what can I see from here?"

```
cd radar
npm test                                   # 17 tests
npm start                                  # http://localhost:8793
http://localhost:8793/?at=37.751,14.9934   # fake position; arrow keys walk 10 m
```

| You are | You see |
|---|---|
| > 200 m away | a blip: direction to 15°, distance to 250 m. Not what it is. |
| ≤ 200 m | the exact spot and what the TT is |
| in its 8-char cell (~38 m) | the claim key |

**Secret weekly seeds.** The server makes one random seed per week the first time
it's needed and keeps it in `radar/.seeds.json` (git-ignored). `GET /api/envelopes`
shows each week's sealed envelope `seal(seed) = Hash555("seal" | seed)`.

**Census Day** = the instant the ISO year's last week ends (Monday 00:00 UTC of
next year's week 1; for 2026 that's 2027-01-04). Computed by the engine, so nobody
announces it. From then `GET /api/census` lists every seed of that year next to its
envelope; the page counts down to it. Anyone can then check `seal(seed)` matches and replay the week with
`TT_SEED=<seed>`. Until then, the radar is the only way to see where TTs are.

The key is `Hash555(key | week seed | cell)`, 16 hex chars. The server trusts the phone's
GPS. Faking GPS is easy; that's the confidence score (DESIGN §9.1), not this layer.
Phones only share location over https or localhost.

## Claims (layer 3, DB half, `radar/src/claims.ts`)

SQLite built into Node (`node:sqlite`), file `radar/claims.db` (git-ignored).

- On the TT, the radar shows a **claim code** = cell + key (`sqdwtjkv-6b85-abe4-3950-c18d`)
  and a Claim button. Name is optional ("anonymous"), hidden until Census Day.
- Server checks: the TT really sits in that cell this week, and the key is its key.
  **First claim wins**; the TT then disappears from everyone's radar.
- The phone sends its trail as metres east/north of the TT (never GPS coordinates);
  the server keeps the **last 30 m**, rounded to the metre.
- `/claims`: every claim as a constellation on black. Sealed = route + week only.
  After that year's Census Day: name, cell and which TT too.
- **Serials:** each claim gets a number inside its tier. **#555 of each tier is the
  founder's** (rolled from public seed `founder|<tier>|555`); players skip it.
- **Tier caps:** 555 Legendary · 555,000 Rare · 554,444,445 Common. When a tier is
  full it refuses claims and its TTs vanish from the radar.
- The chain half is on hold (see Decided).

## Hash555

The world hash, built from scratch — no SHA anywhere. 512-bit sponge; core is a
π / zeta / factorial chain gated into a Keccak-style mixer. 555 = SSS = triple Salah.
Same input → same output on every device, so everyone computes the same world.
It runs spawns and claim keys.

> Status: passes every statistical test SHA-512 passes. **Unbroken, not proven** —
> zero days under real attack. It runs the keys too (Salah's call): if it's ever
> broken, the week seeds could leak from claim codes. Revisit before real money.

## Decided

- Hash555 runs the world AND the keys (2026-10-10: Salah moved keys off SHA-3).
- App finds, web claims. App never touches money.
- Routes: only the **last 30 m** before a claim is kept, stored as steps relative to
  the TT (no GPS coordinates), drawn as a **constellation** on pitch black, with no map and
  no way to tell where on Earth it is. The rest of the trail stays on the device. (2026-10-10, replaces the 10-04
  "no route storage" call.)
- World seeds are **secret**, one per week. Each week the server publishes a sealed
  `Hash555(seed)`; all seeds open on **Census Day** so anyone can replay the year.
  Until then only the radar shows where TTs are. (2026-10-10, built, Census reveal
  included: end of the ISO year.)
- The chain is **anon all year**; on Census Day names are revealed.
- Chain: ON HOLD (2026-10-10). DB works for now; Holochain (no fees) is the candidate
  once real players exist. Never our own chain (Ronin lesson). Claims would go on as
  sealed `Hash555(claim | route | salt)` envelopes, opened on Census Day.
- **555,000,000 TTs ever**: 555 Legendary · 555,000 Rare · 554,444,445 Common. Spawn odds
  follow the caps. Every TT is **one element + one type** (36 species + 195 Nationals = 231).
- Nationals: the element the country is known for; ties go to the least-used element
  (kept within 2 of each other by a test). Kenya = Earth, Somalia = Water, Egypt = Light.
- Founder owns serial **#555 of each tier**, public.

## Open / placeholder (design calls, see DEVLOG + DESIGN §13)

- Spawn rate (25%, oceans included) and wildness are stubs; real wildness needs open
  map data (§4.2).
- Depletion (§4.4) not built; claim history now exists to build it on.
- Power does nothing yet. Art: Salah is finding artists. National animals: 188 open.
- The radar trusts phone GPS (§9.1).
