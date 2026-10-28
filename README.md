# CLAW MACHINE: Krishna Raju S

Branch `portfolio/claw-machine`. An arcade prize cabinet, the KRISH-O-MATIC, standing on a cosmic arcade carpet. The hero is a live WebGL claw machine: 25 prize capsules (his nine production apps, seven awards, eight skills and one gold capsule) drop into the glass box with hand-written verlet physics, roll, stack and settle in about three seconds. Steer the claw with the pointer, the arrow keys or a tap, hit GRAB, and the claw goes down, closes, lifts, carries the capsule to the chute and drops it; the capsule pops open into that prize's card. Scrolling turns the cabinet and slides it off down the arcade: a pinned high-score board for his numbers, a photo booth strip for his jobs and photos, a level-select screen for his AI work, a ticket counter for his awards, and a GitHub ticket wall that prints one ticket per contribution day with 2026-10-10 (60 contributions) as the jackpot. Every public repo sits on the prize shelf.

## Hooks
- **Words**: arcade talk where the numbers are the punchlines. "Insert coin. Receive automation." "Rank 7 of 1500+. High score saved." "A 30-minute job, now 30 seconds. Speedrun certified." "Most people trade tickets for prizes. He skipped the tickets."
- **Memes**: two intermissions. "Monday, 9 a.m. A test plan that takes 2 hours lands on the desk." (Anya, "WE GO JIM") → "We go Python. Test planning went from 2 hours to 5 minutes." And "Bühler's Excel: 30 to 40 minutes a project. The claw machine: 'Try again.'" (Jesse looking back) → "He didn't try again. He built a tool. Under 30 seconds, and 90% of the manual calculation errors gone."
- **Images**: his own photos in the photo booth strip (Southern Railway, Bühler, Indo Tech), the bonus strip (Bühler kiosk and badge, E-Cell, speaking, NEC poster) and on the award tickets (CED team, IIT Bombay).
- **Song**: "YKWIM" (instrumental), on by default (it starts on your first click or key press if the browser blocks autoplay); the "Music off" pill turns it off and remembers that. When it plays, the marquee bulbs chase faster, the lamp inside the glass pumps and the capsules on the floor hop to the bass.
- **Scroll**: Lenis and GSAP ScrollTrigger. The hero is pinned and scrubbed: the cabinet turns to show its side art and slides away. The high-score board is pinned while its rows type in and count up. Photo booth frames develop from a flash, award tickets feed out of the dispenser, and the ticket wall prints day by day.
- **Transitions**: every section arrives behind a steel arcade roll-up shutter that lifts as you scroll; meme pictures open like a prize door.
- **Surprise**: the gold RESUME capsule is rigged. Grab it and it slips, every time ("Old-school players know the code"). Enter the Konami code (↑ ↑ ↓ ↓ ← → ← → B A), or knock five times on the pink operator-note sticker on a phone, and the claw goes RIGGED MODE: the bulbs turn pink, the claw hunts down the gold capsule, magnet-pulls it out from under the pile and wins you the resume. The high-score board hints at it: "No cheats used. Okay, one. It's in the claw."
- **CTA**: the prize chute. Press the big red button and a capsule drops down the chute, cracks open and shows his email, then your mail app opens. A plain email link sits right next to it.

Accessibility: "Skip intro" or Escape ends the entrance; reduced motion skips Lenis, pins and scrubs and shows the settled machine and every section as it is; the claw has a keyboard joystick (Tab to it, arrows to aim, Space or Enter to grab) and a "prize list" with every capsule as a button; prize cards are native dialogs; all links are real labelled links with a visible focus ring.

## Credits
Meme images via the owner's Pinterest boards. Song: "YKWIM" (instrumental, from the owner's music folder). Fonts: Bungee, Press Start 2P and Atkinson Hyperlegible from Google Fonts.

## Run
```sh
npm ci
npm run dev     # local
npm run build   # into dist/
```
All facts live in `src/content.js`. GitHub data comes from `src/github.json`, with repos and bio refreshed at runtime from the public GitHub API when it's reachable. The 3D scene (`src/clawScene.js`, plain Three.js, no physics library) is lazy-loaded so the first paint doesn't wait for it.
