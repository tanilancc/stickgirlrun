// Seeded, deterministic level generator. A level is plain data:
//   segments  — runs of ground {x0, x1, y}; anything between segments is a pit
//   obstacles — static things {kind: 'solid'|'hazard'|'over', skin, x, y, w, h}
//   movers    — hazards whose position is a pure function of distance travelled (d)
//   coins / pickups / decor
// Every hazard is placed from the runner's real jump arc at the speed it will be met,
// so coin trails double as hints for when to jump.

import { mulberry32, pick } from './rng.js';
import { GROUND_Y, JUMP, airTimeTo, jumpHeightAt } from './config.js';
import { clamp, lerp } from './util.js';

export const MAX_OB_W = 260;

export const SKINS = {
  // low: jump over (solid ones can be landed on)
  log: { kind: 'solid', w: [76, 110], h: [30, 38] },
  haybale: { kind: 'solid', w: [58, 70], h: [40, 46] },
  rock: { kind: 'solid', w: [46, 72], h: [28, 40] },
  fence: { kind: 'hazard', w: [62, 92], h: [36, 42] },
  stump: { kind: 'solid', w: [40, 52], h: [32, 42] },
  trunk: { kind: 'solid', w: [96, 140], h: [32, 40] },
  cactus: { kind: 'hazard', w: [30, 38], h: [50, 62] },
  vent: { kind: 'solid', w: [40, 58], h: [30, 40] },
  acunit: { kind: 'solid', w: [62, 80], h: [40, 46] },
  crate: { kind: 'solid', w: [46, 52], h: [46, 52] },
  barrels: { kind: 'solid', w: [52, 64], h: [40, 46] },
  drift: { kind: 'solid', w: [74, 110], h: [26, 36] },
  iceblock: { kind: 'solid', w: [44, 58], h: [36, 46] },
  // tall: jump onto
  bales: { kind: 'solid', w: [116, 170], h: [80, 88] },
  boulderBig: { kind: 'solid', w: [96, 130], h: [72, 86] },
  mesaBlock: { kind: 'solid', w: [130, 220], h: [72, 92] },
  chimney: { kind: 'solid', w: [52, 70], h: [82, 96] },
  crates2: { kind: 'solid', w: [98, 106], h: [92, 100] },
  container: { kind: 'solid', w: [150, 200], h: [86, 96] },
  rockSnow: { kind: 'solid', w: [100, 160], h: [74, 90] },
  // overhead: slide under. h is the thickness of the blocking part.
  branch: { kind: 'over', w: [80, 130], h: [44, 60] },
  fallen: { kind: 'over', w: [100, 150], h: [34, 42] },
  timber: { kind: 'over', w: [44, 60], h: [30, 36] },
  laundry: { kind: 'over', w: [100, 170], h: [52, 64] },
  pipe: { kind: 'over', w: [120, 220], h: [26, 32] },
  icebeam: { kind: 'over', w: [100, 160], h: [38, 48] },

  // ---- chapter 2: round the world
  pots: { kind: 'solid', w: [50, 66], h: [38, 46] },
  sheaf: { kind: 'solid', w: [44, 58], h: [36, 46] },
  basket: { kind: 'solid', w: [42, 54], h: [30, 40] },
  bamboofence: { kind: 'hazard', w: [62, 90], h: [36, 42] },
  column: { kind: 'solid', w: [72, 110], h: [32, 40] },
  stoneBlock: { kind: 'solid', w: [50, 70], h: [36, 46] },
  planter: { kind: 'solid', w: [56, 76], h: [30, 40] },
  bench: { kind: 'solid', w: [70, 92], h: [34, 40] },
  thorn: { kind: 'hazard', w: [50, 70], h: [40, 50] },
  drum: { kind: 'solid', w: [50, 64], h: [40, 46] },
  giftboxes: { kind: 'solid', w: [50, 62], h: [38, 46] },
  ruinBlock: { kind: 'solid', w: [110, 180], h: [76, 92] },
  strawstack: { kind: 'solid', w: [90, 130], h: [78, 90] },
  stepBlock: { kind: 'solid', w: [120, 180], h: [78, 94] },
  wellhead: { kind: 'solid', w: [72, 92], h: [74, 88] },
  termite: { kind: 'solid', w: [70, 100], h: [80, 96] },
  stallTall: { kind: 'solid', w: [110, 150], h: [80, 94] },
  awning: { kind: 'over', w: [90, 150], h: [40, 54] },
  bamboo: { kind: 'over', w: [100, 170], h: [30, 40] },
  lintel: { kind: 'over', w: [70, 120], h: [34, 46] },
  roots: { kind: 'over', w: [70, 110], h: [46, 60] },
  cafeAwning: { kind: 'over', w: [100, 160], h: [34, 46] },
  acacia: { kind: 'over', w: [100, 160], h: [40, 56] },
  lanternString: { kind: 'over', w: [110, 190], h: [30, 40] },
};

