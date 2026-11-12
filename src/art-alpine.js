// Chapter 3, the way down: ground, pits, props and the lakeside finish for the pasture, the cliff
// path and the turquoise lake. Same contract as art.js (world coordinates, tone function T
// applied to every colour).

import { hash, mulberry32 } from './rng.js';
import { rr, vg, edgeShade, blades, woodGrad, backPost } from './art.js';
import { mix, alpha, TAU, fract, clamp } from './util.js';

// ---------------------------------------------------------------- ground

function body(ctx, s, sx0, sx1, bottom, T, G, depth = 130) {
  ctx.fillStyle = vg(ctx, s.y, s.y + depth, T(G.body), T(G.deep));
  ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
}

function topBand(ctx, s, sx0, sx1, T, G, h = 10, wobble = 1.2) {
  ctx.fillStyle = vg(ctx, s.y - 2, s.y + h, T(G.top2), T(G.top));
  ctx.beginPath();
  ctx.moveTo(sx0, s.y + h);
  for (let x = Math.floor(sx0 / 9) * 9; x <= sx1 + 9; x += 9) ctx.lineTo(clamp(x, sx0, sx1), s.y - 1 - hash(x) * wobble);
  ctx.lineTo(sx1, s.y + h);
  ctx.fill();
}

const MEADOW = ['#f2d040', '#f4f0f0', '#c868c8', '#6a8ae0', '#f08a6a'];

export const ALPINE_SEG = {
  pasture(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 120);
    ctx.fillStyle = alpha('#8a8a84', 0.5);
    for (let x = Math.floor(sx0 / 53) * 53; x < sx1; x += 53) {
      const h = hash(x * 3);
      if (h < 0.4) continue;
      ctx.beginPath();
      ctx.ellipse(x + h * 20, s.y + 24 + hash(x) * 70, 5 + h * 8, 3 + h * 4, 0, 0, TAU);
      ctx.fill();
    }
    topBand(ctx, s, sx0, sx1, T, G, 11, 0.8);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
    blades(ctx, s, sx0, sx1, T(G.top), 3, 8, 3.2);
    blades(ctx, s, sx0, sx1, T(G.top2), 2, 6, 5.1, 1);
    for (let x = Math.floor(sx0 / 5) * 5; x < sx1; x += 5) {
      if (hash(x * 11) < 0.62) continue;
      ctx.fillStyle = T(MEADOW[Math.floor(hash(x * 13) * MEADOW.length)]);
      ctx.fillRect(x, s.y - 3 - hash(x) * 6, 2, 2);
    }
  },

  cliffpath(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    // the rock the path is cut into, then a boardwalk of planks on iron brackets
    ctx.fillStyle = vg(ctx, s.y, s.y + 200, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y + 8, sx1 - sx0, bottom - s.y - 8);
    ctx.strokeStyle = alpha('#1a1c20', 0.35);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 31) * 31; x < sx1; x += 31) {
      if (hash(x) < 0.4) continue;
      ctx.moveTo(x, s.y + 12);
      ctx.lineTo(x + (hash(x * 3) - 0.5) * 14, s.y + 40 + hash(x * 5) * 60);
      ctx.lineTo(x + (hash(x * 7) - 0.5) * 20, s.y + 120 + hash(x * 9) * 60);
    }
    ctx.stroke();
    ctx.fillStyle = alpha('#ffffff', 0.08);
    for (let k = 0; k < 4; k++) ctx.fillRect(sx0, s.y + 30 + k * 34 + hash(k) * 8, sx1 - sx0, 3);
    // brackets under the deck
    ctx.fillStyle = T('#2a2a2e');
    for (let x = Math.ceil(sx0 / 60) * 60; x < sx1; x += 60) {
      if (x < s.x0 + 6 || x > s.x1 - 6) continue;
      ctx.beginPath();
      ctx.moveTo(x - 2, s.y + 8);
      ctx.lineTo(x + 2, s.y + 8);
      ctx.lineTo(x + 2, s.y + 26);
      ctx.lineTo(x - 14, s.y + 9);
      ctx.fill();
    }
    ctx.fillStyle = woodGrad(ctx, s.y - 1, 10, T, G.top2, G.top, '#4a3420');
    ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 9);
    ctx.fillStyle = alpha('#000000', 0.35);
    for (let x = Math.floor(sx0 / 14) * 14; x < sx1; x += 14) ctx.fillRect(x, s.y - 1, 1, 9);
    ctx.fillStyle = alpha(P.light, 0.25);
    ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 1.4);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
  },

  lake(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 130);
    // a beach of round grey stones, smaller toward the top
    for (let k = 0; k < 3; k++) {
      for (let x = Math.floor(sx0 / (9 + k * 5)) * (9 + k * 5); x < sx1; x += 9 + k * 5) {
        const h = hash(x * (3 + k));
        if (h < 0.3) continue;
        ctx.fillStyle = T(mix(['#a8a090', '#8a8478', '#c8c0b0'][Math.floor(h * 3)], G.body, 0.25 + k * 0.15));
        ctx.beginPath();
        ctx.ellipse(x + h * 4, s.y + 14 + k * 26 + hash(x) * 10, 3 + k * 2.4, 2 + k * 1.4, 0, 0, TAU);
        ctx.fill();
      }
    }
    topBand(ctx, s, sx0, sx1, T, G, 9, 1.6);
    for (let x = Math.floor(sx0 / 5) * 5; x < sx1; x += 5) {
      const h = hash(x * 7);
      if (h < 0.45) continue;
      ctx.fillStyle = T(mix('#e8e0d0', '#8a8478', hash(x * 3)));
      ctx.beginPath();
      ctx.ellipse(x, s.y + 1, 1.6 + h * 1.6, 1.2 + h, 0, 0, TAU);
      ctx.fill();
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
  },
};

