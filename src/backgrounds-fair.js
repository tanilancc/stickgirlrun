// Chapter 6 backgrounds: frosty pumpkin fields, a mill on its stream, a heather moor with a ring
// of standing stones, a valley crossed by a railway with a steam train on it, vineyards at golden
// hour, and the harvest fair at night. Painted with the same tools as backgrounds.js; the moving
// parts (a mill wheel, the train, the big wheel, the carousel and strings of bulbs) are drawn
// each frame by fairDyn below.

import { TW, periodic, layer, each, vgrad, ridge, hazeOver, pine, tree, building, cloudLayer } from './backgrounds.js';
import { hash, mulberry32 } from './rng.js';
import { mix, alpha, TAU, fract } from './util.js';

// ---------------------------------------------------------------- silhouettes

/**
 * A broadleaf tree in autumn: a trunk that forks, a dark mass of foliage, then many small clumps
 * of its colours over it, brightest on the side the sun is on.
 */
function autumnTree(g, x, yb, h, base, cols, rng, sunDir = 1) {
  const bark = mix(base, '#000000', 0.3);
  g.fillStyle = bark;
  g.beginPath();
  g.moveTo(x - h * 0.04, yb);
  g.lineTo(x - h * 0.014, yb - h * 0.5);
  g.lineTo(x + h * 0.014, yb - h * 0.5);
  g.lineTo(x + h * 0.04, yb);
  g.fill();
  if (h > 20) {
    g.strokeStyle = bark;
    g.lineWidth = Math.max(0.8, h * 0.018);
    g.beginPath();
    g.moveTo(x, yb - h * 0.42);
    g.lineTo(x - h * 0.16, yb - h * 0.66);
    g.moveTo(x, yb - h * 0.48);
    g.lineTo(x + h * 0.14, yb - h * 0.74);
    g.stroke();
  }
  const cy = yb - h * 0.68;
  const rw = h * (0.3 + rng() * 0.08);
  const rh = h * 0.27;
  const n = Math.min(44, 10 + Math.floor(h * 0.45));
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rng() * TAU;
    const d = Math.sqrt(rng());
    pts.push([x + Math.cos(a) * rw * d, cy + Math.sin(a) * rh * d, h * (0.06 + rng() * 0.07)]);
  }
  // the shadowed mass first
  g.fillStyle = mix(base, '#000000', 0.12);
  for (const [px, py, r] of pts) {
    g.beginPath();
    g.arc(px, py + r * 0.3, r * 1.15, 0, TAU);
    g.fill();
  }
  // then the leaves, lighter toward the top and the sun
  for (const [px, py, r] of pts) {
    const lit = Math.max(0, ((px - x) / rw) * sunDir * 0.5 + ((cy - py) / rh) * 0.5);
    const c = mix(cols[Math.floor(rng() * cols.length)], base, 0.35 - lit * 0.25);
    g.fillStyle = c;
    g.beginPath();
    g.arc(px + r * 0.15 * sunDir, py - r * 0.15, r * 0.8, 0, TAU);
    g.fill();
  }
  // a scatter of small bright leaves on the lit edge
  for (let i = 0; i < n / 2; i++) {
    const a = -Math.PI / 2 + (rng() - 0.5) * 2.2 + sunDir * 0.5;
    const px = x + Math.cos(a) * rw * (0.6 + rng() * 0.4);
    const py = cy + Math.sin(a) * rh * (0.6 + rng() * 0.4);
    g.fillStyle = mix(cols[Math.floor(rng() * cols.length)], '#fff4d8', 0.15);
    g.beginPath();
    g.arc(px, py, h * (0.02 + rng() * 0.025), 0, TAU);
    g.fill();
  }
}

function barn(g, x, yb, s, wall, roof, trim) {
  const w = 46 * s;
  const h = 26 * s;
  g.fillStyle = wall;
  g.fillRect(x, yb - h, w, h);
  // a gambrel roof: steep at the eaves, shallow at the ridge
  g.fillStyle = roof;
  g.beginPath();
  g.moveTo(x - 3 * s, yb - h);
  g.lineTo(x + 6 * s, yb - h - 12 * s);
  g.lineTo(x + w / 2, yb - h - 18 * s);
  g.lineTo(x + w - 6 * s, yb - h - 12 * s);
  g.lineTo(x + w + 3 * s, yb - h);
  g.fill();
  g.strokeStyle = trim;
  g.lineWidth = Math.max(0.8, s);
  const dx = x + w / 2 - 8 * s;
  g.strokeRect(dx, yb - 16 * s, 16 * s, 16 * s);
  g.beginPath();
  g.moveTo(dx, yb - 16 * s);
  g.lineTo(dx + 16 * s, yb);
  g.moveTo(dx + 16 * s, yb - 16 * s);
  g.lineTo(dx, yb);
  g.stroke();
  g.fillStyle = trim;
  g.fillRect(x + w / 2 - 3 * s, yb - h - 8 * s, 6 * s, 5 * s);
}

function silo(g, x, yb, s, col, cap) {
  g.fillStyle = col;
  g.fillRect(x, yb - 44 * s, 12 * s, 44 * s);
  g.fillStyle = cap;
  g.beginPath();
  g.arc(x + 6 * s, yb - 44 * s, 6 * s, Math.PI, 0);
  g.fill();
  g.fillStyle = alpha('#000000', 0.18);
  for (let k = 1; k < 6; k++) g.fillRect(x, yb - k * 8 * s, 12 * s, 0.8 * s);
}

function cornShock(g, x, yb, h, col, tie) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x - h * 0.34, yb);
  g.lineTo(x - h * 0.06, yb - h * 0.62);
  g.lineTo(x - h * 0.12, yb - h);
  g.lineTo(x + h * 0.02, yb - h * 0.7);
  g.lineTo(x + h * 0.16, yb - h * 0.96);
  g.lineTo(x + h * 0.08, yb - h * 0.6);
  g.lineTo(x + h * 0.36, yb);
  g.fill();
  g.strokeStyle = alpha('#000000', 0.25);
  g.lineWidth = 0.8;
  g.beginPath();
  for (let k = -3; k <= 3; k++) {
    g.moveTo(x + k * h * 0.09, yb);
    g.lineTo(x + k * h * 0.012, yb - h * 0.62);
  }
  g.stroke();
  g.fillStyle = tie;
  g.fillRect(x - h * 0.08, yb - h * 0.64, h * 0.16, h * 0.05);
}

function pumpkinDot(g, x, y, r, col, rib) {
  g.fillStyle = col;
  g.beginPath();
  g.ellipse(x, y, r * 1.25, r, 0, 0, TAU);
  g.fill();
  if (rib && r > 2) {
    g.strokeStyle = rib;
    g.lineWidth = Math.max(0.6, r * 0.18);
    g.beginPath();
    g.ellipse(x, y, r * 0.45, r * 0.95, 0, 0, TAU);
    g.stroke();
    g.fillStyle = '#3a4a20';
    g.fillRect(x - 0.6, y - r - 1.6, 1.4, 2);
  }
}

function willow(g, x, yb, h, col, strand, rng) {
  g.strokeStyle = col;
  g.lineWidth = h * 0.05;
  g.beginPath();
  g.moveTo(x, yb);
  g.quadraticCurveTo(x - h * 0.04, yb - h * 0.4, x - h * 0.02, yb - h * 0.66);
  g.moveTo(x - h * 0.02, yb - h * 0.5);
  g.quadraticCurveTo(x + h * 0.12, yb - h * 0.62, x + h * 0.16, yb - h * 0.74);
  g.stroke();
  // a loose crown, mostly made of the long strands hanging from it
  for (let k = 0; k < 10; k++) {
    g.fillStyle = mix(col, strand, rng() * 0.4);
    g.beginPath();
    g.ellipse(x + (rng() - 0.5) * h * 0.55, yb - h * 0.72 - rng() * h * 0.2, h * (0.09 + rng() * 0.06), h * (0.05 + rng() * 0.04), 0, 0, TAU);
    g.fill();
  }
  g.lineWidth = 1;
  for (let k = 0; k < 70; k++) {
    const sx = x + (rng() - 0.5) * h * 0.75;
    const sy = yb - h * 0.7 - rng() * h * 0.22;
    const len = h * (0.3 + rng() * 0.45);
    g.strokeStyle = mix(strand, col, rng() * 0.6);
    g.beginPath();
    g.moveTo(sx, sy);
    g.quadraticCurveTo(sx + (sx - x) * 0.12, sy + len * 0.5, sx + (sx - x) * 0.2 + (rng() - 0.5) * 3, Math.min(yb - 1, sy + len));
    g.stroke();
  }
}

