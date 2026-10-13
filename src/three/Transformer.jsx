import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { calm } from '../motion.js'
import './Transformer.css'

// at: scroll position in viewport heights. pos/rot in world units/radians. The lead tunes these.
// pos x is multiplied by min(1, aspect) on portrait screens so the unit stays in frame.
const POSES = [
  { at: 0,   pos: [1.4, -0.3, 0],  rot: [0.35, -0.9, 0.5],  scale: 1.9,  opacity: 1 },    // hero: close, diagonal across the frame
  { at: 1.1, pos: [0, 0.05, 0],    rot: [0.2, -0.6, 0],     scale: 1.05, opacity: 1 },    // mantras begin: whole unit, three-quarter view (also the reduced-motion pose)
  { at: 4.6, pos: [0, 0.05, 0],    rot: [0.24, 0.65, 0],    scale: 1.12, opacity: 1 },    // turns slowly through the pinned sequence
  { at: 5.5, pos: [0.5, 0, 0],     rot: [0.3, 1.15, 0],     scale: 0.95, opacity: 0.14 }, // fades back behind the content
  { at: 999, pos: [0.5, 0, 0],     rot: [0.3, 1.15, 0],     scale: 0.95, opacity: 0.14 },
]
const SPIN = 0         // extra Y rotation (rad) per viewport height scrolled
const EASE = 0.12         // per-frame lerp toward the target pose
const PARALLAX = 0.06     // max pointer rotation offset (rad)
const CAM_Z = 6           // model at scale 1 fills about 60% of a 16:9 viewport's width
const CAM_FIT = 7.6       // camera distance = max(CAM_Z, CAM_FIT / aspect): pulls back on narrow screens
const CALM_OPACITY = 0.5

const LID_TOP = 0.71      // tank body is 3.0 x 1.3 x 1.0 centred on the origin; the lid sits on top of it

// Returns [px, py, pz, rx, ry, rz, scale, opacity] at scroll position s (viewport heights).
function sample(s) {
  let i = 0
  while (i < POSES.length - 2 && s >= POSES[i + 1].at) i++
  const a = POSES[i], b = POSES[i + 1]
  const t = THREE.MathUtils.smoothstep(s, a.at, b.at)
  const mix = (x, y) => x + (y - x) * t
  return [...a.pos.map((v, k) => mix(v, b.pos[k])), ...a.rot.map((v, k) => mix(v, b.rot[k])), mix(a.scale, b.scale), mix(a.opacity, b.opacity)]
}

function buildModel() {
  const std = (color, metalness, roughness, extra) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra })
  const steel = std('#3a3d44', 0.35, 0.55)
  const lidSteel = std('#474a52', 0.35, 0.5)
  const finSteel = std('#2f3238', 0.35, 0.6)
  const bone = std('#d9d3d8', 0, 0.35)
  const copper = std('#e58e2f', 1, 0.3)
  const red = std('#ff3a2d', 0, 0.5, { emissive: '#ff3a2d', emissiveIntensity: 0.45 })

  const model = new THREE.Group()
  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    model.add(m)
    return m
  }
  const box = (w, h, d, x, y, z, mat = steel) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z)
  const cyl = (r, h, x, y, z, mat = steel) => add(new THREE.CylinderGeometry(r, r, h, 20), mat, x, y, z)

  // Tank, lid (wider than the body), two skid rails, tap-changer box on the -X end.
  box(3.0, 1.3, 1.0, 0, 0, 0)
  box(3.16, 0.06, 1.14, 0, 0.68, 0, lidSteel)
  for (const z of [-0.32, 0.32]) box(3.3, 0.1, 0.14, 0, -0.7, z, lidSteel)
  box(0.3, 0.8, 0.5, -1.65, -0.05, 0, lidSteel)
  box(0.02, 0.3, 0.3, -1.81, 0.05, 0, finSteel) // tap-changer door panel

  // Stiffener ribs on both long faces: they show in the gaps between radiator banks.
  for (const z of [-0.515, 0.515]) for (const x of [-1.3, -0.65, 0, 0.65, 1.3]) box(0.05, 1.3, 0.03, x, 0, z, lidSteel)

  // Radiators: 4 banks of 10 fins on the back (-Z), 3 on the front (+Z). The free front slot holds the nameplate.
  const BANKS = [-0.975, -0.325, 0.325, 0.975]
  const slots = [...BANKS.map((x) => [x, -1]), ...BANKS.slice(1).map((x) => [x, 1])]
  const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 1.05, 0.28), finSteel, slots.length * 10)
  const m4 = new THREE.Matrix4()
  slots.forEach(([bx, side], b) => {
    for (let i = 0; i < 10; i++) fins.setMatrixAt(b * 10 + i, m4.makeTranslation(bx + (i - 4.5) * 0.055, -0.02, side * 0.68))
  })
  model.add(fins)
  // Header pipes bridge tank face (z 0.5) and fins (z 0.54 to 0.82), top and bottom.
  for (const y of [0.43, -0.47]) {
    box(2.6, 0.07, 0.12, 0, y, -0.56, finSteel)
    box(1.95, 0.07, 0.12, 0.325, y, 0.56, finSteel)
  }
  // Two cooling-fan rings under the front banks.
  for (const x of [0.325, 0.975]) add(new THREE.TorusGeometry(0.11, 0.02, 8, 28), lidSteel, x, -0.565, 0.68).rotation.x = Math.PI / 2

  // Nameplate on the free front slot, and one thin red stripe along the lid's front edge.
  box(0.34, 0.22, 0.012, -0.975, 0.12, 0.506, red)
  box(3.16, 0.014, 0.01, 0, 0.68, 0.575, red)

  // Bushings: HV (12 sheds) along the front of the lid, LV (5 sheds, 0.7 size) along the back.
  const XS = [-1.05, -0.35, 0.35]
  const sheds = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.13, 0.045, 24), bone, XS.length * (12 + 5))
  const v = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3()
  let n = 0
  const bushing = (x, z, count, k) => {
    const pitch = 0.065 * k
    const coreH = 0.12 * k + count * pitch + 0.06 * k
    cyl(0.1 * k, 0.12 * k, x, LID_TOP + 0.06 * k, z, lidSteel)             // turret flange on the lid
    cyl(0.035 * k, coreH, x, LID_TOP + coreH / 2, z, bone)                 // slim core
    cyl(0.04 * k, 0.1 * k, x, LID_TOP + coreH + 0.05 * k, z, copper)       // terminal
    for (let i = 0; i < count; i++) {
      const r = k * (1 - 0.28 * (i / (count - 1)))                         // sheds taper toward the top
      sheds.setMatrixAt(n++, m4.compose(v.set(x, LID_TOP + 0.12 * k + (i + 0.5) * pitch, z), q, sc.set(r, k, r)))
    }
  }
  for (const x of XS) {
    bushing(x, 0.3, 12, 1)
    bushing(x, -0.3, 5, 0.7)
  }
  model.add(sheds)

  // Conservator: horizontal cylinder over the +X end on two posts, thin pipe down to the lid.
  add(new THREE.CylinderGeometry(0.22, 0.22, 1.3, 28), steel, 1.25, 1.4, 0).rotation.z = Math.PI / 2
  for (const x of [0.95, 1.45]) box(0.06, 0.54, 0.3, x, LID_TOP + 0.27, 0, lidSteel)
  cyl(0.02, 0.52, 0.72, LID_TOP + 0.26, 0.1, lidSteel)

  model.position.set(-0.05, -0.5, 0) // model spans x -1.82..1.9, y -0.75..1.77: centre it on the rig's origin
  return model
}

