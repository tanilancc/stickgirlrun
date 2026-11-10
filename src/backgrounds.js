// Procedural parallax backgrounds. Every layer is painted once into a seamless tile
// (periodic noise with integer frequencies wraps exactly) and tinted toward the haze colour
// with distance. Far layers are painted at lower resolution on purpose: the upscale softens
// them like a long lens would. Small animated details ("dyn") are drawn live every frame.

import { mulberry32, hash } from './rng.js';
import { WORLD_THEMES, drawFireworks } from './backgrounds-world.js';
import { SKY_THEMES, drawMeteors } from './backgrounds-skies.js';
import { clamp, mix, alpha, TAU, fract } from './util.js';

export const TW = 2048;

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

export function periodic(rng, base, octs, rough = 0.5) {
  const terms = [];
  let amp = 1;
  let f = base;
  let total = 0;
  for (let o = 0; o < octs; o++) {
    terms.push([Math.max(1, Math.round(f)), amp, rng() * TAU]);
    total += amp;
    amp *= rough;
    f *= 2 + rng() * 0.4;
  }
  return (u) => {
    let s = 0;
    for (const [fr, a, ph] of terms) s += a * Math.sin(TAU * fr * u + ph);
    return s / total;
  };
}

export function layer(yTop, yBot, par, scale, draw) {
  const h = yBot - yTop;
  const c = canvas(TW * scale, h * scale);
  const g = c.getContext('2d');
  g.scale(scale, scale);
  g.translate(0, -yTop);
  const dyn = [];
  draw(g, dyn);
  return { canvas: c, yTop, h, par, dyn, fog: null };
}

/** Run fn at x and at its wrapped copies so objects crossing the tile seam stay whole. */
export function each(x, w, fn) {
  fn(x);
  if (x - w < 0) fn(x + TW);
  if (x + w > TW) fn(x - TW);
}

export function vgrad(g, y0, y1, stops) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  for (const [t, c] of stops) gr.addColorStop(t, c);
  return gr;
}

export function ridge(g, fn, yBot, fill) {
  g.beginPath();
  g.moveTo(0, yBot);
  for (let x = 0; x <= TW; x += 4) g.lineTo(x, fn(x));
  g.lineTo(TW, yBot);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
}

/** Columns shaded by slope: faces turned to the sun are lit, the others fall into shadow. */
export function litColumns(g, fn, yBot, o) {
  const step = o.step || 2;
  const sw = o.smooth || 0;
  // Shade from a smoothed ridge so facets read as broad planes rather than per-column noise.
  const sm = sw ? (x) => (fn(x - sw) + fn(x - sw / 2) + fn(x) + fn(x + sw / 2) + fn(x + sw)) / 5 : fn;
  // Paint the smooth silhouette first, then shade inside it, so ridgelines stay anti-aliased.
  g.save();
  g.beginPath();
  g.moveTo(0, yBot);
  for (let x = 0; x <= TW; x += 2) g.lineTo(x, fn(x));
  g.lineTo(TW, yBot);
  g.closePath();
  g.fillStyle = o.dark;
  g.fill();
  g.globalCompositeOperation = 'source-atop';
  for (let x = 0; x < TW; x += step) {
    const y = fn(x + step / 2) - 4;
    const d = Math.max(3, sw / 2);
    const slope = (sm(x + d) - sm(x - d)) / (2 * d);
    const l = clamp(0.5 + (o.sunLeft ? -slope : slope) * (o.contrast || 1.8), 0, 1);
    g.fillStyle = mix(o.dark, o.lit, l);
    g.fillRect(x, y, step + 0.7, yBot - y);
    if (o.snowLine !== undefined) {
      const sl = o.snowLine + Math.sin(x * 0.013) * 12 + Math.sin(x * 0.047) * 5 + (1 - l) * 8;
      if (y < sl) {
        g.fillStyle = mix(o.snowDark, o.snowLit, l * l);
        g.fillRect(x, y, step + 0.7, sl - y);
      }
    }
  }
  g.restore();
}

/** Atmospheric perspective: tint everything already painted toward the haze colour. */
export function hazeOver(g, color, y0, y1, a0, a1, top = -400) {
  g.save();
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = alpha(color, a0);
  g.fillRect(0, top, TW, y0 - top);
  g.fillStyle = vgrad(g, y0, y1, [
    [0, alpha(color, a0)],
    [1, alpha(color, a1)],
  ]);
  g.fillRect(0, y0, TW, y1 - y0);
  g.restore();
}

export function pine(g, x, yb, h, col, rng, snow) {
  const tiers = Math.max(4, Math.round(h / 20));
  const base = yb - h * 0.12;
  const th = (h * 0.88) / tiers;
  g.fillStyle = col;
  g.fillRect(x - h * 0.022, base - 2, h * 0.044, yb - base + 2);
  const L = [];
  const R = [];
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const y = base - th * i;
    const wOut = (1 - t) * h * 0.23 * (0.8 + rng() * 0.4) + 1.5;
    const wIn = wOut * 0.42;
    L.push([x - wOut, y + rng() * 2], [x - wIn, y - th * 0.55]);
    R.push([x + wOut * (0.8 + rng() * 0.4), y + rng() * 2], [x + wIn, y - th * 0.55]);
  }
  g.beginPath();
  g.moveTo(x, yb - h);
  for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
  for (let i = 0; i < L.length; i++) g.lineTo(L[i][0], L[i][1]);
  g.closePath();
  g.fill();
  if (snow) {
    g.strokeStyle = snow;
    g.lineWidth = Math.max(1, h * 0.022);
    g.lineCap = 'round';
    for (let i = 0; i < L.length; i += 2) {
      g.beginPath();
      g.moveTo(L[i][0] + 1, L[i][1] - 1);
      g.lineTo(L[i + 1][0], L[i + 1][1] + 1);
      g.moveTo(R[i][0] - 1, R[i][1] - 1);
      g.lineTo(R[i + 1][0], R[i + 1][1] + 1);
      g.stroke();
    }
    g.fillStyle = snow;
    g.beginPath();
    g.arc(x, yb - h + 3, Math.max(1, h * 0.03), 0, TAU);
    g.fill();
  }
}

export function tree(g, x, yb, h, col, rng, hi) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x - h * 0.05, yb);
  g.lineTo(x - h * 0.018, yb - h * 0.55);
  g.lineTo(x + h * 0.018, yb - h * 0.55);
  g.lineTo(x + h * 0.05, yb);
  g.fill();
  const n = 7 + Math.floor(rng() * 5);
  const blobs = [];
  for (let i = 0; i < n; i++) {
    blobs.push([x + (rng() - 0.5) * h * 0.55, yb - h * 0.62 - rng() * h * 0.28, h * (0.13 + rng() * 0.13)]);
  }
  for (const [bx, by, r] of blobs) {
    g.beginPath();
    g.arc(bx, by, r, 0, TAU);
    g.fill();
  }
  if (hi) {
    g.fillStyle = hi.c;
    for (const [bx, by, r] of blobs) {
      if (rng() < 0.5) continue;
      g.beginPath();
      g.arc(bx + r * 0.3 * hi.dir, by - r * 0.3, r * 0.55, 0, TAU);
      g.fill();
    }
  }
}

