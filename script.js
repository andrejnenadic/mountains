const layers = [
  {
    seed: 12.4,
    frequency: 0.7,
    amplitude: 0.22,
    detail: 0.03,
    yOffset: 0.15,
    color: [0, 0, 1, 1],
  },
  {
    seed: 83.1,
    frequency: 1.0,
    amplitude: 0.35,
    detail: 0.06,
    yOffset: 0.0,
    color: [1, 0, 0, 1],
  },
];

const FPS = 60;
const FRAME_TIME = 1000 / FPS;

async function compileShader(gl, name, type) {
  const code = await fetch(name).then((x) => x.text());
  const shader = gl.createShader(type);
  gl.shaderSource(shader, code);
  gl.compileShader(shader);

  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(name, gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

function createProgram(gl, frag, vert) {
  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return null;
}

function createBuffers(gl) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const verts = [
    // x y uvx uvy
    1, 1, 1, 1, 1, -1, 1, 0, -1, -1, 0, 0, -1, 1, 0, 1,
  ];
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, Float32Array.from(verts), gl.STATIC_DRAW);

  gl.vertexAttribPointer(0, 2, gl.FLOAT, 0, 4 * 4, 0);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, 0, 4 * 4, 2 * 4);
  gl.enableVertexAttribArray(1);

  const indices = [0, 1, 3, 1, 2, 3];
  const ebo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    Uint32Array.from(indices),
    gl.STATIC_DRAW,
  );

  gl.bindVertexArray(null);
  return vao;
}

document.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.querySelector("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    console.log("No webgl context");
    return;
  }

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);

  function onResize() {
    const dpr = window.devicePixelRatio;

    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener("resize", onResize);
  onResize();

  const vert = await compileShader(gl, "./vert.glsl", gl.VERTEX_SHADER);
  const frag = await compileShader(gl, "./frag.glsl", gl.FRAGMENT_SHADER);
  if (!vert || !frag) return;

  const program = createProgram(gl, frag, vert);
  if (!program) return;

  const uniformLocs = {
    seed: gl.getUniformLocation(program, "u_seed"),
    frequency: gl.getUniformLocation(program, "u_frequency"),
    amplitude: gl.getUniformLocation(program, "u_amplitude"),
    detail: gl.getUniformLocation(program, "u_detail"),
    yOffset: gl.getUniformLocation(program, "u_yOffset"),
    color: gl.getUniformLocation(program, "u_color"),
  };

  const vao = createBuffers(gl);

  let paused = document.hidden;
  let lastFrameTime = 0;
  let accumulator = 0;

  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    lastFrameTime = performance.now();
  });

  requestAnimationFrame(animate);
  function animate(now) {
    requestAnimationFrame(animate);

    if (paused) {
      return;
    }

    let frameDelta = now - lastFrameTime;
    lastFrameTime = now;

    // Prevent huge spikes even if browser hiccups
    frameDelta = Math.min(frameDelta, 100);

    accumulator += frameDelta;
    if (accumulator < FRAME_TIME) {
      return;
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    for (const layer of layers) {
      gl.uniform1f(uniformLocs.seed, layer.seed);
      gl.uniform1f(uniformLocs.frequency, layer.frequency);
      gl.uniform1f(uniformLocs.amplitude, layer.amplitude);
      gl.uniform1f(uniformLocs.detail, layer.detail);
      gl.uniform1f(uniformLocs.yOffset, layer.yOffset);
      gl.uniform4fv(uniformLocs.color, layer.color);

      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
    }
  }
});
