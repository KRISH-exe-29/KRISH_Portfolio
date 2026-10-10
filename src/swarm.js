// Draws the filings. WebGL when the browser has it: every particle is blended between two
// target shapes inside the vertex shader. A small Canvas 2D version covers everything else.

const PAPER = [0.91, 0.922, 0.933]

const VERT = `
attribute vec2 aFrom, aTo, aSeed;
uniform float uMix, uTime, uTurb, uSize, uAspect;
uniform vec2 uScale, uOffset, uPointer;
varying float vHot;
void main() {
  // Each filing leaves and lands at its own moment, so shapes dissolve instead of sliding.
  float m = clamp(uMix * 1.6 - aSeed.x * 0.6, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);
  vec2 p = mix(aFrom, aTo, m);
  float flight = sin(m * 3.14159);
  float a = aSeed.y * 6.283 + uTime * (0.25 + aSeed.x * 0.6);
  vec2 swirl = vec2(cos(a + p.y * 4.0), sin(a * 1.3 + p.x * 4.0));
  p += swirl * (0.008 + flight * 0.45 * aSeed.y + uTurb * (0.05 + aSeed.x * 0.5));
  vec2 pos = p * uScale + uOffset;
  // The pointer pushes nearby filings away, like the wrong end of a magnet.
  vec2 away = (pos - uPointer) * vec2(uAspect, 1.0);
  pos += normalize(away + 0.0001) * vec2(1.0 / uAspect, 1.0) * 0.09 * smoothstep(0.28, 0.0, length(away));
  vHot = step(0.9, aSeed.x);
  gl_Position = vec4(pos, 0.0, 1.0);
  gl_PointSize = uSize * (0.55 + aSeed.y) * (1.0 + vHot * 0.5 * sin(uTime * 3.0 + aSeed.y * 40.0));
}`

const FRAG = `
precision mediump float;
varying float vHot;
void main() {
  if (length(gl_PointCoord - 0.5) > 0.5) discard;
  gl_FragColor = vec4(mix(vec3(0.082, 0.094, 0.114), vec3(0.898, 0.149, 0.122), vHot), 0.82);
}`

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader))
  return shader
}

function webgl(canvas, shapes) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false })
  if (!gl) return null
  const count = shapes[0].length / 2
  const program = gl.createProgram()
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(program)
  gl.useProgram(program)

  const upload = (data) => {
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    return buffer
  }
  const point = (name, buffer) => {
    const loc = gl.getAttribLocation(program, name)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  }
  const buffers = shapes.map(upload)
  point('aSeed', upload(Float32Array.from({ length: count * 2 }, Math.random)))
  const u = (name) => gl.getUniformLocation(program, name)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(...PAPER, 1)

  return {
    draw(s) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clear(gl.COLOR_BUFFER_BIT)
      point('aFrom', buffers[s.from])
      point('aTo', buffers[s.to])
      gl.uniform1f(u('uMix'), s.mix)
      gl.uniform1f(u('uTime'), s.time)
      gl.uniform1f(u('uTurb'), s.turb)
      gl.uniform1f(u('uSize'), s.size)
      gl.uniform1f(u('uAspect'), canvas.width / canvas.height)
      gl.uniform2fv(u('uScale'), s.scale)
      gl.uniform2fv(u('uOffset'), s.offset)
      gl.uniform2fv(u('uPointer'), s.pointer)
      gl.drawArrays(gl.POINTS, 0, count)
    },
  }
}

// ponytail: the fallback draws 4000 still-ish squares with no swirl or pointer push.
// Good enough for the rare browser without WebGL; port the shader maths if that changes.
function plain(canvas, shapes) {
  const c = canvas.getContext('2d')
  const count = Math.min(4000, shapes[0].length / 2)
  return {
    draw(s) {
      const { width: w, height: h } = canvas
      c.fillStyle = '#E8EBEE'
      c.fillRect(0, 0, w, h)
      c.fillStyle = '#15181D'
      const [a, b] = [shapes[s.from], shapes[s.to]]
      for (let i = 0; i < count * 2; i += 2) {
        const x = a[i] + (b[i] - a[i]) * s.mix
        const y = a[i + 1] + (b[i + 1] - a[i + 1]) * s.mix
        c.fillRect(((x * s.scale[0] + s.offset[0] + 1) / 2) * w, ((1 - y * s.scale[1] - s.offset[1]) / 2) * h, s.size, s.size)
      }
    },
  }
}

export const createSwarm = (canvas, shapes) => webgl(canvas, shapes) ?? plain(canvas, shapes)
