// Procedural stick-figure animation.
// Poses are built in a local frame (origin at the feet, y up, facing +x) from a phase-locked
// run cycle and 2-bone IK, cross-faded between states, then transformed to world space.
// The stance foot moves at exactly the ground speed, so feet never skate.

import { clamp, lerp, fract, easeOut, easeInOut, mix, alpha, TAU } from './util.js';
import { lookOf } from './cast.js';

const LEN = { thigh: 21, shin: 21, torso: 25, neck: 4.5, headR: 8.6, upper: 14, fore: 13, toe: 6 };

// Joint slots (x, y pairs) in a flat Float64Array, plus rotation + pivot height.
const J = { hip: 0, neck: 2, head: 4, kneeN: 6, footN: 8, toeN: 10, kneeF: 12, footF: 14, toeF: 16, elbowN: 18, handN: 20, elbowF: 22, handF: 24, rot: 26, pivY: 27 };
const N = 28;
const NJ = 13;

const setJ = (o, j, x, y) => {
  o[j] = x;
  o[j + 1] = y;
};

/** Two-bone IK. Writes the middle joint at slot jm and the (reachable) end at slot je. */
function ik(o, ax, ay, tx, ty, l1, l2, sign, jm, je) {
  let dx = tx - ax;
  let dy = ty - ay;
  let d = Math.hypot(dx, dy);
  const max = l1 + l2 - 0.01;
  if (d > max) {
    dx *= max / d;
    dy *= max / d;
    d = max;
  }
  if (d < 0.01) d = 0.01;
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const ang = Math.atan2(dy, dx) + sign * a;
  setJ(o, jm, ax + Math.cos(ang) * l1, ay + Math.sin(ang) * l1);
  setJ(o, je, ax + dx, ay + dy);
}

function leg(o, fx, fy, jk, jf, jt, flat) {
  const hx = o[J.hip];
  const hy = o[J.hip + 1];
  ik(o, hx, hy, fx, fy, LEN.thigh, LEN.shin, 1, jk, jf);
  const ax = o[jf];
  const ay = o[jf + 1];
  let tx;
  let ty;
  if (flat) {
    tx = 1;
    ty = 0;
  } else {
    const sx = ax - o[jk];
    const sy = ay - o[jk + 1];
    const l = Math.hypot(sx, sy) || 1;
    tx = -sy / l;
    ty = sx / l;
  }
  setJ(o, jt, ax + tx * LEN.toe, ay + ty * LEN.toe);
}

function torsoHead(o, lean, headLean) {
  const hx = o[J.hip];
  const hy = o[J.hip + 1];
  const nx = hx + Math.sin(lean) * LEN.torso;
  const ny = hy + Math.cos(lean) * LEN.torso;
  setJ(o, J.neck, nx, ny);
  setJ(o, J.head, nx + Math.sin(headLean) * (LEN.neck + LEN.headR), ny + Math.cos(headLean) * (LEN.neck + LEN.headR));
}

function shoulder(o) {
  const t = 3 / LEN.torso;
  return [o[J.neck] - (o[J.neck] - o[J.hip]) * t, o[J.neck + 1] - (o[J.neck + 1] - o[J.hip + 1]) * t];
}

/** Arm from swing angle a (0 = hanging, + = forward) and elbow bend. */
function arm(o, a, bend, je, jh) {
  const [sx, sy] = shoulder(o);
  const ex = sx + Math.sin(a) * LEN.upper;
  const ey = sy - Math.cos(a) * LEN.upper;
  setJ(o, je, ex, ey);
  setJ(o, jh, ex + Math.sin(a + bend) * LEN.fore, ey - Math.cos(a + bend) * LEN.fore);
}

function armTo(o, tx, ty, je, jh) {
  const [sx, sy] = shoulder(o);
  ik(o, sx, sy, tx, ty, LEN.upper, LEN.fore, -1, je, jh);
}

// ---------------------------------------------------------------- poses

function gait(speed) {
  const sp = clamp(speed / 460, 0, 1.25);
  const s1 = Math.min(sp, 1);
  return { sp, s1, duty: lerp(0.52, 0.25, s1), S: lerp(5, 17.5, Math.min(sp, 1.15)) };
}

function poseRun(o, p, speed, land, stumble, t) {
  const { s1, duty, S } = gait(speed);
  const lift = lerp(5, 18, s1);
  const kick = lerp(2, 11, s1);
  const hipY = 37.8 - 1.4 * s1 - lerp(0.8, 2.4, s1) * Math.cos(TAU * 2 * (p - duty / 2)) - land * 7;
  let lean = 0.07 + 0.17 * s1 + land * 0.15 - stumble * 0.55;
  setJ(o, J.hip, 0, hipY);
  for (let side = 0; side < 2; side++) {
    const q = fract(p + side * 0.5);
    let fx;
    let fy;
    let flat;
    if (q < duty) {
      const u = q / duty;
      fx = S - 2 * S * u;
      fy = 0;
      flat = true;
    } else {
      const u = (q - duty) / (1 - duty);
      const e = u * u * (3 - 2 * u);
      const k = Math.sin(Math.PI * Math.min(1, u * 1.7)) * (1 - u);
      fx = -S + 2 * S * e - kick * 0.7 * k;
      fy = lift * Math.pow(Math.sin(Math.PI * u), 1.15) + kick * k;
      flat = false;
    }
    if (side === 0) leg(o, fx, fy, J.kneeN, J.footN, J.toeN, flat);
    else leg(o, fx, fy, J.kneeF, J.footF, J.toeF, flat);
  }
  torsoHead(o, lean, lean * 0.5 - stumble * 0.3);
  const amp = lerp(0.35, 1.0, s1);
  const bend = lerp(0.45, 1.6, s1);
  const sw = -amp * Math.cos(TAU * (p + 0.04));
  if (stumble > 0) {
    arm(o, lerp(lean * 0.5 + sw, 2.3 + Math.sin(t * 31) * 0.7, stumble), lerp(bend, 0.4, stumble), J.elbowN, J.handN);
    arm(o, lerp(lean * 0.5 - sw, 1.8 + Math.sin(t * 27 + 2) * 0.8, stumble), lerp(bend, 0.5, stumble), J.elbowF, J.handF);
  } else {
    arm(o, lean * 0.5 + sw, bend + Math.max(0, sw) * 0.3, J.elbowN, J.handN);
    arm(o, lean * 0.5 - sw, bend + Math.max(0, -sw) * 0.3, J.elbowF, J.handF);
  }
}

