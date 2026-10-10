#!/usr/bin/env node
// The radar server. Zero deps: serves the one page, and answers "what can I see
// from here?" The page never runs the engine — the key secret lives only here.
//
//   GET /                        the radar page
//   GET /api/radar?lat=&lon=     blips around that point this week
//   GET /api/envelopes           every week's sealed seed envelope
//   GET /api/census              next Census Day + every seed opened so far
//   POST /api/claim              { code, name, route } -> claimed, or why not
//   GET /claims                  the constellation page
//   GET /api/claims              every claim: sealed ones show only their route

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { radar, RANGE_M, NEAR_M } from "./radar.ts";
import { currentSeed, envelopes, census, seedOf } from "./seeds.ts";
import { openClaims } from "./claims.ts";

const PORT = Number(process.env.PORT ?? 8793);
const PAGE = new URL("../public/index.html", import.meta.url);
const CLAIMS_PAGE = new URL("../public/claims.html", import.meta.url);
const claims = openClaims(new URL("../claims.db", import.meta.url));

const json = (res: import("node:http").ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
};

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://x");

  if (url.pathname === "/" || url.pathname === "/claims") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    // re-read each time so edits show on refresh
    return res.end(readFileSync(url.pathname === "/" ? PAGE : CLAIMS_PAGE));
  }

  if (url.pathname === "/api/claim" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 64_000) req.destroy(); // a 30 m route is tiny
    });
    req.on("end", () => {
      let input;
      try { input = JSON.parse(body); } catch { return json(res, 400, { ok: false, error: "bad request" }); }
      const { week, seed } = currentSeed();
      const result = claims.claim(input, week, seed);
      json(res, result.ok ? 200 : 400, result);
    });
    return;
  }

  if (url.pathname === "/api/claims") return json(res, 200, claims.feed(seedOf));

  if (url.pathname === "/api/radar") {
    const lat = Number(url.searchParams.get("lat"));
    const lon = Number(url.searchParams.get("lon"));
    const bad = !url.searchParams.get("lat") || !url.searchParams.get("lon") ||
      !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 85 || Math.abs(lon) > 180;
    if (bad) return json(res, 400, { error: "need lat and lon" });
    const { week, seed } = currentSeed();
    const blips = radar(lat, lon, week, seed, (s) => claims.isClaimed(week, s.cell) || claims.tierFull(s.tt.rarity));
    return json(res, 200, { week, census: census().next, range: RANGE_M, near: NEAR_M, blips });
  }

  if (url.pathname === "/api/envelopes") {
    currentSeed(); // this week's envelope exists the moment anyone asks
    return json(res, 200, envelopes());
  }

  if (url.pathname === "/api/census") return json(res, 200, census());

  res.writeHead(404).end();
}).listen(PORT, () => console.log(`radar on http://localhost:${PORT}`));
