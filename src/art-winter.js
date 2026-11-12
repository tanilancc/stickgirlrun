// Chapter 7 world art: snowy ground, pits, props, a glowing ice ball, decor and the great tree in
// the square on midwinter night. Same contract as art.js (world coordinates, tone function T
// applied to every colour).

import { hash, mulberry32 } from './rng.js';
import { rr, vg, edgeShade, woodGrad, backPost } from './art.js';
import { mix, alpha, TAU, fract, clamp } from './util.js';

// ---------------------------------------------------------------- ground

/** Snow lying on whatever is underneath: a soft white top with blue shadow, drifting at the edges. */
function snowTop(ctx, s, sx0, sx1, T, G, h = 12, t = 0) {
  ctx.fillStyle = vg(ctx, s.y - 3, s.y + h, T(G.top2), T(G.top));
  ctx.beginPath();
  ctx.moveTo(sx0, s.y + h);
  for (let x = Math.floor(sx0 / 12) * 12; x <= sx1 + 12; x += 12) ctx.lineTo(clamp(x, sx0, sx1), s.y - 2 - hash(x) * 2.4);
  ctx.lineTo(sx1, s.y + h);
  ctx.fill();
  ctx.fillStyle = 'rgba(120,150,200,0.25)';
  ctx.fillRect(sx0, s.y + h - 3, sx1 - sx0, 3);
  for (let x = Math.floor(sx0 / 13) * 13; x < sx1; x += 13) {
    const k = hash(x * 19);
    if (k < 0.72) continue;
    ctx.fillStyle = `rgba(255,255,255,${(0.5 + 0.5 * Math.sin(t * 4 + x)) * 0.9})`;
    ctx.fillRect(x, s.y + 1 + k * 6, 1.4, 1.4);
  }
}

function snowEdges(ctx, s, sx0, sx1, T, G, openL, openR) {
  // snow curling over the lip of a drop
  const lip = (ex, dir) => {
    ctx.fillStyle = T(G.top2);
    ctx.beginPath();
    ctx.moveTo(ex - dir * 10, s.y);
    ctx.quadraticCurveTo(ex + dir * 6, s.y - 2, ex + dir * 3, s.y + 9);
    ctx.lineTo(ex - dir * 4, s.y + 12);
    ctx.fill();
  };
  if (openL && s.x0 >= sx0) lip(s.x0, -1);
  if (openR && s.x1 <= sx1) lip(s.x1, 1);
}

export const WINTER_SEG = {
  birchwood(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 120, T('#5a4a3a'), T('#1e1810'));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    ctx.fillStyle = alpha('#000000', 0.25);
    for (let x = Math.floor(sx0 / 41) * 41; x < sx1; x += 41) {
      const h = hash(x);
      if (h < 0.4) continue;
      ctx.beginPath();
      ctx.ellipse(x + h * 20, s.y + 30 + hash(x * 3) * 60, 4 + h * 6, 2 + h * 3, 0, 0, TAU);
      ctx.fill();
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.4));
    snowTop(ctx, s, sx0, sx1, T, G, 14, t);
    // birch leaves and twigs on the snow, and tracks
    for (let x = Math.floor(sx0 / 7) * 7; x < sx1; x += 7) {
      const h = hash(x * 11);
      if (h < 0.75) continue;
      ctx.fillStyle = T(h > 0.9 ? '#c8a040' : '#6a5a4a');
      ctx.fillRect(x, s.y + 2 + hash(x) * 4, 2.4, 1.2);
    }
    snowEdges(ctx, s, sx0, sx1, T, G, openL, openR);
  },

  icelake(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    // thick clear ice, bubbles frozen in it, cracks running down
    ctx.fillStyle = vg(ctx, s.y, s.y + 200, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    ctx.fillStyle = alpha('#ffffff', 0.3);
    for (let x = Math.floor(sx0 / 11) * 11; x < sx1; x += 11) {
      if (hash(x * 3) < 0.55) continue;
      ctx.beginPath();
      ctx.arc(x, s.y + 20 + hash(x * 7) * 100, 0.8 + hash(x) * 1.6, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = alpha('#ffffff', 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 67) * 67; x < sx1; x += 67) {
      if (hash(x * 5) < 0.4) continue;
      ctx.moveTo(x, s.y + 6);
      ctx.lineTo(x + 10, s.y + 30);
      ctx.lineTo(x + 4, s.y + 60);
      ctx.moveTo(x + 10, s.y + 30);
      ctx.lineTo(x + 26, s.y + 44);
    }
    ctx.stroke();
    ctx.fillStyle = vg(ctx, s.y - 2, s.y + 6, T(G.top2), T(G.top));
    ctx.fillRect(sx0, s.y - 1, sx1 - sx0, 7);
    // the scratches of a thousand skates
    ctx.strokeStyle = alpha('#ffffff', 0.7);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let x = Math.floor(sx0 / 23) * 23; x < sx1; x += 23) {
      ctx.moveTo(x, s.y + 1 + hash(x) * 3);
      ctx.quadraticCurveTo(x + 12, s.y + hash(x * 3) * 4, x + 26, s.y + 1 + hash(x * 5) * 3);
    }
    ctx.stroke();
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#0a1a3a', 0.35));
  },

  tundra(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 140, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
    snowTop(ctx, s, sx0, sx1, T, G, 14, t);
    // reindeer tracks and the sled runners' lines
    ctx.strokeStyle = alpha('#5a6a8a', 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx0, s.y + 4);
    ctx.lineTo(sx1, s.y + 4);
    ctx.moveTo(sx0, s.y + 7);
    ctx.lineTo(sx1, s.y + 7);
    ctx.stroke();
    ctx.fillStyle = alpha('#3a4a6a', 0.5);
    for (let x = Math.floor(sx0 / 9) * 9; x < sx1; x += 9) if (hash(x * 3) > 0.6) ctx.fillRect(x, s.y + 1 + hash(x) * 8, 1.6, 1);
    snowEdges(ctx, s, sx0, sx1, T, G, openL, openR);
  },

  skihill(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 160, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    // layers of old snow
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = alpha(k % 2 ? '#ffffff' : '#2a3a5a', 0.1);
      ctx.fillRect(sx0, s.y + 16 + k * 18, sx1 - sx0, 6);
    }
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#0a1430', 0.4));
    snowTop(ctx, s, sx0, sx1, T, G, 12, t);
    // groomed corduroy
    ctx.strokeStyle = alpha('#a8b8d8', 0.45);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      ctx.moveTo(sx0, s.y + 2 + k * 3);
      ctx.lineTo(sx1, s.y + 2 + k * 3);
    }
    ctx.stroke();
    snowEdges(ctx, s, sx0, sx1, T, G, openL, openR);
  },

  sculptures(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    ctx.fillStyle = vg(ctx, s.y, s.y + 150, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    // packed snow cut in blocks, little lights set in it
    ctx.strokeStyle = alpha('#ffffff', 0.15);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let yy = s.y + 20; yy < Math.min(bottom, s.y + 200); yy += 18) {
      ctx.moveTo(sx0, yy);
      ctx.lineTo(sx1, yy);
    }
    ctx.stroke();
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000010', 0.45));
    snowTop(ctx, s, sx0, sx1, T, G, 12, t);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let x = Math.ceil(sx0 / 70) * 70; x < sx1; x += 70) {
      const c = ['#9ad8ff', '#c8a8ff', '#a8ffd8'][Math.floor(hash(x) * 3)];
      ctx.fillStyle = alpha(c, 0.25);
      ctx.beginPath();
      ctx.arc(x, s.y + 6, 10, 0, TAU);
      ctx.fill();
      ctx.fillStyle = alpha(c, 0.9);
      ctx.fillRect(x - 1.5, s.y + 4, 3, 3);
    }
    ctx.restore();
    snowEdges(ctx, s, sx0, sx1, T, G, openL, openR);
  },

  square(ctx, s, sx0, sx1, bottom, P, T, t, openL, openR) {
    const G = P.ground;
    // cobbles under the snow, swept clear in places
    ctx.fillStyle = vg(ctx, s.y, s.y + 120, T(G.body), T(G.deep));
    ctx.fillRect(sx0, s.y, sx1 - sx0, bottom - s.y);
    ctx.strokeStyle = alpha('#000000', 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let row = 0; row < 8; row++) {
      const yy = s.y + 12 + row * 12;
      ctx.moveTo(sx0, yy);
      ctx.lineTo(sx1, yy);
      for (let x = Math.floor(sx0 / 16) * 16 + (row % 2) * 8; x < sx1; x += 16) {
        ctx.moveTo(x, yy);
        ctx.lineTo(x, yy + 12);
      }
    }
    ctx.stroke();
    edgeShade(ctx, s, sx0, sx1, bottom, openL, openR, alpha('#000000', 0.45));
    snowTop(ctx, s, sx0, sx1, T, G, 10, t);
    ctx.fillStyle = T(mix(G.body, '#ffffff', 0.2));
    for (let x = Math.floor(sx0 / 90) * 90; x < sx1; x += 90) if (hash(x * 3) > 0.5) ctx.fillRect(x, s.y + 1, 30 + hash(x) * 20, 4);
    snowEdges(ctx, s, sx0, sx1, T, G, openL, openR);
  },
};

