// Runner physics. Pure functions over plain objects so the autopilot can clone a runner
// and simulate the future with exactly the same rules the player experiences.

import { BODY, PHYS, PIT_TRIGGER, GROUND_Y } from './config.js';
import { segIndexAt, obstacleStart, moverState, groundAt } from './level.js';
import { clamp } from './util.js';

export const NOOP = Object.freeze({ jumpPressed: false, jumpHeld: false, slidePressed: false, slideHeld: false });

export function createRunner(kind, offset = 0, y = GROUND_Y) {
  return {
    kind,
    offset,
    y,
    vy: 0,
    onGround: true,
    jumps: 0,
    coyote: 0,
    buffer: 0,
    airT: 0,
    cut: false,
    sliding: false,
    slideT: 0,
    slideQueued: false,
    fastFall: false,
    flipT: -1,
    invuln: 0,
    stumble: 0,
    gliding: false,
    down: false,
    landV: 0,
    grace: 0,
  };
}

export const cloneRunner = (r) => ({ ...r });

export function runnerBox(r, x, y = r.y) {
  if (r.sliding) return { x0: x - BODY.slideBack, x1: x + BODY.slideFront, y0: y - BODY.slideH, y1: y };
  const h = r.flipT >= 0 ? BODY.tuckH : BODY.standH;
  return { x0: x - BODY.halfW, x1: x + BODY.halfW, y0: y - h, y1: y };
}

/** First surface crossed while falling from yPrev to yNew over feet span [xa, xb]. */
function supportTop(L, xa, xb, yPrev, yNew, solids) {
  let best = Infinity;
  const segs = L.segments;
  for (let i = segIndexAt(L, xa); i < segs.length; i++) {
    const s = segs[i];
    if (s.x0 >= xb) break;
    if (s.x1 > xa && s.y >= yPrev - 0.5 && s.y <= yNew && s.y < best) best = s.y;
  }
  if (solids) {
    const obs = L.obstacles;
    for (let i = obstacleStart(L, xa); i < obs.length; i++) {
      const o = obs[i];
      if (o.x >= xb) break;
      if (o.kind === 'solid' && o.x + o.w > xa && o.y >= yPrev - 0.5 && o.y <= yNew && o.y < best) best = o.y;
    }
  }
  return best === Infinity ? null : best;
}

/** Would standing up here put the head into an overhead obstacle? */
function ceilingBlocked(L, x, y, inset) {
  const x0 = x - BODY.halfW;
  const x1 = x + BODY.halfW;
  const y0 = y - BODY.standH;
  const obs = L.obstacles;
  for (let i = obstacleStart(L, x0); i < obs.length; i++) {
    const o = obs[i];
    if (o.x >= x1) break;
    if (o.kind === 'over' && o.x + o.w > x0 && o.y + o.h - inset > y0 && o.y + inset < y) return true;
  }
  return false;
}

function circleHitsBox(cx, cy, rad, b) {
  const nx = clamp(cx, b.x0, b.x1);
  const ny = clamp(cy, b.y0, b.y1);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < rad * rad;
}

const tmpState = {};

/**
 * Advance one runner by dt. c = { L, diff, d, dPrev, events }.
 * Emits events: jump, djump, slide, land, mantle, hit, pit. Damage itself is decided by the World.
 */
