/* SCOREBOARD R111 — multi-distance End extension at any time + app-styled reminders */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';
  const cfg=()=>typeof resultMultiConfig==='function'?resultMultiConfig(S.session?.setup||S.setup):(()=>{const m=(S.session?.setup||S.setup).multi||{},d=(m.distances||[]).map(Number).filter(Boolean),c=Math.max(1,Number(m.count)||d.length||1),e=(m.endsByDistance||[]).slice(0,c).map(v=>Math.max(1,Number(v)||1));while(d.length<c)d.push(Number(S.setup.distance)||30);while(e.length<c)e.push(Math.max(1,Number(m.endsPerDistance)||1));return{count:c,distances:d.slice(0,c),endsByDistance:e}})();
  const starts=ends=>ends.map((_,i)=>ends.slice(0,i).reduce((s,n)=>s+n,1));

  /* Never use the browser/domain alert for reminders. */
  window.alert=function(message){
    document.getElementById('r111Reminder')?.remove();
    const bm=isBM(),o=document.createElement('div');o.id='r111Reminder';o.className='modal-overlay';
    o.innerHTML=`<div class="modal-card r111-dialog"><h3>${bm?'Perhatian':'Please Note'}</h3><p>${esc(String(message||''))}</p><div class="modal-actions"><button class="btn primary r111-ok" type="button">OK</button></div></div>`;
    o.querySelector('.r111-ok').onclick=()=>o.remove();document.body.appendChild(o);
  };

  function rebuildForAddedEnds(oldEnds,newEnds){
    const oldStarts=starts(oldEnds),newStarts=starts(newEnds),arrows=Math.max(1,Number(S.setup.arrows)||1),rounds=Math.max(1,Number(S.setup.rounds)||1),oldTotal=oldEnds.reduce((s,n)=>s+n,0),newTotal=newEnds.reduce((s,n)=>s+n,0);
    const oldCurrent=Math.max(1,Number(S.session.currentEnd)||1);
    let newCurrent=oldCurrent;
    for(let i=0;i<oldEnds.length;i++)if(oldCurrent>=oldStarts[i]&&oldCurrent<oldStarts[i]+oldEnds[i]){newCurrent=newStarts[i]+(oldCurrent-oldStarts[i]);break;}
    (S.session.archers||[]).forEach(a=>{
      while(a.scores.length<rounds)a.scores.push([]);while(a.locked.length<rounds)a.locked.push([]);
      for(let r=0;r<rounds;r++){
        const os=a.scores[r]||[],ol=a.locked[r]||[],ns=Array.from({length:newTotal},()=>Array(arrows).fill('')),nl=Array(newTotal).fill(false);
        for(let i=0;i<oldEnds.length;i++)for(let j=0;j<oldEnds[i];j++){const oi=oldStarts[i]-1+j,ni=newStarts[i]-1+j;if(oi<oldTotal){ns[ni]=Array.isArray(os[oi])?[...os[oi]]:Array(arrows).fill('');nl[ni]=!!ol[oi];}}
        a.scores[r]=ns;a.locked[r]=nl;
      }
      const ae=Math.max(1,Number(a.e)||1);let mapped=ae;for(let i=0;i<oldEnds.length;i++)if(ae>=oldStarts[i]&&ae<oldStarts[i]+oldEnds[i]){mapped=newStarts[i]+(ae-oldStarts[i]);break;}a.e=Math.min(mapped,newTotal);
    });
    S.session.currentEnd=Math.min(newCurrent,newTotal);S.setup.ends=newTotal;S.session.setup.ends=newTotal;
  }

  window.applyEnds=function(){
    if(!S.session)return;
    const el=document.getElementById('manageEndValue'),requested=Math.max(1,Number(el?.textContent)||Number(S.setup.ends)||1),current=Math.max(1,Number(S.setup.ends)||1);
    if(S.setup.distanceMode!=='multiple'){
      /* Preserve the established Single Distance behaviour. */
      if(requested<current){for(const a of S.session.archers||[])for(let r=1;r<=S.setup.rounds;r++)for(let e=requested+1;e<=current;e++)if((a.scores?.[r-1]?.[e-1]||[]).some(v=>v!==''&&v!=null)){alert(`Cannot reduce Ends. End ${e} already contains scores.`);return;}}
      const arrows=Math.max(1,Number(S.setup.arrows)||1);for(const a of S.session.archers||[]){for(let r=0;r<S.setup.rounds;r++){const sr=a.scores[r]||(a.scores[r]=[]),lr=a.locked[r]||(a.locked[r]=[]);while(sr.length<requested)sr.push(Array(arrows).fill(''));sr.length=requested;while(lr.length<requested)lr.push(false);lr.length=requested;}a.e=Math.min(a.e||1,requested);}S.setup.ends=requested;S.session.setup.ends=requested;S.session.currentEnd=Math.min(S.session.currentEnd||1,requested);saveUnfinished?.();closeModal?.('manageEndsDialog');scoring?.();return;
    }
    const c=cfg(),oldEnds=[...c.endsByDistance],delta=requested-current;
    if(delta===0){closeModal?.('manageEndsDialog');return;}
    if(delta<0){alert(isBM()?'Untuk Multiple Distances, pengurangan End perlu dibuat melalui tetapan sesi supaya pembahagian jarak kekal betul.':'For Multiple Distances, reducing Ends must be done through session setup so the distance allocation remains correct.');return;}
    if(delta<c.count){alert(isBM()?`Multiple Distances mempunyai ${c.count} jarak. Tambah sekurang-kurangnya ${c.count} Ends — minimum 1 End bagi setiap jarak.`:`Multiple Distances has ${c.count} distances. Add at least ${c.count} Ends — minimum 1 End for each distance.`);return;}
    if(delta%c.count!==0){alert(isBM()?`Ends mesti ditambah mengikut gandaan jumlah jarak. Untuk ${c.count} jarak, tambah ${c.count}, ${c.count*2}, ${c.count*3} Ends dan seterusnya.`:`Ends must be added in multiples of the number of distances. For ${c.count} distances, add ${c.count}, ${c.count*2}, ${c.count*3} Ends, and so on.`);return;}
    const each=delta/c.count,newEnds=oldEnds.map(n=>n+each);rebuildForAddedEnds(oldEnds,newEnds);
    ensureMultiSetup?.();S.setup.multi.endsByDistance=[...newEnds];if(newEnds.every(n=>n===newEnds[0]))S.setup.multi.endsPerDistance=newEnds[0];
    S.session.setup.multi={...(S.session.setup.multi||{}),endsByDistance:[...newEnds]};if(newEnds.every(n=>n===newEnds[0]))S.session.setup.multi.endsPerDistance=newEnds[0];
    saveUnfinished?.();closeModal?.('manageEndsDialog');scoring?.();
  };

  /* Compact distance buttons: same visual scale as Manage Rounds actions. */
  const s=document.createElement('style');s.textContent=`
    .r110-distance-modal{max-width:620px!important}.r110-distance-modal h3{font-size:1.45rem!important;margin-bottom:16px!important}
    .r110-distance-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
    .r110-distance-btn{min-height:62px!important;padding:10px 8px!important;font-size:1.05rem!important;font-weight:900!important;line-height:1.15!important}
    .r110-distance-modal .modal-actions{margin-top:14px!important}.r110-close{min-height:58px!important;font-size:1rem!important}
    .r111-dialog p{font-size:1rem!important;line-height:1.5!important;margin:14px 0 22px!important}.r111-dialog .modal-actions{display:flex!important;justify-content:flex-end!important}.r111-ok{min-width:120px!important}
  `;document.head.appendChild(s);
})();