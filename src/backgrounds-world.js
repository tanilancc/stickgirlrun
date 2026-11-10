// Chapter 2 backgrounds, painted with the same tools as backgrounds.js: periodic ridgelines,
// slope lighting, atmospheric haze, and hand-built silhouettes placed with seeded randomness.

import { TW, periodic, layer, each, vgrad, ridge, litColumns, hazeOver, tree, cloudLayer } from './backgrounds.js';
import { hash } from './rng.js';
import { mix, alpha, TAU, fract } from './util.js';

// ---------------------------------------------------------------- silhouettes

function pyramid(g, cx, base, w, h, lit, dark) {
  g.fillStyle = dark;
  g.beginPath();
  g.moveTo(cx - w / 2, base);
  g.lineTo(cx, base - h);
  g.lineTo(cx, base);
  g.fill();
  g.fillStyle = lit;
  g.beginPath();
  g.moveTo(cx, base);
  g.lineTo(cx, base - h);
  g.lineTo(cx + w / 2, base);
  g.fill();
}

function camel(g, x, y, s, col) {
  g.fillStyle = col;
  g.strokeStyle = col;
  g.lineCap = 'round';
  g.beginPath();
  g.ellipse(x, y - 15 * s, 11 * s, 5.5 * s, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(x - 1 * s, y - 20 * s, 5.5 * s, 5 * s, 0, Math.PI, 0);
  g.fill();
  g.lineWidth = 2.6 * s;
  g.beginPath();
  g.moveTo(x + 9 * s, y - 16 * s);
  g.quadraticCurveTo(x + 15 * s, y - 18 * s, x + 15 * s, y - 25 * s);
  g.stroke();
  g.beginPath();
  g.ellipse(x + 17 * s, y - 25 * s, 3.4 * s, 1.8 * s, 0.2, 0, TAU);
  g.fill();
  g.lineWidth = 1.5 * s;
  for (const lx of [-8, -5, 5, 8]) {
    g.beginPath();
    g.moveTo(x + lx * s, y - 12 * s);
    g.lineTo(x + lx * s + (lx > 0 ? 1 : -1) * s, y);
    g.stroke();
  }
}

function datePalm(g, x, base, h, col, rng) {
  const lean = (rng() - 0.5) * h * 0.35;
  const tx = x + lean;
  const ty = base - h;
  g.strokeStyle = col;
  g.lineCap = 'round';
  g.lineWidth = Math.max(2, h * 0.055);
  g.beginPath();
  g.moveTo(x, base);
  g.quadraticCurveTo(x + lean * 0.2, base - h * 0.5, tx, ty);
  g.stroke();
  g.fillStyle = col;
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * 3.4 + (rng() - 0.5) * 0.2;
    const len = h * (0.32 + rng() * 0.12);
    const ex = tx + Math.cos(a) * len;
    const ey = ty + Math.sin(a) * len * 0.55 + len * 0.35;
    const mx = tx + Math.cos(a) * len * 0.55;
    const my = ty + Math.sin(a) * len * 0.6 - 2;
    g.beginPath();
    g.moveTo(tx, ty);
    g.quadraticCurveTo(mx, my - h * 0.03, ex, ey);
    g.quadraticCurveTo(mx, my + h * 0.03, tx, ty);
    g.fill();
  }
}

function bambooClump(g, x, base, h, col, rng) {
  g.strokeStyle = col;
  g.lineCap = 'round';
  const n = 6 + Math.floor(rng() * 6);
  for (let i = 0; i < n; i++) {
    const sx = x + (rng() - 0.5) * 16;
    const hh = h * (0.7 + rng() * 0.4);
    const bend = (rng() - 0.3) * 30;
    g.lineWidth = 1.8 + rng() * 1.4;
    g.beginPath();
    g.moveTo(sx, base);
    g.quadraticCurveTo(sx + bend * 0.2, base - hh * 0.6, sx + bend, base - hh);
    g.stroke();
    g.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const u = 0.45 + k * 0.15;
      const px = sx + bend * u * u;
      const py = base - hh * u;
      const d = rng() < 0.5 ? -1 : 1;
      g.beginPath();
      g.moveTo(px, py);
      g.quadraticCurveTo(px + d * 8, py - 4, px + d * 14, py + 3);
      g.stroke();
    }
  }
}

function stiltHut(g, x, base, s, col) {
  g.fillStyle = col;
  for (const lx of [4, 20, 36]) g.fillRect(x + lx * s, base - 18 * s, 2 * s, 18 * s);
  g.fillRect(x, base - 34 * s, 42 * s, 16 * s);
  g.beginPath();
  g.moveTo(x - 6 * s, base - 33 * s);
  g.lineTo(x + 21 * s, base - 52 * s);
  g.lineTo(x + 48 * s, base - 33 * s);
  g.fill();
}

