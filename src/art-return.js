// Chapter 5 world art: ground, pits, props, a swinging bucket, decor and the summer cabin.
// Same contract as art.js (world coordinates, tone function T applied to every colour).

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

export const RETURN_SEG = {
  geyser(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 140);
    // sinter laid down in thin sheets, stained by what lives in the warm water
    for (let k = 0; k < 7; k++) {
      ctx.fillStyle = alpha(k % 3 === 0 ? '#c8642a' : k % 3 === 1 ? '#ffffff' : '#e8a040', 0.12);
      ctx.fillRect(sx0, s.y + 12 + k * 13 + hash(k) * 4, sx1 - sx0, 3 + hash(k * 3) * 3);
    }
    topBand(ctx, s, sx0, sx1, T, G, 10, 1.4);
    ctx.fillStyle = alpha('#c8642a', 0.4);
    for (let x = Math.floor(sx0 / 37) * 37; x < sx1; x += 37) {
      if (hash(x * 5) < 0.5) continue;
      ctx.beginPath();
      ctx.ellipse(x + 10, s.y + 2, 10 + hash(x) * 10, 1.4, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = alpha('#38b0c2', 0.5);
    for (let x = Math.floor(sx0 / 83) * 83; x < sx1; x += 83) {
      if (hash(x * 7) < 0.6) continue;
      ctx.beginPath();
      ctx.ellipse(x + 20, s.y + 1, 12, 1.2, 0, 0, TAU);
      ctx.fill();
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#4a3a20', 0.4));
  },

  bamboo(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 130);
    ctx.strokeStyle = alpha('#0a0604', 0.35);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 47) * 47; x < sx1; x += 47) {
      if (hash(x) < 0.45) continue;
      // bamboo runners: straight, jointed roots just under the surface
      ctx.moveTo(x, s.y + 14);
      for (let k = 1; k <= 4; k++) ctx.lineTo(x + k * 14, s.y + 14 + (k % 2) * 3);
    }
    ctx.stroke();
    topBand(ctx, s, sx0, sx1, T, G, 9, 1);
    // a carpet of long, dry bamboo leaves
    for (let x = Math.floor(sx0 / 4) * 4; x < sx1; x += 4) {
      if (hash(x * 11) < 0.45) continue;
      ctx.strokeStyle = T(P.leaves[Math.floor(hash(x * 17) * P.leaves.length)]);
      ctx.lineWidth = 1.4;
      const a = (hash(x * 3) - 0.5) * 0.8;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * 5, s.y - Math.sin(a) * 2);
      ctx.lineTo(x + Math.cos(a) * 5, s.y + Math.sin(a) * 2);
      ctx.stroke();
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.5));
  },

  rainbow(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 180);
    // the ground is striped all the way down, like the hills
    const st = P.stripes;
    for (let k = 0; k < 12; k++) {
      const yy = s.y + 10 + k * 13;
      if (yy > bottom) break;
      ctx.fillStyle = T(mix(st[k % st.length], G.body, 0.25));
      ctx.beginPath();
      ctx.moveTo(sx0, yy);
      for (let x = Math.floor(sx0 / 30) * 30; x <= sx1 + 30; x += 30) ctx.lineTo(clamp(x, sx0, sx1), yy + (hash(x + k * 100) - 0.5) * 3);
      ctx.lineTo(sx1, yy + 9);
      ctx.lineTo(sx0, yy + 9);
      ctx.fill();
    }
    ctx.fillStyle = vg(ctx, s.y + 10, s.y + 170, alpha('#000000', 0), alpha('#000000', 0.45));
    ctx.fillRect(sx0, s.y + 10, sx1 - sx0, 160);
    topBand(ctx, s, sx0, sx1, T, G, 10, 1.6);
    ctx.fillStyle = T('#8a4a2a');
    for (let x = Math.floor(sx0 / 14) * 14; x < sx1; x += 14) {
      if (hash(x * 7) < 0.6) continue;
      ctx.beginPath();
      ctx.arc(x, s.y - 1, 1.2 + hash(x) * 1.8, Math.PI, 0);
      ctx.fill();
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#200804', 0.5));
  },

  tulips(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 110);
    // furrowed bulb beds
    ctx.strokeStyle = alpha('#140c06', 0.3);
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.moveTo(sx0, s.y + 16 + k * 12);
      ctx.lineTo(sx1, s.y + 16 + k * 12);
      ctx.stroke();
    }
    topBand(ctx, s, sx0, sx1, T, G, 10, 0.8);
    blades(ctx, s, sx0, sx1, T(G.top), 3, 6, 3.6);
    // a row of tulips along the back edge of the path
    for (let x = Math.ceil(sx0 / 7) * 7; x < sx1; x += 7) {
      const h = 9 + hash(x * 3) * 5;
      ctx.strokeStyle = T('#4a7a30');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, s.y + 1);
      ctx.lineTo(x, s.y - h);
      ctx.stroke();
      ctx.fillStyle = T(P.petals[Math.floor(hash(x * 13) * P.petals.length)]);
      ctx.beginPath();
      ctx.ellipse(x, s.y - h - 2, 2, 3, 0, 0, TAU);
      ctx.fill();
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
  },

  glacier(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 200, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    // old ice: blue bands and trapped bubbles
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = alpha(k % 2 ? '#d8ecff' : '#2a5a9a', 0.14);
      ctx.fillRect(sx0, s.y + 16 + k * 20 + hash(k) * 6, sx1 - sx0, 4 + hash(k * 3) * 4);
    }
    ctx.fillStyle = alpha('#ffffff', 0.35);
    for (let x = Math.floor(sx0 / 13) * 13; x < sx1; x += 13) {
      if (hash(x * 3) < 0.6) continue;
      ctx.beginPath();
      ctx.arc(x, s.y + 20 + hash(x * 7) * 90, 0.8 + hash(x) * 1.4, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = alpha('#1a3a6a', 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 53) * 53; x < sx1; x += 53) {
      if (hash(x * 5) < 0.5) continue;
      ctx.moveTo(x, s.y + 6);
      ctx.lineTo(x + 6, s.y + 26);
      ctx.lineTo(x + 2, s.y + 50);
    }
    ctx.stroke();
    topBand(ctx, s, sx0, sx1, T, G, 11, 1.8);
    ctx.fillStyle = alpha('#9ac0e8', 0.5);
    ctx.fillRect(sx0, s.y + 9, sx1 - sx0, 2);
    for (let x = Math.floor(sx0 / 13) * 13; x < sx1; x += 13) {
      const h = hash(x * 19);
      if (h < 0.7) continue;
      ctx.fillStyle = alpha('#ffffff', (0.5 + 0.5 * Math.sin(t * 4 + x)) * 0.9);
      ctx.fillRect(x, s.y + 1 + h * 6, 1.4, 1.4);
    }
    const icicles = (ex, dir) => {
      ctx.fillStyle = alpha('#dceaff', 0.9);
      for (let k = 0; k < 4; k++) {
        const ix = ex + dir * (3 + k * 5);
        const ih = 6 + hash(ix) * 12;
        ctx.beginPath();
        ctx.moveTo(ix - 2, s.y + 11);
        ctx.lineTo(ix + 2, s.y + 11);
        ctx.lineTo(ix, s.y + 11 + ih);
        ctx.fill();
      }
    };
    if (openL && s.x0 >= sx0) icicles(s.x0, 1);
    if (openR && s.x1 <= sx1) icicles(s.x1, -1);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#0a1a3a', 0.45));
  },

  home(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 110);
    ctx.fillStyle = alpha('#140c06', 0.32);
    ctx.fillRect(sx0, s.y + 8, sx1 - sx0, 10);
    ctx.fillStyle = alpha('#000000', 0.16);
    for (let x = Math.floor(sx0 / 37) * 37; x < sx1; x += 37) {
      const h = hash(x);
      if (h < 0.35) continue;
      ctx.beginPath();
      ctx.ellipse(x + h * 20, s.y + 22 + hash(x * 3) * 80, 3 + h * 6, 2 + h * 3, 0, 0, TAU);
      ctx.fill();
    }
    topBand(ctx, s, sx0, sx1, T, G, 11, 0.6);
    // the worn path, flat stones set in the grass, and daisies either side
    ctx.fillStyle = T(mix('#a89a84', G.top, 0.3));
    for (let x = Math.floor(sx0 / 46) * 46; x < sx1; x += 46) {
      ctx.beginPath();
      ctx.ellipse(x + 14 + hash(x) * 8, s.y + 2, 11, 2.6, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = T('#f6f2e6');
    for (let x = Math.floor(sx0 / 11) * 11; x < sx1; x += 11) if (hash(x * 9) > 0.72) ctx.fillRect(x, s.y - 4 - hash(x) * 3, 2, 2);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
    blades(ctx, s, sx0, sx1, T(G.top), 3, 8, 3.2);
    blades(ctx, s, sx0, sx1, T(G.top2), 2, 6, 5.1, 1);
  },
};

