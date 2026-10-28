// The darkroom: prints on drying lines in 3D depth, under a red safelight.
// Lazy-loaded so three.js never blocks the first paint. No rAF of its own:
// App drives tick() from gsap.ticker, so the page has one animation loop.
import * as THREE from 'three'

const vert = /* glsl */ `
uniform float uTime, uSway;
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec3 p = position;
  // wet paper: a soft curl that breathes with the sway
  p.z += sin(uv.y * 3.1416) * 0.03 + sin(uTime * 1.3 + uv.x * 4.0) * 0.012 * uSway * (1.0 - uv.y);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`

const frag = /* glsl */ `
uniform sampler2D uMap;
uniform float uDev, uFog, uTime, uSafe, uAudio, uAspect, uLoaded;
varying vec2 vUv;
varying float vDepth;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 m = vec2(0.055, 0.055 * uAspect);
  vec2 iuv = (vUv - m) / (1.0 - 2.0 * m);
  float inside = step(0.0, iuv.x) * step(iuv.x, 1.0) * step(0.0, iuv.y) * step(iuv.y, 1.0);
  vec3 img = texture2D(uMap, clamp(iuv, 0.0, 1.0)).rgb;
  float lum = dot(img, vec3(0.299, 0.587, 0.114));
  float g = hash(floor(vUv * vec2(380.0, 380.0 / uAspect)) + floor(uTime * 18.0));
  // shadows come up first, highlights last, with a chemical tide line from the bottom
  float tide = (1.0 - vUv.y) * 0.18 + sin(vUv.x * 9.0 + uTime * 0.7) * 0.03;
  float th = lum * 0.62 + tide + (g - 0.5) * 0.16;
  float amt = smoothstep(th, th + 0.28, uDev * 1.3) * inside * uLoaded;
  vec3 paper = vec3(0.95, 0.92, 0.86);
  vec3 col = mix(paper, img, amt);
  col += (g - 0.5) * 0.10 * (1.0 - 0.6 * amt);
  // white light ruins the print: it fogs to black from the edges in
  float edge = length(vUv - 0.5);
  float fog = smoothstep(0.0, 0.35, uFog * 1.5 - (0.7 - edge));
  col = mix(col, vec3(0.05, 0.045, 0.04) + (g - 0.5) * 0.05, fog);
  // under the safelight everything reads in red
  float l = dot(col, vec3(0.333));
  vec3 safe = vec3(1.0, 0.27, 0.16) * l * (0.95 + uAudio * 0.5);
  col = mix(col, safe, uSafe);
  col *= exp(-max(vDepth - 2.5, 0.0) * 0.14);
  gl_FragColor = vec4(col, 1.0);
}`

function textCanvas(lines) {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 640
  const x = c.getContext('2d')
  const gr = x.createLinearGradient(0, 0, 0, 640)
  gr.addColorStop(0, '#d8cfc2'); gr.addColorStop(1, '#9a8f84')
  x.fillStyle = gr; x.fillRect(0, 0, 512, 640)
  x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 2
  for (let i = 0; i < 14; i++) { x.beginPath(); x.moveTo(0, 60 + i * 44); x.lineTo(512, 40 + i * 44); x.stroke() }
  x.fillStyle = '#0a0908'; x.textAlign = 'center'
  lines.forEach((t, i) => {
    x.font = i === 0 ? 'italic 88px Georgia, serif' : '600 30px "Courier New", monospace'
    x.fillText(t, 256, i === 0 ? 300 : 360 + i * 46, 470)
  })
  return c
}

