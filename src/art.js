// World art: ground, pits, obstacles, moving hazards, decor, coins, finish line.
// Everything is drawn in world coordinates with a stage "tone" applied so props sit in the
// same light as the painted background (haze for distance, darkening for night).

import { hash, mulberry32 } from './rng.js';
import { GROUND_Y } from './config.js';
import { segIndexAt, obstacleStart, lowerBound, moverState } from './level.js';
import { clamp, mix, alpha, TAU, fract } from './util.js';
import { WORLD_SEG, WATERY, worldPit, WORLD_OB, worldRoller, worldSwing, WORLD_DECOR, worldForeground, drawPavilion } from './art-world.js';
import { SKY_SEG, skyPit, SKY_OB, skyRoller, skyDrop, SKY_DECOR, skyForeground, drawObservatory } from './art-skies.js';
import { SEA_SEG, SEA_WATERY, seaPit, SEA_OB, seaRoller, seaSwing, seaDrop, SEA_DECOR, seaForeground, drawBonfire } from './art-sea.js';

const watery = (terr) => WATERY.has(terr) || SEA_WATERY.has(terr);

export function makeTone(P) {
  const cache = new Map();
  return (c) => {
    let v = cache.get(c);
    if (!v) {
      v = mix(mix(c, P.haze, P.tint.haze), '#05060a', P.tint.dark);
      cache.set(c, v);
    }
    return v;
  };
}

export function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const vg = (ctx, y0, y1, a, b, c) => {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, a);
  if (c) {
    g.addColorStop(0.5, b);
    g.addColorStop(1, c);
  } else g.addColorStop(1, b);
  return g;
};

export function blobPts(seed, n, w, h, flatBottom = true) {
  const rng = mulberry32(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI;
    const r = 0.82 + rng() * 0.22;
    pts.push([w / 2 + Math.cos(a) * (w / 2) * r, h + Math.sin(a) * h * r]);
  }
  if (flatBottom) {
    pts.push([w + 2, h], [-2, h]);
  }
  return pts;
}