/** Pits for the chapter 5 terrains. Returns false when the terrain is not one of ours. */
export function returnPit(ctx, terr, P, T, a, b, bottom, t) {
  const top = Math.max(a.y, b.y) + 1;
  const x0 = a.x1;
  const w = b.x0 - a.x1;
  const waterPit = (depth, water, glint) => {
    const wy = top + depth;
    ctx.fillStyle = vg(ctx, wy, wy + 60, T(mix(water, '#ffffff', 0.2)), T(mix(water, '#000000', 0.45)));
    ctx.fillRect(x0, wy, w, bottom - wy);
    ctx.strokeStyle = alpha(glint, 0.4);
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const xx = x0 + fract(hash(k + a.x1) + t * 0.12) * w;
      ctx.beginPath();
      ctx.moveTo(xx, wy + 3 + k * 6);
      ctx.lineTo(Math.min(x0 + w, xx + 12), wy + 3 + k * 6);
      ctx.stroke();
    }
  };
  if (terr === 'geyser') {
    ctx.fillStyle = vg(ctx, top, top + 100, T(mix(P.ground.body, '#c8642a', 0.3)), T(P.ground.deep));
    ctx.fillRect(x0, top, w, bottom - top);
    waterPit(70, P.water, '#ffffff');
    for (let k = 0; k < 4; k++) {
      const p = fract(t * 0.3 + k / 4 + hash(a.x1) * 0.3);
      ctx.fillStyle = `rgba(240,244,246,${0.25 * (1 - p)})`;
      ctx.beginPath();
      ctx.arc(x0 + w * (0.3 + 0.15 * k), top + 70 - p * 90, 8 + p * 16, 0, TAU);
      ctx.fill();
    }
  } else if (terr === 'bamboo' || terr === 'home') {
    ctx.fillStyle = vg(ctx, top, top + 120, T(mix(P.ground.body, '#000000', 0.35)), T(P.ground.deep));
    ctx.fillRect(x0, top, w, bottom - top);
    waterPit(88, P.water || '#6a8a8a', P.light);
  } else if (terr === 'rainbow') {
    const st = P.stripes;
    for (let k = 0; k < 14; k++) {
      ctx.fillStyle = T(mix(mix(st[k % st.length], '#000000', 0.35 + k * 0.04), P.ground.deep, 0.3));
      ctx.fillRect(x0, top + k * 14, w, 15);
    }
    ctx.fillStyle = vg(ctx, top, top + 200, alpha('#000000', 0.3), alpha('#000000', 0.85));
    ctx.fillRect(x0, top, w, bottom - top);
  } else if (terr === 'tulips') {
    ctx.fillStyle = vg(ctx, top, top + 60, T(mix(P.ground.body, '#000000', 0.3)), T(P.ground.deep));
    ctx.fillRect(x0, top, w, bottom - top);
    waterPit(50, P.water, '#fff2dc');
  } else if (terr === 'glacier') {
    ctx.fillStyle = vg(ctx, top, top + 220, '#bcdcf8', '#2a5a9a', '#050a1a');
    ctx.fillRect(x0, top, w, bottom - top);
    ctx.fillStyle = alpha('#ffffff', 0.3);
    for (let k = 0; k < 6; k++) ctx.fillRect(x0 + 2, top + 10 + k * 20, Math.max(2, w * (0.1 + hash(k + a.x1) * 0.25)), 1.2);
  } else return false;
  return true;
}

// ---------------------------------------------------------------- props

