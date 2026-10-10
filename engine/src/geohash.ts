// Geohash: turns a lat/lon into a short string, and back.
// Each character narrows the area 32x. See DESIGN.md section 3.

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export type Box = { latMin: number; latMax: number; lonMin: number; lonMax: number };

export function encode(lat: number, lon: number, length = 6): string {
  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;
  let hash = "";
  let bits = 0;     // bits collected for the current character
  let value = 0;    // those bits as a number 0-31
  let evenBit = true; // geohash alternates: lon, lat, lon, lat...

  while (hash.length < length) {
    if (evenBit) {
      const mid = (lonMin + lonMax) / 2;
      if (lon >= mid) { value = value * 2 + 1; lonMin = mid; } else { value = value * 2; lonMax = mid; }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) { value = value * 2 + 1; latMin = mid; } else { value = value * 2; latMax = mid; }
    }
    evenBit = !evenBit;
    if (++bits === 5) {
      hash += BASE32[value];
      bits = 0;
      value = 0;
    }
  }
  return hash;
}

export function decode(hash: string): Box {
  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;
  let evenBit = true;

  for (const char of hash) {
    const value = BASE32.indexOf(char);
    if (value === -1) throw new Error(`bad geohash character: ${char}`);
    for (let i = 4; i >= 0; i--) {
      const bit = (value >> i) & 1;
      if (evenBit) {
        const mid = (lonMin + lonMax) / 2;
        if (bit) lonMin = mid; else lonMax = mid;
      } else {
        const mid = (latMin + latMax) / 2;
        if (bit) latMin = mid; else latMax = mid;
      }
      evenBit = !evenBit;
    }
  }
  return { latMin, latMax, lonMin, lonMax };
}

export function center(hash: string): { lat: number; lon: number } {
  const b = decode(hash);
  return { lat: (b.latMin + b.latMax) / 2, lon: (b.lonMin + b.lonMax) / 2 };
}