export function building(g, x, yb, w, h, col, rng, o = {}) {
  g.fillStyle = col;
  g.fillRect(x, yb - h, w, h);
  const top = yb - h;
  const type = o.type || 'flat';
  if (type === 'gable') {
    g.beginPath();
    g.moveTo(x - 3, top);
    g.lineTo(x + w / 2, top - w * 0.38);
    g.lineTo(x + w + 3, top);
    g.fill();
  } else if (type === 'dome') {
    g.beginPath();
    g.arc(x + w / 2, top, w * 0.32, Math.PI, 0);
    g.fill();
    g.fillRect(x + w / 2 - 1, top - w * 0.32 - 10, 2, 10);
  } else if (type === 'spire') {
    g.beginPath();
    g.moveTo(x + w * 0.3, top);
    g.lineTo(x + w / 2, top - h * 0.55);
    g.lineTo(x + w * 0.7, top);
    g.fill();
  } else if (type === 'tank') {
    const tx = x + w * (0.25 + rng() * 0.4);
    g.fillRect(tx - 7, top - 10, 1.5, 10);
    g.fillRect(tx + 5.5, top - 10, 1.5, 10);
    g.fillRect(tx - 8, top - 26, 16, 16);
    g.beginPath();
    g.moveTo(tx - 9, top - 26);
    g.lineTo(tx, top - 33);
    g.lineTo(tx + 9, top - 26);
    g.fill();
  } else {
    g.fillRect(x - 1.5, top - 3, w + 3, 3);
  }
  if (o.antenna) {
    g.fillRect(x + w * 0.7, top - 18, 1.2, 18);
    g.fillRect(x + w * 0.7 - 5, top - 14, 11, 1);
  }
  if (o.windows) {
    const { lit, litCol, offCol, size = 1 } = o.windows;
    const ww = 3 * size;
    const wh = 4.5 * size;
    const cols = Math.floor((w - 6) / (ww * 2.4));
    const rows = Math.floor((h - 10) / (wh * 2.1));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const on = rng() < lit;
        if (!on && !offCol) continue;
        g.fillStyle = on ? litCol : offCol;
        g.fillRect(x + 4 + c * ww * 2.4, top + 6 + r * wh * 2.1, ww, wh);
      }
    }
  }
}

function cloudSprite(w, h, light, shade, rng, flat) {
  const s = 0.5;
  const c = canvas(w * s, h * s);
  const g = c.getContext('2d');
  g.scale(s, s);
  const puff = (x, y, r) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)');
    gr.addColorStop(0.5, 'rgba(255,255,255,0.8)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const n = flat ? 46 : 34;
  for (let i = 0; i < n; i++) {
    const t = rng();
    const bulge = Math.sin(t * Math.PI);
    const r = h * (flat ? 0.16 + 0.16 * bulge : 0.2 + 0.32 * bulge) * (0.6 + rng() * 0.6);
    const x = w * (0.1 + 0.8 * t);
    const y = h * (flat ? 0.6 : 0.7) - bulge * h * (flat ? 0.12 : 0.3) * rng();
    puff(x, y, r);
  }
  // flatten the base a little, the way real cumulus sit on a condensation level
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = vgrad(g, h * 0.72, h, [
    [0, 'rgba(0,0,0,0)'],
    [1, 'rgba(0,0,0,0.9)'],
  ]);
  g.fillRect(0, h * 0.72, w, h * 0.28);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = vgrad(g, 0, h, [
    [0, light],
    [0.5, mix(light, shade, 0.3)],
    [1, shade],
  ]);
  g.fillRect(0, 0, w, h);
  return c;
}

export function cloudLayer(P, rng, n, yMin, yMax, flat, alphaMul = 1) {
  const c = canvas(TW * 0.5, 320 * 0.5);
  const g = c.getContext('2d');
  g.scale(0.5, 0.5);
  for (let i = 0; i < n; i++) {
    const w = (flat ? 260 : 150) + rng() * (flat ? 320 : 180);
    const h = flat ? 40 + rng() * 30 : 60 + rng() * 50;
    const spr = cloudSprite(w, h, P.cloud, P.cloudShade, rng, flat);
    const x = rng() * TW;
    const y = yMin + rng() * (yMax - yMin);
    g.globalAlpha = (0.55 + rng() * 0.45) * alphaMul;
    each(x, w, (xx) => g.drawImage(spr, xx - w / 2, y - h / 2, w, h));
  }
  return { canvas: c, yTop: 0, h: 320, par: 0.02, drift: 4 };
}

function fogTile(color, density = 1) {
  const s = 0.25;
  const c = canvas(TW * s, 200 * s);
  const g = c.getContext('2d');
  g.scale(s, s);
  const rng = mulberry32(77);
  for (let i = 0; i < 60 * density; i++) {
    const x = rng() * TW;
    const y = 70 + rng() * 70;
    const r = 60 + rng() * 120;
    each(x, r, (xx) => {
      const gr = g.createRadialGradient(xx, y, 0, xx, y, r);
      gr.addColorStop(0, alpha(color, 0.45));
      gr.addColorStop(1, alpha(color, 0));
      g.fillStyle = gr;
      g.fillRect(xx - r, y - r, r * 2, r * 2);
    });
  }
  return c;
}

function starTile(rng) {
  const c = canvas(TW * 0.5, 380 * 0.5);
  const g = c.getContext('2d');
  g.scale(0.5, 0.5);
  for (let i = 0; i < 420; i++) {
    const x = rng() * TW;
    const y = rng() * 380;
    const b = rng();
    g.fillStyle = `rgba(255,255,255,${(0.25 + b * 0.7) * (1 - y / 460)})`;
    g.fillRect(x, y, b > 0.92 ? 2.4 : 1.4, b > 0.92 ? 2.4 : 1.4);
  }
  return c;
}

// ---------------------------------------------------------------- themes

