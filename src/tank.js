import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { SPECIES } from './species.js'

/* The tank. One scene: water, light, rocks, kelp, bubbles and nine fish.
   No loop of its own: the page calls tick() from GSAP's ticker, so the whole site runs on one rAF. */

THREE.ColorManagement.enabled = false // hex values in, hex values out; every material below speaks raw sRGB

const SURF = 3.4
const FLOOR = -24.5
const DEEP = -21 // camera y at the sand layer
const LETTERS = 'HIREKRISH'


const CAUSTIC = /* glsl */ `
float caustic(vec2 p, float t) {
  p = mod(p * 6.2831, 6.2831) - 250.0;
  vec2 i = p; float c = 1.0; float inten = 0.005;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0; c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.0);
}
float fogF(float d, float k) { return 1.0 - exp(-k * k * d * d); }
`

const FISH_VS = /* glsl */ `
uniform float uTime, uSwim, uPhase, uAmp;
varying vec3 vPos; varying vec3 vN; varying vec3 vWorld; varying float vDepth;
void main() {
  vec3 p = position;
  float back = clamp((0.25 - p.x) / 1.1, 0.0, 1.0);
  p.z += sin(p.x * 3.2 - uTime * uSwim + uPhase) * uAmp * back * back;
  vPos = position;
  vec4 w = modelMatrix * vec4(p, 1.0);
  vWorld = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 mv = viewMatrix * w;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`

const FISH_FS = /* glsl */ `
uniform vec3 uA, uB, uFogColor;
uniform float uPattern, uFin, uTime, uCaustic, uFog, uGlow;
varying vec3 vPos; varying vec3 vN; varying vec3 vWorld; varying float vDepth;
${CAUSTIC}
void main() {
  vec3 col = uA;
  if (uPattern > 0.5 && uPattern < 1.5) col = mix(uA, uB, step(0.62, fract(vPos.x * 3.4 + 0.2)));
  else if (uPattern > 1.5 && uPattern < 2.5) {
    float n = sin(vPos.x * 8.0 + 1.3) * sin(vPos.y * 9.0 + 0.4) + sin(vPos.z * 7.0 + vPos.x * 3.0) * 0.6;
    col = mix(uA, uB, smoothstep(0.25, 0.35, n));
  } else if (uPattern > 2.5 && uPattern < 3.5) {
    float s = abs(fract(vPos.y * 9.0 + 0.5) - 0.5);
    col = mix(uA, uB, smoothstep(0.18, 0.12, s));
  } else if (uPattern > 3.5) col = mix(uA, uB, smoothstep(0.1, -0.7, vPos.x));
  col = mix(col, col * 0.5 + vec3(0.48, 0.45, 0.38), smoothstep(-0.02, -0.3, vPos.y) * 0.45 * (1.0 - uFin));
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vWorld);
  float lam = 0.42 + 0.58 * max(dot(n, normalize(vec3(0.25, 1.0, 0.35))), 0.0);
  float cau = caustic(vWorld.xz * 0.22 + vWorld.y * 0.03, uTime * 0.5) * max(n.y, 0.0) * uCaustic;
  float rim = pow(1.0 - abs(dot(n, v)), 2.5);
  col = col * lam + cau * vec3(1.0, 0.92, 0.7) + rim * vec3(0.95, 0.85, 0.55) * (0.25 + uGlow * 0.6);
  col += uGlow * 0.12;
  col = mix(col, uFogColor, fogF(vDepth, uFog));
  gl_FragColor = vec4(col, uFin > 0.5 ? 0.82 : 1.0);
}`

const KELP_VS = /* glsl */ `
uniform float uTime, uBass;
varying float vH; varying float vDepth; varying float vSeed;
void main() {
  vec3 p = position;
  float seed = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.61;
  float h = clamp(p.y / 7.0, 0.0, 1.0);
  p.x += (sin(p.y * 0.55 + uTime * 1.1 + seed) * 0.5 + sin(uTime * 0.5 + seed * 2.0) * 0.3) * h * h * (1.0 + uBass * 0.8);
  p.z += cos(p.y * 0.4 + uTime * 0.8 + seed) * 0.3 * h;
  vH = h; vSeed = fract(seed);
  vec4 mv = viewMatrix * modelMatrix * instanceMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`

