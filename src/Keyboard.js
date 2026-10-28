// The KEYCAP scene: one WebGL mechanical keyboard plus a contribution heatmap made of keys.
// Lazy-loaded after first paint. Driven by gsap.ticker, so the page has a single rAF loop.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const damp = (x, t, k, dt) => x + (t - x) * (1 - Math.exp(-dt * k))
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const MONO = '"JetBrains Mono", ui-monospace, monospace'

const K = (code, label, w = 1, kind) => ({ code, label, w, kind })
const row = (s, kind) => [...s].map((c) => K((/\d/.test(c) ? 'Digit' : 'Key') + c, c, 1, kind))
export const ROWS = [
  [K('Escape', 'esc', 1, 'mod'), { gap: 0.5 }, ...[1, 2, 3, 4].map((n) => K('F' + n, 'F' + n, 1, 'fx')), { gap: 0.25 },
    K('F5', 'F5', 1, 'fx'), ...[6, 7, 8].map((n) => K('F' + n, 'F' + n, 1, 'mod')), { gap: 0.25 },
    ...[9, 10, 11, 12].map((n) => K('F' + n, 'F' + n, 1, 'mod'))],
  [K('Backquote', '`'), ...row('1234567890'), K('Minus', '-'), K('Equal', '='), K('Backspace', 'ctrl+z', 2, 'mod')],
  [K('Tab', 'tab', 1.5, 'mod'), ...row('QWERTYUIOP'), K('BracketLeft', '['), K('BracketRight', ']'), K('Backslash', '\\', 1.5, 'mod')],
  [K('CapsLock', 'caps', 1.75, 'mod'), ...row('ASDFGHJKL'), K('Semicolon', ';'), K('Quote', "'"), K('Enter', 'send', 2.25, 'send')],
  [K('ShiftLeft', 'shift', 2.25, 'mod'), ...row('ZXCVBNM'), K('Comma', ','), K('Period', '.'), K('Slash', '/'), K('ShiftRight', 'shift', 2.75, 'mod')],
  [K('ControlLeft', 'ctrl', 1.25, 'mod'), K('MetaLeft', 'win', 1.25, 'mod'), K('AltLeft', 'alt', 1.25, 'mod'), K('Space', '', 6.25, 'space'),
    K('AltRight', 'alt', 1.25, 'mod'), K('MetaRight', 'fn', 1.25, 'mod'), K('ContextMenu', 'menu', 1.25, 'mod'), K('ControlRight', 'ctrl', 1.25, 'mod')],
]
// Numpad digits map onto the 3x3 app pad the way a real numpad is laid out.
export const NUMPAD = ['Numpad7', 'Numpad8', 'Numpad9', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad1', 'Numpad2', 'Numpad3']
const APP_COLORS = ['#ff6b5e', '#ffb648', '#e9ff5c', '#59ffae', '#5ce6ff', '#6f8dff', '#b27dff', '#ff72d6', '#f4f1ea']
const TRAVEL = 0.2
const ROW_Z = (r) => (r === 0 ? 0 : 0.35 + r)
const OX = -9.3
const OZ = -2.675

function legendAtlas() {
  const c = document.createElement('canvas')
  c.width = c.height = 2048
  const g = c.getContext('2d')
  let slot = 0
  const draw = (text, { px = 58, color = '#fff', sub = '', weight = 600 } = {}) => {
    const i = slot++
    const x = (i % 16) * 128
    const y = Math.floor(i / 16) * 128
    g.fillStyle = color
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `${weight} ${px}px ${MONO}`
    g.fillText(text, x + 64, y + (sub ? 50 : 64), 118)
    if (sub) {
      g.globalAlpha = 0.75
      g.font = `500 19px ${MONO}`
      g.fillText(sub, x + 64, y + 96, 118)
      g.globalAlpha = 1
    }
    return i
  }
  const geo = (i, s) => {
    const p = new THREE.PlaneGeometry(s, s)
    p.rotateX(-Math.PI / 2)
    const uv = p.attributes.uv
    const u0 = (i % 16) / 16
    const v0 = 1 - (Math.floor(i / 16) + 1) / 16
    for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) / 16, v0 + uv.getY(k) / 16)
    return p
  }
  return { canvas: c, draw, geo }
}

