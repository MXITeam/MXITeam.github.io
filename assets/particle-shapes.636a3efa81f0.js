"use strict";

// Deterministic 3D targets; no model downloads or external textures.
window.MXIShapes = (() => {
  const TAU = Math.PI * 2;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const random = (index, salt) => {
    const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
    return value - Math.floor(value);
  };
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  function box(center, half, u, v, face) {
    const p = [(u * 2 - 1) * half[0], (v * 2 - 1) * half[1], 0];
    const axis = Math.floor(face * 6) % 3;
    const sign = face < .5 ? 1 : -1;
    const others = [0, 1, 2].filter(value => value !== axis);
    p[axis] = sign * half[axis];
    p[others[0]] = (u * 2 - 1) * half[others[0]];
    p[others[1]] = (v * 2 - 1) * half[others[1]];
    return p.map((value, index) => value + center[index]);
  }
  function tube(a, b, radius, u, angle) {
    const axis = b.map((value, index) => value - a[index]);
    const length = Math.hypot(...axis);
    const n = axis.map(value => value / length);
    const guide = Math.abs(n[1]) < .9 ? [0, 1, 0] : [1, 0, 0];
    const tangent = [n[1] * guide[2] - n[2] * guide[1], n[2] * guide[0] - n[0] * guide[2], n[0] * guide[1] - n[1] * guide[0]];
    const tangentLength = Math.hypot(...tangent);
    const t = tangent.map(value => value / tangentLength);
    const q = [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]];
    return a.map((value, index) => value + axis[index] * u + radius * (Math.cos(angle) * t[index] + Math.sin(angle) * q[index]));
  }
  function robot(index, scale) {
    const pick = random(index, 1);
    const u = random(index, 2);
    const v = random(index, 3);
    const angle = v * TAU;
    let p;
    let alpha = .72;
    if (pick < .28) {
      p = box([0, .64, 0], [.54, .37, .31], u, v, random(index, 4));
      if (p[2] > .3 && Math.abs(p[0]) < .43 && p[1] > .39 && p[1] < .86) alpha = .07;
    } else if (pick < .36) {
      const eyeX = random(index, 5) < .5 ? -.23 : .23;
      const radius = .075 + random(index, 6) * .02;
      p = [eyeX + Math.cos(angle) * radius, .67 + Math.sin(angle) * radius, .335];
      alpha = 1;
    } else if (pick < .395) {
      p = [(u - .5) * .38, .43 + (Math.floor(v * 3) - 1) * .035, .338];
      alpha = .95;
    } else if (pick < .44) {
      const side = random(index, 5) < .5 ? -1 : 1;
      p = tube([side * .55, .63, 0], [side * .66, .63, 0], .12, u, angle);
    } else if (pick < .47) {
      p = tube([0, 1.01, 0], [0, 1.24, 0], .027, u, angle);
      if (u > .8) p = [Math.cos(angle) * .065, 1.25 + Math.sin(angle) * .065, (random(index, 5) - .5) * .08];
      alpha = .9;
    } else if (pick < .51) {
      p = tube([0, .12, 0], [0, .27, 0], .15, u, angle);
    } else if (pick < .73) {
      p = box([0, -.36, 0], [.48, .42, .27], u, v, random(index, 4));
      if (p[2] > .26 && Math.abs(p[0]) < .32 && p[1] > -.64 && p[1] < -.1) alpha = .25;
    } else if (pick < .89) {
      const side = random(index, 5) < .5 ? -1 : 1;
      p = u < .5 ? tube([side * .61, -.08, 0], [side * .83, -.45, .02], .105, u * 2, angle)
        : tube([side * .83, -.45, .02], [side * .77, -.83, .13], .09, (u - .5) * 2, angle);
    } else if (pick < .95) {
      const side = random(index, 5) < .5 ? -1 : 1;
      p = box([side * .77, -.9, .14], [.115, .1, .1], u, v, random(index, 4));
    } else {
      const radius = .13 + random(index, 6) * .025;
      p = [Math.cos(angle) * radius, -.29 + Math.sin(angle) * radius, .29];
      alpha = 1;
    }
    return [p[0] * scale, (p[1] - .12) * scale, p[2] * scale, alpha];
  }
  function brain(index, count, scale) {
    const u = (index + .5) / count;
    const y = 1 - 2 * u;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = index * goldenAngle;
    const theta = Math.acos(y);
    const nx = ring * Math.cos(phi);
    const nz = ring * Math.sin(phi);
    const folds = Math.sin(phi * 12 + 2.5 * Math.sin(theta * 5)) * Math.sin(theta * 11 + Math.sin(phi * 3));
    const ripple = 1 + folds * .065 + Math.sin(theta * 24 + phi * 2) * .018;
    let x = nx * 1.13 * ripple;
    let py = y * .79 * ripple + .12;
    let z = nz * .86 * ripple;
    const cleft = Math.exp(-nx * nx * 180);
    py -= cleft * Math.max(0, y) * .15;
    z -= cleft * Math.max(0, nz) * .10;
    x += Math.sign(nx) * .018;
    let alpha = .10 + (.5 + folds * .5) ** 3 * .86;
    if (nz > 0) alpha *= 1 - cleft * .75;
    const pick = random(index, 11);
    if (pick < .065) {
      const p = tube([-.04, -.53, -.08], [.08, -.98, -.1], .10, random(index, 12), random(index, 13) * TAU);
      [x, py, z] = p;
      alpha = .65;
    } else if (pick < .14) {
      const r = 1 + Math.sin(phi * 18) * .04;
      x = nx * .39 * r;
      py = -.5 + y * .27 * r;
      z = -.3 + nz * .32 * r;
      alpha = .5;
    }
    const front = .25 + .75 * clamp((nz + .3) / 1.3, 0, 1);
    return [x * scale, py * scale, z * scale, alpha * front];
  }
  // Stylized continental outlines, sufficient for a recognizable globe.
  const continents = [
    [[-17,36],[1,37],[14,33],[32,31],[43,13],[51,10],[43,-12],[35,-25],[18,-35],[9,-27],[2,-4],[-10,5],[-17,16]],
    [[-10,36],[-10,54],[6,58],[24,71],[50,70],[72,76],[110,72],[150,60],[178,65],[177,50],[140,36],[124,23],[109,5],[98,20],[84,21],[76,8],[67,25],[55,25],[45,13],[35,32],[25,36],[15,45],[4,42]],
    [[-168,67],[-147,71],[-128,55],[-121,48],[-125,40],[-113,29],[-104,20],[-88,17],[-80,8],[-77,18],[-81,28],[-66,45],[-55,52],[-61,61],[-86,70],[-112,74]],
    [[-81,12],[-67,10],[-50,2],[-35,-7],[-43,-23],[-55,-35],[-69,-55],[-77,-40],[-71,-19],[-80,-1]],
    [[112,-11],[130,-11],[139,-17],[153,-25],[147,-39],[129,-34],[114,-25]],
    [[-52,59],[-29,65],[-20,78],[-42,83],[-62,78]],
    [[47,-13],[51,-16],[48,-26],[44,-23]]
  ];
  function inPolygon(lon, lat, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      if (((yi > lat) !== (yj > lat)) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function earth(index, count, scale) {
    const y = 1 - 2 * (index + .5) / count;
    const lon = (index * goldenAngle) % TAU - Math.PI;
    const lat = Math.asin(y);
    const ring = Math.sqrt(1 - y * y);
    const x = ring * Math.sin(lon);
    const z = ring * Math.cos(lon);
    const latitude = lat * 180 / Math.PI;
    const longitude = lon * 180 / Math.PI;
    const land = continents.some(polygon => inPolygon(longitude, latitude, polygon)) || latitude < -72;
    const grid = Math.abs(latitude / 15 - Math.round(latitude / 15)) < .07 || Math.abs(longitude / 20 - Math.round(longitude / 20)) < .045;
    const front = .12 + .88 * clamp((z * .96 + x * .26 + .1) / 1.1, 0, 1);
    const alpha = (land ? .95 : grid ? .35 : .07) * front;
    return [x * scale, y * scale, z * scale, alpha];
  }
  function weights(time) {
    const slot = ((time % 32) + 32) % 32;
    const current = Math.floor(slot / 8);
    const x = clamp((slot % 8 - 5) / 3, 0, 1);
    const blend = x * x * x * (x * (x * 6 - 15) + 10);
    const result = [0, 0, 0, 0];
    result[current] = 1 - blend;
    result[(current + 1) % 4] = blend;
    return result;
  }
  return Object.freeze({ robot, brain, earth, weights });
})();
