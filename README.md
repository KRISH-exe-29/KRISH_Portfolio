# Reel

A portfolio for Krishna Raju S, cut like a project reel. The front page is an index of the nine production apps: hover a row and its cover floats up under the cursor, trailing it as if dragged under water; click and a butter-yellow curtain carries you into that app's page, with its title, a meta row, the cover and the next app waiting at the bottom. A toggle swaps the index for a grid of covers, which is also where phones start.

- **Open:** a dial counts the real loading, then lifts off the name.
- **Production reel:** the numbers, then the nine apps, each with its own page at `#/work/<app>`. Side projects follow as "Off the clock".
- **Agent-Builder:** its twelve versions as film frames, then the work-instruction assistant and AI in the browser.
- **Five stops, oldest first:** the jobs, then the Bühler photo set.
- **Credits:** awards and E-Cell with photos, then the kit (skills and certificates) and contact.

No screenshots of the apps exist, so `src/covers.js` draws each one a cover: its number, name and pitch over a motif (ripples, currents, a dot field or a bar log). Photos and covers are drawn as WebGL planes by `src/gl/stage.js`, which bends them with a ring wave and a slight colour split where the pointer is. `src/gl/water.js` runs a height-field wave simulation at quarter resolution; the pointer's path drags through it and the surface shows as moving light over the page. The cursor itself stretches along its velocity and grows a label over links.

## Stack

Vite, React, GSAP (ScrollTrigger, SplitText, Flip, CustomEase), Lenis and three.js. All facts come from `src/content.js`, shared with the other concept branches.

## Run

```bash
npm install
npm run dev
```

Visitors who ask for reduced motion get native scrolling, no WebGL and no reveals. Touch screens keep their own cursor, and browsers without WebGL see the plain photos and covers.
