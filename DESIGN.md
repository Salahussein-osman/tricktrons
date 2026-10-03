# Tricktrons — Design Doc

> **You can't cheat existence.**

Status: **draft / brainstorm v0.2**. Nothing here is final. Everything is up for debate.

*Why "Tricktrons":* "trick" as in tricking electronics. Software gets tricked. Try tricking the hardware.

---

## 1. Core loop

1. **Go outside.** Your map is dark until you physically travel and light it up.
2. **Find a Tricktron.** Spawns depend on real geography — biome, remoteness, how farmed the area is. Your radar shows blips and a direction from far away; the exact spot only appears when you're close.
3. **Mine it.** Your device builds a location-confidence score and solves a proof-of-work puzzle. High confidence → seconds. Low confidence → brutal.
4. **Seal the claim.** The catch goes on-chain as a sealed commitment. Nobody knows what you caught.
5. **Hold or sell.** Sell now (reveals it) or stay hidden until **Census Day**, when every seal opens and the market reprices.

The design principle behind everything: **reward getting somewhere hard, not walking.** Walking is easy to fake. Getting to a volcano isn't.

---

## 2. Tricktrons and supply

### 2.1 The creatures
- Mythic creatures with a bit of Pokémon in them.
- **Sizes:** small, human-size, door-size, building-size.
- **Nocturnal TTs** only come out at night.
- **v1 looks:** no 3D. A TT shows up as a card on your phone.

### 2.2 Elements (6)
**Fire, Water, Earth, Wind, Light, Dark.** A TT can have anywhere from 1 to all 6.

### 2.3 Classes (6 + 1)
| Class | Notes |
|-------|-------|
| Dragon | |
| Serpent | |
| Giant | golems live here |
| Spirit | imps live here |
| Beast | |
| Winged | |
| **National** | the 7th class, the surprise (below) |

### 2.4 Nationals
- **One per country: 195** (193 UN members + Vatican + Palestine).
- The best of that country, styled in its flag colors and based on its national animal. Examples: **Somalia → leopard**, **Turkey → grey wolf (Asena)**.
- A National spawns only inside its own country.
- **Lions:** a lot of countries have a lion. Each lion gets its own lineage, element mix and style, e.g. Morocco's dark-maned Atlas lion (Earth), India's Asiatic forest lion, England's armored heraldic lions (Light), Singapore's half-fish Merlion (Water), Kenya's savanna lion (Fire/Earth).

### 2.5 Numbers
- **Species:** 63 element mixes (every non-empty combo of 6 elements: 2⁶ − 1) + 195 Nationals = **258**.
- **Total TTs on Earth: 40,075,000**, one for every meter around the equator. That's roughly one per ~4 km² of land, so cheap ones really are everywhere.
- **Hard cap.** The total never goes up. The TT *is* the coin: no separate currency. Each TT carries a serial in its **TTC series**. The only way a TT enters circulation is by being mined.
- **Real-money value** comes purely from players trading TTs with each other.

### 2.6 The randomizer
Every TT is rolled by code at spawn: species, class, elements, size, nocturnal or not, stats, and **rarity**. Rarity is heavily weighted low, so the overwhelming majority are weak and cheap, and the top tier is vanishingly rare. Rolls are deterministic from the spawn seed (section 4.3), so anyone can verify them and nobody can reroll.

### 2.7 Getting one
- **Finding:** Dragon Radar style. Blips and a direction from far away, the exact spot only when you're close.
- **Catching:** pull out your phone and be close. Passing the hardware checks (section 9) makes the mine easy.

---

## 3. The world grid — geohash

