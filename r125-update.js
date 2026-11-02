/* SCOREBOARD R127 — paused-session actions fixed at HTML source */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';

  /* Patch the generated unfinished-session card itself. This avoids depending on its outer card class. */
  if(typeof unfinishedHTML==='function'){
    const base=unfinishedHTML;
    unfinishedHTML=function(data){
      const html=base(data),holder=document.createElement('div');holder.innerHTML=html;
      const bm=isBM();
      [...holder.querySelectorAll('button')].forEach(b=>{
        const t=(b.textContent||'').trim();
        if(/RESUME SESSION|SAMBUNG SESI|^RESUME$/i.test(t)){
          b.textContent=bm?'SAMBUNG SESI':'RESUME SESSION';
          b.classList.add('r127-paused-action','r127-resume');
          b.style.cssText+=';min-height:44px!important;height:44px!important;padding:5px 10px!important;font-size:14px!important;line-height:1!important;font-weight:900!important;border-radius:12px!important;margin:0!important;background:#169b69!important;color:#fff!important;border-color:#169b69!important;';
        }else if(/^DISCARD$|^BUANG$|^BATALKAN$/i.test(t)){
          b.textContent=bm?'BUANG':'DISCARD';
          b.classList.add('r127-paused-action','r127-discard');
          b.style.cssText+=';min-height:44px!important;height:44px!important;padding:5px 10px!important;font-size:14px!important;line-height:1!important;font-weight:900!important;border-radius:12px!important;margin:0!important;background:#e53245!important;color:#fff!important;border-color:#e53245!important;';
        }
      });
      const walker=document.createTreeWalker(holder,NodeFilter.SHOW_TEXT);let n;
      while(n=walker.nextNode()){
        const t=(n.nodeValue||'').trim();
        if(/^(⏸\s*)?(PAUSED SESSION|SESI DIJEDA)$/i.test(t))n.nodeValue=(n.nodeValue||'').replace(t,bm?'⏸ SESI DIJEDA':'⏸ PAUSED SESSION');
        else if(/^Last saved:/i.test(t)&&bm)n.nodeValue=(n.nodeValue||'').replace(/Last saved:/i,'Terakhir disimpan:');
        else if(/^Terakhir disimpan:/i.test(t)&&!bm)n.nodeValue=(n.nodeValue||'').replace(/Terakhir disimpan:/i,'Last saved:');
      }
      return holder.innerHTML;
    };
  }

  function refineHome(){
    const home=document.querySelector('.home');if(!home)return;
    const logo=home.querySelector('.club-logo');if(logo)logo.classList.add('r127-logo');
    const sw=home.querySelector('.lang-switch-v11');if(sw)sw.classList.add('r127-lang');
    home.classList.toggle('r127-has-resume',!!home.querySelector('.r87-resume-session'));
  }
  function forceExisting(){
    const setup=document.querySelector('.setup-page');if(!setup)return;
    const bm=isBM();
    [...setup.querySelectorAll('button')].forEach(b=>{
      const t=(b.textContent||'').trim();
      if(/RESUME SESSION|SAMBUNG SESI|^RESUME$/i.test(t)){
        b.textContent=bm?'SAMBUNG SESI':'RESUME SESSION';b.classList.add('r127-paused-action','r127-resume');
      }else if(/^DISCARD$|^BUANG$|^BATALKAN$/i.test(t)){b.textContent=bm?'BUANG':'DISCARD';b.classList.add('r127-paused-action','r127-discard');}
    });
  }
  function refine(){refineHome();forceExisting();}
  document.addEventListener('click',()=>setTimeout(refine,0),true);
  new MutationObserver(()=>requestAnimationFrame(refine)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(refine,60);

  const s=document.createElement('style');s.textContent=`
    .home.r127-has-resume .lang-switch-v11.r127-lang{margin:14px auto 8px!important;transform:scale(.82)!important;transform-origin:center!important;flex-shrink:0!important;position:relative!important;z-index:4!important}
    .home.r127-has-resume .home-footer{padding-top:10px!important;flex-shrink:0!important}.home.r127-has-resume{padding-bottom:max(10px,env(safe-area-inset-bottom))!important}
    @media(max-height:900px){.home.r127-has-resume .home-menu{gap:8px!important;margin-top:12px!important}.home.r127-has-resume .homebtn{min-height:58px!important;padding-top:7px!important;padding-bottom:7px!important}.home.r127-has-resume .club-logo{max-width:108px!important}.home.r127-has-resume .app-title{margin-top:6px!important}.home.r127-has-resume .tagline{margin-bottom:4px!important}.home.r127-has-resume .lang-switch-v11.r127-lang{margin:9px auto 5px!important;transform:scale(.78)!important}}
    .home .club-logo.r127-logo{filter:drop-shadow(0 9px 9px rgba(11,47,91,.24)) drop-shadow(0 2px 2px rgba(0,0,0,.16))!important}
    .setup-page button.r127-paused-action{min-height:44px!important;height:44px!important;max-height:44px!important;padding:5px 10px!important;font-size:14px!important;line-height:1!important;font-weight:900!important;border-radius:12px!important;margin:0!important}
    .setup-page button.r127-resume{background:#169b69!important;color:#fff!important;border-color:#169b69!important}.setup-page button.r127-discard{background:#e53245!important;color:#fff!important;border-color:#e53245!important}
  `;document.head.appendChild(s);
})();