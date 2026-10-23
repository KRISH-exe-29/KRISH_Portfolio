// Stage: one WebGL canvas behind the page that draws every photo and cover as a
// plane synced to its DOM box, plus the floating preview that trails the cursor
// over the work index. Hover is read from the shared pointer, not per-element listeners.
import * as THREE from 'three'
import { pointer, visibility } from '../motion.js'

const VERT = /* glsl */ `
uniform vec2 uBend;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec3 p = position;
  float PI = 3.14159265;
  p.x -= sin(uv.y * PI) * uBend.x;
  p.y -= sin(uv.x * PI) * uBend.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

const FRAG = /* glsl */ `
uniform sampler2D uTex;
uniform sampler2D uTex2;
uniform float uMix;
uniform vec2 uPlane;
uniform vec2 uImg;
uniform vec2 uImg2;
uniform vec2 uMouse;
uniform float uHover;
uniform float uReveal;
uniform float uTime;
uniform vec2 uVel;
varying vec2 vUv;

vec2 cover(vec2 uv, vec2 img){
  float rs = uPlane.x / uPlane.y;
  float ri = img.x / img.y;
  vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  return (uv - 0.5) * s + 0.5;
}
vec3 rgbShift(sampler2D t, vec2 uv, vec2 off){
  return vec3(texture2D(t, uv + off).r, texture2D(t, uv).g, texture2D(t, uv - off).b);
}
void main(){
  vec2 uv = vUv;
  vec2 d = uv - uMouse;
  d.x *= uPlane.x / uPlane.y;
  float r = length(d);
  // a ring wave spreading from the pointer, fading with distance
  float wave = sin(r * 42.0 - uTime * 7.0) * exp(-r * 5.0) * uHover;
  uv += (d / max(r, 1e-4)) * wave * 0.011;
  uv += vec2(sin(uv.y * 9.0 + uTime * 1.6), cos(uv.x * 7.0 + uTime * 1.3)) * 0.004 * uHover;
  // settle from a slight zoom as the plane reveals
  float zoom = 1.0 - 0.07 * uHover - 0.18 * (1.0 - uReveal);
  uv = (uv - 0.5) * zoom + 0.5;
  vec2 off = vec2(0.003 * uHover, 0.0) + uVel * 0.06;
  vec3 a = rgbShift(uTex, cover(uv, uImg), off);
  // the incoming image floods outward from the pointer
  float wipe = 1.0 - smoothstep(uMix * 1.6 - 0.15, uMix * 1.6, r + 0.06 * sin(vUv.x * 18.0 + uTime * 4.0));
  vec3 b = rgbShift(uTex2, cover(uv, uImg2), off);
  vec3 col = mix(a, b, wipe);
  // reveal: a wavy tide line sweeping down the plane
  float tide = uReveal * 1.25 - (1.0 - vUv.y) + sin(vUv.x * 9.0 + uTime * 2.0) * 0.035 * (1.0 - uReveal);
  float alpha = smoothstep(0.0, 0.06, tide);
  if (alpha <= 0.001) discard;
  gl_FragColor = vec4(col, alpha);
}
`

const loader = new THREE.TextureLoader()
const sizeOf = (tex) => {
  const im = tex.image
  return new THREE.Vector2(im?.naturalWidth || im?.width || 1, im?.naturalHeight || im?.height || 1)
}

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(0x000000, 0)
  const scene = new THREE.Scene()
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10)
  const geo = new THREE.PlaneGeometry(1, 1, 24, 24)
  const textures = new Map()
  const items = new Set()
  let W = 1
  let H = 1

  function resize() {
    W = window.innerWidth
    H = window.innerHeight
    renderer.setSize(W, H, false)
    cam.left = -W / 2
    cam.right = W / 2
    cam.top = H / 2
    cam.bottom = -H / 2
    cam.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  // src: url string or canvas; resolves with a texture (cached by source)
  function texture(src) {
    if (textures.has(src)) return textures.get(src)
    const p = new Promise((res) => {
      if (typeof src === 'string') {
        loader.load(src, (t) => res(t), undefined, () => res(null))
      } else {
        const t = new THREE.CanvasTexture(src)
        res(t)
      }
    }).then((t) => {
      if (t) {
        t.minFilter = THREE.LinearFilter
        t.generateMipmaps = false
      }
      return t
    })
    textures.set(src, p)
    return p
  }

  function material() {
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      uniforms: {
        uTex: { value: null },
        uTex2: { value: null },
        uMix: { value: 1 },
        uPlane: { value: new THREE.Vector2(1, 1) },
        uImg: { value: new THREE.Vector2(1, 1) },
        uImg2: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uHover: { value: 0 },
        uReveal: { value: 1 },
        uTime: { value: 0 },
        uVel: { value: new THREE.Vector2() },
        uBend: { value: new THREE.Vector2() },
      },
    })
  }

  // Bind a DOM element: the plane follows its box every frame.
  function add(el, src, onReady) {
    const mat = material()
    const mesh = new THREE.Mesh(geo, mat)
    mesh.visible = false
    const item = { el, mesh, u: mat.uniforms, hover: 0, ready: false }
    items.add(item)
    texture(src).then((t) => {
      if (!t || !items.has(item)) return
      mat.uniforms.uTex.value = t
      mat.uniforms.uTex2.value = t
      mat.uniforms.uImg.value = sizeOf(t)
      mat.uniforms.uImg2.value = sizeOf(t)
      scene.add(mesh)
      item.ready = true
      onReady?.()
    })
    return {
      uniforms: mat.uniforms,
      remove() {
        items.delete(item)
        scene.remove(mesh)
        mat.dispose()
      },
    }
  }

  // The floating preview for the work index.
  const pMat = material()
  pMat.uniforms.uReveal.value = 0
  const pMesh = new THREE.Mesh(geo, pMat)
  pMesh.renderOrder = 10
  scene.add(pMesh)
  const prev = { x: W / 2, y: H / 2, vx: 0, vy: 0, active: false, src: null, token: 0 }

  function previewShow(src) {
    if (src === prev.src && prev.active) return
    const token = ++prev.token
    prev.active = true
    texture(src).then((t) => {
      if (!t || token !== prev.token) return
      const u = pMat.uniforms
      if (!u.uTex.value || u.uReveal.value < 0.05) {
        // first image: snap to the pointer and rise
        u.uTex.value = t
        u.uTex2.value = t
        u.uImg.value = sizeOf(t)
        u.uImg2.value = sizeOf(t)
        u.uMix.value = 1
        if (u.uReveal.value < 0.05) {
          prev.x = pointer.x
          prev.y = pointer.y
        }
      } else {
        u.uTex.value = u.uMix.value > 0.5 ? u.uTex2.value : u.uTex.value
        u.uImg.value = u.uMix.value > 0.5 ? u.uImg2.value : u.uImg.value
        u.uTex2.value = t
        u.uImg2.value = sizeOf(t)
        u.uMix.value = 0
      }
      prev.src = src
    })
  }
  function previewHide() {
    prev.active = false
    prev.token++
    prev.src = null
  }

  function tick(time, dt) {
    if (visibility.hidden) return
    const k = 1 - Math.pow(0.001, dt) // frame-rate independent lerp
    for (const it of items) {
      if (!it.ready) continue
      const r = it.el.getBoundingClientRect()
      const on = r.width > 2 && r.height > 2 && r.bottom > -50 && r.top < H + 50
      it.mesh.visible = on
      if (!on) continue
      it.mesh.scale.set(r.width, r.height, 1)
      it.mesh.position.set(r.left + r.width / 2 - W / 2, H / 2 - r.top - r.height / 2, 0)
      const inside = pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom
      it.hover += ((inside ? 1 : 0) - it.hover) * Math.min(1, k * 0.9)
      const u = it.u
      u.uHover.value = it.hover
      u.uPlane.value.set(r.width, r.height)
      if (inside) u.uMouse.value.set((pointer.x - r.left) / r.width, 1 - (pointer.y - r.top) / r.height)
      u.uTime.value = time
    }

    // preview: trails the pointer like something dragged under water
    const u = pMat.uniforms
    const tx = pointer.x
    const ty = pointer.y
    const lx = prev.x
    const ly = prev.y
    prev.x += (tx - prev.x) * Math.min(1, k * 0.6)
    prev.y += (ty - prev.y) * Math.min(1, k * 0.6)
    prev.vx += ((prev.x - lx) - prev.vx) * 0.25
    prev.vy += ((prev.y - ly) - prev.vy) * 0.25
    u.uReveal.value += ((prev.active ? 1 : 0) - u.uReveal.value) * Math.min(1, k * 0.55)
    if (u.uMix.value < 1) u.uMix.value = Math.min(1, u.uMix.value + dt * 1.6)
    const pw = Math.min(460, W * 0.32)
    const ph = pw * (2 / 3)
    pMesh.visible = u.uReveal.value > 0.01
    pMesh.scale.set(pw, ph, 1)
    pMesh.position.set(prev.x - W / 2, H / 2 - prev.y, 1)
    pMesh.rotation.z = Math.max(-0.25, Math.min(0.25, -prev.vx * 0.006))
    u.uBend.value.set(Math.max(-0.2, Math.min(0.2, prev.vx * 0.004)), Math.max(-0.2, Math.min(0.2, -prev.vy * 0.004)))
    u.uVel.value.set(Math.max(-0.2, Math.min(0.2, prev.vx * 0.002)), 0)
    u.uPlane.value.set(pw, ph)
    u.uHover.value = 0.6
    u.uMouse.value.set(0.5, 0.5)
    u.uTime.value = time

    renderer.render(scene, cam)
  }

  function dispose() {
    window.removeEventListener('resize', resize)
    items.forEach((it) => it.mesh.material.dispose())
    items.clear()
    pMat.dispose()
    geo.dispose()
    textures.forEach((p) => p.then((t) => t?.dispose()))
    renderer.dispose()
  }

  return { add, previewShow, previewHide, tick, dispose }
}
