// Chapter 3 world art: ground, pits, props, movers, decor and the summit finale.
// Same contract as art.js (world coordinates, tone function T applied to every colour).

import { hash, mulberry32 } from './rng.js';
import { rr, vg, edgeShade, blades, woodGrad, backPost, drawRock } from './art.js';
import { mix, alpha, TAU, fract, clamp } from './util.js';

// ---------------------------------------------------------------- ground

function soil(ctx, s, sx0, sx1, bottom, T, G, depth = 120) {
  ctx.fillStyle = vg(ctx, s.y, s.y + depth, T(G.body), T(G.deep));
  ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
}

function stones(ctx, s, sx0, sx1, col, step, y0, y1, r0, r1) {
  ctx.fillStyle = col;
  for (let x = Math.floor(sx0 / step) * step; x < sx1; x += step) {
    const h = hash(x * 3);
    if (h < 0.45) continue;
    ctx.beginPath();
    ctx.ellipse(x + h * step * 0.6, s.y + y0 + hash(x * 7) * (y1 - y0), r0 + h * (r1 - r0), (r0 + h * (r1 - r0)) * 0.6, 0, 0, TAU);
    ctx.fill();
  }
}

export const SKY_SEG = {
  orchard(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    soil(ctx, s, sx0, sx1, bottom, T, G, 110);
    ctx.fillStyle = alpha('#140c06', 0.32);
    ctx.fillRect(sx0, s.y + 8, sx1 - sx0, 10);
    stones(ctx, s, sx0, sx1, alpha('#000000', 0.16), 31, 24, 100, 3, 8);
    stones(ctx, s, sx0, sx1, alpha('#d8b98a', 0.12), 23, 18, 80, 2, 3);
    ctx.fillStyle = vg(ctx, s.y - 1, s.y + 12, T(G.top2), T(G.top));
    ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 11);
    // clover heads and fallen petals in the grass
    ctx.fillStyle = T('#f4f2ea');
    for (let x = Math.floor(sx0 / 17) * 17; x < sx1; x += 17) if (hash(x * 9) > 0.7) ctx.fillRect(x, s.y - 4 - hash(x) * 3, 2, 2);
    const pet = P.petals;
    for (let x = Math.floor(sx0 / 7) * 7; x < sx1; x += 7) {
      if (hash(x * 13) < 0.62) continue;
      ctx.fillStyle = T(pet[Math.floor(hash(x * 5) * pet.length)]);
      ctx.beginPath();
      ctx.ellipse(x, s.y + 1 + hash(x * 3) * 3, 1.8, 1.1, hash(x) * 3, 0, TAU);
      ctx.fill();
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
    blades(ctx, s, sx0, sx1, T(G.top), 3, 7, 3.4);
    blades(ctx, s, sx0, sx1, T(G.top2), 2, 6, 5.3, 1);
  },

  lavender(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    soil(ctx, s, sx0, sx1, bottom, T, G, 140);
    stones(ctx, s, sx0, sx1, alpha('#2a1a0a', 0.22), 19, 14, 110, 2, 6);
    stones(ctx, s, sx0, sx1, alpha('#f0dcb8', 0.12), 13, 10, 90, 1.5, 3);
    // a pale gravel track, rutted by cart wheels
    ctx.fillStyle = vg(ctx, s.y - 2, s.y + 10, T(G.top2), T(G.top));
    ctx.fillRect(sx0, s.y - 2, sx1 - sx0, 10);
    ctx.fillStyle = alpha('#6a4a2a', 0.22);
    ctx.fillRect(sx0, s.y + 2, sx1 - sx0, 1.4);
    ctx.fillStyle = T(mix(G.top, '#5a4028', 0.35));
    for (let x = Math.floor(sx0 / 6) * 6; x < sx1; x += 6) if (hash(x * 7) > 0.55) ctx.fillRect(x, s.y - 2 + hash(x) * 6, 1.6, 1.2);
    ctx.fillStyle = T(P.lav);
    for (let x = Math.floor(sx0 / 23) * 23; x < sx1; x += 23) if (hash(x * 11) > 0.7) ctx.fillRect(x, s.y - 1, 2.4, 1.2);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#2a1606', 0.45));
  },

  volcano(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    soil(ctx, s, sx0, sx1, bottom, T, G, 160);
    // basalt cooled into columns
    ctx.strokeStyle = alpha('#000000', 0.35);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 26) * 26; x < sx1; x += 26) {
      ctx.moveTo(x + hash(x) * 4, s.y + 10);
      ctx.lineTo(x + hash(x * 3) * 4, Math.min(bottom, s.y + 200));
    }
    for (let y = s.y + 30; y < Math.min(bottom, s.y + 200); y += 34) {
      for (let x = Math.floor(sx0 / 26) * 26; x < sx1; x += 26) {
        if (hash(x + y) < 0.5) continue;
        ctx.moveTo(x, y + hash(x * y) * 10);
        ctx.lineTo(x + 26, y + hash(x * y + 1) * 10);
      }
    }
    ctx.stroke();
    ctx.fillStyle = alpha(P.light, 0.05);
    for (let x = Math.floor(sx0 / 26) * 26; x < sx1; x += 26) ctx.fillRect(x + 2, s.y + 10, 3, Math.min(bottom - s.y, 190));
    // crust with cracks that still glow
    ctx.fillStyle = vg(ctx, s.y - 2, s.y + 9, T(G.top2), T(G.top));
    ctx.beginPath();
    ctx.moveTo(sx0, s.y + 9);
    for (let x = Math.floor(sx0 / 9) * 9; x <= sx1 + 9; x += 9) ctx.lineTo(clamp(x, sx0, sx1), s.y - 1 - hash(x) * 2.4);
    ctx.lineTo(sx1, s.y + 9);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let x = Math.floor(sx0 / 53) * 53; x < sx1; x += 53) {
      if (hash(x * 5) < 0.55) continue;
      const k = 0.55 + 0.45 * Math.sin(t * 1.7 + x);
      ctx.strokeStyle = alpha(P.lamp, 0.55 * k);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x, s.y + 2);
      ctx.lineTo(x + 6, s.y + 6);
      ctx.lineTo(x + 3, s.y + 12);
      ctx.lineTo(x + 10, s.y + 18);
      ctx.stroke();
    }
    ctx.restore();
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.55));
  },

  cloudforest(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    // an old mossy limb or earth ledge, roots trailing into the cloud
    ctx.fillStyle = vg(ctx, s.y, s.y + 150, T('#3a3a26'), T('#141810'));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    ctx.fillStyle = T('#4e6a30');
    for (let x = Math.floor(sx0 / 15) * 15; x < sx1; x += 15) {
      const h = hash(x * 3);
      ctx.beginPath();
      ctx.ellipse(x, s.y + 16 + h * 8, 9 + h * 6, 4 + h * 3, 0, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = alpha('#9ab070', 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 19) * 19; x < sx1; x += 19) {
      if (hash(x * 7) < 0.4) continue;
      const l = 20 + hash(x) * 60;
      ctx.moveTo(x, s.y + 20);
      ctx.quadraticCurveTo(x + 3, s.y + 20 + l * 0.5, x - 1, s.y + 20 + l);
    }
    ctx.stroke();
    // the walkway: planks on the limb, worn smooth, a little moss in the joints
    ctx.fillStyle = T('#2e2418');
    ctx.fillRect(sx0, s.y + 7, sx1 - sx0, 5);
    ctx.fillStyle = vg(ctx, s.y - 1, s.y + 8, T(G.top2), T(G.top));
    ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 8);
    ctx.fillStyle = alpha('#000000', 0.4);
    for (let x = Math.floor(sx0 / 20) * 20; x < sx1; x += 20) ctx.fillRect(x, s.y - 1, 1.2, 8);
    ctx.fillStyle = T('#6a8a3a');
    for (let x = Math.floor(sx0 / 20) * 20; x < sx1; x += 20) if (hash(x * 3) > 0.5) ctx.fillRect(x - 1.5, s.y - 2, 4, 2);
    ctx.fillStyle = alpha(P.light, 0.22);
    ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 1);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.5));
  },

  maple(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    soil(ctx, s, sx0, sx1, bottom, T, G, 130);
    ctx.strokeStyle = alpha('#0a0604', 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 57) * 57; x < sx1; x += 57) {
      if (hash(x) < 0.4) continue;
      ctx.moveTo(x, s.y + 6);
      ctx.quadraticCurveTo(x + 14, s.y + 24, x + 6 + hash(x * 3) * 26, s.y + 40 + hash(x * 5) * 30);
    }
    ctx.stroke();
    ctx.fillStyle = vg(ctx, s.y - 2, s.y + 10, T(G.top2), T(G.top));
    ctx.fillRect(sx0, s.y - 2, sx1 - sx0, 10);
    // a deep litter of fallen maple leaves
    for (let x = Math.floor(sx0 / 5) * 5; x < sx1; x += 5) {
      if (hash(x * 11) < 0.35) continue;
      ctx.fillStyle = T(P.leaves[Math.floor(hash(x * 17) * P.leaves.length)]);
      ctx.beginPath();
      ctx.ellipse(x, s.y - 1 + hash(x * 3) * 4, 3, 1.5, hash(x) * 3, 0, TAU);
      ctx.fill();
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.5));
  },

  summit(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    soil(ctx, s, sx0, sx1, bottom, T, G, 160);
    ctx.strokeStyle = alpha('#000000', 0.35);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 41) * 41; x < sx1; x += 41) {
      if (hash(x * 3) < 0.45) continue;
      ctx.moveTo(x, s.y + 8);
      ctx.lineTo(x + 6, s.y + 24);
      ctx.lineTo(x + 2, s.y + 44);
      ctx.lineTo(x + 9, s.y + 60);
    }
    ctx.stroke();
    stones(ctx, s, sx0, sx1, alpha('#8a9ac8', 0.08), 29, 20, 120, 4, 10);
    ctx.fillStyle = vg(ctx, s.y - 2, s.y + 9, T(G.top2), T(G.top));
    ctx.beginPath();
    ctx.moveTo(sx0, s.y + 9);
    for (let x = Math.floor(sx0 / 8) * 8; x <= sx1 + 8; x += 8) ctx.lineTo(clamp(x, sx0, sx1), s.y - 1 - hash(x) * 2);
    ctx.lineTo(sx1, s.y + 9);
    ctx.fill();
    // old snow in the hollows, frost that catches the starlight
    ctx.fillStyle = alpha('#c8d4f0', 0.5);
    for (let x = Math.floor(sx0 / 90) * 90; x < sx1; x += 90) {
      if (hash(x * 5) < 0.5) continue;
      ctx.beginPath();
      ctx.ellipse(x + 20, s.y + 1, 18 + hash(x) * 20, 2.6, 0, Math.PI, 0);
      ctx.fill();
    }
    for (let x = Math.floor(sx0 / 13) * 13; x < sx1; x += 13) {
      const h = hash(x * 19);
      if (h < 0.75) continue;
      ctx.fillStyle = alpha('#e8f0ff', (0.5 + 0.5 * Math.sin(t * 3 + x)) * 0.7);
      ctx.fillRect(x, s.y + h * 4, 1.2, 1.2);
    }
    blades(ctx, s, sx0, sx1, T('#5a6a6a'), 2, 4, 5.7);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.5));
  },
};

