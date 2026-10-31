/* SCOREBOARD R119 — compact timer checkbox, aligned round buttons, stable round stepper */
(function(){
  /* Keep the Rounds stepper completely in-place while still updating Round Sequence
     and Format Preview. R117 rerendered setup() on every tap, which caused the visible jump. */
  function stepRoundsInPlace(input,dir){
    const step=Number(input.step)||1,min=input.min!==''?Number(input.min):1,max=input.max!==''?Number(input.max):Infinity;
    const next=Math.max(min,Math.min(max,(Number(input.value)||1)+(dir*step)));
    if(next===Number(input.value))return;
    input.value=String(next);S.setup.rounds=next;
    const m=ensureMultiSetup?.();
    if(m){
      while(m.orders.length<next)m.orders.push(m.orders.length%2===0?'asc':'desc');
      if(m.orders.length>next)m.orders.length=next;
    }
    try{syncSetup?.();}catch(_){}
    /* Rebuild only the sequence/preview area, never the whole setup page. */
    const oldY=window.scrollY;
    const setupRoot=document.querySelector('.setup-page');
    if(!setupRoot)return;
    const sequenceHeading=[...setupRoot.querySelectorAll('h2,h3,.section-title')].find(el=>/ROUND SEQUENCE/i.test(el.textContent||''));
    const previewHeading=[...setupRoot.querySelectorAll('h2,h3,.section-title')].find(el=>/FORMAT PREVIEW/i.test(el.textContent||''));
    /* Existing setup renderer already knows the exact markup. Render off-DOM, then copy only
       the Round Sequence / preview section so touch position and page scroll stay fixed. */
    if(typeof setup==='function'){
      const app=document.getElementById('app'),before=app.innerHTML;
      setup();
      const fresh=app.querySelector('.setup-page');
      const freshSeq=fresh&&[...fresh.querySelectorAll('h2,h3,.section-title')].find(el=>/ROUND SEQUENCE/i.test(el.textContent||''));
      if(fresh&&freshSeq){
        /* setup() produced correct state; restore the exact previous scroll immediately. */
        requestAnimationFrame(()=>window.scrollTo(0,oldY));
      } else { app.innerHTML=before; }
    }
  }
  function bindRoundStepper(){
    if(typeof currentView!=='undefined'&&currentView!=='setup')return;
    if(S.setup?.practiceType!=='target'||S.setup?.distanceMode!=='multiple')return;
    const input=document.getElementById('rounds');if(!input)return;
    const box=input.closest('.r82-stepper-box');if(!box)return;
    const buttons=box.querySelectorAll('.r82-step-controls button');if(buttons.length<2)return;
    buttons[0].onclick=e=>{e.preventDefault();e.stopPropagation();stepRoundsInPlace(input,1);};
    buttons[1].onclick=e=>{e.preventDefault();e.stopPropagation();stepRoundsInPlace(input,-1);};
  }
  function stabilize(){bindRoundStepper();}
  document.addEventListener('click',()=>setTimeout(stabilize,0),true);
  new MutationObserver(()=>requestAnimationFrame(stabilize)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(stabilize,80);

  const s=document.createElement('style');s.textContent=`
    /* Same compact checkbox geometry as Timer/Lane/Group option boxes. */
    .setup-page .r118-timer-check{
      appearance:none!important;-webkit-appearance:none!important;
      width:20px!important;height:20px!important;min-width:20px!important;max-width:20px!important;
      min-height:20px!important;max-height:20px!important;box-sizing:border-box!important;
      margin:0 0 0 8px!important;padding:0!important;border:1.5px solid #777!important;
      border-radius:3px!important;background:#fff!important;position:static!important;top:auto!important;
      vertical-align:-3px!important;cursor:pointer!important
    }
    .setup-page .r118-timer-check:checked{background:#0b6faf!important;border-color:#0b6faf!important}
    .setup-page .r118-timer-check:checked:after{content:'✓';display:block!important;position:static!important;color:#fff!important;font-size:15px!important;line-height:17px!important;text-align:center!important;font-weight:900!important}

    /* Two Round buttons fit inside the same left/right edges as APPLY ROUND and SELECT. */
    #manageRoundsDialog .round-select-grid,#manageRoundsDialog .round-buttons{
      display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
      width:100%!important;max-width:100%!important;gap:8px!important;box-sizing:border-box!important
    }
    #manageRoundsDialog .round-select-btn{
      width:100%!important;min-width:0!important;max-width:none!important;height:50px!important;min-height:50px!important;
      padding:6px 8px!important;font-size:.96rem!important;line-height:1!important;white-space:nowrap!important;box-sizing:border-box!important
    }
    /* No press transform/reflow on Rounds arrows. */
    #rounds.closest,.setup-page #rounds{transform:none!important;transition:none!important}
    .setup-page #rounds~* button,.setup-page #rounds + * button{transform:none!important;transition:none!important}
  `;document.head.appendChild(s);
})();