export function createDarkroom(canvas, { stations, decor, small }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.25 : 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  scene.background = new THREE.Color()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 60)
  const loader = new THREE.TextureLoader()
  const shared = { uTime: { value: 0 }, uSafe: { value: 1 }, uAudio: { value: 0 }, uFog: { value: 0 }, uSway: { value: 1 } }
  const prints = []
  const SPACING = 4.2
  let wide = true

  const wireMat = new THREE.LineBasicMaterial({ color: '#5a1a12' })
  const pinMat = new THREE.MeshBasicMaterial({ color: '#2a120c' })
  const pinGeo = new THREE.BoxGeometry(0.05, 0.16, 0.05)

  function addLine(z, y) {
    const pts = []
    for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector3(-5 + t * 10, y - Math.sin(t * Math.PI) * 0.12, z)) }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat)
    scene.add(line)
    return line
  }

  function addPrint({ src, lines }, x, z, maxSize, seed) {
    const uniforms = {
      ...shared, uMap: { value: null }, uDev: { value: 0 }, uAspect: { value: 1 }, uLoaded: { value: 0 },
    }
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 10, 14), mat)
    const holder = new THREE.Group() // pivot at the clothespins
    holder.add(mesh)
    const pins = [new THREE.Mesh(pinGeo, pinMat), new THREE.Mesh(pinGeo, pinMat)]
    pins.forEach((p) => holder.add(p))
    const fit = (aspect) => {
      const w = aspect >= 1 ? maxSize : maxSize * aspect
      const h = aspect >= 1 ? maxSize / aspect : maxSize
      mesh.scale.set(w, h, 1); mesh.position.y = -h / 2
      pins[0].position.set(-w * 0.32, 0, 0.02); pins[1].position.set(w * 0.32, 0, 0.02)
      uniforms.uAspect.value = w / h
    }
    fit(0.8)
    const done = (tex, aspect) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 4
      uniforms.uMap.value = tex; uniforms.uLoaded.value = 1
      fit(aspect)
    }
    if (src) loader.load(src, (t) => done(t, t.image.width / t.image.height))
    else done(new THREE.CanvasTexture(textCanvas(lines)), 0.8)
    holder.position.set(x, 0.8, z)
    scene.add(holder)
    const p = { holder, uniforms, x, z, seed, dev: 0, drop: 0 }
    prints.push(p)
    return p
  }

  stations.forEach((s, i) => {
    const z = -i * SPACING
    addLine(z, 0.82)
    s.print = addPrint(s, 0, z, 1.25, i)
    s.print.index = i
  })
  decor.forEach((d, i) => {
    const st = i % stations.length
    const z = -st * SPACING - 1.2 - (i % 3) * 0.7
    const side = i % 2 ? 1 : -1
    if (i % 2 === 0) addLine(z, 0.9)
    const p = addPrint(d, side * (2.1 + (i % 3) * 0.5), z, 0.85, i + 10)
    p.decor = true
    p.side = side
  })

  // dust in the light: drifts in depth
  const N = small ? 160 : 420
  const dust = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    dust[i * 3] = (Math.random() - 0.5) * 8
    dust[i * 3 + 1] = (Math.random() - 0.5) * 4
    dust[i * 3 + 2] = 3 - Math.random() * (stations.length * SPACING + 6)
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3))
  const motes = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: '#ff6a3d', size: 0.018, transparent: true, opacity: 0.55, depthWrite: false }))
  scene.add(motes)

  // the safelight itself, glowing at the far end
  const g = document.createElement('canvas'); g.width = g.height = 128
  const gx = g.getContext('2d')
  const rg = gx.createRadialGradient(64, 64, 0, 64, 64, 64)
  rg.addColorStop(0, 'rgba(255,90,50,1)'); rg.addColorStop(0.25, 'rgba(255,40,20,.45)'); rg.addColorStop(1, 'rgba(255,0,0,0)')
  gx.fillStyle = rg; gx.fillRect(0, 0, 128, 128)
  const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(g), depthWrite: false, transparent: true }))
  lamp.scale.set(6, 6, 1)
  lamp.position.set(0, 2.4, -stations.length * SPACING - 2)
  scene.add(lamp)

  // ---- state, all damped
  const s = { progress: 0, p: 0, px: 0, py: 0, tx: 0, ty: 0, intro: 0, level: 0, fog: 0, fogT: 0, safe: 1 }
  const cam = new THREE.Vector3(0, 0.3, 3)
  const look = new THREE.Vector3()
  const ease = (f) => f * f * (3 - 2 * f)
  const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-dt * k))

  function layout() {
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    wide = camera.aspect > 0.95
    stations.forEach((st, i) => {
      st.print.x = wide ? (i % 2 ? -0.85 : 0.85) : 0
      st.print.holder.position.x = st.print.x
    })
  }
  layout()

  function stationAt(f) {
    const n = stations.length - 1
    const v = Math.min(n, Math.max(0, f * n))
    const i = Math.min(n - 1, Math.floor(v))
    return { i, f: ease(Math.min(1, Math.max(0, (v - i - 0.15) / 0.7))), v }
  }

  function tick(dt, getLevel) {
    dt = Math.min(dt, 0.05)
    s.intro = Math.min(1, s.intro + dt / 2.8)
    s.p = damp(s.p, s.progress, 5, dt)
    s.px = damp(s.px, s.tx, 3, dt)
    s.py = damp(s.py, s.ty, 3, dt)
    s.level = damp(s.level, getLevel ? getLevel() : 0, 12, dt)
    s.fog = damp(s.fog, s.fogT, s.fogT ? 1.6 : 6, dt)
    shared.uTime.value += dt
    shared.uAudio.value = s.level
    shared.uFog.value = s.fog
    shared.uSafe.value = damp(shared.uSafe.value, s.fogT ? 0.15 : 1, 3, dt)
    scene.background.setRGB(0.006 + s.level * 0.02 + s.fog * 0.6, 0.002 + s.fog * 0.58, 0.0015 + s.fog * 0.55)

    const { i, f, v } = stationAt(s.p)
    const a = stations[i].print, b = stations[i + 1]?.print || a
    const dist = wide ? 2.7 : 3.5
    const bump = (wide ? 1.15 : 1.9) * Math.sin(f * Math.PI)
    const camX = s.px * 0.25
    cam.set(camX, 0.15 + bump + s.py * 0.15, THREE.MathUtils.lerp(a.z, b.z, f) + dist)
    look.set(THREE.MathUtils.lerp(a.x, b.x, f) * 0.35, wide ? 0.1 : -0.45, THREE.MathUtils.lerp(a.z, b.z, f) - 0.5)
    // intro: the camera eases in from further back
    const ie = 1 - Math.pow(1 - s.intro, 3)
    cam.z += (1 - ie) * 3
    cam.y += (1 - ie) * 0.8
    camera.position.copy(cam)
    camera.lookAt(look)

    prints.forEach((p, k) => {
      // drop onto the line, staggered
      const t = Math.min(1, Math.max(0, (s.intro * 2.8 - k * 0.09) / 1.1))
      p.drop = 1 - Math.pow(1 - t, 3)
      const sway = Math.sin(shared.uTime.value * 0.8 + p.seed * 1.7) * 0.05 + s.px * 0.06 + s.level * 0.08 * Math.sin(shared.uTime.value * 9 + p.seed)
      p.holder.rotation.set(sway * 0.6, (p.decor ? -p.side * 0.35 : 0) + sway * 0.5, sway * 0.4)
      p.holder.position.y = 0.8 + (1 - p.drop) * 3 + Math.sin(shared.uTime.value * 0.5 + p.seed) * 0.02
      // develops as the camera reaches it, and never un-develops (unless the light ruins it)
      const near = p.decor ? camera.position.z - p.z < 5.5 : v > p.index - 0.55
      if (near && p.drop > 0.9 && !s.fogT) p.dev = Math.min(1, p.dev + dt * 0.6)
      p.uniforms.uDev.value = p.dev
    })
    const pos = dustGeo.attributes.position.array
    for (let k = 0; k < N; k++) {
      pos[k * 3 + 1] += dt * (0.03 + (k % 7) * 0.004)
      if (pos[k * 3 + 1] > 2.2) pos[k * 3 + 1] = -2
    }
    dustGeo.attributes.position.needsUpdate = true
    renderer.render(scene, camera)
  }

  return {
    tick,
    layout,
    setProgress: (p) => { s.progress = p },
    setPointer: (x, y) => { s.tx = x; s.ty = y },
    skipIntro: () => { s.intro = 1; prints.forEach((p) => { p.drop = 1 }) },
    // white light: the prints fog to black. Back to safelight: they develop again from blank.
    setLight: (white) => {
      s.fogT = white ? 1 : 0
      if (!white) prints.forEach((p) => { p.dev = 0 })
    },
    destroy: () => {
      renderer.dispose()
      scene.traverse((o) => { o.geometry?.dispose(); o.material?.uniforms?.uMap?.value?.dispose(); o.material?.dispose?.() })
    },
  }
}