/** Pits for the chapter 3 terrains. Returns false when the terrain is not one of ours. */
export function skyPit(ctx, terr, P, T, a, b, bottom, t) {
  const top = Math.max(a.y, b.y) + 1;
  const x0 = a.x1;
  const w = b.x0 - a.x1;
  if (terr === 'orchard' || terr === 'lavender') {
    ctx.fillStyle = vg(ctx, top, top + 120, T(mix(P.ground.body, '#000000', 0.35)), T(P.ground.deep));
    ctx.fillRect(x0, top, w, bottom - top);
    const wy = top + 86;
    const water = P.water || '#7a9aa8';
    ctx.fillStyle = vg(ctx, wy, wy + 60, T(mix(water, P.light, 0.25)), T(mix(water, '#000000', 0.5)));
    ctx.fillRect(x0, wy, w, bottom - wy);
    ctx.strokeStyle = alpha(P.light, 0.35);
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const xx = x0 + fract(hash(k + a.x1) + t * 0.15) * w;
      ctx.beginPath();
      ctx.moveTo(xx, wy + 3 + k * 6);
      ctx.lineTo(Math.min(x0 + w, xx + 14), wy + 3 + k * 6);
      ctx.stroke();
    }
  } else if (terr === 'volcano') {
    ctx.fillStyle = vg(ctx, top, top + 140, '#140c0e', '#3a0c06', '#c8401a');
    ctx.fillRect(x0, top, w, bottom - top);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const ly = top + 120;
    const k = 0.75 + 0.25 * Math.sin(t * 2.2 + a.x1);
    const g = ctx.createLinearGradient(0, ly - 70, 0, ly + 20);
    g.addColorStop(0, alpha('#ff6a20', 0));
    g.addColorStop(1, alpha('#ff8a30', 0.55 * k));
    ctx.fillStyle = g;
    ctx.fillRect(x0, ly - 70, w, 90);
    ctx.fillStyle = alpha('#ffd070', 0.7 * k);
    for (let j = 0; j < 5; j++) {
      const xx = x0 + fract(hash(j + a.x1) + t * 0.05) * w;
      ctx.fillRect(xx, ly + 4 + j * 4, Math.min(12, x0 + w - xx), 1.4);
    }
    ctx.restore();
  } else if (terr === 'cloudforest') {
    ctx.fillStyle = vg(ctx, top, top + 160, T(mix(P.ground.deep, P.haze, 0.2)), mix(P.haze, '#ffffff', 0.1));
    ctx.fillRect(x0, top, w, bottom - top);
    for (let k = 0; k < 4; k++) {
      const yy = top + 50 + k * 26;
      const xx = x0 + fract(hash(k * 3 + a.x1) + t * 0.03) * w;
      const r = 26 + k * 6;
      const g = ctx.createRadialGradient(xx, yy, 0, xx, yy, r);
      g.addColorStop(0, alpha('#ffffff', 0.35));
      g.addColorStop(1, alpha('#ffffff', 0));
      ctx.fillStyle = g;
      ctx.fillRect(Math.max(x0, xx - r), yy - r, Math.min(x0 + w, xx + r) - Math.max(x0, xx - r), r * 2);
    }
  } else if (terr === 'maple') {
    ctx.fillStyle = vg(ctx, top, top + 120, T(mix(P.ground.body, '#000000', 0.45)), T('#140a06'));
    ctx.fillRect(x0, top, w, bottom - top);
    const wy = top + 96;
    ctx.fillStyle = vg(ctx, wy, wy + 50, T(mix(P.water, P.light, 0.2)), T(mix(P.water, '#000000', 0.5)));
    ctx.fillRect(x0, wy, w, bottom - wy);
    ctx.fillStyle = alpha('#ffffff', 0.6);
    for (let k = 0; k < 6; k++) {
      const xx = x0 + fract(hash(k + a.x1) + t * 0.4) * w;
      ctx.fillRect(xx, wy + 2 + (k % 3) * 4, Math.min(8, x0 + w - xx), 1.6);
    }
  } else if (terr === 'summit') {
    ctx.fillStyle = vg(ctx, top, top + 220, T(mix(P.ground.deep, '#2a3460', 0.3)), '#02030a');
    ctx.fillRect(x0, top, w, bottom - top);
    ctx.fillStyle = alpha('#9ab0e0', 0.12);
    for (let k = 0; k < 4; k++) ctx.fillRect(x0 + 2, top + 12 + k * 22, Math.max(2, w * (0.1 + hash(k + a.x1) * 0.2)), 1);
  } else return false;
  return true;
}

// ---------------------------------------------------------------- props

