# DEALT: Krishna Raju S

Branch `portfolio/dealt`. A high-stakes card table where the recruiter is the player and every card is dealt in their favour. The hero deals 34 custom playing cards (⚡ engineering, ⌘ code, ✦ AI, ♛ awards: apps, internships, awards, AI projects and repos) into a wheel under a dusk sky, then lifts it above a cloud bank: "The house always wins. Today, you're the house." Scrolling deals "Your hand", five face-down cards that flip into his five numbers and end in a royal flush. GitHub becomes a pop-up city of folded cards, one building per public repo, and the contact section is a cash-out: drag the chip stack into the pot.

## Hooks
- **Words**: casino copy with numbers as punchlines. "No bluffing. Every number is on GitHub." "Odds of a manual task surviving him: 0%." "All in on automation."
- **Memes**: two "dealer's break" intermissions. "Oi. Recruiter." (Billy Butcher meme) → "He doesn't do enthusiasm. He does production." And "eaaaa vazhka nadakamahhh 🙃" → "2 h → 5 min. The drama got automated."
- **Images**: his own photos (portrait, railway, Bühler, Indo Tech, IIT Bombay, E-Cell) and Pinterest pins for the sky, the cloud bank and the memes.
- **Song**: "Lady Love", on by default (it starts on your first click or key press if the browser blocks autoplay) and the "Music off" pill turns it off and remembers that. When it plays, the chips and cards bounce to the bass and the table light warms.
- **Scroll**: Lenis and GSAP ScrollTrigger. A pinned, scrubbed "Your hand" scene, a pop-up city that unfolds on scroll, and scrubbed meme reveals.
- **Transitions**: velvet curtains lift off each section, clip-path reveals, and nav jumps glide with Lenis.
- **Surprise**: drag the wheel backwards, fast, and a hidden 35th card (the Joker) deals itself. It's the resume. There's also a "Leaving with chips still on the table?" exit moment.
- **CTA**: drag the chip stack into the pot to open email. A plain "Cash out by email" button sits next to it.

Accessibility: Escape, Tab or "Skip the deal" ends the entrance, reduced motion shows everything with no animation, and every card is a real, labelled link.

## Credits
Some images via the owner's Pinterest boards. Song: "Lady Love" (from the owner's music folder).

## Run
```sh
npm ci
npm run dev     # local
npm run build   # into dist/
```
All facts live in `src/content.js`. GitHub data comes from `src/github.json`, refreshed at runtime from the public GitHub API when it's reachable.
