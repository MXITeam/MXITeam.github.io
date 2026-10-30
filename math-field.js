"use strict";

// Extend the reference's outgoing filaments; leave its central sculpture intact.
window.MXIMathField = (() => {
  function create(gl,surface){
    if(!surface?.pixels)return null;
    const {width,height,pixels,cx,cy,scale}=surface;
    const luminance=(x,y)=>{
      x=Math.max(0,Math.min(width-1,Math.round(x)));y=Math.max(0,Math.min(height-1,Math.round(y)));
      const i=(y*width+x)*4;return (pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722)/255;
    };
    function point(x,y,depth){
      const vx=(x-cx)*scale*(1-depth*.38),vy=(cy-y)*scale*(1-depth*.38),yaw=-.34,pitch=.12;
      const ry=Math.cos(pitch)*vy+Math.sin(pitch)*depth,rz=-Math.sin(pitch)*vy+Math.cos(pitch)*depth;
      return [Math.cos(yaw)*vx-Math.sin(yaw)*rz,ry,Math.sin(yaw)*vx+Math.cos(yaw)*rz];
    }
    const vertices=[],streams=[];
    for(const side of [-1,1]){
      const edgeX=width*(side<0?.095:.905),innerX=edgeX-side*width*.085;
      const candidates=[];
      for(let y=height*.28;y<height*.87;y+=3){
        const light=Math.max(luminance(edgeX-2,y),luminance(edgeX,y),luminance(edgeX+2,y));
        if(light>.16)candidates.push({y,light});
      }
      candidates.sort((a,b)=>b.light-a.light);
      const selected=[];
      for(const candidate of candidates){if(selected.every(p=>Math.abs(p.y-candidate.y)>height*.024))selected.push(candidate);if(selected.length===12)break;}
      for(let k=0;k<selected.length;k++){
        const edge=selected[k];let innerY=edge.y,best=0;
        for(let y=edge.y-height*.04;y<edge.y+height*.04;y++){
          const score=luminance(innerX,y)*Math.exp(-Math.abs(y-edge.y)/(height*.035));
          if(score>best){best=score;innerY=y;}
        }
        const slope=Math.max(-.65,Math.min(.65,(edge.y-innerY)/(edgeX-innerX)));
        const depth=-.12+(k%4)*.09,length=width*(2.3+(k%3)*.3);
        const sample=t=>{
          const x=innerX+side*length*t;
          const y=innerY+slope*side*length*t*.6+Math.sin(t*Math.PI)*height*(k%2?.16:-.16);
          const alpha=Math.sin(Math.PI*t)**.65*(.055+edge.light*.06);
          return [...point(x,y,depth+Math.sin(t*Math.PI)*.09),alpha];
        };
        let previous=sample(0);const stream=[previous];
        for(let i=1;i<=180;i++){const p=sample(i/180);vertices.push(...previous,...p);stream.push(p);previous=p;}
        streams.push(stream);
      }
    }
    // Neural and cosmic filaments also leave through the upper and lower field;
    // horizontal extensions alone still expose the portrait-shaped crop.
    if(surface.act>=3)for(const side of [-1,1]){
      const edgeY=height*(side<0?.15:.85),innerY=edgeY-side*height*.09,candidates=[];
      for(let x=width*.12;x<width*.88;x+=3){
        const light=Math.max(luminance(x,edgeY-2),luminance(x,edgeY),luminance(x,edgeY+2));
        if(light>.14)candidates.push({x,light});
      }
      candidates.sort((a,b)=>b.light-a.light);
      const selected=[];
      for(const candidate of candidates){if(selected.every(p=>Math.abs(p.x-candidate.x)>width*.065))selected.push(candidate);if(selected.length===7)break;}
      for(let k=0;k<selected.length;k++){
        const edge=selected[k];let innerX=edge.x,best=0;
        for(let x=edge.x-width*.07;x<edge.x+width*.07;x++){
          const score=luminance(x,innerY)*Math.exp(-Math.abs(x-edge.x)/(width*.04));
          if(score>best){best=score;innerX=x;}
        }
        const slope=Math.max(-.5,Math.min(.5,(edge.x-innerX)/(edgeY-innerY))),length=height*(.85+k%3*.2);
        const sample=t=>{
          const y=innerY+side*length*t,x=innerX+slope*side*length*t*.65+Math.sin(t*Math.PI)*width*(k%2?.16:-.16);
          return [...point(x,y,-.1+(k%3)*.09),Math.sin(Math.PI*t)**.65*(.035+edge.light*.04)];
        };
        let previous=sample(0);const stream=[previous];
        for(let i=1;i<=120;i++){const p=sample(i/120);vertices.push(...previous,...p);stream.push(p);previous=p;}
        streams.push(stream);
      }
    }
    if(!vertices.length)return null;
    const vertex=`
      precision highp float;attribute vec4 a_vertex;
      uniform vec2 u_resolution;uniform vec2 u_view;uniform vec3 u_camera;uniform float u_size;uniform float u_opacity;
      varying mediump float v_alpha;varying mediump vec2 v_screen;
      void main(){vec3 p=a_vertex.xyz;
        p=vec3(cos(u_view.x)*p.x+sin(u_view.x)*p.z,p.y,-sin(u_view.x)*p.x+cos(u_view.x)*p.z);
        p=vec3(p.x,cos(u_view.y)*p.y-sin(u_view.y)*p.z,sin(u_view.y)*p.y+cos(u_view.y)*p.z);
        vec2 screen=(p.xy-u_camera.xy)*u_size*u_camera.z/max(.42,1.-p.z*.38)/(u_resolution*.5);
        gl_Position=vec4(screen,0.,1.);v_screen=screen;v_alpha=a_vertex.w*u_opacity;
      }`;
    const fragment=`precision mediump float;varying mediump float v_alpha;varying mediump vec2 v_screen;
      void main(){float edge=1.-smoothstep(.69,1.03,max(abs(v_screen.x),abs(v_screen.y)));gl_FragColor=vec4(.88,.93,1.,v_alpha*edge);}`;
    const compiled=[];
    for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
      const shader=gl.createShader(type);if(!shader){compiled.forEach(s=>gl.deleteShader(s));return null;}
      gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){console.warn("MXI Mathematics field:",gl.getShaderInfoLog(shader));gl.deleteShader(shader);compiled.forEach(s=>gl.deleteShader(s));return null;}
      compiled.push(shader);
    }
    const program=gl.createProgram();if(!program){compiled.forEach(s=>gl.deleteShader(s));return null;}
    compiled.forEach(s=>gl.attachShader(program,s));gl.linkProgram(program);compiled.forEach(s=>gl.deleteShader(s));
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);return null;}
    const buffer=gl.createBuffer();if(!buffer){gl.deleteProgram(program);return null;}
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    const attribute=gl.getAttribLocation(program,"a_vertex");
    const uniforms=Object.fromEntries(["resolution","view","camera","size","opacity"].map(n=>[n,gl.getUniformLocation(program,"u_"+n)]));
    return Object.freeze({drawFlow({context:ctx,project,width,height,weight,time}){
      if(weight<.002)return;
      ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#dce9ff";ctx.shadowBlur=0;
      const font=width<700?6.5:7.5,gap=width<700?31:37;
      ctx.font=`${font}px monospace`;
      streams.forEach((stream,track)=>{
        const points=stream.map(p=>project(p.slice(0,3))),lengths=[0];
        for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
        const length=lengths[lengths.length-1],phase=(time*(13+track%4*3)+track*7)%gap;
        let j=1,index=0;
        for(let distance=phase;distance<length;distance+=gap,index++){
          while(j<lengths.length-1&&lengths[j]<distance)j++;
          const f=(distance-lengths[j-1])/Math.max(.001,lengths[j]-lengths[j-1]),a=points[j-1],b=points[j];
          const x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f;
          if(x<0||x>width||y<0||y>height)continue;
          const edge=Math.max(0,Math.min(1,x/(width*.13),(width-x)/(width*.13),y/(height*.13),(height-y)/(height*.13)));
          const pathAlpha=stream[j-1][3]+(stream[j][3]-stream[j-1][3])*f;
          const breathe=.45+.55*(.5+.5*Math.sin(time*.85+index*.8+track));
          ctx.globalAlpha=Math.min(.56,pathAlpha*4.5)*weight*edge*edge*breathe;
          if(ctx.globalAlpha<.018)continue;
          let angle=Math.atan2(b[1]-a[1],b[0]-a[0]);if(Math.abs(angle)>Math.PI/2)angle+=Math.PI;
          ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillText((index+track+Math.floor(time*.24))%3?"0":"1",0,0);ctx.restore();
        }
      });
      ctx.restore();
    },draw({width,height,view,camera,size,opacity}){
      if(opacity<.002)return;
      gl.useProgram(program);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,4,gl.FLOAT,false,16,0);
      gl.uniform2f(uniforms.resolution,width,height);gl.uniform2f(uniforms.view,...view);gl.uniform3f(uniforms.camera,...camera);
      gl.uniform1f(uniforms.size,size);gl.uniform1f(uniforms.opacity,opacity);gl.lineWidth(1);
      gl.drawArrays(gl.LINES,0,vertices.length/4);gl.disable(gl.BLEND);
    }});
  }
  return Object.freeze({create});
})();
