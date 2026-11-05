/* SCOREBOARD R124 — exit dialog action colors */
(function(){
  function styleExitDialog(){
    const d=document.getElementById('exitDialog');
    if(!d)return;
    [...d.querySelectorAll('button')].forEach(b=>{
      const t=(b.textContent||'').trim();
      if(/PAUSE SESSION|JEDA SESI/i.test(t)){
        b.classList.add('r124-pause');
        b.classList.remove('green','primary');
      }else if(/CONTINUE SCORING|TERUSKAN SCORING/i.test(t)){
        b.classList.add('r124-continue');
        b.classList.remove('soft','primary');
      }
    });
  }
  document.addEventListener('click',()=>setTimeout(styleExitDialog,0),true);
  new MutationObserver(()=>requestAnimationFrame(styleExitDialog)).observe(document.body,{childList:true,subtree:true});
  setTimeout(styleExitDialog,50);

  // Only the Session Saved confirmation uses the grey Continue button.
  function styleSavedDialog(){
    document.querySelectorAll('.modal-overlay').forEach(modal=>{
      if(modal.id==='exitDialog')return;
      const title=modal.querySelector('h3')?.textContent?.trim()||'';
      if(!/Session Saved|Sesi Disimpan/i.test(title))return;
      modal.querySelectorAll('button').forEach(b=>{
        if(/CONTINUE SCORING|TERUSKAN SCORING|SAMBUNG SKOR/i.test(b.textContent||'')){
          b.style.setProperty('background','#64748b','important');
          b.style.setProperty('border-color','#64748b','important');
          b.style.setProperty('color','#fff','important');
        }
      });
    });
  }
  document.addEventListener('click',()=>setTimeout(styleSavedDialog,0),true);
  new MutationObserver(()=>requestAnimationFrame(styleSavedDialog)).observe(document.body,{childList:true,subtree:true});
  setTimeout(styleSavedDialog,80);
  const s=document.createElement('style');s.textContent=`
    #exitDialog .r124-pause{background:#687684!important;color:#fff!important;border-color:#687684!important}
    #exitDialog .r124-continue{background:#169b69!important;color:#fff!important;border-color:#169b69!important}
  `;document.head.appendChild(s);
})();