/** A maple leaf: five pointed lobes, the top and upper pair longest, and a stem. */
function mapleLeaf(ctx, s) {
  const lobes = [
    [-Math.PI / 2, 1],
    [-Math.PI / 2 + 1.15, 0.86],
    [-Math.PI / 2 + 2.3, 0.56],
    [-Math.PI / 2 - 2.3, 0.56],
    [-Math.PI / 2 - 1.15, 0.86],
  ];
  ctx.beginPath();
  ctx.moveTo(0, s * 0.2);
  for (const [a, l] of [lobes[2], lobes[1], lobes[0], lobes[4], lobes[3]]) {
    ctx.lineTo(Math.cos(a - 0.28) * s * l * 0.55, Math.sin(a - 0.28) * s * l * 0.55);
    ctx.lineTo(Math.cos(a) * s * l, Math.sin(a) * s * l);
    ctx.lineTo(Math.cos(a + 0.28) * s * l * 0.55, Math.sin(a + 0.28) * s * l * 0.55);
    ctx.lineTo(Math.cos(a + 0.58) * s * 0.3, Math.sin(a + 0.58) * s * 0.3);
  }
  ctx.closePath();
  ctx.moveTo(0, s * 0.2);
  ctx.lineTo(s * 0.08, s * 0.75);
  ctx.lineTo(-s * 0.06, s * 0.75);
}

function blossomBlobs(ctx, x, y, w, h, T, P, seed, n = 22) {
  const r = mulberry32(seed);
  const cols = [P.blossom, mix(P.blossom, '#ffffff', 0.5), mix(P.blossom, '#d0607a', 0.3)];
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = T(cols[i % 3]);
    ctx.beginPath();
    ctx.arc(x + r() * w, y + r() * h, 4 + r() * 6, 0, TAU);
    ctx.fill();
  }
}

function hexColumn(ctx, x, top, w, base, T, P, light) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, T(mix('#4a4450', P.light, light)));
  g.addColorStop(0.5, T('#2e2a32'));
  g.addColorStop(1, T('#16131a'));
  ctx.fillStyle = g;
  ctx.fillRect(x, top, w, base - top);
  ctx.fillStyle = T(mix('#5a5460', P.light, light * 0.8));
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + w * 0.25, top - 4);
  ctx.lineTo(x + w * 0.75, top - 4);
  ctx.lineTo(x + w, top);
  ctx.lineTo(x + w * 0.75, top + 3);
  ctx.lineTo(x + w * 0.25, top + 3);
  ctx.closePath();
  ctx.fill();
}

