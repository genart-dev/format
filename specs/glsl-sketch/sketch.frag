#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_seed;
uniform float u_noiseScale;
uniform vec3 u_color1;
uniform vec3 u_color2;
out vec4 fragColor;
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float gradient = smoothstep(0.0, 1.0, uv.y + sin(uv.x * u_noiseScale) * 0.1);
  vec3 color = mix(u_color1, u_color2, gradient);
  fragColor = vec4(color, 1.0);
}