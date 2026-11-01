/* SCOREBOARD R122 — round-only refresh + editable multi-distance time + selector legend */
(function(){
  function multi(){try{return ensureMultiSetup?.();}catch(_){return null;}}
  function bindTimer(){
    if(typeof currentView!=='undefined'&&currentView!=='setup')return;
    if(S.setup?.practiceType!=='target'||S.setup?.distanceMode!=='multiple')return;
    const m=multi(),input=document.getElementById('multiTime');if(!m||!input)return;
    if(typeof m.timerEnabled!=='boolean')m.timerEnabled=!!S.setup.timer;
    const field=input.closest('.setup-field'),label=field?.querySelector('label');if(!label)return;
    let cb=label.querySelector('.r118-timer-check');
    if(!cb){cb=document.createElement('input');cb.type='checkbox';cb.className='r118-timer-check';cb.setAttribute('aria-label','Enable timer');label.appendChild(cb);}
    cb.checked=!!m.timerEnabled;
    input.style.setProperty('pointer-events','auto','important');input.removeAttribute('readonly');input.removeAttribute('disabled');
    cb.onclick=e=>e.stopPropagation();
    cb.onchange=e=>{e.stopPropagation();m.timerEnabled=!!cb.checked;if(m.timerEnabled){m.timeEnd=Math.max(1,Number(input.value)||120);if(Number(input.value)<=0)input.value=String(m.timeEnd);}else{m.timeEnd=0;input.value='0';}S.setup.timer=m.timerEnabled;try{saveState?.();}catch(_){}};
    const commitManual=()=>{let v=Math.max(0,Number(input.value)||0);input.value=String(v);m.timerEnabled=v>0;m.timeEnd=v;S.setup.timer=m.timerEnabled;cb.checked=m.timerEnabled;try{saveState?.();}catch(_){}};
    input.onchange=commitManual;input.onblur=commitManual;
  }
  function refreshRoundOnly(){
    const root=document.querySelector('.setup-page');if(!root||typeof formatFieldsHTML!=='function')return;
    const currentList=root.querySelector('.multi-round-list'),currentPreview=root.querySelector('.multi-preview');if(!currentList&&!currentPreview)return;
    const holder=document.createElement('div');holder.innerHTML=formatFieldsHTML();
    const freshList=holder.querySelector('.multi-round-list'),freshPreview=holder.querySelector('.multi-preview');
    if(currentList&&freshList)currentList.replaceWith(freshList);if(currentPreview&&freshPreview)currentPreview.replaceWith(freshPreview);
  }
  function stepRound(input,dir){
    const step=Number(input.step)||1,min=input.min!==''?Number(input.min):1,max=input.max!==''?Number(input.max):99,old=Number(input.value)||1,next=Math.max(min,Math.min(max,old+dir*step));if(next===old)return;
    input.value=String(next);S.setup.rounds=next;const m=multi();if(m){while(m.orders.length<next)m.orders.push(m.orders.length%2===0?'asc':'desc');if(m.orders.length>next)m.orders.length=next;}refreshRoundOnly();bindTimer();
  }
  function bindRound(){
    if(typeof currentView!=='undefined'&&currentView!=='setup')return;if(S.setup?.practiceType!=='target'||S.setup?.distanceMode!=='multiple')return;
    const input=document.getElementById('rounds'),box=input?.closest('.r82-stepper-box');if(!input||!box)return;const b=box.querySelectorAll('.r82-step-controls button');if(b.length<2)return;
    b[0].onclick=e=>{e.preventDefault();e.stopPropagation();stepRound(input,1);};b[1].onclick=e=>{e.preventDefault();e.stopPropagation();stepRound(input,-1);};
    input.onchange=()=>{const n=Math.max(Number(input.min)||1,Math.min(Number(input.max)||99,Number(input.value)||1));input.value=String(n);S.setup.rounds=n;const m=multi();if(m){while(m.orders.length<n)m.orders.push(m.orders.length%2===0?'asc':'desc');if(m.orders.length>n)m.orders.length=n;}refreshRoundOnly();bindTimer();};
  }
  function stabilize(){bindTimer();bindRound();}
  document.addEventListener('click',()=>setTimeout(stabilize,0),true);document.addEventListener('change',()=>setTimeout(stabilize,0),true);new MutationObserver(()=>requestAnimationFrame(stabilize)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});setTimeout(stabilize,80);
  const s=document.createElement('style');s.textContent=`
    .setup-page #multiTime{pointer-events:auto!important;user-select:text!important;-webkit-user-select:text!important}
    .setup-page .r118-timer-check{appearance:none!important;-webkit-appearance:none!important;width:20px!important;height:20px!important;min-width:20px!important;max-width:20px!important;min-height:20px!important;max-height:20px!important;box-sizing:border-box!important;margin:0 0 0 8px!important;padding:0!important;border:1.5px solid #777!important;border-radius:3px!important;background:#fff!important;position:static!important;vertical-align:-3px!important;cursor:pointer!important}
    .setup-page .r118-timer-check:checked{background:#0b6faf!important;border-color:#0b6faf!important}.setup-page .r118-timer-check:checked:after{content:'✓';display:block!important;color:#fff!important;font-size:15px!important;line-height:17px!important;text-align:center!important;font-weight:900!important}
    #manageRoundsDialog .round-select-grid,#manageRoundsDialog .round-buttons{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;width:100%!important;gap:8px!important;box-sizing:border-box!important}
    #manageRoundsDialog .round-select-btn{width:100%!important;min-width:0!important;height:50px!important;min-height:50px!important;padding:6px 8px!important;font-size:.96rem!important;line-height:1!important;white-space:nowrap!important;box-sizing:border-box!important}
    .setup-page .r82-step-controls button{transform:none!important;transition:none!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
    /* Current selector legend: white circle with black outline, matching active selector buttons. */
    #manageRoundsDialog .r77-blue-dot,#manageEndsDialog .r77-blue-dot,.r114-distance-modal .r77-blue-dot,.r114-legend .r77-blue-dot,.r77-legend .r77-blue-dot{background:#fff!important;border:2px solid #111!important;box-sizing:border-box!important}
  `;document.head.appendChild(s);
})();