function stoneStack(ctx, cx, base, w, h, T, P, seed, n) {
  const r = mulberry32(seed);
  let y = base;
  for (let i = 0; i < n; i++) {
    const sw = w * (1 - i / (n + 1.5)) * (0.85 + r() * 0.25);
    const sh = (h / n) * (0.9 + r() * 0.2);
    const ox = (r() - 0.5) * 4;
    const g = ctx.createLinearGradient(0, y - sh, 0, y);
    g.addColorStop(0, T(mix('#7a8296', P.light, 0.25)));
    g.addColorStop(1, T('#3a4054'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx + ox, y - sh / 2, sw / 2, sh / 2 + 0.6, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = alpha('#000000', 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();
    y -= sh * 0.92;
  }
}

function pumpkinAt(ctx, cx, base, r, T, col) {
  const g = ctx.createRadialGradient(cx - r * 0.35, base - r * 1.2, 1, cx, base - r * 0.8, r * 1.3);
  g.addColorStop(0, T(mix(col, '#ffe0a0', 0.4)));
  g.addColorStop(1, T(mix(col, '#5a1a04', 0.45)));
  ctx.fillStyle = g;
  for (const d of [-0.55, 0.55, 0]) {
    ctx.beginPath();
    ctx.ellipse(cx + d * r, base - r * 0.82, r * 0.6, r * 0.82, 0, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = alpha('#5a1a04', 0.4);
  ctx.lineWidth = 1;
  for (const d of [-0.3, 0.3]) {
    ctx.beginPath();
    ctx.ellipse(cx + d * r, base - r * 0.82, r * 0.25, r * 0.78, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.fillStyle = T('#4a5a24');
  ctx.fillRect(cx - 1.6, base - r * 1.75, 3.2, r * 0.3);
}

export const SKY_OB = {
  // ---------- Blossom Orchard
  beehive(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    const boxes = 3;
    const bh = (h - 6) / boxes;
    for (let i = 0; i < boxes; i++) {
      const by = y + 6 + i * bh;
      ctx.fillStyle = vg(ctx, by, by + bh, T('#f2ece0'), T('#cfc6b4'));
      ctx.fillRect(x + 2, by, w - 4, bh - 1);
      ctx.fillStyle = alpha('#000000', 0.18);
      ctx.fillRect(x + 2, by + bh - 2, w - 4, 1.5);
    }
    ctx.fillStyle = T('#8a7a62');
    ctx.fillRect(x - 2, y, w + 4, 7);
    ctx.fillStyle = T('#3a2a1a');
    ctx.fillRect(x + w * 0.3, y + h - 6, w * 0.4, 3);
    ctx.fillStyle = T('#5a4a30');
    ctx.fillRect(x + 2, y + h - 2, 4, 2);
    ctx.fillRect(x + w - 6, y + h - 2, 4, 2);
    // a few bees about their business
    for (let k = 0; k < 4; k++) {
      const a = t * (2 + k * 0.4) + k * 1.7 + o.seed;
      const bx = x + w / 2 + Math.cos(a) * (w * 0.7);
      const by = y + 4 + Math.sin(a * 1.3) * 10 - 6;
      ctx.fillStyle = T('#e8b830');
      ctx.beginPath();
      ctx.ellipse(bx, by, 2, 1.4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = alpha('#ffffff', 0.6);
      ctx.fillRect(bx - 1, by - 2.4, 2, 1.2);
    }
  },
  wheelbarrow(ctx, o, T) {
    const { x, y, w, h } = o;
    const wr = h * 0.32;
    ctx.strokeStyle = T('#5a4028');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.45);
    ctx.lineTo(x - 6, y + h * 0.15);
    ctx.moveTo(x + w * 0.35, y + h * 0.6);
    ctx.lineTo(x + w * 0.3, y + h);
    ctx.stroke();
    ctx.fillStyle = vg(ctx, y, y + h * 0.6, T('#4a7a5a'), T('#2a4a36'));
    ctx.beginPath();
    ctx.moveTo(x + w * 0.08, y + 6);
    ctx.lineTo(x + w, y + 2);
    ctx.lineTo(x + w * 0.82, y + h * 0.6);
    ctx.lineTo(x + w * 0.25, y + h * 0.62);
    ctx.closePath();
    ctx.fill();
    // a load of apples
    ctx.fillStyle = T('#c83a2a');
    for (let k = 0; k < 7; k++) {
      ctx.beginPath();
      ctx.arc(x + w * 0.2 + k * w * 0.1, y + 3 - hash(o.seed + k) * 4, 4, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = T('#2a2a2a');
    ctx.beginPath();
    ctx.arc(x + w * 0.78, y + h - wr, wr, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#8a8a84');
    ctx.beginPath();
    ctx.arc(x + w * 0.78, y + h - wr, wr * 0.35, 0, TAU);
    ctx.fill();
  },
  blossomBranch(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const tx = x + w + 28;
    const bark = T('#4a3428');
    ctx.fillStyle = T(mix('#3e2c22', P.haze, 0.1));
    ctx.beginPath();
    ctx.moveTo(tx - 15, o.ground);
    ctx.quadraticCurveTo(tx - 5, y + h, tx - 6, y - 100);
    ctx.lineTo(tx + 6, y - 100);
    ctx.quadraticCurveTo(tx + 8, y + h, tx + 17, o.ground);
    ctx.fill();
    ctx.strokeStyle = T(mix('#3e2c22', P.haze, 0.1));
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tx, y - 70);
    ctx.lineTo(tx + 30, y - 120);
    ctx.moveTo(tx, y - 80);
    ctx.lineTo(tx - 26, y - 128);
    ctx.stroke();
    blossomBlobs(ctx, tx - 70, y - 175, 150, 90, T, P, o.seed + 9, 34);
    ctx.strokeStyle = bark;
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(tx, y + h * 0.35);
    ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.5, x - 22, y + h * 0.3);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      const bx = x + (w * (k + 0.4)) / 5;
      ctx.beginPath();
      ctx.moveTo(bx, y + h * 0.45);
      ctx.lineTo(bx - 8, y + h * 0.82);
      ctx.stroke();
    }
    blossomBlobs(ctx, x - 30, y - h * 0.1, w + 70, h * 0.95, T, P, o.seed, 30);
  },
  cart(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const wr = 15;
    // a hay cart, full to a flat top you can stand on
    ctx.fillStyle = woodGrad(ctx, y + h * 0.5, h * 0.3, T, '#9a6a3a', '#7a4e28', '#4a2e16');
    ctx.fillRect(x, y + h * 0.48, w, h * 0.26);
    ctx.fillStyle = alpha('#000000', 0.25);
    for (let xx = x + 12; xx < x + w; xx += 18) ctx.fillRect(xx, y + h * 0.48, 1.4, h * 0.26);
    ctx.fillStyle = vg(ctx, y, y + h * 0.5, T('#e6c66e'), T('#b8963e'));
    rr(ctx, x - 4, y, w + 8, h * 0.5, 8);
    ctx.fill();
    ctx.strokeStyle = alpha(T('#fff0b8'), 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const sx = x + hash(o.seed + i) * w;
      const sy = y + 4 + hash(o.seed + i * 7) * h * 0.4;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 5, sy + (hash(i) - 0.5) * 3);
    }
    ctx.stroke();
    for (const wx of [x + w * 0.22, x + w * 0.78]) {
      ctx.fillStyle = T('#3a2616');
      ctx.beginPath();
      ctx.arc(wx, y + h - wr, wr, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = T('#8a6a44');
      ctx.lineWidth = 1.6;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU;
        ctx.beginPath();
        ctx.moveTo(wx, y + h - wr);
        ctx.lineTo(wx + Math.cos(a) * wr * 0.85, y + h - wr + Math.sin(a) * wr * 0.85);
        ctx.stroke();
      }
    }
    void P;
  },

  // ---------- Lavender Fields
  lavBundle(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const n = 3;
    for (let i = 0; i < n; i++) {
      const by = y + h * (0.1 + i * 0.3);
      const bx = x + (i % 2) * 6;
      ctx.fillStyle = T('#6a7a4a');
      ctx.fillRect(bx, by + h * 0.12, w * 0.5, h * 0.12);
      ctx.fillStyle = T(P.lav);
      ctx.beginPath();
      ctx.ellipse(bx + w * 0.72, by + h * 0.18, w * 0.3, h * 0.16, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = T(mix(P.lav, '#ffffff', 0.3));
      for (let k = 0; k < 6; k++) ctx.fillRect(bx + w * 0.5 + k * w * 0.08, by + h * 0.08 + hash(o.seed + k + i) * h * 0.18, 1.6, 1.6);
      ctx.fillStyle = T('#c8a060');
      ctx.fillRect(bx + w * 0.38, by + h * 0.09, 3, h * 0.2);
    }
  },
  stoneWall(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const r = mulberry32(o.seed);
    ctx.fillStyle = T('#7a6e60');
    ctx.fillRect(x, y + 4, w, h - 4);
    for (let row = 0; row < 3; row++) {
      let xx = x + (row % 2) * 6;
      const yy = y + 4 + row * ((h - 4) / 3);
      while (xx < x + w - 2) {
        const sw = 12 + r() * 14;
        const c = mix('#9a8e7e', '#5a5046', r() * 0.6);
        ctx.fillStyle = T(mix(c, P.light, 0.1));
        rr(ctx, xx, yy + 1, Math.min(sw, x + w - xx) - 1.5, (h - 4) / 3 - 2, 3);
        ctx.fill();
        xx += sw;
      }
    }
    ctx.fillStyle = T('#8a8070');
    for (let xx = x; xx < x + w; xx += 9) {
      ctx.beginPath();
      ctx.ellipse(xx + 4, y + 3, 5, 3.6, 0, 0, TAU);
      ctx.fill();
    }
  },
  grapeArbor(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const post = T(mix('#6a4a2e', P.haze, 0.2));
    backPost(ctx, x + 4, y, o.ground, 6, post);
    backPost(ctx, x + w - 4, y, o.ground, 6, post);
    ctx.fillStyle = woodGrad(ctx, y, 8, T, '#9a6a3a', '#7a4e28', '#4a2e16');
    ctx.fillRect(x - 16, y, w + 32, 7);
    ctx.fillStyle = T('#5a3a20');
    for (let xx = x - 10; xx < x + w + 12; xx += 16) ctx.fillRect(xx, y - 4, 5, 10);
    // vines and bunches hang into the gap
    const leaf = [T('#4a6a2a'), T('#5e7e34'), T('#3a5a22')];
    for (let k = 0; k < 22; k++) {
      ctx.fillStyle = leaf[k % 3];
      ctx.beginPath();
      ctx.ellipse(x - 14 + hash(o.seed + k) * (w + 28), y + 6 + hash(o.seed + k * 3) * (h - 12), 6, 4, hash(k) * 3, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = T('#5a2a5a');
    for (let k = 0; k < 5; k++) {
      const gx = x + (k + 0.5) * (w / 5);
      for (let j = 0; j < 6; j++) {
        ctx.beginPath();
        ctx.arc(gx + ((j % 3) - 1) * 2.6, y + h - 12 + Math.floor(j / 3) * 3.6, 2, 0, TAU);
        ctx.fill();
      }
    }
  },
  lavCart(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const wr = 15;
    ctx.fillStyle = woodGrad(ctx, y + h * 0.3, h * 0.45, T, '#5a7aa0', '#3e5a7e', '#24364e');
    ctx.fillRect(x, y + h * 0.28, w, h * 0.46);
    ctx.fillStyle = alpha('#000000', 0.25);
    for (let xx = x + 14; xx < x + w; xx += 20) ctx.fillRect(xx, y + h * 0.28, 1.4, h * 0.46);
    ctx.fillStyle = T('#2e3e56');
    ctx.fillRect(x - 3, y + h * 0.26, w + 6, 4);
    // heaped with cut lavender, bound in sheaves
    for (let k = 0; k < Math.floor(w / 16); k++) {
      const bx = x + 6 + k * 16;
      ctx.fillStyle = T('#6a7a4a');
      ctx.fillRect(bx, y + h * 0.1, 10, h * 0.18);
      ctx.fillStyle = T(P.lav);
      ctx.beginPath();
      ctx.ellipse(bx + 5, y + h * 0.08, 8, 6, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = T(mix(P.lav, '#ffffff', 0.25));
    ctx.fillRect(x, y, w, 3);
    for (const wx of [x + w * 0.2, x + w * 0.8]) {
      ctx.fillStyle = T('#2a2016');
      ctx.beginPath();
      ctx.arc(wx, y + h - wr, wr, 0, TAU);
      ctx.fill();
      ctx.fillStyle = T('#8a7a5a');
      ctx.beginPath();
      ctx.arc(wx, y + h - wr, wr * 0.3, 0, TAU);
      ctx.fill();
    }
  },

  // ---------- Fire Island
  basalt(ctx, o, T, P) {
    drawRock(ctx, o, T, '#3a3440', false, false, P.light);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = alpha(P.lamp, 0.35);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(o.x + o.w * 0.3, o.y + o.h * 0.4);
    ctx.lineTo(o.x + o.w * 0.45, o.y + o.h * 0.7);
    ctx.lineTo(o.x + o.w * 0.4, o.y + o.h);
    ctx.stroke();
    ctx.restore();
  },
  pumice(ctx, o, T, P) {
    drawRock(ctx, o, T, '#8a8078', false, false, P.light);
    ctx.fillStyle = alpha('#2a2420', 0.4);
    for (let k = 0; k < 10; k++) {
      ctx.beginPath();
      ctx.arc(o.x + o.w * (0.2 + hash(o.seed + k) * 0.6), o.y + o.h * (0.35 + hash(o.seed + k * 3) * 0.55), 1.2 + hash(k) * 1.4, 0, TAU);
      ctx.fill();
    }
  },
  lavaArch(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a natural arch of black rock over the path
    const rock = T('#2a2430');
    ctx.fillStyle = rock;
    ctx.beginPath();
    ctx.moveTo(x - 30, o.ground);
    ctx.lineTo(x - 26, y + h * 0.6);
    ctx.quadraticCurveTo(x - 20, y - 6, x + w * 0.5, y - 4);
    ctx.quadraticCurveTo(x + w + 20, y - 6, x + w + 26, y + h * 0.6);
    ctx.lineTo(x + w + 32, o.ground);
    ctx.lineTo(x + w + 6, o.ground);
    ctx.lineTo(x + w - 4, y + h);
    ctx.quadraticCurveTo(x + w * 0.5, y + h + 4, x + 4, y + h);
    ctx.lineTo(x - 6, o.ground);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = alpha(P.light, 0.08);
    ctx.fillRect(x - 26, y + h * 0.6, 6, o.ground - y - h * 0.6);
    ctx.strokeStyle = alpha('#000000', 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x + w * 0.4, y + h * 0.5);
    ctx.lineTo(x + w * 0.7, y + 8);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const k = 0.6 + 0.4 * Math.sin(t * 1.4 + o.seed);
    ctx.strokeStyle = alpha(P.lamp, 0.5 * k);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.4);
    ctx.lineTo(x + w * 0.35, y + h * 0.7);
    ctx.lineTo(x + w * 0.55, y + h * 0.55);
    ctx.stroke();
    ctx.restore();
  },
  basaltColumns(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const n = Math.max(3, Math.round(w / 26));
    const cw = w / n;
    for (let i = 0; i < n; i++) {
      const top = y + (i % 2 ? 6 : 0) + hash(o.seed + i) * 4;
      hexColumn(ctx, x + i * cw, top, cw + 0.5, y + h, T, P, i === 0 ? 0.3 : 0.15);
    }
    ctx.strokeStyle = alpha('#000000', 0.3);
    ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
      const yy = y + (h * k) / 4;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        ctx.moveTo(x + i * cw + 2, yy + hash(i + k) * 6);
        ctx.lineTo(x + (i + 1) * cw - 2, yy + hash(i * 3 + k) * 6);
      }
      ctx.stroke();
    }
  },

  // ---------- Cloud Forest
  mossLog(ctx, o, T) {
    const { x, y, w, h } = o;
    const r = h / 2;
    ctx.fillStyle = woodGrad(ctx, y, h, T, '#6a5038', '#4a3424', '#2a1c12');
    rr(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.fillStyle = T('#a08060');
    ctx.beginPath();
    ctx.ellipse(x + r * 0.6, y + r, r * 0.55, r * 0.9, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#6a5038');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x + r * 0.6, y + r, r * 0.3, r * 0.5, 0, 0, TAU);
    ctx.stroke();
    // a thick coat of moss and little ferns on top
    ctx.fillStyle = T('#5a7e2e');
    ctx.beginPath();
    ctx.moveTo(x + r * 0.8, y + h * 0.35);
    for (let k = 0; k <= 12; k++) ctx.lineTo(x + r * 0.8 + ((w - r) * k) / 12, y - 2 - hash(o.seed + k) * 4);
    ctx.lineTo(x + w - 2, y + h * 0.4);
    ctx.fill();
    ctx.strokeStyle = T('#6a9a3a');
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) {
      const fx = x + w * (0.3 + k * 0.25);
      for (const a of [-0.8, -0.3, 0.3, 0.8]) {
        ctx.beginPath();
        ctx.moveTo(fx, y);
        ctx.quadraticCurveTo(fx + a * 6, y - 8, fx + a * 10, y - 6);
        ctx.stroke();
      }
    }
  },
  fernClump(ctx, o, T) {
    const { x, y, w, h } = o;
    const cx = x + w / 2;
    // tree fern: stiff fronds with sharp tips, too spiky to land on
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = T(pass ? '#5e8a34' : '#2e4a1e');
      for (let k = 0; k < 9; k++) {
        const a = -Math.PI / 2 + (k / 8 - 0.5) * 2.6;
        const len = h * (0.85 + hash(o.seed + k) * 0.3);
        const ex = cx + Math.cos(a) * len * (w / h) * 0.62;
        const ey = y + h + Math.sin(a) * len;
        ctx.lineWidth = pass ? 1.6 : 3;
        ctx.beginPath();
        ctx.moveTo(cx, y + h);
        ctx.quadraticCurveTo((cx + ex) / 2, (y + h + ey) / 2 - 6, ex, ey);
        ctx.stroke();
        if (pass) {
          ctx.lineWidth = 1;
          for (let j = 0.3; j < 1; j += 0.14) {
            const px = cx + (ex - cx) * j;
            const py = y + h + (ey - y - h) * j - Math.sin(j * Math.PI) * 4;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - 4, py - 3);
            ctx.moveTo(px, py);
            ctx.lineTo(px + 4, py - 2);
            ctx.stroke();
          }
        }
      }
    }
  },
  hangingMoss(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a fallen giant caught between two trees, bearded with moss
    const back = T(mix('#3a3022', P.haze, 0.3));
    backPost(ctx, x - 4, y + 10, o.ground, 14, back);
    backPost(ctx, x + w + 4, y + 10, o.ground, 16, back);
    ctx.fillStyle = woodGrad(ctx, y, h * 0.45, T, '#5a4630', '#3e2e20', '#24180e');
    rr(ctx, x - 26, y, w + 52, h * 0.45, h * 0.2);
    ctx.fill();
    ctx.fillStyle = T('#5a7e2e');
    ctx.fillRect(x - 24, y - 2, w + 48, 4);
    ctx.strokeStyle = T('#7a9a4a');
    ctx.lineWidth = 2;
    for (let k = 0; k < 14; k++) {
      const mx = x - 16 + hash(o.seed + k) * (w + 32);
      const len = h * (0.35 + hash(o.seed + k * 3) * 0.2);
      const sway = Math.sin(t * 1.3 + k) * 2;
      ctx.beginPath();
      ctx.moveTo(mx, y + h * 0.4);
      ctx.quadraticCurveTo(mx + sway, y + h * 0.4 + len * 0.6, mx + sway * 1.5, y + h * 0.4 + len);
      ctx.stroke();
    }
    ctx.fillStyle = T('#c84a6a');
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(x + w * (0.2 + k * 0.3), y - 3, 3, 0, TAU);
      ctx.fill();
    }
  },
  giantStump(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = woodGrad(ctx, y, h, T, '#6a5038', '#4a3424', '#2a1c12');
    ctx.beginPath();
    ctx.moveTo(x - 10, y + h);
    ctx.quadraticCurveTo(x + 4, y + h - 10, x + 4, y + 6);
    ctx.lineTo(x + w - 4, y + 6);
    ctx.quadraticCurveTo(x + w - 4, y + h - 10, x + w + 10, y + h);
    ctx.fill();
    ctx.strokeStyle = alpha('#000000', 0.25);
    ctx.lineWidth = 1.2;
    for (let k = 1; k < 7; k++) {
      const xx = x + (w * k) / 7;
      ctx.beginPath();
      ctx.moveTo(xx, y + 8);
      ctx.lineTo(xx + (hash(o.seed + k) - 0.5) * 4, y + h - 4);
      ctx.stroke();
    }
    ctx.fillStyle = T('#b89066');
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 6, w / 2 - 3, 6, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#8a6640');
    ctx.lineWidth = 1;
    for (const k of [0.7, 0.45, 0.2]) {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + 6, (w / 2 - 3) * k, 6 * k, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = T('#5a7e2e');
    for (let k = 0; k < 8; k++) {
      ctx.beginPath();
      ctx.ellipse(x + 4 + hash(o.seed + k) * (w - 8), y + 20 + hash(o.seed + k * 5) * (h - 30), 6, 3.4, 0, 0, TAU);
      ctx.fill();
    }
  },

  // ---------- Maple Gorge
  pumpkins(ctx, o, T) {
    const { x, y, w, h } = o;
    const cols = ['#e8762a', '#d8602a', '#f0a03a'];
    pumpkinAt(ctx, x + w * 0.3, y + h, h * 0.5, T, cols[o.seed % 3]);
    pumpkinAt(ctx, x + w * 0.72, y + h, h * 0.42, T, cols[(o.seed + 1) % 3]);
    ctx.strokeStyle = T('#4a6a2a');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h * 0.2);
    ctx.quadraticCurveTo(x + w * 0.5, y + 2, x + w * 0.7, y + h * 0.3);
    ctx.stroke();
  },
  mapleBranch(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const tx = x + w + 28;
    ctx.fillStyle = T(mix('#30200f', P.haze, 0.1));
    ctx.beginPath();
    ctx.moveTo(tx - 15, o.ground);
    ctx.quadraticCurveTo(tx - 5, y + h, tx - 6, y - 100);
    ctx.lineTo(tx + 6, y - 100);
    ctx.quadraticCurveTo(tx + 8, y + h, tx + 17, o.ground);
    ctx.fill();
    ctx.strokeStyle = T('#3a2418');
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(tx, y + h * 0.4);
    ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.55, x - 22, y + h * 0.3);
    ctx.stroke();
    const r = mulberry32(o.seed);
    const leafAt = (lx, ly, s, col) => {
      ctx.fillStyle = col;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate((r() - 0.5) * 1.6);
      mapleLeaf(ctx, s);
      ctx.fill();
      ctx.restore();
    };
    // a full crown first, then single leaves on top for the edge detail
    const blob = (bx, by, br, i) => {
      ctx.fillStyle = T(mix(P.leaves[i % P.leaves.length], '#3a1408', 0.18));
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, TAU);
      ctx.fill();
    };
    for (let i = 0; i < 16; i++) blob(tx - 55 + r() * 110, y - 160 + r() * 70, 12 + r() * 10, i);
    for (let i = 0; i < 14; i++) blob(x - 20 + r() * (w + 40), y + r() * h * 0.5, 8 + r() * 7, i + 1);
    for (let i = 0; i < 26; i++) leafAt(tx - 60 + r() * 130, y - 170 + r() * 90, 7 + r() * 3, T(P.leaves[i % P.leaves.length]));
    for (let i = 0; i < 34; i++) leafAt(x - 34 + r() * (w + 74), y - h * 0.05 + r() * h * 0.95, 6 + r() * 3, T(P.leaves[i % P.leaves.length]));
  },
  logPile(ctx, o, T) {
    const { x, y, w, h } = o;
    const rows = 3;
    const r = h / rows / 2;
    for (let row = 0; row < rows; row++) {
      const n = Math.floor(w / (r * 2)) - row;
      const yy = y + h - r - row * r * 1.75;
      for (let k = 0; k < n; k++) {
        const cx = x + r + row * r + k * r * 2;
        ctx.fillStyle = T(mix('#7a5236', '#000000', hash(o.seed + k + row * 7) * 0.25));
        ctx.beginPath();
        ctx.arc(cx, yy, r, 0, TAU);
        ctx.fill();
        ctx.fillStyle = T('#c89a66');
        ctx.beginPath();
        ctx.arc(cx, yy, r * 0.8, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = T('#9a7044');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, yy, r * 0.45, 0, TAU);
        ctx.stroke();
      }
    }
    // a board laid over the top makes it safe to stand on
    ctx.fillStyle = woodGrad(ctx, y - 2, 6, T, '#8a6a44', '#6a4a2a', '#3a2614');
    ctx.fillRect(x - 2, y - 2, w + 4, 6);
  },

  // ---------- Starlight Summit
  cairn(ctx, o, T, P) {
    const { x, y, w, h } = o;
    stoneStack(ctx, x + w / 2, y + h, w, h, T, P, o.seed, 4);
  },
  bigCairn(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a waymarker of flat stones, broad enough to stand on
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, T(mix('#6a7286', P.light, 0.25)));
    g.addColorStop(1, T('#262a38'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + h);
    ctx.lineTo(x + 4, y + 4);
    ctx.lineTo(x + w - 4, y + 2);
    ctx.lineTo(x + w + 6, y + h);
    ctx.fill();
    const r = mulberry32(o.seed);
    ctx.strokeStyle = alpha('#000000', 0.35);
    ctx.lineWidth = 1;
    for (let yy = y + 12; yy < y + h; yy += 10 + r() * 4) {
      ctx.beginPath();
      for (let xx = x + 2; xx < x + w; xx += 16 + r() * 10) {
        ctx.moveTo(xx, yy + r() * 3);
        ctx.lineTo(xx + 12 + r() * 6, yy + r() * 3);
      }
      ctx.stroke();
    }
    ctx.fillStyle = T('#8a96b2');
    ctx.fillRect(x + 2, y, w - 4, 4);
    stoneStack(ctx, x + w * 0.75, y + 2, 16, 18, T, P, o.seed + 3, 3);
  },
  starRope(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // fairy lights strung between two poles for the night
    const pole = T('#2a2e3a');
    backPost(ctx, x - 14, y - 20, o.ground, 4, pole);
    backPost(ctx, x + w + 14, y - 20, o.ground, 4, pole);
    ctx.strokeStyle = T('#3a3e4a');
    ctx.lineWidth = 1.2;
    for (let line = 0; line < 3; line++) {
      const y0 = y - 16 + line * (h / 2.2);
      ctx.beginPath();
      ctx.moveTo(x - 14, y0);
      ctx.quadraticCurveTo(x + w / 2, y0 + 18, x + w + 14, y0);
      ctx.stroke();
      const n = Math.round(w / 14);
      for (let k = 1; k < n; k++) {
        const u = k / n;
        const lx = x - 14 + (w + 28) * u;
        const ly = y0 + 18 * 2 * u * (1 - u) + 1;
        const on = 0.6 + 0.4 * Math.sin(t * 3 + k * 1.7 + line);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 8);
        g.addColorStop(0, alpha(P.lamp, 0.5 * on));
        g.addColorStop(1, alpha(P.lamp, 0));
        ctx.fillStyle = g;
        ctx.fillRect(lx - 8, ly - 8, 16, 16);
        ctx.restore();
        ctx.fillStyle = alpha('#fff2d0', on);
        ctx.beginPath();
        ctx.arc(lx, ly, 1.6, 0, TAU);
        ctx.fill();
      }
    }
  },
};

// ---------------------------------------------------------------- movers

/** Chapter 3 rollers, drawn already translated + rotated to their centre. False if not ours. */
export function skyRoller(ctx, m, r, T, P) {
  const skin = m.skin;
  if (skin === 'cartWheel') {
    ctx.strokeStyle = T('#4a3020');
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r - 2, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = T('#2a2a2a');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = T('#7a5232');
    ctx.lineWidth = 2.6;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
      ctx.lineTo(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3));
      ctx.stroke();
    }
    ctx.fillStyle = T('#3a2618');
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, TAU);
    ctx.fill();
  } else if (skin === 'cheeseWheel') {
    ctx.fillStyle = T('#e8c66a');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#b88a3a');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r - 1.5, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = T('#c8a04a');
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.arc(Math.cos(k * 1.3) * r * 0.5, Math.sin(k * 1.3) * r * 0.5, 2 + (k % 3), 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = T('#9a3a2a');
    ctx.fillRect(-r * 0.3, -2, r * 0.6, 4);
  } else if (skin === 'lavaBomb') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.8);
    g.addColorStop(0, alpha(P.lamp || '#ff7a2a', 0.45));
    g.addColorStop(1, alpha(P.lamp || '#ff7a2a', 0));
    ctx.fillStyle = g;
    ctx.fillRect(-r * 1.8, -r * 1.8, r * 3.6, r * 3.6);
    ctx.restore();
    ctx.fillStyle = T('#2a2228');
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU;
      const rr2 = r * (0.88 + hash(m.seed + k) * 0.16);
      ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha('#ffb040', 0.9);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.1);
    ctx.lineTo(-r * 0.1, r * 0.15);
    ctx.lineTo(r * 0.2, -r * 0.4);
    ctx.moveTo(-r * 0.1, r * 0.15);
    ctx.lineTo(r * 0.1, r * 0.7);
    ctx.stroke();
  } else if (skin === 'mossBall') {
    ctx.fillStyle = T('#4a6a2a');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#6a8e3a');
    for (let k = 0; k < 14; k++) {
      const a = hash(m.seed + k) * TAU;
      const d = r * (0.2 + hash(k * 7) * 0.65);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 3 + hash(k) * 3, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = T('#c84a6a');
    ctx.beginPath();
    ctx.arc(r * 0.4, -r * 0.3, 2.4, 0, TAU);
    ctx.fill();
  } else if (skin === 'pumpkin') {
    ctx.fillStyle = T('#e8762a');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#a8481a');
    ctx.lineWidth = 1.4;
    for (const k of [0.35, 0.7]) {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * k, r, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = T('#4a5a24');
    ctx.fillRect(-2, -r - 4, 4, 6);
  } else return false;
  return true;
}

/** Falling hazards that use the icicle pattern: glowing rocks thrown out by the volcano. */
export function skyDrop(ctx, m, s, T, t, P) {
  if (m.skin !== 'ember') return false;
  const lx = m.x;
  const ly = m.y0 - 8;
  // the overhang it breaks from
  ctx.fillStyle = T('#221c24');
  ctx.beginPath();
  ctx.moveTo(lx - 70, ly - 40);
  ctx.lineTo(lx + 70, ly - 46);
  ctx.lineTo(lx + 58, ly + 2);
  ctx.quadraticCurveTo(lx, ly + 12, lx - 60, ly + 2);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = alpha(P.lamp || '#ff7a2a', 0.4);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(lx - 30, ly - 10);
  ctx.lineTo(lx - 10, ly + 2);
  ctx.lineTo(lx + 20, ly - 6);
  ctx.stroke();
  ctx.restore();
  const sh = s.shake ? Math.sin(t * 90) * 1.6 * s.shake : 0;
  const x = s.x + sh;
  const y = s.y;
  const cy = y + m.h * 0.62;
  const falling = y > m.y0 + 1 && !s.landed;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (falling) {
    const g = ctx.createLinearGradient(x, cy - 50, x, cy);
    g.addColorStop(0, alpha('#ff7a2a', 0));
    g.addColorStop(1, alpha('#ffa040', 0.6));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 4, cy - 50);
    ctx.lineTo(x + 4, cy - 50);
    ctx.lineTo(x + 9, cy);
    ctx.lineTo(x - 9, cy);
    ctx.fill();
  }
  const gl = ctx.createRadialGradient(x, cy, 0, x, cy, 26);
  gl.addColorStop(0, alpha('#ff8a30', 0.5));
  gl.addColorStop(1, alpha('#ff8a30', 0));
  ctx.fillStyle = gl;
  ctx.fillRect(x - 26, cy - 26, 52, 52);
  ctx.restore();
  ctx.fillStyle = T('#2a2026');
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    const rr2 = 10 * (0.85 + hash(m.seed + k) * 0.2);
    ctx.lineTo(x + Math.cos(a) * rr2, cy + Math.sin(a) * rr2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = alpha('#ffb040', 0.9);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - 5, cy - 2);
  ctx.lineTo(x + 1, cy + 3);
  ctx.lineTo(x + 5, cy - 4);
  ctx.stroke();
  if (s.landed) {
    for (let k = 0; k < 3; k++) {
      const p = fract(t * 0.6 + k / 3);
      ctx.fillStyle = `rgba(200,190,190,${0.25 * (1 - p)})`;
      ctx.beginPath();
      ctx.arc(x + Math.sin(p * 4 + k) * 4, cy - 8 - p * 30, 4 + p * 8, 0, TAU);
      ctx.fill();
    }
  }
  return true;
}

