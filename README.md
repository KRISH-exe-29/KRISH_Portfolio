# Projector

A portfolio for Krishna Raju S, shown as a planetarium. Every chapter is a constellation, and scrolling makes the projector draw it, one line at a time, with each star labelled from the facts it stands for.

- **Lights down:** the projector warms up and the dome fills with stars. "Every project is a constellation."
- **The Path:** five stars, one per job, oldest first.
- **The Five:** a pentagram of the five headline numbers.
- **The Transformer:** nine stars in the shape of a transformer core, two limbs and a yoke, one per production app.
- **The Agent:** a twelve-star spiral, one star per version of the agent, beside the rest of the AI work.
- **The Crown:** seven stars for the awards, with leadership and the photo sets.
- **Charts:** skills and certificates.
- **The last constellation:** the stars spell KRISH. Contact.

The sky (`src/sky.js`) wheels slowly as the page scrolls and leans with the mouse; the shapes live in `src/constellations.js`.

## Sound

Nothing plays until the visitor starts the show with sound. The score is synthesised in `src/score.js`, no audio files. A lamp switch clacks, the projector's motor starts and its shutter ticks quietly at 24 frames a second. An FM music box plays a slow lullaby in E major pentatonic, and every line the reader draws between two stars rings a brighter bell, so each constellation plays its own phrase.

## Stack

Vite, React, plain CSS and a 2D canvas. All facts come from `src/content.js`, shared with the other concept branches; `src/sections.jsx` renders them.

## Run

```bash
npm install
npm run dev
```

Visitors who ask for reduced motion get a still sky: no twinkle, no lean, and the lamp comes on at once.