export function poly(ctx, x, y, pts) {
  ctx.beginPath();
  ctx.moveTo(x + pts[0][0], y + pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(x + pts[i][0], y + pts[i][1]);
  ctx.closePath();
}

// ---------------------------------------------------------------- ground

/**
 * look(th) -> { st, P, T }: the stage, palette and tone a piece of the world belongs to.
 * Fixed stages pass one look for everything; the endless road mixes landscapes.
 */
export function drawTerrain(ctx, L, look, view, cam, t) {
  const x0 = cam.x - 60;
  const x1 = cam.x + view.w + 60;
  const bottom = cam.y + view.bottom + 20;
  const segs = L.segments;
  const first = Math.max(0, segIndexAt(L, x0) - 1);

  // pits (gaps between segments) take the look of the ground they open out of
  for (let i = first; i < segs.length - 1; i++) {
    const a = segs[i];
    const b = segs[i + 1];
    if (a.x1 > x1) break;
    if (b.x0 - a.x1 < 1) continue;
    const k = look(a.th);
    drawPit(ctx, k.st.terrain, k.P, k.T, a, b, bottom, t);
  }
  // open water beneath the harbour piers (and the gaps between them)
  for (let i = first; i < segs.length; i++) {
    const s = segs[i];
    if (s.x0 > x1) break;
    const k = look(s.th);
    if (!watery(k.st.terrain)) continue;
    const next = segs[i + 1];
    const end = next && watery(look(next.th).st.terrain) ? next.x0 : s.x1;
    drawWater(ctx, k.P, Math.max(s.x0, x0), Math.min(end, x1), bottom, t);
  }
  for (let i = first; i < segs.length; i++) {
    const s = segs[i];
    if (s.x0 > x1) break;
    if (s.x1 < x0) continue;
    const prev = segs[i - 1];
    const next = segs[i + 1];
    const openL = !prev || prev.x1 < s.x0 - 0.5 || prev.y > s.y;
    const openR = !next || next.x0 > s.x1 + 0.5 || next.y > s.y;
    const sx0 = Math.max(s.x0, x0);
    const sx1 = Math.min(s.x1, x1);
    const k = look(s.th);
    (SEG[k.st.terrain] || WORLD_SEG[k.st.terrain] || SKY_SEG[k.st.terrain] || SEA_SEG[k.st.terrain])(ctx, s, sx0, sx1, bottom, k.P, k.T, t, openL, openR);
  }
}

function drawWater(ctx, P, x0, x1, bottom, t) {
  if (x1 <= x0) return;
  const wy = GROUND_Y + 62;
  ctx.fillStyle = vg(ctx, wy, wy + 160, mix(P.water, '#3a4c5c', 0.35), P.water);
  ctx.fillRect(x0, wy, x1 - x0, bottom - wy);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, wy, x1 - x0, bottom - wy);
  ctx.clip();
  ctx.strokeStyle = alpha(P.seaGlint || '#9db4c8', P.seaGlint ? 0.24 : 0.18);
  ctx.lineWidth = 1;
  for (let k = 0; k < 26; k++) {
    const yy = wy + 4 + k * 7;
    const ph = t * (1.5 + (k % 3)) + k;
    ctx.beginPath();
    for (let xx = Math.floor(x0 / 40) * 40; xx < x1; xx += 40) {
      const o = Math.sin(xx * 0.05 + ph) * 2;
      ctx.moveTo(xx + hash(k * 31 + xx) * 20, yy + o);
      ctx.lineTo(xx + 12 + hash(k * 31 + xx) * 20, yy + o);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawPit(ctx, terr, P, T, a, b, bottom, t) {
  const top = Math.max(a.y, b.y) + 1;
  const x0 = a.x1;
  const w = b.x0 - a.x1;
  if (worldPit(ctx, terr, P, T, a, b, bottom, t) || skyPit(ctx, terr, P, T, a, b, bottom, t) || seaPit(ctx, terr, P, T, a, b, bottom, t)) return;
  if (terr === 'meadow' || terr === 'forest') {
    ctx.fillStyle = vg(ctx, top, top + 120, T(mix(P.ground.body, '#000000', 0.35)), T(P.ground.deep));
    ctx.fillRect(x0, top, w, bottom - top);
    const wy = top + 88;
    ctx.fillStyle = vg(ctx, wy, wy + 60, T(mix(P.water, P.light, 0.25)), T(mix(P.water, '#000000', 0.5)));
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
  } else if (terr === 'canyon') {
    ctx.fillStyle = vg(ctx, top, top + 220, T(mix(P.ground.body, '#000000', 0.45)), T('#1a0b06'));
    ctx.fillRect(x0, top, w, bottom - top);
  } else if (terr === 'roof') {
    ctx.fillStyle = vg(ctx, top, top + 260, T(mix(P.ground.deep, P.haze, 0.12)), '#07050a');
    ctx.fillRect(x0, top, w, bottom - top);
    for (let k = 0; k < 6; k++) {
      if (hash(a.x1 + k * 13) < 0.45) continue;
      ctx.fillStyle = alpha(P.window, 0.35 + hash(k + a.x1) * 0.3);
      ctx.fillRect(x0 + 8 + hash(a.x1 * 3 + k) * Math.max(1, w - 22), top + 26 + k * 38, 6, 9);
    }
    ctx.strokeStyle = alpha('#000000', 0.5);
    ctx.lineWidth = 1.5;
    for (let y = top + 40; y < top + 240; y += 46) {
      ctx.beginPath();
      ctx.moveTo(x0 + 4, y);
      ctx.lineTo(x0 + Math.min(w - 4, 40), y);
      ctx.stroke();
    }
  } else if (terr === 'harbor') {
    ctx.fillStyle = vg(ctx, top, GROUND_Y + 62, alpha('#000000', 0.55), alpha('#000000', 0.15));
    ctx.fillRect(x0, top, w, GROUND_Y + 62 - top);
  } else if (terr === 'snow') {
    ctx.fillStyle = vg(ctx, top, top + 200, '#9fc0e0', '#2c4b74', '#0b1426');
    ctx.fillRect(x0, top, w, bottom - top);
    ctx.fillStyle = alpha('#ffffff', 0.25);
    for (let k = 0; k < 5; k++) {
      const yy = top + 10 + k * 24;
      ctx.fillRect(x0 + 2, yy, Math.max(2, w * (0.15 + hash(k + a.x1) * 0.2)), 1);
    }
  }
}

export function edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, col) {
  if (openL && s.x0 >= sx0 - 1) {
    const g = ctx.createLinearGradient(s.x0, 0, s.x0 + 14, 0);
    g.addColorStop(0, col);
    g.addColorStop(1, alpha('#000000', 0));
    ctx.fillStyle = g;
    ctx.fillRect(s.x0, s.y + 4, 14, bottom - s.y);
  }
  if (openR && s.x1 <= sx1 + 1) {
    const g = ctx.createLinearGradient(s.x1, 0, s.x1 - 14, 0);
    g.addColorStop(0, col);
    g.addColorStop(1, alpha('#000000', 0));
    ctx.fillStyle = g;
    ctx.fillRect(s.x1 - 14, s.y + 4, 14, bottom - s.y);
  }
}

export function blades(ctx, s, sx0, sx1, col, hMin, hVar, step, lean = 0) {
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  const start = Math.ceil(sx0 / step) * step;
  for (let x = start; x < sx1; x += step) {
    const hh = hash(x * 13);
    const h = hMin + hh * hVar;
    const l = (hash(x * 7) - 0.5) * 4 + lean;
    ctx.moveTo(x, s.y + 2);
    ctx.quadraticCurveTo(x + l * 0.3, s.y - h * 0.5, x + l, s.y - h);
  }
  ctx.stroke();
}

const SEG = {
  meadow(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 110, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    // soil horizons: a dark humus band under the turf and a stony layer lower down
    ctx.fillStyle = alpha('#140c06', 0.35);
    ctx.fillRect(sx0, s.y + 8, sx1 - sx0, 10);
    ctx.fillStyle = alpha('#140c06', 0.18);
    ctx.fillRect(sx0, s.y + 18, sx1 - sx0, 8);
    ctx.strokeStyle = alpha('#1a100a', 0.45);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 29) * 29; x < sx1; x += 29) {
      if (hash(x * 13) < 0.45) continue;
      const l = 8 + hash(x * 17) * 22;
      ctx.moveTo(x, s.y + 10);
      ctx.quadraticCurveTo(x + 4, s.y + 10 + l * 0.6, x - 3 + hash(x) * 8, s.y + 10 + l);
    }
    ctx.stroke();
    ctx.fillStyle = alpha('#c9b090', 0.1);
    for (let x = Math.floor(sx0 / 11) * 11; x < sx1; x += 11) {
      if (hash(x * 3) < 0.55) continue;
      ctx.beginPath();
      ctx.ellipse(x, s.y + 56 + hash(x * 7) * 14, 2 + hash(x) * 3, 1.5 + hash(x * 5) * 1.5, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = alpha('#000000', 0.18);
    for (let x = Math.floor(sx0 / 37) * 37; x < sx1; x += 37) {
      const h = hash(x);
      if (h < 0.35) continue;
      const yy = s.y + 22 + hash(x * 3) * 80;
      ctx.beginPath();
      ctx.ellipse(x + h * 20, yy, 3 + h * 6, 2 + h * 3, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = alpha('#d8b98a', 0.12);
    for (let x = Math.floor(sx0 / 23) * 23; x < sx1; x += 23) {
      if (hash(x * 5) < 0.5) continue;
      ctx.beginPath();
      ctx.ellipse(x, s.y + 16 + hash(x * 9) * 60, 3, 2, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = vg(ctx, s.y - 1, s.y + 12, T(G.top2), T(G.top));
    ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 11);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
    blades(ctx, s, sx0, sx1, T(G.top), 3, 8, 3.2);
    blades(ctx, s, sx0, sx1, T(G.top2), 2, 6, 5.1, 1);
  },
  forest(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 130, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    ctx.strokeStyle = alpha('#0a0604', 0.35);
    ctx.lineWidth = 2;
    for (let x = Math.floor(sx0 / 61) * 61; x < sx1; x += 61) {
      if (hash(x) < 0.4) continue;
      ctx.beginPath();
      ctx.moveTo(x, s.y + 6);
      ctx.quadraticCurveTo(x + 14, s.y + 24, x + 6 + hash(x * 3) * 26, s.y + 40 + hash(x * 5) * 30);
      ctx.stroke();
    }
    ctx.fillStyle = vg(ctx, s.y - 2, s.y + 10, T(G.top2), T(G.top));
    ctx.fillRect(sx0, s.y - 2, sx1 - sx0, 10);
    ctx.fillStyle = T('#7a4a26');
    for (let x = Math.floor(sx0 / 9) * 9; x < sx1; x += 9) {
      if (hash(x * 11) < 0.55) continue;
      const lc = P.leaves[Math.floor(hash(x * 17) * 4)];
      ctx.fillStyle = T(lc);
      ctx.beginPath();
      ctx.ellipse(x, s.y - 1, 2.6, 1.2, hash(x) * 3, 0, TAU);
      ctx.fill();
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.5));
    blades(ctx, s, sx0, sx1, T(G.top), 2, 5, 4.3);
  },
  canyon(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 180, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    for (let k = 0; k < 9; k++) {
      const yy = s.y + 14 + k * 15 + hash(k * 7) * 6;
      ctx.fillStyle = alpha(k % 2 ? '#ffd9a8' : '#3a120a', 0.1 + hash(k) * 0.08);
      ctx.beginPath();
      ctx.moveTo(sx0, yy);
      for (let x = Math.floor(sx0 / 30) * 30; x <= sx1 + 30; x += 30) ctx.lineTo(x, yy + (hash(x + k * 100) - 0.5) * 3);
      ctx.lineTo(sx1 + 30, yy + 4 + hash(k) * 4);
      ctx.lineTo(sx0, yy + 4 + hash(k) * 4);
      ctx.fill();
    }
    ctx.strokeStyle = alpha('#2a0c05', 0.35);
    ctx.lineWidth = 1.2;
    for (let x = Math.floor(sx0 / 53) * 53; x < sx1; x += 53) {
      if (hash(x * 3) < 0.5) continue;
      ctx.beginPath();
      ctx.moveTo(x, s.y + 8);
      ctx.lineTo(x + 5, s.y + 22);
      ctx.lineTo(x + 1, s.y + 38);
      ctx.stroke();
    }
    ctx.fillStyle = vg(ctx, s.y - 2, s.y + 9, T(G.top2), T(G.top));
    ctx.beginPath();
    ctx.moveTo(sx0, s.y + 9);
    for (let x = Math.floor(sx0 / 8) * 8; x <= sx1; x += 8) ctx.lineTo(Math.min(x, sx1), s.y - 1 - hash(x) * 1.6);
    ctx.lineTo(sx1, s.y + 9);
    ctx.fill();
    ctx.fillStyle = T('#7a3e22');
    for (let x = Math.floor(sx0 / 14) * 14; x < sx1; x += 14) {
      if (hash(x * 7) < 0.6) continue;
      ctx.beginPath();
      ctx.arc(x, s.y - 1, 1.2 + hash(x) * 1.8, Math.PI, 0);
      ctx.fill();
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#200804', 0.55));
  },
  roof(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const id = Math.floor(s.x0);
    const walls = ['#7a4434', '#8c6a4a', '#5e5a5c', '#6e3e3a', '#7d6a58'];
    const wall = T(mix(walls[Math.floor(hash(id) * walls.length)], P.ground.body, 0.25));
    ctx.fillStyle = wall;
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    const brick = hash(id * 3) < 0.55;
    if (brick) {
      ctx.fillStyle = alpha('#000000', 0.12);
      for (let y = s.y + 12, row = 0; y < Math.min(bottom, s.y + 400); y += 6, row++) {
        ctx.fillRect(sx0, y, sx1 - sx0, 1);
        const off = row % 2 ? 7 : 0;
        for (let x = Math.floor((sx0 - off) / 14) * 14 + off; x < sx1; x += 14) ctx.fillRect(x, y - 5, 1, 5);
      }
    }
    // windows
    const cw = 34;
    const startX = Math.floor((sx0 - s.x0) / cw) * cw + s.x0 + 12;
    for (let x = startX; x < sx1 - 10; x += cw) {
      if (x < s.x0 + 10 || x > s.x1 - 22) continue;
      for (let r = 0; r < 4; r++) {
        const y = s.y + 34 + r * 44;
        if (y > bottom) break;
        const lit = hash(x * 7 + r * 131) < 0.32;
        ctx.fillStyle = lit ? P.window : T('#1c1418');
        ctx.fillRect(x, y, 12, 18);
        if (lit) {
          ctx.fillStyle = alpha('#000000', 0.25);
          ctx.fillRect(x + 5.5, y, 1, 18);
        }
        ctx.fillStyle = alpha('#000000', 0.25);
        ctx.fillRect(x - 2, y + 18, 16, 2.5);
      }
    }
    // parapet + roof surface
    ctx.fillStyle = T('#2a2124');
    ctx.fillRect(sx0, s.y, sx1 - sx0, 5);
    ctx.fillStyle = T(mix(P.ground.top2, P.light, 0.15));
    ctx.fillRect(sx0 - (openL && s.x0 >= sx0 ? 3 : 0), s.y - 3, sx1 - sx0 + (openL ? 3 : 0) + (openR ? 3 : 0), 5);
    ctx.fillStyle = alpha(P.light, 0.25);
    ctx.fillRect(sx0, s.y - 3, sx1 - sx0, 1);
    if (hash(id * 9) < 0.6 && s.x1 <= sx1 + 1) {
      ctx.fillStyle = T('#3a3236');
      ctx.fillRect(s.x1 - 10, s.y + 2, 3.5, bottom - s.y);
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.4));
  },
  harbor(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    const wy = GROUND_Y + 62;
    ctx.fillStyle = T('#2a231d');
    for (let x = Math.ceil(s.x0 / 64) * 64 + 10; x < s.x1 - 6; x += 64) {
      if (x < sx0 - 10 || x > sx1 + 10) continue;
      ctx.fillRect(x - 4, s.y + 10, 8, wy - s.y + 6);
      ctx.strokeStyle = alpha('#9db4c8', 0.25);
      ctx.beginPath();
      ctx.ellipse(x, wy + 2, 9, 2, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.strokeStyle = T('#241d18');
    ctx.lineWidth = 2;
    for (let x = Math.ceil(s.x0 / 64) * 64 + 10; x < s.x1 - 70; x += 64) {
      if (x < sx0 - 70 || x > sx1) continue;
      ctx.beginPath();
      ctx.moveTo(x, s.y + 14);
      ctx.lineTo(x + 64, wy - 6);
      ctx.stroke();
    }
    ctx.fillStyle = T('#1c1713');
    ctx.fillRect(sx0, s.y + 9, sx1 - sx0, 8);
    ctx.fillStyle = vg(ctx, s.y - 1, s.y + 10, T(G.top2), T(G.top));
    ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 10);
    ctx.fillStyle = alpha('#000000', 0.45);
    for (let x = Math.floor(sx0 / 22) * 22; x < sx1; x += 22) ctx.fillRect(x, s.y - 1, 1.2, 10);
    ctx.fillStyle = alpha(P.light, 0.2);
    ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 1);
    // rain sheen
    ctx.fillStyle = alpha('#c8d8ea', 0.08);
    for (let x = Math.floor(sx0 / 47) * 47; x < sx1; x += 47) ctx.fillRect(x + hash(x) * 20, s.y + 1, 10 + hash(x * 3) * 20, 1.5);
  },
  snow(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 150, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    ctx.fillStyle = alpha('#d8e6ff', 0.08);
    for (let x = Math.floor(sx0 / 41) * 41; x < sx1; x += 41) {
      if (hash(x) < 0.5) continue;
      ctx.beginPath();
      ctx.moveTo(x, s.y + 20 + hash(x * 3) * 50);
      ctx.lineTo(x + 18, s.y + 28 + hash(x * 5) * 50);
      ctx.lineTo(x + 6, s.y + 40 + hash(x * 7) * 50);
      ctx.fill();
    }
    ctx.fillStyle = vg(ctx, s.y - 6, s.y + 16, G.top, G.top2);
    ctx.beginPath();
    ctx.moveTo(sx0, s.y + 15);
    for (let x = Math.floor(sx0 / 12) * 12; x <= sx1 + 12; x += 12) {
      const xx = clamp(x, sx0, sx1);
      ctx.lineTo(xx, s.y - 2 - Math.sin(x * 0.07) * 1.6 - hash(x) * 2);
    }
    ctx.lineTo(sx1, s.y + 15);
    for (let x = Math.floor(sx1 / 10) * 10; x >= sx0; x -= 10) ctx.lineTo(x, s.y + 13 + hash(x * 3) * 4);
    ctx.fill();
    ctx.fillStyle = alpha('#9db3d6', 0.4);
    ctx.fillRect(sx0, s.y + 11, sx1 - sx0, 2);
    for (let x = Math.floor(sx0 / 13) * 13; x < sx1; x += 13) {
      const h = hash(x * 19);
      if (h < 0.7) continue;
      const tw = 0.5 + 0.5 * Math.sin(t * 4 + x);
      ctx.fillStyle = alpha('#ffffff', tw * 0.9);
      ctx.fillRect(x, s.y + 1 + h * 6, 1.4, 1.4);
    }
    const icicles = (ex, dir) => {
      ctx.fillStyle = alpha('#dceaff', 0.9);
      for (let k = 0; k < 4; k++) {
        const ix = ex + dir * (3 + k * 5);
        const ih = 6 + hash(ix) * 12;
        ctx.beginPath();
        ctx.moveTo(ix - 2, s.y + 13);
        ctx.lineTo(ix + 2, s.y + 13);
        ctx.lineTo(ix, s.y + 13 + ih);
        ctx.fill();
      }
    };
    if (openL && s.x0 >= sx0) icicles(s.x0, 1);
    if (openR && s.x1 <= sx1) icicles(s.x1, -1);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#0a1020', 0.45));
  },
};

// ---------------------------------------------------------------- obstacles

export function woodGrad(ctx, y, h, T, light = '#94693f', mid = '#6b4628', dark = '#3b2516') {
  return vg(ctx, y, y + h, T(light), T(mid), T(dark));
}

function drawBale(ctx, x, y, w, h, T, seed) {
  ctx.fillStyle = vg(ctx, y, y + h, T('#e6c271'), T('#c49a45'), T('#8c6a28'));
  rr(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = alpha(T('#fff0b8'), 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < Math.floor(w * h * 0.012); i++) {
    const sx = x + 3 + hash(seed + i) * (w - 8);
    const sy = y + 3 + hash(seed + i * 7) * (h - 6);
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 4 + hash(i * 3) * 5, sy + (hash(i * 5) - 0.5) * 3);
  }
  ctx.stroke();
  ctx.strokeStyle = T('#6a4a1c');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + 1);
  ctx.lineTo(x + w * 0.3, y + h - 1);
  ctx.moveTo(x + w * 0.7, y + 1);
  ctx.lineTo(x + w * 0.7, y + h - 1);
  ctx.stroke();
}

export function drawRock(ctx, o, T, base, snow, moss, light) {
  if (!o._pts) o._pts = blobPts(o.seed, 9, o.w, o.h);
  const g = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
  g.addColorStop(0, T(mix(base, light, 0.35)));
  g.addColorStop(1, T(mix(base, '#000000', 0.35)));
  ctx.fillStyle = g;
  poly(ctx, o.x, o.y, o._pts);
  ctx.fill();
  ctx.strokeStyle = alpha('#000000', 0.25);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(o.x + o.w * 0.35, o.y + o.h * 0.2);
  ctx.lineTo(o.x + o.w * 0.45, o.y + o.h * 0.55);
  ctx.lineTo(o.x + o.w * 0.4, o.y + o.h * 0.9);
  ctx.stroke();
  if (moss || snow) {
    ctx.save();
    poly(ctx, o.x, o.y, o._pts);
    ctx.clip();
    ctx.fillStyle = snow ? '#eef4fc' : T('#5b7a32');
    ctx.beginPath();
    ctx.moveTo(o.x - 2, o.y);
    for (let k = 0; k <= 8; k++) ctx.lineTo(o.x + (o.w * k) / 8, o.y + o.h * (snow ? 0.28 : 0.18) + hash(o.seed + k) * 6);
    ctx.lineTo(o.x + o.w + 2, o.y);
    ctx.fill();
    ctx.restore();
  }
}

export function backPost(ctx, x, yTop, yBot, w, col) {
  ctx.fillStyle = col;
  ctx.fillRect(x - w / 2, yTop, w, yBot - yTop);
}

const OB = {
  log(ctx, o, T) {
    const { x, y, w, h } = o;
    const r = h / 2;
    ctx.fillStyle = woodGrad(ctx, y, h, T);
    rr(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.strokeStyle = alpha(T('#24160c'), 0.6);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      const yy = y + h * (0.2 + i * 0.19);
      ctx.beginPath();
      ctx.moveTo(x + r, yy);
      for (let xx = x + r; xx < x + w - r * 0.5; xx += 8) ctx.lineTo(xx, yy + (hash(o.seed + (xx | 0)) - 0.5) * 2.6);
      ctx.stroke();
    }
    ctx.fillStyle = T('#c99c66');
    ctx.beginPath();
    ctx.ellipse(x + r * 0.62, y + r, r * 0.55, r * 0.92, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#8f6639');
    ctx.lineWidth = 1;
    for (const k of [0.66, 0.4, 0.16]) {
      ctx.beginPath();
      ctx.ellipse(x + r * 0.62, y + r, r * 0.55 * k, r * 0.92 * k, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = T('#5a3a22');
    ctx.beginPath();
    ctx.moveTo(x + w * 0.62, y + 2);
    ctx.lineTo(x + w * 0.67, y - 7);
    ctx.lineTo(x + w * 0.71, y + 3);
    ctx.fill();
  },
  trunk(ctx, o, T, P, t, st) {
    OB.log(ctx, o, T);
    ctx.fillStyle = T('#56722e');
    ctx.beginPath();
    ctx.moveTo(o.x + o.h * 0.6, o.y + 3);
    for (let k = 0; k <= 10; k++) ctx.lineTo(o.x + o.h * 0.6 + ((o.w - o.h) * k) / 10, o.y + 1 - hash(o.seed + k) * 3);
    ctx.lineTo(o.x + o.w - o.h * 0.3, o.y + 5);
    ctx.fill();
  },
  haybale(ctx, o, T) {
    drawBale(ctx, o.x, o.y, o.w, o.h, T, o.seed);
  },
  bales(ctx, o, T) {
    const hh = o.h / 2;
    const bw = o.w / 2;
    drawBale(ctx, o.x, o.y + hh, bw, hh, T, o.seed);
    drawBale(ctx, o.x + bw, o.y + hh, bw, hh, T, o.seed + 3);
    drawBale(ctx, o.x + bw * 0.45, o.y, bw * 1.1, hh, T, o.seed + 7);
    if (o.w > 140) drawBale(ctx, o.x + bw * 1.55, o.y + 6, bw * 0.45, hh - 6, T, o.seed + 9);
  },
  rock(ctx, o, T, P, t, st) {
    const base = { canyon: '#a0583a', snow: '#5a6478', dunes: '#b88a5a', savanna: '#8a5a3e', ruins: '#7a7666', terraces: '#6e6c62', maple: '#7a6a5e', summit: '#4e566c', bonfire: '#5a5a62' }[st.terrain] || '#7d7a72';
    drawRock(ctx, o, T, base, st.terrain === 'snow' || st.terrain === 'summit', st.terrain === 'forest' || st.terrain === 'ruins' || st.terrain === 'terraces' || st.terrain === 'maple', P.light);
  },
  boulderBig(ctx, o, T, P) {
    drawRock(ctx, o, T, '#6f6e66', false, true, P.light);
  },
  rockSnow(ctx, o, T, P) {
    drawRock(ctx, o, T, '#4f5a70', true, false, P.light);
  },
  fence(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = T('#7d6650');
    for (const px of [x + 3, x + w / 2 - 3, x + w - 9]) {
      ctx.fillRect(px, y - 4, 6, h + 4);
      ctx.beginPath();
      ctx.moveTo(px, y - 4);
      ctx.lineTo(px + 3, y - 8);
      ctx.lineTo(px + 6, y - 4);
      ctx.fill();
    }
    ctx.fillStyle = woodGrad(ctx, y, h, T, '#a28a6c', '#7d6650', '#5a4634');
    ctx.fillRect(x, y + h * 0.18, w, 6);
    ctx.fillRect(x, y + h * 0.58, w, 6);
    ctx.fillStyle = alpha('#000000', 0.2);
    ctx.fillRect(x, y + h * 0.18 + 5, w, 1);
    ctx.fillRect(x, y + h * 0.58 + 5, w, 1);
  },
  stump(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = woodGrad(ctx, y, h, T, '#7a5636', '#5a3c24', '#3a2616');
    ctx.beginPath();
    ctx.moveTo(x - 6, y + h);
    ctx.quadraticCurveTo(x + 2, y + h - 6, x + 3, y + 4);
    ctx.lineTo(x + w - 3, y + 4);
    ctx.quadraticCurveTo(x + w - 2, y + h - 6, x + w + 6, y + h);
    ctx.fill();
    ctx.strokeStyle = alpha('#000000', 0.25);
    ctx.lineWidth = 1;
    for (let k = 1; k < 5; k++) {
      const xx = x + (w * k) / 5;
      ctx.beginPath();
      ctx.moveTo(xx, y + 6);
      ctx.lineTo(xx + (hash(o.seed + k) - 0.5) * 3, y + h - 2);
      ctx.stroke();
    }
    ctx.fillStyle = T('#c9a06a');
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 4, w / 2 - 2, 4.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#8f6639');
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 4, w / 4, 2.2, 0, 0, TAU);
    ctx.stroke();
  },
  cactus(ctx, o, T) {
    const { x, y, w, h } = o;
    const cx = x + w / 2;
    const dark = T('#2f4f22');
    const g = ctx.createLinearGradient(cx - 8, 0, cx + 8, 0);
    g.addColorStop(0, T('#6f9a4a'));
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    rr(ctx, cx - 7, y, 14, h, 7);
    ctx.fill();
    ctx.strokeStyle = g;
    ctx.lineCap = 'round';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx - 6, y + h * 0.55);
    ctx.lineTo(x + 2, y + h * 0.55);
    ctx.lineTo(x + 2, y + h * 0.28);
    ctx.moveTo(cx + 6, y + h * 0.42);
    ctx.lineTo(x + w - 2, y + h * 0.42);
    ctx.lineTo(x + w - 2, y + h * 0.16);
    ctx.stroke();
    ctx.strokeStyle = alpha('#d8f0b0', 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 2, y + 4);
    ctx.lineTo(cx - 2, y + h - 2);
    ctx.moveTo(cx + 3, y + 4);
    ctx.lineTo(cx + 3, y + h - 2);
    ctx.stroke();
    ctx.fillStyle = alpha('#fff6d8', 0.8);
    for (let k = 0; k < 14; k++) {
      const yy = y + 4 + (k / 14) * (h - 8);
      ctx.fillRect(cx - 9, yy, 2, 1);
      ctx.fillRect(cx + 7, yy + 3, 2, 1);
    }
  },
  mesaBlock(ctx, o, T, P) {
    const { x, y, w, h } = o;
    if (!o._pts) {
      const rng = mulberry32(o.seed);
      o._pts = [[-3, h], [2, h * 0.45], [-1, h * 0.2], [4, 0], [w * 0.4, -2 * rng()], [w - 6, 0], [w + 1, h * 0.25], [w - 2, h * 0.6], [w + 3, h]];
    }
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, T(mix('#c9784a', P.light, 0.25)));
    g.addColorStop(1, T('#7a3a20'));
    ctx.fillStyle = g;
    poly(ctx, x, y, o._pts);
    ctx.fill();
    ctx.save();
    poly(ctx, x, y, o._pts);
    ctx.clip();
    for (let k = 0; k < 7; k++) {
      ctx.fillStyle = alpha(k % 2 ? '#ffe0b8' : '#3a1006', 0.14);
      ctx.fillRect(x - 4, y + 8 + k * (h / 7), w + 8, 3 + hash(o.seed + k) * 3);
    }
    ctx.fillStyle = T('#e8b77e');
    ctx.fillRect(x - 4, y - 2, w + 8, 4);
    ctx.restore();
  },
  vent(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = vg(ctx, y, y + h, T('#8a8f96'), T('#5d6168'));
    ctx.fillRect(x + 4, y + 8, w - 8, h - 8);
    ctx.fillStyle = T('#9aa0a8');
    rr(ctx, x, y, w, 10, 4);
    ctx.fill();
    ctx.fillStyle = alpha('#000000', 0.35);
    for (let yy = y + 14; yy < y + h - 3; yy += 5) ctx.fillRect(x + 7, yy, w - 14, 2);
  },
  acunit(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = vg(ctx, y, y + h, T('#b4b6b0'), T('#7c7f7a'));
    rr(ctx, x, y, w, h, 3);
    ctx.fill();
    const r = Math.min(h, w * 0.6) * 0.36;
    const cx = x + w * 0.38;
    const cy = y + h * 0.52;
    ctx.fillStyle = T('#3d403e');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#8d908b');
    ctx.lineWidth = 1;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * (0.25 + k * 0.17), 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = alpha('#000000', 0.2);
    for (let yy = y + 6; yy < y + h - 4; yy += 4) ctx.fillRect(x + w * 0.72, yy, w * 0.2, 1.5);
  },
  chimney(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    ctx.fillStyle = T('#7a3e30');
    ctx.fillRect(x, y + 8, w, h - 8);
    ctx.fillStyle = alpha('#000000', 0.18);
    for (let yy = y + 14, row = 0; yy < y + h; yy += 7, row++) {
      ctx.fillRect(x, yy, w, 1);
      for (let xx = x + (row % 2 ? 6 : 0); xx < x + w; xx += 12) ctx.fillRect(xx, yy - 6, 1, 6);
    }
    ctx.fillStyle = T('#5a5354');
    ctx.fillRect(x - 4, y + 4, w + 8, 6);
    ctx.fillStyle = T('#8a4a36');
    ctx.fillRect(x + w * 0.2, y - 6, 9, 10);
    ctx.fillRect(x + w * 0.6, y - 4, 9, 8);
    for (let k = 0; k < 4; k++) {
      const p = fract(t * 0.35 + k / 4 + hash(o.seed) * 0.3);
      ctx.fillStyle = alpha('#d8cfd6', 0.22 * (1 - p));
      ctx.beginPath();
      ctx.arc(x + w * 0.25 + p * 30, y - 8 - p * 60, 5 + p * 14, 0, TAU);
      ctx.fill();
    }
  },
  crate(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = woodGrad(ctx, y, h, T, '#a4824f', '#8a6a3c', '#5e4626');
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = alpha('#000000', 0.25);
    for (let yy = y + h / 4; yy < y + h; yy += h / 4) ctx.fillRect(x, yy, w, 1.2);
    ctx.strokeStyle = T('#5a4224');
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h - 4);
    ctx.lineTo(x + w - 4, y + 4);
    ctx.stroke();
    ctx.fillStyle = alpha('#1a1208', 0.45);
    ctx.fillRect(x + w * 0.58, y + h * 0.62, w * 0.24, 3);
  },
  crates2(ctx, o, T) {
    const hw = o.w / 2;
    const hh = o.h / 2;
    OB.crate(ctx, { x: o.x, y: o.y + hh, w: hw, h: hh }, T);
    OB.crate(ctx, { x: o.x + hw, y: o.y + hh, w: hw, h: hh }, T);
    OB.crate(ctx, { x: o.x + hw * 0.5, y: o.y, w: hw, h: hh }, T);
    if (hash(o.seed) < 0.5) OB.crate(ctx, { x: o.x + hw * 1.5 - 4, y: o.y + 10, w: hw * 0.5 + 4, h: hh - 10 }, T);
  },
  barrels(ctx, o, T) {
    const bw = o.w / 2 - 1;
    const cols = ['#7a3a2c', '#2d4a5a', '#5a5a3a'];
    for (let k = 0; k < 2; k++) {
      const x = o.x + k * (bw + 2);
      const col = cols[(o.seed + k) % 3];
      const g = ctx.createLinearGradient(x, 0, x + bw, 0);
      g.addColorStop(0, T(mix(col, '#ffffff', 0.2)));
      g.addColorStop(1, T(mix(col, '#000000', 0.45)));
      ctx.fillStyle = g;
      rr(ctx, x, o.y + 3, bw, o.h - 3, 5);
      ctx.fill();
      ctx.fillStyle = alpha('#000000', 0.35);
      ctx.fillRect(x, o.y + o.h * 0.28, bw, 2.5);
      ctx.fillRect(x, o.y + o.h * 0.7, bw, 2.5);
      ctx.fillStyle = T(mix(col, '#000000', 0.2));
      ctx.beginPath();
      ctx.ellipse(x + bw / 2, o.y + 4, bw / 2, 3.5, 0, 0, TAU);
      ctx.fill();
    }
  },
  container(ctx, o, T) {
    const { x, y, w, h } = o;
    const cols = ['#8a3a2a', '#2a5a62', '#3a4a7a', '#6a6a2a'];
    const col = cols[o.seed % cols.length];
    ctx.fillStyle = vg(ctx, y, y + h, T(mix(col, '#ffffff', 0.12)), T(mix(col, '#000000', 0.35)));
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = alpha('#000000', 0.28);
    for (let xx = x + 4; xx < x + w - 2; xx += 5) ctx.fillRect(xx, y + 4, 1.4, h - 8);
    ctx.fillStyle = alpha('#ffffff', 0.12);
    ctx.fillRect(x, y, w, 2);
    ctx.strokeStyle = T(mix(col, '#000000', 0.5));
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    ctx.fillStyle = alpha('#f0e6d0', 0.5);
    ctx.fillRect(x + w * 0.15, y + h * 0.4, w * 0.3, 5);
  },
  drift(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = vg(ctx, y, y + h, '#f6f9fe', '#c4d3ea');
    ctx.beginPath();
    ctx.moveTo(x - 8, y + h);
    ctx.bezierCurveTo(x + w * 0.1, y - 2, x + w * 0.6, y - h * 0.15, x + w * 0.75, y + h * 0.12);
    ctx.bezierCurveTo(x + w * 0.9, y + h * 0.3, x + w, y + h * 0.7, x + w + 8, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha('#8aa2c8', 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h * 0.5);
    ctx.quadraticCurveTo(x + w * 0.55, y + h * 0.3, x + w * 0.8, y + h * 0.55);
    ctx.stroke();
  },
  iceblock(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = vg(ctx, y, y + h, 'rgba(210,235,255,0.95)', 'rgba(120,170,220,0.9)');
    rr(ctx, x, y, w, h, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h - 6);
    ctx.lineTo(x + 4, y + 4);
    ctx.lineTo(x + w - 8, y + 4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(80,120,170,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.6, y + 6);
    ctx.lineTo(x + w * 0.5, y + h * 0.5);
    ctx.lineTo(x + w * 0.7, y + h - 4);
    ctx.stroke();
    ctx.fillStyle = '#f4f8ff';
    ctx.fillRect(x - 1, y - 2, w + 2, 4);
  },
  // ---------- overhead
  branch(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // the parent tree stands just behind the path; its low bough reaches across it
    const tx = x + w + 26;
    const back = T(mix('#3a2a1e', P.haze, 0.22));
    ctx.fillStyle = back;
    ctx.beginPath();
    ctx.moveTo(tx - 16, o.ground);
    ctx.lineTo(tx - 10, y - 420);
    ctx.lineTo(tx + 14, y - 420);
    ctx.lineTo(tx + 20, o.ground);
    ctx.fill();
    const wood = T('#4a3424');
    ctx.fillStyle = wood;
    ctx.beginPath();
    ctx.moveTo(tx - 6, y - 6);
    ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.1, x - 26, y + h * 0.32);
    ctx.lineTo(x - 26, y + h * 0.42);
    ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.5, tx - 6, y + 12);
    ctx.fill();
    ctx.strokeStyle = wood;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      const bx = x + (w * (k + 0.5)) / 4;
      ctx.beginPath();
      ctx.moveTo(bx, y + h * 0.3);
      ctx.lineTo(bx - 10, y + h * 0.62);
      ctx.stroke();
    }
    const leaves = [T('#2f4a26'), T('#3d5c2e'), T('#4f7034')];
    for (let k = 0; k < 18; k++) {
      const lx = x - 22 + hash(o.seed + k) * (w + 30);
      const ly = y + h * 0.28 + hash(o.seed + k * 7) * h * 0.6;
      ctx.fillStyle = leaves[k % 3];
      ctx.beginPath();
      ctx.arc(lx, ly, 6 + hash(k * 3 + o.seed) * 7, 0, TAU);
      ctx.fill();
    }
  },
  fallen(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const back = T(mix('#3a2a1c', P.haze, 0.35));
    backPost(ctx, x + 6, y + h - 4, o.ground, 12, back);
    backPost(ctx, x + w - 10, y + h - 4, o.ground, 14, back);
    OB.log(ctx, { x: x - 18, y, w: w + 36, h, seed: o.seed }, T);
    ctx.fillStyle = T('#56722e');
    ctx.fillRect(x, y - 1, w * 0.7, 3);
  },
  timber(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const back = T(mix('#5a3a22', P.haze, 0.3));
    backPost(ctx, x + 5, y, o.ground, 9, back);
    backPost(ctx, x + w - 5, y, o.ground, 9, back);
    ctx.fillStyle = woodGrad(ctx, y, h, T, '#a07048', '#7a5232', '#4a301c');
    ctx.fillRect(x - 14, y, w + 28, h);
    ctx.fillStyle = alpha('#000000', 0.3);
    ctx.fillRect(x - 14, y + h - 3, w + 28, 3);
    ctx.fillStyle = T('#3a3a3a');
    ctx.fillRect(x - 6, y + 5, 6, h - 10);
    ctx.fillRect(x + w, y + 5, 6, h - 10);
  },
  laundry(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    const pole = T('#3a3436');
    backPost(ctx, x - 12, y - 30, o.ground, 4, pole);
    backPost(ctx, x + w + 12, y - 30, o.ground, 4, pole);
    ctx.strokeStyle = T('#d8d0c4');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 26);
    ctx.quadraticCurveTo(x + w / 2, y + 6, x + w + 12, y - 26);
    ctx.stroke();
    const sheets = ['#efe6d6', '#b9c9d6', '#d99a7a', '#e8d38a', '#a8c0a0'];
    const n = Math.max(2, Math.round(w / 48));
    const sw = w / n;
    for (let k = 0; k < n; k++) {
      const sx = x + k * sw + 2;
      const lineY = (u) => y - 26 + 32 * (1 - Math.pow((u - x - w / 2) / (w / 2 + 12), 2));
      const top0 = lineY(sx);
      const top1 = lineY(sx + sw - 4);
      const col = T(sheets[(o.seed + k) % sheets.length]);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(sx, top0);
      ctx.lineTo(sx + sw - 4, top1);
      const wv = Math.sin(t * 3 + k) * 3;
      ctx.lineTo(sx + sw - 4 - wv, y + h);
      ctx.quadraticCurveTo(sx + sw / 2, y + h + 3 + wv, sx - wv * 0.5, y + h - 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = alpha('#000000', 0.12);
      ctx.fillRect(sx + sw * 0.55, top0 + 2, 2, y + h - top0 - 3);
      ctx.fillStyle = T('#6a5a4a');
      ctx.fillRect(sx + 3, top0 - 3, 2, 6);
      ctx.fillRect(sx + sw - 9, top1 - 3, 2, 6);
    }
  },
  pipe(ctx, o, T, P, t, st) {
    const { x, y, w, h } = o;
    const metal = st.terrain === 'harbor' ? '#6a5a4a' : '#7a7c80';
    ctx.fillStyle = T('#3a3a3c');
    ctx.fillRect(x + 8, y - 420, 3, 420);
    ctx.fillRect(x + w - 11, y - 420, 3, 420);
    ctx.fillStyle = vg(ctx, y, y + h, T(mix(metal, '#ffffff', 0.35)), T(metal), T(mix(metal, '#000000', 0.5)));
    ctx.fillRect(x - 20, y, w + 40, h);
    ctx.fillStyle = T(mix(metal, '#000000', 0.25));
    for (let xx = x; xx < x + w; xx += 60) ctx.fillRect(xx, y - 2, 6, h + 4);
    if (st.terrain === 'harbor') {
      for (let k = 0; k < 3; k++) {
        const p = fract(t * 1.2 + k / 3 + hash(o.seed) * 0.5);
        ctx.fillStyle = alpha('#b8cce0', 0.7 * (1 - p));
        ctx.fillRect(x + w * (0.25 + k * 0.25), y + h + p * 40, 1.5, 4);
      }
    }
  },
  icebeam(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const back = T(mix('#3a4256', P.haze, 0.3));
    backPost(ctx, x + 6, y, o.ground, 10, back);
    backPost(ctx, x + w - 6, y, o.ground, 10, back);
    OB.log(ctx, { x: x - 14, y: y + 4, w: w + 28, h: h - 10, seed: o.seed }, T);
    ctx.fillStyle = '#f2f6fd';
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 8);
    for (let k = 0; k <= 10; k++) ctx.lineTo(x - 14 + ((w + 28) * k) / 10, y + 1 - hash(o.seed + k) * 4);
    ctx.lineTo(x + w + 16, y + 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(220,236,255,0.92)';
    for (let k = 0; k < 9; k++) {
      const ix = x + (w * (k + 0.5)) / 9;
      ctx.beginPath();
      ctx.moveTo(ix - 2.5, y + h - 7);
      ctx.lineTo(ix + 2.5, y + h - 7);
      ctx.lineTo(ix, y + h - 1 + hash(o.seed + k) * 2);
      ctx.fill();
    }
  },
};

export function drawObstacles(ctx, L, look, view, cam, t) {
  const x0 = cam.x - 120;
  const x1 = cam.x + view.w + 140;
  const obs = L.obstacles;
  for (let i = obstacleStart(L, x0); i < obs.length; i++) {
    const o = obs[i];
    if (o.x > x1) break;
    if (o.x + o.w < x0) continue;
    const f = OB[o.skin] || WORLD_OB[o.skin] || SKY_OB[o.skin] || SEA_OB[o.skin];
    if (!f) continue;
    const k = look(o.th);
    f(ctx, o, k.T, k.P, t, k.st);
  }
}

// ---------------------------------------------------------------- movers

const tmp = {};
export function drawMovers(ctx, L, look, view, cam, d, t) {
  const x0 = cam.x - 200;
  const x1 = cam.x + view.w + 200;
  for (const m of L.movers) {
    if (m.cx < x0 - 1600 || m.cx > x1 + 1600) continue;
    const s = moverState(m, d, tmp);
    if (s.x < x0 || s.x > x1) continue;
    const { T, P } = look(m.th);
    if (m.type === 'roller') drawRoller(ctx, m, s, T, P);
    else if (m.type === 'swing') drawSwing(ctx, m, s, T, P, t);
    else if (!skyDrop(ctx, m, s, T, t, P) && !seaDrop(ctx, m, s, T, t, P)) drawIcicle(ctx, m, s, T, t);
  }
}

function drawRoller(ctx, m, s, T, P) {
  const { x, y, r, rot } = s;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = alpha('#000000', 0.25);
  ctx.beginPath();
  ctx.ellipse(0, r - 1, r * 0.9, 3, 0, 0, TAU);
  ctx.fill();
  ctx.rotate(rot);
  if (worldRoller(ctx, m, r, T, P) || skyRoller(ctx, m, r, T, P) || seaRoller(ctx, m, r, T, P)) {
    /* chapter 2 skins */
  } else if (m.skin === 'hayroll') {
    ctx.fillStyle = T('#d9b466');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#9c7a34');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let a = 0; a < TAU * 3; a += 0.2) {
      const rr2 = (a / (TAU * 3)) * r;
      ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
    }
    ctx.stroke();
  } else if (m.skin === 'snowball') {
    ctx.fillStyle = '#f2f6fc';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(150,175,215,0.55)';
    for (let k = 0; k < 6; k++) {
      const a = k * 1.1;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.18, 0, TAU);
      ctx.fill();
    }
  } else if (m.skin === 'boulder') {
    ctx.fillStyle = T(P.boulder || '#8a4a30');
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU;
      const rr2 = r * (0.9 + hash(m.seed + k) * 0.14);
      ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha('#2a0c05', 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.2);
    ctx.lineTo(r * 0.1, r * 0.05);
    ctx.lineTo(r * 0.3, r * 0.6);
    ctx.stroke();
  } else {
    const barrel = m.skin === 'barrel';
    ctx.fillStyle = barrel ? T('#7a5232') : T('#b88a58');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = barrel ? T('#2a2a2a') : T('#6a4626');
    ctx.lineWidth = barrel ? 3 : 1;
    ctx.beginPath();
    ctx.arc(0, 0, r - 2, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 1;
    for (const k of barrel ? [0.55] : [0.7, 0.45, 0.2]) {
      ctx.beginPath();
      ctx.arc(0, 0, r * k, 0, TAU);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, 0);
    ctx.lineTo(r * 0.8, 0);
    ctx.stroke();
  }
  ctx.restore();
  // light from above
  ctx.fillStyle = alpha(P.light, 0.12);
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.55, 0, TAU);
  ctx.fill();
}

