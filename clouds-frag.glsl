#version 300 es
precision highp float;

in vec2 v_uv;

out vec4 fragColor;

uniform float u_seed;
uniform float u_time;
uniform vec3 u_clouds_color;
uniform vec3 u_sky_color;

vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float perlin(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
      dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
      dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

float stackedWavedPerlin(vec2 uv) {
  float n = 0.0;
  float amp = 1.0;
  float freq = 1.0;
  vec2 time_offset = vec2(-u_time * freq * 0.05, u_time * freq * 0.03) + u_seed * 3794.272;

  for (int i = 0; i < 8; i++) {
    n += perlin(uv * freq + time_offset) * amp;
    n += perlin(uv + 0.1 * freq + time_offset) * amp * 0.25;
    n += perlin(uv - 0.1 * freq + time_offset) * amp * 0.25;

    freq *= 2.0;
    amp *= 0.5;
  }

  return n;
}

vec3 skyTexture(vec2 uv) {
  float m = stackedWavedPerlin(uv);

  vec3 gradientSky = mix(u_sky_color * 0.95, u_sky_color, uv.y);

  // vec3 c1 = mix(gradientSky, u_clouds_color, smoothstep(0.0, 0.5, m * 2.5));
  // vec3 c2 = mix(c1, u_clouds_color / 1.05, smoothstep(0.0, 1.25, m * 2.));
  // vec3 c3 = mix(c2, u_clouds_color / 1.2, smoothstep(0.0, 1.5, m * 1.5));
  // vec3 c4 = mix(c3, u_clouds_color / 1.75, smoothstep(0.0, 2.5, m));

  vec3 c = mix(gradientSky, u_clouds_color, smoothstep(0.4, 0.5, m * 1.5));
  return c;
}

void main() {
  vec3 t = skyTexture(v_uv * 4.);
  //  t += skyTexture(v_uv * 2.) * 0.1;

  fragColor = vec4(t, 1.);
}
