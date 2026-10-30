/* SCOREBOARD R86 — PDF language, compact language switch, numeric steppers,
   centered setup values and safe Single/Multiple distance switching. */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';
  const maxScore=setup=>{
    if(!setup)return 0;
    const max=typeof maxPointForMatrix==='function'?maxPointForMatrix(setup.matrix):10;
    const arrows=Math.max(1,Number(setup.arrows)||1),rounds=Math.max(1,Number(setup.rounds)||1);
    const units=setup.practiceType&&setup.practiceType!=='target'?Math.max(1,Number(setup.checkPoints||setup.ends)||1):Math.max(1,Number(setup.ends)||1);
    return max*arrows*units*rounds;
  };
  const dateDash=value=>{const d=typeof shortDateTime==='function'?shortDateTime(value):null;return d?{...d,date:String(d.date).replace(/\//g,'-')}:{date:'',day:'',time:''}};

  r76Share=function(h,o){
    const setup=h.setup||DEFAULT_SETUP,ranking=historyRanking(h),dt=dateDash(h.completedAt||h.date),lines=[];
    const bm=isBM(),title=bm?'Keputusan Latihan Memanah':'Archery Practice Results',max=maxScore(setup);
    lines.push(`🎯 *${title}*`);lines.push(`*${dt.date}* | ${dt.day} | ${dt.time}`);
    if(setup.practiceType==='target')lines.push(`${resultDistanceText(setup)} | ${setup.target}cm | ${setup.matrix} | ${r78Format(setup)}`);
    else lines.push(`${r77GameHeading(h,setup)} | ${r78Distance(setup)} | ${setup.matrix} | ${r78Format(setup)}`);
    lines.push('--------------------------------------------------');
    const [l1,l2]=r77HighestLabels(setup.matrix),rounds=Math.max(1,Number(setup.rounds)||1);
    ranking.forEach((item,i)=>{
      const a=item.archer,m=item.metrics,[c1,c2]=r77HighestCounts(a,setup.matrix),detail=[];
      lines.push(`${i+1}. *${a.name}*: ${m.total}/${max} pts`);
      if(rounds>1)for(let r=1;r<=rounds;r++)detail.push(`R${r}:${r78RoundTotal(a,r,setup)}`);
      if(o.has('highest')){detail.push(`${l1}:${c1}`);detail.push(`${l2}:${c2}`)}
      if(o.has('average'))detail.push(`${bm?'Purata':'Avg'}:${m.avg.toFixed(2)}`);
      if(o.has('score'))detail.push(`${bm?'Markah':'Score'}: ${m.score.toFixed(1)}%`);
      if(detail.length)lines.push(`    └ ${detail.join(' | ')}`);if(i<ranking.length-1)lines.push('');
    });
    lines.push('--------------------------------------------------');lines.push('App: SCOREBOARD');if(h.location)lines.push(`${bm?'Lokasi':'Loc'}: ${h.location}`);
    const a=document.createElement('a');a.href='https://wa.me/?text='+encodeURIComponent(lines.join('\n'));a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
  };

  r76OutputDialog=function(kind,index=viewHistoryIndex){
    document.getElementById('resultOutputDialog')?.remove();const pdf=kind==='pdf',bm=isBM(),overlay=document.createElement('div');overlay.id='resultOutputDialog';overlay.className='modal-overlay';
    const opts=pdf?[['title',bm?'Edit Tajuk':'Edit Title',false],['summary',bm?'Ringkasan Pemarkahan':'Scoring Summary',true],['arrowdetails',bm?'Butiran End Setiap Arrow':'Arrow-by-Arrow End Details',true],['highest',bm?'Dua Markah Matriks Tertinggi':'Two Highest Matrix Scores',true],['score',bm?'Markah %':'Score %',true],['average',bm?'Purata':'Average',true],['breakdown',bm?'Ketepatan & Pecahan Mata':'Accuracy & Point Breakdown',false]]:[['title',bm?'Edit Tajuk':'Edit Title',false],['highest',bm?'Dua Markah Matriks Tertinggi':'Two Highest Matrix Scores',true],['score',bm?'Markah %':'Score %',true],['average',bm?'Purata':'Average',true]];
    overlay.innerHTML=`<div class="modal-card"><h3>${pdf?(bm?'TETAPAN PDF':'PDF SETTINGS'):(bm?'TETAPAN WHATSAPP':'WHATSAPP SETTINGS')}</h3><div style="display:grid;gap:10px;text-align:left">${opts.map(([id,label,checked])=>`<label><input type="checkbox" data-output="${id}" ${checked?'checked':''} onchange="r76TitleToggle(this)"> ${label}</label>`).join('')}<div id="r76TitleBox" hidden><label class="field-label">${bm?'Tajuk Baharu':'New Title'}</label><input id="r76OutputTitle" placeholder="${bm?'Masukkan tajuk baharu':'Enter new title'}"></div></div><div class="modal-actions r85-output-actions">${pdf?`<button class="btn primary" onclick="r76RunOutput('pdf',${index})">${bm?'CETAK / SIMPAN PDF':'PRINT / SAVE PDF'}</button><button class="btn green" onclick="r85DownloadPDF(${index})">${bm?'MUAT TURUN PDF':'DOWNLOAD PDF'}</button>`:`<button class="btn green" onclick="r76RunOutput('whatsapp',${index})">${bm?'KONGSI KE WHATSAPP':'SHARE TO WHATSAPP'}</button>`}<button class="btn soft" onclick="closeModal('resultOutputDialog')">${bm?'TUTUP':'CLOSE'}</button></div></div>`;document.body.appendChild(overlay);
  };
  window.r85DownloadPDF=function(index){const h=S.history[index];if(!h)return;const selected=r76Selected();r76ApplyTitle(h,selected);closeModal('resultOutputDialog');r76Print(h,selected)};

  r76Print=function(h,o){
    const bm=isBM(),setup=h.setup||DEFAULT_SETUP,ranking=historyRanking(h),dt=dateDash(h.completedAt||h.date),w=window.open('','_blank');if(!w)return;
    const [l1,l2]=r77HighestLabels(setup.matrix),T=bm?{title:'Keputusan Terperinci Memanah',date:'Tarikh / Hari / Masa',loc:'Lokasi',dist:'Jarak',face:'Muka Sasaran',matrix:'Matriks',format:'Format',summary:'Ringkasan Pemarkahan',rank:'Kedudukan',archer:'Pemanah',total:'Jumlah',score:'Markah %',avg:'Purata',round:'ROUND',end:'End',details:'Butiran End Setiap Arrow',breakdown:'Ketepatan & Pecahan Mata'}:{title:'Archery Detailed Results',date:'Date / Day / Time',loc:'Location',dist:'Distance',face:'Target Face',matrix:'Matrix',format:'Format',summary:'Scoring Summary',rank:'Rank',archer:'Archer',total:'Total',score:'Score %',avg:'Average',round:'ROUND',end:'End',details:'Arrow-by-Arrow End Details',breakdown:'Accuracy & Point Breakdown'};
    const rows=ranking.map((item,i)=>{const a=item.archer,m=item.metrics,[c1,c2]=r77HighestCounts(a,setup.matrix);return `<tr><td>${i+1}</td><td>${esc(a.name)}</td><td>${m.total}</td>${o.has('highest')?`<td>${c1}</td><td>${c2}</td>`:''}${o.has('score')?`<td>${m.score.toFixed(1)}%</td>`:''}${o.has('average')?`<td>${m.avg.toFixed(2)}</td>`:''}</tr>`}).join('');
    const th=`<th>${T.rank}</th><th>${T.archer}</th><th>${T.total}</th>${o.has('highest')?`<th>${esc(l1)}</th><th>${esc(l2)}</th>`:''}${o.has('score')?`<th>${T.score}</th>`:''}${o.has('average')?`<th>${T.avg}</th>`:''}`;
    const meta=`<table class="meta"><tr><th>${T.date}</th><td>${dt.date} | ${dt.day} | ${dt.time}</td></tr>${h.location?`<tr><th>${T.loc}</th><td>${esc(h.location)}</td></tr>`:''}<tr><th>${T.dist}</th><td>${esc(typeof resultDistanceText==='function'?resultDistanceText(setup):String(setup.distance||''))}</td></tr>${setup.practiceType==='target'?`<tr><th>${T.face}</th><td>${esc(setup.target)}cm</td></tr>`:''}<tr><th>${T.matrix}</th><td>${esc(setup.matrix)}</td></tr><tr><th>${T.format}</th><td>${esc(typeof r78Format==='function'?r78Format(setup):'')}</td></tr></table>`;
    const details=o.has('summary')?`<h2>${T.summary}</h2><table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>`:'';
    const arrowDetails=o.has('arrowdetails')?ranking.map(item=>{const a=item.archer,rounds=Math.max(1,Number(setup.rounds)||1),ends=Math.max(1,Number(setup.ends)||1),arrows=Math.max(1,Number(setup.arrows)||1);let body='';for(let r=1;r<=rounds;r++){const rr=Array.from({length:ends},(_,ei)=>{const vals=a.scores?.[r-1]?.[ei]||Array(arrows).fill('');const total=vals.reduce((s,v)=>s+scoreValue(v),0);return `<tr><td>${ei+1}</td>${Array.from({length:arrows},(_,ai)=>`<td>${esc(vals[ai]||'-')}</td>`).join('')}<td><b>${total}</b></td></tr>`}).join('');body+=`<h4>${T.round} ${r}</h4><table><thead><tr><th>${T.end}</th>${Array.from({length:arrows},(_,i)=>`<th>A${i+1}</th>`).join('')}<th>${T.total}</th></tr></thead><tbody>${rr}</tbody></table>`}return `<h3>${esc(a.name)}</h3>${body}`}).join(''):'';
    const breakdown=o.has('breakdown')?ranking.map(item=>`<h3>${esc(item.archer.name)} — ${T.breakdown}</h3>${archerSessionBreakdownHTML(item.archer,setup.matrix)}`).join(''):'';
    const title=h.title&&h.title!=='Archery Detailed Results'?h.title:T.title;
    w.document.write(`<!doctype html><html><head><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{text-align:center;font-size:24px}h2{font-size:18px;margin-top:22px}table{width:100%;border-collapse:collapse;margin:12px 0 24px}th,td{border:1px solid #999;padding:7px;text-align:center}.meta th{text-align:left;width:34%}.meta td{text-align:left}.breakdown-row{display:grid;grid-template-columns:90px 1fr 60px;gap:8px;margin:6px 0}.breakdown-track{background:#ddd}.breakdown-fill{height:18px;background:#555}.footer{text-align:center;margin-top:30px;font-weight:bold}@media print{button{display:none}}</style></head><body><h1>${esc(title)}</h1>${meta}${details}${arrowDetails}${breakdown}<div class="footer">PWA: SCOREBOARD</div><script>window.onload=()=>setTimeout(()=>window.print(),150)<\/script></body></html>`);w.document.close();
  };

  const baseMatrixManager=matrixManager;matrixManager=function(){baseMatrixManager();const name=document.getElementById('matrixName'),grid=document.querySelector('.matrix-point-grid');if(!name||!grid)return;name.classList.add('r85-matrix-name-input');grid.classList.add('r85-matrix-grid');grid.insertAdjacentElement('afterend',name)};

  /* Keep Single Distance Ends independent from Multiple Distances total ends. */
  let r86SingleEnds=Math.max(1,Number(S.setup?.ends)||Number(DEFAULT_SETUP.ends)||6);
  const r86BaseSetDistanceMode=setDistanceMode;
  setDistanceMode=function(mode){
    const next=mode==='multiple'?'multiple':'single';
    if(next==='multiple'&&S.setup.distanceMode!=='multiple'){
      syncSetup();
      r86SingleEnds=Math.max(1,Number(S.setup.ends)||Number(DEFAULT_SETUP.ends)||6);
      preserveNextScrollY=window.scrollY;
      resetFormatOptions();
      S.setup.distanceMode='multiple';
      S.setup.ends=multiTotalEnds();
      setup();
      return;
    }
    if(next==='single'&&S.setup.distanceMode==='multiple'){
      syncSetup();
      preserveNextScrollY=window.scrollY;
      resetFormatOptions();
      S.setup.distanceMode='single';
      S.setup.ends=Math.max(1,Number(r86SingleEnds)||Number(DEFAULT_SETUP.ends)||6);
      setup();
      return;
    }
    return r86BaseSetDistanceMode(mode);
  };

  function enhanceNumberInputs(){
    if(currentView!=='setup')return;
    document.querySelectorAll('.page input[type="number"]').forEach(input=>{
      if(input.closest('.r85-stepper')||input.dataset.r85Stepper)return;input.dataset.r85Stepper='1';
      const wrap=document.createElement('div');wrap.className='r85-stepper';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
      const controls=document.createElement('div');controls.className='r85-step-controls';controls.innerHTML='<button type="button" aria-label="Increase">▲</button><button type="button" aria-label="Decrease">▼</button>';wrap.appendChild(controls);
      const step=dir=>{const old=Number(input.value)||0,inc=Number(input.step)||1,min=input.min!==''?Number(input.min):-Infinity,max=input.max!==''?Number(input.max):Infinity;input.value=String(Math.min(max,Math.max(min,old+dir*inc)));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))};
      controls.children[0].onclick=e=>{e.preventDefault();e.stopPropagation();step(1)};controls.children[1].onclick=e=>{e.preventDefault();e.stopPropagation();step(-1)};
    });
  }
  function enhanceResultActions(){const buttons=[...document.querySelectorAll('button')],print=buttons.find(b=>/PRINT(?:\s*\/\s*SAVE)?\s*PDF|CETAK(?:\s*\/\s*SIMPAN)?\s*PDF/i.test(b.textContent.trim()));if(!print||document.querySelector('.r85-direct-download'))return;const close=buttons.find(b=>/^(CLOSE|TUTUP)$/i.test(b.textContent.trim())&&b.parentElement===print.parentElement);if(!close)return;const dl=document.createElement('button');dl.type='button';dl.className='btn green r85-direct-download';dl.textContent=isBM()?'MUAT TURUN PDF':'DOWNLOAD PDF';dl.onclick=()=>r76OutputDialog('pdf',viewHistoryIndex);close.insertAdjacentElement('beforebegin',dl)}
  function schedule(){setTimeout(()=>{enhanceNumberInputs();enhanceResultActions()},60)}document.addEventListener('click',schedule,true);document.addEventListener('change',schedule,true);window.addEventListener('popstate',schedule);setTimeout(schedule,150);

  const style=document.createElement('style');style.textContent=`
    .home .lang-switch-v11{display:grid!important;grid-template-columns:1fr 1fr!important;gap:0!important;width:104px!important;height:32px!important;margin:16px auto 3px!important;padding:3px!important;background:#d8dee6!important;border:0!important;border-radius:999px!important;box-sizing:border-box!important;overflow:hidden!important}
    .home .lang-switch-v11 button{min-width:0!important;width:100%!important;height:26px!important;margin:0!important;padding:0 6px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:#111!important;font-size:12px!important;font-weight:900!important;line-height:26px!important;box-shadow:none!important;opacity:1!important}
    .home .lang-switch-v11 button.active{background:#0b2f5b!important;color:#fff!important}.home .lang-switch-v11 button:not(.active){background:transparent!important;color:#111!important}
    .r85-matrix-grid{margin-top:0!important}.r85-matrix-name-input{display:block!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;margin:16px 0!important}
    .r85-output-actions{display:flex!important;flex-direction:column!important;gap:10px!important}.r85-output-actions .btn{width:100%!important;margin:0!important}
    .r85-stepper{display:grid!important;grid-template-columns:minmax(0,1fr) 42px!important;width:100%!important;min-width:0!important;overflow:hidden!important;border:1px solid #b9c5d2!important;border-radius:12px!important;background:#fff!important;box-sizing:border-box!important}
    .r85-stepper>input[type="number"]{width:100%!important;min-width:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;margin:0!important;background:#fff!important;-moz-appearance:textfield!important;text-align:center!important;padding-left:4px!important;padding-right:4px!important;box-sizing:border-box!important}
    .r85-stepper>input[type="number"]::-webkit-inner-spin-button,.r85-stepper>input[type="number"]::-webkit-outer-spin-button{-webkit-appearance:none!important;margin:0!important}
    .r85-step-controls{display:grid!important;grid-template-rows:1fr 1fr!important;border-left:1px solid #c3ccd6!important;background:#eef2f6!important}.r85-step-controls button{border:0!important;background:transparent!important;color:#0b2f5b!important;font-size:13px!important;font-weight:900!important;padding:0!important;min-height:25px!important;line-height:1!important}.r85-step-controls button+button{border-top:1px solid #c3ccd6!important}
  `;document.head.appendChild(style);
})();
