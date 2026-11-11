// Particles, weather and the final "camera" pass (grade, vignette, film grain).

import { clamp, lerp, mix, alpha, TAU } from './util.js';
import { hash } from './rng.js';

// ---------------------------------------------------------------- particles (world space)

export class Particles {
  constructor(max = 700) {
    this.p = [];
    this.max = max;
  }

  clear() {
    this.p.length = 0;
  }

  add(o) {
    if (this.p.length >= this.max) this.p.shift();
    o.age = 0;
    this.p.push(o);
  }

  dust(x, y, n, col, power = 1) {
    for (let i = 0; i < n; i++) {
      this.add({
        t: 'dust',
        x: x + (Math.random() - 0.5) * 10,
        y: y - Math.random() * 3,
        vx: (Math.random() - 0.7) * 60 * power,
        vy: -Math.random() * 40 * power,
        life: 0.45 + Math.random() * 0.4,
        size: 2.5 + Math.random() * 3 * power,
        col,
        g: -10,
        drag: 3,
      });
    }
  }

  sparks(x, y, n, col = '#ffe7a0') {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = 60 + Math.random() * 120;
      this.add({ t: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.35 + Math.random() * 0.25, size: 2 + Math.random() * 2, col, g: 200, drag: 4 });
    }
    this.add({ t: 'ring', x, y, vx: 0, vy: 0, life: 0.3, size: 4, col, g: 0, drag: 0 });
  }

  debris(x, y, n, cols) {
    for (let i = 0; i < n; i++) {
      this.add({
        t: 'debris',
        x,
        y,
        vx: (Math.random() - 0.3) * 260,
        vy: -120 - Math.random() * 260,
        life: 0.7 + Math.random() * 0.5,
        size: 2 + Math.random() * 3,
        col: cols[i % cols.length],
        rot: Math.random() * TAU,
        vr: (Math.random() - 0.5) * 20,
        g: 900,
        drag: 0.5,
      });
    }
  }

  splash(x, y, n, col = '#b8cfe4') {
    for (let i = 0; i < n; i++) {
      this.add({ t: 'drop', x, y, vx: (Math.random() - 0.5) * 120, vy: -80 - Math.random() * 120, life: 0.35 + Math.random() * 0.2, size: 1.2, col, g: 900, drag: 0.5 });
    }
  }

  confetti(x, y, n) {
    const cols = ['#e0644a', '#2f8f8a', '#f2c14e', '#f4efe4', '#8a6fd1'];
    for (let i = 0; i < n; i++) {
      this.add({
        t: 'confetti',
        x: x + (Math.random() - 0.5) * 40,
        y,
        vx: (Math.random() - 0.5) * 340,
        vy: -260 - Math.random() * 280,
        life: 2.2 + Math.random(),
        size: 3 + Math.random() * 2,
        col: cols[i % cols.length],
        rot: Math.random() * TAU,
        vr: (Math.random() - 0.5) * 14,
        g: 420,
        drag: 1.6,
      });
    }
  }

  float(x, y, n, col) {
    for (let i = 0; i < n; i++) {
      this.add({ t: 'heart', x: x + (Math.random() - 0.5) * 20, y, vx: (Math.random() - 0.5) * 30, vy: -60 - Math.random() * 50, life: 1.1, size: 4 + Math.random() * 3, col, g: -20, drag: 1 });
    }
  }

  update(dt) {
    const p = this.p;
    let w = 0;
    for (let i = 0; i < p.length; i++) {
      const o = p[i];
      o.age += dt;
      if (o.age >= o.life) continue;
      const d = Math.exp(-o.drag * dt);
      o.vx *= d;
      o.vy = o.vy * d + o.g * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.rot !== undefined) o.rot += o.vr * dt;
      p[w++] = o;
    }
    p.length = w;
  }

  draw(ctx) {
    for (const o of this.p) {
      const k = 1 - o.age / o.life;
      switch (o.t) {
        case 'dust': {
          ctx.fillStyle = alpha(o.col, 0.38 * k);
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.size * (1 + (1 - k) * 1.8), 0, TAU);
          ctx.fill();
          break;
        }
        case 'spark': {
          ctx.fillStyle = alpha(o.col, k);
          const s = o.size * k;
          ctx.fillRect(o.x - s, o.y - 0.6, s * 2, 1.2);
          ctx.fillRect(o.x - 0.6, o.y - s, 1.2, s * 2);
          break;
        }
        case 'ring': {
          ctx.strokeStyle = alpha(o.col, 0.8 * k);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.size + (1 - k) * 18, 0, TAU);
          ctx.stroke();
          break;
        }
        case 'debris':
        case 'confetti': {
          ctx.save();
          ctx.translate(o.x, o.y);
          ctx.rotate(o.rot);
          ctx.fillStyle = alpha(o.col, Math.min(1, k * 2));
          const sx = o.t === 'confetti' ? o.size * Math.abs(Math.cos(o.rot * 1.7)) : o.size;
          ctx.fillRect(-sx / 2, -o.size / 2, sx, o.size * (o.t === 'confetti' ? 0.6 : 1));
          ctx.restore();
          break;
        }
        case 'drop': {
          ctx.strokeStyle = alpha(o.col, 0.7 * k);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(o.x, o.y);
          ctx.lineTo(o.x - o.vx * 0.02, o.y - o.vy * 0.02);
          ctx.stroke();
          break;
        }
        case 'heart': {
          const s = o.size;
          ctx.fillStyle = alpha(o.col, k);
          ctx.beginPath();
          ctx.moveTo(o.x, o.y + s * 0.35);
          ctx.bezierCurveTo(o.x - s * 1.1, o.y - s * 0.35, o.x - s * 0.5, o.y - s * 1.05, o.x, o.y - s * 0.45);
          ctx.bezierCurveTo(o.x + s * 0.5, o.y - s * 1.05, o.x + s * 1.1, o.y - s * 0.35, o.x, o.y + s * 0.35);
          ctx.fill();
          break;
        }
        default:
      }
    }
  }
}