function drawSwing(ctx, m, s, T, P, t) {
  if (worldSwing(ctx, m, s, T, P, t) || seaSwing(ctx, m, s, T, P, t)) return;
  const ax = m.ax;
  const ay = m.ay - 260;
  const dx = s.x - m.ax;
  const dy = s.y - m.ay;
  ctx.strokeStyle = T('#2e2e30');
  ctx.lineWidth = 2;
  const steps = 26;
  for (let k = 0; k < steps; k++) {
    const u = k / steps;
    const px = m.ax + dx * u;
    const py = m.ay + dy * u;
    ctx.beginPath();
    if (k % 2) ctx.ellipse(px, py, 1.6, 3.4, Math.atan2(dy, dx) + Math.PI / 2, 0, TAU);
    else ctx.ellipse(px, py, 3.4, 1.6, Math.atan2(dy, dx) + Math.PI / 2, 0, TAU);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(ax + (m.ax - ax), ay);
  ctx.lineTo(m.ax, m.ay);
  ctx.stroke();
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(-s.th);
  ctx.fillStyle = vg(ctx, -16, 10, T('#e0a33a'), T('#9a6418'));
  rr(ctx, -12, -16, 24, 18, 4);
  ctx.fill();
  ctx.fillStyle = T('#2a2a2a');
  ctx.beginPath();
  ctx.arc(0, -7, 4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = T('#5a5c60');
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(0, 8);
  ctx.arc(-5, 8, 5, 0, Math.PI * 0.95);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = alpha(P.light, 0.15);
  ctx.beginPath();
  ctx.arc(s.x - 3, s.y - 10, 7, 0, TAU);
  ctx.fill();
}

function drawIcicle(ctx, m, s, T, t) {
  const lx = m.x;
  const ly = m.y0 - 8;
  ctx.fillStyle = '#3a4560';
  ctx.beginPath();
  ctx.moveTo(lx - 70, ly - 40);
  ctx.lineTo(lx + 70, ly - 46);
  ctx.lineTo(lx + 60, ly + 2);
  ctx.quadraticCurveTo(lx, ly + 10, lx - 62, ly + 2);
  ctx.fill();
  ctx.fillStyle = '#eef4fc';
  ctx.fillRect(lx - 72, ly - 46, 144, 7);
  const sh = s.shake ? Math.sin(t * 90) * 1.6 * s.shake : 0;
  const x = s.x + sh;
  const y = s.y;
  const g = ctx.createLinearGradient(x - 8, 0, x + 8, 0);
  g.addColorStop(0, 'rgba(240,248,255,0.98)');
  g.addColorStop(1, 'rgba(140,180,230,0.95)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - m.w / 2, y);
  ctx.lineTo(x + m.w / 2, y);
  ctx.lineTo(x + 1, y + m.h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 3, y + 3);
  ctx.lineTo(x - 0.5, y + m.h * 0.7);
  ctx.stroke();
  if (s.landed) {
    ctx.fillStyle = 'rgba(230,242,255,0.9)';
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x - 10 + k * 6, m.ground);
      ctx.lineTo(x - 8 + k * 6, m.ground - 4 - hash(m.seed + k) * 4);
      ctx.lineTo(x - 6 + k * 6, m.ground);
      ctx.fill();
    }
  }
}

// ---------------------------------------------------------------- decor

const DECOR = {
  grass(ctx, d, T, P) {
    ctx.strokeStyle = T(P.ground.top2);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let k = 0; k < 7; k++) {
      const l = (k - 3) * 2.2 * d.s;
      ctx.moveTo(d.x + k * 1.5, d.y);
      ctx.quadraticCurveTo(d.x + k * 1.5 + l * 0.3, d.y - 8 * d.s, d.x + k * 1.5 + l, d.y - (10 + hash(d.seed + k) * 9) * d.s);
    }
    ctx.stroke();
  },
  flowers(ctx, d, T) {
    const cols = ['#f2d27a', '#e8a0a0', '#f4f0e6', '#c8a8e0'];
    for (let k = 0; k < 4; k++) {
      const x = d.x + k * 4;
      const h = (8 + hash(d.seed + k) * 9) * d.s;
      ctx.strokeStyle = T('#4a6a30');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, d.y);
      ctx.lineTo(x + 1, d.y - h);
      ctx.stroke();
      ctx.fillStyle = T(cols[(d.seed + k) % 4]);
      ctx.beginPath();
      ctx.arc(x + 1, d.y - h, 2.2, 0, TAU);
      ctx.fill();
    }
  },
  stone(ctx, d, T) {
    ctx.fillStyle = T('#8a857a');
    ctx.beginPath();
    ctx.ellipse(d.x, d.y - 2, 6 * d.s, 4 * d.s, 0, Math.PI, 0);
    ctx.fill();
  },
  post(ctx, d, T) {
    ctx.fillStyle = T('#5a4634');
    ctx.fillRect(d.x, d.y - 26 * d.s, 4, 26 * d.s);
    ctx.strokeStyle = alpha(T('#5a4634'), 0.6);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(d.x + 2, d.y - 20 * d.s);
    ctx.lineTo(d.x + 60, d.y - 18 * d.s);
    ctx.stroke();
  },
  fern(ctx, d, T, P) {
    ctx.strokeStyle = T('#3f5f2e');
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + (k / 5 - 0.5) * 2.2;
      const s = 12 * d.s;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.quadraticCurveTo(d.x + Math.cos(a) * s * 0.6, d.y + Math.sin(a) * s, d.x + Math.cos(a) * s * 1.2, d.y + Math.sin(a) * s * 0.5);
      ctx.stroke();
    }
    void P;
  },
  mushroom(ctx, d, T) {
    ctx.fillStyle = T('#e8dcc8');
    ctx.fillRect(d.x - 1.5, d.y - 7 * d.s, 3, 7 * d.s);
    ctx.fillStyle = T('#b8432e');
    ctx.beginPath();
    ctx.ellipse(d.x, d.y - 7 * d.s, 6 * d.s, 4 * d.s, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = T('#f4ece0');
    ctx.fillRect(d.x - 3, d.y - 9 * d.s, 1.5, 1.5);
    ctx.fillRect(d.x + 2, d.y - 10 * d.s, 1.5, 1.5);
  },
  pebbles(ctx, d, T) {
    ctx.fillStyle = T('#8a5a3a');
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.ellipse(d.x + k * 5, d.y - 1, 2 + hash(d.seed + k) * 2, 1.6, 0, Math.PI, 0);
      ctx.fill();
    }
  },
  bush(ctx, d, T) {
    ctx.strokeStyle = T('#6a5a3a');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (hash(d.seed + k) - 0.5) * 2.4;
      const s = (8 + hash(d.seed * 3 + k) * 8) * d.s;
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + Math.cos(a) * s, d.y + Math.sin(a) * s);
    }
    ctx.stroke();
  },
  cactusSmall(ctx, d, T) {
    ctx.fillStyle = T('#5a7a3a');
    rr(ctx, d.x - 3, d.y - 16 * d.s, 6, 16 * d.s, 3);
    ctx.fill();
    rr(ctx, d.x + 3, d.y - 11 * d.s, 5, 3, 1.5);
    ctx.fill();
    rr(ctx, d.x + 6, d.y - 15 * d.s, 3, 6, 1.5);
    ctx.fill();
  },
  antenna(ctx, d, T) {
    ctx.strokeStyle = T('#2a2228');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x, d.y - 34 * d.s);
    ctx.moveTo(d.x - 9, d.y - 28 * d.s);
    ctx.lineTo(d.x + 9, d.y - 28 * d.s);
    ctx.moveTo(d.x - 6, d.y - 22 * d.s);
    ctx.lineTo(d.x + 6, d.y - 22 * d.s);
    ctx.stroke();
  },
  pots(ctx, d, T) {
    ctx.fillStyle = T('#a5523a');
    ctx.beginPath();
    ctx.moveTo(d.x - 6, d.y - 10);
    ctx.lineTo(d.x + 6, d.y - 10);
    ctx.lineTo(d.x + 4, d.y);
    ctx.lineTo(d.x - 4, d.y);
    ctx.fill();
    ctx.fillStyle = T('#4f6a3a');
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.arc(d.x - 4 + k * 2, d.y - 12 - hash(d.seed + k) * 6, 3, 0, TAU);
      ctx.fill();
    }
  },
  dish(ctx, d, T) {
    ctx.strokeStyle = T('#2a2228');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x, d.y - 12);
    ctx.stroke();
    ctx.fillStyle = T('#9a9890');
    ctx.beginPath();
    ctx.ellipse(d.x - 2, d.y - 18, 4, 9, -0.5, 0, TAU);
    ctx.fill();
  },
  skylight(ctx, d, T, P) {
    ctx.fillStyle = T('#3a3236');
    ctx.fillRect(d.x - 10, d.y - 8, 20, 8);
    ctx.fillStyle = alpha(P.window, 0.6);
    ctx.beginPath();
    ctx.moveTo(d.x - 9, d.y - 8);
    ctx.lineTo(d.x, d.y - 15);
    ctx.lineTo(d.x + 9, d.y - 8);
    ctx.fill();
  },
  bollard(ctx, d, T) {
    ctx.fillStyle = T('#2a2a2c');
    rr(ctx, d.x - 5, d.y - 14, 10, 14, 3);
    ctx.fill();
    ctx.fillRect(d.x - 7, d.y - 15, 14, 3);
  },
  rope(ctx, d, T) {
    ctx.strokeStyle = T('#8a7a5a');
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.ellipse(d.x, d.y - 3 - k * 2, 9 - k * 2, 3, 0, 0, TAU);
      ctx.stroke();
    }
  },
  lamp(ctx, d, T, P) {
    ctx.fillStyle = T('#1e1c1c');
    ctx.fillRect(d.x - 1.5, d.y - 70, 3, 70);
    ctx.fillRect(d.x - 1.5, d.y - 70, 12, 2.5);
    ctx.fillStyle = P.lamp;
    ctx.fillRect(d.x + 7, d.y - 68, 6, 4);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(d.x + 10, d.y - 66, 0, d.x + 10, d.y - 66, 60);
    g.addColorStop(0, alpha(P.lamp, 0.45));
    g.addColorStop(1, alpha(P.lamp, 0));
    ctx.fillStyle = g;
    ctx.fillRect(d.x - 50, d.y - 126, 120, 120);
    const c = ctx.createLinearGradient(0, d.y - 64, 0, d.y);
    c.addColorStop(0, alpha(P.lamp, 0.18));
    c.addColorStop(1, alpha(P.lamp, 0.02));
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(d.x + 7, d.y - 64);
    ctx.lineTo(d.x + 13, d.y - 64);
    ctx.lineTo(d.x + 45, d.y);
    ctx.lineTo(d.x - 25, d.y);
    ctx.fill();
    ctx.restore();
  },
  pine(ctx, d, T) {
    const h = 34 * d.s;
    ctx.fillStyle = T('#24324a');
    ctx.beginPath();
    ctx.moveTo(d.x, d.y - h);
    ctx.lineTo(d.x + h * 0.28, d.y - 3);
    ctx.lineTo(d.x - h * 0.28, d.y - 3);
    ctx.fill();
    ctx.fillStyle = '#eef3fb';
    ctx.beginPath();
    ctx.moveTo(d.x, d.y - h);
    ctx.lineTo(d.x + h * 0.12, d.y - h * 0.6);
    ctx.lineTo(d.x - h * 0.14, d.y - h * 0.58);
    ctx.fill();
  },
  snowRock(ctx, d, T) {
    ctx.fillStyle = T('#4a5468');
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, 9 * d.s, 7 * d.s, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#eef3fb';
    ctx.beginPath();
    ctx.ellipse(d.x, d.y - 5 * d.s, 7 * d.s, 3 * d.s, 0, Math.PI, 0);
    ctx.fill();
  },
};

