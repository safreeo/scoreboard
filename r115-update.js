/* SCOREBOARD R115 — stable staged selectors, session/setup isolation, preset editor actions */
(function(){
  const clone=v=>JSON.parse(JSON.stringify(v));
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';

  let setupBeforeSession=null;
  if(typeof window.startSession==='function'){
    const baseStart=window.startSession;
    window.startSession=async function(){
      try{ syncSetup?.(); setupBeforeSession=clone(S.setup); }catch(_){ setupBeforeSession=clone(DEFAULT_SETUP); }
      return await baseStart.apply(this,arguments);
    };
  }
  function restoreSetupAfterSession(){
    S.setup=clone(setupBeforeSession||DEFAULT_SETUP);S.active=[];S.lanes={};S.groups={};
    try{editingPreset=null;savePresetOpen=false;}catch(_){} setupBeforeSession=null;
  }
  if(typeof window.home==='function'){
    const baseHome=window.home;window.home=function(){if(S.session)restoreSetupAfterSession();return baseHome.apply(this,arguments);};
  }

  /* R117 compatibility: keep the old R115 capture listener, but delegate CP choice to
     the newest staged selector instead of maintaining a second independent CP state. */
  document.addEventListener('click',function(e){
    const b=e.target.closest?.('.cp-select-btn');if(!b||!b.closest('#manageEndsDialog'))return;
    e.preventDefault();e.stopImmediatePropagation();
    const n=Number(b.dataset.r116Cp||b.dataset.r114Cp||(b.textContent||'').match(/\d+/)?.[0])||1;
    if(typeof window.r114ChooseCP==='function')window.r114ChooseCP(n);
  },true);

  function fixPresetEditor(){
    if(typeof editingPreset==='undefined'||editingPreset===null)return;
    const editor=document.querySelector('.preset-editor');if(!editor)return;
    const matrixSelect=editor.querySelector('#editPresetMatrix');
    if(matrixSelect){const label=matrixSelect.previousElementSibling;if(label&&/Scoring Matrix/i.test(label.textContent||''))label.remove();matrixSelect.remove();}
    editor.querySelectorAll('.row').forEach(r=>{if(/UPDATE PRESET/i.test(r.textContent||''))r.remove();});
    const help=editor.querySelector('.help');if(help)help.textContent=isBM()?'Ubah keseluruhan Format, Timer, Lane atau Matrix di bawah, kemudian tekan Kemas Kini Preset.':'Change the full Format, Timer, Lane or Matrix below, then tap Update Preset.';
    const matrixCards=[...document.querySelectorAll('.setup-card')].filter(c=>/SCORING MATRIX|MATRIKS PEMARKAHAN/i.test(c.textContent||''));
    const card=matrixCards[matrixCards.length-1];if(!card||card.querySelector('.r115-preset-actions'))return;
    const row=document.createElement('div');row.className='row r115-preset-actions';
    row.innerHTML=`<button class="btn primary" type="button" data-r115-update>${isBM()?'KEMAS KINI PRESET':'UPDATE PRESET'}</button><button class="btn soft" type="button" data-r115-cancel>${isBM()?'BATAL':'CANCEL'}</button>`;
    card.appendChild(row);
    row.querySelector('[data-r115-update]').onclick=()=>{syncSetup?.();const name=(document.getElementById('editPresetName')?.value||'').trim()||'Practice Preset';S.presets[editingPreset]={...clone(S.setup),name};save?.();editingPreset=null;setup?.();};
    row.querySelector('[data-r115-cancel]').onclick=()=>{editingPreset=null;setup?.();};
  }
  new MutationObserver(()=>requestAnimationFrame(fixPresetEditor)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(fixPresetEditor,50);

  const s=document.createElement('style');s.textContent=`
    .r115-preset-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important;margin-top:18px!important}.r115-preset-actions .btn{width:100%!important;min-height:58px!important}
  `;document.head.appendChild(s);
})();