// Chapter 4 world art: ground, pits, props, movers, decor and the bonfire finale.
// Same contract as art.js (world coordinates, tone function T applied to every colour).

import { hash, mulberry32 } from './rng.js';
import { GROUND_Y } from './config.js';
import { rr, vg, edgeShade, blades, woodGrad, backPost, drawRock } from './art.js';
import { mix, alpha, TAU, fract, clamp } from './util.js';

// ---------------------------------------------------------------- ground

function deck(ctx, s, sx0, sx1, P, T, plank, light) {
  ctx.fillStyle = T('#2a1e16');
  ctx.fillRect(sx0, s.y + 8, sx1 - sx0, 7);
  ctx.fillStyle = vg(ctx, s.y - 1, s.y + 9, T(P.ground.top2), T(P.ground.top));
  ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 10);
  ctx.fillStyle = alpha('#000000', 0.4);
  for (let x = Math.floor(sx0 / plank) * plank; x < sx1; x += plank) ctx.fillRect(x, s.y - 1, 1.2, 10);
  ctx.fillStyle = alpha(light, 0.22);
  ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 1.2);
}

function piles(ctx, s, sx0, sx1, T, step, wy) {
  ctx.fillStyle = T('#2a1c14');
  for (let x = Math.ceil(s.x0 / step) * step + 12; x < s.x1 - 6; x += step) {
    if (x < sx0 - 10 || x > sx1 + 10) continue;
    ctx.fillRect(x - 4, s.y + 10, 8, wy - s.y + 6);
  }
  ctx.strokeStyle = T('#22160f');
  ctx.lineWidth = 2;
  for (let x = Math.ceil(s.x0 / step) * step + 12; x < s.x1 - step - 6; x += step) {
    if (x < sx0 - step - 6 || x > sx1) continue;
    ctx.beginPath();
    ctx.moveTo(x, s.y + 14);
    ctx.lineTo(x + step, wy - 8);
    ctx.stroke();
  }
}

export const SEA_SEG = {
  saltflat(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 140, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    // layers of old salt laid down by a sea that dried up
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = alpha(k % 2 ? '#ffffff' : '#8a7a80', 0.12);
      ctx.fillRect(sx0, s.y + 14 + k * 16 + hash(k) * 4, sx1 - sx0, 3 + hash(k * 3) * 3);
    }
    // the crust: bright, a little wet, holding the colour of the sky
    ctx.fillStyle = vg(ctx, s.y - 2, s.y + 10, T(mix(P.sky[2], '#ffffff', 0.55)), T(G.top));
    ctx.fillRect(sx0, s.y - 2, sx1 - sx0, 11);
    ctx.strokeStyle = alpha('#a8988c', 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 22) * 22; x < sx1; x += 22) {
      ctx.moveTo(x, s.y + 1);
      ctx.lineTo(x + 6, s.y + 4);
      ctx.lineTo(x + 16, s.y + 4);
      ctx.lineTo(x + 22, s.y + 1);
    }
    ctx.stroke();
    for (let x = Math.floor(sx0 / 9) * 9; x < sx1; x += 9) {
      const h = hash(x * 13);
      if (h < 0.7) continue;
      ctx.fillStyle = alpha('#ffffff', (0.5 + 0.5 * Math.sin(t * 3 + x)) * 0.9);
      ctx.fillRect(x, s.y - 1 + h * 3, 1.3, 1.3);
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#3a2a30', 0.35));
  },

  beach(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 150, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    ctx.strokeStyle = alpha('#7a5a2a', 0.16);
    ctx.lineWidth = 1;
    for (let x = Math.floor(sx0 / 80) * 80; x < sx1 + 80; x += 80) {
      for (let k = 0; k < 4; k++) {
        const y0 = s.y + 22 + k * 11 + hash(x) * 16;
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.quadraticCurveTo(x + 36, y0 + 5, x + 72, y0 + 16);
        ctx.stroke();
      }
    }
    ctx.fillStyle = vg(ctx, s.y - 2, s.y + 10, T(G.top2), T(G.top));
    ctx.beginPath();
    ctx.moveTo(sx0, s.y + 10);
    for (let x = Math.floor(sx0 / 10) * 10; x <= sx1 + 10; x += 10) ctx.lineTo(clamp(x, sx0, sx1), s.y - 1 - Math.sin(x * 0.05) * 1);
    ctx.lineTo(sx1, s.y + 10);
    ctx.fill();
    // a scatter of shell bits and small footprints in the dry sand
    for (let x = Math.floor(sx0 / 11) * 11; x < sx1; x += 11) {
      const h = hash(x * 5);
      if (h < 0.75) continue;
      ctx.fillStyle = T(h > 0.9 ? '#f4d8c8' : '#ffffff');
      ctx.fillRect(x, s.y + 1 + h * 4, 1.8, 1.2);
    }
    ctx.fillStyle = alpha('#8a6a3a', 0.18);
    for (let x = Math.floor(sx0 / 31) * 31; x < sx1; x += 31) {
      if (hash(x * 7) < 0.5) continue;
      ctx.beginPath();
      ctx.ellipse(x, s.y + 3, 2.4, 1.2, 0, 0, TAU);
      ctx.ellipse(x + 8, s.y + 5, 2.4, 1.2, 0, 0, TAU);
      ctx.fill();
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#5a3a10', 0.4));
  },

  lagoon(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    piles(ctx, s, sx0, sx1, T, 64, GROUND_Y + 62);
    deck(ctx, s, sx0, sx1, P, T, 18, P.light);
    // barnacles and weed on the piles at the waterline
    ctx.fillStyle = T('#4a6a3a');
    for (let x = Math.ceil(s.x0 / 64) * 64 + 12; x < s.x1 - 6; x += 64) {
      if (x < sx0 - 10 || x > sx1 + 10) continue;
      ctx.fillRect(x - 5, GROUND_Y + 56, 10, 6);
    }
    void bottom;
    void openL;
    void openR;
  },

  cave(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 170, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    // veins of something that glows
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = alpha(P.lamp, 0.25);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 71) * 71; x < sx1; x += 71) {
      if (hash(x) < 0.4) continue;
      const y0 = s.y + 20 + hash(x * 3) * 60;
      ctx.moveTo(x, y0);
      ctx.lineTo(x + 10, y0 + 8);
      ctx.lineTo(x + 6, y0 + 20);
      ctx.lineTo(x + 18, y0 + 30);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = vg(ctx, s.y - 2, s.y + 9, T(G.top2), T(G.top));
    ctx.beginPath();
    ctx.moveTo(sx0, s.y + 9);
    for (let x = Math.floor(sx0 / 8) * 8; x <= sx1 + 8; x += 8) ctx.lineTo(clamp(x, sx0, sx1), s.y - 1 - hash(x) * 2.2);
    ctx.lineTo(sx1, s.y + 9);
    ctx.fill();
    // wet rock: little puddles hold the glow
    for (let x = Math.floor(sx0 / 43) * 43; x < sx1; x += 43) {
      if (hash(x * 9) < 0.55) continue;
      const k = 0.6 + 0.4 * Math.sin(t * 1.3 + x);
      ctx.fillStyle = alpha(P.lamp, 0.22 * k);
      ctx.beginPath();
      ctx.ellipse(x + 10, s.y + 1, 9, 1.6, 0, 0, TAU);
      ctx.fill();
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.6));
  },

  village(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    piles(ctx, s, sx0, sx1, T, 60, GROUND_Y + 62);
    deck(ctx, s, sx0, sx1, P, T, 22, P.light);
    // tar stains, a coil of rope, scales and salt in the boards
    ctx.fillStyle = alpha('#000000', 0.2);
    for (let x = Math.floor(sx0 / 67) * 67; x < sx1; x += 67) if (hash(x * 3) > 0.5) ctx.fillRect(x + 4, s.y + 2, 12, 3);
    ctx.fillStyle = alpha('#e8e0d0', 0.25);
    for (let x = Math.floor(sx0 / 13) * 13; x < sx1; x += 13) if (hash(x * 11) > 0.75) ctx.fillRect(x, s.y + 1, 1.4, 1.4);
    void bottom;
    void openL;
    void openR;
  },

  bonfire(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 150, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    ctx.fillStyle = vg(ctx, s.y - 2, s.y + 10, T(G.top2), T(G.top));
    ctx.beginPath();
    ctx.moveTo(sx0, s.y + 10);
    for (let x = Math.floor(sx0 / 10) * 10; x <= sx1 + 10; x += 10) ctx.lineTo(clamp(x, sx0, sx1), s.y - 1 - Math.sin(x * 0.05) * 1);
    ctx.lineTo(sx1, s.y + 10);
    ctx.fill();
    // firelight catches the edges of things; the moon catches the rest
    for (let x = Math.floor(sx0 / 9) * 9; x < sx1; x += 9) {
      const h = hash(x * 13);
      if (h < 0.78) continue;
      ctx.fillStyle = alpha(h > 0.9 ? P.lamp : '#c8d4f0', (0.5 + 0.5 * Math.sin(t * 2 + x)) * 0.6);
      ctx.fillRect(x, s.y + h * 4, 1.2, 1.2);
    }
    blades(ctx, s, sx0, sx1, T('#4a4a3a'), 3, 8, 9.1, 2);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.5));
  },
};

