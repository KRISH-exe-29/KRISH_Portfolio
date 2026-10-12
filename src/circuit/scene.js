import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'

const BOARD_THICKNESS = 0.32
const anchors = Array.from(
  { length: 7 },
  (_, index) => new Vector3((index - 3) * 9, Math.sin(index * 1.7) * 2.2, -index * 5),
)
// The wire runs along the top face of each board, like a trace, not through the slab.
const wirePoints = anchors.map((anchor) => anchor.clone().add(new Vector3(0, BOARD_THICKNESS, 0)))

// Framing per layout: where the electron sits on screen, and how far back the camera is.
const WIDE = { fov: 42, side: 7.5, up: 4.4, back: 2, screenX: 0.72, screenY: 0.52 }
const NARROW = { fov: 58, side: 13, up: 8, back: 3, screenX: 0.5, screenY: 0.2 }
const NARROW_WIDTH = 800

// White falloff, tinted per sprite through the material colour.
function makeGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.2, 'rgba(255,255,255,.7)')
  gradient.addColorStop(0.5, 'rgba(255,255,255,.18)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  return new CanvasTexture(canvas)
}

function makeSprite(texture, color, scale, opacity = 1) {
  const material = new SpriteMaterial({
    map: texture,
    color,
    opacity,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const sprite = new Sprite(material)
  sprite.scale.setScalar(scale)
  return sprite
}

function createBoard(anchor, index, glowTexture, lowTier) {
  const group = new Group()
  const seeded = (offset) => ((index * 73 + offset * 31) % 100) / 100
  const surface = BOARD_THICKNESS / 2

  // The substrate never lights up: only copper and chip tops respond to power.
  const substrate = new MeshStandardMaterial({
    color: '#0a1f15',
    emissive: '#020604',
    metalness: 0.4,
    roughness: 0.6,
  })
  const trace = new MeshStandardMaterial({ color: '#a85b21', metalness: 0.8, roughness: 0.25 })
  const chip = new MeshStandardMaterial({ color: '#101611', roughness: 0.55 })
  const pad = new MeshBasicMaterial()

  group.add(new Mesh(new BoxGeometry(7.3, BOARD_THICKNESS, 4.3), substrate))

  for (let line = 0; line < 4; line += 1) {
    const horizontal = new Mesh(new BoxGeometry(2.4 + seeded(line) * 2.4, 0.045, 0.06), trace)
    horizontal.position.set(-0.8 + seeded(line + 4) * 1.4, surface + 0.04, -1.45 + line * 0.9)
    const vertical = new Mesh(new BoxGeometry(0.06, 0.045, 0.65 + seeded(line + 7) * 1.1), trace)
    vertical.position.set(
      horizontal.position.x + (seeded(line + 9) - 0.5) * 2.2,
      surface + 0.04,
      horizontal.position.z + 0.35,
    )
    group.add(horizontal, vertical)
  }

  for (let part = 0; part < 4; part += 1) {
    const size = [0.55 + seeded(part + 12), 0.18, 0.4 + seeded(part + 18) * 0.65]
    const mesh = new Mesh(new BoxGeometry(...size), chip)
    mesh.position.set(-2 + seeded(part + 23) * 4, surface + 0.09, -1.25 + seeded(part + 29) * 2.5)
    group.add(mesh)
  }

  const pads = new InstancedMesh(new BoxGeometry(0.14, 0.035, 0.14), pad, 12)
  const vias = new InstancedMesh(new SphereGeometry(0.07, 8, 8), pad, 10)
  const matrix = new Matrix4()
  for (let pin = 0; pin < 12; pin += 1) {
    matrix.makeTranslation(-3.18 + (pin % 6) * 0.18, surface + 0.02, -1.4 + Math.floor(pin / 6) * 2.8)
    pads.setMatrixAt(pin, matrix)
  }
  for (let via = 0; via < 10; via += 1) {
    matrix.makeTranslation(-2.5 + seeded(via + 40) * 5, surface + 0.03, -1.5 + seeded(via + 51) * 3)
    vias.setMatrixAt(via, matrix)
  }
  const connector = new Mesh(new BoxGeometry(0.35, 0.12, 1.25), pad)
  connector.position.set(index % 2 ? -3.5 : 3.5, surface + 0.03, 0)
  group.add(pads, vias, connector)

  let glow = null
  if (!lowTier) {
    glow = makeSprite(glowTexture, '#ff8a2a', 6, 0.16)
    glow.position.set(0, 0.5, 0)
    group.add(glow)
  }

  group.position.copy(anchor)
  group.rotation.y = index * 0.17

  let state = null
  const setPower = (on) => {
    if (on === state) return
    state = on
    trace.emissive.set(on ? '#ff8a2a' : '#120802')
    trace.emissiveIntensity = on ? 0.9 : 1
    chip.emissive.set(on ? '#0d5c33' : '#040a05')
    chip.emissiveIntensity = on ? 0.7 : 1
    pad.color.set(on ? '#ffb463' : '#5a3a1c')
    if (glow) glow.visible = on
  }
  setPower(false)

  return { group, setPower }
}

function createWire(curve) {
  const segments = 420
  const radial = 8
  const tube = (radius) => new TubeGeometry(curve, segments, radius, radial, false)

  const dull = new Mesh(
    tube(0.05),
    new MeshStandardMaterial({ color: '#754117', emissive: '#120802', metalness: 0.9, roughness: 0.24 }),
  )
  const hot = new Mesh(tube(0.06), new MeshBasicMaterial({ color: '#ffd9a0' }))
  const halo = new Mesh(
    tube(0.14),
    new MeshBasicMaterial({
      color: '#ff7a1a',
      opacity: 0.25,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  )

  // TubeGeometry emits radial * 6 indices per segment along its length.
  const perSegment = radial * 6
  const total = segments * perSegment
  const setProgress = (progress) => {
    const energised = Math.floor(segments * progress) * perSegment
    hot.geometry.setDrawRange(0, energised)
    halo.geometry.setDrawRange(0, energised)
    dull.geometry.setDrawRange(energised, total - energised)
  }

  return { meshes: [dull, hot, halo], setProgress }
}

export function createCircuitScene(host, {
  initialPowered = Array(7).fill(false),
  initialProgress = 0,
  onContextLost,
  onFirstFrame,
  lowTier,
}) {
  const renderer = new WebGLRenderer({
    antialias: !lowTier,
    alpha: true,
    powerPreference: 'high-performance',
  })
  host.appendChild(renderer.domElement)

  const scene = new Scene()
  scene.background = new Color('#050807')
  scene.add(new AmbientLight('#486050', 0.6), new DirectionalLight('#ff9c48', 1.2))

  const camera = new PerspectiveCamera(WIDE.fov, 1, 0.1, 200)
  const curve = new CatmullRomCurve3(wirePoints, false, 'catmullrom', 0.35)
  const glowTexture = makeGlowTexture()

  const wire = createWire(curve)
  scene.add(...wire.meshes)

  const boards = anchors.map((anchor, index) => {
    const board = createBoard(anchor, index, glowTexture, lowTier)
    scene.add(board.group)
    return board
  })

  const electron = new Group()
  electron.add(new Mesh(new SphereGeometry(0.16, 20, 20), new MeshBasicMaterial({ color: '#f4ffe8' })))
  electron.add(makeSprite(glowTexture, '#baff91', 1.5, 0.9))
  scene.add(electron)

  // A short tail: small, close-spaced sprites so it reads as a streak, not a beam.
  const trail = Array.from({ length: lowTier ? 3 : 6 }, (_, index) => {
    const point = makeSprite(glowTexture, '#78ff9f', 0.55 - index * 0.06, 0.4 - index * 0.06)
    scene.add(point)
    return point
  })

  let progress = initialProgress
  let powered = initialPowered
  let frame = WIDE
  let raf = 0
  let dirty = true
  let disposed = false
  let firstFrame = true
  const targetCamera = new Vector3()
  const side = new Vector3()
  const along = new Vector3()

  const request = () => {
    dirty = true
    if (!raf && !document.hidden) raf = requestAnimationFrame(render)
  }

  const render = () => {
    raf = 0
    if (disposed || document.hidden || !dirty) return

    const point = curve.getPointAt(progress)
    const tangent = curve.getTangentAt(progress)
    electron.position.copy(point)
    trail.forEach((item, index) => {
      item.position.copy(curve.getPointAt(Math.max(0, progress - (index + 1) * 0.004)))
    })
    wire.setProgress(progress)
    boards.forEach((board, index) => board.setPower(Boolean(powered[index])))

    // Camera sits beside and above the wire, so the wire crosses the view as a thin line.
    along.set(tangent.x, 0, tangent.z).normalize()
    side.set(-along.z, 0, along.x)
    targetCamera
      .copy(point)
      .addScaledVector(side, frame.side)
      .addScaledVector(along, -frame.back)
    targetCamera.y += frame.up
    if (firstFrame) camera.position.copy(targetCamera)
    else camera.position.lerp(targetCamera, 0.14)
    camera.lookAt(point)

    renderer.render(scene, camera)

    if (firstFrame) {
      firstFrame = false
      onFirstFrame()
      if (import.meta.env.DEV) {
        const { calls, triangles } = renderer.info.render
        console.info('Electron scene', calls, 'draw calls,', triangles, 'triangles')
      }
    }

    // Keep drawing until the camera has settled, then go idle.
    dirty = camera.position.distanceTo(targetCamera) > 0.015
    if (dirty) raf = requestAnimationFrame(render)
  }

  const resize = () => {
    const width = host.clientWidth
    const height = host.clientHeight
    frame = width <= NARROW_WIDTH ? NARROW : WIDE
    camera.fov = frame.fov
    camera.aspect = width / height
    // Shift the view so the electron lands at (screenX, screenY) instead of dead centre.
    camera.setViewOffset(
      width,
      height,
      (0.5 - frame.screenX) * width,
      (0.5 - frame.screenY) * height,
      width,
      height,
    )
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowTier ? 1.5 : 2))
    renderer.setSize(width, height, false)
    request()
  }

  const contextLost = (event) => {
    event.preventDefault()
    cancelAnimationFrame(raf)
    raf = 0
    onContextLost()
  }

  renderer.domElement.addEventListener('webglcontextlost', contextLost, false)
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', request)
  resize()

  return {
    setProgress(value) {
      progress = Math.min(1, Math.max(0, value))
      request()
    },
    setPowered(value) {
      powered = value
      request()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', request)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      scene.traverse((object) => {
        object.geometry?.dispose()
        if (object.isInstancedMesh) object.dispose()
        const materials = [].concat(object.material ?? [])
        materials.forEach((material) => material.dispose())
      })
      glowTexture.dispose()
      renderer.dispose()
      if (!renderer.getContext().isContextLost()) renderer.forceContextLoss()
      renderer.domElement.remove()
    },
  }
}