export default function Transformer() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    } catch {
      canvas.style.display = 'none' // no WebGL: the page works without the model
      return
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    const rig = new THREE.Group()
    const model = buildModel()
    rig.add(model)
    const key = new THREE.DirectionalLight('#ffffff', 3.4)
    key.position.set(-4, 5, 6)   // upper left front
    const rim = new THREE.DirectionalLight('#ff3a2d', 4)
    rim.position.set(5, 2, -5)   // behind right: edges catch red
    scene.add(rig, key, rim, new THREE.HemisphereLight('#e7e2e6', '#2a2c31', 1.3))

    const pointer = [0, 0]
    let narrow = 1
    let raf = 0

    const goal = () => {
      if (calm) return [...sample(1).slice(0, 7), CALM_OPACITY]
      const s = window.scrollY / window.innerHeight
      const g = sample(s)
      g[3] += pointer[1] * PARALLAX
      g[4] += pointer[0] * PARALLAX + s * SPIN
      return g
    }
    const cur = goal() // start on the target: no fly-in on load

    const frame = () => {
      raf = 0
      const g = goal()
      let moving = false
      for (let k = 0; k < 8; k++) {
        const d = g[k] - cur[k]
        if (Math.abs(d) > 5e-4) { cur[k] += d * EASE; moving = true } else cur[k] = g[k]
      }
      rig.position.set(cur[0] * narrow, cur[1], cur[2])
      rig.rotation.set(cur[3], cur[4], cur[5])
      rig.scale.setScalar(cur[6])
      canvas.style.opacity = cur[7].toFixed(3)
      renderer.render(scene, camera)
      if (moving) raf = requestAnimationFrame(frame)
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame) }

    const fit = () => {
      const w = window.innerWidth, h = window.innerHeight
      const aspect = w / h
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, w < 800 ? 1.5 : 2))
      renderer.setSize(w, h, false)
      camera.aspect = aspect
      camera.position.z = Math.max(CAM_Z, CAM_FIT / aspect)
      camera.updateProjectionMatrix()
      narrow = Math.min(1, aspect)
      kick()
    }
    const onPointer = (e) => {
      pointer[0] = (e.clientX / window.innerWidth) * 2 - 1
      pointer[1] = (e.clientY / window.innerHeight) * 2 - 1
      kick()
    }

    fit()
    window.addEventListener('resize', fit)
    if (!calm) {
      window.addEventListener('scroll', kick, { passive: true })
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) window.addEventListener('pointermove', onPointer, { passive: true })
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', fit)
      window.removeEventListener('scroll', kick)
      window.removeEventListener('pointermove', onPointer)
      model.traverse((o) => {
        o.geometry?.dispose()
        o.material?.dispose()
        o.dispose?.() // InstancedMesh
      })
      renderer.dispose()
    }
  }, [])

  return <canvas ref={ref} className="transformer" aria-hidden="true" />
}
