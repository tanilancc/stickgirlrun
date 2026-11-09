// Progress + settings in localStorage. Every access is guarded: private windows and blocked
// storage simply fall back to an in-memory state so the game always runs.

const KEY = 'long-run-home.v1';
const STAGES = 6;

function defaults() {
  const track = () => ({ unlocked: 1, stars: Array(STAGES).fill(0), coins: Array(STAGES).fill(0), endlessBest: 0, endlessCoins: 0 });
  return { settings: { runner: 'girl', diff: 'kids', muted: false }, progress: { kids: track(), adult: track() } };
}

export function load() {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const s = JSON.parse(raw);
    return {
      settings: { ...d.settings, ...(s.settings || {}) },
      progress: {
        kids: { ...d.progress.kids, ...(s.progress?.kids || {}) },
        adult: { ...d.progress.adult, ...(s.progress?.adult || {}) },
      },
    };
  } catch {
    return d;
  }
}

export function save(state) {
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
export const endlessOpen = (state, diffId) => (state.progress[diffId].stars[STAGES - 1] || 0) > 0;

/** Record an endless run; returns true for a new best distance. */
export function recordEndless(state, diffId, metres, coins) {
  const p = state.progress[diffId];
  const best = metres > (p.endlessBest || 0);
  if (best) p.endlessBest = metres;
  p.endlessCoins = Math.max(p.endlessCoins || 0, coins);
  save(state);
  return best;
}
