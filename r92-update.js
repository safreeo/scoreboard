/* SCOREBOARD R92 — deterministic Session language, Timer navigation, Home spacing */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';
  const n=(v,f)=>Math.max(1,Number(v)||f);

  /* Build Session Settings directly so the ENG/BM buttons cannot be removed by
     older cleanup/patch layers. */
  window.openSessionSettings=function(){
    if(!S.session||document.getElementById('sessionSettingsDialog'))return;
    const bm=isBM(),lang=bm?'bm':'en',o=document.createElement('div');
    const laneOn=S.setup.lane!==false,groupOn=S.setup.group!==false;
    const a=S.session.archers?.[S.session.idx||0]||S.session.archers?.[0];
    const laneValue=a?.lane ?? S.session.lane ?? S.setup.laneNumber ?? 1;
    const groupValue=a?.group ?? S.session.group ?? S.setup.groupNumber ?? 1;
    o.id='sessionSettingsDialog';o.className='modal-overlay';o.dataset.lang=lang;
    o.innerHTML=`<div class="modal-card r88-session-settings r92-session-settings">
      <h3>${bm?'TETAPAN SESI':'SESSION SETTINGS'}</h3>
      <div class="r88-setting-row r92-language-row"><b>${bm?'Bahasa':'Language'}</b><div class="r92-session-lang"><button type="button" id="r88LangEn" class="${lang==='en'?'active':''}" onclick="r88PickLang('en')">ENG</button><button type="button" id="r88LangBm" class="${lang==='bm'?'active':''}" onclick="r88PickLang('bm')">BM</button></div></div>
      <div class="r88-setting-row"><b>${bm?'Pemasa':'Timer'}</b><label class="r88-check"><input id="r88Timer" type="checkbox" ${S.setup.timer?'checked':''}> ${bm?'Aktif':'On'}</label></div>
      <div class="r88-setting-row"><b>Lane</b><div class="r92-toggle-value"><label class="r88-check"><input id="r90Lane" type="checkbox" ${laneOn?'checked':''} onchange="r90ToggleValue('lane')"> ${bm?'Aktif':'On'}</label><input id="r90LaneValue" class="r90-number" type="number" min="1" inputmode="numeric" value="${laneValue}" ${laneOn?'':'disabled'}></div></div>
      <div class="r88-setting-row"><b>Group</b><div class="r92-toggle-value"><label class="r88-check"><input id="r90Group" type="checkbox" ${groupOn?'checked':''} onchange="r90ToggleValue('group')"> ${bm?'Aktif':'On'}</label><input id="r90GroupValue" class="r90-number" type="number" min="1" inputmode="numeric" value="${groupValue}" ${groupOn?'':'disabled'}></div></div>
      <div class="r88-setting-row"><b>${bm?'Arrow / End':'Arrows / End'}</b><div class="r88-stepper"><button type="button" onclick="r88StepArrow(-1)">−</button><strong id="r88Arrow">${S.setup.arrows}</strong><button type="button" onclick="r88StepArrow(1)">+</button></div></div>
      <small class="r88-note">${bm?'Arrow boleh diubah sebelum markah pertama dimasukkan. Untuk mode Team, nombor Lane yang sama digunakan untuk semua pemanah kecuali Lane berlainan telah ditetapkan semasa Tetapan Latihan.':'Arrows can be changed before the first score is entered. In Team mode, the same Lane number is used for all archers unless different Lanes were assigned in Practice Setup.'}</small>
      <div class="modal-actions r88-actions"><button class="btn primary" onclick="applySessionSettings()">${bm?'GUNA':'APPLY'}</button><button class="btn soft" onclick="closeModal('sessionSettingsDialog')">${bm?'BATAL':'CANCEL'}</button></div>
    </div>`;
    document.body.appendChild(o);
  };

  /* Timer Settings is timer-only. Top Settings opens it; Back to Scoring always
     stays a navigation button and never gets rewritten into Settings. */
  window.openTimerQuickSettings=function(){
    if(document.getElementById('timerQuickSettings'))return;
    const bm=isBM(),o=document.createElement('div');o.id='timerQuickSettings';o.className='modal-overlay';
    o.innerHTML=`<div class="modal-card r92-timer-settings"><h3>${bm?'TETAPAN TIMER':'TIMER SETTINGS'}</h3>
      <div class="r92-time-fields">
        <label><b>${bm?'Persediaan':'Preparation'}</b><div><input id="r92Prep" type="number" min="1" inputmode="numeric" value="${n(S.timer.prep,10)}"><span>${bm?'saat':'sec'}</span></div></label>
        <label><b>${bm?'Panahan':'Shooting'}</b><div><input id="r92Shoot" type="number" min="1" inputmode="numeric" value="${n(S.timer.shoot,60)}"><span>${bm?'saat':'sec'}</span></div></label>
        <label><b>${bm?'Amaran':'Warning'}</b><div><input id="r92Warn" type="number" min="1" inputmode="numeric" value="${n(S.timer.warn,10)}"><span>${bm?'saat':'sec'}</span></div></label>
      </div><div class="modal-actions r92-timer-actions"><button class="btn primary" onclick="r92ApplyTimerSettings()">${bm?'GUNA':'APPLY'}</button><button class="btn soft" onclick="closeModal('timerQuickSettings')">${bm?'BATAL':'CANCEL'}</button></div></div>`;
    document.body.appendChild(o);
  };
  window.r92ApplyTimerSettings=function(){
    S.timer={...S.timer,prep:n(document.getElementById('r92Prep')?.value,10),shoot:n(document.getElementById('r92Shoot')?.value,60),warn:n(document.getElementById('r92Warn')?.value,10)};
    save();closeModal('timerQuickSettings');resetArcheryTimer();
  };

  function fixTimer(){
    const p=document.querySelector('.timer-page');if(!p)return;
    const bs=[...p.querySelectorAll('button')];
    const top=bs.find(b=>/^\s*‹\s*(Settings|Tetapan)\s*$/i.test(b.textContent||''));
    if(top){top.onclick=(e)=>{e.preventDefault();e.stopPropagation();openTimerQuickSettings();};}
    let back=p.querySelector('.r89-back-scoring');
    if(back){back.textContent=isBM()?'KEMBALI KE SCORING':'BACK TO SCORING';back.onclick=(e)=>{e.preventDefault();e.stopPropagation();scoring();};back.classList.remove('r90-timer-settings-btn');}
    const legend=[...p.querySelectorAll('div,span,b')];
    const map=isBM()?{Preparation:'Persediaan',Shooting:'Panahan',Warning:'Amaran',Stop:'Berhenti'}:{Persediaan:'Preparation',Panahan:'Shooting',Amaran:'Warning',Berhenti:'Stop'};
    legend.forEach(el=>{if(el.children.length===0){const t=(el.textContent||'').trim();if(map[t])el.textContent=map[t];}});
  }

  function fixHome(){
    const h=document.querySelector('.home');if(!h)return;
    const sw=h.querySelector('.lang-switch-v11'),footer=h.querySelector('.home-footer');
    if(sw){sw.style.setProperty('margin-top','30px','important');sw.style.setProperty('margin-bottom','22px','important');}
    if(footer){footer.style.setProperty('display','block','important');footer.style.setProperty('visibility','visible','important');footer.style.setProperty('opacity','1','important');}
  }
  function enhance(){fixTimer();fixHome();}
  document.addEventListener('click',()=>setTimeout(enhance,60),true);
  document.addEventListener('change',()=>setTimeout(enhance,60),true);
  new MutationObserver(()=>setTimeout(enhance,20)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(enhance,120);

  const style=document.createElement('style');style.textContent=`
    .r92-session-settings .r92-language-row{display:flex!important}.r92-session-lang{display:flex!important;visibility:visible!important;opacity:1!important;gap:6px!important;min-width:112px!important}.r92-session-lang button{display:block!important;visibility:visible!important;opacity:1!important;border:1px solid #b8c3cf!important;background:#eef2f6!important;color:#0b2f5b!important;border-radius:10px!important;min-width:48px!important;height:42px!important;font-weight:800!important;font-size:16px!important}.r92-session-lang button.active{background:#0b2f5b!important;color:#fff!important;border-color:#0b2f5b!important}.r92-toggle-value{display:flex;align-items:center;gap:10px}
    .r92-time-fields{display:grid;gap:14px;margin-top:12px}.r92-time-fields label>b{display:block;margin-bottom:7px;font-size:17px}.r92-time-fields label>div{height:54px;border:1.5px solid #b8c3cf;border-radius:12px;display:flex;align-items:center;padding:0 15px;background:#fff}.r92-time-fields input{flex:1;min-width:0;border:0!important;outline:0!important;background:transparent!important;font-size:20px!important;box-shadow:none!important}.r92-time-fields span{font-weight:800;color:#667085}.r92-timer-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin-top:18px!important}.r92-timer-actions .btn{width:100%!important;margin:0!important}
    .timer-page .r89-timer-row{gap:7px!important;margin:7px 0!important}.timer-page .r89-back-scoring{margin:0 0 7px!important}.timer-page .timer-actions{gap:7px!important}.timer-page .r90-timer-action{margin-top:0!important;margin-bottom:0!important}
    .home .lang-switch-v11{margin-top:30px!important;margin-bottom:22px!important}.home .home-footer{display:block!important;visibility:visible!important;opacity:1!important;margin-top:auto!important}
    @media(max-height:800px){.home .lang-switch-v11{margin-top:20px!important;margin-bottom:14px!important}}
  `;document.head.appendChild(style);
})();
