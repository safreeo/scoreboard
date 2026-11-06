/* SCOREBOARD R153 — new distance steppers + round sequence synchronization */
(function(){
  'use strict';
  const active=()=>document.querySelector('.setup-page #multiCount') && S.setup?.distanceMode==='multiple' && S.setup?.practiceType==='target';
  function enhance(){
    if(!active())return;
    document.querySelectorAll('.setup-page .multi-distance-grid input[type="number"]').forEach(input=>{
      const parent=input.parentElement;
      if(!parent||parent.querySelector('.r82-step-controls'))return;
      parent.classList.add('r82-stepper-box');
      input.dataset.r82SafeStepper='1';
      const controls=document.createElement('span');
      controls.className='r82-step-controls';
      for(const [symbol,label] of [['▲','Increase'],['▼','Decrease']]){
        const b=document.createElement('button');
        b.type='button';b.textContent=symbol;b.setAttribute('aria-label',label);
        controls.appendChild(b);
      }
      parent.appendChild(controls);
    });
  }
  function refreshRounds(){
    if(!active())return;
    const input=document.getElementById('rounds');
    if(!input)return;
    const n=Math.max(1,Math.trunc(Number(input.value)||1));
    S.setup.rounds=n;
    const m=ensureMultiSetup();
    while(m.orders.length<n)m.orders.push(m.orders.length%2===0?'asc':'desc');
    if(m.orders.length>n)m.orders.length=n;
    const list=document.querySelector('.setup-page .multi-round-list');
    if(list){
      while(list.children.length>n)list.lastElementChild.remove();
      for(let i=list.children.length;i<n;i++){
        const row=document.createElement('div');
        row.className='multi-round-row';
        row.innerHTML='<div><b>ROUND '+(i+1)+'</b><small></small></div><select id="roundOrder'+i+'"><option value="asc">ASCENDING</option><option value="desc">DESCENDING</option></select>';
        row.querySelector('select').onchange=e=>{setRoundOrder(i,e.target.value);};
        list.appendChild(row);
      }
      [...list.children].forEach((row,i)=>{
        const seq=multiSequence(i+1);
        const small=row.querySelector('small');
        if(small)small.textContent=seq.map(x=>x.distance+'m ('+m.endsByDistance[x.originalIndex]+'E)').join(' → ');
        const select=row.querySelector('select');if(select)select.value=m.orders[i];
      });
    }
    const preview=document.querySelector('.setup-page .multi-preview');
    if(preview){
      const totalEnds=multiTotalEnds()*n;
      const totalArrows=totalEnds*(Number(S.setup.arrows)||1);
      preview.innerHTML='<b>FORMAT PREVIEW</b>'+Array.from({length:n},(_,i)=>'<div>R'+(i+1)+': '+multiSequence(i+1).map(x=>x.distance+'m × '+m.endsByDistance[x.originalIndex]+'E').join(' → ')+'</div>').join('')+'<small>'+S.setup.arrows+' Arrows/End • Total '+totalEnds+' Ends • '+totalArrows+' Arrows</small>';
    }
  }
  window.r153EnhanceSteppers=enhance;
  window.r153RefreshRounds=refreshRounds;
  const observer=new MutationObserver(()=>enhance());
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  document.addEventListener('change',e=>{
    if(e.target?.id==='rounds')requestAnimationFrame(refreshRounds);
  },true);
  enhance();
})();
