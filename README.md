# AQUARIUM: Krishna Raju S

Branch `portfolio/aquarium`. A vintage goldfish-shop tank you look into. The hero is a WebGL aquarium (Three.js) that fills with water, then has nine fish poured in, one per production app in `content.js`, each with its own species, shape and colour (comet goldfish, angelfish, zebra danio, kohaku koi, telescope-eye moor, ranchu, betta, guppy, pufferfish). They school around your pointer under moving caustic light, rising bubbles and glass refraction, and the fish whose name you point at in the "In stock" list swims up to the glass. Scrolling lowers you through the tank in one pinned, scrubbed scene: the surface (who he is), the reef (a water report of his numbers) and the sand (the keeper, with his portrait). Below the tank: experience as specimen jars on a shelf, field notes and fish-show ribbons, an agent raised from fry, and GitHub as a coral reef where every repo is a coral branch and every day of the last year is plankton that glows by contribution count. It ends with a message in a bottle.

## Hooks
- **Words**: tank-keeping copy with the numbers as punchlines. "Most automations die in the first week. These nine are still swimming." "In stock: 9 · all alive." "Mid-tank reading. Every level healthy." "The reef grows one commit at a time." "Yes, one of them is from an actual Fish Tank. He has form with tanks."
- **Memes**: two fishbowl intermissions. "Test planning used to take two hours. He looked at it like this." (Jesse side-eye) → "2 hours → 5 minutes." And Bühler's by-hand Excel sizing (a very tired chrome man) → "30–40 minutes → under 30 seconds. And 90% of the manual calculation errors, gone."
- **Images**: his own photos: portrait in the sand-layer porthole, Southern Railway, Bühler and Indo Tech inside the jars, the Bühler kiosk and badge, E-Cell, speaking, NEC, CED team and IIT Bombay.
- **Song**: "fish in the pool", on by default (it starts on your first click or key press if the browser blocks autoplay); the "Music off" pill turns it off and remembers that. When it plays, the bass drives the bubbles, the kelp, the light shafts and how hard the fish beat their tails.
- **Scroll**: Lenis and GSAP ScrollTrigger. The tank is pinned while scroll scrubs the camera down from surface to reef to sand, with a depth gauge on the glass. The jars fill with water as the shelf scrolls in, and the coral reef grows branch by branch.
- **Transitions**: each section arrives flooded and drains as it reaches you (a wavy waterline sinks off the content), and the meme bowls drop in with a bounce.
- **Surprise**: the sign says "Please do not tap the glass." Tap the glass three times anyway (or press the sign three times) and the fish startle, then line up in a row holding letters: HIRE KRISH.
- **CTA**: uncork the message in a bottle; the note inside unrolls with his address and a "Send your message" email link. Plain email, LinkedIn, GitHub and résumé links sit right next to it.

Accessibility: Escape or "Skip intro" ends the water-filling entrance, reduced motion shows every layer as a still page with no animation, every fish in the list, coral branch and contact is a real labelled link (the reef also has a plain list), and focus is always visible.

## Credits
Memes via the owner's Pinterest boards; they belong to their makers. Song: "fish in the pool" (from the owner's music folder). Fonts: Zen Antique Soft, Zen Kaku Gothic New and Courier Prime (Google Fonts).

## Run
```sh
npm ci
npm run dev     # local
npm run build   # into dist/
```
All facts live in `src/content.js`. GitHub data comes from `src/github.json`, with the repo list refreshed at runtime from the public GitHub API when it's reachable. The Three.js tank (`src/tank.js`) is lazy-loaded in its own chunk.
