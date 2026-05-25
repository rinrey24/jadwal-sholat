/**
 * Muslim App — Icon Generator  v8  (correct mosque architecture)
 * Run: node scripts/generate-icons.js
 *
 * Correct mosque dome silhouette (bottom → top):
 *
 *   base  (Y = baseY)          — building body, moderate width, has arch doorway
 *   neck  (nY = ~79% from top) — narrow drum, 21% up from base
 *   belly (bY = ~31% from top) — widest dome bulge, 69% up from base  ← THE DOME
 *   cap   (Y ≈ dTopY+10)       — rounded top of dome
 *
 *   Y strictly decreasing: baseY > nY > bY > dTopY  (all going UP)
 *   Width: dBase > dNW (narrow drum) < dW (wide dome belly) > dCap
 *   X is non-monotonic (narrows → widens), but same-X CPs give vertical
 *   tangents at each joint → zero S-curve / wing artifacts.
 *
 *   Dome portion aspect ratio (neck-to-cap height vs belly width) ≈ 0.95:1
 *   → dome is taller than wide, giving a proper onion-dome silhouette.
 */
const sharp = require('sharp');
const path  = require('path');
const ASSETS = path.join(__dirname, '..', 'assets');
const f = n => n.toFixed(2);

// ─── helpers ──────────────────────────────────────────────────────────────────
function ticks(cx, cy, r, n, len, stroke, sw) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const a = (i/n)*2*Math.PI - Math.PI/2;
    const c = Math.cos(a), s = Math.sin(a);
    o += `<line x1="${f(cx+r*c)}" y1="${f(cy+r*s)}" x2="${f(cx+(r-len)*c)}" y2="${f(cy+(r-len)*s)}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
  }
  return o;
}
function star(cx, cy, R, r, fill, op=1) {
  const pts = [];
  for (let i=0; i<10; i++) {
    const a = (i*Math.PI)/5 - Math.PI/2;
    pts.push(`${f(cx+(i%2===0?R:r)*Math.cos(a))},${f(cy+(i%2===0?R:r)*Math.sin(a))}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" opacity="${op}"/>`;
}
function minaretSVG(cx, baseY, w, h) {
  const tx=cx-w/2, ty=baseY-h;
  const cH=w*1.55, cW=w*0.52, sp=w*1.1;
  return `
<rect x="${f(tx)}" y="${f(ty)}" width="${f(w)}" height="${f(h)}" rx="${f(w*0.13)}" fill="#CCE8D5" opacity="0.90"/>
<rect x="${f(cx-w*0.24)}" y="${f(ty+h*0.28)}" width="${f(w*0.48)}" height="${f(w*0.62)}" rx="${f(w*0.24)}" fill="#050C08" opacity="0.45"/>
<path d="M${f(cx-cW)},${f(ty)} C${f(cx-cW)},${f(ty-cH*0.18)} ${f(cx-cW*0.2)},${f(ty-cH*0.65)} ${f(cx)},${f(ty-cH)} C${f(cx+cW*0.2)},${f(ty-cH*0.65)} ${f(cx+cW)},${f(ty-cH*0.18)} ${f(cx+cW)},${f(ty)} Z" fill="#C9A227"/>
<line x1="${f(cx)}" y1="${f(ty-cH)}" x2="${f(cx)}" y2="${f(ty-cH-sp)}" stroke="#C9A227" stroke-width="${f(w*0.18)}" stroke-linecap="round"/>
<circle cx="${f(cx)}" cy="${f(ty-cH-sp)}" r="${f(w*0.19)}" fill="#C9A227"/>`;
}

