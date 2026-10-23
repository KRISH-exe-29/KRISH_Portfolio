import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import {
  WebGLRenderer, Scene, OrthographicCamera, Mesh, PlaneGeometry, ShaderMaterial,
  WebGLRenderTarget, HalfFloatType, LinearFilter, Vector2, Vector3, Vector4, Texture,
} from 'three'
import { lens } from './lens.js'

// ponytail: tuned by eye, not measured. Raise SHADE if ripples read too faint on the chalk ground.
const SIM_SCALE = 0.25 // simulation texels per CSS pixel
const DAMPING = 0.985 // how long a ripple rings
const SHADE = 2.4 // highlight / shadow strength
const REFRACT = 0.32 // how far the hovered photo bends under the water

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

// Height field wave equation. r = height, g = velocity. The pointer drags a soft brush
// along the segment it travelled this frame so fast strokes stay continuous.
const simFrag = /* glsl */ `
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec2 uA;
uniform vec2 uB;
uniform float uStrength;
uniform float uRadius;
uniform float uAspect;
uniform float uDamp;
varying vec2 vUv;
void main() {
  vec4 s = texture2D(uState, vUv);
  float avg = (
    texture2D(uState, vUv + vec2(uTexel.x, 0.0)).r +
    texture2D(uState, vUv - vec2(uTexel.x, 0.0)).r +
    texture2D(uState, vUv + vec2(0.0, uTexel.y)).r +
    texture2D(uState, vUv - vec2(0.0, uTexel.y)).r) * 0.25;
  s.g += (avg - s.r) * 2.0;
  s.g *= uDamp;
  s.r += s.g;
  s.r *= 0.998;
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  vec2 a = vec2(uA.x * uAspect, uA.y);
  vec2 b = vec2(uB.x * uAspect, uB.y);
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  float drop = max(0.0, 1.0 - length(pa - ba * h) / uRadius);
  s.r += (0.5 - 0.5 * cos(drop * 3.14159265)) * uStrength;
  gl_FragColor = s;
}
`

// Turns the height field into light: warm highlights, ink shadows, an orange caustic edge.
// Inside the hovered photo's rect it draws the photo itself, bent and RGB-split by the slope.
const renderFrag = /* glsl */ `
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform float uDpr;
uniform sampler2D uImg;
uniform vec4 uRect;
uniform vec2 uCover;
uniform float uImgA;
uniform float uRadius;
uniform vec3 uHi;
uniform vec3 uLo;
uniform vec3 uTint;
uniform float uShade;
uniform float uRefract;
varying vec2 vUv;
void main() {
  float l = texture2D(uState, vUv - vec2(uTexel.x, 0.0)).r;
  float r = texture2D(uState, vUv + vec2(uTexel.x, 0.0)).r;
  float d = texture2D(uState, vUv - vec2(0.0, uTexel.y)).r;
  float u = texture2D(uState, vUv + vec2(0.0, uTexel.y)).r;
  vec2 n = vec2(l - r, d - u);
  float shade = dot(n, vec2(-0.6, 0.8)) * uShade;
  float hi = clamp(shade, 0.0, 1.0);
  float lo = clamp(-shade, 0.0, 1.0);
  float caustic = clamp(pow(length(n) * uShade * 1.3, 2.0), 0.0, 1.0);
  vec3 base = mix(uLo, uHi, step(0.0, shade));
  base = mix(base, uTint, clamp(caustic, 0.0, 0.7));
  float a = clamp(abs(shade) * 0.5 + caustic * 0.22, 0.0, 0.55);
  vec4 outc = vec4(base * a, a);

  vec2 px = gl_FragCoord.xy / uDpr;
  vec2 q = abs(px - (uRect.xy + uRect.zw * 0.5)) - uRect.zw * 0.5 + uRadius;
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float inside = (1.0 - smoothstep(-0.75, 0.75, sd)) * uImgA;
  if (inside > 0.001) {
    vec2 local = (px - uRect.xy) / uRect.zw;
    vec2 uv = (local - 0.5) * uCover + 0.5 + n * uRefract;
    vec2 sh = n * uRefract * 0.7;
    vec3 img = vec3(texture2D(uImg, uv + sh).r, texture2D(uImg, uv).g, texture2D(uImg, uv - sh).b);
    img += uHi * hi * 0.45;
    img = mix(img, uLo, lo * 0.3);
    outc = vec4(img, 1.0) * inside + outc * (1.0 - inside);
  }
  gl_FragColor = outc;
}
`