const THEMES = {
  meadow(P, rng) {
    const sunLeft = P.sun.x < 0.5;
    const layers = [];
    layers.push(
      layer(220, 600, 0.05, 0.5, (g) => {
        const n = periodic(rng, 2, 4, 0.5);
        const fn = (x) => 318 - n(x / TW) * 28;
        litColumns(g, fn, 600, { lit: mix(P.far, P.light, 0.3), dark: P.far, sunLeft, step: 3 });
        g.fillStyle = mix(P.far, '#000000', 0.12);
        for (let i = 0; i < 80; i++) {
          const x = rng() * TW;
          const r = 1.4 + rng() * 2.6;
          g.beginPath();
          g.arc(x, fn(x) - r * 0.5, r, 0, TAU);
          g.fill();
        }
        hazeOver(g, P.haze, 300, 600, 0.18, 0.85);
      })
    );
    layers.push(
      layer(250, 620, 0.14, 0.6, (g, dyn) => {
        const n = periodic(rng, 3, 4, 0.45);
        const fn = (x) => 352 - n(x / TW) * 20;
        litColumns(g, fn, 620, { lit: mix(P.mid, P.light, 0.32), dark: mix(P.mid, '#000000', 0.06), sunLeft });
        g.save();
        g.globalCompositeOperation = 'source-atop';
        for (let i = 0; i < 9; i++) {
          g.fillStyle = alpha(i % 2 ? '#ffe6a8' : '#2a3a20', 0.07);
          g.fillRect(0, 344 + i * 7, TW, 4);
        }
        g.restore();
        const tc = mix(P.mid, '#000000', 0.28);
        for (let i = 0; i < 28; i++) {
          const x = rng() * TW;
          const h = 14 + rng() * 18;
          each(x, 30, (xx) => tree(g, xx, fn(xx) + 2, h, tc, rng));
        }
        const wx = 520 + rng() * 300;
        const wy = fn(wx);
        g.fillStyle = tc;
        g.beginPath();
        g.moveTo(wx - 7, wy + 2);
        g.lineTo(wx - 3, wy - 50);
        g.lineTo(wx + 3, wy - 50);
        g.lineTo(wx + 7, wy + 2);
        g.fill();
        g.fillRect(wx - 5, wy - 56, 10, 7);
        dyn.push({ type: 'windmill', x: wx, y: wy - 52, r: 27, color: tc });
        hazeOver(g, P.haze, 330, 620, 0.12, 0.6);
      })
    );
    layers.push(
      layer(240, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 5, 3, 0.4);
        const fn = (x) => 390 - n(x / TW) * 9;
        const col = mix(P.near, P.mid, 0.35);
        ridge(g, fn, 640, col);
        g.fillStyle = mix(col, '#000000', 0.1);
        for (let x = 0; x < TW; x += 5) {
          g.beginPath();
          g.arc(x, fn(x) + 1, 3 + hash(x) * 3.5, 0, TAU);
          g.fill();
        }
        const hiObj = { c: alpha(P.light, 0.16), dir: sunLeft ? -1 : 1 };
        for (let i = 0; i < 8; i++) {
          const x = rng() * TW;
          const h = 60 + rng() * 55;
          each(x, 60, (xx) => tree(g, xx, fn(xx) + 3, h, mix(col, '#000000', 0.15), rng, hiObj));
        }
        const fx = 1300 + rng() * 300;
        const fy = fn(fx) + 2;
        const hc = mix(col, '#000000', 0.22);
        g.fillStyle = hc;
        g.fillRect(fx, fy - 34, 64, 34);
        g.beginPath();
        g.moveTo(fx - 5, fy - 34);
        g.lineTo(fx + 32, fy - 58);
        g.lineTo(fx + 69, fy - 34);
        g.fill();
        g.fillRect(fx + 46, fy - 58, 7, 16);
        g.fillRect(fx + 70, fy - 24, 40, 24);
        g.beginPath();
        g.moveTo(fx + 66, fy - 24);
        g.lineTo(fx + 90, fy - 40);
        g.lineTo(fx + 114, fy - 24);
        g.fill();
        g.fillStyle = alpha('#ffd38a', 0.5);
        g.fillRect(fx + 12, fy - 24, 6, 7);
        g.strokeStyle = hc;
        g.lineWidth = 1.2;
        const f0 = rng() * TW;
        for (let x = f0; x < f0 + 500; x += 14) {
          const xx = x % TW;
          g.beginPath();
          g.moveTo(xx, fn(xx) + 2);
          g.lineTo(xx, fn(xx) - 9);
          g.stroke();
        }
        hazeOver(g, P.haze, 370, 640, 0.05, 0.35);
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 7, 3, 0.5);
        const fn = (x) => 413 - n(x / TW) * 7;
        const col = mix(P.near, '#000000', 0.12);
        ridge(g, fn, 660, col);
        g.strokeStyle = col;
        g.lineCap = 'round';
        for (let x = 0; x < TW; x += 2.5) {
          const h = 5 + hash(Math.floor(x * 3)) * 17;
          const lean = (hash(Math.floor(x * 7)) - 0.4) * 7;
          g.lineWidth = 1.2;
          g.beginPath();
          g.moveTo(x, fn(x) + 2);
          g.quadraticCurveTo(x + lean * 0.3, fn(x) - h * 0.6, x + lean, fn(x) - h);
          g.stroke();
        }
        const flowers = ['#f2d58a', '#e9a6a1', '#f4efe2', '#c9a7d9'];
        for (let i = 0; i < 160; i++) {
          const x = rng() * TW;
          g.fillStyle = alpha(flowers[i % flowers.length], 0.75);
          g.beginPath();
          g.arc(x, fn(x) - 6 - rng() * 10, 1.2 + rng() * 1.2, 0, TAU);
          g.fill();
        }
      })
    );
    return {
      layers,
      clouds: cloudLayer(P, rng, 9, 70, 230, false, 0.85),
      fogAfter: { 1: { color: P.haze, y: 300, a: 0.42 } },
    };
  },

  forest(P, rng) {
    const layers = [];
    layers.push(
      layer(120, 600, 0.06, 0.5, (g) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 300 - n(x / TW) * 16;
        ridge(g, fn, 600, P.far);
        for (let x = 0; x < TW; x += 5 + rng() * 9) {
          const h = 50 + rng() * 70;
          each(x, 20, (xx) => pine(g, xx, fn(xx) + 6, h, P.far, rng));
        }
        hazeOver(g, P.haze, 160, 600, 0.38, 0.85);
      })
    );
    layers.push(
      layer(60, 620, 0.16, 0.6, (g) => {
        const n = periodic(rng, 4, 3, 0.5);
        const fn = (x) => 335 - n(x / TW) * 10;
        const col = mix(P.mid, '#000000', 0.08);
        ridge(g, fn, 620, col);
        for (let x = 0; x < TW; x += 16 + rng() * 30) {
          const h = 95 + rng() * 95;
          each(x, 40, (xx) => pine(g, xx, fn(xx) + 6, h, col, rng));
        }
        hazeOver(g, P.haze, 120, 620, 0.22, 0.6);
      })
    );
    layers.push(
      layer(-120, 640, 0.32, 0.75, (g) => {
        const n = periodic(rng, 5, 3, 0.5);
        const fn = (x) => 400 - n(x / TW) * 5;
        const col = P.near;
        ridge(g, fn, 640, col);
        for (let x = 0; x < TW; x += 55 + rng() * 110) {
          const w = 11 + rng() * 16;
          const birch = rng() < 0.28;
          each(x, w * 2, (xx) => {
            const base = fn(xx);
            g.fillStyle = birch ? mix('#d9d6c8', P.haze, 0.35) : col;
            g.beginPath();
            g.moveTo(xx - w * 0.5, -120);
            g.lineTo(xx + w * 0.5, -120);
            g.lineTo(xx + w * 0.62, base - 8);
            g.quadraticCurveTo(xx + w * 1.1, base, xx + w * 1.3, base + 2);
            g.lineTo(xx - w * 1.3, base + 2);
            g.quadraticCurveTo(xx - w * 1.1, base, xx - w * 0.62, base - 8);
            g.closePath();
            g.fill();
            g.strokeStyle = birch ? alpha('#2a2a26', 0.55) : alpha('#000000', 0.18);
            g.lineWidth = birch ? 1.6 : 1;
            for (let y = -100; y < base - 10; y += birch ? 9 + hash(y + xx) * 16 : 6) {
              g.beginPath();
              if (birch) {
                const ox = (hash(y * 3 + xx) - 0.5) * w * 0.6;
                g.moveTo(xx + ox - w * 0.2, y);
                g.lineTo(xx + ox + w * 0.15, y + 1);
              } else {
                const ox = (hash(y * 5 + xx) - 0.5) * w * 0.7;
                g.moveTo(xx + ox, y);
                g.lineTo(xx + ox + (hash(y + 1) - 0.5) * 2, y + 5);
              }
              g.stroke();
            }
            if (!birch && rng() < 0.6) {
              g.strokeStyle = col;
              g.lineWidth = 3;
              const by = 20 + rng() * 200;
              const dir = rng() < 0.5 ? -1 : 1;
              g.beginPath();
              g.moveTo(xx, by);
              g.lineTo(xx + dir * (18 + rng() * 22), by - 10 - rng() * 12);
              g.stroke();
            }
          });
        }
        hazeOver(g, P.haze, 100, 640, 0.14, 0.3, -120);
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 6;
        const col = mix(P.near, '#000000', 0.25);
        ridge(g, fn, 660, col);
        g.strokeStyle = col;
        g.lineCap = 'round';
        for (let x = 0; x < TW; x += 18 + rng() * 40) {
          const fronds = 5 + Math.floor(rng() * 4);
          const s = 10 + rng() * 14;
          for (let i = 0; i < fronds; i++) {
            const a = -Math.PI / 2 + (i / (fronds - 1) - 0.5) * 2.4;
            g.lineWidth = 1.6;
            g.beginPath();
            g.moveTo(x, fn(x));
            g.quadraticCurveTo(x + Math.cos(a) * s * 0.6, fn(x) + Math.sin(a) * s * 0.9, x + Math.cos(a) * s * 1.2, fn(x) + Math.sin(a) * s * 0.55);
            g.stroke();
          }
        }
      })
    );
    return {
      layers,
      fogAfter: {
        0: { color: P.haze, y: 250, a: 0.6 },
        1: { color: P.haze, y: 300, a: 0.5 },
        2: { color: P.haze, y: 350, a: 0.32 },
      },
      rays: true,
    };
  },

  canyon(P, rng) {
    const layers = [];
    const mesas = (count, base, hMin, hMax, wMin, wMax) => {
      const shapes = [];
      for (let i = 0; i < count; i++) {
        shapes.push({ x: rng() * TW, w: wMin + rng() * (wMax - wMin), h: hMin + rng() * (hMax - hMin), s: 14 + rng() * 34, ledge: rng() });
      }
      const nz = periodic(rng, 40, 3, 0.5);
      return (x) => {
        let hgt = 6 + nz(x / TW) * 3;
        for (const m of shapes) {
          for (const off of [0, TW, -TW]) {
            const dx = Math.abs(x - (m.x + off));
            let v = 0;
            if (dx < m.w / 2) v = m.h;
            else if (dx < m.w / 2 + m.s) {
              const u = (dx - m.w / 2) / m.s;
              v = m.h * (1 - Math.pow(u, 0.55)) * (u < m.ledge * 0.6 ? 1 : 0.92);
            }
            if (v > hgt) hgt = v;
          }
        }
        return base - hgt;
      };
    };
    const strata = (g, y0, y1, col, a) => {
      g.save();
      g.globalCompositeOperation = 'source-atop';
      for (let y = y0; y < y1; y += 9 + hash(y) * 12) {
        g.fillStyle = alpha(hash(y * 3) > 0.5 ? '#ffe8c8' : col, a * (0.35 + hash(y * 9) * 0.4));
        g.fillRect(0, y, TW, 3 + hash(y * 5) * 5);
      }
      g.restore();
    };
    layers.push(
      layer(170, 600, 0.04, 0.5, (g) => {
        const fn = mesas(10, 352, 30, 95, 110, 320);
        litColumns(g, fn, 600, { lit: mix(P.far, P.light, 0.35), dark: mix(P.far, '#000000', 0.08), sunLeft: true, step: 3, contrast: 0.9 });
        strata(g, 250, 352, '#5a2a20', 0.12);
        hazeOver(g, P.haze, 260, 600, 0.3, 0.75);
      })
    );
    layers.push(
      layer(160, 620, 0.12, 0.6, (g) => {
        const fn = mesas(8, 378, 50, 150, 90, 260);
        litColumns(g, fn, 620, { lit: mix(P.mid, P.light, 0.35), dark: mix(P.mid, '#3a1408', 0.3), sunLeft: true, contrast: 0.9 });
        strata(g, 220, 378, '#4a1a0c', 0.2);
        hazeOver(g, P.haze, 260, 620, 0.12, 0.5);
      })
    );
    layers.push(
      layer(220, 640, 0.28, 0.75, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 396 - n(x / TW) * 8;
        const col = P.near;
        ridge(g, fn, 640, col);
        for (let i = 0; i < 16; i++) {
          const x = rng() * TW;
          const w = 12 + rng() * 22;
          const h = 40 + rng() * 85;
          each(x, w * 2, (xx) => {
            const base = fn(xx) + 4;
            const gr = g.createLinearGradient(xx - w, 0, xx + w, 0);
            gr.addColorStop(0, mix(col, P.light, 0.25));
            gr.addColorStop(1, mix(col, '#000000', 0.25));
            g.fillStyle = gr;
            g.beginPath();
            g.moveTo(xx - w * 0.75, base);
            for (let k = 0; k <= 6; k++) g.lineTo(xx - w * (0.42 + hash(k + x) * 0.18), base - (h * k) / 6);
            g.lineTo(xx - w * 0.85, base - h - 2);
            g.lineTo(xx + w * 0.85, base - h - 6);
            for (let k = 6; k >= 0; k--) g.lineTo(xx + w * (0.42 + hash(k * 3 + x) * 0.18), base - (h * k) / 6);
            g.lineTo(xx + w * 0.75, base);
            g.fill();
          });
        }
        strata(g, 260, 400, '#3a1006', 0.18);
        hazeOver(g, P.haze, 300, 640, 0.06, 0.32);
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 7, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 6;
        const col = mix(P.near, '#000000', 0.3);
        ridge(g, fn, 660, col);
        g.strokeStyle = col;
        g.lineWidth = 1;
        for (let i = 0; i < 46; i++) {
          const x = rng() * TW;
          const s = 7 + rng() * 9;
          for (let k = 0; k < 9; k++) {
            const a = -Math.PI / 2 + (rng() - 0.5) * 2.2;
            g.beginPath();
            g.moveTo(x, fn(x));
            g.lineTo(x + Math.cos(a) * s, fn(x) + Math.sin(a) * s);
            g.stroke();
          }
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 4, 50, 140, true, 0.6), shimmer: true, fogAfter: { 1: { color: P.haze, y: 320, a: 0.25 } } };
  },

  roof(P, rng) {
    const layers = [];
    const skyline = (g, base, count, wMin, wMax, hMin, hMax, col, win, types) => {
      g.fillStyle = col;
      g.fillRect(0, base - 1, TW, 700 - base);
      let x = 0;
      while (x < TW) {
        const w = wMin + rng() * (wMax - wMin);
        const h = hMin + rng() * (hMax - hMin);
        const type = types[Math.floor(rng() * types.length)];
        building(g, x, base, Math.min(w, TW - x + 1), h, col, rng, { type, windows: win, antenna: rng() < 0.2 });
        x += w + (rng() < 0.2 ? rng() * 8 : 0);
      }
    };
    layers.push(
      layer(110, 600, 0.05, 0.5, (g) => {
        skyline(g, 366, 0, 26, 80, 40, 175, P.far, { lit: 0.08, litCol: alpha(P.window, 0.55), size: 0.8 }, ['flat', 'flat', 'spire', 'dome', 'flat']);
        hazeOver(g, P.haze, 220, 600, 0.3, 0.8);
      })
    );
    layers.push(
      layer(100, 620, 0.15, 0.6, (g) => {
        skyline(g, 386, 0, 46, 130, 60, 230, P.mid, { lit: 0.18, litCol: P.window, offCol: mix(P.mid, '#000000', 0.12) }, ['flat', 'gable', 'tank', 'flat']);
        hazeOver(g, P.haze, 200, 620, 0.12, 0.5);
      })
    );
    layers.push(
      layer(220, 640, 0.32, 0.75, (g) => {
        const col = P.near;
        g.fillStyle = col;
        g.fillRect(0, 403, TW, 240);
        let x = 0;
        while (x < TW) {
          const w = 60 + rng() * 120;
          const h = 20 + rng() * 80;
          const top = 404 - h;
          building(g, x, 404, Math.min(w, TW - x + 1), h, col, rng, { type: rng() < 0.35 ? 'gable' : 'flat', windows: { lit: 0.22, litCol: P.window, offCol: mix(col, '#000000', 0.18), size: 1.3 } });
          g.fillStyle = col;
          const chims = Math.floor(rng() * 3);
          for (let c = 0; c < chims; c++) {
            const cx = x + 10 + rng() * (w - 20);
            g.fillRect(cx, top - 16, 9, 16);
            g.fillRect(cx - 1.5, top - 18, 12, 3);
          }
          if (rng() < 0.35) {
            const ax = x + rng() * w;
            g.strokeStyle = col;
            g.lineWidth = 1.2;
            g.beginPath();
            g.moveTo(ax, top);
            g.lineTo(ax, top - 26);
            g.moveTo(ax - 8, top - 22);
            g.lineTo(ax + 8, top - 22);
            g.moveTo(ax - 5, top - 16);
            g.lineTo(ax + 5, top - 16);
            g.stroke();
          }
          x += w;
        }
        hazeOver(g, P.haze, 300, 640, 0.04, 0.22);
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 7, 80, 250, true, 0.9), birds: true };
  },

  harbor(P, rng) {
    const layers = [];
    layers.push(
      layer(240, 380, 0.04, 0.5, (g, dyn) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 350 - Math.max(0, n(x / TW)) * 26 - 3;
        ridge(g, fn, 380, P.far);
        for (let i = 0; i < 70; i++) {
          const x = rng() * TW;
          g.fillStyle = alpha(i % 4 ? P.lamp : '#cfe3ff', 0.35 + rng() * 0.4);
          g.fillRect(x, fn(x) + 3 + rng() * 8, 1.6, 1.6);
        }
        const lx = 900 + rng() * 300;
        const ly = fn(lx) + 4;
        g.fillStyle = mix(P.far, '#000000', 0.2);
        g.beginPath();
        g.moveTo(lx - 5, ly);
        g.lineTo(lx - 3, ly - 34);
        g.lineTo(lx + 3, ly - 34);
        g.lineTo(lx + 5, ly);
        g.fill();
        g.fillRect(lx - 4.5, ly - 40, 9, 6);
        dyn.push({ type: 'lighthouse', x: lx, y: ly - 37 });
      })
    );
    layers.push(
      layer(40, 420, 0.12, 0.6, (g, dyn) => {
        const col = P.mid;
        g.fillStyle = col;
        g.fillRect(0, 368, TW, 60);
        const cont = ['#5a2b22', '#1f3a4a', '#4a4a2a', '#2a3a2a', '#3a2440'];
        for (let i = 0; i < 9; i++) {
          const x0 = rng() * TW;
          const cols = 2 + Math.floor(rng() * 4);
          const rows = 1 + Math.floor(rng() * 3);
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const cx = x0 + c * 36;
              each(cx, 40, (xx) => {
                g.fillStyle = mix(cont[(i + r + c) % cont.length], col, 0.6);
                g.fillRect(xx, 368 - (r + 1) * 14, 35, 13);
                g.fillStyle = alpha('#000000', 0.25);
                for (let k = 3; k < 35; k += 3) g.fillRect(xx + k, 368 - (r + 1) * 14 + 1, 0.8, 11);
              });
            }
          }
        }
        for (let i = 0; i < 3; i++) {
          const cx = 300 + i * 650 + rng() * 200;
          const h = 150 + rng() * 60;
          const top = 368 - h;
          g.strokeStyle = col;
          g.fillStyle = col;
          g.lineWidth = 3;
          g.beginPath();
          g.moveTo(cx - 22, 368);
          g.lineTo(cx - 8, top);
          g.moveTo(cx + 22, 368);
          g.lineTo(cx + 8, top);
          g.stroke();
          g.lineWidth = 1;
          for (let y = top + 10; y < 368; y += 14) {
            const t = (y - top) / h;
            g.beginPath();
            g.moveTo(cx - 8 - 14 * t, y);
            g.lineTo(cx + 8 + 14 * t, y + 12);
            g.stroke();
          }
          g.fillRect(cx - 70, top - 4, 190, 7);
          g.fillRect(cx - 14, top - 18, 26, 16);
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(cx, top - 18);
          g.lineTo(cx - 60, top - 2);
          g.moveTo(cx, top - 18);
          g.lineTo(cx + 110, top - 2);
          g.moveTo(cx + 80, top + 3);
          g.lineTo(cx + 80, top + 60);
          g.stroke();
          dyn.push({ type: 'blink', x: cx, y: top - 20, color: '#ff4a3a', period: 1.6 + i * 0.3, phase: rng() });
          dyn.push({ type: 'blink', x: cx + 118, y: top - 1, color: '#ff4a3a', period: 2.1, phase: rng() });
        }
        const sx = 1500 + rng() * 300;
        g.fillStyle = mix(col, '#000000', 0.2);
        g.beginPath();
        g.moveTo(sx, 352);
        g.lineTo(sx + 300, 352);
        g.lineTo(sx + 280, 372);
        g.lineTo(sx + 15, 372);
        g.closePath();
        g.fill();
        g.fillRect(sx + 200, 318, 60, 34);
        g.fillRect(sx + 215, 300, 10, 18);
        for (let k = 0; k < 9; k++) {
          g.fillStyle = alpha(P.lamp, 0.5 + rng() * 0.4);
          g.fillRect(sx + 205 + (k % 5) * 10, 324 + Math.floor(k / 5) * 10, 3, 3);
        }
        hazeOver(g, P.haze, 200, 420, 0.1, 0.25, 40);
      })
    );
    layers.push(
      layer(220, 640, 0.3, 0.75, (g, dyn) => {
        const col = P.near;
        g.fillStyle = col;
        g.fillRect(0, 402, TW, 240);
        let x = 0;
        while (x < TW) {
          const w = 140 + rng() * 200;
          const h = 40 + rng() * 50;
          const top = 404 - h;
          g.fillStyle = col;
          g.fillRect(x, top, Math.min(w, TW - x + 1), h + 240);
          if (rng() < 0.5) {
            for (let k = 0; k < w; k += 40) {
              g.beginPath();
              g.moveTo(x + k, top);
              g.lineTo(x + k + 30, top - 14);
              g.lineTo(x + k + 40, top);
              g.fill();
            }
          } else {
            g.beginPath();
            g.ellipse(x + w / 2, top, w / 2, 16, 0, Math.PI, 0);
            g.fill();
          }
          g.fillStyle = alpha('#000000', 0.25);
          for (let k = 4; k < w; k += 4) g.fillRect(x + k, top + 4, 1, h - 6);
          if (rng() < 0.6) {
            g.fillStyle = alpha(P.lamp, 0.45);
            g.fillRect(x + w * 0.3, top + h * 0.35, 8, 6);
          }
          x += w + 30 + rng() * 60;
        }
        for (let lx = 80 + rng() * 100; lx < TW; lx += 260 + rng() * 140) {
          g.fillStyle = mix(col, '#000000', 0.3);
          g.fillRect(lx, 330, 2.4, 76);
          g.fillRect(lx, 330, 12, 2);
          dyn.push({ type: 'lamp', x: lx + 11, y: 334 });
        }
        hazeOver(g, P.haze, 300, 640, 0.04, 0.18);
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 12, 40, 210, true, 1), sea: { y: 352 }, storm: true };
  },

  snow(P, rng) {
    const layers = [];
    layers.push(
      layer(60, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 3, 4, 0.42);
        const fn = (x) => 342 - Math.pow(1 - Math.abs(n(x / TW)), 1.7) * 165;
        litColumns(g, fn, 600, { lit: mix(P.far, '#ffffff', 0.12), dark: mix(P.far, '#101830', 0.2), snowLine: 262, snowLit: '#e6eefb', snowDark: mix(P.far, '#c8d6ee', 0.35), sunLeft: false, contrast: 3, smooth: 22, step: 2 });
        hazeOver(g, P.haze, 200, 600, 0.3, 0.85, 60);
      })
    );
    layers.push(
      layer(160, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 4, 4, 0.5);
        const fn = (x) => 382 - Math.pow(1 - Math.abs(n(x / TW)), 1.4) * 110;
        litColumns(g, fn, 620, { lit: '#dfe7f5', dark: mix(P.mid, '#ffffff', 0.18), snowLine: 999, snowLit: '#e9f0fb', snowDark: mix(P.mid, '#d4e0f2', 0.45), sunLeft: false, contrast: 2.4, smooth: 18 });
        const pc = mix(P.mid, '#000000', 0.25);
        for (let x = 0; x < TW; x += 5 + rng() * 10) {
          const y = fn(x);
          if (y < 300) continue;
          const h = 12 + rng() * 16;
          each(x, 10, (xx) => pine(g, xx, fn(xx) + 3 + rng() * 6, h, pc, rng, alpha('#ffffff', 0.7)));
        }
        hazeOver(g, P.haze, 260, 620, 0.12, 0.5);
      })
    );
    layers.push(
      layer(200, 640, 0.28, 0.75, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 398 - n(x / TW) * 10;
        ridge(g, fn, 640, vgrad(g, 380, 460, [
          [0, '#e6edf8'],
          [1, mix(P.near, '#ffffff', 0.4)],
        ]));
        for (let x = 0; x < TW; x += 26 + rng() * 60) {
          const h = 60 + rng() * 80;
          each(x, 30, (xx) => pine(g, xx, fn(xx) + 4, h, P.near, rng, '#eef3fb'));
        }
        hazeOver(g, P.haze, 280, 640, 0.05, 0.3);
      })
    );
    layers.push(
      layer(340, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 7, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 9;
        ridge(g, fn, 660, vgrad(g, 400, 440, [
          [0, '#f3f7fd'],
          [1, '#b7c6dd'],
        ]));
        g.fillStyle = mix(P.near, '#000000', 0.1);
        for (let i = 0; i < 30; i++) {
          const x = rng() * TW;
          const w = 6 + rng() * 14;
          g.beginPath();
          g.moveTo(x - w, fn(x) + 4);
          g.lineTo(x - w * 0.3, fn(x) - w * 0.7);
          g.lineTo(x + w * 0.6, fn(x) - w * 0.4);
          g.lineTo(x + w, fn(x) + 4);
          g.fill();
        }
      })
    );
    return { layers, stars: true, aurora: true, fogAfter: { 1: { color: P.haze, y: 320, a: 0.35 } } };
  },
};