function culm(ctx, x0, y0, x1, y1, w, T, col) {
  const g = ctx.createLinearGradient(x0 - w, y0, x0 + w, y0);
  g.addColorStop(0, T(mix(col, '#ffffff', 0.25)));
  g.addColorStop(1, T(mix(col, '#000000', 0.3)));
  ctx.strokeStyle = g;
  ctx.lineWidth = w;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.floor(len / 30);
  ctx.strokeStyle = T(mix(col, '#2a3a10', 0.5));
  ctx.lineWidth = 1.4;
  for (let k = 1; k <= n; k++) {
    const u = k / (n + 1);
    const px = x0 + (x1 - x0) * u;
    const py = y0 + (y1 - y0) * u;
    const nx = -(y1 - y0) / len;
    const ny = (x1 - x0) / len;
    ctx.beginPath();
    ctx.moveTo(px - nx * w * 0.55, py - ny * w * 0.55);
    ctx.lineTo(px + nx * w * 0.55, py + ny * w * 0.55);
    ctx.stroke();
  }
  ctx.lineCap = 'round';
}

function leafSpray(ctx, x, y, s, T, col, seed) {
  const r = mulberry32(seed);
  ctx.fillStyle = T(col);
  for (let k = 0; k < 7; k++) {
    const a = (r() - 0.5) * 2.6 + (r() < 0.5 ? 0 : Math.PI);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 0.5, -s * 0.13, s, 0);
    ctx.quadraticCurveTo(s * 0.5, s * 0.13, 0, 0);
    ctx.fill();
    ctx.restore();
  }
}

function stripedRock(ctx, x, y, w, h, T, P, seed, top) {
  const st = P.stripes;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + 2, y + (top ? 0 : h * 0.2));
  ctx.lineTo(x + w - 2, y);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.clip();
  for (let k = 0; k < Math.ceil(h / 7); k++) {
    ctx.fillStyle = T(mix(st[(seed + k) % st.length], '#000000', 0.08));
    ctx.fillRect(x - 2, y + k * 7, w + 4, 7.5);
  }
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, alpha(P.light, 0.18));
  g.addColorStop(1, alpha('#3a1008', 0.35));
  ctx.fillStyle = g;
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.restore();
}

function iceBody(ctx, pts, x, y, w, h, T) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, 'rgba(236,246,255,0.96)');
  g.addColorStop(0.5, 'rgba(150,196,236,0.94)');
  g.addColorStop(1, 'rgba(70,120,190,0.94)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const [px, py] of pts) ctx.lineTo(px, py);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(pts[0][0] + 3, pts[0][1] - 4);
  ctx.lineTo(pts[1][0] + 3, pts[1][1] + 3);
  ctx.stroke();
  void T;
}