// ---------------------------------------------------------------- decor

export const SKY_DECOR = {
  tulips(ctx, d, T) {
    const cols = ['#e83a4a', '#f2c040', '#f08ab0', '#ffffff'];
    for (let k = 0; k < 3; k++) {
      const x = d.x + k * 5;
      const h = (10 + hash(d.seed + k) * 6) * d.s;
      ctx.strokeStyle = T('#4a7a30');
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, d.y);
      ctx.lineTo(x, d.y - h);
      ctx.stroke();
      ctx.fillStyle = T(cols[(d.seed + k) % 4]);
      ctx.beginPath();
      ctx.moveTo(x - 2.4, d.y - h);
      ctx.lineTo(x - 2.4, d.y - h - 4);
      ctx.lineTo(x - 0.8, d.y - h - 2.6);
      ctx.lineTo(x, d.y - h - 4.4);
      ctx.lineTo(x + 0.8, d.y - h - 2.6);
      ctx.lineTo(x + 2.4, d.y - h - 4);
      ctx.lineTo(x + 2.4, d.y - h);
      ctx.quadraticCurveTo(x, d.y - h + 2.4, x - 2.4, d.y - h);
      ctx.fill();
    }
  },
  petalsGround(ctx, d, T, P) {
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = T(P.petals[k % P.petals.length]);
      ctx.beginPath();
      ctx.ellipse(d.x + k * 4 + hash(d.seed + k) * 3, d.y - 0.5, 1.8, 1, hash(k) * 3, 0, TAU);
      ctx.fill();
    }
  },
  lavTuft(ctx, d, T, P) {
    ctx.strokeStyle = T('#6a7a4a');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 7; k++) {
      const l = (k - 3) * 2 * d.s;
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + l, d.y - (12 + hash(d.seed + k) * 6) * d.s);
    }
    ctx.stroke();
    ctx.fillStyle = T(P.lav);
    for (let k = 0; k < 7; k++) {
      const l = (k - 3) * 2 * d.s;
      ctx.beginPath();
      ctx.ellipse(d.x + l, d.y - (14 + hash(d.seed + k) * 6) * d.s, 1.4, 3.2, 0, 0, TAU);
      ctx.fill();
    }
  },
  sunflower(ctx, d, T) {
    const h = 30 * d.s;
    ctx.strokeStyle = T('#4a6a2a');
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.quadraticCurveTo(d.x + 2, d.y - h * 0.5, d.x + 1, d.y - h);
    ctx.stroke();
    ctx.fillStyle = T('#4a6a2a');
    ctx.beginPath();
    ctx.ellipse(d.x - 4, d.y - h * 0.45, 4, 2, 0.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#f2c030');
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU;
      ctx.beginPath();
      ctx.ellipse(d.x + 1 + Math.cos(a) * 4, d.y - h + Math.sin(a) * 4, 2.6, 1.2, a, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = T('#5a3a1a');
    ctx.beginPath();
    ctx.arc(d.x + 1, d.y - h, 2.6, 0, TAU);
    ctx.fill();
  },
  steamVent(ctx, d, T) {
    ctx.fillStyle = T('#1a1418');
    ctx.beginPath();
    ctx.ellipse(d.x, d.y - 1, 6 * d.s, 2.4, 0, 0, TAU);
    ctx.fill();
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = `rgba(220,214,214,${0.16 - k * 0.04})`;
      ctx.beginPath();
      ctx.arc(d.x + k * 4, d.y - 10 - k * 14, 6 + k * 5, 0, TAU);
      ctx.fill();
    }
  },
  obsidianShard(ctx, d, T) {
    ctx.fillStyle = T('#141018');
    for (let k = 0; k < 3; k++) {
      const x = d.x + k * 6;
      ctx.beginPath();
      ctx.moveTo(x, d.y);
      ctx.lineTo(x + 1.5, d.y - 5 - hash(d.seed + k) * 4);
      ctx.lineTo(x + 4, d.y);
      ctx.fill();
    }
    ctx.fillStyle = alpha('#9aa0c8', 0.5);
    ctx.fillRect(d.x + 1, d.y - 4, 0.8, 3);
  },
  bromeliad(ctx, d, T) {
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k / 6 - 0.5) * 2.4;
      ctx.strokeStyle = T(k % 2 ? '#4a7a3a' : '#6a9a44');
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.quadraticCurveTo(d.x + Math.cos(a) * 6, d.y + Math.sin(a) * 9, d.x + Math.cos(a) * 11 * d.s, d.y + Math.sin(a) * 7 * d.s);
      ctx.stroke();
    }
    ctx.fillStyle = T('#d83a4a');
    ctx.beginPath();
    ctx.ellipse(d.x, d.y - 8 * d.s, 2.4, 5, 0, 0, TAU);
    ctx.fill();
  },
  mossTuft(ctx, d, T) {
    ctx.fillStyle = T('#5a7e2e');
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(d.x + k * 4, d.y - 1, 3 + hash(d.seed + k) * 2, Math.PI, 0);
      ctx.fill();
    }
  },
  leafPile(ctx, d, T, P) {
    for (let k = 0; k < 9; k++) {
      ctx.fillStyle = T(P.leaves[k % P.leaves.length]);
      ctx.beginPath();
      ctx.ellipse(d.x + (k % 5) * 3.4, d.y - 1 - Math.floor(k / 5) * 2.4 - hash(d.seed + k) * 1.5, 3, 1.6, hash(k) * 3, 0, TAU);
      ctx.fill();
    }
  },
  alpineFlowers(ctx, d, T) {
    for (let k = 0; k < 4; k++) {
      const x = d.x + k * 4;
      const h = (5 + hash(d.seed + k) * 5) * d.s;
      ctx.strokeStyle = T('#3a4a40');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, d.y);
      ctx.lineTo(x, d.y - h);
      ctx.stroke();
      ctx.fillStyle = T(k % 2 ? '#e8ecf8' : '#9aa8e8');
      ctx.beginPath();
      ctx.arc(x, d.y - h, 1.8, 0, TAU);
      ctx.fill();
    }
  },
  smallCairn(ctx, d, T, P) {
    stoneStack(ctx, d.x, d.y, 14 * d.s, 14 * d.s, T, P, d.seed, 3);
  },
};