export const stageLength = (stage, diff) => Math.round(stage.length * diff.lengthMul);

/** Nominal run speed at world x (ignores the start ramp and hit slow-downs). */
export function speedAt(stage, diff, x, length) {
  const t = clamp(x / length, 0, 1);
  const [a, b] = stage.speed;
  return (a + (b - a) * t * diff.rampMul) * diff.speedMul;
}

// ---------------------------------------------------------------- builder

export class Builder {
  /** theme: index of the stage whose look a new piece takes (endless mode mixes stages). */
  constructor(L, rng, theme) {
    this.L = L;
    this.rng = rng;
    this.x = 0;
    this.y = GROUND_Y;
    this.segStart = -1800;
    this.theme = theme;
    this.segTheme = theme;
  }
  closeSeg(x1) {
    if (x1 - this.segStart > 0.5) this.L.segments.push({ x0: this.segStart, x1, y: this.y, th: this.segTheme });
  }
  gap(w, dy = 0) {
    this.closeSeg(this.x);
    this.x += w;
    this.y += dy;
    this.segStart = this.x;
    this.segTheme = this.theme;
  }
  step(dy) {
    if (!dy) return;
    this.closeSeg(this.x);
    this.y += dy;
    this.segStart = this.x;
    this.segTheme = this.theme;
  }
  /** Close the open run of ground at the current x and continue it at the same height. */
  split() {
    this.closeSeg(this.x);
    this.segStart = this.x;
    this.segTheme = this.theme;
  }
  obstacle(o) {
    o.seed = (this.rng() * 1e9) | 0;
    o.ground = this.y;
    this.L.obstacles.push(o);
    return o;
  }
  coin(x, y) {
    this.L.coins.push({ x: Math.round(x), y: Math.round(y) });
  }
  /** Coins along the actual path of a full jump taking off at x0 from ground y0. */
  coinArc(x0, y0, speed, n, rise = 0, t0 = 0.12, t1 = 0.88) {
    const air = airTimeTo(rise);
    for (let i = 0; i < n; i++) {
      const t = lerp(t0, t1, n === 1 ? 0.5 : i / (n - 1)) * air;
      this.coin(x0 + speed * t, y0 - jumpHeightAt(t) - 36);
    }
  }
  coinLine(x0, x1, y, n) {
    for (let i = 0; i < n; i++) this.coin(lerp(x0, x1, n === 1 ? 0.5 : i / (n - 1)), y);
  }
}

// ---------------------------------------------------------------- patterns

const PATTERNS = [];
const def = (id, opts, make) => PATTERNS.push({ id, minTier: 0, kids: true, moving: false, ...opts, make });

function sized(c, skin, scale = 1) {
  const s = SKINS[skin];
  return {
    s,
    w: Math.round(lerp(s.w[0], s.w[1], c.rng())),
    h: Math.round(lerp(s.h[0], s.h[1], c.rng()) * scale),
  };
}

