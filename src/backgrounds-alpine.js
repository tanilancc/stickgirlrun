// Chapter 3, the way down: alpine pastures under peaks turning pink at sunrise, a gorge with a
// waterfall below a path cut into the cliff, and a turquoise lake ringed with pines. Painted with
// the same tools as backgrounds.js; the waterfall is drawn each frame by alpineDyn below.

import { TW, periodic, layer, each, vgrad, ridge, litColumns, hazeOver, pine, cloudLayer } from './backgrounds.js';
import { hash, mulberry32 } from './rng.js';
import { mix, alpha, TAU, fract } from './util.js';

// ---------------------------------------------------------------- silhouettes

/** An alpine chalet: a stone ground floor, dark timber above, a wide low roof weighed with stones. */
function chalet(g, x, yb, s, wood, stone, roof, win) {
  const w = 44 * s;
  g.fillStyle = stone;
  g.fillRect(x, yb - 12 * s, w, 12 * s);
  g.fillStyle = wood;
  g.fillRect(x, yb - 30 * s, w, 18 * s);
  g.fillStyle = roof;
  g.beginPath();
  g.moveTo(x - 8 * s, yb - 29 * s);
  g.lineTo(x + w / 2, yb - 44 * s);
  g.lineTo(x + w + 8 * s, yb - 29 * s);
  g.fill();
  g.fillStyle = win;
  for (let k = 0; k < 3; k++) g.fillRect(x + 6 * s + k * 13 * s, yb - 24 * s, 5 * s, 6 * s);
  // the balcony rail
  g.fillStyle = mix(wood, '#000000', 0.3);
  g.fillRect(x - 2 * s, yb - 17 * s, w + 4 * s, 1.6 * s);
}

