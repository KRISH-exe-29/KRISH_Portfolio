# ACTION FIGURE: Krishna Raju S

Branch `portfolio/action-figure`. The owner as a limited-edition collectible toy: "KRISH, Automation Engineer, Series 2026, 1 of 1". The hero is a real Three.js blister pack hanging on a pegboard: a bold blue backing card (with a die-cut euro hang tab), a clear plastic bubble, a textured 3D mesh of him and five accessories in their slots. The card flies onto its peg, the figure and accessories pop into place, and the plastic drops on. Drag the plastic and it peels off its hinge; the figure pops out and turns to face your pointer. Scrolling is the unboxing: a pinned, scrubbed scene where each accessory jumps out of its slot and he turns to look at it (laptop = the nine apps, hard hat = the 161 kV test bay at Indo Tech, multimeter = Bühler and 90% fewer errors, cable = the OT-IT integration, mini transformer = IEC 60076 testing). The back of the card is the series checklist, "Collect all 5 internships", with his photos stamped "Collected" as you scroll. GitHub is the bonus sticker sheet (one sticker per day, sized by contribution count, the best day a holographic chase sticker) and his repos are variant figures hanging on the toy-aisle pegs.

## Hooks
- **Words**: toy-ad copy with the numbers as punchlines. "Batteries not included. Automation is." "Now with 9 apps!" "Ages: any recruiter." "Operators are standing by. Well, one operator. It's him." "Small parts: 128 tests. Not suitable for manual processes."
- **Memes**: two "commercial breaks". "Every toy ad has a kid losing it over the box." (Anya, WE GO JIM) → "She's right to. 9 apps in production. 128 tests guarding dispatch." And "Some assembly required. Instructions: 30 to 40 minutes of Excel." ("feels hard") → "Now it's under 30 seconds, with 90% fewer calculation errors."
- **Images**: the Higgsfield 3D mesh and box art, his own photos on the checklist (Southern Railway, Bühler, Indo Tech) and in the accessory packs (Bühler kiosk and badge, E-Cell, speaking, NEC, IIT Bombay, CED).
- **Song**: "Lady Love", on by default (it starts on your first click or key press if the browser blocks autoplay); the "Music off" pill turns it off and remembers that. When it plays, the figure, the card and the accessory on show bounce to the bass and the key light pulses.
- **Scroll**: Lenis and GSAP ScrollTrigger on one ticker that also drives the 3D scene. The blister pack is pinned for five screens of scrubbed unboxing; sections swing down onto their pegs; the commercial-break TV scales in.
- **Transitions**: perforated "cut along the dotted line" strips between sections, with scissors that cut across as you scroll; chapter cards slide out of the card like accessories; each section swings onto a peg.
- **Surprise**: the card's fine print says "Chase variant inside. Give him a spin." Unbox him, then drag him round fast (or hit the spin button a few times) and he turns into the rare Golden Krish variant, 1 in 1 boxes. Its certificate of authenticity is the resume.
- **CTA**: a mail-in order coupon ("Quantity: 1, only one was made. Price: one email"). Press "Order now", the scissors cut the coupon out and it opens an email. A plain email link sits right under it.

Accessibility: Escape or "Skip intro" ends the entrance, a "Peel the plastic" button does the drag for keyboards, reduced motion turns off the pin, Lenis and every animation and lists the five chapters as plain cards, every link is real and labelled, and focus is always visible.

## Credits
3D renders generated with Higgsfield from the owner's own photo (`me-3d.glb`, `me-3d`, `me-action-figure`). Meme images reused from earlier concept branches. Song: "Lady Love" (from the owner's music folder).

## Run
```sh
npm ci
npm run dev     # local
npm run build   # into dist/
```
All facts live in `src/content.js`. GitHub data comes from `src/github.json`, with repos and bio refreshed at runtime from the public GitHub API when it's reachable. The 3D scene (`src/scene.js`, three.js) is a lazy chunk; the box art shows until it arrives.