/** Pits for the way down. Returns false when the terrain is not one of ours. */
export function alpinePit(ctx, terr, P, T, a, b, bottom, t) {
  const top = Math.max(a.y, b.y) + 1;
  const x0 = a.x1;
  const w = b.x0 - a.x1;
  const waterPit = (depth, water, glint) => {
    const wy = top + depth;
    ctx.fillStyle = vg(ctx, wy, wy + 60, T(mix(water, '#ffffff', 0.25)), T(mix(water, '#000000', 0.45)));
    ctx.fillRect(x0, wy, w, bottom - wy);
    ctx.strokeStyle = alpha(glint, 0.45);
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const xx = x0 + fract(hash(k + a.x1) + t * 0.15) * w;
      ctx.beginPath();
      ctx.moveTo(xx, wy + 3 + k * 6);
      ctx.lineTo(Math.min(x0 + w, xx + 12), wy + 3 + k * 6);
      ctx.stroke();
    }
    return wy;
  };
  if (terr === 'pasture') {
    ctx.fillStyle = vg(ctx, top, top + 110, T(mix(P.ground.body, '#000000', 0.35)), T(P.ground.deep));
    ctx.fillRect(x0, top, w, bottom - top);
    waterPit(84, '#7ab0c8', '#ffffff');
  } else if (terr === 'cliffpath') {
    // the gorge: rock walls dropping into mist, the river a thread at the bottom
    ctx.fillStyle = vg(ctx, top, top + 260, T(mix(P.near, P.haze, 0.35)), T(mix(P.near, '#000000', 0.2)), T('#0a0c10'));
    ctx.fillRect(x0, top, w, bottom - top);
    ctx.fillStyle = vg(ctx, top + 60, top + 160, alpha('#ffffff', 0), alpha('#ffffff', 0.35));
    ctx.fillRect(x0, top + 60, w, 100);
    ctx.strokeStyle = T(mix(P.water, '#ffffff', 0.3));
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, top + 200);
    ctx.lineTo(x0 + w, top + 204);
    ctx.stroke();
  } else if (terr === 'lake') {
    ctx.fillStyle = vg(ctx, top, top + 60, T(mix(P.ground.body, '#000000', 0.3)), T(P.ground.deep));
    ctx.fillRect(x0, top, w, bottom - top);
    const wy = waterPit(46, P.water, '#ffffff');
    // so clear you can see the stones on the bottom
    ctx.fillStyle = alpha('#d8f0f0', 0.25);
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.ellipse(x0 + hash(a.x1 + k) * w, wy + 40 + hash(k * 3 + a.x1) * 30, 6, 3, 0, 0, TAU);
      ctx.fill();
    }
  } else return false;
  return true;
}

