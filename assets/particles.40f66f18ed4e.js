"use strict";

(() => {
  const stage = document.querySelector("#particle-stage");
  const canvas = document.querySelector("#mxi-particles");
  if (!stage || !canvas || !window.MXIShapes || !window.MXIParticleShaders) return;
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl) return;
  const mask = document.createElement("canvas");
  const maskContext = mask.getContext("2d", { willReadFrequently: true });
  if (!maskContext) return;

  function compile(type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.warn("MXI graphics:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  const vertex = compile(gl.VERTEX_SHADER, window.MXIParticleShaders.vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, window.MXIParticleShaders.fragmentSource);
  if (!vertex || !fragment) return;
  const program = gl.createProgram();
  if (!program) return;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("MXI graphics:", gl.getProgramInfoLog(program));
    return;
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  const edgeBuffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (!buffer || !edgeBuffer || !texture) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const position = gl.getAttribLocation(program, "a_position");
  const traits = gl.getAttribLocation(program, "a_traits");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 76, 0);
  gl.enableVertexAttribArray(traits);
  gl.vertexAttribPointer(traits, 4, gl.FLOAT, false, 76, 12);
  ["a_robot", "a_brain", "a_earth"].forEach((name, index) => {
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 76, 28 + index * 16);
  });
  const uniforms = Object.fromEntries([
    "resolution", "dpr", "time", "echo", "glowPass", "mode", "shapes", "pointer", "pointerActive", "pointerEnergy", "linePass", "lineOpacity", "wordMask"
  ].map(name => [name, gl.getUniformLocation(program, "u_" + name)]));
  uniforms.pulses = gl.getUniformLocation(program, "u_pulses[0]");
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.uniform1i(uniforms.wordMask, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.clearColor(0, 0, 0, 1);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const modes = new Float32Array([1, 0, 0]);
  const pulses = new Float32Array([0, 0, -1000, 0, 0, 0, -1000, 0, 0, 0, -1000, 0]);
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: 0, targetActive: 0, energy: 0 };
  let nextPulse = 0;
  let width = 0;
  let height = 0;
  let count = 0;
  let edgeCount = 0;
  let animationFrame = 0;
  let resizeFrame = 0;
  let lastFrame = 0;
  let lastClock = 0;
  let elapsed = 0;
  let paused = false;
  let visible = true;
  let contextLost = false;
  let pointerDown = null;

  function render() {
    if (contextLost) return;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.time, reduceMotion.matches ? 3 : elapsed);
    gl.uniform3fv(uniforms.mode, modes);
    const shapeTime = reduceMotion.matches ? 3 : elapsed;
    const shapes = window.MXIShapes.weights(shapeTime);
    gl.uniform4fv(uniforms.shapes, shapes);
    gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
    gl.uniform1f(uniforms.pointerActive, paused || reduceMotion.matches ? 0 : pointer.active);
    gl.uniform1f(uniforms.pointerEnergy, pointer.energy);
    gl.uniform4fv(uniforms.pulses, pulses);
    gl.uniform1f(uniforms.echo, 0);
    gl.uniform1f(uniforms.glowPass, 0);
    gl.uniform1f(uniforms.linePass, 1);
    gl.uniform1f(uniforms.lineOpacity, (.018 + modes[1] * .16 + modes[2] * .025) * shapes[0]);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edgeBuffer);
    gl.drawElements(gl.LINES, edgeCount, gl.UNSIGNED_SHORT, 0);
    gl.uniform1f(uniforms.linePass, 0);
    if (!reduceMotion.matches) {
      [.18, .08].forEach(delay => {
        gl.uniform1f(uniforms.echo, delay);
        gl.uniform4fv(uniforms.shapes, window.MXIShapes.weights(Math.max(0, shapeTime - delay)));
        gl.drawArrays(gl.POINTS, 0, count);
      });
    }
    gl.uniform1f(uniforms.echo, 0);
    gl.uniform4fv(uniforms.shapes, shapes);
    gl.uniform1f(uniforms.glowPass, 1);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.uniform1f(uniforms.glowPass, 0);
    gl.drawArrays(gl.POINTS, 0, count);
  }

  function animate(clock) {
    animationFrame = 0;
    const interval = width < 700 ? 1000 / 30 : 1000 / 45;
    if (clock - lastFrame >= interval) {
      const delta = lastClock ? Math.min((clock - lastClock) / 1000, .08) : 0;
      elapsed += delta;
      lastClock = clock;
      lastFrame = clock;
      const smoothing = 1 - Math.exp(-delta * 7);
      const cycle = elapsed % 28;
      const ease = (start, end, value) => {
        const x = Math.min(1, Math.max(0, (value - start) / (end - start)));
        return x * x * (3 - 2 * x);
      };
      const network = ease(7, 10, cycle) * (1 - ease(13, 16, cycle));
      const wave = ease(18, 21, cycle) * (1 - ease(25, 28, cycle));
      modes[0] = 1 - network - wave;
      modes[1] = network;
      modes[2] = wave;
      pointer.x += (pointer.targetX - pointer.x) * smoothing;
      pointer.y += (pointer.targetY - pointer.y) * smoothing;
      pointer.active += (pointer.targetActive - pointer.active) * smoothing;
      pointer.energy *= Math.exp(-delta * 3);
      render();
    }
    if (!paused && visible && !document.hidden && !reduceMotion.matches && !contextLost) animationFrame = requestAnimationFrame(animate);
  }

  function syncAnimation() {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastClock = 0;
    lastFrame = 0;
    render();
    if (!paused && visible && !document.hidden && !reduceMotion.matches && !contextLost) animationFrame = requestAnimationFrame(animate);
  }

  function buildEdges(geometry) {
    const cells = new Map();
    const indices = [];
    const cellSize = 28;
    const maxEdges = width < 700 ? 700 : 1800;
    for (let index = 0; index < geometry.length / 7 && indices.length < maxEdges * 2; index++) {
      const offset = index * 7;
      if (geometry[offset + 6] < .5 || geometry[offset + 2] < 0) continue;
      const x = geometry[offset];
      const y = geometry[offset + 1];
      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(y / cellSize);
      let nearest = -1;
      let bestDistance = cellSize * cellSize;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const candidates = cells.get(`${cellX + dx},${cellY + dy}`) || [];
        candidates.forEach(other => {
          const distance = (geometry[other * 7] - x) ** 2 + (geometry[other * 7 + 1] - y) ** 2;
          if (distance < bestDistance && distance > 9) { bestDistance = distance; nearest = other; }
        });
      }
      if (nearest >= 0) indices.push(index, nearest);
      const key = `${cellX},${cellY}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(index);
    }
    return new Uint16Array(indices);
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
    let fontSize = Math.min(height * 1.02, width * .44);
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
    const baseline = (height + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
    maskContext.fillText("MXI", width / 2, baseline);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);

    const top = Math.max(0, baseline - metrics.actualBoundingBoxAscent);
    const bottom = Math.min(height - 1, baseline + metrics.actualBoundingBoxDescent);
    const left = Math.max(0, (width - metrics.width) / 2);
    const right = Math.min(width - 1, left + metrics.width);
    const gap = width < 700 ? 6 : 9;
    const depth = fontSize * .32;
    const pixels = maskContext.getImageData(0, 0, width, height).data;
    const alphaAt = (x, y) => x < 0 || y < 0 || x >= width || y >= height ? 0 : pixels[(Math.floor(y) * width + Math.floor(x)) * 4 + 3];
    const candidates = [];
    for (let y = top; y <= bottom; y += gap) for (let x = left; x <= right; x += gap) {
      if (alphaAt(x, y) < 160) continue;
      const px = x - width / 2 + (Math.random() - .5) * 1.5;
      const py = height / 2 - y;
      const size = width < 700 ? 8 + Math.random() * 1.5 : 11 + Math.random() * 2;
      candidates.push([px, py, depth / 2, size, Math.random() * Math.PI * 2, .78 + Math.random() * .22, 1]);
      candidates.push([px, py, -depth / 2, size * .8, Math.random() * Math.PI * 2, .22 + Math.random() * .12, 1]);
      const edge = alphaAt(x, y) > 160 && (alphaAt(x - gap, y) < 100 || alphaAt(x + gap, y) < 100 || alphaAt(x, y - gap) < 100 || alphaAt(x, y + gap) < 100);
      if (edge) {
        for (let z = -depth / 2 + gap; z < depth / 2; z += gap * 1.4) {
          candidates.push([px, py, z, size * .88, Math.random() * Math.PI * 2, .4 + Math.random() * .2, 1]);
        }
      }
    }
    const limit = width < 700 ? 2800 : 6800;
    const stride = Math.max(1, candidates.length / limit);
    const geometry = [];
    for (let index = 0; index < candidates.length; index += stride) geometry.push(...candidates[Math.floor(index)]);
    const letterCount = geometry.length / 7;
    const floorCount = width < 700 ? 180 : 420;
    for (let index = 0; index < floorCount; index++) {
      geometry.push((Math.random() - .5) * width, height / 2 - bottom - 30, (Math.random() - .5) * 480,
        6 + Math.random() * 2, Math.random() * Math.PI * 2, .04 + Math.random() * .08, 0);
    }
    count = geometry.length / 7;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const packed = [];
    const robotScale = Math.min(width * .29, height * .39);
    const roundScale = Math.min(width * .29, height * .37);
    for (let index = 0; index < count; index++) {
      packed.push(...geometry.slice(index * 7, index * 7 + 7));
      if (index < letterCount) {
        packed.push(...window.MXIShapes.robot(index, robotScale),
          ...window.MXIShapes.brain(index, letterCount, roundScale),
          ...window.MXIShapes.earth(index, letterCount, roundScale));
      } else packed.push(0,0,0,0, 0,0,0,0, 0,0,0,0);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(packed), gl.STATIC_DRAW);
    const edges = buildEdges(geometry);
    edgeCount = edges.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edgeBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
    stage.classList.add("is-ready");
    syncAnimation();
  }

  function updatePointer(event) {
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left - width / 2;
    const y = height / 2 - (event.clientY - bounds.top);
    pointer.energy = Math.min(1, Math.hypot(x - pointer.targetX, y - pointer.targetY) / 35);
    pointer.targetX = x;
    pointer.targetY = y;
    pointer.targetActive = 1;
  }

  function sendPulse(x = 0, y = 0) {
    if (paused || reduceMotion.matches || contextLost) return;
    pulses.set([x, y, elapsed, 1], nextPulse * 4);
    nextPulse = (nextPulse + 1) % 3;
  }

  stage.addEventListener("pointermove", event => {
    if (paused || reduceMotion.matches || event.pointerType === "touch") return;
    updatePointer(event);
  }, { passive: true });
  stage.addEventListener("pointerleave", () => { pointer.targetActive = 0; });
  stage.addEventListener("pointerdown", event => { pointerDown = { x: event.clientX, y: event.clientY }; }, { passive: true });
  stage.addEventListener("pointercancel", () => { pointerDown = null; pointer.targetActive = 0; });
  stage.addEventListener("pointerup", event => {
    if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 12) { pointerDown = null; return; }
    updatePointer(event);
    sendPulse(pointer.targetX, pointer.targetY);
    if (event.pointerType === "touch") pointer.targetActive = 0;
    pointerDown = null;
  });
  stage.addEventListener("keydown", event => {
    if (event.key === "Enter") { event.preventDefault(); sendPulse(); }
    if (event.key === " ") { event.preventDefault(); paused = !paused; syncAnimation(); }
  });
  document.addEventListener("visibilitychange", () => { pointer.targetActive = 0; syncAnimation(); });
  reduceMotion.addEventListener("change", syncAnimation);
  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(animationFrame);
    stage.classList.remove("is-ready");
  });
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(resize); }).observe(stage);
  } else window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncAnimation(); }, { threshold: 0 }).observe(stage);
  }
  resize();
})();
