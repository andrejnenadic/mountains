#version 300 es
precision highp float;

in vec2 v_uv;

out vec4 fragColor;

uniform float u_seed;

float hash(vec2 p) {
  p += u_seed;

  return fract(
    sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123
  );
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  // Smooth interpolation
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(
    mix(a, b, f.x),
    mix(c, d, f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 4; i++)
  {
    value += noise(p) * amplitude;

    p *= 2.0;
    amplitude *= 0.6;
  }

  return value;
}

float mountainHeight(float x) {
  float large = fbm(vec2(x * 5., 0.0));
  large = pow(large, 3.);

  float medium = fbm(vec2(x * 10., 20.0));

  return 0.1
    + large * 0.8
    + medium * 0.3;
}

void main() {
  float mountain = mountainHeight(v_uv.x);
  float distance = mountain - v_uv.y;
  float aa = fwidth(distance);

  float aa_scale = .5;
  float mask = smoothstep(-aa_scale * aa, aa_scale * aa, distance);

  vec3 mountainColor = vec3(1.);
  vec3 backgroundColor = vec3(0.04, 0.06, 0.09);

  fragColor = vec4(
      mix(backgroundColor, mountainColor, mask),
      1.0
    );
}
