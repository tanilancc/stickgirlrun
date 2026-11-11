// Chapter 3 backgrounds: blossom orchards, lavender hills, a smoking island volcano, a cloud
// forest strung with rope bridges, a gorge of maples, and a summit under the Milky Way.
// Painted with the same tools as backgrounds.js.

import { TW, periodic, layer, each, ridge, litColumns, hazeOver, pine, cloudLayer } from './backgrounds.js';
import { blobCanopy, emergentTree, bigLeaf, archBridge } from './backgrounds-world.js';
import { hash, mulberry32 } from './rng.js';
import { mix, alpha, TAU, fract } from './util.js';

// ---------------------------------------------------------------- silhouettes

function blossomTree(g, x, base, h, trunk, bloom, light, rng) {
  g.strokeStyle = trunk;
  g.lineCap = 'round';
  g.lineWidth = Math.max(1.4, h * 0.07);
  const fork = base - h * 0.42;
  g.beginPath();
  g.moveTo(x, base);
  g.quadraticCurveTo(x + h * 0.03, base - h * 0.2, x, fork);
  for (const d of [-1, 0.3, 1]) {
    g.moveTo(x, fork);
    g.quadraticCurveTo(x + d * h * 0.12, fork - h * 0.12, x + d * h * 0.26, fork - h * 0.3);
  }
  g.stroke();
  const blobs = [];
  for (let i = 0; i < 10; i++) blobs.push([x + (rng() - 0.5) * h * 0.95, base - h * (0.58 + rng() * 0.36), h * (0.13 + rng() * 0.12)]);
  g.fillStyle = bloom;
  for (const [bx, by, r] of blobs) {
    g.beginPath();
    g.arc(bx, by, r, 0, TAU);
    g.fill();
  }
  g.fillStyle = light;
  for (const [bx, by, r] of blobs) {
    if (rng() < 0.45) continue;
    g.beginPath();
    g.arc(bx - r * 0.25, by - r * 0.3, r * 0.55, 0, TAU);
    g.fill();
  }
}

function farmhouse(g, x, base, s, wall, roof, rng) {
  const w = 46 * s;
  const h = 22 * s;
  g.fillStyle = wall;
  g.fillRect(x, base - h, w, h);
  g.fillStyle = roof;
  g.beginPath();
  g.moveTo(x - 4 * s, base - h + 1);
  g.lineTo(x + w * 0.5, base - h - 16 * s);
  g.lineTo(x + w + 4 * s, base - h + 1);
  g.fill();
  g.fillRect(x + w * 0.72, base - h - 18 * s, 4 * s, 10 * s);
  g.fillStyle = alpha('#000000', 0.35);
  for (let k = 0; k < 3; k++) if (rng() < 0.8) g.fillRect(x + 6 * s + k * 13 * s, base - h + 7 * s, 4 * s, 5 * s);
}

function cypress(g, x, base, h, col) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x, base - h);
  g.quadraticCurveTo(x + h * 0.14, base - h * 0.55, x + h * 0.05, base);
  g.lineTo(x - h * 0.05, base);
  g.quadraticCurveTo(x - h * 0.14, base - h * 0.55, x, base - h);
  g.fill();
}

function stoneVillage(g, cx, base, col, rng) {
  g.fillStyle = col;
  let x = cx - 70;
  while (x < cx + 70) {
    const w = 14 + rng() * 16;
    const h = 10 + rng() * 14 + (1 - Math.abs(x - cx) / 70) * 18;
    g.fillRect(x, base - h, w, h);
    g.beginPath();
    g.moveTo(x - 2, base - h);
    g.lineTo(x + w / 2, base - h - 6);
    g.lineTo(x + w + 2, base - h);
    g.fill();
    x += w - 1;
  }
  g.fillRect(cx - 4, base - 62, 8, 30);
  g.beginPath();
  g.moveTo(cx - 6, base - 62);
  g.lineTo(cx, base - 74);
  g.lineTo(cx + 6, base - 62);
  g.fill();
}

function deadTree(g, x, base, h, col, rng) {
  g.strokeStyle = col;
  g.lineCap = 'round';
  g.lineWidth = Math.max(1.4, h * 0.05);
  g.beginPath();
  g.moveTo(x, base);
  g.lineTo(x + (rng() - 0.5) * 6, base - h);
  for (let k = 0; k < 4; k++) {
    const y = base - h * (0.4 + k * 0.15);
    const d = k % 2 ? 1 : -1;
    g.moveTo(x, y);
    g.lineTo(x + d * h * (0.2 + rng() * 0.15), y - h * 0.15);
  }
  g.stroke();
}

