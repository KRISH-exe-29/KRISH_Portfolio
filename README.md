# Glacier

A portfolio for Krishna Raju S, set in a frozen field you fly through. The opening shot is a transformer core sealed in a block of ice, with arcs crackling between its limbs. Scrolling moves the camera from stop to stop.

- **Monolith:** the name, the role and "Your next quick manual step is my next app."
- **Readings:** the five numbers.
- **In production:** nine blocks of ice, one per app, each with its own crystals grown inside and a lit object at the centre. The camera stops at each block while its name and pitch are on screen.
- **On the side:** three thin shards for the side projects.
- **AI:** a lattice that grows one node per Agent-Builder version, in step with the list of twelve, then the work-instruction assistant and AI in the browser.
- **Experience:** five frozen windings stacked in a column, oldest first. The one in front of the camera lights up.
- **Recognition and skills:** a field of shards behind the awards, E-Cell, the Bühler photo set, skills and certificates.
- **Contact:** a cloud of particles that turns into a ring, a lattice, a helix or a page depending on which link the pointer is on.

The scene (`src/scene.js`) is built in code. No model files are loaded. Each block is cut from a box or a hexagonal prism with random cleavage planes, and its crystals grow inside the shape. The pointer drives a ripple simulation that runs on the GPU. A post pass uses it to refract the frozen scene, and fast scrolling frosts the edges of the frame. `src/fx.js` holds the cursor, magnetic buttons, text scramble and the photo hover. If WebGL fails or the context is lost, the page shows a plain gradient behind the same content.

## Sound

Nothing plays until the visitor turns sound on in the top right. The soundtrack (`public/audio/soundtrack.mp3`) then loops, links click (`public/audio/click.mp3`), and audio pauses while the tab is hidden.

## Stack

Vite, React, three.js, GSAP (ScrollTrigger, SplitText, ScrambleText) and Lenis for smooth scrolling. All facts come from `src/content.js`, shared with the other concept branches.

## Run

```bash
npm install
npm run dev
```

Visitors who ask for reduced motion get native scrolling, a camera that cuts between stops instead of flying, no ripples and no text animation.
