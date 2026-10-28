# DARKROOM: Krishna Raju S

Branch `portfolio/darkroom`. A photographer's darkroom under red safelight, where every manual task is a negative and he develops it. The hero is a WebGL room: his photos drop onto drying lines at different depths, start as blank paper and develop as the camera reaches them (a shader brings the shadows up first, then the highlights, with chemical grain and a tide line). Scrolling pins the room and dollies the camera down the lines, craning over each wire: the portrait first, then five prints, one per chapter of his experience, oldest first. The trays develop his five numbers like prints. GitHub is a contact sheet, one tiny frame per contribution day exposed by its count, with the best day (2026-10-10, 60) circled in grease pencil, and his repos as a roll of frames. The exit is the last print still in the tray.

## Hooks
- **Words**: darkroom copy with numbers as punchlines. "Every manual task is just a negative. He develops it." "Nine negatives. All printed. Zero spreadsheets left behind." "Numbers come up slowly. Then all at once." "60 in one day. Print this one."
- **Memes**: two intermissions. "Just do it in Excel. It only takes 30 minutes." (Jesse side-eye) → "30 MIN → 30 SEC", the Bühler tool. And "The intern looked in the mirror and saw a different job title." (pawn, king reflection) → "R&D INTERN → ASSOCIATE ENGINEER".
- **Images**: his own photos hang on the drying lines (portrait, railway, Bühler, Indo Tech, IIT Bombay, E-Cell, speaking, NEC, CED team, Bühler kiosk and badge) and are pinned to the wall with tape. Prints without a photo (Mettur, Inovate) are typeset prints.
- **Song**: "for a moment", on by default (it starts on your first click or key press if the browser blocks autoplay); "Music off" turns it off and remembers that. When it plays, the safelight pulses and the prints sway and brighten with the bass.
- **Scroll**: Lenis and GSAP ScrollTrigger. The pinned, scrubbed dolly down the drying lines; tray prints scrub from blur to sharp while their numbers count up; the grease pencil draws its circle as you scroll; the nine app negatives turn into positive prints.
- **Transitions**: enlarger easel blades open on every section (scrubbed clip-path), with film edge markings ("KRISH 400 · SAFETY FILM") between them.
- **Surprise**: the red "Do not turn on the light" sign in the header is a pull cord. Pull it and the white light comes on: every print on the line fogs to black, the room turns paper white and a hidden message develops ("Your next quick manual step is my next app.") with the resume, which was in the light-safe box. Turn the safelight back on and the prints develop again from blank.
- **CTA**: drag the last print up out of the tray. It develops into his email as it rises and opens your mail. Click or Enter works too, and a plain email link sits right next to it.

Accessibility: Escape or "Skip intro" ends the entrance (Escape also turns the safelight back on), reduced motion skips WebGL and shows every print, number and caption as a static page, every link is a real labelled link, focus is visible and the music control is a labelled button.

## Credits
Meme images via the owner's Pinterest boards (reused from earlier concept branches). Song: "for a moment" (from the owner's music folder). Fonts: Instrument Serif, Instrument Sans and JetBrains Mono (Google Fonts).

## Run
```sh
npm ci
npm run dev     # local
npm run build   # into dist/
```
All facts live in `src/content.js`. GitHub data comes from `src/github.json`; the repo list is refreshed at runtime from the public GitHub API when it's reachable (contribution days need an authenticated API, so they stay on the snapshot). The 3D room (`src/darkroom.js`, three.js) is lazy-loaded so it never blocks the first paint.
