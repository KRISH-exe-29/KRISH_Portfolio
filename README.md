# The Retrospective

A portfolio for Krishna Raju S, hung as a museum show: "Krishna Raju S: Works 2023–2026". Scrolling walks you down a gallery corridor built in CSS 3D, room by room, and the walls turn as you pass. Every piece hangs whole in its frame, under its own spotlight, with a wall label beside it. Nine works. All of them in use.

- **Entrance:** the title wall and the numbers.
- **Gallery I, Early works:** Southern Railway, Mettur Thermal Power Plant and Inovate Technologies.
- **Gallery II, The permanent collection:** Indo Tech Transformers and the nine apps, each with its own wall label.
- **Gallery III, After hours:** the agent, the work-instruction assistant, AI in the browser and the side projects.
- **Gallery IV, Honours:** the trophy case and E-Cell.
- **Gallery V, Field photographs:** Bühler India and the tool that took 30 minutes down to 30 seconds.
- **Exit through the gift shop:** contact, skills and certificates.

The corridor (`.hall` in `src/App.jsx` and `src/styles.css`) is plain DOM: a floor, a ceiling, two painted walls and a doorway per room, placed with `translate3d` and `rotateY`/`rotateX` under one `perspective`. Scrolling moves a single `translateZ` on the world, so the camera walks; it lingers in each room and yaws a few degrees through each doorway. Only the room you are in and the two ahead are painted. The corridor scales with the window, so a phone sees the same gallery a monitor does.

## Sound

Nothing plays until the visitor enters with sound. Each wing has its own song (`public/music/retrospective-1..3.mp3`), crossfaded through Web Audio by `src/music.js`: Parfum d'étoiles for the first rooms, Great Fairy Fountain in the middle, pluto projector ending (instrumental) for the last. The third file is not in the repo yet; drop it in and it plays, until then its rooms stay silent. A song loads only when the wing before it starts. Walking fast closes a low-pass filter so the music sounds muffled, and it opens again when the reader stops. All audio pauses while muted or while the tab is hidden. The songs belong to their artists and are credited in the footer.

## Stack

Vite, React and Lenis for smooth scrolling. No WebGL: the 3D is CSS transforms, and only `transform` and `opacity` animate. All facts come from `src/content.js`, shared with the other concept branches; `src/sections.jsx` renders them. Photos are always shown whole, never cropped.

## Run

```bash
npm install
npm run dev
```

Visitors who ask for reduced motion get native scrolling, no yaw, no card animations, and a corridor that steps from room to room instead of gliding.
