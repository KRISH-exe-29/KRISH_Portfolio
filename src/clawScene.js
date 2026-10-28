import * as THREE from 'three'

/* The claw machine. Plain Three.js, no physics library: capsules are verlet spheres
   (position + previous position), resolved against each other and the glass a few times a step.
   The App drives tick() from the single GSAP ticker; nothing here starts its own rAF loop. */

const R = 0.22 // capsule radius
const PLAY = { x0: -0.8, x1: 1.62, z0: -0.95, z1: 0.95 } // where capsules live (inside glass)
const WALL = -0.84 // partition between the pile and the prize chute
const CHUTE = { x: -1.23, z: 0.45 }
const HOME_Y = 2.42 // hub height when parked
const TIP = 0.44 // hub to fingertip
const G = -9.8
const STEP = 1 / 120

const ink = '#1E1030'
const cream = '#FFF3DC'

const damp = (x, t, k, dt) => x + (t - x) * (1 - Math.exp(-dt * k))
const rand = (a, b) => a + Math.random() * (b - a)

function capsuleTexture(p) {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = p.color; g.fillRect(0, 0, 512, 128)
  g.fillStyle = p.kind === 'resume' ? '#FFE27A' : cream; g.fillRect(0, 128, 512, 128)
  // dots on the lid, like the plastic ones at the mall
  g.fillStyle = 'rgba(255,255,255,0.35)'
  for (let i = 0; i < 18; i++) { g.beginPath(); g.arc((i * 61) % 512, 20 + ((i * 37) % 70), 7, 0, 7); g.fill() }
  g.fillStyle = ink; g.fillRect(0, 100, 512, 56)
  g.fillStyle = cream
  g.textAlign = 'center'; g.textBaseline = 'middle'
  let size = 34
  g.font = `${size}px Bungee, Impact, sans-serif`
  while (g.measureText(p.short).width > 220 && size > 14) { size -= 2; g.font = `${size}px Bungee, Impact, sans-serif` }
  g.fillText(p.short, 128, 129); g.fillText(p.short, 384, 129)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function marqueeTexture() {
  const c = document.createElement('canvas')
  c.width = 1024; c.height = 200
  const g = c.getContext('2d')
  g.fillStyle = '#FFB627'; g.fillRect(0, 0, 1024, 200)
  for (let i = -4; i < 30; i++) { g.fillStyle = i % 2 ? '#FF4D2E' : '#FFB627'; g.beginPath(); g.moveTo(i * 60, 0); g.lineTo(i * 60 + 30, 0); g.lineTo(i * 60 - 70, 200); g.lineTo(i * 60 - 100, 200); g.fill() }
  g.fillStyle = ink; g.fillRect(40, 30, 944, 140)
  g.textAlign = 'center'; g.textBaseline = 'middle'
  g.font = '92px Bungee, Impact, sans-serif'
  g.fillStyle = '#FF4D2E'; g.fillText('KRISH-O-MATIC', 516, 106)
  g.fillStyle = '#FFF3DC'; g.fillText('KRISH-O-MATIC', 510, 100)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function sideTexture() {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#3A4BFF'; g.fillRect(0, 0, 512, 256)
  g.fillStyle = '#FF7AB6'
  for (let i = 0; i < 9; i++) g.fillRect(0, 18 + i * 26, 512, 9)
  g.fillStyle = ink; g.fillRect(36, 54, 440, 148)
  g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillStyle = '#FFB627'; g.font = '54px Bungee, Impact, sans-serif'; g.fillText('9 APPS INSIDE', 256, 104)
  g.fillStyle = '#FFF3DC'; g.font = '26px Bungee, Impact, sans-serif'; g.fillText('0 SPREADSHEETS LEFT', 256, 156)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export async function createClawScene(canvas, opts) {
  const { prizes, onPrize, onHover, onStatus, getLevel, keys, reduced } = opts
  try { await Promise.race([document.fonts.load('40px Bungee'), new Promise((r) => setTimeout(r, 1500))]) } catch { /* canvas falls back to Impact */ }

  const small = Math.min(window.innerWidth, window.innerHeight) < 700
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80)
  const rig = new THREE.Group()
  scene.add(rig)
  const disposables = []
  const mat = (o) => { const m = new THREE.MeshStandardMaterial(o); disposables.push(m); return m }
  const geo = (g) => { disposables.push(g); return g }
  const add = (g, m, x, y, z, parent = rig) => { const mesh = new THREE.Mesh(g, m); mesh.position.set(x, y, z); parent.add(mesh); return mesh }

  // light: warm key, cool rim, and a lamp inside the glass that pumps with the bass
  scene.add(new THREE.HemisphereLight('#FFE9C7', '#3A1F4F', 1.4))
  const key = new THREE.DirectionalLight('#FFFFFF', 2.2); key.position.set(3, 6, 5); scene.add(key)
  const rim = new THREE.DirectionalLight('#7FA0FF', 1.6); rim.position.set(-5, 3, -4); scene.add(rim)
  const lamp = new THREE.PointLight('#FFD38A', 6, 6, 1.6); lamp.position.set(0.4, 2.6, 0.3); rig.add(lamp)

  // cabinet
  const red = mat({ color: '#FF4D2E', roughness: 0.45 })
  const creamM = mat({ color: cream, roughness: 0.5 })
  const inkM = mat({ color: ink, roughness: 0.8 })
  const chrome = mat({ color: '#D9DEE8', metalness: 0.9, roughness: 0.25 })
  const yellow = mat({ color: '#FFB627', roughness: 0.4 })

  add(geo(new THREE.BoxGeometry(3.7, 1.6, 2.4)), red, 0.05, -0.82, 0)
  const panel = add(geo(new THREE.BoxGeometry(3.7, 0.12, 0.7)), creamM, 0.05, -0.08, 1.38); panel.rotation.x = 0.32
  add(geo(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 10)), chrome, 0.75, 0.08, 1.38)
  add(geo(new THREE.SphereGeometry(0.09, 16, 12)), red, 0.75, 0.24, 1.38)
  const bigBtn = add(geo(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 24)), yellow, 1.35, 0.0, 1.4); bigBtn.rotation.x = 0.32
  add(geo(new THREE.BoxGeometry(0.5, 0.6, 0.04)), inkM, 1.2, -0.95, 1.22)
  add(geo(new THREE.BoxGeometry(0.06, 0.24, 0.02)), yellow, 1.2, -0.85, 1.25)
  add(geo(new THREE.BoxGeometry(0.8, 0.55, 0.04)), creamM, CHUTE.x, -0.95, 1.22)
  add(geo(new THREE.BoxGeometry(0.66, 0.42, 0.05)), inkM, CHUTE.x, -0.95, 1.23)
  const side = new THREE.Mesh(geo(new THREE.PlaneGeometry(2.2, 1.1)), new THREE.MeshStandardMaterial({ map: sideTexture(), roughness: 0.6 }))
  disposables.push(side.material, side.material.map)
  side.position.set(1.91, -0.82, 0); side.rotation.y = Math.PI / 2; rig.add(side)
  // floors: the play floor and the black chute hole
  add(geo(new THREE.BoxGeometry(PLAY.x1 - WALL + 0.08, 0.04, 2.1)), mat({ color: '#3A1F4F', roughness: 0.9 }), (PLAY.x1 + WALL) / 2 + 0.04, -0.02, 0)
  add(geo(new THREE.BoxGeometry(0.8, 0.04, 2.1)), mat({ color: '#07030C', roughness: 1 }), CHUTE.x, -0.06, 0)
  // posts, roof, glass
  for (const x of [-1.72, 1.72]) for (const z of [-1.08, 1.08]) add(geo(new THREE.BoxGeometry(0.1, 2.95, 0.1)), creamM, x, 1.47, z)
  add(geo(new THREE.BoxGeometry(3.7, 0.2, 2.4)), red, 0.05, 3.03, 0)
  const glass = mat({ color: '#CFE8FF', transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide })
  add(geo(new THREE.BoxGeometry(3.4, 2.9, 0.02)), glass, 0, 1.45, 1.07)
  add(geo(new THREE.BoxGeometry(3.4, 2.9, 0.02)), glass, 0, 1.45, -1.07)
  const gs = add(geo(new THREE.BoxGeometry(2.1, 2.9, 0.02)), glass, 1.71, 1.45, 0); gs.rotation.y = Math.PI / 2
  const gs2 = add(geo(new THREE.BoxGeometry(2.1, 2.9, 0.02)), glass, -1.71, 1.45, 0); gs2.rotation.y = Math.PI / 2
  const part = add(geo(new THREE.BoxGeometry(2.1, 0.7, 0.03)), mat({ color: '#FFB627', transparent: true, opacity: 0.45 }), WALL, 0.35, 0); part.rotation.y = Math.PI / 2
  // marquee with chasing bulbs
  const marquee = new THREE.Mesh(geo(new THREE.BoxGeometry(3.7, 0.78, 0.3)), [red, red, red, red, new THREE.MeshBasicMaterial({ map: marqueeTexture() }), red])
  disposables.push(marquee.material[4], marquee.material[4].map)
  marquee.position.set(0.05, 3.55, 0.95); rig.add(marquee)
  const BULBS = 30
  const bulbs = new THREE.InstancedMesh(geo(new THREE.SphereGeometry(0.045, 10, 8)), new THREE.MeshBasicMaterial({ color: '#ffffff' }), BULBS)
  disposables.push(bulbs.material)
  const m4 = new THREE.Matrix4()
  for (let i = 0; i < BULBS; i++) {
    const row = i < BULBS / 2 ? 0 : 1
    const k = i % (BULBS / 2)
    m4.makeTranslation(-1.7 + (k / (BULBS / 2 - 1)) * 3.5, row ? 3.19 : 3.91, 1.11)
    bulbs.setMatrixAt(i, m4)
    bulbs.setColorAt(i, new THREE.Color('#5a3a20'))
  }
  rig.add(bulbs)
  const bulbOn = new THREE.Color('#FFE38A'), bulbHot = new THREE.Color('#FF7AB6'), bulbOff = new THREE.Color('#4a2a24'), tmpC = new THREE.Color()

  // gantry
  for (const z of [-0.95, 0.95]) add(geo(new THREE.BoxGeometry(3.3, 0.05, 0.05)), chrome, 0, 2.86, z)
  const bridge = add(geo(new THREE.BoxGeometry(0.07, 0.07, 2.0)), chrome, 0, 2.84, 0)
  const carriage = add(geo(new THREE.BoxGeometry(0.22, 0.12, 0.22)), yellow, 0, 2.78, 0)
  const cable = add(geo(new THREE.CylinderGeometry(0.012, 0.012, 1, 6)), inkM, 0, 2.6, 0)
  const claw = new THREE.Group(); rig.add(claw)
  add(geo(new THREE.CylinderGeometry(0.12, 0.09, 0.16, 20)), chrome, 0, 0, 0, claw)
  add(geo(new THREE.SphereGeometry(0.05, 12, 8)), red, 0, 0.1, 0, claw)
  const hinges = []
  const armG = geo(new THREE.BoxGeometry(0.035, 0.3, 0.05)), tipG = geo(new THREE.BoxGeometry(0.035, 0.16, 0.05))
  for (let i = 0; i < 3; i++) {
    const yaw = new THREE.Group(); yaw.rotation.y = (i / 3) * Math.PI * 2; yaw.position.y = -0.06; claw.add(yaw)
    const hinge = new THREE.Group(); hinge.position.x = 0.08; yaw.add(hinge)
    add(armG, chrome, 0, -0.15, 0, hinge)
    const knuckle = new THREE.Group(); knuckle.position.y = -0.3; knuckle.rotation.z = -0.95; hinge.add(knuckle)
    add(tipG, chrome, 0, -0.08, 0, knuckle)
    hinges.push(hinge)
  }

  // capsules
  const sphere = geo(new THREE.SphereGeometry(R, small ? 18 : 28, small ? 12 : 20))
  const bodies = prizes.map((p, i) => {
    const map = capsuleTexture(p)
    const m = new THREE.MeshStandardMaterial({ map, roughness: p.kind === 'resume' ? 0.2 : 0.32, metalness: p.kind === 'resume' ? 0.55 : 0.05 })
    disposables.push(map, m)
    const mesh = new THREE.Mesh(sphere, m)
    mesh.visible = false
    mesh.rotation.set(rand(-0.4, 0.4), rand(0, 6.28), rand(-0.4, 0.4))
    rig.add(mesh)
    // the resume goes in first, so it lands on the floor under everything else
    return { p, i, mesh, pos: new THREE.Vector3(), prev: new THREE.Vector3(), live: false, held: false, chute: false, spawnAt: i * 0.085 + 0.15, respawnAt: 0 }
  })
  const gold = bodies.find((b) => b.p.kind === 'resume')

  function spawn(b, high) {
    b.pos.set(rand(PLAY.x0 + R, PLAY.x1 - R), high ? rand(2.2, 2.6) : rand(R, 1.4), rand(PLAY.z0 + R, PLAY.z1 - R))
    b.prev.copy(b.pos).add(new THREE.Vector3(rand(-0.01, 0.01), 0, rand(-0.01, 0.01)))
    b.live = true; b.held = false; b.chute = false; b.mesh.visible = true
  }

  // ---- physics ----
  const d = new THREE.Vector3(), roll = new THREE.Vector3(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0)
  function step(dt) {
    for (const b of bodies) {
      if (!b.live || b.held) continue
      const vx = (b.pos.x - b.prev.x) * 0.996, vy = (b.pos.y - b.prev.y) * 0.996, vz = (b.pos.z - b.prev.z) * 0.996
      b.prev.copy(b.pos)
      b.pos.x += vx; b.pos.y += vy + G * dt * dt; b.pos.z += vz
    }
    for (let it = 0; it < 4; it++) {
      for (let a = 0; a < bodies.length; a++) {
        const A = bodies[a]
        if (!A.live || A.chute) continue
        for (let c = a + 1; c < bodies.length; c++) {
          const B = bodies[c]
          if (!B.live || B.chute || (A.held && B.held)) continue
          d.subVectors(B.pos, A.pos)
          const dist = d.length()
          if (dist >= 2 * R || dist < 1e-6) continue
          d.multiplyScalar((2 * R - dist) / dist)
          if (A.held) B.pos.add(d)
          else if (B.held) A.pos.sub(d)
          else { d.multiplyScalar(0.5); A.pos.sub(d); B.pos.add(d) }
        }
      }
      for (const b of bodies) {
        if (!b.live || b.held) continue
        if (b.chute) { // falling down the chute: box it in, no floor
          b.pos.x = Math.min(Math.max(b.pos.x, -1.62 + R), WALL - 0.04 - R)
          b.pos.z = Math.min(Math.max(b.pos.z, PLAY.z0 + R), PLAY.z1 - R)
          continue
        }
        b.pos.x = Math.min(Math.max(b.pos.x, PLAY.x0 + R), PLAY.x1 - R)
        b.pos.z = Math.min(Math.max(b.pos.z, PLAY.z0 + R), PLAY.z1 - R)
        if (b.pos.y < R) { // floor, with friction so they don't skate
          b.pos.y = R
          b.prev.x += (b.pos.x - b.prev.x) * 0.12
          b.prev.z += (b.pos.z - b.prev.z) * 0.12
        }
      }
    }
  }
  function syncMeshes() {
    for (const b of bodies) {
      if (!b.live) continue
      const m = b.mesh
      roll.set(b.pos.z - m.position.z, 0, -(b.pos.x - m.position.x))
      const dist = roll.length()
      if (dist > 1e-5 && !b.held) { q.setFromAxisAngle(roll.divideScalar(dist), dist / R); m.quaternion.premultiply(q) }
      m.position.copy(b.pos)
    }
  }

  // ---- claw state ----
  const s = {
    cx: 0.5, cz: 0, hubY: HOME_Y, open: 0, tx: 0.5, tz: 0, state: 'idle', timer: 0, goalY: 0,
    held: null, slipped: false, auto: false, rigged: false, yaw: 0, yawT: 0, scroll: 0, intro: reduced ? 1 : 0,
    t: 0, acc: 0, visible: true, hover: null, beat: 0, avg: 0.1,
  }
  claw.position.set(s.cx, s.hubY, s.cz)

  function surfaceAt(x, z) {
    let top = 0
    for (const b of bodies) {
      if (!b.live || b.held || b.chute) continue
      const h = Math.hypot(b.pos.x - x, b.pos.z - z)
      if (h < R * 1.25) top = Math.max(top, b.pos.y + R * Math.sqrt(Math.max(0, 1 - (h / (R * 1.25)) ** 2)))
    }
    return top
  }
  function underClaw() {
    let best = null, by = -1
    for (const b of bodies) {
      if (!b.live || b.held || b.chute) continue
      if (Math.hypot(b.pos.x - s.cx, b.pos.z - s.cz) < R * 1.2 && b.pos.y > by) { best = b; by = b.pos.y }
    }
    return best
  }

  function grab() {
    if (s.state !== 'idle' || s.intro < 1) return false
    const top = s.rigged ? gold.pos.y + R : surfaceAt(s.cx, s.cz)
    s.goalY = Math.max(top - R * 0.6 + TIP, 0.5)
    s.state = 'down'; s.slipped = false
    onStatus('Claw going down…')
    return true
  }

  const ray = new THREE.Raycaster(), plane = new THREE.Plane(), hit = new THREE.Vector3(), ndc = new THREE.Vector2()
  function pointTo(nx, ny) {
    ndc.set(nx, ny)
    ray.setFromCamera(ndc, camera)
    plane.setFromNormalAndCoplanarPoint(Y, rig.localToWorld(new THREE.Vector3(0, 0.6, 0)))
    if (!ray.ray.intersectPlane(plane, hit)) return
    rig.worldToLocal(hit)
    s.tx = Math.min(Math.max(hit.x, PLAY.x0 + 0.1), PLAY.x1 - 0.1)
    s.tz = Math.min(Math.max(hit.z, PLAY.z0 + 0.1), PLAY.z1 - 0.1)
  }

  function update(dt) {
    // keyboard steering
    const kv = 1.4 * dt
    if (s.state === 'idle' && !s.auto) {
      if (keys.ArrowLeft) s.tx -= kv
      if (keys.ArrowRight) s.tx += kv
      if (keys.ArrowUp) s.tz -= kv
      if (keys.ArrowDown) s.tz += kv
      s.tx = Math.min(Math.max(s.tx, PLAY.x0 + 0.1), PLAY.x1 - 0.1)
      s.tz = Math.min(Math.max(s.tz, PLAY.z0 + 0.1), PLAY.z1 - 0.1)
    }
    if (s.rigged && s.state === 'idle') { s.tx = gold.pos.x; s.tz = gold.pos.z }

    if (s.state === 'idle') {
      s.cx = damp(s.cx, s.tx, s.auto ? 5 : 7, dt); s.cz = damp(s.cz, s.tz, s.auto ? 5 : 7, dt)
      s.hubY = damp(s.hubY, HOME_Y, 6, dt); s.open = damp(s.open, 1, 8, dt)
      if (s.auto && Math.hypot(s.cx - s.tx, s.cz - s.tz) < 0.02) { s.auto = false; grab() }
    } else if (s.state === 'down') {
      s.open = damp(s.open, 1, 10, dt)
      s.hubY -= 1.7 * dt
      if (s.hubY <= s.goalY) { s.hubY = s.goalY; s.state = 'close'; s.timer = 0 }
    } else if (s.state === 'close') {
      s.timer += dt
      s.open = damp(s.open, 0, 9, dt)
      if (s.timer > 0.45) {
        const tip = new THREE.Vector3(s.cx, s.hubY - TIP + R * 0.4, s.cz)
        let pick = null, pd = R * 1.9
        if (s.rigged) pick = gold
        else for (const b of bodies) {
          if (!b.live || b.held || b.chute) continue
          const dd = b.pos.distanceTo(tip)
          if (dd < pd) { pd = dd; pick = b }
        }
        if (pick) { pick.held = true; s.held = pick; onStatus(`Got one: ${pick.p.title}`) }
        s.state = 'up'
      }
    } else if (s.state === 'up') {
      s.hubY += 1.3 * dt
      // the resume capsule is rigged, like every claw you ever trusted
      if (s.held === gold && !s.rigged && !s.slipped && s.hubY > 1.7) {
        gold.held = false; s.held = null; s.slipped = true; s.open = 0.6
        onStatus('It slipped. The gold one is rigged. Old-school players know the code.')
      }
      if (s.hubY >= HOME_Y) {
        s.hubY = HOME_Y
        if (s.held) s.state = 'carry'
        else { s.state = 'idle'; if (!s.slipped) onStatus('Missed. The claw sends its regards. Try again.') }
      }
    } else if (s.state === 'carry') {
      s.cx = damp(s.cx, CHUTE.x, 4, dt); s.cz = damp(s.cz, CHUTE.z, 4, dt)
      if (Math.hypot(s.cx - CHUTE.x, s.cz - CHUTE.z) < 0.03) {
        const b = s.held
        b.held = false; b.chute = true; s.held = null
        s.state = 'drop'; s.timer = 0
      }
    } else if (s.state === 'drop') {
      s.open = damp(s.open, 1, 10, dt)
      s.timer += dt
      if (s.timer > 0.6) { s.state = 'idle'; if (s.rigged) s.rigged = false }
    }

    // held capsule rides the claw (damped, so the rigged one gets magnet-pulled)
    if (s.held) {
      const b = s.held
      b.prev.copy(b.pos)
      b.pos.x = damp(b.pos.x, s.cx, 14, dt); b.pos.y = damp(b.pos.y, s.hubY - TIP + 0.02, 14, dt); b.pos.z = damp(b.pos.z, s.cz, 14, dt)
    }

    // chute: once a capsule falls out of sight, it's a prize
    for (const b of bodies) {
      if (b.chute && b.live && b.pos.y < -0.9) {
        b.live = false; b.mesh.visible = false; b.chute = false
        b.respawnAt = s.t + 2.5
        onPrize(b.p)
        onStatus(`Prize out: ${b.p.title}`)
      }
      if (!b.live && b.respawnAt && s.t > b.respawnAt) { b.respawnAt = 0; spawn(b, true) }
    }

    // what's under the claw
    if (s.state === 'idle') {
      const u = underClaw()
      const h = u ? u.p : null
      if (h !== s.hover) { s.hover = h; onHover(h) }
    }
  }

  // ---- music ----
  function music(dt) {
    const lv = getLevel()
    s.avg = damp(s.avg, lv, 1.5, dt)
    if (lv > 0.3 && lv > s.avg * 1.3 && s.beat <= 0) {
      s.beat = 0.28
      for (const b of bodies) if (b.live && !b.held && !b.chute && b.pos.y < R * 1.4 && Math.random() < 0.35) b.prev.y -= 0.006 * lv
    }
    s.beat -= dt
    return lv
  }

  // ---- camera ----
  let W = 1, H = 1
  function resize() {
    W = canvas.clientWidth || 1; H = canvas.clientHeight || 1
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    const wide = W > 900
    camera.setViewOffset(W, H, wide ? -W * 0.2 : 0, 0, W, H)
    camera.updateProjectionMatrix()
    const vfov = THREE.MathUtils.degToRad(camera.fov)
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect)
    // phones: shrink the cabinet into the band between the headline and the controls
    s.dist = Math.max(3.3 / Math.tan(vfov / 2), 2.7 / Math.tan(hfov / 2)) * (wide ? 1 : 1.3)
  }
  resize()
  const ro = new ResizeObserver(resize); ro.observe(canvas)
  const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting }); io.observe(canvas)

  const look = new THREE.Vector3()
  function placeCamera(dt) {
    const wide = W > 900
    const p = s.scroll
    s.yaw = damp(s.yaw, -p * 1.15 + (reduced ? 0 : Math.sin(s.t * 0.25) * 0.04), 4, dt)
    rig.rotation.y = s.yaw
    rig.position.x = damp(rig.position.x, p > 0.55 ? (p - 0.55) * 3 : 0, 5, dt)
    const intro = 1 - (1 - Math.min(s.intro, 1)) ** 3
    const dist = s.dist * (1.35 - 0.35 * intro) * (1 - p * 0.12)
    camera.position.set(0, 2.4 + p * 1.6, dist)
    look.set(0, (wide ? 1.55 : 1.35) + p * 0.3, 0)
    camera.lookAt(look)
  }

  function settle() {
    for (const b of bodies) if (!b.live) spawn(b, false)
    gold.pos.set(1.1, R, 0.3); gold.prev.copy(gold.pos)
    for (let i = 0; i < 700; i++) step(STEP)
    s.intro = 1
    syncMeshes()
  }
  if (reduced) settle()

  function tick(dt) {
    s.t += dt
    if (!s.visible) return
    if (s.intro < 1) {
      s.intro = Math.min(1, s.intro + dt / 3)
      for (const b of bodies) if (!b.live && !b.respawnAt && s.t > b.spawnAt) spawn(b, true)
    }
    update(dt)
    s.acc += dt
    let n = 0
    while (s.acc >= STEP && n < 6) { step(STEP); s.acc -= STEP; n++ }
    if (n === 6) s.acc = 0
    syncMeshes()
    const lv = music(dt)

    claw.position.set(s.cx, s.hubY, s.cz)
    carriage.position.set(s.cx, 2.78, s.cz)
    bridge.position.x = s.cx
    cable.position.set(s.cx, (2.78 + s.hubY) / 2, s.cz)
    cable.scale.y = Math.max(0.01, 2.78 - s.hubY)
    const ang = 0.12 + s.open * 0.5
    for (const h of hinges) h.rotation.z = ang

    // bulbs chase faster with the music; rigged mode turns them pink
    const speed = 7 + lv * 18
    const lit = Math.min(1, s.intro * 1.6)
    for (let i = 0; i < BULBS; i++) {
      const on = ((Math.floor(s.t * speed) + i) % 3 === 0) && (i / BULBS) < lit * 1.01
      tmpC.copy(on ? (s.rigged ? bulbHot : bulbOn) : bulbOff)
      if (on) tmpC.multiplyScalar(1 + lv * 0.8)
      bulbs.setColorAt(i, tmpC)
    }
    bulbs.instanceColor.needsUpdate = true
    lamp.intensity = 5 + lv * 10 + (s.rigged ? 4 : 0)
    lamp.color.set(s.rigged ? '#FF7AB6' : '#FFD38A')

    placeCamera(dt)
    renderer.render(scene, camera)
  }

  return {
    tick,
    grab,
    settle,
    pointTo,
    tapTo(nx, ny) { if (s.state !== 'idle') return; pointTo(nx, ny); s.auto = true },
    setScroll(p) { s.scroll = p },
    rig() { if (s.state !== 'idle') return false; s.rigged = true; s.auto = true; s.tx = gold.pos.x; s.tz = gold.pos.z; onStatus('RIGGED MODE. The claw works for you now.'); return true },
    dispose() {
      ro.disconnect(); io.disconnect()
      disposables.forEach((x) => x.dispose())
      bulbs.dispose()
      renderer.dispose()
    },
  }
}