// ---------------------------------------------------------------- props

function logEnd(ctx, cx, cy, r, T) {
  ctx.fillStyle = T('#d8b080');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = alpha('#8a5a2a', 0.6);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.6, 0, TAU);
  ctx.moveTo(cx + r * 0.25, cy);
  ctx.arc(cx, cy, r * 0.25, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = T('#5a3a1e');
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.stroke();
}

function stone(ctx, x, y, w, h, T, base, light, seed) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, T(mix(base, light, 0.35)));
  g.addColorStop(1, T(mix(base, '#000000', 0.35)));
  ctx.fillStyle = g;
  ctx.beginPath();
  const r = mulberry32(seed);
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w * 0.05, y + h * (0.3 + r() * 0.2));
  ctx.lineTo(x + w * (0.3 + r() * 0.1), y + r() * h * 0.15);
  ctx.lineTo(x + w * (0.7 + r() * 0.1), y + r() * h * 0.1);
  ctx.lineTo(x + w * 0.96, y + h * (0.25 + r() * 0.2));
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

function bell(ctx, x, y, s, T, t, ph) {
  const sw = Math.sin(t * 3 + ph) * 0.25;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sw);
  ctx.strokeStyle = T('#c83a2a');
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 5 * s);
  ctx.stroke();
  ctx.fillStyle = vg(ctx, 5 * s, 14 * s, T('#f0d070'), T('#a8781a'));
  ctx.beginPath();
  ctx.moveTo(-3 * s, 5 * s);
  ctx.lineTo(3 * s, 5 * s);
  ctx.lineTo(5 * s, 14 * s);
  ctx.lineTo(-5 * s, 14 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = T('#5a3a10');
  ctx.beginPath();
  ctx.arc(0, 14.5 * s, 1.4 * s, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export const ALPINE_OB = {
  // ---------- Cowbell Pasture
  woodpile(ctx, o, T) {
    const { x, y, w, h } = o;
    // split logs stacked end-on against the cold, the way every chalet has them
    const r = 6.2;
    const rows = Math.floor(h / (r * 2));
    for (let row = 0; row < rows; row++) {
      const n = Math.floor(w / (r * 2)) - (row % 2);
      for (let k = 0; k < n; k++) logEnd(ctx, x + r + (row % 2) * r + k * r * 2, y + h - r - row * r * 1.85, r, T);
    }
    ctx.fillStyle = woodGrad(ctx, y - 2, 5, T, '#7a5a3a', '#5a4028', '#3a2818');
    ctx.fillRect(x - 3, y + h - rows * r * 1.85 - 4, w + 6, 4);
  },
  snakeFence(ctx, o, T) {
    const { x, y, w, h } = o;
    // a zigzag rail fence, rails crossed and laid one on another, no nails at all
    const n = Math.max(2, Math.round(w / 26));
    ctx.lineCap = 'round';
    for (let rail = 0; rail < 4; rail++) {
      const yy = y + h - 6 - rail * (h - 8) / 3.4;
      for (let k = 0; k < n; k++) {
        const x0 = x + (k * w) / n;
        const x1 = x + ((k + 1) * w) / n;
        const up = (k + rail) % 2;
        ctx.strokeStyle = T(rail % 2 ? '#8a6a44' : '#6a4a2e');
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x0, yy + (up ? 3 : -3));
        ctx.lineTo(x1, yy + (up ? -3 : 3));
        ctx.stroke();
      }
    }
    ctx.strokeStyle = T('#4a3220');
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = 0; k <= n; k++) {
      ctx.moveTo(x + (k * w) / n, y + h);
      ctx.lineTo(x + (k * w) / n + (k % 2 ? 4 : -4), y - 2);
    }
    ctx.stroke();
    ctx.lineCap = 'butt';
  },
  bellArch(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // the pasture gate: a beam on two posts, a carved board, cowbells hung all along it
    const post = T('#5a3e24');
    backPost(ctx, x - 8, y, o.ground, 9, post);
    backPost(ctx, x + w + 8, y, o.ground, 9, post);
    ctx.fillStyle = woodGrad(ctx, y, h * 0.4, T, '#9a6a3a', '#7a4e28', '#4a2e16');
    ctx.fillRect(x - 18, y, w + 36, h * 0.4);
    ctx.fillStyle = T('#3a2414');
    ctx.beginPath();
    ctx.moveTo(x - 24, y);
    ctx.lineTo(x + w / 2, y - 12);
    ctx.lineTo(x + w + 24, y);
    ctx.closePath();
    ctx.fill();
    // a carved heart and a row of notches
    ctx.fillStyle = T('#e8d0a0');
    ctx.beginPath();
    const hx = x + w / 2;
    const hy = y + h * 0.2;
    ctx.moveTo(hx, hy + 4);
    ctx.bezierCurveTo(hx - 7, hy - 2, hx - 3, hy - 7, hx, hy - 3);
    ctx.bezierCurveTo(hx + 3, hy - 7, hx + 7, hy - 2, hx, hy + 4);
    ctx.fill();
    for (let k = 0; k < 6; k++) {
      bell(ctx, x + (k + 0.5) * (w / 6), y + h * 0.4, k % 2 ? 1 : 1.25, T, t, k * 1.3 + o.seed);
    }
    void P;
  },
  woodStack(ctx, o, T) {
    const { x, y, w, h } = o;
    // a tall stack of firewood under its own little shingled roof, flat on top
    const roof = 10;
    ctx.fillStyle = woodGrad(ctx, y, roof, T, '#6a5a4a', '#4a3e34', '#2a221c');
    ctx.fillRect(x - 6, y, w + 12, roof);
    ctx.fillStyle = alpha('#000000', 0.3);
    for (let xx = x - 6; xx < x + w + 6; xx += 9) ctx.fillRect(xx, y + 2, 1, roof - 2);
    ctx.fillStyle = T('#3a2818');
    ctx.fillRect(x, y + roof, 5, h - roof);
    ctx.fillRect(x + w - 5, y + roof, 5, h - roof);
    const r = 6;
    const top = y + roof + 2;
    for (let yy = top + r; yy < y + h - r + 1; yy += r * 1.85) {
      const off = Math.round((yy - top) / (r * 1.85)) % 2 ? r : 0;
      for (let xx = x + 5 + r + off; xx < x + w - 5 - r + 1; xx += r * 2) logEnd(ctx, xx, yy, r, T);
    }
  },

  // ---------- Cliff Path
  scree(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a fan of fallen rock across the boards
    const r = mulberry32(o.seed);
    stone(ctx, x, y + h * 0.35, w * 0.55, h * 0.65, T, '#7a7e86', P.light, o.seed);
    stone(ctx, x + w * 0.38, y, w * 0.62, h, T, '#6a6e78', P.light, o.seed + 3);
    for (let k = 0; k < 8; k++) {
      ctx.fillStyle = T(mix('#8a8e96', '#4a4e56', r()));
      ctx.beginPath();
      ctx.ellipse(x - 6 + r() * (w + 12), y + h - 2 - r() * 4, 2 + r() * 4, 1.6 + r() * 2.4, 0, 0, TAU);
      ctx.fill();
    }
  },
  chainPosts(ctx, o, T) {
    const { x, y, w, h } = o;
    // iron posts sunk into the rock and a heavy chain slung between them
    const n = 3;
    for (let k = 0; k < n; k++) {
      const px = x + 4 + (k * (w - 8)) / (n - 1);
      ctx.fillStyle = vg(ctx, y, y + h, T('#5a5a62'), T('#24242a'));
      ctx.fillRect(px - 2.4, y + 4, 4.8, h - 4);
      ctx.fillStyle = T('#3a3a42');
      ctx.beginPath();
      ctx.arc(px, y + 4, 3.6, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = T('#8a8a92');
    ctx.lineWidth = 1.6;
    for (const dy of [8, h * 0.5]) {
      for (let k = 0; k < n - 1; k++) {
        const a = x + 4 + (k * (w - 8)) / (n - 1);
        const b = x + 4 + ((k + 1) * (w - 8)) / (n - 1);
        for (let j = 0; j < 8; j++) {
          const u = (j + 0.5) / 8;
          const cx = a + (b - a) * u;
          const cy = y + dy + Math.sin(u * Math.PI) * 7;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 2.6, j % 2 ? 1.2 : 1.8, 0, 0, TAU);
          ctx.stroke();
        }
      }
    }
  },
  overhang(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // the cliff leans out over the path here: duck, or knock your head
    const g = ctx.createLinearGradient(0, y - 60, 0, y + h);
    g.addColorStop(0, T('#5a5e66'));
    g.addColorStop(1, T('#3a3e46'));
    ctx.fillStyle = g;
    // the face comes down from far above and bulges out over the boards
    ctx.beginPath();
    ctx.moveTo(x + w + 90, y - 600);
    ctx.quadraticCurveTo(x + w + 70, y - 120, x + w + 20, y + h * 0.5);
    for (let k = 10; k >= 0; k--) ctx.lineTo(x + (k / 10) * w, y + h - hash(o.seed + k) * 10);
    ctx.quadraticCurveTo(x - 50, y + h * 0.2, x - 70, y - 60);
    ctx.lineTo(x - 40, y - 600);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha('#1a1c22', 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const cx = x + hash(o.seed * 3 + k) * w;
      ctx.moveTo(cx, y - 300);
      ctx.lineTo(cx + (hash(k) - 0.5) * 20, y + h * 0.7);
    }
    ctx.stroke();
    // drips and moss along the lip
    ctx.fillStyle = T('#4a6a3a');
    for (let k = 0; k < 8; k++) {
      ctx.beginPath();
      ctx.ellipse(x + hash(o.seed + k * 7) * w, y + h - 6, 6, 2.4, 0, 0, TAU);
      ctx.fill();
    }
    void P;
  },
  ladderRock(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a block of rock with iron rungs set into it, and a flat top worn smooth by boots
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, T(mix('#7e828c', P.light, 0.3)));
    g.addColorStop(1, T('#3e424a'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + h);
    ctx.lineTo(x - 3, y + 10);
    ctx.quadraticCurveTo(x - 2, y, x + 8, y);
    ctx.lineTo(x + w - 8, y);
    ctx.quadraticCurveTo(x + w + 2, y, x + w + 3, y + 10);
    ctx.lineTo(x + w + 8, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = alpha(P.light, 0.3);
    ctx.fillRect(x + 6, y, w - 12, 2);
    ctx.strokeStyle = alpha('#1a1c22', 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const cx = x + w * (0.45 + hash(o.seed + k) * 0.5);
      ctx.moveTo(cx, y + 4);
      ctx.lineTo(cx + (hash(k * 3) - 0.5) * 12, y + h);
    }
    ctx.stroke();
    ctx.strokeStyle = T('#2a2a30');
    ctx.lineWidth = 2.4;
    const lx = x + w * 0.2;
    for (let yy = y + 18; yy < y + h - 6; yy += 13) {
      ctx.beginPath();
      ctx.moveTo(lx, yy);
      ctx.lineTo(lx, yy + 4);
      ctx.lineTo(lx + 18, yy + 4);
      ctx.lineTo(lx + 18, yy);
      ctx.stroke();
    }
    ctx.fillStyle = T('#4a6a3a');
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.ellipse(x + w * (0.5 + hash(o.seed + k) * 0.45), y + 14 + hash(k * 3) * (h - 20), 5, 2.4, 0, 0, TAU);
      ctx.fill();
    }
  },

  // ---------- Turquoise Lake
  upturnedBoat(ctx, o, T) {
    const { x, y, w, h } = o;
    // a rowing boat turned over on the stones for the winter, painted long ago
    ctx.fillStyle = vg(ctx, y, y + h, T('#3a7ab0'), T('#1e4a74'));
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.quadraticCurveTo(x + 2, y + h * 0.2, x + w * 0.2, y);
    ctx.lineTo(x + w * 0.85, y);
    ctx.quadraticCurveTo(x + w + 4, y + h * 0.1, x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha('#0a1a2a', 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 1; k < 4; k++) {
      ctx.moveTo(x + 3, y + h * (k / 4));
      ctx.lineTo(x + w - 2, y + h * (k / 4));
    }
    ctx.stroke();
    ctx.fillStyle = T('#f0e6d0');
    ctx.fillRect(x, y + h - 5, w, 5);
    ctx.fillStyle = alpha('#ffffff', 0.25);
    ctx.fillRect(x + w * 0.22, y + 2, w * 0.6, 2);
    // an oar leaning on it
    ctx.strokeStyle = T('#c8a068');
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.7, y + h);
    ctx.lineTo(x + w + 10, y - 6);
    ctx.stroke();
    ctx.fillStyle = T('#c8a068');
    ctx.beginPath();
    ctx.ellipse(x + w + 12, y - 9, 3, 8, 0.7, 0, TAU);
    ctx.fill();
  },
  snag(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // the stump of a drowned pine, roots like antlers, bleached silver by the water
    ctx.strokeStyle = T(mix('#c8c0b0', P.light, 0.2));
    ctx.lineCap = 'round';
    const r = mulberry32(o.seed);
    for (let k = 0; k < 7; k++) {
      const a = Math.PI + 0.25 + (k / 6) * (Math.PI - 0.5);
      const len = h * (0.6 + r() * 0.5);
      ctx.lineWidth = 5 - k * 0.3;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + h - 6);
      const ex = x + w / 2 + Math.cos(a) * len * (w / h) * 0.8;
      const ey = y + h - 6 + Math.sin(a) * len;
      ctx.quadraticCurveTo(x + w / 2 + Math.cos(a) * len * 0.3, y + h - 6 + Math.sin(a) * len * 0.8, ex, ey);
      ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + (r() - 0.5) * 12, ey - 6 - r() * 4);
      ctx.stroke();
    }
    ctx.fillStyle = vg(ctx, y + h - 14, y + h, T('#a8a090'), T('#6a6458'));
    rr(ctx, x + w / 2 - 9, y + h - 14, 18, 14, 4);
    ctx.fill();
    ctx.lineCap = 'butt';
  },
  pineBough(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a big pine's lowest bough, swept down over the path
    const tx = x + w + 60;
    backPost(ctx, tx, o.ground - 700, o.ground, 18, T('#3a2a1e'));
    ctx.strokeStyle = T('#3a2a1e');
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(tx, y - 30);
    ctx.quadraticCurveTo(x + w * 0.5, y - 10, x - 30, y + h * 0.4);
    ctx.stroke();
    const r = mulberry32(o.seed);
    for (let k = 0; k < 26; k++) {
      const u = r();
      const bx = tx + (x - 30 - tx) * u;
      const by = y - 30 + (y + h * 0.4 - y + 30) * u * u + (r() - 0.2) * h * 0.6;
      ctx.fillStyle = T(mix('#1e4a30', '#3a6a40', r()));
      ctx.beginPath();
      ctx.moveTo(bx - 18, by);
      ctx.lineTo(bx, by - 5 - r() * 4);
      ctx.lineTo(bx + 18, by);
      ctx.lineTo(bx, by + 8 + r() * 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = T('#7a5030');
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.ellipse(x + w * (0.2 + k * 0.3), y + h * 0.75, 3, 5, 0, 0, TAU);
      ctx.fill();
    }
    void P;
  },
  jetty(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a jetty on piles, built out over the shallows, a rope and a lifebuoy
    const deck = 9;
    for (let k = 0; k < 5; k++) {
      const px = x + 6 + (k * (w - 12)) / 4;
      ctx.fillStyle = vg(ctx, y, y + h, T('#6a5038'), T('#2a2018'));
      ctx.fillRect(px - 4, y + deck, 8, h - deck);
    }
    ctx.strokeStyle = T('#4a3828');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + deck + 6);
    ctx.lineTo(x + w - 6, y + h - 10);
    ctx.moveTo(x + w - 6, y + deck + 6);
    ctx.lineTo(x + 6, y + h - 10);
    ctx.stroke();
    ctx.fillStyle = woodGrad(ctx, y, deck, T, '#b89068', '#8a6a48', '#5a4028');
    ctx.fillRect(x - 4, y, w + 8, deck);
    ctx.fillStyle = alpha('#000000', 0.3);
    for (let xx = x; xx < x + w; xx += 12) ctx.fillRect(xx, y, 1, deck);
    ctx.fillStyle = alpha(P.water || '#1aa8b0', 0.55);
    ctx.fillRect(x - 4, y + h - 12, w + 8, 12);
    const bx = x + w * 0.7;
    ctx.strokeStyle = T('#e8433a');
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(bx, y + deck + 12, 8, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = T('#ffffff');
    ctx.lineWidth = 4;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(bx, y + deck + 12, 8, (k / 4) * TAU, (k / 4) * TAU + 0.5);
      ctx.stroke();
    }
  },
};

