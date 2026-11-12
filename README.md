# The Long Run Home

A hand-crafted stick-figure running game for the browser. **Mila** (stick girl) and **Arlo**
(stick boy) have one day to get home across six stages, from a sunrise meadow to a frozen
mountain pass at dawn. Then a postcard arrives, and chapter two takes them round the world in six
more. Chapter three climbs through wild places to a summit under falling stars and down the other
side to a turquoise lake, and chapter four runs down to the sea, ending at a bonfire on the beach. Chapter five brings them home again,
to the same cabin on a summer evening, and chapter six follows a poster on the gate to the harvest
fair, three valleys over. Chapter seven brings the first snow, and ends in the town square on
midwinter night. The long way round is an endless road through all forty-five. It plays
on desktop (keyboard or gamepad) and on phones (touch). One or two players can play, in a gentle **Kids** mode or a
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

## Chapter three: Under Open Skies

Clearing the Lantern Festival opens the third chapter: nine wild places, from spring blossom to a
mountain top at night, and then the long way down the next day.

| # | Stage | Time of day | What gets in your way |
|---|-------|-------------|-----------------------|
| 13 | Blossom Orchard | spring morning | beehives, wheelbarrows of apples, blossom boughs, hay carts, rolling cart wheels |
| 14 | Lavender Fields | summer noon | lavender bundles, dry-stone walls, vine arbours, lavender carts, rolling cheese wheels |
| 15 | Fire Island | smoky afternoon | basalt and pumice, rock arches, basalt columns, lava pits, rolling lava bombs, glowing rocks falling from overhangs |
| 16 | Cloud Forest | misty morning | mossy logs, tree ferns, moss-bearded trunks, giant stumps, drops into the cloud, swinging stones |
| 17 | Maple Gorge | autumn afternoon | pumpkins, maple limbs, log piles, a river gorge, rolling pumpkins |
| 18 | Starlight Summit | clear night | cairns, fairy-light strings, crevasses, rolling boulders, the observatory |
| 19 | Cowbell Pasture | sunrise | woodpiles, zigzag rail fences, milk churns, a gate hung with cowbells, firewood stacks, rolling cheese wheels |
| 20 | Cliff Path | morning | scree, chain posts, an overhanging cliff, rocks with iron rungs, gaps over the gorge, rolling boulders |
| 21 | Turquoise Lake | noon | upturned boats, drowned roots, pine boughs, a jetty, rolling logs, then the boathouse |

| | |
|---|---|
| ![Blossom Orchard](docs/screenshots/blossom-orchard.jpg) | ![Lavender Fields](docs/screenshots/lavender-fields.jpg) |
| ![Fire Island](docs/screenshots/fire-island.jpg) | ![Cloud Forest](docs/screenshots/cloud-forest.jpg) |
| ![Maple Gorge](docs/screenshots/maple-gorge.jpg) | ![Starlight Summit](docs/screenshots/starlight-summit.jpg) |

The summit has the Milky Way overhead and a meteor shower that builds as you reach the
observatory, where someone has the telescope out:

![The top of the world](docs/screenshots/top-of-the-world.jpg)

The next morning the peaks turn pink over a pasture full of cowbells. The path down is cut into
a cliff, with a waterfall across the gorge, and it ends at a lake so blue it looks painted:

| | |
|---|---|
| ![Cowbell Pasture](docs/screenshots/cowbell-pasture.jpg) | ![Cliff Path](docs/screenshots/cliff-path.jpg) |
| ![Turquoise Lake](docs/screenshots/turquoise-lake.jpg) | ![The long way down](docs/screenshots/the-long-way-down.jpg) |

## Chapter four: Down to the Sea

Clearing the summit opens the last chapter: down from the mountains to the coast, and a fire on
the beach where everybody is waiting.

| # | Stage | Time of day | What gets in your way |
|---|-------|-------------|-----------------------|
| 22 | Mirror Flats | dawn | salt piles, salt bricks, pennant lines, brine pools, rolling tumbleweed |
| 23 | Palm Beach | late morning | sandcastles, coolers, surfboards, beach umbrellas, a lifeguard tower, rolling beach balls |
| 24 | Mangrove Lagoon | hot noon | crab traps, rope coils, canoes, mangrove roots, stilt huts, swinging nets, open water |
| 25 | Glow Caves | low tide, underground | glowing crystals, low cave roofs, rock columns, rolling geodes, falling stalactites |
| 26 | Stilt Village | golden hour | lobster pots, nets drying, bait sheds, swinging pots, rolling buoys, open water |
| 27 | Bonfire Point | night | driftwood, dunes, a shell-hung driftwood arch, then the fire on the beach |