// ---------------------------------------------------------------- build + draw

export function buildBackground(stage) {
  const rng = mulberry32(stage.seed * 31 + 5);
  const P = stage.palette;
  // looked up at call time so the import cycle with backgrounds-world.js is harmless
  const theme = (THEMES[stage.terrain] || WORLD_THEMES[stage.terrain] || SKY_THEMES[stage.terrain])(P, rng);
  if (theme.fogAfter) {
    for (const k of Object.keys(theme.fogAfter)) theme.fogAfter[k].tile = fogTile(theme.fogAfter[k].color, stage.terrain === 'forest' ? 1.4 : 1);
  }
  if (theme.stars || stage.palette.moon) theme.starTile = starTile(mulberry32(stage.seed));
  theme.stage = stage;
  return theme;
}

function skyColors(P, progress) {
  if (!P.skyEnd) return P.sky;
  const t = clamp((progress - 0.35) / 0.65, 0, 1);
  return P.sky.map((c, i) => mix(c, P.skyEnd[i], t));
}

function drawTile(ctx, img, ox, y, w, h, viewW) {
  let x = -ox;
  while (x < viewW) {
    ctx.drawImage(img, x, y, w, h);
    x += w;
  }
}

/**
 * view = { w, top, bottom } in world units; cam = { x, y }.
 */