function ziggurat(g, cx, base, w, h, col, tiers) {
  g.fillStyle = col;
  const th = h / (tiers + 0.6);
  for (let i = 0; i < tiers; i++) {
    const tw = w * (1 - i / (tiers + 0.5));
    g.fillRect(cx - tw / 2, base - th * (i + 1), tw, th + 0.5);
  }
  const top = base - th * tiers;
  g.fillRect(cx - w * 0.09, top - th * 0.9, w * 0.18, th * 0.9);
  g.fillRect(cx - w * 0.02, base - th * tiers, w * 0.04, th * tiers);
}

export function blobCanopy(g, x, y, r, col, rng, n = 7) {
  g.fillStyle = col;
  for (let i = 0; i < n; i++) {
    g.beginPath();
    g.arc(x + (rng() - 0.5) * r * 1.6, y + (rng() - 0.5) * r * 0.6, r * (0.45 + rng() * 0.45), 0, TAU);
    g.fill();
  }
}

export function emergentTree(g, x, base, h, col, rng) {
  g.strokeStyle = col;
  g.lineWidth = Math.max(2, h * 0.04);
  g.beginPath();
  g.moveTo(x, base);
  g.lineTo(x + (rng() - 0.5) * 6, base - h * 0.8);
  g.stroke();
  blobCanopy(g, x, base - h * 0.85, h * 0.2, col, rng, 9);
}

export function bigLeaf(g, x, y, s, ang, col, rib) {
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(s * 0.5, -s * 0.45, s, 0);
  g.quadraticCurveTo(s * 0.5, s * 0.45, 0, 0);
  g.fill();
  if (rib) {
    g.strokeStyle = rib;
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(s * 0.95, 0);
    g.stroke();
  }
  g.restore();
}

export function campanile(g, x, base, w, h, col) {
  g.fillStyle = col;
  g.fillRect(x, base - h, w, h);
  g.fillRect(x - 2, base - h - 3, w + 4, 3);
  g.beginPath();
  g.moveTo(x - 1, base - h - 3);
  g.lineTo(x + w / 2, base - h - w * 1.3);
  g.lineTo(x + w + 1, base - h - 3);
  g.fill();
  g.fillStyle = alpha('#000000', 0.25);
  g.fillRect(x + w * 0.3, base - h + 6, w * 0.4, w * 0.7);
}

function domeHall(g, cx, base, w, col) {
  g.fillStyle = col;
  g.fillRect(cx - w / 2, base - w * 0.45, w, w * 0.45);
  g.fillRect(cx - w * 0.3, base - w * 0.62, w * 0.6, w * 0.18);
  g.beginPath();
  g.arc(cx, base - w * 0.62, w * 0.3, Math.PI, 0);
  g.fill();
  g.fillRect(cx - 1.2, base - w * 0.95 - 8, 2.4, 10);
  g.beginPath();
  g.arc(cx, base - w * 0.95 - 9, 2.4, 0, TAU);
  g.fill();
}

function rowHouse(g, x, base, w, h, col, rng, o) {
  g.fillStyle = col;
  g.fillRect(x, base - h, w, h);
  g.fillStyle = mix(col, '#000000', 0.18);
  g.fillRect(x - 1, base - h - 3, w + 2, 3);
  if (rng() < 0.6) {
    const cx = x + w * (0.2 + rng() * 0.6);
    g.fillStyle = mix(col, '#000000', 0.12);
    g.beginPath();
    g.moveTo(cx - 3, base - h - 3);
    g.lineTo(cx - 6, base - h - 13);
    g.lineTo(cx + 6, base - h - 13);
    g.lineTo(cx + 3, base - h - 3);
    g.fill();
  }
  const cols = Math.max(1, Math.floor((w - 6) / 13));
  const rows = Math.max(1, Math.floor((h - 12) / 18));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + 5 + c * ((w - 10) / cols) + 2;
      const wy = base - h + 8 + r * 18;
      const lit = rng() < o.lit;
      g.fillStyle = lit ? o.litCol : mix(col, '#000000', 0.35);
      g.fillRect(wx, wy + 2, 5, 8);
      g.beginPath();
      g.arc(wx + 2.5, wy + 2, 2.5, Math.PI, 0);
      g.fill();
      if (o.shutter && !lit) {
        g.fillStyle = alpha(o.shutter, 0.8);
        g.fillRect(wx - 2.5, wy, 2, 10);
        g.fillRect(wx + 5.5, wy, 2, 10);
      }
    }
  }
}

export function archBridge(g, x, base, w, rise, col) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x - 10, base);
  g.quadraticCurveTo(x + w / 2, base - rise * 2, x + w + 10, base);
  g.lineTo(x + w + 10, base - 6);
  g.quadraticCurveTo(x + w / 2, base - rise * 2 - 8, x - 10, base - 6);
  g.closePath();
  g.fill();
  g.fillRect(x - 12, base - 6, 6, 8);
  g.fillRect(x + w + 6, base - 6, 6, 8);
}

