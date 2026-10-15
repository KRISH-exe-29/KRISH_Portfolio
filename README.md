# Night Train

A portfolio for Krishna Raju S, on a night train. His career started at Southern Railway, so the site is a train running through the night in three.js, and scrolling drives it from stop to stop.

- **Departure:** "Every stop made me faster." The signal turns green when you board.
- **Tambaram, Mettur Dam:** the railway and power plant internships. Each platform's lamps and yellow station board light up as the train pulls in.
- **Between stations:** Inovate, remote, on open line.
- **Mumbai:** IIT Bombay, the trophy case and E-Cell.
- **Bengaluru:** Bühler, the tool that took 30 minutes down to 30 seconds, and the photo set.
- **Kanchipuram:** Indo Tech today, the numbers and the nine apps.
- **Night shift:** the agent, the work-instruction assistant, AI in the browser and the side projects.
- **Your station:** contact, skills and certificates. "This one's yours."

The scene (`src/scene.js`) is built in code: stars, a lit skyline, track and masts, five coaches behind a locomotive with a headlight, and one platform per station. The train eases toward wherever the scroll says it should be, dwells at each stop and pulls away between them. Bloom comes from three's post-processing. If WebGL fails or the context is lost, the page falls back to a plain night-sky background.

## Sound

Nothing plays until the visitor boards with sound. Each leg of the journey has its own song (`public/music/night-train-1..3.mp3`), crossfaded through Web Audio by `src/music.js`. A song loads only when the leg before it starts. Scrolling fast closes a low-pass filter so the music sounds muffled, and it opens again when the reader stops. All audio pauses while muted or while the tab is hidden. The songs belong to their artists and are credited in the footer.

## Stack

Vite, React, three.js and Lenis for smooth scrolling. All facts come from `src/content.js`, shared with the other concept branches; `src/sections.jsx` renders them. Photos are always shown whole, never cropped.

## Run

```bash
npm install
npm run dev
```

Visitors who ask for reduced motion get native scrolling, no rail sway and no card animations.