function cow(g, x, y, s, body, patch, flip) {
  const d = flip ? -1 : 1;
  g.fillStyle = body;
  g.beginPath();
  g.ellipse(x, y - 5 * s, 7 * s, 3.6 * s, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(x + 7.4 * s * d, y - 6.4 * s, 2.4 * s, 1.8 * s, 0.3 * d, 0, TAU);
  g.fill();
  for (const lx of [-5, -2.6, 3, 5.2]) g.fillRect(x + lx * s, y - 2 * s, 1 * s, 2.4 * s);
  g.fillStyle = patch;
  g.beginPath();
  g.ellipse(x - 2 * s * d, y - 5.6 * s, 2.6 * s, 1.8 * s, 0.4, 0, TAU);
  g.fill();
}

function flowers(g, x0, x1, yfn, cols, density, size) {
  for (let x = x0; x < x1; x += 2) {
    if (hash(x * 7) > density) continue;
    g.fillStyle = cols[Math.floor(hash(x * 13) * cols.length)];
    g.fillRect(x, yfn(x) - hash(x * 3) * 6, size, size);
  }
}

function mirrored(g, water, a, fn) {
  fn();
  g.save();
  g.globalAlpha = a;
  g.translate(0, water * 2);
  g.scale(1, -1);
  fn();
  g.restore();
}

// ---------------------------------------------------------------- themes

export const ALPINE_THEMES = {
  pasture(P, rng) {
    const layers = [];
    layers.push(
      layer(60, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 3, 4, 0.55);
        const fn = (x) => 330 - (0.25 + 0.75 * Math.abs(n(x / TW))) * 230;
        // the peaks catch the first light: pink on the snow, violet in the shadows
        litColumns(g, fn, 600, { lit: mix(P.far, '#f0b0a0', 0.35), dark: mix(P.far, '#5a4a7a', 0.35), sunLeft: true, contrast: 2.6, smooth: 6, snowLine: 230, snowLit: '#ffe0d8', snowDark: '#a898c8' });
        hazeOver(g, P.haze, 200, 600, 0.06, 0.45, 60);
      })
    );
    layers.push(
      layer(250, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 382 - (0.2 + 0.8 * Math.abs(n(x / TW))) * 46;
        ridge(g, fn, 620, P.mid);
        // dark stands of spruce, and the pasture light between them
        for (let i = 0; i < 14; i++) {
          const x0 = rng() * TW;
          const w = 40 + rng() * 120;
          for (let x = x0; x < x0 + w; x += 4) each(x, 10, (xx) => pine(g, xx, fn(xx) + 6 + hash(xx) * 8, 14 + hash(xx * 3) * 12, mix('#2a4a34', P.mid, 0.35), rng, null));
        }
        for (let i = 0; i < 9; i++) {
          const x = rng() * TW;
          each(x, 40, (xx) => chalet(g, xx, fn(xx) + 8, 0.55, mix('#6a4028', P.mid, 0.3), mix('#e8e0d0', P.mid, 0.35), mix('#4a3e3a', P.mid, 0.3), alpha('#2a1a10', 0.6)));
        }
        for (let i = 0; i < 30; i++) {
          const x = rng() * TW;
          cow(g, x, fn(x) + 10 + rng() * 20, 0.6, mix('#7a4a2a', P.mid, 0.3), mix('#f0e8e0', P.mid, 0.3), rng() < 0.5);
        }
        hazeOver(g, P.haze, 290, 620, 0.14, 0.25);
      })
    );
    layers.push(
      layer(250, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.55);
        const fn = (x) => 404 - Math.abs(n(x / TW)) * 22;
        ridge(g, fn, 640, P.near);
        flowers(g, 0, TW, (x) => fn(x) + 6, ['#f2d040', '#e8e8f0', '#c868c8', '#6a8ae0', '#f08a6a'].map((c) => mix(c, P.near, 0.2)), 0.5, 2);
        // a chalet up close, and cows wandering, bells round their necks
        const cx = rng() * TW;
        each(cx, 90, (xx) => chalet(g, xx, fn(xx) + 4, 1.4, mix('#6a4028', P.near, 0.15), mix('#ece4d4', P.near, 0.2), mix('#3a302c', P.near, 0.2), alpha('#2a1a10', 0.7)));
        for (let i = 0; i < 12; i++) {
          const x = rng() * TW;
          each(x, 20, (xx) => {
            const y = fn(xx) + 6;
            cow(g, xx, y, 1.4, mix(rng() < 0.6 ? '#8a5a34' : '#e8e0d8', P.near, 0.15), mix('#f4ece4', P.near, 0.15), rng() < 0.5);
            g.fillStyle = mix('#d8b040', P.near, 0.2);
            g.fillRect(xx - 1, y - 4, 2.4, 2.4);
          });
        }
        // a split-rail fence wandering over the slope
        g.strokeStyle = mix('#5a4030', P.near, 0.3);
        g.lineWidth = 1.4;
        const f0 = rng() * TW;
        g.beginPath();
        for (let x = f0; x < f0 + 500; x += 18) {
          const xx = x % TW;
          g.moveTo(xx, fn(xx) + 2);
          g.lineTo(xx + 3, fn(xx) - 12);
          g.moveTo(xx - 2, fn(xx) - 5);
          g.lineTo(xx + 20, fn(xx + 18) - 8);
        }
        g.stroke();
        hazeOver(g, P.haze, 330, 640, 0.05, 0.02, 250);
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 7;
        const col = mix(P.near, '#000000', 0.25);
        ridge(g, fn, 660, col);
        g.strokeStyle = col;
        g.lineWidth = 1.1;
        g.beginPath();
        for (let x = 0; x < TW; x += 3) {
          const h = 8 + hash(x * 5) * 14;
          g.moveTo(x, fn(x) + 2);
          g.quadraticCurveTo(x + 1, fn(x) - h * 0.6, x + (hash(x) - 0.5) * 6, fn(x) - h);
        }
        g.stroke();
        flowers(g, 0, TW, (x) => fn(x) - 6, ['#f2d040', '#ffffff', '#c868c8', '#6a8ae0'].map((c) => mix(c, col, 0.35)), 0.3, 2.6);
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 40, 180, false, 0.8), birds: true };
  },

  cliffpath(P, rng) {
    const layers = [];
    layers.push(
      layer(60, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 3, 4, 0.55);
        const fn = (x) => 320 - (0.3 + 0.7 * Math.abs(n(x / TW))) * 220;
        litColumns(g, fn, 600, { lit: mix(P.far, P.light, 0.3), dark: mix(P.far, '#3a4458', 0.35), sunLeft: false, contrast: 2.4, smooth: 6, snowLine: 200, snowLit: '#ffffff', snowDark: '#b0bcd8' });
        hazeOver(g, P.haze, 160, 600, 0.06, 0.5, 60);
      })
    );
    layers.push(
      layer(80, 640, 0.1, 0.55, (g, dyn) => {
        // the far wall of the gorge: grey limestone in tall slabs, pines on every ledge
        const n = periodic(rng, 5, 3, 0.6);
        const fn = (x) => 200 - Math.abs(n(x / TW)) * 70;
        litColumns(g, fn, 640, { lit: mix(P.mid, '#c8ccd0', 0.35), dark: mix(P.mid, '#2a3038', 0.3), sunLeft: false, contrast: 2, smooth: 4, step: 3 });
        g.save();
        g.globalCompositeOperation = 'source-atop';
        g.strokeStyle = alpha('#1a2028', 0.25);
        g.lineWidth = 1.2;
        for (let x = 0; x < TW; x += 9) {
          if (hash(x * 3) < 0.5) continue;
          g.beginPath();
          g.moveTo(x, fn(x) + 4);
          g.lineTo(x + (hash(x) - 0.5) * 10, 640);
          g.stroke();
        }
        for (let k = 0; k < 7; k++) {
          const y = 230 + k * 50;
          g.fillStyle = alpha('#3a4a34', 0.5);
          for (let x = 0; x < TW; x += 6) if (hash(x * 11 + k) > 0.6 && y > fn(x) + 10) pine(g, x, y + hash(x + k) * 10, 8 + hash(x * 5 + k) * 8, mix('#2a3a30', P.mid, 0.3), rng, null);
        }
        g.restore();
        // a waterfall dropping the whole height of it
        const wx = 300 + rng() * 1200;
        dyn.push({ type: 'waterfall', x: wx, y: fn(wx) + 10, h: 640 - fn(wx), w: 16, span: 80, color: '#f4fbff' });
        hazeOver(g, P.haze, 120, 640, 0.1, 0.45, 80);
      })
    );
    layers.push(
      layer(330, 660, 0.22, 0.7, (g) => {
        // the tops of pines growing up out of the gorge, far below the path
        for (let x = 0; x < TW; x += 5) pine(g, x, 470 + hash(x * 7) * 30, 40 + hash(x * 3) * 30, mix('#2a4034', P.near, 0.3), rng, null);
        hazeOver(g, P.haze, 330, 660, 0.35, 0.6, 330);
      })
    );
    layers.push(
      layer(-120, 660, 0.56, 0.9, (g) => {
        // our own cliff, rising above the path in buttresses, with chains bolted along it
        for (let i = 0; i < 2; i++) {
          const x0 = i * 1024 + rng() * 300;
          const w = 90 + rng() * 80;
          const top = -120;
          const col = mix(P.near, P.haze, 0.3);
          g.fillStyle = vgrad(g, top, 420, [
            [0, mix(col, P.haze, 0.25)],
            [1, col],
          ]);
          g.beginPath();
          g.moveTo(x0, 420);
          for (let y = 420; y > top; y -= 20) g.lineTo(x0 + (hash(y + i) - 0.5) * 16 - (420 - y) * 0.04, y);
          g.lineTo(x0 + w, top);
          for (let y = top; y < 420; y += 20) g.lineTo(x0 + w + (hash(y * 3 + i) - 0.5) * 16 + (420 - y) * 0.03, y);
          g.closePath();
          g.fill();
          g.strokeStyle = alpha('#000000', 0.25);
          g.lineWidth = 1;
          for (let k = 0; k < 8; k++) {
            g.beginPath();
            const sx = x0 + 10 + hash(k + i * 9) * (w - 20);
            g.moveTo(sx, top + hash(k * 3) * 200);
            g.lineTo(sx + (hash(k) - 0.5) * 20, top + 200 + hash(k * 7) * 300);
            g.stroke();
          }
          g.fillStyle = mix('#4a6a3a', col, 0.4);
          for (let k = 0; k < 6; k++) {
            g.beginPath();
            g.ellipse(x0 + hash(k * 5 + i) * w, 100 + hash(k * 7 + i) * 280, 8, 3, 0, 0, TAU);
            g.fill();
          }
          // the chain the walkers hold, sagging between pins in the rock
          g.strokeStyle = mix('#8a8a90', col, 0.4);
          g.lineWidth = 1.4;
          g.beginPath();
          for (let x = x0 + 6; x < x0 + w - 30; x += 40) {
            g.moveTo(x, 372);
            g.quadraticCurveTo(x + 20, 386, x + 40, 372);
          }
          g.stroke();
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 30, 160, false, 0.85), rays: true, birds: true, fogAfter: { 2: { color: '#ffffff', y: 440, a: 0.4 } } };
  },

  lake(P, rng) {
    const layers = [];
    const W = 390;
    layers.push(
      layer(60, W + 2, 0.04, 0.5, (g) => {
        const n = periodic(rng, 3, 4, 0.55);
        const fn = (x) => 330 - (0.25 + 0.75 * Math.abs(n(x / TW))) * 220;
        litColumns(g, fn, W + 2, { lit: mix(P.far, P.light, 0.3), dark: mix(P.far, '#3a4a6a', 0.3), sunLeft: true, contrast: 2.2, smooth: 6, snowLine: 210, snowLit: '#ffffff', snowDark: '#b8c8e0' });
        hazeOver(g, P.haze, 160, W + 2, 0.05, 0.35, 60);
      })
    );
    layers.push(
      layer(220, 470, 0.12, 0.6, (g) => {
        // forested flanks coming down to the water, and all of it again upside down in the lake
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => W - Math.max(0, 0.2 + n(x / TW)) * 120;
        mirrored(g, W, 0.42, () => {
          ridge(g, fn, W + 0.5, P.mid);
          const r = mulberry32(31);
          for (let x = 0; x < TW; x += 4) pine(g, x, Math.min(W, fn(x) + 6 + r() * 30), 14 + r() * 14, mix('#1e3a2a', P.mid, 0.3), r, null);
        });
        hazeOver(g, P.haze, 220, 470, 0.15, 0.1, 220);
      })
    );
    layers.push(
      layer(300, 470, 0.3, 0.75, (g) => {
        // the far shore up close: a boathouse, boats pulled up, a jetty and the swimmers' raft
        const bx = rng() * TW;
        each(bx, 120, (xx) => {
          mirrored(g, W, 0.35, () => {
            g.fillStyle = mix('#8a3a2a', P.mid, 0.2);
            g.fillRect(xx, W - 26, 60, 26);
            g.fillStyle = mix('#3a3030', P.mid, 0.2);
            g.beginPath();
            g.moveTo(xx - 6, W - 25);
            g.lineTo(xx + 30, W - 44);
            g.lineTo(xx + 66, W - 25);
            g.fill();
            g.fillStyle = mix('#1a1a1a', P.mid, 0.2);
            g.fillRect(xx + 20, W - 18, 20, 18);
          });
          g.fillStyle = mix('#7a5a3a', P.mid, 0.3);
          g.fillRect(xx + 66, W - 2, 90, 3);
          for (let k = 0; k < 6; k++) g.fillRect(xx + 70 + k * 16, W, 1.6, 6);
        });
        for (let i = 0; i < 7; i++) {
          const x = rng() * TW;
          const c = ['#e8433a', '#f0e6d0', '#3a7ab0', '#f2c040'][i % 4];
          mirrored(g, W + 1, 0.3, () => {
            g.fillStyle = mix(c, P.mid, 0.25);
            g.beginPath();
            g.moveTo(x - 10, W - 3);
            g.lineTo(x + 10, W - 3);
            g.lineTo(x + 7, W + 0.5);
            g.lineTo(x - 7, W + 0.5);
            g.fill();
          });
        }
        g.fillStyle = mix('#c8b8a0', P.mid, 0.3);
        const rx = rng() * TW;
        g.fillRect(rx, W + 8, 22, 3);
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        // pines and boulders on our own shore
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 6;
        const col = mix(P.near, '#000000', 0.2);
        ridge(g, fn, 660, mix('#8a8478', col, 0.5));
        for (let x = rng() * 300; x < TW; x += 260 + rng() * 300) each(x, 60, (xx) => pine(g, xx, fn(xx) + 4, 150 + rng() * 80, col, rng, null));
        for (let x = 0; x < TW; x += 40 + hash(x) * 60) {
          g.fillStyle = mix('#7a7468', col, 0.4);
          g.beginPath();
          g.ellipse(x, fn(x) - 2, 8 + hash(x * 3) * 10, 5 + hash(x * 5) * 4, 0, Math.PI, 0);
          g.fill();
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 5, 30, 170, false, 0.8), sea: { y: W }, birds: true };
  },
};

// ---------------------------------------------------------------- moving parts

/** Draw a moving background part of the way down. False if the type is not one of ours. */
export function alpineDyn(ctx, d, x, y, t) {
  if (d.type !== 'waterfall') return false;
  // a white ribbon of falling water, streaks running down it, spray blooming at the foot
  const g = ctx.createLinearGradient(x - d.w, 0, x + d.w, 0);
  g.addColorStop(0, alpha(d.color, 0));
  g.addColorStop(0.3, alpha(d.color, 0.75));
  g.addColorStop(0.7, alpha(d.color, 0.75));
  g.addColorStop(1, alpha(d.color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - d.w * 0.4, y);
  ctx.quadraticCurveTo(x - d.w * 0.6, y + d.h * 0.5, x - d.w, y + d.h);
  ctx.lineTo(x + d.w, y + d.h);
  ctx.quadraticCurveTo(x + d.w * 0.6, y + d.h * 0.5, x + d.w * 0.4, y);
  ctx.fill();
  ctx.strokeStyle = alpha('#ffffff', 0.7);
  ctx.lineWidth = 1;
  for (let k = 0; k < 9; k++) {
    const p = fract(t * 0.6 + k / 9);
    const sx = x + (hash(k) - 0.5) * d.w;
    const sy = y + p * d.h;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (hash(k) - 0.5) * 2, sy + 22);
    ctx.stroke();
  }
  for (let k = 0; k < 4; k++) {
    const p = fract(t * 0.2 + k / 4);
    ctx.fillStyle = alpha('#ffffff', 0.18 * (1 - p));
    ctx.beginPath();
    ctx.arc(x + (k - 1.5) * 10, y + d.h - 40 - p * 40, 18 + p * 30, 0, TAU);
    ctx.fill();
  }
  return true;
}
