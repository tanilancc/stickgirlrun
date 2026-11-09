// Procedural stick-figure animation.
// Poses are built in a local frame (origin at the feet, y up, facing +x) from a phase-locked
// run cycle and 2-bone IK, cross-faded between states, then transformed to world space.
// The stance foot moves at exactly the ground speed, so feet never skate.

import { clamp, lerp, fract, easeOut, easeInOut, mix, TAU } from './util.js';
import { CHARACTERS } from './stages.js';

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
    for (const ch of [a.hair, a.scarf]) {
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
  const W = a.W;
  const ch = CHARACTERS[a.kind];
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

  // umbrella (glide rescue)
  if (a.umbrella > 0.02) {
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
  ctx.restore();
}

/** Lowest point of the figure (for the contact shadow), in world y. */
export function figureFeetX(a) {
  return (a.W[J.footN] + a.W[J.footF]) / 2;
}
