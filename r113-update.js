/* SCOREBOARD R113 — direct selection for any Distance and any CP */
(function(){
  const resetEdit=()=>{try{editMode=false;editEnd=null;editDirty=false;selectedScoreCell=null;}catch(_){}};

  /* Multiple Distances: selecting a distance is navigation, not workflow progression.
     Jump to that distance's first End (or first unfinished End inside that block),
     exactly like selecting another Round/End. */
  window.r113SelectDistance=function(startEnd){
    if(!S.session||S.setup.distanceMode!=='multiple')return;
    const a=activeArcher?.();if(!a)return;
    const round=currentRoundNo?.()||1,blocks=typeof multiBlocks==='function'?multiBlocks(round):[];
    const block=blocks.find(b=>Number(b.start)===Number(startEnd));if(!block)return;
    let target=Number(block.start)||1;
    for(let e=block.start;e<=block.end;e++){if(!endLocked(a,round,e)){target=e;break;}}
    resetEdit();S.session.currentRound=round;S.session.currentEnd=target;a.r=round;a.e=target;
    saveUnfinished?.();closeModal?.('manageDistancesDialog');scoring?.();
  };

  window.manageDistances=function(){
    if(!S.session||S.setup.distanceMode!=='multiple')return;
    document.getElementById('manageDistancesDialog')?.remove();
    const round=currentRoundNo?.()||1,currentEnd=currentEndNo?.()||1,blocks=typeof multiBlocks==='function'?multiBlocks(round):[];
    const active=blocks.findIndex(b=>currentEnd>=b.start&&currentEnd<=b.end),bm=(window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';
    const o=document.createElement('div');o.id='manageDistancesDialog';o.className='modal-overlay';
    o.innerHTML=`<div class="modal-card r110-distance-modal"><h3>${bm?'PILIH JARAK':'SELECT DISTANCE'}</h3><div class="r110-distance-grid">${blocks.map((b,i)=>`<button type="button" class="btn r110-distance-btn ${i===active?'primary':'soft'}" data-r113-distance="${b.start}">${Number(b.distance)}M × ${Number(b.ends)} ENDS</button>`).join('')}</div><div class="modal-actions"><button class="btn soft r110-close" type="button" data-r113-close>${bm?'TUTUP':'CLOSE'}</button></div></div>`;
    o.querySelectorAll('[data-r113-distance]').forEach(b=>b.addEventListener('click',()=>r113SelectDistance(Number(b.dataset.r113Distance))));
    o.querySelector('[data-r113-close]')?.addEventListener('click',()=>closeModal?.('manageDistancesDialog'));
    document.body.appendChild(o);
  };

  /* CP selector: every CP is directly selectable, including completed CPs.
     Completed CP remains locked for normal scoring; selecting it only navigates there.
     Existing Edit behaviour remains responsible for changing submitted scores. */
  window.r113SelectCP=function(cpNo){
    if(!S.session||S.setup.practiceType==='target')return;
    const a=activeArcher?.();if(!a)return;
    const total=Math.max(1,Number(S.setup.checkPoints||S.setup.ends)||1),cp=Math.max(1,Math.min(Number(cpNo)||1,total)),round=currentRoundNo?.()||1;
    resetEdit();S.session.currentRound=round;S.session.currentEnd=cp;a.r=round;a.e=cp;
    saveUnfinished?.();closeModal?.('manageEndsDialog');scoring?.();
  };

  /* R112 rebuilds the CP grid dynamically. Capture clicks before older handlers so
     every visible CP button always uses the direct-selection navigation above. */
  document.addEventListener('click',function(e){
    const b=e.target.closest?.('.cp-select-btn');if(!b||!b.closest('#manageEndsDialog'))return;
    const m=(b.textContent||'').match(/CP\s*(\d+)/i);if(!m)return;
    e.preventDefault();e.stopImmediatePropagation();r113SelectCP(Number(m[1]));
  },true);
})();