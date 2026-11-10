// Chapter 2 world art: ground, pits, props, movers, decor and the festival finale.
// Same contract as art.js (world coordinates, tone function T applied to every colour).

import { hash, mulberry32 } from './rng.js';
import { GROUND_Y } from './config.js';
import { rr, vg, poly, edgeShade, blades, woodGrad, backPost, drawRock } from './art.js';
import { mix, alpha, TAU, fract, clamp } from './util.js';

// ---------------------------------------------------------------- ground

function stoneCourses(ctx, s, sx0, sx1, bottom, T, base, bw, bh, depth = 260) {
  const yEnd = Math.min(bottom, s.y + depth);
  for (let y = s.y + 8, row = 0; y < yEnd; y += bh, row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let x = Math.floor((sx0 - off) / bw) * bw + off; x < sx1; x += bw) {
      const h = hash(Math.floor(x) * 7 + row * 131);
      ctx.fillStyle = T(mix(base, h < 0.5 ? '#000000' : '#ffffff', 0.05 + h * 0.08));
      ctx.fillRect(Math.max(x + 1, sx0), y + 1, Math.min(bw - 2, sx1 - x - 1), bh - 2);
    }
  }
  ctx.fillStyle = vg(ctx, s.y, yEnd, alpha('#000000', 0), alpha('#000000', 0.55));
  ctx.fillRect(sx0, s.y, sx1 - sx0, yEnd - s.y);
}

export const WORLD_SEG = {
  dunes(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 170, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    // cross-bedding: old dune faces frozen in the sandstone underneath
    ctx.strokeStyle = alpha('#5a3010', 0.16);
    ctx.lineWidth = 1;
    for (let x = Math.floor(sx0 / 90) * 90; x < sx1 + 90; x += 90) {
      for (let k = 0; k < 5; k++) {
        const y0 = s.y + 24 + k * 9 + hash(x) * 20;
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.quadraticCurveTo(x + 40, y0 + 4, x + 80, y0 + 22);
        ctx.stroke();
      }
    }
    ctx.fillStyle = alpha('#fff4d8', 0.08);
    for (let x = Math.floor(sx0 / 17) * 17; x < sx1; x += 17) {
      if (hash(x * 3) < 0.6) continue;
      ctx.fillRect(x, s.y + 14 + hash(x * 7) * 90, 2, 1.5);
    }
    // soft, wind-rounded top with ripples
    ctx.fillStyle = vg(ctx, s.y - 3, s.y + 12, T(G.top2), T(G.top));
    ctx.beginPath();
    ctx.moveTo(sx0, s.y + 12);
    for (let x = Math.floor(sx0 / 10) * 10; x <= sx1 + 10; x += 10) ctx.lineTo(clamp(x, sx0, sx1), s.y - 1 - Math.sin(x * 0.045) * 1.2);
    ctx.lineTo(sx1, s.y + 12);
    ctx.fill();
    ctx.strokeStyle = alpha('#9a6a3a', 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 13) * 13; x < sx1; x += 13) {
      const yy = s.y + 3 + hash(x) * 6;
      ctx.moveTo(x, yy);
      ctx.quadraticCurveTo(x + 5, yy - 1.5, x + 10, yy);
    }
    ctx.stroke();
    ctx.fillStyle = alpha(P.light, 0.35);
    ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 1);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#3a1a06', 0.45));
  },

  terraces(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    // the terrace riser: packed earth faced with rounded river stones
    ctx.fillStyle = vg(ctx, s.y, s.y + 140, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    for (let y = s.y + 16, row = 0; y < Math.min(bottom, s.y + 120); y += 11, row++) {
      for (let x = Math.floor(sx0 / 19) * 19 + (row % 2) * 9; x < sx1; x += 19) {
        const h = hash(x * 3 + row * 71);
        ctx.fillStyle = alpha(h < 0.5 ? '#c8b89a' : '#1a140c', 0.14 + h * 0.08);
        ctx.beginPath();
        ctx.ellipse(x, y, 7 + h * 3, 4.2, 0, 0, TAU);
        ctx.fill();
      }
    }
    // a skin of shallow water between the rows of rice, holding the sky
    ctx.fillStyle = vg(ctx, s.y - 1, s.y + 9, T(mix(P.water, P.light, 0.35)), T(mix(P.water, G.body, 0.4)));
    ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 10);
    ctx.fillStyle = T(G.top);
    ctx.fillRect(sx0, s.y + 8, sx1 - sx0, 3);
    ctx.strokeStyle = alpha(P.light, 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const xx = sx0 + fract(hash(k * 13 + Math.floor(s.x0)) + t * 0.03) * (sx1 - sx0);
      ctx.moveTo(xx, s.y + 3 + k * 1.5);
      ctx.lineTo(Math.min(sx1, xx + 12), s.y + 3 + k * 1.5);
    }
    ctx.stroke();
    // rice in clumps, planted in rows
    ctx.strokeStyle = T(G.top);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = Math.ceil(sx0 / 9) * 9; x < sx1; x += 9) {
      const h = 8 + hash(x * 13) * 6;
      for (let k = -1; k <= 1; k++) {
        ctx.moveTo(x + k, s.y + 4);
        ctx.quadraticCurveTo(x + k * 2, s.y - h * 0.5, x + k * 4 + 1, s.y - h);
      }
    }
    ctx.stroke();
    ctx.strokeStyle = T(G.top2);
    ctx.beginPath();
    for (let x = Math.ceil(sx0 / 9) * 9 + 4; x < sx1; x += 9) {
      const h = 6 + hash(x * 7) * 5;
      ctx.moveTo(x, s.y + 4);
      ctx.quadraticCurveTo(x + 1, s.y - h * 0.5, x + 3, s.y - h);
    }
    ctx.stroke();
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
  },

  ruins(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = T(mix(G.body, '#000000', 0.15));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    stoneCourses(ctx, s, sx0, sx1, bottom, T, G.body, 52, 26);
    // the odd carved face in the masonry
    for (let x = Math.ceil(s.x0 / 260) * 260 + 80; x < s.x1 - 60; x += 260) {
      if (x < sx0 - 40 || x > sx1 + 40 || hash(x) < 0.4) continue;
      const y = s.y + 36;
      ctx.strokeStyle = alpha('#000000', 0.35);
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x - 16, y, 32, 22);
      ctx.beginPath();
      ctx.arc(x - 6, y + 8, 3, 0, TAU);
      ctx.arc(x + 6, y + 8, 3, 0, TAU);
      ctx.moveTo(x - 7, y + 16);
      ctx.lineTo(x + 7, y + 16);
      ctx.stroke();
    }
    // moss cap and hanging roots at open edges
    ctx.fillStyle = vg(ctx, s.y - 3, s.y + 9, T(G.top2), T(G.top));
    ctx.beginPath();
    ctx.moveTo(sx0, s.y + 6);
    for (let x = Math.floor(sx0 / 7) * 7; x <= sx1 + 7; x += 7) ctx.lineTo(clamp(x, sx0, sx1), s.y - 2 - hash(x) * 2.5);
    ctx.lineTo(sx1, s.y + 6);
    for (let x = Math.floor(sx1 / 9) * 9; x >= sx0; x -= 9) ctx.lineTo(x, s.y + 6 + hash(x * 5) * 6);
    ctx.fill();
    const roots = (ex, dir) => {
      ctx.strokeStyle = T('#3a2e1c');
      ctx.lineWidth = 1.6;
      for (let k = 0; k < 4; k++) {
        const rx = ex + dir * (4 + k * 7);
        const len = 20 + hash(rx) * 50;
        ctx.beginPath();
        ctx.moveTo(rx, s.y + 4);
        ctx.quadraticCurveTo(rx - dir * 6, s.y + len * 0.5, rx + dir * 2, s.y + len);
        ctx.stroke();
      }
    };
    if (openL && s.x0 >= sx0) roots(s.x0, 1);
    if (openR && s.x1 <= sx1) roots(s.x1, -1);
    blades(ctx, s, sx0, sx1, T(G.top), 2, 4, 6.3);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.5));
  },

  canals(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    // brick embankment going down into the canal
    const wy = GROUND_Y + 54;
    ctx.fillStyle = T('#8a5a44');
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    ctx.fillStyle = alpha('#000000', 0.16);
    for (let y = s.y + 14, row = 0; y < Math.min(bottom, wy + 20); y += 6, row++) {
      ctx.fillRect(sx0, y, sx1 - sx0, 1);
      const off = row % 2 ? 7 : 0;
      for (let x = Math.floor((sx0 - off) / 14) * 14 + off; x < sx1; x += 14) ctx.fillRect(x, y - 5, 1, 5);
    }
    // green tide line where the water has stood for centuries
    ctx.fillStyle = vg(ctx, wy - 16, wy + 4, alpha('#3a5a3a', 0), alpha('#2a4a32', 0.75));
    ctx.fillRect(sx0, wy - 16, sx1 - sx0, 20);
    ctx.fillStyle = T(P.water);
    ctx.fillRect(sx0, wy + 4, sx1 - sx0, bottom - wy - 4);
    ctx.fillStyle = alpha(P.seaGlint || P.light, 0.22);
    for (let k = 0; k < 6; k++) {
      const xx = sx0 + fract(hash(k * 11 + Math.floor(s.x0)) + t * 0.02 * (1 + k * 0.3)) * (sx1 - sx0);
      ctx.fillRect(xx, wy + 8 + k * 6, 10 + hash(k) * 16, 1);
    }
    // pale paving with a dressed kerb
    ctx.fillStyle = vg(ctx, s.y - 2, s.y + 12, T(G.top2), T(G.top));
    ctx.fillRect(sx0, s.y - 2, sx1 - sx0, 12);
    ctx.fillStyle = alpha('#000000', 0.18);
    for (let x = Math.floor(sx0 / 26) * 26; x < sx1; x += 26) ctx.fillRect(x, s.y - 2, 1, 8);
    ctx.fillStyle = T(mix(G.top, '#000000', 0.25));
    ctx.fillRect(sx0, s.y + 8, sx1 - sx0, 4);
    ctx.fillStyle = alpha(P.light, 0.4);
    ctx.fillRect(sx0, s.y - 2, sx1 - sx0, 1);
    // iron mooring rings
    for (let x = Math.ceil(s.x0 / 150) * 150 + 40; x < s.x1 - 20; x += 150) {
      if (x < sx0 - 10 || x > sx1 + 10) continue;
      ctx.strokeStyle = T('#2a2420');
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(x, s.y + 24, 4, 0, TAU);
      ctx.stroke();
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.4));
  },

  savanna(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 160, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    // laterite: red earth with iron nodules and sun cracks
    ctx.fillStyle = alpha('#2a1206', 0.2);
    for (let x = Math.floor(sx0 / 19) * 19; x < sx1; x += 19) {
      if (hash(x * 5) < 0.45) continue;
      ctx.beginPath();
      ctx.arc(x, s.y + 20 + hash(x * 3) * 80, 1.5 + hash(x) * 2.5, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = alpha('#2a1206', 0.32);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 47) * 47; x < sx1; x += 47) {
      if (hash(x) < 0.4) continue;
      ctx.moveTo(x, s.y + 6);
      ctx.lineTo(x + 4, s.y + 16);
      ctx.lineTo(x - 2, s.y + 28);
      ctx.moveTo(x + 4, s.y + 16);
      ctx.lineTo(x + 12, s.y + 22);
    }
    ctx.stroke();
    ctx.fillStyle = vg(ctx, s.y - 2, s.y + 9, T(G.top2), T(G.top));
    ctx.fillRect(sx0, s.y - 2, sx1 - sx0, 10);
    // long dry grass that leans with the evening wind
    blades(ctx, s, sx0, sx1, T(mix(G.top, '#5a3a1a', 0.3)), 6, 12, 3.4, 3);
    blades(ctx, s, sx0, sx1, T(G.top2), 4, 10, 5.3, 4);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#200804', 0.5));
  },

  lanterns(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    const wy = GROUND_Y + 62;
    // piles and cross-bracing under the boardwalk
    ctx.fillStyle = T('#2a1c16');
    for (let x = Math.ceil(s.x0 / 70) * 70 + 12; x < s.x1 - 6; x += 70) {
      if (x < sx0 - 10 || x > sx1 + 10) continue;
      ctx.fillRect(x - 4, s.y + 10, 8, wy - s.y + 6);
    }
    ctx.strokeStyle = T('#22160f');
    ctx.lineWidth = 2;
    for (let x = Math.ceil(s.x0 / 70) * 70 + 12; x < s.x1 - 76; x += 70) {
      if (x < sx0 - 76 || x > sx1) continue;
      ctx.beginPath();
      ctx.moveTo(x, s.y + 14);
      ctx.lineTo(x + 70, wy - 8);
      ctx.stroke();
    }
    // deck: lacquered planks, worn pale where people walk
    ctx.fillStyle = T('#5a1e18');
    ctx.fillRect(sx0, s.y + 8, sx1 - sx0, 8);
    ctx.fillStyle = vg(ctx, s.y - 1, s.y + 9, T(G.top2), T(G.top));
    ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 10);
    ctx.fillStyle = alpha('#000000', 0.42);
    for (let x = Math.floor(sx0 / 24) * 24; x < sx1; x += 24) ctx.fillRect(x, s.y - 1, 1.2, 10);
    ctx.fillStyle = alpha(P.lamp, 0.22);
    ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 1.2);
    // lantern light pooling on the planks
    for (let x = Math.ceil(s.x0 / 210) * 210; x < s.x1; x += 210) {
      if (x < sx0 - 60 || x > sx1 + 60) continue;
      const g = ctx.createRadialGradient(x, s.y, 0, x, s.y, 60);
      g.addColorStop(0, alpha(P.lamp, 0.22));
      g.addColorStop(1, alpha(P.lamp, 0));
      ctx.fillStyle = g;
      ctx.fillRect(Math.max(sx0, x - 60), s.y - 2, Math.min(sx1, x + 60) - Math.max(sx0, x - 60), 12);
    }
  },
};