function stoneBridge(g, x, yb, w, h, col, dark) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x, yb);
  g.quadraticCurveTo(x + w / 2, yb - h * 1.5, x + w, yb);
  g.lineTo(x + w, yb + 2);
  g.lineTo(x, yb + 2);
  g.fill();
  g.fillStyle = dark;
  g.beginPath();
  g.moveTo(x + w * 0.2, yb + 2);
  g.quadraticCurveTo(x + w / 2, yb - h * 0.95, x + w * 0.8, yb + 2);
  g.fill();
}

function sheep(g, x, y, s, wool, face) {
  g.fillStyle = wool;
  g.beginPath();
  g.ellipse(x, y - 3 * s, 4.4 * s, 2.8 * s, 0, 0, TAU);
  g.fill();
  g.fillStyle = face;
  g.beginPath();
  g.ellipse(x + 4.4 * s, y - 3.6 * s, 1.4 * s, 1.1 * s, 0.4, 0, TAU);
  g.fill();
  g.fillRect(x - 2.6 * s, y - 1 * s, 0.8 * s, 2 * s);
  g.fillRect(x + 2 * s, y - 1 * s, 0.8 * s, 2 * s);
}

/** A ring of standing stones, seen from the side: the far ones small and higher up. */
function stoneCircle(g, cx, yb, r, col, lit, rng) {
  const n = 12;
  const stones = [];
  for (let k = 0; k < n; k++) {
    if (rng() < 0.18) continue; // some have fallen
    const a = (k / n) * TAU + rng() * 0.2;
    stones.push({ x: cx + Math.cos(a) * r, y: yb + Math.sin(a) * r * 0.22, far: Math.sin(a) < 0, h: 9 + rng() * 9, w: 3 + rng() * 2.4 });
  }
  stones.sort((a, b) => a.y - b.y);
  for (const s of stones) {
    const k = s.far ? 0.8 : 1;
    g.fillStyle = s.far ? mix(col, '#9aa0b0', 0.25) : col;
    g.beginPath();
    g.moveTo(s.x - s.w * k, s.y);
    g.lineTo(s.x - s.w * 0.8 * k, s.y - s.h * k);
    g.lineTo(s.x + s.w * 0.6 * k, s.y - s.h * k - 1);
    g.lineTo(s.x + s.w * k, s.y);
    g.fill();
    g.fillStyle = lit;
    g.fillRect(s.x + s.w * 0.2 * k, s.y - s.h * k, s.w * 0.5 * k, s.h * k * 0.9);
  }
}

/** A dry-stone wall drawn along a ridge function between two x's, a little below the crest. */
function stoneWallLine(g, fn, x0, x1, dy, col) {
  g.strokeStyle = col;
  g.lineWidth = 1.6;
  g.beginPath();
  for (let x = x0; x <= x1; x += 6) {
    const y = fn(x) + dy + Math.sin(x * 0.02) * 2;
    if (x === x0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
}

function cypress(g, x, yb, h, col) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x, yb - h);
  g.quadraticCurveTo(x + h * 0.13, yb - h * 0.55, x + h * 0.07, yb);
  g.lineTo(x - h * 0.07, yb);
  g.quadraticCurveTo(x - h * 0.13, yb - h * 0.55, x, yb - h);
  g.fill();
}

function olive(g, x, yb, h, col, hi, rng) {
  g.strokeStyle = mix(col, '#2a2018', 0.4);
  g.lineWidth = h * 0.06;
  g.beginPath();
  g.moveTo(x, yb);
  g.quadraticCurveTo(x - h * 0.1, yb - h * 0.3, x + h * 0.05, yb - h * 0.5);
  g.stroke();
  for (let k = 0; k < 9; k++) {
    g.fillStyle = k % 3 ? col : hi;
    g.beginPath();
    g.ellipse(x + (rng() - 0.5) * h * 0.8, yb - h * 0.55 - rng() * h * 0.3, h * (0.14 + rng() * 0.1), h * (0.08 + rng() * 0.06), 0, 0, TAU);
    g.fill();
  }
}

