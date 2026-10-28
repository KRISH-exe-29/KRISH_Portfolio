# CLOUDLINE: Krishna Raju S

Branch `portfolio/cloudline`. From the factory floor to the cloud. He leads the OT-IT integration of sensors, energy meters and cloud at Indo Tech, so the page is one continuous vertical flight. It starts at ground level, on a transformer test bay and a desk of floating app windows, with sensors pinging and data packets rising off them. Scrolling lifts the camera through a raymarched WebGL cloud deck lit by a low sun. You see the cloud bottoms from below, fly through a whiteout, then come out over a golden sea of clouds. Each altitude band is a chapter. The climb log (2023 to 2026, with his photos) is the low layer. The nine apps float inside the cloud as glowing, linked nodes. The AI work is at cruising altitude, the twelve Agent-Builder versions climb as flight levels FL010 to FL120, and GitHub is the weather report. A live altimeter and chapter index stays on the left the whole way up.

## Hooks
- **Words**: altitude and weather copy where the numbers are the punchlines. "Head in the cloud, boots on the factory floor." "Forecast: 100% chance of automation." "138 contributions. Scattered showers, one thunderstorm." "Everyone talks about moving to the cloud. He moved the paperwork."
- **Memes**: two "In-flight entertainment" seat-back screens. "Hardware documentation sized by hand in Excel. 30 to 40 minutes a project." (overwhelmed chrome figure, "The spreadsheet at minute 39.") → "UNDER 30 SECONDS. 90% FEWER CALCULATION ERRORS." And "Test planning? Two hours per unit. That's just how it's done." (Jesse side-eye) → "2 HOURS → 5 MINUTES."
- **Images**: his own photos on the climb log (railway, Bühler with the kiosk and badge, Indo Tech), the flight log (IIT Bombay, CED team) and an E-Cell boarding pass (team, speaking, NEC poster). Higgsfield isometric renders of the test bay and the desk on the factory floor. The landing uses the Pinterest pin of a cloud wall over a golden field.
- **Song**: "Chasing Kou" (piano). It's on by default and starts on your first click or key press if the browser blocks autoplay. The "Music off" pill turns it off and remembers that. While it plays, the bass brightens the sun and the clouds, swells the rising packets, makes the app nodes glow and drives the pill's equaliser.
- **Scroll**: Lenis plus GSAP ScrollTrigger. The hero is pinned and scrubbed: the factory floor sinks away while the WebGL camera climbs and three captions play out ("0 ft: a 161 kV test bay." / "Sensors talk. Energy meters talk." / "Somebody has to carry it all to the cloud."). Camera height, pitch and light are interpolated from each chapter's altitude, so the sky follows you continuously. Instrument gauges sweep and count up, flight levels climb in order, and the repo balloons are released from below.
- **Transitions**: you fly through cloud banks. Parallax layers of puffs sweep over the screen between chapters (night haze, the white cloud base, golden tops). Cards come out of the haze, from blurred to sharp. The meme screens power on like seat-back screens.
- **GitHub as weather**: each of the last 367 days drops rain in proportion to its contribution count under a cloud-cover line. The best day (10 Oct 2026, 60) is a storm cloud whose lightning also flashes the WebGL clouds. Hover any day for its forecast ("Showers", "Thunderstorm"). Public repos are weather balloons, sized by repo size and coloured by language, and refreshed live from the GitHub API when it's reachable.
- **Surprise**: a paper plane crosses the sky now and then once you're airborne (the altimeter's only hint is "Traffic: 1 paper plane, unidentified"). Catch it and it unfolds into a handwritten note, stamped with the altitude where you caught it. It carries his resume. With reduced motion, the plane is parked by the landing instead.
- **CTA**: "Let go of the balloon": the red balloon tagged with his email inflates, floats away and opens your email app. Plain Email, LinkedIn, GitHub and Resume links sit right next to it.

Accessibility: the pre-flight screen reports what is really loading, and "Take off", Enter, Esc or "Skip intro" ends it. Reduced motion skips the intro, WebGL and pins, and shows everything over a painted gradient sky. Every app, repo and contact link is a real, labelled link, the note is a native dialog with Escape, and focus rings are visible. Phones get a lighter sky (fewer raymarch steps, fewer packets, lower resolution), and the sky drops resolution on its own if frames run slow.

## Credits
3D renders generated with Higgsfield from the owner's own photo (test bay and desk dioramas). The golden cloud-wall backdrop and the meme images come from the owner's Pinterest boards. Song: "Chasing Kou" (from the owner's music folder). Fonts: Bricolage Grotesque, Instrument Serif and JetBrains Mono (Google Fonts).

## Run
```sh
npm ci
npm run dev     # local
npm run build   # into dist/
```
All facts live in `src/content.js`. GitHub data comes from `src/github.json`, and the repos are refreshed at runtime from the public GitHub API when it's reachable. The sky is in `src/sky.js`, lazy-loaded after first paint.