function acacia(g, x, base, h, col, rng) {
  g.strokeStyle = col;
  g.lineCap = 'round';
  g.lineWidth = Math.max(1.5, h * 0.05);
  const fork = base - h * 0.45;
  g.beginPath();
  g.moveTo(x, base);
  g.lineTo(x + h * 0.02, fork);
  g.moveTo(x + h * 0.02, fork);
  g.lineTo(x - h * 0.25, base - h * 0.85);
  g.moveTo(x + h * 0.02, fork);
  g.lineTo(x + h * 0.3, base - h * 0.88);
  g.stroke();
  g.fillStyle = col;
  const w = h * (0.9 + rng() * 0.3);
  g.beginPath();
  g.ellipse(x + h * 0.03, base - h * 0.92, w * 0.62, h * 0.1, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(x + h * 0.15, base - h * 1.0, w * 0.4, h * 0.08, 0, 0, TAU);
  g.fill();
}

function giraffe(g, x, base, s, col) {
  g.fillStyle = col;
  g.strokeStyle = col;
  g.lineCap = 'round';
  g.lineWidth = 2 * s;
  for (const lx of [-7, -4, 6, 9]) {
    g.beginPath();
    g.moveTo(x + lx * s, base - 22 * s);
    g.lineTo(x + lx * s, base);
    g.stroke();
  }
  g.beginPath();
  g.ellipse(x + 1 * s, base - 25 * s, 11 * s, 5 * s, -0.15, 0, TAU);
  g.fill();
  g.lineWidth = 3 * s;
  g.beginPath();
  g.moveTo(x + 9 * s, base - 28 * s);
  g.lineTo(x + 16 * s, base - 52 * s);
  g.stroke();
  g.beginPath();
  g.ellipse(x + 19 * s, base - 53 * s, 4.5 * s, 2.2 * s, 0.35, 0, TAU);
  g.fill();
  g.lineWidth = 1 * s;
  g.beginPath();
  g.moveTo(x + 15 * s, base - 55 * s);
  g.lineTo(x + 15 * s, base - 58 * s);
  g.moveTo(x + 17 * s, base - 55 * s);
  g.lineTo(x + 17.5 * s, base - 58 * s);
  g.stroke();
}

function elephant(g, x, base, s, col) {
  g.fillStyle = col;
  g.beginPath();
  g.ellipse(x, base - 16 * s, 16 * s, 11 * s, 0, 0, TAU);
  g.fill();
  for (const lx of [-11, -4, 5, 11]) g.fillRect(x + lx * s - 2.5 * s, base - 12 * s, 5 * s, 12 * s);
  g.beginPath();
  g.arc(x + 16 * s, base - 21 * s, 7.5 * s, 0, TAU);
  g.fill();
  g.strokeStyle = col;
  g.lineWidth = 3 * s;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x + 21 * s, base - 18 * s);
  g.quadraticCurveTo(x + 25 * s, base - 8 * s, x + 23 * s, base - 2 * s);
  g.stroke();
  g.fillStyle = mix(col, '#000000', 0.15);
  g.beginPath();
  g.ellipse(x + 13 * s, base - 21 * s, 4.5 * s, 6.5 * s, 0.2, 0, TAU);
  g.fill();
}

function baobab(g, x, base, h, col, rng) {
  g.fillStyle = col;
  const w = h * 0.24;
  g.beginPath();
  g.moveTo(x - w * 0.62, base);
  g.quadraticCurveTo(x - w * 0.5, base - h * 0.4, x - w * 0.35, base - h * 0.72);
  g.lineTo(x + w * 0.35, base - h * 0.72);
  g.quadraticCurveTo(x + w * 0.52, base - h * 0.4, x + w * 0.62, base);
  g.fill();
  g.strokeStyle = col;
  g.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i / 6 - 0.5) * 2.2;
    const len = h * (0.18 + rng() * 0.12);
    const sx = x + (i / 6 - 0.5) * w * 0.6;
    g.lineWidth = 3 + rng() * 2;
    g.beginPath();
    g.moveTo(sx, base - h * 0.7);
    g.lineTo(sx + Math.cos(a) * len, base - h * 0.7 + Math.sin(a) * len);
    g.stroke();
  }
}

function pagoda(g, cx, base, w, h, col, tiers) {
  g.fillStyle = col;
  const th = h / (tiers + 0.8);
  for (let i = 0; i < tiers; i++) {
    const tw = w * (1 - i * 0.14);
    const y = base - th * i;
    g.fillRect(cx - tw * 0.32, y - th * 0.7, tw * 0.64, th * 0.7);
    g.beginPath();
    g.moveTo(cx - tw * 0.62, y - th * 0.55);
    g.quadraticCurveTo(cx - tw * 0.45, y - th * 0.72, cx - tw * 0.4, y - th * 0.92);
    g.lineTo(cx + tw * 0.4, y - th * 0.92);
    g.quadraticCurveTo(cx + tw * 0.45, y - th * 0.72, cx + tw * 0.62, y - th * 0.55);
    g.lineTo(cx + tw * 0.4, y - th * 0.78);
    g.lineTo(cx - tw * 0.4, y - th * 0.78);
    g.closePath();
    g.fill();
  }
  g.fillRect(cx - 1.2, base - th * tiers - th * 0.9, 2.4, th * 0.9);
}

