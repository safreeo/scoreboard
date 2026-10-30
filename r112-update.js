/* SCOREBOARD R112 — persistent Home footer, spacing, safe multi-distance reduction, dynamic CP selector */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';
  const filled=v=>v!==''&&v!=null;
  const starts=ends=>ends.map((_,i)=>ends.slice(0,i).reduce((s,n)=>s+n,1));
  const cfg=()=>typeof resultMultiConfig==='function'?resultMultiConfig(S.session?.setup||S.setup):(()=>{const setup=S.session?.setup||S.setup,m=setup.multi||{},d=(m.distances||[]).map(Number).filter(Boolean),c=Math.max(1,Number(m.count)||d.length||1),e=(m.endsByDistance||[]).slice(0,c).map(v=>Math.max(1,Number(v)||1));while(d.length<c)d.push(Number(setup.distance)||30);while(e.length<c)e.push(Math.max(1,Number(m.endsPerDistance)||1));return{count:c,distances:d.slice(0,c),endsByDistance:e};})();

  /* Home: footer must exist after every render/relaunch, not only after an observer happens to find it. */
  function fixHome(){
    const h=document.querySelector('.home');if(!h)return;
    const menu=h.querySelector('.home-menu');if(menu)menu.style.setProperty('margin-top','28px','important');
    let footer=h.querySelector('.home-footer');
    if(!footer){footer=document.createElement('div');footer.className='footer home-footer';footer.textContent='Developed by Abu Danial';h.appendChild(footer);}
    footer.style.setProperty('display','block','important');footer.style.setProperty('visibility','visible','important');footer.style.setProperty('opacity','1','important');
    footer.style.setProperty('margin-top','auto','important');
  }

  /* Multiple Distances: reduction is allowed in equal multiples, provided the End(s)
     removed from every distance block are not active/scored/locked for any archer. */
  function rebuildMulti(oldEnds,newEnds){
    const os=starts(oldEnds),ns=starts(newEnds),arrows=Math.max(1,Number(S.setup.arrows)||1),rounds=Math.max(1,Number(S.setup.rounds)||1),newTotal=newEnds.reduce((s,n)=>s+n,0),oldCurrent=Math.max(1,Number(S.session.currentEnd)||1);
    let newCurrent=1;
    for(let i=0;i<oldEnds.length;i++){
      if(oldCurrent>=os[i]&&oldCurrent<os[i]+oldEnds[i]){const local=Math.min(oldCurrent-os[i],newEnds[i]-1);newCurrent=ns[i]+Math.max(0,local);break;}
    }
    (S.session.archers||[]).forEach(a=>{
      while(a.scores.length<rounds)a.scores.push([]);while(a.locked.length<rounds)a.locked.push([]);
      for(let r=0;r<rounds;r++){
        const oldScores=a.scores[r]||[],oldLocked=a.locked[r]||[],scores=Array.from({length:newTotal},()=>Array(arrows).fill('')),locked=Array(newTotal).fill(false);
        for(let i=0;i<newEnds.length;i++)for(let j=0;j<newEnds[i];j++){const oi=os[i]-1+j,ni=ns[i]-1+j;scores[ni]=Array.isArray(oldScores[oi])?[...oldScores[oi]]:Array(arrows).fill('');locked[ni]=!!oldLocked[oi];}
        a.scores[r]=scores;a.locked[r]=locked;
      }
      const ae=Math.max(1,Number(a.e)||1);let mapped=1;for(let i=0;i<oldEnds.length;i++)if(ae>=os[i]&&ae<os[i]+oldEnds[i]){mapped=ns[i]+Math.min(ae-os[i],newEnds[i]-1);break;}a.e=Math.max(1,Math.min(mapped,newTotal));
    });
    S.session.currentEnd=Math.max(1,Math.min(newCurrent,newTotal));S.setup.ends=newTotal;S.session.setup.ends=newTotal;
  }
  function removable(oldEnds,newEnds){
    const os=starts(oldEnds),active=Math.max(1,Number(S.session.currentEnd)||1);
    for(let i=0;i<oldEnds.length;i++)for(let j=newEnds[i];j<oldEnds[i];j++){
      const endNo=os[i]+j;
      if(endNo===active)return false;
      for(const a of S.session.archers||[])for(let r=0;r<Math.max(1,Number(S.setup.rounds)||1);r++){
        if(a.locked?.[r]?.[endNo-1])return false;
        if((a.scores?.[r]?.[endNo-1]||[]).some(filled))return false;
        if(Number(a.e)===endNo)return false;
      }
    }
    return true;
  }
  const r111ApplyEnds=window.applyEnds;
  window.applyEnds=function(){
    if(!S.session||S.setup.distanceMode!=='multiple')return r111ApplyEnds?.();
    const el=document.getElementById('manageEndValue'),requested=Math.max(1,Number(el?.textContent)||Number(S.setup.ends)||1),current=Math.max(1,Number(S.setup.ends)||1),delta=requested-current;
    if(delta>=0)return r111ApplyEnds?.();
    const c=cfg(),remove=-delta;
    if(remove%c.count!==0){alert(isBM()?`Untuk ${c.count} jarak, End mesti dikurangkan dalam gandaan ${c.count} (${c.count}, ${c.count*2}, ${c.count*3} dan seterusnya).`:`For ${c.count} distances, Ends must be reduced in multiples of ${c.count} (${c.count}, ${c.count*2}, ${c.count*3}, and so on).`);return;}
    const each=remove/c.count,oldEnds=[...c.endsByDistance],newEnds=oldEnds.map(n=>n-each);
    if(newEnds.some(n=>n<1)){alert(isBM()?'Setiap jarak mesti mempunyai sekurang-kurangnya 1 End.':'Each distance must keep at least 1 End.');return;}
    if(!removable(oldEnds,newEnds)){alert(isBM()?'Pengurangan tidak boleh dibuat kerana sekurang-kurangnya satu End yang hendak dibuang masih aktif atau sudah mempunyai markah.':'Ends cannot be reduced because at least one End to be removed is active or already contains a score.');return;}
    rebuildMulti(oldEnds,newEnds);ensureMultiSetup?.();S.setup.multi.endsByDistance=[...newEnds];if(newEnds.every(n=>n===newEnds[0]))S.setup.multi.endsPerDistance=newEnds[0];
    S.session.setup.multi={...(S.session.setup.multi||{}),endsByDistance:[...newEnds]};if(newEnds.every(n=>n===newEnds[0]))S.session.setup.multi.endsPerDistance=newEnds[0];
    saveUnfinished?.();closeModal?.('manageEndsDialog');scoring?.();
  };

  /* CP count/list: Apply CP must immediately rebuild the CP selector from the new count. */
  function cpTotal(){return Math.max(1,Number(S.setup.checkPoints||S.setup.ends)||1)}
  function rebuildCPList(modal){
    modal=modal||document.getElementById('manageEndsDialog');if(!modal||S.setup.practiceType==='target')return;
    const grid=modal.querySelector('.cp-select-grid');if(!grid)return;
    const total=cpTotal(),a=typeof activeArcher==='function'?activeArcher():null,round=typeof currentRoundNo==='function'?currentRoundNo():1,current=Math.min(total,Math.max(1,Number(S.session?.currentEnd)||1));
    if(typeof r76PendingCP!=='undefined')r76PendingCP=Math.min(total,Math.max(1,Number(r76PendingCP)||current));
    grid.innerHTML=Array.from({length:total},(_,i)=>{const cp=i+1,complete=!!a&&typeof endLocked==='function'&&endLocked(a,round,cp),active=cp===current;return `<button class="cp-select-btn ${complete?'complete':''} ${active?'active':''}" onclick="r76ChooseCP(${cp})">CP${cp}</button>`}).join('');
  }
  function findCPValue(modal){
    const ids=['manageCPValue','manageCheckPointValue','manageCheckpointValue','manageEndValue'];for(const id of ids){const e=document.getElementById(id);if(e)return e;}
    const apply=[...modal.querySelectorAll('button')].find(b=>/APPLY\s*CP|GUNA\s*CP/i.test(b.textContent||''));if(!apply)return null;
    const box=apply.previousElementSibling;return box?.querySelector('strong,[data-value],input')||null;
  }
  function applyCPFromModal(modal){
    if(!S.session||S.setup.practiceType==='target')return;
    const v=findCPValue(modal),next=Math.max(1,Number(v?.value||v?.textContent)||cpTotal()),old=cpTotal(),arrows=Math.max(1,Number(S.setup.arrows)||1),rounds=Math.max(1,Number(S.setup.rounds)||1);
    if(next<old){for(const a of S.session.archers||[])for(let r=0;r<rounds;r++)for(let e=next;e<old;e++)if(a.locked?.[r]?.[e]||(a.scores?.[r]?.[e]||[]).some(filled)){alert(isBM()?`CP${e+1} sudah aktif atau mempunyai markah dan tidak boleh dibuang.`:`CP${e+1} is active or contains a score and cannot be removed.`);return;}}
    (S.session.archers||[]).forEach(a=>{while(a.scores.length<rounds)a.scores.push([]);while(a.locked.length<rounds)a.locked.push([]);for(let r=0;r<rounds;r++){while(a.scores[r].length<next)a.scores[r].push(Array(arrows).fill(''));a.scores[r].length=next;while(a.locked[r].length<next)a.locked[r].push(false);a.locked[r].length=next;}a.e=Math.min(Math.max(1,Number(a.e)||1),next);});
    S.setup.checkPoints=next;S.setup.ends=next;if(S.session.setup){S.session.setup.checkPoints=next;S.session.setup.ends=next;}S.session.currentEnd=Math.min(Math.max(1,Number(S.session.currentEnd)||1),next);saveUnfinished?.();rebuildCPList(modal);
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('button');if(!b)return;
    if(/APPLY\s*CP|GUNA\s*CP/i.test((b.textContent||'').trim())){const modal=b.closest('.modal-overlay');if(modal&&S.setup.practiceType!=='target'){e.preventDefault();e.stopImmediatePropagation();applyCPFromModal(modal);}}
    setTimeout(fixHome,30);
  },true);
  new MutationObserver(()=>requestAnimationFrame(()=>{fixHome();const m=document.getElementById('manageEndsDialog');if(m&&S.setup.practiceType!=='target')rebuildCPList(m);})).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(fixHome,80);

  const s=document.createElement('style');s.textContent=`
    .home{min-height:100svh!important;min-height:100dvh!important;display:flex!important;flex-direction:column!important;box-sizing:border-box!important}
    .home .tagline{margin-bottom:0!important}.home .home-menu{margin-top:28px!important}
    .home .home-footer{display:block!important;visibility:visible!important;opacity:1!important;margin-top:auto!important;flex-shrink:0!important;padding-top:18px!important;padding-bottom:max(18px,env(safe-area-inset-bottom))!important;position:relative!important;z-index:2!important}
    @media(max-height:800px){.home .home-menu{margin-top:20px!important}.home .home-footer{padding-top:10px!important;padding-bottom:max(10px,env(safe-area-inset-bottom))!important}}
  `;document.head.appendChild(s);
})();