const KELP_FS = /* glsl */ `
uniform vec3 uFogColor; uniform float uFog;
varying float vH; varying float vDepth; varying float vSeed;
${CAUSTIC}
void main() {
  vec3 base = mix(vec3(0.24, 0.3, 0.12), vec3(0.42, 0.32, 0.1), vSeed);
  vec3 col = mix(base * 0.6, base * 1.5 + vec3(0.12, 0.08, 0.0), vH);
  col = mix(col, uFogColor, fogF(vDepth, uFog));
  gl_FragColor = vec4(col, 1.0);
}`

const PLANE_VS = /* glsl */ `
varying vec3 vWorld; varying float vDepth;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vec4 mv = viewMatrix * w; vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`

const SAND_FS = /* glsl */ `
uniform vec3 uFogColor; uniform float uFog, uTime, uCaustic;
varying vec3 vWorld; varying float vDepth;
${CAUSTIC}
void main() {
  float ripple = sin(vWorld.x * 2.2 + sin(vWorld.z * 0.7) * 2.0) * 0.5 + 0.5;
  vec3 col = mix(vec3(0.5, 0.38, 0.22), vec3(0.66, 0.52, 0.32), ripple);
  col += caustic(vWorld.xz * 0.12, uTime * 0.45) * vec3(0.9, 0.8, 0.5) * uCaustic;
  col = mix(col, uFogColor, fogF(vDepth, uFog));
  gl_FragColor = vec4(col, 1.0);
}`

const SURF_FS = /* glsl */ `
uniform vec3 uFogColor; uniform float uFog, uTime, uBass;
varying vec3 vWorld; varying float vDepth;
${CAUSTIC}
void main() {
  float c = caustic(vWorld.xz * 0.08, uTime * 0.35);
  vec3 col = mix(vec3(0.62, 0.66, 0.42), vec3(1.0, 0.93, 0.7), c * (1.0 + uBass));
  col = mix(col, uFogColor, fogF(vDepth, uFog * 0.6));
  gl_FragColor = vec4(col, 0.92);
}`

const BUBBLE_VS = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime, uCamY, uPx, uBurst, uBass, uSurf;
varying float vA;
void main() {
  float span = 14.0;
  float speed = 0.6 + aSeed.w * 1.4 + uBurst * 3.0;
  float y = uCamY - 7.0 + mod(aSeed.y * span + uTime * speed, span);
  vec3 p = vec3(position.x + sin(uTime * 2.0 + aSeed.x * 20.0) * 0.08, y, position.z);
  vA = y < uSurf ? 1.0 : 0.0;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = (0.05 + aSeed.z * 0.13) * (1.0 + uBass * 0.9) * uPx * 300.0 / -mv.z;
  gl_Position = projectionMatrix * mv;
}`

const BUBBLE_FS = /* glsl */ `
varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5 || vA < 0.5) discard;
  float ring = smoothstep(0.32, 0.47, d) * smoothstep(0.5, 0.46, d);
  float hi = smoothstep(0.14, 0.0, length(c - vec2(-0.15, -0.15)));
  gl_FragColor = vec4(vec3(1.0, 0.97, 0.86), ring * 0.7 + hi * 0.9 + 0.06);
}`

const POST_VS = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`