export const RETURN_OB = {
  // ---------- Geyser Basin
  sinterMound(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, T('#f6f0e0'));
    g.addColorStop(1, T('#b8a888'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + h);
    ctx.quadraticCurveTo(x + w * 0.15, y + h * 0.15, x + w * 0.5, y);
    ctx.quadraticCurveTo(x + w * 0.85, y + h * 0.15, x + w + 4, y + h);
    ctx.fill();
    ctx.strokeStyle = alpha('#c8642a', 0.6);
    ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(x + w * (0.4 + k * 0.1), y + 4);
      ctx.quadraticCurveTo(x + w * (0.3 + k * 0.2), y + h * 0.5, x + w * (0.2 + k * 0.3), y + h);
      ctx.stroke();
    }
    const p = fract(t * 0.4 + hash(o.seed));
    ctx.fillStyle = `rgba(240,244,246,${0.25 * (1 - p)})`;
    ctx.beginPath();
    ctx.arc(x + w * 0.5 + p * 8, y - 4 - p * 30, 5 + p * 10, 0, TAU);
    ctx.fill();
    void P;
  },
  geyserVent(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a boiling vent: a crusted rim, a blue pool, and a steady spurt of steam and spray
    const rim = h * 0.4;
    ctx.fillStyle = vg(ctx, y + h - rim, y + h, T('#f2ead6'), T('#a8946c'));
    ctx.beginPath();
    ctx.moveTo(x - 4, y + h);
    ctx.quadraticCurveTo(x + 2, y + h - rim, x + w * 0.2, y + h - rim);
    ctx.lineTo(x + w * 0.8, y + h - rim);
    ctx.quadraticCurveTo(x + w - 2, y + h - rim, x + w + 4, y + h);
    ctx.fill();
    ctx.fillStyle = T('#2aa0c0');
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - rim, w * 0.3, 3, 0, 0, TAU);
    ctx.fill();
    const k = 0.75 + 0.25 * Math.sin(t * 7 + o.seed);
    const sh = h * 0.6 * k;
    const g = ctx.createLinearGradient(0, y + h - rim - sh, 0, y + h - rim);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(250,252,255,0.9)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.42, y + h - rim);
    ctx.lineTo(x + w * 0.4, y + h - rim - sh);
    ctx.lineTo(x + w * 0.6, y + h - rim - sh);
    ctx.lineTo(x + w * 0.58, y + h - rim);
    ctx.fill();
    for (let j = 0; j < 4; j++) {
      const p = fract(t * 0.6 + j / 4);
      ctx.fillStyle = `rgba(240,244,246,${0.4 * (1 - p)})`;
      ctx.beginPath();
      ctx.arc(x + w * 0.5 + Math.sin(p * 5 + j) * 6, y + h - rim - sh - p * 34, 6 + p * 12, 0, TAU);
      ctx.fill();
    }
    void P;
  },
  trailArch(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const post = T(mix('#6a4a2e', P.haze, 0.1));
    backPost(ctx, x - 6, y, o.ground, 9, post);
    backPost(ctx, x + w + 6, y, o.ground, 9, post);
    ctx.fillStyle = woodGrad(ctx, y, h, T, '#9a6a3a', '#7a4e28', '#4a2e16');
    ctx.fillRect(x - 16, y, w + 32, h * 0.7);
    ctx.fillStyle = T('#3a2414');
    ctx.fillRect(x - 20, y - 4, w + 40, 6);
    // routed letters, pale against the stained wood
    ctx.fillStyle = T('#e8d8b0');
    const n = Math.floor((w - 10) / 9);
    for (let k = 0; k < n; k++) {
      if (k === Math.floor(n / 2)) continue;
      const lh = h * 0.28;
      ctx.fillRect(x + 6 + k * 9, y + h * 0.2, 5, 1.6);
      ctx.fillRect(x + 6 + k * 9 + (k % 2) * 3, y + h * 0.2, 1.6, lh);
    }
    ctx.fillStyle = T('#5a3a20');
    ctx.fillRect(x - 6, y + h * 0.7, 9, h * 0.3);
    ctx.fillRect(x + w - 3, y + h * 0.7, 9, h * 0.3);
  },
  sinterTerrace(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // stepped terraces of travertine, each lip holding a shallow warm pool
    const steps = 3;
    for (let i = 0; i < steps; i++) {
      const sy = y + (h / steps) * i;
      const inset = (steps - 1 - i) * 10;
      const sw = w - inset * 2 + i * 0;
      ctx.fillStyle = vg(ctx, sy, sy + h / steps, T('#f8f2e6'), T(mix('#d8c8a0', '#c8642a', 0.15 + i * 0.1)));
      ctx.fillRect(x + inset - i * 6, sy, sw + i * 12, h - (h / steps) * i);
      ctx.fillStyle = T('#7ac8c0');
      ctx.fillRect(x + inset - i * 6 + 4, sy + 1, sw + i * 12 - 8, 2.4);
      ctx.strokeStyle = alpha('#c8642a', 0.5);
      ctx.lineWidth = 1;
      for (let k = 0; k < 6; k++) {
        const dx = x + inset - i * 6 + 6 + k * ((sw + i * 12 - 12) / 5);
        ctx.beginPath();
        ctx.moveTo(dx, sy + 4);
        ctx.quadraticCurveTo(dx + 2, sy + h / steps / 2, dx - 1, sy + h / steps);
        ctx.stroke();
      }
    }
    ctx.fillStyle = T('#ffffff');
    ctx.fillRect(x + 20, y - 1, w - 40, 3);
    void P;
  },

  // ---------- Bamboo Forest
  bambooBundle(ctx, o, T) {
    const { x, y, w, h } = o;
    const rows = 3;
    const r = h / rows / 2;
    for (let row = 0; row < rows; row++) {
      const yy = y + h - r - row * r * 1.8;
      culm(ctx, x + row * 4, yy, x + w - row * 4, yy, r * 2, T, '#b8b060');
      const n = Math.max(2, Math.floor((w - row * 8) / (r * 2.2)));
      for (let k = 0; k < n; k++) {
        ctx.fillStyle = T('#e8dca0');
        ctx.beginPath();
        ctx.ellipse(x + row * 4 + 2, yy - r * 0.6 + (k / n) * r * 1.2, 1.6, r * 0.5, 0, 0, TAU);
        ctx.fill();
      }
    }
    ctx.strokeStyle = T('#7a5a2a');
    ctx.lineWidth = 2.4;
    for (const fx of [0.3, 0.7]) {
      ctx.beginPath();
      ctx.moveTo(x + w * fx, y + 2);
      ctx.lineTo(x + w * fx, y + h);
      ctx.stroke();
    }
  },
  bambooStumps(ctx, o, T) {
    const { x, y, w, h } = o;
    // cut culms, angled sharp: nowhere to put a foot
    const n = 5;
    for (let k = 0; k < n; k++) {
      const sx = x + 4 + k * ((w - 8) / (n - 1));
      const sh = h * (0.55 + hash(o.seed + k) * 0.45);
      const sw = 7 + hash(o.seed * 3 + k) * 3;
      const g = ctx.createLinearGradient(sx - sw / 2, 0, sx + sw / 2, 0);
      g.addColorStop(0, T('#c8c070'));
      g.addColorStop(1, T('#6a6a2a'));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx - sw / 2, y + h);
      ctx.lineTo(sx - sw / 2, y + h - sh + 6);
      ctx.lineTo(sx + sw / 2, y + h - sh);
      ctx.lineTo(sx + sw / 2, y + h);
      ctx.fill();
      ctx.fillStyle = T('#f0e8b0');
      ctx.beginPath();
      ctx.moveTo(sx - sw / 2, y + h - sh + 6);
      ctx.lineTo(sx + sw / 2, y + h - sh);
      ctx.lineTo(sx + sw / 2, y + h - sh + 2.4);
      ctx.lineTo(sx - sw / 2, y + h - sh + 8.4);
      ctx.fill();
      ctx.fillStyle = alpha('#3a3a10', 0.5);
      ctx.fillRect(sx - sw / 2, y + h - sh * 0.45, sw, 1.4);
    }
  },
  leaningBamboo(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a few culms have leant over the path, the way bamboo does after a storm
    const gx = x + w + 50;
    for (let k = 0; k < 3; k++) {
      const yy = y + h * (0.25 + k * 0.28);
      culm(ctx, gx + k * 6, o.ground + 4, x - 70 - k * 20, yy - 18 - k * 4, 10 - k * 1.5, T, mix('#8aa040', P.haze, 0.05));
    }
    leafSpray(ctx, x - 50, y - 10, 26, T, '#5a8a3a', o.seed);
    leafSpray(ctx, x + w * 0.3, y + 2, 22, T, '#6a9a44', o.seed + 3);
    leafSpray(ctx, x - 70, y + 8, 22, T, '#4a7a30', o.seed + 7);
  },
  bambooPlatform(ctx, o, T) {
    const { x, y, w, h } = o;
    const deck = 10;
    for (const lx of [x + 8, x + w * 0.5, x + w - 8]) culm(ctx, lx, y + h, lx, y + deck, 8, T, '#b8b060');
    ctx.strokeStyle = T('#7a5a2a');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + h - 6);
    ctx.lineTo(x + w * 0.5, y + deck + 8);
    ctx.lineTo(x + w - 10, y + h - 6);
    ctx.stroke();
    ctx.fillStyle = woodGrad(ctx, y, deck, T, '#b08a5a', '#8a6a44', '#5a4024');
    ctx.fillRect(x - 4, y, w + 8, deck);
    ctx.fillStyle = alpha('#000000', 0.3);
    for (let xx = x + 8; xx < x + w; xx += 14) ctx.fillRect(xx, y, 1.2, deck);
  },

  // ---------- Painted Hills
  rockStack(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const r = mulberry32(o.seed);
    const n = 4;
    let yy = y + h;
    for (let k = 0; k < n; k++) {
      const sw = w * (1 - k * 0.14) * (0.9 + r() * 0.15);
      const sh = (h / n) * (0.9 + r() * 0.2);
      const sx = x + (w - sw) / 2 + (r() - 0.5) * 4;
      stripedRock(ctx, sx, yy - sh, sw, sh, T, P, o.seed + k, true);
      yy -= sh * 0.95;
    }
  },
  sage(ctx, o, T) {
    const { x, y, w, h } = o;
    const cx = x + w / 2;
    const r = mulberry32(o.seed);
    ctx.strokeStyle = T('#5a4a3a');
    ctx.lineCap = 'round';
    for (let k = 0; k < 14; k++) {
      const a = -Math.PI / 2 + (k / 13 - 0.5) * 2.6;
      const len = h * (0.75 + r() * 0.35);
      const ex = cx + Math.cos(a) * len * (w / h) * 0.6;
      const ey = y + h + Math.sin(a) * len;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + (r() - 0.5) * 8, y + h);
      ctx.quadraticCurveTo((cx + ex) / 2 + (r() - 0.5) * 10, (y + h + ey) / 2, ex, ey);
      ctx.stroke();
    }
    ctx.fillStyle = T('#9aa88a');
    for (let k = 0; k < 40; k++) {
      const u = r();
      ctx.beginPath();
      ctx.ellipse(x + 4 + u * (w - 8), y + h * (0.12 + 0.55 * Math.pow(2 * u - 1, 2)) + r() * h * 0.45, 3, 1.8, r() * 3, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = T('#e8dcc0');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const px = x + r() * w;
      const py = y + r() * h * 0.5;
      ctx.moveTo(px, py);
      ctx.lineTo(px + (r() - 0.5) * 8, py - 5);
    }
    ctx.stroke();
  },
  sandArch(ctx, o, T, P) {
    const { x, y, w, h } = o;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - 30, o.ground);
    ctx.lineTo(x - 26, y + h * 0.6);
    ctx.quadraticCurveTo(x - 20, y - 8, x + w * 0.5, y - 6);
    ctx.quadraticCurveTo(x + w + 20, y - 8, x + w + 26, y + h * 0.6);
    ctx.lineTo(x + w + 32, o.ground);
    ctx.lineTo(x + w + 6, o.ground);
    ctx.lineTo(x + w - 4, y + h);
    ctx.quadraticCurveTo(x + w * 0.5, y + h + 4, x + 4, y + h);
    ctx.lineTo(x - 6, o.ground);
    ctx.closePath();
    ctx.clip();
    const st = P.stripes;
    for (let k = 0; k < Math.ceil((o.ground - y + 20) / 8); k++) {
      ctx.fillStyle = T(mix(st[(o.seed + k) % st.length], '#5a2a14', 0.15));
      ctx.fillRect(x - 40, y - 10 + k * 8, w + 80, 8.5);
    }
    const g = ctx.createLinearGradient(x - 30, 0, x + w + 30, 0);
    g.addColorStop(0, alpha(P.light, 0.2));
    g.addColorStop(1, alpha('#3a1008', 0.35));
    ctx.fillStyle = g;
    ctx.fillRect(x - 40, y - 10, w + 80, o.ground - y + 20);
    ctx.restore();
  },
  mesaStep(ctx, o, T, P) {
    const { x, y, w, h } = o;
    stripedRock(ctx, x - 4, y, w + 8, h, T, P, o.seed, true);
    ctx.fillStyle = T('#f0c890');
    ctx.fillRect(x - 2, y - 2, w + 4, 4);
    ctx.strokeStyle = alpha('#3a1008', 0.3);
    ctx.lineWidth = 1;
    for (let k = 1; k < 5; k++) {
      ctx.beginPath();
      ctx.moveTo(x + (w * k) / 5, y + 6);
      ctx.lineTo(x + (w * k) / 5 + (hash(o.seed + k) - 0.5) * 6, y + h);
      ctx.stroke();
    }
  },

  // ---------- Tulip Fields
  tulipCrate(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const ch = h * 0.6;
    ctx.fillStyle = woodGrad(ctx, y + h - ch, ch, T, '#c8a068', '#a07a48', '#6a4a28');
    ctx.fillRect(x, y + h - ch, w, ch);
    ctx.fillStyle = alpha('#000000', 0.25);
    for (let yy = y + h - ch + ch / 3; yy < y + h; yy += ch / 3) ctx.fillRect(x, yy, w, 1.2);
    // bunches of tulips standing up out of it
    const n = Math.floor(w / 7);
    for (let k = 0; k < n; k++) {
      const tx = x + 4 + k * ((w - 8) / Math.max(1, n - 1));
      const th = h - ch + 2 + hash(o.seed + k) * 4;
      ctx.strokeStyle = T('#4a7a30');
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tx, y + h - ch);
      ctx.lineTo(tx, y + h - ch - th + 4);
      ctx.stroke();
      ctx.fillStyle = T(P.petals[(o.seed + Math.floor(k / 3)) % P.petals.length]);
      ctx.beginPath();
      ctx.ellipse(tx, y + h - ch - th + 3, 2.6, 3.6, 0, 0, TAU);
      ctx.fill();
    }
  },
  bicycle(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const wr = h * 0.32;
    const b = y + h;
    ctx.strokeStyle = T('#2a2a2e');
    ctx.lineWidth = 2;
    for (const wx of [x + wr, x + w - wr]) {
      ctx.beginPath();
      ctx.arc(wx, b - wr, wr, 0, TAU);
      ctx.stroke();
      ctx.lineWidth = 0.8;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(wx + Math.cos(a) * wr, b - wr + Math.sin(a) * wr);
        ctx.lineTo(wx - Math.cos(a) * wr, b - wr - Math.sin(a) * wr);
        ctx.stroke();
      }
      ctx.lineWidth = 2;
    }
    const frame = T('#3a6a5a');
    ctx.strokeStyle = frame;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + wr, b - wr);
    ctx.lineTo(x + w * 0.45, b - wr);
    ctx.lineTo(x + w * 0.38, y + h * 0.3);
    ctx.lineTo(x + wr, b - wr);
    ctx.moveTo(x + w * 0.45, b - wr);
    ctx.lineTo(x + w * 0.72, y + h * 0.32);
    ctx.lineTo(x + w - wr, b - wr);
    ctx.moveTo(x + w * 0.38, y + h * 0.3);
    ctx.lineTo(x + w * 0.72, y + h * 0.32);
    ctx.stroke();
    ctx.fillStyle = T('#2a2a2e');
    ctx.fillRect(x + w * 0.32, y + h * 0.22, 10, 3);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.72, y + h * 0.32);
    ctx.lineTo(x + w * 0.7, y + h * 0.08);
    ctx.lineTo(x + w * 0.62, y + h * 0.06);
    ctx.stroke();
    // a basket on the front, full of tulips
    ctx.fillStyle = T('#a8844a');
    ctx.fillRect(x + w * 0.74, y + h * 0.1, 14, 10);
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = T(P.petals[k % P.petals.length]);
      ctx.beginPath();
      ctx.ellipse(x + w * 0.74 + 2 + k * 3.4, y + h * 0.08, 2, 3, 0, 0, TAU);
      ctx.fill();
    }
  },
  flowerArch(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    const post = T('#f0ece4');
    backPost(ctx, x - 6, y, o.ground, 7, post);
    backPost(ctx, x + w + 6, y, o.ground, 7, post);
    ctx.fillStyle = T('#f4f0e8');
    ctx.fillRect(x - 14, y, w + 28, h * 0.35);
    ctx.fillStyle = alpha('#000000', 0.15);
    ctx.fillRect(x - 14, y + h * 0.35 - 2, w + 28, 2);
    // a garland of flowers along the beam and hanging from it
    const r = mulberry32(o.seed);
    for (let k = 0; k < 34; k++) {
      ctx.fillStyle = T(k % 4 === 0 ? '#4a7a30' : P.petals[k % P.petals.length]);
      const gx = x - 14 + r() * (w + 28);
      const sag = Math.sin(((gx - x + 14) / (w + 28)) * Math.PI) * h * 0.45;
      ctx.beginPath();
      ctx.arc(gx, y + h * 0.35 + r() * 4 + sag * r(), 3 + r() * 2, 0, TAU);
      ctx.fill();
    }
    const sway = Math.sin(t * 2 + o.seed) * 1.5;
    for (let k = 0; k < 5; k++) {
      const gx = x + (k + 0.5) * (w / 5);
      ctx.strokeStyle = T('#4a7a30');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, y + h * 0.35);
      ctx.lineTo(gx + sway, y + h - 4);
      ctx.stroke();
      ctx.fillStyle = T(P.petals[(o.seed + k) % P.petals.length]);
      ctx.beginPath();
      ctx.ellipse(gx + sway, y + h - 3, 2.4, 3.4, 0, 0, TAU);
      ctx.fill();
    }
  },
  tulipCart(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const wr = 16;
    // a flower seller's cart: tiers of buckets under a flat board you can stand on
    ctx.fillStyle = woodGrad(ctx, y, h - wr, T, '#5a8ab0', '#3e6a8e', '#24445e');
    ctx.fillRect(x, y + 8, w, h - wr - 8);
    for (let tier = 0; tier < 2; tier++) {
      const ty = y + 16 + tier * ((h - wr - 20) / 2);
      const n = Math.floor(w / 18);
      for (let k = 0; k < n; k++) {
        const bx = x + 6 + k * ((w - 12) / n);
        ctx.fillStyle = T('#c8ccd0');
        ctx.fillRect(bx, ty + 8, 12, 10);
        for (let j = 0; j < 3; j++) {
          ctx.fillStyle = T(P.petals[(o.seed + k + tier + j) % P.petals.length]);
          ctx.beginPath();
          ctx.ellipse(bx + 3 + j * 3, ty + 6 - (j % 2) * 2, 2, 3, 0, 0, TAU);
          ctx.fill();
        }
      }
    }
    ctx.fillStyle = woodGrad(ctx, y, 8, T, '#c8a068', '#a07a48', '#6a4a28');
    ctx.fillRect(x - 6, y, w + 12, 8);
    for (const wx of [x + w * 0.2, x + w * 0.8]) {
      ctx.fillStyle = T('#2a2016');
      ctx.beginPath();
      ctx.arc(wx, y + h - wr, wr, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = T('#8a7a5a');
      ctx.lineWidth = 1.4;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU;
        ctx.beginPath();
        ctx.moveTo(wx, y + h - wr);
        ctx.lineTo(wx + Math.cos(a) * wr * 0.85, y + h - wr + Math.sin(a) * wr * 0.85);
        ctx.stroke();
      }
    }
  },

  // ---------- Glacier Bay
  iceChunk(ctx, o, T) {
    const { x, y, w, h } = o;
    const r = mulberry32(o.seed);
    const pts = [
      [x - 2, y + h],
      [x + 2 + r() * 6, y + h * 0.3],
      [x + w * 0.3, y + r() * 4],
      [x + w * 0.7, y + 2 + r() * 4],
      [x + w - 2, y + h * 0.4],
      [x + w + 2, y + h],
    ];
    iceBody(ctx, pts, x, y, w, h, T);
    ctx.fillStyle = '#f4f8ff';
    ctx.fillRect(x + w * 0.25, y + 1, w * 0.5, 3);
  },
  iceArch(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const g = ctx.createLinearGradient(x - 30, y, x + w + 30, o.ground);
    g.addColorStop(0, 'rgba(236,246,255,0.95)');
    g.addColorStop(0.5, 'rgba(140,190,236,0.93)');
    g.addColorStop(1, 'rgba(60,110,180,0.93)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 30, o.ground);
    ctx.lineTo(x - 26, y + h * 0.6);
    ctx.quadraticCurveTo(x - 20, y - 8, x + w * 0.5, y - 6);
    ctx.quadraticCurveTo(x + w + 20, y - 8, x + w + 26, y + h * 0.6);
    ctx.lineTo(x + w + 32, o.ground);
    ctx.lineTo(x + w + 6, o.ground);
    ctx.lineTo(x + w - 4, y + h);
    ctx.quadraticCurveTo(x + w * 0.5, y + h + 4, x + 4, y + h);
    ctx.lineTo(x - 6, o.ground);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f6faff';
    ctx.beginPath();
    ctx.moveTo(x - 22, y + h * 0.3);
    ctx.quadraticCurveTo(x + w * 0.5, y - 16, x + w + 22, y + h * 0.3);
    ctx.quadraticCurveTo(x + w * 0.5, y - 4, x - 22, y + h * 0.3);
    ctx.fill();
    ctx.fillStyle = 'rgba(220,236,255,0.92)';
    for (let k = 0; k < 7; k++) {
      const ix = x + (k + 0.5) * (w / 7);
      ctx.beginPath();
      ctx.moveTo(ix - 2.5, y + h - 2);
      ctx.lineTo(ix + 2.5, y + h - 2);
      ctx.lineTo(ix, y + h + 6 + hash(o.seed + k) * 4);
      ctx.fill();
    }
    void P;
  },
  serac(ctx, o, T) {
    const { x, y, w, h } = o;
    const r = mulberry32(o.seed);
    const pts = [
      [x - 6, y + h],
      [x - 2, y + h * 0.4],
      [x + 4, y + 4],
      [x + w * 0.4, y + r() * 3],
      [x + w - 4, y + 2],
      [x + w + 4, y + h * 0.5],
      [x + w + 6, y + h],
    ];
    iceBody(ctx, pts, x, y, w, h, T);
    ctx.strokeStyle = 'rgba(40,80,150,0.4)';
    ctx.lineWidth = 1.2;
    for (let k = 1; k < 5; k++) {
      ctx.beginPath();
      ctx.moveTo(x + (w * k) / 5, y + 6);
      ctx.lineTo(x + (w * k) / 5 + (r() - 0.5) * 8, y + h);
      ctx.stroke();
    }
    ctx.fillStyle = '#f6faff';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    for (let k = 0; k <= 8; k++) ctx.lineTo(x + (w * k) / 8, y + 1 - r() * 3);
    ctx.lineTo(x + w, y + 8);
    ctx.fill();
  },

  // ---------- Home Again
  picnicBasket(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = vg(ctx, y + 6, y + h, T('#c8a060'), T('#8a6a34'));
    rr(ctx, x, y + 8, w, h - 8, 4);
    ctx.fill();
    ctx.save();
    rr(ctx, x, y + 8, w, h - 8, 4);
    ctx.clip();
    ctx.strokeStyle = alpha('#5a3a14', 0.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = -h; k < w + h; k += 5) {
      ctx.moveTo(x + k, y + 8);
      ctx.lineTo(x + k + h, y + h);
    }
    ctx.stroke();
    ctx.restore();
    // the cloth, checked, and a loaf sticking out
    ctx.fillStyle = T('#e8e0d0');
    ctx.fillRect(x + 3, y + 5, w - 6, 6);
    ctx.fillStyle = T('#c83a3a');
    for (let k = 0; k < Math.floor((w - 6) / 6); k += 2) ctx.fillRect(x + 3 + k * 6, y + 5, 6, 3);
    ctx.fillStyle = T('#d8a050');
    ctx.save();
    ctx.translate(x + w * 0.7, y + 4);
    ctx.rotate(-0.6);
    rr(ctx, -4, -14, 8, 22, 4);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = T('#8a6a34');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + 8);
    ctx.quadraticCurveTo(x + w * 0.5, y - 10, x + w * 0.8, y + 8);
    ctx.stroke();
  },
};

