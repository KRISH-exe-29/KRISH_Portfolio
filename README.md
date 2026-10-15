# Coil

A portfolio for Krishna Raju S, from inside a transformer winding. The camera flies down the bore of a copper coil in three.js; each turn is a chapter, and the coil runs hotter the further down you go, until it reaches the core.

- **Turn 00, no load:** "Wound tight. Built to carry load."
- **Turns 01 to 05:** Southern Railway (110 V), Mettur (4 × 210 MW), Inovate, Bühler with the photo set, and Indo Tech at 161 kV with the numbers and the nine apps.
- **Turn 06, overload:** the agent, the work-instruction assistant and AI in the browser.
- **Turn 07, type tested:** the trophy case, E-Cell and the side projects.
- **The core:** contact, skills and certificates.

The scene (`src/scene.js`) is built in code: two layers of copper wound as helix tubes, pressboard spacers between the turns, blue marker rings, electrons running along the conductor, and a stack of steel laminations at the far end. The view rolls with the winding and widens at speed. A meter at the top shows the turn and the load, and the copper's glow follows it from dark to orange to white-hot. If WebGL fails or the context is lost, the page falls back to a plain background.

## Sound

Nothing plays until the visitor energises with sound. FIN DE LA ODISEA plays down to full load, then Killswitch Lullaby takes over for the last turns and the core (`public/music/coil-1..2.mp3`, crossfaded through Web Audio by `src/music.js`). The second song loads only once the first is playing. Scrolling fast muffles the music, and all audio pauses while muted or while the tab is hidden. The songs belong to their artists and are credited in the footer.

## Stack

Vite, React, three.js and Lenis for smooth scrolling. All facts come from `src/content.js`, shared with the other concept branches; `src/sections.jsx` renders them. Photos are always shown whole, never cropped.

## Run

```bash
npm install
npm run dev
```

Visitors who ask for reduced motion get native scrolling, no roll or drift, and no card animations.
