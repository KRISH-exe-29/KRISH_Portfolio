import { useRef, useState } from 'react'
import { asset } from '../content.js'

const LEVEL = 0.4

// Background music. Browsers block sound until the visitor presses something, so it starts off
// and fades in and out rather than cutting.
export default function Sound() {
  const audio = useRef(null)
  const fade = useRef(0)
  const [on, setOn] = useState(false)

  const toggle = () => {
    const a = audio.current
    const to = on ? 0 : LEVEL
    clearInterval(fade.current)
    if (!on) {
      a.volume = 0
      a.play().catch(() => setOn(false))
    }
    fade.current = setInterval(() => {
      a.volume = Math.max(0, Math.min(1, a.volume + (to > a.volume ? 0.02 : -0.03)))
      if (Math.abs(a.volume - to) < 0.03) {
        clearInterval(fade.current)
        if (!to) a.pause()
      }
    }, 40)
    setOn(!on)
  }

  return (
    <>
      <audio ref={audio} src={asset('audio/soundtrack.mp3')} preload="none" loop />
      <button className="pill sound" onClick={toggle} aria-pressed={on}>
        {on ? 'Sound on' : 'Sound off'}
      </button>
    </>
  )
}