// ---------------------------------------------------------------- foreground

/** Chapter 3 silhouettes for the foreground strip. False if the terrain is not ours. */
export function skyForeground(g, kind, x, H, rng) {
  if (kind === 'orchard' || kind === 'lavender' || kind === 'summit') {
    const n = kind === 'summit' ? 8 : 18;
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 1.4;
      const l = (kind === 'summit' ? 40 : 60) + rng() * 70;
      g.lineWidth = 2 + rng() * 4;
      g.beginPath();
      g.moveTo(x + (rng() - 0.5) * 50, H);
      g.quadraticCurveTo(x + Math.cos(a) * l * 0.4, H + Math.sin(a) * l * 0.7, x + Math.cos(a) * l, H + Math.sin(a) * l);
      g.stroke();
    }
    if (kind === 'summit') {
      g.beginPath();
      g.moveTo(x - 80, H);
      g.lineTo(x - 30, H - 46 - rng() * 20);
      g.lineTo(x + 30, H - 36);
      g.lineTo(x + 70, H);
      g.fill();
    }
  } else if (kind === 'volcano') {
    g.beginPath();
    g.moveTo(x - 90, H);
    for (let k = 0; k <= 8; k++) g.lineTo(x - 90 + k * 22, H - 30 - rng() * 40);
    g.lineTo(x + 90, H);
    g.fill();
  } else if (kind === 'cloudforest' || kind === 'maple') {
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + (k - 2.5) * 0.4 + (rng() - 0.5) * 0.2;
      const s = 60 + rng() * 50;
      g.save();
      g.translate(x, H + 6);
      g.rotate(a);
      g.beginPath();
      if (kind === 'maple') {
        for (let j = 0; j < 5; j++) {
          const b = (j / 5) * TAU;
          g.lineTo(s * 0.5 + Math.cos(b) * s * 0.45, Math.sin(b) * s * 0.45);
          g.lineTo(s * 0.5 + Math.cos(b + 0.6) * s * 0.18, Math.sin(b + 0.6) * s * 0.18);
        }
      } else {
        g.moveTo(0, 0);
        g.quadraticCurveTo(s * 0.5, -s * 0.3, s, 0);
        g.quadraticCurveTo(s * 0.5, s * 0.3, 0, 0);
      }
      g.fill();
      g.restore();
    }
  } else return false;
  return true;
}

