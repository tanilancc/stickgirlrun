// Endless mode, "The Long Way Round": one unbroken road through all six landscapes in turn,
// generated a few seconds ahead of the runners and forgotten behind them, so memory stays
// flat however far you get. It uses the same patterns, physics and fairness rules as the stages.

import { STAGES } from './stages.js';
import { GROUND_Y, airTimeTo } from './config.js';
import { Builder, placePattern, decorate, segIndexAt, lowerBound, MAX_OB_W } from './level.js';
import { mulberry32 } from './rng.js';
import { clamp } from './util.js';

/** World units per landscape before the road crosses into the next one. */
export const LEG = 12000;
/** A runner is ~80 units tall, about 1.6 m: 50 units to the metre. */
export const UNITS_PER_METRE = 50;

/** Speed ramps up landscape after landscape, then holds at a cap a person can still react to. */
const RAMP = {
  kids: { base: 340, perLeg: 16, max: 500 },
  adult: { base: 440, perLeg: 26, max: 690 },
};
const AHEAD = 2800;
const BEHIND = 1600;

export const metres = (d) => Math.max(0, Math.floor(d / UNITS_PER_METRE));

export class EndlessTrack {
  constructor(diff, seed = 0x10ad) {
    this.diff = diff;
    this.ramp = RAMP[diff.id] || RAMP.adult;
    this.rng = mulberry32(seed ^ (diff.id === 'kids' ? 0x5151 : 0xa3a3));
    this.L = {
      stageId: 'endless',
      endless: true,
      length: LEG,
      finishX: Infinity,
      finishY: GROUND_Y,
      segments: [],
      obstacles: [],
      movers: [],
      coins: [],
      pickups: [],
      decor: [],
      signs: [],
    };
    this.legs = [{ x: -Infinity, leg: 0, stage: 0 }];
    this.leg = 0;
    this.recent = [];
    this.heartLegs = new Set();
    this.decorFrom = 0;
    this.prunedAt = 0;
    const b = new Builder(this.L, this.rng, 0);
    this.b = b;
    b.coinLine(420, 900, GROUND_Y - 34, 7);
    b.x = 1150;
    this.ensure(0);
  }

  stageOfLeg(leg) {
    return leg % STAGES.length;
  }

  speedAt(x) {
    const r = this.ramp;
    return Math.min(r.max, r.base + (r.perLeg * Math.max(0, x)) / LEG);
  }

  tierAt(x) {
    return clamp((0.45 + (Math.max(0, x) / LEG) * 0.4) * this.diff.tierMul, 0, 3);
  }

  /** Index into this.legs of the landscape that contains x. */
  legIndexAt(x) {
    let i = this.legs.length - 1;
    while (i > 0 && this.legs[i].x > x) i--;
    return i;
  }

  /** How far through its landscape x is, 0..1. */
  legProgress(x) {
    const lg = this.legs[this.legIndexAt(x)];
    const start = lg.x === -Infinity ? 0 : lg.x;
    const end = (lg.leg + 1) * LEG + 400;
    return clamp((x - start) / (end - start), 0, 1);
  }

  /** Generate until the road reaches AHEAD units past d, and forget what is far behind. */
  ensure(d) {
    const b = this.b;
    if (d - this.prunedAt > 2000) this.prune(d);
    if (b.x >= d + AHEAD) return false;
    const L = this.L;
    const n = { o: L.obstacles.length, c: L.coins.length, m: L.movers.length };
    while (b.x < d + AHEAD) this.next();
    // Close the open run of ground so everything up to the generation front is queryable.
    b.split();
    sortTail(L.obstacles, n.o, (o) => o.x);
    sortTail(L.coins, n.c, (c) => c.x);
    sortTail(L.movers, n.m, (m) => m.cx);
    const before = L.decor.length;
    decorate(L, (s) => STAGES[s.th].decor, this.rng, this.decorFrom);
    this.decorFrom = L.segments.length;
    sortTail(L.decor, before, (x) => x.x);
    return true;
  }

  next() {
    const b = this.b;
    const legNow = Math.floor(b.x / LEG);
    if (legNow > this.leg) {
      this.crossInto(legNow);
      return;
    }
    const L = this.L;
    const leg = this.leg;
    const stage = STAGES[this.stageOfLeg(leg)];
    const speed = this.speedAt(b.x);
    const tier = this.tierAt(b.x);
    const hearts = L.pickups.length;
    const heartOk = () => tier > 0.9 && !this.heartLegs.has(leg);
    placePattern(b, this.rng, stage, this.diff, speed, tier, this.recent, heartOk);
    if (L.pickups.length > hearts) this.heartLegs.add(leg);
  }

  /** A breather, then a hop across a gap into the next landscape, past its signpost. */
  crossInto(leg) {
    const b = this.b;
    const speed = this.speedAt(b.x);
    b.x += speed * 0.5;
    const dy = Math.round(clamp(GROUND_Y - b.y, -36, 90));
    const rise = -dy;
    const reach = speed * airTimeTo(rise);
    const w = Math.round(clamp(reach * (this.diff.id === 'kids' ? 0.32 : 0.4), 80, reach * 0.6));
    const x0 = b.x;
    const y0 = b.y;
    this.leg = leg;
    b.theme = this.stageOfLeg(leg);
    b.gap(w, dy);
    b.coinArc(x0 + w / 2 - reach / 2, y0, speed, 6, rise);
    this.legs.push({ x: Math.round(x0 + w / 2), leg, stage: b.theme });
    this.L.signs.push({ x: Math.round(b.x + 90), y: b.y, stage: b.theme, leg });
    b.x += speed * 1.1;
    this.recent.length = 0;
  }

  prune(d) {
    const L = this.L;
    const cut = d - BEHIND;
    this.prunedAt = d;
    const s = segIndexAt(L, cut);
    if (s > 0) {
      L.segments.splice(0, s);
      this.decorFrom = Math.max(0, this.decorFrom - s);
    }
    const o = lowerBound(L.obstacles, cut - MAX_OB_W);
    if (o > 0) L.obstacles.splice(0, o);
    const c = lowerBound(L.coins, cut);
    if (c > 0) L.coins.splice(0, c);
    const dc = lowerBound(L.decor, cut);
    if (dc > 0) L.decor.splice(0, dc);
    L.movers = L.movers.filter((m) => m.cx > cut - 1500);
    L.pickups = L.pickups.filter((p) => p.x > cut);
    L.signs = L.signs.filter((g) => g.x > cut);
    while (this.legs.length > 2 && this.legs[1].x < cut - LEG) this.legs.shift();
  }
}

/** Sort the freshly generated tail of a list; fall back to a full sort if it overlaps the old part. */
function sortTail(arr, from, key) {
  if (arr.length - from < 2 && (from === 0 || from >= arr.length || key(arr[from]) >= key(arr[from - 1]))) return;
  const tail = arr.splice(from).sort((a, b) => key(a) - key(b));
  arr.push(...tail);
  if (from > 0 && tail.length && key(tail[0]) < key(arr[from - 1])) arr.sort((a, b) => key(a) - key(b));
}
