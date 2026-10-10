# Krishna Raju S | Kolam

The portfolio of Krishna Raju S, an electrical engineer who ships software, drawn as one line.

A kolam is the pattern drawn each morning on a Tamil doorstep: a grid of dots first, then one line of rice flour looped around them. This page works the same way. The dots are already down when you arrive. As you scroll, a single unbroken line weaves past them, running down the left of one chapter, crossing over, and running down the right of the next. Each chapter unfolds like paper as the line reaches it.

Two chapters have their own small kolam that stays pinned while you read: the five internships complete one ring each, and the nine apps are nine dots threaded one by one.

Visitors who ask for reduced motion get the finished drawing and every chapter already open.

## Run it locally

```sh
npm install
npm run dev
```

`node src/kolam.check.js` checks the line maths. All facts live in `src/content.js`. Built with Vite and React. The line is one SVG path generated from the page layout and rebuilt whenever the layout changes.

## The music

There are no audio files. `src/audio.js` builds a slow lo-fi beat with the Web Audio API: a soft kick, brushes, record crackle and a low drone. The melody is a plucked string, and you play it: every dot the line passes plucks the next note of the tune, so scrolling back up plays it in reverse. It is off until you press Sound.

## Contact

krishnarajus2004@gmail.com | [LinkedIn](https://linkedin.com/in/krishnarajus2004) | [GitHub](https://github.com/KRISH-exe-29)
