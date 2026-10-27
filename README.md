# 161 kV

Krishna Raju S tests power transformers to IEC 60076 in a 161 kV bay by day and ships apps by night, so this portfolio is the test bay. The page opens de-energised: a "DANGER 161 kV" sign, a dark transformer and a Permit to Work that ticks off as the fonts, the night sky and the GitHub data really load. Press "Energise the bay" and the voltage ramps from 0 to 161 kV, the sphere gap arcs, the windings glow copper, the name lights up like a busbar, and 34 test certificates (apps, repos and links) lift into a wheel above the transformer core. Scrolling runs the test sequence, with each IEC 60076 test as a chapter of his career and an oscilloscope trace that draws itself down the page. After that comes his GitHub as a night power grid and, at the end, a breaker you close to reach him.

## Hooks
- **Words**: "Low resistance to change. High resistance to manual work." "Fault found: spreadsheets. Fault cleared." "Turns ratio 1:∞, one engineer, endless output."
- **Memes**: two "Tea break at the test bay" intermissions (setup, then meme, then reframe), pinned and scrubbed: the "scared and tired" transformer becomes "2 hours → 5 minutes", and "men's ego" goes up against a 2-hour report.
- **Images**: his own photos (portrait, Southern Railway, Bühler, Indo Tech, IIT Bombay, E-Cell) plus a few Pinterest pins.
- **Song**: "Sun Fish", off by default. Pressing play turns the fixed oscilloscope HUD into a real Web Audio analyser, and a 100 Hz transformer hum fades in underneath.
- **Scroll**: Lenis and GSAP ScrollTrigger: a self-drawing scope trace, a no-load-loss clock that runs from 30:00 down to 00:30, heat bars for the twelve Agent-Builder versions, a lightning-impulse waveform, and the grid's contribution year scrubbed through the busbar.
- **Transitions**: a hazard-tape wipe, hazard bands sweeping in at each chapter, masked headings, and a magnetic breaker switch.
- **Surprise**: a test-probe cursor that sparks on hidden live parts and shows a fact. When you reach the end, the page trips and goes black, and a torch beam (your cursor) has to find the breaker.
- **Grid**: every public repo is a substation on a single-line diagram (height from log size, lit windows for recent pushes, a roof beacon for stars). It updates live from api.github.com and falls back to `src/github.json`. Power flows in proportion to daily contributions, and 2026-10-10 (60 contributions) is a peak load event.

Reduced motion gets the energised page straight away, with no smooth scroll and no blackout.

## Credits
Song: "Sun Fish", from the owner's music folder. Some images come from the owner's Pinterest boards. All facts come from `src/content.js`.

## Run
```sh
npm ci
npm run dev     # local
npm run build   # static site in dist/
```
