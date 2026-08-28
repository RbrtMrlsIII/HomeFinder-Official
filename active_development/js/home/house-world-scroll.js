/* A.4.1 House World: scroll controls the Home camera composition. */
(function(){
  'use strict';
  const world=document.getElementById('house-world');
  const zones=[...document.querySelectorAll('.house-camera-zone[data-house-zone]')];
  if(!world||!zones.length)return;
  const label=document.getElementById('house-world-location');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=window.matchMedia('(max-width: 700px)');
  let raf=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const ease=t=>t*t*(3-2*t);
  function num(el,key){const n=parseFloat(el.dataset[key]);return Number.isFinite(n)?n:0;}
  function update(){
    raf=0;
    if(reduced.matches){
      world.style.setProperty('--cam-x','0px');world.style.setProperty('--cam-y','0px');world.style.setProperty('--cam-z','0px');world.style.setProperty('--world-progress','0');
      zones.forEach(z=>z.toggleAttribute('data-camera-active',z===zones[0]));
      if(label)label.textContent=zones[0].dataset.houseLabel||'Main Hall · Hero';
      return;
    }
    const vh=innerHeight||1, focusY=vh*.46;
    let current=0, next=0, best=Infinity;
    zones.forEach((z,i)=>{const r=z.getBoundingClientRect();const center=r.top+r.height*.36;const d=Math.abs(center-focusY);if(d<best){best=d;current=i;}});
    next=current<zones.length-1?current+1:current;
    const a=zones[current], b=zones[next];
    const ar=a.getBoundingClientRect(), br=b.getBoundingClientRect();
    let t=0;
    if(next!==current){const denom=Math.max((br.top-ar.top),1);t=clamp((focusY-(ar.top+ar.height*.36))/denom,0,1);}
    t=ease(t);
    const mx=mobile.matches?.55:1;
    const x=(num(a,'cameraX')+(num(b,'cameraX')-num(a,'cameraX'))*t)*mx;
    const y=(num(a,'cameraY')+(num(b,'cameraY')-num(a,'cameraY'))*t)*mx;
    const z=(num(a,'cameraZ')+(num(b,'cameraZ')-num(a,'cameraZ'))*t)*mx;
    const progress=clamp((window.scrollY||0)/(Math.max(document.documentElement.scrollHeight-vh,1)),0,1);
    world.style.setProperty('--cam-x',x.toFixed(2)+'px');world.style.setProperty('--cam-y',y.toFixed(2)+'px');world.style.setProperty('--cam-z',z.toFixed(2)+'px');world.style.setProperty('--world-progress',progress.toFixed(4));

    // Bridge the Home scroll choreography into the shared architectural camera rig.
    // CSS camera variables remain the visual fallback; the rig state feeds the renderer.
    const rig=window.hfHouseCamera;
    const aa=rig?.getAnchor?.(a.dataset.cameraAnchor);
    const bb=rig?.getAnchor?.(b.dataset.cameraAnchor);
    if(aa){
      const lerp3=(u,v)=>u.map((n,i)=>n+((v?.[i]??n)-n)*t);
      const target=bb ? lerp3(aa.target,bb.target) : aa.target.slice();
      const position=bb ? lerp3(aa.position,bb.position) : aa.position.slice();
      const fov=aa.fov+((bb?.fov??aa.fov)-aa.fov)*t;
      rig.setState?.({anchor:a.dataset.cameraAnchor,position,target,fov,progress});
    }
    zones.forEach((zone,i)=>zone.toggleAttribute('data-camera-active',i===current));
    if(label)label.textContent=a.dataset.houseLabel||'Main Hall';
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(update);}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  reduced.addEventListener?.('change',schedule);mobile.addEventListener?.('change',schedule);
  addEventListener('hf:house-camera-rig-ready',schedule);
  schedule();
})();
