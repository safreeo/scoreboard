/* SCOREBOARD R82 SAFE — setup steppers, maximum score, WhatsApp refinements
   No MutationObserver: enhancements run only after load/user navigation. */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';

  function matrixMax(matrix){
    const nums=String(matrix||'10-1, X').match(/\d+(?:\.\d+)?/g)?.map(Number)||[10];
    return Math.max(10,...nums.filter(Number.isFinite));
  }
  function setupMaxScore(setup){
    if(!setup) return 0;
    const maxPoint=matrixMax(setup.matrix);
    const arrows=Math.max(1,Number(setup.arrows)||1);
    const rounds=Math.max(1,Number(setup.rounds)||1);
    const ends=setup.practiceType&&setup.practiceType!=='target'
      ? Math.max(1,Number(setup.checkPoints||setup.ends)||1)
      : Math.max(1,Number(setup.ends)||1);
    return maxPoint*arrows*ends*rounds;
  }
  function currentHistory(){
    if(typeof S==='undefined'||!Array.isArray(S.history)) return null;
    if(typeof viewHistoryIndex!=='undefined'&&S.history[viewHistoryIndex]) return S.history[viewHistoryIndex];
    return S.history[0]||S.history[S.history.length-1]||null;
  }
  function stepInput(input,dir){
    const step=Number(input.step)||1, min=input.min!==''?Number(input.min):-Infinity, max=input.max!==''?Number(input.max):Infinity;
    input.value=Math.max(min,Math.min(max,(Number(input.value)||0)+(dir*step)));
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function enhanceSetupSteppers(){
    document.querySelectorAll('.setup-page input[type="number"]').forEach(input=>{
      if(input.dataset.r82SafeStepper==='1') return;
      const parent=input.parentElement; if(!parent)return;
      input.dataset.r82SafeStepper='1'; parent.classList.add('r82-stepper-box');
      const controls=document.createElement('span'); controls.className='r82-step-controls';
      const up=document.createElement('button'),down=document.createElement('button');
      up.type=down.type='button'; up.textContent='▲'; down.textContent='▼'; up.setAttribute('aria-label','Increase'); down.setAttribute('aria-label','Decrease');
      up.onclick=e=>{e.preventDefault();e.stopPropagation();stepInput(input,1)};
      down.onclick=e=>{e.preventDefault();e.stopPropagation();stepInput(input,-1)};
      controls.append(up,down); parent.appendChild(controls);
    });
  }
  function enhanceDetailedResult(){
    const page=document.querySelector('.result-page'); if(!page)return;
    const h=currentHistory(); if(!h)return;
    const setup=h.setup||(typeof DEFAULT_SETUP!=='undefined'?DEFAULT_SETUP:null); if(!setup)return;
    const max=setupMaxScore(setup); if(!max)return;
    const format=document.querySelector('.result-format-meta');
    if(format&&!document.querySelector('.r82-max-score-meta')){
      const span=document.createElement('span'); span.className='r82-max-score-meta';
      span.innerHTML=`<b>${isBM()?'Skor Maksimum':'Maximum Score'}</b> ${max}`;
      format.insertAdjacentElement('afterend',span);
    }
    document.querySelectorAll('.result-archer').forEach(block=>{
      const name=block.querySelector('h3')?.textContent.trim();
      const archer=h.archers?.find(a=>a.name===name); if(!archer)return;
      let total=0;
      if(typeof historyMetrics==='function') total=historyMetrics(archer,setup).total||0;
      else total=(archer.scores||[]).flat(Infinity).reduce((s,v)=>s+(v==='X'?10:(Number(v)||0)),0);
      const first=block.querySelector('.result-archer-total span:first-child');
      if(first&&!first.dataset.r82Max){
        first.dataset.r82Max='1'; const b=first.querySelector('b'); const label=b?b.outerHTML:'<b>TOTAL</b>';
        first.innerHTML=`${label}${total}/${max}`;
      }
    });
  }
  function schedule(){setTimeout(()=>{try{enhanceSetupSteppers();enhanceDetailedResult();}catch(e){console.warn('R82 safe enhancement skipped',e)}},80)}

  const nativeOpen=window.open.bind(window);
  window.open=function(url,target,features){
    try{
      if(typeof url==='string'&&url.startsWith('https://wa.me/?text=')){
        let text=decodeURIComponent(url.slice('https://wa.me/?text='.length));
        const h=currentHistory(), setup=h?.setup||(typeof DEFAULT_SETUP!=='undefined'?DEFAULT_SETUP:null), max=setupMaxScore(setup);
        text=text.replace(/^(\d{2})[\/-](\d{2})[\/-](\d{4})(\s*[|•])/m,'*$1-$2-$3*$4');
        if(max){
          text=text.replace(/(\*\d+\. [^\n]+?\*:\s*)(\d+)(?:\/\d+)?\s+(?:pts|mata)/gi,(m,p,n)=>`${p}${n}/${max} ${isBM()?'mata':'pts'}`);
          text=text.replace(/(Markah|Score)(:\s*)(\d+)(?:\/\d+)?\s*(?:pts|mata)?/gi,(m,l,c,n)=>`${l}${c}${n}/${max} ${isBM()?'mata':'pts'}`);
        }
        if(isBM()){
          text=text.replace('🎯 *Archery Practice Result*','🎯 *Keputusan Latihan Memanah*')
                   .replace(/\bArchery Practice Result\b/g,'Keputusan Latihan Memanah')
                   .replace(/\bLane\b/g,'Lorong').replace(/\bGroup\b/g,'Kumpulan')
                   .replace(/\bAvg:/g,'Purata:').replace(/\bScore:/g,'Markah:')
                   .replace(/^Loc:/gm,'Lokasi:').replace(/\bTotal\b/g,'Jumlah');
        }
        url='https://wa.me/?text='+encodeURIComponent(text);
      }
    }catch(e){console.warn('R82 WhatsApp refinement skipped',e)}
    return nativeOpen(url,target,features);
  };

  function style(){
    if(document.getElementById('r82-safe-style'))return;
    const s=document.createElement('style'); s.id='r82-safe-style'; s.textContent=`
      .r82-stepper-box{position:relative!important;display:flex!important;align-items:stretch!important;overflow:hidden!important}
      .r82-stepper-box input[type=number]{padding-right:42px!important;-moz-appearance:textfield}
      .r82-stepper-box input[type=number]::-webkit-inner-spin-button,.r82-stepper-box input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
      .r82-step-controls{position:absolute;right:0;top:0;bottom:0;width:38px;display:flex;flex-direction:column;border-left:1px solid #c7d0da;background:#edf2f7;z-index:2}
      .r82-step-controls button{flex:1;min-height:0;border:0;background:#edf2f7;color:#0b2f5b;font-size:11px;font-weight:900;line-height:1;padding:0;touch-action:manipulation}
      .r82-step-controls button:first-child{border-bottom:1px solid #c7d0da}
      .r82-max-score-meta{display:inline-flex;gap:6px;align-items:center;margin-left:14px}
      @media print{.r82-step-controls{display:none!important}.r82-max-score-meta{display:inline-flex!important}}
    `; document.head.appendChild(s);
  }
  style();
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  document.addEventListener('click',schedule,true);
  document.addEventListener('change',schedule,true);
  window.addEventListener('popstate',schedule);
  setTimeout(schedule,150);
})();
