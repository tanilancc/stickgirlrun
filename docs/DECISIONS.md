# Decisions

Earlier entries were written up on 2026-11-18 from the commit history; from now on, entries are
added when the decision is made.

## 2026-11-08: Plain browser game, no engine, no build, no dependencies
Context: the game had to run on phones and desktops, be easy to host, and look hand-made.
Options: a game engine (Phaser, Unity web export), a bundler with npm packages, or plain ES modules and Canvas 2D.
Decision: plain ES modules and Canvas 2D, with nothing to install.
Consequences: everything (drawing, physics, audio) is written by hand; there is no supply chain to
attack and no build to break, and the repo runs straight from a static server.

## 2026-11-08: Everything drawn and synthesized in code, no image or audio assets
Context: the brief asked for a look that is realistic and not "AI-coded".
Options: sprite sheets and recorded audio, or procedural art and synthesized sound.
Decision: procedural backgrounds with atmospheric haze, IK-animated stick figures, Web Audio sound.
Consequences: the art can be tuned from data per stage and stays tiny, but each new prop or place
costs code, and visual quality is checked by eye in headless screenshots.

## 2026-11-08: Seeded levels, with an autopilot as the fairness test
Context: hand-placing every obstacle does not scale, but random levels can be unfair.
Options: hand-built levels, or random generation with no guarantee.
Decision: a seeded generator that places hazards from the real jump arc, plus an autopilot that must
clear every stage on both difficulties with zero hits and zero falls in `npm test`.
Consequences: a stage is the same on every play and can be learned; the generator can never ship an
impossible sequence, at the cost of a slower test suite as stages are added.

## 2026-11-08: Two difficulties, one of them with no game over
Context: the players range from young kids to adults.
Options: one difficulty curve, or separate modes.
Decision: Kids (slower, wider gaps, no moving hazards, hits only spill coins) and Teen / Adult
(hearts, moving hazards). A test keeps kids levels under 0.85 of the adult hazard rate.
Consequences: each new stage's pattern weights sometimes need tuning to keep that test green.

## 2026-11-09: Endless mode as one streamed road through every landscape
Context: players wanted to keep running after the last stage.
Options: random endless levels, or one road cycling through the stages in order.
Decision: one deterministic road, 12,000 units per landscape, streamed ahead and pruned behind.
Consequences: memory stays flat; the endless test's time budget grows with the number of stages.

## 2026-11-09: GitHub Pages deployed by GitHub Actions, tests first
Context: the game needed a public link with no running costs.
Options: Netlify or Vercel, Pages from a branch, or Pages from an Actions workflow.
Decision: an Actions workflow that runs `npm test` and deploys `index.html`, `css/` and `src/` only from `main`.
Consequences: a red test blocks publishing; the repo had to be public for free Pages.

## 2026-11-10: Cast runners drawn from the owner's pictures, names kept on the device
Context: the owner shared stick-figure pictures of real people for a playable cast.
Options: commit the pictures and real names, or redraw the figures in code with placeholder names.
Decision: redraw them in code; names are placeholders, and names typed in the game stay in localStorage.
Consequences: no personal images or names in the public repo; real names wait on the owner's say-so.

## 2026-11-10: One module trio per group of stages
Context: each chapter adds a lot of art, and one file per kind of thing would grow without limit.
Options: keep growing `art.js` and `backgrounds.js`, or split per chapter.
Decision: `stages-X.js`, `backgrounds-X.js` and `art-X.js` per chapter; the core files try each in turn.
Consequences: a chapter is easy to find and review; the fallback chains in `art.js` grow by one entry per chapter.

## 2026-11-12: Saves keyed by stage id, so stages can be inserted mid-game
Context: three stages were added inside chapter three, which would have shifted saved stars by position.
Options: only ever append stages, or store saves by id.
Decision: saves record their stage order; saves without one are mapped by id from the order before the insert.
Consequences: stages can now go anywhere without corrupting progress; `INSERTED_STAGES` must list any future mid-game inserts made before saves carried an order (none needed since).

## 2026-11-18: `?unlock=all` for trying any stage
Context: the owner wanted to test new chapters without playing through 45 stages first.
Options: a hidden key combo, a console snippet, or a URL parameter.
Decision: `?unlock=all` opens every stage and the endless road on both difficulties and keeps stars.
Consequences: anyone who knows the address can skip ahead in their own browser; acceptable for a
single-player game with no rankings (see SECURITY.md). Open question in PRD.md: keep it in the public build?

## 2026-11-18: Project docs in `docs/`
Context: the project grew to eight chapters with only a README and the first design brief.
Decision: PRD, TSD, SECURITY and DECISIONS in `docs/`, updated in the same commit as the code they
describe. The original brief stays in `docs/superpowers/specs/` as history.
Consequences: every future change has to touch the docs too.

## 2026-11-18: Privacy policy and terms as static pages on the site
Context: the game's audience includes children, so it needs a clear privacy policy and terms.
Options: a section in the README, a third-party policy generator, or pages written from this game's own data inventory.
Decision: `privacy.html` and `terms.html`, written from SECURITY.md's data inventory, linked from the
title screen and deployed with the game; they use system fonts so they load nothing external.
Consequences: the policy must change in the same commit as any change to what data exists; the
pages are not a lawyer's work and should be reviewed before wide promotion.

## 2026-11-27: Content-Security-Policy as a meta tag
Context: the launch check found no security headers, and GitHub Pages cannot send custom headers.
Options: move to a host that sets headers, or a CSP `<meta>` tag on each page.
Decision: a strict CSP `<meta>` on all three pages; the few inline `style` attributes in `main.js` became CSS classes so no `'unsafe-inline'` is needed.
Consequences: injected scripts and outside connections are blocked; frame protection and HSTS still need a header-capable host. Editing a legal page's `<style>` means updating its hash.

## 2026-11-27: A custom 404 page
Context: the launch check found no custom error page; wrong addresses showed GitHub's generic 404.
Decision: a small static `404.html` in the game's colours with a link back to the game, deployed with the site, with its own CSP.
Consequences: its links are absolute to `/stickgirlrun/`, so they must change if the site moves to a custom domain.

## 2026-11-27: Terms governed by Virginia law; no imprint
Context: the launch check flagged the missing governing-law clause and missing business details (an EU imprint).
Decision: the owner is in Virginia, USA, so the terms name Virginia law and keep players' home-country consumer rights. No imprint, since US law has none for a free, non-commercial site and the game collects no personal information.
Consequences: if the game ever sells anything, collects data, or targets EU players directly, revisit the contact details with a lawyer.

## 2026-11-27: Self-hosted fonts instead of Google Fonts
Context: the launch check flagged that Google Fonts received every visitor's IP address before any consent, which some EU courts have ruled unlawful; the game's audience includes children.
Options: keep Google Fonts and disclose it, switch to system fonts, or self-host the same fonts.
Decision: self-host the same three families (WOFF2, Latin and Latin Extended subsets, about 0.5 MB) with their OFL license, and tighten the CSP to `font-src 'self'`.
Consequences: GitHub Pages is the only third party and the privacy policy says so; the look is unchanged. Characters outside Latin and Latin Extended (for example Cyrillic names) fall back to system fonts.

## 2026-11-28: A contact email on the legal pages
Context: parents with a privacy question rarely have a GitHub account, and the policy gave issues as the only route.
Decision: `privacy.html` and `terms.html` give the owner's business address, info@tanilancc.com, first, with GitHub issues as a public alternative. The owner's personal address is never used on the site.
Consequences: the inbox needs watching; a change of address means updating both pages and their effective dates.