function placeLow(c, x, skin = pick(c.rng, c.stage.skins.low), coins = true) {
  const { s, w, h } = sized(c, skin, c.kids ? 0.88 : 1);
  c.b.obstacle({ kind: s.kind, skin, x, y: c.b.y - h, w, h });
  if (coins) c.b.coinArc(x + w / 2 - (c.speed * JUMP.air) / 2, c.b.y, c.speed, 5);
  return x + w;
}

function placeOver(c, x, skin = pick(c.rng, c.stage.skins.high)) {
  const { w, h } = sized(c, skin);
  const clear = c.kids ? 47 : 43;
  c.b.obstacle({ kind: 'over', skin, x, y: c.b.y - clear - h, w, h });
  const n = Math.max(3, Math.round((w + 40) / 34));
  c.b.coinLine(x - 20, x + w + 20, c.b.y - 16, n);
  return x + w;
}

/** Height change for terrain that varies (canyon ledges, rooftops), biased back toward the base line. */
function chooseDy(c) {
  const tv = c.stage.terrainVar;
  if (!tv) return 0;
  const up = c.kids ? Math.min(tv.up, 38) : tv.up;
  const lo = Math.max(-up, GROUND_Y - 210 - c.b.y);
  const hi = Math.min(tv.down, GROUND_Y + 20 - c.b.y);
  if (lo > hi) return 0;
  return Math.round(lerp(lo, hi, c.rng()) / 2) * 2;
}

def('coins', {}, (c) => {
  const { b, rng } = c;
  const n = 6 + Math.floor(rng() * 5);
  const wave = rng() < 0.5;
  const x0 = b.x + 60;
  for (let i = 0; i < n; i++) b.coin(x0 + i * 34, b.y - 34 - (wave ? Math.sin((i / (n - 1)) * Math.PI) * 42 : 0));
  b.x = x0 + n * 34 + 40;
});

def('hurdle', {}, (c) => {
  c.b.x = placeLow(c, c.b.x + c.speed * 0.3) + 30;
});

def('hurdle2', { minTier: 0.8 }, (c) => {
  const x1 = c.b.x + c.speed * 0.3;
  const skin = pick(c.rng, c.stage.skins.low);
  const e1 = placeLow(c, x1, skin);
  const c1 = (x1 + e1) / 2;
  const D = c.speed * (JUMP.air + lerp(0.36, 0.2, c.tier / 3));
  const { w } = sized(c, skin);
  c.b.x = placeLow(c, c1 + D - w / 2, skin) + 30;
});

def('overhead', {}, (c) => {
  c.b.x = placeOver(c, c.b.x + c.speed * 0.35) + 20;
});

def('combo', { minTier: 0.6 }, (c) => {
  const x1 = c.b.x + c.speed * 0.3;
  const e1 = placeLow(c, x1);
  const land = (x1 + e1) / 2 + (c.speed * JUMP.air) / 2;
  const x2 = land + c.speed * (c.kids ? 0.55 : lerp(0.4, 0.28, c.tier / 3));
  c.b.x = placeOver(c, x2) + 20;
});

def('combo2', { minTier: 0.9 }, (c) => {
  const x1 = c.b.x + c.speed * 0.35;
  const e1 = placeOver(c, x1);
  const skin = pick(c.rng, c.stage.skins.low);
  const { w } = sized(c, skin);
  const center = e1 + 26 + c.speed * (c.kids ? 0.5 : lerp(0.32, 0.18, c.tier / 3)) + (c.speed * JUMP.air) / 2;
  c.b.x = placeLow(c, center - w / 2, skin) + 30;
});

def('gap', {}, (c) => {
  const { b, rng, speed, tier } = c;
  const dy = chooseDy(c);
  const rise = -dy;
  const reach = speed * airTimeTo(rise);
  const f = lerp(0.34, 0.66, tier / 3) * (c.kids ? 0.8 : 1) * (0.9 + rng() * 0.2);
  const w = Math.round(clamp(reach * f, 70, reach * 0.74));
  b.x += speed * 0.3;
  const x0 = b.x;
  const y0 = b.y;
  b.gap(w, dy);
  b.coinArc(x0 + w / 2 - reach / 2, y0, speed, 5, rise);
  b.x += Math.max(150, speed * 0.42);
});

