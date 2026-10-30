"use strict";

// Original silver sculptures become the same set of layered particle identities.
window.MXIStoryReference = (() => {
  const panels = [];
  const image = new Image();
  image.decoding = "async";
  const noise = n => { const value = Math.sin(n * 12.9898 + 17.32) * 43758.5453; return value - Math.floor(value); };
  const fade = value => {const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
  function edgeOpacity(act,u,v){
    if(act<3){const edge=Math.max(0,Math.min(1,u/.08,(1-u)/.08,v/.06,(1-v)/.06));return edge*edge;}
    // The neural/cosmic surroundings dissolve in an irregular envelope, rather
    // than preserving the straight outline of their source-image crop.
    const x=(u-.51)/.63,y=(v-.51)/.60,angle=Math.atan2(y,x);
    const radius=Math.hypot(x,y)+.045*Math.sin(angle*3)+.025*Math.sin(angle*7+1.2);
    const edge=fade(Math.min(u/.18,(1-u)/.18,v/.16,(1-v)/.16));
    return edge*fade((1.08-radius)/.38);
  }
  const ready = new Promise(resolve => {
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 384;
        canvas.height = Math.round(image.naturalHeight * 384 / (image.naturalWidth / 5));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) { resolve(false); return; }
        const crops=[[0,.2],[.2,.4],[.4,.6],[.58,.8],[.765,1]];
        for (let act = 0; act < 5; act++) {
          const [start,end]=crops[act],sourceWidth=image.naturalWidth*(end-start);
          canvas.width=Math.round(sourceWidth);
          canvas.height=Math.round(image.naturalHeight*canvas.width/sourceWidth);
          context.clearRect(0,0,canvas.width,canvas.height);
          context.drawImage(image,start*image.naturalWidth,0,sourceWidth,image.naturalHeight,0,0,canvas.width,canvas.height);
          const pixels = context.getImageData(0,0,canvas.width,canvas.height).data;
          if(act===2){
            // The shared five-panel reference overlaps here: this isolated patch
            // is the next panel's cortex, not part of the android's head or ear.
            for(let y=Math.floor(canvas.height*.24);y<Math.ceil(canvas.height*.65);y++)for(let x=Math.floor(canvas.width*.91);x<canvas.width;x++){
              const p=(y*canvas.width+x)*4;pixels[p]=pixels[p+1]=pixels[p+2]=pixels[p+3]=0;
            }
          }
          if(act===0){
            // These small baked-in labels cannot survive conversion to 0/1.
            // Live typeset classics replace them around the sculpture.
            const labels=[[.12,.065,.42,.17],[.015,.17,.46,.25],[.70,.17,.995,.24],[.70,.255,.96,.315],[.015,.85,.47,.94]];
            for(const [x0,y0,x1,y1] of labels)for(let y=Math.floor(y0*canvas.height);y<Math.ceil(y1*canvas.height);y++)for(let x=Math.floor(x0*canvas.width);x<Math.ceil(x1*canvas.width);x++){
              const p=(y*canvas.width+x)*4;pixels[p]=pixels[p+1]=pixels[p+2]=pixels[p+3]=0;
            }
          }
          const points = [], cumulative = [], haloPoints=[], haloCumulative=[];
          let sum = 0, haloSum=0, minX=canvas.width, maxX=0, minY=canvas.height, maxY=0;
          for (let y=0;y<canvas.height;y++) for (let x=0;x<canvas.width;x++) {
            const offset=(y*canvas.width+x)*4;
            const light=(pixels[offset]*.2126+pixels[offset+1]*.7152+pixels[offset+2]*.0722)/255;
            if (light < .055 || pixels[offset+3] < 32) continue;
            const u=x/(canvas.width-1),v=y/(canvas.height-1),edge=edgeOpacity(act,u,v);
            if(act>=3){
              const outer=fade((Math.max(Math.abs(u-.5),Math.abs(v-.5))-.26)/.23);
              if(outer>.02){haloPoints.push(x,y,light);haloSum+=Math.pow(light,.8)*outer;haloCumulative.push(haloSum);}
            }
            if(edge<.015)continue;
            // Fine dendrites need open negative space. Prefer the bright nerve
            // ridges over their dim surroundings instead of filling every cell.
            const neural=act===3?fade((u-.44)/.16):0;
            points.push(x,y,light*edge);
            sum += Math.pow(light,.68+neural*.95)*edge*(1-neural*.60);
            cumulative.push(sum);
            minX=Math.min(minX,x); maxX=Math.max(maxX,x); minY=Math.min(minY,y); maxY=Math.max(maxY,y);
          }
          if (!sum) throw new Error("Empty story act " + act);
          panels.push({ points:new Float32Array(points), cumulative:new Float64Array(cumulative), sum,
            haloPoints:new Float32Array(haloPoints),haloCumulative:new Float64Array(haloCumulative),haloSum,
            act,width:canvas.width,height:canvas.height,pixels,
            cx:(minX+maxX)/2,cy:(minY+maxY)/2,scale:1.9/Math.max(maxX-minX+1,maxY-minY+1) });
        }
        resolve(true);
      } catch(error) { console.warn("MXI story targets:",error); panels.length=0; resolve(false); }
    };
    image.onerror=()=>resolve(false);
    image.src="./assets/story-reference.cc5b93713b1e.png";
  });

  // Shared by binary targets, contour mesh, and travelling digits so all three
  // layers remain registered while the camera moves.
  function position(act,x,y,light=.4,back=false){
    let depth;
    if(act===0)depth=.22*Math.sin(Math.atan2(y+.18,x+.13))+.09*Math.sin(x*8);
    else if(act===1)depth=.12+.24*Math.sqrt(Math.max(0,1-(x/.85)**2));
    else if(act===2)depth=x<-.3?.32:.12+.4*Math.sqrt(Math.max(0,1-((x-.2)/.53)**2-((y-.15)/.9)**2));
    else if(act===3){
      const panel=panels[3],u=panel?(x/panel.scale+panel.cx)/(panel.width-1):.5;
      const neural=fade((u-.44)/.16);
      const cortex=.06+.46*Math.sqrt(Math.max(0,1-((x+.1)/.85)**2-((y-.03)/.7)**2));
      depth=cortex*(1-neural)+(.08+x*.13+y*.07)*neural;
    }
    else depth=x*.38+y*.2;
    depth+=(light-.4)*.08;if(back)depth=-Math.abs(depth)-.09;
    const vx=x*(1-depth*.38),vy=y*(1-depth*.38),yaw=-.34,pitch=.12;
    const py=Math.cos(pitch)*vy+Math.sin(pitch)*depth,pz=-Math.sin(pitch)*vy+Math.cos(pitch)*depth;
    return [Math.cos(yaw)*vx-Math.sin(yaw)*pz,py,Math.sin(yaw)*vx+Math.cos(yaw)*pz];
  }

  function build(count,selected=[0,1,2,3,4]) {
    return Array.from({length:5},(_,act)=> {
      if(!selected.includes(act))return null;
      const data=[], panel=panels[act];
      for(let i=0;i<count;i++) {
        if (!panel) { data.push(window.MXIStoryShapes.fallback(act,i,count)); continue; }
        // Reuse actual peripheral material as a sparse, deep, outward tail on
        // all four sides. These are the same ASCII particles as the main body.
        if(panel.haloSum&&i%7===0){
          const q=noise(i+231)*panel.haloSum;
          let low=0,high=panel.haloCumulative.length-1;
          while(low<high){const middle=(low+high)>>>1;if(panel.haloCumulative[middle]<q)low=middle+1;else high=middle;}
          const light=panel.haloPoints[low*3+2];
          const x=(panel.haloPoints[low*3]-panel.cx)*panel.scale,y=(panel.cy-panel.haloPoints[low*3+1])*panel.scale;
          const stretch=.025+noise(i+781)**1.8*2.1,angle=Math.atan2(y,x);
          const bend=Math.sin(stretch*3+angle*5)*stretch*.10;
          const px=x*(1+stretch)-Math.sin(angle)*bend,py=y*(1+stretch)+Math.cos(angle)*bend;
          data.push([...position(act,px,py,light,noise(i+56)>.7),(.045+light*.18)*Math.exp(-stretch*.9)]);
          continue;
        }
        // Stratified quantiles preserve body correspondence through all acts;
        // independent full-pixel jitter removes scan-line alignment.
        const q=(i+.12+noise(i+23)*.76)/count*panel.sum;
        let low=0, high=panel.cumulative.length-1;
        while(low<high) { const middle=(low+high)>>>1; if(panel.cumulative[middle]<q)low=middle+1;else high=middle; }
        const light=panel.points[low*3+2];
        const x=(panel.points[low*3]-panel.cx+noise(i*3+1)-.5)*panel.scale;
        const y=(panel.cy-panel.points[low*3+1]+noise(i*3+2)-.5)*panel.scale;
        const neural=act===3?fade((panel.points[low*3]/(panel.width-1)-.44)/.16):0;
        const back=neural<.5&&noise(i+46)>.88;
        let alpha=(.05*(1-neural)+.008*neural+Math.pow(light,1.3+neural*.35)*.8)*(back?.12:1);
        // Preserve the face's dark recesses and highlights when the source is
        // reduced to a small screen-space character grid. The feathered mask
        // leaves the hand, neck and the other scenes' particle density intact.
        if(act===2){
          const u=panel.points[low*3]/(panel.width-1),v=panel.points[low*3+1]/(panel.height-1);
          const face=fade((u-.26)/.12)*fade((.87-u)/.12)*fade((v-.16)/.08)*fade((.62-v)/.08);
          const contrast=.30+1.2*fade((light-.13)/.55);
          alpha*=1+face*(contrast-1);
        }
        data.push([...position(act,x,y,light,back),alpha]);
      }
      return new Float32Array(window.MXIStoryTargets.spatialOrder(data).flat());
    });
  }
  const mathematicsSurface=()=>panels[0];
  const surface=act=>panels[act];
  return Object.freeze({ready,build,mathematicsSurface,surface,position,edgeOpacity});
})();
