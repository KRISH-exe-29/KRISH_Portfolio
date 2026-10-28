import * as THREE from 'three'
import { apps, asset } from './content.js'

/* NIGHT SHIFT: an isometric diorama of his room at 2 a.m.
   Vanilla three.js, driven from the page's single gsap ticker (room.tick).
   Every damped value uses x += (target - x) * (1 - exp(-dt * k)). */

const damp = (x, t, k, dt) => x + (t - x) * (1 - Math.exp(-dt * k))
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (v) => v * v * (3 - 2 * v)
const backOut = (t) => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2) }

// Camera stops for the scrubbed tour: azimuth / elevation in degrees, ortho zoom, look-at target.
const STOPS = [
  { az: 45, el: 30, zoom: 1, t: [0, 1.5, 0] }, // the room
  { az: 28, el: 16, zoom: 2.3, t: [1.15, 1.45, -2.5] }, // monitors
  { az: 74, el: 14, zoom: 2.4, t: [-2.9, 2.1, -1.35] }, // corkboard
  { az: 22, el: 12, zoom: 2.5, t: [1.4, 2.85, -2.9] }, // calendar
  { az: 68, el: 24, zoom: 1.9, t: [-2.3, 1.7, 1.4] }, // shelf + bed
  { az: 16, el: 10, zoom: 2.3, t: [-1.5, 2.4, -2.9] }, // window
  { az: 45, el: 34, zoom: 1.05, t: [0, 1.5, 0] }, // the room again
]

// 3x5 dot font for the glow-in-the-dark stars.
const FONT = {
  9: ['111', '101', '111', '001', '111'],
  A: ['010', '101', '111', '101', '101'],
  P: ['110', '101', '110', '100', '100'],
  S: ['011', '100', '010', '001', '110'],
}
export const STAR_WORD = '9 APPS'

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  draw(g, w, h)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return { tex, g, c }
}

