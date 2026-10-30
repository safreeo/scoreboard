/* SCOREBOARD R93 — stable session language controls + timer layout */
(function(){
  const bm=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';

  /* The global language observer removes .lang-switch-v11 outside Home. Previous
     session choices inherited older choice classes and were therefore vulnerable.
     Recreate a neutral, dedicated control whenever Session Settings is open. */
  function ensureSessionLanguage(){
    const d=document.getElementById('sessionSettingsDialog');if(!d)return;
    const rows=[...d.querySelectorAll('.r88-setting-row')];
    const row=rows.find(r=>/^(Language|Bahasa)/i.test((r.textContent||'').trim()));if(!row)return;
    let box=row.querySelector('.r93-session-language');
    if(!box){
      row.querySelectorAll('.r88-choice,.r89-lang-choice,.r90-lang-choice,.r91-session-lang,.r92-session-lang,.lang-switch-v11').forEach(x=>x.remove());
      box=document.createElement('div');box.className='r93-session-language';row.appendChild(box);
    }
    const lang=d.dataset.lang|| (bm()?'bm':'en');
    box.innerHTML=`<button type="button" class="${lang==='en'?'active':''}" data-lang="en">ENG</button><button type="button" class="${lang==='bm'?'active':''}" data-lang="bm">BM</button>`;
    box.querySelectorAll('button').forEach(b=>b.onclick=(e)=>{e.preventDefault();e.stopPropagation();const l=b.dataset.lang;d.dataset.lang=l;window.r88PickLang?.(l);setTimeout(ensureSessionLanguage,30);});
  }

  function timerLayout(){
    const p=document.querySelector('.timer-page');if(!p)return;
    const isMalay=bm(),buttons=[...p.querySelectorAll('button')];
    const pause=buttons.find(b=>/PAUSE\s*\/\s*RESUME|JEDA\s*\/\s*SAMBUNG/i.test(b.textContent||''));
    const reset=buttons.find(b=>/^\s*(RESET|SET SEMULA|TETAP SEMULA)\s*$/i.test(b.textContent||''));
    if(reset)reset.textContent='RESET';
    if(pause&&reset){
      let row=p.querySelector('.r93-pause-reset');
      if(!row){row=document.createElement('div');row.className='r93-pause-reset';pause.parentNode.insertBefore(row,pause);row.append(pause,reset);}else if(pause.parentNode!==row||reset.parentNode!==row)row.append(pause,reset);
    }
    const back=p.querySelector('.r89-back-scoring');
    if(back){back.textContent=isMalay?'KEMBALI KE SCORING':'BACK TO SCORING';back.onclick=(e)=>{e.preventDefault();e.stopPropagation();scoring();};}
    const top=buttons.find(b=>/^\s*‹\s*(Settings|Tetapan)\s*$/i.test(b.textContent||''));
    if(top)top.onclick=(e)=>{e.preventDefault();e.stopPropagation();openTimerQuickSettings();};
    const labels={Preparation:isMalay?'Persediaan':'Preparation',Persediaan:isMalay?'Persediaan':'Preparation',Shooting:isMalay?'Panahan':'Shooting',Panahan:isMalay?'Panahan':'Shooting',Warning:isMalay?'Amaran':'Warning',Amaran:isMalay?'Amaran':'Warning',Stop:isMalay?'Berhenti':'Stop',Berhenti:isMalay?'Berhenti':'Stop'};
    p.querySelectorAll('div,span,b').forEach(el=>{if(!el.children.length){const t=(el.textContent||'').trim();if(labels[t])el.textContent=labels[t];}});
  }

  function home(){const h=document.querySelector('.home');if(!h)return;const logo=h.querySelector('.club-logo');if(logo)logo.style.setProperty('max-width','134px','important');}
  function run(){ensureSessionLanguage();timerLayout();home();}
  document.addEventListener('click',()=>setTimeout(run,80),true);
  document.addEventListener('change',()=>setTimeout(run,80),true);
  new MutationObserver(()=>setTimeout(run,30)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(run,150);

  const s=document.createElement('style');s.textContent=`
    .r93-session-language{display:flex!important;align-items:center!important;gap:6px!important;margin-left:auto!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:20!important}.r93-session-language button{display:block!important;min-width:52px!important;height:42px!important;padding:0 10px!important;border:1px solid #b8c3cf!important;border-radius:10px!important;background:#eef2f6!important;color:#0b2f5b!important;font-size:15px!important;font-weight:900!important;visibility:visible!important;opacity:1!important}.r93-session-language button.active{background:#0b2f5b!important;color:#fff!important;border-color:#0b2f5b!important}
    .timer-page .r93-pause-reset{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;width:100%!important;margin:8px 0!important}.timer-page .r93-pause-reset button{width:100%!important;margin:0!important;min-height:54px!important}.timer-page .r89-back-scoring{margin-top:0!important;margin-bottom:10px!important}
    .home .club-logo{max-width:134px!important}
    @media(max-height:800px){.home .club-logo{max-width:114px!important}}
  `;document.head.appendChild(s);
})();
