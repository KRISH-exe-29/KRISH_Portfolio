# Pop-up

A portfolio for Krishna Raju S, as a pop-up book. "Some people tell stories. I build them, page by page." A book sits open beside the text, and each scroll folds the last spread flat, turns the page around the spine and stands the next paper model up out of it.

- **Cover:** the title spread. A banner with his name, hills, a sun and a pylon.
- **Chapter 1, the current:** Southern Railway and Mettur Thermal Power Plant. A locomotive in front of a cooling tower and a 4 × 210 MW plant.
- **Chapter 2, remote:** Inovate and Project: Phantom, on a paper laptop.
- **Chapter 3, Bengaluru:** Bühler. The Virtual World 2.0 kiosk, an MCC panel, flour-mill silos, and the photo set.
- **Chapter 4, the test bay:** Indo Tech today. A transformer with bushings and radiators in the 161 kV bay, the numbers and the nine apps.
- **Chapter 5, after hours:** the agent, the work-instruction assistant, AI in the browser and the side projects.
- **Chapter 6, the stage:** E-Cell, a podium, a mic and a 500+ crowd.
- **Chapter 7, the shelf:** the trophy and the awards.
- **Back cover:** contact, skills and certificates. "Your next quick manual step is my next app."

The book is plain CSS 3D: one `perspective`, `preserve-3d` all the way down, `rotateY` for the turning leaf and `rotateX` for every paper piece, which folds up on its bottom edge. Pieces are styled divs; the paper grain, creases and fold shadows are gradients. Scroll position drives one `--u` value per spread, so the animation is transforms only. On phones the book sits in a band at the top and the text scrolls beneath it. Photos live in the text, never on a folding piece, and are always shown whole.

## Sound

Nothing plays until the visitor opens the book with sound. The early, middle and final chapters each have their own song (`public/music/popup-1..3.mp3`), crossfaded through Web Audio by `src/music.js`. A song loads only when the part before it starts. Scrolling fast closes a low-pass filter so the music sounds muffled, and it opens again when the reader stops. All audio pauses while muted or while the tab is hidden. The songs belong to their artists and are credited in the footer.

## Stack

Vite, React and Lenis for smooth scrolling. No 3D library. All facts come from `src/content.js`, shared with the other concept branches; `src/sections.jsx` renders them.

## Run

```bash
npm install
npm run dev
```

Visitors who ask for reduced motion get native scrolling, no page turns and no card animations: each spread simply stands open while its chapter is in view.
