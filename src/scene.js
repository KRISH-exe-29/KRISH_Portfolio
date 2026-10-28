// The blister pack: a backing card, a plastic bubble you peel, the figure and five accessories.
// Loaded lazily. The page drives it from its single GSAP ticker through tick().
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { weight, smooth } from './chapters.js'

const damp = (x, t, k, dt) => x + (t - x) * (1 - Math.exp(-dt * k))
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const backOut = (v) => { v = clamp01(v) - 1; return 1 + 2.7 * v * v * v + 1.7 * v * v }

// Card-local layout, in scene units. The card is 3 wide, 4.2 tall, with a 0.4 hang tab on top.
const CARD = { w: 3, top: 2.5, bottom: -2.1 }
const SLOTS = [
  { x: 0.5, y: 0.45, w: 0.52, h: 0.7, label: 'ACC. 01 LAPTOP' },
  { x: 1.08, y: 0.45, w: 0.52, h: 0.7, label: 'ACC. 02 HARD HAT' },
  { x: 0.5, y: -0.4, w: 0.52, h: 0.7, label: 'ACC. 03 MULTIMETER' },
  { x: 1.08, y: -0.4, w: 0.52, h: 0.7, label: 'ACC. 04 CABLE' },
  { x: 0.79, y: -1.2, w: 1.1, h: 0.6, label: 'ACC. 05 TRANSFORMER' },
]
const FIG = { x: -0.75, y: -0.45, h: 2.5 }
const BLISTER = { w: 2.78, h: 2.86, d: 0.46, y: -0.44 }
const BLISTER_TOP = BLISTER.y + BLISTER.h / 2

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function drawCard(fontsReady) {
  const s = 300 // px per unit
  const W = CARD.w * s
  const H = (CARD.top - CARD.bottom) * s
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  const px = (x) => (x + CARD.w / 2) * s
  const py = (y) => (CARD.top - y) * s
  const display = fontsReady ? '"Bungee", Impact, sans-serif' : 'Impact, sans-serif'
  const body = '"Archivo", Arial, sans-serif'

  const bg = g.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#3150ff')
  bg.addColorStop(1, '#1528c9')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)
  // halftone burst behind the logo
  for (let y = 0; y < 1.5 * s; y += 18) {
    for (let x = 0; x < W; x += 18) {
      const d = Math.hypot(x - W * 0.42, y - py(1.6)) / (1.6 * s)
      const r = Math.max(0, 5.5 * (1 - d))
      if (r < 0.4) continue
      g.fillStyle = 'rgba(255,255,255,0.13)'
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
    }
  }
  // borders
  g.lineWidth = 0.035 * s
  g.strokeStyle = '#ff6a1a'
  rrect(g, px(-1.44), py(2.04), 2.88 * s, 4.08 * s, 0.1 * s); g.stroke()
  g.lineWidth = 0.012 * s
  g.strokeStyle = 'rgba(255,255,255,0.7)'
  rrect(g, px(-1.4), py(2.0), 2.8 * s, 4.0 * s, 0.08 * s); g.stroke()

  // tab
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `700 ${0.06 * s}px ${body}`
  g.fillText('SERIES 2026', px(0), py(2.16))

  // logo
  g.font = `400 ${0.62 * s}px ${display}`
  const word = 'KRISH'
  const fit = Math.min(1, (2.05 * s) / g.measureText(word).width)
  g.save()
  g.translate(px(-0.2), py(1.5))
  g.scale(fit, fit)
  g.fillStyle = '#ff6a1a'
  g.fillText(word, 0.035 * s, 0.045 * s)
  g.fillStyle = '#fff'
  g.fillText(word, 0, 0)
  g.restore()
  // role pill
  g.font = `800 ${0.095 * s}px ${body}`
  const role = 'AUTOMATION ENGINEER'
  const rw = g.measureText(role).width + 0.16 * s
  g.lineWidth = 0.014 * s
  g.strokeStyle = '#fff'
  g.fillStyle = '#0d1a8a'
  rrect(g, px(-0.2) - rw / 2, py(1.19) - 0.08 * s, rw, 0.16 * s, 0.08 * s); g.fill(); g.stroke()
  g.fillStyle = '#fff'
  g.fillText(role, px(-0.2), py(1.19))

  // starburst
  g.save()
  g.translate(px(1.12), py(1.6))
  g.rotate(-0.2)
  g.beginPath()
  for (let i = 0; i < 32; i++) {
    const r = (i % 2 ? 0.25 : 0.32) * s
    const a = (i / 32) * Math.PI * 2
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  g.closePath()
  g.fillStyle = '#ffd400'
  g.fill()
  g.fillStyle = '#0b0f2e'
  g.font = `400 ${0.07 * s}px ${display}`
  g.fillText('NOW WITH', 0, -0.06 * s)
  g.font = `400 ${0.11 * s}px ${display}`
  g.fillText('9 APPS!', 0, 0.06 * s)
  g.restore()

  // figure panel
  const og = g.createLinearGradient(px(-1.38), 0, px(-0.12), 0)
  og.addColorStop(0, '#ff8a2a')
  og.addColorStop(1, '#ff5a00')
  g.fillStyle = og
  rrect(g, px(-1.36), py(0.95), 1.24 * s, 2.77 * s, 0.1 * s); g.fill()
  g.save()
  g.clip()
  g.strokeStyle = 'rgba(255,255,255,0.12)'
  g.lineWidth = 0.05 * s
  for (let k = -3; k < 6; k++) {
    g.beginPath(); g.moveTo(px(-1.36) + k * 0.3 * s, py(0.95)); g.lineTo(px(-1.36) + k * 0.3 * s - 1.5 * s, py(-1.82)); g.stroke()
  }
  g.restore()
  g.fillStyle = '#0b0f2e'
  g.font = `800 ${0.05 * s}px ${body}`
  g.fillText('FIG. 01 · FULLY POSEABLE', px(-0.74), py(-1.74))

  // accessory slots
  SLOTS.forEach((sl) => {
    g.fillStyle = '#0e1d9e'
    rrect(g, px(sl.x - sl.w / 2), py(sl.y + sl.h / 2), sl.w * s, sl.h * s, 0.06 * s); g.fill()
    g.strokeStyle = 'rgba(0,0,0,0.35)'
    g.lineWidth = 0.012 * s
    g.stroke()
    g.fillStyle = 'rgba(255,255,255,0.85)'
    g.font = `800 ${0.036 * s}px ${body}`
    g.fillText(sl.label, px(sl.x), py(sl.y - sl.h / 2 + 0.06))
  })

  // fine print
  g.fillStyle = '#ffd400'
  g.font = `800 ${0.05 * s}px ${body}`
  g.fillText('Chase variant inside. Give him a spin.', px(0.79), py(-1.66))
  g.fillStyle = '#fff'
  g.font = `800 ${0.07 * s}px ${body}`
  g.fillText('LIMITED EDITION · 1 OF 1 · AGES: ANY RECRUITER', px(0), py(-1.98))
  return c
}

