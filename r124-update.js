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
  const s=document.createElement('style');s.textContent=`
    #exitDialog .r124-pause{background:#687684!important;color:#fff!important;border-color:#687684!important}
    #exitDialog .r124-continue{background:#169b69!important;color:#fff!important;border-color:#169b69!important}
  `;document.head.appendChild(s);
})();