// ---------------------------------------------------------------- finale

/** The top of the world: a little observatory, its dome open, and a blanket laid out to watch. */
export function drawObservatory(ctx, x, y, T, P, t, open) {
  const w = 150;
  // the tower and dome
  ctx.fillStyle = vg(ctx, y - 90, y, T('#d8dce6'), T('#8a90a4'));
  ctx.fillRect(x, y - 90, w, 90);
  ctx.fillStyle = alpha('#000000', 0.18);
  for (let yy = y - 82; yy < y; yy += 12) ctx.fillRect(x, yy, w, 1.2);
  ctx.fillStyle = vg(ctx, y - 160, y - 90, T('#eef0f6'), T('#a8aec0'));
  ctx.beginPath();
  ctx.arc(x + w / 2, y - 90, w / 2 + 6, Math.PI, 0);
  ctx.fill();
  // the slit is open, and warm light spills out of it
  ctx.fillStyle = T('#1a1e2a');
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 10, y - 90);
  ctx.lineTo(x + w / 2 - 12, y - 90 - (w / 2 + 2));
  ctx.lineTo(x + w / 2 + 12, y - 90 - (w / 2 + 2));
  ctx.lineTo(x + w / 2 + 10, y - 90);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const sg = ctx.createRadialGradient(x + w / 2, y - 120, 0, x + w / 2, y - 120, 70);
  sg.addColorStop(0, alpha(P.lamp, 0.35));
  sg.addColorStop(1, alpha(P.lamp, 0));
  ctx.fillStyle = sg;
  ctx.fillRect(x + w / 2 - 70, y - 190, 140, 140);
  ctx.restore();
  // the telescope peeks out at the sky
  ctx.save();
  ctx.translate(x + w / 2, y - 112);
  ctx.rotate(-0.9);
  ctx.fillStyle = T('#3a3e4a');
  ctx.fillRect(0, -5, 52, 10);
  ctx.fillStyle = T('#c8ccd8');
  ctx.fillRect(48, -6, 6, 12);
  ctx.restore();
  // lit door and window
  ctx.fillStyle = open ? P.window : T('#2a2e3a');
  ctx.fillRect(x + 22, y - 46, 26, 46);
  ctx.fillStyle = P.window;
  ctx.fillRect(x + 92, y - 64, 22, 18);
  for (const [lx, ly, r] of [
    [x + 35, y - 23, 60],
    [x + 103, y - 55, 40],
  ]) {
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
    g.addColorStop(0, alpha(P.lamp, 0.3));
    g.addColorStop(1, alpha(P.lamp, 0));
    ctx.fillStyle = g;
    ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
  }
  // a blanket and a flask on the grass in front, and a small telescope on a tripod
  const bx = x - 130;
  ctx.fillStyle = T('#4a6aa8');
  ctx.beginPath();
  ctx.moveTo(bx, y);
  ctx.lineTo(bx + 110, y);
  ctx.lineTo(bx + 96, y - 7);
  ctx.lineTo(bx + 12, y - 7);
  ctx.fill();
  ctx.fillStyle = alpha('#e8d8a8', 0.5);
  for (let k = 0; k < 6; k++) ctx.fillRect(bx + 14 + k * 15, y - 6, 2, 6);
  ctx.fillStyle = T('#c84a3a');
  rr(ctx, bx + 76, y - 22, 8, 16, 2);
  ctx.fill();
  ctx.strokeStyle = T('#c8ccd8');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx + 30, y - 6);
  ctx.lineTo(bx + 40, y - 34);
  ctx.lineTo(bx + 50, y - 6);
  ctx.moveTo(bx + 40, y - 34);
  ctx.lineTo(bx + 40, y - 6);
  ctx.stroke();
  ctx.save();
  ctx.translate(bx + 40, y - 36);
  ctx.rotate(-0.7);
  ctx.fillStyle = T('#e8ecf4');
  ctx.fillRect(-6, -3, 26, 6);
  ctx.restore();
  void t;
}
