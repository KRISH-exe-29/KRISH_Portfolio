# Commit City

Krishna Raju S's GitHub as a city at night in the rain. The intro is a reel ring of 16 lit billboards (his apps and side projects) that deals itself out while a "population" counter rolls up, then opens wide around you. Scroll and the camera drops through the ring into a skyline built from `src/github.json`: one tower per public repo, height from log(size), colour by language, lit windows for recent pushes, and a highway whose lights are 367 days of contributions (10 Oct 2026, 60 contributions: the night the city never slept). Street level has districts: the Factory District (the Indo Tech apps), the AI Quarter (Agent-Builder, the RAG assistant, Job Lens), Old Town (internships, oldest first, as street signs) and Landmarks. From above, the city's lights spell "HIRE?", and City Hall issues the hiring permit.

## Hooks

- **Words**: city-sign copy. "Population: 20 repos. Curfew: none." "Zoning permit: approved by nobody, used by everyone." "30-Seconds Ave (formerly 30-Minutes Rd)".
- **Memes**: three intermissions (billboard and late-night TV): Jesse "Yeah, science!" → "Yeah, Python. Same energy."; Anya "We go jim" → internships; a scared and tired chrome man → 2 h → 5 min.
- **Images**: his photos and Pinterest pins as billboards, posters in Old Town, photos at the town hall.
- **Song**: "pluto projector ending (instrumental slowed & reverb with rain)", on by default (it starts on your first click or key press if the browser blocks autoplay); the WKRS 29 FM radio reads "Music on · turn off" and remembers when you turn it off. While it plays the rain gets heavier and the streetlights flicker on to the beat (Web Audio analyser).
- **Scroll**: Lenis + GSAP ScrollTrigger: hero dive, pinned skyline, horizontal Old Town, pinned aerial view.
- **Transitions**: clip-path wipes on district names, TV turn-on reveals, a permit form that gets stamped and becomes an object, a magnetic CTA, and an "are you leaving without a permit?" exit moment.
- **Surprise**: the aerial view. The city's streetlights migrate into the word "HIRE?".
- **Nav**: every in-page jump goes through Lenis `scrollTo` with easing.

Live data: the repo list refreshes from the public GitHub API at runtime and falls back to the snapshot on any error. Reduced motion skips the intro, pins and rain and shows everything at rest.

## Run it

```sh
npm ci
npm run dev        # local
npm run build      # into dist/
node src/reel.check.js   # asserts the reel ring maths
```

All facts live in `src/content.js` and `src/github.json`. Some images via the owner's Pinterest boards.
