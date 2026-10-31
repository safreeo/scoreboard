/* SCOREBOARD R115 — stable staged selectors, session/setup isolation, preset editor actions */
(function(){
  const clone=v=>JSON.parse(JSON.stringify(v));
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';

  /* 1) Session changes are temporary. Keep the setup that existed when scoring started
     so returning Home/Setup cannot leak changed End/Round/CP values into a new session. */
  let setupBeforeSession=null;
  if(typeof window.startSession==='function'){
    const baseStart=window.startSession;
    window.startSession=async function(){
      try{ syncSetup?.(); setupBeforeSession=clone(S.setup); }catch(_){ setupBeforeSession=clone(DEFAULT_SETUP); }
      return await baseStart.apply(this,arguments);
    };
  }
  function restoreSetupAfterSession(){
    S.setup=clone(setupBeforeSession||DEFAULT_SETUP);
    S.active=[];S.lanes={};S.groups={};
    try{editingPreset=null;savePresetOpen=false;}catch(_){}
    setupBeforeSession=null;
  }
  /* Home itself must also be safe because several exit flows eventually call home(). */
  if(typeof window.home==='function'){
    const baseHome=window.home;
    window.home=function(){if(S.session)restoreSetupAfterSession();return baseHome.apply(this,arguments);};
  }

  /* 2) CP: capture-phase handler from R113 could still navigate immediately.
     Replace it with a later-loaded capture handler which only stages the choice. */
  let stagedCP=null;
  function paintCP(){
    const modal=document.getElementById('manageEndsDialog');if(!modal)return;
    modal.querySelectorAll('.cp-select-btn').forEach(b=>{
      const n=Number(b.dataset.r115Cp||b.dataset.r114Cp||(b.textContent||'').match(/\d+/)?.[0]);
      b.classList.toggle('active',n===stagedCP);
    });
  }
  function stageCP(n){stagedCP=Math.max(1,Number(n)||1);paintCP();}
  function confirmCP(){
    if(!S.session||S.setup.practiceType==='target'||stagedCP==null)return;
    const total=Math.max(1,Number(S.setup.checkPoints||S.setup.ends)||1),cp=Math.min(total,stagedCP),round=currentRoundNo?.()||1,a=activeArcher?.();if(!a)return;
    try{editMode=false;editEnd=null;editDirty=false;selectedScoreCell=null;}catch(_){}
    S.session.currentRound=round;S.session.currentEnd=cp;a.r=round;a.e=cp;
    saveUnfinished?.();closeModal?.('manageEndsDialog');scoring?.();
  }
  function stabilizeCPModal(){
    const modal=document.getElementById('manageEndsDialog');if(!modal||S.setup.practiceType==='target')return;
    const total=Math.max(1,Number(S.setup.checkPoints||S.setup.ends)||1),current=Math.min(total,Math.max(1,Number(S.session?.currentEnd)||1));
    if(stagedCP==null||stagedCP>total)stagedCP=current;
    modal.querySelectorAll('.cp-select-btn').forEach(b=>{
      const n=Number(b.dataset.r114Cp||(b.textContent||'').match(/\d+/)?.[0]);b.dataset.r115Cp=n;
      b.removeAttribute('onclick');b.onclick=null;
    });
    let btn=modal.querySelector('[data-r115-cp-select]')||modal.querySelector('[data-r114-cp-select]');
    if(btn){btn.dataset.r115CpSelect='1';btn.removeAttribute('onclick');btn.onclick=e=>{e.preventDefault();e.stopPropagation();confirmCP();};}
    paintCP();
  }
  document.addEventListener('click',function(e){
    const b=e.target.closest?.('.cp-select-btn');if(!b||!b.closest('#manageEndsDialog'))return;
    e.preventDefault();e.stopImmediatePropagation();
    stageCP(Number(b.dataset.r115Cp||b.dataset.r114Cp||(b.textContent||'').match(/\d+/)?.[0]));
  },true);
  new MutationObserver(()=>requestAnimationFrame(stabilizeCPModal)).observe(document.body,{childList:true,subtree:true});

  /* 3) Edit Preset: editor at the top is only name + explanation.
     Matrix is already in the main Scoring Matrix section. Put UPDATE/CANCEL after it. */
  function fixPresetEditor(){
    if(typeof editingPreset==='undefined'||editingPreset===null)return;
    const editor=document.querySelector('.preset-editor');if(!editor)return;
    const matrixSelect=editor.querySelector('#editPresetMatrix');
    if(matrixSelect){
      const label=matrixSelect.previousElementSibling;if(label&&/Scoring Matrix/i.test(label.textContent||''))label.remove();
      matrixSelect.remove();
    }
    editor.querySelectorAll('.row').forEach(r=>{if(/UPDATE PRESET/i.test(r.textContent||''))r.remove();});
    const help=editor.querySelector('.help');if(help)help.textContent=isBM()?'Ubah keseluruhan Format, Timer, Lane atau Matrix di bawah, kemudian tekan Kemas Kini Preset.':'Change the full Format, Timer, Lane or Matrix below, then tap Update Preset.';
    const matrixCards=[...document.querySelectorAll('.setup-card')].filter(c=>/SCORING MATRIX|MATRIKS PEMARKAHAN/i.test(c.textContent||''));
    const card=matrixCards[matrixCards.length-1];if(!card||card.querySelector('.r115-preset-actions'))return;
    const row=document.createElement('div');row.className='row r115-preset-actions';
    row.innerHTML=`<button class="btn primary" type="button" data-r115-update>${isBM()?'KEMAS KINI PRESET':'UPDATE PRESET'}</button><button class="btn soft" type="button" data-r115-cancel>${isBM()?'BATAL':'CANCEL'}</button>`;
    card.appendChild(row);
    row.querySelector('[data-r115-update]').onclick=()=>{
      syncSetup?.();
      const name=(document.getElementById('editPresetName')?.value||'').trim()||'Practice Preset';
      S.presets[editingPreset]={...clone(S.setup),name};save?.();editingPreset=null;setup?.();
    };
    row.querySelector('[data-r115-cancel]').onclick=()=>{editingPreset=null;setup?.();};
  }
  new MutationObserver(()=>requestAnimationFrame(fixPresetEditor)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(fixPresetEditor,50);

  const s=document.createElement('style');s.textContent=`
    .r114-distance-btn,.r110-distance-btn{min-height:72px!important;height:72px!important}
    .r114-actions .btn{min-height:72px!important;height:72px!important}
    .r114-legend span.round-green-dot,.r77-legend span.round-green-dot,.r77-legend span.cp-green-dot{width:16px!important;height:16px!important;min-width:16px!important;min-height:16px!important;display:inline-block!important;border-radius:50%!important;flex:0 0 16px!important}
    .r115-preset-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important;margin-top:18px!important}.r115-preset-actions .btn{width:100%!important;min-height:58px!important}
  `;document.head.appendChild(s);
})();