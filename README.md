# The Long Run Home

A hand-crafted stick-figure running game for the browser. **Mila** (stick girl) and **Arlo**
(stick boy) have one day to get home across six stages, from a sunrise meadow to a frozen
mountain pass at dawn. It plays on desktop (keyboard or gamepad) and on phones (touch). One or
two players can play, in a gentle **Kids** mode or a faster **Teen / Adult** mode.

![Title screen](docs/screenshots/title.jpg)

| | |
|---|---|
| ![Whispering Pines](docs/screenshots/pines.jpg) | ![Red Canyon](docs/screenshots/canyon.jpg) |
| ![Old Town Rooftops](docs/screenshots/rooftops.jpg) | ![Harbor Storm](docs/screenshots/harbor.jpg) |
| ![Frozen Pass](docs/screenshots/frozen-pass.jpg) | ![Home](docs/screenshots/home.jpg) |

## Play it

The game has no build step and no dependencies. ES modules need to be served over HTTP:

```bash
npm start
```

Then open <http://localhost:8080>. Any static server works too (`python3 -m http.server`).
To publish it, turn on **GitHub Pages** for the repository (Settings → Pages → deploy from the
`main` branch, root folder). The game is fully static.

## The six stages

| # | Stage | Time of day | What gets in your way |
|---|-------|-------------|-----------------------|
| 1 | Dawn Meadow | sunrise | logs, hay bales, fences, creeks, rolling hay |
| 2 | Whispering Pines | misty morning | stumps, low boughs, fallen trunks, streams, rolling logs |
| 3 | Red Canyon | midday | cacti, chasms between ledges, mine timbers, rolling boulders |
| 4 | Old Town Rooftops | sunset into dusk | alleys between roofs, chimneys, laundry lines, AC units |
| 5 | Harbor Storm | night, rain and lightning | crates, swinging cargo hooks, barrels, open water |
| 6 | Frozen Pass | night into dawn | crevasses, falling icicles, snowballs, then the cabin |

Each stage is hand-tuned data (palette, hazards, weather, music) fed to a seeded generator, so a
stage is identical every time you play it and can be learned. Finish a stage to unlock the next.
You earn up to three stars for coins collected and for running clean.

## Who it is for

|  | Kids | Teen / Adult |
|---|---|---|
| Speed | about 20% slower, gentle ramp | full speed, ramps up through the stage |
| Hazards | fewer and further apart, no moving hazards | denser patterns, rollers, falling icicles |
| Jumping | every tap is a full jump | tap for a hop, hold for a full jump |
| Getting hit | spill a few coins, keep going | lose a heart (3 solo, 5 shared in duo) |
| Falling in a pit | float back up under an umbrella | costs a heart, then the umbrella |

## Controls

| | Keyboard | Touch | Gamepad |
|---|---|---|---|
| Jump (hold = higher) | `Space` / `↑` / `W` | tap the right 60% | A / D-pad up |
| Double jump (flip) | jump again in the air | tap again | A again |
| Slide (in the air: dive) | `↓` / `S` | hold the left 40%, or swipe down | B / D-pad down |
| Pause · sound | `Esc` · `M` | pause button | Start |

**Two players on one keyboard:** Mila uses `W`/`S` and Arlo uses `↑`/`↓`. On touch, the left half
of the screen is Mila and the right half is Arlo (top = jump, bottom = slide). Two gamepads also work.

## How it is made to feel hand-made

- **Procedural animation, not sprites.** The run cycle is phase-locked to ground speed, with
  2-bone inverse kinematics for the legs, so planted feet never skate. Arms drive in opposition,
  the hips bob, the body leans with speed and squashes on landing. Jumps tuck, double jumps flip,
  slides are a proper baseball slide, and hits make the runner stumble. States cross-fade into each other.
- **Secondary motion.** Mila's ponytail and Arlo's scarf are verlet chains. They are simulated in
  the runner's frame with a head-wind and a little shape memory, so they stream and bounce at any
  frame rate.
- **Atmospheric perspective.** Every background layer is generated procedurally from periodic
  noise, so tiles loop with no seams. Layers are tinted toward the haze colour with distance,
  lit by slope, and separated by drifting fog. Far layers are painted at lower resolution so they
  soften naturally.
- **Light and weather.** Sun glow, god rays, lamp light, lightning, an aurora, lit windows,
  pollen, leaves, sand, rain and snow. A final pass adds grading, a vignette and film grain.
- **Sound.** Everything is synthesized with Web Audio: footsteps per surface, birdsong, wind,
  rain, surf, thunder, and a quiet plucked-string score (Karplus–Strong) in a generated room
  reverb. There are no audio files.
- **Typography-led UI.** Fraunces, Barlow Condensed and Caveat set the type, the stage map is a
  row of postcards, and results appear on a paper card.

## Fair by construction

Every hazard is placed from the runner's real jump arc at the speed it will be met. The coin
trails follow the exact path of a full jump, so they double as a hint for when to jump.
`tests/autopilot.test.js` drives an autopilot through **every stage on both difficulties** and
requires it to finish with **zero hits and zero falls**. The autopilot does not know the level:
it simulates candidate button presses with the same physics the player gets. So the generator can
never ship an impossible sequence. The same autopilot runs the title-screen attract mode.

```bash
npm test
```

## Project layout

```
index.html, css/style.css   screens, HUD and styling
src/config.js               physics + difficulty constants, jump math
src/stages.js               the six stages: palettes, hazards, weather, music
src/level.js                seeded level generator + spatial queries   (pure, tested)
src/runner.js               runner physics                              (pure, tested)
src/bot.js                  simulation-based autopilot                  (tested)
src/game.js                 World: speed, scoring, hearts, rescue, finish
src/figure.js               skeleton, IK, poses, hair/scarf, drawing
src/backgrounds.js          procedural parallax layers, sky, sun, aurora
src/art.js                  ground, obstacles, movers, decor, coins, finish, cabin
src/fx.js                   particles, weather, grade/vignette/grain
src/renderer.js             camera + frame composition
src/audio.js                synthesized sound and music
src/input.js                keyboard, touch, gamepad
src/storage.js              saved progress (falls back gracefully)
src/main.js                 game loop, screens, attract mode
scripts/serve.mjs           zero-dependency static server
tests/                      node:test suites
```

The design notes are in
[`docs/superpowers/specs/2026-11-08-long-run-home-design.md`](docs/superpowers/specs/2026-11-08-long-run-home-design.md).

## License

Apache-2.0, see [LICENSE](LICENSE).