The planet is divided using **[geohash](https://en.wikipedia.org/wiki/Geohash)**: every cell is a short base-32 code, and each extra character zooms in.

| Chars | Approx. cell size | Example use |
|------:|------------------:|-------------|
| 2 | ~1,250 × 625 km | country-ish |
| 3 | ~156 × 156 km | region |
| 4 | ~39 × 20 km | `???` drop codes |
| 6 | ~1.2 × 0.6 km | spawn cells |
| 8 | ~38 × 19 m | claim precision |

Mount Etna is `sqdwv0me`. To a normal person that's gibberish; to someone who decodes it, it's a search area.

---

## 4. Spawns

### 4.1 Habitats
Every species has habitats: volcanic, glacial, cave/karst, alpine, desert, wetland, coastal, forest, rural, urban. Biomes come from open map data (land cover, elevation, OpenStreetMap tags like `natural=volcano`, `natural=cave_entrance`, `natural=peak`).

### 4.2 Wildness score
Each cell gets a **wildness score** from open datasets:

| Signal | Source (examples) | Wild = |
|--------|-------------------|--------|
| Population density | WorldPop, GHSL | low |
| Cell tower density | OpenCelliD | low |
| Night lights | NASA VIIRS Black Marble | dark |
| Mining history | on-chain | rarely farmed |

Rarity scales with wildness. Dragons don't spawn in city centers. The sweet spot includes places with **people but little infrastructure** — mountain villages, rural towns.

### 4.3 Deterministic spawns
`spawn = H(cell_id ‖ epoch ‖ world_seed)` → species, stats, rarity. Anyone can verify a spawn was real; nobody can invent one.

### 4.4 Depletion
Every catch in a cell scares the rest off: the spawn rate drops and recovers slowly. Farmed areas go dead, pushing players further out. Cities are mostly dead zones by design.

### 4.5 Spawn placement
Spawns sit at the *access point* of a habitat — trailhead, viewpoint, cave mouth — not necessarily the most extreme spot.

---

## 5. The lit map — proof of journey

- Your map starts **dark**.
- A cell lights up only when you enter it **from an adjacent cell you've already lit**, at a believable speed. No teleporting.
- Lit cells link into a **constellation** — your personal travel pattern.
- **Weak memory:** light fades over time (e.g. half-brightness after a few days). Where you live stays bright because you're always there; trips fade.
- **You can only mine in a cell that is currently lit and connected** to your trail.
- Fading also kills a classic cheat: keeping a far-away cell lit means repeating long trips over and over. Real people don't drive Moscow → Dagestan daily; that pattern screams bot.
- **Flights:** airport → airport jumps are allowed if the data looks like a flight — cabin pressure equivalent to ~6,000–8,000 ft (measurable with a phone barometer) and ~800 km/h.
- **Tamper-evident trail:** each cell entry is hashed with the previous one (`h_n = H(h_{n-1} ‖ cell ‖ time ‖ sensors)`), a mini-blockchain of your trip. Edit one step and the chain breaks.

---

## 6. Mining and claims

### 6.1 Proof-of-work ("the garbage code")
To claim a TT your device must find a nonce such that `H(spawn_id ‖ wallet ‖ trail_head ‖ recent_block_hash ‖ nonce)` meets a target. Including a recent block hash prevents pre-computation.

- Use a **memory-hard** hash (RandomX/Argon2-style), **not** SHA-256. Bitcoin ASICs and rented hashpower shouldn't get a shortcut; phones should be able to run it.

### 6.2 Difficulty = f(confidence, value)
- **Confidence score `P`** comes from sensor fusion (section 9).
- **Rule of thumb:** every time `P` halves, expected work doubles: `work ∝ base(species) / P`.
- **Price-scaled:** difficulty for low-confidence claims tracks recent on-chain sale prices of that species, so faking a TT always costs more than the TT is worth. If dragons pump, faking one gets harder automatically.

Rough scale for a $1M TT at low confidence: ~2M GPU-hours (~228 GPU-years at ~$0.50/hr rental). Meanwhile a flight to Sicily is ~$200.

### 6.3 Offline mining → race to signal
Wild places often have no signal. You mine offline (PoW runs on-device, trail is signed), then **must get back to signal to submit**. If someone else mined the same spawn and reaches signal first, they win.

---

## 7. Sealed claims and Census Day

- Claims go on-chain as a **commitment** (`H(claim ‖ salt)`) — timestamped, locked to your wallet, but nobody can see what or where.
- **Census Day**, once a year: all seals open at once, the public map updates, and the truth comes out.
- Until then: fog of war. Someone flexes "I got the Etna dragon" — believe them, or go anyway?
- **Selling = revealing.** A trade must happen on-chain publicly, so selling opens your seal early.

### Market game theory
Say 6 Magma Dragons exist and you hold one:
- **Sell early:** quick money, but you've told the market 1 of 6 is gone — buyers still hope for the other 5.
- **Hold sealed:** on Census Day it may turn out all 6 were caught and few were sold → supply confirmed locked → price spikes.
- **Informational edge:** silent holders know real supply is tighter than the market thinks.

Commit-reveal is a proven pattern (e.g. ENS used it for name auctions).

---

## 8. Wild breeding and `???` drops

- Players don't breed. **The world does.**
- Periodically the protocol rolls using a **future block hash** (unriggable, even by devs). On a hit, two random species "breed" and a new TT spawns somewhere real.
- The chain logs only: `??? · <geohash> · block <n>` — no name, no stats, no art, **zero hints** beyond the code.
- **The child spawns where the parents' habitats overlap**: Fire × Water → hot springs/geysers; Ice × Rock → glaciers; Cave × Flying → cliff caves.
- The first person to mine it **reveals** it: the `???` becomes a real dex entry, with their wallet permanently credited as discoverer.
- Bred TTs come out of the fixed 40,075,000 total — breeding never adds supply. A bred species can be very low cap (even one-of-one).
- The dex can grow past 258, but the number of TTs on Earth never does.

---

## 9. Anti-cheat

**Philosophy:** software gets cracked; physics doesn't. Nothing is 100% uncheatable — the goal is making cheating cost more than it pays.

### 9.1 Sensor fusion → confidence score
Each signal gives a likelihood that you are where you claim. A particle filter / Bayesian fusion combines them into `P`. Faking one sensor is easy; faking all of them consistently, over a whole trip, is brutal.

| Signal | What it checks | Fakeable? |
|--------|----------------|-----------|
| Device attestation | Real, untampered phone (Play Integrity / App Attest) | Hard |
| GNSS | Position, satellite geometry | Easy alone (simulators) |
| Galileo OSNMA | Cryptographically signed satellite nav data (operational since July 2025) | Hard |
| Cell towers / Wi-Fi | Match claimed area; *no signal* must match coverage maps | Medium |
| Barometer | Altitude + live local weather pressure | Medium–hard |
| Magnetometer | Earth's field + local crustal anomalies vs. anomaly maps | Hard in the Catcher |
| Motion (IMU) | Movement consistent with GPS speed | Medium |
| Trail | Connected, plausible, not repetitive | Hard over time |
| Witnesses | Nearby players co-sign | Hard if proximity is physical |

**Signals from the sealed Catcher weigh more than phone signals**, because a rooted phone can fake all its own readings at once.

### 9.2 Magnetic positioning
- Earth's field (strength, declination, inclination) gives a coarse region.
- **Local crustal anomalies** are the fingerprint. Basalt is strongly magnetized: volcanic anomalies are typically 100–1,000 nT, with peaks ~1,700–2,500 nT. Legendaries live exactly where the magnetic fingerprint is strongest.
- A **trail** gives a magnetic signature over time — much harder to fake than a single reading.
- Phone magnetometers have ±150–500 nT of noise: too weak for most terrain. **A nT-class TMR/fluxgate chip (~$20) in the Catcher** makes this viable.
- Prior art: USAF/MIT MagNav flew a C-17 on magnetic anomaly navigation in 2023 (~1 km accuracy); IndoorAtlas does indoor magnetic positioning on phones.

### 9.3 Squad witnesses
Nearby players vouch for each other. To prove they're physically together (not over Discord), use **radio channel reciprocity**: two devices see the same multipath fading, and anyone more than ~half a wavelength away sees something different. Squads mine easier; solo players keep the whole bag.

### 9.4 Shrines (legendary tier)
Sealed beacons at legendary spots (trailheads, cave mouths, peaks):
- **PUF chip** — physically unclonable identity (buildable on FPGAs via ring-oscillator PUFs).
- **UWB distance bounding** — challenge/response timed at the speed of light; you must be within meters. Relays add delay and fail.
- **Signed rotating code** — unpredictable, valid for ~30 s.
- **Tamper response** — opening or moving the box wipes its keys.
- Solar powered.

Faking a Shrine claim isn't expensive, it's **physically impossible** without being there.

### 9.5 The Catcher (rare tier)
Our own sealed pocket device (think Pokéball Plus × hardware wallet): OSNMA-capable GNSS, barometer, IMU, nT-class magnetometer, PUF, secure element. Everything is signed inside the chip; the phone is just a screen. Also a potential business model (cf. Helium hotspots).

### 9.6 Tiers
| Tier | Requirement |
|------|-------------|
| Common | Phone only |
| Rare | Catcher |
| Legendary | Catcher + Shrine |

### 9.7 Social / economic layers
- **1 device = 1 player** (hardware-bound) — no phone farms.
- **Review window:** sealed claims sit for up to a year before Census Day. Suspicious claims get voided *before* they go public.
- **Cheater bounties:** prove a claim is fake → get rewarded. The community hunts cheaters.

---

## 10. On-chain record

The blockchain records every TT, its owner, and **the route that led to each claim**. Anyone can replay a route and call cap. On Census Day the routes behind every revealed claim become public.

Chain choice: **an established chain / L2**, not our own. (Axie's own sidechain with few validators lost ~$600M in the Ronin hack.)

---

## 11. Lessons from projects that died

| Project | What killed it | Our answer |
|---------|----------------|------------|
| STEPN (move-to-earn) | GPS spoofing, phone shakers, multi-phone farms; unlimited token emissions (~90% crash) | Hard caps; physical anti-cheat; 1 device = 1 player |
| Helium (proof-of-coverage) | Organized location spoofing (25k+ confirmed fake hotspots) | Assume organized pros; multi-signal trust score; Shrines |
| Axie Infinity (play-to-earn) | Economy needed new money; own chain hacked | Fun without money (adventure, Census drama); established chain |

---

## 12. Build phases

1. **Spawn engine** — geohash grid, habitats, wildness score, deterministic spawns. (Pure software, testable.)
2. **Phone app MVP** — lit map with fade, trail hashing, confidence score, PoW, testnet claims.
3. **Chain** — contracts for species caps, sealed claims, Census reveal, `???` drops, trading.
4. **Catcher prototype** — GNSS + OSNMA, barometer, magnetometer, secure element.
5. **Shrine prototype** — PUF (FPGA), UWB distance bounding, tamper response, solar.

---

## 13. Open problems

Grab one.

- **Magnetometer reality check:** does a ~$20 nT-class sensor resolve crustal anomalies well enough in the field, with body/vehicle interference and magnetic storms?
- **Anomaly map resolution:** public maps (e.g. EMAG2) are coarse; high-res maps exist only for some areas (Etna has one). Crowdsource maps from Catchers?
- **Shrine logistics:** permits, theft, vandalism, weather, maintenance on volcanoes.
- **Confidence-score weights:** how to set and update them without making the system gameable or unfair to old phones.
- **Census timing:** fixed date vs. rolling; what happens to unrevealed claims if a holder loses their key.
- **Breeding rate:** how often `???` drops appear without diluting value.
- **Ranking:** how the randomizer's rarity weights map to tiers and value.
- **Lions:** finalize how each country's lion is made distinct.
- **`???` discoverability:** zero hints vs. revealing one more geohash character if unclaimed for a while.
- **Privacy:** routes are public on-chain by design — how much trail detail is published, and when.
- **Legal / app stores:** real-money assets trigger financial, gambling and app-store rules depending on country.
- **Safety:** spawn placement near hazardous terrain.
- **Accessibility:** what's fun for people who can't travel far.

---

## References

- Geohash — https://en.wikipedia.org/wiki/Geohash
- Galileo OSNMA one year — https://www.euspa.europa.eu/newsroom-events/news/celebrating-one-year-galileo-osnma-milestone-trusted-positioning
- USAF/MIT MagNav — https://www.af.mil/News/Article-Display/Article/3408951/magnav-project-successfully-demonstrates-real-time-magnetic-navigation/
- IndoorAtlas magnetic positioning — https://www.indooratlas.com/blog/magnetic-positioning-technology-how-it-works/
- Smartphone magnetometer limits — https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2020SW002669
- Volcanic magnetic anomalies (Aso) — https://gscommunitycodes.usf.edu/geoscicommunitycodes/public/fieldcamp/aso/aso.html
- Etna aeromagnetic map — https://www.sciencedirect.com/science/article/abs/pii/S037702731400095X
- Particle filter + magnetic fingerprints — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6983102/
- Cabin pressure via smartphone — https://arxiv.org/pdf/2402.17035
- ZK proof-of-location — https://arxiv.org/html/2506.16812
- Helium trust score (HIP-66) — https://github.com/helium/HIP/blob/main/0066-trust-score-and-denylist-convenience.md
- Ronin hack — https://www.theblock.co/post/156038/how-a-fake-job-offer-took-down-the-worlds-most-popular-crypto-game
- Fog of World (prior art for fog-of-war maps) — https://apps.apple.com/us/app/fog-of-world/id505367096
