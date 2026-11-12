// Chapter 7 backgrounds: a birch wood furred with frost, a frozen lake full of skaters, the
// reindeer road under the northern lights, a ski hill with its chairlift, a park of lit snow
// sculptures at dusk, and the town square on midwinter night. Painted with the same tools as
// backgrounds.js; the chairlift and the skaters move, drawn each frame by winterDyn below.

import { TW, periodic, layer, each, vgrad, ridge, litColumns, hazeOver, pine, building, cloudLayer } from './backgrounds.js';
import { hash } from './rng.js';
import { mix, alpha, TAU, fract } from './util.js';

// ---------------------------------------------------------------- silhouettes

/** A birch: a pale trunk with dark marks, and a haze of fine twigs white with hoarfrost. */
function birch(g, x, yb, h, bark, mark, frost, rng) {
  const w = Math.max(1.4, h * 0.035);
  g.fillStyle = bark;
  g.beginPath();
  g.moveTo(x - w, yb);
  g.lineTo(x - w * 0.4, yb - h);
  g.lineTo(x + w * 0.4, yb - h);
  g.lineTo(x + w, yb);
  g.fill();
  g.fillStyle = mark;
  for (let y = yb - 8; y > yb - h * 0.9; y -= 10 + rng() * 22) {
    // lenticels: short dark dashes, never right across the trunk
    const side = rng() < 0.5 ? -1 : 1;
    g.fillRect(x + side * w * 0.2 - w * 0.3, y, w * (0.4 + rng() * 0.5), 1.2);
  }
  g.strokeStyle = frost;
  g.lineWidth = 0.7;
  g.beginPath();
  for (let k = 0; k < 26; k++) {
    const y = yb - h * (0.35 + rng() * 0.65);
    const dir = rng() < 0.5 ? -1 : 1;
    const len = h * (0.08 + rng() * 0.16) * (1 - (yb - y) / h + 0.4);
    g.moveTo(x, y);
    g.quadraticCurveTo(x + dir * len * 0.6, y - len * 0.2, x + dir * len, y + len * 0.3);
  }
  g.stroke();
}

function snowCottage(g, x, yb, s, wall, roof, win) {
  const w = 34 * s;
  g.fillStyle = wall;
  g.fillRect(x, yb - 18 * s, w, 18 * s);
  g.fillStyle = roof;
  g.beginPath();
  g.moveTo(x - 5 * s, yb - 17 * s);
  g.lineTo(x + w / 2, yb - 32 * s);
  g.lineTo(x + w + 5 * s, yb - 17 * s);
  g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(x - 6 * s, yb - 16 * s);
  g.lineTo(x + w / 2, yb - 33 * s);
  g.lineTo(x + w + 6 * s, yb - 16 * s);
  g.lineTo(x + w + 2 * s, yb - 15 * s);
  g.lineTo(x + w / 2, yb - 29 * s);
  g.lineTo(x - 2 * s, yb - 15 * s);
  g.fill();
  g.fillStyle = win;
  g.fillRect(x + 6 * s, yb - 12 * s, 5 * s, 5 * s);
  g.fillRect(x + w - 11 * s, yb - 12 * s, 5 * s, 5 * s);
}

