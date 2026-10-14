// The dome: a field of stars that turns as the page scrolls and leans with the mouse, plus
// whichever constellation the reader is in, drawn edge by edge.
function seeded(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let r = Math.imul(s ^ (s >>> 15), 1 | s)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const rand = seeded(1729)
// Stars live on a disc larger than the screen, so turning it never shows an edge.
const FIELD = Array.from({ length: 900 }, () => {
  const r = Math.sqrt(rand()) * 1.25
  const a = rand() * Math.PI * 2
  return { r, a, mag: rand() ** 3, layer: Math.floor(rand() * 3), phase: rand() * 6.28, warm: rand() < 0.18 }
})

export function startSky(canvas, read, calm) {
  const ctx = canvas.getContext('2d')
  let w = 0
  let h = 0
  let frame = 0

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  // Where a constellation is drawn: the right half on a wide screen, behind the text on a phone.
  const region = () => {
    if (w >= 900) {
      const size = Math.min(w * 0.4, h * 0.72)
      return { x: w * 0.52 + (w * 0.44 - size) / 2, y: (h - size) / 2, size, alpha: 1 }
    }
    const size = Math.min(w * 0.86, h * 0.6)
    return { x: (w - size) / 2, y: h * 0.18, size, alpha: 0.55 }
  }

  const star = (x, y, radius, alpha, warm) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius * 4)
    const tint = warm ? '255, 214, 170' : '220, 232, 255'
    g.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
    g.addColorStop(0.25, `rgba(${tint}, ${alpha * 0.6})`)
    g.addColorStop(1, `rgba(${tint}, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, radius * 4, 0, Math.PI * 2)
    ctx.fill()
  }

  const draw = (now) => {
    const { turn, mouse, shows, lamp } = read()
    ctx.clearRect(0, 0, w, h)
    if (lamp <= 0) return
    const t = now / 1000
    const cx = w * 0.5
    const cy = h * 1.15 // the pole sits below the screen, so the sky wheels overhead
    const span = Math.hypot(w, h)
    const spin = turn * 0.7

    ctx.globalCompositeOperation = 'lighter'
    for (const s of FIELD) {
      const lean = calm ? 0 : (s.layer + 1) * 6
      const x = cx + Math.cos(s.a + spin) * s.r * span + mouse.x * lean
      const y = cy + Math.sin(s.a + spin) * s.r * span + mouse.y * lean
      if (x < -10 || x > w + 10 || y < -10 || y > h + 10) continue
      const twinkle = calm ? 1 : 0.7 + 0.3 * Math.sin(t * (1 + s.mag * 2) + s.phase)
      const alpha = (0.18 + s.mag * 0.8) * twinkle * lamp
      if (s.mag > 0.35) star(x, y, 0.6 + s.mag * 1.4, alpha, s.warm)
      else {
        ctx.fillStyle = `rgba(225, 232, 255, ${alpha})`
        ctx.fillRect(x, y, 1.2, 1.2)
      }
    }

    const box = region()
    for (const { c, k, alpha } of shows) {
      const a = alpha * box.alpha * lamp
      if (a <= 0.01) continue
      const lean = calm ? 0 : 10
      const at = ([x, y]) => [box.x + x * box.size + mouse.x * lean, box.y + y * box.size + mouse.y * lean]
      const drawn = k * c.edges.length
      const reached = new Set(k > 0 ? [c.edges[0][0]] : [])

      ctx.lineWidth = 1.2
      ctx.lineCap = 'round'
      c.edges.forEach(([i, j], e) => {
        const f = Math.min(1, Math.max(0, drawn - e))
        if (f <= 0) return
        const [x1, y1] = at(c.stars[i])
        const [x2, y2] = at(c.stars[j])
        ctx.strokeStyle = `rgba(255, 236, 205, ${0.55 * a})`
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f)
        ctx.stroke()
        reached.add(i)
        if (f === 1) reached.add(j)
      })

      ctx.globalCompositeOperation = 'source-over'
      ctx.font = '12px "Space Mono", ui-monospace, monospace'
      ctx.textBaseline = 'middle'
      c.stars.forEach((p, i) => {
        const [x, y] = at(p)
        const lit = reached.has(i)
        ctx.globalCompositeOperation = 'lighter'
        star(x, y, lit ? 2.6 : 1.4, (lit ? 1 : 0.35) * a, true)
        ctx.globalCompositeOperation = 'source-over'
        const label = c.labels[i]
        if (lit && label && box.size >= 420) { // too crowded to label on a small screen
          ctx.fillStyle = `rgba(245, 232, 210, ${0.85 * a})`
          const side = c.place?.[i] ?? (x > box.x + box.size * 0.6 ? 'l' : 'r')
          ctx.textAlign = { a: 'center', b: 'center', l: 'right', r: 'left' }[side]
          const dx = { a: 0, b: 0, l: -12, r: 12 }[side]
          const dy = { a: -16, b: 16, l: 0, r: 0 }[side]
          ctx.fillText(label, x + dx, y + dy)
        }
      })
      ctx.font = 'italic 22px "Cormorant Garamond", Georgia, serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = `rgba(255, 236, 205, ${0.7 * a * Math.min(1, k * 3)})`
      ctx.fillText(c.name, box.x + box.size / 2, box.y + box.size + 28)
      ctx.globalCompositeOperation = 'lighter'
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  const loop = (now) => {
    draw(now)
    frame = requestAnimationFrame(loop)
  }
  resize()
  window.addEventListener('resize', resize)
  frame = requestAnimationFrame(loop)
  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', resize)
  }
}