def('platforms', { minTier: 0.7 }, (c) => {
  const { b, rng, speed, tier } = c;
  const n = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const dy = chooseDy(c);
    const rise = -dy;
    const reach = speed * airTimeTo(rise);
    const f = lerp(0.3, 0.6, tier / 3) * (c.kids ? 0.8 : 1) * (0.9 + rng() * 0.2);
    const w = Math.round(clamp(reach * f, 60, reach * 0.72));
    b.x += speed * 0.2;
    const x0 = b.x;
    const y0 = b.y;
    b.gap(w, dy);
    b.coinArc(x0 + w / 2 - reach / 2, y0, speed, 4, rise);
    b.x += lerp(240, 460, rng());
  }
});

def('step', {}, (c) => {
  const { b, rng, speed } = c;
  const up = Math.round(c.kids ? lerp(24, 38, rng()) : lerp(30, 60, rng()));
  if (b.y - up < GROUND_Y - 210) {
    const down = Math.min(Math.round(lerp(40, 100, rng())), GROUND_Y + 20 - b.y);
    b.x += speed * 0.2;
    if (down > 0) b.step(down);
    b.x += 200;
    return;
  }
  b.x += speed * 0.3;
  const xs = b.x;
  b.step(-up);
  b.coinArc(xs - speed * JUMP.air * 0.32, b.y + up, speed, 4, up, 0.1, 0.62);
  b.x += lerp(280, 560, rng());
  if (rng() < 0.55) {
    const down = Math.min(Math.round(lerp(30, up + 40, rng())), GROUND_Y + 20 - b.y);
    if (down > 0) b.step(down);
    b.x += 140;
  }
});

def('tall', { minTier: 0.9 }, (c) => {
  const { b, rng, speed } = c;
  const skin = pick(rng, c.stage.skins.tall);
  const { w, h } = sized(c, skin, c.kids ? 0.85 : 1);
  const x = b.x + speed * 0.4;
  b.obstacle({ kind: 'solid', skin, x, y: b.y - h, w, h });
  b.coinArc(x - speed * JUMP.air * 0.42, b.y, speed, 4, h, 0.08, 0.55);
  for (let xi = x + 22; xi < x + w - 14; xi += 34) b.coin(xi, b.y - h - 34);
  if (c.heartOk() && rng() < 0.4) {
    c.L.pickups.push({ type: 'heart', x: Math.round(x + w / 2), y: Math.round(b.y - h - 150) });
  }
  b.x = x + w + 30;
});

def('stairs', { minTier: 1 }, (c) => {
  const { b, speed } = c;
  const [lowSkin, tallSkin] = c.stage.skins.stairs;
  const x = b.x + speed * 0.32;
  const lo = sized(c, lowSkin, c.kids ? 0.88 : 1);
  const hi = sized(c, tallSkin, c.kids ? 0.85 : 1);
  b.obstacle({ kind: 'solid', skin: lowSkin, x, y: b.y - lo.h, w: lo.w, h: lo.h });
  b.obstacle({ kind: 'solid', skin: tallSkin, x: x + lo.w, y: b.y - hi.h, w: hi.w, h: hi.h });
  b.coinArc(x - speed * JUMP.air * 0.4, b.y, speed, 3, lo.h, 0.1, 0.5);
  for (let xi = x + lo.w + 20; xi < x + lo.w + hi.w - 12; xi += 34) b.coin(xi, b.y - hi.h - 34);
  b.x = x + lo.w + hi.w + 30;
});

def('roller', { minTier: 0.9, moving: true }, (c) => {
  const { b, rng, speed } = c;
  const trigD = 760;
  const k = lerp(0.4, 0.6, c.tier / 3);
  const x0 = b.x + speed * 1.5;
  const r = Math.round(22 + rng() * 6);
  const meet = x0 - (k * trigD) / (1 + k);
  c.L.movers.push({ type: 'roller', skin: c.stage.skins.roller, x0, y: b.y, r, trigD, k, cx: meet, seed: (rng() * 1e9) | 0 });
  b.coinArc(meet - (speed * JUMP.air) / 2, b.y, speed, 5);
  b.x = x0 + 180;
});

