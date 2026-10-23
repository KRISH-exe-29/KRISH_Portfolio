// Water cursor: a height-field ripple simulation at quarter resolution,
// drawn as specular highlights and a red rim over the page.
import {
  WebGLRenderer, Scene, OrthographicCamera, Mesh, PlaneGeometry, ShaderMaterial,
  WebGLRenderTarget, HalfFloatType, LinearFilter, Vector2, Color,
} from 'three'
import { gsap } from 'gsap'

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

// r = height, g = velocity. Pointer injects a soft drop along the segment it travelled this frame.
const simFrag = /* glsl */ `
precision highp float;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uA;
uniform vec2 uB;
uniform float uForce;
uniform float uAspect;
varying vec2 vUv;
float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}
void main() {
  vec4 c = texture2D(uPrev, vUv);
  float avg = (
    texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r +
    texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r +
    texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r +
    texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r) * 0.25;
  c.g += (avg - c.r) * 2.0;
  c.g *= 0.985;
  c.r += c.g;
  c.r *= 0.998;
  vec2 asp = vec2(uAspect, 1.0);
  float d = seg(vUv * asp, uA * asp, uB * asp);
  float drop = max(0.0, 1.0 - d / 0.03);
  drop = 0.5 - cos(drop * 3.14159) * 0.5;
  c.r += drop * uForce;
  gl_FragColor = c;
}
`

const showFrag = /* glsl */ `
precision highp float;
uniform sampler2D uH;
uniform vec2 uTexel;
uniform vec3 uTint;
varying vec2 vUv;
void main() {
  float hx = texture2D(uH, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uH, vUv - vec2(uTexel.x, 0.0)).r;
  float hy = texture2D(uH, vUv + vec2(0.0, uTexel.y)).r - texture2D(uH, vUv - vec2(0.0, uTexel.y)).r;
  vec3 n = normalize(vec3(-hx * 3.0, -hy * 3.0, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.6, 1.0));
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 36.0);
  float rim = clamp(length(vec2(hx, hy)) * 4.0, 0.0, 1.0);
  vec3 col = uTint * rim * 0.8 + vec3(1.0, 0.94, 0.9) * spec * 0.9;
  float a = clamp(rim * 0.55 + spec, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}
`

// Returns a dispose function, or null when the GPU cannot render float targets.
export function initWater(canvas) {
  let renderer
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' })
  } catch {
    return null
  }
  if (!renderer.extensions.has('EXT_color_buffer_float') && !renderer.extensions.has('EXT_color_buffer_half_float')) {
    renderer.dispose()
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

  const cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geo = new PlaneGeometry(2, 2)
  const opts = { type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false }
  let read = new WebGLRenderTarget(64, 64, opts)
  let write = new WebGLRenderTarget(64, 64, opts)

  const texel = { value: new Vector2() }
  const sim = new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: simFrag,
    uniforms: {
      uPrev: { value: null }, uTexel: texel,
      uA: { value: new Vector2(-1, -1) }, uB: { value: new Vector2(-1, -1) },
      uForce: { value: 0 }, uAspect: { value: 1 },
    },
  })
  const show = new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: showFrag,
    transparent: true,
    uniforms: { uH: { value: null }, uTexel: texel, uTint: { value: new Color('#ff2a1f') } },
  })
  const simScene = new Scene()
  simScene.add(new Mesh(geo, sim))
  const showScene = new Scene()
  showScene.add(new Mesh(geo, show))

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    const sw = Math.max(64, Math.round(window.innerWidth / 4))
    const sh = Math.max(64, Math.round(window.innerHeight / 4))
    read.setSize(sw, sh)
    write.setSize(sw, sh)
    texel.value.set(1 / sw, 1 / sh)
    sim.uniforms.uAspect.value = window.innerWidth / window.innerHeight
  }
  resize()

  const p = { x: -1, y: -1, px: -1, py: -1, last: 0 }
  const move = (e) => {
    p.x = e.clientX / window.innerWidth
    p.y = 1 - e.clientY / window.innerHeight
    if (p.px < 0) { p.px = p.x; p.py = p.y }
    p.last = performance.now()
  }

  const tick = () => {
    // Idle or hidden: the field has settled, so stop spending frames on it.
    if (document.hidden || performance.now() - p.last > 6000) return
    const dist = Math.hypot((p.x - p.px) * window.innerWidth, (p.y - p.py) * window.innerHeight)
    sim.uniforms.uA.value.set(p.px, p.py)
    sim.uniforms.uB.value.set(p.x, p.y)
    sim.uniforms.uForce.value = Math.min(dist * 0.012, 0.6)
    p.px = p.x
    p.py = p.y

    sim.uniforms.uPrev.value = read.texture
    renderer.setRenderTarget(write)
    renderer.render(simScene, cam)
    renderer.setRenderTarget(null)
    const t = read
    read = write
    write = t

    show.uniforms.uH.value = read.texture
    renderer.render(showScene, cam)
  }

  window.addEventListener('pointermove', move, { passive: true })
  window.addEventListener('resize', resize)
  gsap.ticker.add(tick)

  return () => {
    gsap.ticker.remove(tick)
    window.removeEventListener('pointermove', move)
    window.removeEventListener('resize', resize)
    read.dispose()
    write.dispose()
    sim.dispose()
    show.dispose()
    geo.dispose()
    renderer.dispose()
  }
}