function mapleCanopy(g, x, y, r, cols, rng, n = 9) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[Math.floor(rng() * cols.length)];
    g.beginPath();
    g.arc(x + (rng() - 0.5) * r * 1.6, y + (rng() - 0.5) * r * 0.7, r * (0.4 + rng() * 0.45), 0, TAU);
    g.fill();
  }
}

function ropeBridge(g, x0, y0, x1, y1, col) {
  const sag = 22;
  const at = (u, drop) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + Math.sin(Math.PI * u) * drop];
  g.strokeStyle = col;
  g.lineWidth = 1.2;
  for (const [dy, drop] of [
    [0, sag],
    [-14, sag * 0.8],
  ]) {
    g.beginPath();
    for (let k = 0; k <= 20; k++) {
      const [x, y] = at(k / 20, drop);
      if (!k) g.moveTo(x, y + dy);
      else g.lineTo(x, y + dy);
    }
    g.stroke();
  }
  g.lineWidth = 0.8;
  g.beginPath();
  for (let k = 1; k < 20; k++) {
    const [x, y] = at(k / 20, sag);
    const [, yt] = at(k / 20, sag * 0.8);
    g.moveTo(x, y);
    g.lineTo(x, yt - 14);
  }
  g.stroke();
  g.lineWidth = 2.6;
  g.beginPath();
  for (let k = 0; k <= 20; k++) {
    const [x, y] = at(k / 20, sag);
    if (!k) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
}

function domeObservatory(g, x, base, s, col, slit) {
  g.fillStyle = col;
  g.fillRect(x - 12 * s, base - 14 * s, 24 * s, 14 * s);
  g.beginPath();
  g.arc(x, base - 14 * s, 12 * s, Math.PI, 0);
  g.fill();
  g.fillStyle = slit;
  g.fillRect(x - 1.6 * s, base - 25 * s, 3.2 * s, 9 * s);
}

/** A band of the Milky Way, painted once: glow, dense stars, and dark dust lanes. */
function milkyTile(seed) {
  const s = 0.5;
  const c = document.createElement('canvas');
  c.width = TW * s;
  c.height = 380 * s;
  const g = c.getContext('2d');
  g.scale(s, s);
  const rng = mulberry32(seed);
  const band = (x) => 260 - x * 0.09 + Math.sin(x * 0.004) * 30;
  const wrap = (x, fn) => each(x, 160, fn);
  for (let i = 0; i < 260; i++) {
    const x = rng() * TW;
    const y = band(x) + (rng() - 0.5) * 70;
    const r = 30 + rng() * 70;
    const col = rng() < 0.5 ? '160,180,255' : rng() < 0.5 ? '255,220,200' : '200,180,255';
    wrap(x, (xx) => {
      const gr = g.createRadialGradient(xx, y, 0, xx, y, r);
      gr.addColorStop(0, `rgba(${col},0.05)`);
      gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr;
      g.fillRect(xx - r, y - r, r * 2, r * 2);
    });
  }
  for (let i = 0; i < 1600; i++) {
    const x = rng() * TW;
    const y = band(x) + (rng() + rng() + rng() - 1.5) * 50;
    const b = rng();
    g.fillStyle = `rgba(235,240,255,${0.18 + b * 0.5})`;
    g.fillRect(x, y, b > 0.95 ? 1.8 : 1, b > 0.95 ? 1.8 : 1);
  }
  for (let i = 0; i < 70; i++) {
    const x = rng() * TW;
    const y = band(x) + (rng() - 0.5) * 18;
    const r = 10 + rng() * 26;
    wrap(x, (xx) => {
      const gr = g.createRadialGradient(xx, y, 0, xx, y, r);
      gr.addColorStop(0, 'rgba(6,10,28,0.5)');
      gr.addColorStop(1, 'rgba(6,10,28,0)');
      g.fillStyle = gr;
      g.fillRect(xx - r, y - r, r * 2, r * 2);
    });
  }
  return c;
}

// ---------------------------------------------------------------- themes

