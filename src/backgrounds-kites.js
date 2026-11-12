// Chapter 8 backgrounds: a valley of stone chimneys with balloons going up at sunrise, a green
// river between karst peaks, the steppe with its yurts and horses, a high pass hung with prayer
// flags below a monastery, a city of carved stone and stepwells, and a hill by the sea full of
// kites. Painted with the same tools as backgrounds.js; balloons, kites and flags move, drawn each
// frame by kiteDyn below.

import { TW, periodic, layer, each, ridge, litColumns, hazeOver, tree, building, cloudLayer } from './backgrounds.js';
import { hash, mulberry32 } from './rng.js';
import { mix, alpha, TAU, fract } from './util.js';

// ---------------------------------------------------------------- silhouettes

/** A fairy chimney: a cone of soft rock with a darker cap balanced on top, doors cut into it. */
function chimney(g, x, yb, h, col, cap, door, rng) {
  const w = h * (0.22 + rng() * 0.1);
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x - w, yb);
  g.quadraticCurveTo(x - w * 0.5, yb - h * 0.5, x - w * 0.22, yb - h * 0.9);
  g.lineTo(x + w * 0.22, yb - h * 0.9);
  g.quadraticCurveTo(x + w * 0.5, yb - h * 0.5, x + w, yb);
  g.fill();
  g.fillStyle = cap;
  g.beginPath();
  g.ellipse(x, yb - h * 0.92, w * 0.42, h * 0.07, 0, 0, TAU);
  g.fill();
  if (door && h > 30) {
    g.fillStyle = door;
    for (let k = 0; k < 2; k++) {
      const dy = yb - h * (0.25 + k * 0.25);
      g.fillRect(x - w * 0.12 + (k - 0.5) * w * 0.3, dy, Math.max(1.4, w * 0.12), Math.max(2, h * 0.07));
    }
  }
}

/** A karst peak: tall, rounded, steep-sided, furred with green. */
function karstPeak(g, x, yb, h, w, col) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x - w, yb);
  g.bezierCurveTo(x - w * 0.95, yb - h * 0.7, x - w * 0.5, yb - h * 1.05, x, yb - h);
  g.bezierCurveTo(x + w * 0.5, yb - h * 1.05, x + w * 0.95, yb - h * 0.7, x + w, yb);
  g.fill();
}

function yurt(g, x, yb, s, felt, trim) {
  g.fillStyle = felt;
  g.beginPath();
  g.moveTo(x - 14 * s, yb);
  g.lineTo(x - 14 * s, yb - 9 * s);
  g.quadraticCurveTo(x, yb - 20 * s, x + 14 * s, yb - 9 * s);
  g.lineTo(x + 14 * s, yb);
  g.fill();
  g.fillStyle = trim;
  g.fillRect(x - 14 * s, yb - 6 * s, 28 * s, 1.4 * s);
  g.fillRect(x - 2.4 * s, yb - 7 * s, 4.8 * s, 7 * s);
}

