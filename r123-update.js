/* SCOREBOARD R123 — force current selector legend marker to white + black outline */
(function(){
  function fixCurrentLegend(){
    document.querySelectorAll('.r77-legend, .r114-legend, .round-select-note, .cp-select-note').forEach(root=>{
      root.querySelectorAll('div').forEach(item=>{
        const text=(item.textContent||'').trim().toLowerCase();
        if(!/(current round|current checkpoint|current check point|current distance|round semasa|checkpoint semasa|jarak semasa)/i.test(text))return;
        const dot=item.querySelector('span');if(!dot)return;
        dot.style.setProperty('background','#fff','important');
        dot.style.setProperty('background-color','#fff','important');
        dot.style.setProperty('border','2px solid #111','important');
        dot.style.setProperty('box-sizing','border-box','important');
      });
    });
  }
  document.addEventListener('click',()=>setTimeout(fixCurrentLegend,0),true);
  new MutationObserver(()=>requestAnimationFrame(fixCurrentLegend)).observe(document.body,{childList:true,subtree:true});
  setTimeout(fixCurrentLegend,50);

  const s=document.createElement('style');s.textContent=`
    .r77-blue-dot{background:#fff!important;background-color:#fff!important;border:2px solid #111!important;box-sizing:border-box!important}
  `;document.head.appendChild(s);
})();