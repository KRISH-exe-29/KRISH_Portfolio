# Mixtape

A portfolio for Krishna Raju S, on a cassette. Side A is the career, side B is the person; the J-card on the right is the tracklist, with handwritten notes, and the tape on the left plays along as you scroll.

- **Intro:** "Krish, the mixtape." Some people send a resume.
- **Side A, the career:** A1 to A5 are the five jobs, oldest first, then the numbers, the nine production apps as a medley and the side projects.
- **Turn over:** halfway down, the cassette flips and the label changes colour.
- **Side B, the person:** the agent's twelve versions, the work-instruction assistant, AI in the browser, the trophy case, E-Cell, the photo sets and the liner notes (skills and certificates).
- **Hidden track:** "Send it over." Contact.

The cassette (`src/Cassette.jsx`) is SVG: the hubs turn with the scroll, tape winds from one spool to the other with its area conserved, and a counter runs from 000 to 999. On a phone it shrinks into a now-playing bar.

## Sound

Nothing plays until the visitor presses play. The score is synthesised in `src/score.js`, no audio files. Side A is an electric-piano groove in D with a soft kit; side B is a slower plucked guitar (Karplus-Strong) in E minor. Both run through tape: a low-pass, hiss and a slow wobble in pitch. Scrolling fast drags the tape and bends the pitch with it; turning over clicks the deck and leaves a second of hiss before side B starts.

## Stack

Vite, React, plain CSS and SVG. All facts come from `src/content.js`, shared with the other concept branches; `src/sections.jsx` renders them.

## Run

```bash
npm install
npm run dev
```

Visitors who ask for reduced motion get no flip animation and straight, untilted photos.
