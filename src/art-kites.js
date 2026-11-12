// Chapter 8 world art: ground, pits, props, rollers, decor and the kite launch at the end. Same
// contract as art.js (world coordinates, tone function T applied to every colour).

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

function strata(ctx, s, sx0, sx1, bottom, cols, step) {
  for (let k = 0; k < 10; k++) {
    const yy = s.y + 14 + k * step;
    if (yy > bottom) break;
    ctx.fillStyle = alpha(cols[k % cols.length], 0.18);
    ctx.fillRect(sx0, yy, sx1 - sx0, step * 0.45);
  }
}

export const KITE_SEG = {
  chimneys(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 160);
    strata(ctx, s, sx0, sx1, bottom, ['#ffffff', '#8a5a3a', '#e8c8a0'], 16);
    // doorways and pigeon holes cut into the soft rock
    ctx.fillStyle = alpha('#2a1408', 0.45);
    for (let x = Math.floor(sx0 / 97) * 97; x < sx1; x += 97) {
      if (hash(x * 3) < 0.5) continue;
      rr(ctx, x + 10, s.y + 40 + hash(x) * 40, 8, 12, 4);
      ctx.fill();
    }
    topBand(ctx, s, sx0, sx1, T, G, 10, 1.6);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#2a1408', 0.45));
  },

  karst(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 120);
    topBand(ctx, s, sx0, sx1, T, G, 10, 1);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
    blades(ctx, s, sx0, sx1, T(G.top2), 3, 7, 3.6);
  },

  steppe(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 110);
    topBand(ctx, s, sx0, sx1, T, G, 10, 0.6);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
    blades(ctx, s, sx0, sx1, T(G.top), 3, 9, 3);
    blades(ctx, s, sx0, sx1, T('#c8c070'), 2, 7, 6.1, 1);
  },

  monastery(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    // a paved path of flat slates, mani stones carved with prayers set along it
    body(ctx, s, sx0, sx1, bottom, T, G, 140);
    ctx.strokeStyle = alpha('#1a140e', 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 43) * 43; x < sx1; x += 43) {
      ctx.moveTo(x + hash(x) * 10, s.y + 10);
      ctx.lineTo(x + hash(x * 3) * 20, s.y + 60 + hash(x * 5) * 40);
    }
    ctx.stroke();
    topBand(ctx, s, sx0, sx1, T, G, 9, 0.8);
    ctx.fillStyle = alpha('#000000', 0.2);
    for (let x = Math.floor(sx0 / 22) * 22; x < sx1; x += 22) ctx.fillRect(x, s.y - 1, 1, 9);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
  },

  stepwell(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    // dressed sandstone in courses, a carved band running along it
    body(ctx, s, sx0, sx1, bottom, T, G, 180);
    ctx.strokeStyle = alpha('#3a1808', 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let yy = s.y + 12; yy < Math.min(bottom, s.y + 220); yy += 14) {
      ctx.moveTo(sx0, yy);
      ctx.lineTo(sx1, yy);
      const off = ((yy / 14) | 0) % 2 ? 0 : 15;
      for (let x = Math.floor(sx0 / 30) * 30 + off; x < sx1; x += 30) {
        ctx.moveTo(x, yy);
        ctx.lineTo(x, yy + 14);
      }
    }
    ctx.stroke();
    ctx.fillStyle = alpha('#ffe8c0', 0.3);
    for (let x = Math.floor(sx0 / 12) * 12; x < sx1; x += 12) {
      ctx.beginPath();
      ctx.arc(x + 6, s.y + 20, 3, 0, TAU);
      ctx.fill();
    }
    topBand(ctx, s, sx0, sx1, T, G, 9, 0.6);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#2a0a04', 0.45));
  },

  kites(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    body(ctx, s, sx0, sx1, bottom, T, G, 110);
    topBand(ctx, s, sx0, sx1, T, G, 11, 0.8);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
    blades(ctx, s, sx0, sx1, T(G.top), 3, 8, 3.2);
    blades(ctx, s, sx0, sx1, T(G.top2), 2, 6, 5.1, 1);
    for (let x = Math.floor(sx0 / 6) * 6; x < sx1; x += 6) {
      if (hash(x * 11) < 0.7) continue;
      ctx.fillStyle = T(['#f8c8d8', '#ffffff', '#f2d040'][Math.floor(hash(x * 3) * 3)]);
      ctx.fillRect(x, s.y - 3 - hash(x) * 5, 2, 2);
    }
  },
};