// ---------------------------------------------------------------- movers

/** A wooden bucket swinging on a rope from a bamboo arm. False if not ours. */
export function returnSwing(ctx, m, s, T, P, t) {
  if (m.skin !== 'bucket') return false;
  culm(ctx, m.ax + 50, m.ay - 70, m.ax + 50, m.ay + 4, 8, T, '#b8b060');
  culm(ctx, m.ax + 54, m.ay - 4, m.ax - 10, m.ay - 4, 6, T, '#b8b060');
  ctx.strokeStyle = T('#c8a868');
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(m.ax, m.ay - 2);
  ctx.lineTo(s.x, s.y - 14);
  ctx.stroke();
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(-s.th);
  ctx.fillStyle = vg(ctx, -12, 14, T('#a8805a'), T('#5a3a20'));
  ctx.beginPath();
  ctx.moveTo(-12, -10);
  ctx.lineTo(12, -10);
  ctx.lineTo(9, 14);
  ctx.lineTo(-9, 14);
  ctx.fill();
  ctx.fillStyle = T('#3a3a3a');
  ctx.fillRect(-12, -6, 24, 2.4);
  ctx.fillRect(-10, 8, 20, 2.4);
  ctx.strokeStyle = T('#3a3a3a');
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -10, 10, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = alpha('#9ad0e8', 0.8);
  ctx.beginPath();
  ctx.ellipse(0, -9, 10, 2, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  void P;
  void t;
  return true;
}

// ---------------------------------------------------------------- decor

export const RETURN_DECOR = {
  bacterialMat(ctx, d, T) {
    ctx.fillStyle = T('#c8642a');
    ctx.beginPath();
    ctx.ellipse(d.x + 10, d.y, 16 * d.s, 1.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#e8b040');
    ctx.beginPath();
    ctx.ellipse(d.x + 10, d.y, 9 * d.s, 1, 0, 0, TAU);
    ctx.fill();
  },
  bambooShoot(ctx, d, T) {
    const h = 14 * d.s;
    ctx.fillStyle = T('#8a7a3a');
    ctx.beginPath();
    ctx.moveTo(d.x - 4, d.y);
    ctx.lineTo(d.x, d.y - h);
    ctx.lineTo(d.x + 4, d.y);
    ctx.fill();
    ctx.strokeStyle = alpha('#3a2a10', 0.5);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let k = 1; k < 4; k++) {
      ctx.moveTo(d.x - 4 + k, d.y - (h * k) / 4);
      ctx.lineTo(d.x + 4 - k, d.y - (h * k) / 4 - 2);
    }
    ctx.stroke();
  },
  sage(ctx, d, T) {
    ctx.fillStyle = T('#9aa88a');
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.arc(d.x + k * 3, d.y - 3 - hash(d.seed + k) * 4, 3, 0, TAU);
      ctx.fill();
    }
  },
  iceShard(ctx, d, T) {
    ctx.fillStyle = 'rgba(220,236,255,0.9)';
    for (let k = 0; k < 3; k++) {
      const x = d.x + k * 5;
      ctx.beginPath();
      ctx.moveTo(x - 2, d.y);
      ctx.lineTo(x + (k - 1), d.y - (5 + hash(d.seed + k) * 6) * d.s);
      ctx.lineTo(x + 2, d.y);
      ctx.fill();
    }
    void T;
  },
};