export function stepRunner(r, inp, dt, c) {
  const { L, diff } = c;
  const ev = c.events;
  const x = c.d + r.offset;
  const xPrev = c.dPrev + r.offset;
  r.invuln = Math.max(0, r.invuln - dt);
  r.stumble = Math.max(0, r.stumble - dt);
  r.grace = Math.max(0, r.grace - dt);

  if (r.down) {
    r.vy = Math.min(r.vy + PHYS.gravityFall * dt, PHYS.maxFall);
    const yNew = r.y + r.vy * dt;
    const top = r.vy >= 0 ? supportTop(L, x - BODY.footHalf, x + BODY.footHalf, r.y, yNew, true) : null;
    if (top !== null) {
      r.y = top;
      r.vy = 0;
      r.onGround = true;
    } else {
      r.y = yNew;
      r.onGround = false;
    }
    r.sliding = false;
    r.flipT = -1;
    return;
  }

  r.buffer = inp.jumpPressed ? PHYS.buffer : Math.max(0, r.buffer - dt);
  if (!r.onGround) {
    r.airT += dt;
    r.coyote = Math.max(0, r.coyote - dt);
  }

  if (r.gliding) {
    r.vy = Math.min(r.vy + PHYS.glideGravity * dt, PHYS.glideMaxFall);
  } else {
    if (r.buffer > 0) {
      if (r.onGround || r.coyote > 0) {
        if (!(r.sliding && ceilingBlocked(L, x, r.y, diff.hazardInset))) {
          r.vy = -PHYS.jumpV;
          r.onGround = false;
          r.coyote = 0;
          r.buffer = 0;
          r.jumps = 1;
          r.cut = false;
          r.airT = 0;
          r.sliding = false;
          r.slideQueued = false;
          r.fastFall = false;
          ev.push({ t: 'jump' });
        }
      } else if (r.jumps < 2 && r.airT > 0.05) {
        r.vy = -PHYS.doubleJumpV;
        r.jumps = 2;
        r.cut = true;
        r.buffer = 0;
        r.flipT = 0;
        r.fastFall = false;
        ev.push({ t: 'djump' });
      }
    }
    if (inp.slidePressed) {
      if (r.onGround) {
        if (!r.sliding) {
          r.sliding = true;
          r.slideT = 0;
          ev.push({ t: 'slide' });
        }
      } else {
        r.fastFall = true;
        r.slideQueued = true;
      }
    }
    if (!inp.slideHeld) r.slideQueued = false;
    if (r.sliding) {
      r.slideT += dt;
      const done = (!inp.slideHeld && r.slideT >= PHYS.slideMin) || r.slideT >= PHYS.slideMax;
      if (done && !ceilingBlocked(L, x, r.y, diff.hazardInset)) r.sliding = false;
    }
    if (diff.variableJump && r.jumps === 1 && !r.cut && r.vy < 0 && !inp.jumpHeld) {
      r.vy *= PHYS.jumpCut;
      r.cut = true;
    }
    r.vy = Math.min(r.vy + (r.vy < 0 ? PHYS.gravityRise : PHYS.gravityFall) * dt, PHYS.maxFall);
    if (r.fastFall && r.vy < PHYS.fastFallV) r.vy = PHYS.fastFallV;
  }
  if (r.flipT >= 0) {
    r.flipT += dt;
    if (r.flipT >= PHYS.flipTime) r.flipT = -1;
  }

  // ---- vertical: landing / walking off edges
  const yPrev = r.y;
  let yNew = r.y + r.vy * dt;
  if (r.vy >= 0) {
    const top = supportTop(L, x - BODY.footHalf, x + BODY.footHalf, yPrev, yNew, !r.gliding);
    if (top !== null) {
      yNew = top;
      if (!r.onGround) {
        r.landV = r.vy;
        ev.push({ t: 'land', v: r.vy });
        r.jumps = 0;
        r.cut = false;
        r.flipT = -1;
        r.fastFall = false;
        r.airT = 0;
        if (r.gliding) {
          r.gliding = false;
          r.invuln = Math.max(r.invuln, 0.6);
        }
        if (r.slideQueued && inp.slideHeld) {
          r.sliding = true;
          r.slideT = 0;
          ev.push({ t: 'slide' });
        }
        r.slideQueued = false;
      }
      r.vy = 0;
      r.onGround = true;
      r.coyote = 0;
    } else if (r.onGround) {
      r.onGround = false;
      r.coyote = diff.coyote;
      r.airT = 0;
      r.jumps = 0;
      r.sliding = false;
    }
  } else {
    r.onGround = false;
  }

  // ---- horizontal: terrain step-ups
  const front = r.sliding ? BODY.slideFront : BODY.halfW;
  const fPrev = xPrev + front;
  const fNew = x + front;
  const segs = L.segments;
  for (let i = segIndexAt(L, fPrev); i < segs.length; i++) {
    const s = segs[i];
    if (s.x0 > fNew) break;
    if (s.x0 > fPrev && s.y < yNew - PHYS.stepTol) {
      if (yNew - s.y <= PHYS.mantle) {
        // Close enough: scramble up onto the ledge.
        yNew = s.y;
        if (!r.onGround) {
          r.jumps = 0;
          r.flipT = -1;
          r.airT = 0;
        }
        r.vy = 0;
        r.onGround = true;
        r.gliding = false;
        r.stumble = Math.max(r.stumble, 0.22);
        ev.push({ t: 'mantle' });
      } else if (!r.onGround && groundAt(L, x) === null) {
        ev.push({ t: 'pit' });
      } else {
        if (!r.invuln && !r.gliding) ev.push({ t: 'hit', cause: 'wall' });
        yNew = s.y;
        r.vy = 0;
        r.onGround = true;
        r.jumps = 0;
        r.flipT = -1;
      }
    }
  }

  // ---- solid obstacle faces
  const obs = L.obstacles;
  for (let i = obstacleStart(L, fPrev); i < obs.length; i++) {
    const o = obs[i];
    if (o.x > fNew) break;
    if (o.kind !== 'solid' || o.x <= fPrev) continue;
    if (o.y < yNew - PHYS.stepTol && o.y + o.h > yNew - BODY.standH) {
      if (yNew - o.y <= 12) {
        yNew = o.y;
        r.vy = 0;
        r.onGround = true;
        r.jumps = 0;
        r.flipT = -1;
      } else if (!r.invuln && !r.gliding) {
        ev.push({ t: 'hit', cause: 'solid' });
      }
    }
  }

  // ---- hazards
  if (!r.invuln && !r.gliding) {
    const b = runnerBox(r, x, yNew);
    const ins = diff.hazardInset;
    let hit = false;
    for (let i = obstacleStart(L, b.x0); i < obs.length && !hit; i++) {
      const o = obs[i];
      if (o.x >= b.x1) break;
      if (o.kind === 'solid') continue;
      if (o.x + o.w - ins > b.x0 && o.x + ins < b.x1 && o.y + o.h - ins > b.y0 && o.y + ins < b.y1) {
        ev.push({ t: 'hit', cause: o.skin });
        hit = true;
      }
    }
    const movers = L.movers;
    for (let i = 0; i < movers.length && !hit; i++) {
      const m = movers[i];
      if (Math.abs(m.cx - x) > 1400) continue;
      const st = moverState(m, c.d, tmpState);
      if (m.type === 'icicle') {
        if (st.x + m.w / 2 - ins > b.x0 && st.x - m.w / 2 + ins < b.x1 && st.y + m.h - ins > b.y0 && st.y + ins < b.y1) hit = true;
      } else if (circleHitsBox(st.x, st.y, st.r - ins, b)) {
        hit = true;
      }
      if (hit) ev.push({ t: 'hit', cause: m.type });
    }
  }

  if (yNew > PIT_TRIGGER) ev.push({ t: 'pit' });
  r.y = yNew;
}
