# BRUSHSTROKE: Krishna Raju S

Branch `portfolio/brushstroke`. The whole site is one living post-impressionist painting. A full-screen WebGL shader paints a swirling night sky in thick impasto: strokes are a line-integral convolution of noise along a flow field (sky waves, two big eddies, the moon), advected so the paint keeps flowing, with a relief normal so every ridge catches a lamp that follows your pointer. Move the pointer and the sky swirls around it. On load the canvas starts as bare primed linen and paints itself in over about three seconds while his name settles into the hills. Scrolling travels through the landscape: the hills slide past in parallax, each job is a village with his photo hung in a gilt frame (a painterly glaze over the photo, still clearly him), and the night sky turns out to be his GitHub: one swirling star per day he contributed, brighter by count, with his best day (10 Oct 2026, 60 contributions) painted as the moon and every repo drawn as a constellation. A running gallery index on the left (rooms, with counts) shows where you are, and the joke all the way through is old-master framing around modern software.

## Hooks
- **Words**: gallery-label wit with numbers as punchlines. "Oil on factory floor, 2026. Nine apps, one artist." "Mettur Thermal Power Plant, 2024. Oil on 4 x 210 MW." "Every piece is in daily use at Indo Tech Transformers, which is more than most museum pieces can say." "The sky could only hold that as a moon."
- **Memes**: two intervals hung as framed museum pieces, wall label first, curator's note second. "Double Portrait with Matching Grins" (Billy Butcher and the pony) → "This artist skipped 'enthusiast' and went straight to 'in production': 9 apps, 128 tests guarding dispatch." "The Thinker (Chennai school)", eaaaa vazhka nadakamahhh → "Restored in 2026. Test planning now takes 5 minutes; the Transformer Test Planner did the restoration."
- **Images**: his own photos in gilt frames (Southern Railway, Bühler, Indo Tech, IIT Bombay, CED team, E-Cell, speaking, NEC poster, the Bühler kiosk and badge, the portrait). Jobs without a photo hang as "painted from the label" canvases.
- **Song**: "Great Fairy Fountain", on by default (it starts on the first click or key if the browser blocks autoplay); "Music off" turns it off and remembers. While it plays, the bass speeds up the paint flow and brightens the stars.
- **Scroll**: Lenis and GSAP ScrollTrigger on one shared ticker. A pinned, scrubbed village road (horizontal, frames tilt into place as they arrive) while the shader hills travel past, and a pinned night-sky room where the horizon sinks, the stars brighten and the repo constellations draw themselves.
- **Transitions**: a scrubbed gold-and-blue brushstroke is dragged across the page between every room, and room headings are revealed like a stroke of paint wiping across.
- **Surprise**: the hero label says "Signed lower right." The tiny "Krish '26" signature in the corner is a button: it turns the painting over to the verso, with his GitHub bio as the inscription on the stretcher bar, a certificate of authenticity (the resume) and a shipping label to his inbox.
- **CTA**: "Commissions open". Paint across a primed canvas in a gilt frame; once about a third is covered the commission is signed and your email opens. A plain email link, LinkedIn, GitHub and the resume sit right next to it.

Accessibility: Escape or "Skip intro" ends the paint-in, reduced motion shows the finished painting as a still with no pins, scrubs or smooth scroll, every link is a real labelled link, labels are dark text on cream, and keyboard focus is a visible gold ring. On small screens the shader renders at lower resolution with fewer stroke samples and drops resolution further if frames run slow.

## Credits
Meme images via the owner's Pinterest boards. Song: "Great Fairy Fountain" (from the owner's music folder). The painting is an original shader, inspired by the swirling night skies on the owner's Pinterest board, not a copy of any painting.

## Run
```sh
npm ci
npm run dev     # local
npm run build   # into dist/
```
All facts live in `src/content.js`. GitHub data comes from `src/github.json`; the repo list is refreshed at runtime from the public GitHub API when it's reachable.
