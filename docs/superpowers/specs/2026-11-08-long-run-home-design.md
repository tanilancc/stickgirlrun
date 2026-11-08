# The Long Run Home — design brief

## What the user asked for
"Stick girl and boy run" game for **kids and teens/adults**, **several stages**, built with
full creative freedom, and it must look **realistic / hand-crafted, not AI-coded**.

## Assumptions (made explicitly, open to correction)
- Platform: browser game (HTML5 Canvas 2D, plain ES modules, no build step, no dependencies).
  Playable on desktop (keyboard / gamepad) and phones (touch). Hostable on GitHub Pages.
- Genre: side-scrolling auto-runner with a finish line per stage (not endless), so stages can be
  learned, rated with stars and unlocked one after another.

## Story & stages
Mila (stick girl) and Arlo (stick boy) have one day to get home. Each stage is a time of day:

| # | Stage | Time | Signature hazards | Weather / mood |
|---|-------|------|-------------------|----------------|
| 1 | Dawn Meadow | sunrise | logs, hay bales, fences, creeks, rolling hay | pollen in low sun, windmill |
| 2 | Whispering Pines | misty morning | stumps, fallen trunks, streams, rolling logs | fog banks, god rays, leaves |
| 3 | Red Canyon | midday | cactus, chasms, mesa blocks, rolling boulders | heat shimmer, drifting sand |
| 4 | Old Town Rooftops | sunset | alleys between roofs, chimneys, laundry lines | low sun, birds, lit windows |
| 5 | Harbor Storm | night | crates, swinging cargo hooks, barrels, open water | rain, lightning, lighthouse |
| 6 | Frozen Pass | night → dawn | crevasses, falling icicles, snowballs | snow, aurora, ends at home |

## Audiences
- **Kids**: ~20% slower, gentler ramps, wider spacing, smaller gaps, no game over (a hit spills a
  few coins; falling into a pit floats you back up with an umbrella), full-height jumps every tap.
- **Teen / Adult**: full speed, denser patterns, moving hazards, variable-height jumps,
  3 hearts (5 shared hearts in duo), heart pickups placed in risky spots.
- **Duo**: girl and boy run side by side, same keyboard (W/S and ↑/↓), split touch screen, or two
  gamepads.

## "Not AI-looking" principles
- Procedural animation: phase-locked run cycle with 2-bone IK legs (no foot sliding), arm drive,
  hip bob, lean with speed, squash on landing, tuck-flip on double jump, baseball slide,
  stumble, umbrella glide. Ponytail and scarf are verlet chains that react to motion.
- Atmospheric perspective: every background layer is generated procedurally (periodic noise, so
  tiles loop seamlessly), tinted toward haze with distance, with fog bands between layers.
- Light: sun glow, god rays, lamp glow, lightning, aurora, film grain, vignette, grading.
- Sound: synthesized (Web Audio) footsteps per surface, wind/rain/birdsong ambience, and a
  plucked-string (Karplus-Strong) score per stage.
- UI: editorial serif + condensed grotesk + handwriting captions, postcard stage map. No neon,
  no emoji, no generic cards.

## Architecture
- `src/config.js` physics & difficulty constants, jump math shared by generator and tests.
- `src/stages.js` stage data (palettes, skins, pattern weights, music).
- `src/level.js` seeded, deterministic level generator + spatial queries. Pure, testable.
- `src/runner.js` runner physics (jump buffer, coyote time, slide, double jump, walls, pits). Pure.
- `src/bot.js` simulation-based autopilot (attract mode + fairness test).
- `src/game.js` `World`: speed, scoring, hearts, rescue, finish. Renderer-agnostic, emits events.
- Rendering: `figure.js` (skeleton + drawing), `backgrounds.js`, `art.js` (terrain, obstacles,
  decor), `fx.js` (particles, weather, post), `renderer.js` (camera + frame composition).
- `audio.js`, `input.js` (keyboard / touch / gamepad), `ui.js` (DOM screens), `storage.js`.

## Fairness guarantee (tested)
`tests/autopilot.test.js` runs the autopilot through every stage on both difficulties and requires
it to finish with zero hits and zero falls, so the generator can never produce an impossible
sequence. Unit tests cover determinism, jump physics, slide clearance and gap widths.
