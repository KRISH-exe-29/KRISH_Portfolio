import * as THREE from 'three'
import gsap from 'gsap'

// One fullscreen canvas, one clock (gsap.ticker).
// 1. A height-field water sim at quarter resolution; the pointer drags a segment through it.
// 2. A view pass that shades the surface as ink (shadow side) and a faint accent glint (lit side).
// 3. When the pointer is over a [data-lens] photo, the same pass redraws that photo inside its
//    rect, refracted by the water, with a liquid lens at the pointer and an RGB split from velocity.

const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

const SIM = /* glsl */ `
precision highp float;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uA;
uniform vec2 uB;
uniform float uForce;
uniform float uRadius;
uniform float uAspect;
varying vec2 vUv;

float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec4 s = texture2D(uPrev, vUv);
  float avg = (
    texture2D(uPrev, vUv + vec2(uTexel.x, 0.0)).r +
    texture2D(uPrev, vUv - vec2(uTexel.x, 0.0)).r +
    texture2D(uPrev, vUv + vec2(0.0, uTexel.y)).r +
    texture2D(uPrev, vUv - vec2(0.0, uTexel.y)).r
  ) * 0.25;
  s.g += (avg - s.r) * 2.0;
  s.g *= 0.984;
  s.r += s.g;
  s.r *= 0.997;

  vec2 asp = vec2(uAspect, 1.0);
  float d = seg(vUv * asp, uA * asp, uB * asp);
  float drop = max(0.0, 1.0 - d / uRadius);
  drop = 0.5 - cos(drop * 3.14159265) * 0.5;
  s.r += drop * uForce;
  gl_FragColor = s;
}
`

const VIEW = /* glsl */ `
precision highp float;
uniform sampler2D uSim;
uniform vec2 uTexel;
uniform vec3 uInk;
uniform vec3 uGlint;
uniform float uAspect;
uniform float uTime;
uniform sampler2D uImg;
uniform float uHasImg;
uniform vec4 uRect;     // x, y, w, h in screen uv (origin bottom-left)
uniform vec2 uCover;    // object-fit: cover
uniform vec2 uLocal;    // pointer inside the rect, 0..1
uniform vec2 uShift;    // rgb split, in image uv
uniform float uHover;
varying vec2 vUv;

void main() {
  float hl = texture2D(uSim, vUv - vec2(uTexel.x, 0.0)).r;
  float hr = texture2D(uSim, vUv + vec2(uTexel.x, 0.0)).r;
  float hd = texture2D(uSim, vUv - vec2(0.0, uTexel.y)).r;
  float hu = texture2D(uSim, vUv + vec2(0.0, uTexel.y)).r;
  vec2 g = vec2(hr - hl, hu - hd);

  vec3 n = normalize(vec3(-g * 7.0, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.55, 1.0));
  float lit = dot(n, L) - L.z;
  float ink = clamp(-lit * 5.0, 0.0, 1.0) * 0.42;
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 90.0);
  float glint = clamp(clamp(lit * 5.0, 0.0, 1.0) * 0.22 + spec * 0.35, 0.0, 0.6);
  // premultiplied
  vec4 water = vec4(uInk * ink + uGlint * glint, ink + glint);

  vec2 local = (vUv - uRect.xy) / uRect.zw;
  if (uHasImg > 0.5 && uHover > 0.001 && local.x >= 0.0 && local.x <= 1.0 && local.y >= 0.0 && local.y <= 1.0) {
    vec2 d = local - uLocal;
    d.x *= uRect.z / uRect.w * uAspect;
    float r = length(d);
    float lens = exp(-r * r * 22.0);
    vec2 dir = r > 0.0001 ? d / r : vec2(0.0);
    vec2 off = -d * lens * 0.12 * uHover;
    off += dir * sin(r * 46.0 - uTime * 5.0) * 0.006 * lens * uHover;
    off += g * 2.4;
    vec2 uv = (local - 0.5) * uCover + 0.5 + off;
    vec3 c;
    c.r = texture2D(uImg, uv + uShift).r;
    c.g = texture2D(uImg, uv).g;
    c.b = texture2D(uImg, uv - uShift).b;
    vec4 img = vec4(c, 1.0) * uHover;
    gl_FragColor = water + img * (1.0 - water.a);
  } else {
    gl_FragColor = water;
  }
}
`

const hexToVec3 = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