/** Pits for the chapter 7 terrains. Returns false when the terrain is not one of ours. */
export function winterPit(ctx, terr, P, T, a, b, bottom, t) {
  const top = Math.max(a.y, b.y) + 1;
  const x0 = a.x1;
  const w = b.x0 - a.x1;
  if (terr === 'icelake') {
    // a hole in the ice, black water moving under it
    ctx.fillStyle = vg(ctx, top, top + 40, T('#9ac0dc'), T('#4a7a9a'));
    ctx.fillRect(x0, top, w, 30);
    ctx.fillStyle = vg(ctx, top + 30, top + 160, T('#1a3a5a'), T('#050c18'));
    ctx.fillRect(x0, top + 30, w, bottom - top - 30);
    ctx.strokeStyle = alpha('#9ad0ff', 0.35);
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const xx = x0 + fract(hash(k + a.x1) + t * 0.1) * w;
      ctx.beginPath();
      ctx.moveTo(xx, top + 36 + k * 6);
      ctx.lineTo(Math.min(x0 + w, xx + 12), top + 36 + k * 6);
      ctx.stroke();
    }
    return true;
  }
  if (!['birchwood', 'tundra', 'skihill', 'sculptures', 'square'].includes(terr)) return false;
  // a drift-filled hollow: blue snow going down into shadow, a frozen stream at the bottom
  ctx.fillStyle = vg(ctx, top, top + 160, T('#c8d4ec'), T('#4a5a80'), T('#0e1424'));
  ctx.fillRect(x0, top, w, bottom - top);
  ctx.fillStyle = alpha('#ffffff', 0.25);
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.ellipse(x0 + w * (0.25 + k * 0.25), top + 40 + k * 16, w * 0.2, 4, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = T('#9ac0dc');
  ctx.fillRect(x0, top + 110, w, 4);
  return true;
}

// ---------------------------------------------------------------- props

function snowCap(ctx, x, y, w, T, seed, depth = 6) {
  ctx.fillStyle = T('#ffffff');
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 2);
  for (let k = 0; k <= 6; k++) ctx.lineTo(x + (k / 6) * w, y - depth * (0.5 + 0.5 * Math.sin((k / 6) * Math.PI)) - hash(seed + k) * 2);
  ctx.lineTo(x + w + 2, y + 2);
  ctx.quadraticCurveTo(x + w * 0.5, y + depth * 0.6, x - 2, y + 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(150,175,215,0.35)';
  ctx.fillRect(x, y + 1, w, 1.6);
}

