// The living painting: one full-screen WebGL2 fragment shader.
// Strokes are a line-integral convolution of noise along a flow field (sky waves, eddies,
// the moon, the pointer), advected with a two-phase flow map; the stroke height becomes a
// relief normal lit by a lamp that follows the pointer.

const VERT = `#version 300 es
in vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }`

const FRAG = (steps) => `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime, uReveal, uTravel, uSky, uAudio, uSwirl, uStarBoost;
uniform vec2 uMouse;
uniform vec4 uStars[40];
uniform int uCount;
out vec4 o;
#define STEPS ${steps}

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float aspect(){ return uRes.x/uRes.y; }
vec2 toP(vec2 uv){ return (uv-0.5)*vec2(aspect(), 1.0); }

// Three hill layers; travel slides them sideways at different speeds (parallax).
float hill(float x, float i){
  float xx = x + uTravel*(1.2 + i*1.6);
  return -0.07 - i*0.105 + 0.055*sin(xx*2.1 + i*1.7) + 0.03*sin(xx*4.3 + i*3.1) + 0.012*sin(xx*9.7 + i) - uSky*0.28;
}
int layer(vec2 p){
  if (p.y > hill(p.x, 0.0)) return -1;
  if (p.y > hill(p.x, 1.0)) return 0;
  if (p.y > hill(p.x, 2.0)) return 1;
  return 2;
}
vec2 vortex(vec2 p, vec2 c, float r, float s){
  vec2 d = p - c; float r2 = dot(d, d);
  return s*vec2(-d.y, d.x)/(sqrt(r2) + 0.002)*exp(-r2/(r*r));
}
vec2 eddyA(){ return vec2(-0.28 + 0.5*uTravel, 0.2 - uSky*0.05); }
vec2 eddyB(){ return vec2(0.12 + 0.3*uTravel, 0.27); }
vec2 moonP(){ return uCount > 0 ? toP(uStars[0].xy) : vec2(0.6, 0.3); }

vec2 field(vec2 p){
  float a = (vnoise(p*1.6 + vec2(uTime*0.03, 0.0)) - 0.5)*2.6 + (vnoise(p*4.2 - uTime*0.02) - 0.5)*1.1;
  vec2 v = vec2(cos(a), sin(a))*0.45;
  int L = layer(p);
  if (L < 0) {
    v += vec2(1.0, 0.55*sin(p.x*5.0 + p.y*3.0 + uTime*0.12));
    v += vortex(p, eddyA(), 0.17, 2.2) + vortex(p, eddyB(), 0.11, -1.8);
    v += vortex(p, moonP(), 0.09, 2.6);
  } else {
    float i = float(L);
    float dy = (hill(p.x + 0.01, i) - hill(p.x, i))/0.01;
    v += vec2(1.0, dy)*1.4;
  }
  v += vortex(p, uMouse, 0.16, uSwirl);
  return normalize(v + 1e-4);
}

void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  vec2 p = toP(uv);
  float t = uTime*(0.06 + uAudio*0.08);
  float ph1 = fract(t), ph2 = fract(t + 0.5);
  float w1 = 1.0 - abs(2.0*ph1 - 1.0);
  float h = 0.0, c = 0.0, ws = 0.0;
  for (int dir = 0; dir < 2; dir++) {
    vec2 q = p; float sg = dir == 0 ? 1.0 : -1.0;
    for (int i = 0; i < STEPS; i++) {
      vec2 v = field(q);
      q += sg*v*0.0055;
      float w = 1.0 - float(i)/float(STEPS);
      float n = mix(vnoise((q - v*ph2*0.06)*78.0 + 17.0), vnoise((q - v*ph1*0.06)*78.0), w1);
      h += w*(n + 0.35*vnoise(q*190.0));
      c += w*vnoise(q*34.0 + 5.0);
      ws += w;
    }
  }
  h = clamp((h/(ws*1.35) - 0.5)*2.6 + 0.5, 0.0, 1.0); c = clamp((c/ws - 0.5)*2.4 + 0.5, 0.0, 1.0);
  float broad = vnoise(p*3.0 + 11.0);

  int L = layer(p);
  vec3 col;
  if (L < 0) {
    float e = exp(-dot(p - eddyA(), p - eddyA())/0.03) + 0.8*exp(-dot(p - eddyB(), p - eddyB())/0.014);
    col = mix(vec3(0.05, 0.11, 0.33), vec3(0.13, 0.32, 0.66), smoothstep(0.2, 0.8, c*0.7 + broad*0.3));
    col = mix(col, vec3(0.42, 0.62, 0.85), smoothstep(0.5, 0.75, h)*(0.35 + e));
    col = mix(col, vec3(0.85, 0.9, 0.85), smoothstep(0.62, 0.8, h)*e*0.8);
    col = mix(col, vec3(0.24, 0.43, 0.68), smoothstep(0.25, -0.1, p.y - hill(p.x, 0.0))*0.6);
  } else if (L == 0) {
    col = mix(vec3(0.08, 0.13, 0.34), vec3(0.24, 0.36, 0.6), smoothstep(0.25, 0.85, c*0.8 + h*0.3));
  } else if (L == 1) {
    col = mix(vec3(0.05, 0.17, 0.2), vec3(0.22, 0.42, 0.33), smoothstep(0.25, 0.85, c*0.8 + h*0.3));
    col = mix(col, vec3(0.6, 0.5, 0.22), smoothstep(0.62, 0.8, h)*0.5);
  } else {
    col = mix(vec3(0.05, 0.07, 0.13), vec3(0.3, 0.25, 0.15), smoothstep(0.3, 0.9, c*0.8 + h*0.3));
    col = mix(col, vec3(0.72, 0.55, 0.2), smoothstep(0.66, 0.82, h)*0.35);
  }

  // Village windows on the two nearer hills.
  if (L >= 1) {
    float top = hill(p.x, float(L));
    vec2 cell = floor(p*vec2(110.0, 150.0));
    float lit = step(0.985, hash(cell + float(L)*7.0))*smoothstep(0.1, 0.02, top - p.y);
    col = mix(col, vec3(1.0, 0.8, 0.35), lit*(0.7 + 0.3*sin(uTime*2.0 + cell.x)));
  }

  // Stars: one per contribution day, the first is the moon.
  vec3 glow = vec3(0.0);
  if (L < 0) {
    for (int i = 0; i < 40; i++) {
      if (i >= uCount) break;
      vec4 s = uStars[i];
      vec2 d = p - toP(s.xy);
      float r = length(d);
      float rad = s.w;
      float b = s.z*(0.55 + 0.45*uStarBoost) + uAudio*0.25;
      float rings = 0.5 + 0.5*sin(r*190.0 - h*6.0 - uTime*0.6);
      float halo = exp(-r/(rad*2.2))*b;
      col = mix(col, vec3(0.95, 0.88, 0.5), clamp(halo*rings*smoothstep(0.35, 0.7, h)*1.4, 0.0, 0.85));
      float core = smoothstep(rad, rad*0.55, r);
      if (i == 0) core *= smoothstep(rad*0.3, rad*0.9, length(d - vec2(rad*0.45, rad*0.25))); // crescent
      col = mix(col, mix(vec3(1.0, 0.85, 0.3), vec3(1.0, 0.97, 0.75), h), core);
      glow += vec3(1.0, 0.85, 0.45)*exp(-r/(rad*0.9))*b*0.25;
    }
  }

  // Impasto relief, lit by a lamp at the pointer.
  float bump = 2.6*uRes.y/900.0;
  vec3 N = normalize(vec3(-dFdx(h)*bump, -dFdy(h)*bump, 1.0));
  vec3 Ld = normalize(vec3(uMouse - p, 0.55));
  float diff = max(dot(N, Ld), 0.0);
  float spec = pow(max(dot(reflect(-Ld, N), vec3(0, 0, 1)), 0.0), 18.0);
  float near = exp(-length(uMouse - p)*2.2);
  col *= 0.72 + 0.4*diff;
  col += spec*(0.08 + 0.3*near)*vec3(1.0, 0.95, 0.8) + glow;
  col *= 1.0 - 0.35*smoothstep(0.45, 1.1, length(p*vec2(0.8, 1.0)));

  // Paint-in: strokes land in an order that spreads from the big eddy.
  float ord = length(p - eddyA())*0.85 + c*0.3 + h*0.15;
  float painted = clamp((uReveal*1.5 - ord)/0.05, 0.0, 1.0);
  float weave = 0.5 + 0.5*sin(gl_FragCoord.x*1.7)*sin(gl_FragCoord.y*1.7);
  vec3 primer = vec3(0.9, 0.86, 0.77)*(0.93 + 0.07*weave) - 0.05*vnoise(p*40.0);
  o = vec4(mix(primer, col, painted), 1.0);
}`