export function drawDecor(ctx, L, look, view, cam) {
  const x0 = cam.x - 80;
  const x1 = cam.x + view.w + 80;
  const dec = L.decor;
  for (let i = lowerBound(dec, x0); i < dec.length; i++) {
    const d = dec[i];
    if (d.x > x1) break;
    const f = DECOR[d.skin] || WORLD_DECOR[d.skin] || SKY_DECOR[d.skin] || SEA_DECOR[d.skin];
    if (!f) continue;
    const k = look(d.th);
    f(ctx, d, k.T, k.P);
  }
}

/** Endless road: a hand-lettered signpost at the start of each landscape. */
export function drawSigns(ctx, L, look, view, cam) {
  for (const g of L.signs || []) {
    if (g.x < cam.x - 200 || g.x > cam.x + view.w + 60) continue;
    const { st, T } = look(g.stage);
    const x = g.x;
    const y = g.y;
    ctx.fillStyle = T('#4a3424');
    ctx.fillRect(x - 2.5, y - 78, 5, 78);
    ctx.font = '700 17px Caveat, "Segoe Print", cursive';
    const name = st.name;
    const pw = ctx.measureText(name).width + 26;
    ctx.fillStyle = vg(ctx, y - 84, y - 62, T('#b08a5a'), T('#7a5634'));
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 84);
    ctx.lineTo(x - 12 + pw, y - 84);
    ctx.lineTo(x + pw, y - 73);
    ctx.lineTo(x - 12 + pw, y - 62);
    ctx.lineTo(x - 12, y - 62);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = alpha('#000000', 0.25);
    ctx.fillRect(x - 12, y - 63, pw, 1.5);
    ctx.fillStyle = '#2a1a0e';
    ctx.fillText(name, x - 2, y - 67);
    ctx.font = '600 10px "Barlow Condensed", "Arial Narrow", sans-serif';
    const sub = `LEG ${g.leg + 1}`;
    const sw = ctx.measureText(sub).width + 12;
    ctx.fillStyle = T('#8a6a44');
    ctx.fillRect(x - sw / 2, y - 56, sw, 13);
    ctx.fillStyle = '#f3ebdd';
    ctx.fillText(sub, x - sw / 2 + 6, y - 46);
  }
}