| | |
|---|---|
| ![Mirror Flats](docs/screenshots/mirror-flats.jpg) | ![Palm Beach](docs/screenshots/palm-beach.jpg) |
| ![Mangrove Lagoon](docs/screenshots/mangrove-lagoon.jpg) | ![Glow Caves](docs/screenshots/glow-caves.jpg) |
| ![Stilt Village](docs/screenshots/stilt-village.jpg) | ![Bonfire Point](docs/screenshots/bonfire-point.jpg) |

On the Mirror Flats a skin of water turns the salt into a mirror: the mountains, flamingos and the
runners themselves are reflected in it. The trip ends at a bonfire under a lighthouse:

![Everyone, together](docs/screenshots/everyone-together.jpg)

## Chapter five: Home Again

Clearing Bonfire Point opens the last chapter: six more places on the way back, ending where the
story began, at the cabin from chapter one, now on a summer evening.

| # | Stage | Time of day | What gets in your way |
|---|-------|-------------|-----------------------|
| 28 | Geyser Basin | steamy morning | sinter mounds, boiling vents, trail signs, travertine terraces, hot springs, rolling logs |
| 29 | Bamboo Forest | green noon | bamboo bundles, cut stumps, leaning culms, bamboo platforms, a swinging bucket |
| 30 | Painted Hills | hot afternoon | balanced rocks, sagebrush, striped arches and buttes, rolling boulders |
| 31 | Tulip Fields | spring evening | crates of tulips, parked bikes, flower arches, a flower cart, canals, rolling cheese |
| 32 | Glacier Bay | blue dusk | ice chunks, ice arches, seracs, crevasses, rolling snowballs, falling icicles |
| 33 | Home Again | summer evening | a picnic basket, the old fence, the bench, washing on the line, a log pile, then home |

| | |
|---|---|
| ![Geyser Basin](docs/screenshots/geyser-basin.jpg) | ![Bamboo Forest](docs/screenshots/bamboo-forest.jpg) |
| ![Painted Hills](docs/screenshots/painted-hills.jpg) | ![Tulip Fields](docs/screenshots/tulip-fields.jpg) |
| ![Glacier Bay](docs/screenshots/glacier-bay.jpg) | ![Home Again](docs/screenshots/home-again.jpg) |

A geyser erupts every few seconds in the basin; the windmills turn over the tulips. At the end the
porch lights are on and the table is laid outside:

![Home again](docs/screenshots/home-again-ending.jpg)

## Chapter six: The Harvest Fair

Back home, a poster on the gate: the harvest fair, three valleys over. Six autumn places lead
there, from frosty pumpkin fields at sunrise to the fair itself at night.

| # | Stage | Time of day | What gets in your way |
|---|-------|-------------|-----------------------|
| 34 | Pumpkin Patch | frosty sunrise | heaps of pumpkins, a scarecrow (and his crow), hay bales, a pick-your-own banner, a hay wagon, rolling pumpkins |
| 35 | Mill Stream | autumn morning | flour sacks, brambles, the mill flume, stacked sacks, a swinging sack, rolling millstones, falling conkers |
| 36 | Heather Moor | windy afternoon | peat stacks, gorse, stone walls, a dolmen, granite tors, rolling boulders |
| 37 | The Viaduct | late afternoon | milk churns, luggage, a brazier, a signal gantry, a goods wagon, missing spans, rolling cable drums |
| 38 | Vineyard Hills | golden hour | crates of grapes, vine rows, barrels, the cellar gateway, barrel racks, rolling casks |
| 39 | The Harvest Fair | night | prize vegetables, a coconut shy, pumpkins, a balloon seller, an organ wagon, a swing boat, then the gate |

| | |
|---|---|
| ![Pumpkin Patch](docs/screenshots/pumpkin-patch.jpg) | ![Mill Stream](docs/screenshots/mill-stream.jpg) |
| ![Heather Moor](docs/screenshots/heather-moor.jpg) | ![The Viaduct](docs/screenshots/the-viaduct.jpg) |
| ![Vineyard Hills](docs/screenshots/vineyard-hills.jpg) | ![The Harvest Fair](docs/screenshots/harvest-fair.jpg) |

The mill wheel turns on its stream, a steam train crosses the far side of the valley below the
viaduct, and thistledown blows across the moor. At the end the big wheel lights up over the gate:

