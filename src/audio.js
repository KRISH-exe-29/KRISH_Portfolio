// The score: melodic techno at 124 bpm, synthesised here, no audio files.
// Call startScore() from a click. Notes are scheduled slightly ahead on the audio clock.
const STEP = 60 / 124 / 4 // one sixteenth note
const hz = (semitones, base) => base * 2 ** (semitones / 12)
const BASS = [0, 0, -4, -2] // A, A, F, G: one root per bar
// One arpeggio per chapter, in semitones above the bar's root.
const ARPS = [
  [0, 7, 12, 7, 15, 12, 7, 12],
  [0, 3, 7, 12, 7, 3, 10, 7],
  [12, 7, 3, 0, 3, 7, 12, 15],
  [0, 12, 7, 19, 15, 12, 7, 15],
  [0, 7, 10, 12, 15, 12, 10, 7],
  [3, 7, 12, 15, 19, 15, 12, 7],
  [0, 5, 7, 12, 7, 5, 12, 17],
]

export function startScore() {
  const ac = new AudioContext()
  const limiter = ac.createDynamicsCompressor()
  const master = ac.createGain()
  master.gain.value = 0
  master.gain.setTargetAtTime(0.55, ac.currentTime, 0.4)
  master.connect(limiter).connect(ac.destination)

  const hiss = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
  hiss.getChannelData(0).forEach((_, i, data) => { data[i] = Math.random() * 2 - 1 })

  // The lead runs through one filter that scrolling opens, and into an echo.
  const tone = ac.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 600
  tone.Q.value = 6
  const echo = ac.createDelay(1)
  const tail = ac.createGain()
  echo.delayTime.value = STEP * 3
  tail.gain.value = 0.38
  tone.connect(master)
  tone.connect(echo).connect(tail).connect(echo)
  tail.connect(master)

  let energy = 0
  let chapter = 0

  // One short sound: a source through an optional filter with a fast decay.
  const blip = (source, t, peak, decay, to = master, filter) => {
    const gain = ac.createGain()
    gain.gain.setValueAtTime(peak, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    ;(filter ? source.connect(filter) : source).connect(gain).connect(to)
    source.start(t)
    source.stop(t + decay + 0.02)
  }
  const voice = (type, freq) => {
    const o = ac.createOscillator()
    o.type = type
    o.frequency.value = freq
    return o
  }
  const noise = () => Object.assign(ac.createBufferSource(), { buffer: hiss })
  const band = (type, freq) => {
    const f = ac.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    return f
  }

  const play = (step, t) => {
    const root = BASS[Math.floor(step / 16) % BASS.length]
    if (step % 4 === 0) { // kick on every beat
      const kick = voice('sine', 150)
      kick.frequency.exponentialRampToValueAtTime(44, t + 0.12)
      blip(kick, t, 0.9, 0.34)
    }
    if (step % 8 === 4) blip(noise(), t, 0.16 + energy * 0.14, 0.13, master, band('bandpass', 1600)) // clap
    if (step % 2 === 0 || energy > 0.45) blip(noise(), t, (step % 4 === 2 ? 0.1 : 0.035) + energy * 0.09, 0.045, master, band('highpass', 7500)) // hats
    if (step % 4 === 2 || step % 16 === 15) blip(voice('sawtooth', hz(root, 55)), t, 0.32, 0.2, master, band('lowpass', 260 + energy * 700)) // off-beat bass
    const arp = ARPS[chapter % ARPS.length]
    blip(voice('square', hz(root + arp[step % arp.length], 220)), t, 0.05 + energy * 0.07, 0.16, tone)
  }

  let step = 0
  let next = ac.currentTime + 0.1
  const timer = setInterval(() => {
    if (ac.state !== 'running') return
    while (next < ac.currentTime + 0.12) {
      play(step, next)
      next += STEP
      step = (step + 1) % 64
    }
  }, 25)

  const onHide = () => {
    if (document.hidden) return ac.suspend()
    ac.resume().then(() => { next = ac.currentTime + 0.1 })
  }
  document.addEventListener('visibilitychange', onHide)

  return {
    // energy: 0 at rest, 1 when scrolling hard. chapter picks the arpeggio.
    set(e, c) {
      energy = Math.max(0, Math.min(1, e))
      chapter = c
      tone.frequency.setTargetAtTime(500 + energy * 5500, ac.currentTime, 0.08)
    },
    stop() {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onHide)
      master.gain.setTargetAtTime(0, ac.currentTime, 0.2)
      setTimeout(() => ac.close(), 1000)
    },
  }
}
