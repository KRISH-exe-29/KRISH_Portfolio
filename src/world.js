// GLASSHOUSE: one painted landscape, real refractive glass in front of it.
// Lazy-loaded. The page owns the only loop and calls world.tick(dt) from it.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const FOV = 35
const BGZ = -7000
const PANE_GAP = 1100
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-dt * k))
const clamp01 = (v) => Math.min(1, Math.max(0, v))

const loadTex = (url) => new Promise((res, rej) => new THREE.TextureLoader().load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; res(t) }, undefined, rej))

// The painted world. Cover-fit, grass sways, clouds breathe, the day goes golden as you scroll.
const BG_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'
const BG_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uTex; uniform float uImg, uPlane, uTime, uDusk, uBass; uniform vec2 uPtr;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 uv = vUv - 0.5;
  if (uPlane > uImg) uv.y *= uImg / uPlane; else uv.x *= uPlane / uImg;
  uv *= 0.94;
  uv += uPtr * vec2(-0.014, 0.01);
  float ground = smoothstep(-0.08, -0.16, uv.y);
  float sky = smoothstep(-0.02, 0.2, uv.y);
  uv.x += ground * 0.004 * sin(uv.y * 70.0 + uTime * 1.6 + uv.x * 9.0);
  uv.x += sky * 0.006 * sin(uTime * 0.07 + uv.y * 3.0);
  uv.y += sky * 0.003 * sin(uTime * 0.11 + uv.x * 5.0);
  vec3 c = texture2D(uTex, uv + 0.5).rgb;
  // painted: lift the shadows, soften the greens a touch
  c = mix(c, vec3(dot(c, vec3(0.33))), 0.08);
  c = pow(c, vec3(0.95));
  // golden hour
  vec3 warm = c * vec3(1.18, 0.86, 0.68) + vec3(0.06, 0.02, 0.0) * (1.0 - ground);
  c = mix(c, warm, uDusk * 0.75);
  c *= 1.0 + uBass * 0.07;
  vec2 q = vUv - 0.5;
  c *= 1.0 - dot(q, q) * 0.55;
  c += (hash(vUv * 900.0 + uTime) - 0.5) * 0.025;
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`

// Inflatable type: height = blurred glyphs, normals from its slope, a pearly balloon light.
const TYPE_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uH; uniform vec2 uTexel; uniform float uInflate; uniform vec2 uLight; uniform vec3 uTint;
float h(vec2 p){ return texture2D(uH, p).r; }
void main(){
  float v = h(vUv);
  float edge = mix(0.96, 0.4, uInflate);
  if (v < edge) discard;
  vec2 e = uTexel * 3.0;
  float dx = h(vUv + vec2(e.x, 0.0)) - h(vUv - vec2(e.x, 0.0));
  float dy = h(vUv + vec2(0.0, e.y)) - h(vUv - vec2(0.0, e.y));
  float dome = 1.0 - smoothstep(edge, 1.0, v);
  vec3 n = normalize(vec3(-dx * 5.0, -dy * 5.0, 0.35 + (1.0 - dome) * 0.65));
  vec3 L = normalize(vec3(uLight, 0.9));
  float dif = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 38.0);
  float rim = pow(1.0 - n.z, 2.0);
  vec3 base = vec3(0.97, 0.96, 0.93);
  vec3 col = mix(uTint, base, 0.35 + dif * 0.65);
  col += spec * 0.9 + rim * vec3(0.35, 0.5, 0.75) * 0.5;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`

function glass(small, o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 1,
    thickness: o.thickness ?? 80,
    roughness: o.roughness ?? 0.03,
    ior: 1.45,
    dispersion: small ? 0 : (o.dispersion ?? 2.5),
    attenuationColor: new THREE.Color('#eafff4'),
    attenuationDistance: 1600,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 0.9,
  })
}

// Ripples the slab toward a local point. Displaces z and bends the face normals to match.
function liquid(material, u) {
  material.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u)
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>
uniform float uT, uAmp, uIdle; uniform vec2 uP;
float rip(vec3 p){
  float d = distance(p.xy, uP);
  float r = uAmp * sin(d * 0.032 - uT * 4.2) * exp(-d * 0.0045);
  r += uIdle * sin(p.x * 0.007 + uT * 1.1) * sin(p.y * 0.011 + uT * 0.8);
  return r * smoothstep(0.0, 1.0, abs(p.z) / 30.0);
}`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
{ float h0 = rip(position); vec2 g = vec2(rip(position + vec3(3.0, 0.0, 0.0)) - h0, rip(position + vec3(0.0, 3.0, 0.0)) - h0) / 3.0;
  objectNormal = normalize(objectNormal - vec3(g * objectNormal.z * 1.6, 0.0)); }`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += rip(position);')
  }
}