/** Terrains with open water under the walkway (drawn before the segments). */
export const SEA_WATERY = new Set(['lagoon', 'village']);

/** Pits for the chapter 4 terrains. Returns false when the terrain is not one of ours. */
export function seaPit(ctx, terr, P, T, a, b, bottom, t) {
  const top = Math.max(a.y, b.y) + 1;
  const x0 = a.x1;
  const w = b.x0 - a.x1;
  if (terr === 'saltflat' || terr === 'beach') {
    ctx.fillStyle = vg(ctx, top, top + 100, T(mix(P.ground.body, '#000000', 0.3)), T(P.ground.deep));
    ctx.fillRect(x0, top, w, bottom - top);
    // a pool of brine (or the tide) far below, holding the sky
    const wy = top + 80;
    const water = terr === 'beach' ? P.water : mix(P.sky[1], '#ffffff', 0.3);
    ctx.fillStyle = vg(ctx, wy, wy + 70, T(mix(water, '#ffffff', 0.2)), T(mix(water, '#000000', 0.35)));
    ctx.fillRect(x0, wy, w, bottom - wy);
    ctx.strokeStyle = alpha('#ffffff', 0.5);
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const xx = x0 + fract(hash(k + a.x1) + t * 0.12) * w;
      ctx.beginPath();
      ctx.moveTo(xx, wy + 3 + k * 6);
      ctx.lineTo(Math.min(x0 + w, xx + 12), wy + 3 + k * 6);
      ctx.stroke();
    }
  } else if (terr === 'lagoon' || terr === 'village') {
    ctx.fillStyle = vg(ctx, top, GROUND_Y + 62, alpha('#000000', 0.45), alpha('#000000', 0.12));
    ctx.fillRect(x0, top, w, GROUND_Y + 62 - top);
  } else if (terr === 'cave') {
    ctx.fillStyle = vg(ctx, top, top + 200, T(mix(P.ground.deep, '#000000', 0.3)), '#010304');
    ctx.fillRect(x0, top, w, bottom - top);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const wy = top + 150;
    const k = 0.7 + 0.3 * Math.sin(t * 1.1 + a.x1);
    const g = ctx.createLinearGradient(0, wy - 60, 0, wy + 20);
    g.addColorStop(0, alpha(P.lamp, 0));
    g.addColorStop(1, alpha(P.lamp, 0.3 * k));
    ctx.fillStyle = g;
    ctx.fillRect(x0, wy - 60, w, 80);
    ctx.restore();
  } else if (terr === 'bonfire') {
    ctx.fillStyle = vg(ctx, top, top + 120, T(mix(P.ground.body, '#000000', 0.4)), '#020204');
    ctx.fillRect(x0, top, w, bottom - top);
    const wy = top + 100;
    ctx.fillStyle = T(P.water);
    ctx.fillRect(x0, wy, w, bottom - wy);
    ctx.fillStyle = alpha(P.seaGlint, 0.35);
    for (let k = 0; k < 4; k++) {
      const xx = x0 + fract(hash(k + a.x1) + t * 0.1) * w;
      ctx.fillRect(xx, wy + 3 + k * 6, Math.min(10, x0 + w - xx), 1);
    }
  } else return false;
  return true;
}

// ---------------------------------------------------------------- props

function saltBrick(ctx, x, y, w, h, T, seed) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, T('#ffffff'));
  g.addColorStop(1, T(mix('#e8d8d4', '#b8a8a8', hash(seed) * 0.5)));
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, 2);
  ctx.fill();
  ctx.strokeStyle = alpha('#9a8a8a', 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + h * (0.4 + hash(seed + 1) * 0.2));
  ctx.lineTo(x + w - 2, y + h * (0.45 + hash(seed + 2) * 0.2));
  ctx.stroke();
}

function pennantLine(ctx, x0, y0, x1, sag, T, cols, seed, t) {
  ctx.strokeStyle = T('#3a3030');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo((x0 + x1) / 2, y0 + sag * 2, x1, y0);
  ctx.stroke();
  const n = Math.max(4, Math.round((x1 - x0) / 13));
  for (let k = 1; k < n; k++) {
    const u = k / n;
    const px = x0 + (x1 - x0) * u;
    const py = y0 + sag * 4 * u * (1 - u);
    const wv = Math.sin(t * 4 + k + seed) * 1.5;
    ctx.fillStyle = T(cols[(seed + k) % cols.length]);
    ctx.beginPath();
    ctx.moveTo(px - 4.5, py);
    ctx.lineTo(px + 4.5, py);
    ctx.lineTo(px + wv, py + 12);
    ctx.closePath();
    ctx.fill();
  }
}

function canopy(ctx, x, y, w, h, T, cols) {
  // a striped dome of cloth, scalloped at the rim
  const n = cols.length * 2;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + (i / n) * Math.PI;
    const a1 = Math.PI + ((i + 1) / n) * Math.PI;
    ctx.fillStyle = T(cols[i % cols.length]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a0) * w, y + Math.sin(a0) * h);
    ctx.quadraticCurveTo(x + Math.cos((a0 + a1) / 2) * w * 1.04, y + Math.sin((a0 + a1) / 2) * h * 1.04 + 4, x + Math.cos(a1) * w, y + Math.sin(a1) * h);
    ctx.closePath();
    ctx.fill();
  }
}

function crystal(ctx, x, base, h, w, col, glowCol, lean) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, base - h * 0.5, 0, x, base - h * 0.5, h * 0.9);
  g.addColorStop(0, alpha(glowCol, 0.35));
  g.addColorStop(1, alpha(glowCol, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - h, base - h * 1.4, h * 2, h * 1.6);
  ctx.restore();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, base);
  ctx.lineTo(x - w / 2 + lean, base - h * 0.8);
  ctx.lineTo(x + lean, base - h);
  ctx.lineTo(x + w / 2 + lean, base - h * 0.8);
  ctx.lineTo(x + w / 2, base);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = alpha('#ffffff', 0.35);
  ctx.beginPath();
  ctx.moveTo(x - w / 2, base);
  ctx.lineTo(x - w / 2 + lean, base - h * 0.8);
  ctx.lineTo(x + lean, base - h);
  ctx.lineTo(x + lean * 0.5, base);
  ctx.closePath();
  ctx.fill();
}

