/* SCOREBOARD R83 — requested output + matrix UI refinements
   Event-driven only: no MutationObserver and no scoring/session logic changes. */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';
  const maxScore=setup=>{
    if(!setup)return 0;
    const max=typeof maxPointForMatrix==='function'?maxPointForMatrix(setup.matrix):10;
    const arrows=Math.max(1,Number(setup.arrows)||1),rounds=Math.max(1,Number(setup.rounds)||1);
    const units=setup.practiceType&&setup.practiceType!=='target'?Math.max(1,Number(setup.checkPoints||setup.ends)||1):Math.max(1,Number(setup.ends)||1);
    return max*arrows*units*rounds;
  };
  const dateDash=value=>{
    const d=typeof shortDateTime==='function'?shortDateTime(value):null;
    return d?{...d,date:String(d.date).replace(/\//g,'-')}:{date:'',day:'',time:''};
  };

  /* WhatsApp: exact compact format requested. */
  if(typeof r76Share==='function'){
    r76Share=function(h,o){
      const setup=h.setup||DEFAULT_SETUP,ranking=historyRanking(h),dt=dateDash(h.completedAt||h.date),lines=[];
      const bm=isBM(), title=bm?'Keputusan Latihan Memanah':(h.title||'Archery Practice Result'), max=maxScore(setup);
      lines.push(`🎯 *${title}*`);
      lines.push(`*${dt.date}* | ${dt.day} | ${dt.time}`);
      if(setup.practiceType==='target') lines.push(`${resultDistanceText(setup)} | ${setup.target}cm | ${setup.matrix} | ${r78Format(setup)}`);
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
      lines.push('--------------------------------------------------');
      lines.push('App: SCOREBOARD');
      if(h.location)lines.push(`${bm?'Lokasi':'Loc'}: ${h.location}`);
      window.open('https://wa.me/?text='+encodeURIComponent(lines.join('\n')),'_blank');
    };
  }

  /* Output dialog: add DOWNLOAD PDF between print and close. */
  if(typeof r76OutputDialog==='function'){
    r76OutputDialog=function(kind,index=viewHistoryIndex){
      document.getElementById('resultOutputDialog')?.remove();
      const pdf=kind==='pdf',bm=isBM(),overlay=document.createElement('div'); overlay.id='resultOutputDialog';overlay.className='modal-overlay';
      const opts=pdf
        ? [['title','Edit Title',false],['summary','Scoring Summary',true],['arrowdetails','Arrow-by-Arrow End Details',true],['highest','Two Highest Matrix Scores',true],['score','Score %',true],['average','Average',true],['breakdown','Accuracy & Point Breakdown',false]]
        : [['title','Edit Title',false],['highest','Two Highest Matrix Scores',true],['score','Score %',true],['average','Average',true]];
      overlay.innerHTML=`<div class="modal-card"><h3>${pdf?(bm?'TETAPAN PDF':'PDF SETTINGS'):(bm?'TETAPAN WHATSAPP':'WHATSAPP SETTINGS')}</h3><div style="display:grid;gap:10px;text-align:left">${opts.map(([id,label,checked])=>`<label><input type="checkbox" data-output="${id}" ${checked?'checked':''} onchange="r76TitleToggle(this)"> ${label}</label>`).join('')}<div id="r76TitleBox" hidden><label class="field-label">New Title</label><input id="r76OutputTitle" placeholder="Enter new title"></div></div><div class="modal-actions r83-output-actions">${pdf?`<button class="btn primary" onclick="r76RunOutput('pdf',${index})">${bm?'CETAK / SIMPAN PDF':'PRINT / SAVE PDF'}</button><button class="btn green" onclick="r83DownloadPDF(${index})">${bm?'MUAT TURUN PDF':'DOWNLOAD PDF'}</button>`:`<button class="btn green" onclick="r76RunOutput('whatsapp',${index})">${bm?'KONGSI KE WHATSAPP':'SHARE TO WHATSAPP'}</button>`}<button class="btn soft" onclick="closeModal('resultOutputDialog')">${bm?'TUTUP':'CLOSE'}</button></div></div>`;
      document.body.appendChild(overlay);
    };
  }

  /* Browser-native direct PDF download: uses print-ready HTML then opens Save/Download PDF flow.
     This avoids adding a heavy PDF library to the PWA. */
  window.r83DownloadPDF=function(index){
    const h=S.history[index];if(!h)return;
    const selected=typeof r76Selected==='function'?r76Selected():new Set(['summary','arrowdetails','highest','score','average']);
    if(typeof r76ApplyTitle==='function')r76ApplyTitle(h,selected);
    closeModal('resultOutputDialog');
    if(typeof r76Print==='function')r76Print(h,selected);
  };

  /* Matrix manager: matrix choices first, full-width matrix name below. */
  function refineMatrixLayout(){
    if(currentView!=='matrixManager')return;
    const page=document.querySelector('.page');if(!page)return;
    const name=[...page.querySelectorAll('input')].find(el=>/matrix/i.test(el.placeholder||''));
    if(!name||name.dataset.r83Moved)return;
    const card=name.closest('.card')||name.parentElement;if(!card)return;
    const save=[...card.querySelectorAll('button')].find(b=>/SAVE MATRIX|SIMPAN MATRIKS/i.test(b.textContent));
    const grid=[...card.querySelectorAll('div')].find(el=>el!==card&&el.querySelectorAll('input[type="checkbox"]').length>=6);
    if(!grid)return;
    const nameWrap=name.parentElement;
    nameWrap.classList.add('r83-matrix-name');
    grid.classList.add('r83-matrix-grid');
    grid.insertAdjacentElement('afterend',nameWrap);
    if(save&&nameWrap.nextElementSibling!==save.parentElement&&save.parentElement) nameWrap.insertAdjacentElement('afterend',save.parentElement);
    name.dataset.r83Moved='1';
  }
  function schedule(){setTimeout(()=>{try{refineMatrixLayout()}catch(e){console.warn('R83 matrix layout skipped',e)}},60)}
  document.addEventListener('click',schedule,true);window.addEventListener('popstate',schedule);setTimeout(schedule,150);

  const style=document.createElement('style');style.textContent=`
    .r83-matrix-name{width:100%!important;max-width:none!important;margin:14px 0!important;grid-column:1/-1!important}
    .r83-matrix-name input{width:100%!important;max-width:none!important;box-sizing:border-box!important}
    .r83-matrix-grid{margin-top:0!important}
    .r83-output-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}
    .r83-output-actions .btn:last-child{grid-column:1/-1!important}
    @media(max-width:520px){.r83-output-actions{grid-template-columns:1fr!important}.r83-output-actions .btn:last-child{grid-column:auto!important}}
  `;document.head.appendChild(style);
})();