function eaveHouse(g, x, base, w, h, col, rng, litCol) {
  g.fillStyle = col;
  g.fillRect(x + w * 0.08, base - h, w * 0.84, h);
  g.beginPath();
  g.moveTo(x - w * 0.06, base - h + 2);
  g.quadraticCurveTo(x + w * 0.08, base - h - 2, x + w * 0.14, base - h - h * 0.38);
  g.lineTo(x + w * 0.86, base - h - h * 0.38);
  g.quadraticCurveTo(x + w * 0.92, base - h - 2, x + w * 1.06, base - h + 2);
  g.closePath();
  g.fill();
  const n = Math.max(1, Math.floor(w / 16));
  for (let i = 0; i < n; i++) {
    if (rng() > 0.6) continue;
    g.fillStyle = litCol;
    g.fillRect(x + w * 0.14 + i * (w * 0.72 / n) + 2, base - h * 0.75, 7, h * 0.35);
  }
}

function willow(g, x, base, h, col, rng) {
  g.strokeStyle = col;
  g.lineCap = 'round';
  g.lineWidth = Math.max(2, h * 0.05);
  g.beginPath();
  g.moveTo(x, base);
  g.quadraticCurveTo(x + 6, base - h * 0.5, x + 2, base - h * 0.8);
  g.stroke();
  g.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const sx = x + (rng() - 0.5) * h * 0.8;
    const sy = base - h * (0.7 + rng() * 0.25);
    const len = h * (0.35 + rng() * 0.35);
    g.beginPath();
    g.moveTo(x + 2, base - h * 0.85);
    g.quadraticCurveTo(sx, sy - 10, sx + (rng() - 0.5) * 6, sy + len);
    g.stroke();
  }
}

// ---------------------------------------------------------------- themes