function creel(ctx, x, y, w, h, T, seed) {
  ctx.fillStyle = vg(ctx, y, y + h, T('#9a7a52'), T('#5a4024'));
  rr(ctx, x, y + h * 0.2, w, h * 0.8, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.22, w / 2, h * 0.22, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = alpha('#2a1a0a', 0.5);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let k = 1; k < 5; k++) {
    ctx.moveTo(x + (w * k) / 5, y + 2);
    ctx.lineTo(x + (w * k) / 5, y + h - 2);
  }
  for (let k = 0; k < 3; k++) {
    ctx.moveTo(x, y + h * (0.4 + k * 0.2));
    ctx.lineTo(x + w, y + h * (0.4 + k * 0.2));
  }
  ctx.stroke();
  ctx.fillStyle = T(['#d8483a', '#f2c040', '#3a8ac8'][seed % 3]);
  ctx.beginPath();
  ctx.arc(x + w * 0.8, y + h * 0.15, 3, 0, TAU);
  ctx.fill();
}

export const SEA_OB = {
  // ---------- Mirror Flats
  saltPile(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, T('#ffffff'));
    g.addColorStop(1, T(mix('#d8c8c8', P.sky[1], 0.2)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + h);
    ctx.quadraticCurveTo(x + w * 0.2, y + h * 0.2, x + w * 0.5, y);
    ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.2, x + w + 4, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = alpha('#8a7a80', 0.25);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y);
    ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.2, x + w + 4, y + h);
    ctx.lineTo(x + w * 0.62, y + h);
    ctx.quadraticCurveTo(x + w * 0.6, y + h * 0.4, x + w * 0.5, y);
    ctx.fill();
    ctx.strokeStyle = T('#7a5a3a');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h * 0.4);
    ctx.lineTo(x + w * 0.1, y - 10);
    ctx.stroke();
    ctx.fillStyle = T('#8a8a90');
    ctx.fillRect(x + w * 0.25, y + h * 0.36, 9, 6);
  },
  saltBlocks(ctx, o, T) {
    const { x, y, w, h } = o;
    const bh = h / 2;
    saltBrick(ctx, x, y + bh, w * 0.5 - 1, bh, T, o.seed);
    saltBrick(ctx, x + w * 0.5, y + bh, w * 0.5, bh, T, o.seed + 3);
    saltBrick(ctx, x + w * 0.2, y + 1, w * 0.56, bh - 1, T, o.seed + 7);
  },
  saltStack(ctx, o, T) {
    const { x, y, w, h } = o;
    const rows = 4;
    const bh = h / rows;
    for (let r = 0; r < rows; r++) {
      const n = Math.max(2, Math.round(w / 40));
      const bw = w / n;
      for (let k = 0; k < n; k++) {
        const off = r % 2 ? bw * 0.5 : 0;
        const bx = x + k * bw + off - (r % 2 && k === n - 1 ? bw * 0.5 : 0);
        saltBrick(ctx, bx, y + h - (r + 1) * bh, (r % 2 && k === n - 1 ? bw * 0.5 : bw) - 1.5, bh - 1.5, T, o.seed + r * 13 + k);
      }
    }
    ctx.fillStyle = T('#c8584a');
    ctx.fillRect(x + w * 0.1, y - 3, w * 0.8, 4);
  },
  pennants(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    const pole = T('#3a3236');
    backPost(ctx, x - 14, y - 20, o.ground, 4, pole);
    backPost(ctx, x + w + 14, y - 20, o.ground, 4, pole);
    const cols = ['#e84a3a', '#f2c040', '#3a8ac8', '#ffffff', '#4ab07a'];
    pennantLine(ctx, x - 14, y - 16, x + w + 14, 10, T, cols, o.seed, t);
    pennantLine(ctx, x - 14, y + h * 0.35 - 8, x + w + 14, 8, T, cols, o.seed + 2, t);
  },

  // ---------- Palm Beach
  sandcastle(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const sand = T(mix(P.ground.top, '#c8a060', 0.25));
    const dark = T(mix(P.ground.top, '#8a6a3a', 0.5));
    ctx.fillStyle = sand;
    ctx.fillRect(x + 4, y + h * 0.45, w - 8, h * 0.55);
    for (let k = 0; k < Math.floor((w - 8) / 8); k += 2) ctx.fillRect(x + 4 + k * 8, y + h * 0.4, 6, 4);
    // bucket-shaped towers
    for (const [tx, th] of [
      [x, h * 0.75],
      [x + w - 16, h * 0.7],
      [x + w * 0.5 - 9, h],
    ]) {
      ctx.fillStyle = sand;
      ctx.beginPath();
      ctx.moveTo(tx, y + h);
      ctx.lineTo(tx + 2, y + h - th);
      ctx.lineTo(tx + 16, y + h - th);
      ctx.lineTo(tx + 18, y + h);
      ctx.fill();
      ctx.fillStyle = dark;
      for (let k = 0; k < 3; k++) ctx.fillRect(tx + 3, y + h - th + 5 + k * 6, 12, 1);
    }
    ctx.fillStyle = dark;
    ctx.fillRect(x + w * 0.5 - 4, y + h - 10, 8, 10);
    ctx.strokeStyle = T('#5a4a3a');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y);
    ctx.lineTo(x + w * 0.5, y - 12);
    ctx.stroke();
    ctx.fillStyle = T('#e84a3a');
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y - 12);
    ctx.lineTo(x + w * 0.5 + 8, y - 9);
    ctx.lineTo(x + w * 0.5, y - 6);
    ctx.fill();
  },
  cooler(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = vg(ctx, y, y + h, T('#4a9ad8'), T('#2a6aa8'));
    rr(ctx, x, y + 6, w, h - 6, 4);
    ctx.fill();
    ctx.fillStyle = T('#f4f4f0');
    rr(ctx, x - 1, y + 2, w + 2, 9, 3);
    ctx.fill();
    ctx.strokeStyle = T('#f4f4f0');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.25, y + 3);
    ctx.quadraticCurveTo(x + w * 0.5, y - 6, x + w * 0.75, y + 3);
    ctx.stroke();
    ctx.fillStyle = alpha('#ffffff', 0.25);
    ctx.fillRect(x + 4, y + 14, w * 0.3, h - 20);
  },
  surfboards(ctx, o, T) {
    const { x, y, w, h } = o;
    const cols = [
      ['#f2c040', '#e84a3a'],
      ['#3ab0c8', '#ffffff'],
      ['#e86a9a', '#2a4a8a'],
    ];
    const n = 3;
    for (let k = 0; k < n; k++) {
      const bx = x + 6 + k * ((w - 12) / (n - 1));
      const bh = h * (0.8 + hash(o.seed + k) * 0.2);
      const [c1, c2] = cols[(o.seed + k) % 3];
      ctx.save();
      ctx.translate(bx, y + h);
      ctx.rotate((k - 1) * 0.12);
      ctx.fillStyle = T(c1);
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.quadraticCurveTo(-7, -bh * 0.6, 0, -bh);
      ctx.quadraticCurveTo(7, -bh * 0.6, 5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = T(c2);
      ctx.fillRect(-0.8, -bh * 0.92, 1.6, bh * 0.9);
      ctx.restore();
    }
    ctx.fillStyle = T('#d8bc86');
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h, w * 0.6, 4, 0, Math.PI, 0);
    ctx.fill();
  },
  parasol(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a big beach umbrella, its pole planted just off the path, leaning over it
    const px = x + w + 12;
    ctx.strokeStyle = T(mix('#e8e0d0', P.haze, 0.1));
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, o.ground);
    ctx.lineTo(x + w * 0.5, y + 4);
    ctx.stroke();
    const sway = Math.sin(t * 1.4 + o.seed) * 1.5;
    canopy(ctx, x + w * 0.5 + sway, y + h, w * 0.75, h * 1.1, T, ['#e84a3a', '#f4f0e6', '#f2c040', '#f4f0e6']);
    ctx.fillStyle = alpha('#000000', 0.15);
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, o.ground, w * 0.6, 3, 0, 0, TAU);
    ctx.fill();
  },
  lifeguard(ctx, o, T) {
    const { x, y, w, h } = o;
    const hut = y + 4;
    const hh = h * 0.42;
    // stilts and cross-bracing
    ctx.strokeStyle = T('#e8e0d0');
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + h);
    ctx.lineTo(x + 16, hut + hh);
    ctx.moveTo(x + w - 10, y + h);
    ctx.lineTo(x + w - 16, hut + hh);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + h - 6);
    ctx.lineTo(x + w - 16, hut + hh + 4);
    ctx.moveTo(x + w - 14, y + h - 6);
    ctx.lineTo(x + 16, hut + hh + 4);
    ctx.stroke();
    // the hut, red and white, flat roof to land on
    ctx.fillStyle = T('#d8483a');
    ctx.fillRect(x + 6, hut, w - 12, hh);
    ctx.fillStyle = T('#f4f0e6');
    for (let k = 0; k < 3; k++) ctx.fillRect(x + 6, hut + 5 + k * (hh / 3), w - 12, hh / 7);
    ctx.fillStyle = T('#3a5a7a');
    ctx.fillRect(x + w * 0.35, hut + hh * 0.2, w * 0.3, hh * 0.4);
    ctx.fillStyle = T('#f4f0e6');
    ctx.fillRect(x - 2, y - 2, w + 4, 6);
    ctx.fillStyle = T('#8a6a4a');
    ctx.fillRect(x + 2, hut + hh, w - 4, 3);
  },

  // ---------- Mangrove Lagoon
  crabTrap(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = alpha(T('#3a4a52'), 0.35);
    rr(ctx, x, y + 4, w, h - 4, 3);
    ctx.fill();
    ctx.strokeStyle = T('#5a6a72');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k <= 6; k++) {
      ctx.moveTo(x + (w * k) / 6, y + 4);
      ctx.lineTo(x + (w * k) / 6, y + h);
    }
    for (let k = 0; k <= 4; k++) {
      ctx.moveTo(x, y + 4 + ((h - 4) * k) / 4);
      ctx.lineTo(x + w, y + 4 + ((h - 4) * k) / 4);
    }
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y + 4, w, h - 4);
    ctx.strokeStyle = T('#c8a060');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + 4);
    ctx.quadraticCurveTo(x + w * 0.7, y - 8, x + w + 4, y + 2);
    ctx.stroke();
    ctx.fillStyle = T('#e8583a');
    ctx.beginPath();
    ctx.arc(x + w * 0.3, y + h * 0.65, 4, 0, TAU);
    ctx.fill();
  },
  ropeCoil(ctx, o, T) {
    const { x, y, w, h } = o;
    const rings = 4;
    for (let k = 0; k < rings; k++) {
      const ry = y + h - (k + 0.5) * (h / rings);
      ctx.fillStyle = T(k % 2 ? '#c8a868' : '#b89858');
      ctx.beginPath();
      ctx.ellipse(x + w / 2, ry, w / 2 - k * 2, h / rings / 1.4, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = alpha('#5a4020', 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = T('#3a2a14');
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.15, w * 0.16, 3, 0, 0, TAU);
    ctx.fill();
  },
  canoe(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = vg(ctx, y, y + h, T('#c86a3a'), T('#7a3a1a'));
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 2);
    ctx.quadraticCurveTo(x + w * 0.5, y + 8, x + w + 6, y + 2);
    ctx.quadraticCurveTo(x + w - 6, y + h, x + w * 0.5, y + h);
    ctx.quadraticCurveTo(x + 6, y + h, x - 6, y + 2);
    ctx.fill();
    ctx.strokeStyle = T('#e8c890');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 2);
    ctx.quadraticCurveTo(x + w * 0.5, y + 8, x + w + 6, y + 2);
    ctx.stroke();
    ctx.strokeStyle = T('#8a6a44');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y - 6);
    ctx.lineTo(x + w * 0.75, y + 2);
    ctx.stroke();
    ctx.fillStyle = T('#8a6a44');
    ctx.beginPath();
    ctx.ellipse(x + w * 0.78, y + 3, 7, 3.4, 0.2, 0, TAU);
    ctx.fill();
  },
  mangroveRoots(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const bark = T('#4a3a2a');
    ctx.strokeStyle = bark;
    ctx.lineCap = 'round';
    // prop roots arch from a trunk behind the walk, right over it and down into the water
    const tx = x + w + 30;
    ctx.fillStyle = bark;
    ctx.beginPath();
    ctx.moveTo(tx - 10, o.ground);
    ctx.quadraticCurveTo(tx - 6, y, tx - 4, y - 110);
    ctx.lineTo(tx + 4, y - 110);
    ctx.quadraticCurveTo(tx + 6, y, tx + 10, o.ground);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tx, y - 80);
    ctx.lineTo(tx - 30, y - 120);
    ctx.moveTo(tx, y - 90);
    ctx.lineTo(tx + 26, y - 130);
    ctx.stroke();
    {
      const r0 = mulberry32(o.seed + 5);
      const crown = [T('#2a4a26'), T('#34582c'), T('#426a34')];
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = crown[i % 3];
        ctx.beginPath();
        ctx.arc(tx - 60 + r0() * 120, y - 175 + r0() * 70, 14 + r0() * 12, 0, TAU);
        ctx.fill();
      }
    }
    for (let k = 0; k < 6; k++) {
      const ex = x - 30 + k * 16;
      ctx.lineWidth = 4 - k * 0.3;
      ctx.beginPath();
      ctx.moveTo(tx, y + h * 0.2 + k * 3);
      ctx.bezierCurveTo(x + w * 0.6, y - 10 + k * 4, x + w * 0.2 - k * 4, y + h * 0.1 + k * 6, ex, o.ground + 30);
      ctx.stroke();
    }
    ctx.lineWidth = 2;
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.moveTo(x + (w * k) / 6, y + h * 0.2);
      ctx.lineTo(x + (w * k) / 6 - 4, y + h);
      ctx.stroke();
    }
    const leaf = [T('#2e5a2a'), T('#3e6e34'), T('#4e7e3c')];
    const r = mulberry32(o.seed);
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = leaf[i % 3];
      ctx.beginPath();
      ctx.ellipse(x - 20 + r() * (w + 80), y - 30 + r() * 40, 8 + r() * 6, 4 + r() * 2, (r() - 0.5) * 1.2, 0, TAU);
      ctx.fill();
    }
    void P;
  },
  stiltHut(ctx, o, T) {
    const { x, y, w, h } = o;
    const floor = y + h * 0.5;
    ctx.fillStyle = T('#3a2a1c');
    for (const px of [x + 8, x + w * 0.5 - 2, x + w - 12]) ctx.fillRect(px, floor, 5, y + h - floor);
    ctx.strokeStyle = T('#3a2a1c');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + h - 4);
    ctx.lineTo(x + w - 10, floor + 4);
    ctx.stroke();
    ctx.fillStyle = woodGrad(ctx, y + 8, floor - y - 8, T, '#a8845a', '#8a6a44', '#5a4024');
    ctx.fillRect(x + 4, y + 8, w - 8, floor - y - 8);
    ctx.fillStyle = alpha('#000000', 0.3);
    for (let xx = x + 14; xx < x + w - 8; xx += 12) ctx.fillRect(xx, y + 8, 1.2, floor - y - 8);
    ctx.fillStyle = T('#2a1e14');
    ctx.fillRect(x + w * 0.4, floor - 26, 16, 26);
    ctx.fillStyle = T('#8a9098');
    ctx.fillRect(x - 4, y, w + 8, 9);
    ctx.fillStyle = alpha('#000000', 0.25);
    for (let xx = x; xx < x + w + 4; xx += 6) ctx.fillRect(xx, y, 1, 9);
    ctx.fillStyle = T('#6a5038');
    ctx.fillRect(x, floor, w, 4);
  },

  // ---------- Glow Caves
  caveRock(ctx, o, T, P) {
    drawRock(ctx, o, T, '#2e3c44', false, false, P.light);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = alpha(P.lamp, 0.5);
    for (let k = 0; k < 6; k++) ctx.fillRect(o.x + o.w * (0.2 + hash(o.seed + k) * 0.6), o.y + o.h * (0.25 + hash(o.seed + k * 3) * 0.5), 1.4, 1.4);
    ctx.restore();
  },
  crystals(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const cols = [T('#5ae0d8'), T('#9a7ae8'), T('#7af0e0')];
    const r = mulberry32(o.seed);
    for (let k = 0; k < 6; k++) {
      const cx = x + 6 + r() * (w - 12);
      crystal(ctx, cx, y + h, h * (0.5 + r() * 0.5), 7 + r() * 6, cols[k % 3], P.lamp, (r() - 0.5) * 10);
    }
  },
  stalactites(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a low lip of the cave roof, hung with stone teeth
    const rock = T('#1a262c');
    const r0 = mulberry32(o.seed);
    const g0 = ctx.createLinearGradient(x - 60, 0, x + w + 60, 0);
    g0.addColorStop(0, T('#26343c'));
    g0.addColorStop(1, T('#0e161a'));
    ctx.fillStyle = g0;
    ctx.beginPath();
    ctx.moveTo(x - 90, y - 320);
    // the left flank steps down in ledges, the underside is lumpy, the right flank climbs back up
    for (let k = 0; k <= 5; k++) ctx.lineTo(x - 90 + k * 10 + (k % 2 ? 22 : 0) + r0() * 14, y - 320 + k * 64 + r0() * 20);
    for (let k = 0; k <= 8; k++) ctx.lineTo(x - 30 + ((w + 60) * k) / 8, y + h * 0.4 + Math.sin(k * 1.7) * 3 + r0() * 4);
    for (let k = 5; k >= 0; k--) ctx.lineTo(x + w + 90 - k * 10 - (k % 2 ? 0 : 20) - r0() * 14, y - 320 + k * 64 + r0() * 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha('#000000', 0.35);
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x - 50 + k * 10, y - 260 + k * 60);
      ctx.quadraticCurveTo(x + w * 0.5, y - 250 + k * 64, x + w + 50 - k * 10, y - 262 + k * 60);
      ctx.stroke();
    }
    ctx.fillStyle = rock;
    const n = Math.max(4, Math.round(w / 16));
    for (let k = 0; k < n; k++) {
      const sx = x - 20 + (k + 0.5) * ((w + 40) / n);
      const len = h * (0.5 + hash(o.seed + k) * 0.5);
      ctx.beginPath();
      ctx.moveTo(sx - 6, y + h * 0.4);
      ctx.quadraticCurveTo(sx - 1, y + h * 0.4 + len * 0.6, sx, y + h * 0.4 + len * 0.6 + 4);
      ctx.quadraticCurveTo(sx + 1, y + h * 0.4 + len * 0.6, sx + 6, y + h * 0.4);
      ctx.fill();
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = alpha(P.lamp, 0.6);
    for (let k = 0; k < 14; k++) ctx.fillRect(x - 30 + hash(o.seed + k) * (w + 60), y - 40 + hash(o.seed + k * 7) * (h * 0.8 + 40), 1.4, 1.4);
    ctx.restore();
  },
  caveColumn(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, T('#3a4a52'));
    g.addColorStop(1, T('#121c22'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + h);
    ctx.quadraticCurveTo(x + 2, y + h * 0.5, x + 4, y + 4);
    ctx.lineTo(x + w - 4, y + 2);
    ctx.quadraticCurveTo(x + w - 2, y + h * 0.5, x + w + 8, y + h);
    ctx.fill();
    ctx.strokeStyle = alpha('#000000', 0.3);
    ctx.lineWidth = 1;
    for (let k = 1; k < 5; k++) {
      ctx.beginPath();
      ctx.moveTo(x + 4, y + (h * k) / 5);
      ctx.quadraticCurveTo(x + w / 2, y + (h * k) / 5 + 4, x + w - 4, y + (h * k) / 5);
      ctx.stroke();
    }
    ctx.fillStyle = T('#4a5a62');
    ctx.fillRect(x + 2, y, w - 4, 4);
    crystal(ctx, x + w * 0.8, y + 2, 14, 6, T('#5ae0d8'), P.lamp, 2);
    crystal(ctx, x + w * 0.86, y + 2, 9, 5, T('#9a7ae8'), P.lamp, -2);
  },

  // ---------- Stilt Village
  lobsterPots(ctx, o, T) {
    const { x, y, w, h } = o;
    const pw = w * 0.5;
    const ph = h * 0.5;
    creel(ctx, x, y + ph, pw - 1, ph, T, o.seed);
    creel(ctx, x + pw, y + ph, pw, ph, T, o.seed + 1);
    creel(ctx, x + pw * 0.5, y, pw, ph, T, o.seed + 2);
  },
  netPile(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = vg(ctx, y, y + h, T('#4a7a6a'), T('#2a4a42'));
    ctx.beginPath();
    ctx.moveTo(x - 4, y + h);
    ctx.quadraticCurveTo(x + w * 0.1, y + 2, x + w * 0.45, y);
    ctx.quadraticCurveTo(x + w * 0.85, y + 4, x + w + 4, y + h);
    ctx.fill();
    ctx.strokeStyle = alpha('#9ac0b0', 0.4);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      ctx.moveTo(x + (w * k) / 8, y + h);
      ctx.quadraticCurveTo(x + (w * k) / 8 + 6, y + h * 0.4, x + (w * (k + 1)) / 8, y + 4);
    }
    ctx.stroke();
    const cols = ['#e8a040', '#f4e8d0', '#e8583a'];
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = T(cols[k % 3]);
      ctx.beginPath();
      ctx.ellipse(x + w * (0.15 + k * 0.18), y + h * (0.3 + hash(o.seed + k) * 0.5), 4, 2.6, 0, 0, TAU);
      ctx.fill();
    }
  },
  dryNets(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    const pole = T(mix('#5a4030', P.haze, 0.15));
    backPost(ctx, x - 10, y - 16, o.ground, 5, pole);
    backPost(ctx, x + w + 10, y - 16, o.ground, 5, pole);
    ctx.strokeStyle = T('#3a2a1a');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 12);
    ctx.lineTo(x + w + 10, y - 12);
    ctx.stroke();
    const wv = Math.sin(t * 1.6 + o.seed) * 2;
    const hang = (u) => y - 12 + h * (0.6 + 0.4 * Math.sin(Math.PI * u)) + wv * Math.sin(Math.PI * u);
    ctx.fillStyle = alpha(T('#4a7a6a'), 0.55);
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 12);
    for (let k = 0; k <= 12; k++) ctx.lineTo(x - 10 + ((w + 20) * k) / 12, hang(k / 12));
    ctx.lineTo(x + w + 10, y - 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha(T('#9ac0b0'), 0.6);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let k = 0; k <= 14; k++) {
      const u = k / 14;
      const px = x - 10 + (w + 20) * u;
      ctx.moveTo(px, y - 12);
      ctx.lineTo(px + 3, hang(u));
    }
    for (let k = 1; k < 4; k++) {
      ctx.moveTo(x - 10, y - 12 + ((h * 0.6) * k) / 4);
      for (let j = 0; j <= 12; j++) {
        const u = j / 12;
        ctx.lineTo(x - 10 + (w + 20) * u, y - 12 + (hang(u) - y + 12) * (k / 4));
      }
    }
    ctx.stroke();
    const cols = ['#e8a040', '#f4e8d0'];
    for (let k = 1; k < 8; k++) {
      const u = k / 8;
      ctx.fillStyle = T(cols[k % 2]);
      ctx.beginPath();
      ctx.ellipse(x - 10 + (w + 20) * u, hang(u), 3.4, 2.2, 0, 0, TAU);
      ctx.fill();
    }
  },
  baitShed(ctx, o, T) {
    const { x, y, w, h } = o;
    const walls = ['#c8584a', '#5a8ab0', '#6aa080', '#e8b860'];
    const wall = walls[o.seed % walls.length];
    ctx.fillStyle = vg(ctx, y + 8, y + h, T(mix(wall, '#ffffff', 0.1)), T(mix(wall, '#000000', 0.3)));
    ctx.fillRect(x + 4, y + 8, w - 8, h - 8);
    ctx.fillStyle = alpha('#000000', 0.2);
    for (let yy = y + 14; yy < y + h; yy += 7) ctx.fillRect(x + 4, yy, w - 8, 1.2);
    ctx.fillStyle = T('#2a2020');
    ctx.fillRect(x + w * 0.18, y + h - 40, 20, 40);
    ctx.fillStyle = T('#ffd690');
    ctx.fillRect(x + w * 0.6, y + 22, 18, 14);
    ctx.fillStyle = T('#f4ead8');
    ctx.fillRect(x + w * 0.5 - 22, y + 12, 44, 7);
    ctx.fillStyle = T('#8a9098');
    ctx.fillRect(x - 4, y, w + 8, 9);
    ctx.fillStyle = alpha('#000000', 0.25);
    for (let xx = x; xx < x + w + 4; xx += 6) ctx.fillRect(xx, y, 1, 9);
    creel(ctx, x + w - 26, y + h - 20, 20, 20, T, o.seed);
  },

  // ---------- Bonfire Point
  driftwood(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, T('#c8c0b0'));
    g.addColorStop(0.5, T('#9a9284'));
    g.addColorStop(1, T('#5a5448'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.5);
    ctx.quadraticCurveTo(x + 4, y + 2, x + w * 0.3, y + 3);
    ctx.lineTo(x + w - 6, y + 6);
    ctx.quadraticCurveTo(x + w + 4, y + h * 0.5, x + w - 4, y + h);
    ctx.lineTo(x + 6, y + h);
    ctx.quadraticCurveTo(x - 4, y + h * 0.8, x, y + h * 0.5);
    ctx.fill();
    ctx.strokeStyle = alpha('#3a3428', 0.4);
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x + 8, y + h * (0.25 + k * 0.17));
      ctx.quadraticCurveTo(x + w * 0.5, y + h * (0.3 + k * 0.17) + 2, x + w - 8, y + h * (0.25 + k * 0.17));
      ctx.stroke();
    }
    ctx.strokeStyle = T('#a8a090');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.62, y + 4);
    ctx.lineTo(x + w * 0.7, y - 10);
    ctx.stroke();
    ctx.fillStyle = alpha(P.lamp, 0.18);
    ctx.fillRect(x + 4, y + 3, w - 10, 3);
  },
  driftArch(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const wood = T('#a8a090');
    const dark = T('#6a6458');
    backPost(ctx, x - 6, y, o.ground, 9, dark);
    backPost(ctx, x + w + 6, y, o.ground, 9, dark);
    ctx.fillStyle = vg(ctx, y, y + h * 0.5, wood, dark);
    ctx.beginPath();
    ctx.moveTo(x - 22, y + 4);
    ctx.quadraticCurveTo(x + w * 0.5, y - 6, x + w + 22, y + 2);
    ctx.lineTo(x + w + 20, y + h * 0.42);
    ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.3, x - 20, y + h * 0.45);
    ctx.closePath();
    ctx.fill();
    // shells and sea glass hung on strings from the beam
    const cols = ['#f4e8e0', '#9ad0c0', '#e8c0b0', '#c0d8f0'];
    ctx.strokeStyle = alpha('#e8e0d0', 0.6);
    ctx.lineWidth = 0.8;
    for (let k = 0; k < 7; k++) {
      const sx = x + (k + 0.5) * (w / 7);
      const len = h * (0.4 + hash(o.seed + k) * 0.3);
      ctx.beginPath();
      ctx.moveTo(sx, y + h * 0.38);
      ctx.lineTo(sx, y + h * 0.38 + len);
      ctx.stroke();
      ctx.fillStyle = T(cols[k % 4]);
      ctx.beginPath();
      ctx.ellipse(sx, y + h * 0.38 + len + 2, 3, 2.4, 0, 0, TAU);
      ctx.fill();
    }
    void P;
  },
  dune(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, T(mix(P.ground.top2, '#c8d4f0', 0.15)));
    g.addColorStop(1, T(P.ground.body));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 20, y + h);
    ctx.quadraticCurveTo(x + 2, y + h * 0.2, x + 18, y + 2);
    ctx.lineTo(x + w - 18, y);
    ctx.quadraticCurveTo(x + w - 2, y + h * 0.2, x + w + 20, y + h);
    ctx.fill();
    ctx.strokeStyle = T('#5a6040');
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let k = 0; k < 16; k++) {
      const gx = x + 10 + hash(o.seed + k) * (w - 20);
      for (let j = 0; j < 3; j++) {
        ctx.moveTo(gx, y + 2);
        ctx.quadraticCurveTo(gx + (j - 1) * 2, y - 6, gx + (j - 1) * 5, y - 10 - hash(k + j) * 6);
      }
    }
    ctx.stroke();
    ctx.strokeStyle = alpha('#000000', 0.2);
    ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x + 4, y + h * (k / 4));
      ctx.quadraticCurveTo(x + w / 2, y + h * (k / 4) + 6, x + w - 4, y + h * (k / 4));
      ctx.stroke();
    }
  },
};