// ---------------------------------------------------------------- weather (screen space)

export class Weather {
  constructor(stage) {
    this.kind = stage.weather;
    this.P = stage.palette;
    this.items = [];
    this.birds = [];
    this.birdT = 3 + Math.random() * 4;
    this.tumble = null;
    this.tumbleT = 6;
    const counts = { pollen: 30, leaves: 24, sand: 70, dusk: 14, rain: 260, snow: 190, drizzle: 150, butterflies: 9, lanterns: 26, petals: 34, ash: 110, mist: 9, glowworms: 60, fireflies: 34 };
    const n = counts[this.kind] || 0;
    for (let i = 0; i < n; i++) this.items.push(this.spawn(true));
  }

  spawn(anywhere, view = { w: 1200, top: -40, bottom: 600 }) {
    const z = 0.3 + Math.random() * 0.7;
    const o = { x: Math.random() * (view.w + 100) - 50, y: anywhere ? lerp(view.top, view.bottom, Math.random()) : view.top - 20, z, ph: Math.random() * TAU, rot: Math.random() * TAU };
    if (this.kind === 'leaves') o.col = this.P.leaves[Math.floor(Math.random() * this.P.leaves.length)];
    if (this.kind === 'petals') o.col = this.P.petals[Math.floor(Math.random() * this.P.petals.length)];
    if (this.kind === 'ash') o.ember = Math.random() < 0.18;
    if (this.kind === 'glowworms' || this.kind === 'fireflies') o.y = lerp(this.kind === 'glowworms' ? 40 : 280, this.kind === 'glowworms' ? 420 : 440, Math.random());
    if (this.kind === 'mist') {
      o.y = lerp(250, 470, Math.random());
      o.r = 80 + Math.random() * 120;
    }
    if (this.kind === 'sand') o.y = lerp(view.top + 40, view.bottom, Math.random());
    if (this.kind === 'pollen' || this.kind === 'dusk') o.y = lerp(250, 430, Math.random());
    if (this.kind === 'butterflies') {
      o.y = lerp(250, 410, Math.random());
      o.col = ['#f2c14e', '#e86a3a', '#9ad0f0', '#f4f0e6', '#c86ad8'][Math.floor(Math.random() * 5)];
      o.home = o.y;
    }
    if (this.kind === 'lanterns') {
      // sky lanterns: released from the river below, drifting up and away
      o.y = anywhere ? lerp(view.top, 380, Math.random()) : view.bottom + 20;
      o.v = 9 + Math.random() * 14;
      o.z = 0.2 + Math.random() * 0.8;
    }
    return o;
  }

