import test from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTY, DT, airTimeTo } from '../src/config.js';
import { STAGES } from '../src/stages.js';
import { EndlessTrack, LEG, metres } from '../src/endless.js';
import { World } from '../src/game.js';

const snapshot = (tr, upTo) => {
  tr.ensure(upTo);
  const L = tr.L;
  return JSON.stringify([L.segments.filter((s) => s.x0 < upTo), L.obstacles.filter((o) => o.x < upTo), L.coins.filter((c) => c.x < upTo).length]);
};

test('the endless road is deterministic', () => {
  for (const d of Object.values(DIFFICULTY)) {
    assert.equal(snapshot(new EndlessTrack(d), 20000), snapshot(new EndlessTrack(d), 20000), d.id);
  }
});

test('it crosses every landscape in order, then starts over', () => {
  const tr = new EndlessTrack(DIFFICULTY.adult);
  const n = STAGES.length + 1;
  const visited = [];
  for (let d = 0; d < LEG * (n + 0.2); d += 500) {
    tr.ensure(d);
    for (const l of tr.legs) if (!visited.some((v) => v.x === l.x)) visited.push({ x: l.x, stage: l.stage });
  }
  const seen = visited.map((l) => l.stage);
  // every boundary follows the cycle, and after the last landscape the road starts over
  for (let i = 1; i < seen.length; i++) assert.equal(seen[i], (seen[i - 1] + 1) % STAGES.length);
  assert.ok(seen.length > STAGES.length, `legs visited: ${seen}`);
  assert.equal(tr.leg, n);
  assert.equal(tr.stageOfLeg(tr.leg), n % STAGES.length);
  assert.ok(tr.L.signs.length >= 1);
});

test('memory stays flat however far the road goes', () => {
  const tr = new EndlessTrack(DIFFICULTY.adult);
  let peak = 0;
  for (let d = 0; d < LEG * 20; d += 300) {
    tr.ensure(d);
    const L = tr.L;
    peak = Math.max(peak, L.segments.length + L.obstacles.length + L.coins.length + L.decor.length + L.movers.length);
    assert.ok(L.segments[0].x1 >= d - 4000, 'old ground is pruned');
    assert.ok(L.segments[L.segments.length - 1].x1 >= d + 2000, 'ground always exists ahead');
  }
  assert.ok(peak < 900, `peak ${peak} live objects`);
});

test('ground is continuous and every gap is jumpable at the speed it is met', () => {
  for (const diff of Object.values(DIFFICULTY)) {
    const tr = new EndlessTrack(diff);
    const segs = [];
    for (let d = 0; d < LEG * 8; d += 400) {
      tr.ensure(d);
      for (const s of tr.L.segments) if (!segs.length || s.x0 >= segs[segs.length - 1].x1 - 0.01) if (!segs.includes(s)) segs.push(s);
    }
    for (let i = 1; i < segs.length; i++) {
      const a = segs[i - 1];
      const b = segs[i];
      assert.ok(b.x0 >= a.x1 - 0.01, 'segments never overlap');
      const w = b.x0 - a.x1;
      if (w <= 0) continue;
      const reach = tr.speedAt(a.x1) * airTimeTo(a.y - b.y);
      assert.ok(w <= reach * 0.75, `${diff.id}: gap ${w.toFixed(0)} vs reach ${reach.toFixed(0)} at x=${a.x1.toFixed(0)}`);
    }
  }
});

for (const diffId of ['kids', 'adult']) {
  test(`the autopilot runs the endless road through every landscape on ${diffId}`, () => {
    const w = new World({ diffId, mode: 'girl', autopilot: true, endless: true });
    const legs = new Set([0]);
    w.on((t, data) => {
      if (t === 'leg') legs.add(data.leg);
    });
    const goal = LEG * (STAGES.length + 0.5);
    let steps = 0;
    // time budget grows with the road: no slower than 300 units a second on average
    while (w.d < goal && w.status === 'run' && steps < goal / 300 / DT) {
      w.update(DT);
      steps++;
    }
    const s = w.summary();
    assert.equal(w.status, 'run', `ended at ${metres(w.d)} m`);
    assert.equal(s.hits, 0, `hits: ${s.hits} by ${s.metres} m`);
    assert.equal(s.falls, 0, `falls: ${s.falls} by ${s.metres} m`);
    assert.ok(legs.size >= STAGES.length + 1, `legs seen: ${[...legs]}`);
    assert.ok(w.speed > w.track.ramp.base + 100, `speed ramps up: ${w.speed.toFixed(0)}`);
  });
}
