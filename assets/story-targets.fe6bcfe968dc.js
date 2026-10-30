"use strict";

// Original silver sculptures become the same set of layered particle identities.
window.MXIStoryReference = (() => {
  const panels = [];
  const image = new Image();
  image.decoding = "async";
  const noise = n => { const value = Math.sin(n * 12.9898 + 17.32) * 43758.5453; return value - Math.floor(value); };
  const ready = new Promise(resolve => {
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 384;
        canvas.height = Math.round(image.naturalHeight * 384 / (image.naturalWidth / 5));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) { resolve(false); return; }
        for (let act = 0; act < 5; act++) {
          context.clearRect(0,0,canvas.width,canvas.height);
          context.drawImage(image,act*image.naturalWidth/5,0,image.naturalWidth/5,image.naturalHeight,0,0,canvas.width,canvas.height);
          const pixels = context.getImageData(0,0,canvas.width,canvas.height).data;
          const points = [], cumulative = [];
          let sum = 0, minX=canvas.width, maxX=0, minY=canvas.height, maxY=0;
          for (let y=0;y<canvas.height;y++) for (let x=0;x<canvas.width;x++) {
            const offset=(y*canvas.width+x)*4;
            const light=(pixels[offset]*.2126+pixels[offset+1]*.7152+pixels[offset+2]*.0722)/255;
            const edge=Math.min(1,x/(canvas.width*.08),(canvas.width-1-x)/(canvas.width*.08),y/(canvas.height*.06),(canvas.height-1-y)/(canvas.height*.06));
            if (light < .055 || pixels[offset+3] < 32 || edge<.015) continue;
            points.push(x,y,light*edge*edge);
            sum += Math.pow(light,.68)*edge*edge;
            cumulative.push(sum);
            minX=Math.min(minX,x); maxX=Math.max(maxX,x); minY=Math.min(minY,y); maxY=Math.max(maxY,y);
          }
          if (!sum) throw new Error("Empty story act " + act);
          panels.push({ points:new Float32Array(points), cumulative:new Float64Array(cumulative), sum,
            cx:(minX+maxX)/2,cy:(minY+maxY)/2,scale:1.9/Math.max(maxX-minX+1,maxY-minY+1) });
        }
        resolve(true);
      } catch(error) { console.warn("MXI story targets:",error); panels.length=0; resolve(false); }
    };
    image.onerror=()=>resolve(false);
    image.src="./assets/story-reference.cc5b93713b1e.png";
  });

  function build(count) {
    return Array.from({length:5},(_,act)=> {
      const data=[], panel=panels[act];
      for(let i=0;i<count;i++) {
        if (!panel) { data.push(window.MXIStoryShapes.fallback(act,i,count)); continue; }
        // Stratified quantiles preserve body correspondence through all acts;
        // independent full-pixel jitter removes scan-line alignment.
        const q=(i+.12+noise(i+23)*.76)/count*panel.sum;
        let low=0, high=panel.cumulative.length-1;
        while(low<high) { const middle=(low+high)>>>1; if(panel.cumulative[middle]<q)low=middle+1;else high=middle; }
        const light=panel.points[low*3+2];
        const x=(panel.points[low*3]-panel.cx+noise(i*3+1)-.5)*panel.scale;
        const y=(panel.cy-panel.points[low*3+1]+noise(i*3+2)-.5)*panel.scale;
        // Curved front/back volumes retain the original sculptural silhouette.
        // Reproject through a fixed three-quarter camera instead of using a flat plane.
        let depth;
        if(act===0)depth=.22*Math.sin(Math.atan2(y+.18,x+.13))+.09*Math.sin(x*8);
        else if(act===1)depth=.12+.24*Math.sqrt(Math.max(0,1-Math.pow(x/.85,2)));
        else if(act===2)depth=x<-.3?.32:.12+.4*Math.sqrt(Math.max(0,1-Math.pow((x-.2)/.53,2)-Math.pow((y-.15)/.9,2)));
        else if(act===3)depth=.06+.46*Math.sqrt(Math.max(0,1-Math.pow((x+.1)/.85,2)-Math.pow((y-.03)/.7,2)));
        else depth=x*.38+y*.2+(noise(i+14)-.5)*.35;
        depth+=(light-.4)*.08;
        const back=noise(i+46)>.88;if(back)depth=-Math.abs(depth)-.09;
        const viewX=x*(1-depth*.38),viewY=y*(1-depth*.38);
        const yaw=-.34,pitch=.12;
        const py=Math.cos(pitch)*viewY+Math.sin(pitch)*depth;
        const pz=-Math.sin(pitch)*viewY+Math.cos(pitch)*depth;
        data.push([Math.cos(yaw)*viewX-Math.sin(yaw)*pz,py,Math.sin(yaw)*viewX+Math.cos(yaw)*pz,(.05+Math.pow(light,1.3)*.8)*(back?.12:1)]);
      }
      return new Float32Array(window.MXIStoryTargets.spatialOrder(data).flat());
    });
  }
  return Object.freeze({ready,build});
})();
