/* SCOREBOARD R97 — live Session language + reliable Archery Timer controls */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';
  const num=(v,f)=>Math.max(1,Number(v)||f);
  const hasScore=()=>!!S.session?.archers?.some(a=>a.scores?.some(r=>r?.some(e=>e?.some(v=>v!==''&&v!=null))));

  function sessionHTML(lang){
    const bm=lang==='bm',laneOn=S.setup.lane!==false,groupOn=S.setup.group!==false,first=S.session?.archers?.[0];
    const laneValue=first?.lane ?? S.session?.lane ?? S.setup.laneNumber ?? 1;
    const groupValue=first?.group ?? S.session?.group ?? S.setup.groupNumber ?? 1;
    return `<div class="modal-card r97-session-settings">
      <h3>${bm?'TETAPAN SESI':'SESSION SETTINGS'}</h3>
      <div class="r97-row"><b>${bm?'Bahasa':'Language'}</b><div class="r97-lang"><button type="button" data-lang="en" class="${lang==='en'?'active':''}">ENG</button><button type="button" data-lang="bm" class="${lang==='bm'?'active':''}">BM</button></div></div>
      <div class="r97-row"><b>${bm?'Pemasa':'Timer'}</b><label><input id="r97Timer" type="checkbox" ${S.setup.timer?'checked':''}> ${bm?'Aktif':'On'}</label></div>
      <div class="r97-row"><b>${bm?'Lorong':'Lane'}</b><div class="r97-value"><label><input id="r97Lane" type="checkbox" ${laneOn?'checked':''}> ${bm?'Aktif':'On'}</label><input id="r97LaneValue" type="number" min="1" value="${laneValue}" ${laneOn?'':'disabled'}></div></div>
      <div class="r97-row"><b>${bm?'Kumpulan':'Group'}</b><div class="r97-value"><label><input id="r97Group" type="checkbox" ${groupOn?'checked':''}> ${bm?'Aktif':'On'}</label><input id="r97GroupValue" type="number" min="1" value="${groupValue}" ${groupOn?'':'disabled'}></div></div>
      <div class="r97-row"><b>${bm?'Arrow / End':'Arrows / End'}</b><div class="r97-step"><button type="button" data-step="-1">−</button><strong id="r97Arrow">${S.setup.arrows}</strong><button type="button" data-step="1">+</button></div></div>
      <small class="r97-note">${bm?'Arrow boleh diubah sebelum markah pertama dimasukkan. Untuk mode Pasukan, nombor Lorong yang sama digunakan untuk semua pemanah kecuali Lorong berlainan telah ditetapkan semasa Tetapan Latihan.':'Arrows can be changed before the first score is entered. In Team mode, the same Lane number is used for all archers unless different Lanes were assigned in Practice Setup.'}</small>
      <div class="r97-actions"><button class="btn primary" type="button" data-apply>${bm?'GUNA':'APPLY'}</button><button class="btn soft" type="button" data-cancel>${bm?'BATAL':'CANCEL'}</button></div>
    </div>`;
  }
  function bindSession(d){
    d.querySelectorAll('.r97-lang button').forEach(b=>b.onclick=()=>{const state={timer:d.querySelector('#r97Timer')?.checked,lane:d.querySelector('#r97Lane')?.checked,laneValue:d.querySelector('#r97LaneValue')?.value,group:d.querySelector('#r97Group')?.checked,groupValue:d.querySelector('#r97GroupValue')?.value,arrow:d.querySelector('#r97Arrow')?.textContent};d.dataset.lang=b.dataset.lang;d.innerHTML=sessionHTML(b.dataset.lang);bindSession(d);d.querySelector('#r97Timer').checked=state.timer;d.querySelector('#r97Lane').checked=state.lane;d.querySelector('#r97LaneValue').value=state.laneValue;d.querySelector('#r97LaneValue').disabled=!state.lane;d.querySelector('#r97Group').checked=state.group;d.querySelector('#r97GroupValue').value=state.groupValue;d.querySelector('#r97GroupValue').disabled=!state.group;d.querySelector('#r97Arrow').textContent=state.arrow;});
    const toggle=(c,v)=>{c=d.querySelector(c);v=d.querySelector(v);if(c&&v)c.onchange=()=>v.disabled=!c.checked};toggle('#r97Lane','#r97LaneValue');toggle('#r97Group','#r97GroupValue');
    d.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{const e=d.querySelector('#r97Arrow');e.textContent=Math.max(1,Math.min(12,(Number(e.textContent)||6)+Number(b.dataset.step)));});
    d.querySelector('[data-cancel]').onclick=()=>d.remove();
    d.querySelector('[data-apply]').onclick=()=>{
      const lang=d.dataset.lang||'en',newArrows=Math.max(1,Number(d.querySelector('#r97Arrow')?.textContent)||S.setup.arrows),lane=!!d.querySelector('#r97Lane')?.checked,group=!!d.querySelector('#r97Group')?.checked,laneValue=num(d.querySelector('#r97LaneValue')?.value,1),groupValue=num(d.querySelector('#r97GroupValue')?.value,1);
      if(newArrows!==S.setup.arrows&&!hasScore()){S.setup.arrows=newArrows;if(S.session.setup)S.session.setup.arrows=newArrows;S.session.archers?.forEach(a=>a.scores?.forEach(r=>r.forEach(e=>{while(e.length<newArrows)e.push('');if(e.length>newArrows)e.length=newArrows;})));}
      S.setup.timer=!!d.querySelector('#r97Timer')?.checked;S.setup.lane=lane;S.setup.group=group;S.setup.laneNumber=laneValue;S.setup.groupNumber=groupValue;
      if(S.session.setup)Object.assign(S.session.setup,{timer:S.setup.timer,lane,group,laneNumber:laneValue,groupNumber:groupValue});S.session.lane=laneValue;S.session.group=groupValue;
      saveUnfinished();d.remove();window.setScoreboardLanguage?.(lang);scoring();
    };
  }
  window.openSessionSettings=function(){if(!S.session||document.getElementById('sessionSettingsDialog'))return;const d=document.createElement('div');d.id='sessionSettingsDialog';d.className='modal-overlay';d.dataset.lang=isBM()?'bm':'en';d.innerHTML=sessionHTML(d.dataset.lang);document.body.appendChild(d);bindSession(d);};

  function timerPage(){
    if(!S.session)return scoring();
    const bm=isBM(),prep=num(S.timer.prep,10);currentView='timer';clearTimer();
    A.innerHTML=`<div class="page timer-page r97-timer-page"><div class="timer-head"><h2>${bm?'PEMASA MEMANAH':'ARCHERY TIMER'}</h2><button class="btn soft r97-timer-settings">‹ ${bm?'Tetapan':'Settings'}</button></div><div class="timer-card"><div id="timerPhase" class="timer-phase">${bm?'SEDIA':'READY'}</div><div id="timerClock" class="timer-clock">00:${String(prep).padStart(2,'0')}</div><div id="timerHint" class="timer-hint">${bm?'Tekan MULA':'Press START'}</div></div><button class="btn green r97-start">${bm?'MULA':'START'}</button><div class="r97-pair"><button class="btn soft r97-pause">${bm?'JEDA / SAMBUNG':'PAUSE / RESUME'}</button><button class="btn danger r97-reset">${bm?'TETAP SEMULA':'RESET'}</button></div><button class="btn r97-back">${bm?'KEMBALI KE SCORING':'BACK TO SCORING'}</button><div class="timer-legend"><div>🔴 ${bm?'Persediaan':'Preparation'}</div><div>🟢 ${bm?'Panahan':'Shooting'}</div><div>🟠 ${bm?'Amaran':'Warning'}</div><div>🔴 ${bm?'Berhenti':'Stop'}</div></div></div>`;
    A.querySelector('.r97-timer-settings').onclick=()=>openTimerQuickSettings();
    A.querySelector('.r97-start').onclick=()=>startArcheryTimer();
    A.querySelector('.r97-pause').onclick=()=>pauseArcheryTimer();
    A.querySelector('.r97-reset').onclick=()=>resetArcheryTimer();
    A.querySelector('.r97-back').onclick=()=>{clearTimer();scoring();};
  }
  window.timerPage=timerPage;window.archeryTimer=timerPage;window.timer=timerPage;

  const s=document.createElement('style');s.textContent=`
  .r97-session-settings .r97-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid #e4e7ec}.r97-session-settings label{display:flex;align-items:center;gap:7px;font-weight:700}.r97-session-settings input[type=checkbox]{width:22px;height:22px}.r97-lang,.r97-value,.r97-step{display:flex;align-items:center;gap:10px}.r97-lang button,.r97-step button{min-width:48px;height:42px;border:1px solid #b8c3cf;border-radius:9px;background:#eef2f6;color:#0b2f5b;font-weight:900}.r97-lang button.active{background:#0b2f5b;color:#fff}.r97-value input[type=number]{width:70px;height:42px;text-align:center;border:1px solid #b8c3cf;border-radius:9px;font-weight:800}.r97-value input:disabled{opacity:.38}.r97-step strong{min-width:34px;text-align:center;font-size:20px}.r97-note{display:block;color:#667085;line-height:1.45;margin:14px 0}.r97-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.r97-actions .btn{width:100%;margin:0}
  .r97-timer-page .timer-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.r97-timer-page .timer-card{margin-top:24px}.r97-timer-page>.r97-start,.r97-timer-page>.r97-back{width:100%!important;min-height:58px!important;margin:14px 0 0!important}.r97-timer-page>.r97-back{background:#0b2f5b!important;color:#fff!important;font-weight:900!important}.r97-pair{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;width:100%!important;margin-top:14px!important}.r97-pair .btn{width:100%!important;min-height:58px!important;margin:0!important}.r97-timer-page .timer-legend{margin-top:18px!important}
  `;document.head.appendChild(s);
})();