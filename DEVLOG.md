# Devlog

Newest first. See [PROJECT.md](PROJECT.md) for the build map.

## 2026-10-10 — Docs caught up (layer 4 start)

README: real status (playable prototype, not "idea stage"), try-it in 2 commands,
help-wanted list (art, National animals, wildness, fake-GPS, what power does).
PROJECT: test counts, caps, serials, founder, Hash555-on-keys risk note, chain on
hold. DESIGN: §4.3 secret weekly seeds, §10 chain on hold, §13 Ranking + Privacy
decided. Still uncommitted.

## 2026-10-10 — Serials + founder's #555

Claims get a serial per tier (`nextSerial`, skips 555; UNIQUE(rarity, serial)).
#555 of each tier is Salah's, rolled from public seed `founder|<tier>|555`
(`founderTT`, CLI `founders`). A tier is full one claim early, since #555 counts.
- Legendary #555: Wind Giant, door-size, power 97
- Rare #555: Wind Winged, building-size, power 34
- Common #555: Dark Serpent, door-size, power 21

## 2026-10-10 — All 195 Nationals have an element

`engine/src/nationals.ts`: every country, its element and a one-line why. Rule
(Salah's): the element the country is known for; if it fits several, the least-used
one. Balanced 33 Fire / 33 Light / 33 Wind / 32 Water / 32 Earth / 32 Dark; a test
keeps the spread ≤ 2. Animals still open except the 7 from DESIGN. England's lion
now stands for the UK slot (GB), since the 195 are UN members + Vatican + Palestine.

## 2026-10-10 — 555 Legendaries, ever

Salah picked option C: 555 Legendary · 555,000 Rare · 554,444,445 Common, summing to
the 555,000,000 cap. `RARITY_CAPS` in catalogue.ts; spawn weights = the caps (Legendary
~1 in a million spawns, ~268 offers/week worldwide). Claims store rarity; a full tier
refuses claims and disappears from the radar. Kenya's lion = Earth.

## 2026-10-10 — One element + one type

Salah's call: every TT is ONE element + ONE type ("Fire Dragon"); the 63 mixes are
gone. Classes renamed types. 36 species + 195 Nationals = 231. Roll order is now
rarity → type → element → size → nocturnal → power (protocol change, every TT
rerolled). Kenya's National was Fire/Earth; he picked Earth.

## 2026-10-10 — Cap is 555,000,000

Salah's call: 555 million TTs total, after Hash555 (was 40,075,000). `TOTAL_TTS` in
catalogue.ts; enforced at claim time (spawns are weekly offers, only claims count).
Spawn rate is still the 25% placeholder (~268M offers/week worldwide, oceans included).

## 2026-10-10 — Bug: nothing rare ever spawned

Spawn chance and the TT roll used the same seed, so the rarity roll reused the
spawn chance's number (< 0.25) and every spawned TT was Common. Found by searching
Düzce: 8,314 TTs, 0 Rare, 0 Legendary. Fix: TT rolls from `ttSeed = "tt|" + cellSeed`.
Rerolled every TT. After: 73 Rare, 10 Legendary in the same area (~0.9% / ~0.12%,
odds are 1% / 0.1%). Regression test added (38 engine tests).

## 2026-10-10 — Layer 3, DB half: claims

- `claims.ts` on node:sqlite. Claim code = cell + key. Checks the TT is real this
  week and the key matches (constant-time compare). First claim wins (primary key
  week+cell); claimed TTs vanish from the radar.
- Route: phone keeps its trail on-device; on claim sends it relative to the TT;
  server trims to the last 30 m, metre-rounded.
- `/claims` page: constellations on black; sealed until Census Day, then
  name/cell/TT shown.
- Verified live on :8794: claim OK → second claim refused → fake key refused →
  TT gone from radar → feed shows 1 sealed constellation (21 points). 15 radar tests.
- Calls I made, his to overrule: first claim wins + TT disappears; name optional.

## 2026-10-10 — Layer 2 (radar) done

`radar/`: zero-dep Node server on :8793 + one page, a round Dragon-Radar screen.
- Far (>200 m): blip with direction to 15° and distance to 250 m. Rounded so you
  can't work out the spot from home. Near (≤200 m): exact spot + what it is.
  Standing in the 8-char cell: the claim key.
- Key = Hash555(key | server secret | cell | week) (first built on SHA-3, switched same day: our own hash). The world is public, so the key needs a
  secret the engine never sees. Shown as `xxxx-xxxx-xxxx-xxxx`, new every week.
- Finding TTs around you: a 250 m grid of points over a 3 km circle → the 6-char
  cells they land in → ask the engine. Test checks it misses nothing.
- `?at=lat,lon` fakes a position for desk testing; arrow keys walk 10 m.
- Verified in headless Chrome: Etna shows 19 blips in W41; standing on one shows the key.

Then built the secret seeds:
- Engine: no WORLD_SEED in code anymore. `spawnAt / spawnsIn / spawnNear` take
  the week seed; `seal(seed)` makes the envelope. CLI reads `TT_SEED`. 35 tests.
- Radar: `seeds.ts` vault (`radar/.seeds.json`, mode 600, git-ignored) makes this
  week's seed on first use, never ahead, never for past weeks. `/api/envelopes`
  publishes the envelopes. Key = `Hash555(key | seed | cell)`; `radar/.secret` gone.
- Verified live: W41 envelope matches seal(seed); Etna now shows 13 blips (new world).
- Census Day built: end of the ISO year (Monday 00:00 UTC of next year's W01;
  2026 → 2027-01-04). Engine `censusDay(year)`; radar `/api/census` opens every
  seed of a finished year next to its envelope; CLI `verify` says OK or FAKE;
  page shows "Census Day in N days". Seeds only; names/claims open once layer 3 exists.

Design decisions:
- Caught a hole: WORLD_SEED was public in code, so anyone could print every TT's
  exact spot and the radar hid nothing. Fix: secret weekly seeds, sealed envelope
  `Hash555(seed)` published each week, all opened on Census Day.
- Claim keys moved from SHA-3 to Hash555. With secret seeds, key becomes
  `Hash555("key" | week_seed | cell)` and radar/.secret goes away.
- Routes: last 30 m only, relative to the TT, drawn as a constellation on black.
  Replaces the 10-04 "no route storage" call. 5 m was too short (GPS jitter 5–10 m).
- Chain is anon all year; Census Day reveals names.
- Existing L2, not our own chain. Claims = sealed Hash555 envelopes. Which L2: open.

Placeholders: 3 km range, 200 m near, 15° / 250 m rounding. Known hole: the server
trusts the phone's GPS (confidence score, DESIGN §9.1, comes later).

## 2026-10-04 — Layer 1 (engine) done; Hash555 is the world hash

Repo started clean today (was the old fpga-switch-debouncer repo; FPGA work backed
up off-repo). Built the whole engine in `engine/`, TypeScript, zero deps, 33 tests.

- **geohash** — encode/decode lat·lon ↔ short base32 cells. Etna summit = `sqdwv0mg`.
- **Hash555** — own hash, no SHA. 512-bit sponge, π/zeta/factorial core gated into a
  Keccak-style mixer. Ported from Python (`~/Downloads/hash555.py`) and locked
  bit-for-bit with 8 test vectors. ~480 µs/hash. History: v1 → v3 → v4 → named 555.
  - Fixes along the way: chi split 5+3 (8-lane chi was lossy), math gated to rounds
    0/4/8 + 16-bit zeta exponent (was 86% of runtime), seed no longer crushed by mod P,
    round constants swapped from SHA-256 to digits of π.
- **catalogue** — 6 elements, 63 element mixes (2⁶−1), 6 classes + National, 4 sizes,
  3 rarities. 7 of 195 Nationals filled; rest open for contributors.
- **roll** — seed → full TT in a fixed order (rarity → class → mix → size → nocturnal
  → power). Order is protocol: changing it rerolls every TT. Locked by a pin test.
- **week** — ISO week tag (`2026-W40`); the world rerolls weekly.
- **spawn** — `cell | week | world-seed` → is there a TT, where (8-char ~38 m cell),
  what. Region + by-coordinate queries. Verified: `spawn sqdwv0` and `near` on Etna
  agree; W40 had a TT there, W41 empty.
- **cli** — `week | roll | spawn | near | radar`.

Placeholders (marked in code): spawn rate 25%, wildness (needs open map data, §4.2),
no depletion yet (needs claim history).

Design decisions this session:
- Hash555 for spawns; keys on SHA-3 later.
- App finds, web claims — app never touches money.
- No route storage. Trail stays on device; claim proves the TT, not the person.
  Census Day reveals catches, not routes (overrides DESIGN.md §10 — still to edit).

Not committed to git yet.
