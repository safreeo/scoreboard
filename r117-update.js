/* SCOREBOARD R117 — live multi-round sequence + unified active selector styling */
(function(){
  /* R116 intentionally stopped dispatching change for setup steppers. For Rounds in
     Multiple Distances we do need a rerender so ROUND SEQUENCE/PREVIEW immediately
     grows or shrinks. Keep all other steppers in-place. */
  function bindMultiRoundStepper(){
    if(typeof currentView!=='undefined'&&currentView!=='setup')return;
    if(S.setup?.practiceType!=='target'||S.setup?.distanceMode!=='multiple')return;
    const input=document.getElementById('rounds');if(!input)return;
    const box=input.closest('.r82-stepper-box');if(!box)return;
    const buttons=box.querySelectorAll('.r82-step-controls button');if(buttons.length<2)return;
    const step=dir=>{
      const inc=Number(input.step)||1,min=input.min!==''?Number(input.min):1,max=input.max!==''?Number(input.max):Infinity;
      const next=Math.max(min,Math.min(max,(Number(input.value)||1)+(dir*inc)));
      input.value=String(next);S.setup.rounds=next;
      const m=ensureMultiSetup?.();if(m){while(m.orders.length<next)m.orders.push(m.orders.length%2===0?'asc':'desc');if(m.orders.length>next)m.orders.length=next;}
      try{syncSetup?.();}catch(_){}
      preserveNextScrollY=window.scrollY;setup?.();
    };
    buttons[0].onclick=e=>{e.preventDefault();e.stopPropagation();step(1);};
    buttons[1].onclick=e=>{e.preventDefault();e.stopPropagation();step(-1);};
  }

  /* Active selection convention from R117 onward:
     completed = green; selected/current = white + black outline. */
  function markDistanceSelection(){
    const modal=document.getElementById('manageDistancesDialog');if(!modal)return;
    modal.querySelectorAll('[data-r114-distance]').forEach(b=>{
      const selected=b.classList.contains('active');b.classList.toggle('r117-selected',selected);
    });
  }
  function stabilize(){bindMultiRoundStepper();markDistanceSelection();}
  document.addEventListener('click',()=>setTimeout(stabilize,0),true);
  document.addEventListener('change',()=>setTimeout(stabilize,0),true);
  new MutationObserver(()=>requestAnimationFrame(stabilize)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(stabilize,80);

  const s=document.createElement('style');s.textContent=`
    /* Round selector slightly larger for easier phone use. */
    #manageRoundsDialog .round-select-btn{min-height:64px!important;padding:12px 14px!important;font-size:1.08rem!important}

    /* Current/selected state: white with black outline, no blue fill. */
    #manageRoundsDialog .round-select-btn.active,
    #manageRoundsDialog .round-select-btn.r116-selected,
    #manageEndsDialog .cp-select-btn.active,
    .r114-distance-modal .r110-distance-btn.active,
    .r114-distance-modal .r110-distance-btn.r117-selected{
      background:#fff!important;color:#0a2138!important;border:2px solid #111!important;
      outline:2px solid #111!important;outline-offset:1px!important;box-shadow:none!important
    }
    /* Completed remains green unless it is the actively selected item. */
    #manageRoundsDialog .round-select-btn.complete:not(.active):not(.r116-selected),
    #manageEndsDialog .cp-select-btn.complete:not(.active),
    .r114-distance-modal .r110-distance-btn.complete:not(.active):not(.r117-selected){
      background:#169b69!important;color:#fff!important;border-color:#169b69!important;outline:none!important
    }

    /* Legend current bullet follows the same convention: white circle + black outline. */
    .r114-legend .r77-blue-dot,.r77-legend .r77-blue-dot{
      background:#fff!important;border:2px solid #111!important;width:12px!important;height:12px!important;
      min-width:12px!important;min-height:12px!important;box-sizing:border-box!important
    }
  `;document.head.appendChild(s);
})();