// ---------------------------------------------------------------- movers

/** Chapter 4 rollers, drawn already translated + rotated to their centre. False if not ours. */
export function seaRoller(ctx, m, r, T, P) {
  const skin = m.skin;
  if (skin === 'tumbleweed') {
    ctx.strokeStyle = T('#8a6a44');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 26; i++) {
      const a = i * 2.39;
      ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
      ctx.quadraticCurveTo(Math.cos(a + 1) * r, Math.sin(a + 1) * r, Math.cos(a + 2) * r * 0.85, Math.sin(a + 2) * r * 0.85);
    }
    ctx.stroke();
    ctx.strokeStyle = T('#c8a878');
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, TAU);
    ctx.stroke();
  } else if (skin === 'beachBall') {
    const cols = ['#e84a3a', '#ffffff', '#3a8ac8', '#ffffff', '#f2c040', '#ffffff'];
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = T(cols[k]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, (k / 6) * TAU, ((k + 1) / 6) * TAU);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = T('#ffffff');
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.18, 0, TAU);
    ctx.fill();
  } else if (skin === 'buoy') {
    ctx.fillStyle = T('#e8483a');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#f4f0e6');
    ctx.beginPath();
    ctx.arc(0, 0, r, -0.5, 0.5);
    ctx.arc(0, 0, r * 0.35, 0.5, -0.5, true);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI - 0.5, Math.PI + 0.5);
    ctx.arc(0, 0, r * 0.35, Math.PI + 0.5, Math.PI - 0.5, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = T('#8a2a1a');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, TAU);
    ctx.stroke();
  } else if (skin === 'geode') {
    ctx.fillStyle = T('#3a464e');
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * TAU;
      const rr2 = r * (0.88 + hash(m.seed + k) * 0.16);
      ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = T('#7a5ac8');
    ctx.beginPath();
    ctx.ellipse(r * 0.15, 0, r * 0.45, r * 0.55, 0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = alpha('#d8c8ff', 0.8);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      ctx.beginPath();
      ctx.moveTo(r * 0.15, 0);
      ctx.lineTo(r * 0.15 + Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.5);
      ctx.lineTo(r * 0.15 + Math.cos(a + 0.4) * r * 0.3, Math.sin(a + 0.4) * r * 0.36);
      ctx.fill();
    }
    void P;
  } else return false;
  return true;
}