const POST_FS = /* glsl */ `
uniform sampler2D tScene;
uniform float uTime, uFill, uDepth, uBass, uKnock;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  vec2 c = uv - 0.5;
  uv += vec2(sin(uTime * 60.0), cos(uTime * 53.0)) * uKnock * 0.004;
  vec2 off = vec2(sin(uv.y * 16.0 + uTime * 1.3), cos(uv.x * 13.0 + uTime * 1.1)) * 0.0022;
  float edge = smoothstep(0.3, 0.5, max(abs(c.x), abs(c.y)));
  off -= c * edge * 0.02;
  float ca = 0.0015 + edge * 0.007;
  vec3 col;
  col.r = texture2D(tScene, uv + off + c * ca).r;
  col.g = texture2D(tScene, uv + off).g;
  col.b = texture2D(tScene, uv + off - c * ca).b;
  float x = uv.x + (1.0 - uv.y) * 0.3;
  float rays = (sin(x * 21.0 + uTime * 0.3) * 0.5 + 0.5) * (sin(x * 34.0 - uTime * 0.21) * 0.5 + 0.5);
  rays = pow(rays, 3.0) * smoothstep(0.1, 1.0, uv.y) * (1.0 - uDepth * 0.85) * 0.32;
  col += rays * vec3(1.0, 0.88, 0.58) * (1.0 + uBass * 1.5);
  col *= 1.0 - dot(c, c) * 0.95;
  float s = uv.x - uv.y * 0.32;
  float streak = smoothstep(0.018, 0.0, abs(s - 0.1)) * 0.07 + smoothstep(0.008, 0.0, abs(s - 0.145)) * 0.05;
  col += streak;
  float line = uFill * 1.06 + sin(uv.x * 11.0 + uTime * 3.0) * 0.008 * (1.0 - step(1.0, uFill));
  if (uv.y > line) col = mix(vec3(0.07, 0.065, 0.055), vec3(0.15, 0.13, 0.1), uv.y) + streak * 1.5;
  col += smoothstep(0.007, 0.0, abs(uv.y - line)) * 0.55 * (1.0 - step(1.0, uFill));
  gl_FragColor = vec4(col, 1.0);
}`

const FOG_STOPS = [new THREE.Color('#6f8659'), new THREE.Color('#33503f'), new THREE.Color('#1b2a23')]

// Smooth outline through [x0, y0, x1, y1, ...]
function shape(points) {
  const pts = []
  for (let i = 0; i < points.length; i += 2) pts.push(new THREE.Vector2(points[i], points[i + 1]))
  const s = new THREE.Shape()
  s.moveTo(pts[0].x, pts[0].y)
  s.splineThru(pts.slice(1))
  return new THREE.ShapeGeometry(s, 6)
}

// Tail shapes start at x=0 and run toward -x; dorsal fins start at y=0 and run up.
const TAILS = {
  fork: () => shape([0, 0.02, -0.2, 0.15, -0.4, 0.32, -0.55, 0.36, -0.42, 0.14, -0.36, 0.02, -0.34, 0, -0.42, -0.14, -0.55, -0.36, -0.4, -0.32, -0.2, -0.15, 0, -0.02]),
  forkS: () => shape([0, 0.02, -0.12, 0.1, -0.25, 0.2, -0.32, 0.2, -0.24, 0.08, -0.22, 0.01, -0.22, 0, -0.24, -0.08, -0.32, -0.2, -0.25, -0.2, -0.12, -0.1, 0, -0.02]),
  fan: () => shape([0, 0.03, -0.2, 0.25, -0.38, 0.28, -0.4, 0.16, -0.43, 0.05, -0.43, -0.05, -0.4, -0.16, -0.38, -0.28, -0.2, -0.25, 0, -0.03, 0, 0, 0, 0.03]),
  veil: () => shape([0, 0.06, -0.3, 0.55, -0.85, 0.5, -0.8, 0.05, -0.85, -0.05, -0.9, -0.45, -0.85, -0.5, -0.3, -0.55, 0, -0.06, 0, 0, 0, 0.06]),
  veilS: () => shape([0, 0.05, -0.25, 0.4, -0.6, 0.38, -0.55, 0.0, -0.6, -0.38, -0.25, -0.4, 0, -0.05, 0, 0, 0, 0.05]),
  flag: () => shape([0, 0.02, -0.25, 0.2, -0.55, 0.35, -0.62, 0.3, -0.66, 0.0, -0.66, -0.0, -0.62, -0.3, -0.55, -0.35, -0.25, -0.2, 0, -0.02, 0, 0, 0, 0.02]),
  tiny: () => shape([0, 0.02, -0.08, 0.12, -0.18, 0.14, -0.2, 0.06, -0.2, -0.06, -0.18, -0.14, -0.08, -0.12, 0, -0.02, 0, 0, 0, 0.02]),
}
const DORSALS = {
  fin: () => shape([0.08, 0, 0.0, 0.14, -0.14, 0.2, -0.24, 0.16, -0.22, 0.08, -0.2, 0.02, -0.2, 0, -0.1, 0, 0, 0, 0.08, 0]),
  long: () => shape([0.2, 0, 0.1, 0.12, -0.2, 0.18, -0.45, 0.1, -0.4, 0.04, -0.38, 0.0, -0.36, 0, 0, 0, 0.1, 0, 0.2, 0]),
  sail: () => shape([0.12, 0, 0.0, 0.3, -0.35, 0.62, -0.42, 0.6, -0.3, 0.3, -0.22, 0.05, -0.2, 0, 0, 0, 0.06, 0, 0.12, 0]),
}