export function createRoom(canvas, { small = false, onPick, onHover, onBuilt } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.shadowMap.enabled = !small
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o })
  const P = {
    wall: mat(0x3a2c2b), wallL: mat(0x34282a), floor: mat(0x6a4630), rug: mat(0x7c3a2c), wood: mat(0x8c6342),
    dark: mat(0x231b18), paper: mat(0xf2e8d5), brass: mat(0xd59a4a, { metalness: 0.6, roughness: 0.35 }),
    cork: mat(0xb08452), duvet: mat(0x8fa58e, { roughness: 1 }), sheet: mat(0xe9dcc4, { roughness: 1 }),
    gold: mat(0xe8b54a, { metalness: 0.8, roughness: 0.3 }), leaf: mat(0x4f7a46), pot: mat(0xb5603e), red: mat(0xd9483b),
  }

  const pieces = []
  const pickables = []
  function piece(name, x, y, z, pick) {
    const g = new THREE.Group()
    g.position.set(x, y, z)
    g.userData = { base: y, delay: pieces.length * 0.15, hover: 0, pick }
    g.scale.setScalar(0.001)
    scene.add(g)
    pieces.push(g)
    if (pick) pickables.push(g)
    return g
  }
  function box(g, w, h, d, m, x = 0, y = 0, z = 0, shadow = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
    mesh.position.set(x, y, z)
    mesh.castShadow = shadow
    mesh.receiveShadow = true
    g.add(mesh)
    return mesh
  }
  function cyl(g, rt, rb, h, m, x = 0, y = 0, z = 0, seg = 20) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    g.add(mesh)
    return mesh
  }

  /* ---------- shell ---------- */
  const shell = piece('shell', 0, 0, 0)
  box(shell, 6.2, 0.2, 6.2, P.floor, 0, -0.1, 0, false)
  box(shell, 6.4, 4.6, 0.2, P.wall, -0.1, 2.3, -3.1, false)
  box(shell, 0.2, 4.6, 6.4, P.wallL, -3.1, 2.3, -0.1, false)
  box(shell, 6.2, 0.14, 0.04, P.dark, 0, 0.07, -2.98, false)
  box(shell, 0.04, 0.14, 6.2, P.dark, -2.98, 0.07, 0, false)
  for (let i = -2; i <= 2; i++) box(shell, 0.01, 0.002, 6.2, P.dark, i * 1.2 + 0.6, 0.001, 0, false)

  const rug = piece('rug', 0.3, 0.005, 0.4)
  const rugMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.02, 48), P.rug)
  rugMesh.scale.z = 0.7
  rugMesh.receiveShadow = true
  rug.add(rugMesh)

  /* ---------- bed + duvet ---------- */
  const bed = piece('bed', -2.25, 0, 1.45, 'bed')
  box(bed, 1.4, 0.35, 2.6, P.wood, 0, 0.18, 0)
  box(bed, 1.3, 0.2, 2.5, P.sheet, 0, 0.45, 0)
  box(bed, 1.4, 0.9, 0.1, P.wood, 0, 0.45, -1.3)
  const pillow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12), P.sheet)
  pillow.scale.set(1, 0.24, 0.5)
  pillow.position.set(0, 0.62, -0.95)
  pillow.castShadow = true
  bed.add(pillow)
  const dg = new THREE.BoxGeometry(1.42, 0.22, 1.9, 10, 2, 14)
  const pos = dg.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    if (y > 0) pos.setY(i, y + 0.05 * Math.sin(x * 5 + z * 2) * Math.cos(z * 3.1))
    if (Math.abs(x) > 0.7 && y < 0) pos.setY(i, y - 0.08)
  }
  dg.computeVertexNormals()
  const duvet = new THREE.Mesh(dg, P.duvet)
  duvet.position.set(0, 0.63, 0.33)
  duvet.castShadow = true
  duvet.receiveShadow = true
  bed.add(duvet)

  /* ---------- desk ---------- */
  const desk = piece('desk', 1.15, 0, -2.45)
  box(desk, 2.7, 0.08, 1.0, P.wood, 0, 1.0, 0)
  for (const [x, z] of [[-1.28, -0.42], [1.28, -0.42], [-1.28, 0.42], [1.28, 0.42]]) box(desk, 0.07, 1.0, 0.07, P.dark, x, 0.5, z)
  box(desk, 0.7, 0.3, 0.9, P.wood, 0.95, 0.8, 0)

  const chair = piece('chair', 1.0, 0, -1.55)
  box(chair, 0.7, 0.08, 0.65, P.dark, 0, 0.6, 0)
  box(chair, 0.7, 0.75, 0.08, P.dark, 0, 1.02, 0.3)
  cyl(chair, 0.04, 0.04, 0.55, P.brass, 0, 0.3, 0)
  cyl(chair, 0.3, 0.3, 0.04, P.dark, 0, 0.03, 0)

  /* ---------- monitors: the nine apps and the test suite ---------- */
  const screenA = canvasTex(512, 320, (g, w, h) => {
    g.fillStyle = '#10141f'; g.fillRect(0, 0, w, h)
    g.fillStyle = '#1b2233'; g.fillRect(0, 0, w, 30)
    ;['#ff6b5a', '#ffc24a', '#5bd47a'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(18 + i * 18, 15, 5, 0, 7); g.fill() })
    g.fillStyle = '#9fb2d8'; g.font = '600 15px monospace'; g.fillText('production / 9 apps', 80, 20)
    g.font = '16px monospace'
    apps.forEach((a, i) => {
      g.fillStyle = '#5bd47a'; g.fillRect(20, 44 + i * 30, 8, 8)
      g.fillStyle = '#e7ecff'; g.fillText(a.name, 40, 53 + i * 30)
      g.fillStyle = '#5bd47a'; g.fillText('live', w - 64, 53 + i * 30)
    })
  })
  const screenB = canvasTex(512, 320, (g, w, h) => {
    g.fillStyle = '#0d1410'; g.fillRect(0, 0, w, h)
    g.font = '17px monospace'
    const lines = [['#7f8f86', '$ npm test -- dispatch'], ['#d9f5e1', ' ✓ work order created'], ['#d9f5e1', ' ✓ gate pass printed'], ['#d9f5e1', ' ✓ nobody had to phone anyone'], ['#7f8f86', ' ...'], ['#5bd47a', ' 128 passing'], ['', ''], ['#7f8f86', '$ git push'], ['#ffc24a', ' shipped at an hour HR'], ['#ffc24a', ' does not need to know about'], ['#d9f5e1', '$ _']]
    lines.forEach(([c, t], i) => { g.fillStyle = c; g.fillText(t, 18, 34 + i * 26) })
  })
  const monitors = piece('monitors', 1.05, 1.04, -2.7, 'monitors')
  const screens = []
  ;[[-0.55, -0.12, screenA.tex], [0.55, 0.12, screenB.tex]].forEach(([x, ry, tex]) => {
    const m = new THREE.Group()
    m.position.set(x, 0, 0)
    m.rotation.y = ry
    box(m, 1.02, 0.66, 0.05, P.dark, 0, 0.62, 0)
    const sm = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.6), sm)
    s.position.set(0, 0.62, 0.027)
    m.add(s)
    screens.push(sm)
    box(m, 0.06, 0.3, 0.06, P.dark, 0, 0.15, -0.02)
    box(m, 0.36, 0.02, 0.22, P.dark, 0, 0.01, 0)
    monitors.add(m)
  })
  box(monitors, 0.9, 0.03, 0.28, P.dark, 0, 0.015, 0.45)

  /* ---------- lamp (the switch) ---------- */
  const lamp = piece('lamp', 2.2, 1.04, -2.6, 'lamp')
  cyl(lamp, 0.15, 0.18, 0.05, P.brass, 0, 0.025, 0)
  const arm1 = box(lamp, 0.035, 0.75, 0.035, P.brass, 0, 0.38, 0)
  arm1.rotation.x = 0.25
  const arm2 = box(lamp, 0.035, 0.6, 0.035, P.brass, 0, 0.84, 0.25)
  arm2.rotation.x = -0.9
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.28, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xd59a4a, side: THREE.DoubleSide, metalness: 0.5, roughness: 0.4 }))
  shade.position.set(0, 0.98, 0.55)
  shade.rotation.x = 0.5
  shade.castShadow = true
  lamp.add(shade)
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false })
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 10), bulbMat)
  bulb.position.set(0, 0.9, 0.6)
  lamp.add(bulb)

  /* ---------- clock + phone + mug on the desk ---------- */
  const clockTex = canvasTex(256, 96, () => {})
  function drawClock(text) {
    const { g, c } = clockTex
    g.fillStyle = '#140c08'; g.fillRect(0, 0, c.width, c.height)
    g.fillStyle = '#ff9d4a'; g.font = 'bold 66px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(text, c.width / 2, c.height / 2 + 4)
    clockTex.tex.needsUpdate = true
  }
  drawClock('22:00')
  const clock = piece('clock', -0.05, 1.04, -2.3)
  box(clock, 0.5, 0.22, 0.16, P.dark, 0, 0.11, 0)
  const cFace = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.165), new THREE.MeshBasicMaterial({ map: clockTex.tex, toneMapped: false }))
  cFace.position.set(0, 0.11, 0.082)
  clock.add(cFace)

  const phone = piece('phone', 1.85, 1.04, -2.1, 'phone')
  const ph = box(phone, 0.2, 0.025, 0.38, P.dark, 0, 0.013, 0)
  ph.rotation.y = -0.3
  const phoneGlow = new THREE.MeshBasicMaterial({ color: 0x5bd47a, toneMapped: false, transparent: true, opacity: 0.8 })
  const pScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.33), phoneGlow)
  pScreen.rotation.set(-Math.PI / 2, 0, -0.3)
  pScreen.position.y = 0.027
  phone.add(pScreen)

  const mug = piece('mug', 0.15, 1.04, -2.05)
  cyl(mug, 0.08, 0.07, 0.18, P.red, 0, 0.09, 0)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 8, 16), P.red)
  handle.position.set(0.09, 0.09, 0)
  mug.add(handle)

  /* ---------- plant ---------- */
  const plant = piece('plant', -2.45, 0, -2.45, 'plant')
  cyl(plant, 0.28, 0.2, 0.5, P.pot, 0, 0.25, 0)
  const leaves = new THREE.Group()
  leaves.position.y = 0.5
  plant.add(leaves)
  for (let i = 0; i < 9; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), P.leaf)
    const a = (i / 9) * Math.PI * 2
    l.scale.set(0.28, 1, 0.12)
    l.position.set(Math.cos(a) * 0.16, 0.38 + (i % 3) * 0.1, Math.sin(a) * 0.16)
    l.rotation.set(Math.sin(a) * 0.6, -a, -Math.cos(a) * 0.6)
    l.castShadow = true
    leaves.add(l)
  }

  /* ---------- corkboard with his photos ---------- */
  const cork = piece('cork', -2.97, 1.55, -1.35, 'corkboard')
  box(cork, 0.05, 1.2, 1.7, P.cork, 0, 0.6, 0)
  const loader = new THREE.TextureLoader()
  const pins = [
    ['img/railway.jpg', -0.45, 0.88, 0.08], ['img/buhler.jpg', 0.42, 0.9, -0.06],
    ['img/indotech.jpg', -0.38, 0.32, -0.05], ['img/buhler-badge.jpg', 0.45, 0.3, 0.07],
  ]
  pins.forEach(([src, z, y, rot]) => {
    const f = new THREE.Group()
    f.position.set(0.035, y, z)
    f.rotation.set(rot, Math.PI / 2, 0)
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5), P.paper)
    f.add(back)
    const pm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    loader.load(asset(src), (t) => { t.colorSpace = THREE.SRGBColorSpace; pm.map = t; pm.needsUpdate = true })
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.38), pm)
    p.position.set(0, 0.03, 0.002)
    f.add(p)
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), P.red)
    pin.position.set(0, 0.22, 0.02)
    f.add(pin)
    cork.add(f)
  })

  /* ---------- shelf: awards and certificates ---------- */
  const shelf = piece('shelf', -2.85, 2.55, 1.45, 'shelf')
  box(shelf, 0.4, 0.06, 1.9, P.wood, 0, 0, 0)
  const cup = new THREE.Group()
  cup.position.set(0, 0.03, -0.6)
  cyl(cup, 0.09, 0.09, 0.05, P.dark, 0, 0.025, 0)
  cyl(cup, 0.025, 0.025, 0.12, P.gold, 0, 0.11, 0)
  cyl(cup, 0.12, 0.05, 0.16, P.gold, 0, 0.25, 0)
  shelf.add(cup)
  ;[[-0.2, 0.32, 0x2e3d5c], [0.05, 0.26, 0x6b2e2e], [0.25, 0.3, 0xf2e8d5]].forEach(([z, h, c]) => {
    const f = box(shelf, 0.04, h, 0.22, mat(c), 0.02, 0.03 + h / 2, z)
    f.rotation.z = 0.12
  })
  const scroll = cyl(shelf, 0.04, 0.04, 0.34, P.paper, 0, 0.07, 0.62)
  scroll.rotation.x = Math.PI / 2
  for (let i = 0; i < 4; i++) box(shelf, 0.26, 0.3 - i * 0.02, 0.05, mat([0x7c3a2c, 0x3d5a4a, 0xd59a4a, 0x2e3d5c][i]), 0, 0.18, 0.28 + i * 0.06)

  /* ---------- wall calendar: one sticky note per contribution day ---------- */
  const cal = piece('calendar', 1.4, 2.25, -2.98, 'calendar')
  box(cal, 2.05, 1.25, 0.02, P.paper, 0, 0.62, 0)
  box(cal, 2.05, 0.18, 0.025, P.red, 0, 1.16, 0.005)
  const notes = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.03, 0.03), new THREE.MeshBasicMaterial({ toneMapped: false }), 371)
  notes.count = 0
  cal.add(notes)
  const extra = new THREE.Group()
  cal.add(extra)

  /* ---------- window with the sky ---------- */
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { uDawn: { value: 0 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      varying vec2 vUv; uniform float uDawn; uniform float uTime;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        vec3 night = mix(vec3(0.02,0.03,0.09), vec3(0.08,0.10,0.24), vUv.y);
        vec3 dawn = mix(vec3(1.0,0.55,0.28), vec3(0.45,0.62,0.9), smoothstep(0.0, 0.9, vUv.y));
        vec3 col = mix(night, dawn, uDawn);
        vec2 g = floor(vUv * vec2(60.0, 40.0));
        float s = step(0.975, h(g)) * (0.6 + 0.4 * sin(uTime * 2.0 + h(g + 3.0) * 30.0));
        col += vec3(s) * (1.0 - uDawn);
        float m = smoothstep(0.075, 0.07, distance(vUv, vec2(0.72, 0.72 - uDawn * 0.5)));
        col = mix(col, vec3(1.0, 0.95, 0.82), m * (1.0 - uDawn * 0.8));
        float sun = smoothstep(0.35, 0.0, distance(vUv, vec2(0.3, 0.02))) * uDawn;
        col += vec3(1.0, 0.7, 0.3) * sun;
        col += vec3(0.02, 0.015, 0.0) * (1.0 - step(0.12, vUv.y)) * (1.0 - uDawn);
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
  const win = piece('window', -1.5, 1.55, -2.98, 'window')
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.5), skyMat)
  pane.position.set(0, 0.8, 0.015)
  win.add(pane)
  box(win, 1.76, 0.08, 0.1, P.wood, 0, 0.02, 0.04)
  box(win, 1.76, 0.08, 0.1, P.wood, 0, 1.58, 0.04)
  box(win, 0.08, 1.6, 0.1, P.wood, -0.84, 0.8, 0.04)
  box(win, 0.08, 1.6, 0.1, P.wood, 0.84, 0.8, 0.04)
  box(win, 0.04, 1.5, 0.05, P.wood, 0, 0.8, 0.04)
  box(win, 1.9, 0.06, 0.25, P.wood, 0, -0.03, 0.12)

  /* ---------- glow-in-the-dark stars (only visible with the lamp off) ---------- */
  const starMat = new THREE.MeshBasicMaterial({ color: 0xd8ffc8, transparent: true, opacity: 0, toneMapped: false, depthWrite: false })
  const starSpots = []
  let cx = 0
  for (const ch of STAR_WORD) {
    const rows = FONT[ch]
    if (rows) rows.forEach((r, y) => [...r].forEach((b, x) => { if (b === '1') starSpots.push([cx + x, y]) }))
    cx += 4
  }
  const D = 0.14
  const wordW = (cx - 1) * D
  const stars = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.04, 0), starMat, starSpots.length + 18)
  const dummy = new THREE.Object3D()
  starSpots.forEach(([x, y], i) => {
    dummy.position.set(-wordW / 2 + x * D + 0.2, 4.3 - y * D, -2.97)
    dummy.rotation.set(0, 0, i)
    dummy.updateMatrix()
    stars.setMatrixAt(i, dummy.matrix)
  })
  for (let i = 0; i < 18; i++) { // a few loose stars on the side wall
    const r = Math.sin(i * 91.7) * 0.5 + 0.5
    dummy.position.set(-2.97, 3.5 + r * 0.9, -2.4 + i * 0.3)
    dummy.scale.setScalar(0.5 + r * 0.4)
    dummy.updateMatrix()
    stars.setMatrixAt(starSpots.length + i, dummy.matrix)
    dummy.scale.setScalar(1)
  }
  scene.add(stars)

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0x8a96d8, 0x2a1a12, 0.9)
  scene.add(hemi)
  const moon = new THREE.DirectionalLight(0xa8b8ff, 0.55)
  moon.position.set(5, 9, 7)
  scene.add(moon)
  const spot = new THREE.SpotLight(0xffb066, 30, 10, 0.95, 0.85, 1.4)
  spot.position.set(2.2, 2.0, -2.0)
  spot.target.position.set(0.6, 0, -1.2)
  spot.castShadow = !small
  spot.shadow.mapSize.set(1024, 1024)
  spot.shadow.bias = -0.0015
  scene.add(spot, spot.target)
  const glow = new THREE.PointLight(0xff9a4a, 7, 7, 1.4)
  glow.position.set(2.0, 2.1, -1.8)
  scene.add(glow)
  const screenLight = new THREE.PointLight(0x7fa8ff, 3, 4, 1.5)
  screenLight.position.set(1.05, 1.6, -2.0)
  scene.add(screenLight)
  const C = { hemiNight: new THREE.Color(0x8a96d8), hemiDawn: new THREE.Color(0xffd2a0), moonNight: new THREE.Color(0xa8b8ff), moonDawn: new THREE.Color(0xffb27a) }

  /* ---------- state ---------- */
  const S = {
    t0: performance.now() / 1000, tour: 0, cam: { ...STOPS[0], t: [...STOPS[0].t] },
    yaw: 0, yawT: 0, pitch: 0, pitchT: 0, lamp: 1, lampT: 1, dawn: 0, dawnT: 0, level: 0,
    built: false, visible: true, hovered: null, mouse: new THREE.Vector2(), moved: false, analyser: null, bins: null, w: 1, h: 1,
  }
  const ray = new THREE.Raycaster()

  function resize() {
    const r = canvas.parentElement.getBoundingClientRect()
    S.w = Math.max(1, r.width)
    S.h = Math.max(1, r.height)
    renderer.setSize(S.w, S.h, false)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas.parentElement)
  resize()

  const io = new IntersectionObserver(([e]) => { S.visible = e.isIntersecting })
  io.observe(canvas)

  function onMove(e) {
    S.yawT = (e.clientX / window.innerWidth - 0.5) * 0.5
    S.pitchT = (e.clientY / window.innerHeight - 0.5) * 0.12
    if (e.target === canvas) {
      const r = canvas.getBoundingClientRect()
      S.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      S.moved = true
      S.px = e.clientX
      S.py = e.clientY
    } else if (S.hovered) {
      S.hovered = null
      onHover?.(null)
      canvas.style.cursor = ''
    }
  }
  function onClick() { if (S.hovered) onPick?.(S.hovered.userData.pick) }
  function onLeave() { S.hovered = null; onHover?.(null); canvas.style.cursor = '' }
  window.addEventListener('pointermove', onMove, { passive: true })
  canvas.addEventListener('click', onClick)
  canvas.addEventListener('pointerleave', onLeave)

  let lastClock = ''
  function tick(_time, deltaMs) {
    if (!S.visible || document.hidden) return
    const dt = Math.min((deltaMs || 16) / 1000, 0.05)
    const now = performance.now() / 1000
    const t = now - S.t0

    // music: bass energy
    if (S.analyser) {
      S.analyser.getByteFrequencyData(S.bins)
      let sum = 0
      for (let i = 1; i < 12; i++) sum += S.bins[i]
      S.level = damp(S.level, sum / (11 * 255), 18, dt)
    } else S.level = damp(S.level, 0, 4, dt)
    const L = S.level

    // build: each piece drops in, then settles
    let done = true
    for (const g of pieces) {
      const u = g.userData
      const k = clamp01((t - u.delay) / 0.65)
      if (k < 1) done = false
      const e = k <= 0 ? 0.001 : backOut(k)
      const hoverT = S.hovered === g ? 1 : 0
      u.hover = damp(u.hover, hoverT, 12, dt)
      g.scale.setScalar(Math.max(0.001, e * (1 + u.hover * 0.045)))
      g.position.y = u.base + (1 - smooth(k)) * 2.2
    }
    if (done && !S.built) { S.built = true; onBuilt?.() }

    // camera tour
    const seg = S.tour * (STOPS.length - 1)
    const i = Math.min(STOPS.length - 2, Math.floor(seg))
    const f = smooth(clamp01(seg - i))
    const a = STOPS[i], b = STOPS[i + 1]
    const k = 5
    S.cam.az = damp(S.cam.az, a.az + (b.az - a.az) * f, k, dt)
    S.cam.el = damp(S.cam.el, a.el + (b.el - a.el) * f, k, dt)
    S.cam.zoom = damp(S.cam.zoom, a.zoom + (b.zoom - a.zoom) * f, k, dt)
    for (let j = 0; j < 3; j++) S.cam.t[j] = damp(S.cam.t[j], a.t[j] + (b.t[j] - a.t[j]) * f, k, dt)
    S.yaw = damp(S.yaw, S.built ? S.yawT : 0, 3, dt)
    S.pitch = damp(S.pitch, S.built ? S.pitchT : 0, 3, dt)

    const az = THREE.MathUtils.degToRad(S.cam.az) + S.yaw * (S.tour < 0.02 || S.tour > 0.97 ? 1 : 0.35)
    const el = THREE.MathUtils.degToRad(S.cam.el) + S.pitch
    const r = 30
    camera.position.set(S.cam.t[0] + Math.sin(az) * Math.cos(el) * r, S.cam.t[1] + Math.sin(el) * r, S.cam.t[2] + Math.cos(az) * Math.cos(el) * r)
    camera.lookAt(S.cam.t[0], S.cam.t[1], S.cam.t[2])
    const aspect = S.w / S.h
    const halfH = Math.max(4.1, 4.9 / aspect)
    camera.left = -halfH * aspect
    camera.right = halfH * aspect
    camera.top = halfH
    camera.bottom = -halfH
    camera.zoom = S.cam.zoom
    camera.updateProjectionMatrix()

    // lamp, dawn and the stars
    S.lamp = damp(S.lamp, S.lampT, 6, dt)
    S.dawn = damp(S.dawn, S.dawnT, 3, dt)
    const lit = S.lamp
    const dark = (1 - lit) * (1 - S.dawn)
    spot.intensity = 30 * lit * (1 + L * 0.4)
    glow.intensity = 7 * lit * (1 + L * 0.8)
    bulbMat.color.setRGB(1 * (0.15 + 0.85 * lit), 0.85 * (0.15 + 0.85 * lit), 0.63 * (0.15 + 0.85 * lit))
    hemi.color.lerpColors(C.hemiNight, C.hemiDawn, S.dawn)
    hemi.intensity = (0.9 * (0.25 + 0.75 * lit)) + S.dawn * 0.9
    moon.color.lerpColors(C.moonNight, C.moonDawn, S.dawn)
    moon.intensity = 0.55 + S.dawn * 1.4
    screenLight.intensity = 3 * (1 + L * 1.2) * (0.6 + 0.4 * lit)
    screens.forEach((m) => m.color.setScalar(0.8 + L * 0.5))
    starMat.opacity = dark * (0.85 + 0.15 * Math.sin(t * 3))
    starMat.color.setRGB(0.85 + L * 0.3, 1, 0.78 + L * 0.3)
    stars.visible = starMat.opacity > 0.01
    skyMat.uniforms.uDawn.value = S.dawn
    skyMat.uniforms.uTime.value = t
    phoneGlow.opacity = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.4))
    leaves.rotation.z = Math.sin(t * 0.8) * 0.04 + L * 0.08
    leaves.rotation.x = Math.cos(t * 0.6) * 0.03
    duvet.scale.y = 1 + Math.sin(t * 1.1) * 0.03

    // hover picking, only when the pointer moved
    if (S.moved && S.built) {
      S.moved = false
      ray.setFromCamera(S.mouse, camera)
      const hit = ray.intersectObjects(pickables, true)[0]
      let g = hit?.object
      while (g && !g.userData.pick) g = g.parent
      if (g !== S.hovered) {
        S.hovered = g || null
        canvas.style.cursor = g ? 'pointer' : ''
      }
      onHover?.(S.hovered?.userData.pick || null, S.px, S.py)
    }

    renderer.render(scene, camera)
  }

  return {
    tick,
    setTour(p) { S.tour = clamp01(p) },
    setDawn(d) { S.dawnT = clamp01(d) },
    setLamp(on) { S.lampT = on ? 1 : 0 },
    setClock(text) { if (text !== lastClock) { lastClock = text; drawClock(text) } },
    setAnalyser(an) { S.analyser = an; S.bins = new Uint8Array(an.frequencyBinCount) },
    skip() { S.t0 = performance.now() / 1000 - 10 },
    setDays(days, best) {
      const col = new THREE.Color()
      const first = new Date(days[0][0] + 'T00:00:00Z').getUTCDay()
      days.forEach(([date, n], i) => {
        const idx = i + first
        const wk = Math.floor(idx / 7), dow = idx % 7
        dummy.position.set(-0.91 + wk * 0.035, 0.98 - dow * 0.12 - 0.02, 0.013)
        dummy.rotation.set(0, 0, (Math.sin(i * 12.9) * 0.15))
        dummy.scale.set(1, 3.2, 1)
        dummy.updateMatrix()
        notes.setMatrixAt(i, dummy.matrix)
        col.set(n === 0 ? 0xd9cfbd : n < 3 ? 0xffe98a : n < 6 ? 0xffd04a : n < 12 ? 0xff9f3d : 0xff5a6e)
        notes.setColorAt(i, col)
        if (date === best) {
          for (let j = 0; j < 6; j++) {
            const s = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.09), new THREE.MeshBasicMaterial({ color: j % 2 ? 0xff5a6e : 0xffd04a, toneMapped: false, side: THREE.DoubleSide }))
            s.position.set(dummy.position.x + 0.02 + j * 0.03, dummy.position.y - 0.05 - j * 0.07, 0.03 + j * 0.01)
            s.rotation.set(0.2, 0.1 * j, -0.3 + j * 0.25)
            extra.add(s)
          }
        }
      })
      dummy.scale.set(1, 1, 1)
      notes.count = days.length
      notes.instanceMatrix.needsUpdate = true
      if (notes.instanceColor) notes.instanceColor.needsUpdate = true
    },
    destroy() {
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('pointerleave', onLeave)
      scene.traverse((o) => { o.geometry?.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { x.map?.dispose(); x.dispose() }) })
      renderer.dispose()
    },
  }
}
