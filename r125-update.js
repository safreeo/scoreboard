/* SCOREBOARD R126 — live paused-session language + truly compact paused actions */
(function(){
  const lang=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm'?'bm':'en';
  function findPausedCard(){
    const setup=document.querySelector('.setup-page');if(!setup)return null;
    const buttons=[...setup.querySelectorAll('button')];
    const action=buttons.find(b=>/RESUME SESSION|SAMBUNG SESI|DISCARD|BUANG|BATALKAN/i.test((b.textContent||'').trim()));
    if(!action)return null;
    let el=action.parentElement;
    while(el&&el!==setup){
      const txt=(el.textContent||'');
      if(/PAUSED SESSION|SESI DIJEDA|Last saved:|Terakhir disimpan:/i.test(txt)&&el.querySelectorAll('button').length>=2)return el;
      el=el.parentElement;
    }
    return action.parentElement?.parentElement||null;
  }
  function paintPausedCard(){
    const card=findPausedCard();if(!card)return;
    card.classList.add('r126-paused-card');
    const bm=lang()==='bm';
    const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      const s=n.nodeValue||'',t=s.trim();if(!t)return;
      if(/^(⏸\s*)?(PAUSED SESSION|SESI DIJEDA)$/i.test(t))n.nodeValue=s.replace(t,bm?'⏸ SESI DIJEDA':'⏸ PAUSED SESSION');
      else if(/^Last saved:/i.test(t)&&bm)n.nodeValue=s.replace(/Last saved:/i,'Terakhir disimpan:');
      else if(/^Terakhir disimpan:/i.test(t)&&!bm)n.nodeValue=s.replace(/Terakhir disimpan:/i,'Last saved:');
    });
    [...card.querySelectorAll('button')].forEach(b=>{
      const t=(b.textContent||'').trim();
      if(/RESUME SESSION|SAMBUNG SESI/i.test(t)){
        b.classList.add('r126-paused-action','r126-resume');
        b.textContent=bm?'SAMBUNG SESI':'RESUME SESSION';
      }else if(/^DISCARD$|^BUANG$|^BATALKAN$/i.test(t)){
        b.classList.add('r126-paused-action','r126-discard');
        b.textContent=bm?'BUANG':'DISCARD';
      }
    });
  }
  function refineHome(){
    const home=document.querySelector('.home');if(!home)return;
    const logo=home.querySelector('.club-logo');if(logo)logo.classList.add('r126-logo');
    const sw=home.querySelector('.lang-switch-v11');if(sw)sw.classList.add('r126-lang');
    home.classList.toggle('r126-has-resume',!!home.querySelector('.r87-resume-session'));
  }
  function refine(){refineHome();paintPausedCard();}
  const originalSet=window.setScoreboardLanguage;
  if(typeof originalSet==='function')window.setScoreboardLanguage=function(l){const v=originalSet.apply(this,arguments);setTimeout(()=>{refine();},0);setTimeout(()=>{paintPausedCard();},80);return v;};
  document.addEventListener('click',()=>setTimeout(refine,0),true);
  new MutationObserver(()=>requestAnimationFrame(refine)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(refine,60);
  const s=document.createElement('style');s.textContent=`
    .home.r126-has-resume .lang-switch-v11.r126-lang{margin:14px auto 8px!important;transform:scale(.82)!important;transform-origin:center center!important;flex-shrink:0!important;position:relative!important;z-index:4!important}
    .home.r126-has-resume .home-footer{padding-top:10px!important;flex-shrink:0!important}
    .home.r126-has-resume{padding-bottom:max(10px,env(safe-area-inset-bottom))!important}
    @media(max-height:900px){.home.r126-has-resume .home-menu{gap:8px!important;margin-top:12px!important}.home.r126-has-resume .homebtn{min-height:58px!important;padding-top:7px!important;padding-bottom:7px!important}.home.r126-has-resume .club-logo{max-width:108px!important}.home.r126-has-resume .app-title{margin-top:6px!important}.home.r126-has-resume .tagline{margin-bottom:4px!important}.home.r126-has-resume .lang-switch-v11.r126-lang{margin:9px auto 5px!important;transform:scale(.78)!important}.home.r126-has-resume .home-footer{padding-top:5px!important;padding-bottom:max(8px,env(safe-area-inset-bottom))!important}}
    .home .club-logo.r126-logo{filter:drop-shadow(0 9px 9px rgba(11,47,91,.24)) drop-shadow(0 2px 2px rgba(0,0,0,.16))!important}
    .setup-page .r126-paused-card .r126-paused-action{min-height:44px!important;height:44px!important;padding:5px 10px!important;font-size:14px!important;line-height:1!important;font-weight:900!important;border-radius:12px!important;margin:0!important}
    .setup-page .r126-paused-card .r126-resume{background:#169b69!important;color:#fff!important;border-color:#169b69!important}
    .setup-page .r126-paused-card .r126-discard{background:#e53245!important;color:#fff!important;border-color:#e53245!important}
  `;document.head.appendChild(s);
})();