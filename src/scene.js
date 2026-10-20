// The dream room: blush plaster, still water, an iridescent sphere, and a corridor of arches.
// Scrolling moves the camera along one path through it; holding the mouse stirs the water.
import * as THREE from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

const FOG = new THREE.Color('#efd5d4')
const small = () => Math.min(innerWidth, innerHeight) < 700

// Soft grey noise, used as a plaster bump map.
function plaster() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#808080'
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 9000; i++) {
    const v = 90 + Math.random() * 80
    g.fillStyle = `rgba(${v},${v},${v},.35)`
    const r = Math.random() * 3 + 0.5
    g.fillRect(Math.random() * 256, Math.random() * 256, r, r)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(0.35, 0.35)
  return t
}

function sky() {
  const c = document.createElement('canvas')
  c.width = 2
  c.height = 512
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#b9c3ee')
  grad.addColorStop(0.45, '#dcd2ee')
  grad.addColorStop(0.8, '#f3dbe0')
  grad.addColorStop(1, '#efd5d4')
  g.fillStyle = grad
  g.fillRect(0, 0, 2, 512)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function archHole(cx, w, h) {
  const p = new THREE.Path()
  p.moveTo(cx - w / 2, -1)
  p.lineTo(cx - w / 2, h - w / 2)
  p.absarc(cx, h - w / 2, w / 2, Math.PI, 0, true)
  p.lineTo(cx + w / 2, -1)
  p.lineTo(cx - w / 2, -1)
  return p
}

function rectHole(x, y, w, h) {
  const p = new THREE.Path()
  p.moveTo(x, y)
  p.lineTo(x + w, y)
  p.lineTo(x + w, y + h)
  p.lineTo(x, y + h)
  p.lineTo(x, y)
  return p
}

function slab(x0, x1, top, holes, depth, mat) {
  const s = new THREE.Shape()
  s.moveTo(x0, -2)
  s.lineTo(x1, -2)
  s.lineTo(x1, top)
  s.lineTo(x0, top)
  s.lineTo(x0, -2)
  s.holes.push(...holes)
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 40 }), mat)
  m.castShadow = m.receiveShadow = true
  return m
}

function rock(mat, seed) {
  // merged so the normals smooth across faces instead of faceting
  const g = mergeVertices(new THREE.IcosahedronGeometry(1, 6))
  const p = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const n = Math.sin(v.x * 3.1 + seed) * 0.08 + Math.sin(v.y * 5.3 + seed * 2) * 0.05 + Math.sin(v.z * 4.2 - seed) * 0.07
    v.multiplyScalar(1 + n)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  const m = new THREE.Mesh(g, mat)
  m.castShadow = m.receiveShadow = true
  return m
}