  update(dt, view, camDX, t, wantBirds) {
    const k = this.kind;
    for (const o of this.items) {
      const par = o.z * 0.9;
      o.x -= camDX * par;
      if (k === 'pollen' || k === 'dusk') {
        o.x += Math.sin(t * 0.6 + o.ph) * 8 * dt;
        o.y += Math.cos(t * 0.5 + o.ph) * 6 * dt - 3 * dt;
      } else if (k === 'leaves') {
        o.y += (28 + 34 * o.z) * dt;
        o.x += (Math.sin(t * 1.4 + o.ph) * 40 - 30) * dt;
        o.rot += dt * (1.5 + o.z * 2);
      } else if (k === 'sand') {
        o.x -= (260 + 180 * o.z) * dt;
        o.y += Math.sin(t * 3 + o.ph) * 10 * dt;
      } else if (k === 'rain') {
        o.y += (950 + 450 * o.z) * dt;
        o.x -= 200 * o.z * dt;
      } else if (k === 'petals') {
        o.y += (22 + 26 * o.z) * dt;
        o.x += (Math.sin(t * 1.1 + o.ph) * 36 - 40) * dt;
        o.rot += dt * (1.2 + o.z * 2.4);
      } else if (k === 'ash') {
        if (o.ember) {
          o.y -= (30 + 40 * o.z) * dt;
          o.x += Math.sin(t * 2 + o.ph) * 20 * dt;
        } else {
          o.y += (26 + 30 * o.z) * dt;
          o.x += (Math.sin(t * 0.8 + o.ph) * 14 - 20) * dt;
        }
      } else if (k === 'mist') {
        o.x -= (12 + 10 * o.z) * dt;
      } else if (k === 'glowworms' || k === 'fireflies') {
        const sp = k === 'glowworms' ? 4 : 16;
        o.x += Math.sin(t * 0.5 + o.ph) * sp * dt;
        o.y += Math.cos(t * 0.4 + o.ph * 1.3) * sp * 0.6 * dt;
      } else if (k === 'drizzle') {
        o.y += (520 + 260 * o.z) * dt;
        o.x -= 70 * o.z * dt;
      } else if (k === 'butterflies') {
        o.x += (Math.sin(t * 0.7 + o.ph) * 30 + 12) * dt;
        o.y = o.home + Math.sin(t * 1.9 + o.ph) * 18 + Math.sin(t * 5.3 + o.ph * 2) * 4;
      } else if (k === 'lanterns') {
        o.y -= o.v * (0.5 + o.z) * dt;
        o.x += Math.sin(t * 0.3 + o.ph) * 5 * dt;
      } else if (k === 'snow') {
        const gust = 60 + Math.sin(t * 0.35) * 50 + Math.sin(t * 1.3 + o.ph) * 20;
        o.y += (36 + 60 * o.z) * dt;
        o.x -= gust * o.z * dt;
        o.x += Math.sin(t * 1.1 + o.ph) * 14 * dt;
      }
      if ((k === 'pollen' || k === 'dusk') && (o.y < 230 || o.y > 440)) o.y = lerp(250, 430, Math.random());
      if (o.y > view.bottom + 20) {
        Object.assign(o, this.spawn(false, view));
      }
      const wrap = k === 'mist' ? o.r : 60; // big mist banks wrap only once fully off screen
      if (o.x < -wrap) o.x += view.w + wrap * 2;
      if (o.x > view.w + wrap) o.x -= view.w + wrap * 2;
      if (o.y < view.top - 40) {
        if (k === 'lanterns') Object.assign(o, this.spawn(false, view));
        else if (k === 'ash' && o.ember) o.y = view.bottom + 10;
        else o.y = view.bottom;
      }
    }
    if (wantBirds) {
      this.birdT -= dt;
      if (this.birdT <= 0) {
        this.birdT = 9 + Math.random() * 10;
        const n = 4 + Math.floor(Math.random() * 6);
        const y0 = 70 + Math.random() * 120;
        const dir = Math.random() < 0.7 ? -1 : 1;
        const x0 = dir < 0 ? view.w + 40 : -40;
        for (let i = 0; i < n; i++) this.birds.push({ x: x0 - dir * i * 16, y: y0 + Math.abs(i - n / 2) * 7 + Math.random() * 4, v: dir * (55 + Math.random() * 15), ph: Math.random() * TAU, s: 0.8 + Math.random() * 0.4 });
      }
    }
    for (const b of this.birds) {
      b.x += b.v * dt - camDX * 0.05;
      b.y += Math.sin(t * 2 + b.ph) * 4 * dt;
    }
    this.birds = this.birds.filter((b) => b.x > -80 && b.x < view.w + 80);
    if (k === 'sand') {
      this.tumbleT -= dt;
      if (!this.tumble && this.tumbleT <= 0) this.tumble = { x: view.w + 40, r: 9 + Math.random() * 6, rot: 0, bounce: 0 };
      if (this.tumble) {
        const tb = this.tumble;
        tb.x -= (220 * dt + camDX);
        tb.rot -= (220 * dt + camDX) / tb.r;
        tb.bounce = Math.abs(Math.sin(t * 5)) * 10;
        if (tb.x < -60) {
          this.tumble = null;
          this.tumbleT = 8 + Math.random() * 10;
        }
      }
    }
  }

