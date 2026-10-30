"use strict";

// Real three-dimensional surfaces, never an image plane or pixel-derived depth.
window.MXIStoryTargets=(()=>{
  const TAU=Math.PI*2;
  const hash=n=>{const x=Math.sin(n*12.9898+7.13)*43758.5453;return x-Math.floor(x);};
  const add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s),sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const unit=a=>mul(a,1/(Math.hypot(...a)||1));
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  function basis(axis){const n=unit(axis),a=unit(cross(n,Math.abs(n[1])<.9?[0,1,0]:[1,0,0]));return [a,cross(n,a),n];}
  function scene(){
    const parts=[];
    function part(weight,sample){parts.push({weight,sample});}
    function ellipsoid(c,r,weight=1,brightness=.8){
      part(weight,(u,v)=>{const y=1-2*u,s=Math.sqrt(1-y*y),n=[Math.cos(v*TAU)*s,y,Math.sin(v*TAU)*s];return [...add(c,n.map((x,i)=>x*r[i])),brightness*(.42+.58*Math.max(0,n[2]))];});
    }
    function tube(a,b,r,weight=1,brightness=.8){
      const [x,y]=basis(sub(b,a));
      part(weight,(u,v)=>{const n=add(mul(x,Math.cos(v*TAU)),mul(y,Math.sin(v*TAU)));return [...add(mix(a,b,u),mul(n,r)),brightness*(.4+.6*Math.max(0,n[2]))];});
    }
    function ring(c,axis,R,r,weight=1,brightness=.9){
      const [x,y,n]=basis(axis);
      part(weight,(u,v)=>{const a=u*TAU,b=v*TAU,radial=add(mul(x,Math.cos(a)),mul(y,Math.sin(a)));return [...add(c,add(mul(radial,R+r*Math.cos(b)),mul(n,r*Math.sin(b)))),brightness*(.55+.45*Math.max(0,Math.sin(b)))];});
    }
    function cable(control,r=.01,weight=.3,brightness=.7){
      function evaluate(t){let p=control.map(v=>v.slice());while(p.length>1)p=p.slice(0,-1).map((v,i)=>mix(v,p[i+1],t));return p[0];}
      part(weight,(u,v)=>{const p=evaluate(u),tangent=sub(evaluate(Math.min(1,u+.002)),evaluate(Math.max(0,u-.002))),[x,y]=basis(tangent);return [...add(p,add(mul(x,r*Math.cos(v*TAU)),mul(y,r*Math.sin(v*TAU)))),brightness];});
    }
    function hand(c,s=1){
      ellipsoid(c,[.105*s,.14*s,.047*s],.85,.65);
      const lengths=[.19,.28,.31,.275,.22];
      for(let f=0;f<5;f++){
        let p=add(c,[(f-2)*.052*s,f===0?0:.10*s,f===0?.025*s:0]);
        const direction=f===0?[-.8,.65,.12]:[(f-2)*.13,1,.12];
        for(let j=0;j<3;j++){const q=add(p,mul(direction,lengths[f]*s*(j===0?.42:.29)));tube(p,q,(f===0?.023:.017)*s,.18,.75);ellipsoid(q,[.022*s,.022*s,.022*s],.08,.92);p=q;}
      }
      for(let i=-1;i<=1;i++)cable([add(c,[i*.045*s,-.11*s,.05*s]),add(c,[i*.04*s,.02*s,.06*s]),add(c,[i*.05*s,.13*s,.046*s])],.005*s,.07,.95);
    }
    return {parts,part,ellipsoid,tube,ring,cable,hand};
  }
  function mathematics(){
    const s=scene();
    s.part(5,(u,v)=>{const a=u*TAU,b=v*TAU,R=.48+.15*Math.cos(b);return [R*Math.cos(a),R*Math.sin(a)*.78-.12,.15*Math.sin(b)+.15*Math.cos(a),.24+.66*Math.max(0,Math.sin(b))];});
    for(let k=0;k<11;k++)s.cable(Array.from({length:7},(_,i)=>{const a=i/6*TAU,b=k/11*TAU;return [(.48+.16*Math.cos(b+a))*Math.cos(a),(.48+.16*Math.cos(b+a))*Math.sin(a)*.78-.12,.16*Math.sin(b+a)+.15*Math.cos(a)];}),.003,.2,.8);
    const hinge=[.38,.82,.02];s.tube(hinge,[.03,.13,.12],.026,.7);s.tube(hinge,[.78,.04,-.08],.026,.7);s.ring(hinge,[0,0,1],.065,.012,.4);s.tube([.32,.7,.02],[.57,.66,-.02],.009,.15);
    for(let k=0;k<5;k++){const y=-.68+k*.27,a=[-.96,y,-.21+k*.07],b=[-.45+k*.27,y+.12,.18];s.tube(a,b,.004,.1,.7);s.tube(b,add(b,[-.06,.035,0]),.006,.04,.9);s.tube(b,add(b,[-.045,-.055,0]),.006,.04,.9);}
    return s.parts;
  }
  function mechanics(){
    const s=scene(),base=[-.48,-.7,0],shoulder=[-.52,-.4,.02],elbow=[-.51,.47,-.02],wrist=[.3,.43,.12];
    s.tube(add(base,[0,-.1,0]),add(base,[0,.12,0]),.23,1,.55);s.ring(base,[0,1,0],.22,.025,.45,.9);
    [[shoulder,.17],[elbow,.16],[wrist,.105]].forEach(([p,r])=>{
      s.ellipsoid(p,[r,r,r*.8],.9,.65);s.ring(add(p,[0,0,r*.7]),[0,0,1],r*.7,.018,.55,1);s.ring(add(p,[0,0,r*.78]),[0,0,1],r*.35,.012,.3,.75);
      for(let i=0;i<6;i++){const a=i/6*TAU;s.ellipsoid(add(p,[Math.cos(a)*r*.85,Math.sin(a)*r*.85,r*.65]),[.012,.012,.012],.025,1);}
    });
    [[shoulder,elbow,.1],[elbow,wrist,.083],[wrist,[.5,.1,.19],.065]].forEach(([a,b,r])=>{s.tube(a,b,r,1.2,.55);[-1,1].forEach(sign=>s.tube(add(a,[0,0,sign*r]),add(b,[0,0,sign*r]),r*.16,.23,.95));});
    for(let k=0;k<8;k++){const z=(k-3.5)*.027;s.cable([[-.61,-.65,z],[-.91,-.07,z],[-.82,.8,z],[.22,.7,z],[.43,.17,z+.17]],.008,.2,.45+k*.045);}
    s.hand([.54,-.24,.2],1.05);
    for(let i=0;i<8;i++){const a=i/8*TAU;s.cable([[.51,.13,.2],[.51+Math.cos(a)*.12,.17+Math.sin(a)*.1,.25],[.55+Math.cos(a)*.21,.19+Math.sin(a)*.18,.27]],.002,.02,.7);}
    return s.parts;
  }
  function robot(){
    const s=scene();
    // Anatomical facial surface: narrowed jaw, orbital recesses and raised nose.
    s.part(8,(u,v)=>{
      const y=1-2*u,a=v*TAU,radial=Math.sqrt(1-y*y),jaw=y<-.1?.68+.32*(y+1)/.9:1;
      const x=Math.cos(a)*radial*.34*jaw,fy=y*.45;let z=Math.sin(a)*radial*.29;
      const g=(cx,cy,wx,wy)=>Math.exp(-Math.pow((x-cx)/wx,2)-Math.pow((fy-cy)/wy,2));
      if(z>0){z+=.105*g(0,-.015,.044,.13)+.075*g(0,-.06,.07,.045);z-=.05*(g(-.135,.095,.065,.042)+g(.135,.095,.065,.042));z+=.022*(g(-.14,.15,.08,.023)+g(.14,.15,.08,.023));z+=.028*g(0,-.18,.105,.028)-.014*g(0,-.17,.09,.008)+.023*g(0,-.28,.09,.07);}
      const seams=Math.abs(Math.sin(a*5+fy*7));return [x+.17,fy+.35,z,.18+.7*Math.max(0,Math.sin(a))*(seams<.065?.35:1)];
    });
    [-1,1].forEach(sign=>{const c=[.17+sign*.345,.34,-.035];s.ring(c,[sign,0,.15],.08,.014,.45,.85);s.ring(c,[sign,0,.15],.043,.011,.25,.7);const eye=[.17+sign*.133,.445,.245];s.ellipsoid(eye,[.048,.022,.018],.12,.35);s.ring(add(eye,[0,0,.012]),[0,0,1],.017,.004,.08,1);});
    s.tube([.17,-.38,-.03],[.17,-.04,-.03],.09,1,.4);for(let i=0;i<6;i++)s.ring([.17,-.33+i*.05,-.03],[0,1,0],.095,.008,.12,.85);
    s.ellipsoid([.17,-.72,-.12],[.56,.37,.245],2,.4);s.cable([[-.38,-.66,.05],[-.11,-.41,.19],[.38,-.43,.2],[.72,-.65,.04]],.014,.5,.9);
    for(let k=0;k<9;k++)s.cable([[.17+(k-4)*.017,-.1,.05],[.28+(k-4)*.024,-.38,.17],[.35+(k-4)*.025,-.65,.19]],.006,.1,.7);
    s.tube([-.36,-.73,.13],[-.55,-.31,.32],.06,.8,.55);s.hand([-.58,-.12,.36],1.05);s.ring([-.62,.64,.36],[0,0,1],.09,.008,.6,.95);
    return s.parts;
  }
  function brain(){
    const s=scene();
    [-1,1].forEach(sign=>s.part(5,(u,v)=>{const lat=Math.acos(1-2*u),a=v*TAU,folds=Math.sin(lat*22+2.2*Math.sin(a*5))*Math.sin(a*17+2*Math.sin(lat*7));const ridge=.026*folds+.012*Math.sin(a*32+lat*9),n=[Math.sin(lat)*Math.cos(a),Math.cos(lat),Math.sin(lat)*Math.sin(a)];const p=[sign*.28+n[0]*(.35+ridge),.15+n[1]*(.46+ridge),n[2]*(.43+ridge)];if(Math.abs(p[0])<.025)p[0]=sign*.025;return [...p,(.24+.64*Math.max(0,n[2]))*(.55+.45*(folds+1)/2)];}));
    s.part(1.7,(u,v)=>{const y=1-2*u,a=v*TAU,r=Math.sqrt(1-y*y),fold=.012*Math.sin(y*95);return [Math.cos(a)*r*(.31+fold),-.37+y*.19,-.11+Math.sin(a)*r*(.28+fold),.28+.45*Math.max(0,Math.sin(a))];});
    s.tube([.02,-.47,-.07],[.09,-.82,-.13],.067,.75,.7);
    for(let k=0;k<22;k++){
      const sign=k%2?1:-1,start=[sign*(.42+hash(k)*.13),.1+(hash(k+11)-.5)*.6,(hash(k+4)-.5)*.5],tip=[sign*(.8+hash(k+31)*.55),start[1]+(hash(k+42)-.4)*.9,(hash(k+7)-.5)*1.1];
      s.cable([start,add(start,[sign*.18,.2,.1]),add(tip,[-sign*.2,-.1,.02]),tip],.004,.07,.6);s.ellipsoid(tip,[.016,.016,.016],.018,1);
      for(let b=0;b<2;b++)s.cable([mix(start,tip,.6),add(tip,[sign*.1,(b-.5)*.24,.1]),add(tip,[sign*.24,(b-.5)*.5,-.12])],.002,.025,.5);
    }
    return s.parts;
  }
  function cosmos(){
    const s=scene(),tilt=p=>[p[0]*.9-p[1]*.43,p[0]*.43+p[1]*.9,p[2]];
    s.part(6,(u,v)=>{const a=v*TAU,r=.31+Math.pow(u,.8)*.64,z=Math.sin(a)*r*.68,y=Math.sin(a)*r*.3+(hash(u*998+v*13)-.5)*.022;return [...tilt([Math.cos(a)*r,y,z]),.13+Math.exp(-Math.pow(r-.38,2)/.009)*.8+.15*(1-u)];});
    s.part(2.4,(u,v)=>{const a=u*TAU,b=v*TAU,r=.342+.012*Math.cos(b);return [...tilt([Math.cos(a)*r,Math.sin(a)*r*.48+.008*Math.sin(b),Math.sin(a)*r*.7]),.95];});
    for(let k=0;k<32;k++){const angle=hash(k)*TAU,r=1+hash(k+20)*.9,a=[Math.cos(angle)*.72,Math.sin(angle)*.67,(hash(k+5)-.5)*.9],b=[Math.cos(angle+.4)*r,Math.sin(angle+.4)*r*.85,(hash(k+9)-.5)*1.7];s.cable([a,mix(a,b,.35),add(b,[.16*Math.sin(k),.17*Math.cos(k),.12]),b],.0025,.065,.25+hash(k+71)*.5);if(k%3===0)s.ellipsoid(b,[.022,.014,.018],.025,.9);}
    return s.parts;
  }
  const definitions=[mathematics(),mechanics(),robot(),brain(),cosmos()];
  function wordmark(count){
    const mask=document.createElement("canvas");mask.width=1000;mask.height=400;
    const context=mask.getContext("2d",{willReadFrequently:true});
    if(!context)return new Float32Array(count*4);
    context.font='900 300px "Arial Black", Arial, sans-serif';context.fillStyle="white";context.textAlign="center";
    const metrics=context.measureText("MXI"),baseline=(400+metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2;
    context.fillText("MXI",500,baseline);
    const pixels=context.getImageData(0,0,1000,400).data,candidates=[];
    for(let y=0;y<400;y+=2)for(let x=0;x<1000;x+=2){
      if(pixels[(y*1000+x)*4+3]<160)continue;
      const i=candidates.length,sx=x+(hash(i*7+1)-.5)*2,sy=y+(hash(i*7+2)-.5)*2;
      const z=hash(i*7+3)>.75?-.12:.12;
      candidates.push([(sx-500)/430,(200-sy)/430,z,.3+.65*(z>0?1:.25)]);
    }
    if(!candidates.length)return new Float32Array(count*4);
    const points=[];
    for(let i=candidates.length-1;i>0;i--){const j=Math.floor(hash(i+399)*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
    for(let i=0;i<count;i++){const p=candidates[i%candidates.length].slice();p[2]+=(hash(i+456)-.5)*.025;if(i>=Math.min(12000,candidates.length))p[3]=0;points.push(p);}
    return new Float32Array(spatialOrder(points).flat());
  }
  // Recursive spatial quantiles keep local neighborhoods together in each body.
  function spatialOrder(points,axis=0){if(points.length<=12)return points.sort((a,b)=>a[axis]-b[axis]);points.sort((a,b)=>a[axis]-b[axis]);const middle=points.length>>>1;return spatialOrder(points.slice(0,middle),(axis+1)%3).concat(spatialOrder(points.slice(middle),(axis+1)%3));}
  function build(count){
    const bodies=definitions.map(parts=>{const sum=parts.reduce((n,p)=>n+p.weight,0),points=[];let partIndex=0,boundary=parts[0].weight;for(let i=0;i<count;i++){const q=(i+.5)/count*sum;while(q>boundary&&partIndex<parts.length-1)boundary+=parts[++partIndex].weight;points.push(parts[partIndex].sample(hash(i*3+1),hash(i*3+2)));}return new Float32Array(spatialOrder(points).flat());});
    const chain=new Float32Array(count*4);for(let i=0;i<count;i++)chain.set([(i/count-.5)*7,0,0,0],i*4);
    return [chain,...bodies,wordmark(count)];
  }
  function bookends(count){const empty=()=>new Float32Array(count*4),chain=empty();for(let i=0;i<count;i++)chain.set([(i/count-.5)*7,0,0,0],i*4);return [chain,empty(),empty(),empty(),empty(),empty(),wordmark(count)];}
  return Object.freeze({ready:Promise.resolve(true),build,bookends,spatialOrder});
})();