async function typeTexture(lines) {
  try { await document.fonts.load('600 200px Fraunces') } catch { /* system serif then */ }
  const size = 220
  const c = document.createElement('canvas')
  const g = c.getContext('2d')
  g.font = `600 ${size}px Fraunces, Georgia, serif`
  const w = Math.max(...lines.map((l) => g.measureText(l).width))
  const pad = size * 0.4
  c.width = Math.ceil(w + pad * 2)
  c.height = Math.ceil(lines.length * size * 1.02 + pad * 2)
  g.fillStyle = '#000'
  g.fillRect(0, 0, c.width, c.height)
  g.filter = `blur(${size * 0.07}px)`
  g.font = `600 ${size}px Fraunces, Georgia, serif`
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  lines.forEach((l, i) => g.fillText(l, c.width / 2, pad + size * 0.52 + i * size * 1.02))
  // thicken the glyph strokes before the blur so the balloons are plump
  g.lineWidth = size * 0.05
  g.strokeStyle = '#fff'
  g.lineJoin = 'round'
  lines.forEach((l, i) => g.strokeText(l, c.width / 2, pad + size * 0.52 + i * size * 1.02))
  const t = new THREE.CanvasTexture(c)
  t.minFilter = THREE.LinearFilter
  return { tex: t, aspect: c.width / c.height, texel: new THREE.Vector2(1 / c.width, 1 / c.height) }
}

