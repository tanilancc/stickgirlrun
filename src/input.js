// Keyboard, touch and gamepad, merged into per-player button states.
// Presses are latched until the next physics step reads them, so a tap is never lost.

const mk = () => ({ jumpHeld: false, slideHeld: false, jumpPressed: false, slidePressed: false, kJ: false, kS: false, tJ: 0, tS: 0, gJ: false, gS: false });

const SINGLE = {
  Space: ['jump'],
  ArrowUp: ['jump'],
  KeyW: ['jump'],
  ArrowDown: ['slide'],
  KeyS: ['slide'],
};
const DUO = {
  KeyW: [0, 'jump'],
  KeyS: [0, 'slide'],
  Space: [0, 'jump'],
  ArrowUp: [1, 'jump'],
  ArrowDown: [1, 'slide'],
};

export class Input {
  constructor(surface) {
    this.players = [mk(), mk()];
    this.duo = false;
    this.enabled = false;
    this.handlers = {};
    this.touches = new Map();
    this.padPrev = [{}, {}];
    this.usedTouch = false;

    window.addEventListener('keydown', (e) => this.key(e, true));
    window.addEventListener('keyup', (e) => this.key(e, false));
    window.addEventListener('blur', () => this.releaseAll());
    surface.addEventListener('pointerdown', (e) => this.pointer(e, 'down'));
    window.addEventListener('pointermove', (e) => this.pointer(e, 'move'));
    window.addEventListener('pointerup', (e) => this.pointer(e, 'up'));
    window.addEventListener('pointercancel', (e) => this.pointer(e, 'up'));
  }

  on(name, fn) {
    this.handlers[name] = fn;
  }

  emit(name) {
    if (this.handlers[name]) this.handlers[name]();
  }

  setMode(duo) {
    this.duo = duo;
    this.releaseAll();
  }

  releaseAll() {
    this.players = [mk(), mk()];
    this.touches.clear();
  }

  press(i, action, down, src) {
    const p = this.players[i];
    if (action === 'jump') {
      if (down && !p.jumpHeld) p.jumpPressed = true;
      if (src === 'k') p.kJ = down;
      if (src === 'g') p.gJ = down;
    } else {
      if (down && !p.slideHeld) p.slidePressed = true;
      if (src === 'k') p.kS = down;
      if (src === 'g') p.gS = down;
    }
    this.refresh(p);
  }

  refresh(p) {
    p.jumpHeld = p.kJ || p.gJ || p.tJ > 0;
    p.slideHeld = p.kS || p.gS || p.tS > 0;
  }

  key(e, down) {
    const code = e.code;
    // typing a runner's name is not playing
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (down && !e.repeat) {
      if (code === 'Escape' || code === 'KeyP') this.emit('pause');
      if (code === 'KeyM') this.emit('mute');
      if (code === 'Enter') this.emit('confirm');
    }
    if (!this.enabled) return;
    if (this.duo) {
      const m = DUO[code];
      if (!m) return;
      e.preventDefault();
      if (!e.repeat) this.press(m[0], m[1], down, 'k');
    } else {
      const m = SINGLE[code];
      if (!m) return;
      e.preventDefault();
      if (!e.repeat) this.press(0, m[0], down, 'k');
    }
  }

  zone(e) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (this.duo) {
      const player = e.clientX < w / 2 ? 0 : 1;
      return { player, action: e.clientY > h * 0.62 ? 'slide' : 'jump' };
    }
    return { player: 0, action: e.clientX < w * 0.4 ? 'slide' : 'jump' };
  }

  pointer(e, phase) {
    if (!this.enabled) return;
    if (e.pointerType === 'mouse' && phase !== 'up' && e.button > 0) return;
    if (phase === 'down') {
      this.usedTouch = this.usedTouch || e.pointerType === 'touch';
      const z = this.zone(e);
      this.touches.set(e.pointerId, { ...z, y0: e.clientY, x0: e.clientX, t0: performance.now(), swiped: false });
      this.touchDown(z.player, z.action);
      e.preventDefault();
    } else if (phase === 'move') {
      const tc = this.touches.get(e.pointerId);
      if (!tc || tc.swiped) return;
      const dy = e.clientY - tc.y0;
      if (dy > 34 && tc.action === 'jump' && performance.now() - tc.t0 < 260) {
        // a downward swipe on the jump side turns into a slide
        tc.swiped = true;
        this.touchUp(tc.player, 'jump');
        tc.action = 'slide';
        this.touchDown(tc.player, 'slide');
      }
    } else {
      const tc = this.touches.get(e.pointerId);
      if (!tc) return;
      this.touches.delete(e.pointerId);
      this.touchUp(tc.player, tc.action);
    }
  }

  touchDown(i, action) {
    const p = this.players[i];
    if (action === 'jump') {
      if (!p.jumpHeld) p.jumpPressed = true;
      p.tJ++;
    } else {
      if (!p.slideHeld) p.slidePressed = true;
      p.tS++;
    }
    this.refresh(p);
  }

  touchUp(i, action) {
    const p = this.players[i];
    if (action === 'jump') p.tJ = Math.max(0, p.tJ - 1);
    else p.tS = Math.max(0, p.tS - 1);
    this.refresh(p);
  }

  pollPads() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let idx = 0;
    for (const pad of pads) {
      if (!pad || idx > 1) continue;
      const player = this.duo ? idx : 0;
      const prev = this.padPrev[idx];
      const j = !!(pad.buttons[0]?.pressed || pad.buttons[12]?.pressed || pad.axes[1] < -0.6);
      const s = !!(pad.buttons[1]?.pressed || pad.buttons[13]?.pressed || pad.axes[1] > 0.6);
      const start = !!pad.buttons[9]?.pressed;
      if (this.enabled) {
        if (j !== !!prev.j) this.press(player, 'jump', j, 'g');
        if (s !== !!prev.s) this.press(player, 'slide', s, 'g');
      }
      if (start && !prev.start) this.emit('pause');
      if (j && !prev.j && !this.enabled) this.emit('confirm');
      this.padPrev[idx] = { j, s, start };
      idx++;
    }
  }

  /** Read (and clear the latched presses of) one player's buttons. */
  sample(i) {
    const p = this.players[i];
    const out = { jumpPressed: p.jumpPressed, jumpHeld: p.jumpHeld, slidePressed: p.slidePressed, slideHeld: p.slideHeld };
    p.jumpPressed = false;
    p.slidePressed = false;
    return out;
  }
}
