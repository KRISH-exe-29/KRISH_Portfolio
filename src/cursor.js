import * as THREE from 'three'
import gsap from 'gsap'
import { reduceMotion, finePointer } from './motion.js'

// Tuning knobs for the water layer.
const SIM_SCALE = 4 // simulation runs at 1/4 of the viewport
const DAMPING = 0.975 // how fast ripples die out
const RADIUS = 0.022 // drop radius in viewport heights
const STRENGTH = 0.012 // height injected per pixel of pointer travel
const MAX_STRENGTH = 0.3
const SLOPE = 6 // how strongly slopes turn into highlight and shadow
const IDLE_MS = 4000 // stop simulating this long after the pointer stops

const quadVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

// Height field wave equation. R = height now, G = height one step ago.
const simFrag = /* glsl */ `
uniform sampler2D uPrev;
uniform vec2 uTexel, uFrom, uTo;
uniform float uStrength, uRadius, uAspect, uDamping;
varying vec2 vUv;
float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}
void main() {
  vec4 c = texture2D(uPrev, vUv);
  float n = (texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r
           + texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r
           + texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r
           + texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r) * 0.5 - c.g;
  n *= uDamping;
  vec2 asp = vec2(uAspect, 1.0);
  n += uStrength * smoothstep(uRadius, 0.0, seg(vUv * asp, uFrom * asp, uTo * asp));
  gl_FragColor = vec4(n, c.r, 0.0, 1.0);
}
`

// Slope of the height field lit from the top left: white caustic glints, ink shadows.
// Output is premultiplied for the premultiplied canvas.
const drawFrag = /* glsl */ `
uniform sampler2D uH;
uniform vec2 uTexel;
uniform vec3 uLight, uDark;
uniform float uSlope;
varying vec2 vUv;
void main() {
  float l = texture2D(uH, vUv - vec2(uTexel.x, 0.0)).r;
  float r = texture2D(uH, vUv + vec2(uTexel.x, 0.0)).r;
  float b = texture2D(uH, vUv - vec2(0.0, uTexel.y)).r;
  float t = texture2D(uH, vUv + vec2(0.0, uTexel.y)).r;
  float s = dot(vec2(r - l, t - b), vec2(-0.7071, 0.7071)) * uSlope;
  float hi = smoothstep(0.0, 0.6, s);
  float aHi = hi * hi * 0.9;
  float aLo = smoothstep(0.0, 0.8, -s) * 0.22;
  float a = aHi + aLo * (1.0 - aHi);
  gl_FragColor = vec4(uLight * aHi + uDark * aLo * (1.0 - aHi), a);
}
`

const rgb = (hex) => new THREE.Vector3(...[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255))

function createWater() {
  const canvas = document.createElement('canvas')
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true })
  } catch {
    return null
  }
  canvas.className = 'gl-layer gl-layer--water'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const texel = new THREE.Vector2()
  const simU = {
    uPrev: { value: null },
    uTexel: { value: texel },
    uFrom: { value: new THREE.Vector2() },
    uTo: { value: new THREE.Vector2() },
    uStrength: { value: 0 },
    uRadius: { value: RADIUS },
    uAspect: { value: 1 },
    uDamping: { value: DAMPING },
  }
  const drawU = {
    uH: { value: null },
    uTexel: { value: texel },
    uLight: { value: rgb('#ffffff') },
    uDark: { value: rgb('#1e1b4b') },
    uSlope: { value: SLOPE },
  }
  const sim = new THREE.ShaderMaterial({ uniforms: simU, vertexShader: quadVert, fragmentShader: simFrag })
  const draw = new THREE.ShaderMaterial({ uniforms: drawU, vertexShader: quadVert, fragmentShader: drawFrag })
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), sim)
  quad.frustumCulled = false
  scene.add(quad)

  const opts = {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  }
  let a = null
  let b = null
  const clear = () => {
    for (const t of [a, b, null]) {
      renderer.setRenderTarget(t)
      renderer.clear()
    }
  }
  const size = () => {
    const w = Math.max(2, Math.round(window.innerWidth / SIM_SCALE))
    const h = Math.max(2, Math.round(window.innerHeight / SIM_SCALE))
    a?.dispose()
    b?.dispose()
    a = new THREE.WebGLRenderTarget(w, h, opts)
    b = new THREE.WebGLRenderTarget(w, h, opts)
    texel.set(1 / w, 1 / h)
    simU.uAspect.value = window.innerWidth / window.innerHeight
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    clear()
  }
  size()
  window.addEventListener('resize', size)

  let fx = -1
  let fy = -1
  let last = -1e9
  let running = false

  return {
    update(x, y, now) {
      const ux = x / window.innerWidth
      const uy = 1 - y / window.innerHeight
      if (fx < 0) {
        fx = ux
        fy = uy
      }
      const dist = Math.hypot((ux - fx) * window.innerWidth, (uy - fy) * window.innerHeight)
      if (dist > 0.5) last = now
      if (now - last > IDLE_MS) {
        if (running) {
          running = false
          clear()
        }
        fx = ux
        fy = uy
        return
      }
      running = true
      simU.uFrom.value.set(fx, fy)
      simU.uTo.value.set(ux, uy)
      simU.uStrength.value = Math.min(dist * STRENGTH, MAX_STRENGTH)
      simU.uPrev.value = a.texture
      quad.material = sim
      renderer.setRenderTarget(b)
      renderer.render(scene, camera)
      ;[a, b] = [b, a]
      drawU.uH.value = a.texture
      quad.material = draw
      renderer.setRenderTarget(null)
      renderer.render(scene, camera)
      fx = ux
      fy = uy
    },
    dispose() {
      window.removeEventListener('resize', size)
      a.dispose()
      b.dispose()
      sim.dispose()
      draw.dispose()
      quad.geometry.dispose()
      renderer.dispose()
      canvas.remove()
    },
  }
}