/** Pits for the chapter 8 terrains. Returns false when the terrain is not one of ours. */
export function kitePit(ctx, terr, P, T, a, b, bottom, t) {
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
  const dark = (d = 120) => {
    ctx.fillStyle = vg(ctx, top, top + d, T(mix(P.ground.body, '#000000', 0.35)), T(P.ground.deep));
    ctx.fillRect(x0, top, w, bottom - top);
  };
  if (terr === 'karst') {
    dark(60);
    waterPit(40, P.water, '#ffffff');
  } else if (terr === 'stepwell') {
    // a stepwell opening: flights of steps going down to green water
    dark(200);
    ctx.fillStyle = T(mix(P.ground.body, '#ffffff', 0.15));
    for (let k = 0; k < 8; k++) {
      const yy = top + 14 + k * 16;
      ctx.fillRect(x0 + (k % 2 ? w * 0.5 : 0), yy, w * 0.5, 3);
    }
    waterPit(150, P.water, P.light);
  } else if (terr === 'chimneys' || terr === 'monastery') {
    ctx.fillStyle = vg(ctx, top, top + 220, T(mix(P.ground.body, P.haze, 0.2)), T(P.ground.deep), '#0a0604');
    ctx.fillRect(x0, top, w, bottom - top);
  } else if (terr === 'steppe' || terr === 'kites') {
    dark(110);
    waterPit(84, terr === 'kites' ? P.water : '#6a9ab0', '#ffffff');
  } else return false;
  return true;
}

// ---------------------------------------------------------------- props

function wicker(ctx, x, y, w, h, T) {
  ctx.fillStyle = vg(ctx, y, y + h, T('#c8a060'), T('#7a5a2a'));
  rr(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.save();
  rr(ctx, x, y, w, h, 3);
  ctx.clip();
  ctx.strokeStyle = alpha('#4a2e10', 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = -h; k < w + h; k += 5) {
    ctx.moveTo(x + k, y);
    ctx.lineTo(x + k + h, y + h);
  }
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = T('#5a3a1a');
  ctx.fillRect(x - 1, y, w + 2, 3);
}

function envelope(ctx, cx, cy, rw, rh, T, cols, seed) {
  // the stripes of a balloon envelope, seen from the side
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - rw * 0.3, cy + rh);
  ctx.bezierCurveTo(cx - rw * 1.3, cy + rh * 0.1, cx - rw, cy - rh, cx, cy - rh);
  ctx.bezierCurveTo(cx + rw, cy - rh, cx + rw * 1.3, cy + rh * 0.1, cx + rw * 0.3, cy + rh);
  ctx.closePath();
  ctx.clip();
  const n = 8;
  for (let k = 0; k < n; k++) {
    ctx.fillStyle = T(cols[(k + seed) % cols.length]);
    ctx.fillRect(cx - rw * 1.3 + (k * rw * 2.6) / n, cy - rh - 2, rw * 2.6 / n + 1, rh * 2 + 4);
  }
  const g = ctx.createLinearGradient(cx - rw, 0, cx + rw, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.25)');
  g.addColorStop(0.6, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - rw * 1.3, cy - rh - 2, rw * 2.6, rh * 2 + 4);
  ctx.restore();
}

function softRock(ctx, x, y, w, h, T, P, seed) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, T(mix('#ecd4b4', P.light, 0.2)));
  g.addColorStop(1, T('#a07a54'));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 4, y + h);
  ctx.lineTo(x, y + 8);
  ctx.quadraticCurveTo(x + 2, y, x + 10, y);
  ctx.lineTo(x + w - 10, y);
  ctx.quadraticCurveTo(x + w - 2, y, x + w, y + 8);
  ctx.lineTo(x + w + 4, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = alpha('#ffffff', 0.2);
  for (let k = 0; k < 3; k++) ctx.fillRect(x, y + 14 + k * (h / 4), w, 3);
  void seed;
}

const BRIGHT = ['#e8433a', '#f2c040', '#3a8ad8', '#5ab060', '#e870a8', '#f08a3a', '#a868d8'];