/** Fill a hill with rows of vines that follow its slope. */
function vineHill(g, fn, yBot, soil, rows, rowCols, gap) {
  ridge(g, fn, yBot, soil);
  g.save();
  g.globalCompositeOperation = 'source-atop';
  const r = mulberry32(7);
  for (let k = 0; k < rows; k++) {
    const dy = 3 + k * gap + k * k * 0.12;
    g.strokeStyle = rowCols[Math.floor(r() * rowCols.length)];
    g.lineWidth = 1.2 + k * 0.12;
    g.beginPath();
    for (let x = 0; x <= TW; x += 6) {
      const y = fn(x) + dy;
      if (x === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  g.restore();
}

function bigTop(g, x, yb, w, h, c1, c2, flag) {
  // striped canvas in panels, two king poles, a scalloped valance
  const top = yb - h;
  g.save();
  g.beginPath();
  g.moveTo(x, yb);
  g.lineTo(x + w * 0.08, top + h * 0.45);
  g.quadraticCurveTo(x + w * 0.25, top + h * 0.2, x + w * 0.35, top);
  g.quadraticCurveTo(x + w * 0.5, top + h * 0.12, x + w * 0.65, top);
  g.quadraticCurveTo(x + w * 0.75, top + h * 0.2, x + w * 0.92, top + h * 0.45);
  g.lineTo(x + w, yb);
  g.closePath();
  g.fillStyle = c1;
  g.fill();
  g.clip();
  g.fillStyle = c2;
  const n = 12;
  for (let k = 0; k < n; k += 2) {
    const u0 = k / n;
    const u1 = (k + 1) / n;
    g.beginPath();
    g.moveTo(x + w * 0.5 + (u0 - 0.5) * w * 0.3, top - 4);
    g.lineTo(x + w * u0, yb);
    g.lineTo(x + w * u1, yb);
    g.lineTo(x + w * 0.5 + (u1 - 0.5) * w * 0.3, top - 4);
    g.fill();
  }
  g.restore();
  g.fillStyle = c2;
  for (let k = 0; k < 10; k++) {
    g.beginPath();
    g.arc(x + w * 0.08 + (k + 0.5) * (w * 0.84) / 10, top + h * 0.5, (w * 0.84) / 20, 0, Math.PI);
    g.fill();
  }
  g.fillStyle = mix(c1, '#000000', 0.5);
  for (const px of [x + w * 0.35, x + w * 0.65]) {
    g.fillRect(px - 1, top - 12, 2, 12);
    g.fillStyle = flag;
    g.beginPath();
    g.moveTo(px + 1, top - 12);
    g.lineTo(px + 10, top - 9);
    g.lineTo(px + 1, top - 6);
    g.fill();
    g.fillStyle = mix(c1, '#000000', 0.5);
  }
}

function helterSkelter(g, x, yb, h, c1, c2, cap) {
  const w = h * 0.16;
  g.fillStyle = c1;
  g.beginPath();
  g.moveTo(x - w * 0.6, yb);
  g.lineTo(x - w * 0.45, yb - h * 0.85);
  g.lineTo(x + w * 0.45, yb - h * 0.85);
  g.lineTo(x + w * 0.6, yb);
  g.fill();
  // the slide spiralling round it
  g.strokeStyle = c2;
  g.lineWidth = h * 0.035;
  g.beginPath();
  for (let k = 0; k < 6; k++) {
    const y = yb - h * 0.82 + k * h * 0.14;
    g.moveTo(x - w * 0.8, y + h * 0.06);
    g.lineTo(x + w * 0.8, y);
  }
  g.stroke();
  g.fillStyle = cap;
  g.beginPath();
  g.moveTo(x - w * 0.7, yb - h * 0.85);
  g.lineTo(x, yb - h);
  g.lineTo(x + w * 0.7, yb - h * 0.85);
  g.fill();
}

function stall(g, x, yb, w, h, c1, c2, glow) {
  const g2 = g.createRadialGradient(x + w / 2, yb - h * 0.5, 0, x + w / 2, yb - h * 0.5, w);
  g2.addColorStop(0, alpha(glow, 0.35));
  g2.addColorStop(1, alpha(glow, 0));
  g.fillStyle = g2;
  g.fillRect(x - w / 2, yb - h * 1.6, w * 2, h * 1.8);
  g.fillStyle = mix(glow, '#3a2010', 0.35);
  g.fillRect(x + 2, yb - h * 0.72, w - 4, h * 0.72);
  g.fillStyle = mix(c1, '#000000', 0.4);
  g.fillRect(x, yb - h * 0.32, w, h * 0.32);
  g.fillRect(x, yb - h, 2, h);
  g.fillRect(x + w - 2, yb - h, 2, h);
  const n = Math.max(3, Math.round(w / 8));
  for (let k = 0; k < n; k++) {
    g.fillStyle = k % 2 ? c1 : c2;
    g.beginPath();
    g.moveTo(x - 3 + (k * (w + 6)) / n, yb - h);
    g.lineTo(x - 3 + ((k + 1) * (w + 6)) / n, yb - h);
    g.lineTo(x - 3 + ((k + 1) * (w + 6)) / n, yb - h * 0.78);
    g.arc(x - 3 + ((k + 0.5) * (w + 6)) / n, yb - h * 0.78, (w + 6) / n / 2, 0, Math.PI);
    g.closePath();
    g.fill();
  }
}

function person(g, x, yb, h, col) {
  g.fillStyle = col;
  g.beginPath();
  g.arc(x, yb - h + h * 0.12, h * 0.12, 0, TAU);
  g.fill();
  g.beginPath();
  g.moveTo(x - h * 0.16, yb);
  g.lineTo(x - h * 0.13, yb - h * 0.75);
  g.lineTo(x + h * 0.13, yb - h * 0.75);
  g.lineTo(x + h * 0.16, yb);
  g.fill();
}

// ---------------------------------------------------------------- themes

export const FAIR_THEMES = {
  pumpkin(P, rng) {
    const layers = [];
    layers.push(
      layer(240, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 352 - (0.35 + 0.65 * Math.abs(n(x / TW))) * 46;
        ridge(g, fn, 600, P.far);
        for (let x = 0; x < TW; x += 6) if (hash(x * 3) > 0.5) tree(g, x, fn(x) + 3, 8 + hash(x) * 10, P.far, rng, null);
        hazeOver(g, P.haze, 260, 600, 0.38, 0.55);
      })
    );
    layers.push(
      layer(250, 620, 0.12, 0.6, (g, dyn) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 386 - Math.abs(n(x / TW)) * 30;
        ridge(g, fn, 620, P.mid);
        // a patchwork of fields: ploughed, stubble, pasture
        g.save();
        g.globalCompositeOperation = 'source-atop';
        const fields = ['#7a5a3a', '#c8b47a', '#6a7a4a', '#a88a5a', '#8a6a44'];
        for (let x = 0, k = 0; x < TW; k++) {
          const w = 80 + rng() * 170;
          const fi = Math.floor(rng() * fields.length);
          const lean = (rng() - 0.5) * 60;
          g.fillStyle = mix(fields[fi], P.mid, 0.35);
          g.beginPath();
          g.moveTo(x, 300);
          g.lineTo(x + w, 300);
          g.lineTo(x + w + lean, 640);
          g.lineTo(x + lean, 640);
          g.fill();
          if (fi === 0 || fi === 4 || k % 4 === 0) {
            // furrows
            g.strokeStyle = alpha('#2a1a10', 0.18);
            g.lineWidth = 0.8;
            for (let yy = 330; yy < 640; yy += 4) {
              g.beginPath();
              g.moveTo(x, yy);
              g.lineTo(x + w, yy + lean * 0.02);
              g.stroke();
            }
          }
          // a hedge along the boundary
          g.fillStyle = mix(P.near, P.mid, 0.4);
          for (let yy = 300; yy < 640; yy += 3) {
            const hx = x + (lean * (yy - 300)) / 340;
            g.beginPath();
            g.arc(hx, yy, 1.6 + hash(yy + x) * 1.6, 0, TAU);
            g.fill();
          }
          x += w;
        }
        g.restore();
        for (let x = 0; x < TW; x += 11) if (hash(x * 5) > 0.75) tree(g, x, fn(x) + 2, 12 + hash(x) * 12, mix(P.near, P.mid, 0.5), rng, null);
        // the farm: a red barn, a silo, the house with its chimney going
        const fx = 300 + rng() * 1300;
        const fy = fn(fx) + 4;
        each(fx, 120, (xx) => {
          barn(g, xx, fy, 1.1, mix('#a8402a', P.haze, 0.25), mix('#4a3a3a', P.haze, 0.2), mix('#f0e0d0', P.haze, 0.3));
          silo(g, xx + 58, fy, 1.1, mix('#b0a8a0', P.haze, 0.25), mix('#7a8088', P.haze, 0.2));
          building(g, xx - 54, fy, 34, 20, mix('#d8c8b0', P.haze, 0.3), rng, { type: 'gable' });
          g.fillStyle = mix('#4a3a3a', P.haze, 0.3);
          g.fillRect(xx - 30, fy - 34, 4, 10);
          g.fillStyle = alpha('#ffd890', 0.7);
          g.fillRect(xx - 48, fy - 14, 4, 5);
          g.fillRect(xx - 36, fy - 14, 4, 5);
        });
        dyn.push({ type: 'steam', x: fx - 28, y: fy - 34, s: 0.5, phase: rng() * 10 });
        hazeOver(g, P.haze, 300, 620, 0.12, 0.25);
      })
    );
    layers.push(
      layer(250, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.5);
        const fn = (x) => 404 - n(x / TW) * 7;
        ridge(g, fn, 640, mix(P.near, '#6a5a3a', 0.2));
        // the pumpkin field: vines in rows and orange everywhere
        for (let k = 0; k < 5; k++) {
          for (let x = (k * 7) % 13; x < TW; x += 9 + hash(x * 3 + k) * 8) {
            const y = fn(x) + 2 + k * 3.5;
            g.strokeStyle = mix('#4a6a2a', P.near, 0.35);
            g.lineWidth = 1;
            g.beginPath();
            g.moveTo(x - 5, y);
            g.quadraticCurveTo(x, y - 3, x + 5, y);
            g.stroke();
            if (hash(x * 7 + k) > 0.45) pumpkinDot(g, x, y - 1, 1.6 + k * 0.5 + hash(x) * 1.2, mix('#e87a1a', P.haze, 0.25 - k * 0.04), alpha('#8a3a0a', 0.5));
          }
        }
        for (let i = 0; i < 26; i++) {
          const x = rng() * TW;
          each(x, 20, (xx) => cornShock(g, xx, fn(xx) + 1, 24 + rng() * 12, mix('#c8a868', P.near, 0.25), mix('#7a5a2a', P.near, 0.3)));
        }
        // a scarecrow keeping watch over it all
        const sx = rng() * TW;
        each(sx, 30, (xx) => {
          const y = fn(xx);
          g.fillStyle = mix('#3a2a1a', P.near, 0.2);
          g.fillRect(xx - 1, y - 40, 2.4, 40);
          g.fillRect(xx - 16, y - 32, 32, 2.4);
          g.fillStyle = mix('#5a4a7a', P.near, 0.2);
          g.fillRect(xx - 6, y - 32, 12, 14);
          g.fillStyle = mix('#d8c090', P.near, 0.2);
          g.beginPath();
          g.arc(xx, y - 38, 4.4, 0, TAU);
          g.fill();
          g.fillStyle = mix('#3a2a1a', P.near, 0.2);
          g.fillRect(xx - 7, y - 43, 14, 2);
          g.fillRect(xx - 4, y - 48, 8, 5);
        });
        hazeOver(g, P.haze, 360, 640, 0.06, 0.02, 250);
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 6;
        const col = mix(P.near, '#000000', 0.25);
        ridge(g, fn, 660, col);
        // frosted stubble
        g.lineWidth = 1;
        for (let x = 0; x < TW; x += 2.5) {
          const h = 4 + hash(x * 5) * 9;
          g.strokeStyle = hash(x * 3) > 0.5 ? mix('#e8e4dc', col, 0.45) : mix('#a89a6a', col, 0.4);
          g.beginPath();
          g.moveTo(x, fn(x) + 2);
          g.lineTo(x + (hash(x) - 0.5) * 3, fn(x) - h);
          g.stroke();
        }
      })
    );
    return {
      layers,
      clouds: cloudLayer(P, rng, 6, 40, 200, true, 0.7),
      birds: true,
      fogAfter: {
        0: { color: '#ffffff', y: 350, a: 0.3 },
        1: { color: '#ffffff', y: 394, a: 0.2 },
      },
    };
  },

  mill(P, rng) {
    const layers = [];
    const cols = P.leaves;
    const W = 404;
    layers.push(
      layer(220, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 344 - (0.35 + 0.65 * Math.abs(n(x / TW))) * 56;
        ridge(g, fn, 600, P.far);
        const tint = cols.map((c) => mix(c, P.far, 0.65));
        for (let x = 0; x < TW; x += 5) autumnTree(g, x, fn(x) + 6, 12 + hash(x) * 10, P.far, tint, rng);
        hazeOver(g, P.haze, 250, 600, 0.35, 0.55);
      })
    );
    layers.push(
      layer(240, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 384 - Math.abs(n(x / TW)) * 34;
        ridge(g, fn, 620, P.mid);
        const tint = cols.map((c) => mix(c, P.mid, 0.4));
        for (let x = 0; x < TW; x += 8 + hash(x) * 6) {
          if (hash(x * 13) < 0.2) pine(g, x, fn(x) + 6, 26 + hash(x * 3) * 14, mix('#3a4a34', P.mid, 0.5), rng, null);
          else autumnTree(g, x, fn(x) + 8, 22 + hash(x * 3) * 18, mix(P.mid, '#5a3a1a', 0.25), tint, rng);
        }
        hazeOver(g, P.haze, 280, 620, 0.16, 0.3);
      })
    );
    layers.push(
      layer(200, 640, 0.3, 0.75, (g, dyn) => {
        // the stream, the mill on it and the trees along the bank
        g.fillStyle = vgrad(g, W - 4, W + 30, [
          [0, mix(P.water, P.light, 0.35)],
          [1, mix(P.water, '#1a2a2a', 0.3)],
        ]);
        g.fillRect(0, W - 3, TW, 240);
        const n = periodic(rng, 4, 3, 0.5);
        const bank = (x) => W - 3 - Math.max(0, n(x / TW)) * 6;
        const tint = cols.map((c) => mix(c, P.near, 0.2));
        for (let x = 0; x < TW; x += 40 + rng() * 70) {
          const h = 70 + rng() * 60;
          each(x, 50, (xx) => (hash(xx * 7) < 0.3 ? willow(g, xx, bank(xx) + 2, h, mix(P.near, '#6a6a2a', 0.3), mix('#c8b040', P.near, 0.35), rng) : autumnTree(g, xx, bank(xx) + 2, h, mix(P.near, '#4a2a10', 0.2), tint, rng, -1)));
        }
        // the mill: stone walls, a slate roof, a wheel turning on the near side
        const mx = 400 + rng() * 1100;
        each(mx, 160, (xx) => {
          const b = W - 1;
          g.fillStyle = mix('#a89878', P.near, 0.25);
          g.fillRect(xx, b - 70, 90, 70);
          g.fillStyle = mix('#3a3a44', P.near, 0.2);
          g.beginPath();
          g.moveTo(xx - 6, b - 70);
          g.lineTo(xx + 45, b - 104);
          g.lineTo(xx + 96, b - 70);
          g.fill();
          g.fillStyle = alpha('#000000', 0.18);
          for (let yy = b - 64; yy < b; yy += 7) g.fillRect(xx, yy, 90, 1);
          g.fillStyle = mix('#2a2018', P.near, 0.2);
          for (const [wx, wy] of [
            [xx + 14, b - 52],
            [xx + 60, b - 52],
            [xx + 37, b - 82],
          ])
            g.fillRect(wx, wy, 12, 14);
          g.fillRect(xx + 34, b - 30, 18, 30);
          // the leat that feeds the wheel
          g.fillStyle = mix('#5a4030', P.near, 0.3);
          g.fillRect(xx + 90, b - 62, 70, 5);
          g.fillStyle = mix(P.water, P.light, 0.4);
          g.fillRect(xx + 92, b - 64, 66, 2);
        });
        dyn.push({ type: 'waterwheel', x: mx + 118, y: W - 34, r: 32, color: mix('#3a2a1a', P.near, 0.15), water: mix(P.water, '#ffffff', 0.5) });
        // a stone footbridge further down
        const bx = (mx + 900) % TW;
        each(bx, 80, (xx) => stoneBridge(g, xx, W, 110, 22, mix('#9a8a70', P.near, 0.3), mix(P.water, '#1a2a2a', 0.45)));
        // reflections and ripples
        g.fillStyle = alpha(P.light, 0.3);
        for (let i = 0; i < 90; i++) g.fillRect(rng() * TW, W + 2 + rng() * 26, 6 + rng() * 20, 1);
        // ducks
        for (let i = 0; i < 4; i++) {
          const x = rng() * TW;
          g.fillStyle = mix('#5a4a3a', P.near, 0.2);
          g.beginPath();
          g.ellipse(x, W + 6, 4, 1.8, 0, 0, TAU);
          g.fill();
          g.beginPath();
          g.arc(x + 3.4, W + 3.4, 1.4, 0, TAU);
          g.fill();
        }
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 6;
        const col = mix(P.near, '#000000', 0.3);
        ridge(g, fn, 660, col);
        g.strokeStyle = col;
        g.lineWidth = 1.2;
        g.beginPath();
        for (let x = 0; x < TW; x += 3) {
          if (hash(x * 9) < 0.4) continue;
          const h = 8 + hash(x * 5) * 22;
          g.moveTo(x, fn(x) + 2);
          g.quadraticCurveTo(x + 1, fn(x) - h * 0.6, x + (hash(x) - 0.5) * 10, fn(x) - h);
        }
        g.stroke();
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 40, 200, false, 0.8), rays: true, fogAfter: { 1: { color: P.haze, y: 380, a: 0.3 } } };
  },

  moor(P, rng) {
    const layers = [];
    const heather = P.heather;
    layers.push(
      layer(220, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.45);
        const fn = (x) => 346 - (0.3 + 0.7 * Math.abs(n(x / TW))) * 54;
        ridge(g, fn, 600, P.far);
        const n2 = periodic(rng, 3, 2, 0.5);
        ridge(g, (x) => 366 - Math.abs(n2(x / TW)) * 22, 600, mix(P.far, P.mid, 0.35));
        hazeOver(g, P.haze, 250, 600, 0.3, 0.5);
      })
    );
    layers.push(
      layer(240, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 386 - (0.2 + 0.8 * Math.abs(n(x / TW))) * 42;
        ridge(g, fn, 620, P.mid);
        // patches of heather and bracken over the hills
        g.save();
        g.globalCompositeOperation = 'source-atop';
        for (let i = 0; i < 260; i++) {
          const x = rng() * TW;
          const y = fn(x) + 3 + rng() * 60;
          g.fillStyle = rng() < 0.55 ? mix(heather, P.mid, 0.55 + rng() * 0.2) : mix('#a8703a', P.mid, 0.55 + rng() * 0.2);
          g.beginPath();
          g.moveTo(x - 20 - rng() * 30, y);
          for (let k = 0; k <= 6; k++) g.lineTo(x - 20 + k * 8 + rng() * 6, y - 1.5 - rng() * 3);
          g.lineTo(x + 30 + rng() * 20, y + 1);
          g.lineTo(x - 10, y + 3 + rng() * 2);
          g.fill();
        }
        g.restore();
        // walls marching over the hills
        for (let i = 0; i < 5; i++) {
          const x0 = rng() * TW;
          stoneWallLine(g, fn, x0, x0 + 180 + rng() * 200, 8 + rng() * 14, mix('#8a8a8a', P.mid, 0.45));
        }
        // the stone circle on the highest hill
        let best = 0;
        for (let x = 0; x < TW; x += 8) if (fn(x) < fn(best)) best = x;
        each(best, 60, (xx) => stoneCircle(g, xx, fn(xx) + 3, 34, mix('#8a8888', P.mid, 0.25), mix('#c8c8c0', P.mid, 0.3), rng));
        // a ruined cottage
        const cx = (best + 700 + rng() * 400) % TW;
        each(cx, 40, (xx) => {
          const y = fn(xx) + 4;
          g.fillStyle = mix('#7a7a74', P.mid, 0.35);
          g.fillRect(xx, y - 12, 26, 12);
          g.beginPath();
          g.moveTo(xx, y - 12);
          g.lineTo(xx + 6, y - 20);
          g.lineTo(xx + 10, y - 12);
          g.fill();
          g.fillStyle = mix(P.mid, '#000000', 0.3);
          g.fillRect(xx + 14, y - 9, 4, 5);
        });
        hazeOver(g, P.haze, 290, 620, 0.12, 0.25);
      })
    );
    layers.push(
      layer(250, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.55);
        const fn = (x) => 404 - Math.abs(n(x / TW)) * 26;
        ridge(g, fn, 640, P.near);
        g.save();
        g.globalCompositeOperation = 'source-atop';
        for (let x = 0; x < TW; x += 2) {
          const k = hash(x * 3);
          g.fillStyle = k > 0.55 ? mix(heather, P.near, 0.2) : k > 0.3 ? mix('#8a6a3a', P.near, 0.3) : mix('#5a6a3a', P.near, 0.3);
          g.fillRect(x, fn(x) - 1, 2, 6 + hash(x * 7) * 10);
        }
        g.restore();
        // granite tors on the tops
        for (let i = 0; i < 3; i++) {
          const x = rng() * TW;
          each(x, 60, (xx) => {
            const y = fn(xx) + 3;
            // a granite tor: blocks split along their joints, stacked and weathered round
            let yy = y;
            for (let k = 0; k < 4; k++) {
              const w = 46 - k * 9 + rng() * 8;
              const h = 7 + rng() * 4;
              const ox = xx + (rng() - 0.5) * 8 - w / 2;
              g.fillStyle = mix(k % 2 ? '#8a8a84' : '#78786f', P.near, 0.3);
              g.beginPath();
              g.moveTo(ox, yy);
              g.lineTo(ox + 2, yy - h + 2);
              g.quadraticCurveTo(ox + 3, yy - h, ox + 6, yy - h);
              g.lineTo(ox + w - 5, yy - h - 0.5);
              g.quadraticCurveTo(ox + w - 2, yy - h, ox + w - 1, yy - h + 3);
              g.lineTo(ox + w, yy);
              g.fill();
              g.fillStyle = mix('#c8c8c0', P.near, 0.45);
              g.fillRect(ox + 4, yy - h, w - 10, 1.4);
              yy -= h - 0.5;
            }
          });
        }
        // a hawthorn bent by the wind, and the sheep
        const hx = rng() * TW;
        each(hx, 40, (xx) => {
          const y = fn(xx) + 2;
          g.strokeStyle = mix('#2a2018', P.near, 0.2);
          g.lineWidth = 3;
          g.beginPath();
          g.moveTo(xx, y);
          g.quadraticCurveTo(xx - 4, y - 18, xx - 18, y - 28);
          g.stroke();
          g.fillStyle = mix('#3a4a2a', P.near, 0.25);
          g.beginPath();
          g.ellipse(xx - 22, y - 30, 22, 9, -0.2, 0, TAU);
          g.fill();
        });
        for (let i = 0; i < 18; i++) {
          const x = rng() * TW;
          sheep(g, x, fn(x) + 4 + rng() * 6, 1, mix('#f0ece4', P.near, 0.15), mix('#2a2420', P.near, 0.1));
        }
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 7;
        const col = mix(P.near, '#000000', 0.3);
        ridge(g, fn, 660, col);
        for (let x = 0; x < TW; x += 3) {
          const h = 6 + hash(x * 5) * 10;
          g.fillStyle = hash(x * 3) > 0.5 ? mix(heather, col, 0.5) : mix('#8a6a3a', col, 0.5);
          g.beginPath();
          g.ellipse(x, fn(x) - h * 0.4, 3, h * 0.6, 0, 0, TAU);
          g.fill();
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 9, 40, 210, false, 0.95), rays: true, birds: true };
  },

  viaduct(P, rng) {
    const layers = [];
    const line = 352; // the far railway, along the valley side
    layers.push(
      layer(200, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 330 - (0.35 + 0.65 * Math.abs(n(x / TW))) * 70;
        ridge(g, fn, 600, P.far);
        hazeOver(g, P.haze, 240, 600, 0.3, 0.5);
      })
    );
    layers.push(
      layer(240, 620, 0.08, 0.55, (g, dyn) => {
        // the far side of the valley: woods, the railway cut along it, a viaduct over a side valley
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 336 - Math.abs(n(x / TW)) * 30;
        ridge(g, fn, 620, P.mid);
        const tint = ['#c8783a', '#e0a848', '#a84a2a', '#8a8a3a'].map((c) => mix(c, P.mid, 0.45));
        for (let x = 0; x < TW; x += 5) autumnTree(g, x, fn(x) + 8 + hash(x) * 10, 12 + hash(x * 3) * 10, mix(P.mid, '#3a2a14', 0.2), tint, rng);
        for (let x = 0; x < TW; x += 6) autumnTree(g, x, 400 + hash(x * 9) * 10, 14 + hash(x * 5) * 12, mix(P.mid, '#3a2a14', 0.25), tint, rng);
        // the line itself: an embankment, then the far viaduct striding over the side valley
        const v0 = 500 + rng() * 300;
        const v1 = v0 + 520;
        g.fillStyle = mix('#8a7a64', P.mid, 0.35);
        g.fillRect(0, line, v0, 5);
        g.fillRect(v1, line, TW - v1, 5);
        // clear the side valley under the arches so the far hills show through
        g.fillStyle = mix(P.far, P.haze, 0.35);
        g.beginPath();
        g.moveTo(v0 - 20, line + 4);
        g.quadraticCurveTo((v0 + v1) / 2, line + 130, v1 + 20, line + 4);
        g.fill();
        for (let x = v0; x < v1; x += 6) autumnTree(g, x, line + 50 + Math.sin(((x - v0) / (v1 - v0)) * Math.PI) * 30 + hash(x) * 6, 10 + hash(x * 3) * 8, mix(P.mid, '#3a2a14', 0.3), tint, rng);
        g.fillStyle = mix('#9a8a70', P.mid, 0.3);
        g.beginPath();
        g.moveTo(v0, line);
        g.lineTo(v1, line);
        g.lineTo(v1, line + 70);
        const arch = 32;
        for (let x = v1; x > v0; x -= arch) {
          g.lineTo(x - 5, line + 70);
          g.lineTo(x - 5, line + 18);
          g.arc(x - arch / 2, line + 18, arch / 2 - 5, 0, Math.PI, true);
          g.lineTo(x - arch + 5, line + 70);
        }
        g.lineTo(v0, line + 70);
        g.fill();
        g.fillStyle = mix('#5a4a3a', P.mid, 0.3);
        g.fillRect(v0 - 4, line - 2, v1 - v0 + 8, 3);
        dyn.push({ type: 'train', x: rng() * TW, y: line, vx: 46, s: 0.9, span: 260, color: mix('#3a2e2a', P.mid, 0.25), coach: mix('#7a3a2a', P.mid, 0.3), steam: '#f4f0ea' });
        hazeOver(g, P.haze, 280, 620, 0.14, 0.3);
      })
    );
    layers.push(
      layer(330, 640, 0.18, 0.65, (g, dyn) => {
        // the valley floor far below: the river, fields and a village
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 402 - Math.abs(n(x / TW)) * 8;
        ridge(g, fn, 640, mix(P.near, P.mid, 0.4));
        g.strokeStyle = mix(P.water, P.light, 0.35);
        g.lineWidth = 3;
        g.beginPath();
        for (let x = 0; x <= TW; x += 8) g.lineTo(x, fn(x) + 9 + Math.sin(x * 0.006) * 4);
        g.stroke();
        const tint = ['#c8783a', '#e0a848', '#a84a2a'].map((c) => mix(c, P.near, 0.4));
        for (let x = 0; x < TW; x += 14 + hash(x) * 20) autumnTree(g, x, fn(x) + 3, 10 + hash(x * 7) * 10, mix(P.near, P.mid, 0.3), tint, rng);
        const vx = rng() * TW;
        each(vx, 120, (xx) => {
          for (let k = 0; k < 9; k++) {
            const bx = xx + k * 13 + (hash(k) - 0.5) * 6;
            building(g, bx, fn(bx) + 4, 10 + hash(k * 3) * 6, 7 + hash(k * 5) * 5, mix(k % 3 ? '#d8c8b0' : '#b8a890', P.mid, 0.35), rng, { type: 'gable' });
          }
          building(g, xx + 52, fn(xx + 52) + 4, 9, 18, mix('#c8b8a0', P.mid, 0.35), rng, { type: 'spire' });
        });
        dyn.push({ type: 'steam', x: vx + 30, y: fn(vx) - 6, s: 0.35, phase: 3 });
        hazeOver(g, P.haze, 330, 640, 0.25, 0.1, 330);
      })
    );
    layers.push(
      layer(240, 660, 0.56, 0.9, (g) => {
        // telegraph poles along our line, wires sagging between them
        const top = 300;
        const gap = 256;
        g.strokeStyle = mix(P.near, '#000000', 0.35);
        for (let x = 40; x < TW; x += gap) {
          g.fillStyle = mix(P.near, '#000000', 0.35);
          g.fillRect(x - 2, top, 4, 420 - top);
          g.fillRect(x - 12, top + 8, 24, 2.4);
          g.fillRect(x - 9, top + 18, 18, 2);
          g.lineWidth = 0.8;
          for (const [dy, dx] of [
            [8, -10],
            [8, 10],
            [18, -7],
            [18, 7],
          ]) {
            g.beginPath();
            g.moveTo(x + dx, top + dy);
            g.quadraticCurveTo(x + dx + gap / 2, top + dy + 22, x + dx + gap, top + dy);
            g.stroke();
          }
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 7, 40, 200, false, 0.85), birds: true, fogAfter: { 2: { color: P.haze, y: 410, a: 0.35 } } };
  },

  vineyard(P, rng) {
    const layers = [];
    const rowCols = P.leaves;
    layers.push(
      layer(220, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 350 - (0.3 + 0.7 * Math.abs(n(x / TW))) * 60;
        ridge(g, fn, 600, P.far);
        // a hill town: houses stacked up the slope and a bell tower on top
        let best = 0;
        for (let x = 0; x < TW; x += 8) if (fn(x) < fn(best)) best = x;
        each(best, 80, (xx) => {
          for (let k = 0; k < 14; k++) {
            const bx = xx - 60 + k * 9;
            building(g, bx, fn(bx) + 6 + Math.abs(k - 7) * 1.2, 9 + hash(k) * 5, 8 + hash(k * 3) * 8, mix(P.far, '#d8b8a0', 0.25), rng, { type: hash(k * 7) < 0.5 ? 'gable' : 'flat' });
          }
          g.fillStyle = mix(P.far, '#d8b8a0', 0.25);
          g.fillRect(xx + 4, fn(xx) - 30, 8, 36);
          g.beginPath();
          g.moveTo(xx + 3, fn(xx) - 30);
          g.lineTo(xx + 8, fn(xx) - 38);
          g.lineTo(xx + 13, fn(xx) - 30);
          g.fill();
        });
        for (let x = 0; x < TW; x += 9) if (hash(x * 5) > 0.7) cypress(g, x, fn(x) + 4, 10 + hash(x) * 8, mix(P.far, '#3a3040', 0.2));
        hazeOver(g, P.haze, 250, 600, 0.3, 0.5);
      })
    );
    layers.push(
      layer(240, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 386 - (0.2 + 0.8 * Math.abs(n(x / TW))) * 40;
        vineHill(g, fn, 620, mix('#a87a4a', P.mid, 0.35), 40, rowCols.map((c) => mix(c, P.mid, 0.35)), 5);
        // a road with cypresses, and the winery
        const rx = rng() * TW;
        each(rx, 200, (xx) => {
          for (let k = 0; k < 9; k++) cypress(g, xx + k * 18, fn(xx + k * 18) + 4, 22 + hash(k + xx) * 6, mix('#2a3a24', P.mid, 0.3));
        });
        const wx = (rx + 800) % TW;
        each(wx, 80, (xx) => {
          const y = fn(xx) + 6;
          g.fillStyle = mix('#e0c8a0', P.mid, 0.3);
          g.fillRect(xx, y - 18, 50, 18);
          g.fillRect(xx + 34, y - 28, 16, 10);
          g.fillStyle = mix('#b85a3a', P.mid, 0.3);
          g.beginPath();
          g.moveTo(xx - 3, y - 18);
          g.lineTo(xx + 20, y - 26);
          g.lineTo(xx + 34, y - 18);
          g.fill();
          g.fillRect(xx + 32, y - 31, 20, 3);
          g.fillStyle = alpha('#ffd890', 0.7);
          g.fillRect(xx + 8, y - 12, 4, 5);
          g.fillRect(xx + 20, y - 12, 4, 5);
        });
        hazeOver(g, P.haze, 290, 620, 0.12, 0.25);
      })
    );
    layers.push(
      layer(250, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.55);
        const fn = (x) => 404 - Math.abs(n(x / TW)) * 22;
        vineHill(g, fn, 640, mix('#8a5a34', P.near, 0.3), 30, rowCols.map((c) => mix(c, P.near, 0.15)), 4);
        for (let i = 0; i < 9; i++) {
          const x = rng() * TW;
          each(x, 40, (xx) => olive(g, xx, fn(xx) + 3, 34 + rng() * 14, mix('#6a7a5a', P.near, 0.35), mix('#9aa888', P.near, 0.35), rng));
        }
        // pickers in the rows, baskets on their backs
        for (let i = 0; i < 10; i++) {
          const x = rng() * TW;
          const y = fn(x) + 6 + rng() * 10;
          person(g, x, y, 12, mix('#2a1a14', P.near, 0.2));
          g.fillStyle = mix('#8a6a3a', P.near, 0.2);
          g.fillRect(x - 6, y - 9, 4, 5);
        }
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 6;
        const col = mix(P.near, '#000000', 0.3);
        ridge(g, fn, 660, col);
        // the end of a vine row: stakes, wires and leaves, a bunch or two left
        for (let x = 0; x < TW; x += 120 + hash(x) * 80) {
          g.fillStyle = col;
          g.fillRect(x, fn(x) - 26, 2, 28);
          g.strokeStyle = col;
          g.lineWidth = 0.8;
          g.beginPath();
          g.moveTo(x, fn(x) - 20);
          g.lineTo(x + 90, fn(x + 90) - 20);
          g.stroke();
          for (let k = 0; k < 12; k++) {
            g.beginPath();
            g.arc(x + 4 + k * 7, fn(x + k * 7) - 18 - hash(x + k) * 6, 4 + hash(k + x * 3) * 3, 0, TAU);
            g.fill();
          }
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 40, 200, true, 0.85), rays: true, birds: true };
  },

  fair(P, rng) {
    const layers = [];
    layers.push(
      layer(220, 600, 0.04, 0.5, (g, dyn) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 356 - (0.3 + 0.7 * Math.abs(n(x / TW))) * 50;
        ridge(g, fn, 600, P.far);
        // the village up on the hill, everyone's lights on
        for (let i = 0; i < 3; i++) {
          const vx = rng() * TW;
          each(vx, 80, (xx) => {
            for (let k = 0; k < 8; k++) {
              const bx = xx + k * 9;
              building(g, bx, fn(bx) + 5, 8 + hash(k) * 4, 6 + hash(k * 3) * 6, mix(P.far, '#000000', 0.2), rng, { type: 'gable' });
              if (hash(k * 11 + i) > 0.4) dyn.push({ type: 'blink', x: bx + 4, y: fn(bx) + 1, color: P.window, period: 40 + k, phase: 0.02 });
            }
          });
        }
        hazeOver(g, P.haze, 260, 600, 0.2, 0.35);
      })
    );
    layers.push(
      layer(180, 620, 0.12, 0.6, (g, dyn) => {
        const base = 392;
        g.fillStyle = mix(P.mid, P.near, 0.3);
        g.fillRect(0, base - 2, TW, 300);
        // the glow the whole fair throws up into the night
        const glow = vgrad(g, 250, base, [
          [0, alpha(P.lamp, 0)],
          [1, alpha(P.lamp, 0.22)],
        ]);
        g.fillStyle = glow;
        g.fillRect(0, 250, TW, base - 250);
        const fx = 300 + rng() * 400;
        // the big wheel's frame (the wheel itself turns in fairDyn)
        each(fx, 120, (xx) => {
          g.strokeStyle = mix('#3a3450', P.mid, 0.2);
          g.lineWidth = 3;
          g.beginPath();
          g.moveTo(xx - 34, base);
          g.lineTo(xx, base - 78);
          g.lineTo(xx + 34, base);
          g.stroke();
        });
        dyn.push({ type: 'ferris', x: fx, y: base - 78, r: 66, color: mix('#5a5070', P.mid, 0.1) });
        // a big top, a helter-skelter and a carousel
        const tx = (fx + 260) % TW;
        each(tx, 160, (xx) => bigTop(g, xx, base, 150, 80, mix('#c83a3a', P.mid, 0.35), mix('#f0e0c0', P.mid, 0.4), mix('#f2c040', P.mid, 0.3)));
        const hx = (fx + 520) % TW;
        each(hx, 40, (xx) => helterSkelter(g, xx, base, 96, mix('#e8d8b0', P.mid, 0.4), mix('#c83a3a', P.mid, 0.3), mix('#3a6aa8', P.mid, 0.3)));
        const cx = (fx + 700) % TW;
        each(cx, 70, (xx) => {
          g.fillStyle = mix('#3a2a40', P.mid, 0.2);
          g.fillRect(xx - 46, base - 30, 3, 30);
          g.fillRect(xx + 43, base - 30, 3, 30);
          g.fillRect(xx - 1.5, base - 52, 3, 52);
          g.fillStyle = mix('#f0d8a0', P.mid, 0.3);
          g.beginPath();
          g.moveTo(xx - 52, base - 30);
          g.lineTo(xx, base - 52);
          g.lineTo(xx + 52, base - 30);
          g.fill();
          g.fillStyle = mix('#c8484a', P.mid, 0.3);
          for (let k = 0; k < 8; k += 2) {
            g.beginPath();
            g.moveTo(xx, base - 52);
            g.lineTo(xx - 52 + k * 13, base - 30);
            g.lineTo(xx - 52 + (k + 1) * 13, base - 30);
            g.fill();
          }
        });
        dyn.push({ type: 'carousel', x: cx, y: base - 30, w: 104, h: 30 });
        // stalls in between and strings of bulbs across the whole field
        for (let x = 0; x < TW; x += 70 + rng() * 60) {
          if (Math.abs(x - fx) < 60) continue;
          const w = 30 + rng() * 20;
          each(x, w, (xx) => stall(g, xx, base, w, 22, mix('#c83a3a', P.mid, 0.3), mix('#f0e0c0', P.mid, 0.35), P.lamp));
        }
        for (let x = 0; x < TW; x += 180) dyn.push({ type: 'bulbs', x, y: base - 40 - hash(x) * 20, dx: 180, sag: 14, n: 12, phase: hash(x * 3) * 10 });
        hazeOver(g, P.haze, 280, 620, 0.06, 0.12, 180);
      })
    );
    layers.push(
      layer(250, 640, 0.3, 0.75, (g, dyn) => {
        const n = periodic(rng, 4, 3, 0.5);
        const fn = (x) => 404 - n(x / TW) * 5;
        ridge(g, fn, 640, P.near);
        // closer stalls and the crowd walking between them
        for (let x = 0; x < TW; x += 140 + rng() * 140) {
          const w = 50 + rng() * 30;
          each(x, w, (xx) => stall(g, xx, fn(xx) + 2, w, 36, mix(rng() < 0.5 ? '#2a6ab0' : '#c83a3a', P.near, 0.2), mix('#f4ead8', P.near, 0.25), P.lamp));
        }
        for (let i = 0; i < 46; i++) {
          const x = rng() * TW;
          person(g, x, fn(x) + 3, 16 + rng() * 6, mix('#0a0810', P.near, 0.3));
        }
        for (let x = 60; x < TW; x += 300) {
          g.fillStyle = mix('#1a1820', P.near, 0.2);
          g.fillRect(x - 1.5, fn(x) - 60, 3, 62);
          g.fillRect(x - 6, fn(x) - 62, 12, 3);
          dyn.push({ type: 'lamp', x, y: fn(x) - 56 });
        }
        for (let x = 0; x < TW; x += 240) dyn.push({ type: 'bulbs', x, y: fn(x) - 70, dx: 240, sag: 22, n: 16, phase: hash(x * 7) * 10 });
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 6;
        const col = mix(P.near, '#000000', 0.4);
        ridge(g, fn, 660, col);
        // parked carts and caravans along the hedge
        for (let x = 0; x < TW; x += 300 + hash(x) * 300) {
          g.fillStyle = col;
          g.beginPath();
          g.moveTo(x, fn(x) - 6);
          g.lineTo(x, fn(x) - 34);
          g.quadraticCurveTo(x + 40, fn(x) - 48, x + 80, fn(x) - 34);
          g.lineTo(x + 80, fn(x) - 6);
          g.fill();
          g.beginPath();
          g.arc(x + 16, fn(x) - 6, 7, 0, TAU);
          g.arc(x + 64, fn(x) - 6, 7, 0, TAU);
          g.fill();
        }
        g.fillStyle = col;
        for (let x = 0; x < TW; x += 6) {
          g.beginPath();
          g.arc(x, fn(x) - 3, 5 + hash(x * 3) * 6, 0, TAU);
          g.fill();
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 4, 30, 150, true, 0.5), stars: true, fireworks: true };
  },
};