export const WORLD_THEMES = {
  dunes(P, rng) {
    const layers = [];
    layers.push(
      layer(200, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.35);
        const fn = (x) => 348 - Math.pow(1 - Math.abs(n(x / TW)), 1.3) * 44;
        litColumns(g, fn, 600, { lit: mix(P.far, P.light, 0.35), dark: mix(P.far, '#8a5a3a', 0.25), sunLeft: false, contrast: 3, smooth: 14 });
        const px = 700 + rng() * 400;
        for (const [dx, w, h] of [
          [0, 120, 66],
          [140, 84, 46],
          [235, 60, 32],
        ]) {
          each(px + dx, w, (xx) => pyramid(g, xx, 348, w, h, mix(P.far, P.light, 0.45), mix(P.far, '#7a4a2a', 0.25)));
        }
        hazeOver(g, P.haze, 260, 600, 0.35, 0.8);
      })
    );
    layers.push(
      layer(240, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 3, 3, 0.4);
        const fn = (x) => 374 - Math.pow(1 - Math.abs(n(x / TW)), 1.6) * 62;
        litColumns(g, fn, 620, { lit: mix(P.mid, P.light, 0.42), dark: mix(P.mid, '#6a3a1a', 0.3), sunLeft: false, contrast: 3.2, smooth: 10 });
        let best = 0;
        for (let x = 0; x < TW; x += 8) if (fn(x) < fn(best)) best = x;
        const col = mix(P.mid, '#2a1408', 0.55);
        for (let i = 0; i < 6; i++) {
          const cx = best - 140 + i * 30;
          each(cx, 30, (xx) => camel(g, xx, fn(xx) + 1, 0.8, col));
        }
        hazeOver(g, P.haze, 300, 620, 0.15, 0.5);
      })
    );
    layers.push(
      layer(250, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.45);
        const fn = (x) => 398 - n(x / TW) * 14;
        litColumns(g, fn, 640, { lit: mix(P.near, P.light, 0.35), dark: mix(P.near, '#4a2410', 0.3), sunLeft: false, contrast: 2.5, smooth: 8 });
        const col = mix(P.near, '#1a0c04', 0.45);
        const oasis = 900 + rng() * 500;
        for (let i = 0; i < 9; i++) {
          const x = oasis + (rng() - 0.5) * 360;
          const h = 60 + rng() * 55;
          each(x, 60, (xx) => datePalm(g, xx, fn(xx) + 3, h, col, rng));
        }
        g.fillStyle = col;
        for (let i = 0; i < 3; i++) {
          const x = rng() * TW;
          const w = 50 + rng() * 60;
          const h = 22 + rng() * 18;
          each(x, w, (xx) => {
            const b = fn(xx) + 4;
            g.fillRect(xx, b - h, w, h);
            for (let k = 0; k < w; k += 9) g.fillRect(xx + k, b - h - 4, 5, 4);
            g.fillStyle = alpha('#000000', 0.35);
            g.fillRect(xx + w * 0.4, b - h * 0.7, 6, 9);
            g.fillStyle = col;
          });
        }
        hazeOver(g, P.haze, 330, 640, 0.05, 0.3);
      })
    );
    layers.push(
      layer(340, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.4);
        const fn = (x) => 414 - n(x / TW) * 8;
        ridge(g, fn, 660, vgrad(g, 400, 450, [
          [0, mix(P.ground.top, P.light, 0.2)],
          [1, P.ground.body],
        ]));
        g.strokeStyle = alpha(P.ground.deep, 0.22);
        g.lineWidth = 1;
        for (let k = 0; k < 4; k++) {
          g.beginPath();
          for (let x = 0; x <= TW; x += 6) {
            const y = fn(x) + 4 + k * 5 + Math.sin(x * 0.08 + k) * 1.5;
            if (x === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
          }
          g.stroke();
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 3, 50, 130, true, 0.5), shimmer: true };
  },

  terraces(P, rng) {
    const layers = [];
    layers.push(
      layer(40, 600, 0.04, 0.5, (g) => {
        const peaks = [];
        for (let i = 0; i < 16; i++) peaks.push({ x: rng() * TW, w: 50 + rng() * 90, h: 90 + rng() * 210 });
        const fn = (x) => {
          let hgt = 0;
          for (const p of peaks) {
            for (const off of [0, TW, -TW]) {
              const u = Math.abs(x - (p.x + off)) / p.w;
              if (u < 1) hgt = Math.max(hgt, p.h * Math.pow(1 - u * u, 0.7));
            }
          }
          return 360 - hgt;
        };
        ridge(g, fn, 600, vgrad(g, 80, 400, [
          [0, P.far],
          [1, mix(P.far, P.haze, 0.6)],
        ]));
        hazeOver(g, P.haze, 120, 600, 0.3, 0.9, 40);
      })
    );
    layers.push(
      layer(180, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 2, 3, 0.45);
        const fn = (x) => 372 - (0.5 + 0.5 * n(x / TW)) * 120;
        ridge(g, fn, 620, P.mid);
        g.save();
        g.globalCompositeOperation = 'source-atop';
        for (let k = 0; k < 22; k++) {
          const off = 6 + k * 8.5;
          g.strokeStyle = alpha(k % 2 ? P.light : '#0a1a0c', k % 2 ? 0.22 : 0.18);
          g.lineWidth = k % 2 ? 1.2 : 2;
          g.beginPath();
          for (let x = 0; x <= TW; x += 6) {
            const y = fn(x) + off + Math.sin(x * 0.01 + k) * 2;
            if (x === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
          }
          g.stroke();
        }
        g.restore();
        const pc = mix(P.mid, '#000000', 0.3);
        for (let i = 0; i < 12; i++) {
          const x = rng() * TW;
          each(x, 30, (xx) => tree(g, xx, fn(xx) + 2, 16 + rng() * 14, pc, rng));
        }
        hazeOver(g, P.haze, 220, 620, 0.2, 0.55);
      })
    );
    layers.push(
      layer(220, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 5, 3, 0.45);
        const fn = (x) => 400 - n(x / TW) * 10;
        const col = P.near;
        ridge(g, fn, 640, col);
        for (let i = 0; i < 9; i++) {
          const x = rng() * TW;
          each(x, 40, (xx) => bambooClump(g, xx, fn(xx) + 2, 70 + rng() * 60, mix(col, '#000000', 0.1), rng));
        }
        const hx = 600 + rng() * 800;
        stiltHut(g, hx, fn(hx) + 2, 1.2, mix(col, '#000000', 0.15));
        hazeOver(g, P.haze, 300, 640, 0.08, 0.32);
      })
    );
    layers.push(
      layer(340, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 7, 3, 0.5);
        const fn = (x) => 413 - n(x / TW) * 6;
        const col = mix(P.near, '#000000', 0.18);
        ridge(g, fn, 660, col);
        g.strokeStyle = mix(P.ground.top2, col, 0.4);
        g.lineWidth = 1.2;
        g.beginPath();
        for (let x = 0; x < TW; x += 7) {
          for (let k = 0; k < 4; k++) {
            const l = (k - 1.5) * 2;
            g.moveTo(x + k, fn(x) + 1);
            g.lineTo(x + k + l, fn(x) - 7 - hash(x * 3 + k) * 6);
          }
        }
        g.stroke();
      })
    );
    return {
      layers,
      clouds: cloudLayer(P, rng, 10, 30, 180, true, 1),
      fogAfter: {
        0: { color: P.haze, y: 300, a: 0.6 },
        1: { color: P.haze, y: 340, a: 0.38 },
      },
    };
  },

  ruins(P, rng) {
    const layers = [];
    layers.push(
      layer(150, 600, 0.05, 0.5, (g) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 336 - n(x / TW) * 18;
        ridge(g, fn, 600, P.far);
        for (let x = 0; x < TW; x += 12) blobCanopy(g, x, fn(x) + 2, 14 + hash(x) * 14, P.far, rng, 2);
        const zx = 800 + rng() * 500;
        ziggurat(g, zx, fn(zx) + 10, 150, 110, mix(P.far, '#3a4a3a', 0.25), 6);
        hazeOver(g, P.haze, 220, 600, 0.32, 0.8);
      })
    );
    layers.push(
      layer(100, 620, 0.14, 0.6, (g) => {
        const n = periodic(rng, 4, 3, 0.5);
        const fn = (x) => 362 - n(x / TW) * 12;
        const col = P.mid;
        ridge(g, fn, 620, col);
        for (let x = 0; x < TW; x += 10) blobCanopy(g, x, fn(x), 16 + hash(x * 3) * 16, col, rng, 2);
        for (let i = 0; i < 8; i++) {
          const x = rng() * TW;
          each(x, 50, (xx) => emergentTree(g, xx, fn(xx), 120 + rng() * 90, mix(col, '#000000', 0.08), rng));
        }
        const tx = rng() * TW;
        each(tx, 40, (xx) => ziggurat(g, xx, fn(xx) + 4, 70, 120, mix(col, '#2a3a2a', 0.3), 4));
        hazeOver(g, P.haze, 160, 620, 0.16, 0.5);
      })
    );
    layers.push(
      layer(-120, 640, 0.32, 0.75, (g) => {
        const n = periodic(rng, 5, 3, 0.5);
        const fn = (x) => 402 - n(x / TW) * 6;
        const col = P.near;
        ridge(g, fn, 640, col);
        for (let x = 0; x < TW; x += 70 + rng() * 120) {
          const w = 14 + rng() * 16;
          each(x, w * 3, (xx) => {
            const base = fn(xx);
            g.fillStyle = col;
            g.fillRect(xx - w / 2, -120, w, base + 120);
            g.beginPath();
            g.moveTo(xx - w * 2, base + 2);
            g.quadraticCurveTo(xx - w * 0.6, base - 6, xx - w * 0.5, base - 40);
            g.lineTo(xx + w * 0.5, base - 40);
            g.quadraticCurveTo(xx + w * 0.6, base - 6, xx + w * 2, base + 2);
            g.fill();
            g.strokeStyle = mix(col, '#5a7a3a', 0.35);
            g.lineWidth = 1.4;
            for (let k = 0; k < 3; k++) {
              const lx = xx + (hash(xx + k) - 0.5) * 120;
              g.beginPath();
              g.moveTo(xx, -120 + k * 60);
              g.quadraticCurveTo((xx + lx) / 2, 60 + k * 40, lx, 140 + hash(k * 7 + xx) * 160);
              g.stroke();
            }
          });
        }
        hazeOver(g, P.haze, 100, 640, 0.12, 0.28, -120);
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 6;
        const col = mix(P.near, '#000000', 0.25);
        ridge(g, fn, 660, col);
        for (let x = 0; x < TW; x += 16 + rng() * 26) {
          for (let k = 0; k < 3; k++) {
            bigLeaf(g, x, fn(x) + 2, 14 + rng() * 14, -Math.PI / 2 + (k - 1) * 0.8 + (rng() - 0.5) * 0.3, k === 1 ? mix(col, P.mid, 0.25) : col, alpha(P.light, 0.12));
          }
        }
      })
    );
    return {
      layers,
      rays: true,
      fogAfter: {
        0: { color: P.haze, y: 290, a: 0.5 },
        1: { color: P.haze, y: 340, a: 0.32 },
      },
    };
  },

  canals(P, rng) {
    const pastel = ['#e6b48c', '#d98f7a', '#efd29c', '#c9a0a0', '#e8c8b0', '#b8a07a', '#d4a46c'];
    const layers = [];
    layers.push(
      layer(120, 400, 0.05, 0.5, (g) => {
        let x = 0;
        while (x < TW) {
          const w = 30 + rng() * 60;
          const h = 30 + rng() * 60;
          const col = mix(mix(pastel[Math.floor(rng() * pastel.length)], P.far, 0.6), P.haze, 0.2);
          g.fillStyle = col;
          g.fillRect(x, 390 - h, w + 1, h);
          x += w;
        }
        for (let i = 0; i < 5; i++) {
          const cx = rng() * TW;
          each(cx, 20, (xx) => campanile(g, xx, 390, 12 + rng() * 6, 100 + rng() * 60, mix(P.far, '#6a5a6a', 0.2)));
        }
        for (let i = 0; i < 3; i++) {
          const cx = rng() * TW;
          each(cx, 60, (xx) => domeHall(g, xx, 390, 70 + rng() * 40, mix(P.far, '#7a6a7a', 0.15)));
        }
        hazeOver(g, P.haze, 260, 400, 0.3, 0.55, 120);
      })
    );
    layers.push(
      layer(160, 400, 0.14, 0.6, (g) => {
        let x = 0;
        while (x < TW) {
          const w = 40 + rng() * 50;
          const h = 70 + rng() * 80;
          const col = mix(pastel[Math.floor(rng() * pastel.length)], P.mid, 0.35);
          rowHouse(g, x, 396, Math.min(w, TW - x + 1), h, col, rng, { lit: 0.12, litCol: P.window, shutter: '#4a6a4a' });
          x += w;
        }
        hazeOver(g, P.haze, 240, 400, 0.12, 0.3, 160);
      })
    );
    layers.push(
      layer(200, 430, 0.3, 0.75, (g) => {
        let x = 0;
        while (x < TW) {
          const w = 60 + rng() * 80;
          if (rng() < 0.3) {
            archBridge(g, x + 10, 404, w - 20, 16, mix(P.near, '#000000', 0.1));
            x += w;
            continue;
          }
          const h = 60 + rng() * 70;
          const col = mix(pastel[Math.floor(rng() * pastel.length)], P.near, 0.55);
          rowHouse(g, x, 404, Math.min(w, TW - x + 1), h, col, rng, { lit: 0.22, litCol: P.window, shutter: '#3a5a3a' });
          x += w + 6;
        }
        for (let px = 40 + rng() * 60; px < TW; px += 90 + rng() * 140) {
          g.fillStyle = mix('#e8e0d0', P.near, 0.3);
          g.fillRect(px, 372, 3, 46);
          g.fillStyle = mix('#b8423a', P.near, 0.3);
          for (let k = 0; k < 4; k++) g.fillRect(px, 376 + k * 10, 3, 5);
        }
        hazeOver(g, P.haze, 300, 430, 0.05, 0.16, 200);
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 60, 210, true, 0.8), sea: { y: 386 }, birds: true };
  },

  savanna(P, rng) {
    const layers = [];
    layers.push(
      layer(250, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 3, 3, 0.45);
        const kop = [];
        for (let i = 0; i < 5; i++) kop.push({ x: rng() * TW, w: 40 + rng() * 60, h: 14 + rng() * 22 });
        const fn = (x) => {
          let hgt = 2 + n(x / TW) * 3;
          for (const k of kop) {
            for (const off of [0, TW, -TW]) {
              const u = Math.abs(x - (k.x + off)) / k.w;
              if (u < 1) hgt = Math.max(hgt, k.h * Math.sqrt(1 - u * u));
            }
          }
          return 360 - hgt;
        };
        ridge(g, fn, 600, P.far);
        for (let i = 0; i < 26; i++) {
          const x = rng() * TW;
          acacia(g, x, fn(x) + 1, 8 + rng() * 6, P.far, rng);
        }
        hazeOver(g, P.haze, 300, 600, 0.3, 0.75);
      })
    );
    layers.push(
      layer(220, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 3, 3, 0.4);
        const fn = (x) => 382 - n(x / TW) * 6;
        const col = P.mid;
        ridge(g, fn, 620, col);
        for (let i = 0; i < 9; i++) {
          const x = rng() * TW;
          each(x, 60, (xx) => acacia(g, xx, fn(xx) + 1, 40 + rng() * 30, col, rng));
        }
        const gx = 500 + rng() * 500;
        for (let i = 0; i < 3; i++) each(gx + i * 34, 30, (xx) => giraffe(g, xx, fn(xx) + 1, 0.9 + rng() * 0.25, col));
        const ex = gx + 600 + rng() * 300;
        for (let i = 0; i < 4; i++) each(ex + i * 44, 40, (xx) => elephant(g, xx, fn(xx) + 1, 0.8 + rng() * 0.3 - (i === 3 ? 0.35 : 0), col));
        hazeOver(g, P.haze, 300, 620, 0.12, 0.45);
      })
    );
    layers.push(
      layer(160, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.45);
        const fn = (x) => 402 - n(x / TW) * 7;
        const col = P.near;
        ridge(g, fn, 640, col);
        for (let i = 0; i < 3; i++) {
          const x = rng() * TW;
          each(x, 60, (xx) => baobab(g, xx, fn(xx) + 3, 100 + rng() * 50, col, rng));
        }
        for (let i = 0; i < 4; i++) {
          const x = rng() * TW;
          each(x, 100, (xx) => acacia(g, xx, fn(xx) + 2, 90 + rng() * 50, col, rng));
        }
        hazeOver(g, P.haze, 300, 640, 0.04, 0.24);
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 7, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 6;
        const col = mix(P.near, '#000000', 0.25);
        ridge(g, fn, 660, col);
        g.strokeStyle = col;
        g.lineWidth = 1.2;
        g.beginPath();
        for (let x = 0; x < TW; x += 3) {
          const h = 8 + hash(x * 5) * 22;
          const l = (hash(x * 9) - 0.3) * 8;
          g.moveTo(x, fn(x) + 2);
          g.quadraticCurveTo(x + l * 0.3, fn(x) - h * 0.6, x + l, fn(x) - h);
        }
        g.stroke();
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 5, 110, 250, true, 0.7), birds: true };
  },

  lanterns(P, rng) {
    const layers = [];
    layers.push(
      layer(180, 400, 0.04, 0.5, (g) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 380 - Math.max(0, n(x / TW)) * 50 - 4;
        ridge(g, fn, 400, P.far);
        for (let i = 0; i < 4; i++) {
          const x = rng() * TW;
          each(x, 40, (xx) => pagoda(g, xx, fn(xx) + 4, 40 + rng() * 14, 70 + rng() * 30, mix(P.far, '#000000', 0.15), 4 + Math.floor(rng() * 3)));
        }
        for (let i = 0; i < 90; i++) {
          const x = rng() * TW;
          g.fillStyle = alpha(i % 3 ? P.lamp : '#ffd890', 0.35 + rng() * 0.45);
          g.fillRect(x, fn(x) + 4 + rng() * 14, 1.6, 1.6);
        }
      })
    );
    layers.push(
      layer(160, 404, 0.14, 0.6, (g, dyn) => {
        let x = 0;
        const col = P.mid;
        while (x < TW) {
          const w = 50 + rng() * 60;
          const h = 30 + rng() * 40;
          eaveHouse(g, x, 396, w, h, col, rng, alpha(P.window, 0.85));
          if (rng() < 0.35) {
            const pw = 40;
            each(x + w / 2, pw, (xx) => pagoda(g, xx, 396 - h - h * 0.38, pw, 50, col, 2));
          }
          x += w + 4 + rng() * 10;
        }
        g.strokeStyle = alpha('#000000', 0.6);
        g.lineWidth = 0.8;
        for (let i = 0; i < 6; i++) {
          const x0 = rng() * TW;
          const w = 120 + rng() * 160;
          const y0 = 330 + rng() * 30;
          g.beginPath();
          g.moveTo(x0, y0);
          g.quadraticCurveTo(x0 + w / 2, y0 + 16, x0 + w, y0);
          g.stroke();
          for (let k = 1; k < 8; k++) {
            const u = k / 8;
            const lx = x0 + w * u;
            const ly = y0 + 16 * 4 * u * (1 - u) * 0.5 + 4;
            dyn.push({ type: 'paperLantern', x: lx % TW, y: ly, s: 0.6, phase: rng() * TAU });
          }
        }
        hazeOver(g, P.haze, 280, 404, 0.06, 0.16, 160);
      })
    );
    layers.push(
      layer(200, 430, 0.3, 0.75, (g, dyn) => {
        const col = P.near;
        g.fillStyle = col;
        g.fillRect(0, 404, TW, 30);
        for (let i = 0; i < 6; i++) {
          const x = rng() * TW;
          each(x, 60, (xx) => willow(g, xx, 404, 90 + rng() * 40, col, rng));
        }
        const bx = rng() * TW;
        each(bx, 120, (xx) => archBridge(g, xx, 404, 160, 22, mix(col, '#3a1a1a', 0.2)));
        for (let lx = 60 + rng() * 80; lx < TW; lx += 180 + rng() * 120) {
          g.fillStyle = mix(col, '#000000', 0.3);
          g.fillRect(lx, 338, 2.6, 70);
          g.fillRect(lx - 8, 338, 18, 2);
          dyn.push({ type: 'paperLantern', x: lx - 6, y: 348, s: 1, phase: rng() * TAU });
          dyn.push({ type: 'paperLantern', x: lx + 8, y: 348, s: 1, phase: rng() * TAU });
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 30, 150, true, 0.6), sea: { y: 386 }, fireworks: true };
  },
};

