#version 300 es
precision highp float;

out vec4 frag_color;
in vec2 v_uv;

void main() {
  frag_color = vec4(v_uv, 0., 1.);
}