function snowmanBody(ctx, cx, by, r1, T, seed, t) {
  const balls = [
    [by - r1, r1],
    [by - r1 * 2.5, r1 * 0.72],
    [by - r1 * 3.5, r1 * 0.5],
  ];
  for (const [y, r] of balls) {
    const g = ctx.createRadialGradient(cx - r * 0.35, y - r * 0.35, 0, cx, y, r * 1.1);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#a8b8d8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, y, r, 0, TAU);
    ctx.fill();
  }
  const hy = by - r1 * 3.5;
  const hr = r1 * 0.5;
  ctx.fillStyle = T('#1a1a20');
  ctx.fillRect(cx - hr * 0.4, hy - hr * 0.3, 1.6, 1.6);
  ctx.fillRect(cx + hr * 0.2, hy - hr * 0.3, 1.6, 1.6);
  for (let k = 0; k < 3; k++) ctx.fillRect(cx - 0.8, by - r1 * 2.5 - r1 * 0.4 + k * r1 * 0.35, 1.6, 1.6);
  ctx.fillStyle = T('#f07a2a');
  ctx.beginPath();
  ctx.moveTo(cx, hy);
  ctx.lineTo(cx + hr * 1.1, hy + 1);
  ctx.lineTo(cx, hy + 2.4);
  ctx.fill();
  // a scarf that blows a little, and a hat
  ctx.fillStyle = T(['#c83a3a', '#2a6ab0', '#3a8a4a'][seed % 3]);
  ctx.fillRect(cx - r1 * 0.6, by - r1 * 3.1, r1 * 1.2, 3);
  ctx.beginPath();
  ctx.moveTo(cx + r1 * 0.4, by - r1 * 3.05);
  ctx.lineTo(cx + r1 * 0.9 + Math.sin(t * 3 + seed) * 2, by - r1 * 2.6);
  ctx.lineTo(cx + r1 * 0.6, by - r1 * 2.5);
  ctx.fill();
  ctx.fillStyle = T('#1a1a20');
  ctx.fillRect(cx - hr * 0.9, hy - hr * 0.95, hr * 1.8, 2);
  ctx.fillRect(cx - hr * 0.6, hy - hr * 1.8, hr * 1.2, hr * 0.9);
  ctx.strokeStyle = T('#5a3a24');
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - r1 * 0.6, by - r1 * 2.6);
  ctx.lineTo(cx - r1 * 1.4, by - r1 * 3.2);
  ctx.moveTo(cx + r1 * 0.6, by - r1 * 2.6);
  ctx.lineTo(cx + r1 * 1.3, by - r1 * 2.9);
  ctx.stroke();
}

function lights(ctx, pts, t, cols, seed) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  pts.forEach(([x, y], k) => {
    const on = 0.55 + 0.45 * Math.sin(t * 3 + k * 1.7 + seed);
    const c = cols[k % cols.length];
    ctx.fillStyle = alpha(c, 0.2 * on);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = alpha(c, on);
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, TAU);
    ctx.fill();
  });
  ctx.restore();
}

function runners(ctx, x, y, w, T) {
  ctx.strokeStyle = T('#8a3a24');
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - 8, y);
  ctx.quadraticCurveTo(x + w + 4, y, x + w + 2, y - 10);
  ctx.stroke();
}

