# Krishna Raju S | Grid Run

**Live site: https://krish-exe-29.github.io/KRISH_Portfolio/**

The portfolio of Krishna Raju S, an electrical engineer who ships software, built as a night drive.

You steer a car down a highway at dusk, and every gate you pass is a stage of his career: five internships, an IIT Bombay ranking, a patent, nine production apps and his AI work. The street lights brighten as the car gets close, a nod to his patented street light.

- **Drive:** arrow keys or WASD on a keyboard, on-screen pedals on a phone. Scrolling moves the car too.
- **Route map:** the dots along the bottom jump straight to any gate.
- **Not in the mood to drive?** "Skip the drive, read the log" shows the same content as a normal page. Visitors who ask for reduced motion get the log first.
- **Sound** is off until you turn it on.

## Run it locally

```sh
npm install
npm run dev
```

`node src/game/track.check.js` checks the driving model. All facts live in `src/content.js`. Built with Vite and React; the road is drawn on a plain canvas.

## Deploying

Every push or merge to `main` rebuilds and publishes the site through GitHub Actions (`.github/workflows/deploy.yml`). It is usually live within a minute or two.

## Other concepts

Two alternative designs with the same content live on their own branches:

- `portfolio/issue-01`: a one-engineer magazine with type that reacts to your pointer.
- `portfolio/energize`: a single-line diagram that powers up as you scroll.

## Contact

krishnarajus2004@gmail.com | [LinkedIn](https://linkedin.com/in/krishnarajus2004) | [GitHub](https://github.com/KRISH-exe-29)