function buildFish(sp, shared, eyeMat) {
  const [lx, ly, lz] = sp.body
  const body = new THREE.SphereGeometry(0.5, 28, 18)
  body.scale(lx, ly, lz)
  const fins = []
  const tail = sp.tail === 'double' ? TAILS.fan : TAILS[sp.tail]
  const tailX = -lx * 0.46
  if (sp.tail === 'double') {
    for (const r of [-0.5, 0.5]) { const g = tail(); g.rotateY(r); g.translate(tailX, 0, 0); fins.push(g) }
  } else { const g = tail(); g.translate(tailX, 0, 0); fins.push(g) }
  if (sp.dorsal) { const g = DORSALS[sp.dorsal](); g.translate(lx * 0.1, ly * 0.44, 0); fins.push(g) }
  if (sp.dorsal === 'sail') { const g = DORSALS.sail(); g.scale(1, -1, 1); g.translate(lx * 0.1, -ly * 0.44, 0); fins.push(g) }
  const finGeo = mergeGeometries(fins.map((g) => g.toNonIndexed()))

  const u = {
    ...shared,
    uA: { value: new THREE.Color(sp.a) },
    uB: { value: new THREE.Color(sp.b) },
    uPattern: { value: sp.pattern },
    uPhase: { value: Math.random() * 6 },
    uSwim: { value: 6 },
    uAmp: { value: 0.16 },
    uGlow: { value: 0 },
  }
  const bodyMat = new THREE.ShaderMaterial({ vertexShader: FISH_VS, fragmentShader: FISH_FS, uniforms: { ...u, uFin: { value: 0 } } })
  const finMat = new THREE.ShaderMaterial({ vertexShader: FISH_VS, fragmentShader: FISH_FS, uniforms: { ...u, uFin: { value: 1 } }, transparent: true, side: THREE.DoubleSide, depthWrite: false })
  const g = new THREE.Group()
  g.add(new THREE.Mesh(body, bodyMat))
  g.add(new THREE.Mesh(finGeo, finMat))
  const er = sp.eye || 0.045
  const eyes = []
  for (const s of [-1, 1]) {
    const e = new THREE.SphereGeometry(er, 10, 8)
    e.translate(lx * 0.34, ly * 0.12, s * (lz * 0.36 + (sp.eye ? er * 0.6 : 0)))
    eyes.push(e)
  }
  g.add(new THREE.Mesh(mergeGeometries(eyes), eyeMat))
  g.rotation.order = 'YZX'
  return { group: g, u }
}

