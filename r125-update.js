/* SCOREBOARD R131 — paused/home resume language + stable home footer/switch */
(function(){
  let selectedLang=null;
  const lang=()=> selectedLang || (localStorage.getItem('scoreboard_language_v11')==='bm'?'bm':'en');

  function personalButton(){
    return [...document.querySelectorAll('button')].find(b=>/^(PERSONAL|INDIVIDU)$/i.test((b.textContent||'').trim()));
  }

  function copyPersonalSizing(btn){
    if(!btn)return;
    const p=personalButton();
    if(p){
      const cs=getComputedStyle(p);
      ['height','minHeight','maxHeight','paddingTop','paddingRight','paddingBottom','paddingLeft','fontSize','lineHeight','fontWeight','borderRadius'].forEach(prop=>{
        const css=prop.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
        const val=cs[prop]; if(val&&val!=='none'&&val!=='auto')btn.style.setProperty(css,val,'important');
      });
    }else{
      btn.style.setProperty('height','54px','important');
      btn.style.setProperty('min-height','54px','important');
      btn.style.setProperty('font-size','16px','important');
      btn.style.setProperty('border-radius','12px','important');
    }
    btn.style.setProperty('width','100%','important');
    btn.style.setProperty('margin','0','important');
    btn.style.setProperty('display','flex','important');
    btn.style.setProperty('align-items','center','important');
    btn.style.setProperty('justify-content','center','important');
    btn.style.setProperty('white-space','nowrap','important');
  }

  function findPausedCard(){
    const resume=[...document.querySelectorAll('button')].find(b=>/^(RESUME SESSION|SAMBUNG SESI|RESUME)$/i.test((b.textContent||'').trim()) && !b.classList.contains('r87-resume-session'));
    if(!resume)return null;
    let el=resume.parentElement;
    while(el&&el!==document.body){
      if(/PAUSED SESSION|SESI DIJEDA|Last saved:|Terakhir disimpan:/i.test(el.textContent||'')&&el.querySelectorAll('button').length>=2)return el;
      el=el.parentElement;
    }
    return null;
  }

  function fixPaused(){
    const card=findPausedCard();if(!card)return;
    const bm=lang()==='bm';
    const buttons=[...card.querySelectorAll('button')];
    const resume=buttons.find(b=>/RESUME SESSION|SAMBUNG SESI|^RESUME$/i.test((b.textContent||'').trim()));
    const discard=buttons.find(b=>/^DISCARD$|^BUANG$|^BATALKAN$/i.test((b.textContent||'').trim()));
    if(resume){resume.textContent=bm?'SAMBUNG SESI':'RESUME SESSION';copyPersonalSizing(resume);resume.style.setProperty('background','#198754','important');resume.style.setProperty('color','#fff','important');resume.style.setProperty('border-color','#198754','important');}
    if(discard){discard.textContent=bm?'BUANG':'DISCARD';copyPersonalSizing(discard);discard.style.setProperty('background','#e53245','important');discard.style.setProperty('color','#fff','important');discard.style.setProperty('border-color','#e53245','important');}
    const title=[...card.querySelectorAll('*')].find(el=>el.children.length===0&&/^(⏸\s*)?(PAUSED SESSION|SESI DIJEDA)$/i.test((el.textContent||'').trim()));
    if(title)title.textContent=bm?'⏸ SESI DIJEDA':'⏸ PAUSED SESSION';
    [...card.querySelectorAll('*')].filter(el=>el.children.length===0).forEach(el=>{
      const t=el.textContent||'';
      if(bm&&/^Last saved:/i.test(t))el.textContent=t.replace(/^Last saved:/i,'Terakhir disimpan:');
      else if(!bm&&/^Terakhir disimpan:/i.test(t))el.textContent=t.replace(/^Terakhir disimpan:/i,'Last saved:');
    });
  }

  function fixHome(){
    const home=document.querySelector('.home');if(!home)return;
    const bm=lang()==='bm';

    /* R87 creates this button after home() renders, so translate it explicitly. */
    const resume=home.querySelector('.r87-resume-session');
    if(resume){
      const label=resume.querySelector('b');
      if(label)label.textContent=bm?'SAMBUNG SESI':'RESUME SESSION';
    }

    /* Keep language control intact even when Resume Session adds another menu row. */
    const sw=home.querySelector('.lang-switch-v11');
    if(sw){
      sw.style.setProperty('display','flex','important');
      sw.style.setProperty('width','190px','important');
      sw.style.setProperty('height','42px','important');
      sw.style.setProperty('min-height','42px','important');
      sw.style.setProperty('overflow','visible','important');
      sw.style.setProperty('margin','18px auto 8px','important');
      sw.style.setProperty('transform','none','important');
      sw.style.setProperty('flex-shrink','0','important');
    }

    /* Language cleanup must never remove the home credit/footer. Recreate if needed. */
    let footer=home.querySelector('.home-footer');
    if(!footer){
      footer=document.createElement('div');
      footer.className='footer home-footer';
      home.appendChild(footer);
    }
    footer.textContent=bm?'Dibangunkan oleh Abu Danial':'Developed by Abu Danial';
    footer.style.setProperty('display','block','important');
    footer.style.setProperty('visibility','visible','important');
    footer.style.setProperty('opacity','1','important');
    footer.style.setProperty('flex-shrink','0','important');
    footer.style.setProperty('margin-top','18px','important');
    footer.style.setProperty('padding-top','0','important');
    footer.style.setProperty('padding-bottom','8px','important');
  }

  function refine(){fixPaused();fixHome();}

  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b){setTimeout(refine,0);return;}
    const t=(b.textContent||'').trim().toUpperCase();
    if(t==='BM'||t==='ENG'){
      selectedLang=t==='BM'?'bm':'en';
      localStorage.setItem('scoreboard_language_v11',selectedLang);
      [0,50,150,350,700].forEach(ms=>setTimeout(refine,ms));
    }else setTimeout(refine,0);
  },true);

  const oldSet=window.setScoreboardLanguage;
  if(typeof oldSet==='function')window.setScoreboardLanguage=function(l){
    if(l==='bm'||l==='en'){selectedLang=l;localStorage.setItem('scoreboard_language_v11',l);}
    const r=oldSet.apply(this,arguments);
    [0,50,150,350,700].forEach(ms=>setTimeout(refine,ms));
    return r;
  };

  new MutationObserver(()=>requestAnimationFrame(refine)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(refine,50);
})();