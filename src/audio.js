// The score: slow ambient, synthesised here, no audio files. Call startScore() from a click.
const ROOTS = [146.83, 130.81, 110, 98, 82.41, 73.42] // the chord steps down once per level
const BELLS = [2, 2.25, 3, 3.375, 4, 4.5] // a pentatonic scale above the root

export function startScore() {
  const ac = new AudioContext()
  const now = () => ac.currentTime
  const limiter = ac.createDynamicsCompressor()
  const master = ac.createGain()
  master.gain.value = 0
  master.gain.setTargetAtTime(0.5, now(), 0.4)
  master.connect(limiter).connect(ac.destination)

  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 2200
  filter.connect(master)

  // An echo, so single notes leave a tail.
  const echo = ac.createDelay(1)
  const tail = ac.createGain()
  echo.delayTime.value = 0.43
  tail.gain.value = 0.42
  echo.connect(tail).connect(echo)
  tail.connect(master)

  // The pad: two detuned saws on the root, a sub below, a fifth and a tenth above.
  const pad = [[1, 'sawtooth', -7, 0.09], [1, 'sawtooth', 7, 0.09], [0.5, 'sine', 0, 0.3], [1.5, 'triangle', 3, 0.1], [2.5, 'sine', -4, 0.06]]
    .map(([ratio, type, detune, level]) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = type
      osc.detune.value = detune
      osc.frequency.value = ROOTS[0] * ratio
      gain.gain.value = level
      osc.connect(gain).connect(filter)
      osc.start()
      return { osc, ratio }
    })

  const swell = ac.createOscillator()
  const swellDepth = ac.createGain()
  swell.frequency.value = 0.06
  swellDepth.gain.value = 90
  swell.connect(swellDepth).connect(filter.frequency)
  swell.start()

  let level = 0
  let lastHit = 0

  // A low thump as the camera crosses into a new level.
  const hit = () => {
    if (now() - lastHit < 0.6) return
    lastHit = now()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.frequency.setValueAtTime(120, now())
    osc.frequency.exponentialRampToValueAtTime(36, now() + 0.9)
    gain.gain.setValueAtTime(0.0001, now())
    gain.gain.exponentialRampToValueAtTime(0.6, now() + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now() + 1.6)
    osc.connect(gain).connect(master)
    osc.start()
    osc.stop(now() + 1.7)
  }

  // A single soft note every few seconds, picked from the scale over the current root.
  const bell = () => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.frequency.value = ROOTS[level] * BELLS[Math.floor(Math.random() * BELLS.length)]
    gain.gain.setValueAtTime(0.0001, now())
    gain.gain.exponentialRampToValueAtTime(0.09, now() + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, now() + 3)
    osc.connect(gain)
    gain.connect(filter)
    gain.connect(echo)
    osc.start()
    osc.stop(now() + 3.1)
  }
  const bells = setInterval(() => { if (ac.state === 'running') bell() }, 3400)

  const onHide = () => (document.hidden ? ac.suspend() : ac.resume())
  document.addEventListener('visibilitychange', onHide)

  return {
    // d is the dive depth: 0 at the surface, 5 at ground.
    setDepth(d) {
      const i = Math.max(0, Math.min(ROOTS.length - 1, Math.round(d)))
      if (i !== level) {
        level = i
        hit()
        pad.forEach((v) => v.osc.frequency.setTargetAtTime(ROOTS[i] * v.ratio, now(), 0.7))
      }
      filter.frequency.setTargetAtTime(2200 * 0.7 ** d, now(), 0.3)
    },
    stop() {
      clearInterval(bells)
      document.removeEventListener('visibilitychange', onHide)
      master.gain.setTargetAtTime(0, now(), 0.25)
      setTimeout(() => ac.close(), 1200)
    },
  }
}
