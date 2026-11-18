# The Long Run Home PRD

## Problem
Kids, and the teens and adults who play with them, want a running game that is calm, fair and
beautiful to look at. Most browser runners are ad-filled, look machine-made, or end in a
frustrating game over. This one should feel hand-made, never cheat the player, and work on a phone
or a laptop with nothing to install.

## Target users
- **Kids** of around 5 to 12, in a gentle mode (slower, wider gaps, no game over).
- **Teens and adults** in a faster mode with hearts, moving hazards and stars to chase.
- **Two players** side by side on one device (duo).

**Under-13 flag:** children are a core audience. The game therefore collects nothing, sends nothing,
shows no ads, has no accounts and no chat (see SECURITY.md). Keep it that way.

## Goals / success metric
Every stage can be finished by a player who reacts in time: the autopilot clears all 51 stages on
both difficulties with **zero hits and zero falls** (`npm test`, run on every push).

## Non-goals
- Accounts, cloud saves, leaderboards or anything that needs a server.
- Ads, in-app purchases, analytics or tracking.
- Multiplayer over the network (duo is on one device only).
- Real names or likenesses of the cast in the public repo (in-game names stay on the device).

## Slices
1. Core: seeded level generator, runner physics, autopilot, fairness tests. Status: done
2. Chapter one, six stages from a meadow to the cabin, kids and adult modes, duo. Status: done
3. Endless mode, The Long Way Round. Status: done
4. Publish to GitHub Pages, with tests run on every push. Status: done
5. Chapter two, Postcards from Away (6 stages). Status: done
6. Playable cast of eight runners, renamable on the device. Status: done
7. Chapter three, Under Open Skies (9 stages, including the way down after the summit). Status: done
8. Chapter four, Down to the Sea (6 stages). Status: done
9. Chapter five, Home Again (6 stages). Status: done
10. Chapter six, The Harvest Fair (6 stages). Status: done
11. Chapter seven, First Snow (6 stages). Status: done
12. Chapter eight, Where the Kites Fly (6 stages). Status: done
13. `?unlock=all` to try any stage without playing through. Status: done

## Open questions
- The real names for the eight cast runners: they show placeholders (Blue Shirt, Navy Polo, Braids,
  Curly, Headband, Tutu, Pinafore, Blue Dress) until the owner says which name goes with which figure,
  and whether real names may go in a public repo at all.
- Should `?unlock=all` stay in the public build, or move behind a less guessable switch?
