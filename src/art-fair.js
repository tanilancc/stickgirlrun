// Chapter 6 world art: ground, pits, props, rollers, swings, falling conkers, decor and the
// gate of the harvest fair. Same contract as art.js (world coordinates, tone function T applied
// to every colour).

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

/** Small autumn leaves lying on the ground, in the stage's leaf colours. */
function leafLitter(ctx, s, sx0, sx1, T, cols, every = 5, k = 0.5) {
  for (let x = Math.floor(sx0 / every) * every; x < sx1; x += every) {
    if (hash(x * 11) < k) continue;
    ctx.fillStyle = T(cols[Math.floor(hash(x * 17) * cols.length)]);
    ctx.beginPath();
    ctx.ellipse(x, s.y - 0.5 + hash(x * 3) * 2, 2.6, 1.2, (hash(x * 5) - 0.5) * 1.2, 0, TAU);
    ctx.fill();
  }
}

/** Arch openings in a viaduct, at fixed places in the world so they never slide. */
const ARCH = 150;

/**
 * The valley seen far below, through an arch or a missing span: far hills, then autumn treetops,
 * then the river, all blued by the distance.
 */
function valleyBelow(ctx, x0, x1, top, bottom, P, T, seed) {
  ctx.fillStyle = vg(ctx, top, top + 150, T(mix(P.haze, P.far, 0.35)), T(mix(P.mid, P.haze, 0.45)), T(mix(P.near, P.mid, 0.4)));
  ctx.fillRect(x0, top, x1 - x0, bottom - top);
  ctx.fillStyle = T(mix(P.far, P.haze, 0.3));
  ctx.beginPath();
  ctx.moveTo(x0, top + 26);
  for (let x = x0; x <= x1 + 12; x += 12) ctx.lineTo(x, top + 14 + Math.sin(x * 0.02 + seed) * 6 + hash(Math.floor(x / 12) + seed) * 4);
  ctx.lineTo(x1, top + 40);
  ctx.lineTo(x0, top + 40);
  ctx.fill();
  // woods on the valley floor: rows of canopy, each a bumpy line of crowns, nearer rows richer
  const cols = ['#c8783a', '#a84a2a', '#e0a848', '#7a7a3a'];
  for (let row = 0; row < 3; row++) {
    const y = top + 40 + row * 22;
    const k = 0.62 - row * 0.14;
    const base = mix(mix('#8a5a2a', P.mid, 0.3), P.haze, k);
    ctx.fillStyle = T(base);
    ctx.beginPath();
    ctx.moveTo(x0 - 10, bottom);
    for (let x = Math.floor(x0 / 7) * 7 - 7; x < x1 + 14; x += 7) {
      const h = hash(x * 3 + row * 101 + seed);
      ctx.lineTo(x, y - 3 - h * (4 + row * 2));
    }
    ctx.lineTo(x1 + 10, bottom);
    ctx.fill();
    for (let x = Math.floor(x0 / 11) * 11; x < x1 + 11; x += 11) {
      const h = hash(x * 5 + row * 37 + seed);
      if (h < 0.35) continue;
      ctx.fillStyle = T(mix(cols[Math.floor(h * 4)], P.haze, k + 0.05));
      ctx.beginPath();
      ctx.ellipse(x + h * 5, y - 1 - h * 3, 3 + row * 1.4, 2 + row, 0, 0, TAU);
      ctx.fill();
    }
  }
  ctx.strokeStyle = T(mix(P.water, P.light, 0.35));
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x0, top + 98);
  for (let x = x0; x <= x1 + 10; x += 10) ctx.lineTo(x, top + 98 + Math.sin(x * 0.012 + seed) * 4);
  ctx.stroke();
}

export const FAIR_SEG = {
  pumpkin(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 120);
    // ploughed clods and frost in the furrows
    ctx.fillStyle = alpha('#140c06', 0.3);
    for (let x = Math.floor(sx0 / 23) * 23; x < sx1; x += 23) {
      const h = hash(x);
      if (h < 0.3) continue;
      ctx.beginPath();
      ctx.ellipse(x + h * 10, s.y + 20 + hash(x * 3) * 70, 4 + h * 6, 2 + h * 2, 0, 0, TAU);
      ctx.fill();
    }
    topBand(ctx, s, sx0, sx1, T, G, 10, 1);
    ctx.fillStyle = alpha('#ffffff', 0.55);
    for (let x = Math.floor(sx0 / 5) * 5; x < sx1; x += 5) if (hash(x * 7) > 0.55) ctx.fillRect(x, s.y - 1 + hash(x) * 4, 2 + hash(x * 3) * 3, 1);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
    // stubble, the tips white with frost
    blades(ctx, s, sx0, sx1, T('#a89a68'), 3, 6, 3.4);
    blades(ctx, s, sx0, sx1, T('#ece8e0'), 2, 4, 6.3, 1);
  },

  mill(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 120);
    // roots reaching down into the bank
    ctx.strokeStyle = alpha('#0a0604', 0.35);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 61) * 61; x < sx1; x += 61) {
      if (hash(x) < 0.5) continue;
      ctx.moveTo(x, s.y + 8);
      ctx.quadraticCurveTo(x + 10, s.y + 30, x + 4, s.y + 50 + hash(x * 3) * 30);
      ctx.moveTo(x + 6, s.y + 20);
      ctx.lineTo(x + 22, s.y + 40);
    }
    ctx.stroke();
    topBand(ctx, s, sx0, sx1, T, G, 10, 1);
    blades(ctx, s, sx0, sx1, T(G.top2), 2, 5, 4.4);
    leafLitter(ctx, s, sx0, sx1, T, P.leaves, 4, 0.35);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
  },

  moor(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 140);
    // peat, laid down in dark bands, with a stone here and there
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = alpha(k % 2 ? '#000000' : '#5a3a28', 0.14);
      ctx.fillRect(sx0, s.y + 14 + k * 17 + hash(k) * 5, sx1 - sx0, 5 + hash(k * 3) * 5);
    }
    ctx.fillStyle = T('#6a6a64');
    for (let x = Math.floor(sx0 / 71) * 71; x < sx1; x += 71) {
      if (hash(x * 5) < 0.55) continue;
      ctx.beginPath();
      ctx.ellipse(x + 20, s.y + 30 + hash(x) * 60, 7 + hash(x * 3) * 6, 4 + hash(x * 7) * 3, 0, 0, TAU);
      ctx.fill();
    }
    topBand(ctx, s, sx0, sx1, T, G, 10, 1.4);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.5));
    blades(ctx, s, sx0, sx1, T(G.top2), 3, 6, 4);
    // heather along the edge of the path
    for (let x = Math.floor(sx0 / 6) * 6; x < sx1; x += 6) {
      if (hash(x * 13) < 0.45) continue;
      const h = 4 + hash(x * 3) * 6;
      ctx.fillStyle = T('#3a3a24');
      ctx.fillRect(x, s.y - h, 1, h);
      ctx.fillStyle = T(mix(P.heather, '#ffffff', hash(x) * 0.25));
      for (let k = 0; k < 3; k++) ctx.fillRect(x - 1 + k * 0.8, s.y - h + k * 1.6, 1.8, 1.4);
    }
  },

  viaduct(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    const deck = s.y + 18;
    // masonry: piers and arches, with the valley a long way below seen through each arch
    ctx.fillStyle = vg(ctx, s.y, s.y + 220, T(G.body), T(mix(G.body, G.deep, 0.5)));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    // stone courses
    ctx.strokeStyle = alpha('#2a2018', 0.22);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let yy = deck + 8; yy < Math.min(bottom, s.y + 260); yy += 11) {
      ctx.moveTo(sx0, yy);
      ctx.lineTo(sx1, yy);
      const off = ((yy / 11) | 0) % 2 ? 0 : 12;
      for (let x = Math.floor(sx0 / 24) * 24 + off; x < sx1; x += 24) {
        ctx.moveTo(x, yy);
        ctx.lineTo(x, yy + 11);
      }
    }
    ctx.stroke();
    const a0 = Math.floor((sx0 - ARCH) / ARCH) * ARCH;
    for (let ax = a0; ax < sx1 + ARCH; ax += ARCH) {
      const l = Math.max(ax + 28, s.x0 + 22);
      const r = Math.min(ax + ARCH - 28, s.x1 - 22);
      if (r - l < 40) continue;
      const top = deck + 16;
      const cx = (l + r) / 2;
      const rad = (r - l) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx0, s.y, sx1 - sx0, bottom - s.y);
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(l, bottom);
      ctx.lineTo(l, top + rad);
      ctx.arc(cx, top + rad, rad, Math.PI, 0);
      ctx.lineTo(r, bottom);
      ctx.closePath();
      ctx.clip();
      valleyBelow(ctx, l, r, top, bottom, P, T, 0);
      // the shadow of the arch's own soffit at the top of the opening
      ctx.fillStyle = vg(ctx, top, top + rad * 0.8, alpha('#1a120a', 0.45), alpha('#1a120a', 0));
      ctx.fillRect(l, top, r - l, rad * 0.8);
      ctx.restore();
      // voussoirs round the arch
      ctx.strokeStyle = alpha('#2a2018', 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, top + rad, rad + 6, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      for (let k = 1; k < 10; k++) {
        const a = Math.PI + (k / 10) * Math.PI;
        ctx.moveTo(cx + Math.cos(a) * rad, top + rad + Math.sin(a) * rad);
        ctx.lineTo(cx + Math.cos(a) * (rad + 6), top + rad + Math.sin(a) * (rad + 6));
      }
      ctx.stroke();
    }
    // the coping along the top, then ballast, sleepers and a rail
    ctx.fillStyle = vg(ctx, s.y + 8, deck, T('#a89a84'), T('#6a5a48'));
    ctx.fillRect(sx0, s.y + 8, sx1 - sx0, deck - s.y - 8);
    ctx.fillStyle = alpha('#000000', 0.3);
    ctx.fillRect(sx0, deck, sx1 - sx0, 3);
    topBand(ctx, s, sx0, sx1, T, G, 9, 1.4);
    ctx.fillStyle = T('#3a2a1e');
    for (let x = Math.floor(sx0 / 16) * 16; x < sx1; x += 16) ctx.fillRect(x, s.y + 1, 9, 3);
    ctx.fillStyle = T('#5a5a5e');
    ctx.fillRect(sx0, s.y - 1.4, sx1 - sx0, 2.2);
    ctx.fillStyle = alpha(P.light, 0.6);
    ctx.fillRect(sx0, s.y - 1.4, sx1 - sx0, 0.7);
    ctx.fillStyle = T('#8a8070');
    for (let x = Math.floor(sx0 / 4) * 4; x < sx1; x += 4) if (hash(x * 9) > 0.5) ctx.fillRect(x, s.y + 3 + hash(x) * 4, 1.6, 1.4);
    // broken ends where a span has gone
    const broken = (ex, dir) => {
      ctx.fillStyle = T(mix(G.body, G.deep, 0.3));
      ctx.beginPath();
      ctx.moveTo(ex, s.y + 4);
      for (let k = 0; k <= 6; k++) ctx.lineTo(ex + dir * (2 + hash(ex + k) * 10), s.y + 10 + k * 22);
      ctx.lineTo(ex, s.y + 160);
      ctx.fill();
    };
    if (openL && s.x0 >= sx0) broken(s.x0, 1);
    if (openR && s.x1 <= sx1) broken(s.x1, -1);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#1a120a', 0.4));
  },

  vineyard(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 140);
    // stony red soil
    for (let x = Math.floor(sx0 / 17) * 17; x < sx1; x += 17) {
      const h = hash(x * 3);
      if (h < 0.4) continue;
      ctx.fillStyle = alpha(h > 0.75 ? '#e8d8c0' : '#2a140a', 0.25);
      ctx.beginPath();
      ctx.ellipse(x + h * 8, s.y + 16 + hash(x) * 90, 2 + h * 4, 1.4 + h * 2, 0, 0, TAU);
      ctx.fill();
    }
    topBand(ctx, s, sx0, sx1, T, G, 9, 1.2);
    ctx.fillStyle = T('#e8d0a0');
    for (let x = Math.floor(sx0 / 7) * 7; x < sx1; x += 7) if (hash(x * 7) > 0.6) ctx.fillRect(x, s.y + 1 + hash(x) * 4, 1.8, 1.4);
    leafLitter(ctx, s, sx0, sx1, T, P.leaves, 9, 0.6);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#200a04', 0.45));
  },

  fair(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 110);
    ctx.fillStyle = alpha('#000000', 0.2);
    ctx.fillRect(sx0, s.y + 8, sx1 - sx0, 8);
    topBand(ctx, s, sx0, sx1, T, G, 10, 0.8);
    // trodden grass, straw put down where it got muddy
    ctx.strokeStyle = T('#d8b860');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 3) * 3; x < sx1; x += 3) {
      if (hash(x * 19) < 0.62) continue;
      const a = (hash(x * 7) - 0.5) * 0.9;
      ctx.moveTo(x - Math.cos(a) * 4, s.y + 1 - Math.sin(a) * 2);
      ctx.lineTo(x + Math.cos(a) * 4, s.y + 1 + Math.sin(a) * 2);
    }
    ctx.stroke();
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.5));
    blades(ctx, s, sx0, sx1, T(G.top2), 2, 5, 4.8);
  },
};