function gradientTexture(stops, w = 512, h = 8) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  const lg = g.createLinearGradient(0, 0, w, 0)
  stops.forEach((s, i) => lg.addColorStop(i / (stops.length - 1), s))
  g.fillStyle = lg
  g.fillRect(0, 0, w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function radialTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  rg.addColorStop(0, 'rgba(120,230,255,0.55)')
  rg.addColorStop(0.45, 'rgba(150,110,255,0.18)')
  rg.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = rg
  g.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

/**
 * createKeyboard(canvas, { apps, days, bestDay, lite, calm, onProgress, onApp, onSend, onResume, onDay, onPress })
 * Returns the scene API used by App.jsx.
 */
export async function createKeyboard(canvas, opts) {
  const { apps, days, bestDay, lite, calm } = opts
  const tick = () => new Promise((r) => setTimeout(r, 0))
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, powerPreference: 'high-performance', alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor(0x07080c, 1)

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x07080c, 30, 70)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 120)
  const key = new THREE.DirectionalLight(0xffffff, 1.4)
  key.position.set(-6, 14, 8)
  scene.add(key)
  const under1 = new THREE.PointLight(0x5ce6ff, 30, 14, 1.6)
  under1.position.set(-6, 0.5, 2.5)
  const under2 = new THREE.PointLight(0xa679ff, 30, 14, 1.6)
  under2.position.set(6, 0.5, 2.5)
  scene.add(under1, under2)

  // ---------- materials ----------
  const glass = lite
    ? new THREE.MeshPhysicalMaterial({ color: 0xdff6ff, roughness: 0.12, metalness: 0, transparent: true, opacity: 0.62, clearcoat: 1, iridescence: 0.6, envMapIntensity: 1.4 })
    : new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.06, metalness: 0, transmission: 1, thickness: 0.7, ior: 1.45,
      iridescence: 0.7, iridescenceIOR: 1.3, clearcoat: 1, clearcoatRoughness: 0.05, attenuationColor: new THREE.Color(0xbdefff), attenuationDistance: 2.4, envMapIntensity: 1.3 })
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe8edf3, metalness: 1, roughness: 0.1, envMapIntensity: 1.6 })
  const fxMat = new THREE.MeshStandardMaterial({ color: 0xffd9a0, metalness: 1, roughness: 0.18, emissive: 0x3a2405, envMapIntensity: 1.5 })
  const sendMat = new THREE.MeshStandardMaterial({ color: 0x7cf5ff, metalness: 0.9, roughness: 0.15, emissive: 0x0c3b44, envMapIntensity: 1.5 })
  const ghost = new THREE.MeshBasicMaterial({ color: 0x9d8cff, wireframe: true, transparent: true, opacity: 0.35 })
  const appMats = APP_COLORS.map((c) => (lite
    ? new THREE.MeshStandardMaterial({ color: c, roughness: 0.2, metalness: 0.1, emissive: new THREE.Color(c).multiplyScalar(0.25), transparent: true, opacity: 0.85 })
    : new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.1, transmission: 0.55, thickness: 0.6, clearcoat: 1, emissive: new THREE.Color(c).multiplyScalar(0.22), envMapIntensity: 1.2 })))

  // ---------- board ----------
  const board = new THREE.Group()
  scene.add(board)
  const caseMat = new THREE.MeshStandardMaterial({ color: 0x14161c, metalness: 0.85, roughness: 0.38 })
  const kcase = new THREE.Mesh(new RoundedBoxGeometry(20, 0.6, 7.3, 4, 0.28), caseMat)
  kcase.position.set(0.0, 0, 0)
  board.add(kcase)
  const glowTex = gradientTexture(['#5ce6ff', '#6f8dff', '#b27dff', '#ff72d6', '#5ce6ff'])
  const plateMat = new THREE.MeshBasicMaterial({ map: glowTex, toneMapped: false })
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(19.2, 6.6), plateMat)
  plate.rotation.x = -Math.PI / 2
  plate.position.y = 0.305
  board.add(plate)
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(40, 18), new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
  spill.rotation.x = -Math.PI / 2
  spill.position.y = -0.31
  board.add(spill)

  const atlas = legendAtlas()
  const geos = new Map()
  const capGeo = (w) => {
    if (!geos.has(w)) geos.set(w, new RoundedBoxGeometry(w - 0.1, 0.5, 0.9, 3, 0.11))
    return geos.get(w)
  }
  const keys = []
  const byCode = new Map()
  const legendMeshes = []
  const addKey = (spec, x, z, mat) => {
    const mesh = new THREE.Mesh(capGeo(spec.w), mat)
    const restY = 0.62
    mesh.position.set(x + spec.w / 2 + OX, restY, z + OZ)
    board.add(mesh)
    if (spec.label || spec.sub) {
      const big = spec.label.length <= 2
      const i = atlas.draw(spec.label, { px: spec.px || (big ? 60 : 34), color: spec.color || '#ffffff', sub: spec.sub })
      const lm = new THREE.Mesh(atlas.geo(i, 0.78), legendMat)
      lm.position.y = 0.252
      if (!big && spec.w > 1) lm.position.x = -(spec.w - 1) / 2 + 0.05
      mesh.add(lm)
      legendMeshes.push(lm)
    }
    const k = { ...spec, mesh, restY, pos: 0, vel: 0, target: 0, release: 0, lift: 0, liftT: 0, drop: 0, delay: 0, base: mat }
    keys.push(k)
    byCode.set(spec.code, k)
    return k
  }
  const legendTex = new THREE.CanvasTexture(atlas.canvas)
  legendTex.colorSpace = THREE.SRGBColorSpace
  legendTex.anisotropy = renderer.capabilities.getMaxAnisotropy()
  const legendMat = new THREE.MeshBasicMaterial({ map: legendTex, transparent: true, depthWrite: false, toneMapped: false })

  const total = ROWS.flat().filter((k) => k.code).length + 9 + 4
  let built = 0
  for (let r = 0; r < ROWS.length; r++) {
    let x = 0
    for (const spec of ROWS[r]) {
      if (spec.gap) { x += spec.gap; continue }
      const mat = spec.kind === 'mod' ? chrome : spec.kind === 'fx' ? fxMat : spec.kind === 'send' ? sendMat : glass
      if (spec.kind === 'fx' || spec.kind === 'mod' || spec.kind === 'send') spec.color = spec.kind === 'mod' ? '#1b1f27' : '#2a1a04'
      if (spec.kind === 'send') { spec.color = '#06262c'; spec.label = 'send ⏎' }
      addKey(spec, x, ROW_Z(r), mat)
      x += spec.w
      built++
    }
    opts.onProgress?.(built, total)
    await tick()
  }
  // the app pad: nine coloured keys, one per app
  const appKeys = apps.map((a, i) => {
    const k = addKey({ code: 'App' + i, label: a.legend, sub: a.short, w: 1, px: 38, color: i === 8 ? '#14161c' : '#0b0c10', app: i }, 15.6 + (i % 3), ROW_Z(1 + Math.floor(i / 3)), appMats[i])
    built++
    return k
  })
  NUMPAD.forEach((c, i) => byCode.set(c, appKeys[i]))
  ;[['ArrowUp', '↑', 16.6, 4], ['ArrowLeft', '←', 15.6, 5], ['ArrowDown', '↓', 16.6, 5], ['ArrowRight', '→', 17.6, 5]].forEach(([code, label, x, r]) => {
    addKey({ code, label, w: 1, kind: 'mod', color: '#1b1f27' }, x, ROW_Z(r), chrome)
    built++
  })
  opts.onProgress?.(built, total)

  // the hidden résumé key, raised by the Phantom shortcut
  const cvLegend = atlas.draw('CV', { px: 58, color: '#120b2a', sub: 'résumé' })
  const cv = new THREE.Mesh(capGeo(1.6), new THREE.MeshStandardMaterial({ color: 0xc9bdff, metalness: 1, roughness: 0.08, emissive: 0x2a1a66 }))
  const cvL = new THREE.Mesh(atlas.geo(cvLegend, 0.85), legendMat)
  cvL.position.y = 0.252
  cv.add(cvL)
  cv.position.set(0, -1.2, OZ + ROW_Z(3))
  cv.visible = false
  board.add(cv)

  // ---------- heatmap: one key per contribution day ----------
  const heat = new THREE.Group()
  heat.position.set(0, 0, -21)
  scene.add(heat)
  const cellGeo = new RoundedBoxGeometry(0.5, 1, 0.5, 2, 0.08)
  cellGeo.translate(0, 0.5, 0)
  const cellMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.4, roughness: 0.25, envMapIntensity: 1.1 })
  cellMat.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\n totalEmissiveRadiance += vColor.rgb * 0.55;\n#endif')
  }
  const cells = new THREE.InstancedMesh(cellGeo, cellMat, days.length)
  const firstDow = new Date(days[0][0] + 'T00:00:00Z').getUTCDay()
  const cellInfo = days.map(([date, count], i) => {
    const n = i + firstDow
    return { date, count, week: Math.floor(n / 7), dow: n % 7, h: count ? 0.18 + Math.sqrt(count / 60) * 2.4 : 0.08 }
  })
  const weeks = cellInfo[cellInfo.length - 1].week + 1
  const col = new THREE.Color()
  const cold = new THREE.Color(0x5ce6ff)
  const hot = new THREE.Color(0xfff3c4)
  cellInfo.forEach((c, i) => {
    if (!c.count) col.setRGB(0.06, 0.07, 0.09)
    else col.copy(cold).lerp(hot, Math.sqrt(c.count / 60))
    if (c.date === bestDay.date) col.set(0xffffff)
    cells.setColorAt(i, col)
  })
  heat.add(cells)
  const heatBase = new THREE.Mesh(new RoundedBoxGeometry(1, 0.3, 1, 2, 0.1), caseMat)
  heat.add(heatBase)
  // the best day is the worn-out spacebar
  const spaceLegend = atlas.draw('60', { px: 60, color: '#0d0f14', sub: bestDay.date })
  const spaceMat = new THREE.MeshStandardMaterial({ color: 0xf1e6d0, metalness: 0.95, roughness: 0.42, emissive: 0x332611, envMapIntensity: 1.3 })
  const spacebar = new THREE.Mesh(new RoundedBoxGeometry(6, 0.55, 1.1, 3, 0.14), spaceMat)
  const spL = new THREE.Mesh(atlas.geo(spaceLegend, 1.05), legendMat)
  spL.position.y = 0.28
  spacebar.add(spL)
  heat.add(spacebar)
  let portrait = false
  const cellPos = (c) => (portrait
    ? [(c.dow - 3) * 0.62, (c.week - (weeks - 1) / 2) * 0.62]
    : [(c.week - (weeks - 1) / 2) * 0.62, (c.dow - 3) * 0.62])
  const layoutHeat = () => {
    const w = portrait ? 7 * 0.62 + 0.6 : weeks * 0.62 + 0.6
    const d = portrait ? weeks * 0.62 + 0.6 : 7 * 0.62 + 0.6
    heatBase.scale.set(w, 1, d)
    heatBase.position.y = -0.15
    spacebar.position.set(0, 0.28, d / 2 + 1.3)
  }
  legendTex.needsUpdate = true
  await tick()

  // ---------- state ----------
  const dummy = new THREE.Object3D()
  const cam = { pos: new THREE.Vector3(0, 30, 30), look: new THREE.Vector3(0, 0, 0) }
  const goal = { pos: new THREE.Vector3(), look: new THREE.Vector3() }
  const state = { shot: 'hero', t: 0, heroT: 0, yaw: -0.32, tilt: 0, px: 0, py: 0, ppx: 0, ppy: 0, level: 0, rise: 0, riseT: 0, active: true, alpha: 1,
    phantom: false, cvY: -1.2, hoverApp: -1, focusFx: -1, started: false, t0: 0, time: 0, lastBeat: 0, prevLevel: 0 }
  let analyser = null
  let freq = null
  let hovered = null
  let hoverDay = -1
  let pointer = null
  let pointerDirty = false
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const fxKeys = ['F1', 'F2', 'F3', 'F4', 'F5'].map((c) => byCode.get(c))
  const enterKey = byCode.get('Enter')
  const glassKeys = keys.filter((k) => k.base === glass)

  const v = (x, y, z) => goal.pos.set(x, y, z)
  const fit = () => (camera.aspect < 1.2 ? Math.min(2.3, 1.45 / camera.aspect) : 1)
  const SHOT = {
    hero: () => { const f = fit(); const lx = camera.aspect > 1.2 ? -4.2 : 0; v(lx, 15 * f - state.heroT * 3, 16.5 * f - state.heroT * 5); goal.look.set(lx, 0, 0.6) },
    apps: () => { const f = Math.min(1.6, fit()); v(7.3 + 2.2, 7.2 * f, 6.2 * f); goal.look.set(7.3, 0.4, -0.3) },
    exp: () => {
      const f = Math.min(1.5, fit())
      const s = state.t * 4
      const a = fxKeys[Math.floor(s)] || fxKeys[4]
      const b = fxKeys[Math.min(4, Math.floor(s) + 1)]
      const fx = THREE.MathUtils.lerp(a.mesh.position.x, b.mesh.position.x, s - Math.floor(s))
      v(fx + 1.5, 10 * f, OZ + 7 * f)
      goal.look.set(fx + 1.5, 0, OZ - 3)
    },
    numbers: () => { const f = fit(); v(0.01, 22 * f, 3); goal.look.set(0, 0, 0) },
    github: () => {
      if (portrait) { v(0, 30 * Math.min(1.25, fit() / 1.6), -21 + 9); goal.look.set(0, 0, -21) } else { const f = fit(); v(0, 20 * f, -21 + 15 * f); goal.look.set(0, 0, -20.2) }
    },
    send: () => { const p = enterKey.mesh.position; const f = Math.min(1.5, fit()); v(p.x + 2.4, 5.2 * f, p.z + 5.5 * f); goal.look.set(p.x, 0.4, p.z) },
  }

  const press = (k, hold = false, depth = 1) => {
    if (!k) return
    k.target = depth
    k.release = hold ? Infinity : state.time + 0.09
  }
  const up = (k) => { if (k) { k.target = 0; k.release = 0 } }

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    portrait = camera.aspect < 0.9
    layoutHeat()
    state.riseDirty = true
  }
  resize()
  window.addEventListener('resize', resize)

  const onMove = (e) => {
    pointer = { x: e.clientX, y: e.clientY, target: e.target }
    pointerDirty = true
    if (e.pointerType === 'mouse') {
      state.ppx = (e.clientX / window.innerWidth) * 2 - 1
      state.ppy = (e.clientY / window.innerHeight) * 2 - 1
    }
  }
  const onClick = () => {
    if (!hovered) return
    if (hovered.app !== undefined) { press(hovered); opts.onPress?.(hovered); opts.onApp?.(hovered.app); return }
    if (hovered === enterKey) { press(hovered); opts.onPress?.(hovered); opts.onSend?.(); return }
    if (hovered === 'cv') { opts.onResume?.(); return }
    press(hovered)
    opts.onPress?.(hovered)
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  canvas.addEventListener('click', onClick)
  const pickables = [...keys.map((k) => k.mesh), cv, cells]

  function pick() {
    pointerDirty = false
    let next = null
    let day = -1
    if (pointer && pointer.target === canvas) {
      ndc.set((pointer.x / window.innerWidth) * 2 - 1, -(pointer.y / window.innerHeight) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const hit = ray.intersectObjects(pickables, false)[0]
      if (hit) {
        if (hit.object === cells) day = hit.instanceId
        else if (hit.object === cv) next = cv.visible ? 'cv' : null
        else next = keys.find((k) => k.mesh === hit.object) || null
      }
    }
    if (next !== hovered) {
      hovered = next
      const clickable = next && (next === 'cv' || next.app !== undefined || next === enterKey)
      canvas.style.cursor = next ? (clickable ? 'pointer' : 'grab') : ''
      opts.onHoverKey?.(next && next !== 'cv' ? next : null)
    }
    if (day !== hoverDay) { hoverDay = day; opts.onDay?.(day >= 0 ? cellInfo[day] : null) }
  }

  function assembleAt(k, t) {
    // keys fall into the case in a wave from left to right
    const p = clamp01((t - k.delay) / 0.75)
    if (p < 1) {
      const e = 1 - Math.pow(1 - p, 3)
      k.drop = (1 - e) * 7
      k.mesh.rotation.set((1 - e) * k.spinX, 0, (1 - e) * k.spinZ)
      return false
    }
    if (k.drop !== 0) { k.drop = 0; k.mesh.rotation.set(0, 0, 0); k.vel = -6 }
    return true
  }

  let assembling = false
  keys.forEach((k) => {
    k.delay = ((k.mesh.position.x - OX) / 19) * 1.6 + Math.random() * 0.45
    k.spinX = (Math.random() - 0.5) * 1.6
    k.spinZ = (Math.random() - 0.5) * 1.6
    k.drop = 7
    k.mesh.visible = false
  })

  const api = {
    renderer,
    keyCount: keys.length,
    assemble() {
      if (state.started) return
      state.started = true
      state.t0 = state.time
      keys.forEach((k) => { k.mesh.visible = true })
      if (calm) keys.forEach((k) => { k.drop = 0; k.delay = -1 })
      else assembling = true
    },
    down(code) { const k = byCode.get(code); press(k, true); return k },
    up(code) { up(byCode.get(code)) },
    tap(code, depth) { const k = byCode.get(code); press(k, false, depth); return k },
    shot(name, t) { if (name) state.shot = name; if (t !== undefined) state.t = t },
    hero(t) { state.heroT = t },
    focusApp(i) { state.hoverApp = i },
    setActive(on) { state.active = on; canvas.style.opacity = on ? '1' : '0' },
    setAnalyser(a) { analyser = a; freq = new Uint8Array(a.frequencyBinCount) },
    phantom(on) {
      state.phantom = on
      keys.forEach((k) => { k.mesh.material = on ? ghost : k.base })
      legendMeshes.forEach((m) => { m.visible = !on })
      cv.visible = true
      plateMat.color.set(on ? 0x9d8cff : 0xffffff)
    },
    compile() { renderer.compile(scene, camera) },
    tick(dt) {
      dt = Math.min(dt, 1 / 30)
      state.time += dt
      if (!state.active || document.hidden) return
      // music: bass level drives the underglow, and strong beats tap a random glass key
      let level = 0
      if (analyser) {
        analyser.getByteFrequencyData(freq)
        for (let i = 1; i < 8; i++) level += freq[i]
        level = level / (7 * 255)
      }
      state.level = damp(state.level, level, 14, dt)
      if (!calm && analyser && level - state.prevLevel > 0.06 && level > 0.45 && state.time - state.lastBeat > 0.28) {
        state.lastBeat = state.time
        press(glassKeys[(Math.random() * glassKeys.length) | 0], false, 0.6)
      }
      state.prevLevel = damp(state.prevLevel, level, 6, dt)
      const glow = 0.3 + state.level * 1.1
      if (!state.phantom) plateMat.color.setScalar(glow)
      under1.intensity = under2.intensity = 18 + state.level * 60

      // camera
      ;(SHOT[state.shot] || SHOT.hero)()
      const kc = calm ? 1000 : 3.2
      state.px = damp(state.px, calm ? 0 : state.ppx, 4, dt)
      state.py = damp(state.py, calm ? 0 : state.ppy, 4, dt)
      goal.pos.x += state.px * 0.9
      goal.pos.y += -state.py * 0.6
      cam.pos.x = damp(cam.pos.x, goal.pos.x, kc, dt)
      cam.pos.y = damp(cam.pos.y, goal.pos.y, kc, dt)
      cam.pos.z = damp(cam.pos.z, goal.pos.z, kc, dt)
      cam.look.x = damp(cam.look.x, goal.look.x, kc, dt)
      cam.look.y = damp(cam.look.y, goal.look.y, kc, dt)
      cam.look.z = damp(cam.look.z, goal.look.z, kc, dt)
      camera.position.copy(cam.pos)
      camera.lookAt(cam.look)
      const yawGoal = state.shot === 'hero' ? -0.3 + state.heroT * 0.42 : 0
      state.yaw = damp(state.yaw, yawGoal, calm ? 1000 : 3, dt)
      board.rotation.y = state.yaw
      board.position.y = state.level * 0.12

      // keys
      const at = state.time - state.t0
      let done = true
      const fxOn = state.shot === 'exp' ? Math.min(4, Math.round(state.t * 4)) : -1
      for (const k of keys) {
        if (assembling && !assembleAt(k, at)) { done = false; k.mesh.position.y = k.restY + k.drop; continue }
        if (k.release && state.time > k.release) { k.target = 0; k.release = 0 }
        // a stiff spring: quick travel, a little bounce on the way back up
        const f = (k.target * TRAVEL - k.pos) * 900 - k.vel * 34
        k.vel += f * dt
        k.pos += k.vel * dt
        let liftT = 0
        if (k === hovered) liftT = 0.06
        if (k.app !== undefined && (state.hoverApp === k.app || (state.shot === 'apps' && !calm))) liftT = state.hoverApp === k.app ? 0.3 : 0.04 + 0.04 * Math.sin(state.time * 2.4 + k.app)
        if (fxOn >= 0 && k === fxKeys[fxOn]) liftT = 0.38
        if (k === enterKey && state.shot === 'send') liftT = 0.16 + 0.05 * Math.sin(state.time * 3)
        k.lift = damp(k.lift, liftT, calm ? 1000 : 10, dt)
        k.mesh.position.y = k.restY - k.pos + k.lift
      }
      if (assembling && done) assembling = false
      state.cvY = damp(state.cvY, state.phantom ? 1.5 + Math.sin(state.time * 2) * 0.12 : -1.2, calm ? 1000 : 4, dt)
      cv.position.y = state.cvY
      cv.rotation.y = state.phantom ? state.time * 0.8 : 0
      if (!state.phantom && state.cvY < -1.1) cv.visible = false

      // heatmap rises when the GitHub shot is on, one week at a time
      const riseGoal = state.shot === 'github' || calm ? 1 : 0
      const r0 = state.rise
      state.rise = damp(state.rise, riseGoal, riseGoal ? 1.1 : 3, dt)
      if (Math.abs(state.rise - r0) > 1e-4 || state.riseDirty) {
        state.riseDirty = false
        for (let i = 0; i < cellInfo.length; i++) {
          const c = cellInfo[i]
          const w = c.week / weeks
          const p = calm ? 1 : clamp01((state.rise * 1.6 - w * 0.6))
          const [x, z] = cellPos(c)
          dummy.position.set(x, 0, z)
          dummy.scale.set(1, Math.max(0.02, c.h * p), 1)
          dummy.updateMatrix()
          cells.setMatrixAt(i, dummy.matrix)
        }
        cells.instanceMatrix.needsUpdate = true
      }
      spaceMat.emissiveIntensity = 1 + Math.sin(state.time * 2.2) * 0.5 + state.level * 2
      spacebar.position.y = 0.28 + 0.1 * Math.max(0, Math.sin(state.time * 2.2)) * state.rise

      if (pointerDirty || (hovered && hovered !== 'cv')) pick()
      renderer.render(scene, camera)
    },
    destroy() {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('click', onClick)
      renderer.dispose()
    },
  }
  return api
}