/** Terrains with open water under the walkway (drawn before the segments). */
export const WATERY = new Set(['harbor', 'lanterns']);

/** Pits for the chapter 2 terrains. Returns false when the terrain is not one of ours. */
export function worldPit(ctx, terr, P, T, a, b, bottom, t) {
  const top = Math.max(a.y, b.y) + 1;
  const x0 = a.x1;
  const w = b.x0 - a.x1;
  if (terr === 'dunes') {
    ctx.fillStyle = vg(ctx, top, top + 200, T(mix(P.ground.body, '#000000', 0.4)), T('#1e0e04'));
    ctx.fillRect(x0, top, w, bottom - top);
    // sand pouring off both lips
    ctx.fillStyle = alpha(P.ground.top2, 0.5);
    for (const [ex, dir] of [
      [x0, 1],
      [x0 + w, -1],
    ]) {
      for (let k = 0; k < 3; k++) {
        const fx = ex + dir * (3 + k * 4);
        for (let j = 0; j < 8; j++) {
          const p = fract(t * (0.8 + k * 0.2) + j / 8 + k * 0.3);
          ctx.fillRect(fx + dir * p * 4, top + p * 160, 1.4, 4);
        }
      }
    }
  } else if (terr === 'terraces') {
    ctx.fillStyle = vg(ctx, top, top + 90, T(mix(P.ground.body, '#000000', 0.35)), T(P.ground.deep));
    ctx.fillRect(x0, top, w, bottom - top);
    const wy = top + 70;
    ctx.fillStyle = vg(ctx, wy, wy + 60, T(mix(P.water, P.light, 0.3)), T(mix(P.water, '#000000', 0.45)));
    ctx.fillRect(x0, wy, w, bottom - wy);
    ctx.strokeStyle = T(P.ground.top);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = x0 + 6; x < x0 + w - 4; x += 10) {
      ctx.moveTo(x, wy + 2);
      ctx.lineTo(x + 2, wy - 6 - hash(x) * 4);
    }
    ctx.stroke();
  } else if (terr === 'ruins') {
    ctx.fillStyle = vg(ctx, top, top + 240, T(mix(P.ground.deep, '#000000', 0.2)), '#040604');
    ctx.fillRect(x0, top, w, bottom - top);
    ctx.strokeStyle = T('#2e4a22');
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) {
      const vx = x0 + (0.15 + 0.23 * k) * w;
      const len = 40 + hash(vx) * 120;
      ctx.beginPath();
      ctx.moveTo(vx, top - 4);
      ctx.quadraticCurveTo(vx + Math.sin(t + k) * 4, top + len * 0.5, vx + 3, top + len);
      ctx.stroke();
    }
  } else if (terr === 'canals') {
    const wy = GROUND_Y + 54;
    ctx.fillStyle = vg(ctx, top, wy, alpha('#000000', 0.5), alpha('#000000', 0.2));
    ctx.fillRect(x0, top, w, wy - top);
    ctx.fillStyle = vg(ctx, wy, wy + 120, T(mix(P.water, P.light, 0.12)), T(mix(P.water, '#000000', 0.35)));
    ctx.fillRect(x0, wy, w, bottom - wy);
    ctx.fillStyle = alpha(P.seaGlint || P.light, 0.3);
    for (let k = 0; k < 7; k++) {
      const xx = x0 + fract(hash(k + a.x1) + t * 0.05) * w;
      ctx.fillRect(xx, wy + 4 + k * 7, Math.min(16, x0 + w - xx), 1);
    }
  } else if (terr === 'savanna') {
    ctx.fillStyle = vg(ctx, top, top + 220, T(mix(P.ground.body, '#000000', 0.45)), T('#160804'));
    ctx.fillRect(x0, top, w, bottom - top);
  } else if (terr === 'lanterns') {
    ctx.fillStyle = vg(ctx, top, GROUND_Y + 62, alpha('#000000', 0.5), alpha('#000000', 0.1));
    ctx.fillRect(x0, top, w, GROUND_Y + 62 - top);
  } else return false;
  return true;
}

// ---------------------------------------------------------------- props