function createWater(canvas) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true })
  const ext = renderer.extensions
  if (!ext.has('EXT_color_buffer_half_float') && !ext.has('EXT_color_buffer_float')) {
    renderer.dispose()
    throw new Error('no float render targets')
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  renderer.setPixelRatio(dpr)
  renderer.setClearColor(0x000000, 0)
  renderer.autoClear = false

  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geometry = new PlaneGeometry(2, 2)
  const simMat = new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: simFrag,
    uniforms: {
      uState: { value: null }, uTexel: { value: new Vector2() },
      uA: { value: new Vector2() }, uB: { value: new Vector2() },
      uStrength: { value: 0 }, uRadius: { value: 0.03 }, uAspect: { value: 1 }, uDamp: { value: DAMPING },
    },
  })
  const viewMat = new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: renderFrag, // writes premultiplied RGBA straight to a cleared canvas: no blending
    uniforms: {
      uState: { value: null }, uTexel: { value: new Vector2() }, uDpr: { value: dpr },
      uImg: { value: null }, uRect: { value: new Vector4() }, uCover: { value: new Vector2(1, 1) },
      uImgA: { value: 0 }, uRadius: { value: 0 },
      uHi: { value: new Vector3(1.0, 0.97, 0.9) },
      uLo: { value: new Vector3(0.08, 0.078, 0.07) },
      uTint: { value: new Vector3(1.0, 0.3, 0.0) },
      uShade: { value: SHADE }, uRefract: { value: REFRACT },
    },
  })
  const mesh = new Mesh(geometry, simMat)
  scene.add(mesh)

  let read, write
  const makeTargets = () => {
    read?.dispose()
    write?.dispose()
    const w = Math.max(32, Math.round(window.innerWidth * SIM_SCALE))
    const h = Math.max(32, Math.round(window.innerHeight * SIM_SCALE))
    const opts = { type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false }
    read = new WebGLRenderTarget(w, h, opts)
    write = new WebGLRenderTarget(w, h, opts)
    for (const t of [read, write]) {
      renderer.setRenderTarget(t)
      renderer.clear()
    }
    renderer.setRenderTarget(null)
    simMat.uniforms.uTexel.value.set(1 / w, 1 / h)
    viewMat.uniforms.uTexel.value.set(1 / w, 1 / h)
    simMat.uniforms.uAspect.value = window.innerWidth / window.innerHeight
  }
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    makeTargets()
  }
  resize()

  const textures = new Map()
  const textureFor = (img) => {
    if (!img.complete || !img.naturalWidth) return null
    let t = textures.get(img.currentSrc || img.src)
    if (!t) {
      t = new Texture(img)
      t.minFilter = LinearFilter
      t.generateMipmaps = false
      t.needsUpdate = true
      textures.set(img.currentSrc || img.src, t)
    }
    return t
  }

  let current = null
  let imgA = 0

  const step = (a, b, strength, dt) => {
    // photo lens
    const u = viewMat.uniforms
    if (lens.el && lens.el !== current) {
      current = lens.el
      u.uImg.value = textureFor(current)
      u.uRadius.value = parseFloat(getComputedStyle(current).borderTopLeftRadius) || 0
    }
    if (current && !u.uImg.value) u.uImg.value = textureFor(current)
    imgA += ((lens.el ? 1 : 0) - imgA) * (1 - Math.exp(-dt * 10))
    if (current && u.uImg.value && imgA > 0.002) {
      const r = current.getBoundingClientRect()
      u.uRect.value.set(r.left, window.innerHeight - r.bottom, r.width, r.height)
      const ia = current.naturalWidth / current.naturalHeight
      const ra = r.width / Math.max(r.height, 1)
      if (ra > ia) u.uCover.value.set(1, ia / ra)
      else u.uCover.value.set(ra / ia, 1)
      u.uImgA.value = imgA
    } else {
      u.uImgA.value = 0
    }

    // simulate
    simMat.uniforms.uA.value.copy(a)
    simMat.uniforms.uB.value.copy(b)
    simMat.uniforms.uStrength.value = strength
    simMat.uniforms.uState.value = read.texture
    mesh.material = simMat
    renderer.setRenderTarget(write)
    renderer.render(scene, camera)
    const t = read
    read = write
    write = t

    // draw
    renderer.setRenderTarget(null)
    renderer.clear()
    viewMat.uniforms.uState.value = read.texture
    mesh.material = viewMat
    renderer.render(scene, camera)
  }

  const dispose = () => {
    read.dispose()
    write.dispose()
    textures.forEach((t) => t.dispose())
    simMat.dispose()
    viewMat.dispose()
    geometry.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }

  return { step, resize, dispose }
}

