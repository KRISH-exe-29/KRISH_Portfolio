# Krishna Raju S | Swarm

The portfolio of Krishna Raju S, an electrical engineer who ships software, drawn entirely with iron filings.

One field of 40,000 particles (12,000 on a phone) is every illustration on the site. On load it gathers into his name. As you scroll it re-forms for each chapter: a transformer for the internships, a street light for the patent, a 7 for the IIT Bombay ranking, nine tiles for the apps, a neural net for the AI work and a paper plane for contact. Scroll fast and the shape scatters. Move the pointer through it and the filings get out of the way.

All the text is ordinary page content sitting over the canvas. Visitors who ask for reduced motion get still drawings that swap between chapters with no flight.

## Run it locally

```sh
npm install
npm run dev
```

`node src/morph.check.js` checks the scroll and sampling maths. All facts live in `src/content.js`. Built with Vite and React. The particles are raw WebGL with a Canvas 2D fallback, and the shapes are sampled from drawings made in code, so there are no model or image files behind them.

## The music

There are no audio files. `src/audio.js` synthesises a melodic techno loop at 124 bpm with the Web Audio API: kick, clap, hats, an off-beat bass and an arpeggio. Scrolling opens the filter and brings the hats up, and each chapter has its own arpeggio. It is off until you press Sound.

## Contact

krishnarajus2004@gmail.com | [LinkedIn](https://linkedin.com/in/krishnarajus2004) | [GitHub](https://github.com/KRISH-exe-29)