function clayPot(ctx, cx, base, w, h, T, col, seed) {
  const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  g.addColorStop(0, T(mix(col, '#ffe8c8', 0.25)));
  g.addColorStop(0.45, T(col));
  g.addColorStop(1, T(mix(col, '#000000', 0.45)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.18, base - h);
  ctx.lineTo(cx + w * 0.18, base - h);
  ctx.quadraticCurveTo(cx + w * 0.16, base - h * 0.86, cx + w * 0.3, base - h * 0.78);
  ctx.quadraticCurveTo(cx + w * 0.56, base - h * 0.5, cx + w * 0.28, base - h * 0.06);
  ctx.lineTo(cx + w * 0.2, base);
  ctx.lineTo(cx - w * 0.2, base);
  ctx.lineTo(cx - w * 0.28, base - h * 0.06);
  ctx.quadraticCurveTo(cx - w * 0.56, base - h * 0.5, cx - w * 0.3, base - h * 0.78);
  ctx.quadraticCurveTo(cx - w * 0.16, base - h * 0.86, cx - w * 0.18, base - h);
  ctx.fill();
  ctx.fillStyle = T(mix(col, '#000000', 0.25));
  ctx.fillRect(cx - w * 0.22, base - h - 2, w * 0.44, 4);
  ctx.strokeStyle = alpha('#2a1408', 0.45);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.4, base - h * 0.55);
  ctx.quadraticCurveTo(cx, base - h * 0.5, cx + w * 0.4, base - h * 0.55);
  ctx.stroke();
  if (hash(seed) < 0.5) {
    ctx.beginPath();
    for (let x = -0.36; x < 0.36; x += 0.08) {
      ctx.moveTo(cx + x * w, base - h * 0.42);
      ctx.lineTo(cx + (x + 0.04) * w, base - h * 0.36);
    }
    ctx.stroke();
  }
}

function strawTexture(ctx, x, y, w, h, T, seed, col = '#fff0b0') {
  ctx.strokeStyle = alpha(T(col), 0.45);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < Math.floor(w * h * 0.02); i++) {
    const sx = x + 2 + hash(seed + i) * (w - 4);
    const sy = y + 2 + hash(seed + i * 7) * (h - 4);
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (hash(i * 3) - 0.5) * 3, sy + 5 + hash(i * 5) * 4);
  }
  ctx.stroke();
}

function sheafAt(ctx, cx, base, w, h, T, seed) {
  ctx.fillStyle = vg(ctx, base - h, base, T('#e8c66a'), T('#c09a3c'), T('#8a6a24'));
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.5, base - h);
  ctx.quadraticCurveTo(cx - w * 0.1, base - h * 0.55, cx - w * 0.14, base - h * 0.5);
  ctx.quadraticCurveTo(cx - w * 0.1, base - h * 0.45, cx - w * 0.42, base);
  ctx.lineTo(cx + w * 0.42, base);
  ctx.quadraticCurveTo(cx + w * 0.1, base - h * 0.45, cx + w * 0.14, base - h * 0.5);
  ctx.quadraticCurveTo(cx + w * 0.1, base - h * 0.55, cx + w * 0.5, base - h);
  ctx.closePath();
  ctx.fill();
  // seed heads drooping over the top
  ctx.strokeStyle = T('#d8b04a');
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let k = 0; k < 9; k++) {
    const sx = cx - w * 0.45 + (k / 8) * w * 0.9;
    ctx.moveTo(sx, base - h + 1);
    ctx.quadraticCurveTo(sx + 2, base - h - 7, sx + 6 + hash(seed + k) * 3, base - h - 3);
  }
  ctx.stroke();
  strawTexture(ctx, cx - w * 0.4, base - h, w * 0.8, h, T, seed);
  ctx.fillStyle = T('#6a4a1c');
  ctx.fillRect(cx - w * 0.17, base - h * 0.55, w * 0.34, 4);
}

function stoneBlockAt(ctx, x, y, w, h, T, P, seed, base = '#8c8574', moss = true) {
  if (!blockCache.has(seed)) {
    const r = mulberry32(seed);
    blockCache.set(seed, [[-1, h], [0, 3 + r() * 3], [3 + r() * 4, 0], [w * 0.5, r() * 3], [w - 3 - r() * 3, 0], [w + 1, 4 + r() * 4], [w, h]]);
  }
  const pts = blockCache.get(seed);
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, T(mix(base, P.light, 0.3)));
  g.addColorStop(1, T(mix(base, '#000000', 0.35)));
  ctx.fillStyle = g;
  poly(ctx, x, y, pts);
  ctx.fill();
  ctx.strokeStyle = alpha('#000000', 0.22);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.62, y + 3);
  ctx.lineTo(x + w * 0.58, y + h * 0.4);
  ctx.lineTo(x + w * 0.66, y + h * 0.7);
  ctx.stroke();
  if (moss) {
    ctx.fillStyle = T('#5a7a30');
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    for (let k = 0; k <= 8; k++) ctx.lineTo(x + (w * k) / 8, y + 1 + hash(seed + k) * 5);
    ctx.lineTo(x + w, y + 6);
    ctx.lineTo(x + w, y + 2);
    ctx.lineTo(x, y + 1);
    ctx.fill();
  }
}
const blockCache = new Map();

function glyphFace(ctx, cx, cy, s, col) {
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx - 9 * s, cy - 8 * s);
  ctx.lineTo(cx + 9 * s, cy - 8 * s);
  ctx.lineTo(cx + 9 * s, cy + 8 * s);
  ctx.lineTo(cx - 9 * s, cy + 8 * s);
  ctx.closePath();
  ctx.moveTo(cx - 4 * s + 2.5 * s, cy - 2 * s);
  ctx.arc(cx - 4 * s, cy - 2 * s, 2.5 * s, 0, TAU);
  ctx.moveTo(cx + 4 * s + 2.5 * s, cy - 2 * s);
  ctx.arc(cx + 4 * s, cy - 2 * s, 2.5 * s, 0, TAU);
  ctx.moveTo(cx - 5 * s, cy + 4 * s);
  ctx.quadraticCurveTo(cx, cy + 7 * s, cx + 5 * s, cy + 4 * s);
  ctx.stroke();
}

function stripedCloth(ctx, pts, T, a, b, n, x0, x1) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = T(a);
  ctx.fill();
  ctx.clip();
  const sw = (x1 - x0) / n;
  ctx.fillStyle = T(b);
  for (let k = 0; k < n; k += 2) ctx.fillRect(x0 + k * sw, -2000, sw, 4000);
  ctx.restore();
}

function paperLantern(ctx, x, y, r, T, col, t, seed, glow = true) {
  const sway = Math.sin(t * 1.6 + seed) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);
  if (glow) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 3.4);
    g.addColorStop(0, alpha('#ff9a4a', 0.38));
    g.addColorStop(1, alpha('#ff9a4a', 0));
    ctx.fillStyle = g;
    ctx.fillRect(-r * 3.4, -r * 3.4, r * 6.8, r * 6.8);
    ctx.restore();
  }
  const g = ctx.createRadialGradient(-r * 0.25, -r * 0.2, 0, 0, 0, r * 1.2);
  g.addColorStop(0, mix(col, '#fff0c0', 0.65));
  g.addColorStop(0.6, col);
  g.addColorStop(1, mix(col, '#000000', 0.35));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 1.12, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = alpha('#3a0a06', 0.4);
  ctx.lineWidth = 0.9;
  for (const k of [-0.55, 0, 0.55]) {
    ctx.beginPath();
    ctx.ellipse(0, 0, r * Math.abs(k) + 0.5, r * 1.1, 0, -Math.PI / 2, Math.PI / 2, k < 0);
    ctx.stroke();
  }
  ctx.fillStyle = T('#2a1610');
  ctx.fillRect(-r * 0.5, -r * 1.2, r, r * 0.22);
  ctx.fillRect(-r * 0.5, r * 1.0, r, r * 0.22);
  ctx.strokeStyle = T('#d8a040');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, r * 1.2);
  ctx.lineTo(0, r * 1.7);
  ctx.stroke();
  ctx.restore();
}

