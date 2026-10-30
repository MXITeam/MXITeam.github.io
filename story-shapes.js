"use strict";

// Shared timeline and the cable that becomes a nerve, then an orbital chain.
window.MXIStoryShapes = (() => {
  const TAU = Math.PI * 2;
  const smooth = x => x * x * x * (x * (x * 6 - 15) + 10);
  const paths = [
    [[-.9,-.62,0],[-.57,-.12,.12],[-.08,.12,0],[.48,.52,-.08],[.8,.76,0]],
    [[-.65,-.87,0],[-.38,-.35,.08],[-.54,.36,0],[.18,.48,-.08],[.57,-.07,.04]],
    [[-.6,-.88,0],[-.56,-.28,.1],[-.57,.25,.06],[-.36,.58,0],[.26,.35,-.08]],
    [[-.81,.04,0],[-.47,.45,.1],[.11,.32,-.08],[.59,-.14,.08],[.18,-.75,0]]
  ];

  function timeline(seconds) {
    const cycle = ((seconds % 70) + 70) % 70;
    const from = Math.floor(cycle / 10);
    const local = cycle - from * 10;
    const progress = Math.max(0, (local - 6) / 4);
    return { from, to: (from + 1) % 7, mix: smooth(progress), progress, local };
  }

  function conduit(act, u, seconds = 0) {
    if (act === 0 || act === 6) return [(u-.5)*7, Math.sin(u*8+seconds*.35)*.025, Math.sin(u*6)*.08];
    act -= 1;
    if (act === 4) {
      // One orbit of the tilted event horizon, with a tail reaching into space.
      const angle = u * TAU * 1.22 - 1.1;
      const radius = .4 + Math.pow(Math.abs(u - .5) * 2, 4) * .68;
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius * .42;
      const tilt = -.5;
      return [x * Math.cos(tilt) - y * Math.sin(tilt), x * Math.sin(tilt) + y * Math.cos(tilt), Math.sin(angle) * .12];
    }
    const points = paths[act];
    const v=1-u,weights=[v**4,4*v**3*u,6*v*v*u*u,4*v*u**3,u**4];
    return [0,1,2].map(axis=>points.reduce((sum,p,i)=>sum+p[axis]*weights[i],0));
  }

  function fallback(act, index, count) {
    const u = index / count, angle = index * 2.3999632297;
    if (act === 0) {
      const v = ((index * .61803398875) % 1) * TAU;
      const r = .54 + .21 * Math.cos(v);
      return [r*Math.cos(angle), r*Math.sin(angle)*.7, .21*Math.sin(v), .5];
    }
    if (act === 4) {
      const radius = .25 + .65 * Math.sqrt(u);
      const x = radius * Math.cos(angle), y = radius * Math.sin(angle) * .37;
      return [x*Math.cos(-.5)-y*Math.sin(-.5), x*Math.sin(-.5)+y*Math.cos(-.5), .08*Math.sin(angle), .35 + .5*(1-u)];
    }
    if (act === 1) {
      const p = conduit(act, u);
      return [p[0]+Math.sin(angle)*.075, p[1]+Math.cos(angle)*.075, Math.cos(angle)*.1, .65];
    }
    const y = 1 - 2*u, r = Math.sqrt(Math.max(0, 1-y*y));
    const fold = act === 3 ? 1 + .09*Math.sin(angle*4 + y*26) : 1;
    return [Math.cos(angle)*r*.64*fold, y*.78, Math.sin(angle)*r*.35, .3 + .5*Math.max(0, Math.sin(angle))];
  }
  return Object.freeze({ timeline, conduit, fallback });
})();
