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
    varying mediump float v_alpha;
    varying mediump float v_digit;
    vec3 chain(float act,float u){
      if(act<.5||act>5.5)return vec3((u-.5)*7.,sin(u*8.+u_time*.35)*.025,sin(u*6.)*.08);
      if(act>4.5){float a=u*6.2831853*1.22-1.1,r=.4+pow(abs(u-.5)*2.,4.)*.68;vec2 p=vec2(cos(a)*r,sin(a)*r*.42);return vec3(p.x*cos(-.5)-p.y*sin(-.5),p.x*sin(-.5)+p.y*cos(-.5),sin(a)*.12);}
      vec3 a,b,c,d,e;
      if(act<1.5){a=vec3(-.9,-.62,0.);b=vec3(-.57,-.12,.12);c=vec3(-.08,.12,0.);d=vec3(.48,.52,-.08);e=vec3(.8,.76,0.);}
      else if(act<2.5){a=vec3(-.65,-.87,0.);b=vec3(-.38,-.35,.08);c=vec3(-.54,.36,0.);d=vec3(.18,.48,-.08);e=vec3(.57,-.07,.04);}
      else if(act<3.5){a=vec3(-.6,-.88,0.);b=vec3(-.56,-.28,.1);c=vec3(-.57,.25,.06);d=vec3(-.36,.58,0.);e=vec3(.26,.35,-.08);}
      else{a=vec3(-.81,.04,0.);b=vec3(-.47,.45,.1);c=vec3(.11,.32,-.08);d=vec3(.59,-.14,.08);e=vec3(.18,-.75,0.);}
      float v=1.-u;return a*v*v*v*v+b*4.*v*v*v*u+c*6.*v*v*u*u+d*4.*v*u*u*u+e*u*u*u*u;
    }
    vec3 breathe(vec3 p,float act,float seed) {
      float amplitude=act>5.5||act<.5?0.:act<1.5?0.004:0.001;
      p.xy+=vec2(sin(seed+u_time*.7+p.y*5.),cos(seed*1.3+u_time*.55+p.x*4.))*amplitude;
      if(act>3.5&&act<4.5) p.z+=sin(u_time*.8+p.y*10.+seed)*.012;
      if(act>4.5&&act<5.5) {
        float a=sin(u_time*.18)*.015;
        p.xy=mat2(cos(a),-sin(a),sin(a),cos(a))*p.xy;
      }
      return p;
    }
    void main(){
      float seed=a_traits.y;
      vec3 from=breathe(a_from.xyz,u_acts.x,seed);
      vec3 to=breathe(a_to.xyz,u_acts.y,seed);
      // A traveling front peels neighboring material onto a persistent cable.
      // The cable delivers those digits into the next body, without an explosion.
      float travel=clamp((u_progress-a_traits.w*.78)/.22,0.,1.);
      float k=travel*travel*travel*(travel*(travel*6.-15.)+10.);
      float stream=sin(k*3.14159265);
      vec3 c1=chain(u_acts.x,a_traits.w),c2=chain(u_acts.y,a_traits.w);
      float v=1.-k;
      vec3 p=from*v*v*v+c1*3.*v*v*k+c2*3.*v*k*k+to*k*k*k;
      p=vec3(cos(u_view.x)*p.x+sin(u_view.x)*p.z,p.y,-sin(u_view.x)*p.x+cos(u_view.x)*p.z);
      p=vec3(p.x,cos(u_view.y)*p.y-sin(u_view.y)*p.z,sin(u_view.y)*p.y+cos(u_view.y)*p.z);
      float perspective=1./(1.-p.z*.38);
      vec2 screen=(p.xy-u_camera.xy)*u_size*u_camera.z*perspective;
      vec2 delta=screen-u_pointer.xy;
      float distance=length(delta);
      float influence=(1.-smoothstep(0.,110.,distance))*u_pointer.z;
      screen+=delta/max(distance,1.)*influence*7.;
      gl_Position=vec4(screen/(u_resolution*.5),0.,1.);
      float endWeight=(u_acts.x>5.5?1.-u_mix:0.)+(u_acts.y>5.5?u_mix:0.);
      float glyphSize=mix(a_traits.x,7.+fract(seed*.37)*1.5,endWeight);
      glyphSize=mix(glyphSize,mix(3.5,8.,step(.86,fract(seed*6.1))),stream);
      gl_PointSize=clamp(glyphSize*u_dpr*perspective*mix(1.,1.8,u_glow),1.,32.);
      float flicker=.88+.12*sin(u_time*1.2+seed*8.);
      float sourceBrain=step(3.5,u_acts.x)*(1.-step(4.5,u_acts.x));
      float targetBrain=step(3.5,u_acts.y)*(1.-step(4.5,u_acts.y));
      float synapse=mix(sourceBrain,targetBrain,k);
      flicker+=pow(max(0.,sin(u_time*2.+seed*3.)),18.)*synapse*.35;
      float depthLight=mix(.19,1.0,smoothstep(-.6,.45,p.z));
      float bodyAlpha=clamp(mix(a_from.w,a_to.w,k)*flicker*a_traits.z*depthLight*2.15,0.,1.);
      float streamAlpha=mix(.045,.7,step(.86,fract(seed*6.1)));
      v_alpha=mix(bodyAlpha,streamAlpha,stream);
      v_digit=step(.5,fract(seed*.27+floor(u_time*.3+seed)*.618));
    }
  `,
  fragment:`
    precision mediump float;
    uniform mediump float u_glow;
    varying mediump float v_alpha;
    varying mediump float v_digit;
    float segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.,1.));}
    void main(){
      vec2 p=(gl_PointCoord-.5)*2.;
      float zero=abs(length(p/vec2(.42,.67))-1.)*.42;
      float one=min(segment(p,vec2(-.25,-.39),vec2(.04,-.65)),min(segment(p,vec2(.04,-.65),vec2(.04,.65)),segment(p,vec2(-.25,.65),vec2(.31,.65))));
      float glyph=1.-smoothstep(.06,.15,mix(zero,one,v_digit));
      float halo=exp(-dot(p,p)*4.)*.018;
      float alpha=mix(glyph*.9,halo,u_glow)*v_alpha;
      if(alpha<.004)discard;
      gl_FragColor=vec4(vec3(.91,.95,1.),alpha);
    }
  `
});
