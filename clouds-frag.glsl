#version 300 es
precision highp float;

in vec2 v_uv;

out vec4 fragColor;

uniform float u_seed;
uniform float u_time;
uniform float u_perlin_freq;
uniform float u_perlin_amp;
uniform float u_cloud_speed_x;
uniform float u_cloud_speed_y;
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
  float amp = u_perlin_amp;
  float freq = u_perlin_freq;
  vec2 time_offset = vec2(-u_time * freq * u_cloud_speed_x, u_time * freq * u_cloud_speed_y) + u_seed * 3794.272;

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
  vec3 gradient_sky = mix(u_sky_color * 0.95, u_sky_color, uv.y);
  // return mix(gradient_sky, u_clouds_color, m); // cool smoke like clouds bg
  return mix(gradient_sky, u_clouds_color, smoothstep(0.4, 0.5, m * 1.5));
}

void main() {
  vec3 t = skyTexture(v_uv * 4.);
  fragColor = vec4(t, 1.);
}
