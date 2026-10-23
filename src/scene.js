// Glacier: the whole three.js world, driven by one number, the stop index `s`.
// Each DOM element with data-stop="name" is a camera stop; App turns the scroll
// position into a float between stops and hands it to update().
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

const GROUND = 0x04070b
const FROST = 0xe6f0f5
const ARC = 0x6ff4ff

const V = (x, y, z) => new THREE.Vector3(x, y, z)
const APP_X = (j) => 12 + j * 5
const EXP_Y = (i) => -i * 3.2
const CONTACT = V(128, -12, 0)
const AI_AT = V(72, 0, 0)
const EXP_X = 86

// Camera stops: [position, look-at]
const KEYS = {
  hero: [V(0, 0.2, 7.6), V(0, 0, 0)],
  numbers: [V(3.6, 1.8, 4.6), V(0, 0.2, 0)],
  'apps-intro': [V(6, 1.6, 9), V(13, 0, 0)],
  side: [V(60, 1.2, 6.2), V(60, 0, 0)],
  'ai-0': [V(72, -0.8, 6.4), V(72, -0.8, 0)],
  'ai-1': [V(75, 1.8, 5.6), V(72, 0.5, 0)],
  awards: [V(96, -13, 11), V(104, -14, -6)],
  lead: [V(102, -17, 9), V(110, -15, -6)],
  field: [V(107, -20, 10), V(113, -18, -6)],
  skills: [V(113, -12, 12), V(119, -14, -4)],
  contact: [V(128, -11.6, 8.6), V(128, -12, 0)],
}
for (let j = 0; j < 9; j++) KEYS['app-' + j] = [V(APP_X(j) + (j % 2 ? 0.7 : -0.7), 0.35, 4.8), V(APP_X(j), 0.1, 0)]
for (let i = 0; i < 5; i++) KEYS['exp-' + i] = [V(EXP_X + 1.5, EXP_Y(i) + 0.9, 6), V(EXP_X, EXP_Y(i), 0)]

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Tileable value noise, used as a frost roughness map.
function frostTexture() {
  const s = 256
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')
  const img = g.createImageData(s, s)
  const r = rng(11)
  const octaves = [[4, 0.45], [16, 0.35], [64, 0.2]].map(([n, w]) => ({ n, w, a: Float32Array.from({ length: n * n }, r) }))
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      let v = 0
      for (const o of octaves) {
        const fx = (x / s) * o.n, fy = (y / s) * o.n
        const ix = Math.floor(fx), iy = Math.floor(fy)
        let tx = fx - ix, ty = fy - iy
        tx = tx * tx * (3 - 2 * tx)
        ty = ty * ty * (3 - 2 * ty)
        const at = (i, j) => o.a[((j % o.n) * o.n) + (i % o.n)]
        const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * tx
        const bot = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * tx
        v += (top + (bot - top) * ty) * o.w
      }
      const k = (y * s + x) * 4
      const b = Math.round(40 + v * 200)
      img.data[k] = img.data[k + 1] = img.data[k + 2] = b
      img.data[k + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

// Cleave a block with a few random planes and add a slight wobble, so every
// block of ice is unique. Displacement depends only on position, so shared
// edge vertices move together and the mesh does not crack.
function chip(geo, r, cuts = 3, wobble = 0.035) {
  const pos = geo.attributes.position
  const p = new THREE.Vector3()
  const planes = []
  for (let c = 0; c < cuts; c++) {
    const n = V(r() - 0.5, r() - 0.5, r() - 0.5).normalize()
    let m = 0
    for (let i = 0; i < pos.count; i++) m = Math.max(m, p.fromBufferAttribute(pos, i).dot(n))
    planes.push({ n, d: m * (0.7 + r() * 0.18) })
  }
  const s = r() * 10
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i)
    for (const pl of planes) {
      const k = p.dot(pl.n) - pl.d
      if (k > 0) p.addScaledVector(pl.n, -k)
    }
    p.x += Math.sin(p.y * 3.1 + s) * wobble
    p.z += Math.sin(p.x * 2.7 + s * 2) * wobble
    p.y += Math.sin(p.z * 3.3 + s * 3) * wobble
    pos.setXYZ(i, p.x, p.y, p.z)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

// Crystal growth inside a base shape: new prisms sprout from points on older
// ones and are kept only if both ends stay inside the shape.
function grow(r, inside, bottom, count) {
  const out = []
  let tries = 0
  while (out.length < count && tries < count * 40) {
    tries++
    let a
    if (out.length && r() < 0.82) {
      const c = out[Math.floor(r() * out.length)]
      a = c.a.clone().lerp(c.b, 0.35 + r() * 0.65)
    } else {
      a = V((r() - 0.5) * 0.6, bottom + r() * 0.2, (r() - 0.5) * 0.6)
    }
    const dir = V(r() - 0.5, r() * 0.9 - 0.15, r() - 0.5).normalize()
    const b = a.clone().addScaledVector(dir, 0.25 + r() * 0.75)
    if (!inside(a) || !inside(b)) continue
    out.push({ a, b, rad: (0.025 + r() * 0.05) * (1 - (out.length / count) * 0.5) })
  }
  return out
}

const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()
const _d = new THREE.Vector3()
const UP = V(0, 1, 0)
function setPrism(mesh, i, a, b, rad) {
  _d.subVectors(b, a)
  const len = _d.length()
  _q.setFromUnitVectors(UP, _d.normalize())
  _p.addVectors(a, b).multiplyScalar(0.5)
  _m.compose(_p, _q, _s.set(rad, len, rad))
  mesh.setMatrixAt(i, _m)
}

const SIM_FRAG = /* glsl */ `
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uA;
uniform vec2 uB;
uniform float uStrength;
uniform float uRadius;
uniform float uAspect;
varying vec2 vUv;
float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}
void main() {
  vec4 c = texture2D(uPrev, vUv);
  float sum = texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r
            + texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r
            + texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r
            + texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r;
  float h = (sum * 0.5 - c.g) * 0.982;
  vec2 asp = vec2(uAspect, 1.0);
  float d = seg(vUv * asp, uA * asp, uB * asp);
  h += uStrength * smoothstep(uRadius, 0.0, d);
  gl_FragColor = vec4(h, c.r, 0.0, 1.0);
}`

const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`

const PostShader = {
  uniforms: {
    tDiffuse: { value: null },
    tRipple: { value: null },
    uRTexel: { value: new THREE.Vector2(1 / 256, 1 / 256) },
    uTime: { value: 0 },
    uChroma: { value: 0 },
    uFrost: { value: 1 },
    uFade: { value: 0 },
    uArc: { value: new THREE.Color(ARC) },
  },
  vertexShader: /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
uniform sampler2D tRipple;
uniform vec2 uRTexel;
uniform float uTime;
uniform float uChroma;
uniform float uFrost;
uniform float uFade;
uniform vec3 uArc;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float hL = texture2D(tRipple, vUv - vec2(uRTexel.x, 0.0)).r;
  float hR = texture2D(tRipple, vUv + vec2(uRTexel.x, 0.0)).r;
  float hD = texture2D(tRipple, vUv - vec2(0.0, uRTexel.y)).r;
  float hU = texture2D(tRipple, vUv + vec2(0.0, uRTexel.y)).r;
  vec2 g = vec2(hR - hL, hU - hD);
  float gl = length(g);
  vec2 uv = vUv + g * 0.05;
  vec2 c = vUv - 0.5;
  float edge = dot(c, c);
  vec2 dir = c / max(length(c), 1e-4);
  float ca = uChroma * 0.01 * (0.2 + edge * 2.0) + gl * 0.015;
  vec3 col;
  col.r = texture2D(tDiffuse, uv + dir * ca).r;
  col.g = texture2D(tDiffuse, uv).g;
  col.b = texture2D(tDiffuse, uv - dir * ca).b;
  // caustic shimmer on the ripple crests
  vec3 n = normalize(vec3(-g * 7.0, 1.0));
  float spec = pow(max(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0), 36.0);
  float crest = smoothstep(0.0, 0.08, gl);
  col += uArc * spec * crest * 1.2 + vec3(0.75, 0.9, 1.0) * crest * 0.06;
  // frost creeping in from the edges (intro and fast scrolling)
  float fr = smoothstep(0.16, 0.42, edge + (hash(floor(vUv * vec2(240.0, 140.0))) - 0.5) * 0.09) * uFrost;
  col = mix(col, vec3(0.78, 0.88, 0.94), fr * 0.55);
  col *= 1.0 - edge * 0.6;
  col += (hash(vUv * 1000.0 + fract(uTime)) - 0.5) * 0.02;
  gl_FragColor = vec4(col * uFade, 1.0);
}`,
}

const SNOW_VERT = /* glsl */ `
attribute float aRand;
uniform float uTime;
uniform float uSize;
varying float vA;
void main() {
  vec3 p = position;
  p.y = mod(p.y - uTime * (0.12 + aRand * 0.25) + 30.0, 42.0) - 30.0;
  p.x += sin(uTime * 0.4 + aRand * 20.0) * 0.25;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.35 + aRand) / max(-mv.z, 0.1);
  vA = exp(-max(-mv.z, 0.0) * 0.07) * (0.25 + aRand * 0.5);
}`
const SNOW_FRAG = /* glsl */ `
uniform vec3 uColor;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(uColor, vA * smoothstep(0.5, 0.0, d));
}`

const CLOUD_VERT = /* glsl */ `
attribute vec3 s1;
attribute vec3 s2;
attribute vec3 s3;
attribute vec3 s4;
attribute float aRand;
uniform float uFrom;
uniform float uTo;
uniform float uMix;
uniform float uTime;
uniform float uSize;
varying float vHeat;
varying float vA;
vec3 pick(float i) {
  if (i < 0.5) return position;
  if (i < 1.5) return s1;
  if (i < 2.5) return s2;
  if (i < 3.5) return s3;
  return s4;
}
void main() {
  float m = smoothstep(0.0, 1.0, clamp(uMix * 1.5 - aRand * 0.5, 0.0, 1.0));
  vec3 p = mix(pick(uFrom), pick(uTo), m);
  float sw = sin(m * 3.14159);
  float ang = sw * (1.2 + aRand * 2.0) + uTime * 0.12;
  float cs = cos(ang), sn = sin(ang);
  p.xz = vec2(cs * p.x - sn * p.z, sn * p.x + cs * p.z);
  p += sw * 0.5 * vec3(sin(aRand * 40.0 + uTime), cos(aRand * 23.0 + uTime), sin(aRand * 11.0));
  p += 0.035 * vec3(sin(uTime * 1.3 + aRand * 30.0), cos(uTime * 1.1 + aRand * 20.0), 0.0);
  vHeat = sw;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.5 + aRand * 0.8) / max(-mv.z, 0.1);
  vA = 0.55 + aRand * 0.45;
}`
const CLOUD_FRAG = /* glsl */ `
uniform vec3 uFrost;
uniform vec3 uArc;
varying float vHeat;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  vec3 col = mix(uFrost * 0.8, uArc * 1.6, clamp(vHeat * 1.1 + 0.08, 0.0, 1.0));
  gl_FragColor = vec4(col, vA * smoothstep(0.5, 0.05, d));
}`

function cloudShapes(N) {
  const r = rng(29)
  const S = [0, 1, 2, 3, 4].map(() => new Float32Array(N * 3))
  const set = (arr, i, x, y, z) => { arr[i * 3] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z }
  const grid = () => (Math.round((r() * 2 - 1) * 6) / 6) * 1.5
  for (let i = 0; i < N; i++) {
    // 0: sphere at rest
    const k = i + 0.5
    const phi = Math.acos(1 - (2 * k) / N)
    const th = Math.PI * (1 + Math.sqrt(5)) * k
    set(S[0], i, 2.1 * Math.cos(th) * Math.sin(phi), 2.1 * Math.cos(phi), 2.1 * Math.sin(th) * Math.sin(phi))
    // 1: ring (email)
    const u = r() * Math.PI * 2, v = r() * Math.PI * 2
    const rr = 1.9 + 0.28 * Math.cos(v)
    set(S[1], i, rr * Math.cos(u), rr * Math.sin(u), 0.28 * Math.sin(v))
    // 2: lattice cube (LinkedIn)
    const axis = Math.floor(r() * 3), sgn = r() < 0.5 ? -1 : 1
    const c = [0, 0, 0]
    c[axis] = 1.5 * sgn
    c[(axis + 1) % 3] = grid()
    c[(axis + 2) % 3] = grid()
    set(S[2], i, c[0], c[1], c[2])
    // 3: double helix (GitHub)
    const t = r(), a1 = t * Math.PI * 6 + (i % 2) * Math.PI
    const rung = i % 6 === 0 ? 1 - 2 * r() : 1
    set(S[3], i, Math.cos(a1) * 0.95 * rung, (t - 0.5) * 4.4, Math.sin(a1) * 0.95 * rung)
    // 4: a page of text lines (resume)
    const row = Math.floor(r() * 14)
    set(S[4], i, (r() * 2 - 1) * 1.2 * (row % 4 === 3 ? 0.55 : 1), 1.45 - row * 0.22, (r() - 0.5) * 0.05)
  }
  return S
}

export function createScene(canvas, { reduced = false, onLost } = {}) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
  } catch {
    return null
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  renderer.setPixelRatio(dpr)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const lost = (e) => { e.preventDefault(); onLost?.() }
  canvas.addEventListener('webglcontextlost', lost)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(GROUND)
  scene.fog = new THREE.FogExp2(GROUND, 0.045)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const envRT = pmrem.fromScene(room, 0.04)
  scene.environment = envRT.texture
  room.dispose()
  pmrem.dispose()

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 160)
  const camPos = KEYS.hero[0].clone()
  const camLook = KEYS.hero[1].clone()

  const sun = new THREE.DirectionalLight(0xdff3ff, 1.6)
  sun.position.set(5, 9, 7)
  scene.add(sun)
  const glow = new THREE.PointLight(ARC, 5, 7, 1.6)
  scene.add(glow)

  const frost = frostTexture()
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4fbff, roughness: 0.2, roughnessMap: frost, metalness: 0,
    transmission: 1, thickness: 1.4, ior: 1.31, dispersion: 1.2,
    attenuationColor: new THREE.Color(0xa9dcf2), attenuationDistance: 2.2,
    clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 1.3,
  })
  const monoIce = iceMat.clone()
  monoIce.thickness = 2.4
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0xdfeef8, roughness: 0.35, metalness: 0.1, emissive: 0x0b1a22, envMapIntensity: 1.4 })
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x0a1216, roughness: 0.4, emissive: ARC, emissiveIntensity: 2.2 })
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1a2228, roughness: 0.38, metalness: 0.85 })
  const windMat = new THREE.MeshStandardMaterial({ color: 0xc9d6dd, roughness: 0.3, metalness: 0.65 })
  const shardMat = new THREE.MeshStandardMaterial({ color: 0xcfe2ec, roughness: 0.25, roughnessMap: frost, metalness: 0.1, flatShading: true, envMapIntensity: 1.2 })
  const prismGeo = new THREE.CylinderGeometry(0.6, 1, 1, 6, 1)

  const spinners = [] // { obj, speed, base }

  // ---- Monolith: transformer core frozen in a block --------------------------------
  const mono = new THREE.Group()
  mono.rotation.y = -0.45
  scene.add(mono)
  mono.add(new THREE.Mesh(chip(new THREE.BoxGeometry(2.9, 3.9, 2.9, 8, 10, 8), rng(3), 4, 0.05), monoIce))
  const coreParts = [
    [-0.75, 0, 0.32, 2.2], [0, 0, 0.32, 2.2], [0.75, 0, 0.32, 2.2],
    [0, 1.26, 1.82, 0.32], [0, -1.26, 1.82, 0.32],
  ]
  const core = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), steelMat, coreParts.length)
  coreParts.forEach(([x, y, w, h], i) => core.setMatrixAt(i, _m.compose(_p.set(x, y, 0), _q.identity(), _s.set(w, h, 0.32))))
  mono.add(core)
  const turns = 12
  const wind = new THREE.InstancedMesh(new THREE.TorusGeometry(0.3, 0.035, 8, 32), windMat, turns * 3)
  const flat = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI / 2)
  for (let l = 0; l < 3; l++) {
    for (let t = 0; t < turns; t++) {
      wind.setMatrixAt(l * turns + t, _m.compose(_p.set((l - 1) * 0.75, -0.9 + t * (1.8 / (turns - 1)), 0), flat, _s.set(1, 1, 1)))
    }
  }
  mono.add(wind)
  const arcMat = new THREE.LineBasicMaterial({ color: ARC, transparent: true, toneMapped: false })
  const ARC_N = 22
  const arcs = [[-0.75, 0], [0, 0.75]].map(([x0, x1]) => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARC_N * 3), 3))
    const line = new THREE.Line(geo, arcMat)
    line.userData = { x0, x1 }
    mono.add(line)
    return line
  })
  const zap = () => {
    for (const line of arcs) {
      const pos = line.geometry.attributes.position
      const { x0, x1 } = line.userData
      for (let i = 0; i < ARC_N; i++) {
        const t = i / (ARC_N - 1)
        const env = Math.sin(t * Math.PI)
        pos.setXYZ(i, x0 + (x1 - x0) * t, 1.45 + env * 0.32 + (Math.random() - 0.5) * 0.14 * env, (Math.random() - 0.5) * 0.14 * env)
      }
      pos.needsUpdate = true
    }
    arcMat.opacity = 0.35 + Math.random() * 0.65
  }
  zap()

  // ---- Nine app blocks -----------------------------------------------------------
  const coreGeos = [
    new THREE.TorusGeometry(0.32, 0.07, 12, 48),
    new THREE.OctahedronGeometry(0.34),
    new THREE.TorusKnotGeometry(0.22, 0.06, 96, 10),
    new THREE.IcosahedronGeometry(0.32, 0),
    new THREE.BoxGeometry(0.42, 0.42, 0.42),
    new THREE.ConeGeometry(0.28, 0.6, 6),
    new THREE.TorusGeometry(0.28, 0.06, 8, 6),
    new THREE.DodecahedronGeometry(0.3),
    new THREE.CylinderGeometry(0.2, 0.2, 0.55, 12),
  ]
  const blocks = []
  for (let j = 0; j < 9; j++) {
    const r = rng(100 + j * 17)
    const kind = j % 3
    let geo, inside, bottom
    if (kind === 0) {
      geo = new THREE.BoxGeometry(1.9, 2.5, 1.9, 6, 8, 6)
      inside = (p) => Math.abs(p.x) < 0.72 && Math.abs(p.y) < 1.0 && Math.abs(p.z) < 0.72
      bottom = -0.8
    } else if (kind === 1) {
      geo = new THREE.CylinderGeometry(1.1, 1.2, 2.6, 6, 8)
      inside = (p) => Math.hypot(p.x, p.z) < 0.8 && Math.abs(p.y) < 1.05
      bottom = -0.85
    } else {
      geo = new THREE.BoxGeometry(2.4, 1.8, 1.7, 8, 6, 6)
      inside = (p) => Math.abs(p.x) < 0.95 && Math.abs(p.y) < 0.68 && Math.abs(p.z) < 0.6
      bottom = -0.55
    }
    const g = new THREE.Group()
    g.position.set(APP_X(j), 0, 0)
    g.rotation.y = (r() - 0.5) * 0.7
    g.scale.set(0.92 + r() * 0.16, 0.92 + r() * 0.16, 0.92 + r() * 0.16)
    g.add(new THREE.Mesh(chip(geo, r, 2 + Math.floor(r() * 3)), iceMat))
    const list = grow(r, inside, bottom, 34 + Math.floor(r() * 16))
    const cr = new THREE.InstancedMesh(prismGeo, crystalMat, Math.max(list.length, 1))
    list.forEach((c, i) => setPrism(cr, i, c.a, c.b, c.rad))
    cr.count = list.length
    g.add(cr)
    const obj = new THREE.Mesh(coreGeos[j], coreMat)
    g.add(obj)
    spinners.push({ obj, speed: 0.25 + r() * 0.3 })
    scene.add(g)
    blocks.push({ g, base: g.rotation.y, phase: r() * 6 })
  }

  // ---- Side projects: three thin shards ------------------------------------------
  const shardGeo = new THREE.OctahedronGeometry(1, 0)
  ;[57.6, 60, 62.4].forEach((x, i) => {
    const m = new THREE.Mesh(shardGeo, iceMat)
    m.position.set(x, i === 1 ? 0.2 : -0.2, -0.4)
    m.scale.set(0.38, 1.5 - i * 0.15, 0.38)
    m.rotation.z = (i - 1) * 0.18
    scene.add(m)
    spinners.push({ obj: m, speed: 0.15 + i * 0.05 })
  })

  // ---- AI: a lattice that grows one node per agent version ------------------------
  const ai = new THREE.Group()
  ai.position.copy(AI_AT)
  scene.add(ai)
  const nodePos = Array.from({ length: 12 }, (_, i) => {
    const a = i * 2.1
    const rad = 0.35 + i * 0.1
    return V(Math.cos(a) * rad, -1.7 + i * 0.3, Math.sin(a) * rad)
  })
  const nodes = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.17, 0), shardMat, 12)
  nodes.frustumCulled = false
  ai.add(nodes)
  const ar = rng(57)
  const edges = []
  for (let i = 1; i < 12; i++) {
    edges.push([i, i - 1])
    if (i >= 3) edges.push([i, Math.floor(ar() * (i - 1))])
  }
  const ePos = new Float32Array(edges.length * 6)
  edges.forEach(([a, b], k) => {
    ePos.set([nodePos[a].x, nodePos[a].y, nodePos[a].z, nodePos[b].x, nodePos[b].y, nodePos[b].z], k * 6)
  })
  const eGeo = new THREE.BufferGeometry()
  eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3))
  const edgeLines = new THREE.LineSegments(eGeo, new THREE.LineBasicMaterial({ color: FROST, transparent: true, opacity: 0.55 }))
  ai.add(edgeLines)
  const shell = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.5, 1)),
    new THREE.LineBasicMaterial({ color: FROST, transparent: true, opacity: 0.1 }),
  )
  ai.add(shell)
  const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), coreMat)
  ai.add(tip)

  // ---- Experience: five frozen windings in a column --------------------------------
  const expRings = []
  const discGeo = chip(new THREE.CylinderGeometry(1.75, 1.75, 0.55, 6, 2), rng(77), 2, 0.02)
  const ringGeo = new THREE.TorusGeometry(1.15, 0.09, 10, 64)
  for (let i = 0; i < 5; i++) {
    const disc = new THREE.Mesh(discGeo, iceMat)
    disc.position.set(EXP_X, EXP_Y(i), 0)
    disc.rotation.y = i * 0.4
    scene.add(disc)
    const mat = new THREE.MeshStandardMaterial({ color: 0xcfd9df, metalness: 0.6, roughness: 0.3, emissive: ARC, emissiveIntensity: 0.1 })
    const ring = new THREE.Mesh(ringGeo, mat)
    ring.position.copy(disc.position)
    ring.rotation.x = Math.PI / 2
    scene.add(ring)
    expRings.push(ring)
  }
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 16, 6), steelMat)
  spine.position.set(EXP_X, EXP_Y(2), 0)
  scene.add(spine)

  // ---- Shard field (recognition and skills) ---------------------------------------
  const sr = rng(91)
  const FIELD = 130
  const field = new THREE.InstancedMesh(shardGeo, shardMat, FIELD)
  for (let i = 0; i < FIELD; i++) {
    _p.set(90 + sr() * 36, -26 + sr() * 22, -22 + sr() * 16)
    _q.setFromEuler(new THREE.Euler(sr() * 0.6, sr() * 6.28, sr() * 0.6))
    const w = 0.15 + sr() * 0.35
    field.setMatrixAt(i, _m.compose(_p, _q, _s.set(w, 0.6 + sr() * 1.8, w)))
  }
  scene.add(field)

  // ---- Snow -----------------------------------------------------------------------
  const SNOW = 1600
  const snr = rng(5)
  const sPos = new Float32Array(SNOW * 3)
  const sRand = new Float32Array(SNOW)
  for (let i = 0; i < SNOW; i++) {
    sPos[i * 3] = -10 + snr() * 150
    sPos[i * 3 + 1] = -30 + snr() * 42
    sPos[i * 3 + 2] = -18 + snr() * 30
    sRand[i] = snr()
  }
  const snowGeo = new THREE.BufferGeometry()
  snowGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
  snowGeo.setAttribute('aRand', new THREE.BufferAttribute(sRand, 1))
  const snowMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: 34 * dpr }, uColor: { value: new THREE.Color(FROST) } },
    vertexShader: SNOW_VERT, fragmentShader: SNOW_FRAG, transparent: true, depthWrite: false,
  })
  const snow = new THREE.Points(snowGeo, snowMat)
  snow.frustumCulled = false
  scene.add(snow)

  // ---- Contact: particles that take the shape of the hovered link -----------------
  const CN = 2400
  const shapes = cloudShapes(CN)
  const cGeo = new THREE.BufferGeometry()
  cGeo.setAttribute('position', new THREE.BufferAttribute(shapes[0], 3))
  for (let k = 1; k < 5; k++) cGeo.setAttribute('s' + k, new THREE.BufferAttribute(shapes[k], 3))
  const cr2 = rng(41)
  cGeo.setAttribute('aRand', new THREE.BufferAttribute(Float32Array.from({ length: CN }, cr2), 1))
  const cloudMat = new THREE.ShaderMaterial({
    uniforms: {
      uFrom: { value: 0 }, uTo: { value: 0 }, uMix: { value: 1 }, uTime: { value: 0 }, uSize: { value: 26 * dpr },
      uFrost: { value: new THREE.Color(FROST) }, uArc: { value: new THREE.Color(ARC) },
    },
    vertexShader: CLOUD_VERT, fragmentShader: CLOUD_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const cloud = new THREE.Points(cGeo, cloudMat)
  cloud.position.copy(CONTACT)
  cloud.frustumCulled = false
  scene.add(cloud)

  // ---- Ripple simulation (pointer water) + post pass ------------------------------
  const simScene = new THREE.Scene()
  const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const simMat = new THREE.ShaderMaterial({
    uniforms: {
      uPrev: { value: null }, uTexel: { value: new THREE.Vector2() },
      uA: { value: new THREE.Vector2(-1, -1) }, uB: { value: new THREE.Vector2(-1, -1) },
      uStrength: { value: 0 }, uRadius: { value: 0.022 }, uAspect: { value: 1 },
    },
    vertexShader: QUAD_VERT, fragmentShader: SIM_FRAG, depthTest: false, depthWrite: false,
  })
  const simQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMat)
  simScene.add(simQuad)
  const rtOpts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false }
  let simA = new THREE.WebGLRenderTarget(4, 4, rtOpts)
  let simB = new THREE.WebGLRenderTarget(4, 4, rtOpts)

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 }))
  composer.addPass(new RenderPass(scene, camera))
  const post = new ShaderPass(PostShader)
  composer.addPass(post)
  composer.addPass(new OutputPass())

  // ---- State ------------------------------------------------------------------------
  const state = { intro: reduced ? 1 : 0 }
  let keys = [KEYS.hero]
  let idx = {}
  let W = 1, H = 1, aspect = 1
  const ptr = { x: -1, y: -1, px: -1, py: -1, nx: 0, ny: 0, moved: false }
  let time = 0, arcClock = 0, heat = 0, lastS = -1, dirty = true, disposed = false

  function resize() {
    W = window.innerWidth
    H = window.innerHeight
    aspect = W / H
    renderer.setSize(W, H, false)
    composer.setPixelRatio(dpr)
    composer.setSize(W, H)
    camera.aspect = aspect
    camera.fov = aspect < 1 ? 46 : 38
    if (W >= 900) camera.setViewOffset(W, H, -W * 0.14, 0, W, H)
    else camera.setViewOffset(W, H, 0, H * 0.13, W, H)
    camera.updateProjectionMatrix()
    const sw = Math.max(64, Math.round(W / 4)), sh = Math.max(64, Math.round(H / 4))
    simA.setSize(sw, sh)
    simB.setSize(sw, sh)
    simMat.uniforms.uTexel.value.set(1 / sw, 1 / sh)
    simMat.uniforms.uAspect.value = aspect
    post.uniforms.uRTexel.value.set(1 / sw, 1 / sh)
    dirty = true
  }
  resize()
  window.addEventListener('resize', resize)

  function setStops(names) {
    let last = KEYS.hero
    keys = names.map((n) => (last = KEYS[n] || last))
    idx = {}
    names.forEach((n, i) => { if (!(n in idx)) idx[n] = i })
    dirty = true
  }

  const tPos = new THREE.Vector3(), tLook = new THREE.Vector3(), off = new THREE.Vector3()
  function sample(s) {
    const n = keys.length
    if (n < 2) { tPos.copy(keys[0][0]); tLook.copy(keys[0][1]); return }
    const c = Math.min(Math.max(s, 0), n - 1)
    const k = Math.min(Math.floor(c), n - 2)
    const f = c - k
    const e = f * f * (3 - 2 * f)
    tPos.lerpVectors(keys[k][0], keys[k + 1][0], e)
    tLook.lerpVectors(keys[k][1], keys[k + 1][1], e)
  }

  function pointer(x, y) {
    if (ptr.x < 0) { ptr.px = x / W; ptr.py = 1 - y / H }
    ptr.x = x / W
    ptr.y = 1 - y / H
    ptr.nx = ptr.x * 2 - 1
    ptr.ny = ptr.y * 2 - 1
    ptr.moved = true
  }

  function setShape(i) {
    const u = cloudMat.uniforms
    if (u.uTo.value === i) return
    u.uFrom.value = u.uMix.value > 0.5 ? u.uTo.value : u.uFrom.value
    u.uTo.value = i
    u.uMix.value = reduced ? 1 : 0
    dirty = true
  }

  const range = (a, b, s) => (a == null || b == null || b <= a ? 1 : Math.min(Math.max((s - a) / (b - a), 0), 1))

  function update(dt, sRaw, scrollVel = 0) {
    if (disposed || document.hidden) return
    const s = reduced ? Math.round(sRaw) : sRaw
    if (reduced && !dirty && Math.abs(s - lastS) < 1e-4) return
    lastS = s
    dirty = false
    const live = reduced ? 0 : dt
    time += live

    // camera
    sample(s)
    if (aspect < 1) {
      off.subVectors(tPos, tLook).multiplyScalar(1 + (1 - aspect) * 1.1)
      tPos.copy(tLook).add(off)
    }
    const intro = state.intro
    const ie = 1 - intro
    tPos.x += ie * -2
    tPos.y += ie * 3.5
    tPos.z += ie * 10
    if (!reduced) {
      tPos.x += ptr.nx * 0.3
      tPos.y += ptr.ny * 0.18
      const k = 1 - Math.exp(-dt * 3.2)
      camPos.lerp(tPos, intro < 1 ? Math.max(k, 0.5) : k)
      camLook.lerp(tLook, k)
    } else {
      camPos.copy(tPos)
      camLook.copy(tLook)
    }
    camera.position.copy(camPos)
    camera.lookAt(camLook)
    glow.position.set(camLook.x, camLook.y + 1.2, camLook.z + 1.6)

    // idle life
    mono.rotation.y = -0.45 + Math.sin(time * 0.15) * 0.12
    for (const b of blocks) b.g.rotation.y = b.base + Math.sin(time * 0.2 + b.phase) * 0.15
    for (const sp of spinners) { sp.obj.rotation.y += live * sp.speed; sp.obj.rotation.x += live * sp.speed * 0.4 }
    arcClock += live
    if (arcClock > 0.07) { arcClock = 0; zap() }

    // AI growth: one node per version
    const g = range(idx['ai-0'], idx['ai-1'], s)
    const shown = g * 12
    for (let i = 0; i < 12; i++) {
      const t = Math.min(Math.max(shown - i + 0.15, 0), 1)
      const e = t * t * (3 - 2 * t)
      _q.setFromAxisAngle(UP, time * 0.3 + i)
      nodes.setMatrixAt(i, _m.compose(nodePos[i], _q, _s.setScalar(Math.max(e, 0.0001))))
    }
    nodes.instanceMatrix.needsUpdate = true
    let vis = 0
    for (const [a] of edges) if (a < shown - 0.3) vis++
    eGeo.setDrawRange(0, vis * 2)
    const ti = Math.min(11, Math.max(0, Math.ceil(shown) - 1))
    tip.position.copy(nodePos[ti])
    tip.scale.setScalar(g > 0 ? 1.4 + Math.sin(time * 6) * 0.2 : 0.0001)
    tip.rotation.y = time
    ai.rotation.y = time * 0.08
    shell.rotation.y = -time * 0.05

    // Experience: the winding nearest the camera's focus energises
    for (const ring of expRings) {
      const d = ring.position.distanceTo(camLook)
      ring.material.emissiveIntensity = 0.08 + Math.max(0, 1 - d / 2.6) * 2.4
    }

    // Contact particles
    const cu = cloudMat.uniforms
    cu.uMix.value = Math.min(1, cu.uMix.value + live * 0.85)
    cu.uTime.value = time
    snowMat.uniforms.uTime.value = time

    // Post: velocity-driven chroma and frost
    heat += (Math.min(Math.abs(scrollVel) / 40, 1) - heat) * Math.min(1, dt * 4)
    post.uniforms.uChroma.value = heat
    post.uniforms.uFrost.value = Math.min(1, heat * 0.7 + ie * 0.9)
    post.uniforms.uFade.value = 0.12 + 0.88 * Math.min(1, intro * 1.4)
    post.uniforms.uTime.value = time

    // Ripple sim: two steps per frame, pointer injected along its path
    if (!reduced) {
      const speed = ptr.moved ? Math.hypot((ptr.x - ptr.px) * W, (ptr.y - ptr.py) * H) : 0
      for (let step = 0; step < 2; step++) {
        const u = simMat.uniforms
        u.uPrev.value = simA.texture
        u.uA.value.set(ptr.px, ptr.py)
        u.uB.value.set(ptr.x, ptr.y)
        u.uStrength.value = step === 0 ? Math.min(speed * 0.012, 0.9) : 0
        renderer.setRenderTarget(simB)
        renderer.render(simScene, simCam)
        const tmp = simA; simA = simB; simB = tmp
      }
      renderer.setRenderTarget(null)
      ptr.px = ptr.x
      ptr.py = ptr.y
      ptr.moved = false
    }
    post.uniforms.tRipple.value = simA.texture

    composer.render(dt)
  }

  function compile() {
    const done = () => { if (!disposed) update(0.016, 0, 0) }
    if (renderer.compileAsync) return renderer.compileAsync(scene, camera).then(done, done)
    done()
    return Promise.resolve()
  }

  function dispose() {
    disposed = true
    window.removeEventListener('resize', resize)
    canvas.removeEventListener('webglcontextlost', lost)
    const seen = new Set()
    scene.traverse((o) => {
      if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose() }
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
      for (const m of mats) if (!seen.has(m)) { seen.add(m); m.dispose() }
      if (o.isInstancedMesh) o.dispose()
    })
    simQuad.geometry.dispose()
    simMat.dispose()
    simA.dispose()
    simB.dispose()
    frost.dispose()
    envRT.dispose()
    post.dispose()
    composer.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }

  return { state, setStops, update, pointer, setShape, compile, dispose }
}
