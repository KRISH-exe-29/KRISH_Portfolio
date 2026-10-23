import * as THREE from 'three'
import gsap from 'gsap'
import { reduceMotion, finePointer } from './motion.js'

// One shared WebGL plane that slides over whichever [data-fx] image is under the pointer
// and redraws it with a liquid ripple and an RGB split that follows the pointer.
// The <img> stays in the DOM underneath, so nothing breaks without WebGL.

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

const frag = /* glsl */ `
uniform sampler2D uTex;
uniform float uHover, uTime, uRadius;
uniform vec2 uMouse, uVel, uScale, uSize;
varying vec2 vUv;
void main() {
  vec2 uv = (vUv - 0.5) * uScale * (1.0 - 0.05 * uHover) + 0.5;
  vec2 p = vUv - uMouse;
  p.x *= uSize.x / uSize.y;
  float d = length(p);
  float ring = sin(d * 42.0 - uTime * 6.0) * exp(-d * 6.0);
  uv += (p / max(d, 0.001)) * ring * 0.012 * uHover;
  vec2 shift = (clamp(uVel * 0.002, -0.03, 0.03) + p * 0.006) * uHover;
  float r = texture2D(uTex, uv + shift).r;
  float g = texture2D(uTex, uv).g;
  float b = texture2D(uTex, uv - shift).b;
  vec2 q = abs(vUv - 0.5) * uSize - (uSize * 0.5 - uRadius);
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  gl_FragColor = vec4(r, g, b, clamp(0.5 - sd, 0.0, 1.0));
}
`

export function initMediaFX() {
  if (reduceMotion || !finePointer) return () => {}
  const canvas = document.createElement('canvas')
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  } catch {
    return () => {}
  }
  canvas.className = 'gl-layer gl-layer--media'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10)
  const u = {
    uTex: { value: null },
    uHover: { value: 0 },
    uTime: { value: 0 },
    uRadius: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uVel: { value: new THREE.Vector2() },
    uScale: { value: new THREE.Vector2(1, 1) },
    uSize: { value: new THREE.Vector2(1, 1) },
  }
  const material = new THREE.ShaderMaterial({ uniforms: u, vertexShader: vert, fragmentShader: frag, transparent: true })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
  mesh.visible = false
  scene.add(mesh)

  const size = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    camera.right = window.innerWidth
    camera.bottom = -window.innerHeight
    camera.updateProjectionMatrix()
  }
  size()
  window.addEventListener('resize', size)

  const textures = new Map()
  let target = null
  let shown = null
  let hover = 0
  let tx = 0.5
  let ty = 0.5
  let mx = 0.5
  let my = 0.5
  let vx = 0
  let vy = 0

  const pick = (e) => {
    const el = e.target instanceof Element ? e.target.closest('[data-fx]') : null
    const img = el?.querySelector('img')
    target = img?.naturalWidth ? el : null
    if (!target) return
    const r = target.getBoundingClientRect()
    tx = (e.clientX - r.left) / r.width
    ty = 1 - (e.clientY - r.top) / r.height
    if (target === shown) return
    let tex = textures.get(img)
    if (!tex) {
      tex = new THREE.Texture(img)
      tex.minFilter = THREE.LinearFilter
      tex.generateMipmaps = false
      tex.needsUpdate = true
      textures.set(img, tex)
    }
    u.uTex.value = tex
    u.uRadius.value = parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0
    shown = target
    mx = tx
    my = ty
  }
  const out = (e) => {
    if (!e.relatedTarget) target = null
  }

  const tick = (time, dt) => {
    const k = 1 - Math.pow(0.9, dt / 16.667)
    hover += ((target ? 1 : 0) - hover) * k
    if (!shown) return
    if (!target && hover < 0.003) {
      hover = 0
      shown = null
      mesh.visible = false
      renderer.render(scene, camera)
      return
    }
    const r = shown.getBoundingClientRect()
    const img = shown.querySelector('img')
    const nx = mx + (tx - mx) * k * 1.5
    const ny = my + (ty - my) * k * 1.5
    vx += ((nx - mx) * r.width * 10 - vx) * 0.2
    vy += ((ny - my) * r.height * 10 - vy) * 0.2
    mx = nx
    my = ny
    const ia = img.naturalWidth / img.naturalHeight
    const ba = r.width / r.height
    u.uScale.value.set(ba > ia ? 1 : ba / ia, ba > ia ? ia / ba : 1)
    u.uSize.value.set(r.width, r.height)
    u.uMouse.value.set(mx, my)
    u.uVel.value.set(vx, vy)
    u.uHover.value = hover
    u.uTime.value = time
    mesh.scale.set(r.width, r.height, 1)
    mesh.position.set(r.left + r.width / 2, -(r.top + r.height / 2), 0)
    mesh.visible = true
    renderer.render(scene, camera)
  }

  document.addEventListener('pointermove', pick, { passive: true })
  document.addEventListener('pointerout', out)
  gsap.ticker.add(tick)

  return () => {
    gsap.ticker.remove(tick)
    document.removeEventListener('pointermove', pick)
    document.removeEventListener('pointerout', out)
    window.removeEventListener('resize', size)
    textures.forEach((t) => t.dispose())
    material.dispose()
    mesh.geometry.dispose()
    renderer.dispose()
    canvas.remove()
  }
}