export function drawBackground(ctx, bg, view, cam, t, progress, flash) {
  const P = bg.stage.palette;
  const sky = skyColors(P, progress);
  const gr = ctx.createLinearGradient(0, view.top, 0, 430 - cam.y * 0.1);
  gr.addColorStop(0, sky[0]);
  gr.addColorStop(0.62, sky[1]);
  gr.addColorStop(1, sky[2]);
  ctx.fillStyle = gr;
  ctx.fillRect(0, view.top, view.w, view.bottom - view.top);

  // stars + aurora (fade out toward dawn)
  const night = P.skyEnd ? 1 - clamp((progress - 0.3) / 0.6, 0, 1) : 1;
  if (bg.starTile) {
    ctx.globalAlpha = night * (bg.stage.id === 'harbor' ? 0.25 : 0.9);
    drawTile(ctx, bg.starTile, (cam.x * 0.01) % TW, view.top - cam.y * 0.01, TW, 380, view.w);
    ctx.globalAlpha = 1;
  }
  if (bg.milkyTile) drawTile(ctx, bg.milkyTile, (cam.x * 0.008) % TW, view.top - cam.y * 0.008, TW, 380, view.w);
  // shooting stars: a few all night, then a shower at the top
  if (bg.meteors) drawMeteors(ctx, view, t, clamp((progress - 0.88) / 0.12, 0, 1));
  if (bg.aurora && night > 0.02) drawAurora(ctx, view, t, night * 0.9);

  // sun / moon
  const sun = P.sun || (P.sunEnd ? { ...P.sunEnd, fade: clamp((progress - 0.55) / 0.45, 0, 1) } : null);
  if (sun && (sun.fade === undefined || sun.fade > 0)) {
    const sx = sun.x * view.w;
    const sy = sun.y + (P.sunEnd ? (1 - (sun.fade ?? 1)) * 60 : 0) - cam.y * 0.03;
    const k = sun.fade ?? 1;
    const g2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, sun.glowR);
    g2.addColorStop(0, alpha(sun.glow, sun.glowA * k));
    g2.addColorStop(0.25, alpha(sun.glow, sun.glowA * 0.45 * k));
    g2.addColorStop(1, alpha(sun.glow, 0));
    ctx.fillStyle = g2;
    ctx.fillRect(sx - sun.glowR, sy - sun.glowR, sun.glowR * 2, sun.glowR * 2);
    ctx.fillStyle = alpha(sun.core, k);
    ctx.beginPath();
    ctx.arc(sx, sy, sun.r, 0, TAU);
    ctx.fill();
  }
  if (P.moon) {
    const mx = P.moon.x * view.w;
    const my = P.moon.y;
    const g3 = ctx.createRadialGradient(mx, my, 0, mx, my, 120);
    g3.addColorStop(0, 'rgba(200,215,235,0.22)');
    g3.addColorStop(1, 'rgba(200,215,235,0)');
    ctx.fillStyle = g3;
    ctx.fillRect(mx - 120, my - 120, 240, 240);
    ctx.fillStyle = 'rgba(225,232,240,0.55)';
    ctx.beginPath();
    ctx.arc(mx, my, P.moon.r, 0, TAU);
    ctx.fill();
  }

  // clouds drift on their own
  if (bg.clouds) {
    const c = bg.clouds;
    const ox = (((cam.x * c.par + t * c.drift) % TW) + TW) % TW;
    ctx.globalAlpha = bg.storm ? 0.95 : 1;
    drawTile(ctx, c.canvas, ox, c.yTop - cam.y * 0.02, TW, c.h, view.w);
    ctx.globalAlpha = 1;
  }

  // festival fireworks: a few all night, the full show once you reach the river
  if (bg.fireworks) drawFireworks(ctx, view, t, 0.45 + 0.55 * clamp((progress - 0.92) / 0.08, 0, 1));

  if (bg.sea) drawSea(ctx, bg, view, cam, t, P);

  for (let i = 0; i < bg.layers.length; i++) {
    const L = bg.layers[i];
    const ox = (((cam.x * L.par) % TW) + TW) % TW;
    const y = L.yTop - cam.y * L.par;
    drawTile(ctx, L.canvas, ox, y, TW, L.h, view.w);
    for (const d of L.dyn) {
      let x = d.x - ox;
      while (x < -200) x += TW;
      while (x < view.w + 200) {
        drawDyn(ctx, d, x, d.y - cam.y * L.par, t, P);
        x += TW;
      }
    }
    if (bg.rays && i === 1) drawRays(ctx, view, t, P);
    const fog = bg.fogAfter && bg.fogAfter[i];
    if (fog) {
      const fox = (((cam.x * (L.par + 0.04) + t * 9) % TW) + TW) % TW;
      ctx.globalAlpha = fog.a;
      drawTile(ctx, fog.tile, fox, fog.y - 100 - cam.y * L.par, TW, 200, view.w);
      ctx.globalAlpha = 1;
    }
  }
  if (flash > 0) {
    ctx.fillStyle = `rgba(210,225,255,${flash * 0.55})`;
    ctx.fillRect(0, view.top, view.w, view.bottom - view.top);
  }
}

