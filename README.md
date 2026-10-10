# Tricktrons 🌋

**You can't cheat existence.**

Pokémon GO meets Bitcoin — but you can't mine from your couch.

Tricktrons (TTs) are creatures that live in the real world. To get one you have to physically go where it lives — and the rare ones live where humans don't: volcanoes, glaciers, caves, mountain villages with one bar of signal. Every species is hard-capped, every TT is a scarce on-chain asset worth real money, and faking your location is designed to cost more than just buying the plane ticket.

> Born on a random Saturday in Düzce. Open-sourced so people can cook.

## The pitch in 30 seconds

- **555,000,000 TTs, ever** — after Hash555, the world hash. Hard cap. Every TT is randomized at spawn, and rarity is weighted way low: cheap ones everywhere, top tier almost never.
- **231 species:** one element (Fire, Water, Earth, Wind, Light, Dark) × one type (Dragon, Serpent, Giant, Spirit, Beast, Winged) + **195 Nationals**, one per country, built from its flag and national animal.
- **Spawns follow real geography.** Fire types near volcanoes, ice types on glaciers. The wilder the place (fewer people, fewer cell towers, darker at night), the rarer the spawns.
- **Your map starts dark.** You light it by physically traveling, cell by cell. The light fades — you can only mine where you're currently lit.
- **Claims are sealed.** Nobody knows what you caught until **Census Day**, once a year, when every seal opens at once. Flexers get vindicated or exposed.
- **The world breeds.** Every so often two species breed on their own and a brand-new TT appears on-chain as `??? · sqdw` — just a geohash. First to find it names the dex entry.
- **Anti-cheat is built on physics, not software.** Speed of light, magnetic fields, air pressure, unclonable chips. Pass the checks and the TT is yours in seconds. Fail them and you're grinding Bitcoin-level proof-of-work.

## Read more

- **[DESIGN.md](DESIGN.md)** — the full game and protocol design.
- **[Open problems](DESIGN.md#13-open-problems)** — what's unsolved. Pick one and go.

## What works today

A playable web prototype. TypeScript, **zero dependencies**, Node 24.

- **The world:** every ~1 km square on Earth is checked each week with **Hash555** (our own hash, no SHA). Same seed → same world on every device.
- **Secret weekly seeds:** only the sealed envelope is public. **Census Day** (end of each year) opens every seed, and anyone can replay the year to check nothing was faked.
- **The radar:** a Dragon-Radar screen. Far away you see a blip and a rough direction; within 200 m you see what it is; standing on it (~38 m) you get its **claim code**.
- **Claims:** paste the code, first claim wins, the TT vanishes from everyone's radar. You get a **serial number** in its tier. Your last 30 m of walking is shown as a **constellation** on black: no map, no place, no name until Census Day.
- **The numbers:** 555,000,000 TTs ever: **555 Legendary · 555,000 Rare · 554,444,445 Common**. #555 of each tier is the founder's, rolled from a public seed (`npm run tt -- founders`).

## Try it

```
git clone https://github.com/Salahussein-osman/tricktrons
cd tricktrons/radar && npm start
```

Open `http://localhost:8793/?at=37.751,14.9934` (Etna) and walk with the arrows. Drop `?at=` to use real GPS. Phones need https for that, so put a tunnel in front.

Tests: `npm test` in `engine/` and in `radar/`. Build map: [PROJECT.md](PROJECT.md). Running log: [DEVLOG.md](DEVLOG.md).

## Help wanted

Pick one, open an issue, cook.

- **Art.** 36 species (6 elements × 6 types) and 195 Nationals. Every TT is one element + one type: a Fire Dragon, a Dark Spirit. The list is in [`engine/src/catalogue.ts`](engine/src/catalogue.ts) and [`engine/src/nationals.ts`](engine/src/nationals.ts).
- **National animals.** 188 of 195 countries still need theirs. Each country already has its element and the reason why.
- **Real wildness.** Rarer TTs should live in wilder places, and none should spawn in the ocean. Needs open data (population, night lights, land/sea). See [DESIGN §4.2](DESIGN.md#42-wildness-score).
- **Fake-GPS protection.** The radar trusts the phone's GPS. See [DESIGN §9](DESIGN.md#9-anti-cheat).
- **What TTs do.** Power is a number that does nothing yet. Battles? Trading? Breeding?
- Everything in [Open problems](DESIGN.md#13-open-problems).

## License

- Code: [MIT](LICENSE)
- Design docs (`*.md`): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — build on it, just credit the source.