function poseAir(o, vy) {
  const u = clamp((vy + 650) / 1300, 0, 1);
  setJ(o, J.hip, 0, 40);
  const lean = lerp(0.2, 0.04, u);
  leg(o, lerp(11, 13, u), lerp(22, 5, u), J.kneeN, J.footN, J.toeN, false);
  leg(o, lerp(-18, -1, u), lerp(9, 2, u), J.kneeF, J.footF, J.toeF, false);
  torsoHead(o, lean, lean * 0.4);
  arm(o, lerp(2.3, 1.3, u), 0.5, J.elbowN, J.handN);
  arm(o, lerp(-0.9, 1.9, u), 0.35, J.elbowF, J.handF);
}

function poseFlip(o, f) {
  setJ(o, J.hip, 0, 40);
  leg(o, 9, 27, J.kneeN, J.footN, J.toeN, false);
  leg(o, 5, 25, J.kneeF, J.footF, J.toeF, false);
  torsoHead(o, 0.55, 0.75);
  arm(o, 1.25, 1.25, J.elbowN, J.handN);
  arm(o, 1.05, 1.35, J.elbowF, J.handF);
  o[J.rot] = -TAU * easeInOut(clamp(f, 0, 1));
  o[J.pivY] = 42;
}

function poseSlide(o, t) {
  setJ(o, J.hip, 0, 11 + Math.sin(t * 38) * 0.4);
  leg(o, 35, 3, J.kneeN, J.footN, J.toeN, false);
  leg(o, 13, 2, J.kneeF, J.footF, J.toeF, true);
  torsoHead(o, -1.05, -0.45);
  armTo(o, -36, 2, J.elbowN, J.handN);
  arm(o, 1.7, 0.6, J.elbowF, J.handF);
}

function poseGlide(o, t) {
  setJ(o, J.hip, 0, 40);
  leg(o, 3 + 2.5 * Math.sin(t * 3.1), 3, J.kneeN, J.footN, J.toeN, false);
  leg(o, -3 + 2.5 * Math.sin(t * 3.1 + 1.4), 5, J.kneeF, J.footF, J.toeF, false);
  torsoHead(o, 0.02, 0.05);
  armTo(o, 5, 76, J.elbowN, J.handN);
  arm(o, 0.9 + Math.sin(t * 2) * 0.15, 0.5, J.elbowF, J.handF);
}

function poseStand(o, t, cheer, land) {
  const br = Math.sin(t * 2.1);
  const hop = cheer ? Math.max(0, Math.sin(t * 5.5)) * 9 : 0;
  setJ(o, J.hip, 0, 39.4 + br * 0.25 + hop - land * 6);
  leg(o, 5, hop * 0.6, J.kneeN, J.footN, J.toeN, true);
  leg(o, -4, hop * 0.6, J.kneeF, J.footF, J.toeF, true);
  torsoHead(o, 0.02 + land * 0.1, 0.04);
  if (cheer) {
    arm(o, 2.75 + Math.sin(t * 9) * 0.2, 0.3, J.elbowN, J.handN);
    arm(o, 2.55 + Math.sin(t * 9 + 1) * 0.2, 0.3, J.elbowF, J.handF);
  } else {
    arm(o, 0.12 + br * 0.03, 0.28, J.elbowN, J.handN);
    arm(o, -0.08, 0.22, J.elbowF, J.handF);
  }
}

function poseDown(o) {
  setJ(o, J.hip, 0, 7);
  leg(o, 34, 4, J.kneeN, J.footN, J.toeN, false);
  leg(o, 28, 10, J.kneeF, J.footF, J.toeF, false);
  torsoHead(o, -1.45, -1.5);
  arm(o, -0.7, 0.3, J.elbowN, J.handN);
  arm(o, 2.4, 0.2, J.elbowF, J.handF);
}

// ---------------------------------------------------------------- chains (ponytail, scarf)

function makeChain(n, x, y) {
  return Array.from({ length: n }, () => ({ x, y, px: x, py: y }));
}

/**
 * Verlet chain simulated in a frame that travels with the runner (shiftX = how far the runner
 * moved forward this step), so forward speed shows up as a head-wind force instead of
 * infinite air drag. That lets gravity and the hip bounce shape the hair naturally.
 */