function cardShape() {
  const s = new THREE.Shape()
  const r = 0.14
  const { w, bottom } = CARD
  const hw = w / 2
  const top = 2.1
  s.moveTo(-hw + r, bottom)
  s.lineTo(hw - r, bottom)
  s.absarc(hw - r, bottom + r, r, -Math.PI / 2, 0)
  s.lineTo(hw, top - r)
  s.absarc(hw - r, top - r, r, 0, Math.PI / 2)
  s.lineTo(0.55, top)
  s.lineTo(0.55, 2.38)
  s.absarc(0.43, 2.38, 0.12, 0, Math.PI / 2)
  s.lineTo(-0.43, 2.5)
  s.absarc(-0.43, 2.38, 0.12, Math.PI / 2, Math.PI)
  s.lineTo(-0.55, top)
  s.lineTo(-hw + r, top)
  s.absarc(-hw + r, top - r, r, Math.PI / 2, Math.PI)
  s.lineTo(-hw, bottom + r)
  s.absarc(-hw + r, bottom + r, r, Math.PI, Math.PI * 1.5)
  // euro hang hole
  const h = new THREE.Path()
  h.moveTo(-0.13, 2.36)
  h.absarc(-0.13, 2.31, 0.05, Math.PI / 2, Math.PI * 1.5)
  h.lineTo(0.13, 2.26)
  h.absarc(0.13, 2.31, 0.05, -Math.PI / 2, Math.PI / 2)
  h.lineTo(-0.13, 2.36)
  s.holes.push(h)
  return s
}

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0, ...o })

