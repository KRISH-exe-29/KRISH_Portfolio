import * as THREE from 'three'

/* ORBIT: the whole planetarium in one scene, driven by one ticker (gsap's, shared with Lenis).
   Dust assembles into the orbits, the sun and the sky; planets are experiences, rocks are repos,
   the outer ring is a year of contribution days. Camera keyframes: hero, one per planet, the belt. */

const COL = {
  ink: new THREE.Color('#0d1626'),
  brass: new THREE.Color('#c9a25a'),
  cream: new THREE.Color('#f1e6cc'),
  dim: new THREE.Color('#4a5a73'),
  hot: new THREE.Color('#ff7a4d'),
}
const PLANET = {
  railway: ['#c4462b', 0.9],
  mettur: ['#d8c49a', 1.15],
  inovate: ['#5d918b', 0.85],
  buhler: ['#c9a25a', 1.3],
  indotech: ['#efe4cb', 1.6],
}
export const ASSEMBLE = 2.8 // seconds until the dust has settled

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-dt * k))
const smooth = (t) => t * t * (3 - 2 * t)
const rand = (a, b) => a + Math.random() * (b - a)
const DAY = 86400000

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(0.18, 'rgba(255,255,255,0.6)')
  r.addColorStop(0.5, 'rgba(255,255,255,0.12)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Engraved look: lit from the sun at the origin, shadow drawn as a screen-space halftone, like a printed star atlas.
function halftone(color, dot) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uInk: { value: COL.ink }, uDot: { value: dot } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform vec3 uInk; uniform float uDot;
      varying vec3 vN; varying vec3 vW;
      void main() {
        vec3 n = normalize(vN);
        float d = max(dot(n, normalize(-vW)), 0.0);
        vec2 q = mat2(0.7071, -0.7071, 0.7071, 0.7071) * gl_FragCoord.xy / uDot;
        float r = length(fract(q) - 0.5);
        float rad = sqrt(1.0 - d) * 0.64;
        float ink = 1.0 - smoothstep(rad - 0.08, rad + 0.08, r);
        vec3 col = mix(uColor * (0.62 + 0.38 * d), uInk, ink * 0.92);
        float rim = pow(1.0 - max(dot(n, normalize(cameraPosition - vW)), 0.0), 3.0);
        gl_FragColor = vec4(col + uColor * rim * 0.28, 1.0);
        #include <colorspace_fragment>
      }`,
  })
}

function circle(r, seg = 256) {
  const pts = []
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2
    pts.push(Math.cos(a) * r, 0, Math.sin(a) * r)
  }
  return pts
}

export function createOrbit(canvas, opts) {
  const { experience, days, small, reduced, audio, onHover, onAssembled, onSyzygy } = opts
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance' })
  const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2)
  renderer.setPixelRatio(dpr)
  renderer.setClearColor(COL.ink)

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(COL.ink, 70, 170)
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500)
  const system = new THREE.Group()
  scene.add(system)
  const glow = glowTexture()
  const disposables = [glow]
  const keep = (x) => (disposables.push(x), x)

  scene.add(new THREE.AmbientLight(0x8090a8, 0.5))
  const sunLight = new THREE.PointLight(0xffe2b0, 2.4, 0, 0)
  scene.add(sunLight)

  // --- planets: orbit radius grows with the year
  const first = +experience[0].year
  const seen = {}
  const planets = experience.map((e, i) => {
    const y = +e.year
    seen[y] = (seen[y] ?? -1) + 1
    const r = 6 + (y - first) * 5.5 + seen[y] * 2.2
    const [color, size] = PLANET[e.id] || ['#d8c49a', 1]
    const mesh = new THREE.Mesh(keep(new THREE.SphereGeometry(size, small ? 32 : 48, small ? 24 : 32)), keep(halftone(color, 4.5 * dpr)))
    mesh.scale.setScalar(0.001)
    system.add(mesh)
    return { id: e.id, r, size, mesh, a0: i * 2.35 + 0.6, speed: 2.2 / Math.pow(r, 1.5), angle: 0 }
  })
  const maxR = planets.reduce((m, p) => Math.max(m, p.r), 0)
  const belt = [maxR + 4, maxR + 8]
  const ringR = maxR + 13

  // moons: the nine apps, circling the newest planet
  const home = planets[planets.length - 1]
  const moonMat = keep(halftone('#f1e6cc', 3.5 * dpr))
  const moonGeo = keep(new THREE.SphereGeometry(1, 20, 14))
  const moons = Array.from({ length: opts.moons || 9 }, (_, j) => {
    const m = new THREE.Mesh(moonGeo, moonMat)
    m.scale.setScalar(0.001)
    system.add(m)
    return { m, r: home.size + 1 + j * 0.24, s: 0.16 + (j % 3) * 0.05, w: 0.9 - j * 0.06, p: j * 0.7, tilt: (j % 2 ? 1 : -1) * (0.1 + j * 0.03) }
  })

  // --- sun: his name, at the centre
  const sun = new THREE.Mesh(keep(new THREE.SphereGeometry(2.1, 48, 32)), keep(new THREE.MeshBasicMaterial({ color: '#f6dfa6' })))
  sun.scale.setScalar(0.001)
  scene.add(sun)
  const sunGlow = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: glow, color: '#ffc77a', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })))
  sunGlow.scale.setScalar(14)
  scene.add(sunGlow)

  // --- lines: orbits and the polar chart grid
  const lineMat = keep(new THREE.LineBasicMaterial({ color: COL.brass, transparent: true, opacity: 0, depthWrite: false }))
  planets.forEach((p) => {
    const g = keep(new THREE.BufferGeometry())
    g.setAttribute('position', new THREE.Float32BufferAttribute(circle(p.r), 3))
    system.add(new THREE.LineLoop(g, lineMat))
  })
  const gridMat = keep(new THREE.LineBasicMaterial({ color: COL.brass, transparent: true, opacity: 0, depthWrite: false }))
  {
    const seg = []
    for (let r = 5; r <= ringR + 6; r += 5) {
      const c = circle(r, 128)
      for (let i = 0; i < 128; i++) {
        const j = ((i + 1) % 128) * 3
        if (i % 4 === 3) continue // dashed, like a printed chart
        seg.push(c[i * 3], 0, c[i * 3 + 2], c[j], 0, c[j + 2])
      }
    }
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2
      const r0 = k % 6 === 0 ? 3 : ringR - 2
      seg.push(Math.cos(a) * r0, 0, Math.sin(a) * r0, Math.cos(a) * (ringR + 6), 0, Math.sin(a) * (ringR + 6))
    }
    const g = keep(new THREE.BufferGeometry())
    g.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3))
    system.add(new THREE.LineSegments(g, gridMat))
  }

  // --- dust: every particle flies from a scattered cloud to its place in the system
  const N = small ? 2600 : 7000
  const dust = {
    pos: new Float32Array(N * 3), start: new Float32Array(N * 3),
    delay: new Float32Array(N), size: new Float32Array(N), mix: new Float32Array(N),
  }
  for (let i = 0; i < N; i++) {
    const u = Math.random()
    let x, y, z, s, m
    if (u < 0.45) {
      const r = planets[i % planets.length].r + rand(-0.08, 0.08)
      const a = Math.random() * Math.PI * 2
      x = Math.cos(a) * r; z = Math.sin(a) * r; y = rand(-0.04, 0.04); s = rand(0.5, 1); m = 0.2
    } else if (u < 0.6) {
      const r = rand(belt[0], belt[1])
      const a = Math.random() * Math.PI * 2
      x = Math.cos(a) * r; z = Math.sin(a) * r; y = rand(-0.5, 0.5); s = rand(0.35, 0.8); m = 0.6
    } else if (u < 0.68) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(rand(2.3, 4))
      x = v.x; y = v.y; z = v.z; s = rand(0.6, 1.2); m = 0
    } else {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(rand(95, 150))
      x = v.x; y = v.y; z = v.z; s = rand(2, 6); m = Math.random()
    }
    dust.pos.set([x, y, z], i * 3)
    const st = new THREE.Vector3().randomDirection().multiplyScalar(rand(30, 90))
    dust.start.set([st.x, st.y * 0.4, st.z], i * 3)
    dust.delay[i] = u < 0.68 ? rand(0.2, 1.5) : rand(0, 0.7)
    dust.size[i] = s
    dust.mix[i] = m
  }
  const dustGeo = keep(new THREE.BufferGeometry())
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dust.pos, 3))
  dustGeo.setAttribute('aStart', new THREE.BufferAttribute(dust.start, 3))
  dustGeo.setAttribute('aDelay', new THREE.BufferAttribute(dust.delay, 1))
  dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dust.size, 1))
  dustGeo.setAttribute('aMix', new THREE.BufferAttribute(dust.mix, 1))
  const dustMat = keep(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: reduced ? 99 : 0 }, uTime: { value: 0 }, uPx: { value: dpr }, uLevel: { value: 0 }, uA: { value: COL.cream }, uB: { value: COL.brass } },
    vertexShader: /* glsl */ `
      attribute vec3 aStart; attribute float aDelay; attribute float aSize; attribute float aMix;
      uniform float uT; uniform float uTime; uniform float uPx; uniform float uLevel;
      varying float vA; varying float vMix;
      void main() {
        float k = clamp((uT - aDelay) / 1.25, 0.0, 1.0);
        k = 1.0 - pow(1.0 - k, 3.0);
        vec3 p = mix(aStart, position, k);
        float s = (1.0 - k) * 2.6;
        p.xz = mat2(cos(s), -sin(s), sin(s), cos(s)) * p.xz;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float tw = 0.7 + 0.3 * sin(uTime * 1.6 + aDelay * 40.0);
        gl_PointSize = clamp(aSize * uPx * (1.0 + uLevel * 0.8) * 26.0 / -mv.z, 0.0, 9.0 * uPx);
        vA = (0.25 + 0.75 * k) * tw;
        vMix = aMix;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uA; uniform vec3 uB;
      varying float vA; varying float vMix;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(mix(uA, uB, vMix), smoothstep(0.5, 0.05, d) * vA);
        #include <colorspace_fragment>
      }`,
  }))
  system.add(new THREE.Points(dustGeo, dustMat))

  // --- contribution ring: one star per day; the best day is a supernova
  const n = days.length
  const max = days.reduce((m, d) => Math.max(m, d[1]), 1)
  const ringPos = new Float32Array(n * 3)
  const ringSize = new Float32Array(n)
  const ringHeat = new Float32Array(n)
  const ringIdx = new Float32Array(n)
  let best = 0
  days.forEach(([, c], i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2
    ringPos.set([Math.cos(a) * ringR, 0, Math.sin(a) * ringR], i * 3)
    ringSize[i] = c ? 1.6 + Math.sqrt(c / max) * 4.5 : 0.8
    ringHeat[i] = c / max
    ringIdx[i] = i
    if (c > days[best][1]) best = i
  })
  const ringGeo = keep(new THREE.BufferGeometry())
  ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3))
  ringGeo.setAttribute('aSize', new THREE.BufferAttribute(ringSize, 1))
  ringGeo.setAttribute('aHeat', new THREE.BufferAttribute(ringHeat, 1))
  ringGeo.setAttribute('aIdx', new THREE.BufferAttribute(ringIdx, 1))
  const ringMat = keep(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uHover: { value: -10 }, uPx: { value: dpr }, uTime: { value: 0 }, uAlpha: { value: 0 }, uCold: { value: COL.dim }, uWarm: { value: COL.brass }, uHot: { value: COL.cream } },
    vertexShader: /* glsl */ `
      attribute float aSize; attribute float aHeat; attribute float aIdx;
      uniform float uHover; uniform float uPx; uniform float uTime;
      varying float vHeat; varying float vHot;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        vHot = 1.0 - step(0.5, abs(aIdx - uHover));
        float tw = 0.85 + 0.15 * sin(uTime * 2.0 + aIdx * 1.7);
        gl_PointSize = aSize * uPx * tw * (1.0 + vHot * 1.4) * 60.0 / -mv.z;
        vHeat = aHeat;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCold; uniform vec3 uWarm; uniform vec3 uHot; uniform float uAlpha;
      varying float vHeat; varying float vHot;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 col = vHeat > 0.0 ? mix(uWarm, uHot, vHeat) : uCold;
        col = mix(col, uHot, vHot);
        gl_FragColor = vec4(col, smoothstep(0.5, 0.08, d) * uAlpha * (vHeat > 0.0 || vHot > 0.5 ? 1.0 : 0.5));
        #include <colorspace_fragment>
      }`,
  }))
  const ring = new THREE.Points(ringGeo, ringMat)
  system.add(ring)
  const nova = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: glow, color: COL.hot, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })))
  nova.position.set(ringPos[best * 3], 0, ringPos[best * 3 + 2])
  system.add(nova)

  // --- asteroid belt: one rock per public repo, sized by activity
  const beltGroup = new THREE.Group()
  system.add(beltGroup)
  const rockGeo = keep(new THREE.IcosahedronGeometry(1, 0))
  const rockMat = keep(new THREE.MeshLambertMaterial({ flatShading: true }))
  let rocks = null
  let repoList = []
  function setRepos(list) {
    if (rocks) { beltGroup.remove(rocks); rocks.dispose() }
    repoList = list
    rocks = new THREE.InstancedMesh(rockGeo, rockMat, Math.max(list.length, 1))
    rocks.count = list.length
    const now = Date.now()
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    list.forEach((r, i) => {
      const age = Math.max(0, (now - Date.parse(r.pushedAt)) / DAY)
      const activity = 1 / (1 + age / 45) // recent pushes burn bright
      const bulk = Math.min(1, Math.log10((r.sizeKB || 0) + 10) / 5.5)
      const a = (i / list.length) * Math.PI * 2 + rand(-0.08, 0.08)
      const rr = rand(belt[0] + 0.5, belt[1] - 0.5)
      o.position.set(Math.cos(a) * rr, rand(-0.5, 0.5), Math.sin(a) * rr)
      o.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6))
      const s = 0.25 + activity * 0.75 + bulk * 0.35
      o.scale.set(s * rand(0.8, 1.2), s * rand(0.6, 0.9), s * rand(0.8, 1.2))
      o.updateMatrix()
      rocks.setMatrixAt(i, o.matrix)
      c.copy(r.fork ? COL.dim : COL.brass).lerp(COL.cream, r.fork ? 0 : activity * 0.6)
      rocks.setColorAt(i, c)
    })
    rocks.instanceMatrix.needsUpdate = true
    if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true
    beltGroup.add(rocks)
    invalidate()
  }

  // syzygy line (the surprise)
  const syzGeo = keep(new THREE.BufferGeometry())
  syzGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, maxR + 3, 0, 0], 3))
  const syzMat = keep(new THREE.LineBasicMaterial({ color: COL.hot, transparent: true, opacity: 0 }))
  const syzLine = new THREE.Line(syzGeo, syzMat)
  system.add(syzLine)

  // --- camera keyframes: 0 hero, 1..n planets, last the belt
  const KEYS = planets.length + 2
  const A = { cam: new THREE.Vector3(), look: new THREE.Vector3() }
  const B = { cam: new THREE.Vector3(), look: new THREE.Vector3() }
  const up = new THREE.Vector3(0, 1, 0)
  const tmp = new THREE.Vector3()
  const fwd = new THREE.Vector3()
  let wide = true
  function key(k, out) {
    if (k <= 0) {
      if (wide) { out.cam.set(0, 24, 46); out.look.set(-13, -1, 0) } else { out.cam.set(0, 42, 84); out.look.set(0, 17, 0) }
    } else if (k >= KEYS - 1) {
      if (wide) { out.cam.set(0, 74, 36); out.look.set(15, 0, 3) } else { out.cam.set(0, 118, 40); out.look.set(0, 0, 26) }
    } else {
      const p = planets[k - 1]
      p.mesh.getWorldPosition(tmp)
      // three-quarter view: half the planet in sunlight, the sun off to one side
      const outward = fwd.set(tmp.x * 0.75 - tmp.z * 0.66, 0, tmp.z * 0.75 + tmp.x * 0.66).normalize()
      const s = p.size + (p === home ? 1.4 : 0)
      out.cam.copy(tmp).addScaledVector(outward, s * (wide ? 6.5 : 8.5) + 2).addScaledVector(up, s * 1.3 + 0.8)
      fwd.subVectors(tmp, out.cam).normalize()
      const right = fwd.cross(up).normalize()
      out.look.copy(tmp)
      if (wide) out.look.addScaledVector(right, s * 2.2 + 0.6)
      else out.look.addScaledVector(up, -s * 1.5)
    }
  }

  // --- state
  let target = 0
  let progress = 0
  let t0 = performance.now()
  let last = t0
  let tOrbit = 0
  let timeScale = 1
  let level = 0
  let assembled = reduced
  let rot = 0
  let rotTarget = 0
  let spin = 0
  let syz = 0
  let syzUntil = 0
  let syzW = 0
  let syzAngle = 0
  const par = { x: 0, y: 0, tx: 0, ty: 0 }
  const camPos = new THREE.Vector3(0, 60, 120)
  const camLook = new THREE.Vector3()
  const ndc = new THREE.Vector2(9, 9)
  let pointerDirty = false
  let hovered = null
  const raycaster = new THREE.Raycaster()
  raycaster.params.Points.threshold = 0.7
  let freq = null
  let running = true
  let dirty = true

  function invalidate() { dirty = true }

  // reduced motion: snap everything into place, render on demand only
  if (reduced) {
    planets.forEach((p) => p.mesh.scale.setScalar(1))
    moons.forEach((m) => m.m.scale.setScalar(m.s))
    sun.scale.setScalar(1)
  }

  function resize() {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    wide = w / h > 0.9
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = wide ? 45 : 55
    camera.updateProjectionMatrix()
    invalidate()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()

  function tick() {
    if (!running) return
    const now = performance.now()
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    if (reduced && !dirty && !pointerDirty) return
    const el = (now - t0) / 1000
    const motion = reduced ? 0 : 1

    // music: low-band energy
    if (audio.analyser && !reduced) {
      freq ||= new Uint8Array(audio.analyser.frequencyBinCount)
      audio.analyser.getByteFrequencyData(freq)
      let s = 0
      for (let i = 1; i < 14; i++) s += freq[i]
      level = damp(level, s / (13 * 255), 10, dt)
    } else level = damp(level, 0, 4, dt)

    // assembly
    if (!reduced) {
      dustMat.uniforms.uT.value = el
      const k = smooth(Math.min(1, Math.max(0, (el - 1.2) / 1.6)))
      sun.scale.setScalar(Math.max(0.001, smooth(Math.min(1, el / 1.6))) * (1 + level * 0.12))
      planets.forEach((p, i) => p.mesh.scale.setScalar(Math.max(0.001, smooth(Math.min(1, Math.max(0, (el - 1.4 - i * 0.18) / 0.8))))))
      moons.forEach((m, j) => m.m.scale.setScalar(m.s * smooth(Math.min(1, Math.max(0, (el - 2.2 - j * 0.05) / 0.5)))))
      lineMat.opacity = 0.32 * k
      gridMat.opacity = 0.09 * k
      ringMat.uniforms.uAlpha.value = k
      beltGroup.scale.setScalar(Math.max(0.001, k))
      sunGlow.material.opacity = 0.55 * k + level * 0.6
      if (!assembled && el > ASSEMBLE) { assembled = true; onAssembled?.() }
    } else {
      lineMat.opacity = 0.32; gridMat.opacity = 0.09; ringMat.uniforms.uAlpha.value = 1; sunGlow.material.opacity = 0.55
    }
    dustMat.uniforms.uTime.value = el
    dustMat.uniforms.uLevel.value = level
    ringMat.uniforms.uTime.value = el
    sunGlow.scale.setScalar(13 + level * 10)
    const pulse = 1 + Math.sin(el * 2.2) * 0.25 * motion
    nova.scale.setScalar((4.5 + level * 4) * pulse)
    nova.material.opacity = ringMat.uniforms.uAlpha.value * 0.95

    // scroll keyframes
    progress = reduced ? target : damp(progress, target, 6, dt)
    const f = progress * (KEYS - 1)
    const k0 = Math.min(KEYS - 2, Math.floor(f))
    const near = Math.abs(f - Math.round(f)) < 0.3
    const focus = near && Math.round(f) > 0 && Math.round(f) < KEYS - 1
    timeScale = damp(timeScale, focus ? 0.12 : 1, 3, dt)
    tOrbit += dt * timeScale * motion

    // drag to spin; spin hard enough and the planets line up
    rot = damp(rot, rotTarget, 6, dt)
    system.rotation.y = rot
    spin *= Math.exp(-dt * 0.7)
    if (spin > 8 && syz === 0) {
      syz = 1
      syzUntil = el + 9
      syzAngle = Math.atan2(-camPos.z, camPos.x) + Math.PI / 5 - rot
      spin = 0
      onSyzygy?.()
    }
    if (syz && el > syzUntil) syz = 0
    syzW = reduced ? syz : damp(syzW, syz, 2.2, dt)
    syzMat.opacity = syzW * 0.9
    syzLine.rotation.y = -syzAngle

    planets.forEach((p) => {
      const own = p.a0 + tOrbit * p.speed
      const d = Math.atan2(Math.sin(syzAngle - own), Math.cos(syzAngle - own))
      p.angle = own + d * syzW
      p.mesh.position.set(Math.cos(p.angle) * p.r, 0, Math.sin(p.angle) * p.r)
    })
    moons.forEach((m) => {
      const a = m.p + tOrbit * m.w * 3
      m.m.position.set(home.mesh.position.x + Math.cos(a) * m.r, home.mesh.position.y + Math.sin(a) * m.r * m.tilt, home.mesh.position.z + Math.sin(a) * m.r)
    })
    beltGroup.rotation.y = tOrbit * 0.012
    system.updateMatrixWorld()

    key(k0, A)
    key(k0 + 1, B)
    const t = smooth(Math.min(1, Math.max(0, (f - k0 - 0.2) / 0.6)))
    par.x = damp(par.x, par.tx, 3, dt)
    par.y = damp(par.y, par.ty, 3, dt)
    tmp.lerpVectors(A.cam, B.cam, t)
    const pk = f < 0.5 ? 3 : 0.6
    tmp.x += par.x * pk
    tmp.y += par.y * pk * 0.6
    if (reduced) camPos.copy(tmp)
    else {
      camPos.x = damp(camPos.x, tmp.x, 3.5, dt)
      camPos.y = damp(camPos.y, tmp.y, 3.5, dt)
      camPos.z = damp(camPos.z, tmp.z, 3.5, dt)
    }
    tmp.lerpVectors(A.look, B.look, t)
    if (reduced) camLook.copy(tmp)
    else {
      camLook.x = damp(camLook.x, tmp.x, 4, dt)
      camLook.y = damp(camLook.y, tmp.y, 4, dt)
      camLook.z = damp(camLook.z, tmp.z, 4, dt)
    }
    camera.position.copy(camPos)
    camera.lookAt(camLook)

    if (pointerDirty) { pointerDirty = false; pick() }
    renderer.render(scene, camera)
    dirty = false
  }

  function pick() {
    if (!rocks || ringMat.uniforms.uAlpha.value < 0.5) return
    camera.updateMatrixWorld()
    raycaster.setFromCamera(ndc, camera)
    let hit = null
    const r = raycaster.intersectObject(rocks, false)[0]
    if (r && r.instanceId != null) {
      const repo = repoList[r.instanceId]
      hit = { kind: 'repo', id: r.instanceId, url: repo.url, label: `${repo.name}${repo.fork ? ' (fork)' : ''} · last push ${repo.pushedAt}` }
    } else {
      const ps = raycaster.intersectObject(ring, false)
      if (ps.length) {
        const i = ps.reduce((b, x) => (x.distanceToRay < b.distanceToRay ? x : b)).index
        const [date, c] = days[i]
        hit = { kind: 'day', id: i, label: `${date} · ${c} contribution${c === 1 ? '' : 's'}${i === best ? ' · supernova' : ''}` }
      }
    }
    ringMat.uniforms.uHover.value = hit?.kind === 'day' ? hit.id : -10
    canvas.style.cursor = hit?.kind === 'repo' ? 'pointer' : ''
    hovered = hit
    onHover?.(hit, lastClient)
  }

  // --- pointer: parallax, hover, drag-to-spin, click a rock to open its repo
  const lastClient = { x: 0, y: 0 }
  let drag = null
  function onMove(e) {
    const rect = canvas.getBoundingClientRect()
    lastClient.x = e.clientX
    lastClient.y = e.clientY
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    par.tx = ndc.x
    par.ty = ndc.y
    pointerDirty = true
    if (drag) {
      const dx = e.clientX - drag.x
      drag.x = e.clientX
      drag.moved += Math.abs(dx)
      rotTarget += dx * 0.006
      spin += Math.abs(dx * 0.006)
    }
  }
  function onDown(e) {
    drag = { x: e.clientX, moved: 0 }
    canvas.setPointerCapture?.(e.pointerId)
  }
  function onUp() {
    if (drag && drag.moved < 6 && hovered?.kind === 'repo') window.open(hovered.url, '_blank', 'noopener')
    drag = null
  }
  function onLeave() {
    par.tx = par.ty = 0
    ndc.set(9, 9)
    pointerDirty = true
  }
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)
  canvas.addEventListener('pointerleave', onLeave)

  // pause when hidden or scrolled away
  let visible = !document.hidden
  let onScreen = true
  const sync = () => {
    const was = running
    running = visible && onScreen
    if (running && !was) last = performance.now()
  }
  const onVis = () => { visible = !document.hidden; sync() }
  document.addEventListener('visibilitychange', onVis)
  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync() })
  io.observe(canvas)

  setRepos(opts.repos)

  return {
    tick,
    setRepos,
    setProgress(p) { target = p; invalidate() },
    skipIntro() {
      if (assembled) return
      t0 = performance.now() - ASSEMBLE * 1000
      assembled = true
      onAssembled?.()
    },
    destroy() {
      running = false
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      rocks?.dispose()
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
    },
  }
}
