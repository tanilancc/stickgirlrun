// Frame composition: camera, background, world, runners, particles, weather, post.

import { VIEW_H, MIN_VIEW_W, GROUND_Y } from './config.js';
import { groundAt, moverState } from './level.js';
import { buildBackground, drawBackground, heatShimmer } from './backgrounds.js';
import { makeTone, drawTerrain, drawObstacles, drawMovers, drawDecor, drawCoins, drawPickups, drawFinish, buildForeground } from './art.js';
import { createAnim, updateAnim, drawFigure, animLand } from './figure.js';
import { Particles, Weather, Post, makeBolt, drawBolt } from './fx.js';
import { clamp, mix, alpha } from './util.js';

const DUST = { meadow: '#cdb89a', forest: '#8a7a5a', canyon: '#e2b98a', roof: '#a89a90', harbor: '#aac4dc', snow: '#ffffff' };

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.view = { w: MIN_VIEW_W, top: 0, bottom: VIEW_H, scale: 1, offY: 0 };
    this.dpr = 1;
    this.quality = 2;
    this.particles = new Particles();
    this.post = new Post();
    this.world = null;
    this.cam = { x: 0, y: 0 };
    this.shake = 0;
    this.flash = 0;
    this.bolt = null;
    this.boltT = 0;
    this.lightningT = 6;
    this.t = 0;
    this.slowFrames = 0;
    this.onFootstep = null;
    this.onThunder = null;
    this.reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.quality >= 2 ? 2 : 1.25);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    let scale = h / VIEW_H;
    let vw = w / scale;
    let offY = 0;
    if (vw < MIN_VIEW_W) {
      scale = w / MIN_VIEW_W;
      vw = MIN_VIEW_W;
      offY = (h - VIEW_H * scale) / 2;
    }
    this.view = { w: vw, scale, offY, top: -offY / scale, bottom: VIEW_H + offY / scale };
  }

  setWorld(world) {
    this.world = world;
    const st = world.stage;
    if (!this.bg || this.bg.stage !== st) {
      this.bg = buildBackground(st);
      this.fg = buildForeground(st);
      this.tone = makeTone(st.palette);
      this.weather = new Weather(st);
    }
    this.anims = world.runners.map((r) => createAnim(r.kind));
    this.groundY = world.runners.map(() => GROUND_Y);
    this.particles.clear();
    this.cam = { x: world.d - this.anchor(), y: 0 };
    this.lastCamX = this.cam.x;
    this.slideDust = 0;
    world.on((type, data) => this.onEvent(type, data));
  }

  anchor() {
    if (this.anchorFrac) return this.view.w * this.anchorFrac;
    return clamp(this.view.w * 0.25, 170, 300);
  }

  runnerX(r) {
    return this.world.d + r.offset;
  }

  onEvent(type, data) {
    const w = this.world;
    const terr = w.stage.terrain;
    const dust = DUST[terr];
    const r = data.r;
    const x = r ? this.runnerX(r) : 0;
    switch (type) {
      case 'jump':
        this.particles.dust(x, r.y, 4, dust, 0.8);
        break;
      case 'djump':
        this.particles.add({ t: 'ring', x, y: r.y - 20, vx: 0, vy: 0, life: 0.35, size: 8, col: '#ffffff', g: 0, drag: 0 });
        break;
      case 'land':
        animLand(this.anims[data.i], data.v);
        this.particles.dust(x, r.y, Math.round(3 + data.v / 200), dust, 1 + data.v / 1400);
        if (terr === 'harbor') this.particles.splash(x, r.y, 5);
        break;
      case 'mantle':
        this.particles.dust(x + 8, r.y, 4, dust, 0.6);
        break;
      case 'coin':
        this.particles.sparks(data.x, data.y, 6);
        break;
      case 'heart':
        this.particles.float(data.x, data.y, 6, '#ff6a6a');
        break;
      case 'hit': {
        if (!this.reducedMotion) this.shake = 7;
        this.particles.debris(x + 10, r.y - 30, 10, [w.stage.palette.ink, dust, '#ffffff']);
        if (data.lost) {
          for (let k = 0; k < data.lost; k++) this.particles.add({ t: 'spark', x, y: r.y - 40, vx: -80 + Math.random() * 160, vy: -200 - Math.random() * 100, life: 0.8, size: 4, col: '#f2c14e', g: 700, drag: 0.4 });
        }
        break;
      }
      case 'rescue':
        this.particles.dust(x, r.y + 20, 10, '#ffffff', 1.4);
        break;
      case 'finish':
        this.particles.confetti(w.L.finishX, w.L.finishY - 150, 60);
        break;
      default:
    }
  }

  frame(dt, opts = {}) {
    const w = this.world;
    if (!w) return;
    this.t += dt;
    const t = this.t;
    const ctx = this.ctx;
    const view = this.view;
    const st = w.stage;
    const P = st.palette;

    // ---- simulation-side visuals
    for (let i = 0; i < w.runners.length; i++) {
      const r = w.runners[i];
      if (r.onGround && !r.down) this.groundY[i] = r.y;
      const a = this.anims[i];
      a.cheer = w.status === 'done';
      updateAnim(a, r, this.runnerX(r), r.y, w.speed, dt, (side) => {
        const fx = this.runnerX(r) + (side ? -4 : 6);
        if (Math.random() < 0.6) this.particles.dust(fx, r.y, 1, DUST[st.terrain], 0.5);
        if (st.terrain === 'harbor' && Math.random() < 0.5) this.particles.splash(fx, r.y, 2);
        if (this.onFootstep) this.onFootstep(st.surface, i);
      });
      if (r.sliding && r.onGround) {
        this.slideDust -= dt;
        if (this.slideDust <= 0) {
          this.slideDust = 0.035;
          this.particles.dust(this.runnerX(r) + 26, r.y, 1, DUST[st.terrain], 1.2);
        }
      }
    }
    this.particles.update(dt);

    // ---- camera
    // ease the anchor so switching between menus and play never jump-cuts the camera
    const anchor = this.anchor();
    this.anchorNow = this.anchorNow === undefined ? anchor : this.anchorNow + (anchor - this.anchorNow) * (1 - Math.exp(-dt * 3));
    this.cam.x = w.d - this.anchorNow;
    let gy = 0;
    let n = 0;
    for (let i = 0; i < w.runners.length; i++) {
      if (w.runners[i].down) continue;
      gy += Math.min(this.groundY[i], w.runners[i].gliding ? this.groundY[i] : 9999);
      n++;
    }
    gy = n ? gy / n : GROUND_Y;
    const ahead = groundAt(w.L, w.d + 260);
    if (ahead !== null) gy = Math.min(gy, gy * 0.6 + ahead * 0.4);
    const desired = clamp((gy - GROUND_Y) * 0.8, -190, 18);
    this.cam.y += (desired - this.cam.y) * (1 - Math.exp(-dt * 2.6));
    const camDX = this.cam.x - this.lastCamX;
    this.lastCamX = this.cam.x;
    this.shake = Math.max(0, this.shake - dt * 22);
    const shx = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    const shy = this.shake ? (Math.random() - 0.5) * this.shake : 0;

    // ---- lightning
    if (this.bg.storm) {
      this.lightningT -= dt;
      if (this.lightningT <= 0) {
        this.lightningT = 5 + Math.random() * 9;
        this.bolt = makeBolt(view);
        this.boltT = 0.22;
        this.flash = this.reducedMotion ? 0.3 : 1;
        if (this.onThunder) this.onThunder(0.4 + Math.random() * 1.1);
      }
    }
    this.flash = Math.max(0, this.flash - dt * 3.2);
    this.boltT = Math.max(0, this.boltT - dt);

    this.weather.update(dt, view, camDX, t, !!this.bg.birds || st.weather === 'pollen');

    // ---- draw
    ctx.setTransform(view.scale * this.dpr, 0, 0, view.scale * this.dpr, 0, view.offY * this.dpr);
    const progress = w.progress;
    drawBackground(ctx, this.bg, view, this.cam, t, progress, this.flash * 0.6);
    if (this.bg.shimmer && this.quality >= 2) heatShimmer(ctx, 330 - this.cam.y * 0.12, 372 - this.cam.y * 0.12, t);

    ctx.save();
    ctx.translate(-this.cam.x + shx, -this.cam.y + shy);
    const T = this.tone;
    drawTerrain(ctx, w.L, st, P, T, view, this.cam, t);
    drawDecor(ctx, w.L, P, T, view, this.cam);
    drawFinish(ctx, w.L, st, P, T, t, w.status === 'done');
    drawObstacles(ctx, w.L, st, P, T, view, this.cam, t);
    drawMovers(ctx, w.L, st, P, T, view, this.cam, w.d, t);
    this.rollerDust(w, dt);
    drawCoins(ctx, w.L, w.coinTaken, view, this.cam, t, st.id === 'harbor' || st.id === 'snow');
    drawPickups(ctx, w.L, w.pickTaken, t);

    // shadows + runners (the runner further back is drawn first)
    const order = w.runners.map((r, i) => i).sort((a, b) => w.runners[a].offset - w.runners[b].offset);
    for (const i of order) {
      const r = w.runners[i];
      const x = this.runnerX(r);
      const g = groundAt(w.L, x);
      if (g === null || r.y > g + 2) continue;
      const h = g - r.y;
      const k = clamp(1 - h / 230, 0, 1);
      ctx.fillStyle = alpha('#000000', 0.32 * k);
      ctx.beginPath();
      ctx.ellipse(x + 2, g + 1, 17 * (0.5 + 0.5 * k), 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const far = mix(P.ink, P.haze, 0.3);
    for (const i of order) {
      const r = w.runners[i];
      const blink = r.invuln > 0 && !r.gliding && w.status === 'run' && !opts.attract ? (Math.floor(t * 14) % 2 ? 0.35 : 0.95) : 1;
      drawFigure(ctx, this.anims[i], { ink: P.ink, far, outline: P.outline, alpha: blink });
    }
    this.particles.draw(ctx);
    ctx.restore();

    // foreground silhouettes (only ever below the ground line)
    const fg = this.fg;
    const fy = Math.max(GROUND_Y + 64 - this.cam.y, view.bottom - fg.h * 0.62);
    let fx = -(((this.cam.x * 1.35) % fg.w) + fg.w) % fg.w;
    ctx.globalAlpha = 0.92;
    for (; fx < view.w; fx += fg.w) ctx.drawImage(fg.canvas, fx, fy, fg.w, fg.h);
    ctx.globalAlpha = 1;

    this.weather.draw(ctx, view, t, this.cam.y);
    if (this.boltT > 0 && this.bolt) drawBolt(ctx, this.bolt, this.boltT / 0.22);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(220,230,255,${this.flash * 0.18})`;
      ctx.fillRect(0, view.top, view.w, view.bottom - view.top);
    }
    // the closing avalanche on the last stretch of the pass
    if (st.id === 'snow' && w.status === 'run' && progress > 0.82) this.drawAvalanche(ctx, view, (progress - 0.82) / 0.18, t);
    this.post.draw(ctx, view, P, progress, st, this.quality, t);

    // adaptive quality: drop resolution if frames stay slow
    if (dt > 0.024) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 1);
    if (this.slowFrames > 90 && this.quality > 1) {
      this.quality = 1;
      this.slowFrames = 0;
      this.resize();
    }
  }

  rollerDust(w, dt) {
    if (Math.random() > dt * 30) return;
    const tmp = {};
    for (const m of w.L.movers) {
      if (m.type !== 'roller' || Math.abs(m.cx - w.d) > 1400) continue;
      const s = moverState(m, w.d, tmp);
      if (s.x > this.cam.x - 50 && s.x < this.cam.x + this.view.w + 50) this.particles.dust(s.x + s.r * 0.6, m.y, 1, DUST[w.stage.terrain], 0.7);
    }
  }

  drawAvalanche(ctx, view, k, t) {
    const w = 60 + k * 70;
    const g = ctx.createLinearGradient(0, 0, w + 60, 0);
    g.addColorStop(0, 'rgba(240,246,255,0.95)');
    g.addColorStop(0.6, 'rgba(230,240,255,0.55)');
    g.addColorStop(1, 'rgba(230,240,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, view.top);
    for (let y = view.top; y <= view.bottom; y += 20) ctx.lineTo(w + Math.sin(y * 0.05 + t * 4) * 14 + Math.sin(y * 0.13 - t * 7) * 8, y);
    ctx.lineTo(0, view.bottom);
    ctx.fill();
  }
}