// ---------------------------------------------------------------- moving parts

/** Draw a chapter 6 moving background part. False if the type is not one of ours. */
export function fairDyn(ctx, d, x, y, t, P) {
  if (d.type === 'waterwheel') {
    const a0 = t * 0.6;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, d.r, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, d.r * 0.72, 0, TAU);
    ctx.stroke();
    ctx.rotate(a0);
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * d.r, Math.sin(a) * d.r);
    }
    ctx.stroke();
    ctx.fillStyle = d.color;
    for (let k = 0; k < 16; k++) {
      ctx.save();
      ctx.rotate((k / 16) * TAU);
      ctx.fillRect(d.r - 1, -1.6, 7, 3.2);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, TAU);
    ctx.fill();
    ctx.restore();
    // water spilling off the paddles and churning white at the foot
    ctx.fillStyle = alpha(d.water, 0.7);
    for (let k = 0; k < 8; k++) {
      const p = fract(t * 1.4 + k / 8);
      ctx.fillRect(x + d.r * 0.6 + hash(k) * 10, y - d.r * 0.4 + p * d.r * 1.5, 1.4, 4);
    }
    for (let k = 0; k < 5; k++) {
      const f = 0.5 + 0.5 * Math.sin(t * 6 + k * 2);
      ctx.fillStyle = alpha('#ffffff', 0.35 * f);
      ctx.beginPath();
      ctx.ellipse(x - d.r * 0.5 + k * d.r * 0.35, y + d.r + 4, 8, 2.4, 0, 0, TAU);
      ctx.fill();
    }
    return true;
  }
  if (d.type === 'train') {
    // a little steam train going along the far side of the valley, coaches behind
    const s = d.s;
    const coaches = 4;
    for (let k = 0; k < coaches; k++) {
      const cx = x - 40 * s - k * 36 * s;
      ctx.fillStyle = d.coach;
      ctx.fillRect(cx - 33 * s, y - 11 * s, 33 * s, 9 * s);
      ctx.fillStyle = alpha('#f8e8c8', 0.55);
      for (let w = 0; w < 5; w++) ctx.fillRect(cx - 30 * s + w * 6 * s, y - 9.4 * s, 3.4 * s, 3 * s);
      ctx.fillStyle = d.color;
      ctx.fillRect(cx - 34 * s, y - 12 * s, 35 * s, 1.6 * s);
      ctx.fillRect(cx - 30 * s, y - 2 * s, 3 * s, 2 * s);
      ctx.fillRect(cx - 6 * s, y - 2 * s, 3 * s, 2 * s);
    }
    ctx.fillStyle = d.color;
    // tender, then the engine: boiler, cab, chimney
    ctx.fillRect(x - 38 * s, y - 9 * s, 14 * s, 8 * s);
    ctx.fillRect(x - 22 * s, y - 15 * s, 9 * s, 14 * s);
    ctx.fillRect(x - 24 * s, y - 16 * s, 13 * s, 2 * s);
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - 14 * s, y - 11 * s, 16 * s, 8 * s, 3 * s) : ctx.rect(x - 14 * s, y - 11 * s, 16 * s, 8 * s);
    ctx.fill();
    ctx.fillRect(x - 3 * s, y - 16 * s, 3 * s, 6 * s);
    ctx.fillRect(x - 15 * s, y - 3 * s, 18 * s, 2 * s);
    for (const wx of [-10, -4, 1]) {
      ctx.beginPath();
      ctx.arc(x + wx * s, y - 1.6 * s, 1.8 * s, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = alpha('#ffd890', 0.8);
    ctx.fillRect(x - 20 * s, y - 13 * s, 3 * s, 3 * s);
    // the smoke stays where it was puffed out while the train runs on
    for (let k = 0; k < 12; k++) {
      const p = fract(t * 0.45 + k / 12);
      const age = p * 2.6;
      const px = x - 1.5 * s - d.vx * age - age * 6;
      const py = y - 17 * s - age * 16 * s - Math.sqrt(age) * 4;
      ctx.fillStyle = alpha(d.steam, 0.55 * (1 - p) * (1 - p));
      ctx.beginPath();
      ctx.arc(px, py, (3 + p * 13) * s, 0, TAU);
      ctx.fill();
    }
    return true;
  }
  if (d.type === 'ferris') {
    const a0 = t * 0.11;
    const n = 12;
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, d.r, 0, TAU);
    ctx.moveTo(x + d.r * 0.92, y);
    ctx.arc(x, y, d.r * 0.92, 0, TAU);
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * TAU;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * d.r, y + Math.sin(a) * d.r);
    }
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cols = [P.lamp, '#ff7a9a', '#7ad0ff', '#fff2c0'];
    for (let k = 0; k < n * 2; k++) {
      const a = a0 + (k / (n * 2)) * TAU;
      const on = 0.5 + 0.5 * Math.sin(t * 4 - k * 0.8);
      const lx = x + Math.cos(a) * d.r;
      const ly = y + Math.sin(a) * d.r;
      ctx.fillStyle = alpha(cols[k % cols.length], 0.25 * on);
      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = alpha(cols[k % cols.length], 0.5 + 0.5 * on);
      ctx.fillRect(lx - 1, ly - 1, 2, 2);
    }
    ctx.restore();
    // the cars hang level as the wheel turns
    for (let k = 0; k < n; k++) {
      const a = a0 + (k / n) * TAU;
      const gx = x + Math.cos(a) * d.r;
      const gy = y + Math.sin(a) * d.r;
      ctx.fillStyle = d.color;
      ctx.fillRect(gx - 0.5, gy, 1, 4);
      ctx.fillStyle = mix('#c8484a', '#1a1830', 0.35);
      ctx.beginPath();
      ctx.moveTo(gx - 5, gy + 4);
      ctx.lineTo(gx + 5, gy + 4);
      ctx.lineTo(gx + 4, gy + 10);
      ctx.lineTo(gx - 4, gy + 10);
      ctx.fill();
      ctx.fillStyle = alpha(P.window, 0.7);
      ctx.fillRect(gx - 3, gy + 5, 6, 2);
    }
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, TAU);
    ctx.fill();
    return true;
  }
  if (d.type === 'carousel') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y + d.h * 0.5, 0, x, y + d.h * 0.5, d.w * 0.8);
    g.addColorStop(0, alpha(P.lamp, 0.35));
    g.addColorStop(1, alpha(P.lamp, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - d.w, y - d.h, d.w * 2, d.h * 2.4);
    for (let k = 0; k < 18; k++) {
      const u = k / 17;
      const on = 0.5 + 0.5 * Math.sin(t * 5 - k * 1.1);
      ctx.fillStyle = alpha('#fff0c0', 0.4 + 0.6 * on);
      ctx.fillRect(x - d.w / 2 + u * d.w - 1, y - 1, 2, 2);
    }
    ctx.restore();
    // horses going up and down as the platform turns
    ctx.fillStyle = mix('#f0e0c8', '#1a1830', 0.45);
    for (let k = 0; k < 5; k++) {
      const p = fract(t * 0.12 + k / 5);
      const hx = x - d.w * 0.42 + p * d.w * 0.84;
      const hy = y + d.h * 0.45 + Math.sin(t * 2.4 + k * 1.7) * 3;
      const depth = Math.sin(p * Math.PI);
      ctx.globalAlpha = 0.5 + 0.5 * depth;
      ctx.fillRect(hx - 0.5, y, 1, d.h);
      ctx.beginPath();
      ctx.ellipse(hx, hy, 5, 2.6, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(hx + 3, hy - 5, 2.4, 5);
      ctx.globalAlpha = 1;
    }
    return true;
  }
  if (d.type === 'bulbs') {
    ctx.strokeStyle = 'rgba(10,8,16,0.7)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + d.dx / 2, y + d.sag * 2, x + d.dx, y);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cols = ['#ffd27a', '#ff8a6a', '#fff4d0', '#9ad8ff'];
    for (let k = 1; k < d.n; k++) {
      const u = k / d.n;
      const bx = x + d.dx * u;
      const by = y + d.sag * 4 * u * (1 - u) + 1.6;
      const on = 0.65 + 0.35 * Math.sin(t * 2.2 + k * 1.9 + d.phase);
      const c = cols[k % cols.length];
      ctx.fillStyle = alpha(c, 0.18 * on);
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = alpha(c, on);
      ctx.beginPath();
      ctx.arc(bx, by, 1.5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    return true;
  }
  return false;
}
