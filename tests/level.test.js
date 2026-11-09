import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES } from '../src/stages.js';
import { DIFFICULTY, GROUND_Y, JUMP, airTimeTo } from '../src/config.js';
import { buildLevel, speedAt } from '../src/level.js';

const combos = STAGES.flatMap((s, i) => Object.values(DIFFICULTY).map((d) => [s, d, i]));

test('levels are deterministic', () => {
  for (const [s, d] of combos) {
    assert.equal(JSON.stringify(buildLevel(s, d)), JSON.stringify(buildLevel(s, d)), `${s.id}/${d.id}`);
  }
});

test('ground segments are ordered, non-overlapping and finish on solid ground', () => {
  for (const [s, d] of combos) {
    const L = buildLevel(s, d);
    for (let i = 1; i < L.segments.length; i++) {
      assert.ok(L.segments[i].x0 >= L.segments[i - 1].x1 - 0.01, `${s.id}/${d.id} overlap at ${i}`);
    }
    const last = L.segments[L.segments.length - 1];
    assert.ok(last.x0 < L.finishX && last.x1 > L.finishX + 1000, `${s.id}/${d.id} finish line on ground`);
  }
});

test('every pit is narrower than a full jump at the speed it is met', () => {
  for (const [s, d] of combos) {
    const L = buildLevel(s, d);
    for (let i = 1; i < L.segments.length; i++) {
      const a = L.segments[i - 1];
      const b = L.segments[i];
      const w = b.x0 - a.x1;
      if (w <= 0) continue;
      const reach = speedAt(s, d, a.x1, L.length) * airTimeTo(a.y - b.y);
      assert.ok(w <= reach * 0.75, `${s.id}/${d.id} gap ${w.toFixed(0)} vs reach ${reach.toFixed(0)}`);
    }
  }
});

test('obstacle heights respect the jump; overheads force a slide', () => {
  for (const [s, d] of combos) {
    const L = buildLevel(s, d);
    for (const o of L.obstacles) {
      if (o.kind === 'over') {
        const clearance = o.ground - (o.y + o.h);
        assert.ok(clearance >= 40 && clearance < 74, `${s.id} overhead clearance ${clearance}`);
      } else {
        assert.ok(o.h < JUMP.peak - 25, `${s.id} ${o.skin} too tall: ${o.h}`);
      }
    }
    assert.ok(L.coins.length > 80, `${s.id}/${d.id} has ${L.coins.length} coins`);
    assert.ok(L.segments.every((g) => g.y >= GROUND_Y - 220 && g.y <= GROUND_Y + 30));
  }
});

test('kids levels are gentler than teen/adult levels', () => {
  for (const s of STAGES) {
    const k = buildLevel(s, DIFFICULTY.kids);
    const a = buildLevel(s, DIFFICULTY.adult);
    // what a player feels is hazards per second, not per metre
    const perSecond = (L, d) => (L.obstacles.length + L.movers.length + L.segments.length) / (L.length / speedAt(s, d, L.length / 2, L.length));
    assert.ok(perSecond(k, DIFFICULTY.kids) < perSecond(a, DIFFICULTY.adult) * 0.85, s.id);
    assert.equal(k.movers.filter((m) => m.type !== 'swing').length, 0, 'no rollers or icicles for kids');
  }
});