function makeAccessory(kind) {
  const g = new THREE.Group()
  if (kind === 'laptop') {
    const alu = std('#c9ced8', { metalness: 0.6, roughness: 0.3 })
    const base = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.025, 0.3, 2, 0.01), alu)
    base.position.set(0, -0.12, 0.02)
    const lid = new THREE.Group()
    lid.position.set(0, -0.11, -0.13)
    const back = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.29, 0.018, 2, 0.008), alu)
    back.position.y = 0.145
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.25), new THREE.MeshBasicMaterial({ color: '#8fb8ff' }))
    screen.position.set(0, 0.145, 0.01)
    lid.add(back, screen)
    lid.rotation.x = -0.25
    g.add(base, lid)
    g.rotation.x = 0.35
  } else if (kind === 'hat') {
    const y = std('#ffc400', { roughness: 0.3 })
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), y)
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.02, 32), y)
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.32), y)
    ridge.position.y = 0.15
    g.add(dome, brim, ridge)
    g.position.y = -0.06
    g.rotation.x = 0.5
  } else if (kind === 'meter') {
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.36, 0.06, 2, 0.02), std('#e8202f'))
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), new THREE.MeshBasicMaterial({ color: '#b6ffcf' }))
    face.position.set(0, 0.09, 0.031)
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 24), std('#222'))
    dial.rotation.x = Math.PI / 2
    dial.position.set(0, -0.04, 0.035)
    const lead = (color, x) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, -0.17, 0.02), new THREE.Vector3(x * 3, -0.26, 0.04), new THREE.Vector3(x * 4, -0.05, 0.05), new THREE.Vector3(x * 4.4, 0.16, 0.05),
      ])
      return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.009, 6), std(color))
    }
    g.add(body, face, dial, lead('#d01020', 0.04), lead('#111', -0.04))
  } else if (kind === 'cable') {
    const pts = []
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * Math.PI * 2 * 3
      pts.push(new THREE.Vector3(Math.cos(t) * 0.16, Math.sin(t) * 0.16, (i / 120 - 0.5) * 0.12))
    }
    const coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.016, 8), std('#16161c', { roughness: 0.35 }))
    const plug = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.09, 0.04, 2, 0.01), std('#ff6a1a'))
    plug.position.set(0.17, -0.02, 0.07)
    g.add(coil, plug)
  } else {
    const grey = std('#8d969e', { metalness: 0.3, roughness: 0.5 })
    const tank = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.26, 0.2, 2, 0.02), grey)
    g.add(tank)
    for (let i = 0; i < 7; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.22, 0.08), grey)
      fin.position.set(-0.17 + i * 0.057, 0, 0.13)
      g.add(fin)
    }
    const porcelain = std('#6b3a24', { roughness: 0.25 })
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.14, 12), porcelain)
      b.position.set(-0.1 + i * 0.1, 0.2, 0)
      g.add(b)
    }
    const cons = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.24, 16), grey)
    cons.rotation.z = Math.PI / 2
    cons.position.set(0, 0.24, -0.07)
    g.add(cons)
    g.rotation.x = 0.25
  }
  return g
}

