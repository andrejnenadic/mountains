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

async function createProgram(gl, fragPath, vertPath) {
  const vert = await compileShader(gl, vertPath, gl.VERTEX_SHADER);
  const frag = await compileShader(gl, fragPath, gl.FRAGMENT_SHADER);
  if (!vert || !frag) return;

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

  function getProfileName(width = window.innerWidth) {
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  function getActiveConfig() {
    const groups = window.layerGroups || {};
    const profile = getProfileName();
    const activeGroup = groups[profile] ||
      groups.desktop || { layers: [], clouds: {} };
    return {
      layers: Array.isArray(activeGroup.layers) ? activeGroup.layers : [],
      clouds: activeGroup.clouds || {
        freq: 1.2,
        amp: 1.05,
        sky: [0.4, 0.7, 0.9],
        clouds: [1, 1, 1],
      },
    };
  }

  function getActiveLayers() {
    return getActiveConfig().layers || [];
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

  const mountainsProgram = await createProgram(
    gl,
    "./frag.glsl",
    "./vert.glsl",
  );
  if (!mountainsProgram) return;

  const cloudsProgram = await createProgram(
    gl,
    "./clouds-frag.glsl",
    "./vert.glsl",
  );
  if (!cloudsProgram) return;

  const mountainsUniformLocs = {
    seed: gl.getUniformLocation(mountainsProgram, "u_seed"),
    frequency: gl.getUniformLocation(mountainsProgram, "u_frequency"),
    amplitude: gl.getUniformLocation(mountainsProgram, "u_amplitude"),
    detail: gl.getUniformLocation(mountainsProgram, "u_detail"),
    yOffset: gl.getUniformLocation(mountainsProgram, "u_yOffset"),
    color: gl.getUniformLocation(mountainsProgram, "u_color"),
  };

  const cloudsUniformLocs = {
    seed: gl.getUniformLocation(cloudsProgram, "u_seed"),
    time: gl.getUniformLocation(cloudsProgram, "u_time"),
    freq: gl.getUniformLocation(cloudsProgram, "u_perlin_freq"),
    amp: gl.getUniformLocation(cloudsProgram, "u_perlin_amp"),
    sky: gl.getUniformLocation(cloudsProgram, "u_sky_color"),
    clouds: gl.getUniformLocation(cloudsProgram, "u_clouds_color"),
  };

  const vao = createBuffers(gl);

  let paused = document.hidden;
  let lastFrameTime = 0;
  let accumulator = 0;

  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    lastFrameTime = performance.now();
  });

  const seed = Math.random();

  requestAnimationFrame(animate);
  function animate(now) {
    requestAnimationFrame(animate);

    if (paused) {
      return;
    }

    let frameDelta = now - lastFrameTime;
    lastFrameTime = now;

    // prevent huge spikes even if browser hiccups
    frameDelta = Math.min(frameDelta, 100);

    accumulator += frameDelta;
    if (accumulator < FRAME_TIME) {
      return;
    }

    const activeConfig = getActiveConfig();
    const activeLayers = activeConfig.layers || [];
    const cloudsConfig = activeConfig.clouds || {
      freq: 1.2,
      amp: 1.05,
      sky: [0.4, 0.7, 0.9],
      clouds: [1, 1, 1],
    };

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(vao);

    // clouds
    gl.useProgram(cloudsProgram);
    gl.uniform1f(cloudsUniformLocs.seed, seed);
    gl.uniform1f(cloudsUniformLocs.time, now / 1000);
    gl.uniform1f(cloudsUniformLocs.freq, cloudsConfig.freq);
    gl.uniform1f(cloudsUniformLocs.amp, cloudsConfig.amp);
    gl.uniform3fv(cloudsUniformLocs.sky, cloudsConfig.sky);
    gl.uniform3fv(cloudsUniformLocs.clouds, cloudsConfig.clouds);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);

    // mountains
    gl.useProgram(mountainsProgram);
    for (const layer of activeLayers) {
      gl.uniform1f(mountainsUniformLocs.seed, layer.seed);
      gl.uniform1f(mountainsUniformLocs.frequency, layer.frequency);
      gl.uniform1f(mountainsUniformLocs.amplitude, layer.amplitude);
      gl.uniform1f(mountainsUniformLocs.detail, layer.detail);
      gl.uniform1f(mountainsUniformLocs.yOffset, layer.yOffset);
      gl.uniform4fv(mountainsUniformLocs.color, layer.color);

      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
    }
  }
});
