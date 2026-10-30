"use strict";

// One layering contract for each reference: clear contours, open field, live 0/1.
window.MXIStoryLayers = Object.freeze({
  create(gl,reference){
    const scenes=Array.from({length:5},(_,act)=>{
      const surface=reference.surface(act);
      return {detail:window.MXIMathDetail?.create(gl,surface),field:window.MXIMathField?.create(gl,surface),flow:window.MXIMathFlow?.create(surface)};
    });
    function each(state,callback){
      for(const [act,weight] of [[state.from,1-state.mix],[state.to,state.mix]]){
        if(act<1||act>5||weight<.002)continue;
        callback(scenes[act-1],weight);
      }
    }
    return Object.freeze({
      drawGL(options){each(options.state,(scene,weight)=>{
        // Incoming contours wait until the binary morph has finished. On direct
        // navigation the same quiet opening lets particles establish the subject.
        const elapsed=options.state.local;
        const entrance=Math.max(0,Math.min(1,(elapsed-.8)/1.8));
        const reveal=entrance*entrance*(3-2*entrance);
        if(scene!==scenes[options.state.from-1])return;
        const withdraw=Math.max(0,1-options.state.progress/.22);
        const draw={...options,opacity:weight**3*reveal*withdraw*withdraw};
        scene.detail?.draw(draw);scene.field?.draw({...draw,opacity:draw.opacity*.65});
      });},
      drawFlow(options){each(options.state,(scene,weight)=>{
        if(scene!==scenes[options.state.from-1])return;
        const entrance=Math.min(1,options.state.local/.8);
        const withdraw=Math.max(0,1-options.state.progress/.20);
        weight*=entrance*withdraw*withdraw;
        scene.field?.drawFlow({...options,weight});scene.flow?.draw({...options,weight});
      });}
    });
  }
});