export const WORLD_OB = {
  // ---------- Sand Sea
  pots(ctx, o, T) {
    const { x, y, w, h } = o;
    const base = y + h;
    const cols = ['#b4643c', '#c98a52', '#9a4e30'];
    clayPot(ctx, x + w * 0.3, base, w * 0.62, h * 0.86, T, cols[o.seed % 3], o.seed);
    clayPot(ctx, x + w * 0.72, base, w * 0.56, h, T, cols[(o.seed + 1) % 3], o.seed + 1);
    ctx.fillStyle = alpha('#000000', 0.18);
    ctx.fillRect(x, base - 2, w, 2);
  },
  ruinBlock(ctx, o, T, P) {
    const { x, y, w, h } = o;
    stoneBlockAt(ctx, x, y, w, h, T, P, o.seed, '#c99a64', false);
    ctx.strokeStyle = alpha('#5a3410', 0.35);
    ctx.lineWidth = 1.2;
    for (let k = 1; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(x + 2, y + (h * k) / 3);
      ctx.lineTo(x + w - 2, y + (h * k) / 3 + (hash(o.seed + k) - 0.5) * 3);
      ctx.stroke();
    }
    for (let k = 0; k < 4; k++) {
      const bx = x + w * (0.12 + k * 0.22) + (k % 2 ? 8 : 0);
      ctx.beginPath();
      ctx.moveTo(bx, y + h / 3);
      ctx.lineTo(bx, y + (2 * h) / 3);
      ctx.stroke();
    }
    // a band of carved figures, worn almost smooth
    ctx.strokeStyle = alpha('#5a3410', 0.3);
    for (let k = 0; k < Math.floor(w / 24); k++) {
      const fx = x + 12 + k * 24;
      ctx.beginPath();
      ctx.arc(fx, y + h * 0.13, 2.4, 0, TAU);
      ctx.moveTo(fx, y + h * 0.17);
      ctx.lineTo(fx, y + h * 0.27);
      ctx.moveTo(fx - 4, y + h * 0.21);
      ctx.lineTo(fx + 4, y + h * 0.19);
      ctx.stroke();
    }
    ctx.fillStyle = T(P.ground.top2);
    ctx.beginPath();
    ctx.moveTo(x - 16, y + h);
    ctx.quadraticCurveTo(x - 2, y + h - 18, x + 18, y + h);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w - 10, y + h);
    ctx.quadraticCurveTo(x + w + 6, y + h - 12, x + w + 22, y + h);
    ctx.fill();
  },
  awning(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    const pole = T('#5a3a22');
    backPost(ctx, x - 6, y - 8, o.ground, 4, pole);
    backPost(ctx, x + w + 6, y - 8, o.ground, 4, pole);
    const wv = Math.sin(t * 2.4 + o.seed) * 2;
    const pts = [
      [x - 10, y],
      [x + w + 10, y],
      [x + w + 6, y + h - 8 + wv],
      [x + w * 0.5, y + h - 2 + wv * 0.5],
      [x - 6, y + h - 8 - wv * 0.5],
    ];
    stripedCloth(ctx, pts, T, '#d8c8a0', '#b4482e', 9, x - 10, x + w + 10);
    ctx.fillStyle = alpha('#000000', 0.18);
    ctx.fillRect(x - 10, y, w + 20, 3);
    // fringe
    ctx.strokeStyle = T('#e0b860');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let xx = x - 4; xx < x + w + 4; xx += 6) {
      const u = (xx - x) / w;
      const yy = y + h - 8 + wv + (1 - Math.pow(2 * u - 1, 2)) * 6;
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx + 1, yy + 6);
    }
    ctx.stroke();
  },

  // ---------- Monsoon Terraces
  sheaf(ctx, o, T) {
    const { x, y, w, h } = o;
    sheafAt(ctx, x + w * 0.5, y + h, w, h, T, o.seed);
  },
  basket(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = vg(ctx, y, y + h, T('#b88a4a'), T('#8a5e2a'), T('#5a3a18'));
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x + w, y + 4);
    ctx.lineTo(x + w - 6, y + h);
    ctx.lineTo(x + 6, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = alpha('#3a2208', 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = -h; k < w + h; k += 6) {
      ctx.moveTo(x + k, y);
      ctx.lineTo(x + k + h, y + h);
      ctx.moveTo(x + k + h, y);
      ctx.lineTo(x + k, y + h);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = T('#4e7a2c');
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.ellipse(x + 6 + k * ((w - 12) / 5), y + 3 - hash(o.seed + k) * 4, 6, 3.2, (hash(k) - 0.5) * 0.8, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = T('#6a4420');
    ctx.fillRect(x - 1, y + 2, w + 2, 4);
  },
  bamboofence(ctx, o, T) {
    const { x, y, w, h } = o;
    const n = Math.max(4, Math.round(w / 11));
    for (let k = 0; k < n; k++) {
      const px = x + 3 + (k * (w - 6)) / (n - 1);
      const top = y + (k % 2 ? 4 : 0);
      const g = ctx.createLinearGradient(px - 3, 0, px + 3, 0);
      g.addColorStop(0, T('#b8b060'));
      g.addColorStop(1, T('#6a6a2a'));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(px - 3, y + h);
      ctx.lineTo(px - 3, top + 6);
      ctx.lineTo(px, top - 2);
      ctx.lineTo(px + 3, top + 6);
      ctx.lineTo(px + 3, y + h);
      ctx.fill();
      ctx.fillStyle = alpha('#3a3a12', 0.5);
      ctx.fillRect(px - 3, top + h * 0.45, 6, 1.5);
    }
    ctx.fillStyle = T('#8a8a3a');
    ctx.fillRect(x - 2, y + h * 0.3, w + 4, 4);
    ctx.fillRect(x - 2, y + h * 0.66, w + 4, 4);
    ctx.fillStyle = T('#5a4020');
    for (let k = 0; k < n; k++) {
      const px = x + 3 + (k * (w - 6)) / (n - 1);
      ctx.fillRect(px - 2, y + h * 0.3 - 1, 4, 6);
    }
  },
  bamboo(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // two crossed-pole trestles carrying a bundle of drying poles
    const pole = T(mix('#7a7a3a', P.haze, 0.2));
    ctx.strokeStyle = pole;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const px of [x + 4, x + w - 4]) {
      ctx.beginPath();
      ctx.moveTo(px - 16, o.ground);
      ctx.lineTo(px + 8, y - 14);
      ctx.moveTo(px + 16, o.ground);
      ctx.lineTo(px - 8, y - 14);
      ctx.stroke();
    }
    const cols = ['#c8c070', '#a8a050', '#8a8a3a'];
    const th = h / 3;
    for (let k = 0; k < 3; k++) {
      const yy = y + k * th;
      const g = ctx.createLinearGradient(0, yy, 0, yy + th);
      g.addColorStop(0, T(mix(cols[k], '#ffffff', 0.15)));
      g.addColorStop(1, T(mix(cols[k], '#000000', 0.3)));
      ctx.fillStyle = g;
      rr(ctx, x - 28 + k * 6, yy, w + 56 - k * 10, th - 0.5, th / 2);
      ctx.fill();
      ctx.fillStyle = alpha('#3a3a10', 0.45);
      for (let nx = x - 10 + k * 13; nx < x + w + 20; nx += 38) ctx.fillRect(nx, yy, 1.6, th);
    }
    ctx.strokeStyle = T('#5a4020');
    ctx.lineWidth = 2;
    for (const px of [x + 4, x + w - 4]) {
      ctx.beginPath();
      ctx.moveTo(px - 5, y - 4);
      ctx.lineTo(px + 5, y + h);
      ctx.moveTo(px + 5, y - 4);
      ctx.lineTo(px - 5, y + h);
      ctx.stroke();
    }
    ctx.fillStyle = T('#5a8a3a');
    for (let k = 0; k < 6; k++) {
      const lx = x + hash(o.seed + k) * w;
      const sway = Math.sin(t * 2 + k) * 2;
      ctx.beginPath();
      ctx.ellipse(lx + sway, y + h + 5, 2, 7, 0.4, 0, TAU);
      ctx.fill();
    }
  },
  strawstack(ctx, o, T) {
    const { x, y, w, h } = o;
    // sheaves stacked flat into a wall, a broad top made for drying
    const rows = 3;
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      const ry = y + h - (r + 1) * rh;
      const inset = r * 4;
      ctx.fillStyle = vg(ctx, ry, ry + rh, T('#dab860'), T('#b08a38'), T('#7a5a20'));
      rr(ctx, x + inset, ry, w - inset * 2, rh + 1, 8);
      ctx.fill();
      strawTexture(ctx, x + inset, ry, w - inset * 2, rh, T, o.seed + r * 17);
      ctx.fillStyle = alpha('#3a2808', 0.4);
      ctx.fillRect(x + inset, ry + rh - 2, w - inset * 2, 2);
      const n = Math.max(2, Math.floor((w - inset * 2) / 26));
      ctx.fillStyle = T('#6a4a1c');
      for (let k = 0; k < n; k++) ctx.fillRect(x + inset + 10 + k * ((w - inset * 2 - 20) / Math.max(1, n - 1)), ry + 3, 2.5, rh - 6);
    }
    ctx.strokeStyle = T('#e8c66a');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let xx = x + 10; xx < x + w - 10; xx += 5) {
      ctx.moveTo(xx, y + 2);
      ctx.lineTo(xx + 3, y - 4 - hash(xx) * 3);
    }
    ctx.stroke();
  },

  // ---------- Jungle Ruins
  column(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, T(mix('#a8a08a', P.light, 0.3)));
    g.addColorStop(0.5, T('#8a8270'));
    g.addColorStop(1, T('#4a463a'));
    ctx.fillStyle = g;
    rr(ctx, x + h * 0.3, y, w - h * 0.3, h, h * 0.18);
    ctx.fill();
    ctx.strokeStyle = alpha('#000000', 0.18);
    ctx.lineWidth = 1;
    for (let k = 1; k < 5; k++) {
      ctx.beginPath();
      ctx.moveTo(x + h * 0.4, y + (h * k) / 5);
      ctx.lineTo(x + w - 2, y + (h * k) / 5);
      ctx.stroke();
    }
    // broken end, showing the drum's face
    ctx.fillStyle = T('#b4ac94');
    ctx.beginPath();
    ctx.ellipse(x + h * 0.32, y + h / 2, h * 0.3, h / 2, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = alpha('#000000', 0.25);
    ctx.beginPath();
    ctx.ellipse(x + h * 0.32, y + h / 2, h * 0.14, h * 0.24, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = T('#4e7a2c');
    for (let k = 0; k < 7; k++) {
      ctx.beginPath();
      ctx.arc(x + h * 0.6 + hash(o.seed + k) * (w - h), y + 1, 2.5 + hash(k * 7) * 3, Math.PI, 0);
      ctx.fill();
    }
  },
  stoneBlock(ctx, o, T, P) {
    const { x, y, w, h } = o;
    stoneBlockAt(ctx, x, y, w, h, T, P, o.seed);
    glyphFace(ctx, x + w / 2, y + h * 0.56, Math.min(w, h) / 34, alpha('#1a1a10', 0.45));
  },
  stepBlock(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const h1 = h * 0.55;
    stoneBlockAt(ctx, x, y + h - h1, w, h1, T, P, o.seed, '#857e6c');
    stoneBlockAt(ctx, x + w * 0.14, y, w * 0.72, h - h1 + 2, T, P, o.seed + 5, '#958e7a');
    glyphFace(ctx, x + w * 0.5, y + (h - h1) * 0.55, 0.8, alpha('#1a1a10', 0.4));
    ctx.strokeStyle = alpha('#000000', 0.25);
    ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x + (w * k) / 4, y + h - h1 + 4);
      ctx.lineTo(x + (w * k) / 4, y + h - 2);
      ctx.stroke();
    }
    // a curtain of vine down one side
    ctx.strokeStyle = T('#3e6a2a');
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 4; k++) {
      const vx = x + w * 0.8 + k * 4;
      ctx.beginPath();
      ctx.moveTo(vx, y + h - h1);
      ctx.quadraticCurveTo(vx - 3, y + h - h1 * 0.5, vx + 1, y + h - h1 * (0.1 + hash(o.seed + k) * 0.3));
      ctx.stroke();
    }
  },
  lintel(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a doorway still standing: two jambs and a carved lintel
    const jamb = T(mix('#857e6c', P.haze, 0.15));
    for (const jx of [x - 6, x + w - 12]) {
      ctx.fillStyle = jamb;
      ctx.fillRect(jx, y + h - 2, 18, o.ground - y - h + 2);
      ctx.fillStyle = alpha('#000000', 0.22);
      for (let yy = y + h + 22; yy < o.ground; yy += 24) ctx.fillRect(jx, yy, 18, 1.4);
      ctx.fillStyle = alpha(P.light, 0.12);
      ctx.fillRect(jx, y + h, 3, o.ground - y - h);
    }
    stoneBlockAt(ctx, x - 22, y, w + 44, h, T, P, o.seed, '#958e7a');
    for (let k = 0; k < Math.floor((w + 30) / 30); k++) glyphFace(ctx, x - 6 + k * 30 + 9, y + h * 0.55, 0.6, alpha('#1a1a10', 0.35));
  },
  roots(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a strangler fig has thrown one of its roots right over the path
    const bark = T('#3c3024');
    const barkLit = T(mix('#6a5a44', P.light, 0.2));
    const tx = x + w + 46;
    // the trunk just off the path, flaring into buttresses at its foot
    ctx.fillStyle = bark;
    ctx.beginPath();
    ctx.moveTo(tx - 58, o.ground);
    ctx.quadraticCurveTo(tx - 24, o.ground - 14, tx - 20, o.ground - 70);
    ctx.lineTo(tx - 16, y - 420);
    ctx.lineTo(tx + 22, y - 420);
    ctx.lineTo(tx + 24, o.ground - 70);
    ctx.quadraticCurveTo(tx + 30, o.ground - 14, tx + 64, o.ground);
    ctx.fill();
    ctx.strokeStyle = alpha('#000000', 0.25);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const bx = tx - 12 + k * 8;
      ctx.moveTo(bx, y - 420);
      ctx.quadraticCurveTo(bx + (hash(o.seed + k) - 0.5) * 8, y, bx + (k - 2) * 7, o.ground - 4);
    }
    ctx.stroke();
    ctx.fillStyle = alpha(P.light, 0.1);
    ctx.fillRect(tx - 16, y - 420, 6, o.ground - y + 350);
    // the root: thick where it leaves the trunk, thinning as it dives back into the ground
    ctx.fillStyle = bark;
    ctx.beginPath();
    ctx.moveTo(tx - 16, y - 8);
    ctx.bezierCurveTo(x + w * 0.55, y - 12, x + w * 0.1, y - 4, x - 22, y + h * 0.25);
    ctx.quadraticCurveTo(x - 40, y + h * 0.6, x - 44, o.ground);
    ctx.lineTo(x - 22, o.ground);
    ctx.quadraticCurveTo(x - 20, y + h * 1.1, x - 2, y + h);
    ctx.bezierCurveTo(x + w * 0.3, y + h * 0.92, x + w * 0.7, y + h * 0.96, tx - 16, y + h + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = barkLit;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx - 20, y - 6);
    ctx.bezierCurveTo(x + w * 0.55, y - 10, x + w * 0.1, y - 2, x - 20, y + h * 0.26);
    ctx.stroke();
    ctx.strokeStyle = alpha('#000000', 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx - 20, y + h * 0.45);
    ctx.bezierCurveTo(x + w * 0.6, y + h * 0.4, x + w * 0.2, y + h * 0.45, x - 26, y + h * 0.7);
    ctx.stroke();
    // a smaller root twisted round the big one
    ctx.strokeStyle = T('#4a3c2c');
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = 0; k <= 12; k++) {
      const u = k / 12;
      const px = tx - 16 + (x - 10 - tx + 16) * u;
      const py = y + h * 0.45 + Math.sin(u * 9) * h * 0.32;
      if (!k) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // moss on top, beards of it underneath
    ctx.fillStyle = T('#5a7e30');
    for (let k = 0; k < 8; k++) {
      const mx = x + hash(o.seed + k * 5) * (w + 20);
      ctx.beginPath();
      ctx.ellipse(mx, y - 4 + (1 - (mx - x) / w) * 4, 7 + hash(k) * 6, 2.6, 0, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = T('#6a8a3a');
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 9; k++) {
      const mx = x + 6 + hash(o.seed + k) * (w - 6);
      const len = 6 + hash(o.seed + k * 3) * 14;
      const sway = Math.sin(t * 1.5 + k) * 1.5;
      ctx.beginPath();
      ctx.moveTo(mx, y + h - 2);
      ctx.lineTo(mx + sway, y + h - 2 + len);
      ctx.stroke();
    }
  },
  // ---------- Canal City
  planter(ctx, o, T) {
    const { x, y, w, h } = o;
    const bh = h * 0.62;
    ctx.fillStyle = vg(ctx, y + h - bh, y + h, T('#d8cab0'), T('#a8987c'));
    ctx.fillRect(x, y + h - bh, w, bh);
    ctx.fillStyle = T('#e8dcc4');
    ctx.fillRect(x - 2, y + h - bh - 3, w + 4, 4);
    ctx.strokeStyle = alpha('#000000', 0.15);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 5, y + h - bh + 5, w - 10, bh - 10);
    // geraniums
    ctx.fillStyle = T('#3e6a2e');
    for (let k = 0; k < 7; k++) {
      ctx.beginPath();
      ctx.arc(x + 5 + k * ((w - 10) / 6), y + h - bh - 4 - hash(o.seed + k) * 6, 6, 0, TAU);
      ctx.fill();
    }
    const cols = ['#d83a34', '#e8604a', '#f0e6dc'];
    for (let k = 0; k < 9; k++) {
      ctx.fillStyle = T(cols[(o.seed + k) % 3]);
      ctx.beginPath();
      ctx.arc(x + 4 + hash(o.seed + k * 5) * (w - 8), y + 2 + hash(o.seed + k * 9) * (h - bh - 2), 3, 0, TAU);
      ctx.fill();
    }
  },
  bench(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = T('#2a2a2a');
    for (const lx of [x + 6, x + w - 12]) {
      ctx.fillRect(lx, y + h * 0.45, 5, h * 0.55);
      ctx.fillRect(lx - 3, y + h - 3, 11, 3);
    }
    ctx.fillStyle = woodGrad(ctx, y, h * 0.5, T, '#b07a48', '#8a5a32', '#5a3a1e');
    for (let k = 0; k < 3; k++) ctx.fillRect(x, y + k * 6, w, 4.5);
    ctx.fillRect(x - 2, y + h * 0.38, w + 4, 5);
    ctx.fillStyle = T('#2a2a2a');
    ctx.fillRect(x + 4, y, 3, h * 0.45);
    ctx.fillRect(x + w - 7, y, 3, h * 0.45);
  },
  wellhead(ctx, o, T, P) {
    const { x, y, w, h } = o;
    ctx.fillStyle = T('#a89a82');
    ctx.fillRect(x - 6, y + h - 8, w + 12, 8);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, T(mix('#cfc2a8', P.light, 0.3)));
    g.addColorStop(0.55, T('#b4a68c'));
    g.addColorStop(1, T('#6a5e4c'));
    ctx.fillStyle = g;
    ctx.fillRect(x, y + 8, w, h - 16);
    ctx.fillStyle = T('#d8ccb2');
    rr(ctx, x - 5, y, w + 10, 10, 2);
    ctx.fill();
    // carved panels: garlands and a lion's head, worn soft by hands
    ctx.strokeStyle = alpha('#3a2e20', 0.35);
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) {
      const px = x + 5 + k * ((w - 10) / 3);
      const pw = (w - 10) / 3 - 4;
      ctx.strokeRect(px, y + 16, pw, h - 34);
      ctx.beginPath();
      ctx.moveTo(px + 2, y + 22);
      ctx.quadraticCurveTo(px + pw / 2, y + 34, px + pw - 2, y + 22);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.55, 6, 0, TAU);
    ctx.stroke();
  },
  cafeAwning(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    const iron = T('#2a2622');
    backPost(ctx, x + 2, y, o.ground, 3, iron);
    backPost(ctx, x + w - 2, y, o.ground, 3, iron);
    const pts = [
      [x - 12, y],
      [x + w + 12, y],
      [x + w + 12, y + h - 10],
      [x - 12, y + h - 10],
    ];
    stripedCloth(ctx, pts, T, '#efe6d2', '#3e6a52', 12, x - 12, x + w + 12);
    // scalloped valance
    ctx.fillStyle = T('#3e6a52');
    const n = Math.round((w + 24) / 14);
    for (let k = 0; k < n; k++) {
      const sx = x - 12 + k * ((w + 24) / n);
      ctx.beginPath();
      ctx.arc(sx + (w + 24) / n / 2, y + h - 10, (w + 24) / n / 2, 0, Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = alpha('#000000', 0.22);
    ctx.fillRect(x - 12, y, w + 24, 3);
    // string of bulbs
    ctx.strokeStyle = alpha('#1a1a1a', 0.6);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + h - 4);
    ctx.quadraticCurveTo(x + w / 2, y + h + 8, x + w + 12, y + h - 4);
    ctx.stroke();
    for (let k = 1; k < 8; k++) {
      const u = k / 8;
      const bx = x - 12 + (w + 24) * u;
      const by = y + h - 4 + 4 * u * (1 - u) * 12 * 0.5 + 2;
      const on = 0.75 + 0.25 * Math.sin(t * 3 + k);
      ctx.fillStyle = alpha(P.lamp || '#ffc070', on);
      ctx.beginPath();
      ctx.arc(bx, by, 2, 0, TAU);
      ctx.fill();
    }
  },

  // ---------- Savanna
  thorn(ctx, o, T) {
    const { x, y, w, h } = o;
    const cx = x + w / 2;
    const rng = mulberry32(o.seed);
    // a low thorn scrub: wiry twigs in a dense dome, small leaves, long pale spines at the tips
    const twig = T('#2e2014');
    ctx.strokeStyle = twig;
    ctx.lineCap = 'round';
    const tips = [];
    for (let k = 0; k < 16; k++) {
      const a = -Math.PI / 2 + (k / 15 - 0.5) * 2.7 + (rng() - 0.5) * 0.15;
      const len = h * (0.8 + rng() * 0.35);
      const ex = cx + Math.cos(a) * len * (w / h) * 0.58;
      const ey = y + h + Math.sin(a) * len;
      const mx = (cx + ex) / 2 + (rng() - 0.5) * 14;
      const my = (y + h + ey) / 2;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx + (rng() - 0.5) * 10, y + h);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
      // side shoots zig-zag off each twig
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + (rng() - 0.5) * 16, my - 6 - rng() * 6);
      ctx.stroke();
      tips.push([ex, ey, a]);
    }
    ctx.fillStyle = T('#46502a');
    for (let k = 0; k < 30; k++) {
      const u = rng();
      ctx.beginPath();
      ctx.ellipse(x + 4 + u * (w - 8), y + h * (0.2 + 0.55 * Math.pow(2 * u - 1, 2)) + rng() * h * 0.5, 3, 1.8, rng() * 3, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = T('#e2d4b0');
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (const [ex, ey, a] of tips) {
      for (const d of [-0.7, 0.7]) {
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + Math.cos(a + d) * 7, ey + Math.sin(a + d) * 7);
      }
    }
    ctx.stroke();
  },
  termite(ctx, o, T, P) {
    const { x, y, w, h } = o;
    if (!o._pts) {
      const r = mulberry32(o.seed);
      o._pts = [[-6, h], [w * 0.06, h * 0.55], [w * 0.14, h * 0.18], [w * 0.24, 0.5], [w * 0.5, r() * 2], [w * 0.76, 0.5], [w * 0.86, h * 0.2], [w * 0.95, h * 0.6], [w + 6, h]];
    }
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, T(mix('#b8683a', P.light, 0.3)));
    g.addColorStop(1, T('#5a2a14'));
    ctx.fillStyle = g;
    poly(ctx, x, y, o._pts);
    ctx.fill();
    // the chimneys are behind the walkable top, leaning back from the path
    ctx.fillStyle = T('#8a4a28');
    ctx.beginPath();
    ctx.moveTo(x + w * 0.62, y + 2);
    ctx.quadraticCurveTo(x + w * 0.68, y - 22, x + w * 0.74, y - 30);
    ctx.quadraticCurveTo(x + w * 0.78, y - 18, x + w * 0.8, y + 2);
    ctx.fill();
    ctx.save();
    poly(ctx, x, y, o._pts);
    ctx.clip();
    ctx.strokeStyle = alpha('#2a0e04', 0.3);
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 6; k++) {
      const fx = x + w * (0.15 + k * 0.14);
      ctx.beginPath();
      ctx.moveTo(fx, y + 6);
      ctx.quadraticCurveTo(fx + 4, y + h * 0.5, fx - 2, y + h);
      ctx.stroke();
    }
    ctx.restore();
  },
  acacia(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a thorn tree just off the path, its flat crown spread right across it
    const tx = x + w + 34;
    const bark = T('#3a2618');
    ctx.fillStyle = bark;
    ctx.beginPath();
    ctx.moveTo(tx - 10, o.ground);
    ctx.quadraticCurveTo(tx - 4, (o.ground + y) / 2, tx - 14, y + h * 0.3);
    ctx.lineTo(tx + 2, y + h * 0.2);
    ctx.quadraticCurveTo(tx + 10, (o.ground + y) / 2, tx + 12, o.ground);
    ctx.fill();
    ctx.strokeStyle = bark;
    ctx.lineCap = 'round';
    const limbs = [
      [tx - 8, y + h * 0.3, x + w * 0.35, y + h * 0.15, 6],
      [tx - 8, y + h * 0.3, x - 24, y + h * 0.3, 5],
      [tx - 6, y + h * 0.25, tx + 40, y - 6, 5],
      [x + w * 0.5, y + h * 0.22, x + w * 0.2, y - 10, 3],
    ];
    for (const [ax, ay, bx, by, lw] of limbs) {
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo((ax + bx) / 2, Math.max(ay, by) + 6, bx, by);
      ctx.stroke();
    }
    // twigs hanging into the gap: the part you must slide under
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const bx = x - 10 + (k / 9) * (w + 20);
      ctx.moveTo(bx, y + h * 0.3);
      ctx.lineTo(bx - 4 + hash(o.seed + k) * 8, y + h - 2);
    }
    ctx.stroke();
    // the crown: a flat, airy lens of small leaf clumps, darker underneath
    const rng = mulberry32(o.seed);
    const cx0 = x - 50;
    const cw = w + 120;
    const top = y - h * 0.15;
    const cols = [T('#2e3a18'), T('#3c4a20'), T('#4c5a2a'), T(mix('#64743a', P.light, 0.2))];
    for (let pass = 0; pass < 4; pass++) {
      ctx.fillStyle = cols[pass];
      const n = [26, 24, 18, 10][pass];
      for (let k = 0; k < n; k++) {
        const u = rng();
        const thick = Math.sin(u * Math.PI) * h * 0.62 + 6;
        const yy = top + thick * (1 - pass * 0.24) * (0.55 + rng() * 0.45) - pass * 3;
        ctx.beginPath();
        ctx.ellipse(cx0 + u * cw, yy, 9 + rng() * 11, 3.5 + rng() * 3.5, (rng() - 0.5) * 0.25, 0, TAU);
        ctx.fill();
      }
    }
  },
  // ---------- Lantern Festival
  drum(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, T('#c84a30'));
    g.addColorStop(0.4, T('#a42c1e'));
    g.addColorStop(1, T('#4a0e08'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 6);
    ctx.quadraticCurveTo(x - 3, y + h / 2, x + 4, y + h);
    ctx.lineTo(x + w - 4, y + h);
    ctx.quadraticCurveTo(x + w + 3, y + h / 2, x + w - 4, y + 6);
    ctx.fill();
    ctx.fillStyle = T('#e8d8b0');
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 6, w / 2 - 4, 5.5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#d8a040');
    for (const yy of [y + 10, y + h - 5]) {
      for (let xx = x + 6; xx < x + w - 4; xx += 6) {
        ctx.beginPath();
        ctx.arc(xx, yy, 1.4, 0, TAU);
        ctx.fill();
      }
    }
    ctx.fillStyle = alpha(P.lamp, 0.18);
    ctx.fillRect(x + 6, y + 14, 4, h - 22);
  },
  giftboxes(ctx, o, T) {
    const { x, y, w, h } = o;
    const box = (bx, by, bw, bh, col, rib) => {
      ctx.fillStyle = vg(ctx, by, by + bh, T(mix(col, '#ffffff', 0.12)), T(mix(col, '#000000', 0.35)));
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = T(rib);
      ctx.fillRect(bx + bw / 2 - 2, by, 4, bh);
      ctx.fillRect(bx, by + bh * 0.4, bw, 3);
      ctx.fillStyle = alpha('#000000', 0.2);
      ctx.fillRect(bx, by + bh - 2, bw, 2);
    };
    box(x, y + h * 0.42, w * 0.58, h * 0.58, '#b82a24', '#e8b84a');
    box(x + w * 0.56, y + h * 0.5, w * 0.44, h * 0.5, '#d8a038', '#a42420');
    box(x + w * 0.16, y, w * 0.5, h * 0.44, '#7a1e3a', '#e8b84a');
    ctx.strokeStyle = T('#e8b84a');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.41 - 4, y - 3, 4, 2.5, -0.4, 0, TAU);
    ctx.ellipse(x + w * 0.41 + 4, y - 3, 4, 2.5, 0.4, 0, TAU);
    ctx.stroke();
  },
  stallTall(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a food stall: lit counter, cloth front, a stout flat roof to run across
    ctx.fillStyle = woodGrad(ctx, y + 14, h - 14, T, '#7a4a2a', '#5a321c', '#2a160c');
    ctx.fillRect(x + 4, y + 12, w - 8, h - 12);
    const glow = ctx.createLinearGradient(0, y + 22, 0, y + h * 0.55);
    glow.addColorStop(0, alpha(P.lamp, 0.55));
    glow.addColorStop(1, alpha(P.lamp, 0.1));
    ctx.fillStyle = glow;
    ctx.fillRect(x + 10, y + 22, w - 20, h * 0.36);
    ctx.fillStyle = T('#2a160c');
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(x + 22 + k * ((w - 44) / 3), y + h * 0.52, 5, Math.PI, 0);
      ctx.fill();
    }
    const pts = [
      [x + 4, y + h * 0.58],
      [x + w - 4, y + h * 0.58],
      [x + w - 4, y + h - 4],
      [x + 4, y + h - 4],
    ];
    stripedCloth(ctx, pts, T, '#b42a22', '#8a1c18', 6, x + 4, x + w - 4);
    ctx.fillStyle = T('#3a1c10');
    ctx.fillRect(x - 6, y, w + 12, 14);
    ctx.fillStyle = T('#6a3a20');
    ctx.fillRect(x - 6, y, w + 12, 3);
    paperLantern(ctx, x + 2, y + 26, 6, T, '#e2402a', t, o.seed);
    paperLantern(ctx, x + w - 2, y + 26, 6, T, '#e2402a', t, o.seed + 2);
  },
  lanternString(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    const pole = T('#3a1c14');
    backPost(ctx, x - 14, y - 26, o.ground, 5, pole);
    backPost(ctx, x + w + 14, y - 26, o.ground, 5, pole);
    ctx.fillStyle = T('#b42a22');
    ctx.fillRect(x - 20, y - 30, 12, 5);
    ctx.fillRect(x + w + 8, y - 30, 12, 5);
    ctx.strokeStyle = T('#2a1610');
    ctx.lineWidth = 1.2;
    const lineY = (u) => y - 22 + 4 * u * (1 - u) * 14;
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 22);
    ctx.quadraticCurveTo(x + w / 2, y + 6, x + w + 14, y - 22);
    ctx.stroke();
    const n = Math.max(3, Math.round(w / 34));
    const cols = ['#e2402a', '#e8a038', '#d8304a'];
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) / n;
      const lx = x - 14 + (w + 28) * u;
      const ly = lineY(u);
      const r = Math.min(10, (h - 4) / 2.6);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx, ly + 4);
      ctx.stroke();
      paperLantern(ctx, lx, ly + 4 + r * 1.2, r, T, cols[(o.seed + k) % 3], t, o.seed + k);
    }
  },
};

