import test from 'node:test';
import assert from 'node:assert/strict';
import { DT, GROUND_Y, JUMP, DIFFICULTY, PHYS } from '../src/config.js';
import { createRunner, stepRunner, NOOP } from '../src/runner.js';

const flat = (extra = {}) => ({
  segments: [{ x0: -2000, x1: 100000, y: GROUND_Y }],
  obstacles: [],
  movers: [],
  ...extra,
});

function run(L, r, inputs, steps, speed = 450, diff = DIFFICULTY.adult) {
  const ev = [];
  const all = [];
  const c = { L, diff, d: 0, dPrev: 0, events: ev };
  let minY = r.y;
  for (let k = 0; k < steps; k++) {
    c.dPrev = c.d;
    c.d += speed * DT;
    ev.length = 0;
    stepRunner(r, inputs(k) || NOOP, DT, c);
    all.push(...ev.map((e) => ({ ...e, k })));
    minY = Math.min(minY, r.y);
  }
  return { events: all, minY, d: c.d };
}

test('a held jump reaches the analytic peak and lands again', () => {
  const r = createRunner('girl');
  const { events, minY } = run(flat(), r, (k) => ({ jumpPressed: k === 0, jumpHeld: k < 60 }), 140);
  assert.ok(Math.abs(GROUND_Y - minY - JUMP.peak) < 6, `peak ${GROUND_Y - minY} vs ${JUMP.peak}`);
  assert.ok(events.some((e) => e.t === 'land'));
  assert.equal(r.onGround, true);
});

test('a tap jump is lower than a held jump (teen/adult only)', () => {
  const tap = run(flat(), createRunner('girl'), (k) => ({ jumpPressed: k === 0, jumpHeld: k < 3 }), 120);
  const kidTap = run(flat(), createRunner('girl'), (k) => ({ jumpPressed: k === 0, jumpHeld: k < 3 }), 120, 360, DIFFICULTY.kids);
  assert.ok(GROUND_Y - tap.minY < JUMP.peak * 0.6);
  assert.ok(Math.abs(GROUND_Y - kidTap.minY - JUMP.peak) < 6, 'kids always get the full jump');
});

test('double jump flips and goes higher', () => {
  const r = createRunner('boy');
  const { events, minY } = run(flat(), r, (k) => ({ jumpPressed: k === 0 || k === 40, jumpHeld: k < 80 }), 260);
  assert.ok(events.some((e) => e.t === 'djump'));
  assert.ok(GROUND_Y - minY > JUMP.peak + 60);
});

test('sliding clears an overhead bar that standing does not', () => {
  const bar = { kind: 'over', skin: 'pipe', x: 300, y: GROUND_Y - 43 - 30, w: 120, h: 30 };
  const L = flat({ obstacles: [bar] });
  const standing = run(L, createRunner('girl'), () => NOOP, 120);
  assert.ok(standing.events.some((e) => e.t === 'hit'));
  // press late enough that the minimum slide time carries the runner under the bar
  const sliding = run(L, createRunner('girl'), (k) => ({ slidePressed: k === 55, slideHeld: k >= 55 && k < 62 }), 120);
  assert.ok(!sliding.events.some((e) => e.t === 'hit'), 'slide stays down under the bar automatically');
});

test('coyote time allows a jump just after running off a ledge', () => {
  const L = { segments: [{ x0: -2000, x1: 200, y: GROUND_Y }, { x0: 380, x1: 9000, y: GROUND_Y }], obstacles: [], movers: [] };
  const r = createRunner('girl');
  // the feet leave the ledge at d ~ 209; press jump 4 steps later
  const leaveStep = Math.ceil((200 + 9) / (450 * DT));
  const { events } = run(L, r, (k) => ({ jumpPressed: k === leaveStep + 4, jumpHeld: k > leaveStep && k < leaveStep + 40 }), 160);
  assert.ok(events.some((e) => e.t === 'jump'));
  assert.ok(!events.some((e) => e.t === 'pit'));
});

test('running into a low solid hurts, landing on top does not', () => {
  const box = { kind: 'solid', skin: 'crate', x: 300, y: GROUND_Y - 50, w: 50, h: 50 };
  const L = flat({ obstacles: [box] });
  const bump = run(L, createRunner('girl'), () => NOOP, 100);
  assert.ok(bump.events.some((e) => e.t === 'hit' && e.cause === 'solid'));
  const hop = run(L, createRunner('girl'), (k) => ({ jumpPressed: k === 30, jumpHeld: k >= 30 && k < 70 }), 100);
  assert.ok(!hop.events.some((e) => e.t === 'hit'));
});

test('a falling runner triggers a pit event', () => {
  const L = { segments: [{ x0: -2000, x1: 100, y: GROUND_Y }], obstacles: [], movers: [] };
  const { events } = run(L, createRunner('girl'), () => NOOP, 200);
  assert.ok(events.some((e) => e.t === 'pit'));
  assert.ok(PHYS.glideMaxFall > 0);
});
