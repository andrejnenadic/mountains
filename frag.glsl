#version 300 es
precision highp float;

in vec2 v_uv;

out vec4 fragColor;

uniform float u_seed;
uniform float u_frequency;
uniform float u_amplitude;
uniform float u_detail;
uniform float u_yOffset;
uniform float u_atmosphere_start;
uniform float u_atmosphere_strength;

uniform vec4 u_color;
uniform vec3 u_sky_color;

float hash(vec2 p) {
  p += u_seed;

  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
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

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 4; i++) {
    value += noise(p) * amplitude;

    p *= 2.0;
    amplitude *= 0.6;
  }

  return value;
}

float mountainHeight(float x) {
  float large = fbm(vec2(x * u_frequency + u_seed, u_seed));

  large = pow(large, 1.7);

  float medium = fbm(vec2(x * u_frequency * 3.0 + u_seed, u_seed + 20.0));

  return u_yOffset + large * u_amplitude + medium * u_detail;
}

void main() {
  float mountain = mountainHeight(v_uv.x);
  float distance = mountain - v_uv.y;
  float aa = fwidth(distance);

  float aa_scale = .5;
  float mask = smoothstep(-aa_scale * aa, aa_scale * aa, distance);

  float atmosphere = smoothstep(u_atmosphere_start, 1., 1. - distance);
  vec3 color = mix(u_color.xyz, u_sky_color, atmosphere * u_atmosphere_strength);
  color += atmosphere * u_atmosphere_strength * 0.25;

  fragColor = vec4(color, mask * u_color.a);
}
