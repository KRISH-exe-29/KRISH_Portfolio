import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { asset, me } from './content.js'
import {
  advancePowered,
  activeBoard,
  isRevealed,
  poweredBoards,
  progressFromScroll,
} from './circuit/path.js'
import { createCircuitScene } from './circuit/scene.js'
import BoardCopy from './components/BoardCopy.jsx'
import NavRail from './components/NavRail.jsx'

gsap.registerPlugin(ScrollTrigger)

const labels = ['Power-on', 'Source', 'Indo Tech', 'Processor', 'Signal', 'Amplifier', 'Output']
const pad = (index) => String(index).padStart(2, '0')

function canUseWebgl() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl')
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(context)
  } catch {
    return false
  }
}

export default function App() {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const triggerRef = useRef(null)
  const contextLost = useRef(false)
  const clickedBoards = useRef(new Set())
  const initialReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [mode, setMode] = useState(() => (!initialReduced && canUseWebgl() ? '3d' : 'document'))
  const [progress, setProgress] = useState(0)
  const [powered, setPowered] = useState(() => poweredBoards(0))
  const [revealed, setRevealed] = useState(false)
  const [sound, setSound] = useState(false)
  const [ready, setReady] = useState(0)
  const [fontsReady, setFontsReady] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const soundtrack = useRef(null)
  const click = useRef(null)
  const [reduced, setReduced] = useState(initialReduced)
  const lowTier = useMemo(
    () => window.matchMedia('(max-width: 480px), (pointer: coarse)').matches,
    [],
  )
  const active = activeBoard(progress)
  const measureTops = () =>
    Array.from(document.querySelectorAll('.board')).map((section) => section.offsetTop)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const chooseMode = () => {
      setReduced(media.matches)
      if (!contextLost.current) setMode(!media.matches && canUseWebgl() ? '3d' : 'document')
    }
    chooseMode()
    media.addEventListener('change', chooseMode)
    return () => media.removeEventListener('change', chooseMode)
  }, [])

  useEffect(() => {
    let mounted = true
    document.fonts?.ready?.then(() => {
      if (mounted) {
        setFontsReady(true)
        setReady((value) => Math.max(value, 55))
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (mode === 'document') {
      requestAnimationFrame(() => setReady(100))
      return undefined
    }
    if (!canvasRef.current) return undefined
    try {
      sceneRef.current = createCircuitScene(canvasRef.current, {
        lowTier,
        initialProgress: progress,
        initialPowered: powered,
        onContextLost: () => {
          contextLost.current = true
          setMode('document')
        },
        onFirstFrame: () => setSceneReady(true),
      })
    } catch {
      setMode('document')
    }
    return () => {
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [lowTier, mode]) // eslint-disable-line react-hooks/exhaustive-deps -- scroll state synchronises below

  useEffect(() => {
    if (mode === '3d' && fontsReady && sceneReady) setReady(100)
  }, [fontsReady, mode, sceneReady])

  useEffect(() => {
    sceneRef.current?.setProgress(progress)
    sceneRef.current?.setPowered(powered)
  }, [powered, progress])

  useEffect(() => {
    // The board the visitor is on, remembered across reflows (a resize changes every section top).
    let board = 0
    let reflowing = false
    const sync = () => {
      const mapped = progressFromScroll(measureTops(), window.scrollY)
      if (!reflowing) board = activeBoard(mapped)
      setProgress(mapped)
      setPowered((previous) => advancePowered(previous, mapped))
      if (isRevealed(mapped)) setRevealed(true)
    }
    const trigger = ScrollTrigger.create({
      trigger: '#scroll-spacer',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.08,
      // ScrollTrigger scrolls to the top while it re-measures; ignore those updates.
      onUpdate: () => {
        if (!reflowing) sync()
      },
    })
    triggerRef.current = trigger
    let timer
    const refresh = () => {
      reflowing = true
      clearTimeout(timer)
      timer = setTimeout(() => {
        ScrollTrigger.refresh()
        const tops = measureTops()
        if (activeBoard(progressFromScroll(tops, window.scrollY)) !== board) window.scrollTo(0, tops[board])
        reflowing = false
        sync()
      }, 150)
    }
    const observer = new ResizeObserver(refresh)
    observer.observe(document.querySelector('#scroll-spacer'))
    document.fonts?.ready?.then(refresh)
    window.addEventListener('resize', refresh)
    window.addEventListener('orientationchange', refresh)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
      trigger.kill()
      window.removeEventListener('resize', refresh)
      window.removeEventListener('orientationchange', refresh)
    }
  }, [])

  useEffect(() => {
    if (revealed) document.title = `${me.name} | Electron`
  }, [revealed])
  useEffect(() => {
    if (soundtrack.current) soundtrack.current.volume = 0.25
    if (sound) soundtrack.current?.play().catch(() => setSound(false))
    else soundtrack.current?.pause()
  }, [sound])
  useEffect(() => {
    powered.forEach((isPowered, index) => {
      if (index > 0 && isPowered && !clickedBoards.current.has(index)) {
        clickedBoards.current.add(index)
        if (sound) {
          click.current.currentTime = 0
          click.current.play().catch(() => {})
        }
      }
    })
  }, [powered, sound])
  const jump = (index) => {
    const trigger = triggerRef.current
    if (!trigger) return
    const top = measureTops()[index]
    const target = index / 6
    setPowered((previous) => advancePowered(previous, target))
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
  }
  return (
    <main
      className={`electron-app mode-${mode} ${ready === 100 ? 'is-ready' : ''}`}
      style={{ '--scroll-velocity': Math.abs(progress * 6 - active) }}
    >
      <audio ref={soundtrack} src={asset('audio/soundtrack.mp3')} loop preload="none" />
      <audio ref={click} src={asset('audio/click.mp3')} preload="none" />
      {mode === '3d' && <div className="circuit-canvas" ref={canvasRef} aria-hidden="true" />}
      <div className="crt" aria-hidden="true" />
      {ready < 100 && (
        <div className="loader" aria-live="polite">
          <span>POWERING CIRCUIT</span>
          <b>{ready}%</b>
        </div>
      )}
      <button
        className="sound"
        type="button"
        onClick={() => setSound((value) => !value)}
        aria-pressed={sound}
      >
        SOUND {sound ? 'ON' : 'OFF'}
      </button>
      <NavRail labels={labels} active={active} onJump={jump} />
      <div id="scroll-spacer">
        {labels.map((label, index) => (
          <section
            className={`board board-${index} ${powered[index] ? 'powered' : ''}`}
            key={label}
            aria-label={`${pad(index)} ${label}`}
          >
            <div className="board-number">{pad(index)}</div>
            <div className="board-copy">
              <BoardCopy
                index={index}
                powered={powered[index]}
                revealed={revealed}
                reduced={reduced}
              />
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