// ---------------------------------------------------------------- movers

/** Draws a chapter-2 roller already translated + rotated to its centre. False if not ours. */
export function worldRoller(ctx, m, r, T, P) {
  const skin = m.skin;
  if (skin === 'urn') {
    ctx.fillStyle = T('#b8643a');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#6a2e14');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66);
      ctx.lineTo(Math.cos(a + 0.2) * r * 0.92, Math.sin(a + 0.2) * r * 0.92);
      ctx.stroke();
    }
    ctx.fillStyle = T('#3a1a0a');
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.26, 0, TAU);
    ctx.fill();
  } else if (skin === 'coconut') {
    ctx.fillStyle = T('#6a4424');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#9a7244');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 30; k++) {
      const a = hash(m.seed + k) * TAU;
      const rr2 = r * (0.3 + hash(k * 7) * 0.65);
      ctx.moveTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
      ctx.lineTo(Math.cos(a + 0.3) * (rr2 + 4), Math.sin(a + 0.3) * (rr2 + 4));
    }
    ctx.stroke();
    ctx.fillStyle = T('#2a1608');
    for (const a of [0, 2.1, 4.2]) {
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22, 2.4, 0, TAU);
      ctx.fill();
    }
  } else if (skin === 'stoneWheel') {
    ctx.fillStyle = T('#8a8470');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = alpha('#1a1a10', 0.45);
    ctx.lineWidth = 1.4;
    for (const k of [0.8, 0.5]) {
      ctx.beginPath();
      ctx.arc(0, 0, r * k, 0, TAU);
      ctx.stroke();
    }
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
      ctx.lineTo(Math.cos(a) * r * 0.97, Math.sin(a) * r * 0.97);
      ctx.stroke();
    }
    glyphFace(ctx, 0, 0, r / 22, alpha('#1a1a10', 0.5));
  } else if (skin === 'drumRoll') {
    ctx.fillStyle = T('#e8d8b0');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#a42c1e');
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r - 2, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = T('#d8a040');
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * TAU;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2), 1.3, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = T('#a42c1e');
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let a = 0; a < TAU * 1.6; a += 0.15) {
      const rr2 = (a / (TAU * 1.6)) * r * 0.62;
      ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
    }
    ctx.stroke();
  } else return false;
  return true;
}

