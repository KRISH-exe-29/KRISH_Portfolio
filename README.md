# 50 µs

A portfolio for Krishna Raju S, told inside one lightning impulse. The standard 1.2/50 µs impulse rises to its crest in about two microseconds and falls to half by fifty; scrolling the page moves time across it, on a stretched axis so the front gets as much room as the tail.

- **t = 0:** the hero. Nothing has struck yet.
- **Front:** a faint stepped leader works down the screen while the five jobs go by, oldest first.
- **Crest:** the return stroke. The screen flashes, the channel lights, the numbers sit at 1.00 per unit.
- **Branches:** each of the strike's nine branches is a production app, lit as the reader passes it.
- **Induction, Proof, Ground:** the AI work, awards, leadership, photo sets, skills and certificates, while the glow decays with the real waveform.
- **50 µs:** half value, and contact.

The readout in the corner shows the time, the voltage in per unit and where on the wave the reader is. The waveform is u(t) = e^(−t/68.2) − e^(−t/0.405), scaled to a 1 pu crest (`src/impulse.js`).

## Sound

Nothing plays until the visitor chooses "Enter with sound". The score is synthesised in `src/score.js`, no audio files: a single D chord held for the whole strike. Voices stack and the filter opens across the front, the crest brings a crack of thunder, and over the tail the suspended G slides to F#, so the chord resolves as the wave reaches half.

## Stack

Vite, React, plain CSS and a 2D canvas (`src/strike.js`). All facts come from `src/content.js`, shared with the other concept branches; `src/sections.jsx` renders them.

## Run

```bash
npm install
npm run dev
```

Visitors who ask for reduced motion get no flash and a steady, unflickering bolt.