export const WINTER_OB = {
  // ---------- Birch Wood
  woodSledge(ctx, o, T) {
    const { x, y, w, h } = o;
    // a wooden sledge, loaded and roped down
    runners(ctx, x, y + h - 2, w, T);
    ctx.fillStyle = T('#8a3a24');
    for (const fx of [0.15, 0.5, 0.82]) ctx.fillRect(x + w * fx - 2, y + h - 12, 4, 10);
    ctx.fillStyle = woodGrad(ctx, y + h - 16, 5, T, '#c89a5a', '#a07a44', '#6a4a28');
    ctx.fillRect(x - 2, y + h - 16, w, 5);
    ctx.fillStyle = vg(ctx, y + 4, y + h - 16, T('#5a7a4a'), T('#2e4a2a'));
    rr(ctx, x + 4, y + 6, w - 14, h - 22, 5);
    ctx.fill();
    ctx.strokeStyle = T('#c8b08a');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + h - 16);
    ctx.lineTo(x + w * 0.4, y + 6);
    ctx.lineTo(x + w - 12, y + h - 16);
    ctx.stroke();
    snowCap(ctx, x + 6, y + 7, w - 18, T, o.seed, 5);
  },
  snowLog(ctx, o, T, P) {
    const { x, y, w, h } = o;
    ctx.fillStyle = woodGrad(ctx, y + 4, h - 4, T, '#8a7058', '#5a4634', '#2e2218');
    rr(ctx, x, y + 4, w, h - 4, (h - 4) / 2);
    ctx.fill();
    ctx.fillStyle = T('#d8b888');
    ctx.beginPath();
    ctx.ellipse(x + w - 4, y + 4 + (h - 4) / 2, 4, (h - 4) / 2 - 1, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = alpha('#2a1a10', 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      ctx.moveTo(x + 10 + k * (w / 5), y + 10);
      ctx.lineTo(x + 18 + k * (w / 5), y + h - 4);
    }
    ctx.stroke();
    snowCap(ctx, x + 4, y + 6, w - 10, T, o.seed, 8);
    void P;
  },
  hollyBush(ctx, o, T) {
    const { x, y, w, h } = o;
    // spiky dark holly, berries red, snow sitting on top
    const r = mulberry32(o.seed);
    for (let k = 0; k < 40; k++) {
      const lx = x + 4 + r() * (w - 8);
      const ly = y + 6 + r() * (h - 8);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(r() * TAU);
      ctx.fillStyle = T(k % 3 ? '#1e4a2a' : '#2e6a3a');
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      for (let j = 0; j <= 4; j++) ctx.lineTo(-6 + j * 3, j % 2 ? -3.4 : -1.2);
      ctx.lineTo(6, 0);
      for (let j = 4; j >= 0; j--) ctx.lineTo(-6 + j * 3, j % 2 ? 3.4 : 1.2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = T('#d81a1a');
    for (let k = 0; k < 14; k++) {
      ctx.beginPath();
      ctx.arc(x + 6 + r() * (w - 12), y + 8 + r() * (h - 16), 2, 0, TAU);
      ctx.fill();
    }
    snowCap(ctx, x + 6, y + 6, w - 12, T, o.seed, 6);
  },
  birchArch(ctx, o, T) {
    const { x, y, w, h } = o;
    // a birch bowed right over by the weight of snow, its top frozen to the ground
    const lx = x - 40;
    const rx = x + w + 30;
    ctx.strokeStyle = T('#ece8e2');
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lx, o.ground);
    ctx.quadraticCurveTo(lx + 10, y - 30, x + w * 0.5, y + h * 0.3);
    ctx.quadraticCurveTo(x + w, y + h * 0.5, rx, o.ground - 4);
    ctx.stroke();
    ctx.strokeStyle = T('#2a2a30');
    ctx.lineWidth = 2;
    for (let k = 0; k < 9; k++) {
      const u = 0.1 + k * 0.09;
      const px = lx + (rx - lx) * u;
      const py = o.ground - Math.sin(u * Math.PI) * (o.ground - y - h * 0.2);
      ctx.beginPath();
      ctx.moveTo(px - 2, py);
      ctx.lineTo(px + 2, py + 1);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let k = 0; k < 30; k++) {
      const u = 0.2 + hash(o.seed + k) * 0.6;
      const px = lx + (rx - lx) * u;
      const py = o.ground - Math.sin(u * Math.PI) * (o.ground - y - h * 0.2);
      ctx.moveTo(px, py);
      ctx.lineTo(px + (hash(k) - 0.5) * 14, py + 6 + hash(k * 3) * 10);
    }
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.25, w * 0.4, 4, 0, Math.PI, 0);
    ctx.fill();
    ctx.lineCap = 'butt';
  },
  feedingRack(ctx, o, T) {
    const { x, y, w, h } = o;
    // a hay rack for the deer, a little roof over it, flat and snowed on
    const roof = 10;
    ctx.fillStyle = T('#4a3a2a');
    ctx.fillRect(x + 4, y + roof, 6, h - roof);
    ctx.fillRect(x + w - 10, y + roof, 6, h - roof);
    ctx.fillStyle = vg(ctx, y + roof, y + h - 14, T('#d8b860'), T('#9a7a34'));
    ctx.fillRect(x + 10, y + roof + 6, w - 20, h - roof - 26);
    ctx.strokeStyle = T('#5a4430');
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let xx = x + 14; xx < x + w - 10; xx += 9) {
      ctx.moveTo(xx, y + roof + 6);
      ctx.lineTo(xx, y + h - 20);
    }
    ctx.stroke();
    ctx.fillStyle = woodGrad(ctx, y + h - 20, 8, T, '#7a5a3a', '#5a4028', '#3a2818');
    ctx.fillRect(x + 4, y + h - 20, w - 8, 8);
    ctx.fillStyle = woodGrad(ctx, y, roof, T, '#6a5040', '#4a3a2a', '#2a2018');
    ctx.fillRect(x - 6, y, w + 12, roof);
    snowCap(ctx, x - 6, y + 1, w + 12, T, o.seed, 6);
  },

  // ---------- Skating Lake
  skateBench(ctx, o, T) {
    const { x, y, w, h } = o;
    ctx.fillStyle = T('#3a2a1e');
    ctx.fillRect(x + 6, y + 8, 5, h - 8);
    ctx.fillRect(x + w - 11, y + 8, 5, h - 8);
    ctx.fillStyle = woodGrad(ctx, y + 6, 8, T, '#b07a4a', '#8a5a34', '#5a3a1e');
    ctx.fillRect(x, y + 6, w, 8);
    snowCap(ctx, x, y + 7, w, T, o.seed, 5);
    // a pair of skates hung on the end by their laces
    ctx.strokeStyle = T('#f0f0f0');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w - 6, y + 12);
    ctx.lineTo(x + w - 4, y + 22);
    ctx.stroke();
    ctx.fillStyle = T('#f4f0ea');
    ctx.fillRect(x + w - 10, y + 22, 8, 8);
    ctx.fillStyle = T('#8a8a92');
    ctx.fillRect(x + w - 12, y + 30, 12, 1.4);
  },
  holeFlags(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a fishing hole fenced off with flagged sticks: thin ice, keep off
    ctx.fillStyle = T('#0e2236');
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 2, w * 0.35, 3, 0, 0, TAU);
    ctx.fill();
    const n = 4;
    for (let k = 0; k < n; k++) {
      const px = x + 4 + (k * (w - 8)) / (n - 1);
      ctx.fillStyle = T('#5a4430');
      ctx.fillRect(px - 1, y + 4, 2, h - 4);
      const flap = Math.sin(t * 5 + k + o.seed) * 2;
      ctx.fillStyle = T(k % 2 ? '#e8433a' : '#f2c040');
      ctx.beginPath();
      ctx.moveTo(px + 1, y + 4);
      ctx.lineTo(px + 11, y + 7 + flap);
      ctx.lineTo(px + 1, y + 11);
      ctx.fill();
    }
    ctx.strokeStyle = T('#e8433a');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h * 0.55);
    ctx.lineTo(x + w - 4, y + h * 0.55);
    ctx.stroke();
    void P;
  },
  fishingHut(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a fishing hut out on the ice, flat-roofed, a stovepipe smoking
    const roof = 8;
    ctx.fillStyle = woodGrad(ctx, y, h, T, '#c84a34', '#a83a2a', '#6a2018');
    ctx.fillRect(x, y + roof, w, h - roof);
    ctx.fillStyle = alpha('#000000', 0.25);
    for (let xx = x + 8; xx < x + w; xx += 8) ctx.fillRect(xx, y + roof, 1, h - roof);
    ctx.fillStyle = T('#2a2a30');
    ctx.fillRect(x - 4, y, w + 8, roof);
    snowCap(ctx, x - 4, y + 1, w + 8, T, o.seed, 6);
    ctx.fillStyle = T('#2a1a14');
    ctx.fillRect(x + w * 0.15, y + h * 0.4, 20, h * 0.6);
    ctx.fillStyle = alpha('#ffd890', 0.8);
    ctx.fillRect(x + w * 0.6, y + h * 0.35, 18, 14);
    ctx.fillStyle = T('#3a3a40');
    ctx.fillRect(x + w - 20, y - 18, 5, 18);
    void P;
  },

  // ---------- Reindeer Road
  reindeerFence(ctx, o, T) {
    const { x, y, w, h } = o;
    // a corral of slender poles, leaning together, antlers hung on the posts
    ctx.strokeStyle = T('#8a7a64');
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < 7; k++) {
      const px = x + (k * w) / 6;
      ctx.moveTo(px, y + h);
      ctx.lineTo(px + (k % 2 ? 6 : -6), y);
    }
    for (const fy of [0.3, 0.65]) {
      ctx.moveTo(x - 4, y + h * fy);
      ctx.lineTo(x + w + 4, y + h * fy + 2);
    }
    ctx.stroke();
    ctx.strokeStyle = T('#d8c8a8');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    const ax = x + w * 0.5;
    ctx.moveTo(ax, y + 4);
    ctx.lineTo(ax - 8, y - 6);
    ctx.lineTo(ax - 12, y - 4);
    ctx.moveTo(ax - 6, y - 4);
    ctx.lineTo(ax - 7, y - 10);
    ctx.moveTo(ax, y + 4);
    ctx.lineTo(ax + 8, y - 6);
    ctx.lineTo(ax + 12, y - 4);
    ctx.stroke();
  },
  fishRack(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a drying rack of poles with fish hung in pairs across the path
    const post = T('#5a4a3a');
    backPost(ctx, x - 8, y, o.ground, 6, post);
    backPost(ctx, x + w + 8, y, o.ground, 6, post);
    ctx.fillStyle = T('#6a5a48');
    ctx.fillRect(x - 14, y, w + 28, 5);
    for (let k = 0; k < Math.floor(w / 12); k++) {
      const fx = x + 6 + k * 12;
      const sw = Math.sin(t * 2 + k + o.seed) * 0.08;
      ctx.save();
      ctx.translate(fx, y + 5);
      ctx.rotate(sw);
      ctx.fillStyle = T(k % 2 ? '#c8b8a0' : '#a8987e');
      ctx.beginPath();
      ctx.ellipse(0, h * 0.45, 3.4, h * 0.42, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-3, h * 0.88);
      ctx.lineTo(0, h * 0.8);
      ctx.lineTo(3, h * 0.88);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 14, y - 2, w + 28, 2.4);
    void P;
  },
  cargoSled(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a herder's big sled, a reindeer skin and a load roped flat on top
    runners(ctx, x, y + h - 2, w, T);
    ctx.fillStyle = T('#5a3a24');
    for (let k = 0; k < 5; k++) ctx.fillRect(x + 6 + k * ((w - 20) / 4), y + h - 18, 4, 16);
    ctx.fillStyle = woodGrad(ctx, y + h - 22, 6, T, '#a07a4a', '#7a5a34', '#4a3420');
    ctx.fillRect(x, y + h - 22, w - 6, 6);
    ctx.fillStyle = vg(ctx, y, y + h - 22, T('#8a6a4a'), T('#4a3424'));
    rr(ctx, x + 2, y, w - 10, h - 22, 4);
    ctx.fill();
    // woven blanket stripes in red, blue and yellow
    for (const [fy, c] of [
      [0.25, '#c83a2a'],
      [0.45, '#2a5ab0'],
      [0.6, '#f2c040'],
    ]) {
      ctx.fillStyle = T(c);
      ctx.fillRect(x + 2, y + (h - 22) * fy, w - 10, 3);
    }
    ctx.strokeStyle = T('#c8b08a');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let k = 1; k < 4; k++) {
      ctx.moveTo(x + (k * w) / 4, y);
      ctx.lineTo(x + (k * w) / 4 - 4, y + h - 22);
    }
    ctx.stroke();
    snowCap(ctx, x + 4, y + 1, w - 14, T, o.seed, 4);
    void P;
  },

  // ---------- Ski Hill
  snowman(ctx, o, T, P, t) {
    snowmanBody(ctx, o.x + o.w / 2, o.y + o.h, o.h * 0.26, T, o.seed, t);
    void P;
  },
  skiRack(ctx, o, T) {
    const { x, y, w, h } = o;
    // a rack of skis and poles stood on end: all edges and tips
    ctx.fillStyle = T('#3a3a42');
    ctx.fillRect(x, y + h * 0.4, w, 3);
    ctx.fillRect(x + 2, y + h * 0.4, 3, h * 0.6);
    ctx.fillRect(x + w - 5, y + h * 0.4, 3, h * 0.6);
    const cols = ['#e8433a', '#2a6ad8', '#f2c040', '#3ab070', '#f0f0f0'];
    const n = Math.floor(w / 7);
    for (let k = 0; k < n; k++) {
      const sx = x + 4 + k * 7;
      ctx.fillStyle = T(cols[(k + o.seed) % cols.length]);
      ctx.beginPath();
      ctx.moveTo(sx, y + h);
      ctx.lineTo(sx, y + 6);
      ctx.quadraticCurveTo(sx + 2, y - 2, sx + 4, y + 4);
      ctx.lineTo(sx + 4, y + h);
      ctx.fill();
    }
    ctx.strokeStyle = T('#8a8a92');
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      ctx.moveTo(x + w - 10 - k * 4, y + h);
      ctx.lineTo(x + w - 6 - k * 4, y + 4);
    }
    ctx.stroke();
  },
  skiGate(ctx, o, T) {
    const { x, y, w, h } = o;
    // the start banner of the race strung across the piste
    const post = T('#2a2a30');
    backPost(ctx, x - 8, y, o.ground, 5, post);
    backPost(ctx, x + w + 8, y, o.ground, 5, post);
    ctx.fillStyle = vg(ctx, y, y + h, T('#2a5ab0'), T('#1a3a7a'));
    ctx.fillRect(x - 6, y, w + 12, h);
    ctx.fillStyle = T('#ffffff');
    ctx.fillRect(x - 6, y, w + 12, 3);
    ctx.fillRect(x - 6, y + h - 3, w + 12, 3);
    ctx.font = `700 ${Math.round(h * 0.5)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START', x + w / 2, y + h / 2 + 1, w - 10);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  },
  snowcat(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a piste groomer parked for the day, red cab, flat roof, tracks caked in snow
    const tr = h * 0.32;
    ctx.fillStyle = T('#1a1a20');
    rr(ctx, x, y + h - tr, w, tr, tr / 2);
    ctx.fill();
    ctx.fillStyle = T('#5a5a62');
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.arc(x + tr / 2 + k * ((w - tr) / 5), y + h - tr / 2, tr * 0.32, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(x + 4, y + h - tr, w - 8, 3);
    ctx.fillStyle = vg(ctx, y, y + h - tr, T('#e8433a'), T('#a8241a'));
    ctx.fillRect(x + w * 0.12, y + 6, w * 0.76, h - tr - 6);
    ctx.fillStyle = T('#2a2a30');
    ctx.fillRect(x + w * 0.08, y, w * 0.84, 7);
    snowCap(ctx, x + w * 0.08, y + 1, w * 0.84, T, o.seed, 4);
    ctx.fillStyle = alpha('#bcdcff', 0.85);
    ctx.fillRect(x + w * 0.18, y + 12, w * 0.3, (h - tr) * 0.4);
    ctx.fillRect(x + w * 0.52, y + 12, w * 0.3, (h - tr) * 0.4);
    ctx.fillStyle = T('#c8c8d0');
    ctx.fillRect(x + w - 4, y + h - tr - 6, 14, tr);
    void P;
  },

  // ---------- Snow Sculpture Park
  snowBlocks(ctx, o, T) {
    const { x, y, w, h } = o;
    // blocks cut ready for carving, stacked in a pyramid
    const bw = w / 3;
    const bh = h / 2;
    const block = (bx, by) => {
      ctx.fillStyle = vg(ctx, by, by + bh, T('#ffffff'), T('#b8c4e0'));
      ctx.fillRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      ctx.fillStyle = 'rgba(120,140,190,0.35)';
      ctx.fillRect(bx + bw - 3, by + 1, 2, bh - 2);
    };
    for (let k = 0; k < 3; k++) block(x + k * bw, y + bh);
    block(x + bw * 0.5, y);
    block(x + bw * 1.5, y);
  },
  iceSpikes(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a sculpture of ice crystals, lit blue from inside
    const r = mulberry32(o.seed);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x + w / 2, y + h * 0.7, 0, x + w / 2, y + h * 0.7, w);
    g.addColorStop(0, alpha(P.lamp || '#9ad8ff', 0.3 * (0.8 + 0.2 * Math.sin(t * 2 + o.seed))));
    g.addColorStop(1, alpha(P.lamp || '#9ad8ff', 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - w / 2, y - h * 0.3, w * 2, h * 1.6);
    ctx.restore();
    for (let k = 0; k < 7; k++) {
      const cx = x + 6 + r() * (w - 12);
      const ch = h * (0.5 + r() * 0.5);
      const cw = 5 + r() * 6;
      const lean = (r() - 0.5) * 8;
      const gr = ctx.createLinearGradient(cx - cw, 0, cx + cw, 0);
      gr.addColorStop(0, 'rgba(230,246,255,0.95)');
      gr.addColorStop(1, 'rgba(120,180,230,0.9)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(cx - cw, y + h);
      ctx.lineTo(cx + lean, y + h - ch);
      ctx.lineTo(cx + cw, y + h);
      ctx.fill();
    }
  },
  snowBridge(ctx, o, T, P) {
    const { x, y, w, h } = o;
    // a sculpted bridge of snow, carved with a frieze, lit underneath
    ctx.fillStyle = vg(ctx, y, o.ground, T('#ffffff'), T('#a8b4d8'));
    ctx.beginPath();
    ctx.moveTo(x - 34, o.ground);
    ctx.lineTo(x - 30, y);
    ctx.lineTo(x + w + 30, y);
    ctx.lineTo(x + w + 34, o.ground);
    ctx.lineTo(x + w + 4, o.ground);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - 4, o.ground);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,140,200,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const fx = x + (k / 7) * w;
      ctx.moveTo(fx, y + h * 0.3);
      ctx.arc(fx, y + h * 0.5, h * 0.18, -Math.PI / 2, Math.PI * 1.5);
    }
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = alpha(P.lamp || '#9ad8ff', 0.3);
    ctx.fillRect(x, y + h - 4, w, 4);
    ctx.restore();
  },
  snowCastle(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a castle of snow blocks with a flat walk along the top and windows of coloured ice
    const tower = w * 0.22;
    ctx.fillStyle = vg(ctx, y, y + h, T('#ffffff'), T('#b0bcdc'));
    ctx.fillRect(x, y + 8, w, h - 8);
    for (let k = 0; k < Math.floor(w / 14); k++) ctx.fillRect(x + k * 14, y, 8, 9);
    ctx.fillRect(x - 4, y - 14, tower, h + 14);
    ctx.fillRect(x + w - tower + 4, y - 14, tower, h + 14);
    ctx.strokeStyle = 'rgba(120,140,200,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let yy = y + 18; yy < y + h; yy += 12) {
      ctx.moveTo(x, yy);
      ctx.lineTo(x + w, yy);
    }
    ctx.stroke();
    ctx.fillStyle = T('#5a6a9a');
    ctx.beginPath();
    ctx.moveTo(x + w * 0.4, y + h);
    ctx.lineTo(x + w * 0.4, y + h * 0.55);
    ctx.arc(x + w * 0.5, y + h * 0.55, w * 0.1, Math.PI, 0);
    ctx.lineTo(x + w * 0.6, y + h);
    ctx.fill();
    const cols = ['#9ad8ff', '#ffb8d8', '#c8a8ff'];
    for (let k = 0; k < 3; k++) {
      const on = 0.7 + 0.3 * Math.sin(t * 2 + k + o.seed);
      ctx.fillStyle = alpha(cols[k], on);
      ctx.fillRect(x + w * (0.08 + k * 0.38) + (k === 1 ? -w * 0.06 : 0), y + h * 0.3, 8, 12);
    }
    void P;
  },

  // ---------- Midwinter Square
  garland(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a fir garland swagged between two lamp posts, lights all along it
    backPost(ctx, x - 10, y - 10, o.ground, 5, T('#1a1a20'));
    backPost(ctx, x + w + 10, y - 10, o.ground, 5, T('#1a1a20'));
    const pts = [];
    ctx.fillStyle = T('#1e4a2a');
    for (let k = 0; k <= 30; k++) {
      const u = k / 30;
      const gx = x - 10 + (w + 20) * u;
      const gy = y + Math.sin(u * Math.PI) * h * 0.8;
      ctx.beginPath();
      ctx.arc(gx, gy, 6 + hash(o.seed + k) * 3, 0, TAU);
      ctx.fill();
      if (k % 3 === 1) pts.push([gx, gy + 3]);
    }
    ctx.fillStyle = T('#c83a2a');
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 8, y + h * 0.8 - 2);
    ctx.lineTo(x + w / 2 + 8, y + h * 0.8 - 2);
    ctx.lineTo(x + w / 2, y + h * 0.8 + 6);
    ctx.fill();
    lights(ctx, pts, t, [P.lamp || '#ffc070', '#ff7a6a', '#fff4d0'], o.seed);
  },
  chestnutCart(ctx, o, T, P, t) {
    const { x, y, w, h } = o;
    // a roast chestnut cart: brazier glowing, a flat canopy on top you can land on
    const wr = 14;
    const roof = 8;
    ctx.fillStyle = T('#2a2a30');
    ctx.fillRect(x + 6, y + roof, 4, h - roof - wr);
    ctx.fillRect(x + w - 10, y + roof, 4, h - roof - wr);
    ctx.fillStyle = vg(ctx, y, y + roof, T('#c83a2a'), T('#8a2018'));
    ctx.fillRect(x - 6, y, w + 12, roof);
    for (let k = 0; k < Math.floor((w + 12) / 12); k++) {
      ctx.fillStyle = T(k % 2 ? '#f0e6d0' : '#c83a2a');
      ctx.beginPath();
      ctx.arc(x - 6 + k * 12 + 6, y + roof, 6, 0, Math.PI);
      ctx.fill();
    }
    snowCap(ctx, x - 6, y + 1, w + 12, T, o.seed, 5);
    const by = y + h - wr - 24;
    ctx.fillStyle = woodGrad(ctx, by, 24, T, '#6a4428', '#4a2e18', '#2a1a0c');
    ctx.fillRect(x, by, w, 24);
    ctx.fillStyle = T('#1a1a20');
    ctx.fillRect(x + w * 0.3, by - 8, w * 0.4, 8);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const fl = 0.8 + 0.2 * Math.sin(t * 13 + o.seed);
    const g = ctx.createRadialGradient(x + w / 2, by - 6, 0, x + w / 2, by - 6, 50);
    g.addColorStop(0, `rgba(255,150,60,${0.45 * fl})`);
    g.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x + w / 2 - 50, by - 56, 100, 100);
    ctx.restore();
    for (let k = 0; k < 3; k++) {
      const p = fract(t * 0.25 + k / 3);
      ctx.fillStyle = `rgba(230,230,240,${0.3 * (1 - p)})`;
      ctx.beginPath();
      ctx.arc(x + w / 2 + p * 10, by - 10 - p * 30, 4 + p * 8, 0, TAU);
      ctx.fill();
    }
    for (const wx of [x + w * 0.22, x + w * 0.78]) {
      ctx.fillStyle = T('#2a2016');
      ctx.beginPath();
      ctx.arc(wx, y + h - wr, wr, 0, TAU);
      ctx.fill();
      ctx.fillStyle = T('#8a7a5a');
      ctx.beginPath();
      ctx.arc(wx, y + h - wr, 3, 0, TAU);
      ctx.fill();
    }
  },
};

// ---------------------------------------------------------------- movers

/** Rolling skins for chapter 7. Called with the context already rotated. False if not ours. */
export function winterRoller(ctx, m, r, T, P) {
  if (m.skin !== 'iceBall') return false;
  // a ball of ice from the sculpture park, glowing from inside as it rolls
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r * 1.1);
  g.addColorStop(0, 'rgba(255,255,255,0.98)');
  g.addColorStop(0.5, alpha(P.lamp || '#9ad8ff', 0.9));
  g.addColorStop(1, 'rgba(60,90,160,0.95)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
  }
  ctx.stroke();
  void T;
  return true;
}

// ---------------------------------------------------------------- decor

export const WINTER_DECOR = {
  snowTuft(ctx, d, T) {
    ctx.strokeStyle = T('#7a6a4a');
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      ctx.moveTo(d.x + k * 3, d.y);
      ctx.lineTo(d.x + k * 3 + (hash(d.seed + k) - 0.5) * 4, d.y - (6 + hash(d.seed * 3 + k) * 6) * d.s);
    }
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(d.x + 6, d.y, 9 * d.s, 2.4, 0, Math.PI, 0);
    ctx.fill();
  },
  berries(ctx, d, T) {
    ctx.strokeStyle = T('#4a3a2a');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + 3, d.y - 10 * d.s);
    ctx.lineTo(d.x + 8, d.y - 14 * d.s);
    ctx.stroke();
    ctx.fillStyle = T('#d81a1a');
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.arc(d.x + 3 + hash(d.seed + k) * 7, d.y - 8 * d.s - hash(d.seed * 3 + k) * 6, 1.6, 0, TAU);
      ctx.fill();
    }
  },
  piste(ctx, d, T) {
    // a piste marker pole, orange tip
    ctx.fillStyle = T('#2a2a30');
    ctx.fillRect(d.x, d.y - 22 * d.s, 2, 22 * d.s);
    ctx.fillStyle = T('#f07a2a');
    ctx.fillRect(d.x, d.y - 22 * d.s, 2, 6 * d.s);
  },
};

// ---------------------------------------------------------------- foreground

/** Chapter 7 silhouettes for the foreground strip. False if the terrain is not ours. */
export function winterForeground(g, kind, x, H, rng) {
  if (!['birchwood', 'icelake', 'tundra', 'skihill', 'sculptures', 'square'].includes(kind)) return false;
  // a snowbank, and now and then a fir sticking out of it
  g.beginPath();
  g.ellipse(x, H, 100 + rng() * 60, 34 + rng() * 26, 0, Math.PI, 0);
  g.fill();
  if (rng() < 0.4) {
    const h = 110 + rng() * 60;
    g.beginPath();
    g.moveTo(x + 40, H - h);
    g.lineTo(x + 80, H - 20);
    g.lineTo(x, H - 20);
    g.fill();
  }
  return true;
}

// ---------------------------------------------------------------- finale

/** The great tree in the square: when you arrive, every light on it comes on at once. */
export function drawMidwinterTree(ctx, x, y, T, P, t, open) {
  const h = 330;
  const tiers = 8;
  for (let k = 0; k < tiers; k++) {
    const u = k / tiers;
    const ty = y - h * 0.06 - u * h * 0.86;
    const w = h * 0.36 * (1 - u) + 10;
    ctx.fillStyle = vg(ctx, ty - h * 0.14, ty, T('#2a5a3a'), T('#0e2a1a'));
    ctx.beginPath();
    ctx.moveTo(x - w, ty);
    ctx.quadraticCurveTo(x - w * 0.4, ty - h * 0.07, x, ty - h * 0.18);
    ctx.quadraticCurveTo(x + w * 0.4, ty - h * 0.07, x + w, ty);
    ctx.lineTo(x + w * 0.6, ty - 3);
    ctx.lineTo(x - w * 0.6, ty - 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x - w * 0.55, ty - 3, w * 0.3, 3, -0.2, 0, TAU);
    ctx.ellipse(x + w * 0.55, ty - 3, w * 0.3, 3, 0.2, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = T('#3a2618');
  ctx.fillRect(x - 10, y - h * 0.08, 20, h * 0.08);
  // baubles, then the lights: dim strings before you arrive, everything blazing after
  const r = mulberry32(7);
  const cols = ['#ffd27a', '#ff7a6a', '#9ad8ff', '#fff4d0', '#a8ff9a'];
  const k = open ? 1 : 0.25;
  for (let i = 0; i < 26; i++) {
    const v = r();
    const half = h * 0.36 * (1 - v) + 6;
    ctx.fillStyle = T(['#c83a2a', '#d8a840', '#3a6ab0'][i % 3]);
    ctx.beginPath();
    ctx.arc(x + (r() - 0.5) * 1.6 * half, y - h * 0.1 - v * h * 0.8, 4, 0, TAU);
    ctx.fill();
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 120; i++) {
    const v = r();
    const half = h * 0.36 * (1 - v) + 6;
    const lx = x + (r() - 0.5) * 1.7 * half;
    const ly = y - h * 0.1 - v * h * 0.82;
    const on = (0.6 + 0.4 * Math.sin(t * 2.6 + i * 1.3)) * k;
    const c = cols[i % cols.length];
    ctx.fillStyle = alpha(c, 0.22 * on);
    ctx.beginPath();
    ctx.arc(lx, ly, 6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = alpha(c, on);
    ctx.fillRect(lx - 1.2, ly - 1.2, 2.4, 2.4);
  }
  const sy = y - h * 0.98;
  const sg = ctx.createRadialGradient(x, sy, 0, x, sy, 90);
  sg.addColorStop(0, alpha('#ffe080', 0.7 * (open ? 1 : 0.3)));
  sg.addColorStop(1, alpha('#ffe080', 0));
  ctx.fillStyle = sg;
  ctx.fillRect(x - 90, sy - 90, 180, 180);
  if (open) {
    const g = ctx.createRadialGradient(x, y - h * 0.4, 0, x, y - h * 0.4, 360);
    g.addColorStop(0, alpha(P.lamp, 0.22));
    g.addColorStop(1, alpha(P.lamp, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - 360, y - h * 0.4 - 360, 720, 720);
  }
  ctx.restore();
  ctx.fillStyle = T('#ffe080');
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr2 = i % 2 ? 7 : 16;
    ctx.lineTo(x + Math.cos(a) * rr2, sy + Math.sin(a) * rr2);
  }
  ctx.fill();
  // presents piled round the foot, and a bench to watch from
  for (let i = 0; i < 6; i++) {
    const px = x - 90 + i * 30 + (i % 2) * 6;
    const pw = 18 + (i % 3) * 6;
    ctx.fillStyle = T(['#c83a2a', '#2a5ab0', '#f2c040', '#3a8a4a'][i % 4]);
    ctx.fillRect(px, y - pw * 0.8, pw, pw * 0.8);
    ctx.fillStyle = T('#f4f0e6');
    ctx.fillRect(px + pw / 2 - 1.5, y - pw * 0.8, 3, pw * 0.8);
  }
  ctx.fillStyle = woodGrad(ctx, y - 22, 5, T, '#7a5a3a', '#5a4028', '#3a2818');
  ctx.fillRect(x + 150, y - 22, 80, 5);
  ctx.fillStyle = T('#1a1a20');
  ctx.fillRect(x + 156, y - 17, 3, 17);
  ctx.fillRect(x + 220, y - 17, 3, 17);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 150, y - 24, 80, 2.4);
}
