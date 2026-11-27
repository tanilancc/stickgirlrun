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

Nothing else is loaded from outside: no scripts from CDNs, no trackers, no embeds.
The fonts (Fraunces, Barlow Condensed, Caveat; SIL Open Font License, `css/fonts/OFL.txt`) are
self-hosted in `css/fonts/`, so GitHub Pages is the only third party. Before 2026-11-27 they came
from Google Fonts, which saw each visitor's IP address.

## Threat model
| Risk | Mitigation |
|---|---|
| Script injection through a typed runner name | names are capped at 16 characters and escaped before being put in HTML; ending and caption text use `textContent` |
| A tampered or corrupt save breaks the game | `load()` validates every field, falls back to defaults on bad JSON, and drops unknown runners |
| Inserting stages shifts saved stars onto the wrong stages | saves record their stage order; older saves are mapped by id (tested) |
| `?unlock=all` lets anyone skip ahead | accepted: it is a single-player game with no rankings or prizes, and it changes only that browser's own save |
| Injected script or outside connection (if a bug ever let one through) | a Content-Security-Policy `<meta>` on every page: the game allows only its own scripts, styles and fonts, no inline scripts or styles, no network connections (`connect-src 'none'`), no frames or plugins; the legal pages allow only their own inline stylesheet, by hash |
| Clickjacking, HSTS, `X-Content-Type-Options` | not settable: GitHub Pages sends no custom headers and browsers ignore `frame-ancestors` in a `<meta>`. HTTPS is enforced on `github.io`. A header-capable host (Cloudflare, Netlify) would close this |
| A wrong address shows GitHub's generic error page | `404.html`: the game's own page with a link home, loading nothing from outside, with its own strict CSP; links are absolute (`/stickgirlrun/...`) because Pages serves it at any depth |
| Supply-chain attack through dependencies | there are no runtime or dev dependencies; tests use Node's built-in runner |
| Compromised deploy | Pages deploys only from `main`, only after tests pass, with job-scoped permissions (`pages: write`, `id-token: write`, `contents: read`) |
| Children's privacy (COPPA / GDPR-K) | no collection, no accounts, no tracking, no chat, no ads; the only off-device data is the hosting request listed above |

## Secrets
None. The deploy uses GitHub's built-in, short-lived workflow token. No API keys exist.

## Legal pages
- Privacy policy: [`privacy.html`](../privacy.html), linked from the title screen. Written from the
  data inventory above: nothing collected, what localStorage holds and how to delete it, GitHub Pages
  named as the only third party, children (COPPA, GDPR) covered, contact via GitHub issues.
- Terms of use: [`terms.html`](../terms.html), linked from the title screen: free, parental
  supervision, a flashing-lights warning, fair use, Apache-2.0 code, no warranty, contact.
- Refund policy: N/A, nothing is sold (stated in the terms).
- Both pages load nothing from outside (system fonts, inline styles).
- **Not legal advice:** these were drafted from the facts of this codebase, not by a lawyer. Have them
  reviewed before promoting the game to schools or children's platforms.
- Governing law: the Commonwealth of Virginia, USA (terms section 9). The owner is in the USA, so no
  EU-style imprint (named owner and postal address) is required for a free, non-commercial game. COPPA's
  operator-contact rules apply to sites that collect children's personal information, which this one
  does not; GitHub issues is the contact route.
- When the data inventory changes, update `privacy.html` and its effective date in the same commit.
- License: Apache-2.0 (`LICENSE`).

## Content-Security-Policy upkeep
- Never add inline `<script>` or `style="..."` attributes in `index.html` or in HTML built by `src/`; use classes in `css/style.css` (setting `el.style.x` from JS is fine).
- Editing the `<style>` block in `privacy.html`, `terms.html` or `404.html` changes its hash: recompute the `sha256-` value in that page's CSP, or the page loses its styling.
- Fonts are local (`font-src 'self'`). A new font goes in `css/fonts/` with its license added to `OFL.txt`; never load one from a CDN.