function reindeer(g, x, y, s, col) {
  g.fillStyle = col;
  g.beginPath();
  g.ellipse(x, y - 6 * s, 7 * s, 3.4 * s, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(x + 7 * s, y - 9 * s, 2.4 * s, 1.6 * s, -0.4, 0, TAU);
  g.fill();
  g.fillRect(x + 5 * s, y - 9 * s, 2 * s, 4 * s);
  for (const lx of [-5, -3, 3, 5]) g.fillRect(x + lx * s, y - 3 * s, 0.9 * s, 3.2 * s);
  g.strokeStyle = col;
  g.lineWidth = 0.8 * s;
  g.beginPath();
  g.moveTo(x + 7 * s, y - 10 * s);
  g.lineTo(x + 6 * s, y - 15 * s);
  g.lineTo(x + 4 * s, y - 17 * s);
  g.moveTo(x + 6 * s, y - 13 * s);
  g.lineTo(x + 9 * s, y - 16 * s);
  g.stroke();
}

function lavvu(g, x, yb, s, cloth, glow) {
  g.fillStyle = cloth;
  g.beginPath();
  g.moveTo(x - 16 * s, yb);
  g.lineTo(x, yb - 30 * s);
  g.lineTo(x + 16 * s, yb);
  g.fill();
  g.strokeStyle = cloth;
  g.lineWidth = 1.2 * s;
  g.beginPath();
  g.moveTo(x - 3 * s, yb - 36 * s);
  g.lineTo(x + 2 * s, yb - 26 * s);
  g.moveTo(x + 3 * s, yb - 36 * s);
  g.lineTo(x - 2 * s, yb - 26 * s);
  g.stroke();
  g.fillStyle = glow;
  g.beginPath();
  g.moveTo(x - 4 * s, yb);
  g.lineTo(x, yb - 9 * s);
  g.lineTo(x + 4 * s, yb);
  g.fill();
}

/** A big decorated fir: tiers of branches, tinsel of light, a star on top. */
export function bigTree(g, x, yb, h, col, light) {
  const tiers = 7;
  g.fillStyle = col;
  for (let k = 0; k < tiers; k++) {
    const t = k / tiers;
    const y = yb - h * 0.08 - t * h * 0.82;
    const w = h * 0.36 * (1 - t) + h * 0.04;
    g.beginPath();
    g.moveTo(x - w, y);
    g.quadraticCurveTo(x - w * 0.4, y - h * 0.08, x, y - h * 0.2);
    g.quadraticCurveTo(x + w * 0.4, y - h * 0.08, x + w, y);
    g.lineTo(x + w * 0.6, y - 2);
    g.lineTo(x - w * 0.6, y - 2);
    g.fill();
  }
  g.fillRect(x - h * 0.03, yb - h * 0.1, h * 0.06, h * 0.1);
  g.fillStyle = light;
  g.beginPath();
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * TAU * 2) / 5;
    const r = h * 0.04;
    g.lineTo(x + Math.cos(a) * r, yb - h * 0.96 + Math.sin(a) * r);
  }
  g.fill();
}

// ---------------------------------------------------------------- themes