function letterTexture(ch) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const x = c.getContext('2d')
  x.fillStyle = '#efe3c8'
  x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill()
  x.strokeStyle = '#c8402a'; x.lineWidth = 6; x.stroke()
  x.fillStyle = '#c8402a'
  x.font = 'bold 76px Georgia, serif'
  x.textAlign = 'center'; x.textBaseline = 'middle'
  x.fillText(ch, 64, 70)
  return new THREE.CanvasTexture(c)
}

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt))
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))

export function createTank(canvas, { small = false, audio = null, onLetters = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance' })
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace
  const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2)
  renderer.setPixelRatio(dpr)

  const scene = new THREE.Scene()
  const fogColor = new THREE.Color('#6f8659')
  scene.fog = new THREE.FogExp2(fogColor, 0.04)
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80)
  camera.position.set(0, 0, 8)

  const shared = {
    uTime: { value: 0 }, uFogColor: { value: fogColor }, uFog: { value: 0.04 },
    uCaustic: { value: 0.9 }, uBass: { value: 0 },
  }
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#0d0b09' })

  scene.add(new THREE.HemisphereLight('#f3dfa6', '#3a3020', 1.6))
  const sun = new THREE.DirectionalLight('#ffe2a8', 1.2)
  sun.position.set(3, 10, 4)
  scene.add(sun)

  // surface, seen from below
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.ShaderMaterial({
    vertexShader: PLANE_VS, fragmentShader: SURF_FS, transparent: true, side: THREE.DoubleSide,
    uniforms: { uTime: shared.uTime, uFogColor: shared.uFogColor, uFog: shared.uFog, uBass: shared.uBass },
  }))
  surf.rotation.x = Math.PI / 2
  surf.position.y = SURF
  scene.add(surf)

  // sand
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(90, 70, 1, 1), new THREE.ShaderMaterial({
    vertexShader: PLANE_VS, fragmentShader: SAND_FS,
    uniforms: { uTime: shared.uTime, uFogColor: shared.uFogColor, uFog: shared.uFog, uCaustic: shared.uCaustic },
  }))
  sand.rotation.x = -Math.PI / 2
  sand.position.set(0, FLOOR, -10)
  scene.add(sand)

  // rock stacks rising from the sand to the reef
  const rng = mulberry(29)
  const rockMats = [new THREE.MeshLambertMaterial({ color: '#5b4a3a', flatShading: true }), new THREE.MeshLambertMaterial({ color: '#7a5a3c', flatShading: true })]
  const tops = []
  const stacks = small ? 6 : 9
  for (let i = 0; i < stacks; i++) {
    const x = -15 + (i / (stacks - 1)) * 30 + (rng() - 0.5) * 2
    const z = -4 - rng() * 9
    const top = -11.5 - rng() * 4
    let y = FLOOR
    while (y < top) {
      const r = 1.1 + rng() * 1.2
      const geo = new THREE.IcosahedronGeometry(r, 1)
      const p = geo.attributes.position
      for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) * (0.8 + rng() * 0.4), p.getY(k) * (0.7 + rng() * 0.3), p.getZ(k) * (0.8 + rng() * 0.4))
      geo.computeVertexNormals()
      const m = new THREE.Mesh(geo, rockMats[(i + Math.round(y)) & 1])
      m.position.set(x + (rng() - 0.5) * 1.4, y + r * 0.6, z + (rng() - 0.5))
      m.rotation.set(rng() * 3, rng() * 3, rng() * 3)
      scene.add(m)
      y += r * 1.1
    }
    tops.push([x, y, z])
  }

  // torii ornament on the sand, every goldfish tank needs one
  const torii = new THREE.Group()
  const red = new THREE.MeshLambertMaterial({ color: '#c8402a' })
  const black = new THREE.MeshLambertMaterial({ color: '#1d1a16' })
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3, 10), red); p.position.set(s * 1.1, 1.5, 0); torii.add(p) }
  const kasagi = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.28, 0.4), black); kasagi.position.y = 3.15; torii.add(kasagi)
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.18, 0.26), red); nuki.position.y = 2.45; torii.add(nuki)
  torii.position.set(2.5, FLOOR, -5)
  torii.rotation.y = -0.35
  scene.add(torii)

  // kelp
  const kelpCount = small ? 40 : 90
  const kelpGeo = new THREE.PlaneGeometry(0.32, 7, 1, 14)
  kelpGeo.translate(0, 3.5, 0)
  const kelp = new THREE.InstancedMesh(kelpGeo, new THREE.ShaderMaterial({
    vertexShader: KELP_VS, fragmentShader: KELP_FS, side: THREE.DoubleSide,
    uniforms: { uTime: shared.uTime, uBass: shared.uBass, uFogColor: shared.uFogColor, uFog: shared.uFog },
  }), kelpCount)
  const mtx = new THREE.Matrix4()
  for (let i = 0; i < kelpCount; i++) {
    const onRock = i % 3 === 0 && tops.length
    const [tx, ty, tz] = onRock ? tops[i % tops.length] : [(rng() - 0.5) * 36, FLOOR, -2 - rng() * 14]
    const s = onRock ? 0.4 + rng() * 0.4 : 0.6 + rng() * 0.9
    mtx.compose(new THREE.Vector3(tx + (rng() - 0.5) * 1.5, ty - 0.4, tz + (rng() - 0.5)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rng() * 3, 0)), new THREE.Vector3(1, s, 1))
    kelp.setMatrixAt(i, mtx)
  }
  scene.add(kelp)

  // bubbles: a cloud that travels with the camera, plus an airstone column
  const bubbleN = small ? 110 : 240
  const bPos = new Float32Array(bubbleN * 3)
  const bSeed = new Float32Array(bubbleN * 4)
  for (let i = 0; i < bubbleN; i++) {
    const column = i < bubbleN * 0.25
    bPos[i * 3] = column ? -5.2 + (rng() - 0.5) * 0.4 : (rng() - 0.5) * 16
    bPos[i * 3 + 2] = column ? -2.5 + (rng() - 0.5) * 0.4 : -6 + rng() * 10
    bSeed.set([rng(), rng(), rng(), rng()], i * 4)
  }
  const bGeo = new THREE.BufferGeometry()
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3))
  bGeo.setAttribute('aSeed', new THREE.BufferAttribute(bSeed, 4))
  const bUni = { uTime: shared.uTime, uBass: shared.uBass, uCamY: { value: 0 }, uPx: { value: dpr }, uBurst: { value: 0 }, uSurf: { value: SURF } }
  const bubbles = new THREE.Points(bGeo, new THREE.ShaderMaterial({ vertexShader: BUBBLE_VS, fragmentShader: BUBBLE_FS, uniforms: bUni, transparent: true, depthWrite: false }))
  bubbles.frustumCulled = false
  scene.add(bubbles)

  // fish
  const fish = SPECIES.map((sp, i) => {
    const f = buildFish(sp, shared, eyeMat)
    scene.add(f.group)
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: letterTexture(LETTERS[i]), transparent: true, opacity: 0, depthWrite: false }))
    sprite.scale.setScalar(0.5)
    scene.add(sprite)
    return {
      ...f, sp, sprite,
      pos: new THREE.Vector3((i - 4) * 1.2, 8, 0), vel: new THREE.Vector3(), heading: 0, pitch: 0,
      angle: (i / 9) * Math.PI * 2, radius: 1.4 + (i % 4) * 0.45, orbit: 0.25 + (i % 3) * 0.08, release: 1.35 + i * 0.16,
    }
  })

  // post pass: refraction through the glass, light shafts, the water filling up
  const rt = new THREE.WebGLRenderTarget(2, 2)
  const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    vertexShader: POST_VS, fragmentShader: POST_FS, depthTest: false,
    uniforms: { tScene: { value: rt.texture }, uTime: shared.uTime, uFill: { value: 0 }, uDepth: { value: 0 }, uBass: shared.uBass, uKnock: { value: 0 } },
  }))
  const postScene = new THREE.Scene()
  postScene.add(post)
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const PU = post.material.uniforms

  // state
  let t = 0, depth = 0, depthT = 0, focus = -1, letters = 0, taps = [], introDone = false
  const ptr = new THREE.Vector2(0, 0), ptrW = new THREE.Vector3(), ptrT = new THREE.Vector3()
  let lastPtr = -10, halfW = 4, halfH = 3, active = true
  const fft = audio ? new Uint8Array(64) : null
  const v = new THREE.Vector3(), tgt = new THREE.Vector3(), desired = new THREE.Vector3()

  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1
    renderer.setSize(w, h, false)
    rt.setSize(Math.round(w * dpr), Math.round(h * dpr))
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    halfH = Math.tan(THREE.MathUtils.degToRad(22.5)) * 8
    halfW = halfH * camera.aspect
  }
  resize()

  function update(dt, snap = false) {
    t += dt
    shared.uTime.value = t
    // music
    let bass = 0
    if (fft && audio.analyser) {
      audio.analyser.getByteFrequencyData(fft)
      for (let i = 1; i < 7; i++) bass += fft[i]
      bass = Math.max(0, bass / (6 * 255) - 0.35) * 1.6
    }
    shared.uBass.value = snap ? 0 : damp(shared.uBass.value, bass, 8, dt)

    // descent
    depth = snap ? depthT : damp(depth, depthT, 4, dt)
    const camY = depth * DEEP
    const px = ptr.x, py = ptr.y
    camera.position.set(px * 0.5, camY + py * 0.25, 8)
    camera.lookAt(px * 0.15, camY + 0.5 - depth * 2, 0)
    const fc = depth < 0.5 ? FOG_STOPS[0].clone().lerp(FOG_STOPS[1], depth * 2) : FOG_STOPS[1].clone().lerp(FOG_STOPS[2], depth * 2 - 1)
    fogColor.copy(fc)
    shared.uFog.value = 0.035 + depth * 0.02
    scene.fog.density = shared.uFog.value
    shared.uCaustic.value = 0.95 - depth * 0.35
    renderer.setClearColor(fogColor)
    bUni.uCamY.value = camY
    PU.uDepth.value = depth

    // intro: water fills, then the fish are poured in
    PU.uFill.value = snap ? 1.2 : Math.min(1.2, t / 1.3)
    bUni.uBurst.value = snap ? 0 : Math.max(0, 1 - Math.abs(t - 1.6) / 0.9)
    PU.uKnock.value = damp(PU.uKnock.value, 0, 6, dt)
    if (!introDone && t > 3.4) introDone = true

    // pointer target in world space (plane z = 0), wanders on its own when idle
    if (t - lastPtr > 3 || snap) ptrT.set(Math.sin(t * 0.21) * halfW * 0.45, camY + Math.sin(t * 0.33) * halfH * 0.35, 0)
    else ptrT.set(px * halfW * 0.9, camY + py * halfH * 0.9, 0)
    ptrW.x = snap ? ptrT.x : damp(ptrW.x, ptrT.x, 3, dt)
    ptrW.y = snap ? ptrT.y : damp(ptrW.y, ptrT.y, 3, dt)

    if (letters > 0) { letters -= dt; if (letters <= 0) onLetters(false) }
    const spacing = Math.min(1.1, (halfW * 1.8) / 9)
    const scale = Math.min(1, halfW / 4.5)

    fish.forEach((f, i) => {
      if (!snap && t < f.release) { f.pos.set((i - 4) * 0.6, camY + halfH + 2, 0); f.group.position.copy(f.pos); return }
      const a = f.angle + t * f.orbit
      if (letters > 0) tgt.set((i - 4) * spacing, camY + 0.1, 1.5)
      else if (focus === i) tgt.set(camera.position.x * 0.6, camY - 0.35, 3.6)
      else {
        tgt.set(ptrW.x + Math.cos(a) * f.radius * scale, ptrW.y + Math.sin(a * 1.3) * f.radius * 0.45 * scale, Math.sin(a) * f.radius * 0.8 - (focus >= 0 ? 1.6 : 0))
        tgt.x = THREE.MathUtils.clamp(tgt.x, -halfW * 0.85, halfW * 0.85)
        tgt.y = THREE.MathUtils.clamp(tgt.y, camY - halfH * 0.75, camY + halfH * 0.75)
      }
      if (snap) { f.pos.copy(tgt); f.vel.set(0, 0, 0); f.heading = 0 } else {
        desired.subVectors(tgt, f.pos)
        const dist = desired.length()
        desired.normalize().multiplyScalar(f.sp.speed * Math.min(2.2, dist * 1.4 + 0.2))
        for (const o of fish) {
          if (o === f) continue
          v.subVectors(f.pos, o.pos)
          const d = v.length()
          if (d > 0.001 && d < 0.85) desired.addScaledVector(v, ((0.85 - d) / d) * 2.2)
        }
        f.vel.lerp(desired, 1 - Math.exp(-dt * 2.6))
        f.pos.addScaledVector(f.vel, dt)
        const settled = (letters > 0 || focus === i) && dist < 0.4
        const want = settled ? 0 : f.vel.lengthSq() > 0.004 ? Math.atan2(-f.vel.z, f.vel.x) : f.heading
        f.heading += wrap(want - f.heading) * (1 - Math.exp(-dt * 5))
        f.pitch = damp(f.pitch, settled ? 0 : THREE.MathUtils.clamp(f.vel.y * 0.5, -0.5, 0.5), 5, dt)
      }
      f.group.position.copy(f.pos)
      f.group.rotation.set(0, f.heading, f.pitch)
      f.group.scale.setScalar(letters > 0 ? spacing * 0.8 : scale)
      const sp = Math.min(3, f.vel.length())
      f.u.uSwim.value = 5 + sp * 5 + shared.uBass.value * 6
      f.u.uAmp.value = 0.1 + sp * 0.05
      f.u.uGlow.value = snap ? (focus === i ? 1 : 0) : damp(f.u.uGlow.value, focus === i ? 1 : 0, 6, dt)
      const sm = f.sprite.material
      sm.opacity = snap ? 0 : damp(sm.opacity, letters > 0 ? 1 : 0, 5, dt)
      f.sprite.visible = sm.opacity > 0.01
      f.sprite.position.set(f.pos.x, f.pos.y + 0.55 * spacing, f.pos.z)
      f.sprite.scale.setScalar(0.62 * spacing)
    })
  }

  function render() {
    renderer.setRenderTarget(rt)
    renderer.render(scene, camera)
    renderer.setRenderTarget(null)
    renderer.render(postScene, postCam)
  }

  return {
    tick(dtMs) {
      if (!active) return
      update(Math.min(0.05, dtMs / 1000))
      render()
    },
    renderStill() { update(0, true); render() },
    skipIntro() { if (t < 3.4) { t = 3.4; fish.forEach((f) => { f.release = 0 }) } },
    setDepth(p) { depthT = p },
    setPointer(x, y) { ptr.set(x, y); lastPtr = t },
    setFocus(i) { focus = i },
    setActive(on) { active = on },
    resize,
    tap(x, y) {
      PU.uKnock.value = 1
      // startle: everyone darts away from the knock
      const kx = x * halfW, ky = depth * DEEP + y * halfH
      fish.forEach((f) => { v.set(f.pos.x - kx, f.pos.y - ky, 0.5).normalize(); f.vel.addScaledVector(v, 3) })
      taps = taps.filter((s) => t - s < 1.2)
      taps.push(t)
      if (taps.length >= 3) { taps = []; letters = 6; onLetters(true) }
    },
    dispose() {
      scene.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose?.() })
      rt.dispose()
      renderer.dispose()
    },
  }
}

function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let r = Math.imul(a ^ (a >>> 15), 1 | a)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