/** Pits for the chapter 6 terrains. Returns false when the terrain is not one of ours. */
export function fairPit(ctx, terr, P, T, a, b, bottom, t) {
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
    return wy;
  };
  const dark = (d = 120) => {
    ctx.fillStyle = vg(ctx, top, top + d, T(mix(P.ground.body, '#000000', 0.35)), T(P.ground.deep));
    ctx.fillRect(x0, top, w, bottom - top);
  };
  if (terr === 'pumpkin') {
    dark(100);
    const wy = waterPit(80, P.water, '#ffffff');
    // a skin of ice on the ditch, cracked
    ctx.fillStyle = 'rgba(230,240,250,0.55)';
    ctx.fillRect(x0, wy - 1, w, 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const cx = x0 + hash(a.x1 + k) * w;
      ctx.moveTo(cx, wy);
      ctx.lineTo(cx + 6, wy + 3);
      ctx.lineTo(cx + 2, wy + 6);
    }
    ctx.stroke();
  } else if (terr === 'mill') {
    dark(110);
    const wy = waterPit(60, P.water, P.light);
    // leaves riding the current
    for (let k = 0; k < 5; k++) {
      const lx = x0 + fract(hash(a.x1 * 3 + k) - t * 0.08) * w;
      ctx.fillStyle = T(P.leaves[k % P.leaves.length]);
      ctx.beginPath();
      ctx.ellipse(lx, wy + 1 + (k % 2) * 3, 3, 1.3, 0.3, 0, TAU);
      ctx.fill();
    }
  } else if (terr === 'moor') {
    dark(110);
    waterPit(76, '#2a1e12', '#c8b890');
  } else if (terr === 'viaduct') {
    // a whole span gone: nothing but air down to the treetops in the valley
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, top - 2, w, bottom - top + 2);
    ctx.clip();
    valleyBelow(ctx, x0, x0 + w, top + 4, bottom, P, T, 3);
    ctx.fillStyle = T(mix(P.haze, P.far, 0.2));
    ctx.fillRect(x0, top - 2, w, 6);
    ctx.restore();
  } else if (terr === 'vineyard') {
    ctx.fillStyle = vg(ctx, top, top + 200, T(mix(P.ground.body, '#000000', 0.25)), T(P.ground.deep), '#0a0402');
    ctx.fillRect(x0, top, w, bottom - top);
    ctx.fillStyle = T(mix(P.ground.body, '#e8d8c0', 0.25));
    for (let k = 0; k < 8; k++) {
      ctx.beginPath();
      ctx.ellipse(x0 + hash(a.x1 + k) * w, top + 110 + hash(k * 5 + a.x1) * 20, 5 + hash(k) * 4, 3, 0, 0, TAU);
      ctx.fill();
    }
  } else if (terr === 'fair') {
    dark(100);
    const wy = waterPit(70, '#2a3048', P.lamp);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = alpha(['#ffd27a', '#ff8a6a', '#9ad8ff'][k % 3], 0.25);
      ctx.fillRect(x0 + hash(a.x1 + k * 3) * w, wy + 4 + k * 5, 2, 6);
    }
    ctx.restore();
  } else return false;
  return true;
}

// ---------------------------------------------------------------- props

function pumpkin(ctx, cx, cy, rx, ry, T, col, seed) {
  // ribbed: lobes from the outside in, each lit on the left
  const lobes = [1, 0.78, 0.5, 0.22];
  for (const k of lobes) {
    const g = ctx.createLinearGradient(cx - rx * k, cy - ry, cx + rx * k, cy + ry);
    g.addColorStop(0, T(mix(col, '#ffe0a0', 0.35)));
    g.addColorStop(0.55, T(col));
    g.addColorStop(1, T(mix(col, '#5a1a00', 0.45)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * k, ry, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = alpha('#5a1a00', 0.35);
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
  ctx.strokeStyle = T('#5a6a2a');
  ctx.lineWidth = Math.max(2, rx * 0.16);
  ctx.beginPath();
  ctx.moveTo(cx, cy - ry + 2);
  ctx.quadraticCurveTo(cx + 1, cy - ry - 4, cx + 3 + hash(seed) * 3, cy - ry - 6);
  ctx.stroke();
  ctx.fillStyle = alpha('#fff4d8', 0.25);
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.45, cy - ry * 0.35, rx * 0.16, ry * 0.32, -0.3, 0, TAU);
  ctx.fill();
}

function sack(ctx, x, y, w, h, T, seed, flat) {
  ctx.fillStyle = vg(ctx, y, y + h, T('#e2d2aa'), T('#b8a070'), T('#8a7448'));
  ctx.beginPath();
  if (flat) {
    rr(ctx, x, y, w, h, h * 0.4);
  } else {
    ctx.moveTo(x + 2, y + h);
    ctx.quadraticCurveTo(x - 3, y + h * 0.4, x + w * 0.25, y + 4);
    ctx.lineTo(x + w * 0.4, y - 2);
    ctx.lineTo(x + w * 0.6, y - 2);
    ctx.lineTo(x + w * 0.75, y + 4);
    ctx.quadraticCurveTo(x + w + 3, y + h * 0.4, x + w - 2, y + h);
    ctx.closePath();
  }
  ctx.fill();
  ctx.strokeStyle = alpha('#5a4a2a', 0.25);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let k = 3; k < w - 2; k += 3) {
    ctx.moveTo(x + k, y + 4);
    ctx.lineTo(x + k + (hash(seed + k) - 0.5) * 2, y + h - 2);
  }
  ctx.stroke();
  // the mill's mark stencilled on, and flour dust
  ctx.strokeStyle = alpha('#7a3a2a', 0.55);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.55, Math.min(w, h) * 0.18, 0, TAU);
  ctx.moveTo(x + w / 2, y + h * 0.4);
  ctx.lineTo(x + w / 2, y + h * 0.7);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x + 2, y + 2, w - 4, 2);
  if (!flat) {
    ctx.fillStyle = T('#7a5a34');
    ctx.fillRect(x + w * 0.38, y + 1, w * 0.24, 2.4);
  }
}

function wheel(ctx, cx, cy, r, T, rim = '#2a2016', spoke = '#8a7a5a', n = 8) {
  ctx.fillStyle = T(rim);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = T(mix(rim, '#000000', 0.4));
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.8, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = T(spoke);
  ctx.lineWidth = Math.max(1.2, r * 0.09);
  ctx.beginPath();
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82);
  }
  ctx.stroke();
  ctx.fillStyle = T(spoke);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.18, 0, TAU);
  ctx.fill();
}

function granite(ctx, x, y, w, h, T, seed, light) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, T(mix('#9a9a94', light, 0.25)));
  g.addColorStop(1, T('#4e4e4a'));
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, Math.min(h, w) * 0.35);
  ctx.fill();
  // lichen
  for (let k = 0; k < 5; k++) {
    ctx.fillStyle = alpha(k % 2 ? '#d8d070' : '#e8e8d8', 0.45);
    ctx.beginPath();
    ctx.arc(x + 6 + hash(seed + k) * (w - 12), y + 3 + hash(seed * 3 + k) * (h - 6), 1.6 + hash(k + seed) * 2.4, 0, TAU);
    ctx.fill();
  }
}

function barrelSide(ctx, cx, cy, r, T) {
  // a cask lying on its side, seen end on: hoops, staves and the head
  ctx.fillStyle = vg(ctx, cy - r, cy + r, T('#a87a4a'), T('#7a4e2a'), T('#4a2e16'));
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = T('#2a2a2a');
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1.2, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = alpha('#2a1408', 0.5);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let k = -2; k <= 2; k++) {
    ctx.moveTo(cx + k * r * 0.3, cy - Math.sqrt(Math.max(0, r * r * 0.8 - (k * r * 0.3) ** 2)));
    ctx.lineTo(cx + k * r * 0.3, cy + Math.sqrt(Math.max(0, r * r * 0.8 - (k * r * 0.3) ** 2)));
  }
  ctx.stroke();
  ctx.fillStyle = T('#3a2a1a');
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.45, r * 0.1, 0, TAU);
  ctx.fill();
}

