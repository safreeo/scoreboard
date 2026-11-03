/* SCOREBOARD R129 — robust paused-session action sizing + live BM/ENG */
(function(){
  const storedLang=()=> (localStorage.getItem('scoreboard_language_v11')==='bm'?'bm':'en');
  let forcedLang=null;

  function language(){
    return forcedLang || ((typeof window.getScoreboardLanguage==='function' && window.getScoreboardLanguage()==='bm') ? 'bm' : storedLang());
  }

  function pausedCard(){
    const buttons=[...document.querySelectorAll('button')];
    const resume=buttons.find(b=>/^(RESUME SESSION|SAMBUNG SESI|RESUME)$/i.test((b.textContent||'').trim()));
    if(!resume)return null;
    let el=resume.parentElement;
    while(el && el!==document.body){
      const txt=el.textContent||'';
      if(/PAUSED SESSION|SESI DIJEDA|Last saved:|Terakhir disimpan:/i.test(txt) && el.querySelectorAll('button').length>=2)return el;
      el=el.parentElement;
    }
    return null;
  }

  function styleAction(btn,color){
    if(!btn)return;
    btn.style.setProperty('width','100%','important');
    btn.style.setProperty('min-height','54px','important');
    btn.style.setProperty('height','54px','important');
    btn.style.setProperty('max-height','54px','important');
    btn.style.setProperty('padding','7px 10px','important');
    btn.style.setProperty('margin','0','important');
    btn.style.setProperty('border-radius','11px','important');
    btn.style.setProperty('font-size','16px','important');
    btn.style.setProperty('line-height','1','important');
    btn.style.setProperty('font-weight','900','important');
    btn.style.setProperty('display','flex','important');
    btn.style.setProperty('align-items','center','important');
    btn.style.setProperty('justify-content','center','important');
    btn.style.setProperty('white-space','nowrap','important');
    btn.style.setProperty('background',color,'important');
    btn.style.setProperty('color','#fff','important');
    btn.style.setProperty('border-color',color,'important');
  }

  function fixPaused(){
    const card=pausedCard();if(!card)return;
    const bm=language()==='bm';
    const buttons=[...card.querySelectorAll('button')];
    const resume=buttons.find(b=>/RESUME SESSION|SAMBUNG SESI|^RESUME$/i.test((b.textContent||'').trim()));
    const discard=buttons.find(b=>/^DISCARD$|^BUANG$|^BATALKAN$/i.test((b.textContent||'').trim()));
    if(resume){resume.textContent=bm?'SAMBUNG SESI':'RESUME SESSION';styleAction(resume,'#198754');}
    if(discard){discard.textContent=bm?'BUANG':'DISCARD';styleAction(discard,'#e53245');}
    const title=[...card.querySelectorAll('*')].find(el=>/^(⏸\s*)?(PAUSED SESSION|SESI DIJEDA)$/i.test((el.textContent||'').trim()) && el.children.length===0);
    if(title)title.textContent=bm?'⏸ SESI DIJEDA':'⏸ PAUSED SESSION';
    [...card.querySelectorAll('p')].forEach(p=>{
      if(bm && /^Last saved:/i.test(p.textContent||''))p.textContent=(p.textContent||'').replace(/^Last saved:/i,'Terakhir disimpan:');
      if(!bm && /^Terakhir disimpan:/i.test(p.textContent||''))p.textContent=(p.textContent||'').replace(/^Terakhir disimpan:/i,'Last saved:');
    });
  }

  function refineHome(){
    const home=document.querySelector('.home');if(!home)return;
    const logo=home.querySelector('.club-logo,.home-logo');if(logo)logo.style.setProperty('filter','drop-shadow(0 9px 9px rgba(11,47,91,.24)) drop-shadow(0 2px 2px rgba(0,0,0,.16))','important');
    const sw=home.querySelector('.lang-switch-v11');
    if(sw && home.querySelector('.r87-resume-session')){
      sw.style.setProperty('margin','14px auto 8px','important');
      sw.style.setProperty('transform','scale(.82)','important');
      sw.style.setProperty('transform-origin','center','important');
      sw.style.setProperty('flex-shrink','0','important');
    }
  }

  function refine(){fixPaused();refineHome();}

  /* Capture the user's ENG/BM choice itself. This avoids timing races with the older translator. */
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');
    if(b){
      const t=(b.textContent||'').trim().toUpperCase();
      if(t==='BM'){forcedLang='bm';setTimeout(refine,0);setTimeout(refine,80);setTimeout(()=>{forcedLang=null;refine();},250);return;}
      if(t==='ENG'){forcedLang='en';setTimeout(refine,0);setTimeout(refine,80);setTimeout(()=>{forcedLang=null;refine();},250);return;}
    }
    setTimeout(refine,0);
  },true);

  const oldSet=window.setScoreboardLanguage;
  if(typeof oldSet==='function')window.setScoreboardLanguage=function(lang){
    if(lang==='bm'||lang==='en')forcedLang=lang;
    const r=oldSet.apply(this,arguments);
    setTimeout(refine,0);setTimeout(refine,80);setTimeout(()=>{forcedLang=null;refine();},250);
    return r;
  };

  new MutationObserver(()=>requestAnimationFrame(refine)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(refine,50);
})();