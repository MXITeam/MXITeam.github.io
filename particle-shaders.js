"use strict";

window.MXIParticleShaders = Object.freeze({
  vertexSource: `
    precision highp float;
    attribute vec3 a_position;
    attribute vec4 a_traits;
    attribute vec4 a_robot;
    attribute vec4 a_brain;
    attribute vec4 a_earth;
    uniform mediump vec2 u_resolution;
    uniform mediump float u_dpr;
    uniform float u_time;
    uniform float u_echo;
    uniform mediump float u_glowPass;
    uniform vec3 u_mode;
    uniform vec4 u_shapes;
    uniform vec2 u_pointer;
    uniform float u_pointerActive;
    uniform float u_pointerEnergy;
    uniform vec4 u_pulses[3];
    varying mediump float v_alpha;
    varying mediump float v_light;
    varying mediump float v_digit;
    varying mediump float v_isLetter;
    varying mediump float v_depth;
    varying mediump float v_mxiWeight;
    void main() {
      float t = max(0.0, u_time - u_echo);
      float phase = a_traits.y;
      vec3 p = a_position;
      if (a_traits.w > 0.5) {
        vec3 stream = vec3(p.x + sin(t * 0.9 + phase) * 1.6, p.y + cos(t * 0.8 + phase) * 1.6, p.z);
        vec3 network = vec3(p.x + sin(t * 0.6 + phase) * 0.6, p.y + cos(t * 0.6 + phase) * 0.6, p.z);
        float wave = sin(p.x * 0.028 - t * 1.5 + phase * 0.1);
        vec3 waves = vec3(p.x + wave * 1.8, p.y + wave * 2.2, p.z);
        vec3 letters = stream * u_mode.x + network * u_mode.y + waves * u_mode.z;
        p = letters * u_shapes.x + a_robot.xyz * u_shapes.y + a_brain.xyz * u_shapes.z + a_earth.xyz * u_shapes.w;
      } else {
        p.y += sin(p.x * 0.017 + t * 0.8) * 2.5;
      }
      // A fixed oblique camera shows the extrusion without rocking the letters.
      float cy = cos(-0.26);
      float sy = sin(-0.26);
      float cx = cos(0.085);
      float sx = sin(0.085);
      vec2 screen = vec2(cy * p.x + sy * p.z, cx * p.y + sx * sy * p.x - sx * cy * p.z);
      vec2 delta = screen - u_pointer;
      float distance = length(delta);
      float radius = min(u_resolution.x * 0.27, 170.0);
      float influence = (1.0 - smoothstep(0.0, radius, distance)) * u_pointerActive * a_traits.w;
      float angle = influence * (0.55 + sin(t * 0.8) * 0.18 + u_pointerEnergy * 0.35);
      vec2 rotated = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * delta;
      screen = mix(screen, u_pointer + rotated, influence);
      screen += delta / max(distance, 1.0) * influence * 13.0;
      float pulseLight = 0.0;
      for (int index = 0; index < 3; index++) {
        vec4 pulse = u_pulses[index];
        float age = t - pulse.z;
        if (age >= 0.0 && age < 3.5) {
          vec2 outward = screen - pulse.xy;
          float pulseDistance = length(outward);
          float front = age * (220.0 + u_resolution.x * 0.24);
          float ring = (pulseDistance - front) / 38.0;
          float energy = exp(-ring * ring) * exp(-age * 0.9) * pulse.w;
          screen += outward / max(pulseDistance, 1.0) * energy * 32.0;
          pulseLight += energy * 0.45;
        }
      }
      gl_Position = vec4(screen.x / (u_resolution.x * 0.5), screen.y / (u_resolution.y * 0.5), 0.0, 1.0);
      float shimmer = 0.92 + 0.08 * sin(t * 1.8 + phase * 4.0);
      gl_PointSize = clamp(a_traits.x * u_dpr * mix(1.0, 2.2, u_glowPass), 6.0, 52.0);
      float echoOpacity = u_echo > 0.0 ? 0.11 * exp(-u_echo * 4.0) : 1.0;
      float reveal = smoothstep(0.0, 1.4, t + phase * 0.04);
      float objectAlpha = dot(u_shapes, vec4(a_traits.z, a_robot.w, a_brain.w, a_earth.w));
      v_alpha = mix(a_traits.z, objectAlpha, a_traits.w) * shimmer * echoOpacity * reveal;
      float scanDistance = (sin(t * 0.32) * u_resolution.x * 0.42 - screen.x) / 65.0;
      float scan = exp(-scanDistance * scanDistance);
      v_light = 0.9 + scan * 0.16 + influence * 0.16 + pulseLight;
      v_digit = step(0.5, fract(phase * 0.23 + floor(t * 0.5 + phase) * 0.618));
      v_isLetter = a_traits.w;
      v_depth = p.z;
      v_mxiWeight = u_shapes.x;
    }
  `,
  fragmentSource: `
    precision mediump float;
    uniform mediump vec2 u_resolution;
    uniform mediump float u_dpr;
    uniform mediump float u_glowPass;
    uniform float u_linePass;
    uniform float u_lineOpacity;
    uniform sampler2D u_wordMask;
    varying mediump float v_alpha;
    varying mediump float v_light;
    varying mediump float v_digit;
    varying mediump float v_isLetter;
    varying mediump float v_depth;
    varying mediump float v_mxiWeight;
    float segmentDistance(vec2 point, vec2 start, vec2 end) {
      vec2 direction = end - start;
      float fraction = clamp(dot(point - start, direction) / dot(direction, direction), 0.0, 1.0);
      return length(point - start - direction * fraction);
    }
    void main() {
      // Invert the same fixed camera at this layer's depth. Every slice keeps
      // the original MXI outline, producing a stable, genuinely extruded volume.
      vec2 screen = gl_FragCoord.xy / u_dpr - u_resolution * 0.5;
      float cy = cos(-0.26);
      float sy = sin(-0.26);
      float cx = cos(0.085);
      float sx = sin(0.085);
      float localX = (screen.x - sy * v_depth) / cy;
      float localY = (screen.y - sx * sy * localX + sx * cy * v_depth) / cx;
      vec2 uv = vec2((localX + u_resolution.x * 0.5) / u_resolution.x, (u_resolution.y * 0.5 - localY) / u_resolution.y);
      float coverage = texture2D(u_wordMask, uv).a;
      float maskWeight = smoothstep(0.96, 1.0, v_mxiWeight);
      float edgeAlpha = v_isLetter > 0.5 ? mix(1.0, coverage, maskWeight) : 1.0;
      if (edgeAlpha < 0.01) discard;
      if (u_linePass > 0.5) {
        gl_FragColor = vec4(vec3(0.71, 0.82, 1.0), v_alpha * u_lineOpacity * edgeAlpha);
        return;
      }
      vec2 point = (gl_PointCoord - vec2(0.5)) * vec2(2.0, -2.0);
      float zeroDistance = abs(length(point / vec2(0.38, 0.66)) - 1.0) * 0.38;
      float oneDistance = min(
        segmentDistance(point, vec2(0.04, -0.64), vec2(0.04, 0.64)),
        min(segmentDistance(point, vec2(-0.26, 0.38), vec2(0.04, 0.64)),
            segmentDistance(point, vec2(-0.26, -0.64), vec2(0.31, -0.64)))
      );
      float glyph = 1.0 - smoothstep(0.055, 0.13, mix(zeroDistance, oneDistance, v_digit));
      float halo = exp(-dot(point, point) * 4.0) * 0.065;
      float alpha = mix(glyph * 1.3, halo, u_glowPass) * v_alpha * edgeAlpha;
      if (alpha < 0.008) discard;
      gl_FragColor = vec4(vec3(0.95, 0.98, 1.0) * v_light, alpha);
    }
  `
});
