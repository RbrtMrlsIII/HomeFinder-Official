/* HomeFinder Cinematic 3D Renderer
 * Phase A.2.4: lightweight native WebGL2 scene scaffold.
 *
 * Purpose: provide a real-time 3D composition layer without adding a large
 * dependency or requiring generated assets. It renders low-poly proxy geometry
 * for the declared world slots. Future GLB/KTX2 assets can replace the proxy
 * nodes through the existing cinematic-3d-adapter contract.
 */
(() => {
  const api = window.hfCinematic3D;
  if (!api || !api.supportsWebGL2()) return;

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const vertexShader = `#version 300 es
    in vec3 aPosition;
    in vec3 aNormal;
    uniform mat4 uMVP;
    uniform mat4 uModel;
    out vec3 vNormal;
    void main(){ gl_Position = uMVP * vec4(aPosition, 1.0); vNormal = mat3(uModel) * aNormal; }`;
  const fragmentShader = `#version 300 es
    precision mediump float;
    in vec3 vNormal;
    uniform vec4 uColor;
    out vec4 outColor;
    void main(){ vec3 n=normalize(vNormal); float light=.48+.52*max(dot(n,normalize(vec3(-.35,.8,.55))),0.0); outColor=vec4(uColor.rgb*light,uColor.a); }`;

  function mat4Identity(){ return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; }
  function mat4Multiply(a,b){ const o=new Array(16).fill(0); for(let c=0;c<4;c++) for(let r=0;r<4;r++) o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3]; return o; }
  function perspective(fovy,aspect,near,far){ const f=1/Math.tan(fovy/2),nf=1/(near-far); return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,(2*far*near)*nf,0]; }
  function translate(x,y,z){ const m=mat4Identity(); m[12]=x;m[13]=y;m[14]=z;return m; }
  function scale(x,y,z){ const m=mat4Identity();m[0]=x;m[5]=y;m[10]=z;return m; }
  function rotateY(a){ const c=Math.cos(a),s=Math.sin(a);return [c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]; }
  function rotateX(a){ const c=Math.cos(a),s=Math.sin(a);return [1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]; }
  function normalize(v){ const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l]; }
  function cross(a,b){ return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
  function dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  function lookAt(eye,target,up=[0,1,0]){ const z=normalize([eye[0]-target[0],eye[1]-target[1],eye[2]-target[2]]),x=normalize(cross(up,z)),y=cross(z,x); return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]; }

  const cube = new Float32Array([
    -1,-1,-1,0,0,-1, 1,-1,-1,0,0,-1, 1,1,-1,0,0,-1, -1,1,-1,0,0,-1,
    -1,-1,1,0,0,1, 1,-1,1,0,0,1, 1,1,1,0,0,1, -1,1,1,0,0,1,
    -1,-1,-1,-1,0,0, -1,1,-1,-1,0,0, -1,1,1,-1,0,0, -1,-1,1,-1,0,0,
    1,-1,-1,1,0,0, 1,1,-1,1,0,0, 1,1,1,1,0,0, 1,-1,1,1,0,0,
    -1,-1,-1,0,-1,0, -1,-1,1,0,-1,0, 1,-1,1,0,-1,0, 1,-1,-1,0,-1,0,
    -1,1,-1,0,1,0, -1,1,1,0,1,0, 1,1,1,0,1,0, 1,1,-1,0,1,0
  ]);
  const indices = new Uint16Array([0,1,2,0,2,3,4,6,5,4,7,6,8,9,10,8,10,11,12,14,13,12,15,14,16,17,18,16,18,19,20,22,21,20,23,22]);

  function compile(gl,type,source){ const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}return s; }
  function createProgram(gl){ const vs=compile(gl,gl.VERTEX_SHADER,vertexShader),fs=compile(gl,gl.FRAGMENT_SHADER,fragmentShader);if(!vs||!fs)return null;const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);return gl.getProgramParameter(p,gl.LINK_STATUS)?p:null; }

  function createRenderer(){
    let state=null;
    const renderer={
      mountWorld({world,tier,stage,slots,budget,targetId,target}){
        if(state?.stage===stage){ renderer.applyTarget(targetId,target); return; }
        if(state) renderer.unmountWorld(state);
        const canvas=document.createElement('canvas');canvas.className='hf-cinematic-3d-canvas';canvas.setAttribute('aria-hidden','true');stage.replaceChildren(canvas);
        const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:true}); if(!gl)return;
        const program=createProgram(gl);if(!program)return;
        const pos=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pos);gl.bufferData(gl.ARRAY_BUFFER,cube,gl.STATIC_DRAW);
        const idx=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,idx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
        const aPosition=gl.getAttribLocation(program,'aPosition'),aNormal=gl.getAttribLocation(program,'aNormal');
        const uMVP=gl.getUniformLocation(program,'uMVP'),uModel=gl.getUniformLocation(program,'uModel'),uColor=gl.getUniformLocation(program,'uColor');
        const tierFactor=tier==='high'?1:tier==='medium'?.72:.45;const nodes=[];const add=(slotId,x,y,z,sx,sy,sz,rot=0,alpha=.22)=>nodes.push({slotId,x,y,z,sx,sy,sz,rot,alpha});
        add('skyline',-4,1.1,-8,1.7,2.4,1,.0,.10);add('skyline',-1.8,1.0,-7.4,1.1,2,.9,0,.11);add('skyline',2,1,-7.8,1.3,2.2,.9,0,.10);add('skyline',4.3,1.1,-8.2,1.6,2.6,1,0,.09);add('residential-district',-2.8,.15,-4.8,1.8,1.2,1.4,0,.13);add('residential-district',1.8,.12,-5.2,1.7,1.1,1.3,0,.13);add('hero-residence',.55,-.15,-3.2,2.25,.72,1.45,-.08,.24);
        if(tier!=='low'){add('vegetation',-2.3,-.15,-2.5,.28,.9,.28,.2,.14);add('vegetation',2.9,-.15,-2.3,.28,1,.28,-.2,.14);add('architectural-props',3.5,-.1,-2.5,.5,.45,.5,.1,.11);}
        state={world,tier,stage,canvas,gl,program,pos,idx,aPosition,aNormal,uMVP,uModel,uColor,nodes,budget,tierFactor,visible:true,raf:0,start:performance.now(),pointerX:0,pointerY:0,houseCamera:window.__HF_HOUSE_CAMERA__||null,targetId,target};
        renderer.applyTarget(targetId,target);
        const onCameraUpdate=()=>{if(state)state.houseCamera=window.__HF_HOUSE_CAMERA__||null;};state.onCameraUpdate=onCameraUpdate;window.addEventListener('hf:house-camera-update',onCameraUpdate);
        const onPointer=e=>{if(state){state.pointerX=(e.clientX/innerWidth-.5)*.8;state.pointerY=(e.clientY/innerHeight-.5)*.45;}};state.onPointer=onPointer;window.addEventListener('pointermove',onPointer,{passive:true});
        const onVisibility=()=>{if(state)state.visible=document.visibilityState==='visible';};state.onVisibility=onVisibility;document.addEventListener('visibilitychange',onVisibility);
        const frame=now=>{if(!state||state.stage!==stage)return;if(!state.visible){state.raf=requestAnimationFrame(frame);return;}const rect=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,tier==='high'?1.25:1),cw=Math.max(1,Math.floor(rect.width*dpr)),ch=Math.max(1,Math.floor(rect.height*dpr));if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}gl.viewport(0,0,cw,ch);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,pos);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,idx);gl.enableVertexAttribArray(aPosition);gl.enableVertexAttribArray(aNormal);gl.vertexAttribPointer(aPosition,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(aNormal,3,gl.FLOAT,false,24,12);const cameraState=state.houseCamera,aspect=cw/ch,t=(now-state.start)/1000,orbit=Math.sin(t*Math.PI*2/22)*.10;const camera=cameraState?.position&&cameraState?.target?lookAt(cameraState.position,cameraState.target):mat4Multiply(rotateX(-.08+state.pointerY*.02),rotateY(orbit+state.pointerX*.035));const fov=(Number.isFinite(cameraState?.fov)?cameraState.fov:60)*Math.PI/180,proj=perspective(fov,aspect,.1,40),view=cameraState?.position&&cameraState?.target?camera:mat4Multiply(camera,translate(0,-.05,-7));for(const n of nodes){const model=mat4Multiply(translate(n.x,n.y,n.z),mat4Multiply(rotateY(n.rot+Math.sin(t*.12+n.x)*.008),scale(n.sx,n.sy,n.sz))),mvp=mat4Multiply(proj,mat4Multiply(view,model));gl.uniformMatrix4fv(uMVP,false,new Float32Array(mvp));gl.uniformMatrix4fv(uModel,false,new Float32Array(model));const env=document.documentElement.dataset.environment||'day',envTone={day:[.84,.77,.63,1],sunset:[.98,.63,.38,1],night:[.42,.56,.72,.88],rain:[.38,.54,.68,.92],mist:[.76,.78,.72,.94],storm:[.34,.39,.52,.88]}[env]||[.84,.77,.63,1],envLight=env==='night'?.76:env==='rain'?.86:env==='storm'?.72:env==='sunset'?1.08:env==='mist'?.94:1;gl.uniform4f(uColor,envTone[0]*envLight,envTone[1]*envLight,envTone[2]*envLight,n.alpha*state.tierFactor*envTone[3]);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);}state.raf=requestAnimationFrame(frame);};state.raf=requestAnimationFrame(frame);stage.classList.add('is-webgl-proxy');stage.dataset.renderer='native-webgl2';
      },
      applyTarget(targetId,target){ if(!state)return; state.targetId=targetId; state.target=target||null; const camera=target?.cameraThreeMeters; if(camera?.position&&camera?.target){state.houseCamera={position:camera.position,target:camera.target,fov:Number(camera.fov)};} stageAttrs(); },
      unmountWorld({stage}){if(!state)return;if(state.raf)cancelAnimationFrame(state.raf);window.removeEventListener('pointermove',state.onPointer);window.removeEventListener('hf:house-camera-update',state.onCameraUpdate);document.removeEventListener('visibilitychange',state.onVisibility);state.canvas?.remove();stage?.classList.remove('is-webgl-proxy');state=null;}
    };
    function stageAttrs(){ if(!state)return; const {stage,targetId,target}=state; stage.dataset.renderer='native-webgl2';stage.dataset.targetId=targetId||'';stage.dataset.modelScale=String(target?.modelScale??0.01);stage.dataset.coordinateConvention=target?.coordinateConvention||'source-cm-to-m-xzy';const camera=target?.cameraThreeMeters;if(camera?.position&&camera?.target){stage.dataset.cameraPosition=camera.position.join(',');stage.dataset.cameraTarget=camera.target.join(',');stage.dataset.cameraFov=String(camera.fov);} }
    return renderer;
  }

  try { api.registerRenderer(createRenderer()); } catch (_) { /* Poster/depth fallback remains active. */ }
})();