// ─── Onion dome — monotonic-Y bezier (v6) ─────────────────────────────────────
// LEFT contour visits Y in strictly decreasing order: baseY > bY > nY > dTopY
// ⇒ every sub-segment travels upward ⇒ vertical tangents at bulge+neck are valid
// ⇒ no S-curve / wing artifacts.
function domePathLR(cx, baseY, dTopY, dW, dNW, dBase, dCap) {
  const dH = baseY - dTopY;

  // NECK (drum): 79% from top = 21% from base  — narrow waist near the ground
  const nY = dTopY + dH * 0.79;
  // BELLY (dome): 31% from top = 69% from base — wide dome bulge, high up
  const bY = dTopY + dH * 0.31;

  // Y strictly decreasing going UP: baseY > nY > bY > dTopY ✓
  // X: dBase → dNW (narrows) → dW (widens) → dCap (narrows)

  const tbase = dH * 0.042;   // tension at building base
  const tn    = dH * 0.046;   // tension at neck
  const tb    = dH * 0.055;   // tension at belly

  // ── LEFT contour (always going UP: Y strictly decreasing) ──────────────
  // base → neck  (up and IN: walls converge to narrow drum)
  const L1 = `C${f(cx-dBase)},${f(baseY - tbase)}` +
             ` ${f(cx-dNW)},${f(nY + tn)}` +
             ` ${f(cx-dNW)},${f(nY)}`;
  // neck → belly  (up and OUT: dome expands wider than the building base)
  const L2 = `C${f(cx-dNW)},${f(nY - tn)}` +
             ` ${f(cx-dW)},${f(bY + tb)}` +
             ` ${f(cx-dW)},${f(bY)}`;
  // belly → cap  (up and IN: dome tapers to its rounded top)
  const L3 = `C${f(cx-dW)},${f(bY - tb)}` +
             ` ${f(cx-dCap)},${f(dTopY + tn*0.55)}` +
             ` ${f(cx-dCap)},${f(dTopY + 10)}`;

  // arc over rounded top
  const arc = `A${f(dCap)},${f(dCap)} 0 0 1 ${f(cx+dCap)},${f(dTopY + 10)}`;

  // ── RIGHT contour (perfect mirror) ──────────────────────────────────────
  const R1 = `C${f(cx+dCap)},${f(dTopY + tn*0.55)}` +
             ` ${f(cx+dW)},${f(bY - tb)}` +
             ` ${f(cx+dW)},${f(bY)}`;
  const R2 = `C${f(cx+dW)},${f(bY + tb)}` +
             ` ${f(cx+dNW)},${f(nY - tn)}` +
             ` ${f(cx+dNW)},${f(nY)}`;
  const R3 = `C${f(cx+dNW)},${f(nY + tn)}` +
             ` ${f(cx+dBase)},${f(baseY - tbase)}` +
             ` ${f(cx+dBase)},${f(baseY)}`;

  return `M${f(cx-dBase)},${f(baseY)} ${L1} ${L2} ${L3} ${arc} ${R1} ${R2} ${R3} Z`;
}

