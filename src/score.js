// The score: a factory at night, synthesised here, no audio files.
// Nine machines drone and chug; each one winds down when its breaker is switched off. Underneath,
// a lullaby gets louder as the plant gets quieter, until it is all that is left.
const LEVEL = 0.55
const D = { D3: 146.83, E3: 164.81, G3: 196, A2: 110, A3: 220, D4: 293.66, E4: 329.63, Fs4: 369.99, G4: 392, A4: 440, B4: 493.88 }
// The lullaby in 3/4, one [note, beats] pair at a time, and a root for each bar.
const TUNE = [
  ['A4', 2], ['Fs4', 1], ['G4', 1], ['A4', 1], ['B4', 1], ['A4', 2], ['Fs4', 1], ['E4', 3],
  ['G4', 2], ['E4', 1], ['Fs4', 1], ['G4', 1], ['A4', 1], ['Fs4', 2], ['E4', 1], ['D4', 3],
]
const ROOTS = ['D3', 'G3', 'D3', 'A2', 'E3', 'D3', 'A2', 'D3']
const THIRDS = { D3: 1.26, G3: 1.26, A2: 1.26, E3: 1.19 } // major, except the minor ii
const BEAT = 60 / 66

let ac
let master
let plant
let song
let alarm
let machines = []
let noise
let muted = false
let note = 0
let beat = 0
let nextAt = 0
let quiet = 0 // how many machines are off, 0 to 9

const clamp = (x) => Math.min(1, Math.max(0, x))

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

// One machine: a motor hum, a band of mechanical noise, and a chug at its own speed.
function machine(i) {
  const gain = ac.createGain()
  gain.gain.value = 0
  gain.connect(plant)
  const hum = ac.createOscillator()
  hum.type = 'sawtooth'
  hum.frequency.value = [100, 150, 200][i % 3] * (1 + i * 0.013)
  const humTone = ac.createBiquadFilter()
  humTone.type = 'lowpass'
  humTone.frequency.value = 420
  const humLevel = ac.createGain()
  humLevel.gain.value = 0.05
  hum.connect(humTone).connect(humLevel).connect(gain)
  const grind = ac.createBufferSource()
  grind.buffer = noise
  grind.loop = true
  grind.loopStart = Math.random()
  const band = ac.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 260 + i * 190
  band.Q.value = 3
  const chug = ac.createGain()
  chug.gain.value = 0.05
  const rpm = ac.createOscillator()
  rpm.frequency.value = 0.8 + (i % 4) * 0.7
  const rpmDepth = ac.createGain()
  rpmDepth.gain.value = 0.045
  rpm.connect(rpmDepth).connect(chug.gain)
  grind.connect(band).connect(chug).connect(gain)
  hum.start()
  grind.start()
  rpm.start()
  return { gain, hum, base: hum.frequency.value, on: true }
}

function key(freq, at, level, length = 2.6) {
  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(level, at + 0.02)
  env.gain.exponentialRampToValueAtTime(0.0001, at + length)
  env.connect(song)
  for (const [type, mult, g] of [['triangle', 1, 1], ['sine', 2, 0.25]]) {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = type
    osc.frequency.value = freq * mult
    gain.gain.value = g
    osc.connect(gain).connect(env)
    osc.start(at)
    osc.stop(at + length + 0.05)
  }
}

function beep(at) {
  for (const [f, t] of [[880, 0], [660, 0.22]]) {
    const osc = ac.createOscillator()
    const env = ac.createGain()
    osc.type = 'square'
    osc.frequency.value = f
    env.gain.setValueAtTime(0.0001, at + t)
    env.gain.exponentialRampToValueAtTime(0.03, at + t + 0.01)
    env.gain.exponentialRampToValueAtTime(0.0001, at + t + 0.18)
    osc.connect(env).connect(alarm)
    osc.start(at + t)
    osc.stop(at + t + 0.2)
  }
}

function schedule() {
  if (nextAt < ac.currentTime) nextAt = ac.currentTime + 0.05 // skip beats missed while throttled
  while (nextAt < ac.currentTime + 0.15) {
    const [name, beats] = TUNE[note % TUNE.length]
    key(D[name], nextAt, 0.09, beats * BEAT + 1.4)
    // On the first beat of each bar, the chord underneath.
    if (beat % 3 === 0) {
      const root = ROOTS[Math.floor(beat / 3) % ROOTS.length]
      const f = D[root]
      ;[f, f * THIRDS[root], f * 1.5].forEach((x, i) => key(x, nextAt + i * 0.05, 0.04, 3 * BEAT + 1))
      if (Math.floor(beat / 3) % 2 === 0) beep(nextAt)
    }
    beat += beats
    note++
    nextAt += beats * BEAT
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

  noise = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate)
  noise.getChannelData(0).forEach((_, i, d) => { d[i] = Math.random() * 2 - 1 })

  plant = ac.createGain()
  plant.gain.value = 0.45 // nine machines at once, kept below the point of being unpleasant
  plant.connect(master)
  alarm = ac.createGain()
  alarm.connect(master)
  song = ac.createGain()
  song.gain.value = 0
  const verb = room(3.5)
  const wet = ac.createGain()
  wet.gain.value = 0.4
  song.connect(master)
  song.connect(verb).connect(wet).connect(master)

  machines = Array.from({ length: 9 }, (_, i) => machine(i))
  nextAt = ac.currentTime + 0.3
  setInterval(schedule, 40)
  master.gain.setTargetAtTime(muted ? 0 : LEVEL, ac.currentTime, 0.5)
  setMachines(machines.map((m, i) => i >= quiet))
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

// `on` holds one flag per machine. A machine turned off spins down; turned back on, it spins up.
export function setMachines(on) {
  quiet = on.filter((x) => !x).length
  if (!ac) return
  const now = ac.currentTime
  let thrown = 0 // a scroll jump throws several breakers: stagger them, and only hear the first three
  on.forEach((want, i) => {
    const m = machines[i]
    m.gain.gain.setTargetAtTime(want ? 1 : 0, now, want ? 0.3 : 0.9)
    if (m.on !== want) {
      m.hum.frequency.setTargetAtTime(want ? m.base : m.base * 0.18, now, want ? 0.3 : 0.8)
      if (!want && !muted && thrown < 3) clunk(now + 0.07 * thrown++)
      m.on = want
    }
  })
  song.gain.setTargetAtTime(clamp(quiet / 9) ** 1.2, now, 0.8)
  alarm.gain.setTargetAtTime(clamp(1 - quiet / 5), now, 0.5)
}

// A breaker thrown.
function clunk(at) {
  const src = ac.createBufferSource()
  src.buffer = noise
  const tone = ac.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 900
  const env = ac.createGain()
  env.gain.setValueAtTime(0.5, at)
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.12)
  src.connect(tone).connect(env).connect(master)
  src.start(at, Math.random(), 0.15)
}

// The last switch: the lights go out and the lullaby lands on a long, quiet chord.
export function finale() {
  if (!ac || muted) return
  const now = ac.currentTime
  clunk(now)
  ;[D.D3, D.A3, D.D4, D.Fs4, D.A4].forEach((f, i) => key(f, now + 0.3 + i * 0.12, 0.07, 7))
}
