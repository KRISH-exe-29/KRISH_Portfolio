# Comeback Arc

Krishna Raju S's portfolio told as a manga training arc. The cover is a ring of 16 manga panels that deals itself out while the page loads, then opens into a spinning carousel of chapter covers. Scroll reads like a manga: panels cut in on slanted gutters, speed lines wipe between chapters, and SFX lettering (ガタン ゴトン, ゴゴゴ, DOOON) lands with the numbers. Ch.1 Origin (Southern Railway, Mettur), Ch.2 Training arc (Inovate, Bühler, with a pinned "30 minutes → 30 seconds" power-up), Ch.3 Final form (Indo Tech: 9 apps, 128 tests, 161 kV), Ch.4 The AI awakening (Agent-Builder's 12 versions as 12 forms), a GitHub city drawn from his repos with a power-level scouter, Ch.5 Tournament arc, a flashback spread, and a final two-page spread where the reader turns out to be the new rival.

## Hooks

- **Words**: shonen narration boxes. "He didn't get stronger. He got automated." "Power level: 9 apps in production."
- **Memes**: two omake (bonus page) intermissions. Anya Forger for "Waku waku: a recruiter is reading this", and "scared and tired" for "Me before automation / me after". Each ends in a stamped reframe.
- **Images**: his own photos inked in grayscale with a screentone, beside his Pinterest pins.
- **Song**: off by default. "Play flashback" turns the page (a paper sheet sweeps across), scrolls to the flashback spread, and the piano's loudness drives a slow ink-bleed reveal through an analyser node.
- **Scroll**: Lenis plus GSAP ScrollTrigger. Pinned power-up, pinned horizontal run of the twelve forms, scrubbed page turn.
- **Transitions**: clip-path panel reveals that follow each panel's slanted cut, speed-line wipes, page-turn sweep, speech-bubble form that bursts into a shout on submit.
- **Surprises**: scroll very fast and you trigger a LIMIT BREAK (the page shakes, ink splats). The last spread flips its page to reveal "A new rival appears… it's you."
- **GitHub**: one building per public repo, height from log2(size in KB), seen from a rooftop where the hero stands. Repos refresh from the GitHub API at runtime and fall back to `src/github.json` silently.
- **Nav**: every anchor scrolls through Lenis with easing. Escape, Tab or "Skip intro" ends the entrance. Reduced motion gets a calm, complete static book.

## Credits

Song: "Drowning Love (Kou wo OiKakete): Chasing Kou", piano cover (`public/audio/chasing-kou.mp3`). Some images via the owner's Pinterest boards (`public/img/pins/`).

## Run it

```sh
npm ci
npm run dev     # local
npm run build   # into dist/
```

All facts live in `src/content.js`; GitHub numbers in `src/github.json`.
