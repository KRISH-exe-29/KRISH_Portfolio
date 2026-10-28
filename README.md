# KEYCAP: Krishna Raju S

Branch `portfolio/keycap`. "I replace hours of work with scripts", told on a mechanical keyboard. The page opens with an honest boot loader in a terminal voice: it prints what is really loading (three fonts, the three.js scene chunk, how many keycaps it built, the shader compile, whether the GitHub API answered, whether the song buffered), then waits at `> PRESS ANY KEY`, which also starts the song. The hero is a WebGL keyboard with liquid-chrome modifiers, iridescent glass alpha keys and gold F-keys, lit from below by a glowing plate. The keys fall into the case in a wave, then type his name. Every key you press on your real keyboard presses the matching 3D key, with spring travel and a synthesized click. The nine production apps are a 3×3 pad of coloured keycaps: click one or press Numpad 1–9 to open that app. Scrolling turns and dollies the board: a pinned, scrubbed shot glides along F1–F5 (one function key per job, with his photos), goes top-down for the numbers, then flies to the GitHub heatmap, where every contribution day is a key raised and lit by its count and the best day (10 Oct 2026, 60 contributions) is the worn-out spacebar.

## Hooks
- **Words**: keyboard-shortcut copy with the numbers as punchlines. "Ctrl+Z for factories." "Same keys, fewer presses." "2 h → 5 min." "F1 to F5. One function key per job." "Ctrl+C your problem. Ctrl+V it here."
- **Memes**: two intermissions that open out of a keycap-shaped window as you scroll. "Me, watching someone retype a fastener spec sheet by hand." (chrome figure in horror) → "60+ specifications. One study. Straight to the CEO." And "Monday, 9 AM. Same Excel. Same forty minutes." (Anya, "we go script") → "30 to 40 minutes → under 30 seconds."
- **Images**: his own photos (Southern Railway, Bühler desk, kiosk and badge, Indo Tech, IIT Bombay, CED team, E-Cell, speaking, NEC poster) in the F-key cards, field notes, awards and leadership; Pinterest pins for the memes and the glass keycap on the Send key.
- **Song**: "FIN DE LA ODISEA", on by default (it starts on the first key or click if the browser blocks autoplay; the boot's "press any key" is that key). "Music off" turns it off, mutes the key clicks and remembers. While it plays, the underglow pulses with the bass and strong beats tap random glass keys.
- **Scroll**: Lenis and GSAP ScrollTrigger. The hero board turns as you scroll out; the experience section is pinned and scrubbed along the F-row; the camera cuts top-down for the numbers and flies to the heatmap, which rises one week at a time.
- **Transitions**: each section opens with a row of CSS keycaps that drop in and press themselves (the section's shortcut), panels rise out of the board like a key coming back up, and the meme images widen out of a keycap-shaped clip.
- **Surprise**: type the codename **phantom** (Project: Phantom, from his Inovate internship). The keyboard turns into a wireframe ghost and a hidden résumé key floats up out of the case; click it (or the link in the toast) for the PDF. Type it again to bring the keys back. The hint is the little keycap around "Phantom" in the F3 card, and a footer line about codenames.
- **CTA**: the Enter key on the board is labelled "send". In the last section, press Enter, click the 3D key or the big Send keycap and it types out a draft (to, subject, body) and opens your mail app. A plain email link sits right next to it.

Accessibility: Escape or "Skip intro" ends the boot at any time; reduced motion skips the boot and shows everything with no animation (the camera snaps, nothing tweens); every app, repo and contact is a real labelled link; focus rings are visible; the 3D scene is decorative and drops to a lighter material set and lower pixel ratio on small or touch screens.

## Credits
Some images via the owner's Pinterest boards (memes, glass keycap). Song: "FIN DE LA ODISEA" (from the owner's music folder). Key clicks are synthesized with Web Audio.

## Run
```sh
npm ci
npm run dev     # local
npm run build   # into dist/
```
All facts live in `src/content.js`. GitHub data comes from `src/github.json`; the repo list is refreshed at runtime from the public GitHub API when it's reachable.
