/* SCOREBOARD R81 — rename Normal format label to Static */
(function(){
  function renameNormalToStatic(){
    document.querySelectorAll('button').forEach(btn=>{
      if(btn.textContent.trim()==='Normal') btn.textContent='Static';
    });
  }

  const observer=new MutationObserver(renameNormalToStatic);
  observer.observe(document.body,{childList:true,subtree:true});
  renameNormalToStatic();
})();