/** Swinging hazards for chapter 2: a vine-slung stone, a street lantern, a big paper lantern. */
export function worldSwing(ctx, m, s, T, P, t) {
  const skin = m.skin;
  if (skin !== 'vine' && skin !== 'lamp' && skin !== 'bigLantern') return false;
  const dx = s.x - m.ax;
  const dy = s.y - m.ay;
  if (skin === 'vine') {
    ctx.strokeStyle = T('#3a5a24');
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(m.ax, m.ay - 60);
    ctx.lineTo(m.ax, m.ay);
    ctx.quadraticCurveTo(m.ax + dx * 0.5 + Math.sin(t * 2) * 3, m.ay + dy * 0.5, s.x, s.y - 14);
    ctx.stroke();
    ctx.fillStyle = T('#4e7a2c');
    for (let k = 1; k < 6; k++) {
      const u = k / 6;
      ctx.beginPath();
      ctx.ellipse(m.ax + dx * u + 3, m.ay + dy * u, 4, 2, 0.6, 0, TAU);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(-s.th);
    drawRock(ctx, { x: -16, y: -15, w: 32, h: 28, seed: m.seed || 7 }, T, '#7e786a', false, true, P.light);
    ctx.strokeStyle = T('#3a5a24');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, -2);
    ctx.lineTo(14, -6);
    ctx.moveTo(-10, -12);
    ctx.lineTo(10, 6);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.strokeStyle = T('#2a2420');
    ctx.lineWidth = skin === 'lamp' ? 2 : 1.4;
    ctx.beginPath();
    ctx.moveTo(m.ax - 40, m.ay - 4);
    ctx.lineTo(m.ax + 40, m.ay - 4);
    ctx.moveTo(m.ax, m.ay - 4);
    ctx.lineTo(s.x, s.y - 18);
    ctx.stroke();
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(-s.th);
    if (skin === 'lamp') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, -4, 0, 0, -4, 50);
      g.addColorStop(0, alpha(P.lamp || '#ffc070', 0.5));
      g.addColorStop(1, alpha(P.lamp || '#ffc070', 0));
      ctx.fillStyle = g;
      ctx.fillRect(-50, -54, 100, 100);
      ctx.restore();
      ctx.fillStyle = T('#1e1c1a');
      ctx.beginPath();
      ctx.moveTo(-6, -18);
      ctx.lineTo(6, -18);
      ctx.lineTo(13, -10);
      ctx.lineTo(-13, -10);
      ctx.fill();
      ctx.fillStyle = alpha('#ffe0a0', 0.95);
      ctx.beginPath();
      ctx.moveTo(-11, -10);
      ctx.lineTo(11, -10);
      ctx.lineTo(8, 8);
      ctx.lineTo(-8, 8);
      ctx.fill();
      ctx.strokeStyle = T('#1e1c1a');
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 8);
      ctx.stroke();
      ctx.fillStyle = T('#1e1c1a');
      ctx.fillRect(-9, 8, 18, 3);
    } else {
      paperLantern(ctx, 0, -2, 15, T, '#e2402a', t, 3);
    }
    ctx.restore();
  }
  return true;
}

