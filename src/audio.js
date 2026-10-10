// The score: a mellow lo-fi beat with a plucked string, synthesised here, no audio files.
// Call startScore() from a click. Scrolling plays the tune: one pluck per dot the line passes.
import { pluck } from './kolam.js'

const SCALE = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25] // D major pentatonic
const TUNE = [0, 1, 2, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2, 4, 3, 2, 1, 0, 1, 2, 3, 2, 1, 4, 5, 6, 5, 4, 3, 2, 1]
const EIGHTH = 60 / 76 / 2
const KICKS = [0, 5, 8, 11]

export function startScore() {
  const ac = new AudioContext()
  const limiter = ac.createDynamicsCompressor()
  const master = ac.createGain()
  master.gain.value = 0
  master.gain.setTargetAtTime(0.6, ac.currentTime, 0.4)
  master.connect(limiter).connect(ac.destination)

  // Everything goes through a soft low-pass, the muffled tape sound of the genre.
  const warm = ac.createBiquadFilter()
  warm.type = 'lowpass'
  warm.frequency.value = 3200
  warm.connect(master)

  const strings = SCALE.map((freq) => {
    const samples = pluck(freq, ac.sampleRate, 1.8)
    const buffer = ac.createBuffer(1, samples.length, ac.sampleRate)
    buffer.copyToChannel(samples, 0)
    return buffer
  })
  const pick = (note, t, level) => {
    const source = ac.createBufferSource()
    const gain = ac.createGain()
    source.buffer = strings[note]
    gain.gain.value = level
    source.connect(gain).connect(warm)
    source.start(t)
  }

  // Two seconds of record surface: hiss with the odd crackle, looped.
  const surface = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate)
  surface.getChannelData(0).forEach((_, i, data) => { data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.0006 ? 1 : 0.06) })
  const record = ac.createBufferSource()
  const recordLevel = ac.createGain()
  record.buffer = surface
  record.loop = true
  recordLevel.gain.value = 0.16
  record.connect(recordLevel).connect(warm)
  record.start()

  // A drone on the root and fifth, like a tanpura held under the tune.
  for (const freq of [73.42, 110]) {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.frequency.value = freq
    gain.gain.value = 0.07
    osc.connect(gain).connect(warm)
    osc.start()
  }

  const thump = (t) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.frequency.setValueAtTime(110, t)
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.14)
    gain.gain.setValueAtTime(0.55, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
    osc.connect(gain).connect(warm)
    osc.start(t)
    osc.stop(t + 0.32)
  }
  const brush = (t, level, length) => {
    const source = ac.createBufferSource()
    const band = ac.createBiquadFilter()
    const gain = ac.createGain()
    source.buffer = surface
    band.type = 'bandpass'
    band.frequency.value = 2600
    gain.gain.setValueAtTime(level * 12, t) // the surface noise is quiet, so lift it
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length)
    source.connect(band).connect(gain).connect(warm)
    source.start(t, Math.random())
    source.stop(t + length + 0.02)
  }

  let step = 0
  let next = ac.currentTime + 0.1
  const timer = setInterval(() => {
    if (ac.state !== 'running') return
    while (next < ac.currentTime + 0.15) {
      const beat = step % 16
      if (KICKS.includes(beat)) thump(next)
      if (beat % 8 === 4) brush(next, 0.12, 0.16)
      else if (beat % 2 === 1) brush(next, 0.03, 0.05)
      if (step % 32 === 0) [0, 2, 3].forEach((note, k) => pick(note, next + k * 0.04, 0.12)) // a soft strum every two bars
      next += EIGHTH * (beat % 2 ? 0.9 : 1.1) // a little swing
      step++
    }
  }, 25)

  const onHide = () => {
    if (document.hidden) return ac.suspend()
    ac.resume().then(() => { next = ac.currentTime + 0.1 })
  }
  document.addEventListener('visibilitychange', onHide)

  let dot = 0
  let lastPluck = 0
  return {
    // Tell the score how many dots the line has passed. Each new dot plucks the next note
    // of the tune, so scrolling back up plays it backwards.
    passed(count) {
      if (count === dot) return
      dot = count
      if (ac.currentTime - lastPluck < 0.07) return
      lastPluck = ac.currentTime
      pick(TUNE[count % TUNE.length], ac.currentTime, 0.42)
    },
    stop() {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onHide)
      master.gain.setTargetAtTime(0, ac.currentTime, 0.2)
      setTimeout(() => ac.close(), 1000)
    },
  }
}
