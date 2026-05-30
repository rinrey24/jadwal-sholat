/**
 * Hijri ↔ Gregorian date conversion utilities.
 * Uses arithmetic / tabular Islamic calendar (±1-2 day variance from moon-sighting).
 */

/** Gregorian → Julian Day Number */
export function gregToJDN(gy: number, gm: number, gd: number): number {
  const a = Math.floor((14 - gm) / 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  return gd + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

/** Hijri → Julian Day Number (exported for external use) */
export function hijriToJDN(hy: number, hm: number, hd: number): number {
  return Math.floor((11 * hy + 3) / 30) + 354 * hy
    + 30 * hm - Math.floor((hm - 1) / 2) + hd + 1948440 - 385;
}

/** Julian Day Number → Gregorian */
export function jdnToGreg(jdn: number): { y: number; m: number; d: number } {
  let l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const d = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const m = j + 2 - 12 * l;
  const y = 100 * (n - 49) + i + l;
  return { y, m, d };
}

/** Hijri → Gregorian */
export function hijriToGregorian(hy: number, hm: number, hd: number): { y: number; m: number; d: number } {
  return jdnToGreg(hijriToJDN(hy, hm, hd));
}

/** Gregorian → Hijri (search-based, accurate to arithmetic calendar) */
export function gregorianToHijri(gy: number, gm: number, gd: number): { y: number; m: number; d: number } {
  const target = gregToJDN(gy, gm, gd);
  let hy = Math.floor((target - 1948440) / 354.367);
  while (hijriToJDN(hy + 1, 1, 1) <= target) hy++;
  while (hijriToJDN(hy, 1, 1) > target) hy--;
  let hm = 1;
  while (hm < 12 && hijriToJDN(hy, hm + 1, 1) <= target) hm++;
  const hd = target - hijriToJDN(hy, hm, 1) + 1;
  return { y: hy, m: hm, d: hd };
}
