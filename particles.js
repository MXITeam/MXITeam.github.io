"use strict";

// Volumetric binary lettering. Geometry and 0/1 glyphs are generated locally.
(() => {
  const stage = document.querySelector("#particle-stage");
  const canvas = document.querySelector("#mxi-particles");
  const motionToggle = document.querySelector("#motion-toggle");
  if (!stage || !canvas || !motionToggle) return;

  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl) return;
  const mask = document.createElement("canvas");
  const maskContext = mask.getContext("2d", { willReadFrequently: true });
  if (!maskContext) return;

  const vertexSource = `
    precision highp float;
    attribute vec3 a_position;
    attribute vec4 a_traits;
    uniform vec2 u_resolution;
    uniform vec2 u_pointer;
    uniform float u_pointerActive;
    uniform float u_time;
    uniform float u_dpr;
    uniform mediump float u_glowPass;
    varying mediump float v_alpha;
    varying mediump float v_light;
    varying mediump float v_digit;
    void main() {
      float t = u_time;
      float phase = a_traits.y;
      float isLetter = a_traits.w;
      vec3 p = a_position;
      float cycle = mod(t, 14.0);
      float burst = smoothstep(9.0, 10.4, cycle) * (1.0 - smoothstep(11.3, 13.5, cycle));
      float entrance = 1.0 - smoothstep(0.0, 2.4, t);
      p.x += sin(t * 1.5 + phase) * 2.4 * isLetter;
      p.y += cos(t * 1.25 + phase) * 2.0 * isLetter;
      p.z += sin(p.x * 0.018 + p.y * 0.02 + t * 1.7 + phase * 0.2) * 10.0;
      vec3 direction = vec3(sin(phase * 2.7), cos(phase * 1.6), sin(phase * 3.1));
      p += direction * (burst * 31.0 + entrance * u_resolution.x * 0.22) * isLetter;

      float rotateY = -0.24 + sin(t * 0.34) * 0.26;
      float rotateX = 0.09 + sin(t * 0.27) * 0.055;
      float rotateZ = sin(t * 0.22) * 0.018;
      p.xz = mat2(cos(rotateY), -sin(rotateY), sin(rotateY), cos(rotateY)) * p.xz;
      p.yz = mat2(cos(rotateX), -sin(rotateX), sin(rotateX), cos(rotateX)) * p.yz;
      p.xy = mat2(cos(rotateZ), -sin(rotateZ), sin(rotateZ), cos(rotateZ)) * p.xy;

      float camera = max(u_resolution.x * 1.25, 850.0);
      float perspective = camera / (camera - p.z);
      vec2 screen = p.xy * perspective;
      vec2 difference = screen - u_pointer;
      float distance = length(difference);
      float pointerRadius = min(u_resolution.x * 0.23, 150.0);
      float influence = (1.0 - smoothstep(0.0, pointerRadius, distance)) * u_pointerActive * isLetter;
      screen += difference / max(distance, 1.0) * influence * 43.0;
      gl_Position = vec4(screen.x / (u_resolution.x * 0.5), screen.y / (u_resolution.y * 0.5), 0.0, 1.0);
      float sparkle = 0.82 + 0.18 * sin(t * 2.0 + phase * 4.0);
      float glowScale = mix(1.0, 2.2, u_glowPass);
      gl_PointSize = clamp(a_traits.x * perspective * u_dpr * sparkle * glowScale, 6.0, 52.0);
      v_alpha = a_traits.z * (0.7 + 0.3 * sparkle);
      v_light = 0.94 + 0.06 * sin(p.x * 0.006 - t * 0.7 + phase);
      v_digit = step(0.5, fract(phase * 0.23 + floor(t * 0.5 + phase) * 0.618));
    }
  `;
  const fragmentSource = `
    precision mediump float;
    varying mediump float v_alpha;
    varying mediump float v_light;
    varying mediump float v_digit;
    uniform mediump float u_glowPass;
    float segmentDistance(vec2 point, vec2 start, vec2 end) {
      vec2 direction = end - start;
      float fraction = clamp(dot(point - start, direction) / dot(direction, direction), 0.0, 1.0);
      return length(point - start - direction * fraction);
    }
    void main() {
      vec2 point = (gl_PointCoord - vec2(0.5)) * vec2(2.0, -2.0);
      // Signed-distance-style masks keep each binary digit crisp at any scale.
      float zeroDistance = abs(length(point / vec2(0.38, 0.66)) - 1.0) * 0.38;
      float oneDistance = min(
        segmentDistance(point, vec2(0.04, -0.64), vec2(0.04, 0.64)),
        min(segmentDistance(point, vec2(-0.26, 0.38), vec2(0.04, 0.64)),
            segmentDistance(point, vec2(-0.26, -0.64), vec2(0.31, -0.64)))
      );
      float glyphDistance = mix(zeroDistance, oneDistance, v_digit);
      float glyph = 1.0 - smoothstep(0.055, 0.13, glyphDistance);
      float halo = exp(-dot(point, point) * 4.0) * 0.065;
      float alpha = mix(glyph * 1.25, halo, u_glowPass) * v_alpha;
      if (alpha < 0.008) discard;
      gl_FragColor = vec4(vec3(0.95, 0.98, 1.0) * v_light, alpha);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  }
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return;
  const program = gl.createProgram();
  if (!program) return;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  if (!buffer) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const position = gl.getAttribLocation(program, "a_position");
  const traits = gl.getAttribLocation(program, "a_traits");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 28, 0);
  gl.enableVertexAttribArray(traits);
  gl.vertexAttribPointer(traits, 4, gl.FLOAT, false, 28, 12);
  const uniforms = Object.fromEntries(["resolution", "pointer", "pointerActive", "time", "dpr", "glowPass"].map(name => [name, gl.getUniformLocation(program, "u_" + name)]));
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.clearColor(0, 0, 0, 1);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let count = 0;
  let animationFrame = 0;
  let resizeFrame = 0;
  let lastFrame = 0;
  let lastClock = 0;
  let elapsed = 0;
  let paused = false;
  let visible = true;
  let contextLost = false;
  let pointerActive = 0;
  let pointerX = 0;
  let pointerY = 0;

  function render() {
    if (contextLost) return;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.time, reduceMotion.matches ? 3 : elapsed);
    gl.uniform2f(uniforms.pointer, pointerX, pointerY);
    gl.uniform1f(uniforms.pointerActive, paused || reduceMotion.matches ? 0 : pointerActive);
    gl.uniform1f(uniforms.glowPass, 1);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.uniform1f(uniforms.glowPass, 0);
    gl.drawArrays(gl.POINTS, 0, count);
  }

  function animate(clock) {
    animationFrame = 0;
    const interval = width < 700 ? 1000 / 30 : 1000 / 45;
    if (clock - lastFrame >= interval) {
      if (lastClock) elapsed += Math.min((clock - lastClock) / 1000, .08);
      lastClock = clock;
      lastFrame = clock;
      render();
    }
    if (!paused && visible && !document.hidden && !reduceMotion.matches && !contextLost) animationFrame = requestAnimationFrame(animate);
  }

  function syncAnimation() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastClock = 0;
    lastFrame = 0;
    motionToggle.hidden = reduceMotion.matches || contextLost;
    render();
    if (!paused && visible && !document.hidden && !reduceMotion.matches && !contextLost) animationFrame = requestAnimationFrame(animate);
  }

  function resize() {
    if (contextLost) return;
    const bounds = stage.getBoundingClientRect();
    const nextWidth = Math.round(bounds.width);
    const nextHeight = Math.round(bounds.height);
    if (!nextWidth || !nextHeight || (width === nextWidth && height === nextHeight)) return;
    width = nextWidth;
    height = nextHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform1f(uniforms.dpr, dpr);
    mask.width = width;
    mask.height = height;
    let fontSize = Math.min(height * .93, width * .44);
    const setFont = () => { maskContext.font = `900 ${fontSize}px "Arial Black", Arial, sans-serif`; };
    setFont();
    let metrics = maskContext.measureText("MXI");
    if (metrics.width > width * .82) {
      fontSize *= width * .82 / metrics.width;
      setFont();
      metrics = maskContext.measureText("MXI");
    }
    maskContext.fillStyle = "white";
    maskContext.textAlign = "center";
    const baseline = (height + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2 - height * .025;
    maskContext.fillText("MXI", width / 2, baseline);
    const pixels = maskContext.getImageData(0, 0, width, height).data;
    const alphaAt = (x, y) => x < 0 || y < 0 || x >= width || y >= height ? 0 : pixels[(Math.floor(y) * width + Math.floor(x)) * 4 + 3];
    const gap = width < 700 ? 5 : 8;
    const depth = fontSize * .23;
    const candidates = [];
    const addPoint = (x, y, z, size, opacity, letter = 1) => candidates.push([x, y, z, size, Math.random() * Math.PI * 2, opacity, letter]);
    for (let y = gap; y < height - gap; y += gap) {
      for (let x = gap; x < width - gap; x += gap) {
        if (alphaAt(x, y) < 160) continue;
        const px = x - width / 2 + (Math.random() - .5) * gap * .3;
        const py = height / 2 - y + (Math.random() - .5) * gap * .3;
        const size = width < 700 ? 7 + Math.random() * 2 : 10 + Math.random() * 3;
        addPoint(px, py, depth / 2, size, .65 + Math.random() * .35);
        addPoint(px, py, -depth / 2, size * .8, .18 + Math.random() * .2);
        const edge = alphaAt(x - gap, y) < 100 || alphaAt(x + gap, y) < 100 || alphaAt(x, y - gap) < 100 || alphaAt(x, y + gap) < 100;
        if (edge) {
          for (let z = -depth / 2; z < depth / 2; z += gap * 1.6) addPoint(px, py, z, size, .5 + Math.random() * .4);
        } else if (Math.random() < .12) {
          addPoint(px, py, (Math.random() - .5) * depth, size * .75, .25);
        }
      }
    }
    const limit = width < 700 ? 3000 : 7000;
    const stride = Math.max(1, candidates.length / limit);
    const geometry = [];
    for (let index = 0; index < candidates.length; index += stride) geometry.push(...candidates[Math.floor(index)]);
    // A quiet floor of binary digits anchors the letters in the same 3D space.
    const floorY = -(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) / 2 - height * .06;
    const floorCount = width < 700 ? 220 : 500;
    for (let index = 0; index < floorCount; index++) {
      const x = (Math.random() - .5) * width * 1.25;
      const z = (Math.random() - .5) * 580;
      geometry.push(x, floorY, z, 6 + Math.random() * 3, Math.random() * Math.PI * 2, .06 + Math.random() * .14, 0);
    }
    count = geometry.length / 7;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry), gl.STATIC_DRAW);
    stage.classList.add("is-ready");
    syncAnimation();
  }

  stage.addEventListener("pointermove", event => {
    if (event.pointerType === "touch" || paused || reduceMotion.matches) return;
    const bounds = canvas.getBoundingClientRect();
    pointerX = event.clientX - bounds.left - width / 2;
    pointerY = height / 2 - (event.clientY - bounds.top);
    pointerActive = 1;
  }, { passive: true });
  stage.addEventListener("pointerleave", () => { pointerActive = 0; });
  motionToggle.addEventListener("click", () => {
    paused = !paused;
    motionToggle.querySelector(".motion-label").textContent = paused ? "Resume animation" : "Pause animation";
    motionToggle.querySelector(".motion-icon").textContent = paused ? "▷" : "Ⅱ";
    syncAnimation();
  });
  document.addEventListener("visibilitychange", () => { pointerActive = 0; syncAnimation(); });
  reduceMotion.addEventListener("change", syncAnimation);
  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(animationFrame);
    stage.classList.remove("is-ready");
    motionToggle.hidden = true;
  });
  // Keep the readable heading if graphics resources are unavailable or lost.
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(resize);
    }).observe(stage);
  } else window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncAnimation(); }, { threshold: 0 }).observe(stage);
  }
  resize();
})();