function drawSea(ctx, bg, view, cam, t, P) {
  const y0 = bg.sea.y - cam.y * 0.08;
  const g = ctx.createLinearGradient(0, y0, 0, y0 + 120);
  g.addColorStop(0, mix(P.water, P.haze, 0.35));
  g.addColorStop(1, P.water);
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, view.w, view.bottom - y0);
  ctx.fillStyle = alpha(P.seaGlint || '#9fb6cc', P.seaGlint ? 0.2 : 0.12);
  for (let i = 0; i < 40; i++) {
    const yy = y0 + 4 + Math.pow(i / 40, 1.6) * 90;
    const w = 20 + hash(i) * 70;
    const x = fract(hash(i * 3) + t * 0.004 * (1 + hash(i * 7)) - cam.x * 0.00004 * (1 + i / 10)) * (view.w + 200) - 100;
    ctx.fillRect(x, yy, w, 1);
  }
}

function drawDyn(ctx, d, x, y, t, P) {
  if (d.type === 'windmill') {
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 2.2;
    const a0 = t * 0.9;
    for (let k = 0; k < 4; k++) {
      const a = a0 + (k * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * d.r, y + Math.sin(a) * d.r);
      ctx.stroke();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = d.color;
      ctx.fillRect(d.r * 0.25, 0, d.r * 0.72, 4);
      ctx.restore();
    }
  } else if (d.type === 'lighthouse') {
    const th = t * 1.3;
    const s = Math.sin(th);
    const facing = Math.max(0, Math.cos(th));
    const len = 520 * Math.abs(s);
    const dir = s > 0 ? 1 : -1;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x, y, x + dir * len, y);
    g.addColorStop(0, 'rgba(255,236,190,0.35)');
    g.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dir * len, y - 26);
    ctx.lineTo(x + dir * len, y + 26);
    ctx.closePath();
    ctx.fill();
    const r = 8 + facing * 40;
    const gg = ctx.createRadialGradient(x, y, 0, x, y, r);
    gg.addColorStop(0, `rgba(255,240,200,${0.6 + facing * 0.4})`);
    gg.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = gg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  } else if (d.type === 'blink') {
    if (fract(t / d.period + d.phase) < 0.5) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
      g.addColorStop(0, alpha(d.color, 0.95));
      g.addColorStop(1, alpha(d.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - 9, y - 9, 18, 18);
      ctx.restore();
    }
  } else if (d.type === 'lamp') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const flick = 0.9 + Math.sin(t * 13 + x) * 0.05;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 46);
    g.addColorStop(0, alpha(P.lamp, 0.55 * flick));
    g.addColorStop(1, alpha(P.lamp, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - 46, y - 46, 92, 92);
    const c = ctx.createLinearGradient(0, y, 0, y + 72);
    c.addColorStop(0, alpha(P.lamp, 0.16));
    c.addColorStop(1, alpha(P.lamp, 0));
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x + 3, y);
    ctx.lineTo(x + 26, y + 72);
    ctx.lineTo(x - 26, y + 72);
    ctx.fill();
    ctx.restore();
  } else if (d.type === 'glow') {
    // a slow, breathing glow (lava in a crater)
    const k = 0.75 + 0.25 * Math.sin((t / d.period) * TAU);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, d.r);
    g.addColorStop(0, alpha(d.color, 0.55 * k));
    g.addColorStop(0.4, alpha(d.color, 0.18 * k));
    g.addColorStop(1, alpha(d.color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - d.r, y - d.r, d.r * 2, d.r * 2);
    ctx.restore();
  } else if (d.type === 'steam') {
    // a vent breathing out puffs that rise, swell and fade
    for (let k = 0; k < 5; k++) {
      const p = fract(t * 0.18 + k / 5 + d.phase);
      const r = (6 + p * 26) * d.s;
      ctx.fillStyle = `rgba(220,214,214,${0.2 * (1 - p)})`;
      ctx.beginPath();
      ctx.arc(x + p * 18 * d.s + Math.sin(p * 5 + k) * 3, y - p * 90 * d.s, r, 0, TAU);
      ctx.fill();
    }
  } else if (d.type === 'paperLantern') {
    const s = d.s;
    const sway = Math.sin(t * 1.3 + d.phase) * 0.12;
    const lx = x + sway * 10 * s;
    const ly = y + 6 * s;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 26 * s);
    glow.addColorStop(0, alpha(P.lamp, 0.4 * (0.9 + 0.1 * Math.sin(t * 9 + d.phase))));
    glow.addColorStop(1, alpha(P.lamp, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 26 * s, ly - 26 * s, 52 * s, 52 * s);
    ctx.restore();
    ctx.strokeStyle = alpha('#000000', 0.5);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(lx, ly - 5 * s);
    ctx.stroke();
    ctx.fillStyle = mix('#e8432e', '#ffb070', 0.25);
    ctx.beginPath();
    ctx.ellipse(lx, ly, 5 * s, 6 * s, sway, 0, TAU);
    ctx.fill();
    ctx.fillStyle = alpha('#ffe0a0', 0.75);
    ctx.beginPath();
    ctx.ellipse(lx, ly, 2.4 * s, 4.6 * s, sway, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a1410';
    ctx.fillRect(lx - 2.5 * s, ly - 6.5 * s, 5 * s, 1.4 * s);
    ctx.fillRect(lx - 2.5 * s, ly + 5.2 * s, 5 * s, 1.4 * s);
  }
}