const waterShader = {
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    time: { value: 0 },
    hold: { value: 0 },
    fogColor: { value: FOG },
    fogNear: { value: 28 },
    fogFar: { value: 95 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vec4 w = modelMatrix * vec4(position, 1.0);
      vWorld = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float time, hold, fogNear, fogFar;
    uniform vec3 fogColor;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vec2 p = vWorld.xz;
      float amp = 1.0 + hold * 4.0;
      float w = sin(p.x * 0.9 + time * 0.7) * 0.5 + sin(p.y * 1.6 - time * 0.9) * 0.4 + sin((p.x - p.y) * 4.3 + time * 1.6) * 0.15;
      vec4 uv = vUv;
      uv.x += w * 0.0025 * uv.w * amp;
      uv.y += w * 0.007 * uv.w * amp;
      vec3 refl = texture2DProj(tDiffuse, uv).rgb;
      vec3 view = normalize(cameraPosition - vWorld);
      float fres = pow(1.0 - max(view.y, 0.0), 3.0);
      vec3 col = mix(refl * color, refl, fres * 0.55);
      col = mix(col, fogColor, smoothstep(fogNear, fogFar, distance(cameraPosition, vWorld)));
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
}

const filmShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, hold: { value: 0 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time, hold;
    varying vec2 vUv;
    void main() {
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      float ca = (0.012 + hold * 0.03) * r2;
      vec3 c = vec3(texture2D(tDiffuse, vUv + d * ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * ca).b);
      float n = fract(sin(dot(vUv + fract(time), vec2(12.9898, 78.233))) * 43758.5453);
      c += (n - 0.5) * 0.065;
      c *= mix(1.0, 0.86, smoothstep(0.1, 0.5, r2));
      gl_FragColor = vec4(c, 1.0);
    }`,
}

export function start(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
  // starts modest and drops further if frames run slow (see frame())
  let pr = Math.min(devicePixelRatio, small() ? 1 : 1.25)
  const REFLECT = 0.35
  renderer.setPixelRatio(pr)
  renderer.setSize(innerWidth, innerHeight, false)
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  scene.background = sky()
  scene.fog = new THREE.Fog(FOG, 28, 95)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.35

  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 260)

  // light
  scene.add(new THREE.HemisphereLight('#fff0f3', '#a98cb3', 0.7))
  const sun = new THREE.DirectionalLight('#fff1e4', 3.2)
  sun.castShadow = true
  sun.shadow.mapSize.setScalar(1024)
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 90 })
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.03
  scene.add(sun, sun.target)

  // materials
  const bump = plaster()
  const wall = new THREE.MeshStandardMaterial({ color: '#edcbc5', roughness: 0.92, bumpMap: bump, bumpScale: 1.2 })
  const stone = new THREE.MeshStandardMaterial({ color: '#f3dad3', roughness: 0.85, bumpMap: bump, bumpScale: 0.8 })
  const rockMat = new THREE.MeshStandardMaterial({ color: '#dcc0ae', roughness: 1, bumpMap: bump, bumpScale: 3 })
  const pearl = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', metalness: 0.15, roughness: 0.06, clearcoat: 1,
    iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [120, 820], envMapIntensity: 2.4,
  })

  // water
  const water = new Reflector(new THREE.PlaneGeometry(400, 400), {
    textureWidth: innerWidth * pr * REFLECT,
    textureHeight: innerHeight * pr * REFLECT,
    color: new THREE.Color('#d9c3d3'),
    shader: waterShader,
  })
  water.rotation.x = -Math.PI / 2
  scene.add(water)

  // room one: a back wall with a doorway and two windows, a colonnade on the left, stairs to a ledge
  const back = slab(-12, 18, 13, [archHole(-2, 3.4, 7.2), rectHole(3.6, 4.4, 1.5, 6.6), rectHole(8.2, 3.2, 1.1, 5)], 0.8, wall)
  back.position.z = -6
  const colonnade = slab(-16, 8, 11, [archHole(-12, 3, 7.5), archHole(-6, 3, 7.5), archHole(0, 3, 7.5)], 0.8, wall)
  colonnade.rotation.y = Math.PI / 2
  colonnade.position.x = -7.5
  scene.add(back, colonnade)

  const ledge = new THREE.Mesh(new THREE.BoxGeometry(12, 2.4, 1.6), stone)
  ledge.position.set(6, 1.2, -4.4)
  ledge.castShadow = ledge.receiveShadow = true
  scene.add(ledge)
  for (let i = 0; i < 8; i++) {
    const h = (i + 1) * 0.3
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.4, h, 0.5), stone)
    step.position.set(1.8, h / 2, -0.9 - i * 0.5)
    step.castShadow = step.receiveShadow = true
    scene.add(step)
  }

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), pearl)
  sphere.position.set(6.6, 3.4, -4.4)
  sphere.castShadow = true
  scene.add(sphere)

  ;[[6, -0.35, 1.6, 1.8, 1.1, 1.5, 1], [11, -0.45, 4, 2.6, 1.3, 2, 2], [-4.5, -0.4, -15, 1.2, 0.9, 1.1, 3], [4, -0.3, -27, 1.6, 1, 1.3, 4], [-3.5, -0.4, -34, 2.2, 1.2, 1.6, 5]]
    .forEach(([x, y, z, sx, sy, sz, seed]) => {
      const r = rock(rockMat, seed)
      r.position.set(x, y, z)
      r.scale.set(sx, sy, sz)
      scene.add(r)
    })

  // room two: a corridor of free-standing arches, one per chapter
  const gates = [[-1.6, -14], [-0.6, -22], [0.8, -30], [0.2, -38]]
  gates.forEach(([x, z]) => {
    const g = slab(-3.6, 3.6, 10, [archHole(0, 3.4, 7.6)], 0.8, wall)
    g.position.set(x, 0, z - 0.4)
    scene.add(g)
  })

  // the far end: two monoliths, a large pearl and a low sun
  ;[[-6.5, 6, -60, 12], [-10, 4, -67, 8]].forEach(([x, y, z, h]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2, h, 2), wall)
    m.position.set(x, y - 6 + h / 2, z)
    m.castShadow = m.receiveShadow = true
    scene.add(m)
  })
  const big = new THREE.Mesh(new THREE.SphereGeometry(3, 64, 48), pearl)
  big.position.set(5, 3.2, -62)
  scene.add(big)
  const disc = new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.MeshBasicMaterial({ color: '#fff7ef', fog: false }))
  disc.position.set(12, 24, -140)
  scene.add(disc)

  const hillMat = new THREE.MeshStandardMaterial({ color: '#c7a6cf', roughness: 1 })
  ;[[-46, -3, -72, 30, 9, 20], [52, -4, -84, 34, 10, 22], [4, -6, -118, 50, 12, 24], [-30, -3, 40, 26, 8, 18]].forEach(([x, y, z, sx, sy, sz]) => {
    const h = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), hillMat)
    h.position.set(x, y, z)
    h.scale.set(sx, sy, sz)
    scene.add(h)
  })

  // dust in the light
  const motes = (() => {
    const n = small() ? 220 : 480
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) pos.set([(Math.random() - 0.5) * 30, Math.random() * 9, 14 - Math.random() * 70], i * 3)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 0.045, transparent: true, opacity: 0.7, depthWrite: false }))
  })()
  scene.add(motes)

  // the path the camera takes; gates sit on it
  const path = new THREE.CatmullRomCurve3([
    [0, 1.8, 15], [0.4, 2.0, 7], [-1.2, 2.2, 0], [-2, 2.3, -6], [-1.6, 2.4, -14],
    [-0.6, 2.5, -22], [0.8, 2.5, -30], [0.2, 2.6, -38], [0, 3.2, -48],
  ].map(p => new THREE.Vector3(...p)), false, 'centripetal')

  // post
  const composer = new EffectComposer(renderer)
  composer.setPixelRatio(pr)
  composer.setSize(innerWidth, innerHeight)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new OutputPass())
  const film = new ShaderPass(filmShader)
  composer.addPass(film)

  // input
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  let goal = 0, t = 0, hold = 0, holding = false
  const mouse = new THREE.Vector2(), look = new THREE.Vector2()
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight
    goal = max > 0 ? THREE.MathUtils.clamp(scrollY / max, 0, 1) : 0
  }
  const onMove = e => mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5)
  const onResize = () => {
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(pr)
    renderer.setSize(innerWidth, innerHeight, false)
    composer.setPixelRatio(pr)
    composer.setSize(innerWidth, innerHeight)
    water.getRenderTarget().setSize(innerWidth * pr * REFLECT, innerHeight * pr * REFLECT)
    onScroll()
  }
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('pointermove', onMove, { passive: true })
  addEventListener('resize', onResize)
  onScroll()

  const pos = new THREE.Vector3(), dir = new THREE.Vector3(), aim = new THREE.Vector3()
  const clock = new THREE.Clock()
  let raf = 0, resolveReady, slow = 0, frames = 0
  const ready = new Promise(r => (resolveReady = r))

  function frame() {
    raf = requestAnimationFrame(frame)
    const dt = clock.getDelta()
    const time = clock.elapsedTime
    // ponytail: crude adaptive resolution, steps down only; a GPU tier check could pick the start value instead
    slow += (Math.min(dt, 0.1) - slow) * 0.05 // capped so a tab switch does not count as lag
    if (++frames % 90 === 0 && slow > 1 / 45 && pr > 0.7) { pr = Math.max(0.7, pr - 0.15); onResize() }
    t += (goal - t) * (reduce ? 1 : 0.055)
    hold += ((holding ? 1 : 0) - hold) * 0.06
    look.lerp(mouse, reduce ? 0 : 0.05)

    path.getPointAt(t, pos)
    path.getTangentAt(t, dir)
    camera.position.copy(pos).add(aim.set(look.x * 0.5, -look.y * 0.3, 0))
    camera.lookAt(aim.copy(pos).addScaledVector(dir, 6).add(new THREE.Vector3(look.x * 1.4, 0.25 - look.y * 0.8, 0)))
    const fov = (camera.aspect < 0.8 ? 64 : 50) + hold * 7
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix() }

    // from the left, so the colonnade throws arch-shaped light across the room
    sun.position.copy(pos).add(aim.set(-20, 15, 4))
    sun.target.position.copy(pos).add(aim.set(0, 0, -8))

    if (!reduce) {
      sphere.position.y = 3.4 + Math.sin(time * 0.8) * 0.12
      sphere.rotation.y = time * 0.2
      big.position.y = 3.2 + Math.sin(time * 0.6 + 1) * 0.2
      motes.rotation.y = Math.sin(time * 0.05) * 0.1
      motes.position.y = Math.sin(time * 0.3) * 0.15
    }
    water.material.uniforms.time.value = reduce ? 0 : time
    water.material.uniforms.hold.value = hold
    film.uniforms.time.value = reduce ? 0 : time
    film.uniforms.hold.value = hold
    composer.render()
    if (resolveReady) { resolveReady(); resolveReady = null }
  }
  renderer.compile(scene, camera)
  frame()

  return {
    ready,
    setHold: v => { holding = v },
    dispose() {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', onScroll)
      removeEventListener('pointermove', onMove)
      removeEventListener('resize', onResize)
      composer.dispose()
      pmrem.dispose()
      renderer.dispose()
    },
  }
}