function shader(gl, type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
  return s
}

const damp = (x, t, k, dt) => x + (t - x) * (1 - Math.exp(-dt * k))

export function createPainting(canvas, { small, still }) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' })
  if (!gl) return null
  const prog = gl.createProgram()
  gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAG(small ? 5 : 7)))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'a')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const u = {}
  for (const n of ['uRes', 'uTime', 'uReveal', 'uTravel', 'uSky', 'uAudio', 'uSwirl', 'uStarBoost', 'uMouse', 'uStars', 'uCount']) u[n] = gl.getUniformLocation(prog, n)

  // Painting is soft, so it renders below device resolution; scale drops further if frames run slow.
  let scale = Math.min(window.devicePixelRatio || 1, 2) * (small ? 0.45 : 0.6)
  let slow = 0
  const s = { time: 0, reveal: still ? 1 : 0, travel: 0, tTravel: 0, sky: 0, tSky: 0, boost: 0, tBoost: 0, audio: 0, mx: 0.3, my: 0.1, tx: 0.3, ty: 0.1, swirl: 0.6, w: 1, h: 1 }

  const resize = () => {
    s.w = window.innerWidth; s.h = window.innerHeight
    canvas.width = Math.max(1, Math.round(s.w * scale))
    canvas.height = Math.max(1, Math.round(s.h * scale))
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
  resize()
  window.addEventListener('resize', resize)

  const onMove = (e) => {
    const nx = (e.clientX - s.w / 2) / s.h, ny = (s.h / 2 - e.clientY) / s.h
    s.swirl = Math.min(3.2, s.swirl + Math.hypot(nx - s.tx, ny - s.ty) * 14)
    s.tx = nx; s.ty = ny
  }
  window.addEventListener('pointermove', onMove, { passive: true })

  const draw = () => {
    gl.uniform2f(u.uRes, canvas.width, canvas.height)
    gl.uniform1f(u.uTime, s.time)
    gl.uniform1f(u.uReveal, s.reveal)
    gl.uniform1f(u.uTravel, s.travel)
    gl.uniform1f(u.uSky, s.sky)
    gl.uniform1f(u.uAudio, s.audio)
    gl.uniform1f(u.uSwirl, s.swirl)
    gl.uniform1f(u.uStarBoost, s.boost)
    gl.uniform2f(u.uMouse, s.mx, s.my)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  return {
    setStars(stars) { // [{x, y, b, r}] in screen uv (y up); the first is the moon
      const a = new Float32Array(40 * 4)
      stars.slice(0, 40).forEach((st, i) => a.set([st.x, st.y, st.b, st.r], i * 4))
      gl.uniform4fv(u.uStars, a)
      gl.uniform1i(u.uCount, Math.min(40, stars.length))
      if (still) draw()
    },
    set(k, v) { s[k] = v; if (still) { s.travel = s.tTravel; s.sky = s.tSky; s.boost = s.tBoost; draw() } },
    skip() { s.reveal = 1 },
    get revealed() { return s.reveal >= 1 },
    frame(dt, audio) {
      if (still || document.hidden) return
      dt = Math.min(dt, 0.1)
      s.time += dt
      if (s.reveal < 1) s.reveal = Math.min(1, s.reveal + dt / 3)
      s.travel = damp(s.travel, s.tTravel, 4, dt)
      s.sky = damp(s.sky, s.tSky, 4, dt)
      s.boost = damp(s.boost, s.tBoost, 4, dt)
      s.audio = damp(s.audio, audio, 10, dt)
      s.mx = damp(s.mx, s.tx, 5, dt); s.my = damp(s.my, s.ty, 5, dt)
      s.swirl = damp(s.swirl, 0.6, 1.2, dt)
      slow = dt > 0.026 ? slow + 1 : Math.max(0, slow - 1)
      if (slow > 40 && scale > 0.3) { scale *= 0.8; slow = 0; resize() }
      draw()
    },
    draw,
    destroy() {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
