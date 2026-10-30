"use strict";

// Sample the original, reference-guided sculpture sheet into layered point targets.
// Its lighting supplies detail and depth while the fixed view keeps its silhouette.
window.MXIReference = (() => {
  const panels = new Map();
  let available = false;
  const names = ["robot", "brain", "earth"];
  const image = new Image();
  image.decoding = "async";
  const ready = new Promise(resolve => {
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 512;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) { resolve(false); return; }
        names.forEach((name, column) => {
          context.clearRect(0, 0, 512, 512);
          context.drawImage(image, column * image.naturalWidth / 3, 0, image.naturalWidth / 3, image.naturalHeight, 0, 0, 512, 512);
          const pixels = context.getImageData(0, 0, 512, 512).data;
          const positions = [];
          const luminance = [];
          const cumulative = [];
          let sum = 0;
          let minX = 512, minY = 512, maxX = 0, maxY = 0;
          for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
            const offset = (y * 512 + x) * 4;
            const alpha = pixels[offset + 3] / 255;
            const light = (pixels[offset] * .2126 + pixels[offset + 1] * .7152 + pixels[offset + 2] * .0722) / 255;
            if (alpha < .12 || light < .035) continue;
            positions.push(x, y);
            luminance.push(light);
            sum += Math.pow(light, .62) * alpha;
            cumulative.push(sum);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          }
          if (!sum) throw new Error("Empty reference panel: " + name);
          panels.set(name, {
            positions: new Uint16Array(positions), light: new Float32Array(luminance),
            cumulative: new Float64Array(cumulative), sum,
            centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2,
            width: maxX - minX + 1, height: maxY - minY + 1
          });
        });
        available = true;
        resolve(true);
      } catch (error) {
        console.warn("MXI reference targets:", error);
        resolve(false);
      }
    };
    image.onerror = () => { console.warn("MXI reference image could not load."); resolve(false); };
    image.src = "./assets/sculpture-reference.ff7bd67ab934.png";
  });

  function sample(name, index, count, maxWidth, maxHeight) {
    const panel = panels.get(name);
    if (!panel || count < 1) return [0, 0, 0, 0];
    const noise = Math.sin(index * 12.9898 + 7.23) * 43758.5453;
    const fraction = noise - Math.floor(noise);
    const quantile = (index + .25 + fraction * .5) / count * panel.sum;
    let low = 0, high = panel.cumulative.length - 1;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (panel.cumulative[middle] < quantile) low = middle + 1;
      else high = middle;
    }
    const fit = Math.min(maxWidth / panel.width, maxHeight / panel.height);
    const light = panel.light[low];
    const screenX = (panel.positions[low * 2] - panel.centerX + (fraction - .5) * .7) * fit;
    const screenY = (panel.centerY - panel.positions[low * 2 + 1] + Math.sin(index * 2.31) * .3) * fit;
    const displaySize = Math.max(panel.width, panel.height) * fit;
    const jitter = Math.sin(index * 12.9898) * .5;
    const depth = (light - .45) * displaySize * .12 + jitter * displaySize * .015;
    const cy = Math.cos(-.26), sy = Math.sin(-.26);
    const cx = Math.cos(.085), sx = Math.sin(.085);
    const x = (screenX - sy * depth) / cy;
    const y = (screenY - sx * sy * x + sx * cy * depth) / cx;
    return [x, y, depth, .24 + Math.pow(light, .8) * .72];
  }
  return Object.freeze({ ready, sample, get available() { return available; } });
})();
