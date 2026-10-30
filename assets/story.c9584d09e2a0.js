"use strict";

(async()=>{
  const stage=document.querySelector("#story-stage");
  const canvas=document.querySelector("#story-particles");
  const foreground=document.querySelector("#story-conduit");
  const shapes=window.MXIStoryShapes, targets=window.MXIStoryTargets, shaders=window.MXIStoryShaders;
  const tagline=document.querySelector(".hero-tagline");
  const sceneButtons=Array.from(document.querySelectorAll?.("[data-scene]")||[]);
  if(!stage||!canvas||!foreground||!shapes||!targets||!shaders)return;
  await targets.ready;
  const reference=window.MXIStoryReference;
  const referenceReady=Boolean(reference&&await reference.ready);
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
  const uniforms=Object.fromEntries(["resolution","dpr","size","time","mix","progress","acts","camera","pointer","glow","view"].map(n=>[n,gl.getUniformLocation(program,"u_"+n)]));
  const buffers=Array.from({length:7},()=>gl.createBuffer()),traitBuffer=gl.createBuffer();
  if(buffers.some(b=>!b)||!traitBuffer)return;
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.clearColor(0,0,0,1);
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  let width=0,height=0,dpr=1,size=1,count=0,frame=0,resizeFrame=0,lastClock=0,lastPaint=0,time=0;
  let paused=false,visible=true,lost=false;
  let reducedScene=6;
  const pointer={x:0,y:0,active:0,target:0},pulses=[];
  const hash=n=>{const v=Math.sin(n*12.9898+4.23)*43758.5453;return v-Math.floor(v);};
  function camera(state){
    const push=state.from===3?Math.sin(Math.PI*state.mix):0;
    return [.17*push,.4*push,1+push*.55];
  }
  let view=[0,0],objectSize=1;
  function project(p,cam){
    const [yaw,pitch]=view;
    const x=Math.cos(yaw)*p[0]+Math.sin(yaw)*p[2],z=-Math.sin(yaw)*p[0]+Math.cos(yaw)*p[2];
    const y=Math.cos(pitch)*p[1]-Math.sin(pitch)*z,depth=Math.sin(pitch)*p[1]+Math.cos(pitch)*z;
    const perspective=1/(1-depth*.38);
    return [width/2+(x-cam[0])*objectSize*cam[2]*perspective,height/2-(y-cam[1])*objectSize*cam[2]*perspective];
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
    const intro=(state.from===0?1-state.mix:0)+(state.to===0?state.mix:0);
    if(intro>.001){
      const font=width<700?30:42,cell=font*.76;
      const half=Math.ceil(width/cell/2)+3;
      ctx.font=`400 ${font}px monospace`;
      for(let i=-half;i<=half;i++){
        const x=width/2+(i+.5)*cell;
        if(i>=-2&&i<=1)continue;
        const cycle=t/(1.25+hash(i+800)*.35)+hash(i+500)*2;
        const phase=cycle-Math.floor(cycle),old=Math.floor(cycle)%2?"1":"0",next=old==="0"?"1":"0";
        const flip=Math.max(0,Math.min(1,(phase-.73)/.27));
        const glint=Math.pow(Math.max(0,Math.sin(t*7.5+hash(i+600)*Math.PI*2)),10);
        const digitOpacity=.34+glint*.36;
        ctx.shadowColor="#e5eeff";ctx.shadowBlur=glint*8;
        function half(digit,top,fold=1,shade=1){
          ctx.save();ctx.translate(x,height/2);ctx.scale(1+Math.sin(flip*Math.PI)*.055,Math.max(.01,fold));
          ctx.beginPath();ctx.rect(-cell*.6,top?-font:0,cell*1.2,font);ctx.clip();
          ctx.globalAlpha=intro*digitOpacity*shade;ctx.fillText(digit,0,0);ctx.restore();
        }
        if(flip===0){ctx.globalAlpha=intro*digitOpacity;ctx.fillText(old,x,height/2);}
        else{
          half(next,true);half(old,false);
          if(flip<.5){const fold=Math.cos(flip*Math.PI);half(old,true,fold,.35+.65*fold);}
          else{const fold=-Math.cos(flip*Math.PI);half(next,false,fold,.35+.65*fold);}
        }
        ctx.shadowBlur=0;
      }
      ctx.font=`900 ${font}px monospace`;ctx.globalAlpha=intro;ctx.shadowColor="#f5f8ff";ctx.shadowBlur=12;
      [..."1011"].forEach((digit,i)=>ctx.fillText(digit,width/2+(i-1.5)*cell,height/2));ctx.shadowBlur=0;
    }
    const thread=[];
    for(let i=0;i<=180;i++){
      const u=i/180,a=shapes.conduit(state.from,u,t),b=shapes.conduit(state.to,u,t);
      thread.push(project(a.map((v,k)=>v+(b[k]-v)*state.mix),cam));
    }
    ctx.globalAlpha=.1*(1-intro);ctx.strokeStyle="#cbd8ed";ctx.lineWidth=.65;ctx.beginPath();
    thread.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();
    ctx.shadowColor="#e3eeff";ctx.shadowBlur=5;
    for(let i=0;i<66;i++){
      const u=((i/66+t*.018)%1),index=Math.min(179,Math.floor(u*180)),p=thread[index];
      const p2=thread[index+1];
      ctx.save();ctx.translate(...p);ctx.rotate(Math.atan2(p2[1]-p[1],p2[0]-p[0]));
      ctx.globalAlpha=(1-intro)*(.18+.58*Math.sin(u*Math.PI)**2);ctx.font=`${8.5+hash(i+20)*2}px monospace`;
      ctx.fillText((i+Math.floor(t*.45))%3?"0":"1",0,0);ctx.restore();
    }
    ctx.shadowBlur=0;
    const mathWeight=(state.from===1?1-state.mix:0)+(state.to===1?state.mix:0);
    if(mathWeight>.01){
      ctx.globalAlpha=mathWeight*.6;ctx.textAlign="left";
      ctx.font=`italic ${Math.max(12,Math.min(19,width*.025))}px "Bradley Hand", "Segoe Print", cursive`;
      [["∇ · E = ρ / ε₀",-.77,.67],["∮ ∇f · dr = 0",.1,.66],["x ↦ f(x)",.27,-.57]].forEach(([text,x,y],i)=>{
        const p=project([x+Math.sin(t*.45+i)*.009,y+Math.cos(t*.35+i)*.009,0],cam);ctx.fillText(text,...p);
      });
    }
    // Servo sparks and synaptic packets travel on the same continuous cable.
    const energy=(state.from===2||state.from===4)?1-state.mix:(state.to===2||state.to===4)?state.mix:0;
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
    const t=reduced.matches?reducedScene*10+2:time,state=shapes.timeline(t),cam=camera(state);
    const endWeight=(state.from===6?1-state.mix:0)+(state.to===6?state.mix:0);
    const active=(state.from>0&&state.from<6?1-state.mix:0)+(state.to>0&&state.to<6?state.mix:0);
    view=[(-.34+Math.sin(t*.095)*.10)*active-.26*endWeight,(.12+Math.sin(t*.07)*.045)*active+.085*endWeight];
    objectSize=size*(1+endWeight*.65);
    if(tagline)tagline.style.opacity=String(endWeight);
    const current=state.mix>.5?state.to:state.from;
    sceneButtons.forEach(button=>button.setAttribute("aria-current",Number(button.dataset.scene)===current?"step":"false"));
    gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);
    [["from",state.from],["to",state.to]].forEach(([name,act])=>{
      gl.bindBuffer(gl.ARRAY_BUFFER,buffers[act]);gl.vertexAttribPointer(attributes[name],4,gl.FLOAT,false,16,0);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER,traitBuffer);gl.vertexAttribPointer(attributes.traits,4,gl.FLOAT,false,16,0);
    gl.uniform2f(uniforms.resolution,width,height);gl.uniform1f(uniforms.dpr,dpr);gl.uniform1f(uniforms.size,objectSize);gl.uniform2f(uniforms.view,...view);
    gl.uniform1f(uniforms.time,t);gl.uniform1f(uniforms.mix,state.mix);gl.uniform2f(uniforms.acts,state.from,state.to);
    gl.uniform1f(uniforms.progress,state.progress);
    gl.uniform3f(uniforms.camera,...cam);gl.uniform3f(uniforms.pointer,pointer.x,pointer.y,reduced.matches?0:pointer.active);
    gl.uniform1f(uniforms.glow,1);gl.drawArrays(gl.POINTS,0,count);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1f(uniforms.glow,0);gl.drawArrays(gl.POINTS,0,count);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
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
    if(!w||!h||(w===width&&h===height))return;
    width=w;height=h;dpr=Math.min(window.devicePixelRatio||1,2);size=Math.min(width*.36,height*.4);
    canvas.width=foreground.width=Math.round(width*dpr);canvas.height=foreground.height=Math.round(height*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);
    count=Math.min(width<700?22000:50000,Math.max(9000,Math.round(width*height/20)));
    const bodies=referenceReady?targets.bookends(count):targets.build(count);
    if(referenceReady)reference.build(count).forEach((data,act)=>{bodies[act+1]=data;});
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
    if(!Number.isInteger(act)||act<0||act>6)return;
    time=act*10+2;reducedScene=act;pulses.length=0;pointer.target=0;sync();
  }));
  document.addEventListener("visibilitychange",()=>{pointer.target=0;sync();});
  reduced.addEventListener("change",sync);
  canvas.addEventListener("webglcontextlost",event=>{event.preventDefault();lost=true;cancelAnimationFrame(frame);stage.classList.remove("is-ready");});
  if("ResizeObserver"in window)new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(resize);}).observe(stage);
  else window.addEventListener("resize",resize);
  if("IntersectionObserver"in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(stage);
  resize();
})();
