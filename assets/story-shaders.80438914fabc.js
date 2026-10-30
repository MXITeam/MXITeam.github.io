"use strict";

window.MXIStoryShaders=Object.freeze({
  vertex:`
    precision highp float;
    attribute vec4 a_from;
    attribute vec4 a_to;
    attribute vec4 a_traits;
    uniform vec2 u_resolution;
    uniform float u_dpr;
    uniform float u_size;
    uniform float u_time;
    uniform float u_mix;
    uniform float u_progress;
    uniform vec2 u_acts;
    uniform vec3 u_camera;
    uniform vec3 u_pointer;
    uniform vec2 u_view;
    uniform mediump float u_glow;
    uniform mediump float u_fieldPass;
    uniform float u_fieldPointSize;
    varying mediump float v_alpha;
    varying mediump float v_digit;
    vec3 cameraPoint(vec3 p){
      p=vec3(cos(u_view.x)*p.x+sin(u_view.x)*p.z,p.y,-sin(u_view.x)*p.x+cos(u_view.x)*p.z);
      return vec3(p.x,cos(u_view.y)*p.y-sin(u_view.y)*p.z,sin(u_view.y)*p.y+cos(u_view.y)*p.z);
    }
    vec2 screenPoint(vec3 p){
      return (p.xy-u_camera.xy)*u_size*u_camera.z/max(.42,1.-p.z*.38);
    }
    vec3 breathe(vec3 p,float act,float seed) {
      float amplitude=act>5.5||act<.5?0.:act<1.5?0.0005:0.001;
      p.xy+=vec2(sin(seed+u_time*.7+p.y*5.),cos(seed*1.3+u_time*.55+p.x*4.))*amplitude;
      if(act>4.5&&act<5.5) {
        float a=sin(u_time*.18)*.015;
        p.xy=mat2(cos(a),-sin(a),sin(a),cos(a))*p.xy;
      }
      return p;
    }
    void main(){
      float seed=a_traits.y;
      vec3 from=cameraPoint(breathe(a_from.xyz,u_acts.x,seed));
      vec3 to=cameraPoint(breathe(a_to.xyz,u_acts.y,seed));
      vec2 fromScreen=screenPoint(from),toScreen=screenPoint(to);
      // Withdraw left-to-right into a horizontal stream at the right. Only once
      // the body is gone does that stream enter at the left and unfold rightward.
      float sourceRank=clamp(fromScreen.x/(u_size*1.5)+.5,0.,1.);
      float targetRank=clamp(toScreen.x/(u_size*1.5)+.5,0.,1.);
      float retreat=smoothstep(sourceRank*.22,sourceRank*.22+.22,u_progress);
      float emerge=smoothstep(.62+targetRank*.18,.82+targetRank*.18,u_progress);
      float lane=fract(seed*1.913);
      float run=.6*smoothstep(0.,1.,u_progress);
      float ribbonX=(mod(lane*1.6+run,1.6)-.8)*u_resolution.x;
      // A shallow, multi-strand current gives the chain room to breathe.
      // During collection and release, curved paths meet the same moving
      // current tangentially; held silhouettes remain completely stationary.
      float wave=sin(ribbonX/u_resolution.x*8.-u_time*.6)*min(u_resolution.y*.045,28.);
      float strandOffset=fract(seed*2.71)-.5;
      float strand=strandOffset*min(u_resolution.y*.24,104.);
      vec2 ribbon=vec2(ribbonX,wave+strand);
      float gatherArc=sin(3.14159265*retreat);
      float releaseArc=sin(3.14159265*emerge);
      vec2 gathered=mix(fromScreen,ribbon,retreat)+vec2(u_resolution.x*.045,-fromScreen.y*.16)*gatherArc;
      vec2 screen=mix(gathered,toScreen,emerge)+vec2(u_resolution.x*.045,toScreen.y*.16)*releaseArc;
      float stream=retreat*(1.-emerge),k=emerge;
      vec3 p=mix(mix(from,vec3(0.),retreat),to,emerge);
      float perspective=1./max(.42,1.-p.z*.38);
      vec2 delta=screen-u_pointer.xy;
      float distance=length(delta);
      float influence=(1.-smoothstep(0.,110.,distance))*u_pointer.z*(1.-stream);
      screen+=delta/max(distance,1.)*influence*7.;
      gl_Position=vec4(screen/(u_resolution*.5),clamp(-p.z*.2,-.9,.9),1.);
      float endWeight=(u_acts.x>5.5?1.-u_mix:0.)+(u_acts.y>5.5?u_mix:0.);
      float glyphSize=mix(a_traits.x,7.+fract(seed*.37)*1.5,endWeight);
      glyphSize=mix(glyphSize,mix(3.5,8.,step(.86,fract(seed*6.1))),stream);
      gl_PointSize=clamp(glyphSize*u_dpr*perspective*mix(1.,1.8,u_glow),1.,32.);
      if(u_fieldPass>.5)gl_PointSize=u_fieldPointSize;
      float flicker=.88+.12*sin(u_time*1.2+seed*8.);
      float sourceBrain=step(3.5,u_acts.x)*(1.-step(4.5,u_acts.x));
      float targetBrain=step(3.5,u_acts.y)*(1.-step(4.5,u_acts.y));
      float synapse=mix(sourceBrain,targetBrain,k);
      flicker+=pow(max(0.,sin(u_time*2.+seed*3.)),18.)*synapse*.35;
      float depthLight=mix(.19,1.0,smoothstep(-.6,.45,p.z));
      // Keep tonal range: saturation here flattens every body into a white silhouette.
      float bodyAlpha=clamp(mix(a_from.w,a_to.w,k)*flicker*a_traits.z*depthLight*1.35,0.,1.);
      float streamAlpha=.32*(1.-smoothstep(.18,.5,abs(strandOffset)));
      v_alpha=mix(bodyAlpha,streamAlpha,stream);
      // Ribbon coordinates wrap outside the viewport. While a particle is
      // travelling to or from that ribbon, interpolation can bring the wrap
      // back onscreen; fade it at the seam to prevent a visible cross-screen jump.
      float seamDistance=.8-abs(ribbonX/u_resolution.x);
      float seamFade=smoothstep(0.,.16,seamDistance);
      float moving=max(stream,max(4.*retreat*(1.-retreat),4.*emerge*(1.-emerge)));
      v_alpha*=mix(1.,seamFade,moving);
      v_digit=step(.5,fract(seed*.27+floor(u_time*.3+seed)*.618));
    }
  `,
  fragment:`
    precision mediump float;
    uniform mediump float u_glow;
    uniform mediump float u_fieldPass;
    varying mediump float v_alpha;
    varying mediump float v_digit;
    float segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.,1.));}
    void main(){
      vec2 p=(gl_PointCoord-.5)*2.;
      if(u_fieldPass>.5){
        if(dot(p,p)>.9||v_alpha<.008)discard;
        gl_FragColor=vec4(vec3(v_alpha),gl_FragCoord.z);return;
      }
      float zero=abs(length(p/vec2(.42,.67))-1.)*.42;
      float one=min(segment(p,vec2(-.25,-.39),vec2(.04,-.65)),min(segment(p,vec2(.04,-.65),vec2(.04,.65)),segment(p,vec2(-.25,.65),vec2(.31,.65))));
      float glyph=1.-smoothstep(.06,.15,mix(zero,one,v_digit));
      float halo=exp(-dot(p,p)*4.)*.018;
      float alpha=mix(glyph*.9,halo,u_glow)*v_alpha;
      if(alpha<.004)discard;
      gl_FragColor=vec4(vec3(.91,.95,1.),alpha);
    }
  `,
  asciiVertex:`
    attribute vec2 a_quad;
    void main(){gl_Position=vec4(a_quad,0.,1.);}
  `,
  asciiFragment:`
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    uniform sampler2D u_field;
    uniform vec2 u_resolution;
    uniform vec2 u_grid;
    uniform vec2 u_fieldSize;
    uniform float u_dpr;
    uniform float u_time;
    uniform float u_stream;
    float segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.,1.));}
    void main(){
      vec2 screen=gl_FragCoord.xy/u_dpr;
      vec2 cell=screen/u_resolution*u_grid;
      // A stable, small row offset breaks up vertical grid stripes without
      // moving the sampled geometry or making the digits jitter over time.
      float row=floor(cell.y);
      float stagger=(fract(sin(mod(row,97.)*1.37)*437.1)-.5)*.7;
      cell.x+=stagger;
      vec2 index=floor(cell);
      vec2 sampleCell=index+vec2(.5-stagger,.5);
      float light=texture2D(u_field,sampleCell/u_fieldSize).r;
      if(light<.012){gl_FragColor=vec4(0.,0.,0.,1.);return;}
      vec2 p=(fract(cell)-.5)*vec2(1.45,-1.9);
      float seed=fract(sin(dot(mod(index,vec2(32.)),vec2(.37,.61)))*37.17);
      float digit=step(.5,fract(seed+floor(u_time*.4+seed)*.618));
      float zero=abs(length(p/vec2(.4,.67))-1.)*.4;
      float one=min(segment(p,vec2(-.23,-.39),vec2(.035,-.65)),min(segment(p,vec2(.035,-.65),vec2(.035,.65)),segment(p,vec2(-.23,.65),vec2(.29,.65))));
      float glyph=1.-smoothstep(.05,.105,mix(zero,one,digit));
      // Lift midtones with a soft shoulder so facial and mechanical details
      // remain readable without turning bright regions into a flat white mask.
      float intensity=1.2*(1.-exp(-1.8*pow(clamp(light,0.,1.),.62)));
      // Each glyph fades out and back on its own clock; a slow screen-space
      // band makes whole strands dim together, so lines appear and disappear.
      float rate=.7+fract(seed*7.13)*1.6;
      float cellPulse=smoothstep(-.45,.55,sin(u_time*rate+seed*6.2831853));
      float band=smoothstep(-.6,.8,sin(index.x*.11-index.y*.07+u_time*.55)+.6*sin(index.y*.05+u_time*.31));
      float twinkle=(.70+.30*cellPulse)*(.80+.20*band)*1.1;
      // Open irregular gaps in the dense current while it travels. The slow
      // moving modulation avoids a hard, screen-fixed cutout and fades away
      // before the next silhouette settles.
      float current=sin(index.x*.055-u_time*1.05+sin(index.y*.14)*1.4);
      float gap=smoothstep(-.7,.45,current+(seed-.5)*1.2);
      // Thin individual cells as well as whole currents: a uniformly filled
      // grid reads as a flat rectangular strip even with changing brightness.
      // The threshold moves slowly and continuously, so particles fade rather
      // than pop, and the full field returns before the next scene settles.
      float drift=.12*sin(index.x*.027-index.y*.09-u_time*.7);
      float grain=smoothstep(.28,.67,seed+drift);
      intensity*=mix(1.,(.13+.87*gap)*(.10+.90*grain),u_stream*.9);
      gl_FragColor=vec4(vec3(.93,.97,1.)*glyph*intensity*twinkle,1.);
    }
  `
});
