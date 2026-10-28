import * as THREE from 'three'

/* The sky: one full-screen raymarched cloud slab (y 0..1) lit by a low sun, plus rising data packets.
   The camera height comes from the page (S.h, S.pitch); everything else is damped here.
   Rendered at a fraction of the screen resolution: clouds are soft, so upscaling hides it. */

const vert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`

const frag = /* glsl */ `
precision highp float;
precision highp sampler3D;
uniform sampler3D uNoise;
uniform vec2 uRes, uLook;
uniform float uTime, uH, uPitch, uGold, uBeat, uFlash, uGrow;
varying vec2 vUv;
const vec3 SUN = normalize(vec3(-0.55, 0.10, -1.0));

float n3(vec3 p){ return texture(uNoise, p * (1.0/32.0)).r; }
float fbm(vec3 p){
  float s = 0.5 * n3(p); p = p * 2.02 + 3.1;
  s += 0.25 * n3(p); p = p * 2.03 + 1.7;
  s += 0.125 * n3(p); p = p * 2.01 + 5.3;
  s += 0.0625 * n3(p);
  return s / 0.9375;
}
float dens(vec3 p){
  float prof = smoothstep(0.0, 0.35, p.y) * (1.0 - smoothstep(0.5, 1.0, p.y));
  vec3 q = p * vec3(0.42, 1.0, 0.42) + vec3(uTime * 0.035, 0.0, -uTime * 0.05);
  float big = n3(q * 0.33 + 7.0);
  float n = fbm(q * 1.3);
  float d = n * 0.9 + big * 0.75 + prof * 0.7 - 1.12 + uBeat * 0.04;
  return clamp(d * 3.2, 0.0, 1.0) * prof * uGrow;
}
vec3 sky(vec3 rd){
  float y = rd.y;
  vec3 night = mix(vec3(0.075, 0.095, 0.2), vec3(0.02, 0.03, 0.08), smoothstep(-0.1, 0.7, y));
  night += vec3(0.45, 0.2, 0.08) * exp(-abs(y + 0.05) * 9.0) * 0.45;
  vec3 gold = mix(vec3(1.0, 0.84, 0.58), vec3(0.98, 0.55, 0.32), smoothstep(0.0, 0.35, y));
  gold = mix(gold, vec3(0.62, 0.36, 0.42), smoothstep(0.3, 0.9, y));
  gold = mix(gold, vec3(1.0, 0.9, 0.75), smoothstep(0.0, -0.3, y));
  vec3 c = mix(night, gold, uGold);
  // Below the horizon, once you are near the cloud deck: more cloud, not dark ground.
  vec3 deck = mix(vec3(0.9, 0.91, 0.94), vec3(1.0, 0.9, 0.78), uGold);
  c = mix(c, deck, smoothstep(0.02, -0.2, y) * smoothstep(0.08, 0.3, uGold));
  float s = max(dot(rd, SUN), 0.0);
  c += vec3(1.0, 0.72, 0.4) * (pow(s, 6.0) * 0.35 + pow(s, 120.0) * 1.2) * (0.25 + 0.75 * uGold) * (1.0 + uBeat * 0.6);
  return c;
}
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

