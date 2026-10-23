// Water layer: a height-field wave simulation at quarter resolution, ping-ponged
// between two half-float targets. The pointer's path drags a line of force through
// it; the surface is drawn as moving light (specular glints and slope shading).
import * as THREE from 'three'
import { pointer, visibility } from '../motion.js'

const VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

const SIM = /* glsl */ `
precision highp float;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uA;
uniform vec2 uB;
uniform float uForce;
uniform float uRadius;
uniform float uAspect;
varying vec2 vUv;
float seg(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}
void main(){
  vec4 c = texture2D(uPrev, vUv);
  float n = texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r
          + texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r
          + texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r
          + texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r;
  float h = (n * 0.5 - c.g) * 0.982;
  vec2 asp = vec2(uAspect, 1.0);
  float d = seg(vUv * asp, uA * asp, uB * asp);
  h += uForce * (1.0 - smoothstep(0.0, uRadius, d));
  gl_FragColor = vec4(h, c.r, 0.0, 1.0);
}
`

const DRAW = /* glsl */ `
precision highp float;
uniform sampler2D uH;
uniform vec2 uTexel;
uniform vec3 uTint;
uniform float uTime;
varying vec2 vUv;
void main(){
  float hl = texture2D(uH, vUv - vec2(uTexel.x, 0.0)).r;
  float hr = texture2D(uH, vUv + vec2(uTexel.x, 0.0)).r;
  float hd = texture2D(uH, vUv - vec2(0.0, uTexel.y)).r;
  float hu = texture2D(uH, vUv + vec2(0.0, uTexel.y)).r;
  vec3 n = normalize(vec3(hl - hr, hd - hu, 0.09));
  vec3 L = normalize(vec3(-0.45, 0.6, 0.66));
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 28.0);
  float slope = dot(n.xy, L.xy);
  // caustic shimmer: fine bright filaments where the surface folds
  float fold = abs(hl + hr + hd + hu - 4.0 * texture2D(uH, vUv).r);
  float caustic = smoothstep(0.015, 0.09, fold) * (0.6 + 0.4 * sin(uTime * 3.0 + vUv.x * 40.0));
  float light = clamp(spec * 0.85 + max(slope, 0.0) * 0.28 + caustic * 0.35, 0.0, 0.9);
  float shade = clamp(-slope * 0.22, 0.0, 0.3);
  float a = max(light, shade);
  vec3 col = light >= shade ? uTint : vec3(0.0);
  gl_FragColor = vec4(col * a, a);
}
`

export function createWater(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' })
  const ext = renderer.extensions
  if (!ext.has('EXT_color_buffer_float') && !ext.has('EXT_color_buffer_half_float')) {
    renderer.dispose()
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(0x000000, 0)
  renderer.autoClear = false

  const scene = new THREE.Scene()
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geo = new THREE.PlaneGeometry(2, 2)
  const quad = new THREE.Mesh(geo)
  quad.frustumCulled = false
  scene.add(quad)

  const rtOpts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false }
  let read = new THREE.WebGLRenderTarget(4, 4, rtOpts)
  let write = new THREE.WebGLRenderTarget(4, 4, rtOpts)

  const simMat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: SIM,
    uniforms: {
      uPrev: { value: null },
      uTexel: { value: new THREE.Vector2() },
      uA: { value: new THREE.Vector2(-1, -1) },
      uB: { value: new THREE.Vector2(-1, -1) },
      uForce: { value: 0 },
      uRadius: { value: 0.022 },
      uAspect: { value: 1 },
    },
    depthTest: false,
  })
  const drawMat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: DRAW,
    uniforms: {
      uH: { value: null },
      uTexel: { value: new THREE.Vector2() },
      uTint: { value: new THREE.Color('#FFE79A') },
      uTime: { value: 0 },
    },
    blending: THREE.NoBlending,
    depthTest: false,
  })

  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setSize(w, h, false)
    const sw = Math.max(32, Math.round(w / 4))
    const sh = Math.max(32, Math.round(h / 4))
    read.setSize(sw, sh)
    write.setSize(sw, sh)
    for (const t of [read, write]) {
      renderer.setRenderTarget(t)
      renderer.clear()
    }
    renderer.setRenderTarget(null)
    simMat.uniforms.uTexel.value.set(1 / sw, 1 / sh)
    drawMat.uniforms.uTexel.value.set(1 / sw, 1 / sh)
    simMat.uniforms.uAspect.value = w / h
  }
  resize()
  window.addEventListener('resize', resize)

  let last = null
  let splash = 0
  let idle = 0
  const onDown = () => { splash = 1.4 }
  window.addEventListener('pointerdown', onDown)

  function step(a, b, force) {
    simMat.uniforms.uPrev.value = read.texture
    simMat.uniforms.uA.value.copy(a)
    simMat.uniforms.uB.value.copy(b)
    simMat.uniforms.uForce.value = force
    quad.material = simMat
    renderer.setRenderTarget(write)
    renderer.render(scene, cam)
    const t = read
    read = write
    write = t
  }

  const A = new THREE.Vector2()
  const B = new THREE.Vector2()

  function tick(time, dt) {
    if (visibility.hidden) return
    const w = window.innerWidth
    const h = window.innerHeight
    const cur = new THREE.Vector2(pointer.x / w, 1 - pointer.y / h)
    let force = 0
    if (pointer.moved && last) {
      const dist = Math.hypot((cur.x - last.x) * w, (cur.y - last.y) * h)
      force = Math.min(dist / 45, 1) * 0.55
      if (dist > 0.5) idle = 0
    }
    idle += dt
    // a slow drop at rest so the surface keeps breathing
    if (idle > 2.6 && pointer.moved) {
      idle = 0
      force = 0.5
    }
    if (splash) {
      force = Math.max(force, splash)
      splash = 0
    }
    A.copy(last || cur)
    B.copy(cur)
    step(A, B, force)
    step(B, B, 0)
    last = cur

    drawMat.uniforms.uH.value = read.texture
    drawMat.uniforms.uTime.value = time
    quad.material = drawMat
    renderer.setRenderTarget(null)
    renderer.clear()
    renderer.render(scene, cam)
  }

  function dispose() {
    window.removeEventListener('resize', resize)
    window.removeEventListener('pointerdown', onDown)
    read.dispose()
    write.dispose()
    simMat.dispose()
    drawMat.dispose()
    geo.dispose()
    renderer.dispose()
  }

  return { tick, dispose }
}
