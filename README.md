# Sweep

A portfolio for Krishna Raju S, read like an SFRA test: a frequency sweep from 20 Hz to 2 MHz, where each band reads a different part of a transformer. Scroll position is the frequency.

- **Hero, 20 Hz:** the three phase responses (red, yellow, blue) draw in behind the headline.
- **Core, 20 Hz to 2 kHz:** experience, oldest first, with a sticky plate for the entry in view.
- **Main windings, 2 kHz to 20 kHz:** the nine production apps as a pinned horizontal run.
- **Winding interaction, 20 kHz to 400 kHz:** the AI work; the agent's twelve versions light up in order.
- **Leads and connections, 400 kHz to 2 MHz:** milestones, leadership, certificates, skills and contact.

The trace is synthetic (see `src/sweep.js`); it is shaped like a real response but is not measured data.

## Stack

Vite, React, plain CSS. Smooth scrolling and scroll progress come from [StringTune](https://string-tune.fiddle.digital/); entrances and the hero sequence use [anime.js](https://animejs.com/) v4. All facts live in `src/content.js`, shared with the other concept branches.

## Sound

Sound is off until the visitor turns it on. Hover ticks, clicks and the note played on entering each band are synthesized in `src/sound.js`. The music is "Floating Cities" by Kevin MacLeod (incompetech.com), licensed under Creative Commons: By Attribution 4.0, https://creativecommons.org/licenses/by/4.0/. The credit shown at the foot of the page must stay while the track is used.

## Run

```bash
npm install
npm run dev
```

Phones and visitors who ask for reduced motion get native scrolling, no pinned sections and no entrance animation.