// Lerped ball that stretches with speed and grows into a labelled bubble over targets,
// plus the water layer it drags behind it.
export function initCursor() {
  if (reduceMotion || !finePointer) return () => {}
  const html = document.documentElement
  html.classList.add('has-cursor')
  const el = document.createElement('div')
  el.className = 'cursor'
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = '<div class="cursor__ball"></div><span class="cursor__label"></span>'
  document.body.appendChild(el)
  const ball = el.firstChild
  const label = el.lastChild
  const water = createWater()

  let x = window.innerWidth / 2
  let y = window.innerHeight / 2
  let cx = x
  let cy = y
  let scale = 0.16
  let angle = 0
  let hovering = false
  let hasLabel = false
  let pressed = false
  let visible = false

  const move = (e) => {
    x = e.clientX
    y = e.clientY
    if (!visible) {
      visible = true
      cx = x
      cy = y
      el.classList.add('is-on')
    }
  }
  const over = (e) => {
    const t = e.target instanceof Element ? e.target.closest('[data-cursor], a, button, summary, input, label') : null
    const text = t?.getAttribute('data-cursor') || ''
    hovering = !!t
    hasLabel = !!text
    if (text) label.textContent = text
    el.classList.toggle('is-hover', hovering)
    el.classList.toggle('has-label', hasLabel)
  }
  const out = (e) => {
    if (e.relatedTarget) return
    visible = false
    el.classList.remove('is-on')
  }
  const down = () => (pressed = true)
  const up = () => (pressed = false)

  const tick = (time, dt) => {
    const k = 1 - Math.pow(0.8, dt / 16.667)
    const dx = x - cx
    const dy = y - cy
    cx += dx * k
    cy += dy * k
    const speed = Math.hypot(dx, dy)
    const stretch = Math.min(speed / 150, 0.45)
    if (speed > 0.5) angle = (Math.atan2(dy, dx) * 180) / Math.PI
    const target = (hasLabel ? 1 : hovering ? 0.55 : 0.16) * (pressed ? 0.8 : 1)
    scale += (target - scale) * k
    ball.style.transform = `translate3d(${cx}px,${cy}px,0) translate(-50%,-50%) rotate(${angle}deg) scale(${scale * (1 + stretch)},${scale * (1 - stretch * 0.5)})`
    label.style.transform = `translate3d(${cx}px,${cy}px,0) translate(-50%,-50%)`
    water?.update(x, y, time * 1000)
  }

  window.addEventListener('pointermove', move, { passive: true })
  document.addEventListener('pointerover', over)
  document.addEventListener('pointerout', out)
  window.addEventListener('pointerdown', down)
  window.addEventListener('pointerup', up)
  gsap.ticker.add(tick)

  return () => {
    gsap.ticker.remove(tick)
    window.removeEventListener('pointermove', move)
    document.removeEventListener('pointerover', over)
    document.removeEventListener('pointerout', out)
    window.removeEventListener('pointerdown', down)
    window.removeEventListener('pointerup', up)
    water?.dispose()
    el.remove()
    html.classList.remove('has-cursor')
  }
}