/** Endless road: where your best run ended, so you can see yourself beat it. */
export function drawBestFlag(ctx, x, y, t, label) {
  ctx.strokeStyle = 'rgba(243,235,221,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 128);
  ctx.stroke();
  const wv = Math.sin(t * 5) * 3;
  ctx.fillStyle = '#e9b44c';
  ctx.beginPath();
  ctx.moveTo(x + 1, y - 128);
  ctx.quadraticCurveTo(x + 22, y - 124 + wv, x + 44, y - 118 + wv * 1.4);
  ctx.quadraticCurveTo(x + 22, y - 110 + wv, x + 1, y - 106);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#15120f';
  ctx.font = '700 10px "Barlow Condensed", "Arial Narrow", sans-serif';
  ctx.fillText('BEST', x + 6, y - 114 + wv * 0.5);
  if (label) {
    ctx.fillStyle = 'rgba(243,235,221,0.9)';
    ctx.font = '600 12px "Barlow Condensed", "Arial Narrow", sans-serif';
    ctx.fillText(label, x + 6, y - 92);
  }
}

// ---------------------------------------------------------------- collectibles

export function drawCoins(ctx, L, view, cam, t, glow) {
  const x0 = cam.x - 20;
  const x1 = cam.x + view.w + 20;
  const coins = L.coins;
  for (let i = lowerBound(coins, x0); i < coins.length; i++) {
    const c = coins[i];
    if (c.x > x1) break;
    if (c.got) continue;
    const s = Math.cos(t * 3.2 + c.x * 0.013);
    const w = Math.max(1.4, Math.abs(s) * 8.5);
    const y = c.y + Math.sin(t * 2.4 + c.x * 0.02) * 1.6;
    if (glow) {
      const g = ctx.createRadialGradient(c.x, y, 0, c.x, y, 20);
      g.addColorStop(0, 'rgba(255,214,120,0.35)');
      g.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = g;
      ctx.fillRect(c.x - 20, y - 20, 40, 40);
    }
    const g = ctx.createLinearGradient(c.x - w, y - 9, c.x + w, y + 9);
    g.addColorStop(0, '#fff0b0');
    g.addColorStop(0.45, '#f2c14e');
    g.addColorStop(1, '#a8701e');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(c.x, y, w, 8.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#7a4e12';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (Math.abs(s) > 0.35) {
      ctx.strokeStyle = 'rgba(255,246,210,0.8)';
      ctx.beginPath();
      ctx.ellipse(c.x, y, w * 0.58, 5.2, 0, 0, TAU);
      ctx.stroke();
    }
    if (s > 0.93) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(c.x - w * 0.5, y - 5, 1.5, 4);
    }
  }
}