export const KITE_OB = {
  // ---------- Balloon Valley
  balloonBasket(ctx, o, T) {
    const { x, y, w, h } = o;
    // a balloon basket set down on its side, the envelope spilled out behind it
    envelope(ctx, x - 20, y + h * 0.4, 40, h * 0.6, T, ['#e8433a', '#f2c040'], o.seed);
    wicker(ctx, x + w * 0.2, y + 6, w * 0.8, h - 6, T);
    ctx.fillStyle = T('#3a3a42');
    ctx.fillRect(x + w * 0.35, y, 4, 8);
    ctx.fillRect(x + w * 0.75, y, 4, 8);
  },
  tuffCone(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a small fairy chimney, its dark cap balanced on a pale cone: sharp, and crumbly
    ctx.fillStyle = vg(ctx, y, y + h, T(mix('#f0dcc0', P.light, 0.2)), T('#b08a62'));
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.5, x + w * 0.45, y + h * 0.12);
    ctx.lineTo(x + w * 0.55, y + h * 0.12);
    ctx.quadraticCurveTo(x + w * 0.7, y + h * 0.5, x + w, y + h);
    ctx.fill();
    ctx.fillStyle = T('#5a4030');
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.1, w * 0.22, h * 0.1, 0, 0, TAU);
    ctx.fill();
  },
  liftingBalloon(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a balloon just lifting off, its basket swinging over the path, ropes still to the ground
    const sway = Math.sin(t * 1.2 + o.seed) * 3;
    envelope(ctx, x + w / 2 + sway, y - 90, w * 0.55, 80, T, BRIGHT, o.seed);
    ctx.strokeStyle = T('#3a2a1a');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.35 + sway, y - 12);
    ctx.lineTo(x + w * 0.3, y);
    ctx.moveTo(x + w * 0.65 + sway, y - 12);
    ctx.lineTo(x + w * 0.7, y);
    ctx.moveTo(x + 6, y + h);
    ctx.lineTo(x - 30, o.ground);
    ctx.moveTo(x + w - 6, y + h);
    ctx.lineTo(x + w + 30, o.ground);
    ctx.stroke();
    wicker(ctx, x + w * 0.2, y + 2, w * 0.6, h - 2, T);
    const fl = fract(t * 0.6 + hash(o.seed)) < 0.3;
    if (fl) {
      ctx.fillStyle = 'rgba(255,190,90,0.95)';
      ctx.beginPath();
      ctx.ellipse(x + w / 2 + sway, y - 8, 4, 8, 0, 0, TAU);
      ctx.fill();
    }
    void P;
  },
  caveHouse(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a house cut into a block of soft rock: doors, windows, a terrace on top
    softRock(ctx, x, y, w, h, T, P, o.seed);
    ctx.fillStyle = T('#3a2214');
    rr(ctx, x + w * 0.15, y + h * 0.5, 18, h * 0.5, 9);
    ctx.fill();
    for (const [fx, fy] of [
      [0.55, 0.3],
      [0.75, 0.3],
      [0.65, 0.62],
    ]) {
      rr(ctx, x + w * fx, y + h * fy, 10, 14, 5);
      ctx.fill();
    }
    ctx.fillStyle = T('#c8483a');
    ctx.fillRect(x + w * 0.15, y + h * 0.5 - 6, 18, 4);
    ctx.fillStyle = T('#8a6a44');
    ctx.fillRect(x + 4, y - 2, w - 8, 4);
  },

  // ---------- Karst River
  bambooRaft(ctx, o, T) {
    const { x, y, w, h } = o;
    // a raft of big bamboo poles pulled up on the bank, ends turned up
    const n = 4;
    for (let k = 0; k < n; k++) {
      const yy = y + h - 7 - k * 2;
      ctx.strokeStyle = T(k % 2 ? '#b8a860' : '#a89850');
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + 4, yy - 6);
      ctx.quadraticCurveTo(x + 14, yy, x + w * 0.5, yy);
      ctx.lineTo(x + w - 4, yy - 2);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
    ctx.fillStyle = T('#5a4a2a');
    for (const fx of [0.3, 0.7]) ctx.fillRect(x + w * fx, y + h - 16, 3, 14);
    ctx.fillStyle = T('#e8e0c8');
    rr(ctx, x + w * 0.45, y, 10, h - 12, 4);
    ctx.fill();
  },
  cormorantPerch(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a fisherman's pole across two forked sticks, cormorants drying their wings on it
    ctx.fillStyle = T('#4a3a24');
    ctx.fillRect(x + 4, y + h * 0.35, 3, h * 0.65);
    ctx.fillRect(x + w - 7, y + h * 0.35, 3, h * 0.65);
    ctx.fillRect(x, y + h * 0.35, w, 3);
    for (let k = 0; k < 3; k++) {
      const bx = x + 8 + k * ((w - 16) / 2);
      const flap = Math.sin(t * 2 + k + o.seed) * 0.4;
      ctx.fillStyle = T('#16161a');
      ctx.beginPath();
      ctx.ellipse(bx, y + h * 0.35 - 8, 3.6, 7, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx + 1, y + h * 0.35 - 17, 2.4, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.translate(bx, y + h * 0.35 - 12);
      ctx.rotate(-0.8 - flap);
      ctx.fillRect(0, -1.4, 10, 2.8);
      ctx.rotate(1.6 + flap * 2);
      ctx.fillRect(0, -1.4, -10, 2.8);
      ctx.restore();
      ctx.fillStyle = T('#f2c040');
      ctx.fillRect(bx + 3, y + h * 0.35 - 17, 3, 1.2);
    }
    void P;
  },
  raftCanopy(ctx, o, T) {
    const { x, y, w, h } = o;
    // a woven bamboo awning on poles, where the fishermen sit out the midday sun
    const post = T('#6a5a34');
    backPost(ctx, x - 6, y, o.ground, 5, post);
    backPost(ctx, x + w + 6, y, o.ground, 5, post);
    ctx.fillStyle = vg(ctx, y, y + h, T('#d8c890'), T('#9a8848'));
    ctx.beginPath();
    ctx.moveTo(x - 16, y + h);
    ctx.quadraticCurveTo(x + w / 2, y - h * 0.5, x + w + 16, y + h);
    ctx.lineTo(x + w + 10, y + h + 3);
    ctx.quadraticCurveTo(x + w / 2, y - h * 0.3, x - 10, y + h + 3);
    ctx.fill();
    ctx.strokeStyle = alpha('#5a4a20', 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 1; k < 10; k++) {
      const u = k / 10;
      ctx.moveTo(x - 16 + (w + 32) * u, y + h - Math.sin(u * Math.PI) * h * 0.75);
      ctx.lineTo(x - 13 + (w + 26) * u, y + h + 2 - Math.sin(u * Math.PI) * h * 0.65);
    }
    ctx.stroke();
  },
  rockPillar(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a stub of karst limestone, grey and runnelled, ferns in its cracks, a flat top
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, T(mix('#a8aca0', P.light, 0.2)));
    g.addColorStop(1, T('#5a5e54'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + h);
    ctx.bezierCurveTo(x - 2, y + h * 0.5, x + 2, y + 10, x + 10, y);
    ctx.lineTo(x + w - 10, y);
    ctx.bezierCurveTo(x + w - 2, y + 10, x + w + 2, y + h * 0.5, x + w + 6, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alpha('#2a2e24', 0.35);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let k = 1; k < 6; k++) {
      ctx.moveTo(x + (k * w) / 6, y + 4);
      ctx.quadraticCurveTo(x + (k * w) / 6 + 4, y + h * 0.5, x + (k * w) / 6 - 2, y + h);
    }
    ctx.stroke();
    ctx.fillStyle = T('#4a7a3a');
    rr(ctx, x + 4, y - 3, w - 8, 6, 3);
    ctx.fill();
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.ellipse(x + hash(o.seed + k) * w, y + 20 + hash(k * 7) * (h - 30), 6, 2.4, 0, 0, TAU);
      ctx.fill();
    }
  },

  // ---------- Endless Steppe
  feltRolls(ctx, o, T) {
    const { x, y, w, h } = o;
    // rolls of felt for the yurt walls, tied with red cord
    const r = h / 4;
    for (let row = 0; row < 2; row++) {
      const n = row ? 2 : 3;
      for (let k = 0; k < n; k++) {
        const cx = x + r + (row ? r : 0) + k * ((w - 2 * r) / 2);
        const cy = y + h - r - row * r * 1.8;
        ctx.fillStyle = vg(ctx, cy - r, cy + r, T('#f4ece0'), T('#b8ac98'));
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = alpha('#8a7a64', 0.6);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.6, 0, TAU * 0.85);
        ctx.arc(cx, cy, r * 0.25, 0, TAU * 0.7);
        ctx.stroke();
      }
    }
    ctx.fillStyle = T('#c83a2a');
    ctx.fillRect(x + w * 0.3, y, 2.4, h);
    ctx.fillRect(x + w * 0.7, y + h * 0.1, 2.4, h * 0.9);
  },
  ovoo(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a cairn of stones with a pole in it, hung with blue silk scarves streaming in the wind
    ctx.fillStyle = vg(ctx, y + h * 0.4, y + h, T('#a8a090'), T('#5a5448'));
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w * 0.3, y + h * 0.45);
    ctx.lineTo(x + w * 0.7, y + h * 0.42);
    ctx.lineTo(x + w, y + h);
    ctx.fill();
    ctx.fillStyle = T('#4a3a24');
    ctx.fillRect(x + w / 2 - 1.5, y, 3, h * 0.6);
    for (let k = 0; k < 4; k++) {
      const flap = Math.sin(t * 5 + k + o.seed) * 4;
      ctx.fillStyle = T(k % 2 ? '#3a8ad8' : '#8ac0f0');
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + 4 + k * 5);
      ctx.quadraticCurveTo(x + w / 2 + 14, y + 4 + k * 5 + flap, x + w / 2 + 24, y + 8 + k * 5 - flap);
      ctx.lineTo(x + w / 2 + 22, y + 11 + k * 5 - flap);
      ctx.quadraticCurveTo(x + w / 2 + 12, y + 8 + k * 5 + flap, x + w / 2, y + 7 + k * 5);
      ctx.fill();
    }
    void P;
  },
  steppeGate(ctx, o, T) {
    const { x, y, w, h } = o;
    // a painted wooden gateway to the camp, red and blue and gold
    const post = T('#a83a2a');
    backPost(ctx, x - 8, y, o.ground, 8, post);
    backPost(ctx, x + w + 8, y, o.ground, 8, post);
    ctx.fillStyle = vg(ctx, y, y + h, T('#c84a34'), T('#8a2a1a'));
    ctx.fillRect(x - 16, y + h * 0.3, w + 32, h * 0.7);
    ctx.fillStyle = T('#2a5ab0');
    ctx.fillRect(x - 16, y + h * 0.45, w + 32, h * 0.3);
    ctx.fillStyle = T('#f2c040');
    for (let k = 0; k < Math.floor((w + 32) / 14); k++) {
      ctx.beginPath();
      ctx.arc(x - 9 + k * 14, y + h * 0.6, 3.6, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = T('#2a7a5a');
    ctx.beginPath();
    ctx.moveTo(x - 24, y + h * 0.32);
    ctx.quadraticCurveTo(x + w / 2, y - h * 0.4, x + w + 24, y + h * 0.32);
    ctx.fill();
  },
  yurtCart(ctx, o, T) {
    const { x, y, w, h } = o;
    // the yurt packed up for the move: lattice walls, poles and felt, roped onto a cart
    const wr = 16;
    const bed = y + h - wr - 8;
    ctx.fillStyle = vg(ctx, y, bed, T('#f0e8d8'), T('#b8ac98'));
    ctx.fillRect(x + 2, y, w - 4, bed - y);
    ctx.strokeStyle = T('#a8703a');
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let k = 0; k < Math.floor(w / 8); k++) {
      ctx.moveTo(x + 4 + k * 8, y + (bed - y) * 0.3);
      ctx.lineTo(x + 12 + k * 8, bed);
      ctx.moveTo(x + 12 + k * 8, y + (bed - y) * 0.3);
      ctx.lineTo(x + 4 + k * 8, bed);
    }
    ctx.stroke();
    ctx.fillStyle = T('#c83a2a');
    ctx.fillRect(x + 2, y + 6, w - 4, 3);
    ctx.fillRect(x + 2, bed - 10, w - 4, 3);
    ctx.fillStyle = woodGrad(ctx, bed, 8, T, '#a8703a', '#7a4e28', '#4a2e16');
    ctx.fillRect(x - 4, bed, w + 8, 8);
    for (const wx of [x + w * 0.22, x + w * 0.78]) {
      ctx.fillStyle = T('#3a2618');
      ctx.beginPath();
      ctx.arc(wx, y + h - wr, wr, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = T('#a8703a');
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU;
        ctx.moveTo(wx, y + h - wr);
        ctx.lineTo(wx + Math.cos(a) * wr * 0.85, y + h - wr + Math.sin(a) * wr * 0.85);
      }
      ctx.stroke();
    }
  },

  // ---------- Prayer Flag Pass
  prayerWheels(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a row of brass prayer wheels in a wooden frame, turning as people pass
    ctx.fillStyle = woodGrad(ctx, y, h, T, '#9a2a24', '#7a1e18', '#4a120e');
    ctx.fillRect(x, y, w, 6);
    ctx.fillRect(x, y + h - 6, w, 6);
    const n = Math.floor(w / 14);
    for (let k = 0; k < n; k++) {
      const cx = x + 7 + k * ((w - 14) / Math.max(1, n - 1));
      const turn = fract(t * 0.5 + k * 0.13);
      const g = ctx.createLinearGradient(cx - 6, 0, cx + 6, 0);
      g.addColorStop(0, T('#8a6a2a'));
      g.addColorStop(fract(turn), T('#f8e090'));
      g.addColorStop(1, T('#6a4a1a'));
      ctx.fillStyle = g;
      rr(ctx, cx - 6, y + 7, 12, h - 14, 3);
      ctx.fill();
      ctx.fillStyle = alpha('#3a2a10', 0.5);
      ctx.fillRect(cx - 6, y + h * 0.45, 12, 1.4);
    }
    void P;
  },
  maniStones(ctx, o, T) {
    const { x, y, w, h } = o;
    // flat stones stacked in a wall, each carved with a prayer and painted
    const r = mulberry32(o.seed);
    let yy = y + h;
    let row = 0;
    while (yy > y + 4) {
      const sh = 7 + r() * 4;
      let xx = x + (row % 2) * 6;
      while (xx < x + w - 6) {
        const sw = 16 + r() * 12;
        ctx.fillStyle = T(mix('#8a8478', '#c8c0b0', r()));
        rr(ctx, xx, yy - sh, Math.min(sw, x + w - xx), sh - 1, 3);
        ctx.fill();
        if (r() < 0.4) {
          ctx.fillStyle = T(['#3a8ad8', '#e8433a', '#f2c040', '#3ab060'][Math.floor(r() * 4)]);
          ctx.fillRect(xx + 3, yy - sh * 0.6, Math.min(sw, x + w - xx) - 6, 1.6);
        }
        xx += sw + 1;
      }
      yy -= sh;
      row++;
    }
  },
  prayerFlags(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // strings of prayer flags run from a pole on the pass across the path
    backPost(ctx, x - 10, y - 30, o.ground, 4, T('#4a3a2a'));
    backPost(ctx, x + w + 10, y - 20, o.ground, 4, T('#4a3a2a'));
    const cols = ['#3a6ad8', '#ffffff', '#e8433a', '#3ab060', '#f2c040'];
    for (let line = 0; line < 2; line++) {
      const ly = y + line * h * 0.4;
      ctx.strokeStyle = T('#5a4a3a');
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x - 10, ly - 4);
      ctx.quadraticCurveTo(x + w / 2, ly + h * 0.35, x + w + 10, ly - 2);
      ctx.stroke();
      const n = Math.floor((w + 20) / 9);
      for (let k = 0; k < n; k++) {
        const u = (k + 0.5) / n;
        const fx = x - 10 + (w + 20) * u;
        const fy = ly - 4 + Math.sin(u * Math.PI) * h * 0.18;
        const flap = Math.sin(t * 7 + k * 0.6 + line) * 2.4;
        ctx.fillStyle = T(cols[k % 5]);
        ctx.beginPath();
        ctx.moveTo(fx - 3.4, fy);
        ctx.lineTo(fx + 3.4, fy);
        ctx.lineTo(fx + 3.4 + flap, fy + h * 0.38);
        ctx.lineTo(fx - 3.4 + flap, fy + h * 0.38);
        ctx.fill();
      }
    }
    void P;
  },
  whiteWall(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a whitewashed monastery wall, tapering, a red band and black window frames
    ctx.fillStyle = vg(ctx, y, y + h, T('#fbf8f0'), T('#d8d0c0'));
    ctx.beginPath();
    ctx.moveTo(x - 6, y + h);
    ctx.lineTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w + 6, y + h);
    ctx.fill();
    ctx.fillStyle = T('#8a2a24');
    ctx.fillRect(x, y, w, 10);
    ctx.fillStyle = T('#1a1414');
    for (const fx of [0.2, 0.5, 0.8]) {
      ctx.beginPath();
      ctx.moveTo(x + w * fx - 9, y + h * 0.65);
      ctx.lineTo(x + w * fx - 6, y + h * 0.35);
      ctx.lineTo(x + w * fx + 6, y + h * 0.35);
      ctx.lineTo(x + w * fx + 9, y + h * 0.65);
      ctx.fill();
      ctx.fillStyle = T('#d8a840');
      ctx.fillRect(x + w * fx - 5, y + h * 0.4, 10, 2);
      ctx.fillStyle = T('#1a1414');
    }
    ctx.fillStyle = alpha(P.light, 0.3);
    ctx.fillRect(x, y + 10, w, 2);
  },

  // ---------- Stepwell City
  carvedArch(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a sandstone arch carved like lace, a pierced stone screen above it
    const col = T('#e8b88a');
    backPost(ctx, x - 12, y + h * 0.4, o.ground, 16, T('#c8986a'));
    backPost(ctx, x + w + 12, y + h * 0.4, o.ground, 16, T('#c8986a'));
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x - 22, y + h);
    ctx.lineTo(x - 22, y);
    ctx.lineTo(x + w + 22, y);
    ctx.lineTo(x + w + 22, y + h);
    ctx.lineTo(x + w, y + h);
    // a cusped arch: little scallops along its curve
    for (let k = 8; k >= 0; k--) {
      const u = k / 8;
      ctx.lineTo(x + w * u, y + h - Math.sin(u * Math.PI) * h * 0.55 + (k % 2 ? 4 : 0));
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = alpha('#5a2a10', 0.45);
    for (let k = 0; k < Math.floor((w + 40) / 9); k++) {
      for (let j = 0; j < 2; j++) {
        ctx.beginPath();
        ctx.arc(x - 16 + k * 9 + (j % 2) * 4.5, y + 6 + j * 7, 2, 0, TAU);
        ctx.fill();
      }
    }
    void P;
  },
  chhatri(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a stone pavilion: pillars, a flat roof terrace with a little rail, a dome at the back
    ctx.fillStyle = vg(ctx, y - 30, y, T('#f0c890'), T('#c8986a'));
    ctx.beginPath();
    ctx.arc(x + w / 2, y, w * 0.3, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x + w / 2 - 1.5, y - w * 0.3 - 10, 3, 10);
    ctx.fillStyle = woodGrad(ctx, y, 10, T, '#f0c890', '#d8a870', '#a87848');
    ctx.fillRect(x - 6, y, w + 12, 10);
    const n = 4;
    for (let k = 0; k < n; k++) {
      const px = x + (k * (w - 12)) / (n - 1);
      ctx.fillStyle = vg(ctx, y + 10, y + h, T('#f0c890'), T('#b07848'));
      ctx.fillRect(px, y + 10, 12, h - 16);
      ctx.fillRect(px - 2, y + h - 8, 16, 8);
    }
    ctx.fillStyle = alpha('#3a1808', 0.35);
    for (let k = 0; k < n - 1; k++) {
      const px = x + 12 + (k * (w - 12)) / (n - 1);
      const sw = (w - 12) / (n - 1) - 12;
      ctx.beginPath();
      ctx.moveTo(px, y + 10);
      ctx.quadraticCurveTo(px + sw / 2, y + 30, px + sw, y + 10);
      ctx.lineTo(px + sw, y + 14);
      ctx.quadraticCurveTo(px + sw / 2, y + 34, px, y + 14);
      ctx.fill();
    }
    void P;
  },

  // ---------- Kite Hill
  kiteSpool(ctx, o, T) {
    const { x, y, w, h } = o;
    // a big wooden reel of kite string standing on end
    ctx.fillStyle = woodGrad(ctx, y, h, T, '#c8984a', '#a07a3a', '#6a4a20');
    rr(ctx, x, y, w, 7, 3);
    ctx.fill();
    rr(ctx, x, y + h - 7, w, 7, 3);
    ctx.fill();
    ctx.fillStyle = vg(ctx, y + 7, y + h - 7, T('#f4f0e6'), T('#c8c0b0'));
    ctx.fillRect(x + 6, y + 7, w - 12, h - 14);
    ctx.strokeStyle = alpha('#8a8070', 0.5);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let yy = y + 9; yy < y + h - 8; yy += 2.4) {
      ctx.moveTo(x + 6, yy);
      ctx.lineTo(x + w - 6, yy + 1);
    }
    ctx.stroke();
    ctx.fillStyle = T('#e8433a');
    ctx.fillRect(x + 6, y + h * 0.45, w - 12, 3);
  },
  kiteFrames(ctx, o, T) {
    const { x, y, w, h } = o;
    // half-built kites leaning together: bare bamboo crosses, sharp ends sticking up
    const r = mulberry32(o.seed);
    for (let k = 0; k < 4; k++) {
      const cx = x + 8 + k * ((w - 16) / 3);
      const lean = (r() - 0.5) * 0.5;
      ctx.save();
      ctx.translate(cx, y + h);
      ctx.rotate(lean);
      ctx.strokeStyle = T('#b8a060');
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -h);
      ctx.moveTo(-10, -h * 0.65);
      ctx.lineTo(10, -h * 0.65);
      ctx.stroke();
      if (k % 2) {
        ctx.fillStyle = alpha(T(BRIGHT[(k + o.seed) % BRIGHT.length]), 0.85);
        ctx.beginPath();
        ctx.moveTo(0, -h);
        ctx.lineTo(10, -h * 0.65);
        ctx.lineTo(0, -h * 0.2);
        ctx.lineTo(-10, -h * 0.65);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  },
  kiteLine(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a line of small kites tethered low across the path, all tugging at once
    backPost(ctx, x - 8, y - 6, o.ground, 4, T('#5a4a3a'));
    backPost(ctx, x + w + 8, y - 6, o.ground, 4, T('#5a4a3a'));
    ctx.strokeStyle = T('#4a4040');
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 4);
    ctx.quadraticCurveTo(x + w / 2, y + 4, x + w + 8, y - 4);
    ctx.stroke();
    const n = Math.floor(w / 22);
    for (let k = 0; k < n; k++) {
      const kx = x + 11 + k * 22 + Math.sin(t * 2 + k) * 2;
      const ky = y + h * 0.4 + Math.cos(t * 2.4 + k) * 2;
      ctx.fillStyle = T(BRIGHT[(k + o.seed) % BRIGHT.length]);
      ctx.beginPath();
      ctx.moveTo(kx, ky - h * 0.4);
      ctx.lineTo(kx + 7, ky);
      ctx.lineTo(kx, ky + h * 0.45);
      ctx.lineTo(kx - 7, ky);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = T('#4a4040');
      ctx.beginPath();
      ctx.moveTo(kx, y);
      ctx.lineTo(kx, ky - h * 0.4);
      ctx.moveTo(kx, ky + h * 0.45);
      ctx.lineTo(kx + Math.sin(t * 4 + k) * 3, ky + h * 0.6);
      ctx.stroke();
    }
    void P;
  },
  kiteStall(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a stall selling kites: a flat striped roof, kites hung all over its front
    const roof = 9;
    ctx.fillStyle = T('#5a4030');
    ctx.fillRect(x + 4, y + roof, 5, h - roof);
    ctx.fillRect(x + w - 9, y + roof, 5, h - roof);
    for (let k = 0; k < Math.floor((w + 12) / 12); k++) {
      ctx.fillStyle = T(k % 2 ? '#f4ece0' : '#3a8ad8');
      ctx.fillRect(x - 6 + k * 12, y, 12, roof);
    }
    ctx.fillStyle = woodGrad(ctx, y + h - 30, 30, T, '#c8984a', '#a07a3a', '#6a4a20');
    ctx.fillRect(x + 2, y + h - 30, w - 4, 30);
    const r = mulberry32(o.seed);
    for (let k = 0; k < 7; k++) {
      const kx = x + 14 + r() * (w - 28);
      const ky = y + roof + 10 + r() * (h - roof - 50);
      ctx.fillStyle = T(BRIGHT[k % BRIGHT.length]);
      ctx.beginPath();
      ctx.moveTo(kx, ky - 9);
      ctx.lineTo(kx + 7, ky);
      ctx.lineTo(kx, ky + 11);
      ctx.lineTo(kx - 7, ky);
      ctx.closePath();
      ctx.fill();
    }
    void P;
  },
};

