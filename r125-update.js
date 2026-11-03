/* SCOREBOARD R133 — stable Home language control, footer placement + logo depth */
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
      resume.textContent=bm?'SAMBUNG SESI':'RESUME SESSION';copyPersonalSizing(resume);
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

    /* Restore the subtle raised-logo effect regardless of old class name. */
    const logo=home.querySelector('.club-logo, .home-logo, img[src*="scoreboard-logo"]');
    if(logo){
      logo.style.setProperty('filter','drop-shadow(0 7px 7px rgba(8,43,79,.20))','important');
    }

    /* Keep the compact pre-resume ENG/BM size. */
    const sw=home.querySelector('.lang-switch-v11');
    if(sw){
      sw.style.setProperty('display','flex','important');
      sw.style.setProperty('width','116px','important');
      sw.style.setProperty('min-width','116px','important');
      sw.style.setProperty('max-width','116px','important');
      sw.style.setProperty('height','32px','important');
      sw.style.setProperty('min-height','32px','important');
      sw.style.setProperty('max-height','32px','important');
      sw.style.setProperty('overflow','hidden','important');
      sw.style.setProperty('margin','18px auto 0','important');
      sw.style.setProperty('padding','2px','important');
      sw.style.setProperty('transform','none','important');
      sw.style.setProperty('flex','0 0 32px','important');
      sw.style.setProperty('position','relative','important');
      sw.style.setProperty('clip-path','none','important');
      [...sw.children].forEach(x=>{
        x.style.setProperty('height','28px','important');
        x.style.setProperty('min-height','28px','important');
        x.style.setProperty('max-height','28px','important');
        x.style.setProperty('line-height','28px','important');
        x.style.setProperty('font-size','13px','important');
        x.style.setProperty('overflow','hidden','important');
        x.style.setProperty('flex','1 1 0','important');
        x.style.setProperty('padding','0','important');
        x.style.setProperty('margin','0','important');
      });
    }

    /* Footer stays at the bottom through flex auto-margin; never hide it when Resume is added. */
    let footer=home.querySelector('.home-footer');
    if(!footer){footer=document.createElement('div');footer.className='footer home-footer';home.appendChild(footer);}
    footer.textContent=bm?'Dibangunkan oleh Abu Danial':'Developed by Abu Danial';
    footer.style.setProperty('display','block','important');
    footer.style.setProperty('visibility','visible','important');
    footer.style.setProperty('opacity','1','important');
    footer.style.setProperty('flex-shrink','0','important');
    footer.style.setProperty('margin-top','auto','important');
    footer.style.setProperty('padding-top','24px','important');
    footer.style.setProperty('padding-bottom','max(8px, env(safe-area-inset-bottom))','important');
  }

  function refine(){fixPaused();fixHome();}

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