export default function WaterCursor() {
  const canvasRef = useRef(null)
  const cursorRef = useRef(null)
  const blobRef = useRef(null)
  const labelRef = useRef(null)

  useEffect(() => {
    const root = document.documentElement
    const cursor = cursorRef.current
    const blob = blobRef.current
    const label = labelRef.current
    root.classList.add('has-cursor')

    let water = null
    try {
      water = createWater(canvasRef.current)
    } catch {
      water = null
      canvasRef.current.style.display = 'none'
    }

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const target = { ...pos }
    let on = false
    let labelled = false
    let angle = 0
    const a = new Vector2()
    const b = new Vector2()

    gsap.set(blob, { xPercent: -50, yPercent: -50 })
    const setX = gsap.quickSetter(cursor, 'x', 'px')
    const setY = gsap.quickSetter(cursor, 'y', 'px')
    const setRot = gsap.quickSetter(blob, 'rotate', 'deg')
    const setSX = gsap.quickSetter(blob, 'scaleX')
    const setSY = gsap.quickSetter(blob, 'scaleY')

    const onMove = (e) => {
      target.x = e.clientX
      target.y = e.clientY
      if (!on) {
        on = true
        pos.x = target.x
        pos.y = target.y
        cursor.classList.add('is-on')
      }
    }
    const onOver = (e) => {
      const t = e.target.closest?.('[data-cursor], a, button, [role="button"], input, label')
      const text = t?.getAttribute('data-cursor') || ''
      labelled = !!text
      cursor.classList.toggle('is-link', !!t && !text)
      cursor.classList.toggle('is-label', labelled)
      if (text) label.textContent = text
    }
    const onOut = (e) => {
      if (!e.relatedTarget) {
        on = false
        cursor.classList.remove('is-on')
      }
    }
    const onDown = () => cursor.classList.add('is-down')
    const onUp = () => cursor.classList.remove('is-down')
    const onResize = () => water?.resize()

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerout', onOut)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('resize', onResize)

    const tick = (time, deltaMs) => {
      if (document.hidden) return
      const dt = Math.min(deltaMs, 64) / 1000
      const k = 1 - Math.exp(-dt * 16)
      const px = pos.x
      const py = pos.y
      pos.x += (target.x - pos.x) * k
      pos.y += (target.y - pos.y) * k
      const vx = pos.x - px
      const vy = pos.y - py
      const speed = Math.hypot(vx, vy)
      const stretch = Math.min(speed / 36, 0.55) * (labelled ? 0.25 : 1)
      if (speed > 0.2) angle = (Math.atan2(vy, vx) * 180) / Math.PI
      setX(pos.x)
      setY(pos.y)
      setRot(angle)
      setSX(1 + stretch)
      setSY(1 - stretch * 0.45)

      if (water) {
        const w = window.innerWidth
        const h = window.innerHeight
        a.set(px / w, 1 - py / h)
        b.set(pos.x / w, 1 - pos.y / h)
        water.step(a, b, on ? Math.min(speed * 0.014, 0.45) : 0, dt)
      }
    }
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('resize', onResize)
      root.classList.remove('has-cursor')
      water?.dispose()
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="water" aria-hidden="true" />
      <div ref={cursorRef} className="cursor" aria-hidden="true">
        <div ref={blobRef} className="cursor-blob" />
        <span ref={labelRef} className="cursor-label" />
      </div>
    </>
  )
}