// ---------------------------------------------------------------- movers

/** Rolling skins for chapter 8. Called with the context already rotated. False if not ours. */
export function kiteRoller(ctx, m, r, T, P) {
  if (m.skin === 'brassPot') {
    // a brass water pot, knocked over and rolling, the light catching its rim
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.1);
    g.addColorStop(0, T('#ffe8a0'));
    g.addColorStop(0.5, T('#d8a040'));
    g.addColorStop(1, T('#7a5418'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#5a3a10');
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#fff0c0');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, TAU);
    ctx.moveTo(r * 0.75, 0);
    ctx.arc(0, 0, r * 0.75, 0, TAU);
    ctx.stroke();
  } else if (m.skin === 'spool') {
    // a runaway reel of kite string
    ctx.fillStyle = T('#a07a3a');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = T('#f0ece0');
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = alpha('#8a8070', 0.6);
    ctx.lineWidth = 0.8;
    for (let k = 0.3; k < 0.78; k += 0.08) {
      ctx.beginPath();
      ctx.arc(0, 0, r * k, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = T('#6a4a20');
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU;
      ctx.fillRect(Math.cos(a) * r * 0.88 - 1.5, Math.sin(a) * r * 0.88 - 1.5, 3, 3);
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.18, 0, TAU);
    ctx.fill();
  } else return false;
  void P;
  return true;
}

// ---------------------------------------------------------------- decor

export const KITE_DECOR = {
  marigolds(ctx, d, T) {
    // a string of marigolds dropped on the steps
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = T(k % 2 ? '#f08a1a' : '#f2c040');
      ctx.beginPath();
      ctx.arc(d.x + k * 3.4, d.y - 2 - Math.sin(k) * 1.4, 2.2 * d.s, 0, TAU);
      ctx.fill();
    }
  },
};

// ---------------------------------------------------------------- foreground

/** Chapter 8 silhouettes for the foreground strip. False if the terrain is not ours. */
export function kiteForeground(g, kind, x, H, rng) {
  if (kind === 'karst') {
    for (let k = 0; k < 6; k++) {
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x + k * 6, H);
      g.quadraticCurveTo(x + k * 6 + 10, H - 100, x + k * 14 - 20, H - 150 - rng() * 30);
      g.stroke();
    }
  } else if (kind === 'steppe' || kind === 'kites') {
    for (let k = 0; k < 16; k++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 1.2;
      const l = 50 + rng() * 70;
      g.lineWidth = 2 + rng() * 3;
      g.beginPath();
      g.moveTo(x + (rng() - 0.5) * 40, H);
      g.quadraticCurveTo(x + Math.cos(a) * l * 0.4, H + Math.sin(a) * l * 0.7, x + Math.cos(a) * l, H + Math.sin(a) * l);
      g.stroke();
    }
  } else if (kind === 'chimneys' || kind === 'monastery' || kind === 'stepwell') {
    g.beginPath();
    g.moveTo(x - 80, H);
    g.lineTo(x - 50, H - 50 - rng() * 30);
    g.lineTo(x + 30, H - 60 - rng() * 20);
    g.lineTo(x + 80, H);
    g.fill();
  } else return false;
  return true;
}