/** Swinging hazards: a bundle of net and floats, a lobster pot hung from a davit. */
export function seaSwing(ctx, m, s, T, P, t) {
  if (m.skin !== 'netFloat' && m.skin !== 'potSwing') return false;
  ctx.strokeStyle = T('#5a4a34');
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(m.ax + 40, m.ay - 60);
  ctx.lineTo(m.ax + 40, m.ay - 6);
  ctx.lineTo(m.ax - 6, m.ay - 6);
  ctx.stroke();
  ctx.strokeStyle = T('#c8a868');
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(m.ax, m.ay - 6);
  ctx.lineTo(s.x, s.y - 14);
  ctx.stroke();
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(-s.th);
  if (m.skin === 'netFloat') {
    ctx.fillStyle = T('#3a6a5a');
    ctx.beginPath();
    ctx.moveTo(-4, -16);
    ctx.quadraticCurveTo(-18, 2, -8, 14);
    ctx.lineTo(8, 14);
    ctx.quadraticCurveTo(18, 2, 4, -16);
    ctx.fill();
    ctx.strokeStyle = alpha('#9ac0b0', 0.6);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let k = -2; k <= 2; k++) {
      ctx.moveTo(k * 3, -14);
      ctx.lineTo(k * 5, 13);
    }
    ctx.stroke();
    const cols = ['#e8a040', '#f4e8d0', '#e8583a'];
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = T(cols[k % 3]);
      ctx.beginPath();
      ctx.ellipse(-9 + k * 6, 2 + (k % 2) * 6, 3.4, 2.4, 0, 0, TAU);
      ctx.fill();
    }
  } else {
    creel(ctx, -13, -14, 26, 26, T, 2);
  }
  ctx.restore();
  void P;
  void t;
  return true;
}

