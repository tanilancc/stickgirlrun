// Chapter 5 backgrounds: a steaming geyser basin, a bamboo forest, striped painted hills,
// tulip fields with windmills, a glacier meeting the sea, and the lake below the cabin on a
// summer evening. Painted with the same tools as backgrounds.js.

import { TW, periodic, layer, each, vgrad, ridge, litColumns, hazeOver, pine, tree, cloudLayer } from './backgrounds.js';
import { hash, mulberry32 } from './rng.js';
import { mix, alpha, TAU } from './util.js';

// ---------------------------------------------------------------- silhouettes

function mirrored(g, water, a, fn) {
  fn();
  g.save();
  g.globalAlpha = a;
  g.translate(0, water * 2);
  g.scale(1, -1);
  fn();
  g.restore();
}

function hotPool(g, x, y, rx, ry, rng) {
  // mineral rings: orange mats outside, then yellow, then the blue eye of the spring
  const rings = [
    ['#c8642a', 1],
    ['#e8a040', 0.82],
    ['#e8d070', 0.68],
    ['#7ac8b0', 0.5],
    ['#2aa0c0', 0.36],
  ];
  for (const [c, k] of rings) {
    g.fillStyle = c;
    g.beginPath();
    g.ellipse(x, y, rx * k * (0.95 + rng() * 0.1), ry * k, 0, 0, TAU);
    g.fill();
  }
}

function bambooCulm(g, x, base, top, w, col, node, lean, rng) {
  const dx = lean * (base - top);
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x - w / 2, base);
  g.lineTo(x + dx - w / 2, top);
  g.lineTo(x + dx + w / 2, top);
  g.lineTo(x + w / 2, base);
  g.fill();
  g.fillStyle = node;
  const seg = 26 + rng() * 14;
  for (let y = base - seg; y > top; y -= seg) {
    const xx = x + lean * (base - y);
    g.fillRect(xx - w / 2 - 0.6, y, w + 1.2, Math.max(1, w * 0.14));
  }
}

function bambooLeaves(g, x, y, s, col, rng) {
  g.fillStyle = col;
  for (let k = 0; k < 6; k++) {
    const a = (rng() - 0.5) * 2.4 + (rng() < 0.5 ? 0 : Math.PI);
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(s * 0.5, -s * 0.12, s, 0);
    g.quadraticCurveTo(s * 0.5, s * 0.12, 0, 0);
    g.fill();
    g.restore();
  }
}

function windmillBody(g, x, base, s, body, cap) {
  g.fillStyle = body;
  g.beginPath();
  g.moveTo(x - 10 * s, base);
  g.lineTo(x - 6 * s, base - 46 * s);
  g.lineTo(x + 6 * s, base - 46 * s);
  g.lineTo(x + 10 * s, base);
  g.fill();
  g.fillStyle = cap;
  g.beginPath();
  g.moveTo(x - 8 * s, base - 45 * s);
  g.quadraticCurveTo(x, base - 58 * s, x + 8 * s, base - 45 * s);
  g.fill();
  g.fillRect(x - 12 * s, base - 22 * s, 24 * s, 2.4 * s);
  g.fillStyle = alpha('#000000', 0.35);
  g.fillRect(x - 2 * s, base - 9 * s, 4 * s, 9 * s);
}

// ---------------------------------------------------------------- themes