  draw(ctx, view, t, camY) {
    const k = this.kind;
    const P = this.P;
    const ga = ctx.globalAlpha; // callers fade whole weather systems in and out
    if (this.birds.length) {
      ctx.strokeStyle = alpha(mix(P.ink, P.haze, 0.45), 0.85);
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      for (const b of this.birds) {
        const f = Math.sin(t * 11 + b.ph) * 4 * b.s;
        ctx.beginPath();
        ctx.moveTo(b.x - 6 * b.s, b.y - f);
        ctx.quadraticCurveTo(b.x - 2, b.y - 1, b.x, b.y);
        ctx.quadraticCurveTo(b.x + 2, b.y - 1, b.x + 6 * b.s, b.y - f);
        ctx.stroke();
      }
    }
    if (k === 'pollen' || k === 'dusk') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const o of this.items) {
        const a = (0.12 + 0.28 * (0.5 + 0.5 * Math.sin(t * 2 + o.ph))) * o.z;
        ctx.fillStyle = alpha(mix(P.light, '#ff9a40', 0.25), a);
        ctx.beginPath();
        ctx.arc(o.x, o.y, 0.6 + o.z * 1.2, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    } else if (k === 'leaves') {
      for (const o of this.items) {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rot);
        ctx.scale(Math.cos(o.rot * 1.3), 1);
        ctx.fillStyle = alpha(o.col, 0.55 + o.z * 0.4);
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.2 + o.z * 3, 1.2 + o.z * 1.4, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    } else if (k === 'sand') {
      ctx.strokeStyle = alpha('#f6dcb0', 0.28);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const o of this.items) {
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(o.x + 6 + o.z * 14, o.y + 0.5);
      }
      ctx.stroke();
      if (this.tumble) {
        const tb = this.tumble;
        const y = 420 - camY - tb.r - tb.bounce;
        ctx.save();
        ctx.translate(tb.x, y);
        ctx.rotate(tb.rot);
        ctx.strokeStyle = alpha('#6a4a2a', 0.85);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 14; i++) {
          const a = i * 2.39;
          ctx.moveTo(Math.cos(a) * tb.r * 0.2, Math.sin(a) * tb.r * 0.2);
          ctx.quadraticCurveTo(Math.cos(a + 1) * tb.r, Math.sin(a + 1) * tb.r, Math.cos(a + 2) * tb.r * 0.8, Math.sin(a + 2) * tb.r * 0.8);
        }
        ctx.stroke();
        ctx.restore();
      }
    } else if (k === 'rain') {
      ctx.lineWidth = 1;
      for (let layer = 0; layer < 2; layer++) {
        ctx.strokeStyle = alpha('#aec4da', layer ? 0.5 : 0.22);
        ctx.beginPath();
        for (const o of this.items) {
          if ((o.z > 0.65) !== !!layer) continue;
          const len = 10 + o.z * 16;
          ctx.moveTo(o.x, o.y);
          ctx.lineTo(o.x + len * 0.2, o.y - len);
        }
        ctx.stroke();
      }
    } else if (k === 'petals') {
      for (const o of this.items) {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rot);
        ctx.scale(Math.cos(o.rot * 1.6), 1);
        ctx.fillStyle = alpha(o.col, 0.6 + o.z * 0.35);
        ctx.beginPath();
        ctx.ellipse(0, 0, 1.8 + o.z * 2.4, 1.2 + o.z * 1.2, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    } else if (k === 'ash') {
      for (const o of this.items) {
        if (o.ember) {
          const f = 0.6 + 0.4 * Math.sin(t * 9 + o.ph);
          ctx.fillStyle = alpha('#ffa040', (0.4 + 0.5 * o.z) * f);
          ctx.fillRect(o.x, o.y, 1.2 + o.z * 1.4, 1.2 + o.z * 1.4);
        } else {
          ctx.fillStyle = alpha('#c8c0bc', 0.25 + o.z * 0.35);
          ctx.fillRect(o.x, o.y, 1 + o.z * 1.8, 1 + o.z * 1.2);
        }
      }
    } else if (k === 'glowworms' || k === 'fireflies') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const col = k === 'glowworms' ? P.lamp : '#e8f070';
      for (const o of this.items) {
        const blink = k === 'fireflies' ? Math.max(0, Math.sin(t * 1.7 + o.ph * 3)) : 0.55 + 0.45 * Math.sin(t * 0.9 + o.ph * 2);
        if (blink < 0.05) continue;
        const r = 1 + o.z * 1.6;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r * 5);
        g.addColorStop(0, alpha(col, 0.5 * blink * o.z));
        g.addColorStop(1, alpha(col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(o.x - r * 5, o.y - r * 5, r * 10, r * 10);
        ctx.fillStyle = alpha(col, 0.9 * blink);
        ctx.fillRect(o.x - r * 0.5, o.y - r * 0.5, r, r);
      }
      ctx.restore();
    } else if (k === 'mist') {
      for (const o of this.items) {
        const y = o.y - camY * 0.2;
        const g = ctx.createRadialGradient(o.x, y, 0, o.x, y, o.r);
        g.addColorStop(0, alpha(P.haze, 0.16 * (0.6 + o.z * 0.4)));
        g.addColorStop(1, alpha(P.haze, 0));
        ctx.fillStyle = g;
        ctx.fillRect(o.x - o.r, y - o.r, o.r * 2, o.r * 2);
      }
    } else if (k === 'drizzle') {
      ctx.lineWidth = 1;
      for (let layer = 0; layer < 2; layer++) {
        ctx.strokeStyle = alpha(mix(P.light, '#c8d8d0', 0.5), layer ? 0.32 : 0.14);
        ctx.beginPath();
        for (const o of this.items) {
          if ((o.z > 0.6) !== !!layer) continue;
          const len = 6 + o.z * 10;
          ctx.moveTo(o.x, o.y);
          ctx.lineTo(o.x + len * 0.12, o.y - len);
        }
        ctx.stroke();
      }
    } else if (k === 'butterflies') {
      for (const o of this.items) {
        const flap = Math.abs(Math.sin(t * 14 + o.ph));
        const s = 2 + o.z * 2.6;
        ctx.fillStyle = alpha(o.col, 0.55 + o.z * 0.4);
        for (const d of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(o.x + d * s * 0.6 * flap, o.y - s * 0.3, s * flap + 0.4, s * 0.8, d * 0.5, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = alpha(P.ink, 0.6);
        ctx.fillRect(o.x - 0.5, o.y - s * 0.6, 1, s * 1.1);
      }
    } else if (k === 'lanterns') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const o of this.items) {
        const r = 1.2 + o.z * 3.4;
        const flick = 0.8 + 0.2 * Math.sin(t * 7 + o.ph);
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r * 5);
        g.addColorStop(0, alpha('#ffb060', 0.32 * o.z * flick));
        g.addColorStop(1, alpha('#ffb060', 0));
        ctx.fillStyle = g;
        ctx.fillRect(o.x - r * 5, o.y - r * 5, r * 10, r * 10);
        ctx.fillStyle = alpha('#ffd890', (0.45 + 0.5 * o.z) * flick);
        ctx.beginPath();
        ctx.moveTo(o.x - r * 0.8, o.y - r);
        ctx.lineTo(o.x + r * 0.8, o.y - r);
        ctx.lineTo(o.x + r * 0.6, o.y + r);
        ctx.lineTo(o.x - r * 0.6, o.y + r);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else if (k === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const o of this.items) {
        ctx.globalAlpha = ga * (0.35 + o.z * 0.6);
        ctx.beginPath();
        ctx.arc(o.x, o.y, 0.8 + o.z * 2.2, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = ga;
    }
  }
}

// ---------------------------------------------------------------- post

export class Post {
  constructor() {
    const n = document.createElement('canvas');
    n.width = n.height = 128;
    const g = n.getContext('2d');
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() < 0.5 ? 0 : 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.random() * 34;
    }
    g.putImageData(img, 0, 0);
    this.grain = n;
    this.pattern = null;
    this.vig = null;
    this.vw = 0;
    this.vh = 0;
  }

  draw(ctx, view, P, progress, stage, quality, t) {
    // colour grade
    const g = ctx.createLinearGradient(0, view.top, 0, view.bottom);
    g.addColorStop(0, P.grade.top);
    g.addColorStop(1, P.grade.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, view.top, view.w, view.bottom - view.top);
    // time of day across the stage
    let tod = 0;
    let todCol = '#000000';
    if (stage.id === 'roofs') {
      tod = progress * 0.24;
      todCol = '#1a0f30';
    } else if (stage.id === 'snow') {
      tod = (1 - clamp(progress * 1.4, 0, 1)) * 0.28;
      todCol = '#06102a';
    } else if (stage.id === 'savanna') {
      tod = progress * 0.2;
      todCol = '#2a0a26';
    } else if (stage.id === 'canals') {
      tod = progress * 0.1;
      todCol = '#2a1430';
    } else if (stage.id === 'maple') {
      tod = progress * 0.12;
      todCol = '#3a1420';
    }
    if (tod > 0.003) {
      ctx.fillStyle = alpha(todCol, tod);
      ctx.fillRect(0, view.top, view.w, view.bottom - view.top);
    }
    // vignette (device pixels)
    const c = ctx.canvas;
    if (!this.vig || this.vw !== c.width || this.vh !== c.height) {
      this.vw = c.width;
      this.vh = c.height;
      const v = document.createElement('canvas');
      v.width = Math.max(1, Math.ceil(c.width / 4));
      v.height = Math.max(1, Math.ceil(c.height / 4));
      const vg = v.getContext('2d');
      const r = Math.hypot(v.width, v.height) / 2;
      const gr = vg.createRadialGradient(v.width / 2, v.height * 0.45, r * 0.45, v.width / 2, v.height / 2, r * 1.05);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(0,0,0,0.42)');
      vg.fillStyle = gr;
      vg.fillRect(0, 0, v.width, v.height);
      this.vig = v;
      this.pattern = null;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.vig, 0, 0, c.width, c.height);
    if (quality >= 2) {
      if (!this.pattern) this.pattern = ctx.createPattern(this.grain, 'repeat');
      const ox = Math.floor(hash(Math.floor(t * 24)) * 128);
      const oy = Math.floor(hash(Math.floor(t * 24) + 7) * 128);
      ctx.translate(-ox, -oy);
      ctx.fillStyle = this.pattern;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(ox, oy, c.width, c.height);
    }
    ctx.restore();
  }
}

