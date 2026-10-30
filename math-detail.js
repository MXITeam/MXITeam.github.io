"use strict";

// Continuous silver contours complement the binary material in all five acts.
// This is a reference-derived relief, not a reconstructed closed 3D model.
window.MXIMathDetail = (() => {
  const vertex = `
    precision highp float;
    attribute vec3 a_position;
    attribute vec2 a_uv;
    uniform vec2 u_resolution;
    uniform vec2 u_view;
    uniform vec3 u_camera;
    uniform float u_size;
    varying mediump vec2 v_uv;
    void main() {
      vec3 p=a_position;
      p=vec3(cos(u_view.x)*p.x+sin(u_view.x)*p.z,p.y,-sin(u_view.x)*p.x+cos(u_view.x)*p.z);
      p=vec3(p.x,cos(u_view.y)*p.y-sin(u_view.y)*p.z,sin(u_view.y)*p.y+cos(u_view.y)*p.z);
      float perspective=1./max(.42,1.-p.z*.38);
      vec2 screen=(p.xy-u_camera.xy)*u_size*u_camera.z*perspective;
      gl_Position=vec4(screen/(u_resolution*.5),clamp(-p.z*.2,-.9,.9),1.);
      v_uv=a_uv;
    }
  `;
  const fragment = `
    precision mediump float;
    uniform sampler2D u_source;
    uniform vec2 u_texel;
    uniform float u_opacity;
    uniform float u_time;
    uniform float u_neural;
    uniform float u_robot;
    varying mediump vec2 v_uv;
    void main() {
      float light=texture2D(u_source,v_uv).r;
      if(light<.025)discard;
      float x=(texture2D(u_source,v_uv+vec2(u_texel.x,0.)).r+texture2D(u_source,v_uv-vec2(u_texel.x,0.)).r)*.5;
      float y=(texture2D(u_source,v_uv+vec2(0.,u_texel.y)).r+texture2D(u_source,v_uv-vec2(0.,u_texel.y)).r)*.5;
      // Preserve thin bright ridges without laying a grey picture over the scene.
      float ridge=max(0.,light-min(x,y));
      float breath=.035+.43*smoothstep(-.35,.9,sin(u_time*.9+v_uv.y*6.+v_uv.x*3.));
      float body=(pow(light,1.15)*.30+pow(ridge,.65)*.78)*breath;
      // Preserve the actual fine neuronal branches at display resolution. This
      // regional ridge pass is clearer than increasing brightness of all 0/1.
      float neuralPulse=.12+.48*smoothstep(-.5,.85,sin(u_time*.85+v_uv.y*7.-v_uv.x*4.));
      float nerves=(smoothstep(.12,.65,light)*.32+pow(ridge,.60)*.95)*neuralPulse;
      float region=u_neural*smoothstep(.44,.62,v_uv.x);
      float alpha=mix(body,nerves,region)*u_opacity;
      // Face and shell features are much finer than the shortened particle
      // field. Reinforce only source-image ridges in that area; no solid image
      // fill is added and the existing edge envelope still controls the crop.
      float face=u_robot*smoothstep(.36,.50,v_uv.x)*(1.-smoothstep(.86,.98,v_uv.x))
        *smoothstep(.10,.20,v_uv.y)*(1.-smoothstep(.62,.72,v_uv.y));
      float faceRidge=(pow(ridge,.7)*.55+smoothstep(.05,.2,ridge)*.10)
        *(.18+.17*smoothstep(-.4,.8,sin(u_time*.65+v_uv.y*4.)));
      alpha+=face*faceRidge*u_opacity;
      gl_FragColor=vec4(.94,.97,1.,alpha);
    }
  `;

  function create(gl, surface) {
    if(!surface?.pixels)return null;
    function compile(type,source){
      const shader=gl.createShader(type);
      if(!shader)return null;
      gl.shaderSource(shader,source);gl.compileShader(shader);
      if(gl.getShaderParameter(shader,gl.COMPILE_STATUS))return shader;
      console.warn("MXI Mathematics contours:",gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);return null;
    }
    const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
    if(!vs||!fs){if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);return null;}
    const program=gl.createProgram();
    if(!program){gl.deleteShader(vs);gl.deleteShader(fs);return null;}
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);return null;}
    const buffer=gl.createBuffer(),texture=gl.createTexture();
    if(!buffer||!texture){if(buffer)gl.deleteBuffer(buffer);if(texture)gl.deleteTexture(texture);gl.deleteProgram(program);return null;}
    const {width,height,pixels,cx,cy,scale}=surface;
    const luminance=new Uint8Array(width*height);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=(y*width+x)*4;
      const light=(pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722)/255;
      const edge=window.MXIStoryReference.edgeOpacity(surface.act,x/(width-1),y/(height-1));
      luminance[y*width+x]=Math.round(light*edge*255);
    }
    function point(x,y){
      const px=(x-cx)*scale,py=(cy-y)*scale;
      const light=luminance[Math.min(height-1,Math.floor(y))*width+Math.min(width-1,Math.floor(x))]/255;
      if(window.MXIStoryReference?.position)return [...window.MXIStoryReference.position(surface.act||0,px,py,light),x/(width-1),y/(height-1)];
      const depth=.22*Math.sin(Math.atan2(py+.18,px+.13))+.09*Math.sin(px*8)+(light-.4)*.08;
      const viewX=px*(1-depth*.38),viewY=py*(1-depth*.38);
      const yaw=-.34,pitch=.12;
      const ry=Math.cos(pitch)*viewY+Math.sin(pitch)*depth;
      const rz=-Math.sin(pitch)*viewY+Math.cos(pitch)*depth;
      return [Math.cos(yaw)*viewX-Math.sin(yaw)*rz,ry,Math.sin(yaw)*viewX+Math.cos(yaw)*rz,x/(width-1),y/(height-1)];
    }
    const vertices=[];
    for(let y=0;y<height-1;y+=5)for(let x=0;x<width-1;x+=5){
      const x1=Math.min(width-1,x+5),y1=Math.min(height-1,y+5);
      const a=point(x,y),b=point(x1,y),c=point(x,y1),d=point(x1,y1);
      vertices.push(...a,...b,...c,...c,...b,...d);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,width,height,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,luminance);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);
    const attributes=[gl.getAttribLocation(program,"a_position"),gl.getAttribLocation(program,"a_uv")];
    const uniforms=Object.fromEntries(["resolution","view","camera","size","source","texel","opacity","time","neural","robot"].map(name=>[name,gl.getUniformLocation(program,"u_"+name)]));
    return Object.freeze({draw({width,height,view,camera,size,opacity,time=0}){
      if(opacity<.002)return;
      gl.useProgram(program);gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      attributes.forEach(attribute=>gl.enableVertexAttribArray(attribute));
      gl.vertexAttribPointer(attributes[0],3,gl.FLOAT,false,20,0);gl.vertexAttribPointer(attributes[1],2,gl.FLOAT,false,20,12);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.uniform1i(uniforms.source,0);gl.uniform2f(uniforms.resolution,width,height);
      gl.uniform2f(uniforms.view,...view);gl.uniform3f(uniforms.camera,...camera);gl.uniform1f(uniforms.size,size);
      gl.uniform2f(uniforms.texel,1/surface.width,1/surface.height);gl.uniform1f(uniforms.opacity,opacity);
      gl.uniform1f(uniforms.time,time);
      gl.uniform1f(uniforms.neural,surface.act===3?1:0);
      gl.uniform1f(uniforms.robot,surface.act===2?1:0);
      gl.drawArrays(gl.TRIANGLES,0,vertices.length/5);
      gl.disable(gl.BLEND);
    }});
  }
  return Object.freeze({create});
})();