function stepChain(ch, ax, ay, seg, dt, grav, wind, drag, t, flutter, shiftX, rest) {
  const p0 = ch[0];
  p0.x = p0.px = ax;
  p0.y = p0.py = ay;
  const dt2 = dt * dt;
  for (let i = 1; i < ch.length; i++) {
    const p = ch[i];
    p.x += shiftX;
    p.px += shiftX;
    const vx = (p.x - p.px) * drag;
    const vy = (p.y - p.py) * drag;
    p.px = p.x;
    p.py = p.y;
    const f = Math.sin(t * 17 + i * 1.7) * flutter * (i / ch.length);
    p.x += vx - wind * dt2;
    p.y += vy + (grav + f) * dt2;
  }
  // shape memory: near the root the strand leaves the head in its natural direction
  if (rest) {
    let k = rest.k;
    for (let i = 1; i < ch.length; i++) {
      const a = ch[i - 1];
      const b = ch[i];
      b.x += (a.x + rest.x * seg - b.x) * k;
      b.y += (a.y + rest.y * seg - b.y) * k;
      k *= rest.decay;
    }
  }
  for (let it = 0; it < 4; it++) {
    for (let i = 1; i < ch.length; i++) {
      const a = ch[i - 1];
      const b = ch[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.001;
      const k = (d - seg) / d;
      if (i === 1) {
        b.x -= dx * k;
        b.y -= dy * k;
      } else {
        a.x += dx * k * 0.5;
        a.y += dy * k * 0.5;
        b.x -= dx * k * 0.5;
        b.y -= dy * k * 0.5;
      }
    }
  }
}

// ---------------------------------------------------------------- public

export function createAnim(kind) {
  return {
    kind,
    phase: Math.random(),
    pose: new Float64Array(N),
    from: new Float64Array(N),
    target: new Float64Array(N),
    W: new Float64Array(NJ * 2),
    blend: 1,
    blendDur: 0.12,
    cat: null,
    t: Math.random() * 10,
    land: 0,
    cheer: false,
    hair: null,
    scarf: null,
    umbrella: 0,
    prevQ: [0.5, 0],
  };
}

export function animLand(a, v) {
  a.land = Math.max(a.land, clamp((v - 200) / 1100, 0, 1));
}

function category(r, speed) {
  if (r.down) return 'down';
  if (r.gliding) return 'glide';
  if (r.sliding) return 'slide';
  if (!r.onGround) return r.flipT >= 0 ? 'flip' : 'air';
  return speed < 35 ? 'stand' : 'run';
}

/**
 * Advance the animation. X, Y: world position of the feet. onStep(side) fires on each foot plant.
 */
export function updateAnim(a, r, X, Y, speed, dt, onStep) {
  a.t += dt;
  a.X = X;
  a.Y = Y;
  const cat = category(r, speed);
  const { duty, S } = gait(speed);
  if (cat === 'run') a.phase = fract(a.phase + (dt * speed * duty) / (2 * S));
  for (let side = 0; side < 2; side++) {
    const q = fract(a.phase + side * 0.5);
    if (cat === 'run' && a.prevQ[side] > 0.75 && q < 0.25 && onStep) onStep(side);
    a.prevQ[side] = q;
  }
  a.land = Math.max(0, a.land - dt * 4);

  const o = a.target;
  o[J.rot] = 0;
  o[J.pivY] = 40;
  const stumble = clamp(r.stumble / 0.45, 0, 1);
  switch (cat) {
    case 'run':
      poseRun(o, a.phase, speed, a.land, stumble, a.t);
      break;
    case 'air':
      poseAir(o, r.vy);
      break;
    case 'flip':
      poseFlip(o, r.flipT / 0.42);
      break;
    case 'slide':
      poseSlide(o, a.t);
      break;
    case 'glide':
      poseGlide(o, a.t);
      break;
    case 'stand':
      poseStand(o, a.t, a.cheer, a.land);
      break;
    default:
      poseDown(o);
  }
  if (cat !== a.cat) {
    if (a.cat) {
      a.from.set(a.pose);
      const rr = a.from[J.rot] % TAU;
      a.from[J.rot] = rr < -Math.PI ? rr + TAU : rr > Math.PI ? rr - TAU : rr;
      a.blend = 0;
      a.blendDur = cat === 'flip' ? 0.06 : a.cat === 'air' && cat === 'run' ? 0.08 : cat === 'down' ? 0.3 : 0.13;
    } else {
      a.pose.set(o);
      a.blend = 1;
    }
    a.cat = cat;
  }
  if (a.blend < 1) {
    a.blend = Math.min(1, a.blend + dt / a.blendDur);
    const w = easeOut(a.blend);
    for (let i = 0; i < N; i++) a.pose[i] = lerp(a.from[i], o[i], w);
  } else {
    a.pose.set(o);
  }
  a.umbrella = clamp(a.umbrella + (cat === 'glide' ? dt * 5 : -dt * 3), 0, 1);

  // local -> world
  const P = a.pose;
  const c = Math.cos(P[J.rot]);
  const s = Math.sin(P[J.rot]);
  const pv = P[J.pivY];
  for (let j = 0; j < NJ; j++) {
    const lx = P[j * 2];
    const ly = P[j * 2 + 1] - pv;
    a.W[j * 2] = X + (lx * c - ly * s);
    a.W[j * 2 + 1] = Y - (lx * s + ly * c + pv);
  }

  // secondary motion
  const W = a.W;
  const hx = W[J.head];
  const hy = W[J.head + 1];
  let dx = hx - W[J.neck];
  let dy = hy - W[J.neck + 1];
  const dl = Math.hypot(dx, dy) || 1;
  dx /= dl;
  dy /= dl;
  const bx = dy;
  const by = -dx; // "behind the head"
  const sub = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / sub;
  // Carry the strands along with the runner's forward travel before simulating, so that
  // travel never turns into spurious velocity (stable at any frame rate).
  const moved = a.lastX === undefined ? 0 : X - a.lastX;
  a.lastX = X;
  if (Math.abs(moved) < 80) {
    for (const ch of [a.hair, a.scarf, ...(a.chains ? a.chains.map((c) => c.pts) : [])]) {
      if (!ch) continue;
      for (const p of ch) {
        p.x += moved;
        p.px += moved;
      }
    }
  }
  const shift = 0;
  if (a.kind === 'girl') {
    const ax = hx + dx * LEN.headR * 0.5 + bx * LEN.headR * 0.92;
    const ay = hy + dy * LEN.headR * 0.5 + by * LEN.headR * 0.92;
    if (!a.hair || Math.hypot(a.hair[1].x - ax, a.hair[1].y - ay) > 40) a.hair = makeChain(6, ax - 3, ay + 2);
    const wind = 200 + speed * 2.8;
    const rx = bx * 0.85 - dx * 0.5;
    const ry = by * 0.85 - dy * 0.5;
    const rl = Math.hypot(rx, ry) || 1;
    const rest = { x: rx / rl, y: ry / rl, k: lerp(0.015, 0.35, clamp(speed / 450, 0, 1)), decay: 0.55 };
    for (let i = 0; i < sub; i++) stepChain(a.hair, ax, ay, 4.4, h, 1000, wind, 0.94, a.t, 1600, shift, rest);
  } else if (lookOf(a.kind).face) {
    castChains(a, lookOf(a.kind), speed, sub, h);
  } else {
    const [shx, shy] = [W[J.neck] + (W[J.hip] - W[J.neck]) * 0.12, W[J.neck + 1] + (W[J.hip + 1] - W[J.neck + 1]) * 0.12];
    const ax = shx + bx * 2;
    const ay = shy + by * 2;
    if (!a.scarf || Math.hypot(a.scarf[1].x - ax, a.scarf[1].y - ay) > 40) a.scarf = makeChain(8, ax, ay);
    const wind = 150 + speed * 3.2;
    const rx = bx * 0.9 - dx * 0.45;
    const ry = by * 0.9 - dy * 0.45;
    const rl = Math.hypot(rx, ry) || 1;
    const rest = { x: rx / rl, y: ry / rl, k: lerp(0.015, 0.25, clamp(speed / 450, 0, 1)), decay: 0.5 };
    for (let i = 0; i < sub; i++) stepChain(a.scarf, ax, ay, 4.4, h, 800, wind, 0.93, a.t * 1.3, 4200, shift, rest);
  }
}

function strokeChain(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.stroke();
}

function taper(ctx, ch, w0, w1, color) {
  ctx.strokeStyle = color;
  for (let i = 1; i < ch.length; i++) {
    ctx.lineWidth = lerp(w0, w1, i / (ch.length - 1));
    ctx.beginPath();
    ctx.moveTo(ch[i - 1].x, ch[i - 1].y);
    ctx.lineTo(ch[i].x, ch[i].y);
    ctx.stroke();
  }
}

/**
 * Draw a figure in world space (camera transform already applied by the caller).
 * opts: { ink, far, outline, alpha }
 */
export function drawFigure(ctx, a, opts) {
  const ch = lookOf(a.kind);
  if (ch.face) {
    drawCast(ctx, a, ch, opts);
    return;
  }
  const W = a.W;
  const g = (j) => [W[j], W[j + 1]];
  const [hx, hy] = g(J.head);
  const [nx, ny] = g(J.neck);
  const [px, py] = g(J.hip);
  const sx = nx + (px - nx) * (3 / LEN.torso);
  const sy = ny + (py - ny) * (3 / LEN.torso);
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const pass = (extra, override) => {
    const ink = override || opts.ink;
    const far = override || opts.far;
    const acc = override || ch.accent;
    // far limbs
    ctx.strokeStyle = far;
    ctx.lineWidth = 4.3 + extra;
    strokeChain(ctx, [sx, sy, W[J.elbowF], W[J.elbowF + 1], W[J.handF], W[J.handF + 1]]);
    ctx.lineWidth = 4.8 + extra;
    strokeChain(ctx, [px, py, W[J.kneeF], W[J.kneeF + 1], W[J.footF], W[J.footF + 1], W[J.toeF], W[J.toeF + 1]]);
    // hair / scarf trail behind the body
    if (a.hair) taper(ctx, a.hair, 4.6 + extra, 2.2 + extra, ink);
    if (a.scarf) taper(ctx, a.scarf, 4.2 + extra, 2.4 + extra, acc);
    // torso + neck
    ctx.strokeStyle = ink;
    ctx.lineWidth = 6 + extra;
    strokeChain(ctx, [px, py, nx, ny]);
    ctx.lineWidth = 4.2 + extra;
    strokeChain(ctx, [nx, ny, nx + (hx - nx) * 0.45, ny + (hy - ny) * 0.45]);
    // near leg
    ctx.lineWidth = 5.2 + extra;
    strokeChain(ctx, [px, py, W[J.kneeN], W[J.kneeN + 1], W[J.footN], W[J.footN + 1], W[J.toeN], W[J.toeN + 1]]);
    // skirt
    if (a.kind === 'girl') {
      const tx = (nx - px) / LEN.torso;
      const ty = (ny - py) / LEN.torso;
      const fx = -ty; // body-forward (perpendicular to torso)
      const fy = tx;
      const k1x = px + (W[J.kneeN] - px) * 0.55;
      const k1y = py + (W[J.kneeN + 1] - py) * 0.55;
      const k2x = px + (W[J.kneeF] - px) * 0.55;
      const k2y = py + (W[J.kneeF + 1] - py) * 0.55;
      const d1 = (k1x - px) * fx + (k1y - py) * fy;
      const d2 = (k2x - px) * fx + (k2y - py) * fy;
      const [frx, fry, bkx, bky] = d1 > d2 ? [k1x, k1y, k2x, k2y] : [k2x, k2y, k1x, k1y];
      const flare = 3.5 + extra * 0.5;
      ctx.fillStyle = acc;
      ctx.beginPath();
      ctx.moveTo(px + tx * 7 - fx * 3.4, py + ty * 7 - fy * 3.4);
      ctx.lineTo(px + tx * 7 + fx * 3.4, py + ty * 7 + fy * 3.4);
      ctx.lineTo(frx + fx * flare, fry + fy * flare);
      ctx.quadraticCurveTo((frx + bkx) / 2 - tx * 2, (fry + bky) / 2 - ty * 2, bkx - fx * flare, bky - fy * flare);
      ctx.closePath();
      ctx.fill();
      if (extra) {
        ctx.strokeStyle = override;
        ctx.lineWidth = extra;
        ctx.stroke();
      }
    }
    // head
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(hx, hy, LEN.headR + extra / 2, 0, TAU);
    ctx.fill();
    // near arm
    ctx.strokeStyle = ink;
    ctx.lineWidth = 4.7 + extra;
    strokeChain(ctx, [sx, sy, W[J.elbowN], W[J.elbowN + 1], W[J.handN], W[J.handN + 1]]);
    // character details
    let ux = hx - nx;
    let uy = hy - ny;
    const ul = Math.hypot(ux, uy) || 1;
    ux /= ul;
    uy /= ul;
    const bx = uy;
    const by = -ux;
    if (a.kind === 'girl' && a.hair) {
      ctx.fillStyle = override || ch.accent2;
      ctx.beginPath();
      ctx.arc(a.hair[1].x, a.hair[1].y, 2.1 + extra / 2, 0, TAU);
      ctx.fill();
    }
    if (a.kind === 'boy') {
      const R = LEN.headR + 0.8 + extra / 2;
      const ang = Math.atan2(by, bx);
      ctx.fillStyle = acc;
      ctx.beginPath();
      ctx.arc(hx + ux * 0.6, hy + uy * 0.6, R, ang - 0.12, ang + Math.PI + 0.12, false);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = acc;
      ctx.lineWidth = 2.6 + extra;
      ctx.beginPath();
      const ex = hx - bx * R * 0.95 + ux * 0.4;
      const ey = hy - by * R * 0.95 + uy * 0.4;
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - bx * 6.5 - ux * 0.8, ey - by * 6.5 - uy * 0.8);
      ctx.stroke();
      // scarf knot at the neck
      ctx.fillStyle = acc;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.6 + extra / 2, 0, TAU);
      ctx.fill();
    }
  };

  if (opts.outline) pass(3.2, opts.outline);
  pass(0, null);

  drawUmbrella(ctx, a, opts, ch);
  ctx.restore();
}

