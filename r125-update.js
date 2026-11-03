/* SCOREBOARD R130 — paused actions match Personal + stable BM/ENG */
(function(){
  let selectedLang=null;
  const lang=()=> selectedLang || (localStorage.getItem('scoreboard_language_v11')==='bm'?'bm':'en');

  function findPausedCard(){
    const resume=[...document.querySelectorAll('button')].find(b=>/^(RESUME SESSION|SAMBUNG SESI|RESUME)$/i.test((b.textContent||'').trim()));
    if(!resume)return null;
    let el=resume.parentElement;
    while(el&&el!==document.body){
      if(/PAUSED SESSION|SESI DIJEDA|Last saved:|Terakhir disimpan:/i.test(el.textContent||'')&&el.querySelectorAll('button').length>=2)return el;
      el=el.parentElement;
    }
    return null;
  }

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
      btn.style.setProperty('height','46px','important');
      btn.style.setProperty('min-height','46px','important');
      btn.style.setProperty('font-size','15px','important');
      btn.style.setProperty('border-radius','10px','important');
    }
    btn.style.setProperty('width','100%','important');
    btn.style.setProperty('margin','0','important');
    btn.style.setProperty('display','flex','important');
    btn.style.setProperty('align-items','center','important');
    btn.style.setProperty('justify-content','center','important');
    btn.style.setProperty('white-space','nowrap','important');
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

  function refine(){fixPaused();}

  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b){setTimeout(refine,0);return;}
    const t=(b.textContent||'').trim().toUpperCase();
    if(t==='BM'||t==='ENG'){
      selectedLang=t==='BM'?'bm':'en';
      localStorage.setItem('scoreboard_language_v11',selectedLang);
      setTimeout(refine,0);setTimeout(refine,80);setTimeout(refine,300);setTimeout(refine,700);
    }else setTimeout(refine,0);
  },true);

  const oldSet=window.setScoreboardLanguage;
  if(typeof oldSet==='function')window.setScoreboardLanguage=function(l){
    if(l==='bm'||l==='en'){selectedLang=l;localStorage.setItem('scoreboard_language_v11',l);}
    const r=oldSet.apply(this,arguments);
    setTimeout(refine,0);setTimeout(refine,80);setTimeout(refine,300);setTimeout(refine,700);
    return r;
  };

  new MutationObserver(()=>requestAnimationFrame(refine)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(refine,50);
})();