function vineLeaf(ctx, x, y, s, a, col) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, s);
  for (let k = 0; k <= 5; k++) {
    const an = Math.PI * 0.95 + (k / 5) * Math.PI * 1.1;
    const r = k % 2 ? s * 0.62 : s;
    ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function grapeBunch(ctx, x, y, s, T, col) {
  ctx.fillStyle = T(col);
  const rows = [3, 3, 2, 2, 1];
  for (let r = 0; r < rows.length; r++) {
    for (let k = 0; k < rows[r]; k++) {
      ctx.beginPath();
      ctx.arc(x + (k - (rows[r] - 1) / 2) * s * 2 + (r % 2) * s * 0.4, y + r * s * 1.6, s, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = alpha('#ffffff', 0.3);
  ctx.fillRect(x - s * 1.6, y - s * 0.5, s * 0.8, s * 0.6);
  ctx.strokeStyle = T('#5a4a2a');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + 1, y - s * 2.4);
  ctx.stroke();
}

function crate(ctx, x, y, w, h, T) {
  ctx.fillStyle = woodGrad(ctx, y, h, T, '#c8a068', '#a07a48', '#6a4a28');
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = alpha('#000000', 0.3);
  for (let yy = y + h / 3; yy < y + h - 1; yy += h / 3) ctx.fillRect(x, yy, w, 1.2);
  ctx.fillRect(x, y, 2, h);
  ctx.fillRect(x + w - 2, y, 2, h);
}

function balloon(ctx, x, y, r, T, col) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x, y, r * 1.2);
  g.addColorStop(0, T(mix(col, '#ffffff', 0.55)));
  g.addColorStop(0.5, T(col));
  g.addColorStop(1, T(mix(col, '#000000', 0.4)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.9, r, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = T(mix(col, '#000000', 0.3));
  ctx.beginPath();
  ctx.moveTo(x - 2, y + r + 2);
  ctx.lineTo(x + 2, y + r + 2);
  ctx.lineTo(x, y + r - 1);
  ctx.fill();
}

function glowDot(ctx, x, y, r, col, a) {
  ctx.fillStyle = alpha(col, a * 0.22);
  ctx.beginPath();
  ctx.arc(x, y, r * 3.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = alpha(col, a);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

export const FAIR_OB = {
  // ---------- Pumpkin Patch
  pumpkinPile(ctx, o, T) {
    const { x, y, w, h } = o;
    const cols = ['#e8781a', '#d8601a', '#f09a2a', '#e8e0c8', '#c86a1a'];
    const r = mulberry32(o.seed);
    const rb = h * 0.3;
    const n = w > 66 ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const rx = w / n / 2 + 2;
      pumpkin(ctx, x + rx - 2 + k * (w / n), y + h - rb, rx, rb, T, cols[Math.floor(r() * 4)], o.seed + k);
    }
    pumpkin(ctx, x + w * 0.5 + (r() - 0.5) * 6, y + h * 0.36, w * 0.28, h * 0.3, T, cols[Math.floor(r() * cols.length)], o.seed + 9);
    // a curl of vine and a leaf
    ctx.strokeStyle = T('#4a6a2a');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + h);
    ctx.bezierCurveTo(x + 4, y + h - 10, x - 6, y + h - 16, x + 4, y + h - 20);
    ctx.stroke();
    ctx.fillStyle = T('#5a7a30');
    ctx.beginPath();
    ctx.ellipse(x - 2, y + h - 6, 6, 3.4, -0.6, 0, TAU);
    ctx.fill();
  },
  scarecrow(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    const cx = x + w / 2;
    ctx.fillStyle = T('#5a3e24');
    ctx.fillRect(cx - 2, y + 8, 4, h - 8);
    ctx.fillRect(x - 2, y + h * 0.3, w + 4, 3.4);
    // a patched shirt stuffed with straw
    ctx.fillStyle = vg(ctx, y + h * 0.26, y + h * 0.7, T('#7a5aa0'), T('#4a3a6a'));
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.36, y + h * 0.28);
    ctx.lineTo(cx + w * 0.36, y + h * 0.28);
    ctx.lineTo(cx + w * 0.22, y + h * 0.72);
    ctx.lineTo(cx - w * 0.22, y + h * 0.72);
    ctx.fill();
    ctx.strokeStyle = alpha('#2a1a3a', 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 1; k < 4; k++) {
      ctx.moveTo(cx - w * 0.3, y + h * (0.28 + k * 0.1));
      ctx.lineTo(cx + w * 0.3, y + h * (0.28 + k * 0.1));
    }
    ctx.stroke();
    ctx.fillStyle = T('#c8784a');
    ctx.fillRect(cx + 2, y + h * 0.42, 7, 6);
    ctx.strokeStyle = T('#e0c070');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const sx of [x - 1, x + w + 1]) {
      for (let k = 0; k < 4; k++) {
        ctx.moveTo(sx, y + h * 0.3 + 1);
        ctx.lineTo(sx + (sx < cx ? -3 : 3), y + h * 0.3 + 3 + k * 2.4);
      }
    }
    for (let k = 0; k < 5; k++) {
      ctx.moveTo(cx - 6 + k * 3, y + h * 0.72);
      ctx.lineTo(cx - 7 + k * 3.4, y + h * 0.8);
    }
    ctx.stroke();
    // a sack head with a stitched smile, and a hat
    ctx.fillStyle = T('#d8c090');
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.18, h * 0.12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#2a1a10');
    ctx.fillRect(cx - 4, y + h * 0.16, 2, 2);
    ctx.fillRect(cx + 2, y + h * 0.16, 2, 2);
    ctx.strokeStyle = T('#2a1a10');
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.18, 4, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.fillStyle = T('#8a6a3a');
    ctx.fillRect(cx - 11, y + h * 0.08, 22, 2.6);
    ctx.beginPath();
    ctx.moveTo(cx - 6, y + h * 0.08);
    ctx.lineTo(cx - 4, y - 2);
    ctx.lineTo(cx + 5, y - 1);
    ctx.lineTo(cx + 6, y + h * 0.08);
    ctx.fill();
    // a crow that won't be scared, bobbing on the arm
    const bob = Math.abs(Math.sin(t * 3 + o.seed)) * 1.5;
    const bx = x + w - 2;
    const by = y + h * 0.3 - bob;
    ctx.fillStyle = T('#16141a');
    ctx.beginPath();
    ctx.ellipse(bx, by - 4, 5, 3.4, -0.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx + 4, by - 7, 2.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx + 6, by - 7.6);
    ctx.lineTo(bx + 9, by - 6.6);
    ctx.lineTo(bx + 6, by - 6);
    ctx.fill();
    ctx.fillRect(bx - 9, by - 4, 5, 1.6);
    void P;
  },
  harvestBanner(ctx, o, T) {
    const { x, y, w, h } = o;
    const post = T('#6a4a2e');
    backPost(ctx, x - 8, y - 6, o.ground, 6, post);
    backPost(ctx, x + w + 8, y - 6, o.ground, 6, post);
    ctx.strokeStyle = T('#c8b08a');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 3);
    ctx.lineTo(x + w + 8, y - 3);
    ctx.stroke();
    // canvas, hand-painted, a little slack in the middle
    ctx.fillStyle = vg(ctx, y, y + h, T('#f2e6c8'), T('#d8c8a0'));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - 2, y + h);
    ctx.quadraticCurveTo(x + w / 2, y + h + 3, x + 2, y + h);
    ctx.fill();
    ctx.strokeStyle = T('#a8402a');
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    ctx.fillStyle = T('#a8402a');
    ctx.font = `700 ${Math.round(h * 0.42)}px Georgia, 'Times New Roman', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PICK YOUR OWN', x + w / 2 + 6, y + h / 2 + 1, w - 30);
    pumpkin(ctx, x + 12, y + h / 2 + 2, 6, 5, T, '#e8781a', o.seed);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  },
  hayWagon(ctx, o, T) {
    const { x, y, w, h } = o;
    const wr = 18;
    const bed = y + h - wr - 10;
    // hay heaped to a flat top, sides held in by rails
    ctx.fillStyle = vg(ctx, y, bed, T('#ecd08a'), T('#c8a050'));
    ctx.beginPath();
    ctx.moveTo(x - 4, bed);
    ctx.lineTo(x - 2, y + 6);
    ctx.quadraticCurveTo(x, y, x + 10, y);
    ctx.lineTo(x + w - 10, y);
    ctx.quadraticCurveTo(x + w, y, x + w + 2, y + 6);
    ctx.lineTo(x + w + 4, bed);
    ctx.fill();
    ctx.strokeStyle = alpha(T('#fff0b8'), 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 40; k++) {
      const sx = x + hash(o.seed + k) * w;
      const sy = y + 3 + hash(o.seed + k * 7) * (bed - y - 6);
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 5 + hash(k) * 4, sy + (hash(k * 3) - 0.5) * 3);
    }
    ctx.stroke();
    ctx.fillStyle = woodGrad(ctx, bed, 12, T, '#a8402a', '#8a3020', '#5a1a10');
    ctx.fillRect(x - 6, bed, w + 12, 12);
    ctx.fillStyle = alpha('#000000', 0.3);
    for (let xx = x; xx < x + w; xx += 16) ctx.fillRect(xx, bed, 1.4, 12);
    for (let k = 0; k < 3; k++) pumpkin(ctx, x + w * 0.62 + k * 13, bed - 5, 7, 6, T, ['#e8781a', '#f09a2a', '#d8601a'][k], o.seed + k);
    wheel(ctx, x + w * 0.2, y + h - wr, wr, T);
    wheel(ctx, x + w * 0.8, y + h - wr, wr, T);
    ctx.strokeStyle = T('#4a2e16');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 6, bed + 8);
    ctx.lineTo(x - 30, y + h - 6);
    ctx.stroke();
  },

  // ---------- Mill Stream
  flourSacks(ctx, o, T) {
    const { x, y, w, h } = o;
    const bh = h * 0.58;
    const bw = w / 2 + 2;
    sack(ctx, x - 2, y + h - bh, bw, bh, T, o.seed, false);
    sack(ctx, x + w - bw + 2, y + h - bh, bw, bh, T, o.seed + 1, false);
    sack(ctx, x + w * 0.12, y, w * 0.76, h * 0.46, T, o.seed + 2, true);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let k = 0; k < 8; k++) ctx.fillRect(x + hash(o.seed + k) * w, y + h - 1 - hash(k) * 2, 3, 1);
  },
  bramble(ctx, o, T) {
    const { x, y, w, h } = o;
    const r = mulberry32(o.seed);
    // arching canes, thorny, leaves going red, and the last of the blackberries
    ctx.strokeStyle = T('#5a2a3a');
    ctx.lineWidth = 2.2;
    const canes = [];
    for (let k = 0; k < 7; k++) {
      const sx = x + r() * w;
      const ex = x + r() * w;
      const top = y + r() * h * 0.4;
      canes.push([sx, ex, top]);
      ctx.beginPath();
      ctx.moveTo(sx, y + h);
      ctx.quadraticCurveTo((sx + ex) / 2, top - 10, ex, y + h * (0.5 + r() * 0.5));
      ctx.stroke();
    }
    ctx.strokeStyle = T('#7a3a4a');
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (const [sx, ex, top] of canes) {
      for (let u = 0.15; u < 0.9; u += 0.12) {
        const px = sx + (ex - sx) * u;
        const py = y + h - (y + h - top) * Math.sin(u * Math.PI) * 0.95;
        ctx.moveTo(px, py);
        ctx.lineTo(px + 2.4, py - 2.4);
      }
    }
    ctx.stroke();
    for (let k = 0; k < 18; k++) {
      const lx = x + r() * w;
      const ly = y + 4 + r() * (h - 8);
      ctx.fillStyle = T(['#8a2a2a', '#5a6a2a', '#b84a2a', '#6a3a2a'][k % 4]);
      ctx.beginPath();
      ctx.ellipse(lx, ly, 4, 2.4, r() * 3, 0, TAU);
      ctx.fill();
    }
    for (let k = 0; k < 12; k++) {
      ctx.fillStyle = T(k % 4 === 0 ? '#c83a3a' : '#2a1428');
      const bx = x + 4 + r() * (w - 8);
      const by = y + 6 + r() * (h - 14);
      for (let j = 0; j < 4; j++) {
        ctx.beginPath();
        ctx.arc(bx + (j % 2) * 2, by + (j >> 1) * 2, 1.4, 0, TAU);
        ctx.fill();
      }
    }
  },
  flume(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a wooden launder on trestles, carrying water over the path to the wheel
    const leg = T('#4a3220');
    for (const lx of [x - 4, x + w + 4]) {
      backPost(ctx, lx - 6, y + h * 0.6, o.ground, 4, leg);
      backPost(ctx, lx + 6, y + h * 0.6, o.ground, 4, leg);
    }
    ctx.fillStyle = woodGrad(ctx, y, h, T, '#8a6a44', '#6a4a2e', '#3a2614');
    ctx.fillRect(x - 20, y + h * 0.2, w + 40, h * 0.8);
    ctx.fillStyle = alpha('#000000', 0.3);
    for (let xx = x - 20; xx < x + w + 20; xx += 22) ctx.fillRect(xx, y + h * 0.2, 1.4, h * 0.8);
    ctx.fillRect(x - 20, y + h * 0.55, w + 40, 1.2);
    ctx.fillStyle = T(mix(P.water || '#5a8a8a', '#ffffff', 0.35));
    ctx.fillRect(x - 18, y + h * 0.12, w + 36, h * 0.12);
    ctx.fillStyle = T('#5a7a3a');
    for (let k = 0; k < 7; k++) ctx.fillRect(x - 16 + hash(o.seed + k) * (w + 30), y + h * 0.9, 6, 3);
    // a leaky joint dripping
    const jx = x + w * (0.3 + hash(o.seed) * 0.4);
    ctx.fillStyle = alpha('#d8f0f8', 0.8);
    for (let k = 0; k < 3; k++) {
      const p = fract(t * 1.2 + k / 3);
      ctx.fillRect(jx, y + h + p * (o.ground - y - h), 1.4, 4);
    }
  },
  sackStack(ctx, o, T) {
    const { x, y, w, h } = o;
    // sacks laid flat in rows on a pallet, ready for the cart
    const pal = 8;
    ctx.fillStyle = woodGrad(ctx, y + h - pal, pal, T, '#9a7a4a', '#7a5a34', '#4a3420');
    ctx.fillRect(x - 4, y + h - pal, w + 8, pal);
    ctx.fillStyle = alpha('#000000', 0.4);
    for (let xx = x + 6; xx < x + w; xx += 20) ctx.fillRect(xx, y + h - pal + 3, 8, pal - 3);
    const rows = 4;
    const rh = (h - pal) / rows;
    for (let r = 0; r < rows; r++) {
      const n = r % 2 ? 2 : 3;
      for (let k = 0; k < n; k++) {
        const bw = (w + (r % 2 ? 0 : 4)) / n;
        sack(ctx, x - (r % 2 ? 0 : 2) + k * bw, y + h - pal - (r + 1) * rh, bw - 1, rh + 1, T, o.seed + r * 3 + k, true);
      }
    }
  },

  // ---------- Heather Moor
  peatStack(ctx, o, T) {
    const { x, y, w, h } = o;
    // turves cut and stacked to dry, a cap of turf on top to keep the rain off
    const rows = 4;
    const rh = (h - 6) / rows;
    for (let r = 0; r < rows; r++) {
      const inset = r * 3;
      const n = Math.max(2, Math.floor((w - inset * 2) / 14));
      const bw = (w - inset * 2) / n;
      for (let k = 0; k < n; k++) {
        ctx.fillStyle = vg(ctx, y + h - (r + 1) * rh, y + h - r * rh, T(mix('#5a3a24', '#3a2414', hash(o.seed + r * 7 + k))), T('#24160c'));
        rr(ctx, x + inset + k * bw + 0.6, y + h - (r + 1) * rh + 0.6, bw - 1.2, rh - 1.2, 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = T('#5a6a34');
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 8);
    ctx.quadraticCurveTo(x + w / 2, y - 3, x + w - 6, y + 8);
    ctx.lineTo(x + w - 10, y + 10);
    ctx.lineTo(x + 10, y + 10);
    ctx.fill();
    ctx.strokeStyle = T('#7a8a44');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const gx = x + 10 + k * ((w - 20) / 9);
      ctx.moveTo(gx, y + 5);
      ctx.lineTo(gx + 1, y + 1 - hash(o.seed + k) * 4);
    }
    ctx.stroke();
  },
  gorse(ctx, o, T) {
    const { x, y, w, h } = o;
    const r = mulberry32(o.seed);
    // a dense green-black bush of spines, blazing with yellow flowers
    ctx.fillStyle = T('#2a3a1e');
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.quadraticCurveTo(x - 2, y + h * 0.3, x + w * 0.35, y + 2);
    ctx.quadraticCurveTo(x + w * 0.6, y - 4, x + w * 0.8, y + h * 0.2);
    ctx.quadraticCurveTo(x + w + 4, y + h * 0.5, x + w, y + h);
    ctx.fill();
    ctx.strokeStyle = T('#4a5a2a');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 90; k++) {
      const px = x + r() * w;
      const py = y + 4 + r() * (h - 6);
      const a = r() * TAU;
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a) * 4, py + Math.sin(a) * 4);
    }
    ctx.stroke();
    for (let k = 0; k < 46; k++) {
      ctx.fillStyle = T(k % 3 ? '#f2c42a' : '#ffe070');
      const px = x + 3 + r() * (w - 6);
      const py = y + 3 + r() * (h * 0.75);
      ctx.beginPath();
      ctx.arc(px, py, 1.4 + r() * 1.2, 0, TAU);
      ctx.fill();
    }
  },
  dolmen(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // two uprights and the capstone laid across them, older than anyone's stories
    const up = T('#5a5a56');
    ctx.fillStyle = up;
    ctx.beginPath();
    ctx.moveTo(x - 22, o.ground);
    ctx.lineTo(x - 20, y + h - 2);
    ctx.lineTo(x - 2, y + h - 4);
    ctx.lineTo(x - 6, o.ground);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w + 6, o.ground);
    ctx.lineTo(x + w + 2, y + h - 4);
    ctx.lineTo(x + w + 20, y + h - 2);
    ctx.lineTo(x + w + 24, o.ground);
    ctx.fill();
    granite(ctx, x - 28, y, w + 56, h, T, o.seed, P.light);
    ctx.fillStyle = alpha('#000000', 0.25);
    ctx.fillRect(x - 20, y + h - 4, w + 40, 4);
  },
  tor(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // weathered granite in pillowy slabs, flat on top
    const layers = 3;
    const lh = h / layers;
    for (let k = 0; k < layers; k++) {
      const inset = k === 0 ? 4 : k === 1 ? -4 : 0;
      granite(ctx, x + inset - 2, y + k * lh, w - inset * 2 + 4, lh + 4, T, o.seed + k, P.light);
    }
    ctx.fillStyle = alpha('#000000', 0.25);
    for (let k = 1; k < layers; k++) ctx.fillRect(x, y + k * lh, w, 2);
    ctx.fillStyle = T(P.heather || '#9a4a8a');
    for (let k = 0; k < 12; k++) ctx.fillRect(x - 6 + hash(o.seed + k) * (w + 12), y + h - 3 - hash(k) * 4, 2, 2);
  },

  // ---------- The Viaduct
  milkChurns(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const churn = (cx, by, ch, cw) => {
      const g = ctx.createLinearGradient(cx - cw / 2, 0, cx + cw / 2, 0);
      g.addColorStop(0, T('#8a9098'));
      g.addColorStop(0.35, T(mix('#e8eef4', P.light, 0.4)));
      g.addColorStop(1, T('#4a5058'));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx - cw / 2, by);
      ctx.lineTo(cx - cw / 2, by - ch * 0.62);
      ctx.quadraticCurveTo(cx - cw / 2, by - ch * 0.78, cx - cw * 0.26, by - ch * 0.84);
      ctx.lineTo(cx - cw * 0.26, by - ch);
      ctx.lineTo(cx + cw * 0.26, by - ch);
      ctx.lineTo(cx + cw * 0.26, by - ch * 0.84);
      ctx.quadraticCurveTo(cx + cw / 2, by - ch * 0.78, cx + cw / 2, by - ch * 0.62);
      ctx.lineTo(cx + cw / 2, by);
      ctx.fill();
      ctx.fillStyle = T('#5a6068');
      ctx.fillRect(cx - cw * 0.32, by - ch - 2, cw * 0.64, 3);
      ctx.fillRect(cx - cw / 2, by - ch * 0.3, cw, 1.6);
      ctx.fillRect(cx - cw / 2, by - 3, cw, 3);
    };
    churn(x + w * 0.28, y + h, h, w * 0.5);
    churn(x + w * 0.72, y + h, h * 0.9, w * 0.46);
  },
  luggage(ctx, o, T) {
    const { x, y, w, h } = o;
    // a steamer trunk, a suitcase on it, labels from everywhere
    const th = h * 0.58;
    ctx.fillStyle = vg(ctx, y + h - th, y + h, T('#5a6a8a'), T('#2a3450'));
    rr(ctx, x, y + h - th, w, th, 3);
    ctx.fill();
    ctx.fillStyle = T('#8a6a3a');
    ctx.fillRect(x + w * 0.22, y + h - th, 4, th);
    ctx.fillRect(x + w * 0.72, y + h - th, 4, th);
    ctx.fillStyle = T('#d8b860');
    for (const [cx, cy] of [
      [x, y + h - th],
      [x + w - 5, y + h - th],
      [x, y + h - 5],
      [x + w - 5, y + h - 5],
    ])
      ctx.fillRect(cx, cy, 5, 5);
    const sw = w * 0.7;
    const sh = h - th;
    ctx.fillStyle = vg(ctx, y, y + sh, T('#b8743a'), T('#7a4a20'));
    rr(ctx, x + w * 0.14, y, sw, sh, 3);
    ctx.fill();
    ctx.fillStyle = T('#3a2414');
    ctx.fillRect(x + w * 0.14 + sw / 2 - 6, y - 4, 12, 4);
    for (const [lx, c] of [
      [0.3, '#f0e6d0'],
      [0.55, '#e8c040'],
    ]) {
      ctx.fillStyle = T(c);
      ctx.fillRect(x + w * lx, y + sh * 0.3, 9, 6);
    }
    ctx.fillStyle = T('#c84a3a');
    ctx.beginPath();
    ctx.arc(x + w * 0.3, y + h - th * 0.5, 4, 0, TAU);
    ctx.fill();
  },
  brazier(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    const cx = x + w / 2;
    const top = y + h * 0.3;
    // an iron fire basket on legs, coals glowing, flames licking out of the top
    ctx.strokeStyle = T('#1a1614');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h);
    ctx.lineTo(x + 8, top + h * 0.4);
    ctx.moveTo(x + w - 4, y + h);
    ctx.lineTo(x + w - 8, top + h * 0.4);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const flick = 0.85 + 0.15 * Math.sin(t * 17 + o.seed);
    const g = ctx.createRadialGradient(cx, top + 8, 0, cx, top + 8, 70);
    g.addColorStop(0, `rgba(255,150,60,${0.35 * flick})`);
    g.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 70, top - 62, 140, 140);
    ctx.restore();
    ctx.fillStyle = vg(ctx, top, top + h * 0.45, '#ffb040', '#e84a1a', '#6a1a0a');
    ctx.beginPath();
    ctx.moveTo(x + 2, top);
    ctx.lineTo(x + w - 2, top);
    ctx.lineTo(x + w - 8, top + h * 0.42);
    ctx.lineTo(x + 8, top + h * 0.42);
    ctx.fill();
    ctx.strokeStyle = T('#1a1614');
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + 2, top);
    ctx.lineTo(x + w - 2, top);
    for (let k = 1; k < 5; k++) {
      ctx.moveTo(x + 2 + (k * (w - 4)) / 5, top);
      ctx.lineTo(x + 8 + (k * (w - 16)) / 5, top + h * 0.42);
    }
    ctx.moveTo(x + 5, top + h * 0.22);
    ctx.lineTo(x + w - 5, top + h * 0.22);
    ctx.moveTo(x + 8, top + h * 0.42);
    ctx.lineTo(x + w - 8, top + h * 0.42);
    ctx.stroke();
    for (let k = 0; k < 3; k++) {
      const fh = (h * 0.32) * (0.7 + 0.3 * Math.sin(t * 11 + k * 2 + o.seed));
      ctx.fillStyle = k === 1 ? 'rgba(255,230,140,0.95)' : 'rgba(255,140,50,0.85)';
      ctx.beginPath();
      ctx.moveTo(cx - 9 + k * 6, top + 1);
      ctx.quadraticCurveTo(cx - 8 + k * 6, top - fh * 0.5, cx - 4 + k * 5 + Math.sin(t * 7 + k) * 2, top - fh);
      ctx.quadraticCurveTo(cx - 1 + k * 6, top - fh * 0.4, cx + 1 + k * 6, top + 1);
      ctx.fill();
    }
    for (let k = 0; k < 4; k++) {
      const p = fract(t * 0.7 + k / 4 + hash(o.seed));
      ctx.fillStyle = `rgba(255,190,90,${1 - p})`;
      ctx.fillRect(cx + Math.sin(p * 9 + k) * 6, top - 6 - p * 50, 1.6, 1.6);
    }
    void P;
  },
  signalGantry(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a lattice girder over the line, semaphore arms on top
    const post = T('#3a3a40');
    backPost(ctx, x - 8, y + h * 0.5, o.ground, 6, post);
    backPost(ctx, x + w + 8, y + h * 0.5, o.ground, 6, post);
    ctx.fillStyle = T('#4a4a52');
    ctx.fillRect(x - 14, y + h * 0.5, w + 28, 3);
    ctx.fillRect(x - 14, y + h - 3, w + 28, 3);
    ctx.strokeStyle = T('#4a4a52');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let xx = x - 14; xx < x + w + 14; xx += 10) {
      ctx.moveTo(xx, y + h * 0.5);
      ctx.lineTo(xx + 10, y + h);
      ctx.moveTo(xx + 10, y + h * 0.5);
      ctx.lineTo(xx, y + h);
    }
    ctx.stroke();
    for (const [sx, ph] of [
      [x + w * 0.25, 0],
      [x + w * 0.75, 1.7],
    ]) {
      ctx.fillStyle = T('#2a2a30');
      ctx.fillRect(sx - 1.4, y, 2.8, h * 0.5);
      const off = Math.sin(t * 0.4 + ph + o.seed) > 0.6;
      ctx.save();
      ctx.translate(sx + 1.4, y + 4);
      ctx.rotate(off ? -0.7 : 0);
      ctx.fillStyle = T('#c83a2a');
      ctx.fillRect(0, -2.4, 20, 4.8);
      ctx.fillStyle = T('#f4f0e6');
      ctx.fillRect(13, -2.4, 3, 4.8);
      ctx.restore();
      const lampC = off ? '#7aff9a' : '#ff5a4a';
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glowDot(ctx, sx - 4, y + 9, 1.8, lampC, 0.8);
      ctx.restore();
    }
    void P;
  },
  goodsWagon(ctx, o, T, P) {
    const { x, y, w, h } = o;
    const wr = 10;
    const bodyB = y + h - wr - 6;
    // a wooden box van: planked sides, a sliding door, a flat roof you can stand on
    ctx.fillStyle = woodGrad(ctx, y, bodyB - y, T, '#8a4a34', '#6a3424', '#3a1a10');
    ctx.fillRect(x, y + 4, w, bodyB - y - 4);
    ctx.fillStyle = alpha('#000000', 0.22);
    for (let xx = x + 6; xx < x + w; xx += 6) ctx.fillRect(xx, y + 6, 1, bodyB - y - 6);
    ctx.fillStyle = T('#2a2a2e');
    ctx.fillRect(x - 3, y, w + 6, 5);
    ctx.fillRect(x, bodyB - 4, w, 4);
    ctx.strokeStyle = T('#2a2a2e');
    ctx.lineWidth = 2;
    const dx = x + w * 0.38;
    const dw = w * 0.24;
    ctx.strokeRect(dx, y + 9, dw, bodyB - y - 13);
    ctx.beginPath();
    ctx.moveTo(dx, y + 9);
    ctx.lineTo(dx + dw, bodyB - 4);
    ctx.moveTo(dx + dw, y + 9);
    ctx.lineTo(dx, bodyB - 4);
    ctx.stroke();
    ctx.fillStyle = T('#f0ece0');
    ctx.font = `700 ${Math.round(h * 0.13)}px Georgia, serif`;
    ctx.fillText('G.W.', x + 8, y + 22);
    ctx.font = `400 ${Math.round(h * 0.09)}px Georgia, serif`;
    ctx.fillText('10 TONS', x + w - 46, bodyB - 10);
    ctx.fillStyle = T('#1a1a1e');
    ctx.fillRect(x - 8, bodyB - 2, w + 16, 4);
    for (const bx of [x - 10, x + w + 4]) ctx.fillRect(bx, bodyB - 6, 6, 6);
    for (const wx of [x + w * 0.2, x + w * 0.8]) {
      wheel(ctx, wx, y + h - wr, wr, T, '#1a1a1e', '#5a5a60', 6);
    }
    ctx.fillStyle = alpha(P.light, 0.12);
    ctx.fillRect(x, y + 4, w, 6);
  },

  // ---------- Vineyard Hills
  grapeCrates(ctx, o, T) {
    const { x, y, w, h } = o;
    const ch = h * 0.5;
    crate(ctx, x, y + h - ch, w, ch, T);
    crate(ctx, x + w * 0.12, y + h * 0.1, w * 0.76, ch * 0.8, T);
    const r = mulberry32(o.seed);
    for (let k = 0; k < 4; k++) grapeBunch(ctx, x + w * 0.2 + k * w * 0.18, y + h * 0.1 - 2, 2.2, T, r() < 0.6 ? '#4a2a5a' : '#a8b040');
    for (let k = 0; k < 2; k++) vineLeaf(ctx, x + w * (0.25 + k * 0.5), y + h * 0.1, 6, r() * 2, T(['#c84a2a', '#d8a030'][k]));
  },
  cask(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // an oak cask standing on end, bellied, with iron hoops and a chalked number
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, T('#5a3820'));
    g.addColorStop(0.35, T(mix('#b8844e', P.light, 0.15)));
    g.addColorStop(1, T('#3a2414'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 2);
    ctx.quadraticCurveTo(x - 3, y + h / 2, x + 4, y + h);
    ctx.lineTo(x + w - 4, y + h);
    ctx.quadraticCurveTo(x + w + 3, y + h / 2, x + w - 4, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha('#1a0c04', 0.35);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let k = 1; k < 6; k++) {
      const sx = x + (w * k) / 6;
      ctx.moveTo(sx, y + 3);
      ctx.quadraticCurveTo(sx + (sx - x - w / 2) * 0.12, y + h / 2, sx, y + h - 1);
    }
    ctx.stroke();
    ctx.fillStyle = T('#2a2a2c');
    for (const fy of [0.12, 0.3, 0.7, 0.88]) {
      const bulge = Math.sin(fy * Math.PI) * 3;
      ctx.fillRect(x + 3 - bulge, y + h * fy - 1.4, w - 6 + bulge * 2, 2.8);
    }
    ctx.fillStyle = vg(ctx, y, y + 5, T('#c8a070'), T('#8a5a34'));
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 3, w / 2 - 4, 3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = alpha('#f4f0e6', 0.75);
    ctx.font = `600 ${Math.round(h * 0.2)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText(String(12 + (o.seed % 30)), x + w / 2, y + h * 0.56);
    ctx.textAlign = 'start';
  },
  vines(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    const r = mulberry32(o.seed);
    // a short row: stakes, wires, gnarled trunks, leaves turning, grapes hanging
    ctx.fillStyle = T('#6a5034');
    ctx.fillRect(x, y + 2, 3, h - 2);
    ctx.fillRect(x + w - 3, y + 2, 3, h - 2);
    ctx.strokeStyle = T('#8a8a8a');
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (const fy of [0.15, 0.45]) {
      ctx.moveTo(x, y + h * fy);
      ctx.lineTo(x + w, y + h * fy);
    }
    ctx.stroke();
    ctx.strokeStyle = T('#4a3020');
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = 1; k <= 2; k++) {
      const vx = x + (w * k) / 3;
      ctx.moveTo(vx, y + h);
      ctx.bezierCurveTo(vx - 4, y + h * 0.7, vx + 4, y + h * 0.6, vx, y + h * 0.45);
    }
    ctx.stroke();
    const sway = Math.sin(t * 1.4 + o.seed) * 0.08;
    for (let k = 0; k < 16; k++) {
      vineLeaf(ctx, x + 4 + r() * (w - 8), y + 4 + r() * h * 0.5, 5 + r() * 3, r() * 6 + sway, T(P.leaves[k % P.leaves.length]));
    }
    for (let k = 0; k < 4; k++) grapeBunch(ctx, x + 8 + r() * (w - 16), y + h * 0.5 + r() * 4, 2, T, r() < 0.7 ? '#3a1a4a' : '#9aa83a');
  },
  cellarArch(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // the old stone gateway to the cellars, ivy gone red over it
    const stone = T('#c8b090');
    backPost(ctx, x - 14, y + h * 0.4, o.ground, 22, T('#a8906e'));
    backPost(ctx, x + w + 14, y + h * 0.4, o.ground, 22, T('#a8906e'));
    ctx.fillStyle = vg(ctx, y, y + h, stone, T('#8a7454'));
    ctx.beginPath();
    ctx.moveTo(x - 26, y + h);
    ctx.lineTo(x - 26, y);
    ctx.lineTo(x + w + 26, y);
    ctx.lineTo(x + w + 26, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.quadraticCurveTo(x + w / 2, y + h * 0.35, x, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha('#3a2a18', 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      const ax = x + w * u;
      const ay = y + h - (1 - (2 * u - 1) ** 2) * h * 0.33;
      ctx.moveTo(ax, ay);
      ctx.lineTo(x + w / 2 + (ax - x - w / 2) * 1.25, y + 2);
    }
    ctx.stroke();
    ctx.fillStyle = T('#d8c4a0');
    ctx.fillRect(x + w / 2 - 6, y + 2, 12, h * 0.42);
    ctx.fillStyle = T('#5a4a34');
    ctx.font = `700 ${Math.round(h * 0.2)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('1868', x + w / 2, y + h * 0.3, 11);
    ctx.textAlign = 'start';
    const r = mulberry32(o.seed);
    for (let k = 0; k < 24; k++) {
      const vx = x - 26 + r() * (w * 0.4);
      vineLeaf(ctx, vx, y + r() * h * 0.8, 4 + r() * 2, r() * 6, T(['#a83a2a', '#c85a2a', '#8a2a2a'][k % 3]));
    }
    void P;
  },
  barrelRack(ctx, o, T) {
    const { x, y, w, h } = o;
    const plank = 8;
    const rows = 2;
    const r = (h - plank) / rows / 2;
    ctx.fillStyle = woodGrad(ctx, y, h, T, '#6a4a2e', '#4a3220', '#2a1a10');
    ctx.fillRect(x, y, 6, h);
    ctx.fillRect(x + w - 6, y, 6, h);
    for (let row = 0; row < rows; row++) {
      const n = Math.max(2, Math.floor((w - 8) / (r * 2)));
      const cy = y + plank + r + row * r * 2;
      for (let k = 0; k < n; k++) barrelSide(ctx, x + 4 + r + k * ((w - 8 - r * 2) / Math.max(1, n - 1)), cy, r - 0.5, T);
    }
    ctx.fillStyle = woodGrad(ctx, y, plank, T, '#a87a4a', '#7a5432', '#4a3220');
    ctx.fillRect(x - 4, y, w + 8, plank);
    ctx.fillStyle = T('#e8e0d0');
    ctx.fillRect(x + w * 0.2, y + plank + 4, 14, 6);
  },

  // ---------- The Harvest Fair
  prizeVeg(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a show table: a cloth to the ground, the biggest marrow in three valleys, and a rosette
    const ty = y + h * 0.42;
    ctx.fillStyle = vg(ctx, ty, y + h, T('#f4ece0'), T('#c8bca8'));
    ctx.fillRect(x, ty, w, y + h - ty);
    ctx.strokeStyle = alpha('#8a7a6a', 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let xx = x + 8; xx < x + w; xx += 9) {
      ctx.moveTo(xx, ty + 3);
      ctx.lineTo(xx - 1, y + h);
    }
    ctx.stroke();
    ctx.fillStyle = vg(ctx, y, ty, T('#8ab05a'), T('#3a6a2a'));
    ctx.beginPath();
    ctx.ellipse(x + w * 0.42, ty - h * 0.2, w * 0.36, h * 0.22, -0.05, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = alpha('#e8f0c0', 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let k = -2; k <= 2; k++) {
      ctx.moveTo(x + w * 0.12, ty - h * 0.2 + k * 2);
      ctx.quadraticCurveTo(x + w * 0.42, ty - h * 0.2 + k * 3.6, x + w * 0.72, ty - h * 0.2 + k * 2);
    }
    ctx.stroke();
    pumpkin(ctx, x + w * 0.84, ty - h * 0.18, w * 0.13, h * 0.2, T, '#f09a2a', o.seed);
    // the rosette
    const rx = x + w * 0.5;
    const ry = ty + 9;
    ctx.fillStyle = T('#2a5ab0');
    ctx.fillRect(rx - 4, ry, 3, 12);
    ctx.fillRect(rx + 1, ry, 3, 12);
    ctx.beginPath();
    ctx.arc(rx, ry, 6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#f2c040');
    ctx.beginPath();
    ctx.arc(rx, ry, 3, 0, TAU);
    ctx.fill();
    void P;
  },
  coconutShy(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // posts with cups on top, a coconut in every cup, a striped cloth behind
    ctx.fillStyle = T('#a83a3a');
    ctx.fillRect(x, y + h * 0.25, w, h * 0.42);
    ctx.fillStyle = T('#f0e6d0');
    for (let k = 0; k < 6; k += 2) ctx.fillRect(x + (k * w) / 6, y + h * 0.25, w / 6, h * 0.42);
    const n = 3;
    for (let k = 0; k < n; k++) {
      const px = x + 8 + (k * (w - 16)) / (n - 1);
      ctx.fillStyle = T('#d8c8a0');
      ctx.fillRect(px - 1.6, y + 10, 3.2, h - 10);
      ctx.fillStyle = T('#8a8a90');
      ctx.beginPath();
      ctx.moveTo(px - 5, y + 9);
      ctx.lineTo(px + 5, y + 9);
      ctx.lineTo(px + 3, y + 13);
      ctx.lineTo(px - 3, y + 13);
      ctx.fill();
      ctx.fillStyle = vg(ctx, y, y + 10, T('#8a5a34'), T('#4a2e16'));
      ctx.beginPath();
      ctx.ellipse(px, y + 4.6, 5.4, 5, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = alpha('#2a1408', 0.5);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(px - 3, y + 2);
      ctx.lineTo(px + 2, y + 7);
      ctx.stroke();
    }
    ctx.fillStyle = T('#f2c040');
    ctx.font = `700 ${Math.round(h * 0.17)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('3 BALLS', x + w / 2, y + h * 0.82, w - 6);
    ctx.textAlign = 'start';
    void P;
  },
  balloons(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a balloon seller's bunch, tied to a cart at the side of the path
    const r = mulberry32(o.seed);
    const cols = ['#e8433a', '#f2c040', '#3a8ad8', '#5ab060', '#e870a8', '#f08a3a', '#a868d8'];
    const sway = Math.sin(t * 1.3 + o.seed) * 3;
    const tieX = x + w + 26;
    const tieY = o.ground - 26;
    const pts = [];
    for (let k = 0; k < 11; k++) pts.push([x + 8 + r() * (w - 16) + sway * (0.5 + r() * 0.5), y + 8 + r() * (h - 18), 8 + r() * 3, cols[k % cols.length]]);
    ctx.strokeStyle = alpha('#f0f0f0', 0.7);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const [bx, by, br] of pts) {
      ctx.moveTo(bx, by + br + 2);
      ctx.quadraticCurveTo((bx + tieX) / 2, (by + tieY) / 2 + 10, tieX, tieY);
    }
    ctx.stroke();
    pts.sort((a, b) => a[1] - b[1]);
    for (const [bx, by, br, c] of pts) balloon(ctx, bx, by, br, T, c);
    // the little cart they're tied to
    ctx.fillStyle = woodGrad(ctx, tieY, 18, T, '#3a7ab0', '#2a5a88', '#1a3a5a');
    ctx.fillRect(tieX - 12, tieY, 26, 16);
    wheel(ctx, tieX - 6, o.ground - 6, 6, T, '#1a1a1e', '#8a8a90', 6);
    wheel(ctx, tieX + 8, o.ground - 6, 6, T, '#1a1a1e', '#8a8a90', 6);
    void P;
  },
  organWagon(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    const wr = 14;
    const bodyB = y + h - wr - 4;
    // a showman's organ wagon: carved and gilded, pipes in the middle, lights all round
    ctx.fillStyle = vg(ctx, y, bodyB, T('#8a2a3a'), T('#5a1424'));
    ctx.fillRect(x, y + 6, w, bodyB - y - 6);
    ctx.fillStyle = T('#d8a840');
    ctx.fillRect(x - 4, y, w + 8, 6);
    ctx.fillRect(x - 2, bodyB - 4, w + 4, 4);
    ctx.fillRect(x, y + 6, 4, bodyB - y - 6);
    ctx.fillRect(x + w - 4, y + 6, 4, bodyB - y - 6);
    // pipes
    const pw = w * 0.4;
    const px = x + (w - pw) / 2;
    const n = 9;
    for (let k = 0; k < n; k++) {
      const ph = (bodyB - y - 24) * (0.55 + 0.45 * Math.sin((k / (n - 1)) * Math.PI));
      const g = ctx.createLinearGradient(px + (k * pw) / n, 0, px + ((k + 1) * pw) / n, 0);
      g.addColorStop(0, T('#f8e0a0'));
      g.addColorStop(1, T('#a8782a'));
      ctx.fillStyle = g;
      ctx.fillRect(px + (k * pw) / n + 0.6, bodyB - 8 - ph, pw / n - 1.2, ph);
      ctx.fillStyle = T('#3a1a10');
      ctx.fillRect(px + (k * pw) / n + 1.6, bodyB - 8 - ph * 0.3, pw / n - 3.2, 2);
    }
    // painted panels either side, scrolls
    for (const sx of [x + 8, x + w - 8 - (w - pw) / 2 + 12]) {
      ctx.fillStyle = T('#2a4a7a');
      ctx.fillRect(sx, y + 14, (w - pw) / 2 - 20, bodyB - y - 28);
      ctx.strokeStyle = T('#d8a840');
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(sx + ((w - pw) / 2 - 20) / 2, y + (bodyB - y) / 2, 7, 0, TAU * 0.8);
      ctx.stroke();
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 12; k++) {
      const on = 0.5 + 0.5 * Math.sin(t * 4 - k * 0.9);
      glowDot(ctx, x + 4 + (k * (w - 8)) / 11, y + 3, 1.6, P.lamp || '#ffc070', 0.4 + 0.6 * on);
    }
    ctx.restore();
    wheel(ctx, x + w * 0.2, y + h - wr, wr, T, '#d8a840', '#8a2a3a', 10);
    wheel(ctx, x + w * 0.8, y + h - wr, wr, T, '#d8a840', '#8a2a3a', 10);
    // notes drifting out of it
    ctx.fillStyle = alpha('#fff2d0', 0.8);
    for (let k = 0; k < 2; k++) {
      const p = fract(t * 0.35 + k * 0.5 + hash(o.seed));
      const nx = x + w * 0.5 + Math.sin(p * 6 + k) * 10 + p * 20;
      const ny = y - 6 - p * 40;
      ctx.globalAlpha = 1 - p;
      ctx.beginPath();
      ctx.ellipse(nx, ny, 2.4, 1.8, -0.4, 0, TAU);
      ctx.fill();
      ctx.fillRect(nx + 1.6, ny - 8, 1, 8);
      ctx.globalAlpha = 1;
    }
  },
};

// ---------------------------------------------------------------- movers

/** Rolling skins for chapter 6. Called with the context already rotated. False if not ours. */
export function fairRoller(ctx, m, r, T, P) {
  if (m.skin === 'pumpkin') {
    // a prize pumpkin got away: the ribs turn as it rolls
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.1);
    g.addColorStop(0, T('#ffb24a'));
    g.addColorStop(0.6, T('#e8701a'));
    g.addColorStop(1, T('#8a3a08'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = alpha('#6a2a04', 0.45);
    ctx.lineWidth = 1.2;
    for (const k of [0.75, 0.42, 0.12]) {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * k, r, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = T('#5a6a2a');
    ctx.fillRect(-2, -r - 4, 4, 6);
  } else if (m.skin === 'millstone') {
    ctx.fillStyle = T('#8a8682');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#5a5652');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r - 2, 0, TAU);
    ctx.stroke();
    // the dressing: harps of furrows cut into the face
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      ctx.moveTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25);
      ctx.lineTo(Math.cos(a + 0.35) * r * 0.92, Math.sin(a + 0.35) * r * 0.92);
    }
    ctx.stroke();
    ctx.fillStyle = T('#2a2622');
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = alpha('#ffffff', 0.25);
    ctx.fillRect(-r * 0.6, -r * 0.1, r * 0.2, 1.4);
  } else if (m.skin === 'cableDrum') {
    ctx.fillStyle = T('#a8804a');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#5a3a1a');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r - 1.6, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = T('#2a2a2e');
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#a8804a');
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#3a2a1a');
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, 1.6, 0, TAU);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.1, 0, TAU);
    ctx.fill();
  } else return false;
  void P;
  return true;
}

