// Chapter 4 backgrounds: a salt flat that mirrors the sky, a palm beach, a mangrove lagoon,
// sea caves lit by glow-worms, a village on stilts, and a beach at night under a lighthouse.
// Painted with the same tools as backgrounds.js.

import { TW, periodic, layer, each, vgrad, ridge, litColumns, hazeOver, cloudLayer } from './backgrounds.js';
import { blobCanopy } from './backgrounds-world.js';
import { hash, mulberry32 } from './rng.js';
import { mix, alpha, TAU } from './util.js';

// ---------------------------------------------------------------- silhouettes

/** Draw fn's shapes, then their reflection in a still surface at y = water. */
function mirrored(g, water, a, fn) {
  fn();
  g.save();
  g.globalAlpha = a;
  g.translate(0, water * 2);
  g.scale(1, -1);
  fn();
  g.restore();
}

function coconutPalm(g, x, base, h, col, rng, lean = 1) {
  const bend = lean * h * (0.25 + rng() * 0.2);
  const tx = x + bend;
  const ty = base - h;
  g.strokeStyle = col;
  g.lineCap = 'round';
  g.lineWidth = Math.max(2, h * 0.05);
  g.beginPath();
  g.moveTo(x, base);
  g.quadraticCurveTo(x + bend * 0.1, base - h * 0.55, tx, ty);
  g.stroke();
  g.lineWidth = Math.max(1, h * 0.03);
  g.fillStyle = col;
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i / 8 - 0.5) * 3.6 + (rng() - 0.5) * 0.2;
    const len = h * (0.34 + rng() * 0.12);
    const ex = tx + Math.cos(a) * len;
    const ey = ty + Math.sin(a) * len * 0.45 + len * 0.42;
    const mx = tx + Math.cos(a) * len * 0.5;
    const my = ty + Math.sin(a) * len * 0.5 - h * 0.04;
    g.beginPath();
    g.moveTo(tx, ty);
    g.quadraticCurveTo(mx, my, ex, ey);
    g.stroke();
    // leaflets hang off each frond
    for (let k = 1; k < 6; k++) {
      const u = k / 6;
      const px = (1 - u) * (1 - u) * tx + 2 * u * (1 - u) * mx + u * u * ex;
      const py = (1 - u) * (1 - u) * ty + 2 * u * (1 - u) * my + u * u * ey;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + Math.cos(a) * 2, py + h * 0.06 * (1 - u * 0.5));
      g.stroke();
    }
  }
  g.beginPath();
  g.arc(tx, ty + 2, h * 0.035, 0, TAU);
  g.fill();
}

function mangrove(g, x, water, h, col, rng) {
  g.strokeStyle = col;
  g.lineCap = 'round';
  const top = water - h * 0.45;
  // prop roots arching down into the water
  g.lineWidth = Math.max(1, h * 0.025);
  for (let k = 0; k < 7; k++) {
    const d = (k / 6 - 0.5) * h * 0.7;
    g.beginPath();
    g.moveTo(x + d * 0.2, top);
    g.quadraticCurveTo(x + d * 0.6, top + h * 0.05, x + d, water + 2);
    g.stroke();
  }
  g.lineWidth = Math.max(1.4, h * 0.04);
  g.beginPath();
  g.moveTo(x, top);
  g.lineTo(x + (rng() - 0.5) * 4, top - h * 0.2);
  g.stroke();
  blobCanopy(g, x, top - h * 0.32, h * 0.3, col, rng, 9);
}

function stiltHouse(g, x, water, w, h, wall, roof, rng, lit) {
  const floor = water - 18 - rng() * 10;
  g.fillStyle = mix(wall, '#000000', 0.45);
  for (let px = x + 3; px < x + w; px += 12) g.fillRect(px, floor, 2.4, water - floor + 3);
  g.fillStyle = wall;
  g.fillRect(x, floor - h, w, h);
  g.fillStyle = alpha('#000000', 0.18);
  for (let yy = floor - h + 4; yy < floor; yy += 5) g.fillRect(x, yy, w, 1);
  g.fillStyle = roof;
  g.beginPath();
  g.moveTo(x - 4, floor - h + 1);
  g.lineTo(x + w * 0.5, floor - h - w * 0.28);
  g.lineTo(x + w + 4, floor - h + 1);
  g.fill();
  const n = Math.max(1, Math.floor(w / 14));
  for (let i = 0; i < n; i++) {
    g.fillStyle = rng() < 0.55 ? lit : alpha('#000000', 0.4);
    g.fillRect(x + 4 + i * ((w - 8) / n) + 1, floor - h * 0.7, 5, 6);
  }
  g.fillStyle = mix(wall, '#000000', 0.35);
  g.fillRect(x - 6, floor, w + 12, 3);
}

