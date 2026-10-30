/* SCOREBOARD R110 — larger distance selector + safe multi-distance Add Ends */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';

  function multiConfig(){
    if(typeof resultMultiConfig==='function') return resultMultiConfig(S.session?.setup||S.setup);
    const setup=S.session?.setup||S.setup,m=setup?.multi||{};
    const distances=(Array.isArray(m.distances)?m.distances:[]).map(Number).filter(Boolean);
    const count=Math.max(1,Number(m.count)||distances.length||1);
    const ds=distances.slice(0,count);while(ds.length<count)ds.push(Number(setup.distance)||30);
    const ends=Array.isArray(m.endsByDistance)?m.endsByDistance.slice(0,count).map(v=>Math.max(1,Number(v)||1)):[];
    while(ends.length<count)ends.push(Math.max(1,Number(m.endsPerDistance)||1));
    return {count,distances:ds,endsByDistance:ends};
  }
  function totalEnds(cfg){return cfg.endsByDistance.reduce((s,n)=>s+Math.max(1,Number(n)||1),0)}
  function noEndStarted(){
    if(!S.session)return false;
    return !(S.session.archers||[]).some(a=>(a.scores||[]).some(r=>(r||[]).some(e=>(e||[]).some(v=>v!==''&&v!=null))));
  }
  function resizeSessionEnds(newTotal){
    const arrows=Math.max(1,Number(S.setup.arrows)||1),rounds=Math.max(1,Number(S.setup.rounds)||1);
    (S.session.archers||[]).forEach(a=>{
      while(a.scores.length<rounds)a.scores.push([]);while(a.locked.length<rounds)a.locked.push([]);
      for(let r=0;r<rounds;r++){
        const sr=a.scores[r]||(a.scores[r]=[]),lr=a.locked[r]||(a.locked[r]=[]);
        while(sr.length<newTotal)sr.push(Array(arrows).fill(''));if(sr.length>newTotal)sr.length=newTotal;
        while(lr.length<newTotal)lr.push(false);if(lr.length>newTotal)lr.length=newTotal;
      }
      a.e=Math.min(Math.max(1,Number(a.e)||1),newTotal);
    });
    S.setup.ends=newTotal;S.session.setup.ends=newTotal;S.session.currentEnd=Math.min(Math.max(1,Number(S.session.currentEnd)||1),newTotal);
  }

  /* Replace the Multiple Distances selector with a clearer one-line label. */
  window.manageDistances=function(){
    if(!S.session||S.setup.distanceMode!=='multiple')return;
    document.getElementById('manageDistancesDialog')?.remove();
    const cfg=multiConfig(),round=typeof currentRoundNo==='function'?currentRoundNo():1;
    const blocks=typeof resultMultiBlocks==='function'?resultMultiBlocks(S.setup,round):cfg.distances.map((d,i)=>({distance:d,ends:cfg.endsByDistance[i],start:cfg.endsByDistance.slice(0,i).reduce((s,n)=>s+n,1)}));
    const currentEnd=Math.max(1,Number(S.session.currentEnd)||1);
    const activeIndex=Math.max(0,blocks.findIndex(b=>currentEnd>=b.start&&currentEnd<=b.end));
    const o=document.createElement('div');o.id='manageDistancesDialog';o.className='modal-overlay';
    o.innerHTML=`<div class="modal-card r110-distance-modal"><h3>${isBM()?'PILIH JARAK':'SELECT DISTANCE'}</h3><div class="r110-distance-grid">${blocks.map((b,i)=>`<button type="button" class="btn r110-distance-btn ${i===activeIndex?'primary':'soft'}" onclick="selectDistance(${Number(b.distance)})">${Number(b.distance)}M × ${Number(b.ends)} ENDS</button>`).join('')}</div><div class="modal-actions"><button class="btn soft r110-close" type="button" onclick="closeModal('manageDistancesDialog')">${isBM()?'TUTUP':'CLOSE'}</button></div></div>`;
    document.body.appendChild(o);
  };

  /* Multiple Distances: adding Ends must add at least one End to every distance.
     This is intentionally allowed only before scoring begins, because changing the
     distance blocks after scores exist would shift existing End-to-distance mapping. */
  const baseApplyEnds=window.applyEnds;
  window.applyEnds=function(){
    if(!S.session||S.setup.distanceMode!=='multiple')return baseApplyEnds?.();
    const el=document.getElementById('manageEndValue'),requested=Math.max(1,Number(el?.textContent)||Number(S.setup.ends)||1),current=Math.max(1,Number(S.setup.ends)||1);
    if(requested<=current)return baseApplyEnds?.();
    const cfg=multiConfig(),added=requested-current,minAdd=cfg.count;
    if(!noEndStarted()){
      alert(isBM()?'Untuk Multiple Distances, End hanya boleh ditambah sebelum scoring End pertama bermula.':'For Multiple Distances, Ends can only be added before scoring the first End begins.');
      return;
    }
    if(added<minAdd){
      const msg=isBM()?`Multiple Distances mempunyai ${cfg.count} jarak. Tambah sekurang-kurangnya ${cfg.count} Ends — minimum 1 End bagi setiap jarak.`:`Multiple Distances has ${cfg.count} distances. Add at least ${cfg.count} Ends — minimum 1 End for each distance.`;
      alert(msg);return;
    }
    if(added%cfg.count!==0){
      const next=Math.ceil(added/cfg.count)*cfg.count;
      const msg=isBM()?`Ends perlu ditambah sama rata untuk setiap jarak. Dengan ${cfg.count} jarak, tambah Ends dalam gandaan ${cfg.count} (contoh: ${cfg.count}, ${cfg.count*2}, ${cfg.count*3}). Tambahan semasa: ${added}.`:`Ends must be added equally to every distance. With ${cfg.count} distances, add Ends in multiples of ${cfg.count} (for example: ${cfg.count}, ${cfg.count*2}, ${cfg.count*3}). Current addition: ${added}.`;
      alert(msg);return;
    }
    const each=added/cfg.count,newEnds=cfg.endsByDistance.map(n=>Math.max(1,Number(n)||1)+each),newTotal=newEnds.reduce((s,n)=>s+n,0);
    ensureMultiSetup?.();
    S.setup.multi.endsByDistance=[...newEnds];S.setup.multi.endsPerDistance=newEnds.every(n=>n===newEnds[0])?newEnds[0]:S.setup.multi.endsPerDistance;
    if(!S.session.setup.multi)S.session.setup.multi={};S.session.setup.multi={...S.session.setup.multi,endsByDistance:[...newEnds]};
    if(newEnds.every(n=>n===newEnds[0]))S.session.setup.multi.endsPerDistance=newEnds[0];
    resizeSessionEnds(newTotal);saveUnfinished?.();closeModal?.('manageEndsDialog');scoring?.();
  };

  const s=document.createElement('style');s.textContent=`
    .r110-distance-modal{max-width:620px!important}.r110-distance-modal h3{font-size:1.65rem!important;margin-bottom:22px!important}
    .r110-distance-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}
    .r110-distance-btn{min-height:92px!important;padding:18px 12px!important;font-size:1.35rem!important;font-weight:900!important;line-height:1.2!important;white-space:normal!important}
    .r110-distance-modal .modal-actions{margin-top:20px!important}.r110-close{min-height:72px!important;font-size:1.2rem!important;font-weight:900!important;width:100%!important}
    @media(max-width:430px){.r110-distance-grid{grid-template-columns:1fr!important}.r110-distance-btn{min-height:82px!important;font-size:1.25rem!important}}
  `;document.head.appendChild(s);
})();