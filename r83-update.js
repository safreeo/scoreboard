/* SCOREBOARD R84 — requested UI/output refinements
   No scoring/session data logic changes. */
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

  /* WhatsApp exact format. Use anchor navigation so the older window.open formatter cannot alter Score %. */
  r76Share=function(h,o){
    const setup=h.setup||DEFAULT_SETUP,ranking=historyRanking(h),dt=dateDash(h.completedAt||h.date),lines=[];
    const bm=isBM(),title=bm?'Keputusan Latihan Memanah':'Archery Practice Results',max=maxScore(setup);
    lines.push(`🎯 *${title}*`);
    lines.push(`*${dt.date}* | ${dt.day} | ${dt.time}`);
    if(setup.practiceType==='target')lines.push(`${resultDistanceText(setup)} | ${setup.target}cm | ${setup.matrix} | ${r78Format(setup)}`);
    else lines.push(`${r77GameHeading(h,setup)} | ${r78Distance(setup)} | ${setup.matrix} | ${r78Format(setup)}`);
    lines.push('--------------------------------------------------');
    const [l1,l2]=r77HighestLabels(setup.matrix),rounds=Math.max(1,Number(setup.rounds)||1);
    ranking.forEach((item,i)=>{
      const a=item.archer,m=item.metrics,[c1,c2]=r77HighestCounts(a,setup.matrix);
      lines.push(`${i+1}. *${a.name}*: ${m.total}/${max} pts`);
      const detail=[];
      if(rounds>1)for(let r=1;r<=rounds;r++)detail.push(`R${r}:${r78RoundTotal(a,r,setup)}`);
      if(o.has('highest')){detail.push(`${l1}:${c1}`);detail.push(`${l2}:${c2}`)}
      if(o.has('average'))detail.push(`${bm?'Purata':'Avg'}:${m.avg.toFixed(2)}`);
      if(o.has('score'))detail.push(`${bm?'Markah':'Score'}: ${m.score.toFixed(1)}%`);
      if(detail.length)lines.push(`    └ ${detail.join(' | ')}`);
      if(i<ranking.length-1)lines.push('');
    });
    lines.push('--------------------------------------------------');lines.push('App: SCOREBOARD');if(h.location)lines.push(`${bm?'Lokasi':'Loc'}: ${h.location}`);
    const a=document.createElement('a');a.href='https://wa.me/?text='+encodeURIComponent(lines.join('\n'));a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
  };

  /* PDF settings dialog includes Download PDF between Print and Close. */
  r76OutputDialog=function(kind,index=viewHistoryIndex){
    document.getElementById('resultOutputDialog')?.remove();
    const pdf=kind==='pdf',bm=isBM(),overlay=document.createElement('div');overlay.id='resultOutputDialog';overlay.className='modal-overlay';
    const opts=pdf?[['title','Edit Title',false],['summary','Scoring Summary',true],['arrowdetails','Arrow-by-Arrow End Details',true],['highest','Two Highest Matrix Scores',true],['score','Score %',true],['average','Average',true],['breakdown','Accuracy & Point Breakdown',false]]:[['title','Edit Title',false],['highest','Two Highest Matrix Scores',true],['score','Score %',true],['average','Average',true]];
    overlay.innerHTML=`<div class="modal-card"><h3>${pdf?(bm?'TETAPAN PDF':'PDF SETTINGS'):(bm?'TETAPAN WHATSAPP':'WHATSAPP SETTINGS')}</h3><div style="display:grid;gap:10px;text-align:left">${opts.map(([id,label,checked])=>`<label><input type="checkbox" data-output="${id}" ${checked?'checked':''} onchange="r76TitleToggle(this)"> ${label}</label>`).join('')}<div id="r76TitleBox" hidden><label class="field-label">New Title</label><input id="r76OutputTitle" placeholder="Enter new title"></div></div><div class="modal-actions r84-output-actions">${pdf?`<button class="btn primary" onclick="r76RunOutput('pdf',${index})">${bm?'CETAK / SIMPAN PDF':'PRINT / SAVE PDF'}</button><button class="btn green" onclick="r84DownloadPDF(${index})">${bm?'MUAT TURUN PDF':'DOWNLOAD PDF'}</button>`:`<button class="btn green" onclick="r76RunOutput('whatsapp',${index})">${bm?'KONGSI KE WHATSAPP':'SHARE TO WHATSAPP'}</button>`}<button class="btn soft" onclick="closeModal('resultOutputDialog')">${bm?'TUTUP':'CLOSE'}</button></div></div>`;
    document.body.appendChild(overlay);
  };
  window.r84DownloadPDF=function(index){const h=S.history[index];if(!h)return;const selected=typeof r76Selected==='function'?r76Selected():new Set(['summary','arrowdetails','highest','score','average']);if(typeof r76ApplyTitle==='function')r76ApplyTitle(h,selected);closeModal('resultOutputDialog');if(typeof r76Print==='function')r76Print(h,selected)};

  /* Matrix Manager: render first, then move the actual input node after the score grid. */
  const baseMatrixManager=matrixManager;
  matrixManager=function(){
    baseMatrixManager();
    const name=document.getElementById('matrixName'),grid=document.querySelector('.matrix-point-grid');if(!name||!grid)return;
    name.classList.add('r84-matrix-name-input');grid.classList.add('r84-matrix-grid');grid.insertAdjacentElement('afterend',name);
  };

  /* Also surface Download PDF directly between PRINT and CLOSE wherever Detailed Result has those buttons. */
  function enhanceResultActions(){
    if(typeof viewHistoryIndex==='undefined')return;
    const buttons=[...document.querySelectorAll('button')];
    const print=buttons.find(b=>/PRINT(?:\s*\/\s*SAVE)?\s*PDF|CETAK(?:\s*\/\s*SIMPAN)?\s*PDF/i.test(b.textContent.trim()));
    if(!print||document.querySelector('.r84-direct-download'))return;
    const close=buttons.find(b=>/^(CLOSE|TUTUP)$/i.test(b.textContent.trim())&&b.parentElement===print.parentElement);
    if(!close)return;
    const dl=document.createElement('button');dl.type='button';dl.className='btn green r84-direct-download';dl.textContent=isBM()?'MUAT TURUN PDF':'DOWNLOAD PDF';dl.onclick=()=>r76OutputDialog('pdf',viewHistoryIndex);close.insertAdjacentElement('beforebegin',dl);
  }
  function schedule(){setTimeout(enhanceResultActions,80)}
  document.addEventListener('click',schedule,true);window.addEventListener('popstate',schedule);setTimeout(schedule,150);

  const style=document.createElement('style');style.textContent=`
    /* Main-screen ENG/BM: one compact segmented pill like the supplied reference. */
    .home .lang-switch-v11{display:grid!important;grid-template-columns:1fr 1fr!important;gap:0!important;width:136px!important;height:42px!important;margin:18px auto 4px!important;padding:4px!important;background:#d4dce5!important;border:0!important;border-radius:999px!important;box-sizing:border-box!important;overflow:hidden!important}
    .home .lang-switch-v11 button{min-width:0!important;width:100%!important;height:34px!important;margin:0!important;padding:0 10px!important;border:0!important;border-radius:999px!important;background:transparent!important;color:#000!important;font-size:16px!important;font-weight:900!important;line-height:34px!important;box-shadow:none!important;opacity:1!important}
    .home .lang-switch-v11 button.active{background:#080b83!important;color:#fff!important}
    .home .lang-switch-v11 button:not(.active){background:transparent!important;color:#000!important}
    .r84-matrix-grid{margin-top:0!important}
    .r84-matrix-name-input{display:block!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;margin:16px 0!important}
    .r84-output-actions{display:flex!important;flex-direction:column!important;gap:10px!important}.r84-output-actions .btn{width:100%!important;margin:0!important}
  `;document.head.appendChild(style);
})();
