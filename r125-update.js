/* SCOREBOARD R128 — target real unfinished-session card/actions directly */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';

  function fixPausedActions(){
    const card=document.querySelector('.setup-page .unfinished-card');
    if(!card)return;
    const bm=isBM();
    const actions=card.querySelector('.unfinished-actions');
    if(actions)actions.classList.add('r128-actions');
    [...card.querySelectorAll('button')].forEach(b=>{
      const t=(b.textContent||'').trim();
      if(/RESUME SESSION|SAMBUNG SESI|^RESUME$/i.test(t)){
        b.textContent=bm?'SAMBUNG SESI':'RESUME SESSION';
        b.classList.add('r128-paused-btn','r128-resume');
      } else if(/^DISCARD$|^BUANG$|^BATALKAN$/i.test(t)){
        b.textContent=bm?'BUANG':'DISCARD';
        b.classList.add('r128-paused-btn','r128-discard');
      }
    });
    const title=card.querySelector('.unfinished-title');
    if(title)title.textContent=bm?'⏸ SESI DIJEDA':'⏸ PAUSED SESSION';
    [...card.querySelectorAll('p')].forEach(p=>{
      if(/^Last saved:/i.test(p.textContent||'')&&bm)p.textContent=(p.textContent||'').replace(/Last saved:/i,'Terakhir disimpan:');
      else if(/^Terakhir disimpan:/i.test(p.textContent||'')&&!bm)p.textContent=(p.textContent||'').replace(/Terakhir disimpan:/i,'Last saved:');
    });
  }

  function refineHome(){
    const home=document.querySelector('.home');if(!home)return;
    const logo=home.querySelector('.club-logo,.home-logo');if(logo)logo.classList.add('r128-logo');
    const sw=home.querySelector('.lang-switch-v11');if(sw)sw.classList.add('r128-lang');
    home.classList.toggle('r128-has-resume',!!home.querySelector('.r87-resume-session'));
  }
  function refine(){refineHome();fixPausedActions();}

  const oldSet=window.setScoreboardLanguage;
  if(typeof oldSet==='function')window.setScoreboardLanguage=function(){const r=oldSet.apply(this,arguments);setTimeout(refine,0);setTimeout(refine,80);return r;};
  document.addEventListener('click',()=>setTimeout(refine,0),true);
  new MutationObserver(()=>requestAnimationFrame(refine)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(refine,60);

  const s=document.createElement('style');s.textContent=`
    .setup-page .unfinished-card .unfinished-actions.r128-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;align-items:center!important}
    .setup-page .unfinished-card .unfinished-actions button.r128-paused-btn{
      width:100%!important;min-height:54px!important;height:54px!important;max-height:54px!important;
      padding:7px 10px!important;margin:0!important;border-radius:11px!important;
      font-size:16px!important;line-height:1.05!important;font-weight:900!important;
      display:flex!important;align-items:center!important;justify-content:center!important;
    }
    .setup-page .unfinished-card .unfinished-actions button.r128-resume{background:#198754!important;color:#fff!important;border-color:#198754!important}
    .setup-page .unfinished-card .unfinished-actions button.r128-discard{background:#e53245!important;color:#fff!important;border-color:#e53245!important}
    .home .r128-logo{filter:drop-shadow(0 9px 9px rgba(11,47,91,.24)) drop-shadow(0 2px 2px rgba(0,0,0,.16))!important}
    .home.r128-has-resume .lang-switch-v11.r128-lang{margin:14px auto 8px!important;transform:scale(.82)!important;transform-origin:center!important;flex-shrink:0!important;position:relative!important;z-index:4!important}
  `;document.head.appendChild(s);
})();