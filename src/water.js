// The water, drawn by one fragment shader on a fixed canvas.
// `depth` runs 0 (just under the surface) to 1 (200 m). The colour darkens with it, the caustics
// and light shafts die out by about 60 m, and marine snow drifts past as the reader descends.
const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float; // the caustics need it: mediump turns them blocky on phones
#else
precision mediump float;
#endif
uniform vec2 res;
uniform float time;
uniform float depth;
uniform float travel;

vec3 water(float d) {
  vec3 surface = vec3(0.30, 0.80, 0.82);
  vec3 shallow = vec3(0.04, 0.38, 0.52);
  vec3 mid = vec3(0.015, 0.11, 0.22);
  vec3 deep = vec3(0.003, 0.01, 0.025);
  if (d < 0.15) return mix(surface, shallow, d / 0.15);
  if (d < 0.5) return mix(shallow, mid, (d - 0.15) / 0.35);
  return mix(mid, deep, (d - 0.5) / 0.5);
}

// The light net on the sea floor: a well-known iterated sine pattern for water caustics.
float caustic(vec2 uv, float t) {
  vec2 p = mod(uv * 6.28318 * 1.4, 6.28318) - 250.0;
  vec2 i = p;
  float c = 1.0;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1.0 - 3.5 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
  }
  c = 1.17 - pow(c / 4.0, 1.4);
  return pow(abs(c), 8.0);
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// One layer of drifting particles. Scrolling down moves them up, which reads as sinking.
float snow(vec2 uv, float scale, float shift, float t) {
  vec2 g = uv * scale + vec2(t * 0.05, shift);
  vec2 cell = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash(cell);
  vec2 pos = vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5;
  pos += 0.15 * vec2(sin(t * 0.7 + h * 6.0), cos(t * 0.5 + h * 4.0));
  float dist = length(f - pos * 0.8);
  return step(0.55, h) * smoothstep(0.06, 0.0, dist) * (0.4 + 0.6 * h);
}

void main() {
  vec2 uv = gl_FragCoord.xy / res;
  float top = 1.0 - uv.y;
  vec2 sq = vec2(uv.x * res.x / res.y, uv.y);
  float local = clamp(depth + top * 0.035, 0.0, 1.0);
  vec3 col = water(local);

  float light = clamp(1.0 - depth * 3.4, 0.0, 1.0);
  // Shafts of sunlight slanting down from the surface.
  float rays = 0.0;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    rays += pow(0.5 + 0.5 * sin(sq.x * (5.0 + fk * 3.0) + top * (2.0 + fk) + time * (0.15 + fk * 0.07) + fk * 2.0), 6.0);
  }
  col += vec3(0.55, 0.9, 0.95) * rays * 0.09 * light * (1.0 - top * 0.6);
  col += vec3(0.6, 0.95, 1.0) * caustic(sq * 0.8 + vec2(0.0, depth * 3.0), time * 0.5 + 23.0) * 0.22 * light * light;
  // The bright ceiling, only near the surface.
  col += vec3(0.7, 0.97, 1.0) * exp(-top * 7.0) * clamp(1.0 - depth * 9.0, 0.0, 1.0) * 0.6;

  float drift = travel;
  float flakes = snow(sq, 16.0, drift * 1.5, time) * 0.5 + snow(sq, 9.0, drift * 2.6, time * 1.3) * 0.8;
  col += vec3(0.7, 0.85, 0.9) * flakes * mix(0.25, 0.55, depth);

  // A soft vignette, heavier the deeper it gets.
  float v = length(uv - 0.5);
  col *= 1.0 - v * v * mix(0.5, 1.3, depth);
  gl_FragColor = vec4(col, 1.0);
}
`

export function startWater(canvas, read, calm) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
  if (!gl) return null
  const shader = (type, src) => {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s))
    return s
  }
  const prog = gl.createProgram()
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null // the page falls back to flat colour
  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const u = Object.fromEntries(['res', 'time', 'depth', 'travel'].map((n) => [n, gl.getUniformLocation(prog, n)]))

  // The shader is full-screen, so it renders at a reduced resolution and the browser scales it up.
  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6
    canvas.width = Math.round(canvas.clientWidth * scale)
    canvas.height = Math.round(canvas.clientHeight * scale)
    gl.viewport(0, 0, canvas.width, canvas.height)
    dirty = true
  }
  let dirty = true
  let frame = 0
  const start = performance.now()
  const loop = (now) => {
    if (!calm || dirty) {
      const { depth, travel } = read()
      gl.uniform2f(u.res, canvas.width, canvas.height)
      gl.uniform1f(u.time, calm ? 12 : ((now - start) / 1000) % 3600)
      gl.uniform1f(u.depth, depth)
      gl.uniform1f(u.travel, travel)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      dirty = false
    }
    frame = requestAnimationFrame(loop)
  }
  resize()
  window.addEventListener('resize', resize)
  // ponytail: a lost context (phones do this after backgrounding) drops to the flat fallback for good; restore it if anyone notices.
  canvas.addEventListener('webglcontextlost', () => {
    cancelAnimationFrame(frame)
    document.documentElement.classList.add('flat')
  })
  frame = requestAnimationFrame(loop)
  return {
    changed: () => { dirty = true },
    stop: () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize) },
  }
}