/** Falling hazards that use the icicle pattern: stone teeth dropping from the cave roof. */
export function seaDrop(ctx, m, s, T, t, P) {
  if (m.skin !== 'stalactite') return false;
  const lx = m.x;
  const ly = m.y0 - 8;
  ctx.fillStyle = T('#1a262c');
  ctx.beginPath();
  ctx.moveTo(lx - 70, ly - 46);
  ctx.lineTo(lx + 70, ly - 46);
  ctx.lineTo(lx + 60, ly + 2);
  ctx.quadraticCurveTo(lx, ly + 10, lx - 62, ly + 2);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = alpha(P.lamp, 0.6);
  for (let k = 0; k < 6; k++) ctx.fillRect(lx - 50 + hash(m.seed + k) * 100, ly - 30 + hash(m.seed + k * 3) * 28, 1.4, 1.4);
  ctx.restore();
  const sh = s.shake ? Math.sin(t * 90) * 1.6 * s.shake : 0;
  const x = s.x + sh;
  const y = s.y;
  const g = ctx.createLinearGradient(x - 8, 0, x + 8, 0);
  g.addColorStop(0, T('#5a6a72'));
  g.addColorStop(1, T('#24323a'));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - m.w / 2 - 1, y);
  ctx.lineTo(x + m.w / 2 + 1, y);
  ctx.quadraticCurveTo(x + 3, y + m.h * 0.6, x + 1, y + m.h);
  ctx.quadraticCurveTo(x - 2, y + m.h * 0.6, x - m.w / 2 - 1, y);
  ctx.fill();
  ctx.fillStyle = alpha(P.lamp, 0.5);
  ctx.fillRect(x - 2, y + 4, 1.2, m.h * 0.5);
  if (s.landed) {
    ctx.fillStyle = T('#3a4a52');
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x - 10 + k * 6, m.ground);
      ctx.lineTo(x - 8 + k * 6, m.ground - 3 - hash(m.seed + k) * 4);
      ctx.lineTo(x - 6 + k * 6, m.ground);
      ctx.fill();
    }
  }
  return true;
}