// ---------------------------------------------------------------- foreground

/** Chapter 5 silhouettes for the foreground strip. False if the terrain is not ours. */
export function returnForeground(g, kind, x, H, rng) {
  if (kind === 'bamboo') {
    for (let k = 0; k < 3; k++) {
      const w = 16 + rng() * 10;
      const bx = x + k * 40;
      g.fillRect(bx - w / 2, -400, w, H + 400);
      for (let y = H - 30; y > -400; y -= 60) g.fillRect(bx - w / 2 - 2, y, w + 4, 4);
    }
  } else if (kind === 'geyser' || kind === 'rainbow' || kind === 'glacier') {
    g.beginPath();
    g.moveTo(x - 90, H);
    for (let k = 0; k <= 6; k++) g.lineTo(x - 90 + k * 30, H - 30 - rng() * 40);
    g.lineTo(x + 90, H);
    g.fill();
  } else if (kind === 'tulips' || kind === 'home') {
    for (let k = 0; k < 16; k++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 1.2;
      const l = 50 + rng() * 70;
      g.lineWidth = 2 + rng() * 3;
      g.beginPath();
      g.moveTo(x + (rng() - 0.5) * 40, H);
      g.quadraticCurveTo(x + Math.cos(a) * l * 0.4, H + Math.sin(a) * l * 0.7, x + Math.cos(a) * l, H + Math.sin(a) * l);
      g.stroke();
      if (kind === 'tulips' && rng() < 0.6) {
        g.beginPath();
        g.ellipse(x + Math.cos(a) * l, H + Math.sin(a) * l - 6, 6, 9, 0, 0, TAU);
        g.fill();
      }
    }
  } else return false;
  return true;
}

