// The score: a home-made tape, synthesised here, no audio files.
// Side A is a warm electric-piano groove; side B is a slower plucked guitar. Under both, tape
// hiss and a slow wobble in pitch. Scrolling fast drags the tape: the pitch bends with it.
const LEVEL = 0.55
const SIDES = {
  A: {
    beat: 60 / 84 / 2,
    // Dmaj7, Bm9, Gmaj7, A6
    chords: [[146.83, 185, 220, 277.18], [123.47, 146.83, 185, 220, 277.18], [196, 246.94, 293.66, 369.99], [110, 138.59, 164.81, 185]],
  },
  B: {
    beat: 60 / 72 / 2,
    // Em9, Cmaj7, G, D/F#
    chords: [[164.81, 196, 246.94, 293.66, 369.99], [130.81, 164.81, 196, 246.94], [196, 246.94, 293.66, 392], [185, 220, 293.66, 369.99]],
  },
}
const PICK = [0, 2, 1, 3, 2, 4, 3, 2] // guitar finger pattern, side B

let ac
let master
let bus
let wow // a constant offset in cents, wired into every voice's detune
let hiss
let noise
let muted = false
let side = 'A'
let pausedUntil = 0
let step = 0
let nextAt = 0
const strings = new Map()

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

function osc(type, freq, at, stop) {
  const o = ac.createOscillator()
  o.type = type
  o.frequency.value = freq
  wow.connect(o.detune)
  o.start(at)
  o.stop(stop)
  return o
}

function rhodes(freq, at, level, length = 1.6) {
  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(level, at + 0.01)
  env.gain.exponentialRampToValueAtTime(0.0001, at + length)
  env.connect(bus)
  const tine = ac.createGain()
  tine.gain.value = 0.12
  osc('sine', freq, at, at + length).connect(env)
  osc('sine', freq * 4, at, at + 0.3).connect(tine).connect(env)
}

// A plucked string by the Karplus-Strong method: a burst of noise fed through a short, decaying loop.
function pluck(freq, at, level) {
  if (!strings.has(freq)) {
    const n = Math.round(ac.sampleRate * 2.2)
    const period = Math.round(ac.sampleRate / freq)
    const data = new Float32Array(n)
    for (let i = 0; i < period; i++) data[i] = Math.random() * 2 - 1
    for (let i = period; i < n; i++) data[i] = 0.497 * (data[i - period] + data[i - period + 1])
    const buffer = ac.createBuffer(1, n, ac.sampleRate)
    buffer.copyToChannel(data, 0)
    strings.set(freq, buffer)
  }
  const src = ac.createBufferSource()
  src.buffer = strings.get(freq)
  wow.connect(src.detune)
  const g = ac.createGain()
  g.gain.value = level
  src.connect(g).connect(bus)
  src.start(at)
}

function drum(at, kind) {
  if (kind === 'kick') {
    const o = ac.createOscillator()
    const env = ac.createGain()
    o.frequency.setValueAtTime(120, at)
    o.frequency.exponentialRampToValueAtTime(45, at + 0.15)
    env.gain.setValueAtTime(0.45, at)
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.3)
    o.connect(env).connect(bus)
    o.start(at)
    o.stop(at + 0.32)
    return
  }
  const src = ac.createBufferSource()
  src.buffer = noise
  const f = ac.createBiquadFilter()
  f.type = kind === 'snare' ? 'bandpass' : 'highpass'
  f.frequency.value = kind === 'snare' ? 1800 : 7000
  const env = ac.createGain()
  const level = kind === 'snare' ? 0.16 : 0.035
  env.gain.setValueAtTime(level, at)
  env.gain.exponentialRampToValueAtTime(0.0001, at + (kind === 'snare' ? 0.16 : 0.05))
  src.connect(f).connect(env).connect(bus)
  src.start(at, Math.random(), 0.2)
}

function play(at) {
  const s = SIDES[side]
  const bar = Math.floor(step / 8)
  const chord = s.chords[bar % s.chords.length]
  const i = step % 8
  if (side === 'A') {
    if (i === 0 || i === 3) chord.forEach((f) => rhodes(f * 2, at, 0.035))
    if (i === 0 || i === 4) rhodes(chord[0] / 2, at, 0.12, 0.9)
    if (i === 0 || i === 4) drum(at, 'kick')
    if (i === 2 || i === 6) drum(at, 'snare')
    drum(at, 'hat')
  } else {
    pluck(chord[PICK[i] % chord.length] * 2, at, 0.32)
    if (i === 0) pluck(chord[0], at, 0.4)
  }
  step++
}

function schedule() {
  if (ac.currentTime < pausedUntil) {
    nextAt = pausedUntil
    return
  }
  while (nextAt < ac.currentTime + 0.12) {
    const swing = step % 2 ? 0.9 : 1.1
    play(nextAt)
    nextAt += SIDES[side].beat * swing
  }
}

export function startScore() {
  if (ac) return
  ac = new AudioContext()
  master = ac.createGain()
  master.gain.value = 0
  const limiter = ac.createDynamicsCompressor()
  master.connect(limiter).connect(ac.destination)

  // The tape: everything goes through a gentle low-pass, the way a cassette loses its top end.
  const tape = ac.createBiquadFilter()
  tape.type = 'lowpass'
  tape.frequency.value = 5200
  tape.connect(master)
  bus = ac.createGain()
  bus.connect(tape)
  const verb = room(2)
  const wet = ac.createGain()
  wet.gain.value = 0.22
  bus.connect(verb).connect(wet).connect(tape)

  // Wow: a slow wobble of a few cents, plus whatever the scroll adds.
  wow = ac.createConstantSource()
  wow.offset.value = 0
  const lfo = ac.createOscillator()
  const lfoDepth = ac.createGain()
  lfo.frequency.value = 0.55
  lfoDepth.gain.value = 9
  lfo.connect(lfoDepth).connect(wow.offset)
  wow.start()
  lfo.start()

  noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate)
  noise.getChannelData(0).forEach((_, i, d) => { d[i] = Math.random() * 2 - 1 })
  const h = ac.createBufferSource()
  h.buffer = noise
  h.loop = true
  const hp = ac.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 3000
  hiss = ac.createGain()
  hiss.gain.value = 0.025
  h.connect(hp).connect(hiss).connect(master)
  h.start()

  nextAt = ac.currentTime + 0.2
  setInterval(schedule, 25)
  master.gain.setTargetAtTime(muted ? 0 : LEVEL, ac.currentTime, 0.4)
  click(ac.currentTime)
}

export function setMuted(next) {
  muted = next
  if (!ac) return
  if (!muted) ac.resume()
  master.gain.setTargetAtTime(muted ? 0 : LEVEL, ac.currentTime, 0.2)
}

// The play key going down.
function click(at) {
  const src = ac.createBufferSource()
  src.buffer = noise
  const f = ac.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 2400
  const env = ac.createGain()
  env.gain.setValueAtTime(0.4, at)
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.04)
  src.connect(f).connect(env).connect(master)
  src.start(at, 0, 0.05)
}

// `velocity` is signed scroll speed in pixels per frame: forward drags the pitch up, back drags it down.
export function drag(velocity) {
  if (!ac) return
  const cents = Math.max(-500, Math.min(500, velocity * 6))
  wow.offset.setTargetAtTime(cents, ac.currentTime, 0.08)
}

// Turning the tape over: a click, a second of hiss, then the other side.
export function flip(to) {
  if (side === to) return
  side = to
  step = 0
  if (!ac) return
  click(ac.currentTime)
  click(ac.currentTime + 0.35)
  pausedUntil = ac.currentTime + 1.3
}
