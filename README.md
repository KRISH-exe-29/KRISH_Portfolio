# Depth

A portfolio for Krishna Raju S that you dive through: 200 metres down, to where the ocean's sunlight zone ends. Scroll position is depth.

- **Surface, 0 m:** bright water, light shafts and caustics. "How deep does it go?"
- **The shallows, 0 to 30 m:** the five jobs, oldest first.
- **Pressure, 30 to 60 m:** the numbers.
- **The reef, 60 to 100 m:** the nine production apps and the side projects.
- **Bioluminescence, 100 to 140 m:** the AI work, glowing from inside.
- **Found down here, 140 to 175 m:** awards, leadership and the photo sets.
- **The floor, 175 to 200 m:** skills and certificates.
- **200 m:** "Most people stay at the surface." Contact.

A gauge on the right shows depth, absolute pressure and the zone. The water is one fragment shader (`src/water.js`): its colour darkens with depth, the light dies out by about 60 m and marine snow drifts upward as you sink. Without WebGL the page falls back to a plain colour that still darkens.

## Sound

Nothing plays until the visitor chooses "Dive with sound". The score is synthesised in `src/score.js`, no audio files: a slow lo-fi loop (Fmaj7, Em7, Dm9, Cmaj7) on a soft electric piano. Above the water you hear waves; the plunge at 0 m is a rush of bubbles. From then on everything runs through a low-pass filter that closes with depth, the beat fades out by 60 m, scrolling makes bubbles, and past 120 m a sonar ping sounds every few seconds.

## Stack

Vite, React, plain CSS and WebGL. All facts come from `src/content.js`, shared with the other concept branches; `src/sections.jsx` renders them.

## Run

```bash
npm install
npm run dev
```

Visitors who ask for reduced motion get still water: the shader only redraws when the depth changes.
