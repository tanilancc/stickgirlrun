// Autopilot. It does not "know" the level layout: it clones the runner and simulates a
// handful of candidate button sequences with the real physics, then commits to the first one
// that survives the next ~1.25 s. It drives the title-screen attract mode and the fairness test.

import { DT } from './config.js';
import { NOOP, stepRunner, cloneRunner } from './runner.js';

const S = (t) => Math.round(t / DT);

function plan(p) {
  const q = { jk: -1, jh: 0, dk: -1, dh: 0, sk: -1, sh: 0, ...p };
  q.len = Math.max(q.jk + q.jh, q.dk + q.dh, q.sk + q.sh, 1);
  return q;
}

const ALL_PLANS = [
  plan({ jk: 0, jh: S(0.3) }),
  plan({ jk: 0, jh: S(0.14), variable: true }),
  plan({ jk: 0, jh: S(0.05), variable: true }),
  plan({ sk: 0, sh: S(0.45) }),
  plan({ sk: 0, sh: S(0.85) }),
  plan({ jk: 0, jh: S(0.3), dk: S(0.2), dh: S(0.3), fancy: true }),
  plan({ jk: 0, jh: S(0.3), dk: S(0.3), dh: S(0.3), fancy: true }),
  plan({ jk: 0, jh: S(0.3), dk: S(0.42), dh: S(0.3), fancy: true }),
  plan({ jk: 0, jh: S(0.3), dk: S(0.56), dh: S(0.3), fancy: true }),
  plan({ jk: 0, jh: S(0.12), sk: S(0.3), sh: S(0.7), fancy: true }),
];

export function planInput(p, k) {
  return {
    jumpPressed: p.jk === k || p.dk === k,
    jumpHeld: (p.jk >= 0 && k >= p.jk && k < p.jk + p.jh) || (p.dk >= 0 && k >= p.dk && k < p.dk + p.dh),
    slidePressed: p.sk === k,
    slideHeld: p.sk >= 0 && k >= p.sk && k < p.sk + p.sh,
  };
}

/** Returns the step index at which the runner would get hurt, or -1 if it stays safe. */
function simulate(world, r, p, steps) {
  const rr = cloneRunner(r);
  const ev = [];
  const c = { L: world.L, diff: world.diff, d: world.dPrev, dPrev: world.dPrev, events: ev };
  let v = world.speed;
  for (let k = 0; k < steps; k++) {
    c.dPrev = c.d;
    if (k === 0) c.d = world.d;
    else {
      v = Math.max(0, v + world.accel * DT);
      c.d += v * DT;
    }
    ev.length = 0;
    stepRunner(rr, p ? planInput(p, k) : NOOP, DT, c);
    for (let j = 0; j < ev.length; j++) {
      const t = ev[j].t;
      if (t === 'hit' || t === 'pit') return k;
    }
  }
  return -1;
}

export class Bot {
  constructor(diff) {
    this.plans = ALL_PLANS.filter((p) => diff.variableJump || !p.variable);
    this.plan = null;
    this.k = 0;
    this.tick = 0;
  }

  decide(world, r) {
    if (this.plan) {
      const inp = planInput(this.plan, this.k++);
      if (this.k >= this.plan.len) this.plan = null;
      return inp;
    }
    if (r.down || r.gliding) return NOOP;
    if (this.tick++ % 2) return NOOP;
    const H = 150;
    const f = simulate(world, r, null, H);
    if (f < 0 || f * DT > 0.66) return NOOP;
    let best = null;
    let bestF = -2;
    for (const p of this.plans) {
      const pf = simulate(world, r, p, H);
      if (pf < 0) {
        best = p;
        bestF = -1;
        break;
      }
      if (pf > bestF) {
        bestF = pf;
        best = p;
      }
    }
    // Nothing safe yet, or only a showy double jump: wait a beat — a plain jump usually opens up.
    if (bestF !== -1 && f > 4) return NOOP;
    if (bestF === -1 && best.fancy && f > S(0.3)) return NOOP;
    this.plan = best;
    this.k = 0;
    const inp = planInput(best, this.k++);
    if (this.k >= best.len) this.plan = null;
    return inp;
  }
}