def('swing', { minTier: 0.6 }, (c) => {
  const { b, rng, speed } = c;
  const ax = b.x + speed * 0.55;
  const L = 168;
  const A = lerp(0.6, 0.85, rng());
  const P = speed * lerp(1.9, 1.5, c.tier / 3) * (c.kids ? 1.3 : 1);
  c.L.movers.push({ type: 'swing', skin: c.stage.skins.swing || 'hook', ax, ay: b.y - 236, L, A, P, phase: rng() * P, r: 17, ground: b.y, cx: ax });
  b.coinLine(ax - 110, ax + 110, b.y - 16, 7);
  b.x = ax + 170;
});

def('icicles', { minTier: 0.8, moving: true }, (c) => {
  const { b, rng, speed } = c;
  const n = 2 + (rng() < 0.5 ? 1 : 0);
  const D = speed * (JUMP.air + lerp(0.42, 0.22, c.tier / 3));
  let x = b.x + speed * 0.9;
  for (let i = 0; i < n; i++) {
    c.L.movers.push({ type: 'icicle', x, y0: b.y - 290, ground: b.y, w: 16, h: 42, fallD: x - 640, vNom: speed, cx: x, seed: (rng() * 1e9) | 0 });
    b.coinArc(x - (speed * JUMP.air) / 2, b.y, speed, 4);
    x += D;
  }
  b.x = x - D + 60;
});

function choosePattern(c, recent) {
  const w = c.stage.weights;
  const pool = [];
  let total = 0;
  for (const p of PATTERNS) {
    const wt = w[p.id] || 0;
    if (wt <= 0 || p.minTier > c.tier) continue;
    if (c.kids && !p.kids) continue;
    if (p.moving && !c.diff.moving) continue;
    if (p.id === 'stairs' && !c.stage.skins.stairs) continue;
    const reps = recent.filter((id) => id === p.id).length;
    const adj = wt / (1 + reps * 1.5);
    pool.push([p, adj]);
    total += adj;
  }
  let r = c.rng() * total;
  for (const [p, wt] of pool) {
    r -= wt;
    if (r <= 0) return p;
  }
  return pool[pool.length - 1][0];
}

// ---------------------------------------------------------------- decor

/** Sprinkle ground decor over segments (from index `from`), skipping obstacle footprints. */
export function decorate(L, kindsFor, rng, from = 0, xMax = Infinity) {
  const obs = L.obstacles;
  for (let i = from; i < L.segments.length; i++) {
    const s = L.segments[i];
    const kinds = kindsFor(s);
    if (!kinds || !kinds.length) continue;
    let x = Math.max(s.x0 + 30, -600);
    while (x < Math.min(s.x1 - 30, xMax)) {
      x += lerp(70, 260, rng());
      if (x > s.x1 - 30) break;
      let near = false;
      for (let k = obstacleStart(L, x - 40); k < obs.length; k++) {
        const o = obs[k];
        if (o.x > x + 40) break;
        if (o.ground === s.y && x > o.x - 40 && x < o.x + o.w + 40) {
          near = true;
          break;
        }
      }
      if (near) continue;
      L.decor.push({ skin: pick(rng, kinds), x: Math.round(x), y: s.y, s: lerp(0.75, 1.25, rng()), seed: (rng() * 1e9) | 0, th: s.th });
    }
  }
}

/**
 * Place one hazard pattern (plus the breathing room after it) at the builder's position.
 * Shared by the fixed stages and the endless track so both play by the same rules.
 */
