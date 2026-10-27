# NOW SHOWING: AUTOMATE

Krishna Raju S's career, released as a film. A projector flickers, a film-leader countdown (5-4-3-2-1) threads the reel while the real assets load, and the title card slams in: **KRISHNA RAJU S in AUTOMATE**. A scroll-scrubbed trailer ("In a world… where factories ran on spreadsheets… one engineer… said no.") leads to a pinned poster wall of nine minimalist app posters (one colour each, Mahaan-poster inspired, rated *U/A: Unbelievable Automation*), the internships as prequels, two INTERVAL blocks, a festival run of laurel wreaths, a split-flap box office filmed on location in Commit City, a tear-off ticket to book the show, end credits, and a post-credits scene that teases the sequel at your company.

## Hooks
- **Words**: trailer narration, "Box office: 9 apps. Budget: one engineer.", numbers ticker, every number from `src/content.js`.
- **Memes**: two intermissions with curtains that open on scroll. Interval 1: Jesse Pinkman, "Yeah, Python!" → ELECTRICAL ≠ OFF-TOPIC. Interval 2: "Eaaaa vazhka nadakamahhh 🙃" → QUICK MANUAL STEP = NEXT APP.
- **Images**: his own photos (portrait, railway, Bühler, Indo Tech, IIT Bombay, E-Cell, speaking) plus Pinterest pins in `public/img/pins/`.
- **Song**: "FIN DE LA ODISEA" (`public/audio/fin-de-la-odisea.mp3`) starts only on "Start the show". The title card waits for the first swell (Web Audio analyser), and a projector beam in the corner pulses with the score. Toggle from the header.
- **Scroll**: Lenis + GSAP ScrollTrigger. Pinned trailer, horizontal poster wall with parallax motifs, pinned intervals, scrubbed contribution chart and credits roll.
- **Transitions**: velvet curtain wipes, clip-path slates and photo reveals, eased Lenis nav jumps.
- **Surprise**: after the credits, type your company and get a downloadable "KRISHNA × [your company]: coming soon" poster (canvas → PNG).
- **CTA**: a ticket stub you drag (or press) to tear off, then a magnetic "Email the director" button. Leaving early triggers a "post-credits scene?" prompt.
- **GitHub**: snapshot in `src/github.json`, refreshed at runtime from the public GitHub API with a silent fallback.

Reduced motion skips the leader and pins and shows a calm, complete page.

## Credits
Score: "FIN DE LA ODISEA", from the owner's music folder. Some images via the owner's Pinterest boards (Mahaan minimalist poster, Jesse Pinkman, the Tamil "vazhka nadakam" meme).

## Run it
```sh
npm ci
npm run build   # outputs dist/
```
All facts live in `src/content.js`.
