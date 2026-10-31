/* SCOREBOARD R116 — compact selectors, accurate round status, staged CP, stable setup steppers */
(function(){
  const resetEdit=()=>{try{editMode=false;editEnd=null;editDirty=false;selectedScoreCell=null;}catch(_){}};
  function cpNo(btn){return Number(btn?.dataset?.r116Cp||btn?.dataset?.r114Cp||(btn?.textContent||'').match(/\d+/)?.[0])||1;}
  window.r113SelectCP=function(n){window.r114ChooseCP?.(n);};
  function fixCP(){const modal=document.getElementById('manageEndsDialog');if(!modal||S.setup.practiceType==='target')return;modal.querySelectorAll('.cp-select-btn').forEach(b=>{b.dataset.r116Cp=cpNo(b);b.removeAttribute('onclick');});const select=modal.querySelector('[data-r114-cp-select]');if(select){select.removeAttribute('onclick');select.onclick=e=>{e.preventDefault();e.stopPropagation();window.r114ConfirmCP?.();};}}
  function roundComplete(round){const archers=S.session?.archers||[],ends=Math.max(1,Number(S.setup.ends)||1);if(!archers.length)return false;return archers.every(a=>{for(let e=1;e<=ends;e++)if(!endLocked(a,round,e))return false;return true;});}
  function fixRounds(){const modal=document.getElementById('manageRoundsDialog');if(!modal)return;[...modal.querySelectorAll('.round-select-btn')].forEach((b,i)=>{const n=i+1,complete=roundComplete(n),selected=typeof r76PendingRound!=='undefined'&&Number(r76PendingRound)===n;b.classList.toggle('complete',complete);b.classList.toggle('active',selected);b.classList.toggle('r116-selected',selected);});}
  if(typeof window.r76ChooseRound==='function'){const choose=window.r76ChooseRound;window.r76ChooseRound=function(n){choose(n);fixRounds();};}
  if(typeof window.manageRounds==='function'){const manage=window.manageRounds;window.manageRounds=function(){const v=manage.apply(this,arguments);setTimeout(fixRounds,0);return v;};}
  function stepInPlace(input,dir){const step=Number(input.step)||1,min=input.min!==''?Number(input.min):-Infinity,max=input.max!==''?Number(input.max):Infinity;input.value=Math.max(min,Math.min(max,(Number(input.value)||0)+(dir*step)));try{syncSetup?.();}catch(_){}}
  function fixSteppers(){document.querySelectorAll('.setup-page .r82-stepper-box').forEach(box=>{const input=box.querySelector('input[type="number"]'),buttons=box.querySelectorAll('.r82-step-controls button');if(!input||buttons.length<2)return;buttons[0].onclick=e=>{e.preventDefault();e.stopPropagation();stepInPlace(input,1);};buttons[1].onclick=e=>{e.preventDefault();e.stopPropagation();stepInPlace(input,-1);};});}
  function stabilize(){fixCP();fixRounds();fixSteppers();}
  document.addEventListener('click',()=>setTimeout(stabilize,0),true);new MutationObserver(()=>requestAnimationFrame(stabilize)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});setTimeout(stabilize,80);
  const s=document.createElement('style');s.textContent=`
    .r114-distance-modal .r110-distance-btn{height:50px!important;min-height:50px!important;padding:5px 8px!important;font-size:.96rem!important;line-height:1.05!important}
    .r114-distance-modal .r114-actions .btn,.r114-distance-modal .r114-actions .r110-close{height:50px!important;min-height:50px!important;padding:5px 10px!important;font-size:.98rem!important}
    .r114-legend .round-green-dot,.r114-legend .r77-blue-dot,.r114-legend .r77-grey-dot,.r77-legend .round-green-dot,.r77-legend .cp-green-dot,.r77-legend .r77-blue-dot,.r77-legend .r77-grey-dot,.r78-legend .r78-dot{display:inline-block!important;width:12px!important;height:12px!important;min-width:12px!important;min-height:12px!important;max-width:12px!important;max-height:12px!important;flex:0 0 12px!important;border-radius:50%!important;padding:0!important;margin:0!important;box-sizing:border-box!important}
    .r114-distance-modal .r110-distance-btn.complete{background:#169b69!important;color:#fff!important;border-color:#169b69!important}
    .r114-distance-modal .r110-distance-btn.complete.active{background:#169b69!important;color:#fff!important;border-color:#169b69!important}
    .r114-distance-modal .r110-distance-btn.r117-selected{outline:3px solid #0a2138!important;outline-offset:2px!important}
    #manageRoundsDialog .round-select-btn.complete{background:#169b69!important;color:#fff!important;border-color:#169b69!important}
    #manageRoundsDialog .round-select-btn.complete.active{background:#169b69!important;color:#fff!important;border-color:#169b69!important}
    #manageRoundsDialog .round-select-btn.r116-selected{outline:3px solid #0a2138!important;outline-offset:2px!important}
    #manageEndsDialog .cp-select-btn.active{outline:3px solid #0a2138!important;outline-offset:1px!important}
    .r82-step-controls button{transform:none!important;transition:none!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}.r82-step-controls button:active{transform:none!important}
  `;document.head.appendChild(s);
})();