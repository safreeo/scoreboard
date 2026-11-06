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
      }else if(/CONTINUE SCORING|TERUSKAN SCORING/i.test(t) && !d.querySelector('.r109-exit-dialog')){
        b.classList.add('r124-continue');
        b.classList.remove('soft','primary');
      }
    });
  }
  document.addEventListener('click',()=>setTimeout(styleExitDialog,0),true);
  new MutationObserver(()=>requestAnimationFrame(styleExitDialog)).observe(document.body,{childList:true,subtree:true});
  setTimeout(styleExitDialog,50);

  // Session Saved dialog is generated dynamically. Style only its Continue button.
  function styleSavedDialog(){
    document.querySelectorAll('button').forEach(button=>{
      if(!/CONTINUE SCORING|TERUSKAN SCORING|SAMBUNG SKOR/i.test(button.textContent||''))return;
      if(button.closest('#exitDialog'))return;
      let node=button.parentElement, isSaved=false;
      for(let i=0;node&&i<6;i++,node=node.parentElement){
        if(/Session Saved|Sesi Disimpan/i.test(node.querySelector('h1,h2,h3,h4')?.textContent||'')){isSaved=true;break;}
      }
      if(isSaved){
        button.style.setProperty('background','#64748b','important');
        button.style.setProperty('background-color','#64748b','important');
        button.style.setProperty('border-color','#64748b','important');
        button.style.setProperty('color','#fff','important');
      }
    });
  }
  document.addEventListener('click',()=>requestAnimationFrame(styleSavedDialog),true);
  new MutationObserver(()=>requestAnimationFrame(styleSavedDialog)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  requestAnimationFrame(styleSavedDialog);
  const s=document.createElement('style');s.textContent=`
    #exitDialog .r124-pause{background:#687684!important;color:#fff!important;border-color:#687684!important}
    #exitDialog .r124-continue{background:#169b69!important;color:#fff!important;border-color:#169b69!important}\n    #exitDialog .r109-exit-dialog .r109-exit-actions button:last-child{background:#64748b!important;background-color:#64748b!important;color:#fff!important;border-color:#64748b!important}
  `;document.head.appendChild(s);
})();