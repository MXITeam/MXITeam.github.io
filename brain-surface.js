"use strict";

// Official pial triangle surfaces sampled offline, with no image-shaped bounds.
window.MXIBrainSurface=(()=>{
  let points=null;
  const ready=fetch("./assets/brain-surface.2c9c436c0a42.bin")
    .then(response=>{if(!response.ok)throw new Error("Brain surface HTTP "+response.status);return response.arrayBuffer();})
    .then(buffer=>{const data=new Float32Array(buffer);if(data.length!==200000||!data.every(Number.isFinite))throw new Error("Invalid brain surface");points=data;return true;})
    .catch(error=>{console.warn("MXI brain surface:",error);return false;});
  function build(count){
    if(!points)return null;
    const length=points.length/4,samples=[];
    for(let i=0;i<count;i++){const index=Math.min(length-1,Math.floor((i+.5)*length/count));samples.push(Array.from(points.subarray(index*4,index*4+4)));}
    return new Float32Array(window.MXIStoryTargets.spatialOrder(samples).flat());
  }
  return Object.freeze({ready,build});
})();
