/* SCOREBOARD R152 — stable Multiple Distances steppers and saved-session action */
(function(){
  'use strict';
  const GREY='#64748b';
  function versionInfo(){
    const card=document.querySelector('.app-info-card');
    if(!card)return;
    const spans=card.querySelectorAll('span');
    for(const s of spans){
      const t=s.textContent||'';
      if(/^(App Version|Versi Aplikasi)\s*:/i.test(t.trim())){
        const b=s.querySelector('b');
        if(b){while(b.nextSibling)b.nextSibling.remove();s.append(document.createTextNode(' 1.1.85 (R152)'));}
      }
      if(/^(Last Updated|Kemas Kini Terakhir)\s*:/i.test(t.trim())){
        const b=s.querySelector('b');
        if(b){while(b.nextSibling)b.nextSibling.remove();s.append(document.createTextNode(' 6 November 2026'));}
      }
    }
  }
  function savedButton(){
    for(const b of document.querySelectorAll('button')){
      if(!/^(CONTINUE SCORING|TERUSKAN SCORING|SAMBUNG SKOR)$/i.test((b.textContent||'').trim()))continue;
      if(b.closest('#exitDialog'))continue;
      let p=b.parentElement;
      for(let i=0;p&&i<7;i++,p=p.parentElement){
        if(/Session Saved|Sesi Disimpan/i.test(p.querySelector('h1,h2,h3,h4')?.textContent||'')){
          b.classList.add('r152-saved-continue');break;
        }
      }
    }
  }
  function setupStepper(button){
    const box=button.closest('.r82-stepper-box');
    const input=box?.querySelector('input[type="number"]');
    if(!input||!input.closest('.setup-page'))return false;
    const buttons=[...box.querySelectorAll('.r82-step-controls button')];
    const dir=button===buttons[0]?1:button===buttons[1]?-1:0;
    if(!dir)return false;
    const beforeY=window.scrollY;
    const step=Number(input.step)>0?Number(input.step):1;
    const min=input.min!==''?Number(input.min):-Infinity;
    const max=input.max!==''?Number(input.max):Infinity;
    const next=Math.max(min,Math.min(max,(Number(input.value)||0)+dir*step));
    if(next!==Number(input.value)){
      input.value=String(next);
      if(input.id==='multiCount'&&typeof setMultiCount==='function'){
        setMultiCount(next);
      }else{
        // Preserve the existing inline onchange logic for other setup fields.
        input.dispatchEvent(new Event('change',{bubbles:true}));
      }
    }
    // Browser scroll anchoring can shift the page when distance rows are removed.
    if(input.id==='multiCount'&&Math.abs(window.scrollY-beforeY)>1)window.scrollTo({top:beforeY,behavior:'instant'});
    return true;
  }
  // Capture before legacy R82/R116 onclick handlers, so one tap means one step.
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('.r82-step-controls button');
    if(!b||!b.closest('.setup-page'))return;
    e.preventDefault();e.stopImmediatePropagation();
    setupStepper(b);
  },true);
  document.addEventListener('pointerdown',e=>{
    if(e.target.closest?.('.setup-page .r82-step-controls button'))e.preventDefault();
  },true);
  const css=document.createElement('style');css.id='r152-fixes';css.textContent=`
    .r152-saved-continue,.r152-saved-continue:hover,.r152-saved-continue:active{
      background:${GREY}!important;background-color:${GREY}!important;
      border-color:${GREY}!important;color:#fff!important;
    }
    .setup-page .r82-step-controls button{transform:none!important;transition:none!important;touch-action:manipulation!important}
  `;document.head.appendChild(css);
  const observer=new MutationObserver(()=>{savedButton();versionInfo();});
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  savedButton();versionInfo();
})();
