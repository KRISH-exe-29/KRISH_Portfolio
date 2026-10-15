// Inside a transformer winding, in three.js. App owns the scroll; this file draws where the camera is
// and how much load the coil is carrying.
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

const R = 7 // winding radius
const PITCH = 1.7 // axial distance per turn
export const LENGTH = 420 // the bore, front to core

const rand = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647 })()

class Helix extends THREE.Curve {
  constructor(radius) { super(); this.radius = radius }
  getPoint(t, out = new THREE.Vector3()) {
    const a = ((t * LENGTH) / PITCH) * Math.PI * 2
    return out.set(Math.cos(a) * this.radius, Math.sin(a) * this.radius, -t * LENGTH)
  }
}

const cold = new THREE.Color('#2a0c02')
const hot = new THREE.Color('#ff5a12')
const white = new THREE.Color('#ffd9a0')

export function createScene(canvas, { calm }) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  } catch {
    return null
  }
  const small = window.innerWidth < 700
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.95

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#050302')
  scene.fog = new THREE.Fog('#050302', 18, 90)
  const camera = new THREE.PerspectiveCamera(small ? 78 : 64, 1, 0.1, 200)

  scene.add(new THREE.HemisphereLight('#6a3a20', '#000000', 0.15))
  const lamp = new THREE.PointLight('#ffb070', 22, 50, 1.6) // rides ahead of the camera
  scene.add(lamp)

  // Two layers of copper, wound the same way: the inner one hot, the outer one a shade behind.
  const copper = new THREE.MeshStandardMaterial({ color: '#c46a32', metalness: 1, roughness: 0.42, emissive: cold.clone(), emissiveIntensity: 1 })
  const turns = LENGTH / PITCH
  for (const [radius, tube] of [[R, 0.62], [R + 1.45, 0.62]]) {
    const geo = new THREE.TubeGeometry(new Helix(radius), Math.round(turns * (small ? 16 : 24)), tube, small ? 6 : 8, false)
    scene.add(new THREE.Mesh(geo, copper))
  }

  // Pressboard spacers: radial sticks between the turns, every few metres.
  {
    const per = 12
    const rows = Math.floor(LENGTH / 9)
    const sticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 2.9, 0.5), new THREE.MeshStandardMaterial({ color: '#c8ad7c', roughness: 0.9 }), rows * per)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const z = new THREE.Vector3(0, 0, 1)
    let k = 0
    for (let r = 0; r < rows; r++) {
      for (let i = 0; i < per; i++) {
        const a = (i / per) * Math.PI * 2 + r * 0.13
        q.setFromAxisAngle(z, a - Math.PI / 2)
        m.compose(new THREE.Vector3(Math.cos(a) * (R + 0.72), Math.sin(a) * (R + 0.72), -6 - r * 9), q, new THREE.Vector3(1, 1, 1))
        sticks.setMatrixAt(k++, m)
      }
    }
    scene.add(sticks)
    // Thin glowing rings mark each spacer row, so speed reads even in the dark.
    const ringMat = new THREE.MeshBasicMaterial({ color: '#3a7bff', transparent: true, opacity: 0.35 })
    const ringGeo = new THREE.TorusGeometry(R - 0.75, 0.025, 6, 96)
    for (let r = 0; r < rows; r += 2) {
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.z = -6 - r * 9
      scene.add(ring)
    }
  }

  // Current: electrons running along the winding, faster as the load climbs.
  const N = small ? 900 : 1800
  const phase = new Float32Array(N)
  const lane = new Float32Array(N)
  const epos = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) { phase[i] = rand(); lane[i] = R - 0.55 + rand() * 0.3 }
  const egeo = new THREE.BufferGeometry()
  egeo.setAttribute('position', new THREE.BufferAttribute(epos, 3))
  const emat = new THREE.PointsMaterial({ color: '#ffe2b0', size: small ? 0.14 : 0.11, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })
  scene.add(new THREE.Points(egeo, emat))

  // The core at the far end: a stack of steel laminations around a glowing limb.
  const coreGlow = new THREE.MeshBasicMaterial({ color: '#ff8a3a' })
  {
    const n = 70
    const lam = new THREE.InstancedMesh(new THREE.CylinderGeometry(4.6, 4.6, 0.12, 48), new THREE.MeshStandardMaterial({ color: '#5d6672', metalness: 0.9, roughness: 0.35 }), n)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)
    for (let i = 0; i < n; i++) lam.setMatrixAt(i, m.compose(new THREE.Vector3(0, 0, -LENGTH - 2 - i * 0.18), q, new THREE.Vector3(1, 1, 1)))
    scene.add(lam)
    const limb = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), coreGlow)
    limb.position.z = -LENGTH - 1.9
    scene.add(limb)
  }

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.5, 0.78)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  const resize = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setSize(w, h, false)
    composer.setSize(w, h)
    bloom.resolution.set(w / 2, h / 2)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  const state = { z: -4, target: -4, load: 0, loadTarget: 0, roll: 0, t: 0 }
  const tmp = new THREE.Color()
  let last = performance.now()
  let frame = 0
  let lost = false
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; document.documentElement.classList.add('flat') })

  const tick = () => {
    frame = requestAnimationFrame(tick)
    if (lost) return
    const now = performance.now()
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    state.t += dt
    const ease = 1 - Math.exp(-dt * 3.5)
    const before = state.z
    state.z += (state.target - state.z) * ease
    state.load += (state.loadTarget - state.load) * ease
    const speed = Math.abs(state.z - before) / Math.max(dt, 1e-3)

    // Heat: dark copper, then orange, then white-hot at the core.
    const L = state.load
    tmp.copy(cold).lerp(hot, Math.min(L * 1.4, 1))
    if (L > 0.75) tmp.lerp(white, (L - 0.75) * 0.9)
    copper.emissive.copy(tmp)
    copper.emissiveIntensity = 0.12 + L * 0.26
    lamp.color.copy(tmp).lerp(white, 0.5)
    emat.opacity = 0.3 + L * 0.5
    coreGlow.color.setRGB(1, 0.45 + L * 0.45, 0.2 + L * 0.5)

    // Each electron walks its own lane; only those near the camera matter, so they live in a window around it.
    const run = state.t * (0.004 + L * 0.02)
    const win = 120 / LENGTH
    const start = Math.max(0, -state.z / LENGTH - 0.05)
    for (let i = 0; i < N; i++) {
      const t = start + (((phase[i] + run) % 1) * win)
      const a = ((t * LENGTH) / PITCH) * Math.PI * 2
      epos[i * 3] = Math.cos(a) * lane[i]
      epos[i * 3 + 1] = Math.sin(a) * lane[i]
      epos[i * 3 + 2] = -t * LENGTH
    }
    egeo.attributes.position.needsUpdate = true

    // Fly down the bore. The view turns with the winding, and leans in harder at speed.
    state.roll = calm ? 0 : (-state.z / PITCH) * 0.06
    camera.position.set(Math.sin(state.t * 0.5) * (calm ? 0 : 0.5), Math.cos(state.t * 0.4) * (calm ? 0 : 0.35), state.z)
    camera.rotation.set(0, 0, state.roll)
    camera.fov = (small ? 78 : 64) + Math.min(speed, 120) * 0.08
    camera.updateProjectionMatrix()
    lamp.position.set(0, 0, state.z - 10)

    composer.render()
  }
  tick()

  return {
    // z along the bore (0 at the mouth, -LENGTH at the core) and load from 0 to 1. Both ease there.
    go(z, load) { state.target = z; state.loadTarget = load },
    dispose() {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      renderer.dispose()
    },
  }
}
