/* SCOREBOARD R116 — compact selectors, accurate round status, staged CP, stable setup steppers */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';
  const resetEdit=()=>{try{editMode=false;editEnd=null;editDirty=false;selectedScoreCell=null;}catch(_){}};

  /* CP: R113 registered its capture listener before later patches, so it always wins.
     Do not fight that listener: replace the function it calls with staging only. */
  let pendingCP=null;
  function cpNo(btn){return Number(btn?.dataset?.r116Cp||btn?.dataset?.r115Cp||btn?.dataset?.r114Cp||(btn?.textContent||'').match(/\d+/)?.[0])||1;}
  function paintCP(){
    const modal=document.getElementById('manageEndsDialog');if(!modal)return;
    modal.querySelectorAll('.cp-select-btn').forEach(b=>b.classList.toggle('active',cpNo(b)===Number(pendingCP)));
  }
  window.r113SelectCP=function(n){pendingCP=Math.max(1,Number(n)||1);paintCP();};
  window.r114ChooseCP=function(n){pendingCP=Math.max(1,Number(n)||1);paintCP();};
  window.r114ConfirmCP=function(){
    if(!S.session||S.setup.practiceType==='target'||pendingCP==null)return;
    const total=Math.max(1,Number(S.setup.checkPoints||S.setup.ends)||1),cp=Math.min(total,pendingCP),round=currentRoundNo?.()||1,a=activeArcher?.();if(!a)return;
    resetEdit();S.session.currentRound=round;S.session.currentEnd=cp;a.r=round;a.e=cp;saveUnfinished?.();closeModal?.('manageEndsDialog');scoring?.();
  };
  function fixCP(){
    const modal=document.getElementById('manageEndsDialog');if(!modal||S.setup.practiceType==='target')return;
    const total=Math.max(1,Number(S.setup.checkPoints||S.setup.ends)||1),current=Math.min(total,Math.max(1,Number(S.session?.currentEnd)||1));
    if(pendingCP==null||pendingCP>total)pendingCP=current;
    modal.querySelectorAll('.cp-select-btn').forEach(b=>{b.dataset.r116Cp=cpNo(b);b.removeAttribute('onclick');b.onclick=e=>{e.preventDefault();e.stopPropagation();pendingCP=cpNo(b);paintCP();};});
    const select=modal.querySelector('[data-r115-cp-select],[data-r114-cp-select]')||[...modal.querySelectorAll('.cp-select-block button')].find(b=>/^SELECT$|^PILIH$/i.test((b.textContent||'').trim()));
    if(select){select.removeAttribute('onclick');select.onclick=e=>{e.preventDefault();e.stopPropagation();r114ConfirmCP();};}
    paintCP();
  }

  /* Round completion is a data fact, independent of which Round is currently selected. */
  function roundComplete(round){
    const archers=S.session?.archers||[],ends=Math.max(1,Number(S.setup.ends)||1);if(!archers.length)return false;
    return archers.every(a=>{for(let e=1;e<=ends;e++)if(!endLocked(a,round,e))return false;return true;});
  }
  function fixRounds(){
    const modal=document.getElementById('manageRoundsDialog');if(!modal)return;
    const buttons=[...modal.querySelectorAll('.round-select-btn')];
    buttons.forEach((b,i)=>{
      const n=i+1,complete=roundComplete(n),selected=typeof r76PendingRound!=='undefined'&&Number(r76PendingRound)===n;
      b.classList.toggle('complete',complete);b.classList.toggle('active',selected);b.classList.toggle('r116-selected',selected);
    });
  }
  if(typeof window.r76ChooseRound==='function'){
    const choose=window.r76ChooseRound;window.r76ChooseRound=function(n){choose(n);fixRounds();};
  }
  if(typeof window.manageRounds==='function'){
    const manage=window.manageRounds;window.manageRounds=function(){const v=manage.apply(this,arguments);setTimeout(fixRounds,0);return v;};
  }

  /* Setup number steppers: change the value in place. Do not dispatch CHANGE on every
     tap because many setup fields rerender the page on change, which caused the UI jump. */
  function stepInPlace(input,dir){
    const step=Number(input.step)||1,min=input.min!==''?Number(input.min):-Infinity,max=input.max!==''?Number(input.max):Infinity;
    input.value=Math.max(min,Math.min(max,(Number(input.value)||0)+(dir*step)));
    try{syncSetup?.();}catch(_){}
  }
  function fixSteppers(){
    document.querySelectorAll('.setup-page .r82-stepper-box').forEach(box=>{
      const input=box.querySelector('input[type="number"]'),buttons=box.querySelectorAll('.r82-step-controls button');if(!input||buttons.length<2)return;
      buttons[0].onclick=e=>{e.preventDefault();e.stopPropagation();stepInPlace(input,1);};
      buttons[1].onclick=e=>{e.preventDefault();e.stopPropagation();stepInPlace(input,-1);};
    });
  }

  function stabilize(){fixCP();fixRounds();fixSteppers();}
  document.addEventListener('click',()=>setTimeout(stabilize,0),true);
  new MutationObserver(()=>requestAnimationFrame(stabilize)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(stabilize,80);

  const s=document.createElement('style');s.textContent=`
    /* Distance buttons + SELECT/CLOSE: compact and consistent. */
    .r114-distance-modal .r110-distance-btn{height:58px!important;min-height:58px!important;padding:8px 10px!important;font-size:1.05rem!important}
    .r114-distance-modal .r114-actions .btn{height:58px!important;min-height:58px!important;padding:8px 12px!important;font-size:1.05rem!important}
    .r114-distance-modal .r114-actions .r110-close{height:58px!important;min-height:58px!important}
    /* Every legend dot uses exactly the same geometry. */
    .r114-legend .round-green-dot,.r114-legend .r77-blue-dot,.r114-legend .r77-grey-dot,
    .r77-legend .round-green-dot,.r77-legend .cp-green-dot,.r77-legend .r77-blue-dot,.r77-legend .r77-grey-dot,
    .r78-legend .r78-dot{width:12px!important;height:12px!important;min-width:12px!important;min-height:12px!important;max-width:12px!important;max-height:12px!important;flex:0 0 12px!important;border-radius:50%!important;padding:0!important;margin:0!important;box-sizing:border-box!important}
    /* Completed stays green; selected Round is indicated by a black outline. */
    #manageRoundsDialog .round-select-btn.complete{background:#169b69!important;color:#fff!important;border-color:#169b69!important}
    #manageRoundsDialog .round-select-btn.r116-selected{outline:3px solid #0a2138!important;outline-offset:2px!important}
    /* CP selection must remain in the modal until SELECT. */
    #manageEndsDialog .cp-select-btn.active{outline:3px solid #0a2138!important;outline-offset:1px!important}
    /* Prevent touch press/reflow artefacts on the custom number arrows. */
    .r82-step-controls button{transform:none!important;transition:none!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
    .r82-step-controls button:active{transform:none!important}
  `;document.head.appendChild(s);
})();