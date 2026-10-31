/* SCOREBOARD R120 — stable round stepper + persistent multi-distance timer */
(function(){
  function multi(){try{return ensureMultiSetup?.();}catch(_){return null;}}

  /* Timer checkbox is state-driven and rebound after any setup DOM change. */
  function bindTimer(){
    if(typeof currentView!=='undefined'&&currentView!=='setup')return;
    if(S.setup?.practiceType!=='target'||S.setup?.distanceMode!=='multiple')return;
    const m=multi(),input=document.getElementById('multiTime');if(!m||!input)return;
    if(typeof m.timerEnabled!=='boolean')m.timerEnabled=false;
    input.value=String(m.timerEnabled?(Number(m.timeEnd)||120):0);
    const field=input.closest('.setup-field'),label=field?.querySelector('label');if(!label)return;
    let cb=label.querySelector('.r118-timer-check');
    if(!cb){cb=document.createElement('input');cb.type='checkbox';cb.className='r118-timer-check';cb.setAttribute('aria-label','Enable timer');label.appendChild(cb);}
    cb.checked=!!m.timerEnabled;
    cb.onclick=e=>e.stopPropagation();
    cb.onchange=e=>{
      e.stopPropagation();m.timerEnabled=!!cb.checked;m.timeEnd=m.timerEnabled?120:0;S.setup.timer=m.timerEnabled;input.value=String(m.timeEnd);
      try{saveState?.();}catch(_){}
    };
  }

  /* Update only Round Sequence + Format Preview in place. Never call setup(). */
  function refreshRoundUI(){
    const root=document.querySelector('.setup-page');if(!root)return;
    const m=multi(),rounds=Math.max(1,Number(S.setup.rounds)||1);if(!m)return;
    while(m.orders.length<rounds)m.orders.push(m.orders.length%2===0?'asc':'desc');
    if(m.orders.length>rounds)m.orders.length=rounds;

    const heading=[...root.querySelectorAll('*')].find(el=>el.children.length===0&&/^(ROUND SEQUENCE|URUTAN ROUND)$/i.test((el.textContent||'').trim()));
    if(heading){
      const parent=heading.parentElement;
      const cards=[...parent.children].filter(el=>el!==heading&&!/FORMAT PREVIEW/i.test(el.textContent||''));
      cards.forEach((el,i)=>{if(i>=rounds)el.remove();});
      /* Existing renderer creates additional cards when syncSetup handles the value; do not rebuild page here. */
    }
    const preview=[...root.querySelectorAll('*')].find(el=>/FORMAT PREVIEW/i.test((el.textContent||''))&&el.children.length===0)?.parentElement;
    if(preview){
      const distances=(m.distances||[]).slice(0,Number(m.count)||3);
      const lines=[];
      for(let r=0;r<rounds;r++){
        const arr=(m.orders[r]==='desc'?[...distances].reverse():distances);
        lines.push(`R${r+1}: `+arr.map(d=>`${Number(d.distance)||0}m × ${Number(d.ends)||0}E`).join(' → '));
      }
      const els=[...preview.querySelectorAll('div,p')].filter(el=>/^R\d+:/i.test((el.textContent||'').trim()));
      if(els.length){els[0].textContent=lines.join(' | ');els.slice(1).forEach(e=>e.remove());}
      const totalEnds=distances.reduce((s,d)=>s+(Number(d.ends)||0),0)*rounds;
      const arrows=Number(S.setup.arrows)||6,total=totalEnds*arrows;
      const summary=[...preview.querySelectorAll('div,p')].find(el=>/Arrows\/End|Arrow\/End/i.test(el.textContent||''));
      if(summary)summary.textContent=`${arrows} Arrows/End • Total ${totalEnds} Ends • ${total} Arrows`;
    }
  }

  function stepRound(input,dir){
    const oldY=window.scrollY,step=Number(input.step)||1,min=input.min!==''?Number(input.min):1,max=input.max!==''?Number(input.max):99;
    const next=Math.max(min,Math.min(max,(Number(input.value)||1)+dir*step));if(next===Number(input.value))return;
    input.value=String(next);S.setup.rounds=next;
    const m=multi();if(m){while(m.orders.length<next)m.orders.push(m.orders.length%2===0?'asc':'desc');if(m.orders.length>next)m.orders.length=next;}
    refreshRoundUI();bindTimer();
    requestAnimationFrame(()=>window.scrollTo(0,oldY));
  }

  function bindRound(){
    if(typeof currentView!=='undefined'&&currentView!=='setup')return;
    if(S.setup?.practiceType!=='target'||S.setup?.distanceMode!=='multiple')return;
    const input=document.getElementById('rounds'),box=input?.closest('.r82-stepper-box');if(!input||!box)return;
    const b=box.querySelectorAll('.r82-step-controls button');if(b.length<2)return;
    b[0].onclick=e=>{e.preventDefault();e.stopPropagation();stepRound(input,1);};
    b[1].onclick=e=>{e.preventDefault();e.stopPropagation();stepRound(input,-1);};
  }
  function stabilize(){bindTimer();bindRound();}
  document.addEventListener('click',()=>setTimeout(stabilize,0),true);
  document.addEventListener('change',()=>setTimeout(stabilize,0),true);
  new MutationObserver(()=>requestAnimationFrame(stabilize)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setTimeout(stabilize,80);

  const s=document.createElement('style');s.textContent=`
    .setup-page .r118-timer-check{appearance:none!important;-webkit-appearance:none!important;width:20px!important;height:20px!important;min-width:20px!important;max-width:20px!important;min-height:20px!important;max-height:20px!important;box-sizing:border-box!important;margin:0 0 0 8px!important;padding:0!important;border:1.5px solid #777!important;border-radius:3px!important;background:#fff!important;position:static!important;vertical-align:-3px!important;cursor:pointer!important}
    .setup-page .r118-timer-check:checked{background:#0b6faf!important;border-color:#0b6faf!important}.setup-page .r118-timer-check:checked:after{content:'✓';display:block!important;color:#fff!important;font-size:15px!important;line-height:17px!important;text-align:center!important;font-weight:900!important}
    #manageRoundsDialog .round-select-grid,#manageRoundsDialog .round-buttons{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;width:100%!important;gap:8px!important;box-sizing:border-box!important}
    #manageRoundsDialog .round-select-btn{width:100%!important;min-width:0!important;height:50px!important;min-height:50px!important;padding:6px 8px!important;font-size:.96rem!important;line-height:1!important;white-space:nowrap!important;box-sizing:border-box!important}
    .setup-page .r82-step-controls button{transform:none!important;transition:none!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
  `;document.head.appendChild(s);
})();