function cardTexture(title, sub) {
  const c = document.createElement('canvas')
  c.width = 640; c.height = 800
  const g = c.getContext('2d')
  const grd = g.createLinearGradient(0, 0, 0, 800)
  grd.addColorStop(0, '#f6efe2'); grd.addColorStop(1, '#d9e6d2')
  g.fillStyle = grd; g.fillRect(0, 0, 640, 800)
  g.fillStyle = '#16241c'
  g.font = '600 96px Fraunces, Georgia, serif'
  g.textAlign = 'center'
  title.split('\n').forEach((l, i) => g.fillText(l, 320, 380 + i * 104))
  g.font = '500 30px "Instrument Sans", system-ui, sans-serif'
  g.fillText(sub, 320, 600)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export async function createWorld(canvas, { small, bg, nameLines, panes }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2))
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.transmissionResolutionScale = small ? 0.5 : 0.8
  const scene = new THREE.Scene()
  const pm = new THREE.PMREMGenerator(renderer)
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
  pm.dispose()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 20000)
  const key = new THREE.DirectionalLight(0xffffff, 1.4)
  key.position.set(-400, 700, 900)
  scene.add(key)

  const bgTex = await loadTex(bg)
  const bgU = {
    uTex: { value: bgTex }, uImg: { value: bgTex.image.width / bgTex.image.height }, uPlane: { value: 1 },
    uTime: { value: 0 }, uDusk: { value: 0 }, uBass: { value: 0 }, uPtr: { value: new THREE.Vector2() },
  }
  const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: bgU, vertexShader: BG_VERT, fragmentShader: BG_FRAG, depthWrite: false }))
  bgMesh.position.z = BGZ
  bgMesh.renderOrder = -1
  scene.add(bgMesh)

  // ---- hero: name inside a liquid slab
  const hero = new THREE.Group()
  scene.add(hero)
  const type = await typeTexture(nameLines)
  const typeU = { uH: { value: type.tex }, uTexel: { value: type.texel }, uInflate: { value: 0 }, uLight: { value: new THREE.Vector2(-0.4, 0.6) }, uTint: { value: new THREE.Color('#8fb0d8') } }
  const typeMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: typeU, vertexShader: BG_VERT, fragmentShader: TYPE_FRAG }))
  hero.add(typeMesh)
  const slabU = { uT: { value: 0 }, uAmp: { value: 0 }, uIdle: { value: 7 }, uP: { value: new THREE.Vector2(9999, 9999) } }
  const slabMat = glass(small, { thickness: 150, dispersion: 4, roughness: 0.02 })
  liquid(slabMat, slabU)
  const slab = new THREE.Mesh(undefined, slabMat)
  hero.add(slab)

  // ---- tiles (apps etc.): plain glass, geometry per size
  const tileMat = glass(small, { thickness: 60, roughness: 0.08, dispersion: 2 })
  const geoCache = new Map()
  const boxGeo = (w, h, d, r) => {
    const k = `${Math.round(w)}x${Math.round(h)}x${d}`
    if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(w, h, d, small ? 3 : 5, r))
    return geoCache.get(k)
  }
  const tiles = [] // { el, mesh, top, left, w, h, rx, ry }

  // ---- experience: panes in depth, photos behind frosted glass
  const stage = new THREE.Group()
  stage.visible = false
  scene.add(stage)
  const paneList = await Promise.all(panes.map(async (p, i) => {
    const tex = p.photo ? await loadTex(p.photo).catch(() => cardTexture(p.title, p.sub)) : cardTexture(p.title, p.sub)
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }))
    const mat = glass(small, { thickness: 40, roughness: 0.6, dispersion: 1.5 })
    const pane = new THREE.Mesh(undefined, mat)
    const g = new THREE.Group()
    g.add(photo, pane)
    stage.add(g)
    return { g, photo, pane, mat, tex, i, clear: 0, img: tex.image }
  }))

  const S = {
    W: 1, H: 1, dist: 1, t: 0, intro: 0, introTarget: 0,
    ptr: new THREE.Vector2(), ptrPx: new THREE.Vector2(-9999, -9999), ptrS: new THREE.Vector2(), speed: 0,
    bass: 0, dusk: 0, stageEnabled: false, stageY: 99999, stageOn: false, stageP: 0, stageS: 0, hover: -1, dirty: true,
    heroEl: null, heroBox: null, scrollY: 0,
  }
  const ray = new THREE.Raycaster()

  function coverPhoto(p, pw, ph) {
    const iw = p.img?.width || 1, ih = p.img?.height || 1
    const a = (pw / ph) / (iw / ih)
    p.tex.repeat.set(a < 1 ? a : 1, a < 1 ? 1 : 1 / a)
    p.tex.offset.set((1 - p.tex.repeat.x) / 2, (1 - p.tex.repeat.y) / 2)
  }

  function layout() {
    const W = window.innerWidth, H = window.innerHeight
    S.W = W; S.H = H
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    S.dist = (H / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    camera.position.set(0, 0, S.dist)
    camera.far = S.dist - BGZ + 1000
    camera.updateProjectionMatrix()
    const vh = 2 * (S.dist - BGZ) * Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    bgMesh.scale.set(vh * camera.aspect, vh, 1)
    bgU.uPlane.value = camera.aspect
    // panes
    const pw = Math.min(W * (W < 720 ? 0.74 : 0.3), 460), ph = pw * 1.28
    paneList.forEach((p) => {
      p.pane.geometry?.dispose()
      p.pane.geometry = new RoundedBoxGeometry(pw, ph, 36, small ? 3 : 4, 22)
      p.photo.scale.set(pw * 0.9, ph * 0.9, 1)
      p.photo.position.z = -60
      coverPhoto(p, pw, ph)
      const side = W < 720 ? 0 : W * 0.17 + (p.i % 2 ? -50 : 50)
      p.g.position.set(side, W < 720 ? H * 0.08 : 0, -p.i * PANE_GAP)
    })
    S.dirty = true
  }

  // DOM anchors: document positions cached on measure(), y = top - scrollY per frame (no layout reads in the loop)
  function measure() {
    const sy = window.scrollY
    if (S.heroEl) {
      const r = S.heroEl.getBoundingClientRect()
      S.heroBox = { top: r.top + sy, left: r.left, w: r.width, h: r.height }
      const d = small ? 90 : 150
      slab.geometry?.dispose()
      slab.geometry = new RoundedBoxGeometry(r.width, r.height, d, small ? 8 : 16, Math.min(r.height * 0.3, 90))
      const fitW = r.width * 0.88, fitH = r.height * 0.8
      const tw = Math.min(fitW, fitH * type.aspect)
      typeMesh.scale.set(tw, tw / type.aspect, 1)
    }
    tiles.forEach((t) => {
      const r = t.el.getBoundingClientRect()
      Object.assign(t, { top: r.top + sy, left: r.left, w: r.width, h: r.height })
      t.mesh.geometry = boxGeo(r.width, r.height, 44, Math.min(28, r.width * 0.1))
    })
    S.dirty = true
  }

  function toScene(left, top, w, h, sy) {
    return [left + w / 2 - S.W / 2, S.H / 2 - (top - sy + h / 2)]
  }

  function tick(dt, scrollY) {
    S.t += dt
    const moved = scrollY !== S.scrollY
    S.scrollY = scrollY
    S.ptrS.x = damp(S.ptrS.x, S.ptr.x, 4, dt)
    S.ptrS.y = damp(S.ptrS.y, S.ptr.y, 4, dt)
    S.speed = damp(S.speed, 0, 2.5, dt)
    S.intro = damp(S.intro, S.introTarget, 1.6, dt)
    bgU.uTime.value = S.t
    bgU.uPtr.value.copy(S.ptrS)
    bgU.uDusk.value = damp(bgU.uDusk.value, S.dusk, 3, dt)
    bgU.uBass.value = S.bass

    // hero
    hero.visible = !!S.heroBox && S.heroBox.top + S.heroBox.h - scrollY > -S.H * 0.2
    if (hero.visible) {
      const b = S.heroBox
      const [x, y] = toScene(b.left, b.top, b.w, b.h, scrollY)
      const k = S.intro
      const leave = clamp01(scrollY / (S.H * 0.9))
      hero.position.set(x, y - (1 - k) * S.H * 0.55, 0)
      hero.rotation.x = damp(hero.rotation.x, -S.ptrS.y * 0.16 + (1 - k) * 0.9 - leave * 0.5, 5, dt)
      hero.rotation.y = damp(hero.rotation.y, S.ptrS.x * 0.2, 5, dt)
      typeU.uInflate.value = clamp01((k - 0.25) / 0.75)
      typeU.uLight.value.set(-0.4 + S.ptrS.x * 0.6, 0.6 + S.ptrS.y * 0.5)
      // ripple origin: the pointer, in slab-local px
      const lx = S.ptrPx.x - S.W / 2 - x, ly = S.H / 2 - S.ptrPx.y - y
      slabU.uP.value.x = damp(slabU.uP.value.x, lx, 10, dt)
      slabU.uP.value.y = damp(slabU.uP.value.y, ly, 10, dt)
      slabU.uT.value = S.t
      const pour = (1 - k) * 26
      slabU.uAmp.value = damp(slabU.uAmp.value, Math.min(18, S.speed * 0.02) + pour + S.bass * 10, 6, dt)
      slabU.uIdle.value = 5 + S.bass * 8
    }

    // tiles tilt toward the pointer and as they pass through the viewport
    let tilesShown = 0
    tiles.forEach((t) => {
      if (!t.w) { t.mesh.visible = false; return }
      const [x, y] = toScene(t.left, t.top, t.w, t.h, scrollY)
      t.mesh.visible = Math.abs(y) < S.H * 0.5 + t.h
      if (!t.mesh.visible) return
      tilesShown++
      t.mesh.position.set(x, y, -30)
      const px = S.ptrPx.x - S.W / 2 - x, py = S.H / 2 - S.ptrPx.y - y
      const near = Math.exp(-(px * px + py * py) / (2 * 260 * 260))
      t.rx = damp(t.rx || 0, (-py / 600) * near * 0.6 + (y / S.H) * 0.45, 6, dt)
      t.ry = damp(t.ry || 0, (px / 600) * near * 0.6, 6, dt)
      t.mesh.rotation.set(t.rx, t.ry, 0)
    })

    // experience panes: the row slides toward the camera as the pin scrubs
    S.stageOn = S.stageEnabled && Math.abs(S.stageY) < S.H * 1.05
    stage.visible = S.stageOn
    stage.position.y = -S.stageY
    if (S.stageOn) {
      S.stageS = damp(S.stageS, S.stageP, 8, dt)
      const n = paneList.length
      const f = S.stageS * (n - 1)
      stage.position.z = f * PANE_GAP
      let hit = -1
      if (S.ptrPx.x > -9000) {
        ray.setFromCamera(S.ptr, camera)
        const h = ray.intersectObjects(paneList.map((p) => p.pane), false)[0]
        if (h) hit = paneList.findIndex((p) => p.pane === h.object)
      }
      S.hover = hit
      paneList.forEach((p) => {
        const z = stage.position.z + p.g.position.z
        p.g.visible = z < S.dist * 0.55
        const focus = 1 - clamp01(Math.abs(p.i - f))
        const target = p.i === hit ? 1 : focus * 0.45
        p.clear = damp(p.clear, target, 6, dt)
        p.mat.roughness = 0.6 - p.clear * 0.58
        p.g.rotation.y = damp(p.g.rotation.y, (p.i % 2 ? 0.18 : -0.18) * (1 - focus) + S.ptrS.x * 0.08, 5, dt)
      })
    }

    const animating = hero.visible || S.stageOn || tilesShown > 0
    if (!animating && !moved && !S.dirty) return
    S.dirty = false
    renderer.render(scene, camera)
  }

  layout()
  return {
    tick,
    layout: () => { layout(); measure() },
    measure,
    setHero(el) { S.heroEl = el; measure() },
    addTiles(els) { els.forEach((el) => { const mesh = new THREE.Mesh(undefined, tileMat); mesh.visible = false; scene.add(mesh); tiles.push({ el, mesh }) }); measure() },
    pointer(px, py) {
      if (S.ptrPx.x > -9000) S.speed += Math.hypot(px - S.ptrPx.x, py - S.ptrPx.y)
      S.ptrPx.set(px, py)
      S.ptr.set((px / S.W) * 2 - 1, -(py / S.H) * 2 + 1)
    },
    leave() { S.ptrPx.set(-9999, -9999); S.ptr.set(0, 0) },
    start(instant) { S.introTarget = 1; if (instant) S.intro = 1 },
    set(o) { Object.assign(S, o) },
    hovered: () => S.hover,
    dispose() { renderer.dispose(); geoCache.forEach((g) => g.dispose()) },
  }
}
