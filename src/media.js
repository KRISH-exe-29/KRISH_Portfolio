// Liquid hover for photos. One shared WebGL canvas jumps onto whichever
// [data-fx] frame is hovered and redraws its <img> in colour with a ripple
// and an RGB split that follow the pointer. The <img> stays in the DOM.
import {
  WebGLRenderer, Scene, OrthographicCamera, Mesh, PlaneGeometry, ShaderMaterial,
  TextureLoader, LinearFilter, Vector2,
} from 'three'
import { gsap } from 'gsap'

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

const frag = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uPlane;
uniform vec2 uImg;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform float uHover;
uniform float uTime;
varying vec2 vUv;
vec2 cover(vec2 uv) {
  vec2 s = uPlane / uImg;
  vec2 scaled = uImg * max(s.x, s.y);
  return (uv * uPlane + (scaled - uPlane) * 0.5) / scaled;
}
void main() {
  vec2 asp = vec2(uPlane.x / uPlane.y, 1.0);
  vec2 d = (vUv - uMouse) * asp;
  float r = length(d);
  vec2 dir = d / max(r, 1e-4);
  float ripple = sin(r * 38.0 - uTime * 5.0) * exp(-r * 5.0) * 0.014;
  vec2 uv = vUv + (dir * ripple + uVel * exp(-r * 3.0) * 0.08) * uHover / asp;
  vec2 shift = (uVel * 0.03 + dir * 0.004 * exp(-r * 3.0)) * uHover;
  vec3 col;
  col.r = texture2D(uTex, cover(uv + shift)).r;
  col.g = texture2D(uTex, cover(uv)).g;
  col.b = texture2D(uTex, cover(uv - shift)).b;
  gl_FragColor = vec4(col * uHover, uHover);
}
`

export function initMedia(canvas) {
  let renderer
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false })
  } catch {
    return () => {}
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

  const scene = new Scene()
  const cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geo = new PlaneGeometry(2, 2)
  const uniforms = {
    uTex: { value: null },
    uPlane: { value: new Vector2(1, 1) },
    uImg: { value: new Vector2(1, 1) },
    uMouse: { value: new Vector2(0.5, 0.5) },
    uVel: { value: new Vector2() },
    uHover: { value: 0 },
    uTime: { value: 0 },
  }
  const mat = new ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true })
  scene.add(new Mesh(geo, mat))

  const loader = new TextureLoader()
  const cache = new Map()
  const texFor = (src) => {
    if (!cache.has(src)) {
      const t = loader.load(src)
      t.minFilter = LinearFilter
      t.generateMipmaps = false
      cache.set(src, t)
    }
    return cache.get(src)
  }

  let active = null
  let w = 0
  let h = 0
  const m = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }

  const track = (e) => {
    if (!active) return
    const r = active.getBoundingClientRect()
    m.tx = (e.clientX - r.left) / r.width
    m.ty = 1 - (e.clientY - r.top) / r.height
  }

  const over = (e) => {
    const el = e.target.closest?.('[data-fx]')
    if (!el) return
    if (el !== active) {
      const img = el.querySelector('img')
      if (!img) return
      active = el
      uniforms.uTex.value = texFor(img.currentSrc || img.src)
      track(e)
      m.x = m.tx
      m.y = m.ty
      canvas.style.visibility = 'visible'
    }
    gsap.to(uniforms.uHover, { value: 1, duration: 0.7, ease: 'power3.out', overwrite: true })
  }

  const out = (e) => {
    if (!active || !active.contains(e.target) || active.contains(e.relatedTarget)) return
    const leaving = active
    gsap.to(uniforms.uHover, {
      value: 0, duration: 0.6, ease: 'power2.out', overwrite: true,
      onComplete: () => {
        if (active === leaving) {
          active = null
          canvas.style.visibility = 'hidden'
        }
      },
    })
  }

  const tick = (time) => {
    if (!active || document.hidden) return
    const r = active.getBoundingClientRect()
    if (r.width !== w || r.height !== h) {
      w = r.width
      h = r.height
      renderer.setSize(w, h)
      uniforms.uPlane.value.set(w, h)
    }
    canvas.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`
    const im = uniforms.uTex.value?.image
    if (im && im.width) uniforms.uImg.value.set(im.width, im.height)
    m.x += (m.tx - m.x) * 0.14
    m.y += (m.ty - m.y) * 0.14
    uniforms.uVel.value.set(m.tx - m.x, m.ty - m.y)
    uniforms.uMouse.value.set(m.x, m.y)
    uniforms.uTime.value = time
    renderer.render(scene, cam)
  }

  document.addEventListener('pointerover', over)
  document.addEventListener('pointerout', out)
  window.addEventListener('pointermove', track, { passive: true })
  gsap.ticker.add(tick)

  return () => {
    gsap.ticker.remove(tick)
    gsap.killTweensOf(uniforms.uHover)
    document.removeEventListener('pointerover', over)
    document.removeEventListener('pointerout', out)
    window.removeEventListener('pointermove', track)
    cache.forEach((t) => t.dispose())
    mat.dispose()
    geo.dispose()
    renderer.dispose()
  }
}