function horse(g, x, y, s, col, flip) {
  const d = flip ? -1 : 1;
  g.fillStyle = col;
  g.beginPath();
  g.ellipse(x, y - 7 * s, 6 * s, 2.8 * s, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.moveTo(x + 4 * d * s, y - 8 * s);
  g.lineTo(x + 8 * d * s, y - 13 * s);
  g.lineTo(x + 10 * d * s, y - 12 * s);
  g.lineTo(x + 6 * d * s, y - 6 * s);
  g.fill();
  for (const lx of [-4.5, -2.6, 2.8, 4.6]) g.fillRect(x + lx * s, y - 5 * s, 0.9 * s, 5 * s);
  g.fillRect(x - 6.5 * d * s, y - 8 * s, 1 * s, 5 * s);
}

/** A monastery on its cliff: stacked white walls, red upper storeys, gold roofs. */
function monastery(g, x, yb, s, white, red, gold, win) {
  const blocks = [
    [0, 0, 80, 34],
    [10, 34, 60, 24],
    [24, 58, 32, 18],
  ];
  for (const [bx, by, bw, bh] of blocks) {
    g.fillStyle = by >= 34 ? red : white;
    g.fillRect(x + bx * s, yb - (by + bh) * s, bw * s, bh * s);
    g.fillStyle = win;
    for (let k = 0; k < Math.floor(bw / 10); k++) g.fillRect(x + (bx + 4 + k * 10) * s, yb - (by + bh * 0.6) * s, 3 * s, 4 * s);
  }
  g.fillStyle = gold;
  g.beginPath();
  g.moveTo(x + 20 * s, yb - 76 * s);
  g.lineTo(x + 40 * s, yb - 86 * s);
  g.lineTo(x + 60 * s, yb - 76 * s);
  g.fill();
}

/** A stepwell seen from the side: a funnel of steps going down in zigzag flights. */
function stepwell(g, x, yb, w, depth, col, dark, water) {
  g.fillStyle = dark;
  g.beginPath();
  g.moveTo(x, yb);
  g.lineTo(x + w * 0.4, yb + depth);
  g.lineTo(x + w * 0.6, yb + depth);
  g.lineTo(x + w, yb);
  g.fill();
  g.fillStyle = col;
  const n = 9;
  for (let k = 0; k < n; k++) {
    const u = k / n;
    const y = yb + u * depth;
    const inset = u * w * 0.4;
    g.fillRect(x + inset, y, w - inset * 2, 1.6);
    for (let j = 0; j < 6; j++) g.fillRect(x + inset + (j / 6) * (w - inset * 2), y + 1.6, 1, depth / n - 1.6);
  }
  g.fillStyle = water;
  g.fillRect(x + w * 0.4, yb + depth - 4, w * 0.2, 4);
}

// ---------------------------------------------------------------- themes

export const KITE_THEMES = {
  chimneys(P, rng) {
    const layers = [];
    layers.push(
      layer(200, 600, 0.04, 0.5, (g, dyn) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 350 - (0.3 + 0.7 * Math.abs(n(x / TW))) * 70;
        litColumns(g, fn, 600, { lit: mix(P.far, '#ffd0b0', 0.35), dark: mix(P.far, '#6a5070', 0.3), sunLeft: false, contrast: 2, smooth: 8 });
        hazeOver(g, P.haze, 220, 600, 0.25, 0.5);
        for (let i = 0; i < 14; i++) dyn.push({ type: 'hotair', x: rng() * TW, y: 120 + rng() * 180, s: 0.4 + rng() * 0.4, phase: rng() * 10, col: ['#e8433a', '#f2c040', '#3a8ad8', '#5ab060', '#e870a8', '#f08a3a'][i % 6], span: 40 });
      })
    );
    layers.push(
      layer(200, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 4, 3, 0.55);
        const fn = (x) => 396 - Math.abs(n(x / TW)) * 16;
        ridge(g, fn, 620, P.mid);
        for (let x = 0; x < TW; x += 6 + hash(x) * 8) chimney(g, x, fn(x) + 4, 30 + hash(x * 3) * 60, mix(P.mid, '#f0d8c0', 0.25 + hash(x * 5) * 0.2), mix('#5a4030', P.mid, 0.3), mix('#3a2418', P.mid, 0.3), rng);
        hazeOver(g, P.haze, 260, 620, 0.12, 0.2, 200);
      })
    );
    layers.push(
      layer(160, 640, 0.3, 0.75, (g, dyn) => {
        const n = periodic(rng, 5, 3, 0.5);
        const fn = (x) => 404 - n(x / TW) * 6;
        ridge(g, fn, 640, P.near);
        for (let x = rng() * 100; x < TW; x += 70 + rng() * 120) each(x, 60, (xx) => chimney(g, xx, fn(xx) + 4, 110 + rng() * 120, mix('#e0c0a0', P.near, 0.25), mix('#4a3020', P.near, 0.2), mix('#2a1810', P.near, 0.2), rng));
        for (let i = 0; i < 3; i++) dyn.push({ type: 'hotair', x: rng() * TW, y: 200 + rng() * 80, s: 1.2 + rng() * 0.5, phase: rng() * 10, col: ['#e8433a', '#f2c040', '#3a8ad8'][i], span: 60 });
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 5, 40, 180, true, 0.7) };
  },

  karst(P, rng) {
    const layers = [];
    const W = 394;
    const peaks = (g, n, hMin, hMax, wMin, wMax, col) => {
      for (let i = 0; i < n; i++) {
        const x = rng() * TW;
        const h = hMin + rng() * (hMax - hMin);
        const w = wMin + rng() * (wMax - wMin);
        each(x, w, (xx) => karstPeak(g, xx, W, h, w, col));
      }
    };
    layers.push(
      layer(60, W + 2, 0.04, 0.5, (g) => {
        peaks(g, 40, 120, 240, 30, 60, P.far);
        hazeOver(g, P.haze, 60, W + 2, 0.35, 0.55, 60);
      })
    );
    layers.push(
      layer(80, 470, 0.12, 0.6, (g) => {
        // nearer peaks, with their reflections in the river
        g.save();
        peaks(g, 18, 150, 300, 36, 70, mix(P.mid, P.haze, 0.2));
        g.restore();
        const r = mulberry32(5);
        g.save();
        g.globalAlpha = 0.25;
        g.translate(0, W * 2);
        g.scale(1, -1);
        for (let i = 0; i < 18; i++) karstPeak(g, r() * TW, W, 150 + r() * 150, 36 + r() * 34, mix(P.mid, P.haze, 0.2));
        g.restore();
        hazeOver(g, P.haze, 80, 470, 0.2, 0.3, 80);
      })
    );
    layers.push(
      layer(300, 480, 0.3, 0.75, (g) => {
        // the river itself: fishermen on bamboo rafts, a lamp on each, birds on the bow
        for (let i = 0; i < 6; i++) {
          const x = rng() * TW;
          each(x, 40, (xx) => {
            g.fillStyle = mix('#8a7a4a', P.near, 0.3);
            g.fillRect(xx - 24, W + 4, 48, 3);
            g.fillStyle = mix('#1a1a14', P.near, 0.2);
            g.fillRect(xx - 2, W - 12, 3, 16);
            g.beginPath();
            g.moveTo(xx - 6, W - 12);
            g.lineTo(xx + 1, W - 18);
            g.lineTo(xx + 8, W - 12);
            g.fill();
            g.fillRect(xx + 14, W - 4, 1, 8);
            g.fillRect(xx + 10, W - 8, 1, 12);
            g.beginPath();
            g.ellipse(xx - 16, W + 1, 3, 1.6, 0, 0, TAU);
            g.ellipse(xx + 18, W + 1, 3, 1.6, 0, 0, TAU);
            g.fill();
          });
        }
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 6;
        const col = mix(P.near, '#000000', 0.25);
        ridge(g, fn, 660, col);
        // bamboo clumps along our bank
        g.strokeStyle = col;
        for (let x = 0; x < TW; x += 120 + hash(x) * 120) {
          for (let k = 0; k < 7; k++) {
            g.lineWidth = 3;
            g.beginPath();
            g.moveTo(x + k * 4, fn(x) + 2);
            g.quadraticCurveTo(x + k * 4 + 6, fn(x) - 80, x + k * 10 - 10, fn(x) - 120 - hash(x + k) * 40);
            g.stroke();
          }
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 4, 40, 160, true, 0.6), sea: { y: W }, birds: true, fogAfter: { 0: { color: '#ffffff', y: 320, a: 0.45 }, 1: { color: '#ffffff', y: 380, a: 0.35 } } };
  },

  steppe(P, rng) {
    const layers = [];
    layers.push(
      layer(260, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 370 - (0.3 + 0.7 * Math.abs(n(x / TW))) * 40;
        ridge(g, fn, 600, P.far);
        hazeOver(g, P.haze, 280, 600, 0.25, 0.45);
      })
    );
    layers.push(
      layer(280, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 392 - Math.abs(n(x / TW)) * 18;
        ridge(g, fn, 620, P.mid);
        // cloud shadows drifting over the grass
        g.save();
        g.globalCompositeOperation = 'source-atop';
        for (let i = 0; i < 12; i++) {
          g.fillStyle = alpha('#203010', 0.18);
          g.beginPath();
          g.ellipse(rng() * TW, 400 + rng() * 30, 80 + rng() * 120, 8 + rng() * 8, 0, 0, TAU);
          g.fill();
        }
        g.restore();
        for (let i = 0; i < 4; i++) {
          const cx = rng() * TW;
          each(cx, 80, (xx) => {
            for (let k = 0; k < 3; k++) yurt(g, xx + k * 34, fn(xx + k * 34) + 4, 0.9, mix('#f0ece0', P.mid, 0.2), mix('#c83a2a', P.mid, 0.3));
          });
        }
        for (let i = 0; i < 40; i++) {
          const x = rng() * TW;
          horse(g, x, fn(x) + 8 + rng() * 20, 0.8, mix(['#5a3a24', '#2a2018', '#a87a4a', '#e8e0d0'][i % 4], P.mid, 0.3), rng() < 0.5);
        }
        hazeOver(g, P.haze, 300, 620, 0.08, 0.15);
      })
    );
    layers.push(
      layer(300, 660, 0.4, 0.8, (g) => {
        const n = periodic(rng, 5, 3, 0.5);
        const fn = (x) => 408 - n(x / TW) * 6;
        ridge(g, fn, 660, P.near);
        g.strokeStyle = mix('#a8b85a', P.near, 0.3);
        g.lineWidth = 1;
        g.beginPath();
        for (let x = 0; x < TW; x += 3) {
          const h = 6 + hash(x * 5) * 10;
          g.moveTo(x, fn(x) + 2);
          g.lineTo(x + 3, fn(x) - h);
        }
        g.stroke();
        // a rider or two crossing at a canter
        for (let i = 0; i < 3; i++) {
          const x = rng() * TW;
          horse(g, x, fn(x) + 4, 2.4, mix('#3a2418', P.near, 0.2), false);
          g.fillStyle = mix('#c83a2a', P.near, 0.2);
          g.fillRect(x - 2, fn(x) - 30, 5, 10);
          g.beginPath();
          g.arc(x + 0.5, fn(x) - 32, 2.6, 0, TAU);
          g.fill();
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 9, 40, 220, false, 0.95), birds: true };
  },

  monastery(P, rng) {
    const layers = [];
    layers.push(
      layer(40, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 3, 4, 0.55);
        const fn = (x) => 320 - (0.25 + 0.75 * Math.abs(n(x / TW))) * 250;
        litColumns(g, fn, 600, { lit: '#ffffff', dark: mix(P.far, '#3a4a7a', 0.3), sunLeft: true, contrast: 2.4, smooth: 6, snowLine: 230, snowLit: '#ffffff', snowDark: '#b0bcd8' });
        hazeOver(g, P.haze, 100, 600, 0.04, 0.4, 40);
      })
    );
    layers.push(
      layer(160, 640, 0.12, 0.6, (g, dyn) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 390 - Math.abs(n(x / TW)) * 70;
        litColumns(g, fn, 640, { lit: mix(P.mid, '#d8c8a8', 0.3), dark: mix(P.mid, '#3a2e28', 0.3), sunLeft: true, contrast: 2, smooth: 6 });
        let best = 0;
        for (let x = 0; x < TW; x += 8) if (fn(x) < fn(best)) best = x;
        each(best, 120, (xx) => monastery(g, xx - 40, fn(xx) + 6, 1.1, mix('#f4f0e6', P.mid, 0.15), mix('#9a2a24', P.mid, 0.2), mix('#d8a840', P.mid, 0.15), alpha('#2a1a14', 0.7)));
        for (let i = 0; i < 6; i++) {
          const x = rng() * TW;
          dyn.push({ type: 'flags', x, y: fn(x) - 6, dx: 90, sag: 16, n: 16, s: 0.7, phase: rng() * 10 });
        }
        hazeOver(g, P.haze, 220, 640, 0.08, 0.15, 160);
      })
    );
    layers.push(
      layer(280, 660, 0.4, 0.8, (g, dyn) => {
        const n = periodic(rng, 5, 3, 0.55);
        const fn = (x) => 408 - Math.abs(n(x / TW)) * 20;
        ridge(g, fn, 660, P.near);
        // chortens along the path, white and gold
        for (let i = 0; i < 6; i++) {
          const x = rng() * TW;
          each(x, 20, (xx) => {
            const y = fn(xx) + 4;
            g.fillStyle = mix('#f4f0e6', P.near, 0.2);
            g.fillRect(xx - 10, y - 10, 20, 10);
            g.beginPath();
            g.arc(xx, y - 14, 8, Math.PI, 0);
            g.fill();
            g.fillRect(xx - 1.5, y - 30, 3, 10);
            g.fillStyle = mix('#d8a840', P.near, 0.2);
            g.fillRect(xx - 2.5, y - 32, 5, 3);
          });
        }
        for (let x = 0; x < TW; x += 260) dyn.push({ type: 'flags', x, y: fn(x) - 60, dx: 260, sag: 40, n: 30, s: 1.2, phase: hash(x) * 10 });
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 5, 30, 160, false, 0.8), birds: true };
  },

  stepwell(P, rng) {
    const layers = [];
    layers.push(
      layer(220, 600, 0.04, 0.5, (g) => {
        // the old city on its ridge: walls, domes, a fort
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 370 - (0.3 + 0.7 * Math.abs(n(x / TW))) * 40;
        ridge(g, fn, 600, P.far);
        for (let x = 0; x < TW; x += 10 + hash(x) * 18) building(g, x, fn(x) + 6, 10 + hash(x * 3) * 14, 10 + hash(x * 5) * 26, mix(P.far, '#6a4a5a', 0.2), rng, { type: hash(x * 7) < 0.35 ? 'dome' : 'flat' });
        hazeOver(g, P.haze, 240, 600, 0.2, 0.45);
      })
    );
    layers.push(
      layer(220, 640, 0.12, 0.6, (g) => {
        ridge(g, () => 392, 640, mix(P.ground.top, P.mid, 0.4));
        // carved pavilions and the stepwells between them
        for (let i = 0; i < 7; i++) {
          const x = rng() * TW;
          each(x, 80, (xx) => {
            const col = mix('#e8b88a', P.mid, 0.3);
            g.fillStyle = col;
            for (const px of [xx, xx + 50]) {
              g.fillRect(px, 340, 4, 52);
            }
            g.fillRect(xx - 6, 334, 66, 8);
            g.beginPath();
            g.arc(xx + 27, 334, 26, Math.PI, 0);
            g.fill();
            g.fillRect(xx + 26, 300, 2, 10);
          });
        }
        for (let i = 0; i < 3; i++) {
          const x = rng() * TW;
          each(x, 120, (xx) => stepwell(g, xx, 392, 220, 60, mix('#f0c890', P.mid, 0.3), mix('#5a2a14', P.mid, 0.3), P.water));
        }
        hazeOver(g, P.haze, 260, 640, 0.08, 0.15, 220);
      })
    );
    layers.push(
      layer(240, 660, 0.4, 0.8, (g) => {
        const n = periodic(rng, 5, 3, 0.5);
        const fn = (x) => 408 - n(x / TW) * 6;
        ridge(g, fn, 660, mix(P.near, '#000000', 0.1));
        for (let x = rng() * 200; x < TW; x += 220 + rng() * 300) each(x, 80, (xx) => {
          // a spreading neem: several small crowns rather than one ball
          const h = 110 + rng() * 60;
          for (let k = 0; k < 4; k++) tree(g, xx + (k - 1.5) * h * 0.18, fn(xx) + 4, h * (0.75 + rng() * 0.3), mix('#34442a', P.near, 0.45), rng, null);
        });
        // women carrying pots, colours bright in the low sun
        for (let i = 0; i < 12; i++) {
          const x = rng() * TW;
          g.fillStyle = mix(['#e8433a', '#f2c040', '#e870a8', '#3a8ad8'][i % 4], P.near, 0.25);
          g.beginPath();
          g.moveTo(x - 4, fn(x) + 2);
          g.lineTo(x - 2, fn(x) - 14);
          g.lineTo(x + 2, fn(x) - 14);
          g.lineTo(x + 4, fn(x) + 2);
          g.fill();
          g.fillStyle = mix('#3a2418', P.near, 0.2);
          g.beginPath();
          g.arc(x, fn(x) - 16, 2.4, 0, TAU);
          g.fill();
          g.fillStyle = mix('#c8883a', P.near, 0.2);
          g.beginPath();
          g.arc(x, fn(x) - 21, 3, 0, TAU);
          g.fill();
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 5, 40, 200, true, 0.8), birds: true, shimmer: true };
  },

  kites(P, rng) {
    const layers = [];
    const W = 386;
    layers.push(
      layer(200, W + 2, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => W - (0.1 + 0.9 * Math.max(0, n(x / TW))) * 40;
        ridge(g, fn, W + 1, P.far);
        hazeOver(g, P.haze, 200, W + 2, 0.3, 0.5, 200);
      })
    );
    layers.push(
      layer(160, 640, 0.12, 0.6, (g, dyn) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 404 - Math.max(0, n(x / TW)) * 70;
        ridge(g, fn, 640, P.mid);
        for (let x = 0; x < TW; x += 9) if (hash(x * 5) > 0.7) tree(g, x, fn(x) + 4, 18 + hash(x) * 14, mix('#2a4a2a', P.mid, 0.3), rng, null);
        // a whole sky of kites, flown from the hill
        for (let i = 0; i < 30; i++) {
          const x = rng() * TW;
          dyn.push({ type: 'kite', x, y: 80 + rng() * 200, ax: x - 60 - rng() * 80, ay: fn(x) + 6, s: 0.5 + rng() * 0.6, phase: rng() * 10, col: ['#e8433a', '#f2c040', '#3a8ad8', '#5ab060', '#e870a8', '#f08a3a', '#a868d8'][i % 7], span: 160 });
        }
        hazeOver(g, P.haze, 200, 640, 0.06, 0.12, 160);
      })
    );
    layers.push(
      layer(240, 660, 0.4, 0.8, (g, dyn) => {
        const n = periodic(rng, 5, 3, 0.5);
        const fn = (x) => 408 - n(x / TW) * 6;
        ridge(g, fn, 660, P.near);
        for (let x = 0; x < TW; x += 3) {
          if (hash(x * 7) < 0.7) continue;
          g.fillStyle = mix(['#f2d040', '#ffffff', '#f8a8c8'][Math.floor(hash(x) * 3)], P.near, 0.3);
          g.fillRect(x, fn(x) - 3 - hash(x * 3) * 6, 2, 2);
        }
        // the flyers, leaning back on their strings
        for (let i = 0; i < 16; i++) {
          const x = rng() * TW;
          const y = fn(x) + 4;
          g.fillStyle = mix('#1a1a20', P.near, 0.2);
          g.fillRect(x - 2, y - 16, 4, 16);
          g.beginPath();
          g.arc(x, y - 19, 3, 0, TAU);
          g.fill();
          dyn.push({ type: 'kite', x: x + 120, y: 120 + rng() * 120, ax: x + 2, ay: y - 14, s: 1 + rng() * 0.6, phase: rng() * 10, col: ['#e8433a', '#f2c040', '#3a8ad8', '#5ab060', '#e870a8'][i % 5], span: 200 });
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 30, 170, false, 0.85), sea: { y: W } };
  },
};

// ---------------------------------------------------------------- moving parts

/** Draw a chapter 8 moving background part. False if the type is not one of ours. */
export function kiteDyn(ctx, d, x, y, t) {
  if (d.type === 'hotair') {
    // a hot-air balloon drifting up and along, burner flaring now and then
    const s = d.s;
    const bob = Math.sin(t * 0.4 + d.phase) * 6;
    const by = y + bob - fract(t * 0.01 + d.phase * 0.1) * 40;
    const g = ctx.createLinearGradient(x - 14 * s, 0, x + 14 * s, 0);
    g.addColorStop(0, mix(d.col, '#ffffff', 0.25));
    g.addColorStop(1, mix(d.col, '#000000', 0.3));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 6 * s, by + 14 * s);
    ctx.bezierCurveTo(x - 20 * s, by + 2 * s, x - 16 * s, by - 20 * s, x, by - 20 * s);
    ctx.bezierCurveTo(x + 16 * s, by - 20 * s, x + 20 * s, by + 2 * s, x + 6 * s, by + 14 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha('#ffffff', 0.4);
    ctx.lineWidth = Math.max(0.6, s);
    ctx.beginPath();
    ctx.moveTo(x, by - 20 * s);
    ctx.quadraticCurveTo(x + 2 * s, by, x, by + 14 * s);
    ctx.stroke();
    ctx.strokeStyle = alpha('#2a1a10', 0.7);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x - 5 * s, by + 14 * s);
    ctx.lineTo(x - 3 * s, by + 20 * s);
    ctx.moveTo(x + 5 * s, by + 14 * s);
    ctx.lineTo(x + 3 * s, by + 20 * s);
    ctx.stroke();
    ctx.fillStyle = '#6a4a2a';
    ctx.fillRect(x - 3.4 * s, by + 20 * s, 6.8 * s, 4 * s);
    if (fract(t * 0.3 + d.phase) < 0.12) {
      ctx.fillStyle = 'rgba(255,190,90,0.9)';
      ctx.beginPath();
      ctx.ellipse(x, by + 17 * s, 1.6 * s, 3 * s, 0, 0, TAU);
      ctx.fill();
    }
    return true;
  }
  if (d.type === 'kite') {
    // a diamond kite on a long string, swooping, its tail of bows flicking
    const s = d.s;
    const kx = x + Math.sin(t * 0.7 + d.phase) * 14 * s;
    const ky = y + Math.cos(t * 0.9 + d.phase) * 8 * s;
    const ax = x + (d.ax - d.x);
    ctx.strokeStyle = 'rgba(40,30,30,0.35)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(ax, d.ay);
    ctx.quadraticCurveTo((ax + kx) / 2, (d.ay + ky) / 2 + 30, kx, ky + 8 * s);
    ctx.stroke();
    const tilt = Math.sin(t * 1.3 + d.phase) * 0.25;
    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate(tilt);
    ctx.fillStyle = d.col;
    ctx.beginPath();
    ctx.moveTo(0, -10 * s);
    ctx.lineTo(7 * s, 0);
    ctx.lineTo(0, 12 * s);
    ctx.lineTo(-7 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = mix(d.col, '#ffffff', 0.45);
    ctx.beginPath();
    ctx.moveTo(0, -10 * s);
    ctx.lineTo(7 * s, 0);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.strokeStyle = mix(d.col, '#000000', 0.4);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, -10 * s);
    ctx.lineTo(0, 12 * s);
    ctx.moveTo(-7 * s, 0);
    ctx.lineTo(7 * s, 0);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = mix(d.col, '#000000', 0.2);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(kx, ky + 12 * s);
    for (let k = 1; k <= 6; k++) ctx.lineTo(kx + Math.sin(t * 4 + k + d.phase) * 3 * s, ky + 12 * s + k * 5 * s);
    ctx.stroke();
    for (let k = 2; k <= 6; k += 2) {
      ctx.fillStyle = k % 4 ? '#ffffff' : d.col;
      ctx.fillRect(kx + Math.sin(t * 4 + k + d.phase) * 3 * s - 2 * s, ky + 12 * s + k * 5 * s - 1, 4 * s, 2);
    }
    return true;
  }
  if (d.type === 'flags') {
    // a string of prayer flags snapping in the wind, five colours over and over
    const cols = ['#3a6ad8', '#ffffff', '#e8433a', '#3ab060', '#f2c040'];
    ctx.strokeStyle = 'rgba(30,20,20,0.5)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + d.dx / 2, y + d.sag * 2, x + d.dx, y);
    ctx.stroke();
    for (let k = 0; k < d.n; k++) {
      const u = (k + 0.5) / d.n;
      const fx = x + d.dx * u;
      const fy = y + d.sag * 4 * u * (1 - u);
      const flap = Math.sin(t * 6 + k * 0.7 + d.phase) * 2 * d.s;
      ctx.fillStyle = cols[k % 5];
      ctx.beginPath();
      ctx.moveTo(fx - 2.4 * d.s, fy);
      ctx.lineTo(fx + 2.4 * d.s, fy);
      ctx.lineTo(fx + 2.4 * d.s + flap, fy + 6 * d.s);
      ctx.lineTo(fx - 2.4 * d.s + flap, fy + 6 * d.s);
      ctx.fill();
    }
    return true;
  }
  return false;
}
