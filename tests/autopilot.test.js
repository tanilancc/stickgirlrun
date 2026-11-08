// Fairness guarantee: an autopilot with the same physics as the player must be able to clear
// every stage on both difficulties without a single hit or fall.
import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES } from '../src/stages.js';
import { DT } from '../src/config.js';
import { World } from '../src/game.js';

for (let i = 0; i < STAGES.length; i++) {
  for (const diffId of ['kids', 'adult']) {
    test(`stage ${i + 1} (${STAGES[i].id}) is clearable on ${diffId}`, () => {
      const w = new World({ stageIndex: i, diffId, mode: 'girl', autopilot: true });
      let steps = 0;
      while (w.status !== 'done' && w.status !== 'over' && steps < 400 / DT) {
        w.update(DT);
        steps++;
      }
      const s = w.summary();
      assert.equal(w.status, 'done', `status ${w.status} at d=${w.d.toFixed(0)}`);
      assert.equal(s.hits, 0, `hits: ${s.hits}`);
      assert.equal(s.falls, 0, `falls: ${s.falls}`);
      assert.ok(s.coins / s.coinsTotal > 0.3, `coins ${s.coins}/${s.coinsTotal}`);
    });
  }
}
