// Frame composition: camera, background, world, runners, particles, weather, post.
// Every piece of the world remembers which landscape it belongs to, so on the endless road
// ground, props and light change place by place while the sky and weather cross-fade.

import { VIEW_H, MIN_VIEW_W, GROUND_Y } from './config.js';
import { STAGES } from './stages.js';
import { groundAt, moverState, segIndexAt } from './level.js';
import { buildBackground, drawBackground, heatShimmer } from './backgrounds.js';
import { makeTone, drawTerrain, drawObstacles, drawMovers, drawDecor, drawCoins, drawPickups, drawFinish, drawSigns, drawBestFlag, buildForeground } from './art.js';
import { createAnim, updateAnim, drawFigure, animLand } from './figure.js';
import { Particles, Weather, Post, makeBolt, drawBolt } from './fx.js';
import { clamp, mix, alpha, smooth } from './util.js';

const DUST = {
  meadow: '#cdb89a', forest: '#8a7a5a', canyon: '#e2b98a', roof: '#a89a90', harbor: '#aac4dc', snow: '#ffffff',
  dunes: '#ecd2a4', terraces: '#a8b8a8', ruins: '#a8a490', canals: '#d8ccb8', savanna: '#d8a868', lanterns: '#c89a70',
};
/** Surfaces that throw up water instead of (or as well as) dust. */
const WET = new Set(['harbor', 'terraces']);
const FADE = 700;
const MAX_BGS = 3;

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
    this.kits = new Map();
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
    this.bestX = null;
    this.reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.look = (th) => this.kit(th === undefined ? this.world.stageIndex : th);
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

  /** Palette, tone and (lazily) painted background for one landscape. */
  kit(i) {
    let k = this.kits.get(i);
    if (!k) {
      const st = STAGES[i];
      k = { i, st, P: st.palette, T: makeTone(st.palette), bg: null, fg: null, used: 0 };
      this.kits.set(i, k);
    }
    return k;
  }

  /** Make sure a landscape's background is painted; keep only a few in memory. */
  painted(i) {
    const k = this.kit(i);
    k.used = this.t;
    if (!k.bg) {
      k.bg = buildBackground(k.st);
      k.fg = buildForeground(k.st);
      const live = [...this.kits.values()].filter((x) => x.bg);
      if (live.length > MAX_BGS) {
        live.sort((a, b) => a.used - b.used);
        for (const old of live.slice(0, live.length - MAX_BGS)) {
          if (old.i !== i) old.bg = old.fg = null;
        }
      }
    }
    return k;
  }

  setWorld(world) {
    this.world = world;
    this.painted(world.stageIndex);
    this.dominant = world.stageIndex;
    this.weather = new Weather(world.stage);
    this.weatherOld = null;
    this.anims = world.runners.map((r) => createAnim(r.kind));
    this.groundY = world.runners.map(() => GROUND_Y);
    this.particles.clear();
    this.cam = { x: world.d - this.anchor(), y: 0 };
    this.lastCamX = this.cam.x;
    this.slideDust = 0;
    world.on((type, data) => this.onEvent(type, data));
    if (world.endless) this.prepareNext(world);
  }

  /** Paint the next landscape during the calm runway at the start of each leg. */
  prepareNext(world) {
    setTimeout(() => {
      if (this.world !== world) return;
      this.painted((world.stageIndex + 1) % STAGES.length);
    }, 400);
  }

  anchor() {
    if (this.anchorFrac) return this.view.w * this.anchorFrac;
    return clamp(this.view.w * 0.25, 170, 300);
  }

  runnerX(r) {
    return this.world.d + r.offset;
  }

  /** Which landscapes are on screen: the one being left, the one being entered and how far between. */
  fadeState(w) {
    if (!w.endless) return { from: w.stageIndex, to: w.stageIndex, k: 1 };
    const tr = w.track;
    const x = w.d + w.leadOffset;
    const li = tr.legIndexAt(x);
    const cur = tr.legs[li];
    const nxt = tr.legs[li + 1];
    if (nxt && x > nxt.x - FADE) return { from: cur.stage, to: nxt.stage, k: (x - (nxt.x - FADE)) / (2 * FADE) };
    if (cur.x !== -Infinity && x < cur.x + FADE) {
      const prev = li > 0 ? tr.legs[li - 1].stage : (cur.stage + STAGES.length - 1) % STAGES.length;
      return { from: prev, to: cur.stage, k: 0.5 + (x - cur.x) / (2 * FADE) };
    }
    return { from: cur.stage, to: cur.stage, k: 1 };
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
        if (WET.has(terr)) this.particles.splash(x, r.y, 5);
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
      case 'leg':
        this.prepareNext(w);
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
    const fs = this.fadeState(w);
    const from = this.painted(fs.from);
    const to = this.painted(fs.to);
    const blending = fs.from !== fs.to;
    // The "dominant" landscape sets the light on the runners, the weather and the grade.
    const dom = fs.k < 0.5 ? from : to;
    const st = dom.st;
    const P = dom.P;
    if (dom.i !== this.dominant) {
      this.dominant = dom.i;
      this.weatherOld = this.weather;
      this.weatherOldK = 1;
      this.weather = new Weather(st);
    }

    // ---- simulation-side visuals
    for (let i = 0; i < w.runners.length; i++) {
      const r = w.runners[i];
      if (r.onGround && !r.down) this.groundY[i] = r.y;
      const a = this.anims[i];
      a.cheer = w.status === 'done';
      updateAnim(a, r, this.runnerX(r), r.y, w.speed, dt, (side) => {
        const fx = this.runnerX(r) + (side ? -4 : 6);
        if (Math.random() < 0.6) this.particles.dust(fx, r.y, 1, DUST[st.terrain], 0.5);
        if (WET.has(st.terrain) && Math.random() < 0.5) this.particles.splash(fx, r.y, 2);
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
      gy += this.groundY[i];
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
    if (dom.bg.storm) {
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

    const birds = (k) => !!k.bg.birds || k.st.weather === 'pollen';
    this.weather.update(dt, view, camDX, t, birds(dom));
    if (this.weatherOld) {
      this.weatherOldK -= dt / 1.4;
      if (this.weatherOldK <= 0) this.weatherOld = null;
      else this.weatherOld.update(dt, view, camDX, t, false);
    }

    // ---- draw
    const xf = [view.scale * this.dpr, 0, 0, view.scale * this.dpr, 0, view.offY * this.dpr];
    ctx.setTransform(...xf);
    const progress = w.progress;
    // On the endless road the landscape being left is at its end and the next at its start.
    const pFrom = blending ? (fs.k < 0.5 ? progress : 1) : progress;
    const pTo = blending ? (fs.k < 0.5 ? 0 : progress) : progress;
    drawBackground(ctx, from.bg, view, this.cam, t, pFrom, this.flash * 0.6);
    if (blending && fs.k > 0) this.overlayBackground(to, view, t, pTo, smooth(clamp(fs.k, 0, 1)), xf);
    if (!blending && dom.bg.shimmer && this.quality >= 2) heatShimmer(ctx, 330 - this.cam.y * 0.12, 372 - this.cam.y * 0.12, t);

    ctx.save();
    ctx.translate(-this.cam.x + shx, -this.cam.y + shy);
    const look = this.look;
    drawTerrain(ctx, w.L, look, view, this.cam, t);
    drawDecor(ctx, w.L, look, view, this.cam);
    if (w.endless) {
      drawSigns(ctx, w.L, look, view, this.cam);
      if (this.bestX && this.bestX > this.cam.x - 60 && this.bestX < this.cam.x + view.w + 60) {
        // plant the flag on solid ground: if the best ended over a pit, use the near edge
        let fx = this.bestX;
        let fy = groundAt(w.L, fx);
        if (fy === null) {
          const prev = w.L.segments[segIndexAt(w.L, fx) - 1];
          fx = prev ? prev.x1 - 8 : fx;
          fy = prev ? prev.y : GROUND_Y;
        }
        drawBestFlag(ctx, fx, fy, t, this.bestLabel);
      }
    } else {
      drawFinish(ctx, w.L, st, P, dom.T, t, w.status === 'done');
    }
    drawObstacles(ctx, w.L, look, view, this.cam, t);
    drawMovers(ctx, w.L, look, view, this.cam, w.d, t);
    this.rollerDust(w, dt, st);
    drawCoins(ctx, w.L, view, this.cam, t, st.id === 'harbor' || st.id === 'snow' || st.id === 'lanterns');
    drawPickups(ctx, w.L, t);

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
    this.drawForeground(ctx, from.fg, view, blending ? 1 - smooth(clamp(fs.k, 0, 1)) : 1);
    if (blending) this.drawForeground(ctx, to.fg, view, smooth(clamp(fs.k, 0, 1)));

    if (this.weatherOld) {
      ctx.globalAlpha = this.weatherOldK;
      this.weatherOld.draw(ctx, view, t, this.cam.y);
      ctx.globalAlpha = 1;
    }
    if (this.weatherOld) ctx.globalAlpha = 1 - this.weatherOldK;
    this.weather.draw(ctx, view, t, this.cam.y);
    ctx.globalAlpha = 1;
    if (this.boltT > 0 && this.bolt) drawBolt(ctx, this.bolt, this.boltT / 0.22);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(220,230,255,${this.flash * 0.18})`;
      ctx.fillRect(0, view.top, view.w, view.bottom - view.top);
    }
    // the closing avalanche on the last stretch of the pass
    if (!w.endless && st.id === 'snow' && w.status === 'run' && progress > 0.82) this.drawAvalanche(ctx, view, (progress - 0.82) / 0.18, t);
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

  /** Paint the incoming landscape's sky and layers off-screen, then lay it over the current one. */
  overlayBackground(kit, view, t, progress, k, xf) {
    const c = this.canvas;
    if (!this.fadeCanvas || this.fadeCanvas.width !== c.width || this.fadeCanvas.height !== c.height) {
      this.fadeCanvas = document.createElement('canvas');
      this.fadeCanvas.width = c.width;
      this.fadeCanvas.height = c.height;
    }
    const f = this.fadeCanvas.getContext('2d');
    f.setTransform(...xf);
    drawBackground(f, kit.bg, view, this.cam, t, progress, this.flash * 0.6);
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = k;
    ctx.drawImage(this.fadeCanvas, 0, 0);
    ctx.restore();
  }

  drawForeground(ctx, fg, view, a) {
    if (!fg || a <= 0.01) return;
    const fy = Math.max(GROUND_Y + 64 - this.cam.y, view.bottom - fg.h * 0.62);
    let fx = -(((this.cam.x * 1.35) % fg.w) + fg.w) % fg.w;
    ctx.globalAlpha = 0.92 * a;
    for (; fx < view.w; fx += fg.w) ctx.drawImage(fg.canvas, fx, fy, fg.w, fg.h);
    ctx.globalAlpha = 1;
  }

  rollerDust(w, dt, st) {
    if (Math.random() > dt * 30) return;
    const tmp = {};
    for (const m of w.L.movers) {
      if (m.type !== 'roller' || Math.abs(m.cx - w.d) > 1400) continue;
      const s = moverState(m, w.d, tmp);
      if (s.x > this.cam.x - 50 && s.x < this.cam.x + this.view.w + 50) this.particles.dust(s.x + s.r * 0.6, m.y, 1, DUST[st.terrain], 0.7);
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