// ---------------------------------------------------------------- foreground

/** Silhouettes for the foreground strip. False if the terrain is not ours. */
export function alpineForeground(g, kind, x, H, rng) {
  if (kind === 'pasture' || kind === 'lake') {
    for (let k = 0; k < 16; k++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 1.2;
      const l = 50 + rng() * 70;
      g.lineWidth = 2 + rng() * 3;
      g.beginPath();
      g.moveTo(x + (rng() - 0.5) * 40, H);
      g.quadraticCurveTo(x + Math.cos(a) * l * 0.4, H + Math.sin(a) * l * 0.7, x + Math.cos(a) * l, H + Math.sin(a) * l);
      g.stroke();
      if (kind === 'lake' && rng() < 0.3) {
        g.beginPath();
        g.ellipse(x + Math.cos(a) * l * 0.9, H + Math.sin(a) * l * 0.9, 3, 10, a + Math.PI / 2, 0, TAU);
        g.fill();
      }
    }
  } else if (kind === 'cliffpath') {
    g.beginPath();
    g.moveTo(x - 70, H);
    g.lineTo(x - 50, H - 80 - rng() * 40);
    g.lineTo(x + 10, H - 110 - rng() * 30);
    g.lineTo(x + 60, H - 50);
    g.lineTo(x + 80, H);
    g.fill();
  } else return false;
  return true;
}