/** Jagged lightning bolt from the clouds to the horizon. */
export function makeBolt(view) {
  const pts = [];
  let x = view.w * (0.3 + Math.random() * 0.6);
  let y = view.top;
  pts.push([x, y]);
  while (y < 345) {
    y += 14 + Math.random() * 22;
    x += (Math.random() - 0.5) * 36;
    pts.push([x, Math.min(y, 350)]);
  }
  const branch = [];
  const bi = Math.floor(pts.length * (0.3 + Math.random() * 0.3));
  let [bx, by] = pts[bi];
  branch.push([bx, by]);
  for (let i = 0; i < 5; i++) {
    bx += 10 + Math.random() * 18;
    by += 10 + Math.random() * 16;
    branch.push([bx, by]);
  }
  return { pts, branch };
}

export function drawBolt(ctx, bolt, k) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [w, a] of [
    [7, 0.12],
    [3, 0.45],
    [1.3, 0.95],
  ]) {
    ctx.strokeStyle = `rgba(215,228,255,${a * k})`;
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    for (const line of [bolt.pts, bolt.branch]) {
      ctx.beginPath();
      ctx.moveTo(line[0][0], line[0][1]);
      for (let i = 1; i < line.length; i++) ctx.lineTo(line[i][0], line[i][1]);
      ctx.stroke();
    }
  }
  ctx.restore();
}

