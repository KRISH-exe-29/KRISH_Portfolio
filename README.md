# NIGHT SHIFT: Krishna Raju S

Branch `portfolio/night-shift`. His room at 2 a.m., built in WebGL. The hero is an isometric diorama (desk, two monitors, a brass lamp, a plant, a window, a corkboard, a shelf, a bed with a duvet) that drops into place piece by piece and then turns with the pointer. Everything is clickable: the monitors run the nine production apps and the 128-test dispatch suite, the corkboard pins his photos and experience, the shelf holds the awards and certificates, the window holds the AI work, the bed is the about page and the plant is the skills list. Scrolling pins the room and walks the camera around it, while the desk clock runs from 22:00 to a 06:12 sunrise by the end of the page. GitHub is the wall calendar: one sticky note per contribution day, coloured by count, with October 10 (60 contributions) spilling off the wall.

## Hooks
- **Words**: the honest, tired, funny voice of someone who ships at night. "Somebody's manual step became tonight's side quest." "Two monitors. Nine apps in production. Zero spreadsheets left behind." "October 10 ran out of wall." "The agent got twelve versions. I got zero hours of sleep."
- **Memes**: two intermissions. "1:47 a.m. The Excel has three sheets and a feeling." (chrome figure clutching its head) → "30 TO 40 MINUTES → UNDER 30 SECONDS". And "Walked into the 161 kV test bay as the intern." (pawn whose reflection is a king) → "R&D INTERN → ASSOCIATE ENGINEER".
- **Images**: his own photos pinned to the 3D corkboard (railway, Bühler, Indo Tech, Bühler badge) and through the page (portrait, Bühler kiosk, IIT Bombay, CED team, E-Cell, speaking, NEC poster).
- **Song**: "Duvet" (acoustic), on by default (it starts on the first click or key if the browser blocks autoplay); the "Music off" pill turns it off and remembers. When it plays, the lamp and monitor glow breathe with the bass, the plant sways and the stars twinkle.
- **Scroll**: Lenis and GSAP ScrollTrigger. The room is pinned and scrubbed through six camera stops (monitors, corkboard, calendar, shelf and bed, window, the whole room), the clock and the window sky advance to sunrise across the whole page, and the sticky notes pop onto the wall.
- **Transitions**: venetian blinds. Every section opens behind a set of slats that scrub open as it scrolls in; the memes are revealed by a lamp-light circle that brightens.
- **Surprise**: switch the desk lamp off (click it in the room, or the "Desk lamp" button; its hover label says it "has a switch"). The room goes dark, the camera turns to the back wall and glow-in-the-dark stars spell **9 APPS**, with the resume waiting underneath.
- **CTA**: the phone on the desk. Click it in the room and you land on a phone with a drafted message ("We have a manual step nobody likes. Can it be a button?"); slide to send opens email. The plain email address sits right next to it.

Accessibility: "Skip intro" or Escape ends the build, every object in the room also has a real button, the object panels are native dialogs (Escape closes), reduced motion shows the room still and the tour as a plain list, every link is labelled and focus is visible.

## Credits
Meme images from the owner's Pinterest boards (reused from earlier concepts). Song: "Duvet" (from the owner's music folder). 3D room modelled in code with three.js; no external models.

## Run
```sh
npm ci
npm run dev     # local
npm run build   # into dist/
```
All facts live in `src/content.js`. GitHub data comes from `src/github.json`, with the bio and repos refreshed at runtime from the public GitHub API when it's reachable. The 3D room (`src/room.js`) is lazy-loaded so the first paint never waits for three.js.
