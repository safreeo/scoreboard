/* SCOREBOARD R81 — rename Normal practice format label to Static only */
(function(){
  function renameNormalToStatic(){
    document.querySelectorAll('.practice-type-btn').forEach(btn=>{
      if(btn.textContent.trim()==='Normal') btn.textContent='Static';
    });
  }

  const observer=new MutationObserver(renameNormalToStatic);
  observer.observe(document.body,{childList:true,subtree:true});
  renameNormalToStatic();
})();