// ---------------------------------------------------------------- finale

/** The end of the way down: a boathouse on the lake, the jetty, a boat, towels drying. */
export function drawLakeHouse(ctx, x, y, T, P, t, open) {
  // the boathouse, red boards and a steep roof, its doors open on the water
  const w = 170;
  const h = 90;
  ctx.fillStyle = woodGrad(ctx, y - h, h, T, '#b0442e', '#8a3424', '#5a1e14');
  ctx.fillRect(x, y - h, w, h);
  ctx.fillStyle = alpha('#000000', 0.25);
  for (let xx = x + 8; xx < x + w; xx += 8) ctx.fillRect(xx, y - h, 1, h);
  ctx.fillStyle = T('#2e2a2a');
  ctx.beginPath();
  ctx.moveTo(x - 16, y - h);
  ctx.lineTo(x + w / 2, y - h - 70);
  ctx.lineTo(x + w + 16, y - h);
  ctx.fill();
  ctx.fillStyle = T('#f0e6d0');
  ctx.fillRect(x - 2, y - h - 2, w + 4, 4);
  ctx.fillStyle = open ? T('#1a6a70') : T('#2a1a14');
  ctx.fillRect(x + 50, y - 64, 70, 64);
  ctx.fillStyle = T('#f0e6d0');
  ctx.fillRect(x + 76, y - h - 40, 18, 22);
  ctx.fillStyle = alpha('#9ad8ff', 0.6);
  ctx.fillRect(x + 79, y - h - 37, 12, 16);
  // the jetty out into the lake, a boat tied to it and towels on the rail
  const jx = x + w + 20;
  ctx.fillStyle = vg(ctx, y, y + 60, T(mix(P.water, '#ffffff', 0.3)), T(mix(P.water, '#000000', 0.3)));
  ctx.fillRect(jx - 10, y + 2, 420, 80);
  ctx.strokeStyle = alpha('#ffffff', 0.5);
  ctx.lineWidth = 1;
  for (let k = 0; k < 8; k++) {
    const lx = jx + fract(hash(k) + t * 0.05) * 400;
    ctx.beginPath();
    ctx.moveTo(lx, y + 8 + k * 6);
    ctx.lineTo(lx + 18, y + 8 + k * 6);
    ctx.stroke();
  }
  ctx.fillStyle = woodGrad(ctx, y - 8, 8, T, '#b89068', '#8a6a48', '#5a4028');
  ctx.fillRect(jx, y - 8, 260, 8);
  for (let k = 0; k < 6; k++) {
    ctx.fillStyle = T('#4a3828');
    ctx.fillRect(jx + 8 + k * 48, y, 6, 30);
  }
  ctx.fillStyle = T('#5a4028');
  ctx.fillRect(jx + 30, y - 34, 3, 26);
  ctx.fillRect(jx + 150, y - 34, 3, 26);
  ctx.fillRect(jx + 30, y - 34, 123, 3);
  const towels = ['#e8433a', '#f2c040', '#3a8ad8', '#f0e6d0'];
  for (let k = 0; k < 4; k++) {
    const sway = Math.sin(t * 1.5 + k) * 1.5;
    ctx.fillStyle = T(towels[k]);
    ctx.beginPath();
    ctx.moveTo(jx + 38 + k * 28, y - 32);
    ctx.lineTo(jx + 58 + k * 28, y - 32);
    ctx.lineTo(jx + 58 + k * 28 + sway, y - 14);
    ctx.lineTo(jx + 38 + k * 28 + sway, y - 14);
    ctx.fill();
  }
  const bob = Math.sin(t * 1.2) * 1.5;
  ctx.fillStyle = vg(ctx, y, y + 14, T('#f0e6d0'), T('#8a7a64'));
  ctx.beginPath();
  ctx.moveTo(jx + 180, y + 2 + bob);
  ctx.lineTo(jx + 250, y + 2 + bob);
  ctx.quadraticCurveTo(jx + 246, y + 14 + bob, jx + 230, y + 16 + bob);
  ctx.lineTo(jx + 192, y + 16 + bob);
  ctx.quadraticCurveTo(jx + 182, y + 12 + bob, jx + 180, y + 2 + bob);
  ctx.fill();
  ctx.fillStyle = T('#3a7ab0');
  ctx.fillRect(jx + 182, y + 2 + bob, 66, 3);
  // somebody already swimming
  const sx = jx + 320 + Math.sin(t * 0.4) * 20;
  ctx.fillStyle = T('#2a2016');
  ctx.beginPath();
  ctx.arc(sx, y + 20, 5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = alpha('#ffffff', 0.6);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(sx, y + 24, 12 + Math.sin(t * 3) * 2, 2.4, 0, 0, TAU);
  ctx.stroke();
}
