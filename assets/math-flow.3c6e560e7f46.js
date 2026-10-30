"use strict";

// Readable packets move through the reference's curves; the body stays put.
window.MXIMathFlow = (() => {
  function create(surface){
    if(!surface)return null;
    const {width,height,cx,cy,scale}=surface;
    function point(u,v){
      const x=(u*(width-1)-cx)*scale,y=(cy-v*(height-1))*scale;
      if(window.MXIStoryReference?.position)return window.MXIStoryReference.position(surface.act||0,x,y);
      const depth=.22*Math.sin(Math.atan2(y+.18,x+.13))+.09*Math.sin(x*8);
      const vx=x*(1-depth*.38),vy=y*(1-depth*.38),yaw=-.34,pitch=.12;
      const ry=Math.cos(pitch)*vy+Math.sin(pitch)*depth,rz=-Math.sin(pitch)*vy+Math.cos(pitch)*depth;
      return [Math.cos(yaw)*vx-Math.sin(yaw)*rz,ry,Math.sin(yaw)*vx+Math.cos(yaw)*rz];
    }
    // The reference's two bright knots and its looping toroidal paths.
    const pathsByAct=[[
      [[.53,.34],[.22,.34],[.06,.49],[.37,.64]],
      [[.37,.64],[.31,.78],[.96,.82],[.70,.55]],
      [[.70,.55],[.62,.36],[.16,.52],[.37,.64]],
      [[.53,.34],[.93,.41],[.96,.74],[.37,.64]],
      [[.37,.64],[.03,.75],[.16,.92],[.78,.85]]
    ],[
      [[.19,.15],[.02,.34],[.09,.54],[.58,.67]],
      [[.58,.67],[.87,.77],[.88,.93],[.43,.91]],
      [[.20,.18],[.45,.18],[.62,.22],[.76,.31]],
      [[.76,.31],[.90,.36],[.95,.49],[.83,.53]],
      [[.15,.40],[.09,.63],[.37,.81],[.68,.75]]
    ],[
      [[.23,.70],[.05,.53],[.05,.38],[.13,.32]],
      [[.13,.32],[.18,.24],[.14,.20],[.15,.16]],
      [[.69,.39],[.78,.64],[.67,.63],[.80,.80]],
      [[.23,.70],[.32,.80],[.55,.85],[.76,.85]],
      [[.46,.36],[.47,.33],[.55,.33],[.56,.36]]
    ],[
      [[.08,.47],[.04,.28],[.28,.22],[.48,.31]],
      [[.13,.52],[.25,.38],[.51,.45],[.66,.35]],
      [[.20,.56],[.44,.56],[.56,.62],[.58,.72]],
      [[.52,.40],[.71,.23],[.72,.09],[.92,.11]],
      [[.57,.53],[.82,.62],[.89,.48],[.97,.43]]
    ],[
      [[.15,.66],[.06,.40],[.56,.27],[.87,.37]],
      [[.87,.37],[1.04,.51],[.69,.80],[.15,.66]],
      [[.08,.78],[.26,.91],[.71,.84],[.91,.68]],
      [[.16,.21],[.47,.12],[.74,.17],[.93,.28]],
      [[.52,.78],[.72,.88],[.86,.93],[.98,.91]]
    ]];
    const controls=pathsByAct[surface.act||0];
    const streams=controls.map(control=>Array.from({length:161},(_,i)=>{
      const t=i/160,v=1-t;
      const p=[0,1].map(axis=>control[0][axis]*v**3+3*control[1][axis]*v*v*t+3*control[2][axis]*v*t*t+control[3][axis]*t**3);
      return point(...p);
    }));
    return Object.freeze({draw({context:ctx,project,width,weight,time}){
      if(weight<.002)return;
      ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#e9f2ff";
      streams.forEach((stream,track)=>{
        if(width<700&&track>2&&surface.act!==3)return;
        const points=stream.map(project),lengths=[0];
        for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
        const length=lengths[lengths.length-1];if(length<1)return;
        const neural=surface.act===3;
        const font=width<700?7.5:neural?7.5:8.5,gap=font*.92;
        for(let packet=0;packet<(neural?1:2);packet++)for(let digit=0;digit<(neural?4:6);digit++){
          // Arc-length speed, not parameter speed: bends don't slow or bunch digits.
          const head=(time*(width<700?24:38)+track*57+packet*length*.51)%length;
          const distance=(head-digit*gap+length*2)%length;
          let j=1;while(j<lengths.length-1&&lengths[j]<distance)j++;
          const f=(distance-lengths[j-1])/Math.max(.001,lengths[j]-lengths[j-1]);
          const a=points[j-1],b=points[j],x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f;
          const fade=Math.min(1,distance/22,(length-distance)/22);
          let angle=Math.atan2(b[1]-a[1],b[0]-a[0]);if(Math.abs(angle)>Math.PI/2)angle+=Math.PI;
          ctx.save();ctx.translate(x,y);ctx.rotate(angle);
          ctx.globalAlpha=weight*fade*(.94-digit*.12);
          ctx.font=`${digit===0?600:400} ${font}px monospace`;ctx.shadowColor="#e7f1ff";ctx.shadowBlur=digit===0?3:0;
          ctx.fillText((digit+track+packet)%3?"0":"1",0,0);ctx.restore();
        }
      });
      ctx.restore();
    }});
  }
  return Object.freeze({create});
})();
