# Killswitch Lullaby

A portfolio for Krishna Raju S, set in a factory control room at 2 a.m. Every alarm on the board is a job somebody does by hand; scrolling switches them off, one app at a time, until the plant is asleep and only a lullaby is left.

- **Intro:** the control room, every machine running.
- **The board:** pinned while you scroll. Nine machines, each a manual chore (taken from what each app does). Every tenth of the way, one breaker drops: the fan stops, the needle falls, the lamp goes from red to a calm teal and the machine is relabelled with the app that automated it.
- **Signed off, Shift log, Readings, Night watch, Commendations, Spares:** the apps and side projects, the five jobs, the numbers, the AI work, awards with leadership and photo sets, then skills and certificates.
- **One switch left:** a big red button, "Hire the engineer who did this". Pressing it puts the lights out. Contact sits beside it.

## Sound

Nothing plays until the visitor walks in with sound. The score is synthesised in `src/score.js`, no audio files. Nine machine drones (a motor hum, a band of grinding noise and a chug at each machine's own speed) and a two-tone alarm fill the room. Each breaker thrown clunks and spins its machine down; as the plant goes quiet, an original lullaby in 3/4 rises underneath. The last switch lands it on a long D major chord.

## Stack

Vite, React and plain CSS; the board is HTML and inline SVG. All facts come from `src/content.js`, shared with the other concept branches; `src/sections.jsx` renders them.

## Run

```bash
npm install
npm run dev
```

Visitors who ask for reduced motion get a still board: no blinking, spinning or shaking, and the breakers change state without animating.
