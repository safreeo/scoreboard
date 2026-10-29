/* SCOREBOARD R82 — setup steppers, maximum score, WhatsApp refinements */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';

  function setupMaxScore(setup){
    if(!setup) return 0;
    const vals=(typeof matrixValues==='function'?matrixValues(setup.matrix||'10-1, X'):[]).map(v=>v==='X'?10:(Number(v)||0));
    const maxPoint=Math.max(1,...vals);
    const arrows=Math.max(1,Number(setup.arrows)||1);
    const rounds=Math.max(1,Number(setup.rounds)||1);
    const ends=setup.practiceType&&setup.practiceType!=='target'
      ? Math.max(1,Number(setup.checkPoints||setup.ends)||1)
      : Math.max(1,Number(setup.ends)||1);
    return maxPoint*arrows*ends*rounds;
  }

  function stepInput(input,dir){
    const step=Number(input.step)||1;
    const min=input.min!==''?Number(input.min):-Infinity;
    const max=input.max!==''?Number(input.max):Infinity;
    let next=(Number(input.value)||0)+(dir*step);
    next=Math.max(min,Math.min(max,next));
    input.value=next;
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function enhanceSetupSteppers(){
    document.querySelectorAll('.setup-page input[type="number"]').forEach(input=>{
      if(input.dataset.r82Stepper==='1') return;
      input.dataset.r82Stepper='1';
      const parent=input.parentElement;
      if(!parent) return;
      parent.classList.add('r82-stepper-box');
      const controls=document.createElement('span');
      controls.className='r82-step-controls';
      const up=document.createElement('button'); up.type='button'; up.className='r82-step-up'; up.textContent='▲'; up.setAttribute('aria-label','Increase');
      const down=document.createElement('button'); down.type='button'; down.className='r82-step-down'; down.textContent='▼'; down.setAttribute('aria-label','Decrease');
      up.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();stepInput(input,1);});
      down.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();stepInput(input,-1);});
      controls.append(up,down); parent.appendChild(controls);
    });
  }

  function enhanceDetailedResult(){
    const page=document.querySelector('.result-page');
    if(!page||typeof S==='undefined'||typeof viewHistoryIndex==='undefined') return;
    const h=S.history?.[viewHistoryIndex]; if(!h) return;
    const setup=h.setup||DEFAULT_SETUP;
    const max=setupMaxScore(setup); if(!max) return;

    const format=document.querySelector('.result-format-meta');
    if(format&&!document.querySelector('.r82-max-score-meta')){
      const span=document.createElement('span');
      span.className='r82-max-score-meta';
      span.innerHTML=`<b>${isBM()?'Skor Maksimum':'Maximum Score'}</b>${max}`;
      format.insertAdjacentElement('afterend',span);
    }

    document.querySelectorAll('.result-archer').forEach(block=>{
      const name=block.querySelector('h3')?.textContent.trim();
      const archer=h.archers?.find(a=>a.name===name); if(!archer) return;
      const total=typeof historyMetrics==='function'?historyMetrics(archer,setup).total:0;
      const first=block.querySelector('.result-archer-total span:first-child');
      if(first){ const label=first.querySelector('b')?.outerHTML||'<b>TOTAL</b>'; first.innerHTML=`${label}${total}/${max}`; }
    });
  }

  const nativeOpen=window.open.bind(window);
  window.open=function(url,target,features){
    try{
      if(typeof url==='string'&&url.startsWith('https://wa.me/?text=')){
        let text=decodeURIComponent(url.slice('https://wa.me/?text='.length));
        const h=(typeof S!=='undefined'&&typeof viewHistoryIndex!=='undefined')?S.history?.[viewHistoryIndex]:null;
        const max=setupMaxScore(h?.setup||DEFAULT_SETUP);
        text=text.replace(/^(\d{2})\/(\d{2})\/(\d{4})(\s*\|)/m,'*$1-$2-$3*$4');
        if(max) text=text.replace(/(\*\d+\. [^\n]+?\*:\s*)(\d+)\s+pts/g,`$1$2/${max} pts`);
        if(isBM()){
          text=text.replace('🎯 *Archery Practice Result*','🎯 *Keputusan Latihan Memanah*')
                   .replace(/\bLane\b/g,'Lorong').replace(/\bGroup\b/g,'Kumpulan')
                   .replace(/\bAvg:/g,'Purata:').replace(/\bScore:/g,'Skor:').replace(/^Loc:/gm,'Lokasi:');
        }
        url='https://wa.me/?text='+encodeURIComponent(text);
      }
    }catch(e){}
    return nativeOpen(url,target,features);
  };

  function style(){
    if(document.getElementById('r82-style')) return;
    const s=document.createElement('style'); s.id='r82-style'; s.textContent=`
      .r82-stepper-box{position:relative!important;display:flex!important;align-items:stretch!important;overflow:hidden!important}
      .r82-stepper-box input[type=number]{padding-right:42px!important;-moz-appearance:textfield}
      .r82-stepper-box input[type=number]::-webkit-inner-spin-button,.r82-stepper-box input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
      .r82-step-controls{position:absolute;right:0;top:0;bottom:0;width:38px;display:flex;flex-direction:column;border-left:1px solid #c7d0da;background:#edf2f7}
      .r82-step-controls button{flex:1;min-height:0;border:0;background:#edf2f7;color:#0b2f5b;font-size:11px;font-weight:900;line-height:1;padding:0;touch-action:manipulation}
      .r82-step-controls button:first-child{border-bottom:1px solid #c7d0da}
      .r82-max-score-meta{display:inline-flex;gap:8px;align-items:center}
      @media print{.r82-step-controls{display:none!important}.r82-max-score-meta{display:inline-flex!important}}
    `; document.head.appendChild(s);
  }

  let busy=false; function run(){ if(busy)return; busy=true; queueMicrotask(()=>{busy=false;style();enhanceSetupSteppers();enhanceDetailedResult();}); }
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',run,{once:true}); setTimeout(run,0);
})();
