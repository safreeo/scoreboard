/* SCOREBOARD R88 — Session Settings + compact Home */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';
  const hasAnyScore=()=>!!S.session?.archers?.some(a=>a.scores?.some(r=>r?.some(e=>e?.some(v=>v!==''&&v!=null))));

  /* Resume uses the same dark navy as the SCOREBOARD identity. */
  const baseHomeR88=home;
  home=function(){ baseHomeR88(); };

  /* Add Session Settings to scoring navigation without removing existing controls. */
  const baseBottomNavHTML=bottomNavHTML;
  bottomNavHTML=function(){
    const html=baseBottomNavHTML();
    return html.replace('</nav>',`<button onclick="openSessionSettings()"><span class="nav-icon nav-emoji">⚙</span><small>${isBM()?'Tetapan':'Settings'}</small></button></nav>`)
      .replace('compact-bottom-nav six-items','compact-bottom-nav r88-seven-items')
      .replace('compact-bottom-nav ','compact-bottom-nav r88-six-items ');
  };

  window.openSessionSettings=function(){
    if(!S.session||document.getElementById('sessionSettingsDialog'))return;
    const bm=isBM(),overlay=document.createElement('div');
    overlay.id='sessionSettingsDialog';overlay.className='modal-overlay';
    const lang=bm?'bm':'en';
    overlay.innerHTML=`<div class="modal-card r88-session-settings">
      <h3>${bm?'TETAPAN SESI':'SESSION SETTINGS'}</h3>
      <div class="r88-setting-row"><b>${bm?'Bahasa':'Language'}</b><div class="r88-choice"><button id="r88LangEn" class="${lang==='en'?'active':''}" onclick="r88PickLang('en')">ENG</button><button id="r88LangBm" class="${lang==='bm'?'active':''}" onclick="r88PickLang('bm')">BM</button></div></div>
      <div class="r88-setting-row"><b>${bm?'Pemasa':'Timer'}</b><label class="r88-check"><input id="r88Timer" type="checkbox" ${S.setup.timer?'checked':''}> ${bm?'Aktif':'On'}</label></div>
      <div class="r88-setting-row"><b>${bm?'Arrow / End':'Arrows / End'}</b><div class="r88-stepper"><button onclick="r88StepArrow(-1)">−</button><strong id="r88Arrow">${S.setup.arrows}</strong><button onclick="r88StepArrow(1)">+</button></div></div>
      <small class="r88-note">${bm?'Arrow boleh diubah sebelum markah pertama dimasukkan. Selepas scoring bermula, ia dikunci supaya markah dan peratus kekal tepat.':'Arrows can be changed before the first score is entered. After scoring begins it is locked so totals and percentages remain accurate.'}</small>
      <div class="modal-actions r88-actions"><button class="btn primary" onclick="applySessionSettings()">${bm?'GUNA':'APPLY'}</button><button class="btn soft" onclick="closeModal('sessionSettingsDialog')">${bm?'BATAL':'CANCEL'}</button></div>
    </div>`;
    overlay.dataset.lang=lang;
    document.body.appendChild(overlay);
  };

  window.r88PickLang=function(lang){
    const d=document.getElementById('sessionSettingsDialog');if(!d)return;d.dataset.lang=lang;
    document.getElementById('r88LangEn')?.classList.toggle('active',lang==='en');
    document.getElementById('r88LangBm')?.classList.toggle('active',lang==='bm');
  };
  window.r88StepArrow=function(delta){
    const el=document.getElementById('r88Arrow');if(!el)return;
    el.textContent=Math.max(1,Math.min(12,(Number(el.textContent)||S.setup.arrows)+delta));
  };

  window.applySessionSettings=function(){
    const d=document.getElementById('sessionSettingsDialog');if(!d||!S.session)return;
    const bm=isBM(),newArrows=Math.max(1,Number(document.getElementById('r88Arrow')?.textContent)||S.setup.arrows);
    if(newArrows!==S.setup.arrows){
      if(hasAnyScore()){
        alert(bm?'Arrow / End tidak boleh diubah selepas markah telah dimasukkan. Sila ubah sebelum scoring bermula. Tetapan bahasa dan pemasa masih boleh digunakan.':'Arrows / End cannot be changed after scores have been entered. Change it before scoring begins. Language and timer settings can still be applied.');
      }else{
        S.setup.arrows=newArrows;S.session.setup.arrows=newArrows;
        S.session.archers.forEach(a=>a.scores.forEach(r=>r.forEach(e=>{while(e.length<newArrows)e.push('');if(e.length>newArrows)e.length=newArrows;})));
      }
    }
    S.setup.timer=!!document.getElementById('r88Timer')?.checked;S.session.setup.timer=S.setup.timer;
    saveUnfinished();
    const lang=d.dataset.lang||'en';closeModal('sessionSettingsDialog');
    if(window.setScoreboardLanguage)window.setScoreboardLanguage(lang);
    scoring();
  };

  const style=document.createElement('style');
  style.textContent=`
    .r87-resume-session{background:#0b2f5b!important;box-shadow:0 0 0 3px rgba(11,47,91,.10),0 7px 15px rgba(0,0,0,.07)!important}
    .home .home-menu{gap:12px!important;margin-top:20px!important}
    .home .homebtn{min-height:68px!important;padding:10px 20px!important;border-radius:20px!important}
    .home .homebtn b{font-size:clamp(18px,4.2vw,25px)!important}
    .home .home-icon{width:48px!important;height:48px!important;font-size:25px!important}
    .home .club-logo{max-width:128px!important}
    .home .app-title{font-size:clamp(34px,8vw,48px)!important;margin-top:10px!important}
    .home .tagline{margin-bottom:12px!important}
    .home .lang-switch-v11{margin:10px auto 2px!important;transform:scale(.86);transform-origin:center top}
    .r88-six-items,.r88-seven-items{grid-template-columns:repeat(6,minmax(0,1fr))!important}
    .r88-seven-items{grid-template-columns:repeat(7,minmax(0,1fr))!important}
    .r88-six-items button,.r88-seven-items button{min-width:0!important;padding-left:2px!important;padding-right:2px!important}
    .r88-six-items small,.r88-seven-items small{font-size:9px!important}
    .r88-session-settings .r88-setting-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 0;border-bottom:1px solid #e4e7ec}
    .r88-choice,.r88-stepper{display:flex;align-items:center;gap:6px}
    .r88-choice button,.r88-stepper button{border:1px solid #b8c3cf;background:#eef2f6;color:#0b2f5b;border-radius:10px;min-width:48px;height:42px;font-weight:800;font-size:16px}
    .r88-choice button.active{background:#0b2f5b;color:#fff;border-color:#0b2f5b}
    .r88-stepper strong{min-width:42px;text-align:center;font-size:22px;color:#0b2f5b}
    .r88-check{font-weight:700}.r88-check input{width:22px;height:22px;vertical-align:middle}
    .r88-note{display:block;color:#667085;line-height:1.45;margin:14px 0}
    .r88-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}.r88-actions .btn{margin:0!important;width:100%!important}
    @media(max-height:800px){.home .club-logo{max-width:105px!important}.home .home-menu{gap:8px!important;margin-top:12px!important}.home .homebtn{min-height:58px!important}.home .home-icon{width:42px!important;height:42px!important}.home .tagline{margin-bottom:6px!important}}
  `;
  document.head.appendChild(style);
})();