// ---------------------------------------------------------------- decor

export const WORLD_DECOR = {
  ripple(ctx, d, T, P) {
    ctx.strokeStyle = alpha(T(P.ground.top2), 0.9);
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(d.x + k * 6, d.y - 1 - k);
      ctx.quadraticCurveTo(d.x + 12 + k * 6, d.y - 4 - k, d.x + 26 + k * 6, d.y - 1 - k);
      ctx.stroke();
    }
  },
  potShard(ctx, d, T) {
    ctx.fillStyle = T('#a65a34');
    for (let k = 0; k < 3; k++) {
      const x = d.x + k * 7;
      ctx.beginPath();
      ctx.moveTo(x, d.y);
      ctx.lineTo(x + 2, d.y - 4 - hash(d.seed + k) * 3);
      ctx.lineTo(x + 6, d.y - 3);
      ctx.lineTo(x + 5, d.y);
      ctx.fill();
    }
  },
  sprout(ctx, d, T, P) {
    ctx.strokeStyle = T(P.ground.top2);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const l = (k - 2) * 3 * d.s;
      ctx.moveTo(d.x, d.y);
      ctx.quadraticCurveTo(d.x + l * 0.3, d.y - 7 * d.s, d.x + l, d.y - (12 + hash(d.seed + k) * 6) * d.s);
    }
    ctx.stroke();
  },
  glyph(ctx, d, T, P) {
    const w = 18 * d.s;
    const h = 26 * d.s;
    ctx.fillStyle = T('#7a7462');
    rr(ctx, d.x - w / 2, d.y - h, w, h, 3);
    ctx.fill();
    glyphFace(ctx, d.x, d.y - h * 0.55, d.s * 0.7, alpha('#1a1a10', 0.5));
    ctx.fillStyle = T('#4e7a2c');
    ctx.fillRect(d.x - w / 2, d.y - h, w, 2.5);
    void P;
  },
  dryGrass(ctx, d, T, P) {
    ctx.strokeStyle = T(P.ground.top2);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let k = 0; k < 9; k++) {
      const l = (k - 4) * 2.6 * d.s + 4;
      const h = (16 + hash(d.seed + k) * 14) * d.s;
      ctx.moveTo(d.x + k, d.y);
      ctx.quadraticCurveTo(d.x + k + l * 0.3, d.y - h * 0.6, d.x + k + l, d.y - h);
    }
    ctx.stroke();
    ctx.fillStyle = T(mix(P.ground.top2, '#ffffff', 0.2));
    for (let k = 0; k < 3; k++) {
      const l = (k * 4 - 4) * 2.6 * d.s + 4;
      ctx.beginPath();
      ctx.ellipse(d.x + k * 4 + l, d.y - (24 + hash(d.seed + k) * 8) * d.s, 1.4, 4, 0.3, 0, TAU);
      ctx.fill();
    }
  },
  lanternSmall(ctx, d, T, P) {
    ctx.fillStyle = T('#2a1610');
    ctx.fillRect(d.x - 5, d.y - 3, 10, 3);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(d.x, d.y - 9, 0, d.x, d.y - 9, 30);
    g.addColorStop(0, alpha(P.lamp || '#ffb060', 0.45));
    g.addColorStop(1, alpha(P.lamp || '#ffb060', 0));
    ctx.fillStyle = g;
    ctx.fillRect(d.x - 30, d.y - 39, 60, 60);
    ctx.restore();
    ctx.fillStyle = alpha('#ffe2a8', 0.95);
    rr(ctx, d.x - 4, d.y - 15, 8, 12, 2);
    ctx.fill();
    ctx.fillStyle = T('#2a1610');
    ctx.fillRect(d.x - 5, d.y - 17, 10, 2.5);
  },
};