export function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.5, y - s * 1.05, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
  ctx.closePath();
}

export function drawPickups(ctx, L, t) {
  for (let i = 0; i < L.pickups.length; i++) {
    const p = L.pickups[i];
    if (p.got) continue;
    const s = 11 + Math.sin(t * 5) * 1.2;
    const y = p.y + Math.sin(t * 2) * 3;
    const g = ctx.createRadialGradient(p.x, y, 0, p.x, y, 34);
    g.addColorStop(0, 'rgba(255,120,110,0.35)');
    g.addColorStop(1, 'rgba(255,120,110,0)');
    ctx.fillStyle = g;
    ctx.fillRect(p.x - 34, y - 34, 68, 68);
    heartPath(ctx, p.x, y + 3, s);
    ctx.fillStyle = '#e04848';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,215,0.8)';
    ctx.beginPath();
    ctx.ellipse(p.x - s * 0.45, y - s * 0.28, s * 0.18, s * 0.12, -0.6, 0, TAU);
    ctx.fill();
  }
}

// ---------------------------------------------------------------- finish

export function drawFinish(ctx, L, stage, P, T, t, open) {
  const x = L.finishX;
  const y = L.finishY;
  if (stage.id === 'snow') {
    drawCabin(ctx, x + 380, y, T, P, t, open);
  } else if (stage.id === 'lanterns') {
    drawPavilion(ctx, x + 500, y, T, P, t, open);
  } else if (stage.id === 'summit') {
    drawObservatory(ctx, x + 560, y, T, P, t, open);
  } else if (stage.id === 'bonfire') {
    drawBonfire(ctx, x + 560, y, T, P, t, open);
  }
  const post = T('#5a4230');
  ctx.fillStyle = post;
  ctx.fillRect(x - 34, y - 150, 7, 150);
  ctx.fillRect(x + 27, y - 150, 7, 150);
  ctx.fillStyle = T('#3e2e22');
  ctx.fillRect(x - 40, y - 156, 80, 8);
  const cells = 8;
  const cw = 54 / cells;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < cells; c++) {
      const wv = Math.sin(t * 3 + c * 0.7) * 1.5;
      ctx.fillStyle = (r + c) % 2 ? '#f4efe4' : '#1c1a18';
      ctx.fillRect(x - 27 + c * cw, y - 148 + r * 9 + wv, cw + 0.5, 9);
    }
  }
  for (const lx of [x - 30, x + 30]) {
    const g = ctx.createRadialGradient(lx, y - 122, 0, lx, y - 122, 26);
    g.addColorStop(0, 'rgba(255,200,120,0.5)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 26, y - 148, 52, 52);
    ctx.fillStyle = '#ffd38a';
    ctx.fillRect(lx - 3, y - 126, 6, 8);
  }
  ctx.fillStyle = alpha('#ffffff', 0.55);
  ctx.fillRect(x - 2, y - 1, 4, 3);
}

