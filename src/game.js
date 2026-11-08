// World: one run through one stage. Owns speed, scoring, hearts, rescues and the finish.
// Renderer-agnostic — it only emits events (jump, land, coin, hit, ...) for audio and effects.

import { STAGES } from './stages.js';
import { DIFFICULTY, GROUND_Y, PHYS } from './config.js';
import { buildLevel, speedAt, highestGround, lowerBound } from './level.js';
import { NOOP, createRunner, stepRunner, runnerBox } from './runner.js';
import { Bot } from './bot.js';
import { smooth } from './util.js';

export class World {
  constructor({ stageIndex = 0, diffId = 'adult', mode = 'girl', autopilot = false, invincible = false } = {}) {
    this.stageIndex = stageIndex;
    this.stage = STAGES[stageIndex];
    this.diff = DIFFICULTY[diffId];
    this.mode = mode;
    this.L = buildLevel(this.stage, this.diff);
    this.coinTaken = new Uint8Array(this.L.coins.length);
    this.pickTaken = new Uint8Array(this.L.pickups.length);
    const kinds = mode === 'duo' ? ['girl', 'boy'] : [mode];
    const offs = mode === 'duo' ? [34, -34] : [0];
    this.runners = kinds.map((k, i) => createRunner(k, offs[i], GROUND_Y));
    this.leadOffset = Math.max(...offs);
    this.bots = autopilot ? this.runners.map(() => new Bot(this.diff)) : null;
    this.invincible = invincible;
    this.d = 0;
    this.dPrev = 0;
    this.speed = 0;
    this.accel = 0;
    this.slow = 1;
    this.time = 0;
    this.runTime = 0;
    this.status = 'run';
    this.statusT = 0;
    this.decel = 0;
    this.coins = 0;
    this.hits = 0;
    this.falls = 0;
    this.combo = 0;
    this.comboT = 0;
    this.maxHearts = invincible ? Infinity : mode === 'duo' ? this.diff.duoHearts : this.diff.hearts;
    this.hearts = this.maxHearts;
    this.listeners = [];
    this._ev = [];
    this._ctx = { L: this.L, diff: this.diff, d: 0, dPrev: 0, events: this._ev };
  }

  get progress() {
    return Math.min(1, Math.max(0, (this.d + this.leadOffset) / this.L.length));
  }

  on(fn) {
    this.listeners.push(fn);
  }

  emit(type, data = {}) {
    for (const f of this.listeners) f(type, data, this);
  }

  update(dt, inputs) {
    this.time += dt;
    this.statusT += dt;
    this.comboT -= dt;
    if (this.comboT <= 0) this.combo = 0;
    const prevSpeed = this.speed;
    if (this.status === 'run') {
      this.runTime += dt;
      const ramp = smooth(Math.min(1, this.time / 1.2));
      this.slow = Math.min(1, this.slow + dt * 0.6);
      this.speed = speedAt(this.stage, this.diff, this.d, this.L.length) * (0.3 + 0.7 * ramp) * this.slow;
    } else if (this.status === 'failed' || this.status === 'over') {
      this.speed = Math.max(0, this.speed - 900 * dt);
    } else {
      this.speed = Math.max(0, this.speed - this.decel * dt);
    }
    this.accel = (this.speed - prevSpeed) / dt;
    this.dPrev = this.d;
    this.d += this.speed * dt;

    const c = this._ctx;
    c.d = this.d;
    c.dPrev = this.dPrev;
    for (let i = 0; i < this.runners.length; i++) {
      const r = this.runners[i];
      let inp = NOOP;
      if (this.status === 'run') inp = this.bots ? this.bots[i].decide(this, r) : (inputs && inputs[i]) || NOOP;
      this._ev.length = 0;
      stepRunner(r, inp, dt, c);
      for (let j = 0; j < this._ev.length; j++) this._handle(this._ev[j], r, i);
    }
    this._collect();

    if (this.status === 'run') {
      if (this.d + this.leadOffset >= this.L.finishX) {
        this.status = 'finishing';
        this.statusT = 0;
        const stopX = this.L.finishX + 430;
        const dist = Math.max(140, stopX - (this.d + this.leadOffset));
        this.decel = (this.speed * this.speed) / (2 * dist);
        this.emit('finish');
      }
    } else if (this.status === 'finishing' && this.speed <= 0.01) {
      this.status = 'done';
      this.statusT = 0;
      this.emit('done');
    } else if (this.status === 'failed' && this.statusT > 1.9) {
      this.status = 'over';
      this.statusT = 0;
      this.emit('over');
    }
  }

