/* SCOREBOARD R132 — direct Home Resume language + unclipped ENG/BM control */
(function(){
  const KEY='scoreboard_language_v11';
  const getLang=()=>localStorage.getItem(KEY)==='bm'?'bm':'en';

  function personalButton(){
    return [...document.querySelectorAll('button')].find(b=>/^(PERSONAL|INDIVIDU)$/i.test((b.textContent||'').trim()));
  }
  function copyPersonalSizing(btn){
    if(!btn)return;
    const p=personalButton();
    if(p){
      const cs=getComputedStyle(p);
      ['height','minHeight','maxHeight','paddingTop','paddingRight','paddingBottom','paddingLeft','fontSize','lineHeight','fontWeight','borderRadius'].forEach(prop=>{
        const css=prop.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),v=cs[prop];
        if(v&&v!=='none'&&v!=='auto')btn.style.setProperty(css,v,'important');
      });
    }
    btn.style.setProperty('width','100%','important');
    btn.style.setProperty('margin','0','important');
    btn.style.setProperty('display','flex','important');
    btn.style.setProperty('align-items','center','important');
    btn.style.setProperty('justify-content','center','important');
    btn.style.setProperty('white-space','nowrap','important');
  }

  function fixPaused(){
    const bm=getLang()==='bm';
    const candidates=[...document.querySelectorAll('button')].filter(b=>/^(RESUME SESSION|SAMBUNG SESI|RESUME)$/i.test((b.textContent||'').trim())&&!b.classList.contains('r87-resume-session'));
    candidates.forEach(resume=>{
      let card=resume.parentElement;
      while(card&&card!==document.body&&!/PAUSED SESSION|SESI DIJEDA|Last saved:|Terakhir disimpan:/i.test(card.textContent||''))card=card.parentElement;
      if(!card||card===document.body)return;
      const buttons=[...card.querySelectorAll('button')];
      const discard=buttons.find(b=>/^DISCARD$|^BUANG$|^BATALKAN$/i.test((b.textContent||'').trim()));
      resume.textContent=bm?'SAMBUNG SESI':'RESUME SESSION'; copyPersonalSizing(resume);
      resume.style.setProperty('background','#198754','important');resume.style.setProperty('color','#fff','important');
      if(discard){discard.textContent=bm?'BUANG':'DISCARD';copyPersonalSizing(discard);discard.style.setProperty('background','#e53245','important');discard.style.setProperty('color','#fff','important');}
    });
  }

  function fixHome(){
    const home=document.querySelector('.home');if(!home)return;
    const bm=getLang()==='bm';
    const resume=home.querySelector('.r87-resume-session');
    if(resume){
      const label=resume.querySelector('b')||resume;
      label.textContent=bm?'SAMBUNG SESI':'RESUME SESSION';
    }
    const sw=home.querySelector('.lang-switch-v11');
    if(sw){
      sw.style.cssText+=';display:flex!important;width:190px!important;min-width:190px!important;height:44px!important;min-height:44px!important;max-height:none!important;overflow:visible!important;margin:18px auto 12px!important;padding:3px!important;transform:none!important;flex:0 0 44px!important;position:relative!important;clip-path:none!important;';
      [...sw.children].forEach(x=>x.style.cssText+=';height:38px!important;min-height:38px!important;max-height:38px!important;line-height:38px!important;overflow:visible!important;flex:1 1 0!important;padding-top:0!important;padding-bottom:0!important;margin:0!important;');
    }
    let footer=home.querySelector('.home-footer');
    if(!footer){footer=document.createElement('div');footer.className='footer home-footer';home.appendChild(footer);}
    footer.textContent=bm?'Dibangunkan oleh Abu Danial':'Developed by Abu Danial';
    footer.style.cssText+=';display:block!important;visibility:visible!important;opacity:1!important;flex-shrink:0!important;margin-top:12px!important;padding:0 0 8px!important;';
  }

  function refine(){fixPaused();fixHome();}

  /* The original language switch uses its own closure, so observe the actual control
     instead of wrapping window.setScoreboardLanguage. This is the key R132 fix. */
  document.addEventListener('click',e=>{
    const choice=e.target.closest('.lang-switch-v11 button, .lang-switch-v11 [role="button"], .lang-switch-v11 span, .lang-switch-v11 div');
    if(choice){
      const t=(choice.textContent||'').trim().toUpperCase();
      if(t==='BM'||t==='ENG'){
        localStorage.setItem(KEY,t==='BM'?'bm':'en');
        [0,30,80,180,350,700].forEach(ms=>setTimeout(refine,ms));
        return;
      }
    }
    setTimeout(refine,0);
  },true);

  new MutationObserver(()=>requestAnimationFrame(refine)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(refine,50);
})();