/** Swinging things for chapter 6: a flour sack on the mill hoist, a fairground swing boat. */
export function fairSwing(ctx, m, s, T, P, t) {
  if (m.skin === 'sack') {
    // the hoist rope comes down from the loft door far above, over a pulley
    ctx.strokeStyle = T('#c8a868');
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(m.ax, m.ay - 300);
    ctx.lineTo(m.ax, m.ay - 8);
    ctx.moveTo(m.ax, m.ay);
    ctx.lineTo(s.x, s.y - 16);
    ctx.stroke();
    ctx.fillStyle = T('#5a4030');
    ctx.beginPath();
    ctx.arc(m.ax, m.ay - 4, 6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#2a2016');
    ctx.beginPath();
    ctx.arc(m.ax, m.ay - 4, 2, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(-s.th);
    sack(ctx, -14, -16, 28, 34, T, 7, false);
    ctx.restore();
    void t;
    return true;
  }
  if (m.skin === 'swingBoat') {
    // a striped A-frame and a painted boat swinging from it
    const leg = T('#3a2a40');
    ctx.strokeStyle = leg;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(m.ax - 150, m.ground);
    ctx.lineTo(m.ax, m.ay - 6);
    ctx.lineTo(m.ax + 150, m.ground);
    ctx.stroke();
    ctx.strokeStyle = T('#f0e0c0');
    ctx.lineWidth = 1.4;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(m.ax - 150, m.ground);
    ctx.lineTo(m.ax, m.ay - 6);
    ctx.lineTo(m.ax + 150, m.ground);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 1; k < 8; k++) {
      const u = k / 8;
      const on = 0.6 + 0.4 * Math.sin(t * 4 + k);
      glowDot(ctx, m.ax - 150 * (1 - u), m.ay - 6 + (m.ground - m.ay + 6) * (1 - u), 1.4, P.lamp || '#ffc070', on);
      glowDot(ctx, m.ax + 150 * (1 - u), m.ay - 6 + (m.ground - m.ay + 6) * (1 - u), 1.4, P.lamp || '#ffc070', on);
    }
    ctx.restore();
    ctx.strokeStyle = T('#8a8a90');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(m.ax - 3, m.ay);
    ctx.lineTo(s.x - 8, s.y - 10);
    ctx.moveTo(m.ax + 3, m.ay);
    ctx.lineTo(s.x + 8, s.y - 10);
    ctx.stroke();
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(-s.th);
    ctx.fillStyle = vg(ctx, -12, 14, T('#3a8ad8'), T('#1a4a8a'));
    ctx.beginPath();
    ctx.moveTo(-26, -14);
    ctx.quadraticCurveTo(-22, 12, 0, 14);
    ctx.quadraticCurveTo(22, 12, 26, -14);
    ctx.lineTo(16, -8);
    ctx.lineTo(-16, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = T('#f2c040');
    ctx.fillRect(-20, -2, 40, 3);
    ctx.fillStyle = T('#e8433a');
    ctx.beginPath();
    ctx.arc(0, 5, 3.4, 0, TAU);
    ctx.fill();
    ctx.restore();
    return true;
  }
  return false;
}

/** Conkers: a twig of spiky husks dropping out of a horse chestnut. False if not ours. */
export function fairDrop(ctx, m, s, T, t, P) {
  if (m.skin !== 'conker') return false;
  const lx = m.x;
  const ly = m.y0 - 8;
  // a bough of a big horse chestnut, reaching down from above, hand-shaped leaves gone yellow
  ctx.strokeStyle = T('#3a2a1a');
  ctx.lineCap = 'round';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(lx + 170, ly - 170);
  ctx.quadraticCurveTo(lx + 60, ly - 30, lx - 100, ly - 26);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(lx + 40, ly - 34);
  ctx.quadraticCurveTo(lx + 10, ly - 10, lx - 4, ly - 2);
  ctx.moveTo(lx - 40, ly - 28);
  ctx.lineTo(lx - 60, ly - 6);
  ctx.moveTo(lx + 100, ly - 80);
  ctx.lineTo(lx + 120, ly - 40);
  ctx.stroke();
  const cols = P.leaves || ['#e8a030', '#c8602a', '#f0c850'];
  const r = mulberry32(m.seed);
  const spots = [
    [-96, -30], [-70, -8], [-50, -34], [-30, 0], [-6, -14], [16, -40], [30, 2], [56, -20], [84, -52], [112, -36], [124, -92], [150, -130],
  ];
  for (const [fx0, fy0] of spots) {
    const fx = lx + fx0 + (r() - 0.5) * 8;
    const fy = ly + fy0 + (r() - 0.5) * 6;
    const sz = 8 + r() * 5;
    const turn = (r() - 0.5) * 1.4;
    for (let j = 0; j < 5; j++) {
      const a = Math.PI / 2 + turn + (j - 2) * 0.5;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(a);
      ctx.fillStyle = T(mix(cols[(Math.floor(r() * cols.length))], '#5a4a20', r() * 0.25));
      ctx.beginPath();
      ctx.ellipse(sz * (j === 2 ? 1.1 : 0.9), 0, sz * (j === 2 ? 1.1 : 0.9), sz * 0.34, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  const sh = s.shake ? Math.sin(t * 90) * 1.6 * s.shake : 0;
  const x = s.x + sh;
  const y = s.y;
  const husk = (cx, cy, rad, split) => {
    if (split) {
      ctx.fillStyle = T('#7a8a3a');
      ctx.beginPath();
      ctx.arc(cx - rad * 0.4, cy, rad * 0.8, Math.PI * 0.5, Math.PI * 1.5);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + rad * 0.4, cy, rad * 0.8, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();
      ctx.fillStyle = vg(ctx, cy - rad * 0.6, cy + rad * 0.6, T('#a8582a'), T('#5a2a10'));
      ctx.beginPath();
      ctx.arc(cx, cy, rad * 0.62, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,240,220,0.5)';
      ctx.fillRect(cx - rad * 0.3, cy - rad * 0.3, rad * 0.25, rad * 0.15);
      return;
    }
    ctx.fillStyle = vg(ctx, cy - rad, cy + rad, T('#a8b85a'), T('#5a6a2a'));
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#4a5a20');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * TAU;
      ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
      ctx.lineTo(cx + Math.cos(a) * (rad + 3.4), cy + Math.sin(a) * (rad + 3.4));
    }
    ctx.stroke();
  };
  if (s.landed) {
    husk(x - 4, m.ground - 6, 8, true);
    husk(x + 8, m.ground - 5, 6, true);
    return true;
  }
  ctx.strokeStyle = T('#4a3220');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 1, y + m.h - 14);
  ctx.stroke();
  husk(x, y + 10, 8, false);
  husk(x + 1, y + m.h - 10, 9, false);
  return true;
}

// ---------------------------------------------------------------- decor

export const FAIR_DECOR = {
  stubble(ctx, d, T) {
    ctx.strokeStyle = T('#c8b47a');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let k = 0; k < 7; k++) {
      ctx.moveTo(d.x + k * 2.4, d.y);
      ctx.lineTo(d.x + k * 2.4 + (hash(d.seed + k) - 0.5) * 2, d.y - (4 + hash(d.seed * 3 + k) * 5) * d.s);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let k = 0; k < 7; k += 2) ctx.fillRect(d.x + k * 2.4 - 0.6, d.y - (4 + hash(d.seed * 3 + k) * 5) * d.s, 1.4, 1.2);
  },
  gourds(ctx, d, T) {
    const cols = ['#f2c040', '#6a8a3a', '#e8781a', '#f0e8c8'];
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = T(cols[(d.seed + k) % cols.length]);
      ctx.beginPath();
      ctx.ellipse(d.x + k * 7, d.y - 3 * d.s, 3.6 * d.s, 3 * d.s, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(d.x + k * 7 + 1, d.y - 6.4 * d.s, 1.8 * d.s, 0, TAU);
      ctx.fill();
    }
  },
  heather(ctx, d, T) {
    ctx.fillStyle = T('#3a3a24');
    ctx.beginPath();
    ctx.ellipse(d.x + 8, d.y - 2, 9 * d.s, 3 * d.s, 0, Math.PI, 0);
    ctx.fill();
    for (let k = 0; k < 12; k++) {
      ctx.fillStyle = T(k % 3 ? '#9a4a8a' : '#c878b0');
      ctx.fillRect(d.x + hash(d.seed + k) * 16, d.y - 3 - hash(d.seed * 7 + k) * 6 * d.s, 1.8, 1.8);
    }
  },
  cottonGrass(ctx, d, T) {
    ctx.strokeStyle = T('#7a7a4a');
    ctx.lineWidth = 0.8;
    for (let k = 0; k < 4; k++) {
      const x = d.x + k * 4;
      const h = (12 + hash(d.seed + k) * 8) * d.s;
      ctx.beginPath();
      ctx.moveTo(x, d.y);
      ctx.quadraticCurveTo(x + 1, d.y - h * 0.6, x + 2, d.y - h);
      ctx.stroke();
      ctx.fillStyle = 'rgba(250,250,245,0.92)';
      ctx.beginPath();
      ctx.arc(x + 2, d.y - h - 1.6, 2.4, 0, TAU);
      ctx.fill();
    }
  },
  sleeper(ctx, d, T) {
    ctx.fillStyle = vg(ctx, d.y - 6, d.y, T('#6a5a48'), T('#3a2e22'));
    ctx.save();
    ctx.translate(d.x + 14, d.y - 2);
    ctx.rotate(-0.08);
    ctx.fillRect(-16, -4, 32, 6);
    ctx.fillStyle = T('#6a3a2a');
    ctx.fillRect(-8, -5, 3, 2);
    ctx.fillRect(6, -5, 3, 2);
    ctx.restore();
  },
  grapes(ctx, d, T) {
    vineLeaf(ctx, d.x + 4, d.y - 2, 5 * d.s, 0.4, T('#c84a2a'));
    grapeBunch(ctx, d.x + 12, d.y - 7 * d.s, 1.6 * d.s, T, '#4a2a5a');
  },
  straw(ctx, d, T) {
    ctx.strokeStyle = T('#e0c070');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 9; k++) {
      const a = (hash(d.seed + k) - 0.5) * 1.2;
      const x = d.x + hash(d.seed * 3 + k) * 20;
      ctx.moveTo(x, d.y - 1);
      ctx.lineTo(x + Math.cos(a) * 6, d.y - 1 - Math.abs(Math.sin(a)) * 3);
    }
    ctx.stroke();
  },
  ticket(ctx, d, T) {
    ctx.save();
    ctx.translate(d.x + 6, d.y - 1);
    ctx.rotate((hash(d.seed) - 0.5) * 0.8);
    ctx.fillStyle = T(hash(d.seed * 3) < 0.5 ? '#f0a0b8' : '#f2d060');
    ctx.fillRect(-5, -2, 10, 4);
    ctx.fillStyle = alpha('#000000', 0.3);
    ctx.fillRect(-2, -2, 0.8, 4);
    ctx.restore();
  },
};

// ---------------------------------------------------------------- foreground

/** Chapter 6 silhouettes for the foreground strip. False if the terrain is not ours. */
export function fairForeground(g, kind, x, H, rng) {
  if (kind === 'pumpkin') {
    for (let k = 0; k < 5; k++) {
      const sx = x + k * 14 - 30;
      const h = 90 + rng() * 40;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(sx, H);
      g.lineTo(sx + 4, H - h);
      g.stroke();
      for (let j = 0; j < 4; j++) {
        const ly = H - h * (0.3 + j * 0.15);
        g.beginPath();
        g.ellipse(sx + (j % 2 ? 12 : -10), ly, 14, 3, j % 2 ? 0.5 : -0.5, 0, TAU);
        g.fill();
      }
    }
    g.beginPath();
    g.ellipse(x + 50, H - 10, 26, 18, 0, 0, TAU);
    g.fill();
  } else if (kind === 'mill' || kind === 'viaduct') {
    for (let k = 0; k < 14; k++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 0.6;
      const l = 70 + rng() * 70;
      g.lineWidth = 2 + rng() * 2;
      g.beginPath();
      g.moveTo(x + (rng() - 0.5) * 30, H);
      g.lineTo(x + Math.cos(a) * l, H + Math.sin(a) * l);
      g.stroke();
      if (kind === 'mill' && rng() < 0.3) {
        g.beginPath();
        g.ellipse(x + Math.cos(a) * l * 0.85, H + Math.sin(a) * l * 0.85, 3.4, 12, a + Math.PI / 2, 0, TAU);
        g.fill();
      }
    }
  } else if (kind === 'moor') {
    g.beginPath();
    g.moveTo(x - 100, H);
    for (let k = 0; k <= 10; k++) g.lineTo(x - 100 + k * 20, H - 20 - rng() * 26);
    g.lineTo(x + 100, H);
    g.fill();
  } else if (kind === 'vineyard') {
    g.fillRect(x - 3, H - 110, 6, 110);
    for (let k = 0; k < 10; k++) {
      g.beginPath();
      g.arc(x - 40 + rng() * 80, H - 70 + rng() * 40, 10 + rng() * 12, 0, TAU);
      g.fill();
    }
  } else if (kind === 'fair') {
    for (let k = 0; k < 4; k++) {
      const px = x - 60 + k * 36 + rng() * 10;
      const ph = 60 + rng() * 30;
      g.beginPath();
      g.arc(px, H - ph, 13, 0, TAU);
      g.fill();
      g.beginPath();
      g.ellipse(px, H, 26, ph - 14, 0, Math.PI, 0);
      g.fill();
    }
  } else return false;
  return true;
}

// ---------------------------------------------------------------- finale

/** The gate of the harvest fair: lit towers, the name in bulbs, the big wheel behind. */
export function drawFairGate(ctx, x, y, T, P, t, open) {
  // the big wheel behind everything, turning slowly
  const wx = x + 300;
  const wy = y - 210;
  const R = 150;
  ctx.strokeStyle = T('#3a3450');
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(wx - 90, y);
  ctx.lineTo(wx, wy);
  ctx.lineTo(wx + 90, y);
  ctx.stroke();
  const a0 = t * 0.1;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(wx, wy, R, 0, TAU);
  ctx.moveTo(wx + R * 0.9, wy);
  ctx.arc(wx, wy, R * 0.9, 0, TAU);
  for (let k = 0; k < 16; k++) {
    const a = a0 + (k / 16) * TAU;
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + Math.cos(a) * R, wy + Math.sin(a) * R);
  }
  ctx.stroke();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const cols = [P.lamp, '#ff7a9a', '#7ad0ff', '#fff2c0'];
  for (let k = 0; k < 48; k++) {
    const a = a0 + (k / 48) * TAU;
    const on = 0.5 + 0.5 * Math.sin(t * 4 - k * 0.6);
    glowDot(ctx, wx + Math.cos(a) * R, wy + Math.sin(a) * R, 1.8, cols[k % 4], 0.4 + 0.6 * on);
  }
  ctx.restore();
  for (let k = 0; k < 16; k++) {
    const a = a0 + (k / 16) * TAU;
    const gx = wx + Math.cos(a) * R;
    const gy = wy + Math.sin(a) * R;
    ctx.fillStyle = T('#5a5070');
    ctx.fillRect(gx - 0.8, gy, 1.6, 7);
    ctx.fillStyle = T(['#c8484a', '#3a7ab0', '#f2c040', '#5ab060'][k % 4]);
    rr(ctx, gx - 9, gy + 7, 18, 12, 3);
    ctx.fill();
    ctx.fillStyle = alpha(P.window, 0.8);
    ctx.fillRect(gx - 6, gy + 9, 12, 3);
  }
  ctx.fillStyle = T('#3a3450');
  ctx.beginPath();
  ctx.arc(wx, wy, 7, 0, TAU);
  ctx.fill();

  // the gate: two towers with onion tops and an arch of bulbs between them
  const gx0 = x - 20;
  const gw = 220;
  const tower = (tx) => {
    ctx.fillStyle = vg(ctx, y - 170, y, T('#c83a3a'), T('#7a1a24'));
    ctx.fillRect(tx, y - 170, 34, 170);
    ctx.fillStyle = T('#f0e0c0');
    for (let k = 0; k < 170; k += 24) ctx.fillRect(tx, y - 170 + k, 34, 8);
    ctx.fillStyle = T('#d8a840');
    ctx.beginPath();
    ctx.moveTo(tx - 4, y - 170);
    ctx.quadraticCurveTo(tx - 2, y - 196, tx + 17, y - 214);
    ctx.quadraticCurveTo(tx + 36, y - 196, tx + 38, y - 170);
    ctx.fill();
    ctx.fillRect(tx + 16, y - 228, 2, 16);
    ctx.fillStyle = T('#e8433a');
    ctx.beginPath();
    ctx.moveTo(tx + 18, y - 228);
    ctx.lineTo(tx + 32, y - 224);
    ctx.lineTo(tx + 18, y - 220);
    ctx.fill();
  };
  tower(gx0);
  tower(gx0 + gw - 34);
  ctx.fillStyle = T('#2a4a7a');
  ctx.beginPath();
  ctx.moveTo(gx0 + 34, y - 150);
  ctx.quadraticCurveTo(gx0 + gw / 2, y - 210, gx0 + gw - 34, y - 150);
  ctx.lineTo(gx0 + gw - 34, y - 120);
  ctx.quadraticCurveTo(gx0 + gw / 2, y - 170, gx0 + 34, y - 120);
  ctx.fill();
  const lightK = open ? 1 : 0.75;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(gx0 + gw / 2, y - 150, 0, gx0 + gw / 2, y - 150, 220);
  g.addColorStop(0, alpha(P.lamp, 0.3 * lightK));
  g.addColorStop(1, alpha(P.lamp, 0));
  ctx.fillStyle = g;
  ctx.fillRect(gx0 - 120, y - 370, gw + 240, 370);
  for (let k = 0; k <= 22; k++) {
    const u = k / 22;
    const bx = gx0 + 34 + (gw - 68) * u;
    const by = y - 150 - Math.sin(u * Math.PI) * 30 - 2;
    const on = 0.55 + 0.45 * Math.sin(t * 5 - k * 0.7);
    glowDot(ctx, bx, by, 1.8, '#fff0c0', (0.4 + 0.6 * on) * lightK);
  }
  ctx.restore();
  ctx.fillStyle = T('#ffe8a0');
  ctx.font = `700 19px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = 'center';
  ctx.fillText('HARVEST FAIR', gx0 + gw / 2, y - 136, gw - 80);
  ctx.textAlign = 'start';
  // the gates themselves: open once you're through
  ctx.fillStyle = T('#2a2030');
  if (open) {
    ctx.fillRect(gx0 + 34, y - 80, 10, 80);
    ctx.fillRect(gx0 + gw - 44, y - 80, 10, 80);
  } else {
    ctx.strokeStyle = T('#2a2030');
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let xx = gx0 + 38; xx < gx0 + gw - 34; xx += 10) {
      ctx.moveTo(xx, y);
      ctx.lineTo(xx, y - 70);
    }
    ctx.moveTo(gx0 + 34, y - 40);
    ctx.lineTo(gx0 + gw - 34, y - 40);
    ctx.stroke();
  }
  // a ticket booth and a toffee apple stall either side
  const booth = (bx, label, c1) => {
    ctx.fillStyle = T('#f0e0c0');
    ctx.fillRect(bx, y - 60, 50, 60);
    ctx.fillStyle = T(c1);
    for (let k = 0; k < 5; k += 2) ctx.fillRect(bx + k * 10, y - 60, 10, 60);
    ctx.fillStyle = alpha(P.window, 0.9);
    ctx.fillRect(bx + 8, y - 44, 34, 16);
    ctx.fillStyle = T('#2a2030');
    ctx.beginPath();
    ctx.moveTo(bx - 6, y - 60);
    ctx.lineTo(bx + 25, y - 82);
    ctx.lineTo(bx + 56, y - 60);
    ctx.fill();
    ctx.fillStyle = T('#ffe8a0');
    ctx.font = `700 9px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText(label, bx + 25, y - 64);
    ctx.textAlign = 'start';
  };
  booth(gx0 - 90, 'TICKETS', '#3a7ab0');
  booth(gx0 + gw + 40, 'TOFFEE', '#c83a3a');
  for (let k = 0; k < 4; k++) {
    const ax = gx0 + gw + 50 + k * 9;
    ctx.fillStyle = T('#8a1a1a');
    ctx.beginPath();
    ctx.arc(ax, y - 30, 3.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#d8c8a0');
    ctx.fillRect(ax - 0.5, y - 40, 1, 7);
  }
}