  _handle(e, r, i) {
    if (e.t === 'hit') {
      if (r.invuln > 0 || r.down) return;
      this._damage(r, i, e.cause, false);
    } else if (e.t === 'pit') {
      if (r.down) return;
      const free = this.invincible || r.grace > 0;
      if (!free) {
        this.falls++;
        this._damage(r, i, 'pit', true);
      }
      if (this.status !== 'failed') this._rescue(r, i);
    } else {
      this.emit(e.t, { r, i, v: e.v });
    }
  }

  _damage(r, i, cause, fromPit) {
    r.invuln = PHYS.hitInvuln;
    r.stumble = PHYS.hitStumble;
    if (this.invincible) {
      this.emit('hit', { r, i, cause, lost: 0, fromPit });
      return;
    }
    this.hits++;
    if (this.mode !== 'duo') this.slow = 0.55;
    let lost = 0;
    if (this.hearts === Infinity) {
      lost = Math.min(3, this.coins);
      this.coins -= lost;
    } else {
      this.hearts--;
    }
    this.emit('hit', { r, i, cause, lost, fromPit });
    if (this.hearts <= 0) {
      this.status = 'failed';
      this.statusT = 0;
      for (const q of this.runners) {
        q.down = true;
        if (!fromPit || q !== r) q.vy = Math.min(q.vy, -320);
      }
      this.emit('failed');
    }
  }

  _rescue(r, i) {
    const x = this.d + r.offset;
    const top = highestGround(this.L, x - 20, x + 650) ?? GROUND_Y;
    r.gliding = true;
    r.y = Math.min(top, GROUND_Y) - 190;
    r.vy = -40;
    r.onGround = false;
    r.sliding = false;
    r.flipT = -1;
    r.jumps = 2;
    r.fastFall = false;
    r.slideQueued = false;
    r.invuln = Math.max(r.invuln, 1.0);
    r.grace = 2.5;
    this.emit('rescue', { r, i });
  }

  _collect() {
    const coins = this.L.coins;
    for (let i = 0; i < this.runners.length; i++) {
      const r = this.runners[i];
      if (r.down) continue;
      const x = this.d + r.offset;
      const b = runnerBox(r, x);
      const R = 13;
      for (let k = lowerBound(coins, b.x0 - R); k < coins.length; k++) {
        const cn = coins[k];
        if (cn.x > b.x1 + R) break;
        if (this.coinTaken[k]) continue;
        if (cn.y > b.y0 - R && cn.y < b.y1 + R) {
          this.coinTaken[k] = 1;
          this.coins++;
          this.combo = this.comboT > 0 ? this.combo + 1 : 0;
          this.comboT = 0.6;
          this.emit('coin', { x: cn.x, y: cn.y, combo: this.combo, i });
        }
      }
      const pk = this.L.pickups;
      for (let k = 0; k < pk.length; k++) {
        const p = pk[k];
        if (this.pickTaken[k] || Math.abs(p.x - x) > 30) continue;
        if (p.y > b.y0 - 18 && p.y < b.y1 + 18) {
          this.pickTaken[k] = 1;
          if (this.hearts < this.maxHearts) this.hearts++;
          this.emit('heart', { x: p.x, y: p.y, i });
        }
      }
    }
  }

  stars() {
    if (this.status !== 'done') return 0;
    const total = this.L.coins.length || 1;
    const frac = this.coins / total;
    const [a, b] = this.diff.starCoins;
    let s = 1;
    if (frac >= a) s = 2;
    if (frac >= b && (this.hearts === Infinity || this.hits === 0)) s = 3;
    return s;
  }

  summary() {
    return {
      coins: this.coins,
      coinsTotal: this.L.coins.length,
      hits: this.hits,
      falls: this.falls,
      time: this.runTime,
      stars: this.stars(),
      hearts: this.hearts,
    };
  }
}