export const RETURN_THEMES = {
  geyser(P, rng) {
    const layers = [];
    layers.push(
      layer(220, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 356 - (0.4 + 0.6 * Math.abs(n(x / TW))) * 60;
        ridge(g, fn, 600, P.far);
        for (let x = 0; x < TW; x += 5) pine(g, x, fn(x) + 4, 8 + hash(x) * 6, P.far, rng, null);
        hazeOver(g, P.haze, 250, 600, 0.3, 0.6);
      })
    );
    layers.push(
      layer(250, 620, 0.12, 0.6, (g, dyn) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 382 - Math.abs(n(x / TW)) * 24;
        ridge(g, fn, 620, mix(P.ground.top, P.mid, 0.35));
        const col = P.mid;
        for (let i = 0; i < 70; i++) {
          const x = rng() * TW;
          const h = 30 + rng() * 40;
          each(x, 10, (xx) => {
            if (rng() < 0.2) {
              // a bleached snag, killed by the heat
              g.strokeStyle = mix('#d8d0c0', P.mid, 0.4);
              g.lineWidth = 1.4;
              g.beginPath();
              g.moveTo(xx, fn(xx) + 2);
              g.lineTo(xx, fn(xx) - h);
              g.stroke();
            } else pine(g, xx, fn(xx) + 2, h, col, rng, null);
          });
        }
        for (let i = 0; i < 6; i++) {
          const x = rng() * TW;
          dyn.push({ type: 'steam', x, y: fn(x), s: 1 + rng() * 0.8, phase: rng() * 10 });
        }
        const gx = 500 + rng() * 900;
        dyn.push({ type: 'geyser', x: gx, y: fn(gx) + 2, h: 130, period: 11, phase: rng() });
        hazeOver(g, P.haze, 290, 620, 0.12, 0.3);
      })
    );
    layers.push(
      layer(330, 640, 0.3, 0.75, (g, dyn) => {
        const n = periodic(rng, 4, 3, 0.5);
        const fn = (x) => 402 - n(x / TW) * 6;
        ridge(g, fn, 640, mix(P.ground.top, '#d8c090', 0.2));
        for (let i = 0; i < 8; i++) {
          const x = rng() * TW;
          each(x, 60, (xx) => hotPool(g, xx, fn(xx) + 6, 30 + rng() * 40, 3 + rng() * 2, rng));
        }
        // runoff channels stained orange
        g.strokeStyle = alpha('#c8642a', 0.5);
        g.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
          const x = rng() * TW;
          g.beginPath();
          g.moveTo(x, fn(x) + 4);
          g.quadraticCurveTo(x + 20, fn(x) + 10, x + 40 + rng() * 30, fn(x) + 20);
          g.stroke();
        }
        for (let i = 0; i < 3; i++) {
          const x = rng() * TW;
          dyn.push({ type: 'steam', x, y: fn(x) + 4, s: 1.4 + rng() * 0.8, phase: rng() * 10 });
        }
      })
    );
    layers.push(
      layer(340, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 6;
        ridge(g, fn, 660, mix(P.ground.body, '#000000', 0.15));
      })
    );
    return {
      layers,
      clouds: cloudLayer(P, rng, 6, 50, 200, false, 0.8),
      fogAfter: { 1: { color: '#ffffff', y: 340, a: 0.3 } },
    };
  },

  bamboo(P, rng) {
    const layers = [];
    const grove = (g, base, n, wMin, wMax, col, node, leaf, top) => {
      for (let i = 0; i < n; i++) {
        const x = rng() * TW;
        const w = wMin + rng() * (wMax - wMin);
        const lean = (rng() - 0.5) * 0.06;
        each(x, w * 4, (xx) => {
          bambooCulm(g, xx, base + 4, top, w, col, node, lean, rng);
          for (let k = 0; k < 3; k++) {
            const y = top + 30 + rng() * (base - top) * 0.55;
            bambooLeaves(g, xx + lean * (base - y), y, 10 + w * 2.4, leaf, rng);
          }
        });
      }
    };
    layers.push(
      layer(-120, 600, 0.05, 0.5, (g) => {
        grove(g, 380, 80, 2, 4, P.far, mix(P.far, '#000000', 0.15), P.far, -120);
        hazeOver(g, P.haze, -120, 600, 0.35, 0.6, -120);
      })
    );
    layers.push(
      layer(-120, 620, 0.14, 0.6, (g) => {
        grove(g, 392, 46, 4, 7, P.mid, mix(P.mid, '#000000', 0.2), mix(P.mid, '#a8c060', 0.25), -120);
        hazeOver(g, P.haze, -120, 620, 0.12, 0.3, -120);
      })
    );
    layers.push(
      layer(-120, 640, 0.32, 0.75, (g) => {
        const n = periodic(rng, 5, 3, 0.5);
        const fn = (x) => 404 - n(x / TW) * 6;
        ridge(g, fn, 640, P.near);
        for (let i = 0; i < 16; i++) {
          const x = rng() * TW;
          const w = 9 + rng() * 8;
          const lean = (rng() - 0.5) * 0.08;
          each(x, w * 6, (xx) => {
            const g2 = g.createLinearGradient(xx - w / 2, 0, xx + w / 2, 0);
            g2.addColorStop(0, mix(P.near, '#b8d080', 0.35));
            g2.addColorStop(0.4, mix(P.near, '#7aa048', 0.3));
            g2.addColorStop(1, mix(P.near, '#000000', 0.25));
            bambooCulm(g, xx, fn(xx) + 4, -120, w, g2, mix(P.near, '#000000', 0.35), lean, rng);
            for (let k = 0; k < 4; k++) {
              const y = -100 + rng() * 260;
              bambooLeaves(g, xx + lean * (fn(xx) - y), y, 24 + rng() * 10, mix(P.near, '#5a8a3a', 0.4), rng);
            }
          });
        }
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 6;
        const col = mix(P.near, '#000000', 0.3);
        ridge(g, fn, 660, col);
        g.fillStyle = col;
        for (let x = 0; x < TW; x += 30 + hash(x) * 40) {
          g.beginPath();
          g.moveTo(x - 4, fn(x) + 2);
          g.lineTo(x, fn(x) - 14 - hash(x * 3) * 12);
          g.lineTo(x + 4, fn(x) + 2);
          g.fill();
        }
      })
    );
    return {
      layers,
      rays: true,
      fogAfter: {
        0: { color: P.haze, y: 330, a: 0.5 },
        1: { color: P.haze, y: 360, a: 0.3 },
      },
    };
  },

  rainbow(P, rng) {
    const layers = [];
    const stripes = P.stripes;
    // fill a ridge, then lay sediment bands across it that follow the slope a little
    const banded = (g, fn, yBot, base, bands, warp, shadeK) => {
      ridge(g, fn, yBot, base);
      g.save();
      g.globalCompositeOperation = 'source-atop';
      const n = periodic(rng, 2, 2, 0.5);
      for (let k = 0; k < bands; k++) {
        const y0 = 300 + k * ((yBot - 300) / bands) * 0.6;
        g.fillStyle = mix(stripes[k % stripes.length], base, shadeK);
        g.beginPath();
        g.moveTo(0, y0);
        for (let x = 0; x <= TW; x += 8) g.lineTo(x, y0 + n(x / TW) * warp + Math.sin(x * 0.01 + k) * 3);
        for (let x = TW; x >= 0; x -= 8) g.lineTo(x, y0 + 7 + n(x / TW) * warp + Math.sin(x * 0.012 + k) * 3);
        g.closePath();
        g.fill();
      }
      // gullies cut down the slopes
      g.strokeStyle = alpha('#3a1a10', 0.18);
      g.lineWidth = 1.2;
      for (let x = 0; x < TW; x += 9) {
        if (hash(x * 3) < 0.5) continue;
        g.beginPath();
        g.moveTo(x, fn(x) + 2);
        g.lineTo(x + (hash(x) - 0.5) * 6, fn(x) + 16 + hash(x * 7) * 30);
        g.stroke();
      }
      g.restore();
    };
    layers.push(
      layer(200, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 350 - (0.4 + 0.6 * Math.abs(n(x / TW))) * 80;
        litColumns(g, fn, 600, { lit: mix(P.far, P.light, 0.3), dark: mix(P.far, '#5a3a4a', 0.3), sunLeft: true, contrast: 2.2, smooth: 10 });
        hazeOver(g, P.haze, 230, 600, 0.3, 0.6);
      })
    );
    layers.push(
      layer(240, 620, 0.12, 0.6, (g) => {
        const n = periodic(rng, 4, 3, 0.5);
        const fn = (x) => 386 - Math.pow(Math.abs(n(x / TW)), 0.8) * 70;
        banded(g, fn, 620, P.mid, 16, 14, 0.35);
        hazeOver(g, P.haze, 260, 620, 0.12, 0.3);
      })
    );
    layers.push(
      layer(260, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 5, 3, 0.55);
        const fn = (x) => 404 - Math.pow(Math.abs(n(x / TW)), 0.9) * 60;
        banded(g, fn, 640, P.near, 18, 10, 0.15);
        for (let i = 0; i < 10; i++) {
          const x = rng() * TW;
          each(x, 20, (xx) => {
            g.fillStyle = mix('#6a7a4a', P.near, 0.3);
            g.beginPath();
            g.arc(xx, fn(xx) + 2, 5 + rng() * 4, Math.PI, 0);
            g.fill();
          });
        }
      })
    );
    layers.push(
      layer(340, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 7;
        ridge(g, fn, 660, mix(P.ground.top, P.ground.body, 0.4));
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 5, 50, 180, false, 0.8), shimmer: true };
  },

  tulips(P, rng) {
    const layers = [];
    const H = 378;
    const bands = ['#e8303a', '#f2c030', '#f088b0', '#ffffff', '#e86a2a', '#8a3aa8'];
    layers.push(
      layer(250, 600, 0.04, 0.5, (g, dyn) => {
        g.fillStyle = mix(P.mid, P.haze, 0.45);
        g.fillRect(0, H - 4, TW, 600 - H);
        for (let x = 0; x < TW; x += 6) {
          if (hash(x) < 0.55) continue;
          tree(g, x, H, 10 + hash(x * 3) * 8, mix(P.far, P.mid, 0.3), rng);
        }
        for (let i = 0; i < 6; i++) {
          const x = rng() * TW;
          windmillBody(g, x, H, 0.5, mix(P.far, '#3a2a2a', 0.2), mix(P.far, '#2a1a1a', 0.3));
          dyn.push({ type: 'windmill', x, y: H - 25, r: 14, color: mix(P.far, '#3a2a2a', 0.3) });
        }
        hazeOver(g, P.haze, 300, 600, 0.3, 0.4, 250);
      })
    );
    layers.push(
      layer(360, 620, 0.12, 0.6, (g) => {
        // fields in stripes, narrowing toward the horizon, with a canal through them
        let y = H + 2;
        let k = 0;
        while (y < 620) {
          const h = 3 + (y - H) * 0.12;
          g.fillStyle = k % 2 ? mix(P.mid, '#5a7a3a', 0.4) : mix(bands[(k / 2) % bands.length | 0], P.haze, Math.max(0, 0.45 - (y - H) * 0.012));
          g.fillRect(0, y, TW, h);
          y += h;
          k++;
        }
        g.fillStyle = mix(P.water, P.haze, 0.25);
        g.fillRect(0, H + 8, TW, 3);
        hazeOver(g, P.haze, 360, 620, 0.1, 0.02, 360);
      })
    );
    layers.push(
      layer(200, 640, 0.3, 0.75, (g, dyn) => {
        // a windmill or two up close, beside the canal
        for (let i = 0; i < 2; i++) {
          const x = 300 + i * 1000 + rng() * 300;
          const base = 404;
          each(x, 60, (xx) => {
            mirrored(g, base + 2, 0.25, () => windmillBody(g, xx, base, 2.2, mix(P.near, '#4a3a30', 0.3), mix(P.near, '#2a1a14', 0.4)));
          });
          dyn.push({ type: 'windmill', x, y: base - 55, r: 58, color: mix(P.near, '#3a2a20', 0.4) });
        }
        g.fillStyle = mix(P.water, P.near, 0.2);
        g.fillRect(0, 406, TW, 6);
        for (let x = 0; x < TW; x += 3) {
          if (hash(x * 5) < 0.3) continue;
          g.fillStyle = mix(bands[Math.floor(hash(x * 7) * 5)], P.near, 0.25);
          g.fillRect(x, 400 + hash(x) * 4, 2.4, 2.6);
        }
      })
    );
    layers.push(
      layer(340, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 5;
        ridge(g, fn, 660, mix(P.near, '#000000', 0.2));
        for (let x = 0; x < TW; x += 4) {
          if (hash(x * 9) < 0.35) continue;
          const h = 8 + hash(x * 3) * 8;
          g.strokeStyle = mix('#4a7a30', P.near, 0.3);
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(x, fn(x) + 2);
          g.lineTo(x, fn(x) - h);
          g.stroke();
          g.fillStyle = mix(bands[Math.floor(hash(x) * 5)], P.near, 0.3);
          g.beginPath();
          g.ellipse(x, fn(x) - h - 2, 2, 3, 0, 0, TAU);
          g.fill();
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 7, 50, 210, false, 0.9), birds: true };
  },

  glacier(P, rng) {
    const layers = [];
    const W = 388;
    layers.push(
      layer(120, 390, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.55);
        const fn = (x) => 360 - (0.3 + 0.7 * Math.abs(n(x / TW))) * 180;
        litColumns(g, fn, W, { lit: mix(P.far, '#f0c0c8', 0.35), dark: mix(P.far, '#2a2a5a', 0.3), sunLeft: true, contrast: 2.4, smooth: 6, snowLine: 280, snowLit: '#f8dce0', snowDark: '#8a94c8' });
        hazeOver(g, P.haze, 200, 390, 0.12, 0.3, 120);
      })
    );
    layers.push(
      layer(220, 400, 0.12, 0.6, (g) => {
        // the face of the glacier: a long blue-white wall, split by crevasses
        const n = periodic(rng, 5, 3, 0.6);
        const fn = (x) => 330 + n(x / TW) * 14;
        ridge(g, fn, W + 1, vgrad(g, 300, W, [
          [0, '#f4f8ff'],
          [0.5, '#a8cce8'],
          [1, '#5a8ab8'],
        ]));
        g.save();
        g.globalCompositeOperation = 'source-atop';
        g.strokeStyle = alpha('#2a5a8a', 0.4);
        g.lineWidth = 1.4;
        for (let x = 0; x < TW; x += 6) {
          if (hash(x * 3) < 0.55) continue;
          g.beginPath();
          g.moveTo(x, fn(x) + 2);
          g.lineTo(x + (hash(x) - 0.5) * 6, W);
          g.stroke();
        }
        g.fillStyle = alpha('#ffffff', 0.35);
        for (let x = 0; x < TW; x += 14) g.fillRect(x, fn(x), 6 + hash(x) * 6, 3);
        g.restore();
        for (let i = 0; i < 20; i++) {
          const x = rng() * TW;
          const w = 8 + rng() * 26;
          mirrored(g, W + 2, 0.3, () => {
            g.fillStyle = mix('#e8f0ff', P.mid, 0.2);
            g.beginPath();
            g.moveTo(x - w, W + 2);
            g.lineTo(x - w * 0.6, W - 3 - w * 0.15);
            g.lineTo(x + w * 0.5, W - 2 - w * 0.12);
            g.lineTo(x + w, W + 2);
            g.fill();
          });
        }
      })
    );
    layers.push(
      layer(250, 430, 0.3, 0.75, (g) => {
        for (let i = 0; i < 4; i++) {
          const x = rng() * TW;
          const w = 50 + rng() * 60;
          const h = 30 + rng() * 40;
          each(x, w, (xx) =>
            mirrored(g, 404, 0.3, () => {
              g.fillStyle = vgrad(g, 404 - h, 404, [
                [0, '#ffffff'],
                [1, '#8ab8e0'],
              ]);
              g.beginPath();
              g.moveTo(xx - w, 404);
              g.lineTo(xx - w * 0.7, 404 - h * 0.7);
              g.lineTo(xx - w * 0.2, 404 - h);
              g.lineTo(xx + w * 0.4, 404 - h * 0.8);
              g.lineTo(xx + w, 404);
              g.fill();
              g.fillStyle = alpha('#3a6aa8', 0.35);
              g.beginPath();
              g.moveTo(xx + w * 0.1, 404 - h * 0.9);
              g.lineTo(xx + w * 0.4, 404 - h * 0.8);
              g.lineTo(xx + w, 404);
              g.lineTo(xx + w * 0.2, 404);
              g.fill();
            })
          );
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 40, 200, true, 0.8), sea: { y: W }, birds: true };
  },

  home(P, rng) {
    const layers = [];
    const W = 390;
    layers.push(
      layer(240, 392, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => W - 4 - (0.3 + 0.7 * Math.abs(n(x / TW))) * 70;
        ridge(g, fn, W + 1, P.far);
        for (let x = 0; x < TW; x += 5) pine(g, x, fn(x) + 4, 8 + hash(x) * 8, P.far, rng, null);
        hazeOver(g, P.haze, 260, 392, 0.3, 0.45, 240);
      })
    );
    layers.push(
      layer(260, 420, 0.12, 0.6, (g, dyn) => {
        // the far shore of the lake: pines, a jetty, a light in a window
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => W + 1 - Math.abs(n(x / TW)) * 16;
        mirrored(g, W + 1, 0.35, () => {
          ridge(g, fn, W + 1.5, P.mid);
          const r = mulberry32(55);
          for (let x = 0; x < TW; x += 7) pine(g, x, fn(x) + 2, 16 + r() * 22, P.mid, r, null);
        });
        const jx = rng() * TW;
        g.fillStyle = mix('#5a4030', P.mid, 0.4);
        g.fillRect(jx, W, 70, 2.4);
        for (let k = 0; k < 6; k++) g.fillRect(jx + k * 14, W, 1.6, 6);
        for (let i = 0; i < 3; i++) {
          const x = rng() * TW;
          dyn.push({ type: 'blink', x, y: fn(x) - 6, color: '#ffcb78', period: 20, phase: 0.01 });
        }
        hazeOver(g, P.haze, 300, 420, 0.1, 0.12, 260);
      })
    );
    layers.push(
      layer(180, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.5);
        const fn = (x) => 404 - n(x / TW) * 6;
        ridge(g, fn, 640, P.near);
        const col = mix(P.near, '#000000', 0.05);
        for (let x = rng() * 200; x < TW; x += 160 + rng() * 220) {
          each(x, 80, (xx) => tree(g, xx, fn(xx) + 3, 100 + rng() * 60, col, rng, { c: mix(col, '#c8805a', 0.25), dir: 1 }));
        }
        // the old tree with a rope swing
        const sx = rng() * TW;
        each(sx, 120, (xx) => {
          tree(g, xx, fn(xx) + 3, 170, col, rng, null);
          g.strokeStyle = mix('#c8b090', P.near, 0.4);
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(xx + 30, fn(xx) - 100);
          g.lineTo(xx + 32, fn(xx) - 26);
          g.moveTo(xx + 50, fn(xx) - 104);
          g.lineTo(xx + 50, fn(xx) - 26);
          g.stroke();
          g.fillStyle = mix('#8a6a44', P.near, 0.4);
          g.fillRect(xx + 28, fn(xx) - 27, 26, 3);
        });
        hazeOver(g, P.haze, 300, 640, 0.04, 0.12);
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 7;
        const col = mix(P.near, '#000000', 0.25);
        ridge(g, fn, 660, col);
        g.strokeStyle = col;
        g.lineWidth = 1.2;
        g.beginPath();
        for (let x = 0; x < TW; x += 3) {
          const h = 8 + hash(x * 5) * 20;
          g.moveTo(x, fn(x) + 2);
          g.quadraticCurveTo(x + 2, fn(x) - h * 0.6, x + (hash(x) - 0.5) * 8, fn(x) - h);
        }
        g.stroke();
        const cols = ['#f2d27a', '#e8a0a0', '#f4f0e6', '#c8a8e0'];
        for (let x = 0; x < TW; x += 6) {
          if (hash(x * 7) < 0.6) continue;
          g.fillStyle = mix(cols[Math.floor(hash(x) * 4)], col, 0.4);
          g.beginPath();
          g.arc(x, fn(x) - 6 - hash(x * 3) * 10, 1.8, 0, TAU);
          g.fill();
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 40, 210, true, 0.8), sea: { y: W } };
  },
};
