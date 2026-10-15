# Monsoon

A portfolio for Krishna Raju S, behind a rain-fogged window. Chennai, 11 pm, and it is pouring. The story sits behind the glass; move the cursor (or a thumb on a phone) and it wipes the fog away. Scroll and the storm eases, chapter by chapter, until the page ends on clear sky. "Some people wait for the storm to pass. I ship through it."

- **The window:** the opening line. A flash of lightning when you step in.
- **Chapters 1 to 5:** the jobs, oldest first: Southern Railway in Tambaram, Mettur Thermal Power Plant, Inovate Technologies, Bühler India, and Indo Tech Transformers today.
- **The downpour:** the numbers and the nine apps. Lightning, and the second song takes over.
- **After hours:** the agent, the work-instruction assistant and AI in the browser.
- **Thunder:** IIT Bombay rank 7, the trophy case and E-Cell. Lightning again.
- **Bengaluru:** the Bühler photo set, "wiped clear".
- **Side projects:** the rain thins out.
- **Clear sky:** contact, skills and certificates. "Send it over."

The weather (`src/rain.js`) is drawn live in Canvas 2D over a CSS backdrop of out-of-focus city lights: rain streaks behind the glass, a fog layer the pointer wipes and that slowly fogs back, beads of water, and runnels that cut clear trails as they slide down. The fog only covers the backdrop; every text card sits above it, so nothing you need to read is ever hidden. Rain intensity follows scroll position, and the stars come out on the last chapter. Lightning strikes once per big chapter, at most two flickers per flash and one flash every 1.2 seconds. Device pixel ratio is capped, phones get fewer drops, and the animation stops while the tab is hidden. Touch wiping uses passive listeners, so it never blocks scrolling.

## Sound

Nothing plays until the visitor enters with sound. The first half of the night has one song and the second half another (`public/music/monsoon-1.mp3`, `monsoon-2.mp3`), crossfaded through Web Audio by `src/music.js`. The second song loads only once the first starts. Scrolling fast closes a low-pass filter so the music sounds drowned, and it opens again when the reader stops. Each lightning flash brings a synthesized thunder roll, only with sound on, with a cooldown so rolls never stack. All audio pauses while muted or while the tab is hidden. The songs belong to their artists and are credited in the footer.

## Stack

Vite, React and Lenis for smooth scrolling; Canvas 2D for the weather, no WebGL. All facts come from `src/content.js`, shared with the other concept branches; `src/sections.jsx` renders them. Photos are always shown whole, never cropped.

## Run

```bash
npm install
npm run dev
```

Visitors who ask for reduced motion get native scrolling, a still pane of light rain with no animation, no lightning and no card animations.