// ---------------------------------------------------------------- finale

/** The end of the road east: everybody on the hill letting the giant dragon kite go up. */
export function drawKiteLaunch(ctx, x, y, T, P, t, open) {
  // the dragon: a long train of round discs, each with little legs, rising off the hill
  const rise = open ? 1 : 0.35;
  const n = 26;
  const pts = [];
  for (let k = 0; k < n; k++) {
    const u = k / (n - 1);
    const px = x + 40 + u * 360;
    const py = y - 40 - u * 280 * rise - Math.sin(u * 7 + t * 1.5) * 18 * (0.3 + u);
    pts.push([px, py]);
  }
  ctx.strokeStyle = T('#4a3a30');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.quadraticCurveTo(x + 20, y - 30, pts[0][0], pts[0][1]);
  for (const [px, py] of pts) ctx.lineTo(px, py);
  ctx.stroke();
  for (let k = n - 1; k >= 1; k--) {
    const [px, py] = pts[k];
    const r = 11 - k * 0.15;
    ctx.fillStyle = T(BRIGHT[k % BRIGHT.length]);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = alpha('#ffffff', 0.35);
    ctx.beginPath();
    ctx.arc(px - r * 0.3, py - r * 0.3, r * 0.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = T('#2a2020');
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(px - r, py);
    ctx.lineTo(px - r - 6, py + 4);
    ctx.moveTo(px + r, py);
    ctx.lineTo(px + r + 6, py + 4);
    ctx.stroke();
  }
  // the dragon's head, with whiskers and horns
  const [hx, hy] = pts[0];
  ctx.fillStyle = T('#e8433a');
  ctx.beginPath();
  ctx.ellipse(hx, hy, 22, 16, -0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = T('#f2c040');
  ctx.beginPath();
  ctx.arc(hx - 8, hy - 4, 4, 0, TAU);
  ctx.arc(hx + 6, hy - 6, 4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = T('#1a1414');
  ctx.beginPath();
  ctx.arc(hx - 8, hy - 4, 1.8, 0, TAU);
  ctx.arc(hx + 6, hy - 6, 1.8, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = T('#f2c040');
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(hx - 18, hy + 4);
  ctx.quadraticCurveTo(hx - 30, hy + 10 + Math.sin(t * 3) * 3, hx - 40, hy + 4);
  ctx.moveTo(hx + 16, hy + 6);
  ctx.quadraticCurveTo(hx + 28, hy + 14 + Math.sin(t * 3 + 1) * 3, hx + 36, hy + 8);
  ctx.moveTo(hx - 4, hy - 14);
  ctx.lineTo(hx - 10, hy - 26);
  ctx.moveTo(hx + 6, hy - 14);
  ctx.lineTo(hx + 10, hy - 26);
  ctx.stroke();
  // the crowd holding the line, and a table of tea and cakes
  for (let k = 0; k < 6; k++) {
    const px = x - 10 - k * 18;
    ctx.fillStyle = T(['#c83a3a', '#2a5ab0', '#f2c040', '#3a8a4a', '#e870a8', '#5a4a3a'][k]);
    ctx.fillRect(px - 3, y - 18, 6, 18);
    ctx.fillStyle = T('#3a2a20');
    ctx.beginPath();
    ctx.arc(px, y - 21, 3.4, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = T('#f4ece0');
  ctx.fillRect(x + 140, y - 26, 110, 5);
  ctx.fillStyle = T('#8a6a44');
  ctx.fillRect(x + 146, y - 21, 3, 21);
  ctx.fillRect(x + 241, y - 21, 3, 21);
  for (let k = 0; k < 5; k++) {
    ctx.fillStyle = T(['#e8a0b8', '#f2c040', '#ffffff'][k % 3]);
    ctx.beginPath();
    ctx.arc(x + 156 + k * 20, y - 29, 4, Math.PI, 0);
    ctx.fill();
  }
}