function drawCabin(ctx, x, y, T, P, t, open) {
  const w = 240;
  const h = 110;
  ctx.fillStyle = T('#5a3a24');
  ctx.fillRect(x, y - h, w, h);
  ctx.fillStyle = alpha('#000000', 0.25);
  for (let yy = y - h + 9; yy < y; yy += 11) ctx.fillRect(x, yy, w, 2);
  ctx.fillStyle = T('#3a2618');
  ctx.beginPath();
  ctx.moveTo(x - 20, y - h);
  ctx.lineTo(x + w / 2, y - h - 80);
  ctx.lineTo(x + w + 20, y - h);
  ctx.fill();
  ctx.fillStyle = '#f2f6fd';
  ctx.beginPath();
  ctx.moveTo(x - 24, y - h + 2);
  ctx.lineTo(x + w / 2, y - h - 86);
  ctx.lineTo(x + w + 24, y - h + 2);
  ctx.lineTo(x + w + 16, y - h + 8);
  ctx.lineTo(x + w / 2, y - h - 74);
  ctx.lineTo(x - 16, y - h + 8);
  ctx.fill();
  ctx.fillStyle = T('#5a4a44');
  ctx.fillRect(x + w * 0.7, y - h - 70, 22, 50);
  for (let k = 0; k < 5; k++) {
    const p = fract(t * 0.25 + k / 5);
    ctx.fillStyle = alpha('#e8eef8', 0.3 * (1 - p));
    ctx.beginPath();
    ctx.arc(x + w * 0.7 + 11 - p * 40, y - h - 76 - p * 90, 7 + p * 18, 0, TAU);
    ctx.fill();
  }
  const warm = '#ffc46a';
  for (const wx of [x + 100, x + 170]) {
    const g = ctx.createRadialGradient(wx + 15, y - 60, 0, wx + 15, y - 60, 70);
    g.addColorStop(0, 'rgba(255,190,100,0.45)');
    g.addColorStop(1, 'rgba(255,190,100,0)');
    ctx.fillStyle = g;
    ctx.fillRect(wx - 55, y - 130, 140, 140);
    ctx.fillStyle = warm;
    ctx.fillRect(wx, y - 76, 30, 28);
    ctx.fillStyle = T('#3a2618');
    ctx.fillRect(wx + 14, y - 76, 2, 28);
    ctx.fillRect(wx, y - 63, 30, 2);
  }
  const dx = x + 30;
  ctx.fillStyle = open ? warm : T('#3a2618');
  ctx.fillRect(dx, y - 70, 34, 70);
  if (open) {
    const g = ctx.createLinearGradient(dx, 0, dx - 80, 0);
    g.addColorStop(0, 'rgba(255,200,110,0.5)');
    g.addColorStop(1, 'rgba(255,200,110,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(dx, y - 70);
    ctx.lineTo(dx, y);
    ctx.lineTo(dx - 90, y + 4);
    ctx.lineTo(dx - 60, y - 10);
    ctx.fill();
    ctx.fillStyle = T('#4a3220');
    ctx.beginPath();
    ctx.moveTo(dx + 34, y - 70);
    ctx.lineTo(dx + 46, y - 76);
    ctx.lineTo(dx + 46, y + 4);
    ctx.lineTo(dx + 34, y);
    ctx.fill();
  }
}

// ---------------------------------------------------------------- foreground strip

/** Dark, soft silhouettes that pass in front of the action at 1.35x speed (only below the ground line). */
export function buildForeground(stage) {
  const s = 0.35;
  const W = 2400;
  const H = 150;
  const c = document.createElement('canvas');
  c.width = Math.ceil(W * s);
  c.height = Math.ceil(H * s);
  const g = c.getContext('2d');
  g.scale(s, s);
  const rng = mulberry32(stage.seed + 99);
  const col = stage.palette.fore;
  g.fillStyle = col;
  g.strokeStyle = col;
  g.lineCap = 'round';
  for (let x = 60; x < W - 60; x += 380 + rng() * 520) {
    const kind = stage.terrain;
    if (worldForeground(g, kind, x, H, rng) || skyForeground(g, kind, x, H, rng) || seaForeground(g, kind, x, H, rng)) {
      /* chapter 2 kinds */
    } else if (kind === 'meadow' || kind === 'forest') {
      for (let k = 0; k < 18; k++) {
        const a = -Math.PI / 2 + (rng() - 0.5) * 1.6;
        const l = 60 + rng() * 80;
        g.lineWidth = 4 + rng() * 5;
        g.beginPath();
        g.moveTo(x + (rng() - 0.5) * 40, H);
        g.quadraticCurveTo(x + Math.cos(a) * l * 0.4, H + Math.sin(a) * l * 0.7, x + Math.cos(a) * l, H + Math.sin(a) * l);
        g.stroke();
      }
    } else if (kind === 'snow') {
      g.beginPath();
      g.ellipse(x, H, 90 + rng() * 60, 40 + rng() * 30, 0, Math.PI, 0);
      g.fill();
    } else if (kind === 'harbor') {
      g.fillRect(x - 10, H - 70, 20, 70);
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(x, H - 60);
      g.quadraticCurveTo(x + 100, H - 20, x + 200, H - 64);
      g.stroke();
    } else if (kind === 'roof') {
      g.fillRect(x - 40, H - 46, 120, 46);
      g.fillRect(x - 10, H - 80, 24, 40);
    } else {
      g.beginPath();
      g.moveTo(x - 70, H);
      g.lineTo(x - 30, H - 50 - rng() * 30);
      g.lineTo(x + 40, H - 40 - rng() * 20);
      g.lineTo(x + 80, H);
      g.fill();
    }
  }
  return { canvas: c, w: W, h: H };
}