export function placePattern(b, rng, stage, diff, speed, tier, recent, heartOk) {
  const L = b.L;
  const nObs = L.obstacles.length;
  const nMov = L.movers.length;
  const c = { b, rng, speed, tier, diff, stage, L, kids: diff.id === 'kids', heartOk };
  const p = choosePattern(c, recent);
  p.make(c);
  recent.push(p.id);
  if (recent.length > 4) recent.shift();
  for (let i = nObs; i < L.obstacles.length; i++) L.obstacles[i].th = b.theme;
  for (let i = nMov; i < L.movers.length; i++) L.movers[i].th = b.theme;
  const restT = lerp(0.88, 0.44, tier / 3) / diff.density;
  b.x += speed * restT * (0.85 + rng() * 0.35);
  return p.id;
}

// ---------------------------------------------------------------- build

export function buildLevel(stage, diff) {
  const length = stageLength(stage, diff);
  const rng = mulberry32((stage.seed * 2654435761) ^ (diff.id === 'kids' ? 0x9e37 : 0x7f4a));
  const L = {
    stageId: stage.id,
    length,
    finishX: length,
    finishY: GROUND_Y,
    segments: [],
    obstacles: [],
    movers: [],
    coins: [],
    pickups: [],
    decor: [],
  };
  const b = new Builder(L, rng);
  b.coinLine(420, 900, GROUND_Y - 34, 7);
  b.x = 1150;
  const recent = [];
  while (b.x < length - 1300) {
    const speed = speedAt(stage, diff, b.x, length);
    const tier = clamp((stage.tier + (b.x / length) * 1.5) * diff.tierMul, 0, 3);
    const heartOk = () => diff.id !== 'kids' && tier > 1.2 && L.pickups.length < 2;
    placePattern(b, rng, stage, diff, speed, tier, recent, heartOk);
  }
  // A long pattern can run past the nominal length: the finish line always sits on the
  // final, hazard-free stretch of ground.
  L.length = L.finishX = Math.round(Math.max(length, b.x + 320));
  b.closeSeg(L.finishX + 4000);
  L.finishY = b.y;
  L.obstacles.sort((p, q) => p.x - q.x);
  L.coins.sort((p, q) => p.x - q.x);
  L.movers.sort((p, q) => p.cx - q.cx);
  decorate(L, () => stage.decor, rng, 0, L.length + 1200);
  L.decor.sort((p, q) => p.x - q.x);
  return L;
}

// ---------------------------------------------------------------- queries

/** Index of the first segment whose right edge is at or after x. */
export function segIndexAt(L, x) {
  const a = L.segments;
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid].x1 < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Index of the first obstacle that could overlap x (accounts for the widest obstacle). */
export function obstacleStart(L, x) {
  return lowerBound(L.obstacles, x - MAX_OB_W);
}

export function lowerBound(arr, x) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].x < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Highest (smallest y) ground surface touching [xa, xb], or null if it is all pit. */
export function highestGround(L, xa, xb) {
  let best = null;
  const segs = L.segments;
  for (let i = segIndexAt(L, xa); i < segs.length; i++) {
    const s = segs[i];
    if (s.x0 > xb) break;
    if (best === null || s.y < best) best = s.y;
  }
  return best;
}

export function groundAt(L, x) {
  return highestGround(L, x, x);
}

/** Where a mover is when the lead runner has travelled d. */
export function moverState(m, d, out = {}) {
  if (m.type === 'roller') {
    const x = m.x0 - m.k * (d - (m.x0 - m.trigD));
    out.x = x;
    out.y = m.y - m.r;
    out.r = m.r;
    out.rot = -(x - m.x0) / m.r;
  } else if (m.type === 'swing') {
    const th = m.A * Math.sin((Math.PI * 2 * (d - m.phase)) / m.P);
    out.x = m.ax + m.L * Math.sin(th);
    out.y = m.ay + m.L * Math.cos(th);
    out.r = m.r;
    out.th = th;
  } else {
    const t = (d - m.fallD) / m.vNom;
    out.x = m.x;
    out.shake = t < 0 && t > -0.4 ? 1 + t / 0.4 : 0;
    out.y = t <= 0 ? m.y0 : Math.min(m.y0 + 800 * t * t, m.ground - m.h);
    out.landed = out.y >= m.ground - m.h;
  }
  return out;
}
