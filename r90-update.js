/* SCOREBOARD R90 — Session controls, timer-local settings, balanced Home */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';
  const num=(v,f=1)=>Math.max(1,Number(v)||f);

  /* Session Settings: language visible, Lane/Group values, Arrow/End last. */
  window.openSessionSettings=function(){
    if(!S.session||document.getElementById('sessionSettingsDialog'))return;
    const bm=isBM(),overlay=document.createElement('div'),lang=bm?'bm':'en';
    const laneOn=S.setup.lane!==false,groupOn=S.setup.group!==false;
    const first=S.session.archers?.[0];
    const laneValue=first?.lane ?? S.session.lane ?? S.setup.laneNumber ?? 1;
    const groupValue=first?.group ?? S.session.group ?? S.setup.groupNumber ?? 1;
    overlay.id='sessionSettingsDialog';overlay.className='modal-overlay';
    overlay.innerHTML=`<div class="modal-card r88-session-settings r90-session-settings">
      <h3>${bm?'TETAPAN SESI':'SESSION SETTINGS'}</h3>
      <div class="r88-setting-row"><b>${bm?'Bahasa':'Language'}</b><div class="r88-choice r90-lang-choice"><button type="button" id="r88LangEn" class="${lang==='en'?'active':''}" onclick="r88PickLang('en')">ENG</button><button type="button" id="r88LangBm" class="${lang==='bm'?'active':''}" onclick="r88PickLang('bm')">BM</button></div></div>
      <div class="r88-setting-row"><b>${bm?'Pemasa':'Timer'}</b><label class="r88-check"><input id="r88Timer" type="checkbox" ${S.setup.timer?'checked':''}> ${bm?'Aktif':'On'}</label></div>
      <div class="r88-setting-row r90-toggle-row"><b>Lane</b><div class="r90-toggle-value"><label class="r88-check"><input id="r90Lane" type="checkbox" ${laneOn?'checked':''} onchange="r90ToggleValue('lane')"> ${bm?'Aktif':'On'}</label><input id="r90LaneValue" class="r90-number" type="number" min="1" inputmode="numeric" value="${escAttr(laneValue)}" ${laneOn?'':'disabled'}></div></div>
      <div class="r88-setting-row r90-toggle-row"><b>Group</b><div class="r90-toggle-value"><label class="r88-check"><input id="r90Group" type="checkbox" ${groupOn?'checked':''} onchange="r90ToggleValue('group')"> ${bm?'Aktif':'On'}</label><input id="r90GroupValue" class="r90-number" type="number" min="1" inputmode="numeric" value="${escAttr(groupValue)}" ${groupOn?'':'disabled'}></div></div>
      <div class="r88-setting-row"><b>${bm?'Arrow / End':'Arrows / End'}</b><div class="r88-stepper"><button type="button" onclick="r88StepArrow(-1)">−</button><strong id="r88Arrow">${S.setup.arrows}</strong><button type="button" onclick="r88StepArrow(1)">+</button></div></div>
      <small class="r88-note">${bm?'Arrow boleh diubah sebelum markah pertama dimasukkan. Untuk mode Team, nombor Lane yang sama digunakan untuk semua pemanah kecuali Lane berlainan telah ditetapkan semasa Tetapan Latihan.':'Arrows can be changed before the first score is entered. In Team mode, the same Lane number is used for all archers unless different Lanes were assigned in Practice Setup.'}</small>
      <div class="modal-actions r88-actions"><button class="btn primary" onclick="applySessionSettings()">${bm?'GUNA':'APPLY'}</button><button class="btn soft" onclick="closeModal('sessionSettingsDialog')">${bm?'BATAL':'CANCEL'}</button></div>
    </div>`;
    overlay.dataset.lang=lang;document.body.appendChild(overlay);
  };
  window.r90ToggleValue=function(kind){const on=document.getElementById(kind==='lane'?'r90Lane':'r90Group')?.checked;const el=document.getElementById(kind==='lane'?'r90LaneValue':'r90GroupValue');if(el)el.disabled=!on;};

  const baseApply=window.applySessionSettings;
  window.applySessionSettings=function(){
    const d=document.getElementById('sessionSettingsDialog');if(!d||!S.session)return;
    const laneOn=!!document.getElementById('r90Lane')?.checked,groupOn=!!document.getElementById('r90Group')?.checked;
    const laneValue=num(document.getElementById('r90LaneValue')?.value,1),groupValue=num(document.getElementById('r90GroupValue')?.value,1);
    S.setup.lane=laneOn;S.setup.group=groupOn;S.setup.laneNumber=laneValue;S.setup.groupNumber=groupValue;
    if(S.session.setup){S.session.setup.lane=laneOn;S.session.setup.group=groupOn;S.session.setup.laneNumber=laneValue;S.session.setup.groupNumber=groupValue;}
    S.session.lane=laneValue;S.session.group=groupValue;
    const team=(S.setup.mode==='team'||S.setup.practiceMode==='team'||S.setup.team===true);
    if(Array.isArray(S.session.archers)){
      if(laneOn){
        const explicit=S.session.archers.filter(a=>a&&a.lane!=null&&String(a.lane)!=='');
        if(!team||explicit.length===0)S.session.archers.forEach(a=>{if(a)a.lane=laneValue;});
      }
      if(groupOn)S.session.archers.forEach(a=>{if(a&&(!team||a.group==null||String(a.group)===''))a.group=groupValue;});
    }
    /* R89's wrapper expects these ids. */
    const alias=(id,checked)=>{let el=document.getElementById(id);if(!el){el=document.createElement('input');el.type='checkbox';el.id=id;el.hidden=true;d.appendChild(el);}el.checked=checked;};
    alias('r89Lane',laneOn);alias('r89Group',groupOn);
    baseApply();
  };

  /* Timer page Settings opens timer-specific controls and returns to timer. */
  window.openTimerQuickSettings=function(){
    if(document.getElementById('timerQuickSettings'))return;
    const bm=isBM(),o=document.createElement('div');o.id='timerQuickSettings';o.className='modal-overlay';
    o.innerHTML=`<div class="modal-card r90-timer-settings"><h3>${bm?'TETAPAN TIMER':'TIMER SETTINGS'}</h3>
      <div class="r90-time-grid">
        <label><span>${bm?'Persediaan':'Preparation'}</span><div><input id="r90Prep" type="number" min="1" inputmode="numeric" value="${num(S.timer.prep,10)}"><small>${bm?'saat':'sec'}</small></div></label>
        <label><span>${bm?'Panahan':'Shooting'}</span><div><input id="r90Shoot" type="number" min="1" inputmode="numeric" value="${num(S.timer.shoot,120)}"><small>${bm?'saat':'sec'}</small></div></label>
        <label><span>${bm?'Amaran':'Warning'}</span><div><input id="r90Warn" type="number" min="1" inputmode="numeric" value="${num(S.timer.warn,10)}"><small>${bm?'saat':'sec'}</small></div></label>
      </div><div class="modal-actions r88-actions"><button class="btn primary" onclick="r90SaveTimerSettings()">${bm?'SIMPAN':'SAVE'}</button><button class="btn soft" onclick="closeModal('timerQuickSettings')">${bm?'BATAL':'CANCEL'}</button></div></div>`;document.body.appendChild(o);
  };
  window.r90SaveTimerSettings=function(){S.timer={...S.timer,prep:num(document.getElementById('r90Prep')?.value,10),shoot:num(document.getElementById('r90Shoot')?.value,120),warn:num(document.getElementById('r90Warn')?.value,10)};save();closeModal('timerQuickSettings');resetArcheryTimer();};

  function enhanceTimer(){
    const title=[...document.querySelectorAll('h1,h2,h3,.page-title')].find(e=>/ARCHERY TIMER|PEMASA MEMANAH/i.test(e.textContent||''));if(!title)return;
    const buttons=[...document.querySelectorAll('button')];
    const top=buttons.find(b=>/^\s*‹\s*(Settings|Tetapan)\s*$/i.test(b.textContent||''));if(top){top.onclick=()=>openTimerQuickSettings();}
    const back=buttons.find(b=>/BACK TO SCORING|KEMBALI KE SCORING/i.test(b.textContent||''));if(back){back.textContent=isBM()?'⚙ TETAPAN':'⚙ SETTINGS';back.onclick=()=>openTimerQuickSettings();back.classList.add('r90-timer-settings-btn');}
    const start=buttons.find(b=>/^\s*(START|MULA)\s*$/i.test(b.textContent||''));const pause=buttons.find(b=>/PAUSE\s*\/\s*RESUME|JEDA\s*\/\s*SAMBUNG/i.test(b.textContent||''));const reset=buttons.find(b=>/^\s*(RESET|SET SEMULA)\s*$/i.test(b.textContent||''));[start,pause,reset,back].forEach(b=>b&&b.classList.add('r90-timer-action'));
  }
  function schedule(){setTimeout(enhanceTimer,35)}document.addEventListener('click',schedule,true);setTimeout(schedule,100);

  const style=document.createElement('style');style.textContent=`
    .r90-lang-choice{display:flex!important;visibility:visible!important;opacity:1!important;gap:6px!important}.r90-lang-choice button{display:block!important;visibility:visible!important;opacity:1!important}
    .r90-toggle-value{display:flex;align-items:center;gap:10px}.r90-number{width:70px!important;height:42px!important;padding:6px 8px!important;text-align:center!important;font-weight:800!important;font-size:17px!important;border:1px solid #b8c3cf!important;border-radius:9px!important}.r90-number:disabled{opacity:.38!important}
    .r90-session-settings .r88-setting-row{padding:10px 0!important}.r90-session-settings .r88-note{margin:11px 0!important}
    .timer-page .timer-actions{gap:8px!important}.timer-page .r89-timer-row{gap:8px!important;margin:8px 0!important}.timer-page .r90-timer-action{min-height:52px!important;height:52px!important;padding:7px 8px!important;font-size:clamp(14px,3.4vw,17px)!important;line-height:1.1!important;font-weight:800!important}.timer-page .r89-back-scoring{margin-bottom:8px!important}.r90-timer-settings-btn{background:#0b2f5b!important;color:#fff!important}
    .r90-time-grid{display:grid;gap:0}.r90-time-grid label{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 0;border-bottom:1px solid #e4e7ec;font-weight:800}.r90-time-grid label>div{display:flex;align-items:center;gap:7px}.r90-time-grid input{width:82px;height:42px;text-align:center;font-size:18px;font-weight:800;border:1px solid #b8c3cf;border-radius:9px}.r90-time-grid small{color:#667085}
    .home{min-height:100dvh!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important}.home .club-logo{max-width:122px!important}.home .home-menu{gap:11px!important;margin-top:18px!important}.home .tagline{margin-bottom:15px!important}.home .lang-switch-v11{position:static!important;top:auto!important;right:auto!important;left:auto!important;margin:15px auto 0!important;transform:scale(.86)!important;transform-origin:center top!important;order:initial!important}.home .home-footer{margin-top:auto!important;padding-top:20px!important;padding-bottom:max(12px,env(safe-area-inset-bottom))!important}
    @media(max-height:800px){.home .club-logo{max-width:104px!important}.home .home-menu{gap:8px!important;margin-top:12px!important}.home .tagline{margin-bottom:10px!important}.home .lang-switch-v11{margin-top:10px!important}.home .home-footer{padding-top:12px!important}}
  `;document.head.appendChild(style);
})();