function drawRays(ctx, view, t, P) {
  const sx = P.sun.x * view.w;
  const sy = P.sun.y - 60;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * 0.62 + i * 0.075 + Math.sin(t * 0.13 + i) * 0.012;
    const w = 0.018 + hash(i) * 0.03;
    const len = 700;
    const k = 0.06 + 0.05 * (0.5 + 0.5 * Math.sin(t * 0.4 + i * 1.7));
    const g = ctx.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
    g.addColorStop(0, alpha(P.light, k * 1.4));
    g.addColorStop(1, alpha(P.light, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(a - w) * len, sy + Math.sin(a - w) * len);
    ctx.lineTo(sx + Math.cos(a + w) * len, sy + Math.sin(a + w) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawAurora(ctx, view, t, k) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const bands = [
    ['rgba(80,255,170,', 150, 0, 0.22],
    ['rgba(60,200,255,', 120, 2.1, 0.16],
    ['rgba(170,110,255,', 95, 4.2, 0.1],
  ];
  for (const [col, base, ph, a] of bands) {
    const g = ctx.createLinearGradient(0, base - 90, 0, base + 30);
    g.addColorStop(0, col + '0)');
    g.addColorStop(0.75, col + (a * k).toFixed(3) + ')');
    g.addColorStop(1, col + '0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    const y = (x) => base + Math.sin(x * 0.0035 + t * 0.18 + ph) * 26 + Math.sin(x * 0.011 - t * 0.31 + ph) * 12;
    ctx.moveTo(0, y(0) - 100);
    for (let x = 0; x <= view.w + 20; x += 20) ctx.lineTo(x, y(x) - 100 - Math.sin(x * 0.02 + t * 0.5 + ph) * 18);
    for (let x = view.w + 20; x >= 0; x -= 20) ctx.lineTo(x, y(x) + 22);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Heat shimmer: re-draw thin horizontal strips of the canvas onto itself with a wobble. */
export function heatShimmer(ctx, y0, y1, t) {
  const c = ctx.canvas;
  const m = ctx.getTransform();
  const top = Math.max(0, Math.round(m.d * y0 + m.f));
  const bot = Math.min(c.height, Math.round(m.d * y1 + m.f));
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let y = top; y < bot; y += 3) {
    const off = Math.sin(y * 0.21 + t * 7) * 1.4 * m.a;
    ctx.drawImage(c, 0, y, c.width, 3, off, y, c.width, 3);
  }
  ctx.restore();
}

