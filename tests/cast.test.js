import test from 'node:test';
import assert from 'node:assert/strict';
import { ROSTER, ROSTER_ORDER, DEFAULT_TEAM } from '../src/cast.js';
import { World } from '../src/game.js';

test('the cast screen lists every runner exactly once, and only runners that exist', () => {
  assert.equal(new Set(ROSTER_ORDER).size, ROSTER_ORDER.length);
  assert.deepEqual([...ROSTER_ORDER].sort(), Object.keys(ROSTER).sort());
  for (const id of DEFAULT_TEAM) assert.ok(ROSTER[id]);
  for (const id of ROSTER_ORDER) {
    const c = ROSTER[id];
    assert.ok(c.name && c.tag && c.accent && c.accent2, `${id} needs a name, tag and colours`);
    if (c.face) assert.ok(c.skin && c.hair && c.hair.style && c.top && c.bottom, `${id} needs a full look`);
  }
});

test('a team of two cast members runs as a duo, and one runs alone', () => {
  const duo = new World({ team: ['braids', 'curly'] });
  assert.deepEqual(duo.runners.map((r) => r.kind), ['braids', 'curly']);
  assert.equal(duo.mode, 'duo');
  const solo = new World({ team: ['tutu'], diffId: 'adult' });
  assert.deepEqual(solo.runners.map((r) => r.kind), ['tutu']);
  assert.notEqual(solo.mode, 'duo');
  assert.equal(solo.maxHearts, duo.diff.hearts);
});

test('saves from before the cast keep their progress and pick Mila or Arlo', async () => {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)) };
  mem.set('long-run-home.v1', JSON.stringify({ settings: { runner: 'boy', diff: 'adult', muted: true }, progress: { adult: { unlocked: 4, stars: [3, 2, 1, 0, 0, 0], coins: [9, 9, 9, 0, 0, 0] } } }));
  const { load } = await import('../src/storage.js');
  const s = load();
  assert.equal(s.settings.runner, 'b');
  assert.deepEqual(s.settings.team, DEFAULT_TEAM);
  assert.deepEqual(s.settings.names, {});
  assert.equal(s.progress.adult.unlocked, 4);
  assert.equal(s.progress.adult.stars.length, 12);
  assert.deepEqual(s.progress.adult.stars.slice(0, 3), [3, 2, 1]);
  // an unknown runner in a saved team falls back to the default pair
  mem.set('long-run-home.v1', JSON.stringify({ settings: { runner: 'duo', team: ['nobody', 'curly'] } }));
  assert.deepEqual(load().settings.team, DEFAULT_TEAM);
  delete globalThis.localStorage;
});
