/* SCOREBOARD R125 — Home language clearance, logo depth, compact paused-session actions */
(function(){
  function refine(){
    const home=document.querySelector('.home');
    if(home){
      const logo=home.querySelector('.club-logo');if(logo)logo.classList.add('r125-logo');
      const lang=home.querySelector('.lang-switch-v11');if(lang)lang.classList.add('r125-lang');
      home.classList.toggle('r125-has-resume',!!home.querySelector('.r87-resume-session'));
    }
    const setup=document.querySelector('.setup-page');
    if(setup){
      const card=[...setup.querySelectorAll('*')].find(el=>el.children.length&&/PAUSED SESSION|SESI DIJEDA/i.test(el.textContent||'')&&el.querySelector('button'));
      const scope=card?.closest('.unfinished-card,.notice,.card,.setup-card')||card;
      if(scope){
        [...scope.querySelectorAll('button')].forEach(b=>{
          const t=(b.textContent||'').trim();
          if(/RESUME SESSION|SAMBUNG SESI/i.test(t))b.classList.add('r125-paused-action','r125-resume');
          else if(/^DISCARD$|BATALKAN$/i.test(t))b.classList.add('r125-paused-action','r125-discard');
        });
      }
    }
  }
  document.addEventListener('click',()=>setTimeout(refine,0),true);
  new MutationObserver(()=>requestAnimationFrame(refine)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(refine,60);
  const s=document.createElement('style');s.textContent=`
    /* Keep ENG/BM fully visible even when Resume Session adds another Home button. */
    .home.r125-has-resume .lang-switch-v11.r125-lang{margin:14px auto 8px!important;transform:scale(.82)!important;transform-origin:center center!important;flex-shrink:0!important;position:relative!important;z-index:4!important}
    .home.r125-has-resume .home-footer{padding-top:10px!important;flex-shrink:0!important}
    .home.r125-has-resume{padding-bottom:max(10px,env(safe-area-inset-bottom))!important}
    @media(max-height:900px){.home.r125-has-resume .home-menu{gap:8px!important;margin-top:12px!important}.home.r125-has-resume .homebtn{min-height:58px!important;padding-top:7px!important;padding-bottom:7px!important}.home.r125-has-resume .club-logo{max-width:108px!important}.home.r125-has-resume .app-title{margin-top:6px!important}.home.r125-has-resume .tagline{margin-bottom:4px!important}.home.r125-has-resume .lang-switch-v11.r125-lang{margin:9px auto 5px!important;transform:scale(.78)!important}.home.r125-has-resume .home-footer{padding-top:5px!important;padding-bottom:max(8px,env(safe-area-inset-bottom))!important}}
    /* Slight raised/shadow effect for the Home logo. */
    .home .club-logo.r125-logo{filter:drop-shadow(0 9px 9px rgba(11,47,91,.24)) drop-shadow(0 2px 2px rgba(0,0,0,.16))!important}
    /* Paused Session card: actions match the compact PERSONAL button scale. */
    .setup-page .r125-paused-action{min-height:58px!important;height:58px!important;padding:7px 12px!important;font-size:clamp(16px,3.7vw,20px)!important;line-height:1.05!important;font-weight:900!important;border-radius:15px!important;margin:0!important}
    .setup-page .r125-resume{background:#169b69!important;color:#fff!important;border-color:#169b69!important}
    .setup-page .r125-discard{background:#e53245!important;color:#fff!important;border-color:#e53245!important}
  `;document.head.appendChild(s);
})();