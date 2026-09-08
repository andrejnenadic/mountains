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

  const vert = await compileShader(gl, "./vert.glsl", gl.VERTEX_SHADER);
  const frag = await compileShader(gl, "./frag.glsl", gl.FRAGMENT_SHADER);
  if (!vert || !frag) return;

  const program = createProgram(gl, frag, vert);
  if (!program) return;

  const vao = createBuffers(gl);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.bindVertexArray(vao);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
});
