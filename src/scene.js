// The night line in three.js. App owns the scroll; this file only draws where the train is.
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export const GAP = 150 // track length between stops

const rand = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647 })()

// Yellow Indian Railways station board: code on top, name below.
function boardTexture(name, code) {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 256
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  drawBoard(c, name, code)
  // The board font may still be loading; paint again once it's in.
  document.fonts?.load('800 120px "Big Shoulders Display"').then(() => {
    drawBoard(c, name, code)
    t.needsUpdate = true
  })
  return t
}

function drawBoard(c, name, code) {
  const g = c.getContext('2d')
  g.fillStyle = '#f2c230'
  g.fillRect(0, 0, 1024, 256)
  g.strokeStyle = '#141414'
  g.lineWidth = 14
  g.strokeRect(10, 10, 1004, 236)
  g.fillStyle = '#141414'
  g.textAlign = 'center'
  g.font = '600 44px "Big Shoulders Display", sans-serif'
  g.fillText(code, 512, 78)
  g.font = '800 120px "Big Shoulders Display", sans-serif'
  g.fillText(name, 512, 210, 960)
}

// A coach's window strip: warm squares, a few dark, a few with someone reading.
function windowTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 64
  const g = c.getContext('2d')
  g.fillStyle = '#0b0f1c'
  g.fillRect(0, 0, 512, 64)
  for (let i = 0; i < 12; i++) {
    const lit = rand() > 0.18
    g.fillStyle = lit ? '#ffcf7a' : '#1d2438'
    g.fillRect(8 + i * 42, 12, 32, 40)
    if (lit && rand() > 0.55) {
      g.fillStyle = 'rgba(40,24,10,0.75)'
      g.beginPath()
      g.arc(24 + i * 42, 36, 7, 0, Math.PI * 2)
      g.fill()
      g.fillRect(16 + i * 42, 42, 16, 12)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

// stops: [{ board: { name, code } | null }] in route order.
export function createScene(canvas, stops, { calm }) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  } catch {
    return null
  }
  const small = window.innerWidth < 700
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.25

  const scene = new THREE.Scene()
  const night = new THREE.Color('#070b18')
  scene.background = night
  scene.fog = new THREE.FogExp2(night, 0.012)

  const camera = new THREE.PerspectiveCamera(small ? 62 : 42, 1, 0.1, 900)

  scene.add(new THREE.HemisphereLight('#4a5c94', '#0a0a10', 1.7))
  const moonLight = new THREE.DirectionalLight('#9fb4ff', 0.6)
  moonLight.position.set(-40, 60, -30)
  scene.add(moonLight)

  const length = (stops.length - 1) * GAP + 200
  const glow = glowTexture()

  // Sky: stars on a dome, and a moon.
  {
    const n = 1800
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2
      const h = 0.08 + rand() * 0.9
      const r = 600
      pos.set([Math.cos(a) * r * Math.cos(h), Math.sin(h) * r, Math.sin(a) * r * Math.cos(h)], i * 3)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#dfe6ff', size: 1.6, sizeAttenuation: false, fog: false }))
    stars.name = 'sky'
    scene.add(stars)
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#fff2d6', fog: false }))
    moon.scale.set(60, 60, 1)
    moon.position.set(120, 180, -500)
    stars.add(moon)
  }

  // Ground and a far skyline with lit windows.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(length + 800, 600), new THREE.MeshStandardMaterial({ color: '#0a0d16', roughness: 1 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.set(length / 2 - 100, 0, -200)
  scene.add(ground)
  {
    const n = 420
    const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#ffffff' }), n)
    const m = new THREE.Matrix4()
    const col = new THREE.Color()
    for (let i = 0; i < n; i++) {
      const h = 6 + rand() ** 2 * 40
      m.compose(
        new THREE.Vector3(-150 + rand() * (length + 300), h / 2, -90 - rand() * 120),
        new THREE.Quaternion(),
        new THREE.Vector3(6 + rand() * 12, h, 6 + rand() * 10),
      )
      city.setMatrixAt(i, m)
      col.set(rand() > 0.82 ? '#3b3020' : '#0d1222')
      city.setColorAt(i, col)
    }
    scene.add(city)
    // Window specks on the skyline, as points so they stay cheap.
    const pts = new Float32Array(1600 * 3)
    for (let i = 0; i < 1600; i++) pts.set([-150 + rand() * (length + 300), 2 + rand() * 34, -84 - rand() * 120], i * 3)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3))
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffc46b', size: 2, sizeAttenuation: false })))
  }

  // Track: two rails, sleepers, and overhead-line masts.
  {
    const steel = new THREE.MeshStandardMaterial({ color: '#8a93a6', metalness: 0.9, roughness: 0.35 })
    for (const z of [-0.75, 0.75]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(length + 400, 0.12, 0.1), steel)
      rail.position.set(length / 2 - 100, 0.32, z)
      scene.add(rail)
    }
    const count = Math.ceil((length + 400) / 0.9)
    const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.35, 0.16, 2.6), new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 1 }), count)
    const m = new THREE.Matrix4()
    for (let i = 0; i < count; i++) sleepers.setMatrixAt(i, m.makeTranslation(-300 + i * 0.9, 0.18, 0))
    scene.add(sleepers)
    const ballast = new THREE.Mesh(new THREE.BoxGeometry(length + 400, 0.2, 4), new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: 1 }))
    ballast.position.set(length / 2 - 100, 0.05, 0)
    scene.add(ballast)

    const masts = Math.ceil((length + 400) / 30)
    const mast = new THREE.InstancedMesh(new THREE.BoxGeometry(0.25, 7.5, 0.25), new THREE.MeshStandardMaterial({ color: '#2b3142' }), masts * 2)
    for (let i = 0; i < masts; i++) {
      mast.setMatrixAt(i * 2, m.makeTranslation(-300 + i * 30, 3.75, -2.6))
      mast.setMatrixAt(i * 2 + 1, m.makeTranslation(-300 + i * 30 + 15, 3.75, 5.5)) // near side: whips past the camera
    }
    scene.add(mast)
    const wire = new THREE.Mesh(new THREE.BoxGeometry(length + 400, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: '#4a5266' }))
    wire.position.set(length / 2 - 100, 6.4, 0)
    scene.add(wire)
  }

  // Stations: a platform, lamps and a board at each stop that has one.
  const lamps = []
  stops.forEach((s, i) => {
    if (!s.board) return
    const x = i * GAP
    const group = new THREE.Group()
    group.position.x = x
    const deck = new THREE.Mesh(new THREE.BoxGeometry(56, 1, 5), new THREE.MeshStandardMaterial({ color: '#3a3c44', roughness: 0.9 }))
    deck.position.set(0, 0.5, -4.5)
    group.add(deck)
    const edge = new THREE.Mesh(new THREE.BoxGeometry(56, 0.06, 0.3), new THREE.MeshStandardMaterial({ color: '#d9b23a', emissive: '#6b5410' }))
    edge.position.set(0, 1.03, -2.15)
    group.add(edge)
    const roof = new THREE.Mesh(new THREE.BoxGeometry(40, 0.25, 4.5), new THREE.MeshStandardMaterial({ color: '#1c2030' }))
    roof.position.set(0, 4.6, -4.8)
    group.add(roof)

    const bulbMat = new THREE.MeshBasicMaterial({ color: '#2a2418' })
    const halos = []
    for (let k = -3; k <= 3; k++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.6, 0.12), new THREE.MeshStandardMaterial({ color: '#222' }))
      post.position.set(k * 6, 2.8, -5.6)
      group.add(post)
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), bulbMat)
      bulb.position.set(k * 6, 4.4, -5.2)
      group.add(bulb)
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#ffcb7d', transparent: true, opacity: 0, depthWrite: false }))
      halo.scale.set(1.7, 1.7, 1)
      halo.position.copy(bulb.position)
      group.add(halo)
      halos.push(halo)
    }
    const board = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.6), new THREE.MeshBasicMaterial({ map: boardTexture(s.board.name, s.board.code), color: '#555' }))
    board.position.set(4, 5.9, -6.2)
    group.add(board)
    for (const dx of [-2.6, 2.6]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5.2, 0.12), new THREE.MeshStandardMaterial({ color: '#222' }))
      leg.position.set(4 + dx, 3.2, -6.25)
      group.add(leg)
    }
    scene.add(group)
    lamps.push({ x, bulbMat, halos, board: board.material, lit: 0 })
  })
  // One pooled light sits at whichever platform is nearest, so the cost doesn't grow with stops.
  const platformLight = new THREE.PointLight('#ffc070', 0, 40, 1.4)
  platformLight.position.set(0, 4, -3)
  scene.add(platformLight)

  // The signal at the start: red until the visitor boards.
  const signalLamp = new THREE.MeshBasicMaterial({ color: '#ff2a2a' })
  const signalHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#ff2a2a', transparent: true, depthWrite: false }))
  {
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.4, 0.2), new THREE.MeshStandardMaterial({ color: '#1a1a1a' }))
    pole.position.set(26, 2.2, -2.4)
    scene.add(pole)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 10), signalLamp)
    head.position.set(26, 4.3, -2.2)
    scene.add(head)
    signalHalo.scale.set(3, 3, 1)
    signalHalo.position.copy(head.position)
    scene.add(signalHalo)
  }

  // The train: a locomotive and five coaches, built nose at x = 0, running toward +x.
  const train = new THREE.Group()
  {
    const body = new THREE.MeshStandardMaterial({ color: '#a8282e', roughness: 0.5, metalness: 0.2 })
    const roofMat = new THREE.MeshStandardMaterial({ color: '#9aa1ad', roughness: 0.6, metalness: 0.4 })
    const under = new THREE.MeshStandardMaterial({ color: '#111216' })
    const stripe = new THREE.MeshBasicMaterial({ color: '#e7d7b5' })
    const loco = new THREE.Group()
    const lb = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 2.9), new THREE.MeshStandardMaterial({ color: '#c4421f', roughness: 0.5, metalness: 0.25 }))
    lb.position.set(-8, 2.4, 0)
    loco.add(lb)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 2.6), new THREE.MeshBasicMaterial({ color: '#ffd68a' }))
    cab.position.set(-0.55, 3.15, 0)
    loco.add(cab)
    const lstripe = new THREE.Mesh(new THREE.BoxGeometry(16.02, 0.25, 2.92), stripe)
    lstripe.position.set(-8, 1.6, 0)
    loco.add(lstripe)
    const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#fff6dc', depthWrite: false }))
    head.scale.set(4, 4, 1)
    head.position.set(0.2, 3.3, 0)
    loco.add(head)
    train.add(loco)
    const beam = new THREE.SpotLight('#fff1cf', 60, 90, 0.35, 0.6, 1.2)
    beam.position.set(0.3, 3.2, 0)
    beam.target.position.set(30, 0, 0)
    train.add(beam, beam.target)

    const win = windowTexture()
    for (let k = 0; k < 5; k++) {
      const coach = new THREE.Group()
      coach.position.x = -17 - k * 19.2
      const b = new THREE.Mesh(new THREE.BoxGeometry(18.6, 2.9, 2.9), body)
      b.position.set(-9.3, 2.35, 0)
      coach.add(b)
      const r = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.35, 2.6), roofMat)
      r.position.set(-9.3, 3.95, 0)
      coach.add(r)
      for (const z of [-1.46, 1.46]) {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(17, 0.95), new THREE.MeshBasicMaterial({ map: win, color: '#a8957a' }))
        w.position.set(-9.3, 2.75, z)
        if (z < 0) w.rotation.y = Math.PI
        coach.add(w)
      }
      const u = new THREE.Mesh(new THREE.BoxGeometry(17, 0.7, 2.4), under)
      u.position.set(-9.3, 0.75, 0)
      coach.add(u)
      train.add(coach)
    }
  }
  scene.add(train)

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.45, 0.82)
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

  const state = { x: 0, target: 0, green: 0, signal: 0, t: 0 }
  const look = new THREE.Vector3()
  let last = performance.now()
  let frame = 0
  let lost = false
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; document.documentElement.classList.add('flat') })

  const tick = () => {
    frame = requestAnimationFrame(tick)
    if (lost) return
    const nowMs = performance.now()
    const dt = Math.min((nowMs - last) / 1000, 0.05)
    last = nowMs
    state.t += dt
    const before = state.x
    state.x += (state.target - state.x) * (1 - Math.exp(-dt * 4))
    const speed = Math.abs(state.x - before) / Math.max(dt, 1e-3)

    train.position.x = state.x
    // A little rail chatter that grows with speed.
    train.position.y = calm ? 0 : Math.sin(state.t * 38) * Math.min(speed, 60) * 0.0008
    train.rotation.x = calm ? 0 : Math.sin(state.t * 11) * Math.min(speed, 60) * 0.00012

    state.signal += (state.green - state.signal) * (1 - Math.exp(-dt * 3))
    signalLamp.color.setRGB(1 - state.signal, 0.16 + state.signal * 0.84, 0.16 + state.signal * 0.3)
    signalHalo.material.color.copy(signalLamp.color)

    // Platform lights warm up as the train pulls in.
    let nearest = null
    for (const l of lamps) {
      const d = Math.abs(state.x - 30 - l.x)
      const want = d < 70 ? 1 : 0
      l.lit += (want - l.lit) * (1 - Math.exp(-dt * 2.5))
      l.bulbMat.color.setRGB(0.16 + l.lit * 0.84, 0.14 + l.lit * 0.66, 0.1 + l.lit * 0.34)
      l.board.color.setScalar(0.33 + l.lit * 0.67)
      for (const h of l.halos) h.material.opacity = l.lit * 0.7
      if (!nearest || d < nearest.d) nearest = { l, d }
    }
    if (nearest) {
      platformLight.position.x = nearest.l.x
      platformLight.intensity = nearest.l.lit * 120
    }

    // Camera rides alongside, a little behind the nose, and drifts back at speed.
    const pull = Math.min(speed / 80, 1)
    const sway = calm ? 0 : Math.sin(state.t * 0.4) * 0.6
    camera.position.set(state.x - 30 - pull * 6, 8 + sway * 0.3, small ? 30 : 24 + pull * 3)
    look.set(state.x - 14, small ? -5 : 2.8, -3) // phones: lift the train into the top of the screen, above the cards
    camera.lookAt(look)
    scene.getObjectByName('sky').position.x = camera.position.x

    composer.render()
  }
  tick()

  return {
    // Where the train should be, in track units; it eases there on its own.
    go(x) { state.target = x },
    jump(x) { state.target = state.x = x },
    green() { state.green = 1 },
    dispose() {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      renderer.dispose()
    },
  }
}
