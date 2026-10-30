/* SCOREBOARD R91 — Session language, scoring Lane/Group, timer-only settings, Home footer */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';
  const n=(v,f)=>Math.max(1,Number(v)||f);

  /* Keep the language choice visible inside Session Settings even when the global
     language cleanup removes switches outside Home. */
  const baseSession=window.openSessionSettings;
  window.openSessionSettings=function(){
    baseSession?.();
    const d=document.getElementById('sessionSettingsDialog');
    if(!d)return;
    let choice=d.querySelector('.r90-lang-choice,.r89-lang-choice,.r88-choice');
    const row=[...d.querySelectorAll('.r88-setting-row')].find(r=>/Language|Bahasa/i.test(r.textContent||''));
    if(row){
      if(!choice){choice=document.createElement('div');choice.className='r88-choice r91-session-lang';row.appendChild(choice);}
      choice.classList.add('r91-session-lang');
      choice.innerHTML=`<button type="button" id="r88LangEn" class="${d.dataset.lang==='en'?'active':''}" onclick="r88PickLang('en')">ENG</button><button type="button" id="r88LangBm" class="${d.dataset.lang==='bm'?'active':''}" onclick="r88PickLang('bm')">BM</button>`;
    }
  };

  /* Dedicated Timer Settings — deliberately independent from Session Settings. */
  window.openTimerQuickSettings=function(){
    if(document.getElementById('timerQuickSettings'))return;
    const bm=isBM(),o=document.createElement('div');
    o.id='timerQuickSettings';o.className='modal-overlay';
    o.innerHTML=`<div class="modal-card r91-timer-settings">
      <h3>${bm?'TETAPAN TIMER':'TIMER SETTINGS'}</h3>
      <div class="r91-time-fields">
        <label><b>${bm?'Persediaan':'Preparation'}</b><div class="r91-time-input"><input id="r91Prep" type="number" min="1" inputmode="numeric" value="${n(S.timer.prep,10)}"><span>${bm?'saat':'sec'}</span></div></label>
        <label><b>${bm?'Panahan':'Shooting'}</b><div class="r91-time-input"><input id="r91Shoot" type="number" min="1" inputmode="numeric" value="${n(S.timer.shoot,120)}"><span>${bm?'saat':'sec'}</span></div></label>
        <label><b>${bm?'Amaran':'Warning'}</b><div class="r91-time-input"><input id="r91Warn" type="number" min="1" inputmode="numeric" value="${n(S.timer.warn,10)}"><span>${bm?'saat':'sec'}</span></div></label>
      </div>
      <div class="modal-actions r91-timer-actions"><button class="btn primary" onclick="r91ApplyTimerSettings()">${bm?'GUNA':'APPLY'}</button><button class="btn soft" onclick="closeModal('timerQuickSettings')">${bm?'BATAL':'CANCEL'}</button></div>
    </div>`;
    document.body.appendChild(o);
  };
  window.r91ApplyTimerSettings=function(){
    S.timer={...S.timer,prep:n(document.getElementById('r91Prep')?.value,10),shoot:n(document.getElementById('r91Shoot')?.value,120),warn:n(document.getElementById('r91Warn')?.value,10)};
    save();closeModal('timerQuickSettings');resetArcheryTimer();
  };

  function fixTimerButtons(){
    if(!document.querySelector('.timer-page'))return;
    const bs=[...document.querySelectorAll('.timer-page button')];
    const settings=bs.filter(b=>/Settings|Tetapan/i.test(b.textContent||''));
    settings.forEach(b=>{b.onclick=(e)=>{e.preventDefault();e.stopPropagation();openTimerQuickSettings();};});
  }

  /* Show selected Lane / Group in the scoring header. Values can come from the
     original lane/group maps or from the live Session Settings fields. */
  function scoringMeta(){
    const header=document.querySelector('.scoring-page .score-head-title');
    if(!header||!S.session)return;
    const a=activeArcher?.();if(!a)return;
    const small=header.querySelector('small');if(!small)return;
    small.querySelectorAll?.('.r91-score-meta');
    let lane=S.session.lanes?.[a.name] ?? a.lane ?? S.session.lane ?? S.setup.laneNumber;
    let group=S.session.groups?.[a.name] ?? S.session.groups?.['__personal__'] ?? a.group ?? S.session.group ?? S.setup.groupNumber;
    let text=small.textContent||'';
    text=text.replace(/\s*•\s*LANE\s+[^•]+/ig,'').replace(/\s*•\s*GROUP\s+[^•]+/ig,'').trim();
    if(S.setup.lane&&lane!=null&&String(lane)!=='')text+=` • LANE ${lane}`;
    if(S.setup.group&&group!=null&&String(group)!=='')text+=` • GROUP ${group}`;
    small.textContent=text;
  }

  function fixHome(){
    const home=document.querySelector('.home');if(!home)return;
    const sw=home.querySelector('.lang-switch-v11');
    const footer=home.querySelector('.home-footer');
    if(sw&&footer&&sw.nextElementSibling!==footer)footer.parentNode.insertBefore(sw,footer);
    if(footer){footer.style.display='block';footer.style.visibility='visible';footer.style.opacity='1';}
  }

  function enhance(){fixTimerButtons();scoringMeta();fixHome();}
  document.addEventListener('click',()=>setTimeout(enhance,20),true);
  document.addEventListener('change',()=>setTimeout(enhance,20),true);
  new MutationObserver(()=>setTimeout(enhance,0)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(enhance,80);

  const style=document.createElement('style');style.textContent=`
    .r91-session-lang{display:flex!important;visibility:visible!important;opacity:1!important;gap:6px!important}.r91-session-lang button{display:block!important;visibility:visible!important;opacity:1!important;min-width:48px!important;height:42px!important}
    .r91-time-fields{display:grid;gap:18px;margin-top:12px}.r91-time-fields label{display:block}.r91-time-fields label>b{display:block;margin:0 0 7px;font-size:17px}.r91-time-input{height:54px;border:1.5px solid #b8c3cf;border-radius:12px;display:flex;align-items:center;padding:0 15px;background:#fff}.r91-time-input input{flex:1;min-width:0;border:0!important;outline:0!important;background:transparent!important;font-size:20px!important;padding:0!important;height:auto!important;box-shadow:none!important}.r91-time-input span{font-weight:800;color:#667085}.r91-timer-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin-top:20px!important}.r91-timer-actions .btn{width:100%!important;margin:0!important}
    .home{min-height:100svh!important;min-height:100dvh!important}.home .lang-switch-v11{margin-top:22px!important;margin-bottom:14px!important}.home .home-footer{display:block!important;visibility:visible!important;opacity:1!important;margin-top:auto!important;flex-shrink:0!important;padding-top:16px!important;padding-bottom:max(16px,env(safe-area-inset-bottom))!important}
    @media(max-height:800px){.home .lang-switch-v11{margin-top:14px!important;margin-bottom:8px!important}.home .home-footer{padding-top:8px!important;padding-bottom:max(8px,env(safe-area-inset-bottom))!important}}
  `;document.head.appendChild(style);
})();
