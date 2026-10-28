# ORBIT: Krishna Raju S

Branch `portfolio/orbit`. A hand-built planetarium printed in observatory brass on night ink and star-chart paper. The hero is a WebGL solar system that assembles itself out of 7,000 grains of dust in under three seconds: his name is the star at the centre, and each experience in `content.js` (Southern Railway, Mettur, Inovate, Bühler, Indo Tech) is a halftone-engraved planet whose orbit radius grows with the year. Scrolling pins the system and flies the camera planet to planet, with each planet's photo and story docking beside it, then pulls back above the plane to show his GitHub: an asteroid belt with one rock per public repo (sized and lit by recent activity, forks in grey), ringed by a year of contribution days as stars you can hover for dates. The best day, 10 October 2026 with 60 contributions, is a supernova. The nine Indo Tech apps are moons around the newest planet.

## Hooks
- **Words**: orbit, launch and re-entry copy with the numbers as punchlines. "Nine apps in orbit. Zero spreadsheets survived re-entry." "60 contributions in one day. Astronomers call that a supernova. The calendar calls it a Saturday." "Some people name stars. He patented street lights."
- **Memes**: two "transmission received" intermissions, each in a brass porthole. "Mission control: 'How long does test planning take?'" (Jesse side-eye) → "2 HOURS → 5 MINUTES." And "Bühler, before the tool: every project sized by hand in Excel." (the tired chrome man) → "30–40 MINUTES → UNDER 30 SECONDS", with 90% of the calculation errors burned up on re-entry.
- **Images**: his own photos dock beside their planets (railway, Bühler, Indo Tech), plus the Bühler kiosk and badge, the E-Cell crew, the talk, the NEC poster, IIT Bombay and the CED team in the ground-station logbook, and his portrait as the star in the launch pad.
- **Song**: Ichiko Aoba, "Parfum d'étoiles", on by default (it starts on your first click or key press if the browser blocks autoplay); the "Music off" pill turns it off and remembers that. When it plays, the dust swells, the sun's corona breathes and the supernova pulses with the low end.
- **Scroll**: Lenis and GSAP ScrollTrigger. One pinned, scrubbed flight through the system (hero, five planets, the belt), with damped camera moves and orbits that slow down while you read.
- **Transitions**: each paper chart rises over the ink like a planet's disc (a scrubbed circular eclipse), and a brass moon in the corner of every ink section waxes as it scrolls in.
- **Surprise**: the hero hint says "Charts like this were made to be spun." Drag the system sideways, hard, and the five planets swing into a syzygy along a red line, and the full flight log (his resume) appears.
- **CTA**: drag the comet into his star (his portrait) to launch an email. Pressing the comet with Enter launches it too, and a plain email link sits right next to it.

Accessibility: Escape or "Skip intro" ends the assembly, reduced motion shows the finished system and every story as a plain list with no animation, every repo, app and contact is a real labelled link, and focus is visible in brass.

## Credits
Song: Ichiko Aoba, "Parfum d'étoiles". Meme images via the owner's Pinterest boards; memes belong to their makers. Built with Three.js, GSAP and Lenis.

## Run
```sh
npm ci
npm run dev     # local
npm run build   # into dist/
```
All facts live in `src/content.js`. GitHub data comes from `src/github.json`, with the repo list refreshed at runtime from the public GitHub API when it's reachable. The three.js scene (`src/orbit.js`) is a lazy chunk so the first paint never waits on it.