// ---------------------------------------------------------------- foreground

/** Chapter 2 silhouettes for the foreground strip. False if the terrain is not ours. */
export function worldForeground(g, kind, x, H, rng) {
  if (kind === 'dunes') {
    g.beginPath();
    g.ellipse(x, H + 10, 130 + rng() * 80, 34 + rng() * 22, 0, Math.PI, 0);
    g.fill();
  } else if (kind === 'terraces' || kind === 'savanna') {
    const n = kind === 'savanna' ? 26 : 16;
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * (kind === 'savanna' ? 0.9 : 1.6) + (kind === 'savanna' ? 0.25 : 0);
      const l = (kind === 'savanna' ? 90 : 60) + rng() * 80;
      g.lineWidth = 2 + rng() * 4;
      g.beginPath();
      g.moveTo(x + (rng() - 0.5) * 50, H);
      g.quadraticCurveTo(x + Math.cos(a) * l * 0.4, H + Math.sin(a) * l * 0.7, x + Math.cos(a) * l, H + Math.sin(a) * l);
      g.stroke();
    }
  } else if (kind === 'ruins') {
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k - 2) * 0.45 + (rng() - 0.5) * 0.2;
      const s = 70 + rng() * 50;
      g.save();
      g.translate(x, H + 6);
      g.rotate(a);
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(s * 0.5, -s * 0.32, s, 0);
      g.quadraticCurveTo(s * 0.5, s * 0.32, 0, 0);
      g.fill();
      g.restore();
    }
  } else if (kind === 'canals') {
    g.fillRect(x - 6, H - 96, 12, 96);
    g.beginPath();
    g.ellipse(x, H - 96, 8, 5, 0, 0, TAU);
    g.fill();
    if (rng() < 0.6) {
      g.fillRect(x + 50, H - 70, 9, 70);
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x + 6, H - 60);
      g.quadraticCurveTo(x + 30, H - 40, x + 50, H - 56);
      g.stroke();
    }
  } else if (kind === 'lanterns') {
    g.fillRect(x - 5, H - 64, 10, 64);
    g.fillRect(x - 9, H - 68, 18, 6);
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(x, H - 50);
    g.quadraticCurveTo(x + 110, H - 30, x + 220, H - 50);
    g.stroke();
  } else return false;
  return true;
}

// ---------------------------------------------------------------- finale

/** End of the trip: a riverside pavilion, a mat by the water, a seat kept warm. */
export function drawPavilion(ctx, x, y, T, P, t, open) {
  const w = 260;
  const h = 96;
  const wood = T('#5a1e18');
  // stone plinth
  ctx.fillStyle = T('#4a4048');
  ctx.fillRect(x - 12, y - 10, w + 24, 10);
  ctx.fillStyle = alpha(P.lamp, 0.2);
  ctx.fillRect(x - 12, y - 10, w + 24, 1.5);
  // columns
  for (let k = 0; k < 4; k++) {
    const cx = x + 10 + k * ((w - 20) / 3);
    ctx.fillStyle = wood;
    ctx.fillRect(cx - 5, y - h, 10, h - 10);
    ctx.fillStyle = alpha('#000000', 0.3);
    ctx.fillRect(cx + 2, y - h, 3, h - 10);
  }
  // warm interior light
  const g = ctx.createRadialGradient(x + w / 2, y - h * 0.45, 0, x + w / 2, y - h * 0.45, w * 0.7);
  g.addColorStop(0, alpha(P.lamp, open ? 0.5 : 0.32));
  g.addColorStop(1, alpha(P.lamp, 0));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.fillRect(x - w * 0.3, y - h * 1.4, w * 1.6, h * 1.6);
  ctx.restore();
  // rail
  ctx.fillStyle = wood;
  ctx.fillRect(x, y - 34, w, 4);
  for (let xx = x + 6; xx < x + w; xx += 12) ctx.fillRect(xx, y - 32, 2, 22);
  // sweeping roof with upturned eaves, two tiers
  const roof = (ry, rw, rh) => {
    ctx.fillStyle = T('#1e1620');
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - rw / 2 - 24, ry + 2);
    ctx.quadraticCurveTo(x + w / 2 - rw / 2 - 4, ry - 2, x + w / 2 - rw / 2 + 10, ry - rh);
    ctx.lineTo(x + w / 2 + rw / 2 - 10, ry - rh);
    ctx.quadraticCurveTo(x + w / 2 + rw / 2 + 4, ry - 2, x + w / 2 + rw / 2 + 24, ry + 2);
    ctx.lineTo(x + w / 2 + rw / 2, ry + 6);
    ctx.lineTo(x + w / 2 - rw / 2, ry + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = alpha(P.lamp, 0.25);
    ctx.fillRect(x + w / 2 - rw / 2, ry + 4, rw, 2);
  };
  roof(y - h, w + 30, 34);
  ctx.fillStyle = wood;
  ctx.fillRect(x + w * 0.3, y - h - 52, w * 0.4, 20);
  roof(y - h - 46, w * 0.55, 26);
  ctx.fillStyle = T('#d8a040');
  ctx.fillRect(x + w / 2 - 2, y - h - 92, 4, 20);
  // lanterns hanging from the eaves
  for (let k = 0; k < 5; k++) paperLantern(ctx, x - 6 + k * ((w + 12) / 4), y - h + 18, 8, T, k % 2 ? '#e8a038' : '#e2402a', t, k * 1.7);
  // the mat and the saved seat, with two cups and a little lantern
  const mx = x - 130;
  ctx.fillStyle = T('#b84a3a');
  ctx.beginPath();
  ctx.moveTo(mx, y);
  ctx.lineTo(mx + 110, y);
  ctx.lineTo(mx + 96, y - 7);
  ctx.lineTo(mx + 12, y - 7);
  ctx.fill();
  ctx.fillStyle = alpha('#f0d090', 0.6);
  for (let k = 0; k < 6; k++) ctx.fillRect(mx + 14 + k * 15, y - 6, 2, 6);
  ctx.fillStyle = T('#e8dcc8');
  ctx.fillRect(mx + 30, y - 13, 7, 6);
  ctx.fillRect(mx + 44, y - 13, 7, 6);
  ctx.fillStyle = alpha(P.lamp, 0.9);
  rr(ctx, mx + 70, y - 22, 9, 14, 2);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const lg = ctx.createRadialGradient(mx + 74, y - 15, 0, mx + 74, y - 15, 40);
  lg.addColorStop(0, alpha(P.lamp, 0.45));
  lg.addColorStop(1, alpha(P.lamp, 0));
  ctx.fillStyle = lg;
  ctx.fillRect(mx + 34, y - 55, 80, 80);
  ctx.restore();
}
