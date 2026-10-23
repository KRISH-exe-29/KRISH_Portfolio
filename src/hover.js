// Liquid hover for media. One shared WebGL canvas is moved into whichever
// `.gl-media` box the pointer enters and draws that box's <img> with a ripple
// centred on the pointer and an RGB split driven by pointer velocity.
import * as THREE from 'three'
import { gsap } from 'gsap'

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

const frag = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform vec2 uScale;
uniform vec2 uOffset;
uniform float uAspect;
uniform float uHover;
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  vec2 d = uv - uMouse;
  d.x *= uAspect;
  float dist = length(d);
  vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0);
  float ripple = sin(dist * 42.0 - uTime * 5.0) * exp(-dist * 6.0) * 0.010 * uHover;
  uv += dir * ripple;
  uv -= uVel * 0.05 * exp(-dist * 3.5) * uHover;
  vec2 cuv = uv * uScale + uOffset;
  cuv = (cuv - 0.5) * (1.0 - 0.05 * uHover) + 0.5;
  float shift = (length(uVel) * 0.05 + 0.0015) * uHover;
  vec2 sv = normalize(uVel + vec2(0.0001, 0.0)) * shift;
  float r = texture2D(uTex, cuv + sv).r;
  float g = texture2D(uTex, cuv).g;
  float b = texture2D(uTex, cuv - sv).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}
`

export function createHover() {
  const canvas = document.createElement('canvas')
  canvas.className = 'gl-hover'
  canvas.setAttribute('aria-hidden', 'true')
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geo = new THREE.PlaneGeometry(2, 2)
  const u = {
    uTex: { value: null },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uVel: { value: new THREE.Vector2() },
    uScale: { value: new THREE.Vector2(1, 1) },
    uOffset: { value: new THREE.Vector2() },
    uAspect: { value: 1 },
    uHover: { value: 0 },
    uTime: { value: 0 },
  }
  const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: u })
  const scene = new THREE.Scene()
  scene.add(new THREE.Mesh(geo, mat))

  const textures = new Map()
  const state = { host: null, tx: 0.5, ty: 0.5, vx: 0, vy: 0, running: false }

  const fitTo = (host, img) => {
    const w = host.clientWidth
    const h = host.clientHeight
    renderer.setSize(w, h, false)
    const ca = w / h
    const ia = (img.naturalWidth || 4) / (img.naturalHeight || 3)
    if (ia > ca) {
      u.uScale.value.set(ca / ia, 1)
      u.uOffset.value.set((1 - ca / ia) / 2, 0)
    } else {
      u.uScale.value.set(1, ia / ca)
      u.uOffset.value.set(0, (1 - ia / ca) / 2)
    }
    u.uAspect.value = ca
  }

  const tick = (time) => {
    if (document.hidden || !state.host) return
    u.uTime.value = time
    const m = u.uMouse.value
    const nx = m.x + (state.tx - m.x) * 0.18
    const ny = m.y + (state.ty - m.y) * 0.18
    state.vx += (nx - m.x - state.vx) * 0.2
    state.vy += (ny - m.y - state.vy) * 0.2
    m.set(nx, ny)
    u.uVel.value.set(state.vx, state.vy)
    renderer.render(scene, camera)
  }

  const onMove = (e) => {
    if (!state.host) return
    const r = state.host.getBoundingClientRect()
    state.tx = (e.clientX - r.left) / r.width
    state.ty = 1 - (e.clientY - r.top) / r.height
  }

  const enter = (host, e) => {
    const img = host.querySelector('img')
    if (!img || !img.complete || !img.naturalWidth) return
    let tex = textures.get(img.currentSrc || img.src)
    if (!tex) {
      tex = new THREE.Texture(img)
      tex.minFilter = THREE.LinearFilter
      tex.generateMipmaps = false
      tex.needsUpdate = true
      textures.set(img.currentSrc || img.src, tex)
    }
    u.uTex.value = tex
    state.host = host
    fitTo(host, img)
    onMove(e)
    u.uMouse.value.set(state.tx, state.ty)
    host.appendChild(canvas)
    gsap.killTweensOf(u.uHover)
    gsap.to(u.uHover, { value: 1, duration: 0.6, ease: 'power3.out' })
    if (!state.running) {
      gsap.ticker.add(tick)
      state.running = true
    }
    tick(gsap.ticker.time)
  }

  const leave = (host) => {
    if (state.host !== host) return
    gsap.killTweensOf(u.uHover)
    gsap.to(u.uHover, {
      value: 0,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        if (state.host !== host) return
        canvas.remove()
        state.host = null
        gsap.ticker.remove(tick)
        state.running = false
      },
    })
  }

  // Delegated so media that mounts later (overlay, filters) works too.
  let current = null
  const onOver = (e) => {
    const host = e.target.closest && e.target.closest('.gl-media')
    if (host === current) return
    if (current) leave(current)
    current = host
    if (host) enter(host, e)
  }
  const onOut = (e) => {
    if (current && !current.contains(e.relatedTarget)) {
      leave(current)
      current = null
    }
  }
  document.addEventListener('pointerover', onOver)
  document.addEventListener('pointerout', onOut)
  window.addEventListener('pointermove', onMove, { passive: true })

  return () => {
    document.removeEventListener('pointerover', onOver)
    document.removeEventListener('pointerout', onOut)
    window.removeEventListener('pointermove', onMove)
    gsap.ticker.remove(tick)
    canvas.remove()
    textures.forEach((t) => t.dispose())
    mat.dispose()
    geo.dispose()
    renderer.dispose()
  }
}
