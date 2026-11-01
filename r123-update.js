/* SCOREBOARD R124 — explicit legend colors: completed green, current white/black, incomplete grey */
(function(){
  function paintDot(item,color,border){
    const dot=item.querySelector('span');if(!dot)return;
    dot.style.setProperty('background',color,'important');
    dot.style.setProperty('background-color',color,'important');
    dot.style.setProperty('border',border,'important');
    dot.style.setProperty('box-sizing','border-box','important');
  }
  function fixLegends(){
    document.querySelectorAll('.r77-legend, .r114-legend, .round-select-note, .cp-select-note').forEach(root=>{
      root.querySelectorAll('div').forEach(item=>{
        const text=(item.textContent||'').trim().toLowerCase();
        if(/^(completed|selesai)/i.test(text)) paintDot(item,'#169b69','0');
        else if(/(current round|current checkpoint|current check point|current distance|round semasa|checkpoint semasa|jarak semasa)/i.test(text)) paintDot(item,'#fff','2px solid #111');
        else if(/^(incomplete|belum selesai)/i.test(text)) paintDot(item,'#dfe5ec','1px solid #b8c2cf');
      });
    });
  }
  document.addEventListener('click',()=>setTimeout(fixLegends,0),true);
  new MutationObserver(()=>requestAnimationFrame(fixLegends)).observe(document.body,{childList:true,subtree:true});
  setTimeout(fixLegends,50);

  const s=document.createElement('style');s.textContent=`
    .r77-blue-dot{background:#fff!important;background-color:#fff!important;border:2px solid #111!important;box-sizing:border-box!important}
    .round-green-dot,.cp-green-dot{background:#169b69!important;background-color:#169b69!important;border:0!important}
  `;document.head.appendChild(s);
})();