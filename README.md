# The Long Run Home

A hand-crafted stick-figure running game for the browser. **Mila** (stick girl) and **Arlo**
(stick boy) have one day to get home across six stages, from a sunrise meadow to a frozen
mountain pass at dawn. Then a postcard arrives, and chapter two takes them round the world in six
more. The long way round is an endless road through all twelve. It plays on desktop (keyboard or
gamepad) and on phones (touch). One or two players can play, in a gentle **Kids** mode or a
faster **Teen / Adult** mode.

![Title screen](docs/screenshots/title.jpg)

| | |
|---|---|
| ![Whispering Pines](docs/screenshots/pines.jpg) | ![Red Canyon](docs/screenshots/canyon.jpg) |
| ![Old Town Rooftops](docs/screenshots/rooftops.jpg) | ![Harbor Storm](docs/screenshots/harbor.jpg) |
| ![Frozen Pass](docs/screenshots/frozen-pass.jpg) | ![Home](docs/screenshots/home.jpg) |

## Play it

**Online:** <https://tanilancc.github.io/stickgirlrun/> (deployed by GitHub Pages from `main`).

**Locally:** there is no build step and no dependencies. ES modules need to be served over HTTP:

```bash
npm start
```

Then open <http://localhost:8080>. Any static server works too (`python3 -m http.server`).

### Deployment

`.github/workflows/pages.yml` runs `npm test` on every push and pull request. When the tests
pass on `main`, it publishes only the playable files (`index.html`, `css/`, `src/`) to GitHub
Pages. All paths are relative, so the game works from the `/stickgirlrun/` sub-path. It needs a
one-time setting: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Chapter one: The Long Run Home

| # | Stage | Time of day | What gets in your way |
|---|-------|-------------|-----------------------|
| 1 | Dawn Meadow | sunrise | logs, hay bales, fences, creeks, rolling hay |
| 2 | Whispering Pines | misty morning | stumps, low boughs, fallen trunks, streams, rolling logs |
| 3 | Red Canyon | midday | cacti, chasms between ledges, mine timbers, rolling boulders |
| 4 | Old Town Rooftops | sunset into dusk | alleys between roofs, chimneys, laundry lines, AC units |
| 5 | Harbor Storm | night, rain and lightning | crates, swinging cargo hooks, barrels, open water |
| 6 | Frozen Pass | night into dawn | crevasses, falling icicles, snowballs, then the cabin |

## Chapter two: Postcards from Away

Clearing the Frozen Pass opens a second chapter on the map: six places round the world, each with
its own ground, props, weather, ambience and musical mode.

| # | Stage | Time of day | What gets in your way |
|---|-------|-------------|-----------------------|
| 7 | Sand Sea | morning | clay pots, market awnings, ruined walls, sand pits, rolling urns |
| 8 | Monsoon Terraces | warm rain at noon | rice sheaves, bamboo fences and racks, straw stacks, the drop to the next paddy |
| 9 | Jungle Ruins | humid afternoon | fallen columns, carved doorways, fig roots, swinging stones, rolling stone wheels |
| 10 | Canal City | golden hour | planters, benches, café awnings, wellheads, canals between the quays, swinging lamps |
| 11 | Savanna | sunset | thorn scrub, acacia limbs, termite mounds, rolling boulders |
| 12 | Lantern Festival | night | drums, gift boxes, lantern strings, food stalls, big swinging lanterns, then the river |

| | |
|---|---|
| ![Sand Sea](docs/screenshots/sand-sea.jpg) | ![Monsoon Terraces](docs/screenshots/monsoon-terraces.jpg) |
| ![Jungle Ruins](docs/screenshots/jungle-ruins.jpg) | ![Canal City](docs/screenshots/canal-city.jpg) |
| ![Savanna](docs/screenshots/savanna.jpg) | ![Lantern Festival](docs/screenshots/lantern-festival.jpg) |

The trip ends by the river with fireworks, at a spot somebody saved:

![Worth the trip](docs/screenshots/worth-the-trip.jpg)

Each stage is hand-tuned data (palette, hazards, weather, music) fed to a seeded generator, so a
stage is identical every time you play it and can be learned. Finish a stage to unlock the next.
You earn up to three stars for coins collected and for running clean.

## The cast