/** The umbrella that floats a runner back up out of a pit. */
function drawUmbrella(ctx, a, opts, ch) {
  const W = a.W;
  if (a.umbrella <= 0.02) return;
  {
    const k = easeOut(a.umbrella);
    const gx = W[J.handN];
    const gy = W[J.handN + 1];
    const topY = gy - 30 * k;
    ctx.strokeStyle = opts.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy + 3);
    ctx.lineTo(gx, topY - 22 * k);
    ctx.stroke();
    const R = 31 * k;
    ctx.fillStyle = ch.accent2;
    ctx.beginPath();
    ctx.moveTo(gx - R, topY);
    ctx.quadraticCurveTo(gx - R, topY - R * 0.95, gx, topY - R * 0.95);
    ctx.quadraticCurveTo(gx + R, topY - R * 0.95, gx + R, topY);
    for (let i = 3; i >= 0; i--) {
      const x0 = gx - R + (2 * R * i) / 4;
      ctx.quadraticCurveTo(x0 + R / 4, topY - 6 * k, x0, topY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = mix(ch.accent2, '#000000', 0.35);
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(gx, topY - R * 0.95);
      ctx.lineTo(gx - R + (2 * R * i) / 4, topY);
      ctx.stroke();
    }
  }
}

/** Lowest point of the figure (for the contact shadow), in world y. */
export function figureFeetX(a) {
  return (a.W[J.footN] + a.W[J.footF]) / 2;
}

