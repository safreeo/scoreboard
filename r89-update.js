/* SCOREBOARD R89 — Timer controls, session Lane/Group, compact Home */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';

  /* Replace R88 session settings with complete controls. */
  window.openSessionSettings=function(){
    if(!S.session||document.getElementById('sessionSettingsDialog'))return;
    const bm=isBM(),overlay=document.createElement('div');
    overlay.id='sessionSettingsDialog';overlay.className='modal-overlay';
    const lang=bm?'bm':'en';
    const lane=S.setup.lane!==false,group=S.setup.group!==false;
    overlay.innerHTML=`<div class="modal-card r88-session-settings r89-session-settings">
      <h3>${bm?'TETAPAN SESI':'SESSION SETTINGS'}</h3>
      <div class="r88-setting-row"><b>${bm?'Bahasa':'Language'}</b><div class="r88-choice r89-lang-choice"><button type="button" id="r88LangEn" class="${lang==='en'?'active':''}" onclick="r88PickLang('en')">ENG</button><button type="button" id="r88LangBm" class="${lang==='bm'?'active':''}" onclick="r88PickLang('bm')">BM</button></div></div>
      <div class="r88-setting-row"><b>${bm?'Pemasa':'Timer'}</b><label class="r88-check"><input id="r88Timer" type="checkbox" ${S.setup.timer?'checked':''}> ${bm?'Aktif':'On'}</label></div>
      <div class="r88-setting-row"><b>${bm?'Arrow / End':'Arrows / End'}</b><div class="r88-stepper"><button type="button" onclick="r88StepArrow(-1)">−</button><strong id="r88Arrow">${S.setup.arrows}</strong><button type="button" onclick="r88StepArrow(1)">+</button></div></div>
      <div class="r88-setting-row"><b>Lane</b><label class="r88-check"><input id="r89Lane" type="checkbox" ${lane?'checked':''}> ${bm?'Aktif':'On'}</label></div>
      <div class="r88-setting-row"><b>Group</b><label class="r88-check"><input id="r89Group" type="checkbox" ${group?'checked':''}> ${bm?'Aktif':'On'}</label></div>
      <small class="r88-note">${bm?'Arrow boleh diubah sebelum markah pertama dimasukkan. Untuk mode Team, semua pemanah kekal dalam Lane yang sama kecuali Lane berlainan telah ditetapkan semasa Tetapan Latihan.':'Arrows can be changed before the first score is entered. In Team mode, all archers stay in the same Lane unless different Lanes were assigned in Practice Setup.'}</small>
      <div class="modal-actions r88-actions"><button class="btn primary" onclick="applySessionSettings()">${bm?'GUNA':'APPLY'}</button><button class="btn soft" onclick="closeModal('sessionSettingsDialog')">${bm?'BATAL':'CANCEL'}</button></div>
    </div>`;
    overlay.dataset.lang=lang;document.body.appendChild(overlay);
  };

  const r88Apply=window.applySessionSettings;
  window.applySessionSettings=function(){
    const d=document.getElementById('sessionSettingsDialog');if(!d||!S.session)return;
    const lane=!!document.getElementById('r89Lane')?.checked,group=!!document.getElementById('r89Group')?.checked;
    S.setup.lane=lane;S.setup.group=group;
    if(S.session.setup){S.session.setup.lane=lane;S.session.setup.group=group;}
    const team=(S.setup.mode==='team'||S.setup.practiceMode==='team'||S.setup.team===true);
    if(team&&lane&&Array.isArray(S.session.archers)){
      const explicit=S.session.archers.some(a=>a&&a.lane!=null&&String(a.lane)!=='');
      if(!explicit)S.session.archers.forEach(a=>{if(a)a.lane=1;});
    }
    r88Apply();
  };

  /* R108: R106+ owns the timer DOM. Never rewrite or inject timer buttons there. */
  function enhanceTimer(){
    if(document.querySelector('.r106-timer'))return;
    const title=[...document.querySelectorAll('h1,h2,h3,.page-title')].find(e=>/ARCHERY TIMER|PEMASA MEMANAH/i.test(e.textContent||''));
    if(!title)return;
    const buttons=[...document.querySelectorAll('button')];
    const back=buttons.find(b=>/Scoring|Pemarkahan/i.test(b.textContent||''));
    if(back)back.innerHTML=`‹ ${isBM()?'Tetapan':'Settings'}`,back.onclick=()=>openSessionSettings();
    const pause=buttons.find(b=>/PAUSE\s*\/\s*RESUME|JEDA\s*\/\s*SAMBUNG/i.test(b.textContent||''));
    const reset=buttons.find(b=>/^\s*(RESET|SET SEMULA)\s*$/i.test(b.textContent||''));
    if(pause&&reset&&!pause.parentElement?.classList.contains('r89-timer-row')){
      const row=document.createElement('div');row.className='r89-timer-row';pause.parentNode.insertBefore(row,pause);row.append(pause,reset);
      const scoringBtn=document.createElement('button');scoringBtn.className='btn r89-back-scoring';scoringBtn.textContent=isBM()?'KEMBALI KE SCORING':'BACK TO SCORING';scoringBtn.onclick=()=>scoring();row.insertAdjacentElement('afterend',scoringBtn);
    }
  }

  function enhanceScoringSettingsIcon(){
    document.querySelectorAll('.compact-bottom-nav button').forEach(b=>{if(/Settings|Tetapan/i.test(b.textContent||'')){b.classList.add('r89-settings-nav');const i=b.querySelector('.nav-icon');if(i)i.style.color='#fff';}});
  }
  function schedule(){setTimeout(()=>{enhanceTimer();enhanceScoringSettingsIcon()},40)}
  document.addEventListener('click',schedule,true);document.addEventListener('change',schedule,true);setTimeout(schedule,120);

  const style=document.createElement('style');style.textContent=`
    .home{position:relative!important;padding-top:14px!important}
    .home .club-logo{max-width:108px!important}
    .home .app-title{font-size:clamp(31px,7.2vw,43px)!important;margin-top:7px!important}
    .home .tagline{margin:2px 0 10px!important;font-size:clamp(15px,3.8vw,20px)!important}
    .home .home-menu{gap:8px!important;margin-top:10px!important}
    .home .homebtn{min-height:56px!important;height:56px!important;padding:6px 16px!important;border-radius:18px!important}
    .home .homebtn b{font-size:clamp(16px,3.8vw,22px)!important}
    .home .home-icon{width:40px!important;height:40px!important;font-size:22px!important}
    .home .lang-switch-v11{position:absolute!important;top:12px!important;right:14px!important;left:auto!important;margin:0!important;transform:scale(.82)!important;transform-origin:top right!important;z-index:5!important}
    .home .home-footer{margin-top:10px!important}
    .r89-lang-choice{display:flex!important;visibility:visible!important;opacity:1!important;min-width:112px!important}
    .r89-lang-choice button{display:block!important;visibility:visible!important;opacity:1!important}
    .r89-timer-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;width:100%!important;margin:10px 0!important}
    .r89-timer-row button{width:100%!important;margin:0!important;min-height:54px!important;padding:10px 6px!important;font-size:clamp(13px,3.4vw,18px)!important}
    .r89-back-scoring{width:100%!important;min-height:54px!important;margin:0 0 12px!important;background:#0b2f5b!important;color:#fff!important;font-weight:900!important}
    .r89-settings-nav .nav-icon{color:#fff!important;filter:none!important;-webkit-text-fill-color:#fff!important}
    .r89-session-settings .r88-setting-row{padding:11px 0!important}
    @media(max-height:800px){.home .club-logo{max-width:88px!important}.home .homebtn{height:50px!important;min-height:50px!important}.home .home-menu{gap:6px!important}.home .home-icon{width:36px!important;height:36px!important}.home .app-title{margin-top:4px!important}.home .tagline{margin-bottom:5px!important}}
  `;document.head.appendChild(style);
})();
