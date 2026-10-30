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
    let alpha = .7;
    let normal = [0, 0, 1];
    // Human proportions and a modeled facial profile, facing three-quarter right.
    const facePoint = (x, y) => {
      const nx = x / .40;
      const ny = (y - .52) / .66;
      let z = .48 * Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const noseBridge = .11 * Math.exp(-((x / .07) ** 2 + ((y - .48) / .25) ** 2));
      const noseTip = .13 * Math.exp(-((x / .075) ** 2 + ((y - .31) / .075) ** 2));
      const sockets = .075 * (Math.exp(-(((x - .17) / .10) ** 2 + ((y - .65) / .065) ** 2))
        + Math.exp(-(((x + .17) / .10) ** 2 + ((y - .65) / .065) ** 2)));
      const mouth = .035 * Math.exp(-((x / .16) ** 4 + ((y - .16) / .025) ** 2));
      const chin = .055 * Math.exp(-((x / .16) ** 2 + ((y - .01) / .09) ** 2));
      z += noseBridge + noseTip - sockets - mouth + chin;
      const jaw = .76 + .24 * clamp((y + .10) / .5, 0, 1);
      return [x * jaw, y, z];
    };
    if (pick < .25) {
      const ny = 1 - u * 2;
      const ring = Math.sqrt(1 - ny * ny);
      const nx = ring * Math.cos(angle);
      const nz = ring * Math.sin(angle);
      p = [nx * .405, .52 + ny * .66, nz * .48];
      normal = [nx, ny, nz];
      alpha = nz > .2 ? .19 : .65;
      // A dark circular inset leaves the mechanical ear assembly readable.
      if (nx < -.65 && ((p[1] - .55) ** 2 + (p[2] + .08) ** 2) < .28 ** 2) alpha = .09;
      const seam = Math.abs(Math.sin(angle * 4 + ny * 1.7));
      if (seam < .075) alpha = .95;
    } else if (pick < .53) {
      const radius = Math.sqrt(u) * .98;
      const nx = Math.cos(angle) * radius;
      const ny = Math.sin(angle) * radius;
      p = facePoint(nx * .39, .52 + ny * .65);
      normal = [nx, ny, Math.sqrt(Math.max(0, 1 - radius * radius))];
      alpha = .56 + random(index, 8) * .28;
      // Fine panel seams follow the brow and cheek rather than cartoon features.
      if (Math.abs(p[1] - .86 + p[0] * .12) < .012 || Math.abs(Math.abs(p[0]) - .27) < .008) alpha = 1;
    } else if (pick < .68) {
      const rings = [.12, .19, .265, .30];
      const radius = rings[Math.floor(u * rings.length)] + (random(index, 6) - .5) * .012;
      p = [-.43 - random(index, 7) * .025, .55 + Math.cos(angle) * radius, -.08 + Math.sin(angle) * radius];
      normal = [-1, 0, 0];
      alpha = .6 + random(index, 8) * .4;
      if (u < .10) { p[1] = .55 + Math.cos(angle) * .075; p[2] = -.08 + Math.sin(angle) * .075; }
    } else if (pick < .72) {
      const side = random(index, 5) < .5 ? -1 : 1;
      p = facePoint(side * .17 + Math.cos(angle) * .073, .65 + Math.sin(angle) * .033);
      p[2] += .012;
      normal = [side * .45, 0, .85];
      alpha = side < 0 ? 1 : .25;
    } else if (pick < .76) {
      p = u < .5 ? facePoint((v - .5) * .018, .28 + u * .75)
        : facePoint((v - .5) * .29, .16 + (u - .75) * .025);
      p[2] += .014;
      alpha = .92;
    } else if (pick < .88) {
      const cable = Math.floor(random(index, 5) * 11);
      const around = cable / 11 * TAU;
      const t = u;
      const radius = .15 + .055 * t;
      p = [Math.cos(around) * radius + Math.sin(t * 4 + cable) * .016,
        -.13 - t * .65,
        -.065 + Math.sin(around) * radius + t * .035];
      p[0] += Math.cos(angle) * .015;
      p[2] += Math.sin(angle) * .015;
      normal = [Math.cos(around), 0, Math.sin(around)];
      alpha = .55 + random(index, 8) * .3;
      if (random(index, 7) < .25) {
        const rib = Math.floor(t * 9) / 9;
        p = [Math.cos(angle) * .205, -.16 - rib * .59, -.065 + Math.sin(angle) * .205];
        alpha = .75;
      }
    } else {
      const nx = u * 2 - 1;
      const depth = Math.sqrt(Math.max(0, 1 - nx * nx));
      const top = -.70 - Math.abs(nx) * .16;
      p = [nx * 1.03, top - v * .46, -.04 + depth * (.34 + .07 * Math.cos(v * Math.PI))];
      normal = [nx * .4, .2, depth];
      const plating = Math.abs(Math.sin(nx * 10 + v * 2.6));
      alpha = plating < .11 ? .95 : .36 + random(index, 8) * .28;
      if (Math.abs(nx) < .12 && v < .15) alpha *= .25;
    }
    const yaw = pick >= .88 ? .65 : 1.35;
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const x = c * p[0] + s * p[2];
    const z = -s * p[0] + c * p[2];
    const normalX = c * normal[0] + s * normal[2];
    const normalZ = -s * normal[0] + c * normal[2];
    const facing = clamp(normalX * .257 + normalZ * .966, 0, 1);
    alpha *= .20 + .80 * facing;
    return [x * scale, (p[1] * .88 + .04) * scale, z * scale, alpha];
  }
  function brain(index, count, scale) {
    const ny = 1 - 2 * (index + .5) / count;
    const ring = Math.sqrt(Math.max(0, 1 - ny * ny));
    const phi = index * goldenAngle;
    const theta = Math.acos(ny);
    const nx = ring * Math.cos(phi);
    const nz = ring * Math.sin(phi);
    const pick = random(index, 11);
    const folds = Math.sin(phi * 9 + Math.sin(theta * 5) * 2) * Math.sin(theta * 8 + Math.sin(phi * 3));
    const ripple = 1 + folds * .045;
    let p;
    let alpha;
    if (pick < .065) {
      p = tube([.24, -.40, -.03], [.43, -.99, -.04], .075, random(index, 12), random(index, 13) * TAU);
      alpha = .75;
    } else if (pick < .17) {
      // The cerebellum sits below and behind the large cerebral hemisphere.
      const ridges = 1 + Math.sin(theta * 24) * .035;
      p = [.59 + nx * .36 * ridges, -.52 + ny * .26 * ridges, -.03 + nz * .32 * ridges];
      alpha = .45 + Math.abs(Math.sin(theta * 24)) * .35;
    } else if (pick < .34) {
      // A lower temporal lobe gives the characteristic side-profile outline.
      p = [-.12 + nx * .84 * ripple, -.24 + ny * .30 * ripple, .07 + nz * .45 * ripple];
      alpha = .4 + (.5 + folds * .5) * .4;
    } else {
      p = [-.07 + nx * 1.06 * ripple, .20 + ny * .66 * ripple, nz * .48 * ripple];
      if (nx < -.45) p[0] -= .065 * Math.exp(-(((ny + .20) / .45) ** 2));
      alpha = .35 + (.5 + folds * .5) * .5;
      const seam = Math.abs(p[1] + .14 - p[0] * .23);
      if (seam < .022 && nz > 0) alpha = 1;
    }
    const front = .18 + .82 * clamp((nz + .18) / 1.18, 0, 1);
    return [p[0] * scale, p[1] * scale, p[2] * scale, alpha * front];
  }
  // Stylized continental outlines, sufficient for a recognizable globe.
  const continents = [
    [[-17,36],[1,37],[14,33],[32,31],[43,13],[51,10],[43,-12],[35,-25],[18,-35],[9,-27],[2,-4],[-10,5],[-17,16]],
    [[-10,36],[-10,54],[6,58],[24,71],[50,70],[72,76],[110,72],[150,60],[178,65],[177,50],[140,36],[124,23],[109,5],[98,20],[84,21],[76,8],[67,25],[55,25],[45,13],[35,32],[25,36],[15,45],[4,42]],
    [[-168,67],[-147,71],[-128,55],[-121,48],[-125,40],[-113,29],[-104,20],[-88,17],[-80,8],[-77,18],[-81,28],[-66,45],[-55,52],[-61,61],[-86,70],[-112,74]],
    [[-81,12],[-67,10],[-50,2],[-35,-7],[-43,-23],[-55,-35],[-69,-55],[-77,-40],[-71,-19],[-80,-1]],
    [[112,-11],[130,-11],[139,-17],[153,-25],[147,-39],[129,-34],[114,-25]],
    [[-52,59],[-29,65],[-20,78],[-42,83],[-62,78]],
    [[47,-13],[51,-16],[48,-26],[44,-23]],
    [[130,31],[132,34],[136,36],[140,41],[143,44],[146,44],[144,39],[140,36],[136,33]],
    [[119,19],[124,18],[127,9],[125,5],[121,9]],
    [[95,5],[103,1],[106,-6],[115,-8],[124,-8],[132,-6],[135,-3],[127,1],[119,1],[112,4],[107,-2],[102,2]],
    [[166,-34],[179,-38],[176,-46],[169,-47]]
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
    const latitude = lat * 180 / Math.PI;
    const longitude = lon * 180 / Math.PI;
    const isLand = (longitude, latitude) => continents.some(polygon => inPolygon(longitude, latitude, polygon)) || latitude < -72;
    if (random(index, 21) < .095) {
      const angle = random(index, 22) * TAU;
      const radius = 1.08 + random(index, 23) * .13;
      return [Math.cos(angle) * radius * scale, Math.sin(angle) * radius * scale, -.15 * scale,
        .07 + random(index, 24) * .08];
    }
    // The fixed view centers on Asia and the Pacific, with Australia below.
    const viewLon = lon - 100 * Math.PI / 180;
    const ring = Math.sqrt(1 - y * y);
    const x = ring * Math.sin(viewLon);
    const z = ring * Math.cos(viewLon);
    const land = isLand(longitude, latitude);
    const coast = land && (!isLand(longitude - 2, latitude) || !isLand(longitude + 2, latitude)
      || !isLand(longitude, latitude - 1.5) || !isLand(longitude, latitude + 1.5));
    const grid = Math.abs(latitude / 15 - Math.round(latitude / 15)) < .06 || Math.abs(longitude / 20 - Math.round(longitude / 20)) < .035;
    const viewDepth = z * .966 + x * .257;
    const front = .035 + .965 * clamp((viewDepth + .10) / .5, 0, 1);
    const limb = Math.exp(-viewDepth * viewDepth * 150);
    const brightness = coast ? 1 : land ? .72 : grid ? .24 : .025;
    const alpha = Math.min(1, brightness + limb * .35) * front;
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