// ---------------------------------------------------------------- the portrait cast

/** Big round heads, like the drawings they come from. Children are drawn a little smaller. */
const CAST_R = 10.6;
const KID_SCALE = 0.88;

/** Head frame for a cast member: centre, radius and the forward / up axes of the face. */
function headFrame(W) {
  const hx = W[J.head];
  const hy = W[J.head + 1];
  let ux = hx - W[J.neck];
  let uy = hy - W[J.neck + 1];
  const l = Math.hypot(ux, uy) || 1;
  ux /= l;
  uy /= l;
  const fx = -uy;
  const fy = ux;
  const R = CAST_R;
  const cx = hx + ux * (R - LEN.headR);
  const cy = hy + uy * (R - LEN.headR);
  /** A point on the head: p forward, q up, in head radii. */
  const Q = (p, q) => [cx + R * (p * fx + q * ux), cy + R * (p * fy + q * uy)];
  /** Polar version: angle from forward towards up, distance in head radii. */
  const Pp = (th, r) => Q(r * Math.cos(th), r * Math.sin(th));
  return { cx, cy, R, ux, uy, fx, fy, Q, Pp };
}

const CHAIN_SPECS = {
  ponytail: (v) => [{ at: [-0.92, 0.42], n: 6, seg: 4.6, grav: 1000, wind: 200 + v * 2.8, drag: 0.94, flutter: 1600, rest: [-0.85, -0.5], k: lerp(0.015, 0.35, clamp(v / 450, 0, 1)), decay: 0.55 }],
  braids: (v) =>
    [
      [-0.62, -0.42],
      [-0.84, -0.16],
    ].map((at) => ({ at, n: 5, seg: 3.8, grav: 1500, wind: 60 + v * 1.3, drag: 0.92, flutter: 500, rest: [-0.3, -0.95], k: lerp(0.06, 0.22, clamp(v / 450, 0, 1)), decay: 0.6 })),
  wavy: (v) => [{ at: [-0.8, -0.12], n: 4, seg: 4.4, grav: 1300, wind: 90 + v * 1.7, drag: 0.93, flutter: 900, rest: [-0.45, -0.9], k: lerp(0.05, 0.25, clamp(v / 450, 0, 1)), decay: 0.6 }],
};

/** Hair that moves (ponytail, braids, long waves) as verlet chains, like Mila's ponytail. */
function castChains(a, look, speed, sub, h) {
  const make = CHAIN_SPECS[look.hair.style];
  if (!make) return;
  const F = headFrame(a.W);
  const specs = make(speed);
  if (!a.chains || a.chains.length !== specs.length) a.chains = specs.map(() => ({ pts: null }));
  specs.forEach((sp, i) => {
    const c = a.chains[i];
    const [ax, ay] = F.Q(sp.at[0], sp.at[1]);
    if (!c.pts || Math.hypot(c.pts[1].x - ax, c.pts[1].y - ay) > 40) c.pts = makeChain(sp.n, ax - 2, ay + 2);
    let rx = sp.rest[0] * F.fx + sp.rest[1] * F.ux;
    let ry = sp.rest[0] * F.fy + sp.rest[1] * F.uy;
    const rl = Math.hypot(rx, ry) || 1;
    rx /= rl;
    ry /= rl;
    const rest = { x: rx, y: ry, k: sp.k, decay: sp.decay };
    for (let k = 0; k < sub; k++) stepChain(c.pts, ax, ay, sp.seg, h, sp.grav, sp.wind, sp.drag, a.t + i * 0.7, sp.flutter, 0, rest);
  });
}

/** Hair silhouettes: [front angle, back angle, outer radius(th), hairline back-to-front]. */
const HAIR_CAPS = {
  messy: [1.05, 3.75, (th, i) => (th < 3.3 ? (i % 2 ? 1.24 : 1.04) : 1.05), [[3.6, 0.78], [3.2, 0.5], [2.5, 0.4], [1.8, 0.6], [1.15, 0.84]], 0.19],
  swept: [0.95, 3.7, (th) => 1.06 + 0.24 * Math.exp(-(((th - 1.35) / 0.28) ** 2)), [[3.55, 0.82], [3.1, 0.55], [2.4, 0.45], [1.7, 0.7], [1.05, 0.88]], 0.1],
  braids: [1.15, 4.15, () => 1.05, [[4.0, 0.82], [3.5, 0.5], [2.8, 0.4], [2.0, 0.6], [1.25, 0.88]], 0.1],
  curly: [0.95, 3.95, () => 1.02, [[3.75, 0.8], [3.3, 0.55], [2.5, 0.45], [1.7, 0.66], [1.05, 0.86]], 0.1],
  wavy: [1.1, 4.35, (th) => 1.08 + 0.05 * Math.sin(th * 7), [[4.15, 0.86], [3.6, 0.55], [2.9, 0.45], [2.0, 0.64], [1.2, 0.9]], 0.1],
  short: [0.7, 4.05, () => 1.09, [[3.9, 0.86], [3.4, 0.55], [2.6, 0.42], [1.8, 0.52], [1.15, 0.62], [0.8, 0.85]], 0.1],
  bob: [0.82, 4.5, (th) => (th < 3.9 ? 1.1 : lerp(1.1, 1.0, (th - 3.9) / 0.6)), [[4.4, 0.98], [4.05, 0.62], [3.4, 0.42], [2.5, 0.42], [1.5, 0.55], [0.95, 0.88]], 0.1],
  ponytail: [1.15, 3.95, () => 1.04, [[3.75, 0.72], [3.25, 0.45], [2.45, 0.42], [1.75, 0.68], [1.2, 0.88]], 0.1],
};

