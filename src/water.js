// Water cursor: a ping-pong height field at reduced resolution. Pointer
// velocity drops ripples along its path; the field renders as a thin film of
// highlight, shadow and a warm caustic on top of the page.
import * as THREE from 'three'
import { gsap } from 'gsap'

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

const simFrag = /* glsl */ `
uniform sampler2D uState;
uniform vec2 uPx;
uniform vec2 uA;
uniform vec2 uB;
uniform float uForce;
uniform float uRadius;
uniform float uAspect;
varying vec2 vUv;
void main() {
  vec4 s = texture2D(uState, vUv);
  float avg = (
    texture2D(uState, vUv + vec2(uPx.x, 0.0)).r +
    texture2D(uState, vUv - vec2(uPx.x, 0.0)).r +
    texture2D(uState, vUv + vec2(0.0, uPx.y)).r +
    texture2D(uState, vUv - vec2(0.0, uPx.y)).r) * 0.25;
  s.g += (avg - s.r) * 2.0;
  s.g *= 0.986;
  s.r += s.g;
  s.r *= 0.996;
  vec2 asp = vec2(uAspect, 1.0);
  vec2 pa = (vUv - uA) * asp;
  vec2 ba = (uB - uA) * asp;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  float d = length(pa - ba * h);
  float drop = max(0.0, 1.0 - d / uRadius);
  drop = 0.5 - cos(drop * 3.14159265) * 0.5;
  s.r += drop * uForce;
  gl_FragColor = s;
}
`

const drawFrag = /* glsl */ `
uniform sampler2D uState;
uniform vec2 uPx;
uniform vec3 uInk;
uniform vec3 uLight;
uniform vec3 uWarm;
varying vec2 vUv;
void main() {
  float c = texture2D(uState, vUv).r;
  float l = texture2D(uState, vUv - vec2(uPx.x, 0.0)).r;
  float r = texture2D(uState, vUv + vec2(uPx.x, 0.0)).r;
  float b = texture2D(uState, vUv - vec2(0.0, uPx.y)).r;
  float t = texture2D(uState, vUv + vec2(0.0, uPx.y)).r;
  vec3 n = normalize(vec3((l - r) * 6.0, (b - t) * 6.0, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.6, 0.65));
  float lit = dot(n, L) - L.z;
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 60.0);
  float caustic = clamp(((l + r + b + t) * 0.25 - c) * 18.0, 0.0, 1.0);
  vec3 col = lit > 0.0 ? uLight : uInk;
  float a = clamp(abs(lit) * 1.6, 0.0, 0.42);
  col = mix(col, uWarm, caustic * 0.6);
  a = clamp(a + caustic * 0.22 + spec * 0.8, 0.0, 0.85);
  col = mix(col, vec3(1.0), spec);
  gl_FragColor = vec4(col * a, a);
}
`

export function createWater(canvas) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geo = new THREE.PlaneGeometry(2, 2)

  const rtOpts = {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  }
  let rtA = new THREE.WebGLRenderTarget(4, 4, rtOpts)
  let rtB = new THREE.WebGLRenderTarget(4, 4, rtOpts)

  const sim = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: simFrag,
    uniforms: {
      uState: { value: null },
      uPx: { value: new THREE.Vector2() },
      uA: { value: new THREE.Vector2(-1, -1) },
      uB: { value: new THREE.Vector2(-1, -1) },
      uForce: { value: 0 },
      uRadius: { value: 0.03 },
      uAspect: { value: 1 },
    },
    blending: THREE.NoBlending,
  })
  const draw = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: drawFrag,
    uniforms: {
      uState: { value: null },
      uPx: { value: new THREE.Vector2() },
      uInk: { value: new THREE.Color('#111111') },
      uLight: { value: new THREE.Color('#ffffff') },
      uWarm: { value: new THREE.Color('#ff4d00') },
    },
    blending: THREE.NoBlending,
    transparent: true,
  })
  const mesh = new THREE.Mesh(geo, sim)
  const scene = new THREE.Scene()
  scene.add(mesh)

  const resize = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setSize(w, h, false)
    const sw = Math.min(480, Math.round(w / 3))
    const sh = Math.round((sw * h) / w)
    rtA.setSize(sw, sh)
    rtB.setSize(sw, sh)
    sim.uniforms.uPx.value.set(1 / sw, 1 / sh)
    draw.uniforms.uPx.value.set(1 / sw, 1 / sh)
    sim.uniforms.uAspect.value = w / h
  }
  resize()
  window.addEventListener('resize', resize)

  // Pointer path since the last frame, in uv space (y up).
  const p = { x: -1, y: -1, px: -1, py: -1, speed: 0, moved: false }
  const onMove = (e) => {
    const x = e.clientX / window.innerWidth
    const y = 1 - e.clientY / window.innerHeight
    if (p.x < 0) {
      p.px = x
      p.py = y
    }
    p.x = x
    p.y = y
    p.moved = true
  }
  window.addEventListener('pointermove', onMove, { passive: true })

  let idle = 0
  const tick = (time, dt) => {
    if (document.hidden) return
    const u = sim.uniforms
    if (p.moved) {
      const dx = (p.x - p.px) * u.uAspect.value
      const dy = p.y - p.py
      p.speed = Math.min(Math.hypot(dx, dy) * 60, 1)
      u.uA.value.set(p.px, p.py)
      u.uB.value.set(p.x, p.y)
      u.uForce.value = 0.012 + p.speed * 0.05
      p.px = p.x
      p.py = p.y
      p.moved = false
      idle = 0
    } else {
      // At rest the surface still breathes: a faint drop now and then.
      idle += dt
      if (idle > 2600) {
        idle = 0
        const x = 0.15 + Math.random() * 0.7
        const y = 0.15 + Math.random() * 0.7
        u.uA.value.set(x, y)
        u.uB.value.set(x, y)
        u.uForce.value = 0.025
      } else u.uForce.value = 0
    }
    // Two sim steps per frame keep the waves quick at low resolution.
    for (let i = 0; i < 2; i++) {
      mesh.material = sim
      u.uState.value = rtA.texture
      renderer.setRenderTarget(rtB)
      renderer.render(scene, camera)
      const tmp = rtA
      rtA = rtB
      rtB = tmp
      u.uForce.value = 0
    }
    mesh.material = draw
    draw.uniforms.uState.value = rtA.texture
    renderer.setRenderTarget(null)
    renderer.render(scene, camera)
  }
  gsap.ticker.add(tick)

  return () => {
    gsap.ticker.remove(tick)
    window.removeEventListener('resize', resize)
    window.removeEventListener('pointermove', onMove)
    rtA.dispose()
    rtB.dispose()
    sim.dispose()
    draw.dispose()
    geo.dispose()
    renderer.dispose()
  }
}
