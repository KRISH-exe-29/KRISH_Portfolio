# Krish.exe

A portfolio for Krishna Raju S built as a close recreation of [string-tune.fiddle.digital](https://string-tune.fiddle.digital/) in his own subject: near-black page, giant grotesk type, one red accent, and a 3D power transformer where that site has a katana.

- **Hero:** the stacked headline, the giant wordmark, and the transformer close up and diagonal.
- **Wake:** a pinned run of four lines that sharpen out of a blur while the unit turns.
- **Field guides:** five postings, oldest first, with the Bühler notebook.
- **Skill hub:** the nine production apps as a bento grid with a pointer spotlight.
- **What it thinks with:** the AI work in three panels.
- **Ship:** four giant letters and four numbered facts.
- **On the record:** milestones as a pinned horizontal run, then leadership, certificates and skills.
- **Start a project:** contact and the wordmark.

Amp, the pixel foreman in the corner, says one line per section. Sound is off until the visitor turns it on.

## Stack

Vite, React, plain CSS. Smooth scrolling, scroll progress and text splitting come from StringTune; the hero sequence and entrances use [anime.js](https://animejs.com/) v4; the transformer is a procedural [three.js](https://threejs.org/) model with no external assets. All facts live in `src/content.js`, shared with the other concept branches.

## Run

```bash
npm install
npm run dev
```

Phones and visitors who ask for reduced motion get native scrolling, no pinned sections and a still transformer.
