/* SCOREBOARD R153 — new distance steppers + round sequence synchronization */
(function(){
  'use strict';
  const active=()=>document.querySelector('.setup-page #multiCount, .setup-page #multiRoundCount') && S.setup?.distanceMode==='multiple' && S.setup?.practiceType==='target';
  function enhance(){
    if(!active())return;
    document.querySelectorAll('.setup-page .multi-distance-grid input[type="number"], .setup-page #multiRoundCount').forEach(input=>{
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
    if(S.setup?.multi?.roundMode==='one')return;
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
  // Repair legacy preset labels after all earlier UI patches have run.
  // Read the actual saved preset, not the currently selected format.
  function refreshPresetLabels(){
    const rows=document.querySelectorAll('.setup-page .preset-list .preset-row');
    if(!rows.length||!Array.isArray(S.presets))return;
    rows.forEach((row,i)=>{
      const p=S.presets[i], label=row.querySelector('.preset-select small');
      if(!p||!label)return;
      const type=String(p.practiceType||'target').toLowerCase();
      const game=type==='3d'||type==='2d';
      const m=p.multi||{};
      const ds=p.distanceMode==='multiple'&&!game&&Array.isArray(m.distances)
        ?m.distances.slice(0,Math.max(1,Number(m.count)||m.distances.length)).filter(v=>Number(v)>0):[];
      const dist=m.roundMode==='one'&&p.distanceMode==='multiple'?m.roundDistances?.slice(0,p.rounds).join('/')+'M':game?(Number(p.gameMinDistance)||5)+'~'+(Number(p.gameMaxDistance)||30)+'M'
        :ds.length?ds.join('/')+'M':(Number(p.distance)||30)+'M';
      const cp=m.roundMode==='one'&&p.distanceMode==='multiple'?m.roundEnds?.slice(0,p.rounds).join('/')+'E':game?(Number(p.checkPoints)||Number(p.ends)||20)+'CP'
        :ds.length&&Array.isArray(m.endsByDistance)?m.endsByDistance.slice(0,ds.length).join('/')+'E'
        :(Number(p.ends)||6)+'E';
      const matrix=String(p.matrix||'');
      const summary=(game?type.toUpperCase()+' • ':'')+dist+(game?'':' • '+(Number(p.target)||80)+'CM')
        +' • '+(Number(p.arrows)||6)+'A × '+cp+' × '+(Number(p.rounds)||1)+'R'+(matrix?' • '+matrix:'');
      if(label.textContent.trim()!==summary)label.textContent=summary;
    });
  }
  let presetRefreshPending=false;
  const presetObserver=new MutationObserver(()=>{
    if(presetRefreshPending)return;
    presetRefreshPending=true;
    requestAnimationFrame(()=>{presetRefreshPending=false;refreshPresetLabels();});
  });
  presetObserver.observe(document.getElementById('app')||document.body,{childList:true,subtree:true,characterData:true});
  refreshPresetLabels();
  window.r153EnhanceSteppers=enhance;
  window.r153RefreshRounds=refreshRounds;
  const observer=new MutationObserver(()=>enhance());
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  document.addEventListener('change',e=>{
    if(e.target?.id==='rounds')requestAnimationFrame(refreshRounds);
  },true);
  enhance();
})();