// ---------------------------------------------------------------- decor

export const SEA_DECOR = {
  saltCrystal(ctx, d, T) {
    ctx.fillStyle = T('#ffffff');
    for (let k = 0; k < 3; k++) {
      const x = d.x + k * 5;
      const h = (3 + hash(d.seed + k) * 4) * d.s;
      ctx.beginPath();
      ctx.moveTo(x - 2, d.y);
      ctx.lineTo(x, d.y - h);
      ctx.lineTo(x + 2, d.y);
      ctx.fill();
    }
  },
  brinePool(ctx, d, T, P) {
    ctx.fillStyle = T(mix(P.sky[1], '#ffffff', 0.35));
    ctx.beginPath();
    ctx.ellipse(d.x + 10, d.y + 0.5, 14 * d.s, 1.8, 0, 0, TAU);
    ctx.fill();
  },
  shell(ctx, d, T) {
    ctx.fillStyle = T(['#f4e0d4', '#ffffff', '#e8c0a8'][d.seed % 3]);
    ctx.beginPath();
    ctx.moveTo(d.x - 4, d.y);
    ctx.quadraticCurveTo(d.x, d.y - 7 * d.s, d.x + 4, d.y);
    ctx.fill();
    ctx.strokeStyle = alpha('#8a6a5a', 0.5);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let k = -1; k <= 1; k++) {
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + k * 2.6, d.y - 5 * d.s);
    }
    ctx.stroke();
  },
  starfish(ctx, d, T) {
    ctx.fillStyle = T('#e8784a');
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k / 5) * TAU;
      ctx.lineTo(d.x + Math.cos(a) * 5, d.y - 2 + Math.sin(a) * 2);
      ctx.lineTo(d.x + Math.cos(a + 0.63) * 2, d.y - 2 + Math.sin(a + 0.63) * 0.9);
    }
    ctx.closePath();
    ctx.fill();
  },
  beachGrass(ctx, d, T) {
    ctx.strokeStyle = T('#7a8a4a');
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let k = 0; k < 7; k++) {
      const l = (k - 3) * 3 * d.s;
      ctx.moveTo(d.x + k, d.y);
      ctx.quadraticCurveTo(d.x + k + l * 0.3, d.y - 10 * d.s, d.x + k + l, d.y - (14 + hash(d.seed + k) * 8) * d.s);
    }
    ctx.stroke();
  },
  reeds(ctx, d, T) {
    ctx.strokeStyle = T('#5a6a3a');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      ctx.moveTo(d.x + k * 2, d.y);
      ctx.lineTo(d.x + k * 2 + (k - 2), d.y - (16 + hash(d.seed + k) * 10) * d.s);
    }
    ctx.stroke();
    ctx.fillStyle = T('#6a4a2a');
    ctx.fillRect(d.x + 3, d.y - 22 * d.s, 2.4, 7);
  },
  glowMushroom(ctx, d, T, P) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(d.x, d.y - 5, 0, d.x, d.y - 5, 16);
    g.addColorStop(0, alpha(P.lamp, 0.4));
    g.addColorStop(1, alpha(P.lamp, 0));
    ctx.fillStyle = g;
    ctx.fillRect(d.x - 16, d.y - 21, 32, 32);
    ctx.restore();
    for (let k = 0; k < 3; k++) {
      const x = d.x + (k - 1) * 4;
      const h = (4 + k * 2) * d.s;
      ctx.fillStyle = T('#c8e8e0');
      ctx.fillRect(x - 0.6, d.y - h, 1.2, h);
      ctx.fillStyle = alpha(P.lamp, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, d.y - h, 2.6, 1.6, 0, Math.PI, 0);
      ctx.fill();
    }
  },
  crystalSmall(ctx, d, T, P) {
    crystal(ctx, d.x, d.y, 9 * d.s, 4, T('#7a5ae0'), P.lamp, 1.5);
    crystal(ctx, d.x + 4, d.y, 6 * d.s, 3, T('#5ae0d8'), P.lamp, -1);
  },
  fishBasket(ctx, d, T) {
    ctx.fillStyle = T('#a8844a');
    ctx.beginPath();
    ctx.moveTo(d.x - 8, d.y - 9);
    ctx.lineTo(d.x + 8, d.y - 9);
    ctx.lineTo(d.x + 6, d.y);
    ctx.lineTo(d.x - 6, d.y);
    ctx.fill();
    ctx.fillStyle = T('#c8d0d8');
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.ellipse(d.x - 4 + k * 4, d.y - 10, 3, 1.4, 0.3, 0, TAU);
      ctx.fill();
    }
  },
  lanternJar(ctx, d, T, P) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(d.x, d.y - 6, 0, d.x, d.y - 6, 26);
    g.addColorStop(0, alpha(P.lamp, 0.45));
    g.addColorStop(1, alpha(P.lamp, 0));
    ctx.fillStyle = g;
    ctx.fillRect(d.x - 26, d.y - 32, 52, 52);
    ctx.restore();
    ctx.fillStyle = alpha('#ffe2a8', 0.9);
    rr(ctx, d.x - 4, d.y - 11, 8, 11, 2);
    ctx.fill();
    ctx.fillStyle = T('#5a5a62');
    ctx.fillRect(d.x - 4, d.y - 13, 8, 2.4);
  },
};