// ---------------------------------------------------------------- finale

/** Back where it started: the cabin in summer, porch lights on, the table laid outside. */
export function drawHomeCabin(ctx, x, y, T, P, t, open) {
  const w = 240;
  const h = 110;
  // log walls and a mossy roof
  ctx.fillStyle = T('#6a4a2e');
  ctx.fillRect(x, y - h, w, h);
  ctx.fillStyle = alpha('#000000', 0.25);
  for (let yy = y - h + 9; yy < y; yy += 11) ctx.fillRect(x, yy, w, 2);
  ctx.fillStyle = T('#3e3a2a');
  ctx.beginPath();
  ctx.moveTo(x - 20, y - h);
  ctx.lineTo(x + w / 2, y - h - 80);
  ctx.lineTo(x + w + 20, y - h);
  ctx.fill();
  ctx.fillStyle = T('#5a6a34');
  for (let k = 0; k < 14; k++) {
    ctx.beginPath();
    ctx.ellipse(x + 10 + hash(k * 7) * (w - 20), y - h - 10 - hash(k * 3) * 50 * (1 - Math.abs(hash(k * 7) - 0.5) * 2), 10, 4, -0.3, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = T('#5a4a44');
  ctx.fillRect(x + w * 0.7, y - h - 70, 22, 50);
  for (let k = 0; k < 4; k++) {
    const p = fract(t * 0.2 + k / 4);
    ctx.fillStyle = alpha('#e8e0e8', 0.22 * (1 - p));
    ctx.beginPath();
    ctx.arc(x + w * 0.7 + 11 - p * 30, y - h - 76 - p * 80, 6 + p * 14, 0, TAU);
    ctx.fill();
  }
  // warm windows with flower boxes
  for (const wx of [x + 100, x + 170]) {
    const g = ctx.createRadialGradient(wx + 15, y - 60, 0, wx + 15, y - 60, 70);
    g.addColorStop(0, alpha(P.lamp, 0.4));
    g.addColorStop(1, alpha(P.lamp, 0));
    ctx.fillStyle = g;
    ctx.fillRect(wx - 55, y - 130, 140, 140);
    ctx.fillStyle = P.window;
    ctx.fillRect(wx, y - 76, 30, 28);
    ctx.fillStyle = T('#3a2618');
    ctx.fillRect(wx + 14, y - 76, 2, 28);
    ctx.fillRect(wx, y - 63, 30, 2);
    ctx.fillStyle = T('#6a3a24');
    ctx.fillRect(wx - 3, y - 46, 36, 6);
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = T(['#e84a3a', '#f2c040', '#f4f0e6'][k % 3]);
      ctx.beginPath();
      ctx.arc(wx + 2 + k * 5.4, y - 48, 2.6, 0, TAU);
      ctx.fill();
    }
  }
  // the door, open, and light falling out of it
  const dx = x + 30;
  ctx.fillStyle = open ? P.window : T('#3a2618');
  ctx.fillRect(dx, y - 70, 34, 70);
  if (open) {
    const g = ctx.createLinearGradient(dx, 0, dx - 80, 0);
    g.addColorStop(0, alpha(P.lamp, 0.5));
    g.addColorStop(1, alpha(P.lamp, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(dx, y - 70);
    ctx.lineTo(dx, y);
    ctx.lineTo(dx - 90, y + 4);
    ctx.lineTo(dx - 60, y - 10);
    ctx.fill();
  }
  // a string of lights round the porch
  ctx.strokeStyle = alpha('#1a1410', 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - h + 4);
  ctx.quadraticCurveTo(x + w / 2, y - h + 24, x + w + 10, y - h + 4);
  ctx.stroke();
  for (let k = 1; k < 14; k++) {
    const u = k / 14;
    const lx = x - 10 + (w + 20) * u;
    const ly = y - h + 4 + 20 * 4 * u * (1 - u) * 0.5 + 2;
    const on = 0.7 + 0.3 * Math.sin(t * 2 + k * 1.3);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 10);
    g.addColorStop(0, alpha(P.lamp, 0.5 * on));
    g.addColorStop(1, alpha(P.lamp, 0));
    ctx.fillStyle = g;
    ctx.fillRect(lx - 10, ly - 10, 20, 20);
    ctx.restore();
    ctx.fillStyle = alpha('#fff2d0', on);
    ctx.beginPath();
    ctx.arc(lx, ly, 1.8, 0, TAU);
    ctx.fill();
  }
  // the long table outside, laid for everyone
  const tx = x + w + 50;
  ctx.fillStyle = T('#f4ece0');
  ctx.fillRect(tx, y - 30, 170, 6);
  ctx.fillStyle = T('#8a6a44');
  ctx.fillRect(tx + 8, y - 24, 4, 24);
  ctx.fillRect(tx + 158, y - 24, 4, 24);
  ctx.fillStyle = T('#e8e0d0');
  for (let k = 0; k < 6; k++) {
    ctx.beginPath();
    ctx.ellipse(tx + 16 + k * 28, y - 31, 7, 1.8, 0, 0, TAU);
    ctx.fill();
  }
  for (const lx of [tx + 50, tx + 120]) {
    const g = ctx.createRadialGradient(lx, y - 38, 0, lx, y - 38, 40);
    g.addColorStop(0, alpha(P.lamp, 0.45));
    g.addColorStop(1, alpha(P.lamp, 0));
    ctx.fillStyle = g;
    ctx.fillRect(lx - 40, y - 78, 80, 80);
    ctx.fillStyle = alpha('#ffe8b0', 0.95);
    rr(ctx, lx - 3, y - 42, 6, 10, 2);
    ctx.fill();
  }
  ctx.fillStyle = T('#c8584a');
  ctx.beginPath();
  ctx.arc(tx + 86, y - 36, 8, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = T('#f4e8d0');
  ctx.fillRect(tx + 78, y - 37, 16, 2);
}