function sailboat(g, x, water, s, sail, hull) {
  g.fillStyle = hull;
  g.beginPath();
  g.moveTo(x - 12 * s, water - 3 * s);
  g.lineTo(x + 12 * s, water - 3 * s);
  g.lineTo(x + 8 * s, water);
  g.lineTo(x - 9 * s, water);
  g.fill();
  g.fillStyle = sail;
  g.beginPath();
  g.moveTo(x, water - 4 * s);
  g.lineTo(x, water - 26 * s);
  g.lineTo(x + 10 * s, water - 5 * s);
  g.fill();
}

function flamingo(g, x, base, s, col, leg) {
  g.strokeStyle = leg;
  g.lineWidth = 0.8 * s;
  g.beginPath();
  g.moveTo(x, base);
  g.lineTo(x, base - 11 * s);
  g.moveTo(x + 1 * s, base - 6 * s);
  g.lineTo(x + 4 * s, base - 9 * s);
  g.lineTo(x + 1 * s, base - 11 * s);
  g.stroke();
  g.fillStyle = col;
  g.beginPath();
  g.ellipse(x + 1 * s, base - 13 * s, 4 * s, 2.4 * s, -0.1, 0, TAU);
  g.fill();
  g.strokeStyle = col;
  g.lineWidth = 1.2 * s;
  g.beginPath();
  g.moveTo(x + 4 * s, base - 14 * s);
  g.quadraticCurveTo(x + 7 * s, base - 18 * s, x + 4 * s, base - 21 * s);
  g.stroke();
  g.fillStyle = leg;
  g.fillRect(x + 4 * s, base - 22 * s, 2 * s, 1.2 * s);
}

function lighthouse(g, x, base, s, body, stripe) {
  g.fillStyle = body;
  g.beginPath();
  g.moveTo(x - 7 * s, base);
  g.lineTo(x - 4.5 * s, base - 50 * s);
  g.lineTo(x + 4.5 * s, base - 50 * s);
  g.lineTo(x + 7 * s, base);
  g.fill();
  g.fillStyle = stripe;
  for (const k of [0.25, 0.6]) g.fillRect(x - 6.2 * s + k * 1.2 * s, base - 50 * s * k - 6 * s, (12.4 - k * 2.4) * s, 6 * s);
  g.fillStyle = body;
  g.fillRect(x - 6 * s, base - 54 * s, 12 * s, 4 * s);
  g.fillRect(x - 3.5 * s, base - 62 * s, 7 * s, 8 * s);
  g.beginPath();
  g.moveTo(x - 5 * s, base - 62 * s);
  g.lineTo(x, base - 68 * s);
  g.lineTo(x + 5 * s, base - 62 * s);
  g.fill();
}

// ---------------------------------------------------------------- themes