// ---------------------------------------------------------------- foreground

/** Chapter 4 silhouettes for the foreground strip. False if the terrain is not ours. */
export function seaForeground(g, kind, x, H, rng) {
  if (kind === 'saltflat') {
    g.beginPath();
    g.ellipse(x, H + 6, 70 + rng() * 50, 14 + rng() * 10, 0, Math.PI, 0);
    g.fill();
  } else if (kind === 'beach' || kind === 'bonfire') {
    for (let k = 0; k < 14; k++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 1.2;
      const l = 60 + rng() * 70;
      g.lineWidth = 2 + rng() * 3;
      g.beginPath();
      g.moveTo(x + (rng() - 0.5) * 40, H);
      g.quadraticCurveTo(x + Math.cos(a) * l * 0.4, H + Math.sin(a) * l * 0.7, x + Math.cos(a) * l, H + Math.sin(a) * l);
      g.stroke();
    }
    g.beginPath();
    g.ellipse(x, H + 8, 110, 30, 0, Math.PI, 0);
    g.fill();
  } else if (kind === 'lagoon' || kind === 'village') {
    g.fillRect(x - 6, H - 90, 12, 90);
    g.beginPath();
    g.ellipse(x, H - 90, 8, 4, 0, 0, TAU);
    g.fill();
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x + 6, H - 70);
    g.quadraticCurveTo(x + 50, H - 50, x + 90, H - 66);
    g.stroke();
  } else if (kind === 'cave') {
    g.beginPath();
    g.moveTo(x - 90, H);
    for (let k = 0; k <= 6; k++) g.lineTo(x - 90 + k * 30, H - 40 - rng() * 50);
    g.lineTo(x + 90, H);
    g.fill();
  } else return false;
  return true;
}

// ---------------------------------------------------------------- finale

/** The end of the long way: a fire on the beach, logs to sit on, everyone already there. */
export function drawBonfire(ctx, x, y, T, P, t, open) {
  // light from the fire on the sand
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const k = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5.3);
  const g = ctx.createRadialGradient(x, y - 20, 0, x, y - 20, 260);
  g.addColorStop(0, alpha('#ff9a4a', 0.55 * k));
  g.addColorStop(0.4, alpha('#ff7a2a', 0.18 * k));
  g.addColorStop(1, alpha('#ff7a2a', 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 260, y - 280, 520, 300);
  ctx.restore();
  // a ring of stones and the logs
  ctx.fillStyle = T('#5a5450');
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.ellipse(x - 34 + i * 8.5, y - 2, 5, 4, 0, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = T('#3a2618');
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 26, y - 4);
  ctx.lineTo(x + 18, y - 26);
  ctx.moveTo(x + 26, y - 4);
  ctx.lineTo(x - 16, y - 28);
  ctx.stroke();
  // flames: layered tongues, flickering
  const tongues = [
    ['#ff5a1a', 1, 0],
    ['#ff9a2a', 0.75, 1.3],
    ['#ffd870', 0.45, 2.1],
  ];
  for (const [col, s, ph] of tongues) {
    ctx.fillStyle = col;
    for (let j = -2; j <= 2; j++) {
      const hh = (60 - Math.abs(j) * 12) * s * (0.85 + 0.15 * Math.sin(t * 11 + j * 1.7 + ph));
      const sway = Math.sin(t * 6 + j + ph) * 4 * s;
      const bx = x + j * 9 * s;
      ctx.beginPath();
      ctx.moveTo(bx - 9 * s, y - 8);
      ctx.quadraticCurveTo(bx - 8 * s + sway, y - 8 - hh * 0.6, bx + sway * 1.6, y - 8 - hh);
      ctx.quadraticCurveTo(bx + 8 * s + sway, y - 8 - hh * 0.6, bx + 9 * s, y - 8);
      ctx.closePath();
      ctx.fill();
    }
  }
  // sparks climbing into the dark
  for (let i = 0; i < 16; i++) {
    const p = fract(t * 0.5 + i / 16);
    const sx = x + Math.sin(i * 2.3 + t * 2) * 10 + Math.sin(p * 6 + i) * 14 * p;
    const sy = y - 50 - p * 160;
    ctx.fillStyle = alpha(i % 3 ? '#ffb040' : '#ffe8a0', 1 - p);
    ctx.fillRect(sx, sy, 2, 2);
  }
  // logs to sit on, a blanket, a guitar resting against one of them
  for (const [lx, w] of [
    [x - 150, 70],
    [x + 70, 80],
  ]) {
    ctx.fillStyle = vg(ctx, y - 16, y, T('#a8a090'), T('#4a4438'));
    rr(ctx, lx, y - 16, w, 16, 8);
    ctx.fill();
    ctx.fillStyle = alpha('#ff9a4a', 0.3);
    ctx.fillRect(lx + 4, y - 15, w - 8, 3);
  }
  ctx.fillStyle = T('#4a6aa8');
  ctx.beginPath();
  ctx.moveTo(x + 160, y);
  ctx.lineTo(x + 260, y);
  ctx.lineTo(x + 248, y - 6);
  ctx.lineTo(x + 170, y - 6);
  ctx.fill();
  ctx.save();
  ctx.translate(x + 146, y - 4);
  ctx.rotate(-0.5);
  ctx.fillStyle = T('#a86a3a');
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 12, 0, 0, TAU);
  ctx.fill();
  ctx.fillRect(-2, -34, 4, 24);
  ctx.fillStyle = T('#2a1a10');
  ctx.beginPath();
  ctx.arc(0, -2, 3, 0, TAU);
  ctx.fill();
  ctx.restore();
  // a tent behind, glowing from inside
  const tx = x + 200;
  ctx.fillStyle = T('#c86a3a');
  ctx.beginPath();
  ctx.moveTo(tx - 50, y - 2);
  ctx.lineTo(tx, y - 70);
  ctx.lineTo(tx + 50, y - 2);
  ctx.fill();
  ctx.fillStyle = open ? alpha('#ffd890', 0.9) : T('#3a1e10');
  ctx.beginPath();
  ctx.moveTo(tx - 12, y - 2);
  ctx.lineTo(tx, y - 40);
  ctx.lineTo(tx + 12, y - 2);
  ctx.fill();
}
