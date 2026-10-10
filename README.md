# Krishna Raju S | Step Down

The portfolio of Krishna Raju S, an electrical engineer who ships software, built as one long dive.

Scrolling moves the camera into the screen instead of down a page. You start at a 400 kV transmission line and fly through a tower into a 161 kV transformer test bay, through its nameplate into a 415 V control panel, through a lamp onto a 3.3 V circuit board, into the chip, and out at ground. Each level holds one part of his career, and the gauge on the left shows the voltage falling as you go. The gauge is also the menu.

Visitors who ask for reduced motion get the same six levels as a flat page with no flights.

## Run it locally

```sh
npm install
npm run dev
```

`node src/dive.check.js` checks the dive maths. All facts live in `src/content.js`. Built with Vite and React. The drawings are plain SVG, zoomed by scroll position.

## The music

There are no audio files. `src/audio.js` builds a slow ambient score with the Web Audio API: a pad whose chord steps down one note per level, a filter that closes as you go deeper, a low thump each time you cross into a new level, and a soft bell every few seconds. It is off until you press Sound.

## Contact

krishnarajus2004@gmail.com | [LinkedIn](https://linkedin.com/in/krishnarajus2004) | [GitHub](https://github.com/KRISH-exe-29)
