# GLASSHOUSE: Krishna Raju S

Branch `portfolio/glasshouse`. Liquid glass over a painted world. The page sits in a calm landscape (cumulus clouds over a green field) that sways gently and drifts toward golden hour as you scroll. Real refractive glass floats in front of it. The hero is his name in soft, inflatable type inside a thick liquid-glass slab (Three.js `MeshPhysicalMaterial` with transmission, thickness and chromatic dispersion), and the slab ripples toward your pointer. The nine apps are glass tiles that refract the field and tilt as they pass. His five workplaces are a row of glass panes in depth: scroll and you walk through them, with his photos behind frosted glass that wipes clear when you hover. GitHub is a greenhouse: one glass pot per public repo, with a plant that grows with the repo's size (forks are cuttings, stars are buds), and every contribution day is a drop of condensation on the glass. The best day (2026-10-10, 60 contributions) is in full bloom. "Everything here is see-through. Even the numbers."

## Hooks
- **Words**: calm, clear copy about transparency where the numbers are the punchlines. "Everything here is see-through. Even the numbers." "Nothing frosted. Five numbers you can check." "Twelve coats, one agent." "20 pots. One very honest window." "Shows its sources. Transparent, like everything in here."
- **Memes**: two intermissions. "Bühler, week one. Every feeder classified by hand, in Excel." (a pawn that sees a king in the mirror) → "30 to 40 minutes → under 30 seconds." And "Somebody at the plant says 'it's only a quick manual step.'" (Jesse looking back from the car) → "Your next quick manual step is my next app." Each meme starts frosted and clears as it scrolls in.
- **Images**: his own photos (railway, Bühler desk, kiosk and badge, Indo Tech, E-Cell, speaking, NEC, IIT Bombay, CED team, portrait). The landscape comes from the owner's Pinterest background board, rotated upright and compressed.
- **Song**: "in the pool", on by default. If the browser blocks autoplay it starts on your first click or key press, and the "Music off" pill turns it off and remembers that. When it plays, the bass makes the slab ripple, lifts the light on the field and makes the condensation shimmer.
- **Scroll**: Lenis and GSAP ScrollTrigger. A pinned, scrubbed WebGL scene walks you through five glass panes in depth (passed panes swing aside like doors). Plants grow as their pots arrive and the condensation beads up.
- **Transitions**: every section head arrives frosted and a squeegee wipes it clean as it scrolls in. The whole day drifts from noon to golden hour from top to bottom.
- **Surprise**: breathe on the glass. Hold the pointer still in the hero and the glass fogs up, and old finger-writing shows through the fog, just like a real window ("Results over resumes."). Read it long enough and the glass hands you the resume anyway. Moving the pointer draws in the fog. The hint is in the hero: "Hold still on the glass. It remembers things."
- **CTA**: pass a note through the glass. Drag the paper note into the slot and it slides through and opens an email. A plain email link, LinkedIn, GitHub and the resume sit right next to it, and the note is also a button for the keyboard.

Accessibility: Escape or "Skip intro" ends the entrance, reduced motion skips WebGL and smooth scroll and shows a static frosted-glass version with everything visible, the name is a real `h1`, every pot, tile and link is a real labelled link, frosted photos also clear on keyboard focus, and focus rings are visible.

## Credits
Landscape (clouds over a green field) and meme images via the owner's Pinterest boards. Song: "in the pool" (from the owner's music folder). Built with React, Three.js, GSAP and Lenis. Fonts: Fraunces, Instrument Sans, JetBrains Mono and Caveat (Google Fonts).

## Run
```sh
npm ci
npm run dev     # local
npm run build   # into dist/
```
All facts live in `src/content.js`. GitHub data comes from `src/github.json`, and the pots are refreshed at runtime from the public GitHub API when it's reachable.