export const SKY_THEMES = {
  orchard(P, rng) {
    const layers = [];
    layers.push(
      layer(220, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.45);
        const fn = (x) => 352 - (0.5 + 0.5 * n(x / TW)) * 60;
        ridge(g, fn, 600, P.far);
        const vx = 400 + rng() * 1000;
        stoneVillage(g, vx, fn(vx) + 6, mix(P.far, '#6a6a86', 0.25), rng);
        hazeOver(g, P.haze, 250, 600, 0.35, 0.8);
      })
    );
    layers.push(
      layer(240, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 3, 3, 0.45);
        const fn = (x) => 378 - (0.5 + 0.5 * n(x / TW)) * 60;
        litColumns(g, fn, 620, { lit: mix(P.mid, P.light, 0.3), dark: mix(P.mid, '#2a3a2a', 0.2), sunLeft: true, contrast: 2.2, smooth: 10 });
        const bloom = mix(P.blossom, P.mid, 0.4);
        const lit = mix(mix(P.blossom, '#ffffff', 0.4), P.mid, 0.3);
        const trunk = mix('#4a3428', P.mid, 0.5);
        for (let row = 0; row < 2; row++) {
          for (let x = (row * 13) % 26; x < TW; x += 26) {
            const h = row ? 22 : 16;
            each(x, 20, (xx) => blossomTree(g, xx, fn(xx) + 4 + row * 12, h, trunk, bloom, lit, rng));
          }
        }
        const fx = rng() * TW;
        each(fx, 60, (xx) => farmhouse(g, xx, fn(xx) + 3, 1.1, mix('#e8e0d0', P.mid, 0.3), mix('#a0483a', P.mid, 0.25), rng));
        hazeOver(g, P.haze, 290, 620, 0.12, 0.4);
      })
    );
    layers.push(
      layer(180, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.45);
        const fn = (x) => 400 - n(x / TW) * 8;
        ridge(g, fn, 640, P.near);
        const trunk = mix('#3a2820', P.near, 0.3);
        for (let x = rng() * 80; x < TW; x += 110 + rng() * 120) {
          const h = 90 + rng() * 50;
          each(x, 80, (xx) => blossomTree(g, xx, fn(xx) + 3, h, trunk, mix(P.blossom, P.near, 0.14), mix(P.blossom, '#ffffff', 0.38), rng));
        }
        g.fillStyle = mix(P.near, '#000000', 0.1);
        for (let x = 0; x < TW; x += 9) {
          if (hash(x) < 0.5) continue;
          g.beginPath();
          g.arc(x, fn(x) + 2, 6 + hash(x * 3) * 8, Math.PI, 0);
          g.fill();
        }
        hazeOver(g, P.haze, 330, 640, 0.04, 0.2);
      })
    );
    layers.push(
      layer(340, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 7;
        ridge(g, fn, 660, mix(P.near, '#000000', 0.2));
        const cols = ['#f2b8c8', '#f4e2a0', '#ffffff', '#e86a7a'];
        for (let x = 0; x < TW; x += 5) {
          if (hash(x * 7) < 0.6) continue;
          g.fillStyle = mix(cols[Math.floor(hash(x) * 4)], P.near, 0.35);
          g.beginPath();
          g.arc(x, fn(x) - 2 - hash(x * 3) * 6, 1.6, 0, TAU);
          g.fill();
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 50, 200, false, 0.9), birds: true };
  },

  lavender(P, rng) {
    const layers = [];
    layers.push(
      layer(220, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.45);
        const fn = (x) => 356 - (0.5 + 0.5 * n(x / TW)) * 70;
        ridge(g, fn, 600, P.far);
        let best = 0;
        for (let x = 0; x < TW; x += 8) if (fn(x) < fn(best)) best = x;
        stoneVillage(g, best, fn(best) + 8, mix(P.far, '#7a7092', 0.3), rng);
        hazeOver(g, P.haze, 260, 600, 0.3, 0.75);
      })
    );
    layers.push(
      layer(260, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 3, 3, 0.45);
        const fn = (x) => 382 - (0.5 + 0.5 * n(x / TW)) * 50;
        ridge(g, fn, 620, mix(P.mid, '#7a8a6a', 0.45));
        g.save();
        g.globalCompositeOperation = 'source-atop';
        for (let k = 0; k < 16; k++) {
          g.strokeStyle = mix(P.lav, P.mid, 0.25 + (k % 2) * 0.15);
          g.lineWidth = 3.2;
          g.beginPath();
          for (let x = 0; x <= TW; x += 6) {
            const y = fn(x) + 4 + k * 6.5;
            if (!x) g.moveTo(x, y);
            else g.lineTo(x, y);
          }
          g.stroke();
        }
        g.restore();
        const cy = mix('#2a3a24', P.mid, 0.35);
        for (let i = 0; i < 18; i++) {
          const x = rng() * TW;
          each(x, 10, (xx) => cypress(g, xx, fn(xx) + 3, 26 + rng() * 24, cy));
        }
        const fx = rng() * TW;
        each(fx, 60, (xx) => farmhouse(g, xx, fn(xx) + 4, 1.1, mix('#e2d4b8', P.mid, 0.3), mix('#b86a4a', P.mid, 0.25), rng));
        hazeOver(g, P.haze, 300, 620, 0.12, 0.38);
      })
    );
    layers.push(
      layer(250, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.45);
        const fn = (x) => 402 - n(x / TW) * 6;
        ridge(g, fn, 640, mix(P.near, '#4a5a3a', 0.4));
        // rows of lavender running towards the path
        for (let x = rng() * 30; x < TW; x += 22) {
          for (let k = 0; k < 3; k++) {
            const y = fn(x) + 4 + k * 9;
            const w = 9 + k * 3;
            g.fillStyle = mix(P.lav, P.near, 0.15 + k * 0.1);
            g.beginPath();
            g.ellipse(x + k * 4, y, w, 6 + k, 0, Math.PI, 0);
            g.fill();
            g.fillStyle = alpha(mix(P.lav, '#ffffff', 0.35), 0.5);
            for (let j = 0; j < 4; j++) g.fillRect(x + k * 4 - w * 0.7 + j * w * 0.45, y - 5 - k - hash(x + j) * 3, 1.2, 1.2);
          }
        }
        for (let i = 0; i < 5; i++) {
          const x = rng() * TW;
          each(x, 14, (xx) => cypress(g, xx, fn(xx) + 2, 70 + rng() * 40, mix('#1e2a1a', P.near, 0.2)));
        }
        hazeOver(g, P.haze, 330, 640, 0.04, 0.18);
      })
    );
    layers.push(
      layer(340, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 7;
        ridge(g, fn, 660, mix(P.near, '#000000', 0.25));
        g.fillStyle = mix(P.lav, P.near, 0.4);
        for (let x = 0; x < TW; x += 4) {
          const h = 6 + hash(x * 5) * 10;
          g.fillRect(x, fn(x) - h, 1.6, h);
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 4, 50, 160, false, 0.7), birds: true };
  },

  volcano(P, rng) {
    const layers = [];
    const cone = { x: 900 + rng() * 300, w: 520, h: 230 };
    layers.push(
      layer(60, 386, 0.04, 0.5, (g, dyn) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => {
          let hh = 4 + Math.max(0, n(x / TW)) * 20;
          for (const off of [0, TW, -TW]) {
            const u = Math.abs(x - (cone.x + off)) / cone.w;
            if (u < 1) hh = Math.max(hh, Math.min(cone.h * 0.9, cone.h * Math.pow(1 - u, 1.35)));
          }
          return 384 - hh;
        };
        litColumns(g, fn, 386, { lit: mix(P.far, P.light, 0.25), dark: mix(P.far, '#1a1014', 0.3), sunLeft: true, contrast: 2.4, smooth: 12 });
        // lava runs down the flank
        const top = 384 - cone.h * 0.9;
        g.save();
        g.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 4; k++) {
          const dx = (k - 1.5) * 26;
          g.strokeStyle = alpha('#ff6a20', 0.5);
          g.lineWidth = 2.2;
          g.beginPath();
          g.moveTo(cone.x + dx * 0.3, top + 2);
          for (let s = 1; s <= 10; s++) {
            const u = s / 10;
            g.lineTo(cone.x + dx * (0.3 + u * 1.6) + Math.sin(u * 9 + k) * 6, top + u * (cone.h * 0.55));
          }
          g.stroke();
        }
        g.restore();
        dyn.push({ type: 'glow', x: cone.x, y: top, r: 70, color: '#ff7a2a', period: 3.2 });
        hazeOver(g, P.haze, 240, 386, 0.25, 0.5, 60);
      })
    );
    layers.push(
      layer(280, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 4, 3, 0.55);
        const fn = (x) => 398 - Math.max(0, n(x / TW)) * 40 - 2;
        litColumns(g, fn, 620, { lit: mix(P.mid, P.light, 0.22), dark: mix(P.mid, '#000000', 0.3), sunLeft: true, contrast: 2.6, smooth: 6 });
        for (let i = 0; i < 12; i++) {
          const x = rng() * TW;
          each(x, 20, (xx) => deadTree(g, xx, fn(xx) + 2, 18 + rng() * 16, mix(P.mid, '#000000', 0.3), rng));
        }
        hazeOver(g, P.haze, 320, 620, 0.12, 0.35);
      })
    );
    layers.push(
      layer(200, 640, 0.3, 0.75, (g, dyn) => {
        const n = periodic(rng, 5, 3, 0.55);
        const fn = (x) => 404 - n(x / TW) * 10;
        ridge(g, fn, 640, P.near);
        // cooled lava: ropy folds catching the light
        g.strokeStyle = alpha(P.light, 0.08);
        g.lineWidth = 1.2;
        for (let x = 0; x < TW; x += 14) {
          g.beginPath();
          g.arc(x + hash(x) * 8, fn(x) + 10 + hash(x * 3) * 20, 6 + hash(x * 5) * 6, Math.PI * 1.1, Math.PI * 1.9);
          g.stroke();
        }
        for (let i = 0; i < 4; i++) {
          const x = rng() * TW;
          dyn.push({ type: 'steam', x, y: fn(x) + 2, s: 0.8 + rng() * 0.6, phase: rng() * 10 });
        }
        for (let i = 0; i < 6; i++) {
          const x = rng() * TW;
          each(x, 30, (xx) => deadTree(g, xx, fn(xx) + 3, 50 + rng() * 40, mix(P.near, '#000000', 0.2), rng));
        }
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 7, 3, 0.55);
        const fn = (x) => 414 - Math.abs(n(x / TW)) * 12;
        ridge(g, fn, 660, mix(P.near, '#000000', 0.3));
      })
    );
    // the plume, drifting downwind from the crater
    const plume = document.createElement('canvas');
    plume.width = TW * 0.5;
    plume.height = 320 * 0.5;
    {
      const g = plume.getContext('2d');
      g.scale(0.5, 0.5);
      const top = 384 - cone.h * 0.9;
      for (let i = 0; i < 70; i++) {
        const u = i / 70;
        const x = cone.x + u * 700 + (rng() - 0.5) * 60;
        const y = top - 20 - Math.sqrt(u) * 150 + (rng() - 0.5) * 30;
        const r = 26 + u * 70 + rng() * 20;
        each(x, r, (xx) => {
          const gr = g.createRadialGradient(xx, y, 0, xx, y, r);
          gr.addColorStop(0, alpha(mix('#5a5058', P.haze, u * 0.6), 0.32 * (1 - u * 0.6)));
          gr.addColorStop(1, alpha('#5a5058', 0));
          g.fillStyle = gr;
          g.fillRect(xx - r, y - r, r * 2, r * 2);
        });
      }
    }
    return { layers, clouds: { canvas: plume, yTop: 0, h: 320, par: 0.04, drift: 3 }, sea: { y: 384 } };
  },

  cloudforest(P, rng) {
    const layers = [];
    layers.push(
      layer(120, 600, 0.04, 0.5, (g) => {
        for (let r = 0; r < 3; r++) {
          const n = periodic(rng, 2 + r, 3, 0.5);
          const base = 300 + r * 26;
          const fn = (x) => base - (0.5 + 0.5 * n(x / TW)) * (110 - r * 25);
          ridge(g, fn, 600, mix(P.far, P.haze, 0.45 - r * 0.15));
          if (r === 1) {
            for (let i = 0; i < 4; i++) {
              const x = rng() * TW;
              const y0 = fn(x) + 6;
              g.strokeStyle = alpha('#ffffff', 0.55);
              g.lineWidth = 1.6;
              g.beginPath();
              g.moveTo(x, y0);
              g.lineTo(x + 1, y0 + 40 + rng() * 30);
              g.stroke();
            }
          }
        }
        hazeOver(g, P.haze, 200, 600, 0.3, 0.75, 120);
      })
    );
    layers.push(
      layer(140, 620, 0.14, 0.6, (g) => {
        const n = periodic(rng, 4, 3, 0.5);
        const fn = (x) => 368 - n(x / TW) * 14;
        const col = P.mid;
        ridge(g, fn, 620, col);
        for (let x = 0; x < TW; x += 10) blobCanopy(g, x, fn(x), 14 + hash(x * 3) * 16, col, rng, 2);
        for (let i = 0; i < 9; i++) {
          const x = rng() * TW;
          each(x, 50, (xx) => emergentTree(g, xx, fn(xx), 110 + rng() * 80, mix(col, '#000000', 0.06), rng));
        }
        hazeOver(g, P.haze, 160, 620, 0.2, 0.5, 140);
      })
    );
    layers.push(
      layer(-120, 640, 0.32, 0.75, (g) => {
        const n = periodic(rng, 5, 3, 0.5);
        const fn = (x) => 402 - n(x / TW) * 6;
        const col = P.near;
        ridge(g, fn, 640, col);
        const trunks = [];
        for (let x = 30 + rng() * 60; x < TW - 60; x += 150 + rng() * 140) trunks.push({ x, w: 22 + rng() * 18 });
        for (const t of trunks) {
          each(t.x, t.w * 3, (xx) => {
            const base = fn(xx);
            g.fillStyle = col;
            g.fillRect(xx - t.w / 2, -120, t.w, base + 120);
            g.beginPath();
            g.moveTo(xx - t.w * 1.8, base + 2);
            g.quadraticCurveTo(xx - t.w * 0.6, base - 8, xx - t.w * 0.5, base - 44);
            g.lineTo(xx + t.w * 0.5, base - 44);
            g.quadraticCurveTo(xx + t.w * 0.6, base - 8, xx + t.w * 1.8, base + 2);
            g.fill();
            // moss and epiphytes clinging to the bark
            g.fillStyle = mix(col, '#7a9a4a', 0.3);
            for (let k = 0; k < 9; k++) {
              const y = -100 + hash(xx + k) * (base + 60);
              g.beginPath();
              g.ellipse(xx + (hash(k * 7 + xx) - 0.5) * t.w, y, 5 + hash(k) * 5, 3, 0, 0, TAU);
              g.fill();
            }
            g.strokeStyle = mix(col, '#9ab070', 0.25);
            g.lineWidth = 1;
            for (let k = 0; k < 5; k++) {
              const sx = xx + (hash(k * 3 + xx) - 0.5) * t.w * 1.4;
              const sy = -40 + hash(k * 11 + xx) * 160;
              g.beginPath();
              g.moveTo(sx, sy);
              g.lineTo(sx + 1, sy + 20 + hash(k + xx) * 30);
              g.stroke();
            }
          });
        }
        // walkways strung between the giants
        for (let i = 0; i + 1 < trunks.length; i++) {
          if (rng() < 0.35) continue;
          const a = trunks[i];
          const b = trunks[i + 1];
          const y = 200 + rng() * 80;
          ropeBridge(g, a.x + a.w / 2, y, b.x - b.w / 2, y + (rng() - 0.5) * 20, mix(col, '#5a4a30', 0.3));
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
        for (let x = 0; x < TW; x += 18 + rng() * 24) {
          for (let k = 0; k < 4; k++) bigLeaf(g, x, fn(x) + 2, 12 + rng() * 12, -Math.PI / 2 + (k - 1.5) * 0.6, k % 2 ? mix(col, P.mid, 0.2) : col, null);
        }
      })
    );
    return {
      layers,
      clouds: cloudLayer(P, rng, 12, 120, 300, true, 1),
      fogAfter: {
        0: { color: P.haze, y: 300, a: 0.7 },
        1: { color: P.haze, y: 330, a: 0.55 },
        2: { color: P.haze, y: 380, a: 0.3 },
      },
    };
  },

  maple(P, rng) {
    const layers = [];
    const fall = ['#d8402a', '#e88a2a', '#f2c040', '#a83020', '#7a8a3a'];
    layers.push(
      layer(120, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 340 - (0.5 + 0.5 * n(x / TW)) * 150;
        litColumns(g, fn, 600, { lit: mix(P.far, P.light, 0.3), dark: mix(P.far, '#3a2a3a', 0.25), sunLeft: false, contrast: 2.4, smooth: 10 });
        hazeOver(g, P.haze, 160, 600, 0.3, 0.7, 120);
      })
    );
    layers.push(
      layer(160, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 372 - (0.5 + 0.5 * n(x / TW)) * 110;
        ridge(g, fn, 620, P.mid);
        const cols = fall.map((c) => mix(c, P.mid, 0.45));
        for (let x = 0; x < TW; x += 9) mapleCanopy(g, x, fn(x) + 4, 9 + hash(x) * 6, cols, rng, 2);
        g.save();
        g.globalCompositeOperation = 'source-atop';
        for (let x = 0; x < TW; x += 8) mapleCanopy(g, x, fn(x) + 20 + hash(x * 3) * 80, 10, cols, rng, 1);
        g.restore();
        // a waterfall down a grey cliff into the gorge
        const wx = 600 + rng() * 700;
        each(wx, 60, (xx) => {
          const top = fn(xx) + 10;
          g.fillStyle = mix('#6a6066', P.mid, 0.3);
          g.beginPath();
          g.moveTo(xx - 40, 420);
          g.lineTo(xx - 26, top);
          g.lineTo(xx + 26, top - 4);
          g.lineTo(xx + 44, 420);
          g.fill();
          const gr = g.createLinearGradient(0, top, 0, 420);
          gr.addColorStop(0, alpha('#ffffff', 0.85));
          gr.addColorStop(1, alpha('#e8f2f8', 0.5));
          g.fillStyle = gr;
          g.fillRect(xx - 9, top, 18, 420 - top);
          g.strokeStyle = alpha('#c8dce8', 0.6);
          g.lineWidth = 1;
          for (let k = 0; k < 5; k++) {
            g.beginPath();
            g.moveTo(xx - 7 + k * 3.5, top + 6);
            g.lineTo(xx - 7 + k * 3.5 + Math.sin(k) * 2, 418);
            g.stroke();
          }
        });
        archBridge(g, rng() * TW, 372, 120, 18, mix('#8a7a6a', P.mid, 0.4));
        hazeOver(g, P.haze, 220, 620, 0.12, 0.36);
      })
    );
    layers.push(
      layer(160, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.5);
        const fn = (x) => 402 - n(x / TW) * 8;
        ridge(g, fn, 640, P.near);
        const cols = fall.map((c) => mix(c, P.near, 0.2));
        for (let x = rng() * 80; x < TW; x += 120 + rng() * 140) {
          const h = 110 + rng() * 60;
          each(x, 90, (xx) => {
            const base = fn(xx) + 3;
            g.strokeStyle = mix('#2a1810', P.near, 0.3);
            g.lineCap = 'round';
            g.lineWidth = 7;
            g.beginPath();
            g.moveTo(xx, base);
            g.quadraticCurveTo(xx + 4, base - h * 0.4, xx - 2, base - h * 0.6);
            g.moveTo(xx, base - h * 0.45);
            g.lineTo(xx + h * 0.22, base - h * 0.72);
            g.moveTo(xx, base - h * 0.5);
            g.lineTo(xx - h * 0.2, base - h * 0.75);
            g.stroke();
            mapleCanopy(g, xx, base - h * 0.78, h * 0.32, cols, rng, 14);
          });
        }
        hazeOver(g, P.haze, 300, 640, 0.04, 0.2);
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 7;
        ridge(g, fn, 660, mix(P.near, '#000000', 0.25));
        for (let x = 0; x < TW; x += 4) {
          if (hash(x * 3) < 0.4) continue;
          g.fillStyle = mix(fall[Math.floor(hash(x) * 4)], P.near, 0.4);
          g.beginPath();
          g.ellipse(x, fn(x) - 1 - hash(x * 5) * 3, 2.6, 1.3, hash(x) * 3, 0, TAU);
          g.fill();
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 5, 60, 200, true, 0.8), birds: true };
  },

  summit(P, rng) {
    const layers = [];
    layers.push(
      layer(80, 600, 0.04, 0.5, (g, dyn) => {
        const peaks = [];
        for (let i = 0; i < 9; i++) peaks.push({ x: rng() * TW, w: 110 + rng() * 140, h: 120 + rng() * 170 });
        const fn = (x) => {
          let hh = 20;
          for (const p of peaks) {
            for (const off of [0, TW, -TW]) {
              const u = Math.abs(x - (p.x + off)) / p.w;
              if (u < 1) hh = Math.max(hh, p.h * (1 - u) + Math.sin(x * 0.09) * 4 * (1 - u));
            }
          }
          return 380 - hh;
        };
        litColumns(g, fn, 600, { lit: mix(P.far, '#5a6aa0', 0.35), dark: mix(P.far, '#000000', 0.3), sunLeft: true, contrast: 2.6, smooth: 6, snowLine: 270, snowLit: '#7c8cc0', snowDark: '#2e3866' });
        // a little observatory on the highest peak, its slit lit
        let best = 0;
        for (let x = 0; x < TW; x += 4) if (fn(x) < fn(best)) best = x;
        domeObservatory(g, best, fn(best) + 3, 0.6, mix(P.far, '#000000', 0.35), '#ffcf86');
        dyn.push({ type: 'blink', x: best, y: fn(best) - 10, color: '#ffcf86', period: 6, phase: 0.2 });
        hazeOver(g, P.haze, 200, 600, 0.12, 0.4, 80);
      })
    );
    layers.push(
      layer(240, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 376 - (0.5 + 0.5 * n(x / TW)) * 70;
        litColumns(g, fn, 620, { lit: mix(P.mid, '#3a4a7a', 0.3), dark: mix(P.mid, '#000000', 0.3), sunLeft: true, contrast: 2.2, smooth: 8 });
        for (let i = 0; i < 26; i++) {
          const x = rng() * TW;
          each(x, 10, (xx) => pine(g, xx, fn(xx) + 2, 14 + rng() * 12, mix(P.mid, '#000000', 0.3), rng, null));
        }
        // a valley town far below, still awake
        for (let i = 0; i < 70; i++) {
          const x = rng() * TW;
          g.fillStyle = alpha(i % 4 ? '#ffcf86' : '#ffe8c0', 0.35 + rng() * 0.4);
          g.fillRect(x, fn(x) + 30 + rng() * 40, 1.4, 1.4);
        }
      })
    );
    layers.push(
      layer(220, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.55);
        const fn = (x) => 400 - Math.abs(n(x / TW)) * 26;
        litColumns(g, fn, 640, { lit: mix(P.near, '#2a3660', 0.4), dark: P.near, sunLeft: true, contrast: 2, smooth: 6 });
        g.fillStyle = mix(P.near, '#000000', 0.2);
        for (let i = 0; i < 12; i++) {
          const x = rng() * TW;
          each(x, 10, (xx) => {
            const b = fn(xx) + 2;
            for (let k = 0; k < 4; k++) {
              const w = 8 - k * 1.6;
              g.beginPath();
              g.ellipse(xx, b - 3 - k * 4.5, w, 2.6, 0, 0, TAU);
              g.fill();
            }
          });
        }
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.55);
        const fn = (x) => 414 - Math.abs(n(x / TW)) * 10;
        ridge(g, fn, 660, mix(P.near, '#000000', 0.35));
      })
    );
    return { layers, stars: true, milkyTile: milkyTile(rng() * 1e6), meteors: true };
  },
};

