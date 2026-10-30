/* SCOREBOARD R98 — fix R97 timer freeze + deterministic session language */
(function(){
  const getLang=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm'?'bm':'en';
  const n=(v,f)=>Math.max(1,Number(v)||f);
  const scored=()=>!!S.session?.archers?.some(a=>a.scores?.some(r=>r?.some(e=>e?.some(v=>v!==''&&v!=null))));

  function sessionMarkup(lang){
    const bm=lang==='bm', laneOn=S.setup.lane!==false, groupOn=S.setup.group!==false, a=S.session?.archers?.[S.session?.idx||0]||S.session?.archers?.[0];
    const laneValue=a?.lane ?? S.session?.lane ?? S.setup.laneNumber ?? 1;
    const groupValue=a?.group ?? S.session?.group ?? S.setup.groupNumber ?? 1;
    return `<div class="modal-card r98-session-settings">
      <h3>${bm?'TETAPAN SESI':'SESSION SETTINGS'}</h3>
      <div class="r98-row"><b>${bm?'Bahasa':'Language'}</b><div class="r98-lang"><button type="button" data-r98-lang="en" class="${lang==='en'?'active':''}">ENG</button><button type="button" data-r98-lang="bm" class="${lang==='bm'?'active':''}">BM</button></div></div>
      <div class="r98-row"><b>${bm?'Pemasa':'Timer'}</b><label><input id="r98Timer" type="checkbox" ${S.setup.timer?'checked':''}> ${bm?'Aktif':'On'}</label></div>
      <div class="r98-row"><b>${bm?'Lorong':'Lane'}</b><div class="r98-value"><label><input id="r98Lane" type="checkbox" ${laneOn?'checked':''}> ${bm?'Aktif':'On'}</label><input id="r98LaneValue" type="number" min="1" value="${laneValue}" ${laneOn?'':'disabled'}></div></div>
      <div class="r98-row"><b>${bm?'Kumpulan':'Group'}</b><div class="r98-value"><label><input id="r98Group" type="checkbox" ${groupOn?'checked':''}> ${bm?'Aktif':'On'}</label><input id="r98GroupValue" type="number" min="1" value="${groupValue}" ${groupOn?'':'disabled'}></div></div>
      <div class="r98-row"><b>${bm?'Arrow / End':'Arrows / End'}</b><div class="r98-step"><button type="button" data-r98-step="-1">−</button><strong id="r98Arrow">${S.setup.arrows}</strong><button type="button" data-r98-step="1">+</button></div></div>
      <small class="r98-note">${bm?'Arrow boleh diubah sebelum markah pertama dimasukkan. Untuk mode Pasukan, nombor Lorong yang sama digunakan untuk semua pemanah kecuali Lorong berlainan telah ditetapkan semasa Tetapan Latihan.':'Arrows can be changed before the first score is entered. In Team mode, the same Lane number is used for all archers unless different Lanes were assigned in Practice Setup.'}</small>
      <div class="r98-actions"><button class="btn primary" type="button" data-r98-apply>${bm?'GUNA':'APPLY'}</button><button class="btn soft" type="button" data-r98-cancel>${bm?'BATAL':'CANCEL'}</button></div>
    </div>`;
  }

  function snapshot(d){return {timer:d.querySelector('#r98Timer')?.checked,lane:d.querySelector('#r98Lane')?.checked,laneValue:d.querySelector('#r98LaneValue')?.value,group:d.querySelector('#r98Group')?.checked,groupValue:d.querySelector('#r98GroupValue')?.value,arrow:d.querySelector('#r98Arrow')?.textContent};}
  function restore(d,s){if(!s)return;d.querySelector('#r98Timer').checked=!!s.timer;d.querySelector('#r98Lane').checked=!!s.lane;d.querySelector('#r98LaneValue').value=s.laneValue||1;d.querySelector('#r98LaneValue').disabled=!s.lane;d.querySelector('#r98Group').checked=!!s.group;d.querySelector('#r98GroupValue').value=s.groupValue||1;d.querySelector('#r98GroupValue').disabled=!s.group;d.querySelector('#r98Arrow').textContent=s.arrow||S.setup.arrows;}
  function bindSession(d){
    d.querySelectorAll('[data-r98-lang]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const state=snapshot(d),lang=b.dataset.r98Lang;d.dataset.lang=lang;window.setScoreboardLanguage?.(lang);d.innerHTML=sessionMarkup(lang);bindSession(d);restore(d,state);},{capture:true}));
    const lane=d.querySelector('#r98Lane'),lv=d.querySelector('#r98LaneValue'),group=d.querySelector('#r98Group'),gv=d.querySelector('#r98GroupValue');
    lane.onchange=()=>lv.disabled=!lane.checked;group.onchange=()=>gv.disabled=!group.checked;
    d.querySelectorAll('[data-r98-step]').forEach(b=>b.onclick=()=>{const x=d.querySelector('#r98Arrow');x.textContent=Math.max(1,Math.min(12,(Number(x.textContent)||6)+Number(b.dataset.r98Step)));});
    d.querySelector('[data-r98-cancel]').onclick=()=>{const original=d.dataset.originalLang||'en';d.remove();window.setScoreboardLanguage?.(original);};
    d.querySelector('[data-r98-apply]').onclick=()=>{
      const lang=d.dataset.lang||getLang(), arrows=Math.max(1,Number(d.querySelector('#r98Arrow')?.textContent)||S.setup.arrows), laneOn=lane.checked, groupOn=group.checked, laneValue=n(lv.value,1), groupValue=n(gv.value,1);
      if(arrows!==S.setup.arrows&&!scored()){S.setup.arrows=arrows;if(S.session.setup)S.session.setup.arrows=arrows;S.session.archers?.forEach(a=>a.scores?.forEach(r=>r.forEach(end=>{while(end.length<arrows)end.push('');if(end.length>arrows)end.length=arrows;})));}
      Object.assign(S.setup,{timer:!!d.querySelector('#r98Timer').checked,lane:laneOn,group:groupOn,laneNumber:laneValue,groupNumber:groupValue});
      if(S.session.setup)Object.assign(S.session.setup,{timer:S.setup.timer,lane:laneOn,group:groupOn,laneNumber:laneValue,groupNumber:groupValue});
      S.session.lane=laneValue;S.session.group=groupValue;saveUnfinished();d.remove();window.setScoreboardLanguage?.(lang);scoring();
    };
  }
  window.openSessionSettings=function(){
    if(!S.session)return;document.getElementById('sessionSettingsDialog')?.remove();const lang=getLang(),d=document.createElement('div');d.id='sessionSettingsDialog';d.className='modal-overlay';d.dataset.lang=lang;d.dataset.originalLang=lang;d.innerHTML=sessionMarkup(lang);document.body.appendChild(d);bindSession(d);
  };

  function timerPageR98(){
    if(!S.session){scoring();return;}
    const bm=getLang()==='bm', prep=n(S.timer.prep,10);currentView='timer';clearInterval(timerInt);timerInt=null;timerPaused=false;
    A.innerHTML=`<main class="page font-${S.font}"><div class="timer-page r98-timer-page"><div class="timer-head"><h2>${bm?'PEMASA MEMANAH':'ARCHERY TIMER'}</h2><button type="button" class="btn soft r98-timer-settings">‹ ${bm?'Tetapan':'Settings'}</button></div><div class="timer-card"><div id="timerPhase" class="timer-phase">${bm?'SEDIA':'READY'}</div><div id="timerClock" class="timer-clock">00:${String(prep).padStart(2,'0')}</div><div id="timerHint" class="timer-hint">${bm?'Tekan MULA':'Press START'}</div></div><button type="button" class="btn green r98-start">${bm?'MULA':'START'}</button><div class="r98-pair"><button type="button" class="btn soft r98-pause">${bm?'JEDA / SAMBUNG':'PAUSE / RESUME'}</button><button type="button" class="btn danger r98-reset">RESET</button></div><button type="button" class="btn r98-back">${bm?'KEMBALI KE SCORING':'BACK TO SCORING'}</button><div class="timer-legend"><div>🔴 ${bm?'Persediaan':'Preparation'}</div><div>🟢 ${bm?'Panahan':'Shooting'}</div><div>🟠 ${bm?'Amaran':'Warning'}</div><div>🔴 ${bm?'Berhenti':'Stop'}</div></div></div></main>`;
    A.querySelector('.r98-timer-settings').onclick=e=>{e.preventDefault();openTimerQuickSettings();};
    A.querySelector('.r98-start').onclick=e=>{e.preventDefault();startArcheryTimer();};
    A.querySelector('.r98-pause').onclick=e=>{e.preventDefault();pauseArcheryTimer();};
    A.querySelector('.r98-reset').onclick=e=>{e.preventDefault();resetArcheryTimer();};
    A.querySelector('.r98-back').onclick=e=>{e.preventDefault();clearInterval(timerInt);timerInt=null;scoring();};
  }
  window.timerPage=timerPageR98;

  const style=document.createElement('style');style.textContent=`
    .r98-session-settings .r98-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid #e4e7ec}.r98-session-settings label{display:flex;align-items:center;gap:7px;font-weight:700}.r98-session-settings input[type=checkbox]{width:22px;height:22px}.r98-lang,.r98-value,.r98-step{display:flex;align-items:center;gap:10px}.r98-lang button,.r98-step button{min-width:48px;height:42px;border:1px solid #b8c3cf;border-radius:9px;background:#eef2f6;color:#0b2f5b;font-weight:900}.r98-lang button.active{background:#0b2f5b!important;color:#fff!important}.r98-value input[type=number]{width:70px;height:42px;text-align:center;border:1px solid #b8c3cf;border-radius:9px;font-weight:800}.r98-value input:disabled{opacity:.38}.r98-step strong{min-width:34px;text-align:center;font-size:20px}.r98-note{display:block;color:#667085;line-height:1.45;margin:14px 0}.r98-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.r98-actions .btn{width:100%;margin:0}
    .r98-timer-page .timer-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.r98-timer-page .timer-card{margin-top:24px}.r98-timer-page>.r98-start,.r98-timer-page>.r98-back{width:100%!important;min-height:58px!important;margin:12px 0 0!important}.r98-timer-page>.r98-back{background:#0b2f5b!important;color:#fff!important;font-weight:900!important}.r98-pair{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;width:100%!important;margin-top:10px!important}.r98-pair .btn{width:100%!important;min-height:58px!important;margin:0!important}.r98-timer-page .timer-legend{margin-top:14px!important}
  `;document.head.appendChild(style);
})();