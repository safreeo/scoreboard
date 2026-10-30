/* SCOREBOARD R109 — saved exit, Home spacing, Setup CTA, multi-distance PDF */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';

  function resetScoringState(){
    try{editMode=false;editEnd=null;editDirty=false;selectedScoreCell=null;lastScoringArcherIndex=null;lastScoringEnd=null;}catch(_){ }
  }
  window.exitSavedSession=function(){
    closeExitDialog?.();
    clearUnfinished?.();
    S.session=null;
    resetScoringState();
    home();
  };

  /* Completed/saved sessions should have a clean exit path; Discard is not required. */
  const r109BaseExit=window.showExitDialog;
  window.showExitDialog=function(){
    if(!S.session)return r109BaseExit?.();
    const saved=!!S.session.savedToHistory || (typeof allSessionComplete==='function' && allSessionComplete());
    if(!saved)return r109BaseExit?.();
    document.getElementById('exitDialog')?.remove();
    const bm=isBM(),o=document.createElement('div');o.id='exitDialog';o.className='modal-overlay';
    o.innerHTML=`<div class="modal-card r109-exit-dialog">
      <h3>${bm?'Sesi Telah Disimpan':'Session Saved'}</h3>
      <p>${bm?'Keputusan sesi ini telah disimpan. Anda boleh keluar ke Home tanpa membuang keputusan.':'This session has been saved. You can exit to Home without discarding the result.'}</p>
      <div class="modal-actions r109-exit-actions">
        <button class="btn green" type="button" onclick="exitSavedSession()">${bm?'SIMPAN & KELUAR KE HOME':'SAVED & EXIT TO HOME'}</button>
        <button class="btn soft" type="button" onclick="closeExitDialog()">${bm?'TERUSKAN SCORING':'CONTINUE SCORING'}</button>
      </div>
    </div>`;
    document.body.appendChild(o);
  };

  /* Latest PDF renderer: split Multiple Distances into one table per distance. */
  window.r76Print=function(h,o){
    const bm=isBM(),setup=h.setup||DEFAULT_SETUP,ranking=historyRanking(h),dt=(typeof shortDateTime==='function'?shortDateTime(h.completedAt||h.date):{date:'',day:'',time:''}),w=window.open('','_blank');if(!w)return;
    const T=bm?{title:'Keputusan Terperinci Memanah',date:'Tarikh / Hari / Masa',loc:'Lokasi',dist:'Jarak',face:'Muka Sasaran',matrix:'Matriks',format:'Format',summary:'Ringkasan Pemarkahan',rank:'Kedudukan',archer:'Pemanah',total:'Jumlah',score:'Markah %',avg:'Purata',round:'ROUND',end:'End'}:{title:'Archery Detailed Results',date:'Date / Day / Time',loc:'Location',dist:'Distance',face:'Target Face',matrix:'Matrix',format:'Format',summary:'Scoring Summary',rank:'Rank',archer:'Archer',total:'Total',score:'Score %',avg:'Average',round:'ROUND',end:'End'};
    const [l1,l2]=r77HighestLabels(setup.matrix);
    const rows=ranking.map((item,i)=>{const a=item.archer,m=item.metrics,[c1,c2]=r77HighestCounts(a,setup.matrix);return `<tr><td>${i+1}</td><td>${esc(a.name)}</td><td>${m.total}</td>${o.has('highest')?`<td>${c1}</td><td>${c2}</td>`:''}${o.has('score')?`<td>${m.score.toFixed(1)}%</td>`:''}${o.has('average')?`<td>${m.avg.toFixed(2)}</td>`:''}</tr>`}).join('');
    const th=`<th>${T.rank}</th><th>${T.archer}</th><th>${T.total}</th>${o.has('highest')?`<th>${esc(l1)}</th><th>${esc(l2)}</th>`:''}${o.has('score')?`<th>${T.score}</th>`:''}${o.has('average')?`<th>${T.avg}</th>`:''}`;
    const dist=typeof resultDistanceText==='function'?resultDistanceText(setup):String(setup.distance||'');
    const fmt=typeof r78Format==='function'?r78Format(setup):'';
    const meta=`<table class="meta"><tr><th>${T.date}</th><td>${dt.date} | ${dt.day} | ${dt.time}</td></tr>${h.location?`<tr><th>${T.loc}</th><td>${esc(h.location)}</td></tr>`:''}<tr><th>${T.dist}</th><td>${esc(dist)}</td></tr>${setup.practiceType==='target'?`<tr><th>${T.face}</th><td>${esc(setup.target)}cm</td></tr>`:''}<tr><th>${T.matrix}</th><td>${esc(setup.matrix)}</td></tr><tr><th>${T.format}</th><td>${esc(fmt)}</td></tr></table>`;
    const details=o.has('summary')?`<h2>${T.summary}</h2><table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>`:'';
    const arrows=Math.max(1,Number(setup.arrows)||1),rounds=Math.max(1,Number(setup.rounds)||1);
    const arrowDetails=o.has('arrowdetails')?ranking.map(item=>{
      const a=item.archer;let body='';
      for(let r=1;r<=rounds;r++){
        const blocks=setup.distanceMode==='multiple'&&typeof resultMultiBlocks==='function'?resultMultiBlocks(setup,r):[{distance:Number(setup.distance)||0,start:1,end:Math.max(1,Number(setup.ends)||1),ends:Math.max(1,Number(setup.ends)||1)}];
        blocks.forEach(block=>{let blockTotal=0;const rr=Array.from({length:block.ends},(_,li)=>{const ei=block.start-1+li,vals=a.scores?.[r-1]?.[ei]||Array(arrows).fill('');const total=vals.reduce((s,v)=>s+scoreValue(v),0);blockTotal+=total;return `<tr><td>${li+1}</td>${Array.from({length:arrows},(_,ai)=>`<td>${esc(vals[ai]||'-')}</td>`).join('')}<td><b>${total}</b></td></tr>`}).join('');const heading=setup.distanceMode==='multiple'?`${T.round} ${r} - ${block.distance}m`:`${T.round} ${r}`;const foot=setup.distanceMode==='multiple'?`${block.distance}m ${T.total.toUpperCase()}`:`${T.round} ${r} ${T.total.toUpperCase()}`;body+=`<h4>${heading}</h4><table><thead><tr><th>${T.end}</th>${Array.from({length:arrows},(_,i)=>`<th>A${i+1}</th>`).join('')}<th>${T.total}</th></tr></thead><tbody>${rr}</tbody><tfoot><tr><td colspan="${arrows+1}"><b>${foot}</b></td><td><b>${blockTotal}</b></td></tr></tfoot></table>`;});
      }
      return `<h3>${esc(a.name)}</h3>${body}`;
    }).join(''):'';
    const breakdown=o.has('breakdown')?ranking.map(item=>`<h3>${esc(item.archer.name)} — ${bm?'Ketepatan & Pecahan Mata':'Accuracy & Point Breakdown'}</h3>${archerSessionBreakdownHTML(item.archer,setup.matrix)}`).join(''):'';
    const title=h.title&&h.title!=='Archery Detailed Results'?h.title:T.title;
    w.document.write(`<!doctype html><html><head><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{text-align:center;font-size:24px}h2{font-size:18px;margin-top:22px}h3{margin-top:22px}h4{margin:18px 0 8px}table{width:100%;border-collapse:collapse;margin:10px 0 22px}th,td{border:1px solid #999;padding:7px;text-align:center}.meta th{text-align:left;width:34%}.meta td{text-align:left}tfoot td{background:#eef3f7}.breakdown-row{display:grid;grid-template-columns:90px 1fr 60px;gap:8px;margin:6px 0}.breakdown-track{background:#ddd}.breakdown-fill{height:18px;background:#555}.footer{text-align:center;margin-top:30px;font-weight:bold}@media print{button{display:none}}</style></head><body><h1>${esc(title)}</h1>${meta}${details}${arrowDetails}${breakdown}<div class="footer">PWA: SCOREBOARD</div><script>window.onload=()=>setTimeout(()=>window.print(),150)<\/script></body></html>`);w.document.close();
  };

  function enhanceUI(){
    const homeEl=document.querySelector('.home');
    if(homeEl){homeEl.classList.add('r109-home');}
    if(currentView==='setup'){
      const start=[...document.querySelectorAll('button')].find(b=>/START SCORING SESSION|MULA SESI SCORING/i.test((b.textContent||'').trim()));
      if(start){start.classList.add('r109-start-session');const p=start.parentElement;if(p)p.classList.add('r109-start-wrap');}
    }
  }
  document.addEventListener('click',()=>setTimeout(enhanceUI,30),true);
  document.addEventListener('change',()=>setTimeout(enhanceUI,30),true);
  new MutationObserver(()=>requestAnimationFrame(enhanceUI)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(enhanceUI,100);

  const s=document.createElement('style');s.textContent=`
    .r109-exit-actions{display:flex!important;flex-direction:column!important;gap:10px!important}.r109-exit-actions .btn{width:100%!important;margin:0!important}
    .home.r109-home .tagline{margin-bottom:22px!important}
    .home.r109-home .home-menu{margin-top:0!important}
    .home.r109-home .lang-switch-v11{width:124px!important;height:38px!important;padding:3px!important}
    .home.r109-home .lang-switch-v11 button{height:32px!important;line-height:32px!important;font-size:14px!important}
    .r109-start-wrap{bottom:max(12px,env(safe-area-inset-bottom))!important;padding-bottom:0!important}
    .r109-start-session{margin-bottom:0!important}
    @media(max-height:800px){.home.r109-home .tagline{margin-bottom:15px!important}}
  `;document.head.appendChild(s);
})();