export function createWater(canvas, { ink = '#111111', glint = '#ffd400' } = {}) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geometry = new THREE.PlaneGeometry(2, 2)

  const simMat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: SIM,
    uniforms: {
      uPrev: { value: null },
      uTexel: { value: new THREE.Vector2() },
      uA: { value: new THREE.Vector2(-1, -1) },
      uB: { value: new THREE.Vector2(-1, -1) },
      uForce: { value: 0 },
      uRadius: { value: 0.022 },
      uAspect: { value: 1 },
    },
    depthTest: false,
    depthWrite: false,
  })

  const viewMat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: VIEW,
    uniforms: {
      uSim: { value: null },
      uTexel: { value: new THREE.Vector2() },
      uInk: { value: hexToVec3(ink) },
      uGlint: { value: hexToVec3(glint) },
      uAspect: { value: 1 },
      uTime: { value: 0 },
      uImg: { value: null },
      uHasImg: { value: 0 },
      uRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uCover: { value: new THREE.Vector2(1, 1) },
      uLocal: { value: new THREE.Vector2(0.5, 0.5) },
      uShift: { value: new THREE.Vector2() },
      uHover: { value: 0 },
    },
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
  })

  const mesh = new THREE.Mesh(geometry, simMat)
  mesh.frustumCulled = false
  scene.add(mesh)

  let rtA, rtB
  const makeTargets = () => {
    rtA?.dispose()
    rtB?.dispose()
    const w = Math.max(64, Math.ceil(window.innerWidth / 4))
    const h = Math.max(64, Math.ceil(window.innerHeight / 4))
    const opts = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    }
    rtA = new THREE.WebGLRenderTarget(w, h, opts)
    rtB = new THREE.WebGLRenderTarget(w, h, opts)
    simMat.uniforms.uTexel.value.set(1 / w, 1 / h)
    viewMat.uniforms.uTexel.value.set(1 / w, 1 / h)
  }

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false)
    const aspect = window.innerWidth / window.innerHeight
    simMat.uniforms.uAspect.value = aspect
    viewMat.uniforms.uAspect.value = aspect
    makeTargets()
  }
  resize()

  // pointer state, in px
  const p = { x: -9999, y: -9999, px: -9999, py: -9999, vx: 0, vy: 0, seen: false }
  let lastInput = 0
  const lens = { target: null, el: null, img: null }
  const textures = new Map()
  const hoverTween = { v: 0 }

  const textureFor = (img) => {
    let t = textures.get(img)
    if (!t) {
      t = new THREE.Texture(img)
      t.minFilter = THREE.LinearFilter
      t.generateMipmaps = false
      t.needsUpdate = true
      textures.set(img, t)
    }
    return t
  }

  // lens.target is what the pointer is over; lens.el keeps drawing while the hover fades out
  const setLens = (el) => {
    if (el === lens.target) return
    lens.target = el
    const img = el?.querySelector('img')
    if (img && img.complete && img.naturalWidth) {
      lens.el = el
      lens.img = img
      viewMat.uniforms.uImg.value = textureFor(img)
      viewMat.uniforms.uHasImg.value = 1
      hoverTween.v = 0
      gsap.to(hoverTween, { v: 1, duration: 0.7, ease: 'power3.out', overwrite: true })
    } else {
      gsap.to(hoverTween, {
        v: 0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: true,
        onComplete: () => {
          if (lens.target) return
          lens.el = null
          lens.img = null
          viewMat.uniforms.uHasImg.value = 0
        },
      })
    }
  }

  const onMove = (e) => {
    if (!p.seen) {
      p.px = e.clientX
      p.py = e.clientY
      p.seen = true
    }
    p.x = e.clientX
    p.y = e.clientY
    lastInput = performance.now()
    setLens(e.target instanceof Element ? e.target.closest('[data-lens]') : null)
  }
  const onLeave = () => setLens(null)

  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  window.addEventListener('resize', resize)

  let resting = false
  const tick = (time) => {
    if (document.hidden) return
    const now = performance.now()
    const active = now - lastInput < 6000 || hoverTween.v > 0.001
    if (!active) {
      if (!resting) {
        renderer.setRenderTarget(null)
        renderer.clear()
        resting = true
      }
      return
    }
    if (resting) {
      p.px = p.x
      p.py = p.y
      resting = false
    }

    const W = window.innerWidth
    const H = window.innerHeight
    const dx = p.x - p.px
    const dy = p.y - p.py
    p.vx += (dx - p.vx) * 0.25
    p.vy += (dy - p.vy) * 0.25
    const speed = Math.min(Math.hypot(dx, dy), 80)

    const su = simMat.uniforms
    su.uA.value.set(p.px / W, 1 - p.py / H)
    su.uB.value.set(p.x / W, 1 - p.y / H)
    su.uForce.value = p.seen ? -Math.min(speed * 0.0016, 0.05) : 0
    su.uPrev.value = rtA.texture
    mesh.material = simMat
    renderer.setRenderTarget(rtB)
    renderer.render(scene, camera)
    ;[rtA, rtB] = [rtB, rtA]
    p.px = p.x
    p.py = p.y

    const vu = viewMat.uniforms
    vu.uSim.value = rtA.texture
    vu.uTime.value = time
    vu.uHover.value = hoverTween.v
    if (lens.el && lens.img) {
      const r = lens.el.getBoundingClientRect()
      vu.uRect.value.set(r.left / W, 1 - r.bottom / H, r.width / W, r.height / H)
      const ra = r.width / r.height
      const ia = lens.img.naturalWidth / lens.img.naturalHeight
      vu.uCover.value.set(Math.min(ra / ia, 1), Math.min(ia / ra, 1))
      vu.uLocal.value.set((p.x - r.left) / r.width, 1 - (p.y - r.top) / r.height)
      vu.uShift.value.set(
        gsap.utils.clamp(-0.02, 0.02, p.vx * 0.0006),
        gsap.utils.clamp(-0.02, 0.02, -p.vy * 0.0006),
      )
    }
    mesh.material = viewMat
    renderer.setRenderTarget(null)
    renderer.render(scene, camera)
  }
  gsap.ticker.add(tick)

  return {
    destroy() {
      gsap.ticker.remove(tick)
      gsap.killTweensOf(hoverTween)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', resize)
      textures.forEach((t) => t.dispose())
      rtA.dispose()
      rtB.dispose()
      simMat.dispose()
      viewMat.dispose()
      geometry.dispose()
      renderer.dispose()
    },
  }
}