// ---------------------------------------------------------------- live sky effects

/** Shooting stars: a few on any night, a full shower when you reach the top. */
export function drawMeteors(ctx, view, t, k = 0) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const n = Math.round(1 + 9 * k);
  for (let i = 0; i < n; i++) {
    const period = 2.2 + hash(i * 17) * 3.4 - k * 1.2;
    const cyc = Math.floor((t + i * 1.37) / period);
    const p = fract((t + i * 1.37) / period);
    const life = 0.32;
    if (p > life) continue;
    const u = p / life;
    const seed = cyc * 13 + i * 71;
    const x0 = view.w * (0.15 + hash(seed) * 0.95);
    const y0 = 20 + hash(seed + 1) * 160;
    const len = 90 + hash(seed + 2) * 120;
    const dx = -0.86;
    const dy = 0.5;
    const hx = x0 + dx * len * u * 2.2;
    const hy = y0 + dy * len * u * 2.2;
    const a = Math.sin(Math.PI * u) * (0.6 + 0.4 * hash(seed + 3));
    const gr = ctx.createLinearGradient(hx, hy, hx - dx * len, hy - dy * len);
    gr.addColorStop(0, `rgba(235,240,255,${a})`);
    gr.addColorStop(1, 'rgba(235,240,255,0)');
    ctx.strokeStyle = gr;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx - dx * len, hy - dy * len);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(hx - 1.2, hy - 1.2, 2.4, 2.4);
  }
  ctx.restore();
}

