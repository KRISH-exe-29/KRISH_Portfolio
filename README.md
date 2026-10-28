# Krishna Raju S: portfolio

Electrical engineer who ships software. This repo holds one portfolio told many different ways: every `portfolio/*` branch is a complete, separate design built from the same facts.

**Live:** https://krish-exe-29.github.io/KRISH_Portfolio/

## How the live site works

The live site shows one design a day. Every day, `.github/workflows/deploy.yml` reads `design.txt` from the live site to see which design is up, picks the next one in alphabetical order (wrapping round at the end), builds that branch and publishes it, then writes the new name and date back into `design.txt`. Adding a branch never makes the rotation jump back to a design that was just shown. `main` is in the rotation too; `portfolio/base` is the starter and is not.

Every design reads the same `src/content.js`, so a fact is fixed once and stays true on every branch. The GitHub sections use `src/github.json`, refreshed from the public GitHub API when it can be reached.

## The designs

### 3D, butter-smooth (Three.js, GSAP ScrollTrigger, Lenis)

Each one has a 3D hero you play with, GitHub as part of its world, word hooks, two meme intermissions, his own photos, a song that plays from the start (with a "Music off" switch), scroll-scrubbed scenes, themed transitions and a hidden surprise.

| Branch | Concept | Song |
|---|---|---|
| [`portfolio/aquarium`](../../tree/portfolio/aquarium) | A vintage goldfish-shop tank: the nine apps are fish that school around your pointer, GitHub is a coral reef. Surprise: tap the glass three times. | fish in the pool |
| [`portfolio/claw-machine`](../../tree/portfolio/claw-machine) | The KRISH-O-MATIC arcade claw machine: grab an app capsule and it opens. The gold resume capsule is rigged; old-school players know the code. | YKWIM |
| [`portfolio/darkroom`](../../tree/portfolio/darkroom) | A darkroom under red safelight: his photos develop on drying lines as the camera passes. Surprise: do turn on the light. | for a moment |
| [`portfolio/night-shift`](../../tree/portfolio/night-shift) | His room at 2 a.m. as a 3D diorama; the clock runs to sunrise as you scroll. Surprise: switch off the desk lamp. | Duvet |
| [`portfolio/orbit`](../../tree/portfolio/orbit) | A hand-built planetarium: jobs are planets, apps are moons, repos an asteroid belt. Surprise: spin it hard enough and the planets align. | Parfum d'étoiles |
| [`portfolio/action-figure`](../../tree/portfolio/action-figure) | He's a boxed collectible: peel the blister pack and a 3D figure of him pops out; scroll unboxes the accessories. Surprise: give him a spin. | Lady Love |
| [`portfolio/brushstroke`](../../tree/portfolio/brushstroke) | A living post-impressionist painting in thick, swirling brushstrokes; his GitHub days are the stars. Surprise: it's signed lower right. | Great Fairy Fountain |
| [`portfolio/cloudline`](../../tree/portfolio/cloudline) | One flight from the factory floor up through the clouds to a golden cloud sea; GitHub is the weather. Surprise: catch the paper plane. | Chasing Kou |
| [`portfolio/glasshouse`](../../tree/portfolio/glasshouse) | Liquid glass over a painted field: his name inside a rippling glass slab, repos as a greenhouse. Surprise: hold still on the glass. | in the pool |
| [`portfolio/keycap`](../../tree/portfolio/keycap) | A boot screen, then a 3D keyboard that presses as you type; F1 to F5 are his jobs. Surprise: type a codename. | FIN DE LA ODISEA |

The 3D figure and dioramas in action-figure and cloudline were generated with Higgsfield from his own photo. Several backgrounds come from his Pinterest boards.

### Story concepts

