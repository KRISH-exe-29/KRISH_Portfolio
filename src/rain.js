// Rain on a window, in Canvas 2D. Behind the glass: streaks of rain falling over the city.
// On the glass: a fog layer the pointer (or a thumb) wipes clear and that slowly fogs back,
// beads of water, and runnels that cut their own clear trails. Lightning on cue.
// The fog only ever sits over the backdrop; the text cards live above this canvas.

const FOG = 'rgb(176, 190, 214)'
const FOG_SCALE = 0.25 // the fog is drawn small and scaled up, which also softens the wipe edges
const WIPE = 46 // wipe radius in CSS px
const COOLDOWN = 1200 // ms between flashes: one flash is two flickers, so never more than 3 a second

const rand = (a, b) => a + Math.random() * (b - a)

export function createRain(canvas, { calm }) {
  const ctx = canvas.getContext('2d')
  const fog = document.createElement('canvas')
  const fctx = fog.getContext('2d')
  if (!ctx || !fctx) return null

  let w = 0
  let h = 0
  let beads = []
  let runs = []
  let streaks = []
  let intensity = 1
  let drawnAt = -1
  let flashAt = -1e9
  let bolt = []
  let frame = 0
  let tick = 0
  let last = 0
  let prev = null

  const bead = () => ({ x: rand(0, w), y: rand(0, h), r: rand(0.8, 2.6) })
  const run = () => ({ x: rand(0, w), y: rand(-h, h), r: rand(2, 4.2), v: rand(0.04, 0.16), hold: 0 })
  const streak = () => ({ x: rand(-40, w), y: rand(-h, h), len: rand(14, 34), v: rand(0.9, 1.5) })

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const widthChanged = window.innerWidth !== w
    w = window.innerWidth
    h = window.innerHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    fog.width = Math.ceil(w * FOG_SCALE)
    fog.height = Math.ceil(h * FOG_SCALE)
    fctx.fillStyle = FOG
    fctx.fillRect(0, 0, fog.width, fog.height)
    // Phones get fewer drops. The URL bar resizing the height keeps the same drops.
    if (widthChanged) {
      const small = w < 700
      beads = Array.from({ length: Math.min(260, Math.round((w * h) / (small ? 5000 : 6000))) }, bead)
      runs = Array.from({ length: small ? 7 : 16 }, run)
      streaks = Array.from({ length: small ? 55 : 140 }, streak)
    }
    if (calm) draw(0, 0)
  }

  // Erase a soft line from the fog: the wipe, and the clear trail behind a runnel.
  const clearFog = (x0, y0, x1, y1, r, a = 0.9) => {
    fctx.globalCompositeOperation = 'destination-out'
    fctx.strokeStyle = `rgba(0,0,0,${a})`
    fctx.lineWidth = r * 2 * FOG_SCALE
    fctx.lineCap = 'round'
    fctx.beginPath()
    fctx.moveTo(x0 * FOG_SCALE, y0 * FOG_SCALE)
    fctx.lineTo(x1 * FOG_SCALE, y1 * FOG_SCALE)
    fctx.stroke()
    fctx.globalCompositeOperation = 'source-over'
  }

  const drop = (x, y, r) => {
    ctx.fillStyle = 'rgba(10, 16, 30, 0.28)'
    ctx.beginPath()
    ctx.arc(x, y + r * 0.25, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(215, 228, 250, 0.32)'
    ctx.beginPath()
    ctx.arc(x, y, r * 0.85, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.beginPath()
    ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  const flashLevel = (now) => {
    const t = now - flashAt
    if (t < 0 || t > 1400) return 0
    if (t < 80) return 1
    if (t < 170) return 0.2
    if (t < 250) return 0.75
    return 0.75 * Math.exp(-(t - 250) / 200)
  }

  function draw(now, dt) {
    ctx.clearRect(0, 0, w, h)
    const k = intensity

    // Rain behind the glass, one path for all streaks.
    if (!calm && k > 0.01) {
      const n = Math.round(streaks.length * k)
      ctx.strokeStyle = `rgba(185, 205, 240, ${0.12 + 0.16 * k})`
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const s = streaks[i]
        s.y += s.v * dt * (0.7 + k)
        s.x += s.v * dt * 0.12
        if (s.y > h + s.len) Object.assign(s, streak(), { y: rand(-80, -s.len) })
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(s.x - s.len * 0.12, s.y - s.len)
      }
      ctx.stroke()
    }

    // The glass slowly fogs back over what was wiped.
    if (!calm && ++tick % 4 === 0) {
      fctx.globalAlpha = 0.03
      fctx.fillStyle = FOG
      fctx.fillRect(0, 0, fog.width, fog.height)
      fctx.globalAlpha = 1
    }

    // Runnels move first so their trails are cut before the fog is painted.
    const nr = calm ? 0 : Math.round(runs.length * k)
    for (let i = 0; i < nr; i++) {
      const d = runs[i]
      if (d.hold > 0) d.hold -= dt
      else {
        const y0 = d.y
        d.y += d.v * dt * (0.6 + k)
        d.x += Math.sin(d.y * 0.05) * 0.15
        if (d.y > 0) clearFog(d.x, Math.max(0, y0), d.x, d.y, d.r * 0.8, 0.5)
        if (Math.random() < 0.004) d.hold = rand(200, 900) // stop-go, like real drops
      }
      if (d.y > h + 10) Object.assign(d, run(), { y: rand(-60, -10) })
    }

    ctx.globalAlpha = (calm ? 0.3 : 0.5) * k
    ctx.drawImage(fog, 0, 0, w, h)
    ctx.globalAlpha = 1

    const nb = Math.round(beads.length * (calm ? 0.5 : k))
    for (let i = 0; i < nb; i++) drop(beads[i].x, beads[i].y, beads[i].r)
    for (let i = 0; i < nr; i++) if (runs[i].y > -10) drop(runs[i].x, runs[i].y, runs[i].r)

    const f = calm ? 0 : flashLevel(now)
    if (f > 0) {
      ctx.fillStyle = `rgba(205, 222, 255, ${0.42 * f})`
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = `rgba(255, 255, 255, ${f})`
      ctx.lineWidth = 2
      ctx.shadowColor = '#bcd4ff'
      ctx.shadowBlur = 18
      ctx.beginPath()
      bolt.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.stroke()
      ctx.shadowBlur = 0
    }
  }

  const loop = (now) => {
    frame = requestAnimationFrame(loop)
    const dt = Math.min(48, now - (last || now))
    last = now
    draw(now, dt)
  }

  const wipeTo = (x, y) => {
    if (prev) clearFog(prev.x, prev.y, x, y, WIPE)
    prev = { x, y }
  }
  const onPointer = (e) => e.pointerType !== 'touch' && wipeTo(e.clientX, e.clientY)
  // Passive, and never preventDefault: wiping with a thumb must not stop the page scrolling.
  const onTouch = (e) => e.touches[0] && wipeTo(e.touches[0].clientX, e.touches[0].clientY)
  const lift = () => (prev = null)

  const start = () => {
    cancelAnimationFrame(frame)
    last = 0
    if (!calm && !document.hidden) frame = requestAnimationFrame(loop)
  }
  const onVisibility = () => (document.hidden ? cancelAnimationFrame(frame) : start())

  resize()
  window.addEventListener('resize', resize)
  if (!calm) {
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchstart', onTouch, { passive: true })
    window.addEventListener('touchend', lift, { passive: true })
    document.addEventListener('pointerleave', lift)
    document.addEventListener('visibilitychange', onVisibility)
    start()
  }

  return {
    // 1 = thunderstorm, 0 = clear sky.
    setIntensity(v) {
      intensity = Math.min(1, Math.max(0, v))
      if (calm && Math.abs(intensity - drawnAt) > 0.05) {
        drawnAt = intensity
        draw(0, 0)
      }
    },
    flash() {
      const now = performance.now()
      if (calm || now - flashAt < COOLDOWN) return false
      flashAt = now
      let x = rand(w * 0.15, w * 0.85)
      let y = 0
      bolt = [[x, y]]
      while (y < h * 0.55) {
        x += rand(-34, 34)
        y += rand(18, 46)
        bolt.push([x, y])
      }
      return true
    },
    dispose() {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('touchend', lift)
      document.removeEventListener('pointerleave', lift)
      document.removeEventListener('visibilitychange', onVisibility)
    },
  }
}