// ---------------------------------------------------------------- fireworks

/** Screen-space fireworks over the festival: deterministic in time, so they cost no state. */
export function drawFireworks(ctx, view, t, k = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cols = ['#ffcf6a', '#ff6a4a', '#8ad8ff', '#ff9ad8', '#c8ff8a', '#ffffff'];
  const shells = Math.round(2 + 5 * k);
  for (let i = 0; i < shells; i++) {
    const period = 2.6 + i * 0.37;
    const cyc = Math.floor((t + i * 0.9) / period);
    const p = fract((t + i * 0.9) / period);
    const seed = cyc * 7 + i * 131;
    const cx = view.w * (0.15 + hash(seed) * 0.7);
    const cy = 70 + hash(seed + 1) * 120;
    const col = cols[Math.floor(hash(seed + 2) * cols.length)];
    if (p < 0.22) {
      // rising shell
      const u = p / 0.22;
      const y = 430 - (430 - cy) * (1 - (1 - u) * (1 - u));
      ctx.fillStyle = alpha('#fff2c8', 0.8 * k);
      ctx.fillRect(cx - 1, y, 2, 6);
    } else {
      const u = (p - 0.22) / 0.78;
      const r = 90 * Math.sqrt(u) * (0.8 + hash(seed + 3) * 0.5);
      const a = (1 - u) * (1 - u) * k;
      const n = 30 + (i % 3) * 6;
      ctx.fillStyle = alpha(col, a);
      for (let j = 0; j < n; j++) {
        const ang = (j / n) * TAU + hash(seed + j) * 0.1;
        const px = cx + Math.cos(ang) * r;
        const py = cy + Math.sin(ang) * r + u * u * 34;
        ctx.fillRect(px - 1.2, py - 1.2, 2.4, 2.4);
        ctx.fillRect(px - Math.cos(ang) * 6, py - Math.sin(ang) * 6, 1.2, 1.2);
      }
      if (u < 0.15) {
        const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
        fg.addColorStop(0, alpha(col, 0.25 * (1 - u / 0.15) * k));
        fg.addColorStop(1, alpha(col, 0));
        ctx.fillStyle = fg;
        ctx.fillRect(cx - 80, cy - 80, 160, 160);
      }
    }
  }
  ctx.restore();
}