Mila and Arlo are the ink-silhouette heroes of the story, but anyone in the cast can run. **Choose
from the cast** on the title screen opens a picker with eight more runners drawn from stick-figure
portraits: round heads with faces, their own hair (messy, swept, braids, curls, waves, a bob, a
ponytail), glasses, bindis, earrings, a beard, and the clothes from their pictures, from a printed
shirt and a striped polo to a cardigan, a blazer, a pinafore, a polka-dot tutu and a blue dress
with gold dots. Pick one runner for each of the two spots; solo play uses either spot, and duo uses
both. Every runner can be renamed on that screen, and the names stay on the player's device.

![The cast](docs/screenshots/cast.jpg)

They use the same skeleton, IK and physics as Mila and Arlo, so any runner can clear every stage.
Ponytails, braids and long hair are verlet chains that stream and bounce as they run. Faces and
clothes are lit by the stage, so they darken at night and pick up the outline in the dark stages.
The children in the cast are drawn a little smaller. The title screen's attract mode shows your
pair first, then random pairs from the cast.

![Two of the cast in Canal City](docs/screenshots/cast-canal.jpg)

## Endless: The Long Way Round

Clearing stage 6 opens the endless postcard on the map, and a **Keep running** button on the
ending screens. It is one unbroken road through all twelve landscapes, in order, over and over:

![Crossing from the meadow into the pines](docs/screenshots/endless-crossing.jpg)

- Every 12,000 units (about 20 seconds) the road hops a gap into the next landscape, past a
  hand-lettered signpost. The sky, weather, music and ambience cross-fade as you go.
- Speed keeps climbing landscape after landscape, then holds at a cap a person can still react
  to: 690 for Teen / Adult and 500 for Kids.
- An endless run needs an end, so hearts are limited (Kids 5, Teen / Adult 3, more in duo).
  One heart pickup appears per landscape, on top of a tall obstacle.
- Your score is the distance in metres. Your best is saved per difficulty and planted as a
  **BEST** flag on the road, so you can see yourself beat it.
- The road is generated a few seconds ahead of the runners and forgotten behind them, so memory
  stays flat (about 100 live objects) however far you run.

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
  fireworks, pollen, leaves, sand, rain, warm drizzle, butterflies, sky lanterns and snow. A final pass adds grading, a vignette and film grain.
- **Sound.** Everything is synthesized with Web Audio: footsteps per surface, birdsong, wind,
  rain, surf, thunder, and a quiet plucked-string score (Karplus–Strong) in a generated room
  reverb. There are no audio files.
- **Typography-led UI.** Fraunces, Barlow Condensed and Caveat set the type, the stage map is a
  row of postcards, and results appear on a paper card.

## Fair by construction

Every hazard is placed from the runner's real jump arc at the speed it will be met. The coin
trails follow the exact path of a full jump, so they double as a hint for when to jump.
`tests/autopilot.test.js` drives an autopilot through **every stage on both difficulties** and
requires it to finish with **zero hits and zero falls**. `tests/endless.test.js` does the same for
more than one full lap of the endless road, and checks that it is deterministic, cycles through
all twelve landscapes, keeps every gap jumpable and keeps memory flat. `tests/level.test.js`
also checks that every stage only names props that exist. The autopilot does not know the level:
it simulates candidate button presses with the same physics the player gets. So the generator can
never ship an impossible sequence. The same autopilot runs the title-screen attract mode.

```bash
npm test
```

## Project layout

```
index.html, css/style.css   screens, HUD and styling
src/config.js               physics + difficulty constants, jump math
src/stages.js               chapter one + chapters: palettes, hazards, weather, music
src/stages-world.js         chapter two, round the world
src/level.js                seeded level generator + spatial queries   (pure, tested)
src/runner.js               runner physics                              (pure, tested)
src/bot.js                  simulation-based autopilot                  (tested)
src/endless.js              endless road: streams + prunes the level, landscape legs
src/game.js                 World: speed, scoring, hearts, rescue, finish
src/cast.js                 who can run: Mila, Arlo and the portrait cast
src/figure.js               skeleton, IK, poses, hair/scarf, cast faces and clothes, drawing
src/backgrounds.js          procedural parallax layers, sky, sun, aurora
src/backgrounds-world.js    chapter two landscapes, fireworks
src/art.js                  ground, obstacles, movers, decor, coins, finish, cabin
src/art-world.js            chapter two ground, props, movers, decor, pavilion
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
