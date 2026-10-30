"use strict";

(async()=>{
  const stage=document.querySelector("#story-stage");
  const canvas=document.querySelector("#story-particles");
  const foreground=document.querySelector("#story-conduit");
  const shapes=window.MXIStoryShapes, targets=window.MXIStoryTargets, shaders=window.MXIStoryShaders;
  const sceneButtons=Array.from(document.querySelectorAll?.("[data-scene]")||[]);
  if(!stage||!canvas||!foreground||!shapes||!targets||!shaders)return;
  await targets.ready;
  const reference=window.MXIStoryReference;
  const referenceReady=Boolean(reference&&await reference.ready);
  const brain=window.MXIBrainSurface;
  const brainReady=Boolean(brain&&await brain.ready);
  const gl=canvas.getContext("webgl",{alpha:false,antialias:false,powerPreference:"low-power"});
  if(!gl)return;
  const ctx=foreground.getContext("2d");
  function compile(type,source){
    const shader=gl.createShader(type);if(!shader)return null;
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(gl.getShaderParameter(shader,gl.COMPILE_STATUS))return shader;
    console.warn("MXI story graphics:",gl.getShaderInfoLog(shader));gl.deleteShader(shader);return null;
  }
  const vertex=compile(gl.VERTEX_SHADER,shaders.vertex),fragment=compile(gl.FRAGMENT_SHADER,shaders.fragment);
  if(!vertex||!fragment)return;
  const program=gl.createProgram();if(!program)return;
  gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){console.warn("MXI story link:",gl.getProgramInfoLog(program));return;}
  gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);
  const attributes=Object.fromEntries(["from","to","traits"].map(n=>[n,gl.getAttribLocation(program,"a_"+n)]));
  Object.values(attributes).forEach(n=>gl.enableVertexAttribArray(n));
  const uniforms=Object.fromEntries(["resolution","dpr","size","time","mix","progress","acts","camera","pointer","glow","view","fieldPass","fieldPointSize"].map(n=>[n,gl.getUniformLocation(program,"u_"+n)]));
  const buffers=Array.from({length:7},()=>gl.createBuffer()),traitBuffer=gl.createBuffer();
  if(buffers.some(b=>!b)||!traitBuffer)return;
  const asciiVertex=compile(gl.VERTEX_SHADER,shaders.asciiVertex),asciiFragment=compile(gl.FRAGMENT_SHADER,shaders.asciiFragment);
  if(!asciiVertex||!asciiFragment)return;
  const asciiProgram=gl.createProgram();if(!asciiProgram)return;
  gl.attachShader(asciiProgram,asciiVertex);gl.attachShader(asciiProgram,asciiFragment);gl.linkProgram(asciiProgram);
  if(!gl.getProgramParameter(asciiProgram,gl.LINK_STATUS))return;
  gl.deleteShader(asciiVertex);gl.deleteShader(asciiFragment);
  const quad=gl.createBuffer(),fieldTexture=gl.createTexture(),fieldBuffer=gl.createFramebuffer(),fieldDepth=gl.createRenderbuffer();
  if(!quad||!fieldTexture||!fieldBuffer||!fieldDepth)return;
  const quadAttribute=gl.getAttribLocation(asciiProgram,"a_quad");
  const asciiUniforms=Object.fromEntries(["field","resolution","grid","fieldSize","dpr","time"].map(n=>[n,gl.getUniformLocation(asciiProgram,"u_"+n)]));
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  gl.bindTexture(gl.TEXTURE_2D,fieldTexture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.clearColor(0,0,0,1);
  const sceneLayers=referenceReady?window.MXIStoryLayers?.create(gl,reference):null;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  let width=0,height=0,dpr=1,size=1,count=0,frame=0,resizeFrame=0,lastClock=0,lastPaint=0,time=0;
  let gridWidth=1,gridHeight=1,fieldWidth=1,fieldHeight=1,baseCell=8.5,detailCell=3.2;
  let paused=false,visible=true,lost=false;
  let reducedScene=6;
  const pointer={x:0,y:0,active:0,target:0},pulses=[];
  const hash=n=>{const v=Math.sin(n*12.9898+4.23)*43758.5453;return v-Math.floor(v);};
  // Keep framing steady while digits withdraw and re-enter horizontally.
  function camera(){return [0,0,1];}
  const smoothRange=(a,b,value)=>{const x=Math.max(0,Math.min(1,(value-a)/(b-a)));return x*x*(3-2*x);};
  let view=[0,0],objectSize=1;
  function project(p,cam){
    const [yaw,pitch]=view;
    const x=Math.cos(yaw)*p[0]+Math.sin(yaw)*p[2],z=-Math.sin(yaw)*p[0]+Math.cos(yaw)*p[2];
    const y=Math.cos(pitch)*p[1]-Math.sin(pitch)*z,depth=Math.sin(pitch)*p[1]+Math.cos(pitch)*z;
    const perspective=1/Math.max(.42,1-depth*.38);
    return [width/2+(x-cam[0])*objectSize*cam[2]*perspective,height/2-(y-cam[1])*objectSize*cam[2]*perspective];
  }
  function viewDepth(p){return Math.sin(view[1])*p[1]+Math.cos(view[1])*(-Math.sin(view[0])*p[0]+Math.cos(view[0])*p[2]);}
  function mathDiagram(index,x,y,w,h,opacity,t){
    ctx.save();ctx.translate(x,y);ctx.strokeStyle="#cbd7e8";ctx.fillStyle="#dbe5f3";ctx.lineWidth=.9;
    ctx.globalAlpha=opacity;ctx.shadowBlur=0;ctx.lineCap="round";ctx.lineJoin="round";
    const point=([u,v])=>[u*w/2,v*h/2];
    const path=(points,close=false)=>{
      ctx.beginPath();points.forEach((p,i)=>{const [px,py]=point(p);if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);});
      if(close)ctx.closePath();ctx.stroke();
    };
    const axes=()=>{path([[-1,.85],[1,.85]]);path([[-.95,.95],[-.95,-1]]);};
    const phase=reduced.matches?0:t*.35;
    if(index===0){
      // Heat kernels broaden while their peak decays.
      axes();
      for(let j=0;j<5;j++){
        const variance=.2+j*.2;ctx.globalAlpha=opacity*(1-j*.12);
        path(Array.from({length:49},(_,k)=>{const u=k/24-1;return [u,.8-.56/Math.sqrt(variance)*Math.exp(-u*u/variance)];}));
      }
    }else if(index===1){
      // A vibrating membrane shown as a shallow perspective wire surface.
      const surface=(u,v)=>[u*.73+v*.24,v*.36-.52*Math.sin(u*3-phase)*Math.cos(v*3)];
      for(let j=0;j<9;j++){
        const v=j/4-1;ctx.globalAlpha=opacity*(.45+j*.055);
        path(Array.from({length:33},(_,k)=>surface(k/16-1,v)));
        path(Array.from({length:33},(_,k)=>surface(v,k/16-1)));
      }
    }else if(index===2){
      axes();
      for(const sign of [-1,1]){ctx.globalAlpha=opacity*.35;path(Array.from({length:65},(_,k)=>{const u=k/32-1;return [u,sign*.74*Math.exp(-u*u*3)];}));}
      ctx.globalAlpha=opacity;path(Array.from({length:97},(_,k)=>{const u=k/48-1;return [u,.74*Math.exp(-u*u*3)*Math.cos(u*13-phase)];}));
    }else if(index===3){
      // Streamlines bend around a cylindrical obstacle.
      for(let j=-4;j<=4;j++)if(j){const v=j*.19;path(Array.from({length:49},(_,k)=>{const u=k/24-1;return [u,v+Math.sign(v)*.3*Math.exp(-u*u/.14)*(1-Math.abs(v))];}));}
      ctx.beginPath();ctx.ellipse(0,0,w*.105,h*.25,0,0,Math.PI*2);ctx.stroke();
    }else if(index===4){
      // Potential level sets over a curved radial field.
      for(let j=1;j<=6;j++){const r=j/6;path(Array.from({length:49},(_,k)=>{const a=k/48*Math.PI*2;return [r*Math.cos(a),r*.5*Math.sin(a)+.65*(1-r)*(1-r)];}),true);}
      for(let j=0;j<8;j++){const a=j/8*Math.PI*2;path(Array.from({length:25},(_,k)=>{const r=k/24;return [r*Math.cos(a),r*.5*Math.sin(a)+.65*(1-r)*(1-r)];}));}
    }else{
      axes();
      // Successive reaction-diffusion fronts, travelling toward positive x.
      for(let j=0;j<4;j++){const shift=-.55+j*.34;ctx.globalAlpha=opacity*(.45+j*.16);path(Array.from({length:49},(_,k)=>{const u=k/24-1;return [u,.8-1.5/(1+Math.exp(7*(u-shift)))];}));}
    }
    ctx.restore();
  }
  function foregroundScene(state,t,cam){
    if(!ctx)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    ctx.fillStyle="#e6eefc";ctx.textAlign="center";ctx.textBaseline="middle";
    // Peripheral binary dust moves slowly; the silhouette remains the subject.
    for(let i=0;i<84;i++){
      const angle=hash(i+3)*Math.PI*2;
      const radius=.8+hash(i+40)*.68;
      const x=width/2+Math.cos(angle+t*.009)*radius*size;
      const y=height/2+Math.sin(angle+t*.009)*radius*size*.83;
      ctx.globalAlpha=(.035+hash(i+89)*.12)*(.6+.4*Math.sin(t*.4+i)**2);
      ctx.font=`${3.5+hash(i+130)*2}px monospace`;
      ctx.fillText(i%2?"1":"0",x,y);
    }
    const retreat=1-smoothRange(0,.40,state.progress),emerge=smoothRange(.62,1,state.progress);
    const intro=(state.from===0?retreat:0)+(state.to===0?emerge:0);
    const heldFlow=smoothRange(0,.8,state.local)*(1-smoothRange(0,.20,state.progress));
    if(intro>.001){
      const font=width<700?30:42,cell=font*.76;
      const half=Math.ceil(width/cell/2)+3;
      ctx.font=`400 ${font}px monospace`;
      for(let i=-half;i<=half;i++){
        const x=width/2+(i+.5)*cell;
        if(i>=-2&&i<=1)continue;
        const cycle=t*(1.1+hash(i+800)*.8)+hash(i+500)*2;
        const phase=cycle-Math.floor(cycle),digit=Math.floor(cycle)%2?"1":"0";
        const glint=Math.pow(Math.sin(phase*Math.PI),5);
        ctx.shadowColor="#e5eeff";ctx.shadowBlur=glint*10;
        ctx.globalAlpha=intro*(.1+glint*.65);ctx.fillText(digit,x,height/2);
        ctx.shadowBlur=0;
      }
      // Stationary geometric wordmark: square stems and the logo's diagonal zero.
      // Vector outlines stay crisp on dense phone displays as well as wide screens.
      const markHeight=font*.94,markCell=cell*1.08;
      ctx.save();ctx.globalAlpha=intro;ctx.fillStyle="#f3f6ff";ctx.shadowColor="#e3ecff";ctx.shadowBlur=6;
      [..."1011"].forEach((digit,i)=>{
        ctx.save();ctx.translate(width/2+(i-1.5)*markCell,height/2);ctx.scale(markHeight,markHeight);
        ctx.beginPath();
        if(digit==="1"){
          ctx.moveTo(-.22,-.5);ctx.lineTo(.15,-.5);ctx.lineTo(.15,.5);
          ctx.lineTo(-.12,.5);ctx.lineTo(-.12,-.38);ctx.lineTo(-.22,-.38);ctx.closePath();
        }else{
          ctx.rect(-.32,-.5,.64,1);ctx.rect(-.12,-.30,.24,.60);
        }
        ctx.fill("evenodd");
        if(digit==="0"){
          ctx.beginPath();ctx.moveTo(-.23,.40);ctx.lineTo(-.23,.12);
          ctx.lineTo(.23,-.40);ctx.lineTo(.23,-.12);ctx.closePath();ctx.fill();
        }
        ctx.restore();
      });
      ctx.restore();ctx.shadowBlur=0;
    }
    const thread=[];
    const universe=(state.from===5?1-state.mix:0)+(state.to===5?state.mix:0);
    for(let i=0;i<=180;i++){
      const u=i/180,a=shapes.conduit(state.from,u,t),b=shapes.conduit(state.to,u,t);
      const p=a.map((v,k)=>v+(b[k]-v)*state.mix),screen=project(p,cam);
      screen.hidden=universe>.7&&viewDepth(p)<0&&Math.hypot(screen[0]-width/2,screen[1]-height/2)<objectSize*cam[2]*.26;
      thread.push(screen);
    }
    // The guide line comes and goes in travelling stretches instead of a constant stroke.
    ctx.strokeStyle="#cbd8ed";ctx.lineWidth=.65;
    for(let i=0;i<180;i++){
      const p=thread[i],q=thread[i+1];if(p.hidden||q.hidden)continue;
      const shimmer=reduced.matches?.6:Math.max(0,Math.sin(i*.09-t*1.3)+.35*Math.sin(i*.23+t*.7));
      if(shimmer<.02)continue;
      ctx.globalAlpha=.16*(1-intro)*heldFlow*Math.min(1,shimmer);ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.stroke();
    }
    ctx.shadowColor="#e3eeff";ctx.shadowBlur=5;
    for(let i=0;i<66;i++){
      const u=((i/66+t*.018)%1),index=Math.min(179,Math.floor(u*180)),p=thread[index];
      if(p.hidden)continue;
      const p2=thread[index+1];
      ctx.save();ctx.translate(...p);ctx.rotate(Math.atan2(p2[1]-p[1],p2[0]-p[0]));
      const blink=reduced.matches?1:.15+.85*Math.max(0,Math.sin(t*(1.1+hash(i+70)*1.4)+hash(i+90)*6.28));
      ctx.globalAlpha=(1-intro)*heldFlow*(.18+.58*Math.sin(u*Math.PI)**2)*blink;ctx.font=`${Math.max(7,baseCell)+hash(i+20)*2}px monospace`;
      ctx.fillText((i+Math.floor(t*.45))%3?"0":"1",0,0);ctx.restore();
    }
    ctx.shadowBlur=0;
    // Larger, readable digits follow the same offscreen wrap as the GPU ribbon.
    // The wrap happens beyond both viewport edges, never through the sculpture.
    if(state.progress>0){
      const amount=smoothRange(.02,.24,state.progress)*(1-smoothRange(.76,1,state.progress));
      const run=.6*smoothRange(.40,.60,state.progress),gap=width<700?12:16;
      const total=Math.max(10,Math.round(width*.4/gap));
      ctx.font=`500 ${width<700?11:14}px monospace`;ctx.fillStyle="#edf3ff";
      for(let i=0;i<=total;i++){
        const lane=i/total,x=width/2+((.20+lane*.40+run+.8)%1.6-.8)*width;
        const edge=smoothRange(0,28,Math.min(x,width-x));
        const wave=Math.sin((x-width/2)/width*8-t*.6)*Math.min(height*.035,20);
        const strand=(hash(i+90)-.5)*Math.min(height*.085,42);
        ctx.globalAlpha=amount*edge*(.55+.35*hash(i+40));ctx.fillText(i%3?"0":"1",x,height/2-wave-strand);
      }
    }
    const mathWeight=(state.from===1?heldFlow:0);
    sceneLayers?.drawFlow({state,context:ctx,project:p=>project(p,cam),width,height,time:t});
    window.MXIStoryAccessories?.draw({context:ctx,act:state.from,opacity:heldFlow*smoothRange(.8,2.6,state.local),project:p=>project(p,cam),width,height,time:t,reduced:reduced.matches});
    if(mathWeight>.01){
      // Typeset at display resolution: the formula stays readable independently
      // of particle density. Superscripts are actual raised runs, not substitutes.
      const compact=width<700||height<260;
      const face='"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';
      const equations=[
        [{text:"∂"},{text:"t",sub:true},{text:"u = κ ∇"},{text:"2",sup:true},{text:"u"}],
        [{text:"∂"},{text:"2",sup:true},{text:"t",sub:true},{text:"u = c"},{text:"2",sup:true},{text:"∇"},{text:"2",sup:true},{text:"u"}],
        [{text:"iℏ ∂"},{text:"t",sub:true},{text:"ψ = −(ℏ"},{text:"2",sup:true},{text:"/2m)∇"},{text:"2",sup:true},{text:"ψ + Vψ"}],
        [{text:"∂"},{text:"t",sub:true},{text:"v + (v·∇)v = −ρ"},{text:"−1",sup:true},{text:"∇p + ν∇"},{text:"2",sup:true},{text:"v"}],
        [{text:"∇"},{text:"2",sup:true},{text:"φ = 4πGρ"}],
        [{text:"∂"},{text:"t",sub:true},{text:"u = D∇"},{text:"2",sup:true},{text:"u + ru(1 − u)"}]
      ];
      const spread=Math.min(width*.32,Math.max(size*1.12,width*.24));
      const positions=compact?
        [[width*.45,Math.max(22,height*.14),17,-.045],[width*.52,height*.80,16,.035]]:
        [[width/2-spread*.86,height*.19,26,-.065],[width/2+spread*.94,height*.35,22,.05],
          [width/2-spread*1.1,height*.55,23,-.025],[width/2+spread*.82,height*.78,25,-.055],
          [width/2-spread*.63,height*.83,19,.035],[width/2+spread*.51,height*.095,21,.025]];
      ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.shadowBlur=0;
      positions.forEach(([x,y,font,angle],i)=>{
        let cursor=0,scriptStart=null,lastScript=null;
        const runs=equations[i].map(run=>{
          const px=font*(run.sup||run.sub ? .62 : 1);
          ctx.font=`${px}px ${face}`;
          const advance=ctx.measureText(run.text).width;
          const kind=run.sup?"sup":run.sub?"sub":null;
          if(!kind){scriptStart=null;lastScript=null;}
          else if(scriptStart===null||lastScript===kind)scriptStart=cursor;
          const offset=kind?scriptStart:cursor;
          cursor=Math.max(cursor,offset+advance);lastScript=kind;
          return {...run,px,offset};
        });
        ctx.globalAlpha=mathWeight*(.63+(i%3)*.055+.025*Math.sin(t*.45+i));
        const bob=reduced.matches?0:Math.sin(t*.35+i)*.65;
        ctx.save();ctx.translate(x,y+bob);ctx.rotate(angle);
        const textScale=Math.min(1,(compact?width*.86:Math.max(220,width*.30))/cursor);
        ctx.scale(textScale,textScale);
        for(const run of runs){ctx.font=`${run.px}px ${face}`;ctx.fillText(run.text,-cursor/2+run.offset,run.sup?-font*.48:run.sub?font*.3:0);}
        if(i===3){ctx.font=`${font*.58}px ${face}`;ctx.fillText("∇ · v = 0",-cursor/2,font*.85);}
        ctx.restore();
        const graphWidth=compact?60:Math.max(70,Math.min(110,height*.22)),graphHeight=compact?30:Math.max(36,Math.min(56,height*.11));
        const below=y+14+(i===3?font:0)+graphHeight/2;
        const graphY=below+graphHeight/2+8<height?below:y-font-graphHeight/2-10;
        if(height>=180||i===0)mathDiagram(i,x+(i%2?1:-1)*graphWidth*.08,graphY,graphWidth,graphHeight,mathWeight*(.32+.1*Math.sin(t*.6+i)**2),t);
      });
      ctx.textAlign="center";ctx.textBaseline="middle";
    }
    // Servo sparks and synaptic packets travel on the same continuous cable.
    const energy=state.from===4?heldFlow:0;
    for(let i=0;i<14&&energy>.01;i++){
      const u=(t*.13+i*.073)%1,p=thread[Math.floor(u*180)];
      ctx.globalAlpha=energy*Math.sin(u*Math.PI)**8*.65;ctx.font="8px monospace";
      ctx.fillText(i%2?"0":"1",p[0]+Math.sin(i*2+t)*4,p[1]+Math.cos(i+t)*4);
    }
    // A visitor's wave passes through the material without changing the cycle.
    for(let i=pulses.length-1;i>=0;i--){
      const pulse=pulses[i],age=t-pulse.time;if(age>2||age<0||reduced.matches){pulses.splice(i,1);continue;}
      ctx.globalAlpha=(1-age/2)*.14;ctx.strokeStyle="#dde9ff";ctx.lineWidth=.6;ctx.beginPath();
      ctx.arc(pulse.x,pulse.y,age*size*.75,0,Math.PI*2);ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  function render(){
    if(lost||!width||!count)return;
    const t=reduced.matches?shapes.sceneTime(reducedScene)+3:time,state=shapes.timeline(t),cam=camera(state);
    const endWeight=(state.from===6?1-state.mix:0)+(state.to===6?state.mix:0);
    const mathWeight=(state.from===1?1-state.mix:0)+(state.to===1?state.mix:0);
    const active=(state.from>0&&state.from<6?1-state.mix:0)+(state.to>0&&state.to<6?state.mix:0);
    const volume=sceneLayers?0:(state.from===4||state.from===5?1-state.mix:0)+(state.to===4||state.to===5?state.mix:0);
    view=[(-.34+Math.sin(t*.095)*(.10+volume*.3))*active-.26*endWeight,(.12+Math.sin(t*.07)*(.045+volume*.09))*active+.085*endWeight];
    objectSize=size*(1+endWeight*.65+active*.12);
    const current=state.mix>.5?state.to:state.from;
    sceneButtons.forEach(button=>button.setAttribute("aria-current",Number(button.dataset.scene)===current?"step":"false"));
    // The compass and topology need several times the samples of a solid wordmark.
    // Allocate once at the finest resolution, then smoothly change the active
    // viewport. Transitions keep their particle identities and do not reallocate.
    const bodyCell=baseCell*(1-active)+detailCell*active;
    const ribbonWeight=Math.sin(Math.PI*state.progress)**4;
    const cell=bodyCell+(Math.max(bodyCell,Math.min(7.5,baseCell))-bodyCell)*ribbonWeight;
    gridWidth=Math.max(1,Math.round(width/cell));gridHeight=Math.max(1,Math.round(height/cell));
    gl.bindFramebuffer(gl.FRAMEBUFFER,fieldBuffer);gl.viewport(0,0,gridWidth,gridHeight);
    gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
    Object.values(attributes).forEach(attribute=>gl.enableVertexAttribArray(attribute));
    [["from",state.from],["to",state.to]].forEach(([name,act])=>{
      gl.bindBuffer(gl.ARRAY_BUFFER,buffers[act]);gl.vertexAttribPointer(attributes[name],4,gl.FLOAT,false,16,0);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER,traitBuffer);gl.vertexAttribPointer(attributes.traits,4,gl.FLOAT,false,16,0);
    gl.uniform2f(uniforms.resolution,width,height);gl.uniform1f(uniforms.dpr,dpr);gl.uniform1f(uniforms.size,objectSize);gl.uniform2f(uniforms.view,...view);
    gl.uniform1f(uniforms.time,t);gl.uniform1f(uniforms.mix,state.mix);gl.uniform2f(uniforms.acts,state.from,state.to);
    gl.uniform1f(uniforms.progress,state.progress);
    gl.uniform3f(uniforms.camera,...cam);gl.uniform3f(uniforms.pointer,pointer.x,pointer.y,reduced.matches?0:pointer.active);
    gl.uniform1f(uniforms.fieldPointSize,1.65-.45*active);
    gl.uniform1f(uniforms.fieldPass,1);gl.uniform1f(uniforms.glow,0);gl.drawArrays(gl.POINTS,0,count);
    // One independently shaded glyph per screen cell: no overlapping 0/1 fog.
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);gl.disable(gl.DEPTH_TEST);
    Object.values(attributes).forEach(attribute=>gl.disableVertexAttribArray(attribute));
    gl.useProgram(asciiProgram);gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(quadAttribute);gl.vertexAttribPointer(quadAttribute,2,gl.FLOAT,false,0,0);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,fieldTexture);gl.uniform1i(asciiUniforms.field,0);
    gl.uniform2f(asciiUniforms.resolution,width,height);gl.uniform2f(asciiUniforms.grid,gridWidth,gridHeight);
    gl.uniform2f(asciiUniforms.fieldSize,fieldWidth,fieldHeight);
    gl.uniform1f(asciiUniforms.dpr,dpr);gl.uniform1f(asciiUniforms.time,t);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    sceneLayers?.drawGL({state,width,height,view,camera:cam,size:objectSize,time:t});
    foregroundScene(state,t,cam);
  }
  function animate(clock){
    frame=0;
    if(clock-lastPaint>=1000/(width<500?30:45)){
      const delta=lastClock?Math.min((clock-lastClock)/1000,.08):0;
      time+=delta;lastClock=clock;lastPaint=clock;
      pointer.active+=(pointer.target-pointer.active)*(1-Math.exp(-delta*5));render();
    }
    if(!paused&&visible&&!document.hidden&&!reduced.matches&&!lost)frame=requestAnimationFrame(animate);
  }
  function sync(){
    cancelAnimationFrame(frame);frame=0;lastClock=0;lastPaint=0;render();
    if(!paused&&visible&&!document.hidden&&!reduced.matches&&!lost)frame=requestAnimationFrame(animate);
  }
  function resize(){
    if(lost)return;
    const bounds=stage.getBoundingClientRect(),w=Math.round(bounds.width),h=Math.round(bounds.height);
    const nextDpr=Math.min(window.devicePixelRatio||1,w<700?3:2);
    if(!w||!h||(w===width&&h===height&&nextDpr===dpr))return;
    // Phones have dense displays but a small subject: allow 3x backing pixels there.
    width=w;height=h;dpr=nextDpr;size=width<700?Math.min(width*.47,height*.32):Math.min(width*.36,height*.4);
    canvas.width=foreground.width=Math.round(width*dpr);canvas.height=foreground.height=Math.round(height*dpr);
    // Glyph cells follow the subject, so a small screen keeps the same number of
    // 0/1 across the body; 8 device pixels is the smallest legible glyph.
    baseCell=Math.max(8/dpr,Math.min(8.5,size/38));
    // Preserve detail across a shorter stage: a fixed 3.2px grid used to lose
    // about a third of the subject's samples when Projects entered the viewport.
    // Larger flow glyphs remain independently sized for readable moving 0/1.
    detailCell=Math.min(3.2,Math.max(2.2,size/84));
    const fieldCell=Math.min(detailCell,baseCell);
    fieldWidth=Math.max(1,Math.round(width/fieldCell));fieldHeight=Math.max(1,Math.round(height/fieldCell));
    gl.bindTexture(gl.TEXTURE_2D,fieldTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,fieldWidth,fieldHeight,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.bindRenderbuffer(gl.RENDERBUFFER,fieldDepth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,fieldWidth,fieldHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER,fieldBuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,fieldTexture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,fieldDepth);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE){console.warn("MXI ASCII framebuffer unavailable");return;}
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.viewport(0,0,canvas.width,canvas.height);
    // Finer phone cells need enough samples to cover the body without holes.
    count=Math.min(width<700?26000:50000,Math.max(18000,Math.round(width*height/20)));
    const bodies=referenceReady?targets.bookends(count):targets.build(count);
    if(referenceReady)reference.build(count,sceneLayers?[0,1,2,3,4]:[0,1,2]).forEach((data,act)=>{if(data)bodies[act+1]=data;});
    if(!sceneLayers){bodies[4]=brainReady?brain.build(count):targets.buildScene(3,count);bodies[5]=targets.buildScene(4,count);}
    bodies.forEach((data,act)=>{gl.bindBuffer(gl.ARRAY_BUFFER,buffers[act]);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);});
    const traits=new Float32Array(count*4);
    for(let i=0;i<count;i++)traits.set([i%19===0?7+hash(i+12)*1.5:2.8+hash(i+8)*.9,hash(i)*Math.PI*2,.7+hash(i+4)*.3,i/count],i*4);
    gl.bindBuffer(gl.ARRAY_BUFFER,traitBuffer);gl.bufferData(gl.ARRAY_BUFFER,traits,gl.STATIC_DRAW);
    stage.classList.add("is-ready");sync();
  }
  stage.addEventListener("pointermove",event=>{
    if(event.pointerType==="touch"||paused||reduced.matches)return;
    const b=stage.getBoundingClientRect();pointer.x=event.clientX-b.left-width/2;pointer.y=height/2-(event.clientY-b.top);pointer.target=1;
  },{passive:true});
  stage.addEventListener("pointerleave",()=>{pointer.target=0;});
  stage.addEventListener("pointerup",event=>{
    if(paused||reduced.matches)return;const b=stage.getBoundingClientRect();
    pulses.push({x:event.clientX-b.left,y:event.clientY-b.top,time});if(pulses.length>3)pulses.shift();
  });
  stage.addEventListener("keydown",event=>{
    if(event.key===" "){event.preventDefault();paused=!paused;sync();}
    if(event.key==="Enter"&&!paused&&!reduced.matches){event.preventDefault();pulses.push({x:width/2,y:height/2,time});if(pulses.length>3)pulses.shift();}
  });
  sceneButtons.forEach(button=>button.addEventListener("click",()=>{
    const act=Number(button.dataset.scene);
    if(!shapes.sequence.includes(act))return;
    time=shapes.sceneTime(act);reducedScene=act;pulses.length=0;pointer.target=0;sync();
  }));
  document.addEventListener("visibilitychange",()=>{pointer.target=0;sync();});
  reduced.addEventListener("change",sync);
  canvas.addEventListener("webglcontextlost",event=>{event.preventDefault();lost=true;cancelAnimationFrame(frame);stage.classList.remove("is-ready");});
  const scheduleResize=()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(resize);};
  if("ResizeObserver"in window)new ResizeObserver(scheduleResize).observe(stage);
  else window.addEventListener("resize",scheduleResize);
  // A window can move between displays without changing its CSS dimensions.
  // Re-arm the query after each change so the backing canvas follows the DPR.
  let resolutionQuery;
  function watchResolution(){
    resolutionQuery?.removeEventListener?.("change",resolutionChanged);
    resolutionQuery=window.matchMedia(`(resolution: ${window.devicePixelRatio||1}dppx)`);
    resolutionQuery.addEventListener?.("change",resolutionChanged);
  }
  function resolutionChanged(){watchResolution();scheduleResize();}
  watchResolution();
  if("IntersectionObserver"in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(stage);
  resize();
})();
