// All sound is synthesized with Web Audio — no audio files.
// Footsteps per surface, ambient beds per stage (wind, birdsong, rain, surf, city hum) and a
// gentle score of Karplus-Strong plucked strings run through a generated room reverb.

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  minor: [0, 2, 3, 5, 7, 8, 10],
  minorPent: [0, 2, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  hijaz: [0, 1, 4, 5, 7, 8, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
};

const STEP = {
  grass: { f: 1700, q: 0.9, d: 0.07, g: 0.11 },
  leaf: { f: 2400, q: 0.7, d: 0.09, g: 0.12 },
  sand: { f: 3200, q: 0.6, d: 0.08, g: 0.1 },
  roof: { f: 900, q: 1.2, d: 0.06, g: 0.14, thump: 110 },
  wood: { f: 700, q: 1.4, d: 0.07, g: 0.16, thump: 130 },
  snow: { f: 2600, q: 0.5, d: 0.13, g: 0.12 },
  mud: { f: 520, q: 0.8, d: 0.11, g: 0.15, thump: 80 },
  stone: { f: 1300, q: 1.6, d: 0.05, g: 0.13, thump: 150 },
  gravel: { f: 2100, q: 0.8, d: 0.09, g: 0.13 },
};

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ks = new Map();
    this.timers = [];
    this.amb = [];
    this.music = null;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 3;
      this.master.connect(comp).connect(ctx.destination);
      this.sfx = ctx.createGain();
      this.sfx.gain.value = 0.9;
      this.sfx.connect(this.master);
      this.ambBus = ctx.createGain();
      this.ambBus.gain.value = 0.55;
      this.ambBus.connect(this.master);
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = 0.32;
      const tone = ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = 4200;
      this.musicBus.connect(tone).connect(this.master);
      this.reverb = ctx.createConvolver();
      this.reverb.buffer = this.impulse(2.4);
      const wet = ctx.createGain();
      wet.gain.value = 0.32;
      this.reverb.connect(wet).connect(this.master);
      this.musicBus.connect(this.reverb);
      const len = ctx.sampleRate * 2;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }

  impulse(sec) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return b;
  }

  // ---------------------------------------------------------------- building blocks

  env(g, t, a, peak, d) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  noiseHit({ t = this.ctx.currentTime, type = 'bandpass', f = 1000, q = 1, a = 0.002, d = 0.1, g = 0.2, sweep = null, dest = this.sfx, pan = 0 }) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const flt = ctx.createBiquadFilter();
    flt.type = type;
    flt.frequency.setValueAtTime(f, t);
    if (sweep) flt.frequency.exponentialRampToValueAtTime(sweep, t + a + d);
    flt.Q.value = q;
    const gn = ctx.createGain();
    this.env(gn, t, a, g, d);
    let node = src.connect(flt).connect(gn);
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      node = node.connect(p);
    }
    node.connect(dest);
    src.start(t, Math.random() * 1.5);
    src.stop(t + a + d + 0.05);
  }

  tone({ t = this.ctx.currentTime, type = 'sine', f = 440, f2 = null, a = 0.005, d = 0.2, g = 0.2, dest = this.sfx }) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    const gn = ctx.createGain();
    this.env(gn, t, a, g, d);
    o.connect(gn).connect(dest);
    o.start(t);
    o.stop(t + a + d + 0.05);
  }

  /** Karplus-Strong plucked string, cached per note. */
  pluckBuffer(midi) {
    let b = this.ks.get(midi);
    if (b) return b;
    const ctx = this.ctx;
    const sr = ctx.sampleRate;
    const f = mtof(midi);
    const N = Math.max(2, Math.round(sr / f));
    const len = Math.floor(sr * 2.2);
    const out = new Float32Array(len);
    const buf = new Float32Array(N);
    for (let i = 0; i < N; i++) buf[i] = Math.random() * 2 - 1;
    for (let k = 0; k < 2; k++) for (let i = 0; i < N; i++) buf[i] = (buf[i] + buf[(i + 1) % N]) * 0.5;
    const decay = 0.9985 - Math.min(0.004, f / 400000);
    let idx = 0;
    let peak = 0;
    for (let n = 0; n < len; n++) {
      const a = buf[idx];
      const nx = (idx + 1) % N;
      buf[idx] = (a + buf[nx]) * 0.5 * decay;
      out[n] = a;
      if (Math.abs(a) > peak) peak = Math.abs(a);
      idx = nx;
    }
    for (let n = 0; n < len; n++) out[n] /= peak || 1;
    b = ctx.createBuffer(1, len, sr);
    b.copyToChannel(out, 0);
    this.ks.set(midi, b);
    return b;
  }

  pluck(midi, t, vel = 0.6, dest = this.musicBus) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.pluckBuffer(midi);
    const g = ctx.createGain();
    g.gain.value = vel;
    let node = src.connect(g);
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = (Math.random() - 0.5) * 0.5;
      node = node.connect(p);
    }
    node.connect(dest);
    src.start(t);
  }

  // ---------------------------------------------------------------- effects

  step(surface) {
    if (!this.ready) return;
    const s = STEP[surface] || STEP.grass;
    const f = s.f * (0.85 + Math.random() * 0.3);
    this.noiseHit({ f, q: s.q, d: s.d, g: s.g * (0.75 + Math.random() * 0.4) });
    if (s.thump) this.tone({ f: s.thump, f2: s.thump * 0.6, d: 0.05, g: 0.08 });
  }

  jump() {
    if (!this.ready) return;
    this.noiseHit({ f: 500, sweep: 1900, q: 1.4, a: 0.02, d: 0.16, g: 0.12 });
  }

  djump() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.noiseHit({ t, f: 900, sweep: 3200, q: 1.6, a: 0.02, d: 0.2, g: 0.12 });
    for (let k = 0; k < 3; k++) this.noiseHit({ t: t + 0.05 + k * 0.06, f: 1400, q: 2, d: 0.03, g: 0.05 });
  }

  land(v) {
    if (!this.ready) return;
    const k = Math.min(1, v / 1400);
    this.tone({ f: 150, f2: 55, d: 0.1, g: 0.12 + k * 0.18 });
    this.noiseHit({ type: 'lowpass', f: 900, d: 0.08, g: 0.06 + k * 0.08 });
  }

  slide(surface) {
    if (!this.ready) return;
    const s = STEP[surface] || STEP.grass;
    this.noiseHit({ type: 'bandpass', f: s.f * 0.7, sweep: s.f * 0.4, q: 0.8, a: 0.01, d: 0.4, g: 0.1 });
  }

  coin(combo) {
    if (!this.ready) return;
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    const m = 81 + scale[Math.min(combo, scale.length - 1)];
    const t = this.ctx.currentTime;
    this.tone({ t, f: mtof(m), d: 0.32, g: 0.07 });
    this.tone({ t, f: mtof(m) * 2.76, d: 0.12, g: 0.025 });
    this.tone({ t: t + 0.01, type: 'triangle', f: mtof(m + 12), d: 0.18, g: 0.02 });
  }

  hit() {
    if (!this.ready) return;
    this.tone({ f: 120, f2: 40, d: 0.22, g: 0.32 });
    this.noiseHit({ f: 600, q: 0.8, d: 0.16, g: 0.2 });
  }

  heart() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    [76, 79, 84].forEach((m, i) => this.pluck(m, t + i * 0.07, 0.5, this.sfx));
  }

  rescue() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.noiseHit({ t, f: 300, sweep: 2400, q: 1, a: 0.05, d: 0.3, g: 0.1 });
    this.tone({ t: t + 0.05, f: 520, f2: 880, d: 0.3, g: 0.05 });
  }

  finish() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    [67, 71, 74, 79, 83].forEach((m, i) => this.pluck(m, t + i * 0.09, 0.55, this.sfx));
    this.tone({ t: t + 0.45, f: mtof(91), d: 1.2, g: 0.04 });
  }

  fail() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.pluck(64, t, 0.5, this.sfx);
    this.pluck(60, t + 0.22, 0.5, this.sfx);
    this.pluck(55, t + 0.44, 0.45, this.sfx);
  }

  thunder(delay) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + delay;
    this.noiseHit({ t, type: 'lowpass', f: 380, sweep: 90, q: 0.5, a: 0.04, d: 2.8, g: 0.5, dest: this.ambBus });
    this.noiseHit({ t: t + 0.3, type: 'lowpass', f: 200, sweep: 60, q: 0.5, a: 0.3, d: 2.2, g: 0.35, dest: this.ambBus });
  }

  click() {
    if (!this.ready) return;
    this.noiseHit({ f: 3000, q: 3, d: 0.025, g: 0.08 });
  }

  // ---------------------------------------------------------------- ambience + music

  loopNoise(type, f, q, g, lfo = null) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const flt = ctx.createBiquadFilter();
    flt.type = type;
    flt.frequency.value = f;
    flt.Q.value = q;
    const gn = ctx.createGain();
    gn.gain.value = 0;
    gn.gain.setTargetAtTime(g, ctx.currentTime, 0.8);
    src.connect(flt).connect(gn).connect(this.ambBus);
    const nodes = [src];
    if (lfo) {
      const o = ctx.createOscillator();
      o.frequency.value = lfo.rate;
      const og = ctx.createGain();
      og.gain.value = lfo.depth;
      o.connect(og).connect(lfo.target === 'gain' ? gn.gain : flt.frequency);
      o.start();
      nodes.push(o);
    }
    src.start(0, Math.random() * 1.5);
    this.amb.push({ nodes, gain: gn });
  }

  every(minS, maxS, fn) {
    const tick = () => {
      if (!this.ctx) return;
      fn();
      this.timers.push(setTimeout(tick, (minS + Math.random() * (maxS - minS)) * 1000));
    };
    this.timers.push(setTimeout(tick, (minS + Math.random() * (maxS - minS)) * 1000));
  }

  bird() {
    const ctx = this.ctx;
    let t = ctx.currentTime;
    const base = 2600 + Math.random() * 1800;
    const notes = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < notes; i++) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      const f0 = base * (0.9 + Math.random() * 0.25);
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * (1.2 + Math.random() * 0.4), t + 0.05);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.85, t + 0.1);
      const g = ctx.createGain();
      this.env(g, t, 0.01, 0.025 + Math.random() * 0.02, 0.1);
      let node = o.connect(g);
      if (ctx.createStereoPanner) {
        const p = ctx.createStereoPanner();
        p.pan.value = Math.random() * 1.6 - 0.8;
        node = node.connect(p);
      }
      node.connect(this.ambBus);
      node.connect(this.reverb);
      o.start(t);
      o.stop(t + 0.15);
      t += 0.12 + Math.random() * 0.08;
    }
  }

  startStage(stage) {
    if (!this.ctx) return;
    this.stopStage();
    const id = stage.id;
    if (id === 'meadow') {
      this.loopNoise('lowpass', 500, 0.5, 0.05, { rate: 0.08, depth: 250, target: 'freq' });
      this.every(1.2, 4, () => this.bird());
    } else if (id === 'forest') {
      this.loopNoise('bandpass', 1400, 0.4, 0.05, { rate: 0.11, depth: 600, target: 'freq' });
      this.every(1.8, 5, () => this.bird());
      this.every(9, 16, () => {
        const t = this.ctx.currentTime;
        for (let k = 0; k < 10; k++) this.noiseHit({ t: t + k * 0.06, f: 1600, q: 4, d: 0.02, g: 0.05, dest: this.ambBus, pan: 0.6 });
      });
    } else if (id === 'canyon') {
      this.loopNoise('bandpass', 520, 6, 0.09, { rate: 0.07, depth: 220, target: 'freq' });
      this.loopNoise('lowpass', 300, 0.5, 0.04);
      this.every(10, 18, () => this.tone({ f: 2300, f2: 1300, a: 0.05, d: 0.7, g: 0.025, dest: this.ambBus }));
    } else if (id === 'roofs') {
      this.loopNoise('lowpass', 160, 0.5, 0.09);
      this.loopNoise('bandpass', 900, 0.5, 0.015, { rate: 0.05, depth: 300, target: 'freq' });
      this.every(8, 15, () => {
        const t = this.ctx.currentTime;
        this.tone({ t, f: 660, d: 2, g: 0.02, dest: this.ambBus });
        this.tone({ t, f: 990, d: 1.4, g: 0.012, dest: this.ambBus });
      });
    } else if (id === 'harbor') {
      this.loopNoise('highpass', 1200, 0.3, 0.12);
      this.loopNoise('lowpass', 320, 0.6, 0.11, { rate: 0.15, depth: 0.08, target: 'gain' });
    } else if (id === 'snow') {
      this.loopNoise('lowpass', 700, 0.6, 0.11, { rate: 0.06, depth: 400, target: 'freq' });
      this.loopNoise('bandpass', 1800, 2, 0.03, { rate: 0.09, depth: 900, target: 'freq' });
    } else if (id === 'dunes') {
      // wind singing over the crests, and now and then a camel bell far off
      this.loopNoise('bandpass', 640, 5, 0.07, { rate: 0.05, depth: 260, target: 'freq' });
      this.loopNoise('highpass', 2600, 0.4, 0.025, { rate: 0.12, depth: 0.02, target: 'gain' });
      this.every(7, 14, () => {
        const t = this.ctx.currentTime;
        for (let k = 0; k < 3; k++) this.tone({ t: t + k * 0.42, type: 'triangle', f: 1180, d: 0.6, g: 0.012, dest: this.ambBus });
      });
    } else if (id === 'terraces') {
      this.loopNoise('highpass', 1800, 0.3, 0.07);
      this.loopNoise('lowpass', 420, 0.6, 0.05, { rate: 0.1, depth: 0.03, target: 'gain' });
      // frogs in the paddies
      this.every(2.5, 6, () => {
        const t = this.ctx.currentTime;
        for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k++) this.tone({ t: t + k * 0.16, type: 'square', f: 220 + Math.random() * 60, f2: 180, d: 0.06, g: 0.012, dest: this.ambBus });
      });
    } else if (id === 'ruins') {
      this.loopNoise('bandpass', 4200, 3, 0.03, { rate: 0.3, depth: 1200, target: 'freq' });
      this.loopNoise('lowpass', 380, 0.5, 0.04);
      this.every(1.4, 4, () => this.bird());
      this.every(9, 16, () => this.tone({ f: 900, f2: 1400, a: 0.08, d: 0.5, g: 0.02, dest: this.ambBus }));
    } else if (id === 'canals') {
      this.loopNoise('lowpass', 380, 0.7, 0.06, { rate: 0.18, depth: 0.04, target: 'gain' });
      this.loopNoise('bandpass', 1100, 0.6, 0.015, { rate: 0.05, depth: 300, target: 'freq' });
      this.every(9, 18, () => {
        const t = this.ctx.currentTime;
        for (let k = 0; k < 4; k++) this.tone({ t: t + k * 0.7, f: [523, 659, 587, 392][k], d: 2.4, g: 0.012, dest: this.ambBus });
      });
    } else if (id === 'savanna') {
      // dusk insects and a low, warm wind
      this.loopNoise('bandpass', 5200, 8, 0.03, { rate: 6, depth: 0.02, target: 'gain' });
      this.loopNoise('lowpass', 300, 0.5, 0.05, { rate: 0.06, depth: 120, target: 'freq' });
      this.every(5, 11, () => this.bird());
    } else if (id === 'lanterns') {
      // the crowd along the river, and fireworks thudding far off
      this.loopNoise('bandpass', 700, 0.8, 0.05, { rate: 0.2, depth: 200, target: 'freq' });
      this.loopNoise('lowpass', 260, 0.6, 0.05, { rate: 0.12, depth: 0.03, target: 'gain' });
      this.every(2.6, 5, () => {
        const t = this.ctx.currentTime;
        this.noiseHit({ t, type: 'lowpass', f: 160, q: 0.7, d: 0.5, g: 0.09, dest: this.ambBus, pan: Math.random() * 1.2 - 0.6 });
        this.noiseHit({ t: t + 0.05, type: 'highpass', f: 3000, q: 0.5, d: 0.9, g: 0.012, dest: this.ambBus });
      });
    } else if (id === 'orchard') {
      // birdsong in the blossom and the hum of the hives
      this.loopNoise('lowpass', 520, 0.5, 0.04, { rate: 0.08, depth: 200, target: 'freq' });
      this.loopNoise('bandpass', 220, 8, 0.02, { rate: 3, depth: 0.01, target: 'gain' });
      this.every(1.2, 3.5, () => this.bird());
    } else if (id === 'lavender') {
      // cicadas in the heat
      this.loopNoise('bandpass', 4600, 10, 0.035, { rate: 7, depth: 0.025, target: 'gain' });
      this.loopNoise('lowpass', 400, 0.5, 0.03);
      this.every(4, 9, () => this.bird());
    } else if (id === 'volcano') {
      // a deep rumble that never quite stops, and the hiss of vents
      this.loopNoise('lowpass', 90, 0.8, 0.16, { rate: 0.09, depth: 0.08, target: 'gain' });
      this.loopNoise('highpass', 3200, 0.4, 0.02, { rate: 0.2, depth: 0.015, target: 'gain' });
      this.every(6, 12, () => this.noiseHit({ type: 'lowpass', f: 70, q: 0.6, d: 1.4, g: 0.12, dest: this.ambBus }));
    } else if (id === 'cloudforest') {
      // dripping leaves and strange birds in the cloud
      this.loopNoise('bandpass', 1600, 0.6, 0.03, { rate: 0.1, depth: 500, target: 'freq' });
      this.every(0.8, 2.4, () => this.tone({ f: 1800 + Math.random() * 1400, f2: 900, d: 0.05, g: 0.018, dest: this.ambBus }));
      this.every(5, 10, () => this.tone({ f: 600, f2: 1200, a: 0.1, d: 0.6, g: 0.02, dest: this.ambBus }));
    } else if (id === 'maple') {
      // a waterfall somewhere below, and leaves skittering
      this.loopNoise('bandpass', 900, 0.7, 0.06, { rate: 0.12, depth: 150, target: 'freq' });
      this.loopNoise('highpass', 2600, 0.5, 0.02, { rate: 0.3, depth: 0.012, target: 'gain' });
      this.every(3, 7, () => this.bird());
    } else if (id === 'summit') {
      // thin cold wind, and the quiet of a very big sky
      this.loopNoise('bandpass', 700, 3, 0.05, { rate: 0.05, depth: 300, target: 'freq' });
      this.every(9, 16, () => {
        const t = this.ctx.currentTime;
        this.tone({ t, f: 1568, d: 2.6, g: 0.008, dest: this.ambBus });
        this.tone({ t: t + 0.4, f: 2093, d: 2.2, g: 0.006, dest: this.ambBus });
      });
    }
    this.startMusic(stage.music);
  }

  startMusic(m) {
    const ctx = this.ctx;
    const scale = SCALES[m.scale] || SCALES.major;
    const eighth = 60 / m.bpm / 2;
    const note = (deg, oct = 0) => {
      const o = Math.floor(deg / 7);
      return m.root + scale[((deg % 7) + 7) % 7] + 12 * (o + oct);
    };
    let next = ctx.currentTime + 0.4;
    let step = 0;
    let melody = 4;
    const pattern = [0, 1, 2, 1, 3, 2, 1, 2];
    const state = { stop: false };
    const id = setInterval(() => {
      if (state.stop || !this.ctx) return;
      while (next < ctx.currentTime + 0.15) {
        const bar = Math.floor(step / 8);
        const pos = step % 8;
        const deg = m.prog[bar % m.prog.length];
        const chord = [note(deg), note(deg + 2), note(deg + 4), note(deg, 1)];
        const hum = (Math.random() - 0.5) * 0.012;
        if (pos === 0) this.pluck(note(deg, -1), next + hum, 0.75);
        if (Math.random() > 0.12 || pos === 0) this.pluck(chord[pattern[pos]] + 12, next + hum, 0.28 + Math.random() * 0.18);
        if (bar % 4 >= 2 && (pos === 2 || pos === 5 || (pos === 7 && Math.random() < 0.5))) {
          melody = Math.max(0, Math.min(11, melody + Math.floor(Math.random() * 5) - 2));
          this.pluck(note(melody, 1) + 12, next + hum + 0.01, 0.22);
        }
        next += eighth * (pos % 2 ? 0.94 : 1.06);
        step++;
      }
    }, 25);
    this.music = { id, state };
  }

  stopStage() {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    if (this.music) {
      clearInterval(this.music.id);
      this.music.state.stop = true;
      this.music = null;
    }
    const now = this.ctx ? this.ctx.currentTime : 0;
    for (const a of this.amb) {
      a.gain.gain.setTargetAtTime(0, now, 0.3);
      for (const n of a.nodes) {
        try {
          n.stop(now + 1.5);
        } catch {
          /* already stopped */
        }
      }
    }
    this.amb = [];
  }
}