![All the lights of the fair](docs/screenshots/harvest-fair-ending.jpg)

## Chapter seven: First Snow

The morning after the fair it snows. Six winter places lead to the town square on the longest
night of the year, where the great tree is about to be lit.

| # | Stage | Time of day | What gets in your way |
|---|-------|-------------|-----------------------|
| 40 | Birch Wood | frosty morning | loaded sledges, snowy logs, holly, a birch bowed over by snow, a deer feeding rack, rolling snowballs |
| 41 | Skating Lake | bright noon | skate benches, fishing holes behind flags, ice blocks, bunting, fishing huts, holes in the ice |
| 42 | Reindeer Road | polar night, northern lights | sledges, reindeer corrals, drifts, fish drying racks, a herder's cargo sled |
| 43 | Ski Hill | blue afternoon | snowmen, ski racks, the start gate, a piste groomer, rolling snowballs |
| 44 | Snow Sculpture Park | dusk | blocks of snow, ice crystals lit blue, a snow bridge, a snow castle, rolling balls of glowing ice |
| 45 | Midwinter Square | longest night | presents, sledges, holly, garlands of lights, a chestnut cart, then the great tree |

| | |
|---|---|
| ![Birch Wood](docs/screenshots/birch-wood.jpg) | ![Skating Lake](docs/screenshots/skating-lake.jpg) |
| ![Reindeer Road](docs/screenshots/reindeer-road.jpg) | ![Ski Hill](docs/screenshots/ski-hill.jpg) |
| ![Snow Sculpture Park](docs/screenshots/snow-sculpture-park.jpg) | ![Midwinter Square](docs/screenshots/midwinter-square.jpg) |

Skaters go round on the lake, the chairlift carries people up the ski hill, the northern lights
move over the reindeer road, and when you reach the square every light on the tree comes on:

![The longest night](docs/screenshots/the-longest-night.jpg)

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
ending screens. It is one unbroken road through all forty-five landscapes, in order, over and over:

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
  fireworks, the Milky Way, shooting stars, lava glow, pollen, leaves, blossom petals, sand,
  volcanic ash and embers, rain, warm drizzle, drifting mist, butterflies, sky lanterns, glow-worms,
  fireflies, a lighthouse, a bonfire, an erupting geyser, turning windmills, mirror reflections on
  wet salt, and snow. A final pass adds grading, a vignette and film grain.
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
all forty-five landscapes, keeps every gap jumpable and keeps memory flat. `tests/level.test.js`
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
src/stages-skies.js         chapter three, under open skies
src/stages-alpine.js        chapter three, the long way down
src/stages-sea.js           chapter four, down to the sea
src/stages-return.js        chapter five, home again
src/stages-fair.js          chapter six, the harvest fair
src/stages-winter.js        chapter seven, first snow
src/level.js                seeded level generator + spatial queries   (pure, tested)
src/runner.js               runner physics                              (pure, tested)
src/bot.js                  simulation-based autopilot                  (tested)
src/endless.js              endless road: streams + prunes the level, landscape legs
src/game.js                 World: speed, scoring, hearts, rescue, finish
src/cast.js                 who can run: Mila, Arlo and the portrait cast
src/figure.js               skeleton, IK, poses, hair/scarf, cast faces and clothes, drawing
src/backgrounds.js          procedural parallax layers, sky, sun, aurora
src/backgrounds-world.js    chapter two landscapes, fireworks
src/backgrounds-skies.js    chapter three landscapes, Milky Way, meteors
src/backgrounds-alpine.js   the way down: pasture, gorge and waterfall, the lake
src/backgrounds-sea.js      chapter four landscapes, reflections
src/backgrounds-return.js   chapter five landscapes
src/backgrounds-fair.js     chapter six landscapes, mill wheel, train, big wheel
src/backgrounds-winter.js   chapter seven landscapes, skaters, chairlift, the great tree
src/art.js                  ground, obstacles, movers, decor, coins, finish, cabin
src/art-world.js            chapter two ground, props, movers, decor, pavilion
src/art-skies.js            chapter three ground, props, movers, decor, observatory
src/art-alpine.js           the way down: ground, props, the boathouse
src/art-sea.js              chapter four ground, props, movers, decor, bonfire
src/art-return.js           chapter five ground, props, decor, the cabin in summer
src/art-fair.js             chapter six ground, props, movers, decor, the fair gate
src/art-winter.js           chapter seven ground, props, decor, the tree lighting
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
