// Tuning constants. World units: the view is 540 units tall, ground line at y = 420,
// y grows downward. A runner is ~80 units tall (head to toe).

export const VIEW_H = 540;
export const MIN_VIEW_W = 760;
export const GROUND_Y = 420;
export const PIT_TRIGGER = GROUND_Y + 150;
export const DT = 1 / 120;

export const BODY = Object.freeze({
  standH: 74,
  halfW: 10,
  slideH: 30,
  slideBack: 20,
  slideFront: 22,
  tuckH: 56,
  footHalf: 9,
});

export const PHYS = Object.freeze({
  gravityRise: 2200,
  gravityFall: 2900,
  jumpV: 760,
  doubleJumpV: 690,
  jumpCut: 0.5,
  fastFallV: 1250,
  maxFall: 1700,
  buffer: 0.13,
  slideMin: 0.34,
  slideMax: 0.95,
  stepTol: 8,
  mantle: 24,
  glideGravity: 420,
  glideMaxFall: 150,
  hitInvuln: 1.6,
  hitStumble: 0.45,
  flipTime: 0.42,
});

export const DIFFICULTY = Object.freeze({
  kids: Object.freeze({
    id: 'kids',
    label: 'Kids',
    speedMul: 0.8,
    rampMul: 0.55,
    lengthMul: 0.82,
    density: 0.62,
    hearts: Infinity,
    duoHearts: Infinity,
    variableJump: false,
    coyote: 0.16,
    hazardInset: 7,
    moving: false,
    tierMul: 0.65,
    starCoins: [0.4, 0.75],
  }),
  adult: Object.freeze({
    id: 'adult',
    label: 'Teen / Adult',
    speedMul: 1,
    rampMul: 1,
    lengthMul: 1,
    density: 1,
    hearts: 3,
    duoHearts: 5,
    variableJump: true,
    coyote: 0.1,
    hazardInset: 3,
    moving: true,
    tierMul: 1,
    starCoins: [0.5, 0.8],
  }),
});

/** Analytic profile of a full-height jump (button held). */
export const JUMP = (() => {
  const tUp = PHYS.jumpV / PHYS.gravityRise;
  const peak = (PHYS.jumpV * PHYS.jumpV) / (2 * PHYS.gravityRise);
  const tDown = Math.sqrt((2 * peak) / PHYS.gravityFall);
  return Object.freeze({ tUp, peak, tDown, air: tUp + tDown });
})();

/** Height above take-off t seconds into a full jump. */
export function jumpHeightAt(t) {
  if (t <= JUMP.tUp) return PHYS.jumpV * t - 0.5 * PHYS.gravityRise * t * t;
  const u = t - JUMP.tUp;
  return JUMP.peak - 0.5 * PHYS.gravityFall * u * u;
}

/** Air time of a full jump that lands `rise` units above (negative: below) the take-off. */
export function airTimeTo(rise) {
  if (rise >= JUMP.peak) return Infinity;
  return JUMP.tUp + Math.sqrt((2 * (JUMP.peak - rise)) / PHYS.gravityFall);
}