function hairCap(ctx, F, style, grow) {
  const [th0, th1, rOut, line, step] = HAIR_CAPS[style];
  ctx.beginPath();
  let i = 0;
  for (let th = th0; th <= th1 + 1e-6; th += step, i++) {
    const [x, y] = F.Pp(th, rOut(th, i) + grow);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (const [th, r] of line) {
    const [x, y] = F.Pp(th, r);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function dot(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function drawCast(ctx, a, look, opts) {
  ctx.save();
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (look.kid && a.X !== undefined) {
    ctx.translate(a.X, a.Y);
    ctx.scale(KID_SCALE, KID_SCALE);
    ctx.translate(-a.X, -a.Y);
  }
  if (opts.outline) castPass(ctx, a, look, opts, 3.2, opts.outline);
  castPass(ctx, a, look, opts, 0, null);
  drawUmbrella(ctx, a, opts, look);
  ctx.restore();
}

function castPass(ctx, a, look, opts, extra, ov) {
  const W = a.W;
  const shade = opts.shade || 0;
  const C = (c) => ov || (shade ? mix(c, '#06070c', shade) : c);
  const Cfar = (c) => ov || mix(C(c), '#000000', 0.22);
  const ink = ov || opts.ink;
  const far = ov || opts.far;
  const g = (j) => [W[j], W[j + 1]];
  const [nx, ny] = g(J.neck);
  const [px, py] = g(J.hip);
  const sx = nx + (px - nx) * (3 / LEN.torso);
  const sy = ny + (py - ny) * (3 / LEN.torso);
  const tl = Math.hypot(nx - px, ny - py) || 1;
  const tx = (nx - px) / tl;
  const ty = (ny - py) / tl;
  const bfx = -ty; // body forward
  const bfy = tx;
  const F = headFrame(W);
  const top = look.top || { color: '#888888' };
  const bottom = look.bottom || { type: 'trousers', color: '#333333' };
  const sleeve = top.sleeves === 'long' ? (look.layer ? look.layer.color : top.color) : null;
  const isTrousers = bottom.type === 'trousers';

  const arm = (je, jh, near) => {
    const col = near ? ink : far;
    ctx.strokeStyle = col;
    ctx.lineWidth = (near ? 4.6 : 4.2) + extra;
    strokeChain(ctx, [sx, sy, W[je], W[je + 1], W[jh], W[jh + 1]]);
    const paint = near ? C : Cfar;
    if (sleeve) {
      ctx.strokeStyle = paint(sleeve);
      ctx.lineWidth = 5.6 + extra;
      const hx = W[je] + (W[jh] - W[je]) * 0.8;
      const hy = W[je + 1] + (W[jh + 1] - W[je + 1]) * 0.8;
      strokeChain(ctx, [sx, sy, W[je], W[je + 1], hx, hy]);
    } else if (top.sleeves === 'short') {
      ctx.strokeStyle = paint(top.color);
      ctx.lineWidth = 6.4 + extra;
      strokeChain(ctx, [sx, sy, sx + (W[je] - sx) * 0.5, sy + (W[je + 1] - sy) * 0.5]);
    }
    if (near && look.bangles && !ov) {
      ctx.strokeStyle = C(look.bangles);
      ctx.lineWidth = 1.3;
      const wx = W[je] + (W[jh] - W[je]) * 0.72;
      const wy = W[je + 1] + (W[jh + 1] - W[je + 1]) * 0.72;
      const ax = W[jh] - W[je];
      const ay = W[jh + 1] - W[je + 1];
      const al = Math.hypot(ax, ay) || 1;
      for (const o of [0, 1.8]) {
        const cx = wx + (ax / al) * o;
        const cy = wy + (ay / al) * o;
        ctx.beginPath();
        ctx.moveTo(cx - (ay / al) * 3, cy + (ax / al) * 3);
        ctx.lineTo(cx + (ay / al) * 3, cy - (ax / al) * 3);
        ctx.stroke();
      }
    }
  };

  const legDraw = (jk, jf, jt, near) => {
    const paint = near ? C : Cfar;
    ctx.strokeStyle = isTrousers ? paint(bottom.color) : near ? ink : far;
    ctx.lineWidth = (isTrousers ? 6.2 : near ? 5 : 4.6) + extra;
    strokeChain(ctx, [px, py, W[jk], W[jk + 1], W[jf], W[jf + 1]]);
    ctx.strokeStyle = look.shoes ? paint(look.shoes) : near ? ink : far;
    ctx.lineWidth = 5 + extra;
    strokeChain(ctx, [W[jf], W[jf + 1], W[jt], W[jt + 1]]);
    if (near && look.laces && !ov) {
      ctx.fillStyle = C(look.laces);
      dot(ctx, (W[jf] + W[jt]) / 2, (W[jf + 1] + W[jt + 1]) / 2, 1.1);
    }
  };

  // ---- behind the body
  arm(J.elbowF, J.handF, false);
  legDraw(J.kneeF, J.footF, J.toeF, false);
  if (a.chains) {
    const hc = C(look.hair.color);
    for (const c of a.chains) {
      if (!c.pts) continue;
      const braid = look.hair.style === 'braids';
      const wide = look.hair.style === 'wavy';
      taper(ctx, c.pts, (wide ? 9 : braid ? 3.8 : 5) + extra, (wide ? 6.5 : braid ? 2.8 : 2.4) + extra, hc);
      if (braid && !ov) {
        ctx.fillStyle = hc;
        for (let i = 1; i < c.pts.length; i++) dot(ctx, c.pts[i].x, c.pts[i].y, 2.4);
      }
      if (look.hair.band && braid) {
        const end = braid ? c.pts[c.pts.length - 2] : c.pts[0];
        ctx.fillStyle = ov || C(look.hair.band);
        dot(ctx, end.x, end.y, 2 + extra / 2);
      }
    }
  }
  legDraw(J.kneeN, J.footN, J.toeN, true);

  // ---- torso
  const hemX = px - tx * 2;
  const hemY = py - ty * 2;
  const pinafore = bottom.type === 'pinafore';
  const body = look.layer ? look.layer.color : top.color;
  ctx.strokeStyle = C(body);
  ctx.lineWidth = (look.kid ? 10.4 : 11) + extra;
  strokeChain(ctx, [hemX, hemY, sx, sy]);
  if (!ov) {
    const along = (v, w) => [px + tx * tl * v + bfx * w, py + ty * tl * v + bfy * w];
    if (look.layer) {
      // the blouse or shirt showing down the open front
      ctx.strokeStyle = C(top.color);
      ctx.lineWidth = 3.2;
      const [ax, ay] = along(0.02, 3.6);
      const [bx, by] = along(0.86, 3.4);
      strokeChain(ctx, [ax, ay, bx, by]);
      if (look.layer.lapel) {
        ctx.strokeStyle = C(mix(look.layer.color, '#000000', 0.35));
        ctx.lineWidth = 1.4;
        const [l0x, l0y] = along(0.9, 1.2);
        const [l1x, l1y] = along(0.62, 4.2);
        strokeChain(ctx, [l0x, l0y, l1x, l1y]);
      }
    }
    if (pinafore) {
      ctx.strokeStyle = C(bottom.color);
      ctx.lineWidth = 8.6;
      const [b0x, b0y] = along(-0.05, 0.4);
      const [b1x, b1y] = along(0.62, 0.6);
      strokeChain(ctx, [b0x, b0y, b1x, b1y]);
      ctx.lineWidth = 1.8;
      for (const w of [-2.6, 2.6]) {
        const [q0x, q0y] = along(0.62, w);
        const [q1x, q1y] = along(0.93, w * 0.8);
        strokeChain(ctx, [q0x, q0y, q1x, q1y]);
      }
    }
    if (top.pattern && !look.layer && !pinafore) {
      ctx.fillStyle = C(top.patternColor);
      ctx.strokeStyle = C(top.patternColor);
      if (top.pattern === 'dots') {
        for (let r = 0; r < 5; r++) {
          for (const w of r % 2 ? [-2.4, 2.4] : [-4, 0, 4]) {
            const [x, y] = along(0.06 + r * 0.19, w);
            dot(ctx, x, y, 0.95);
          }
        }
      } else if (top.pattern === 'stripes') {
        ctx.lineWidth = 1.7;
        for (let r = 0; r < 6; r++) {
          const [x0, y0] = along(0.02 + r * 0.16, -5.2);
          const [x1, y1] = along(0.02 + r * 0.16, 5.2);
          strokeChain(ctx, [x0, y0, x1, y1]);
        }
      } else if (top.pattern === 'print') {
        ctx.lineWidth = 1.1;
        for (let r = 0; r < 6; r++) {
          for (const w of r % 2 ? [-3, 2] : [-1, 3.6]) {
            const [x, y] = along(0.04 + r * 0.15, w);
            ctx.beginPath();
            ctx.moveTo(x - 1, y + 0.6);
            ctx.lineTo(x + 1, y - 0.6);
            ctx.stroke();
          }
        }
      }
    }
    if (top.placket) {
      ctx.strokeStyle = C(mix(top.color, '#000000', 0.35));
      ctx.lineWidth = 0.9;
      const [a0x, a0y] = along(-0.05, 2.2);
      const [a1x, a1y] = along(0.86, 2.2);
      strokeChain(ctx, [a0x, a0y, a1x, a1y]);
      ctx.fillStyle = C('#f4f0e6');
      for (let r = 0; r < 4; r++) {
        const [x, y] = along(0.1 + r * 0.22, 2.2);
        dot(ctx, x, y, 0.6);
      }
    }
    if (top.heart) {
      const [x, y] = along(0.6, 2.4);
      ctx.fillStyle = C(top.heart);
      ctx.beginPath();
      ctx.moveTo(x, y + 1.8);
      ctx.bezierCurveTo(x - 3, y - 0.2, x - 1.4, y - 2.6, x, y - 1);
      ctx.bezierCurveTo(x + 1.4, y - 2.6, x + 3, y - 0.2, x, y + 1.8);
      ctx.fill();
    }
    if (top.collar) {
      ctx.strokeStyle = C(top.collar);
      ctx.lineWidth = 2.2;
      const [c0x, c0y] = along(0.92, -1.5);
      const [c1x, c1y] = along(0.8, 3.4);
      const [c2x, c2y] = along(0.94, 3.8);
      strokeChain(ctx, [c0x, c0y, c1x, c1y, c2x, c2y]);
    }
  }

  // ---- skirt, dress, tutu, pinafore
  if (!isTrousers) {
    const L = { skirt: 0.95, dress: 1.05, pinafore: 0.9, tutu: 0.55 }[bottom.type] * (bottom.length || 1);
    const flare = { skirt: 4.6, dress: 5.2, pinafore: 5.4, tutu: 9 }[bottom.type] + extra * 0.5;
    const hem = (jk, jf) => (L <= 1 ? [px + (W[jk] - px) * L, py + (W[jk + 1] - py) * L] : [W[jk] + (W[jf] - W[jk]) * (L - 1), W[jk + 1] + (W[jf + 1] - W[jk + 1]) * (L - 1)]);
    const k1 = hem(J.kneeN, J.footN);
    const k2 = hem(J.kneeF, J.footF);
    const d1 = (k1[0] - px) * bfx + (k1[1] - py) * bfy;
    const d2 = (k2[0] - px) * bfx + (k2[1] - py) * bfy;
    const [fr, bk] = d1 > d2 ? [k1, k2] : [k2, k1];
    const wx = px + tx * 6;
    const wy = py + ty * 6;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(wx - bfx * 4.4, wy - bfy * 4.4);
      ctx.lineTo(wx + bfx * 4.4, wy + bfy * 4.4);
      ctx.lineTo(fr[0] + bfx * flare, fr[1] + bfy * flare);
      if (bottom.type === 'tutu') {
        // ruffled hem
        const n = 6;
        for (let i = 1; i <= n; i++) {
          const u = i / n;
          const ex = lerp(fr[0] + bfx * flare, bk[0] - bfx * flare, u);
          const ey = lerp(fr[1] + bfy * flare, bk[1] - bfy * flare, u);
          const mx = lerp(fr[0] + bfx * flare, bk[0] - bfx * flare, u - 0.5 / n) - tx * 2.4;
          const my = lerp(fr[1] + bfy * flare, bk[1] - bfy * flare, u - 0.5 / n) - ty * 2.4;
          ctx.quadraticCurveTo(mx, my, ex, ey);
        }
      } else {
        ctx.quadraticCurveTo((fr[0] + bk[0]) / 2 - tx * 2, (fr[1] + bk[1]) / 2 - ty * 2, bk[0] - bfx * flare, bk[1] - bfy * flare);
      }
      ctx.closePath();
    };
    path();
    ctx.fillStyle = C(bottom.color);
    ctx.fill();
    if (bottom.pattern && !ov) {
      ctx.save();
      path();
      ctx.clip();
      ctx.fillStyle = C(bottom.patternColor);
      for (let i = -3; i <= 3; i++) {
        for (let j = 0; j < 6; j++) {
          const v = 4 + j * 4.2;
          const w = i * 3.6 + (j % 2) * 1.8;
          dot(ctx, wx - tx * v + bfx * w, wy - ty * v + bfy * w, 0.95);
        }
      }
      ctx.restore();
    }
    if (bottom.type === 'tutu' && !ov) {
      ctx.strokeStyle = C(mix(bottom.color, '#ffffff', 0.35));
      ctx.lineWidth = 1;
      path();
      ctx.stroke();
    }
  }

  // ---- neck + head
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3.6 + extra;
  strokeChain(ctx, [nx, ny, nx + (F.cx - nx) * 0.4, ny + (F.cy - ny) * 0.4]);
  if (look.necklace && !ov) {
    ctx.fillStyle = C(look.necklace);
    for (let i = 0; i < 4; i++) {
      const u = i / 3;
      dot(ctx, nx - tx * (1 + u * 3) + bfx * (0.5 + u * 3), ny - ty * (1 + u * 3) + bfy * (0.5 + u * 3), 0.9);
    }
  }
  ctx.fillStyle = ov || C(look.skin);
  dot(ctx, F.cx, F.cy, F.R + extra / 2);
  if (ov) {
    ctx.fillStyle = ov;
    hairCap(ctx, F, look.hair.style, extra / (2 * F.R));
  } else {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(F.cx, F.cy, F.R, 0, TAU);
    ctx.stroke();
    castFace(ctx, F, look, C, ink);
  }

  // ---- near arm last, in front of everything
  arm(J.elbowN, J.handN, true);
}

function castFace(ctx, F, look, C, ink) {
  const { Q, Pp, R } = F;
  const hc = C(look.hair.color);
  const style = look.hair.style;
  // hair
  ctx.fillStyle = hc;
  hairCap(ctx, F, style, 0);
  if (style === 'curly') {
    for (let th = 0.95; th <= 3.96; th += 0.24) {
      const [x, y] = Pp(th, 1.02);
      dot(ctx, x, y, R * 0.27);
    }
    for (let th = 1.3; th <= 3.7; th += 0.26) {
      const [x, y] = Pp(th + 0.12, 0.8);
      dot(ctx, x, y, R * 0.24);
    }
  }
  if (style === 'messy') {
    ctx.beginPath();
    const a = Q(0.4, 0.95);
    const b = Q(0.74, 0.5);
    const c = Q(0.2, 0.7);
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(c[0], c[1]);
    ctx.fill();
  }
  if (look.hair.band && style === 'wavy') {
    ctx.strokeStyle = C(look.hair.band);
    ctx.lineWidth = R * 0.22;
    ctx.beginPath();
    for (let th = 1.15; th <= 2.75; th += 0.1) {
      const [x, y] = Pp(th, 0.97);
      if (th === 1.15) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  if (look.hair.band && style === 'ponytail') {
    const [x, y] = Q(-0.92, 0.42);
    ctx.fillStyle = C(look.hair.band);
    dot(ctx, x, y, 2.1);
  }
  // beard
  if (look.beard) {
    ctx.fillStyle = hc;
    ctx.beginPath();
    const rim = [];
    for (let th = -0.2; th >= -2.65; th -= 0.15) rim.push(Pp(th, 1.0));
    ctx.moveTo(rim[0][0], rim[0][1]);
    for (const [x, y] of rim) ctx.lineTo(x, y);
    for (const [th, r] of [[-2.35, 0.62], [-1.7, 0.5], [-1.0, 0.52], [-0.4, 0.72]]) {
      const [x, y] = Pp(th, r);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    for (let th = -0.3; th >= -2.6; th -= 0.26) {
      const [x, y] = Pp(th, 0.94);
      dot(ctx, x, y, R * 0.19);
    }
  }
  // ear and earrings
  if (look.ears) {
    const [x, y] = Q(-0.48, -0.02);
    ctx.fillStyle = C(look.skin);
    dot(ctx, x, y, R * 0.2);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, R * 0.2, 0, TAU);
    ctx.stroke();
  }
  if (look.earrings) {
    const [x, y] = Q(-0.5, -0.3);
    ctx.fillStyle = C(look.earrings.color);
    ctx.strokeStyle = C(look.earrings.color);
    if (look.earrings.hoop) {
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(x, y - 0.6, 2, 0, TAU);
      ctx.stroke();
    } else if (look.earrings.drop) {
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y - 1.6);
      ctx.lineTo(x, y);
      ctx.stroke();
      dot(ctx, x, y + 0.9, 1.3);
    } else dot(ctx, x, y, 1.1);
  }
  // face, three-quarter view: two eyes, a smile
  const eyeR = look.kid ? 1.3 : 1.15;
  const e1 = Q(0.14, 0.06);
  const e2 = Q(0.58, 0.08);
  ctx.fillStyle = ink;
  dot(ctx, e1[0], e1[1], eyeR);
  dot(ctx, e2[0], e2[1], eyeR);
  if (look.kid) {
    ctx.fillStyle = alpha('#e8606a', 0.28);
    const c1 = Q(0.02, -0.26);
    const c2 = Q(0.76, -0.24);
    dot(ctx, c1[0], c1[1], 1.8);
    dot(ctx, c2[0], c2[1], 1.8);
  }
  ctx.strokeStyle = look.beard ? C('#e8c8a8') : ink;
  ctx.lineWidth = 1.1;
  const m0 = Q(0.18, -0.36);
  const m1 = Q(0.38, -0.58);
  const m2 = Q(0.62, -0.34);
  ctx.beginPath();
  ctx.moveTo(m0[0], m0[1]);
  ctx.quadraticCurveTo(m1[0], m1[1], m2[0], m2[1]);
  ctx.stroke();
  if (look.bindi) {
    const [x, y] = Q(0.37, 0.42);
    ctx.fillStyle = C(look.bindi);
    dot(ctx, x, y, 1.05);
  }
  if (look.glasses) {
    ctx.strokeStyle = C(look.glasses);
    ctx.lineWidth = 1.2;
    const lr = R * 0.25;
    for (const e of [e1, e2]) {
      ctx.beginPath();
      ctx.arc(e[0], e[1], lr, 0, TAU);
      ctx.stroke();
    }
    const b0 = Q(0.14 + 0.25, 0.08);
    const b1 = Q(0.58 - 0.25, 0.08);
    const t0 = Q(0.14 - 0.25, 0.08);
    const t1 = Q(-0.5, 0.1);
    ctx.beginPath();
    ctx.moveTo(b0[0], b0[1]);
    ctx.lineTo(b1[0], b1[1]);
    ctx.moveTo(t0[0], t0[1]);
    ctx.lineTo(t1[0], t1[1]);
    ctx.stroke();
  }
}
