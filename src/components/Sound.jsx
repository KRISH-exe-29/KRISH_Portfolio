import { useRef, useState } from 'react'
import { asset } from '../content.js'
import { setSound, wireInterface } from '../sound.js'

const LEVEL = 0.38

// The sound switch: music, hover ticks, clicks and the rest all follow it.
// Browsers block audio until the visitor presses something, so it starts off, and the music fades rather than cuts.
export default function Sound({ track }) {
  const audio = useRef(null)
  const fade = useRef(0)
  const [on, setOn] = useState(false)

  const toggle = () => {
    const a = audio.current
    const to = on ? 0 : LEVEL
    clearInterval(fade.current)
    setSound(!on)
    wireInterface()
    if (!on) {
      a.volume = 0
      a.play().catch(() => {})
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
      <audio ref={audio} src={asset(`audio/${track}`)} preload="none" loop />
      <button className="pill sound" onClick={toggle} aria-pressed={on}>
        {on ? 'Sound on' : 'Sound off'}
      </button>
    </>
  )
}
