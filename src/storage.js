// Progress + settings in localStorage. Every access is guarded: private windows and blocked
// storage simply fall back to an in-memory state so the game always runs.

import { ROSTER, DEFAULT_TEAM } from './cast.js';
import { STAGES as ALL_STAGES, INSERTED_STAGES } from './stages.js';

const KEY = 'long-run-home.v1';
const STAGES = ALL_STAGES.length;
const IDS = ALL_STAGES.map((s) => s.id);
/** The order saves were made in before any stage was added mid-game (they hold no order). */
const LEGACY_IDS = IDS.filter((id) => !INSERTED_STAGES.includes(id));
const CHAPTER_ONE = 6;

function defaults() {
  const track = () => ({ unlocked: 1, stars: Array(STAGES).fill(0), coins: Array(STAGES).fill(0), endlessBest: 0, endlessCoins: 0 });
  // runner: 'a' or 'b' (one of the two team slots running alone) or 'duo'
  return { order: [...IDS], settings: { runner: 'a', team: [...DEFAULT_TEAM], names: {}, diff: 'kids', muted: false }, progress: { kids: track(), adult: track() } };
}

export function load() {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const s = JSON.parse(raw);
    // Stars and coins are kept per stage, in the order the save was made in. Saves from before
    // later chapters hold shorter arrays, and saves from before stages were added in the middle
    // hold no order at all: map everything back onto the stages by id.
    const order = Array.isArray(s.order) ? s.order : LEGACY_IDS;
    const at = new Map(order.map((id, i) => [id, i]));
    const pick = (arr, id) => (Array.isArray(arr) && at.has(id) ? arr[at.get(id)] || 0 : 0);
    const track = (def, saved = {}) => {
      const t = { ...def, ...saved };
      t.stars = IDS.map((id) => pick(saved.stars, id));
      t.coins = IDS.map((id) => pick(saved.coins, id));
      // 'unlocked' counts stages open from the start; carry it over by the last stage it opened
      const n = Math.max(1, Math.min(order.length, Number(saved.unlocked) || 1));
      const last = IDS.indexOf(order[n - 1]);
      t.unlocked = Math.max(1, Math.min(STAGES, last >= 0 ? last + 1 : 1));
      return t;
    };
    const settings = { ...d.settings, ...(s.settings || {}) };
    // saves from before the cast: 'girl' / 'boy' were Mila / Arlo running alone
    if (settings.runner === 'girl') settings.runner = 'a';
    if (settings.runner === 'boy') settings.runner = 'b';
    if (!['a', 'b', 'duo'].includes(settings.runner)) settings.runner = 'a';
    const team = Array.isArray(settings.team) ? settings.team.filter((id) => ROSTER[id]) : [];
    settings.team = team.length === 2 && team[0] !== team[1] ? team : [...DEFAULT_TEAM];
    settings.names = settings.names && typeof settings.names === 'object' ? settings.names : {};
    return {
      order: [...IDS],
      settings,
      progress: {
        kids: track(d.progress.kids, s.progress?.kids),
        adult: track(d.progress.adult, s.progress?.adult),
      },
    };
  } catch {
    return d;
  }
}

export function save(state) {
  state.order = [...IDS];
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: progress lasts for this session only */
  }
}

/** Record a finished stage; returns true if it unlocked the next one. */
export function recordResult(state, diffId, stageIndex, stars, coins) {
  const p = state.progress[diffId];
  p.stars[stageIndex] = Math.max(p.stars[stageIndex] || 0, stars);
  p.coins[stageIndex] = Math.max(p.coins[stageIndex] || 0, coins);
  const before = p.unlocked;
  p.unlocked = Math.min(STAGES, Math.max(p.unlocked, stageIndex + 2));
  save(state);
  return p.unlocked > before;
}

/** The endless road opens once the sixth stage has been cleared on that difficulty. */
export const endlessOpen = (state, diffId) => (state.progress[diffId].stars[CHAPTER_ONE - 1] || 0) > 0;

/** Record an endless run; returns true for a new best distance. */
export function recordEndless(state, diffId, metres, coins) {
  const p = state.progress[diffId];
  const best = metres > (p.endlessBest || 0);
  if (best) p.endlessBest = metres;
  p.endlessCoins = Math.max(p.endlessCoins || 0, coins);
  save(state);
  return best;
}