export const WINTER_THEMES = {
  birchwood(P, rng) {
    const layers = [];
    layers.push(
      layer(220, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 350 - (0.3 + 0.7 * Math.abs(n(x / TW))) * 60;
        ridge(g, fn, 600, P.far);
        for (let x = 0; x < TW; x += 4) pine(g, x, fn(x) + 4, 8 + hash(x) * 8, P.far, rng, '#f4f6fa');
        hazeOver(g, P.haze, 240, 600, 0.35, 0.55);
      })
    );
    layers.push(
      layer(180, 620, 0.12, 0.6, (g) => {
        ridge(g, () => 392, 620, mix('#ffffff', P.mid, 0.2));
        for (let x = 0; x < TW; x += 6 + hash(x) * 8) birch(g, x, 394 + hash(x * 3) * 6, 70 + hash(x * 5) * 60, mix('#e8e8e8', P.mid, 0.45), mix('#3a3a40', P.mid, 0.5), alpha('#ffffff', 0.5), rng);
        hazeOver(g, P.haze, 180, 620, 0.35, 0.2, 180);
      })
    );
    layers.push(
      layer(60, 640, 0.3, 0.75, (g) => {
        const n = periodic(rng, 4, 3, 0.5);
        const fn = (x) => 404 - n(x / TW) * 6;
        ridge(g, fn, 640, '#f2f4f8');
        for (let x = rng() * 60; x < TW; x += 40 + rng() * 70) each(x, 40, (xx) => birch(g, xx, fn(xx) + 4, 180 + rng() * 140, '#f0eeea', '#2a2a30', alpha('#ffffff', 0.85), rng));
        for (let i = 0; i < 6; i++) {
          const x = rng() * TW;
          reindeer(g, x, fn(x) + 6, 1.6, mix('#6a5040', P.near, 0.3));
        }
        // snow shadows in blue
        g.fillStyle = alpha('#9ab0d8', 0.35);
        for (let x = 0; x < TW; x += 30) g.fillRect(x, fn(x) + 4, 20 + hash(x) * 30, 2);
      })
    );
    layers.push(
      layer(330, 660, 0.56, 0.9, (g) => {
        const n = periodic(rng, 6, 3, 0.5);
        const fn = (x) => 414 - n(x / TW) * 7;
        ridge(g, fn, 660, mix('#e0e6f0', P.near, 0.15));
        g.strokeStyle = mix('#5a4a3a', P.near, 0.4);
        g.lineWidth = 1;
        g.beginPath();
        for (let x = 0; x < TW; x += 5) {
          if (hash(x * 9) < 0.5) continue;
          const h = 6 + hash(x * 5) * 14;
          g.moveTo(x, fn(x) + 2);
          g.lineTo(x + (hash(x) - 0.5) * 6, fn(x) - h);
        }
        g.stroke();
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 5, 40, 200, true, 0.7), fogAfter: { 1: { color: '#ffffff', y: 380, a: 0.3 } } };
  },

  icelake(P, rng) {
    const layers = [];
    const W = 392;
    layers.push(
      layer(100, W + 2, 0.04, 0.5, (g) => {
        const n = periodic(rng, 3, 4, 0.55);
        const fn = (x) => 340 - (0.25 + 0.75 * Math.abs(n(x / TW))) * 160;
        litColumns(g, fn, W + 2, { lit: '#f4f8ff', dark: mix(P.far, '#5a6a9a', 0.3), sunLeft: false, contrast: 2, smooth: 6, snowLine: 400, snowLit: '#ffffff', snowDark: '#b8c8e0' });
        hazeOver(g, P.haze, 150, W + 2, 0.08, 0.4, 100);
      })
    );
    layers.push(
      layer(240, 480, 0.12, 0.6, (g, dyn) => {
        // the far shore: snowy pines, a red boathouse, the town's church
        const fn = (x) => W - 6 - hash(Math.floor(x / 40)) * 10;
        ridge(g, (x) => W - 4, W + 1, '#f4f6fa');
        for (let x = 0; x < TW; x += 4) pine(g, x, fn(x) + 4, 18 + hash(x * 3) * 18, mix('#1e3a30', P.mid, 0.3), rng, '#ffffff');
        for (let i = 0; i < 5; i++) {
          const x = rng() * TW;
          each(x, 40, (xx) => snowCottage(g, xx, W - 2, 0.9, mix(['#a83a2a', '#e8c070', '#3a6a9a'][i % 3], P.mid, 0.25), mix('#3a2a2a', P.mid, 0.2), alpha('#ffe0a0', 0.8)));
        }
        const cx = rng() * TW;
        each(cx, 40, (xx) => building(g, xx, W - 2, 14, 30, mix('#e8e4dc', P.mid, 0.25), rng, { type: 'spire' }));
        // the ice itself: pale, scratched with skate lines, people on it
        g.fillStyle = vgrad(g, W, 480, [
          [0, mix('#d8e8f4', P.haze, 0.2)],
          [1, '#b8d0e4'],
        ]);
        g.fillRect(0, W, TW, 480 - W);
        g.strokeStyle = alpha('#ffffff', 0.6);
        g.lineWidth = 0.8;
        for (let i = 0; i < 60; i++) {
          const x = rng() * TW;
          const y = W + 4 + rng() * 70;
          g.beginPath();
          g.ellipse(x, y, 20 + rng() * 60, 2 + rng() * 4, 0, 0, Math.PI * (0.5 + rng()));
          g.stroke();
        }
        for (let i = 0; i < 16; i++) dyn.push({ type: 'skater', x: rng() * TW, y: W + 6 + rng() * 40, s: 0.8 + rng() * 0.6, v: (rng() < 0.5 ? -1 : 1) * (14 + rng() * 22), span: 60, phase: rng() * 10, col: ['#c83a3a', '#2a5aa8', '#f2c040', '#3a8a5a', '#e870a8'][i % 5] });
      })
    );
    layers.push(
      layer(330, 640, 0.3, 0.75, (g) => {
        // fishing huts out on the ice nearer in
        for (let i = 0; i < 5; i++) {
          const x = rng() * TW;
          each(x, 30, (xx) => {
            const y = 420;
            g.fillStyle = mix(['#a83a2a', '#3a6a9a', '#e8c070'][i % 3], P.near, 0.3);
            g.fillRect(xx, y - 22, 22, 22);
            g.fillStyle = '#ffffff';
            g.beginPath();
            g.moveTo(xx - 3, y - 21);
            g.lineTo(xx + 11, y - 30);
            g.lineTo(xx + 25, y - 21);
            g.fill();
            g.fillStyle = mix('#2a2a2a', P.near, 0.2);
            g.fillRect(xx + 15, y - 30, 2, 7);
          });
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 4, 40, 170, false, 0.7), birds: true };
  },

  tundra(P, rng) {
    const layers = [];
    layers.push(
      layer(260, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 370 - (0.3 + 0.7 * Math.abs(n(x / TW))) * 50;
        ridge(g, fn, 600, mix('#3a4a6a', P.far, 0.4));
        hazeOver(g, P.haze, 280, 600, 0.2, 0.4);
      })
    );
    layers.push(
      layer(260, 620, 0.12, 0.6, (g, dyn) => {
        const n = periodic(rng, 3, 3, 0.5);
        const fn = (x) => 392 - Math.abs(n(x / TW)) * 20;
        ridge(g, fn, 620, mix('#5a6a8a', P.mid, 0.4));
        for (let x = 0; x < TW; x += 9) if (hash(x * 7) > 0.6) pine(g, x, fn(x) + 3, 8 + hash(x) * 14, mix('#0a1020', P.mid, 0.3), rng, null);
        // the herders' camp: tents glowing, a fire, the herd beyond
        for (let i = 0; i < 3; i++) {
          const cx = rng() * TW;
          each(cx, 80, (xx) => {
            for (let k = 0; k < 3; k++) lavvu(g, xx + k * 30, fn(xx + k * 30) + 4, 0.9 + (k % 2) * 0.2, mix('#4a4038', P.mid, 0.3), P.lamp);
          });
          dyn.push({ type: 'glow', x: cx + 30, y: fn(cx) - 4, r: 60, color: P.lamp, period: 3 });
        }
        for (let i = 0; i < 40; i++) {
          const x = rng() * TW;
          reindeer(g, x, fn(x) + 10 + rng() * 20, 0.7, mix('#0a0e18', P.mid, 0.2));
        }
        hazeOver(g, P.haze, 300, 620, 0.06, 0.15);
      })
    );
    layers.push(
      layer(330, 660, 0.4, 0.8, (g) => {
        const n = periodic(rng, 5, 3, 0.5);
        const fn = (x) => 410 - n(x / TW) * 6;
        ridge(g, fn, 660, mix('#7a88a8', P.near, 0.5));
        for (let x = 0; x < TW; x += 60 + hash(x) * 120) pine(g, x, fn(x) + 4, 30 + hash(x * 3) * 30, mix('#05080e', P.near, 0.2), rng, '#c8d4e8');
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 3, 30, 120, true, 0.4), stars: true, aurora: true };
  },

  skihill(P, rng) {
    const layers = [];
    layers.push(
      layer(60, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 3, 4, 0.55);
        const fn = (x) => 330 - (0.25 + 0.75 * Math.abs(n(x / TW))) * 220;
        litColumns(g, fn, 600, { lit: '#ffffff', dark: mix(P.far, '#4a5a8a', 0.3), sunLeft: false, contrast: 2.2, smooth: 6, snowLine: 600, snowLit: '#ffffff', snowDark: '#a8b8d8' });
        hazeOver(g, P.haze, 120, 600, 0.06, 0.4, 60);
      })
    );
    layers.push(
      layer(120, 640, 0.12, 0.6, (g, dyn) => {
        // the ski hill: a long white slope with forest down either side of the pistes
        const fn = (x) => 400 - Math.max(0, Math.sin((x / TW) * TAU * 2)) * 200 - 20;
        ridge(g, fn, 640, '#f6f8fc');
        for (let x = 0; x < TW; x += 4) {
          const s = Math.sin((x / TW) * TAU * 2);
          if (Math.abs(Math.cos((x / TW) * TAU * 6)) > 0.45) pine(g, x, fn(x) + 14 + hash(x) * 30, 14 + hash(x * 3) * 12, mix('#1a3428', P.mid, 0.3), rng, '#ffffff');
          if (s < 0 && hash(x * 7) > 0.7) pine(g, x, fn(x) + 10, 18 + hash(x) * 14, mix('#1a3428', P.mid, 0.3), rng, '#ffffff');
        }
        // the lift, towers stepping up the hill and chairs going round
        const x0 = 100 + rng() * 300;
        const x1 = x0 + 480;
        const top = (x) => fn(x) - 36;
        g.fillStyle = mix('#3a3a44', P.mid, 0.2);
        for (let k = 0; k <= 6; k++) {
          const tx = x0 + ((x1 - x0) * k) / 6;
          g.fillRect(tx - 1.5, top(tx), 3, 36);
          g.fillRect(tx - 7, top(tx), 14, 2);
        }
        dyn.push({ type: 'chairlift', x: x0, y: top(x0), x2: x1, y2: top(x1), span: 520, col: mix('#2a2a30', P.mid, 0.2) });
        // skiers on the pistes
        for (let i = 0; i < 26; i++) {
          const x = rng() * TW;
          const y = fn(x) + 6 + rng() * 40;
          g.fillStyle = ['#c83a3a', '#2a5aa8', '#f2c040', '#2a2a2a'][i % 4];
          g.fillRect(x, y - 5, 2, 5);
          g.fillStyle = '#1a1a1a';
          g.fillRect(x - 2, y, 6, 0.8);
        }
        hazeOver(g, P.haze, 200, 640, 0.08, 0.15, 120);
      })
    );
    layers.push(
      layer(260, 660, 0.4, 0.8, (g) => {
        const n = periodic(rng, 5, 3, 0.5);
        const fn = (x) => 408 - n(x / TW) * 6;
        ridge(g, fn, 660, '#eef2f8');
        // a lodge with smoke and skis stuck in the snow outside
        const lx = rng() * TW;
        each(lx, 120, (xx) => {
          g.fillStyle = mix('#6a4428', P.near, 0.2);
          g.fillRect(xx, fn(xx) - 40, 100, 40);
          g.fillStyle = '#ffffff';
          g.beginPath();
          g.moveTo(xx - 12, fn(xx) - 38);
          g.lineTo(xx + 50, fn(xx) - 72);
          g.lineTo(xx + 112, fn(xx) - 38);
          g.fill();
          g.fillStyle = alpha('#ffd890', 0.8);
          for (let k = 0; k < 4; k++) g.fillRect(xx + 10 + k * 22, fn(xx) - 28, 10, 10);
        });
        for (let x = 0; x < TW; x += 120 + hash(x) * 160) each(x, 50, (xx) => pine(g, xx, fn(xx) + 4, 90 + hash(xx) * 50, mix('#0e2018', P.near, 0.2), rng, '#ffffff'));
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 5, 30, 160, false, 0.8), birds: true };
  },

  sculptures(P, rng) {
    const layers = [];
    layers.push(
      layer(220, 600, 0.04, 0.5, (g) => {
        const n = periodic(rng, 2, 3, 0.5);
        const fn = (x) => 360 - (0.3 + 0.7 * Math.abs(n(x / TW))) * 50;
        ridge(g, fn, 600, P.far);
        // the town beyond the park, windows coming on
        for (let x = 0; x < TW; x += 14 + hash(x) * 20) building(g, x, fn(x) + 30, 10 + hash(x * 3) * 10, 14 + hash(x * 5) * 20, mix(P.far, '#000000', 0.15), rng, { type: hash(x * 7) < 0.5 ? 'gable' : 'flat', windows: { lit: 0.4, litCol: '#ffd890', size: 0.7 } });
        hazeOver(g, P.haze, 260, 600, 0.2, 0.4);
      })
    );
    layers.push(
      layer(200, 620, 0.12, 0.6, (g, dyn) => {
        ridge(g, () => 394, 620, mix('#c8d0e8', P.mid, 0.3));
        // big sculptures: a castle, a whale, an owl, a dragon's back, lit from inside
        const shapes = ['castle', 'whale', 'owl', 'arch'];
        for (let i = 0; i < 8; i++) {
          const x = 100 + i * 250 + rng() * 80;
          const kind = shapes[i % 4];
          const col = mix('#e8f0ff', P.mid, 0.25);
          g.fillStyle = col;
          if (kind === 'castle') {
            g.fillRect(x, 334, 70, 60);
            for (let k = 0; k < 4; k++) g.fillRect(x - 6 + k * 24, 314, 14, 24);
            for (let k = 0; k < 7; k++) g.fillRect(x - 6 + k * 12, 308 + (k % 2 ? 6 : 0), 6, 8);
          } else if (kind === 'whale') {
            g.beginPath();
            g.ellipse(x + 40, 370, 46, 22, -0.1, 0, TAU);
            g.fill();
            g.beginPath();
            g.moveTo(x - 4, 370);
            g.lineTo(x - 20, 350);
            g.lineTo(x - 18, 380);
            g.fill();
          } else if (kind === 'owl') {
            g.beginPath();
            g.ellipse(x + 20, 360, 22, 34, 0, 0, TAU);
            g.fill();
            g.fillStyle = mix('#5a6a9a', P.mid, 0.3);
            g.beginPath();
            g.arc(x + 12, 344, 6, 0, TAU);
            g.arc(x + 28, 344, 6, 0, TAU);
            g.fill();
          } else {
            g.beginPath();
            g.moveTo(x, 394);
            g.quadraticCurveTo(x + 50, 300, x + 100, 394);
            g.lineTo(x + 84, 394);
            g.quadraticCurveTo(x + 50, 330, x + 16, 394);
            g.fill();
          }
          dyn.push({ type: 'glow', x: x + 36, y: 360, r: 70, color: ['#9ad8ff', '#c8a8ff', '#a8ffd8', '#ffb8d8'][i % 4], period: 4 + i });
        }
        for (let x = 0; x < TW; x += 30) dyn.push({ type: 'blink', x: x + hash(x) * 20, y: 392, color: '#9ad8ff', period: 30, phase: 0.01 });
      })
    );
    layers.push(
      layer(260, 660, 0.4, 0.8, (g) => {
        const n = periodic(rng, 5, 3, 0.5);
        const fn = (x) => 408 - n(x / TW) * 6;
        ridge(g, fn, 660, mix('#b8c0dc', P.near, 0.35));
        for (let x = 0; x < TW; x += 140 + hash(x) * 160) each(x, 50, (xx) => pine(g, xx, fn(xx) + 4, 80 + hash(xx) * 60, mix('#0a0e1e', P.near, 0.2), rng, '#c8d0e8'));
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 6, 40, 200, true, 0.8) };
  },

  square(P, rng) {
    const layers = [];
    layers.push(
      layer(160, 600, 0.04, 0.5, (g, dyn) => {
        // roofs of the old town under snow, a church tower, every window lit
        for (let x = 0; x < TW; x += 16 + hash(x) * 18) {
          const h = 40 + hash(x * 3) * 70;
          building(g, x, 400, 18 + hash(x * 5) * 14, h, mix(P.far, '#000000', 0.1), rng, { type: hash(x * 7) < 0.6 ? 'gable' : 'flat', windows: { lit: 0.55, litCol: '#ffcf86', size: 0.8 } });
        }
        const tx = rng() * TW;
        each(tx, 20, (xx) => building(g, xx, 400, 22, 150, mix(P.far, '#000000', 0.15), rng, { type: 'spire' }));
        dyn.push({ type: 'blink', x: tx + 11, y: 300, color: '#ffe0a0', period: 60, phase: 0.01 });
        hazeOver(g, P.haze, 200, 600, 0.12, 0.2, 160);
      })
    );
    layers.push(
      layer(100, 640, 0.12, 0.6, (g, dyn) => {
        // the square: tall gabled houses hung with lights, and the great tree in the middle
        g.fillStyle = '#d8dce8';
        g.fillRect(0, 398, TW, 300);
        for (let x = 0; x < TW; x += 52 + hash(x) * 20) {
          const w = 44 + hash(x * 3) * 10;
          const h = 90 + hash(x * 5) * 60;
          const col = mix(['#8a3a2a', '#c89a4a', '#3a5a7a', '#6a7a5a', '#a86a5a'][Math.floor(hash(x * 9) * 5)], P.mid, 0.45);
          building(g, x, 400, w, h, col, rng, { type: 'gable', windows: { lit: 0.7, litCol: '#ffcf86', size: 1.2 } });
          g.fillStyle = '#eef0f8';
          g.beginPath();
          g.moveTo(x - 3, 400 - h);
          g.lineTo(x + w / 2, 400 - h - w * 0.38);
          g.lineTo(x + w + 3, 400 - h);
          g.lineTo(x + w / 2, 400 - h - w * 0.3);
          g.fill();
        }
        for (let x = 0; x < TW; x += 140) dyn.push({ type: 'bulbs', x, y: 300 + hash(x) * 30, dx: 140, sag: 18, n: 12, phase: hash(x * 3) * 10 });
        const tx = 600 + rng() * 800;
        each(tx, 120, (xx) => bigTree(g, xx, 400, 230, mix('#0e2a1a', P.mid, 0.2), '#ffe080'));
        dyn.push({ type: 'treeLights', x: tx, y: 400, h: 230 });
        hazeOver(g, P.haze, 200, 640, 0.05, 0.1, 100);
      })
    );
    layers.push(
      layer(260, 660, 0.4, 0.8, (g, dyn) => {
        // market stalls and the crowd
        for (let x = 0; x < TW; x += 120 + hash(x) * 120) {
          const y = 410;
          g.fillStyle = mix('#5a3a24', P.near, 0.3);
          g.fillRect(x, y - 34, 60, 34);
          g.fillStyle = '#eef0f8';
          g.beginPath();
          g.moveTo(x - 6, y - 32);
          g.lineTo(x + 30, y - 52);
          g.lineTo(x + 66, y - 32);
          g.fill();
          g.fillStyle = alpha('#ffd890', 0.7);
          g.fillRect(x + 6, y - 28, 48, 12);
          dyn.push({ type: 'lamp', x: x + 30, y: y - 36 });
        }
        g.fillStyle = mix('#08070c', P.near, 0.3);
        for (let i = 0; i < 70; i++) {
          const x = rng() * TW;
          const h = 16 + rng() * 6;
          g.beginPath();
          g.arc(x, 412 - h + 2, 2.6, 0, TAU);
          g.fill();
          g.fillRect(x - 3, 412 - h + 4, 6, h - 4);
        }
      })
    );
    return { layers, clouds: cloudLayer(P, rng, 4, 30, 140, true, 0.5), stars: true };
  },
};

// ---------------------------------------------------------------- moving parts

/** Draw a chapter 7 moving background part. False if the type is not one of ours. */
export function winterDyn(ctx, d, x, y, t, P) {
  if (d.type === 'skater') {
    // skaters gliding back and forth, leaning into each stride
    const span = 160;
    const p = fract(t * Math.abs(d.v) / (span * 2) + d.phase);
    const u = p < 0.5 ? p * 2 : 2 - p * 2;
    const sx = x + (d.v > 0 ? u : 1 - u) * span - span / 2;
    const lean = Math.sin(t * 3 + d.phase) * 2 * d.s;
    ctx.fillStyle = d.col;
    ctx.fillRect(sx - 1.2 * d.s + lean * 0.4, y - 9 * d.s, 2.4 * d.s, 5 * d.s);
    ctx.fillStyle = '#1a1a20';
    ctx.beginPath();
    ctx.arc(sx + lean * 0.5, y - 10 * d.s, 1.3 * d.s, 0, TAU);
    ctx.fill();
    ctx.fillRect(sx - 1 * d.s, y - 4 * d.s, 0.9 * d.s, 4 * d.s);
    ctx.fillRect(sx + 0.4 * d.s + lean * 0.3, y - 4 * d.s, 0.9 * d.s, 4 * d.s);
    return true;
  }
  if (d.type === 'chairlift') {
    ctx.strokeStyle = d.col;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (d.x2 - d.x), d.y2 - d.y + y);
    ctx.moveTo(x, y + 3);
    ctx.lineTo(x + (d.x2 - d.x), d.y2 - d.y + y + 3);
    ctx.stroke();
    // chairs going up on one cable and down on the other
    for (let k = 0; k < 14; k++) {
      for (const [dir, off] of [
        [1, 0],
        [-1, 3],
      ]) {
        const u = fract(t * 0.02 * dir + k / 14);
        const cx = x + (d.x2 - d.x) * u;
        const cy = y + off + (d.y2 - d.y) * u;
        ctx.fillStyle = d.col;
        ctx.fillRect(cx - 0.4, cy, 0.8, 6);
        ctx.fillRect(cx - 3, cy + 6, 6, 1.4);
        if (dir > 0 && k % 2 === 0) {
          ctx.fillStyle = ['#c83a3a', '#2a5aa8', '#f2c040'][k % 3];
          ctx.fillRect(cx - 1.5, cy + 2.5, 3, 3.5);
        }
      }
    }
    return true;
  }
  if (d.type === 'treeLights') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cols = ['#ffd27a', '#ff7a6a', '#9ad8ff', '#fff4d0', '#a8ff9a'];
    for (let k = 0; k < 60; k++) {
      const v = hash(k * 3);
      const yy = y - d.h * 0.1 - v * d.h * 0.8;
      const half = d.h * 0.36 * (1 - v) + 4;
      const xx = x + (hash(k * 7) - 0.5) * 2 * half * 0.85;
      const on = 0.5 + 0.5 * Math.sin(t * 2.4 + k * 1.7);
      const c = cols[k % cols.length];
      ctx.fillStyle = alpha(c, 0.2 * on);
      ctx.beginPath();
      ctx.arc(xx, yy, 5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = alpha(c, 0.5 + 0.5 * on);
      ctx.fillRect(xx - 1, yy - 1, 2, 2);
    }
    const g = ctx.createRadialGradient(x, y - d.h * 0.96, 0, x, y - d.h * 0.96, 40);
    g.addColorStop(0, alpha('#ffe080', 0.6));
    g.addColorStop(1, alpha('#ffe080', 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - 40, y - d.h * 0.96 - 40, 80, 80);
    ctx.restore();
    void P;
    return true;
  }
  return false;
}