export function createScene(canvas, opts) {
  const { reduced, figureUrl, fallbackUrl, getLevel, onProgress, onPop, onRare, onReady } = opts
  const small = window.innerWidth < 760
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !small, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  const key = new THREE.DirectionalLight('#fff4e6', 1.6)
  key.position.set(-3, 5, 6)
  const rim = new THREE.DirectionalLight('#7fa2ff', 1.2)
  rim.position.set(4, 2, -3)
  scene.add(key, rim)

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  camera.position.set(0, 0, 12)

  // card
  const root = new THREE.Group() // layout position and scale
  const card = new THREE.Group() // tilt and entrance
  root.add(card)
  scene.add(root)
  const tex = new THREE.CanvasTexture(drawCard(false))
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  tex.repeat.set(1 / CARD.w, 1 / (CARD.top - CARD.bottom))
  tex.offset.set(0.5, -CARD.bottom / (CARD.top - CARD.bottom))
  const capMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 })
  const sideMat = std('#1a2fcf', { roughness: 0.6 })
  const cardGeo = new THREE.ExtrudeGeometry(cardShape(), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 10 })
  cardGeo.translate(0, 0, -0.062)
  card.add(new THREE.Mesh(cardGeo, [capMat, sideMat]))
  document.fonts?.load('400 100px Bungee').then(() => document.fonts.load('800 40px Archivo')).then(() => {
    tex.image = drawCard(true)
    tex.needsUpdate = true
  }).catch(() => {})

  // accessories
  const acc = ['laptop', 'hat', 'meter', 'cable', 'transformer'].map((k, i) => {
    const pivot = new THREE.Group()
    const inner = makeAccessory(k)
    pivot.add(inner)
    pivot.position.set(SLOTS[i].x, SLOTS[i].y + 0.04, 0.16)
    if (k === 'transformer') inner.scale.setScalar(1.3)
    card.add(pivot)
    return pivot
  })

  // figure
  const fig = new THREE.Group()
  fig.position.set(FIG.x, FIG.y, 0.2)
  card.add(fig)
  let model = null
  let modelMats = []
  let figAt = -1 // time the figure became available
  const addModel = (obj) => {
    model = obj
    fig.add(obj)
    figAt = clock
  }
  new GLTFLoader().load(figureUrl, (gltf) => {
    const m = gltf.scene
    m.traverse((o) => {
      if (!o.isMesh) return
      if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals()
      o.material.roughness = 0.75
      o.material.envMapIntensity = 0.8
      modelMats.push(o.material)
    })
    const box = new THREE.Box3().setFromObject(m)
    const size = box.getSize(new THREE.Vector3())
    const k = FIG.h / size.y
    m.scale.setScalar(k)
    const ctr = box.getCenter(new THREE.Vector3())
    m.position.set(-ctr.x * k, -ctr.y * k, -ctr.z * k)
    addModel(m)
    onProgress?.(1)
  }, (e) => { if (e.total) onProgress?.(e.loaded / e.total) }, () => {
    // The mesh failed: the 2D render on a little 3D card instead.
    new THREE.TextureLoader().load(fallbackUrl, (t) => {
      t.colorSpace = THREE.SRGBColorSpace
      const g = new THREE.Group()
      const h = FIG.h * 0.92
      const w = h * 0.746
      g.add(new THREE.Mesh(new RoundedBoxGeometry(w + 0.06, h + 0.06, 0.04, 2, 0.02), std('#fff')))
      const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }))
      face.position.z = 0.021
      g.add(face)
      modelMats = [face.material]
      addModel(g)
      onProgress?.(1)
    })
  })

  // blister
  const plastic = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', roughness: 0.06, metalness: 0, transparent: true, opacity: 0.2,
    clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2.2, depthWrite: false,
  })
  const flangeMat = plastic.clone()
  flangeMat.opacity = 0.1
  const hinge = new THREE.Group()
  hinge.position.set(0, BLISTER_TOP + 0.07, 0)
  const bubble = new THREE.Mesh(new RoundedBoxGeometry(BLISTER.w, BLISTER.h, BLISTER.d, 4, 0.16), plastic)
  bubble.position.set(0, -BLISTER.h / 2 - 0.07, BLISTER.d / 2)
  const flange = new THREE.Mesh(new RoundedBoxGeometry(BLISTER.w + 0.14, BLISTER.h + 0.14, 0.01, 1, 0.004), flangeMat)
  flange.position.set(0, -BLISTER.h / 2 - 0.07, 0.006)
  bubble.renderOrder = flange.renderOrder = 2
  hinge.add(flange, bubble)
  card.add(hinge)

  // state
  let clock = 0
  let enter = reduced ? 10 : 0
  let readySent = false
  let peel = 0
  let peelTarget = 0
  let released = false
  let gone = 0 // 0..1 fly-away after release
  let popped = false
  let popAt = 0
  let chapter = 0
  let level = 0
  let spin = 0
  let spinVel = 0
  let spinSum = 0
  let rare = false
  let rareAt = 0
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  const layout = { x: 0, y: 0, s: 1, showX: 0.55 }
  const tilt = { x: 0, y: 0 }
  const figLook = { y: 0, x: 0 }
  const tmp = new THREE.Vector3()

  function resize() {
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const vh = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const vw = vh * camera.aspect
    const tall = CARD.top - CARD.bottom
    const mid = (CARD.top + CARD.bottom) / 2
    if (camera.aspect >= 1) {
      layout.s = Math.min((0.82 * vh) / tall, (0.46 * vw) / CARD.w)
      layout.x = vw * 0.22
      layout.y = -mid * layout.s - vh * 0.02
      layout.showX = 0.3
    } else {
      layout.s = Math.min((0.43 * vh) / tall, (0.78 * vw) / CARD.w)
      layout.x = 0
      layout.y = vh * 0.5 - vh * 0.11 - CARD.top * layout.s
      layout.showX = 0
    }
  }
  resize()
  window.addEventListener('resize', resize)

  // input
  let drag = null
  const down = (e) => {
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId }
    canvas.setPointerCapture?.(e.pointerId)
    canvas.style.cursor = 'grabbing'
  }
  const move = (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1)
    if (!drag || e.pointerId !== drag.id) return
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    drag.x = e.clientX
    drag.y = e.clientY
    if (!released) {
      peelTarget = clamp01(peelTarget + (Math.abs(dx) + Math.abs(dy)) / (canvas.clientHeight * 0.55))
      if (peelTarget > 0.55) release()
    } else if (popped) {
      spinVel += dx * 0.035
    }
  }
  const up = () => {
    if (!drag) return
    drag = null
    canvas.style.cursor = ''
    if (!released) peelTarget = 0
  }
  canvas.addEventListener('pointerdown', down)
  window.addEventListener('pointermove', move, { passive: true })
  window.addEventListener('pointerup', up)
  canvas.addEventListener('pointercancel', up)

  function release() {
    if (released) return
    released = true
    peelTarget = 1
  }

  function goRare() {
    rare = true
    rareAt = clock
    modelMats.forEach((m) => {
      m.color?.set('#ffcf5a')
      if ('metalness' in m) { m.metalness = 1; m.roughness = 0.28; m.envMapIntensity = 1.6 }
    })
    onRare?.()
  }

  function tick(dt) {
    clock += dt
    if (enter < 10) enter += dt
    level = damp(level, getLevel?.() ?? 0, 18, dt)
    pointer.x = damp(pointer.x, pointer.tx, 6, dt)
    pointer.y = damp(pointer.y, pointer.ty, 6, dt)

    // entrance
    const eCard = backOut((enter - 0.1) / 0.9)
    const eBlister = smooth((enter - 1.7) / 0.7)
    if (!readySent && enter > 2.6) { readySent = true; onReady?.() }

    // layout and tilt
    const chap = smooth(chapter - 0.6)
    root.position.set(layout.x, layout.y + level * 0.05, 0)
    root.scale.setScalar(layout.s)
    tilt.y = damp(tilt.y, reduced ? 0 : pointer.x * 0.16 - chap * 0.22, 5, dt)
    tilt.x = damp(tilt.x, reduced ? 0 : -pointer.y * 0.08, 5, dt)
    card.rotation.set(tilt.x + (1 - eCard) * 1.1, tilt.y, (1 - eCard) * -0.35)
    card.position.set(0, (1 - eCard) * -7 + (reduced ? 0 : Math.sin(clock * 1.2) * 0.03), 0)

    // peel and fly away
    peel = damp(peel, peelTarget, drag ? 12 : 7, dt)
    if (released && peel > 0.7 && !popped) { popped = true; popAt = clock; onPop?.() }
    if (released && peel > 0.9) gone = Math.min(1, gone + dt * 1.6)
    hinge.rotation.set(-peel * 2.1 - gone * 0.8, 0, peel * 0.18)
    hinge.position.set(gone * 1.5, BLISTER_TOP + 0.07 + gone * 3.5, (1 - eBlister) * 2.5 + gone * 2)
    plastic.opacity = 0.2 * eBlister * (1 - gone)
    flangeMat.opacity = 0.1 * eBlister * (1 - gone)
    hinge.visible = gone < 1 && eBlister > 0

    // figure: pops out, faces the pointer (or the accessory on show), spins when dragged
    if (model) {
      // in time with the entrance if it loaded early, else on its own when it arrives
      const appear = reduced ? 1 : backOut((figAt <= 1 ? enter - 1 : clock - figAt) / 0.6)
      const pop = popped ? (reduced ? 1 : backOut((clock - popAt) / 0.7)) : 0
      fig.position.z = 0.2 + pop * 0.55
      fig.position.y = FIG.y + pop * 0.08 + Math.sin(clock * 2) * 0.015 * pop
      const beat = 1 + level * 0.05
      fig.scale.setScalar(Math.max(0.0001, appear * (1 + pop * 0.08) * beat))
      tmp.setFromMatrixPosition(fig.matrixWorld).project(camera)
      let want = popped ? THREE.MathUtils.clamp((pointer.x - tmp.x) * 1.3, -1.1, 1.1) : pointer.x * 0.12
      const showing = acc.reduce((a, _, i) => a + weight(chapter, i), 0)
      want = want * (1 - showing) + 0.85 * showing
      figLook.y = damp(figLook.y, reduced ? 0 : want, 5, dt)
      figLook.x = damp(figLook.x, popped && !reduced ? THREE.MathUtils.clamp(-(pointer.y - tmp.y) * 0.25, -0.2, 0.2) : 0, 5, dt)
      spinVel = damp(spinVel, 0, 1.4, dt)
      spin += spinVel * dt
      spinSum = spinSum * Math.exp(-dt * 0.35) + Math.abs(spinVel * dt)
      if (!rare && spinSum > Math.PI * 5) goRare()
      if (Math.abs(spinVel) < 0.3) spin = damp(spin, Math.round(spin / (Math.PI * 2)) * Math.PI * 2, 3, dt)
      fig.rotation.set(figLook.x, figLook.y + spin, 0)
      if (rare) fig.rotation.z = Math.sin((clock - rareAt) * 3) * 0.04 * Math.exp(-(clock - rareAt) * 0.5)
    }

    // accessories: pop in on entrance, then out of the box one per chapter
    acc.forEach((p, i) => {
      const e = backOut((enter - 0.9 - i * 0.12) / 0.5)
      const w = reduced ? 0 : weight(chapter, i)
      const sl = SLOTS[i]
      p.position.set(
        sl.x + (layout.showX - sl.x) * w,
        sl.y + 0.04 + (0.15 - sl.y) * w,
        0.16 + w * 1.7,
      )
      p.scale.setScalar(Math.max(0.0001, e * (1 + w * 1.5 + w * level * 0.25)))
      p.rotation.set(w * 0.15, w * (Math.sin(clock * 0.7) * 0.6), w * Math.sin(clock * 0.9) * 0.08)
    })

    key.intensity = 1.6 + level * 0.8
    renderer.render(scene, camera)
  }

  return {
    tick,
    setChapter(c) { chapter = c; if (c > 0.35) release() },
    peel: release,
    skip() { enter = 10 },
    nudge(dir) { if (popped) spinVel += dir * 4; else release() },
    resize,
    destroy() {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointercancel', up)
      renderer.dispose()
    },
  }
}
