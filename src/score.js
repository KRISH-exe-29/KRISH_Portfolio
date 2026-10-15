// The score: a music box under a planetarium dome, synthesised here, no audio files.
// A slow lullaby turns over on its own; every line the reader draws between two stars rings a
// brighter bell; under it all, the projector's motor runs and its shutter clatters at 24 frames.
const LEVEL = 0.6
// E major pentatonic, two octaves: the scale the stars ring in.
const STARS = [329.63, 369.99, 415.3, 493.88, 554.37, 659.25, 739.99, 830.61, 987.77, 1108.73]
// The lullaby: scale degrees, one per beat, with -1 for a rest.
const TUNE = [4, 2, 0, 2, 4, 5, 4, -1, 3, 2, 0, 1, 2, -1, -1, -1, 4, 5, 7, 5, 4, 2, 3, -1, 2, 1, 0, 1, 0, -1, -1, -1]
const BEAT = 0.62

let ac
let master
let bells
let motor
let muted = false
let step = 0
let nextAt = 0

function room(seconds) {
  const conv = ac.createConvolver()
  const len = Math.floor(ac.sampleRate * seconds)
  const ir = ac.createBuffer(2, len, ac.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  }
  conv.buffer = ir
  return conv
}

// A bell by frequency modulation: a sine bent by another at an inharmonic ratio, the bend
// fading faster than the tone so the strike is bright and the tail is pure.
function bell(freq, at, level, length = 3.2) {
  const carrier = ac.createOscillator()
  const mod = ac.createOscillator()
  const modGain = ac.createGain()
  const env = ac.createGain()
  carrier.frequency.value = freq
  mod.frequency.value = freq * 3.5
  modGain.gain.setValueAtTime(freq * 2.2, at)
  modGain.gain.exponentialRampToValueAtTime(1, at + length * 0.5)
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(level, at + 0.004)
  env.gain.exponentialRampToValueAtTime(0.0001, at + length)
  mod.connect(modGain).connect(carrier.frequency)
  carrier.connect(env).connect(bells)
  carrier.start(at)
  mod.start(at)
  carrier.stop(at + length + 0.05)
  mod.stop(at + length + 0.05)
}

function schedule() {
  if (nextAt < ac.currentTime) nextAt = ac.currentTime + 0.05 // skip beats missed while throttled
  while (nextAt < ac.currentTime + 0.15) {
    const note = TUNE[step % TUNE.length]
    if (note >= 0) bell(STARS[note], nextAt, 0.05)
    if (step % 16 === 0) bell(STARS[0] / 2, nextAt, 0.04, 5) // a low tone under each phrase
    step++
    nextAt += BEAT
  }
}

export function startScore() {
  if (ac) return
  ac = new AudioContext()
  document.addEventListener('visibilitychange', sleep)
  master = ac.createGain()
  master.gain.value = 0
  const limiter = ac.createDynamicsCompressor()
  master.connect(limiter).connect(ac.destination)

  bells = ac.createGain()
  const verb = room(5)
  const wet = ac.createGain()
  wet.gain.value = 0.45
  bells.connect(master)
  bells.connect(verb).connect(wet).connect(master)

  // The projector: a low motor and a 24 Hz shutter tick, both very quiet.
  const noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate)
  noise.getChannelData(0).forEach((_, i, d) => { d[i] = Math.random() * 2 - 1 })
  const hum = ac.createBufferSource()
  hum.buffer = noise
  hum.loop = true
  const humTone = ac.createBiquadFilter()
  humTone.type = 'bandpass'
  humTone.frequency.value = 140
  humTone.Q.value = 2
  motor = ac.createGain()
  motor.gain.value = 0
  hum.connect(humTone).connect(motor).connect(master)
  const shutter = ac.createOscillator()
  shutter.type = 'square'
  shutter.frequency.value = 24
  const shutterTone = ac.createBiquadFilter()
  shutterTone.type = 'highpass'
  shutterTone.frequency.value = 2400
  const shutterLevel = ac.createGain()
  shutterLevel.gain.value = 0.05
  shutter.connect(shutterTone).connect(shutterLevel).connect(motor)
  hum.start()
  shutter.start()
  motor.gain.setTargetAtTime(0.12, ac.currentTime + 0.2, 0.6)

  nextAt = ac.currentTime + 1.2
  setInterval(schedule, 40)
  master.gain.setTargetAtTime(muted ? 0 : LEVEL, ac.currentTime, 0.6)
  clack(ac.currentTime + 0.05)
}

// Muted or tab hidden: stop the audio clock, so no notes are built and none pile up for later.
function sleep() {
  if (!ac) return
  if (muted || document.hidden) setTimeout(() => (muted || document.hidden) && ac.suspend(), 400) // after the fade
  else ac.resume()
}

export function setMuted(next) {
  muted = next
  if (!ac) return
  sleep()
  master.gain.setTargetAtTime(muted ? 0 : LEVEL, ac.currentTime, 0.3)
}

// The lamp switch.
function clack(at) {
  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(220, at)
  osc.frequency.exponentialRampToValueAtTime(60, at + 0.05)
  env.gain.setValueAtTime(0.25, at)
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.08)
  osc.connect(env).connect(master)
  osc.start(at)
  osc.stop(at + 0.1)
}

// A line between two stars just closed. `n` picks the note, so a constellation plays a phrase.
// A jump across many edges at once arpeggiates the first few and drops the rest.
let nextRing = 0
export function ring(n) {
  if (!ac || muted) return
  const at = Math.max(ac.currentTime + 0.01, nextRing)
  if (at > ac.currentTime + 0.3) return
  nextRing = at + 0.07
  bell(STARS[n % STARS.length], at, 0.11, 4)
}