// ─── SVG builder ──────────────────────────────────────────────────────────────
function buildSVG(S=1024) {
  const cx = S/2;

  // Clock ring
  const rCY = S*0.452, rR = S*0.308;

  // Ground
  const baseY = S*0.638;

  // Minarets
  const mW = S*0.038, mH = S*0.185, mOff = S*0.236;

  // Dome dimensions  (v8 — correct mosque architecture)
  //   building base : narrow drum : dome belly
  //   = 61% : 34% : 100% (drum narrow, dome wider than base)
  //   dome portion (neck→cap) height = 79% of dH → taller-than-wide dome ≈ 0.95:1
  const dW    = S*0.148;   // half-width at dome belly     (303px wide, 30% of icon)
  const dNW   = S*0.068;   // half-width at neck/drum      (46% of dW — smoother waist)
  const dBase = S*0.090;   // half-width at building base  (61% of dW, > aHW)
  const dCap  = S*0.082;   // half-width at rounded cap    (rounder top)
  const dH    = S*0.390;   // total dome assembly height
  const dTopY = baseY - dH;

  const dPath = domePathLR(cx, baseY, dTopY, dW, dNW, dBase, dCap);

  // Inner rib — inset by k px at each level (for depth)
  const k = 14;
  const dRib = domePathLR(cx, baseY, dTopY + k*0.4, dW - k, dNW - k*0.3, dBase - k*0.5, dCap - k*0.5);

  // Arch doorway — must fit inside building base (aHW < dBase = 92px)
  const aHW = S*0.063, aH = S*0.088, aTY = baseY - aH;
  const arch   = `M${f(cx-aHW)},${f(baseY)} L${f(cx-aHW)},${f(aTY+aHW)} A${f(aHW)},${f(aHW*1.08)} 0 0 1 ${f(cx+aHW)},${f(aTY+aHW)} L${f(cx+aHW)},${f(baseY)} Z`;
  const iHW    = aHW - S*0.012;
  const archIn = `M${f(cx-iHW)},${f(baseY)} L${f(cx-iHW)},${f(aTY+aHW+4)} A${f(iHW)},${f(iHW*1.08)} 0 0 1 ${f(cx+iHW)},${f(aTY+aHW+4)} L${f(cx+iHW)},${f(baseY)} Z`;

  // Crescent & star — positioned above dome arc (arc top ≈ dTopY+10-dCap)
  const arcTop = dTopY + 10 - dCap;              // Y of highest point of dome arc
  const crR    = S*0.040;                         // crescent outer radius (smaller)
  const crY    = arcTop - crR * 0.6;              // crescent sits just above arc top
  const ctR    = crR * 0.76, ctOX = crR * 0.46;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="72%">
      <stop offset="0%" stop-color="#163A26"/>
      <stop offset="100%" stop-color="#060E09"/>
    </radialGradient>
    <linearGradient id="dG" x1="25%" y1="0%" x2="75%" y2="100%">
      <stop offset="0%" stop-color="#3AAD68"/>
      <stop offset="40%" stop-color="#1E7044"/>
      <stop offset="100%" stop-color="#0E3C20"/>
    </linearGradient>
    <clipPath id="cr"><circle cx="${f(cx)}" cy="${f(crY)}" r="${f(crR)}"/></clipPath>
  </defs>

  <!-- background -->
  <rect width="${S}" height="${S}" rx="${f(S*0.175)}" fill="url(#bg)"/>

  <!-- clock ring -->
  <circle cx="${f(cx)}" cy="${f(rCY)}" r="${f(rR)}" fill="none" stroke="#235C35" stroke-width="${f(S*0.0034)}" opacity="0.62"/>
  ${ticks(cx, rCY, rR, 48, S*0.013, '#1D4C2E', f(S*0.004))}
  ${ticks(cx, rCY, rR, 12, S*0.028, '#2B6B40', f(S*0.0088))}

  <!-- ground line -->
  <rect x="${f(cx-mOff-mW)}" y="${f(baseY)}" width="${f((mOff+mW)*2)}" height="${f(S*0.010)}" rx="${f(S*0.004)}" fill="#1A5432" opacity="0.78"/>

  <!-- minarets -->
  ${minaretSVG(cx-mOff, baseY, mW, mH)}
  ${minaretSVG(cx+mOff, baseY, mW, mH)}

  <!-- dome outer fill + white outline -->
  <path d="${dPath}" fill="url(#dG)" stroke="white" stroke-width="${f(S*0.0055)}" stroke-linejoin="round"/>

  <!-- dome inner rib — very subtle highlight only -->
  <path d="${dRib}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="${f(S*0.0025)}" stroke-linejoin="round"/>

  <!-- arch doorway -->
  <path d="${arch}"   fill="#C9A227" opacity="0.96"/>
  <path d="${archIn}" fill="#060D08" opacity="0.93"/>
  <path d="${arch}"   fill="none" stroke="#E8CA40" stroke-width="${f(S*0.0038)}" opacity="0.50"/>

  <!-- finial — from arc top to just above crescent -->
  <line x1="${f(cx)}" y1="${f(arcTop+2)}" x2="${f(cx)}" y2="${f(crY-crR*0.2)}" stroke="#C9A227" stroke-width="${f(S*0.010)}" stroke-linecap="round"/>
  <circle cx="${f(cx)}" cy="${f(crY-crR*0.1)}" r="${f(S*0.010)}" fill="#C9A227"/>

  <!-- crescent moon -->
  <g clip-path="url(#cr)">
    <circle cx="${f(cx)}" cy="${f(crY)}" r="${f(crR)}" fill="white"/>
    <circle cx="${f(cx+ctOX)}" cy="${f(crY-crR*0.14)}" r="${f(ctR)}" fill="#060E09"/>
  </g>

  <!-- star beside crescent -->
  ${star(cx+crR*1.62, crY-crR*0.38, S*0.018, S*0.0077, 'white', 0.93)}

  <!-- text bar -->
  <rect x="0" y="${f(S*0.836)}" width="${S}" height="${f(S*0.164)}" rx="${f(S*0.175)}" fill="#030806" opacity="0.52"/>
  <text x="${f(cx)}" y="${f(S*0.924)}"
    text-anchor="middle"
    font-family="'Arial Black','Arial Bold',Arial,sans-serif"
    font-size="${f(S*0.066)}" font-weight="900"
    fill="white" letter-spacing="${f(S*0.005)}"
  >JADWAL SHOLAT</text>
</svg>`;
}

async function toPng(svg, out, sz) {
  await sharp(Buffer.from(svg)).resize(sz, sz).png().toFile(out);
  console.log(`  ✓ ${path.basename(out)}  ${sz}×${sz}`);
}

async function main() {
  console.log('\n🕌  Generating icons…\n');
  const full = buildSVG(1024);

  await toPng(full, path.join(ASSETS,'icon.png'), 1024);
  await toPng(full, path.join(ASSETS,'favicon.png'), 64);
  await toPng(full, path.join(ASSETS,'android-icon-foreground.png'), 1024);
  await toPng(full, path.join(ASSETS,'splash-icon.png'), 1024);

  const mono = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <circle cx="512" cy="463" r="316" fill="none" stroke="white" stroke-width="5" opacity="0.35"/>
    <rect x="274" y="462" width="39" height="190" rx="5" fill="white" opacity="0.72"/>
    <rect x="711" y="462" width="39" height="190" rx="5" fill="white" opacity="0.72"/>
    <path d="M 454 654 C 454 620 320 558 320 472 C 320 380 406 315 512 311 C 618 315 704 380 704 472 C 704 558 570 620 570 654 Z" fill="white"/>
    <polygon points="512,287 518,305 537,305 522,317 527,335 512,323 497,335 502,317 487,305 506,305" fill="white"/>
  </svg>`;
  await toPng(mono, path.join(ASSETS,'android-icon-monochrome.png'), 1024);

  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#0C1E12"/></svg>`;
  await toPng(bg, path.join(ASSETS,'android-icon-background.png'), 1024);

  console.log('\n✅  Done!\n');
}
main().catch(e => { console.error(e); process.exit(1); });