export const SEA_THEMES = {
  saltflat(P, rng) {
    const layers = [];
    const H = 362; // the horizon, where the salt meets the sky's reflection
    layers.push(
      layer(160, 600, 0.04, 0.5, (g) => {
        // the mirror: the sky, upside down, a little paler
        g.fillStyle = vgrad(g, H, 600, [
          [0, mix(P.sky[2], '#ffffff', 0.25)],
          [0.35, mix(P.sky[1], '#ffffff', 0.15)],
          [1, mix(P.sky[0], P.sky[1], 0.6)],
        ]);
        g.fillRect(0, H, TW, 600 - H);
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => H - (0.4 + 0.6 * Math.abs(n(x / TW))) * 70;
        mirrored(g, H, 0.42, () => {
          ridge(g, fn, H + 0.5, mix(P.far, P.haze, 0.2));
        });
        hazeOver(g, P.haze, 260, 600, 0.2, 0.35, 160);
      })
    );
    layers.push(
      layer(300, 600, 0.12, 0.6, (g) => {
        // brine pools, salt cones from the harvest, a flock of flamingos, all doubled
        const base = 376;
        g.fillStyle = alpha(mix(P.sky[1], '#ffffff', 0.4), 0.6);
        for (let i = 0; i < 14; i++) {
          const x = rng() * TW;
          const w = 50 + rng() * 120;
          each(x, w, (xx) => {
            g.beginPath();
            g.ellipse(xx, base + 2 + rng() * 10, w, 3 + rng() * 2, 0, 0, TAU);
            g.fill();
          });
        }
        const cone = mix('#ffffff', P.mid, 0.25);
        for (let i = 0; i < 8; i++) {
          const x0 = rng() * TW;
          const n = 4 + Math.floor(rng() * 6);
          for (let k = 0; k < n; k++) {
            const x = x0 + k * 22;
            each(x, 12, (xx) =>
              mirrored(g, base, 0.35, () => {
                g.fillStyle = cone;
                g.beginPath();
                g.moveTo(xx - 8, base);
                g.lineTo(xx, base - 10);
                g.lineTo(xx + 8, base);
                g.fill();
              })
            );
          }
        }
        const fx = 500 + rng() * 900;
        for (let i = 0; i < 16; i++) {
          const x = fx + (rng() - 0.5) * 260;
          const y = base + 4 + rng() * 8;
          const s = 0.9 + rng() * 0.2;
          each(x, 10, (xx) => mirrored(g, y, 0.3, () => flamingo(g, xx, y, s, P.flamingo, mix(P.flamingo, '#5a2a30', 0.4))));
        }
        hazeOver(g, P.haze, 300, 600, 0.18, 0.12);
      })
    );
    layers.push(
      layer(330, 640, 0.3, 0.75, (g) => {
        const base = 398;
        const cone = mix('#ffffff', P.near, 0.12);
        for (let i = 0; i < 5; i++) {
          const x0 = rng() * TW;
          const n = 3 + Math.floor(rng() * 4);
          for (let k = 0; k < n; k++) {
            const x = x0 + k * 40;
            each(x, 24, (xx) =>
              mirrored(g, base, 0.3, () => {
                g.fillStyle = vgrad(g, base - 22, base, [
                  [0, '#ffffff'],
                  [1, cone],
                ]);
                g.beginPath();
                g.moveTo(xx - 16, base);
                g.quadraticCurveTo(xx - 4, base - 22, xx, base - 22);
                g.quadraticCurveTo(xx + 4, base - 22, xx + 16, base);
                g.fill();
              })
            );
          }
        }
        for (let i = 0; i < 6; i++) {
          const x = rng() * TW;
          each(x, 6, (xx) =>
            mirrored(g, base, 0.35, () => {
              g.fillStyle = mix('#4a3a3a', P.near, 0.3);
              g.fillRect(xx, base - 40, 2.4, 40);
              g.fillStyle = '#d8584a';
              g.fillRect(xx + 2.4, base - 40, 8, 5);
            })
          );
        }
      })
    );
    layers.push(
      layer(400, 660, 0.56, 0.9, (g) => {
        // the crust breaks into hexagons as it dries
        g.strokeStyle = alpha('#a89ca0', 0.35);
        g.lineWidth = 1;
        for (let row = 0; row < 6; row++) {
          const y = 414 + row * 7 + row * row * 1.5;
          const step = 26 + row * 10;
          g.beginPath();
          for (let x = (row % 2) * step * 0.5; x < TW + step; x += step) {
            g.moveTo(x, y);
            g.lineTo(x + step * 0.3, y - 2 - row * 0.5);
            g.lineTo(x + step * 0.7, y - 2 - row * 0.5);
            g.lineTo(x + step, y);
          }
          g.stroke();
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 70, 230, true, 0.8), birds: true };
  },

  beach(P, rng) {
    const layers = [];
    layers.push(
      layer(300, 382, 0.04, 0.5, (g) => {
        for (let i = 0; i < 5; i++) {
          const x = rng() * TW;
          const w = 60 + rng() * 140;
          const h = 10 + rng() * 26;
          each(x, w, (xx) => {
            g.fillStyle = mix(P.far, P.haze, 0.3);
            g.beginPath();
            g.ellipse(xx, 381, w, h, 0, Math.PI, 0);
            g.fill();
            if (rng() < 0.7) {
              for (let k = 0; k < 4; k++) coconutPalm(g, xx + (k - 1.5) * w * 0.3, 381 - h * 0.7, 10 + rng() * 6, mix(P.far, '#1a3a30', 0.2), rng);
            }
          });
        }
        hazeOver(g, P.haze, 300, 382, 0.2, 0.3, 300);
      })
    );
    layers.push(
      layer(200, 400, 0.12, 0.6, (g) => {
        // a green headland with a jetty of huts, and boats out on the water
        const hx = 600 + rng() * 700;
        const n = periodic(rng, 3, 3, 0.5);
        each(hx, 340, (xx) => {
          g.fillStyle = P.mid;
          g.beginPath();
          g.moveTo(xx - 340, 392);
          for (let k = 0; k <= 34; k++) {
            const u = k / 34;
            g.lineTo(xx - 340 + u * 680, 392 - Math.sin(u * Math.PI) * (90 + n(u) * 20));
          }
          g.closePath();
          g.fill();
          blobCanopy(g, xx, 320, 60, mix(P.mid, '#1a4a3a', 0.2), rng, 12);
          for (let k = 0; k < 8; k++) coconutPalm(g, xx - 260 + k * 70 + rng() * 20, 392 - Math.sin(((k * 70 + 80) / 680) * Math.PI) * 70, 34 + rng() * 14, mix(P.mid, '#0a2a20', 0.35), rng);
        });
        const jx = hx + 360;
        each(jx, 220, (xx) => {
          g.fillStyle = mix('#6a5040', P.mid, 0.3);
          g.fillRect(xx, 386, 200, 3);
          for (let k = 0; k < 10; k++) g.fillRect(xx + k * 20, 386, 2, 8);
          for (let k = 0; k < 3; k++) {
            const bx = xx + 30 + k * 60;
            g.fillStyle = mix('#e8dcc0', P.mid, 0.25);
            g.fillRect(bx, 370, 22, 16);
            g.fillStyle = mix('#8a5a3a', P.mid, 0.3);
            g.beginPath();
            g.moveTo(bx - 4, 371);
            g.lineTo(bx + 11, 360);
            g.lineTo(bx + 26, 371);
            g.fill();
          }
        });
        for (let i = 0; i < 5; i++) {
          const x = rng() * TW;
          sailboat(g, x, 384 + rng() * 6, 0.8 + rng() * 0.5, mix('#ffffff', P.haze, 0.1), mix('#c84a3a', P.haze, 0.3));
        }
        hazeOver(g, P.haze, 250, 400, 0.12, 0.2, 200);
      })
    );
    layers.push(
      layer(160, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.4);
        const fn = (x) => 404 - n(x / TW) * 4;
        // surf breaking on the sand
        g.fillStyle = alpha('#ffffff', 0.8);
        g.beginPath();
        g.moveTo(0, 398);
        for (let x = 0; x <= TW; x += 8) g.lineTo(x, 398 + Math.sin(x * 0.04) * 1.5 + hash(x) * 1.5);
        g.lineTo(TW, 404);
        g.lineTo(0, 404);
        g.fill();
        ridge(g, fn, 640, mix(P.ground.top, P.haze, 0.25));
        for (let x = rng() * 200; x < TW; x += 140 + rng() * 200) {
          const h = 90 + rng() * 70;
          each(x, 80, (xx) => coconutPalm(g, xx, fn(xx) + 3, h, mix(P.near, '#000000', 0.1), rng, rng() < 0.5 ? -1 : 1));
        }
        const cols = ['#e8584a', '#f2c040', '#3a9ad0', '#f4f0e6', '#4ab07a'];
        for (let i = 0; i < 9; i++) {
          const x = rng() * TW;
          each(x, 20, (xx) => {
            const y = fn(xx) + 2;
            g.strokeStyle = mix('#5a4a3a', P.haze, 0.2);
            g.lineWidth = 1.4;
            g.beginPath();
            g.moveTo(xx, y);
            g.lineTo(xx + 2, y - 26);
            g.stroke();
            g.fillStyle = mix(cols[i % cols.length], P.haze, 0.15);
            g.beginPath();
            g.moveTo(xx - 14, y - 22);
            g.quadraticCurveTo(xx + 2, y - 34, xx + 18, y - 22);
            g.fill();
          });
        }
      })
    );
    layers.push(
      layer(340, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.4);
        const fn = (x) => 414 - n(x / TW) * 6;
        ridge(g, fn, 660, mix(P.ground.top, P.ground.body, 0.3));
        g.strokeStyle = mix('#7a8a4a', P.ground.top, 0.2);
        g.lineWidth = 1.2;
        g.beginPath();
        for (let x = 0; x < TW; x += 5) {
          if (hash(x * 3) < 0.6) continue;
          for (let k = 0; k < 4; k++) {
            g.moveTo(x, fn(x) + 2);
            g.quadraticCurveTo(x + (k - 1.5) * 2, fn(x) - 8, x + (k - 1.5) * 5, fn(x) - 12 - hash(x + k) * 6);
          }
        }
        g.stroke();
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 40, 220, false, 0.9), sea: { y: 380 }, birds: true };
  },

  lagoon(P, rng) {
    const layers = [];
    const W = 388;
    layers.push(
      layer(240, 390, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => W - 2 - (0.4 + 0.6 * Math.abs(n(x / TW))) * 40;
        ridge(g, fn, W + 1, P.far);
        for (let x = 0; x < TW; x += 12) blobCanopy(g, x, fn(x) + 4, 8 + hash(x) * 8, P.far, rng, 2);
        hazeOver(g, P.haze, 260, 390, 0.3, 0.45, 240);
      })
    );
    layers.push(
      layer(220, 420, 0.12, 0.6, (g) => {
        const col = P.mid;
        for (let x = rng() * 60; x < TW; x += 40 + rng() * 60) {
          const h = 60 + rng() * 40;
          const sd = (rng() * 1e9) | 0;
          each(x, 50, (xx) => mirrored(g, W + 2, 0.25, () => mangrove(g, xx, W + 2, h, col, mulberry32(sd))));
        }
        // a heron, very still
        const hx = rng() * TW;
        g.strokeStyle = mix(col, '#000000', 0.2);
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(hx, W + 2);
        g.lineTo(hx, W - 14);
        g.stroke();
        g.fillStyle = mix('#e8e8e0', P.haze, 0.3);
        g.beginPath();
        g.ellipse(hx + 2, W - 17, 6, 3, -0.3, 0, TAU);
        g.fill();
        g.strokeStyle = mix('#e8e8e0', P.haze, 0.3);
        g.lineWidth = 1.6;
        g.beginPath();
        g.moveTo(hx + 6, W - 19);
        g.quadraticCurveTo(hx + 9, W - 26, hx + 6, W - 30);
        g.stroke();
        hazeOver(g, P.haze, 260, 420, 0.14, 0.2, 220);
      })
    );
    layers.push(
      layer(150, 430, 0.3, 0.75, (g) => {
        const col = P.near;
        for (let x = rng() * 100; x < TW; x += 150 + rng() * 160) {
          const h = 130 + rng() * 60;
          const sd = (rng() * 1e9) | 0;
          each(x, 110, (xx) => mirrored(g, 404, 0.22, () => mangrove(g, xx, 404, h, col, mulberry32(sd))));
        }
        const cx = rng() * TW;
        each(cx, 40, (xx) => {
          g.fillStyle = mix('#8a4a2a', P.near, 0.3);
          g.beginPath();
          g.moveTo(xx - 30, 401);
          g.quadraticCurveTo(xx, 410, xx + 30, 401);
          g.lineTo(xx + 26, 404);
          g.quadraticCurveTo(xx, 412, xx - 26, 404);
          g.fill();
        });
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const col = mix(P.near, '#000000', 0.25);
        g.strokeStyle = col;
        g.lineWidth = 2;
        g.beginPath();
        for (let x = 0; x < TW; x += 6) {
          if (hash(x * 7) < 0.4) continue;
          const h = 24 + hash(x) * 30;
          g.moveTo(x, 430);
          g.quadraticCurveTo(x + 2, 430 - h * 0.6, x + (hash(x * 3) - 0.5) * 8, 430 - h);
        }
        g.stroke();
        g.fillStyle = mix('#6a4a2a', col, 0.4);
        for (let x = 0; x < TW; x += 60) if (hash(x) > 0.6) g.fillRect(x, 430 - 34 - hash(x * 5) * 10, 3, 10);
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 7, 40, 220, false, 0.9), sea: { y: W }, birds: true };
  },

  cave(P, rng) {
    const layers = [];
    const ceiling = (g, fn, col, top) => {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(0, top);
      for (let x = 0; x <= TW; x += 4) g.lineTo(x, fn(x));
      g.lineTo(TW, top);
      g.closePath();
      g.fill();
    };
    const teeth = (g, fn, col, n, len) => {
      g.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const x = rng() * TW;
        const l = len * (0.4 + rng());
        const w = 4 + rng() * l * 0.18;
        each(x, w, (xx) => {
          const y = fn(xx) - 2;
          g.beginPath();
          g.moveTo(xx - w, y);
          g.quadraticCurveTo(xx - w * 0.2, y + l * 0.5, xx, y + l);
          g.quadraticCurveTo(xx + w * 0.2, y + l * 0.5, xx + w, y);
          g.fill();
        });
      }
    };
    layers.push(
      layer(-200, 600, 0.04, 0.5, (g, dyn) => {
        // far back, an opening onto the sea and daylight
        g.fillStyle = P.far;
        g.fillRect(0, -200, TW, 800);
        const ox = 700 + rng() * 600;
        each(ox, 220, (xx) => {
          const gr = g.createLinearGradient(0, 160, 0, 380);
          gr.addColorStop(0, '#9ad8e8');
          gr.addColorStop(0.7, '#d8f0f0');
          gr.addColorStop(1, '#4aa8b8');
          g.fillStyle = gr;
          g.beginPath();
          g.moveTo(xx - 150, 390);
          g.quadraticCurveTo(xx - 140, 190, xx - 20, 170);
          g.quadraticCurveTo(xx + 120, 160, xx + 160, 390);
          g.closePath();
          g.fill();
          g.fillStyle = '#2a7a90';
          g.fillRect(xx - 150, 350, 310, 40);
          g.fillStyle = alpha('#ffffff', 0.5);
          for (let k = 0; k < 8; k++) g.fillRect(xx - 120 + rng() * 240, 352 + rng() * 30, 14 + rng() * 20, 1.2);
          dyn.push({ type: 'glow', x: xx, y: 300, r: 220, color: '#9ad8e8', period: 9 });
        });
        for (let i = 0; i < 260; i++) {
          g.fillStyle = alpha(i % 4 ? P.lamp : '#c8fff8', 0.25 + rng() * 0.6);
          g.fillRect(rng() * TW, -180 + rng() * 300, 1.4, 1.4);
        }
        hazeOver(g, P.haze, 100, 600, 0.12, 0.3, -200);
      })
    );
    layers.push(
      layer(-200, 620, 0.14, 0.6, (g, dyn) => {
        const top = periodic(rng, 3, 3, 0.55);
        const fnTop = (x) => 40 + top(x / TW) * 40;
        ceiling(g, fnTop, P.mid, -200);
        teeth(g, fnTop, P.mid, 40, 40);
        const n = periodic(rng, 4, 3, 0.5);
        const fn = (x) => 396 - Math.abs(n(x / TW)) * 40;
        ridge(g, fn, 620, P.mid);
        // pillars where roof and floor have met
        for (let i = 0; i < 4; i++) {
          const x = rng() * TW;
          const w = 26 + rng() * 30;
          each(x, w, (xx) => {
            g.fillStyle = P.mid;
            g.beginPath();
            g.moveTo(xx - w, fn(xx) + 4);
            g.quadraticCurveTo(xx - w * 0.3, 260, xx - w * 0.6, fnTop(xx) - 4);
            g.lineTo(xx + w * 0.6, fnTop(xx) - 4);
            g.quadraticCurveTo(xx + w * 0.3, 260, xx + w, fn(xx) + 4);
            g.fill();
          });
        }
        for (let i = 0; i < 5; i++) {
          const x = rng() * TW;
          dyn.push({ type: 'glow', x, y: fn(x) + 4, r: 50 + rng() * 30, color: P.lamp, period: 4 + rng() * 3 });
        }
        for (let i = 0; i < 160; i++) {
          const x = rng() * TW;
          g.fillStyle = alpha(P.lamp, 0.3 + rng() * 0.6);
          g.fillRect(x, fnTop(x) + 4 + rng() * 30, 1.2, 1.2);
        }
        hazeOver(g, P.haze, 0, 620, 0.08, 0.2, -200);
      })
    );
    layers.push(
      layer(-200, 640, 0.3, 0.75, (g) => {
        const top = periodic(rng, 4, 3, 0.6);
        const fnTop = (x) => -10 + top(x / TW) * 50;
        ceiling(g, fnTop, P.near, -200);
        teeth(g, fnTop, P.near, 26, 70);
        const n = periodic(rng, 5, 3, 0.55);
        const fn = (x) => 404 - Math.abs(n(x / TW)) * 22;
        ridge(g, fn, 640, P.near);
        // stalagmites, with a crystal or two catching the glow
        for (let i = 0; i < 14; i++) {
          const x = rng() * TW;
          const h = 30 + rng() * 60;
          const w = 8 + rng() * 10;
          each(x, w, (xx) => {
            g.fillStyle = P.near;
            g.beginPath();
            g.moveTo(xx - w, fn(xx) + 4);
            g.quadraticCurveTo(xx - w * 0.2, fn(xx) - h * 0.5, xx, fn(xx) - h);
            g.quadraticCurveTo(xx + w * 0.2, fn(xx) - h * 0.5, xx + w, fn(xx) + 4);
            g.fill();
          });
        }
        for (let i = 0; i < 10; i++) {
          const x = rng() * TW;
          const y = fn(x) + 2;
          g.fillStyle = alpha(P.lamp, 0.55);
          for (let k = 0; k < 3; k++) {
            g.beginPath();
            g.moveTo(x + k * 5 - 2, y);
            g.lineTo(x + k * 5 + (k - 1) * 2, y - 10 - k * 3);
            g.lineTo(x + k * 5 + 2, y);
            g.fill();
          }
        }
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.55);
        const fn = (x) => 414 - Math.abs(n(x / TW)) * 12;
        ridge(g, fn, 660, mix(P.near, '#000000', 0.4));
      })
    );
    return { layers, sea: { y: 404 } };
  },

  village(P, rng) {
    const layers = [];
    const W = 388;
    const walls = ['#c8584a', '#e8b860', '#5a8ab0', '#e8e0d0', '#6aa080', '#d8885a', '#a86a8a'];
    layers.push(
      layer(220, 390, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => W - 2 - (0.3 + 0.7 * Math.abs(n(x / TW))) * 80;
        litColumns(g, fn, W + 1, { lit: mix(P.far, P.light, 0.3), dark: mix(P.far, '#2a1a2a', 0.25), sunLeft: false, contrast: 2.2, smooth: 10 });
        for (let i = 0; i < 40; i++) {
          const x = rng() * TW;
          g.fillStyle = mix(walls[i % walls.length], P.far, 0.6);
          g.fillRect(x, fn(x) + 6 + rng() * 20, 5, 4);
        }
        hazeOver(g, P.haze, 260, 390, 0.25, 0.4, 220);
      })
    );
    layers.push(
      layer(240, 420, 0.12, 0.6, (g) => {
        let x = 0;
        while (x < TW) {
          const w = 30 + rng() * 26;
          const h = 20 + rng() * 14;
          const wall = mix(walls[Math.floor(rng() * walls.length)], P.mid, 0.45);
          const sd = (rng() * 1e9) | 0;
          mirrored(g, W + 2, 0.25, () => stiltHouse(g, x, W + 2, Math.min(w, TW - x), h, wall, mix('#5a5a62', P.mid, 0.4), mulberry32(sd), alpha(P.window, 0.85)));
          x += w + 6 + rng() * 30;
        }
        for (let i = 0; i < 5; i++) {
          const bx = rng() * TW;
          sailboat(g, bx, W + 4, 0.7, mix('#f4ead8', P.mid, 0.35), mix('#3a4a6a', P.mid, 0.4));
        }
        hazeOver(g, P.haze, 260, 420, 0.1, 0.12, 240);
      })
    );
    layers.push(
      layer(180, 440, 0.3, 0.75, (g, dyn) => {
        let x = rng() * 80;
        while (x < TW - 60) {
          const w = 60 + rng() * 40;
          const h = 34 + rng() * 20;
          const wall = mix(walls[Math.floor(rng() * walls.length)], P.near, 0.3);
          const sd = (rng() * 1e9) | 0;
          mirrored(g, 404, 0.22, () => stiltHouse(g, x, 404, w, h, wall, mix('#4a4a52', P.near, 0.3), mulberry32(sd), P.window));
          if (rng() < 0.5) dyn.push({ type: 'lamp', x: x + w + 8, y: 404 - 60 });
          x += w + 60 + rng() * 120;
        }
        // poles hung with nets, and a boat pulled up on a slip
        for (let px = rng() * 200; px < TW; px += 260 + rng() * 200) {
          g.fillStyle = mix('#4a3428', P.near, 0.3);
          g.fillRect(px, 340, 3, 66);
          g.fillRect(px + 60, 344, 3, 62);
          g.strokeStyle = alpha(mix('#c8b890', P.near, 0.3), 0.7);
          g.lineWidth = 0.8;
          for (let k = 0; k < 7; k++) {
            g.beginPath();
            g.moveTo(px + 3, 344 + k * 3);
            g.quadraticCurveTo(px + 30, 360 + k * 4, px + 60, 348 + k * 3);
            g.stroke();
          }
        }
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const col = mix(P.near, '#000000', 0.3);
        g.fillStyle = col;
        for (let x = 0; x < TW; x += 90 + hash(x) * 60) {
          g.fillRect(x, 400, 7, 60);
          g.beginPath();
          g.ellipse(x + 3.5, 400, 5, 2.4, 0, 0, TAU);
          g.fill();
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 60, 210, true, 0.8), sea: { y: W }, birds: true };
  },

  bonfire(P, rng) {
    const layers = [];
    layers.push(
      layer(240, 386, 0.04, 0.5, (g, dyn) => {
        // a headland with the lighthouse, and the lights of a town across the bay
        const hx = 1100 + rng() * 500;
        each(hx, 300, (xx) => {
          g.fillStyle = P.far;
          g.beginPath();
          g.moveTo(xx - 300, 385);
          g.quadraticCurveTo(xx - 120, 330, xx + 40, 320);
          g.quadraticCurveTo(xx + 200, 330, xx + 300, 385);
          g.fill();
          lighthouse(g, xx + 30, 322, 1, mix(P.far, '#c8ccd8', 0.25), mix(P.far, '#a84a3a', 0.3));
        });
        dyn.push({ type: 'lighthouse', x: hx + 30, y: 322 - 58 });
        for (let i = 0; i < 70; i++) {
          g.fillStyle = alpha(i % 3 ? '#ffcf86' : '#ffe8c0', 0.3 + rng() * 0.5);
          g.fillRect(rng() * 600 + 100, 376 + rng() * 8, 1.4, 1.4);
        }
      })
    );
    layers.push(
      layer(260, 640, 0.12, 0.6, (g, dyn) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 408 - (0.4 + 0.6 * Math.abs(n(x / TW))) * 18;
        ridge(g, fn, 640, P.mid);
        g.strokeStyle = mix(P.mid, '#3a4058', 0.3);
        g.lineWidth = 1;
        g.beginPath();
        for (let x = 0; x < TW; x += 4) {
          if (hash(x * 3) < 0.5) continue;
          g.moveTo(x, fn(x) + 1);
          g.lineTo(x + (hash(x) - 0.5) * 6, fn(x) - 6 - hash(x * 7) * 8);
        }
        g.stroke();
        for (let i = 0; i < 3; i++) {
          const x = rng() * TW;
          dyn.push({ type: 'glow', x, y: fn(x) - 2, r: 30, color: '#ff9a4a', period: 1.3 + rng() });
        }
      })
    );
    layers.push(
      layer(300, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.5);
        const fn = (x) => 414 - Math.abs(n(x / TW)) * 12;
        ridge(g, fn, 640, P.near);
        g.strokeStyle = mix(P.near, '#4a4a5a', 0.25);
        g.lineWidth = 1.4;
        g.beginPath();
        for (let x = 0; x < TW; x += 3) {
          if (hash(x * 11) < 0.45) continue;
          const h = 10 + hash(x) * 22;
          g.moveTo(x, fn(x) + 2);
          g.quadraticCurveTo(x + 3, fn(x) - h * 0.6, x + (hash(x * 5) - 0.3) * 10, fn(x) - h);
        }
        g.stroke();
        // a line of old fence posts half buried in the dune
        g.fillStyle = mix(P.near, '#000000', 0.2);
        for (let x = rng() * 200; x < TW; x += 18 + hash(x) * 20) g.fillRect(x, fn(x) - 10 - hash(x * 3) * 6, 3, 14);
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 6;
        ridge(g, fn, 660, mix(P.near, '#000000', 0.4));
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 4, 40, 180, true, 0.5), sea: { y: 384 }, stars: true };
  },
};