| Branch | Concept | Song |
|---|---|---|
| [`portfolio/161kv`](../../tree/portfolio/161kv) | The 161 kV test bay: the page opens de-energised and you energise it. | Sun Fish |
| [`portfolio/comeback-arc`](../../tree/portfolio/comeback-arc) | A manga training arc that opens on a spinning ring of chapter covers. | Chasing Kou |
| [`portfolio/commit-city`](../../tree/portfolio/commit-city) | His GitHub as a city at night in the rain, opened by a reel ring of billboards. | pluto projector |
| [`portfolio/dealt`](../../tree/portfolio/dealt) | A card table where the recruiter is the house: 34 cards deal into a wheel. | Lady Love |
| [`portfolio/now-showing`](../../tree/portfolio/now-showing) | His career released as a film: countdown leader, trailer and box-office board. | FIN DE LA ODISEA |

### Earlier designs

| Branch | Concept |
|---|---|
| `main` | Issue 01: a one-engineer magazine (also on `portfolio/issue-01`). |
| [`portfolio/50us`](../../tree/portfolio/50us) | Told inside one 1.2/50 µs lightning impulse. |
| [`portfolio/atelier`](../../tree/portfolio/atelier) | A maker's workshop for factory software. |
| [`portfolio/canvas`](../../tree/portfolio/canvas) | A designer's case-study wall. |
| [`portfolio/coil`](../../tree/portfolio/coil) | A flight down the bore of a transformer winding. |
| [`portfolio/depth`](../../tree/portfolio/depth) | A 200 m dive where scroll position is depth. |
| [`portfolio/electron`](../../tree/portfolio/electron) | An interactive 3D engineering portfolio. |
| [`portfolio/energize`](../../tree/portfolio/energize) | A single-line diagram that powers up as you scroll. |
| [`portfolio/glacier`](../../tree/portfolio/glacier) | A transformer core sealed in ice, in a frozen field. |
| [`portfolio/grid-run`](../../tree/portfolio/grid-run) | A night drive where every gate is a career stage. |
| [`portfolio/headline`](../../tree/portfolio/headline) | A loud two-colour poster. |
| [`portfolio/killswitch`](../../tree/portfolio/killswitch) | A factory control room at 2 a.m., alarms switching off one app at a time. |
| [`portfolio/kolam`](../../tree/portfolio/kolam) | Drawn as one line. |
| [`portfolio/krish-exe`](../../tree/portfolio/krish-exe) | Giant grotesk type, one red accent and a 3D transformer. |
| [`portfolio/mixtape`](../../tree/portfolio/mixtape) | A cassette: side A the career, side B the person. |
| [`portfolio/monsoon`](../../tree/portfolio/monsoon) | Behind a rain-fogged window in Chennai. |
| [`portfolio/night-train`](../../tree/portfolio/night-train) | A night train in three.js, from stop to stop. |
| [`portfolio/notebook`](../../tree/portfolio/notebook) | A ruled notebook, keyboard-first. |
| [`portfolio/playground`](../../tree/portfolio/playground) | A page you can poke. |
| [`portfolio/popup`](../../tree/portfolio/popup) | A pop-up book. |
| [`portfolio/projector`](../../tree/portfolio/projector) | A planetarium projector drawing constellations. |
| [`portfolio/reel`](../../tree/portfolio/reel) | A project reel. |
| [`portfolio/retrospective`](../../tree/portfolio/retrospective) | A museum retrospective in CSS 3D. |
| [`portfolio/reverie`](../../tree/portfolio/reverie) | A quiet dream room in Three.js. |
| [`portfolio/series`](../../tree/portfolio/series) | A streaming series with a "Who's watching?" picker. |
| [`portfolio/signature`](../../tree/portfolio/signature) | A dark cinematic film in near-black and red. |
| [`portfolio/step-down`](../../tree/portfolio/step-down) | One long dive. |
| [`portfolio/sunrise`](../../tree/portfolio/sunrise) | A type specimen at dawn. |
| [`portfolio/swarm`](../../tree/portfolio/swarm) | Drawn entirely with iron filings. |
| [`portfolio/sweep`](../../tree/portfolio/sweep) | An SFRA frequency sweep where scroll is frequency. |
| [`portfolio/typeset`](../../tree/portfolio/typeset) | A Swiss type specimen. |
| [`portfolio/workbench`](../../tree/portfolio/workbench) | A toy workbench with a CSS 3D desk. |

## Run a design locally

```sh
git checkout portfolio/<name>
npm ci
npm run dev     # local
npm run build   # into dist/
```