void main(){
  vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float pitch = uPitch + uLook.y * 0.06;
  float yaw = uLook.x * 0.08;
  vec3 rd = normalize(vec3(uv, -1.15));
  float cp = cos(pitch), sp = sin(pitch);
  rd = vec3(rd.x, rd.y * cp + rd.z * sp, -rd.y * sp + rd.z * cp);
  float cy = cos(yaw), sy = sin(yaw);
  rd = vec3(rd.x * cy - rd.z * sy, rd.y, rd.x * sy + rd.z * cy);
  vec3 ro = vec3(0.0, uH, 0.0);
  vec3 bg = sky(rd);

  float ry = abs(rd.y) < 1e-4 ? 1e-4 : rd.y;
  float ta = (0.0 - ro.y) / ry, tb = (1.0 - ro.y) / ry;
  float t0 = max(min(ta, tb), 0.0), t1 = min(max(ta, tb), t0 + 16.0);
  vec4 acc = vec4(0.0);
  if (t1 > 0.0) {
    float dt = (t1 - t0) / float(STEPS);
    float t = t0 + dt * hash12(gl_FragCoord.xy);
    vec3 lit = mix(vec3(0.34, 0.38, 0.55), vec3(1.0, 0.94, 0.84), uGold) + uFlash * vec3(0.9, 0.9, 1.2);
    vec3 shade = mix(vec3(0.05, 0.06, 0.12), vec3(0.66, 0.46, 0.46), uGold);
    vec3 under = vec3(0.55, 0.28, 0.12) * (1.0 - uGold) * 0.5;
    for (int i = 0; i < STEPS; i++) {
      vec3 p = ro + rd * t;
      float d = dens(p);
      if (d > 0.01) {
        float l = exp(-dens(p + SUN * 0.3) * 2.4);
        vec3 c = mix(shade, lit, l) + under * (1.0 - p.y);
        c += vec3(1.0, 0.7, 0.4) * pow(max(dot(rd, SUN), 0.0), 4.0) * l * 0.5 * uGold;
        c = mix(c, bg, 1.0 - exp(-t * 0.17));
        float a = 1.0 - exp(-d * dt * 7.0);
        acc.rgb += (1.0 - acc.a) * a * c;
        acc.a += (1.0 - acc.a) * a;
        if (acc.a > 0.97) break;
      }
      t += dt;
    }
  }
  vec3 col = bg * (1.0 - acc.a) + acc.rgb;
  // Inside the slab: a soft whiteout, so there is no hard horizon while you fly through.
  float inside = smoothstep(-0.15, 0.25, uH) * (1.0 - smoothstep(0.75, 1.15, uH));
  vec3 fogc = mix(vec3(0.78, 0.8, 0.86), vec3(1.0, 0.95, 0.88), uGold);
  col = mix(col, fogc, inside * (0.55 + 0.25 * (1.0 - abs(rd.y))));
  col = pow(col, vec3(0.95));
  gl_FragColor = vec4(col, 1.0);
}`

const pointVert = /* glsl */ `
attribute float aSeed;
uniform float uRise, uTime, uSize, uBeat;
varying float vA; varying float vS;
void main(){
  vec3 p = position;
  p.y = mod(p.y + uRise * (0.5 + aSeed), 9.0) - 4.5;
  p.x += sin(uTime * 0.6 + aSeed * 40.0) * 0.12;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.5 + aSeed) * (1.0 + uBeat * 0.9) / -mv.z;
  vA = smoothstep(4.5, 3.0, abs(p.y)); vS = aSeed;
}`
const pointFrag = /* glsl */ `
uniform vec3 uColor; uniform float uAlpha;
varying float vA; varying float vS;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float sq = max(abs(c.x), abs(c.y));
  float a = smoothstep(0.5, 0.0, length(c)) * 0.6 + smoothstep(0.2, 0.12, sq);
  gl_FragColor = vec4(uColor * (0.8 + vS * 0.4), a * vA * uAlpha);
}`

function noiseTexture() {
  const N = 32
  const data = new Uint8Array(N * N * N)
  let s = 1234567
  for (let i = 0; i < data.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; data[i] = s >>> 24 }
  const tex = new THREE.Data3DTexture(data, N, N, N)
  tex.format = THREE.RedFormat
  tex.minFilter = tex.magFilter = THREE.LinearFilter
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping
  tex.needsUpdate = true
  return tex
}

const damp = (x, target, k, dt) => x + (target - x) * (1 - Math.exp(-dt * k))

// S: shared state written by the page { h, pitch, gold, px, py, beat, flash, climb, visible }
export function mountSky(canvas, S, ticker) {
  const small = window.innerWidth < 760
  let scale = small ? 0.42 : 0.55
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2) * scale
  renderer.setPixelRatio(dpr())

  const scene = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(55, 1, 0.1, 50)
  const u = {
    uNoise: { value: noiseTexture() }, uRes: { value: new THREE.Vector2(1, 1) }, uLook: { value: new THREE.Vector2() },
    uTime: { value: 0 }, uH: { value: -2 }, uPitch: { value: 0.3 }, uGold: { value: 0 }, uBeat: { value: 0 }, uFlash: { value: 0 }, uGrow: { value: 0 },
  }
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, uniforms: u, depthWrite: false, depthTest: false,
    defines: { STEPS: small ? 22 : 34 },
  }))
  quad.frustumCulled = false
  scene.add(quad)

  const count = small ? 90 : 180
  const pos = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 9
    pos[i * 3 + 1] = Math.random() * 9 - 4.5
    pos[i * 3 + 2] = -3 - Math.random() * 7
    seed[i] = Math.random()
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  const pu = { uRise: { value: 0 }, uTime: { value: 0 }, uSize: { value: 60 }, uBeat: { value: 0 }, uColor: { value: new THREE.Color('#7fe7ff') }, uAlpha: { value: 0 } }
  const points = new THREE.Points(g, new THREE.ShaderMaterial({
    vertexShader: pointVert, fragmentShader: pointFrag, uniforms: pu, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  }))
  points.frustumCulled = false
  scene.add(points)

  const cold = new THREE.Color('#7fe7ff'), warm = new THREE.Color('#fff1c9')
  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight
    renderer.setSize(w, h, false)
    cam.aspect = w / h
    cam.updateProjectionMatrix()
    u.uRes.value.set(w, h)
    pu.uSize.value = (small ? 30 : 38) * renderer.getPixelRatio()
  }
  resize()
  window.addEventListener('resize', resize)

  const start = performance.now()
  let last = start, h = S.h, pitch = S.pitch, gold = S.gold, lx = 0, ly = 0, rise = 0, prevH = S.h
  let slow = 0, frames = 0
  const frame = () => {
    const now = performance.now()
    const dt = Math.min((now - last) / 1000, 0.1)
    last = now
    if (document.hidden || !S.visible) return
    const t = (now - start) / 1000
    h = damp(h, S.h, 3.2, dt)
    pitch = damp(pitch, S.pitch, 3.2, dt)
    gold = damp(gold, S.gold, 2.6, dt)
    lx = damp(lx, S.px, 4, dt)
    ly = damp(ly, S.py, 4, dt)
    S.flash *= Math.exp(-dt * 7)
    const since = S.born ? (now - S.born) / 1000 : 0
    const grow = S.born ? Math.min(1, 0.15 + since / 3) : 0.15
    u.uTime.value = t
    u.uH.value = h
    u.uPitch.value = pitch
    u.uGold.value = gold
    u.uLook.value.set(lx, ly)
    u.uBeat.value = S.beat
    u.uFlash.value = S.flash
    u.uGrow.value = 1 - Math.pow(1 - grow, 3)
    // Packets rise on their own, and faster while you climb: they come up with you.
    rise += dt * 0.35 + Math.max(0, h - prevH) * 3.5
    prevH = h
    pu.uRise.value = rise
    pu.uTime.value = t
    pu.uBeat.value = S.beat
    pu.uAlpha.value = Math.min(1, since / 2.5) * (1 - gold * 0.45)
    pu.uColor.value.copy(cold).lerp(warm, gold)
    points.rotation.y = lx * 0.05
    renderer.render(scene, cam)
    // Quality guard: if frames run slow, render fewer pixels.
    slow += dt; frames++
    if (frames === 90) {
      if (slow / frames > 0.024 && scale > 0.28) { scale *= 0.8; renderer.setPixelRatio(dpr()); resize() }
      slow = 0; frames = 0
    }
  }
  ticker.add(frame)
  return () => {
    ticker.remove(frame)
    window.removeEventListener('resize', resize)
    renderer.dispose()
  }
}
