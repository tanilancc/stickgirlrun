# The Long Run Home Security & Data

## Data inventory
| Data | Why | Where stored | Retention | Shared with |
|---|---|---|---|---|
| Progress: stages unlocked, stars, coins, endless best | so the player can continue | the player's browser, localStorage `long-run-home.v1` | until the player clears site data | nobody |
| Settings: chosen runners, difficulty, sound on/off | so the game remembers them | same | same | nobody |
| Names typed for cast runners (max 16 characters) | so players can name their runners | same | same | nobody |

Nothing is sent to any server run by this project, because there is none. There are no accounts,
no analytics, no ads, no cookies set by the game, and no chat.

The only personal data that could exist is a name a child types for a runner. It never leaves the
device and is shown only on that device, HTML-escaped (`esc()` in `main.js`).

## Third parties
| Service | What it receives |
|---|---|
| GitHub Pages (hosting) | each visitor's IP address, user agent and the pages requested, like any web host |
| Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) | each visitor's IP address and user agent when the fonts load |

Nothing else is loaded from outside: no scripts from CDNs, no trackers, no embeds.
To remove Google entirely, self-host the three font families in `css/` (see Open item below).

## Threat model
| Risk | Mitigation |
|---|---|
| Script injection through a typed runner name | names are capped at 16 characters and escaped before being put in HTML; ending and caption text use `textContent` |
| A tampered or corrupt save breaks the game | `load()` validates every field, falls back to defaults on bad JSON, and drops unknown runners |
| Inserting stages shifts saved stars onto the wrong stages | saves record their stage order; older saves are mapped by id (tested) |
| `?unlock=all` lets anyone skip ahead | accepted: it is a single-player game with no rankings or prizes, and it changes only that browser's own save |
| Supply-chain attack through dependencies | there are no runtime or dev dependencies; tests use Node's built-in runner |
| Compromised deploy | Pages deploys only from `main`, only after tests pass, with job-scoped permissions (`pages: write`, `id-token: write`, `contents: read`) |
| Children's privacy (COPPA / GDPR-K) | no collection, no accounts, no tracking, no chat, no ads; the only off-device data is the hosting and font requests listed above |

## Secrets
None. The deploy uses GitHub's built-in, short-lived workflow token. No API keys exist.

## Legal pages
- Privacy policy: [`privacy.html`](../privacy.html), linked from the title screen. Written from the
  data inventory above: nothing collected, what localStorage holds and how to delete it, GitHub Pages
  and Google Fonts named, children (COPPA, GDPR) covered, contact via GitHub issues.
- Terms of use: [`terms.html`](../terms.html), linked from the title screen: free, parental
  supervision, a flashing-lights warning, fair use, Apache-2.0 code, no warranty, contact.
- Refund policy: N/A, nothing is sold (stated in the terms).
- Both pages load nothing from outside (system fonts, inline styles).
- **Not legal advice:** these were drafted from the facts of this codebase, not by a lawyer. Have them
  reviewed before promoting the game to schools or children's platforms, and set a governing-law
  clause in the terms once the owner's country is decided.
- When the data inventory changes, update `privacy.html` and its effective date in the same commit.
- License: Apache-2.0 (`LICENSE`).

## Open item
Self-hosting the fonts would leave GitHub Pages as the only third party, which makes the privacy
policy simpler for a children's game.
