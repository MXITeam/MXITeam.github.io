"use strict";

// Small diagrammatic objects share the sculpture's projection and lifecycle.
window.MXIStoryAccessories=(()=>{
  // Prepare transparent binary sprites from photographic source details. The
  // source itself is never composited into the page, so no rectangular image
  // edge or solid photo interrupts the particle field.
  const sprites={};
  if(typeof Image!=="undefined"){
    const source=new Image();
    source.onload=()=>{
      try{
        const crops=[['motor',0,.185],['camera',.185,.365],['capsule',.365,.505],
          ['flask',.505,.64],['dish',.64,.795],['satellite',.795,1]];
        const grid=48,renderSize=192;
        for(const [kind,left,right] of crops){
          const sample=document.createElement('canvas');sample.width=sample.height=grid;
          const sc=sample.getContext('2d',{willReadFrequently:true});
          const sx=source.naturalWidth*left,sw=source.naturalWidth*(right-left);
          const sy=source.naturalHeight*.15,sh=source.naturalHeight*.63;
          const fit=Math.min(grid/sw,grid/sh),dw=sw*fit,dh=sh*fit;
          sc.drawImage(source,sx,sy,sw,sh,(grid-dw)/2,(grid-dh)/2,dw,dh);
          const data=sc.getImageData(0,0,grid,grid).data;
          sprites[kind]=Array.from({length:3},(_,frame)=>{
            const atlas=document.createElement('canvas');atlas.width=atlas.height=renderSize;
            const ac=atlas.getContext('2d');ac.fillStyle='#e8f1ff';ac.textAlign='center';ac.textBaseline='middle';
            ac.font='4px monospace';
            for(let y=0;y<grid;y++)for(let x=0;x<grid;x++){
              const p=(y*grid+x)*4,light=(data[p]*.2126+data[p+1]*.7152+data[p+2]*.0722)/255;
              if(light<.075||data[p+3]<20)continue;
              const edge=Math.min(1,x/3,(grid-1-x)/3,y/3,(grid-1-y)/3);
              if(edge<=0)continue;
              const seed=Math.abs(Math.sin((x+1)*12.9898+(y+1)*78.233+frame*31.7)*43758.5453)%1;
              ac.globalAlpha=Math.min(1,Math.pow(light,.65)*1.2)*edge*(.75+seed*.25);
              ac.fillText(seed>.48?'1':'0',(x+.5)*4,(y+.5)*4);
            }
            return atlas;
          });
        }
        sprites.joint=sprites.motor;
        window.dispatchEvent(new Event('mxi-accessories-ready'));
      }catch(error){console.warn('MXI accessory particles:',error);}
    };
    source.src='./assets/accessories.aa10dfca6b84.png';
  }
  return Object.freeze({
  draw({context:ctx,act,opacity,project,time,width,height,reduced}){
    if(opacity<.01||act<3||act>5)return;
    const unit=Math.max(15,Math.min(width<700?24:36,height*.07));
    const layouts={
      3:[['camera',[-.94,.48,.16],[-.1,.35,.1],-.12],['motor',[.93,-.22,.22],[.27,-.42,.15],.2],['joint',[-.83,-.63,.1],[-.22,-.6,.1],-.16]],
      4:[['capsule',[-.94,.49,.1],[-.34,.22,.12],-.55],['dish',[.82,-.62,.16],[.2,-.55,.1],.12],['flask',[1.03,.5,-.1],[.42,.2,.08],.2]],
      5:[['satellite',[-1.02,.55,.22],[-.3,.22,.1],-.38],['satellite',[1.03,-.5,-.14],[.38,-.2,.1],.32]]
    };
    ctx.save();ctx.strokeStyle="#b9c9dd";ctx.fillStyle="#dce6f5";ctx.lineWidth=.7;
    ctx.lineCap="round";ctx.lineJoin="round";ctx.shadowBlur=0;
    for(const [i,[kind,location,anchor,angle]] of layouts[act].entries()){
      const center=project(location),start=project(anchor);
      // Thin curved tethers and travelling digits integrate parts with the field.
      const curve=u=>[(1-u)*start[0]+u*center[0],(1-u)*start[1]+u*center[1]-Math.sin(u*Math.PI)*unit*.65];
      for(let j=0;j<20;j++){
        const u=j/20,a=curve(u),b=curve((j+1)/20);
        ctx.globalAlpha=opacity*.11*Math.sin((u+.025)*Math.PI);
        ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
      }
      ctx.font=`${width<700?7:8}px monospace`;ctx.textAlign="center";ctx.textBaseline="middle";
      for(let j=0;j<3;j++){
        const u=(j/3+(reduced?0:time*.10)+i*.17)%1;
        ctx.globalAlpha=opacity*.48*Math.sin(u*Math.PI);ctx.fillText((j+i)%2?"1":"0",...curve(u));
      }
      ctx.save();ctx.translate(...center);ctx.rotate(angle);
      const scale=unit/(1-location[2]*.38)*(act===5&&i===1?.78:1);
      if(sprites[kind]){
        const frame=reduced?0:Math.floor(time*2.4+i*.7)%sprites[kind].length;
        ctx.globalAlpha=opacity*.9;
        ctx.drawImage(sprites[kind][frame],-scale*1.3,-scale*1.3,scale*2.6,scale*2.6);
        ctx.restore();continue;
      }
      const path=(points,close=false)=>{ctx.beginPath();points.forEach(([x,y],j)=>{if(j)ctx.lineTo(x*scale,y*scale);else ctx.moveTo(x*scale,y*scale);});if(close)ctx.closePath();ctx.stroke();};
      const ellipse=(x,y,rx,ry)=>{ctx.beginPath();ctx.ellipse(x*scale,y*scale,rx*scale,ry*scale,0,0,Math.PI*2);ctx.stroke();};
      const bolts=(x,y,rx,ry,n=6)=>{for(let j=0;j<n;j++){const a=j/n*Math.PI*2;ellipse(x+rx*Math.cos(a),y+ry*Math.sin(a),.027,.027);}};
      ctx.globalAlpha=opacity*(.38+.12*Math.sin(time*.6+i)**2);
      if(kind==='camera'){
        path([[-.72,-.42],[.36,-.42],[.68,-.12],[.68,.52],[-.4,.52],[-.72,.2]],true);
        path([[-.72,-.42],[-.4,-.1],[.68,-.1]]);path([[-.4,-.1],[-.4,.52]]);
        ellipse(.15,.2,.28,.25);ellipse(.15,.2,.14,.13);
        ellipse(.15,.2,.22,.20);ellipse(.19,.17,.07,.07);
        path([[-.58,-.42],[-.5,-.62],[-.1,-.62],[.02,-.42]]);
        path([[-.63,-.35],[-.47,-.2],[-.47,.29]]);
        for(let j=0;j<5;j++){const x=-.36+j*.12;path([[x,-.36],[x+.12,-.23]]);}
        for(const x of [-.31,.55])for(const y of [0,.43])ellipse(x,y,.026,.026);
        path([[-.11,.53],[-.11,.71],[.24,.71],[.24,.53]]);path([[-.22,.75],[.36,.75]]);
        ctx.beginPath();ctx.arc(.15*scale,.2*scale,1.5,0,Math.PI*2);ctx.fill();
      }else if(kind==='motor'){
        ellipse(-.43,0,.23,.48);ellipse(.37,0,.23,.48);ellipse(.37,0,.11,.23);
        ellipse(.42,0,.22,.47);ellipse(.47,0,.14,.32);bolts(.42,0,.16,.36);
        path([[-.43,-.48],[.37,-.48]]);path([[-.43,.48],[.37,.48]]);
        path([[.48,-.1],[.87,-.1],[.87,.1],[.48,.1]]);
        for(let j=0;j<5;j++){const x=-.31+j*.13;path([[x,-.35],[x,.35]]);}
        path([[-.55,-.27],[-.81,-.48],[-.88,-.43],[-.66,-.16]]);
        path([[-.32,.48],[-.42,.63],[.37,.63],[.45,.46]]);ellipse(-.24,.57,.04,.022);ellipse(.24,.57,.04,.022);
      }else if(kind==='joint'){
        ellipse(0,0,.48,.48);ellipse(.1,.08,.48,.48);ellipse(0,0,.37,.37);ellipse(0,0,.25,.25);ellipse(0,0,.09,.09);bolts(0,0,.31,.31,8);
        for(let j=0;j<16;j++){const a=j*Math.PI/8,b=a+.085;path([[Math.cos(a)*.49,Math.sin(a)*.49],[Math.cos(a)*.56,Math.sin(a)*.56],[Math.cos(b)*.56,Math.sin(b)*.56],[Math.cos(b)*.49,Math.sin(b)*.49]]);}
        path([[-.9,-.16],[-.47,-.16]]);path([[-.9,.16],[-.47,.16]]);path([[.47,-.16],[.9,-.16]]);path([[.47,.16],[.9,.16]]);
      }else if(kind==='capsule'){
        ctx.beginPath();ctx.moveTo(-.48*scale,-.29*scale);ctx.lineTo(.48*scale,-.29*scale);
        ctx.arc(.48*scale,0,.29*scale,-Math.PI/2,Math.PI/2);ctx.lineTo(-.48*scale,.29*scale);
        ctx.arc(-.48*scale,0,.29*scale,Math.PI/2,Math.PI*1.5);ctx.stroke();
        path([[0,-.29],[0,.29]]);
        ellipse(0,0,.065,.29);path([[-.48,-.19],[-.14,-.19]]);
        for(let j=0;j<7;j++){const x=.08+j*.085;path([[x,.1],[x+.08,.22]]);}
        for(let j=0;j<6;j++)ellipse(-.42+(j%3)*.11,-.06+Math.floor(j/3)*.11,.017,.017);
      }else if(kind==='dish'){
        ellipse(0,0,.78,.32);ellipse(0,.22,.78,.32);ellipse(0,0,.63,.23);
        ellipse(0,-.08,.81,.34);ellipse(0,.25,.75,.31);
        path([[-.78,0],[-.78,.22]]);path([[.78,0],[.78,.22]]);
        for(let j=0;j<14;j++){const a=j*2.4,r=.23+(j%3)*.12;ellipse(Math.cos(a)*r,Math.sin(a)*r*.38,.025+(j%2)*.014,.018);}
        path([[-.54,-.08],[-.36,-.14]]);path([[.34,.4],[.52,.35]]);
      }else if(kind==='flask'){
        ellipse(0,-.78,.18,.065);ellipse(0,-.72,.18,.065);
        path([[-.16,-.72],[-.16,-.34],[-.56,.58],[-.48,.7],[.48,.7],[.56,.58],[.16,-.34],[.16,-.72]]);
        ellipse(0,.57,.5,.12);ellipse(0,.2,.34,.07);
        path([[-.34,.2],[-.48,.56]]);path([[.34,.2],[.48,.56]]);
        path([[-.09,-.67],[-.09,-.29],[-.36,.35]]);
        for(let j=0;j<4;j++){const y=-.04+j*.15,x=.22+j*.063;path([[x,y],[x-.12,y]]);}
        ellipse(-.13,.39,.026,.035);ellipse(.07,.48,.018,.026);
      }else{
        // A shallow cuboid, two gridded solar wings, and a dish antenna.
        path([[-.24,-.3],[.2,-.3],[.36,-.1],[.36,.36],[-.08,.36],[-.24,.16]],true);
        path([[-.24,-.3],[-.08,-.1],[.36,-.1]]);path([[-.08,-.1],[-.08,.36]]);
        path([[-.01,-.03],[.28,-.03],[.28,.26],[-.01,.26]],true);bolts(.13,.12,.1,.1,4);
        for(let j=0;j<4;j++){const y=-.2+j*.1;path([[-.2,y],[-.11,y+.1]]);}
        for(const side of [-1,1]){
          path([[side*.3,-.05],[side*.52,-.05]]);
          path([[side*.5,-.38],[side*1.25,-.38],[side*1.25,.3],[side*.5,.3]],true);
          for(let j=1;j<6;j++){const x=side*(.5+j*.125);path([[x,-.38],[x,.3]]);}
          for(let j=1;j<4;j++){const y=-.38+j*.17;path([[side*.5,y],[side*1.25,y]]);}
        }
        path([[.04,-.3],[.04,-.68]]);ellipse(.04,-.76,.26,.1);path([[.04,-.76],[.18,-1.02]]);
        ellipse(.04,-.8,.27,.1);path([[-.22,-.8],[.04,-.96],[.3,-.8]]);
        for(const x of [-.09,.24]){path([[x,.36],[x-.07,.56],[x+.09,.56],[x+.03,.36]]);ellipse(x+.01,.56,.08,.025);}
      }
      ctx.restore();
    }
    ctx.restore();
  }
  });
})();
