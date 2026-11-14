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
        if(b&&!t.includes('1.1.93')){while(b.nextSibling)b.nextSibling.remove();s.append(document.createTextNode(' 1.1.93'));}
      }
      if(/^(Last Updated|Kemas Kini Terakhir)\s*:/i.test(t.trim())){
        const b=s.querySelector('b');
        if(b&&!t.includes('14 November 2026')){while(b.nextSibling)b.nextSibling.remove();s.append(document.createTextNode(' 14 November 2026'));}
      }
    }
  }
  function savedButton(){
    for(const b of document.querySelectorAll('button')){
      const label=(b.textContent||'').trim();
      if(!/^(CONTINUE SCORING|TERUSKAN SCORING|SAMBUNG SKOR)$/i.test(label))continue;
      // Only the saved-result dialog; never the separate pause/exit dialog.
      if(b.closest('#exitDialog'))continue;
      let parent=b.parentElement,found=false;
      for(let i=0;parent&&i<8;i++,parent=parent.parentElement){
        const headings=[...parent.querySelectorAll('h1,h2,h3,h4')].map(x=>x.textContent||'').join(' ');
        const buttons=[...parent.querySelectorAll('button')].map(x=>x.textContent||'').join(' ');
        if(/Session Saved|Sesi Disimpan/i.test(headings)||/SAVED\s*&\s*EXIT TO HOME|DISIMPAN.*(?:UTAMA|HOME)/i.test(buttons)){found=true;break;}
      }
      if(found){
        b.classList.add('r152-saved-continue');
        for(const property of ['background','background-color','border-color'])b.style.setProperty(property,GREY,'important');
        b.style.setProperty('color','#fff','important');
      }
    }
  }
  // Handle steppers before legacy document handlers. Do not fire onchange:
  // onchange on multiple-distance fields rebuilds setup and shifts the viewport.
  function setupStepper(button){
    const box=button.closest('.r82-stepper-box');
    const input=box?.querySelector('input[type="number"]');
    if(!input||!input.closest('.setup-page'))return;
    const controls=[...box.querySelectorAll('.r82-step-controls button')];
    const dir=button===controls[0]?1:button===controls[1]?-1:0;
    if(!dir)return;
    const step=Number(input.step)>0?Number(input.step):1;
    const min=input.min!==''?Number(input.min):-Infinity;
    const max=input.max!==''?Number(input.max):Infinity;
    const next=Math.max(min,Math.min(max,(Number(input.value)||0)+dir*step));
    if(next===Number(input.value))return;
    input.value=String(next);
    if(input.id==='multiCount'&&typeof setMultiCount==='function'){
      setMultiCount(next);
    }else if(input.id==='multiRoundCount'&&typeof setMultiRoundCount==='function'){
      setMultiRoundCount(next);
    }else if(typeof syncSetup==='function'){
      // Persist values in the existing model without calling refreshSetupAt/setup.
      syncSetup();
      if(typeof window.r155MarkPreviewDirty==='function')window.r155MarkPreviewDirty();
    }
    if(input.id==='rounds'&&typeof window.r153RefreshRounds==='function')window.r153RefreshRounds();
    if(input.id==='multiCount'&&typeof window.r153EnhanceSteppers==='function')window.r153EnhanceSteppers();
    try{if(typeof saveState==='function')saveState();}catch(_){}
  }
  window.addEventListener('click',e=>{
    const b=e.target.closest?.('.setup-page .r82-step-controls button');
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    const y=window.scrollY;
    setupStepper(b);
    requestAnimationFrame(()=>{if(Math.abs(window.scrollY-y)>1)window.scrollTo(0,y);});
  },true);
  window.addEventListener('pointerdown',e=>{
    if(e.target.closest?.('.setup-page .r82-step-controls button'))e.preventDefault();
  },true);
  // Keep the viewport stable while a setup stepper is used on touch devices.
  let stepperTouchY=null;
  document.addEventListener('touchstart',e=>{
    if(e.target.closest?.('.setup-page .r82-step-controls button'))stepperTouchY=window.scrollY;
  },{capture:true,passive:true});
  document.addEventListener('touchend',e=>{
    if(stepperTouchY===null)return;
    const y=stepperTouchY;stepperTouchY=null;
    if(e.target.closest?.('.setup-page .r82-step-controls button')){
      requestAnimationFrame(()=>{if(Math.abs(window.scrollY-y)>2)window.scrollTo(0,y);});
    }
  },true);
  const css=document.createElement('style');css.id='r152-fixes';css.textContent=`
    .r152-saved-continue,.r152-saved-continue:hover,.r152-saved-continue:active{
      background:${GREY}!important;background-color:${GREY}!important;
      border-color:${GREY}!important;color:#fff!important;
    }
    .setup-page .r82-step-controls button{transform:none!important;transition:none!important;touch-action:manipulation!important}\n    .setup-page .r82-stepper-box{position:relative!important;overflow:hidden!important;min-width:0!important;border-radius:10px!important;box-shadow:none!important}\n    .setup-page .r82-stepper-box > input[type=number]{border:0!important;outline:0!important;box-shadow:none!important;border-radius:0!important;min-width:0!important;appearance:textfield!important}\n    .setup-page .r82-stepper-box > .r82-step-controls{position:absolute!important;right:0!important;top:0!important;bottom:0!important;width:38px!important;min-width:38px!important;max-width:38px!important;padding:0!important;margin:0!important;border:0!important;border-left:1px solid #c7d0da!important;border-radius:0!important;box-shadow:none!important;display:flex!important;flex-direction:column!important}\n    .setup-page .r82-stepper-box > .r82-step-controls button{border:0!important;border-radius:0!important;box-shadow:none!important;padding:0!important;min-height:0!important;flex:1 1 0!important}\n    .setup-page .r82-stepper-box > .r82-step-controls button:first-child{border-bottom:1px solid #c7d0da!important}\n    .setup-page .multi-distance-grid,.setup-page .multi-common-grid{overflow-anchor:none!important}
  `;document.head.appendChild(css);
  const observer=new MutationObserver(()=>{savedButton();versionInfo();});
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  savedButton();versionInfo();
})();
