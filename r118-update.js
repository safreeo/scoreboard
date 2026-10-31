/* SCOREBOARD R118 — completed-current styling, compact round buttons, optional multi timer */
(function(){
  /* Multiple Distances timer is optional. Unticked = 0 sec; ticked = 120 sec. */
  function ensureTimerFlag(){
    if(!S.setup||S.setup.practiceType!=='target'||S.setup.distanceMode!=='multiple')return;
    const m=ensureMultiSetup?.();if(!m)return;
    if(typeof m.timerEnabled!=='boolean')m.timerEnabled=false;
    if(!m.timerEnabled)m.timeEnd=0;
  }
  window.r118ToggleMultiTimer=function(checked){
    const m=ensureMultiSetup?.();if(!m)return;
    m.timerEnabled=!!checked;
    m.timeEnd=m.timerEnabled?120:0;
    S.setup.timer=m.timerEnabled;
    const input=document.getElementById('multiTime');if(input)input.value=String(m.timeEnd);
  };
  function addTimerCheckbox(){
    if(typeof currentView!=='undefined'&&currentView!=='setup')return;
    if(S.setup?.practiceType!=='target'||S.setup?.distanceMode!=='multiple')return;
    ensureTimerFlag();const m=ensureMultiSetup?.();
    const input=document.getElementById('multiTime');if(!input)return;
    input.value=String(m.timerEnabled?(Number(m.timeEnd)||120):0);
    const field=input.closest('.setup-field');if(!field||field.querySelector('.r118-timer-check'))return;
    const label=field.querySelector('label');if(!label)return;
    const cb=document.createElement('input');cb.type='checkbox';cb.className='r118-timer-check';cb.checked=!!m.timerEnabled;cb.setAttribute('aria-label','Enable timer');
    cb.onchange=()=>window.r118ToggleMultiTimer(cb.checked);
    label.appendChild(cb);
  }

  /* Keep setup state consistent when syncSetup reads multiTime. */
  const oldSync=window.syncSetup;
  if(typeof oldSync==='function')window.syncSetup=function(){const r=oldSync.apply(this,arguments);if(S.setup?.practiceType==='target'&&S.setup?.distanceMode==='multiple'){const m=ensureMultiSetup?.();if(m){if(typeof m.timerEnabled!=='boolean')m.timerEnabled=false;if(!m.timerEnabled)m.timeEnd=0;S.setup.timer=!!m.timerEnabled;}}return r;};

  function stabilize(){ensureTimerFlag();addTimerCheckbox();}
  document.addEventListener('click',()=>setTimeout(stabilize,0),true);document.addEventListener('change',()=>setTimeout(stabilize,0),true);
  new MutationObserver(()=>requestAnimationFrame(stabilize)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});setTimeout(stabilize,80);

  const s=document.createElement('style');s.textContent=`
    /* Completed + selected/current: remain green, add black outline. */
    #manageRoundsDialog .round-select-btn.complete.active,
    #manageRoundsDialog .round-select-btn.complete.r116-selected,
    #manageEndsDialog .cp-select-btn.complete.active,
    .r114-distance-modal .r110-distance-btn.complete.active,
    .r114-distance-modal .r110-distance-btn.complete.r117-selected{
      background:#169b69!important;color:#fff!important;border:2px solid #111!important;
      outline:2px solid #111!important;outline-offset:1px!important;box-shadow:none!important
    }
    /* Incomplete selected/current remains white + black outline. */
    #manageRoundsDialog .round-select-btn.active:not(.complete),
    #manageRoundsDialog .round-select-btn.r116-selected:not(.complete),
    #manageEndsDialog .cp-select-btn.active:not(.complete),
    .r114-distance-modal .r110-distance-btn.active:not(.complete),
    .r114-distance-modal .r110-distance-btn.r117-selected:not(.complete){background:#fff!important;color:#0a2138!important;border:2px solid #111!important;outline:2px solid #111!important;outline-offset:1px!important}

    /* Round buttons: compact height like CLOSE, wider, smaller SELECT-sized text. */
    #manageRoundsDialog .round-select-btn{height:50px!important;min-height:50px!important;min-width:150px!important;width:auto!important;padding:6px 18px!important;font-size:.96rem!important;line-height:1!important;white-space:nowrap!important;box-sizing:border-box!important}
    #manageRoundsDialog .round-select-grid,#manageRoundsDialog .round-buttons{gap:10px!important;grid-template-columns:repeat(2,minmax(150px,1fr))!important}

    /* Timer checkbox sits beside Time / End label. */
    .setup-page #multiTime.closest{position:relative}.setup-page .r118-timer-check{appearance:none;-webkit-appearance:none;width:22px!important;height:22px!important;min-width:22px!important;margin:0 0 0 10px!important;border:2px solid #777!important;border-radius:4px!important;background:#fff!important;vertical-align:middle!important;position:relative!important;top:4px!important;cursor:pointer!important}
    .setup-page .r118-timer-check:checked{background:#0b6faf!important;border-color:#0b6faf!important}
    .setup-page .r118-timer-check:checked:after{content:'✓';position:absolute;left:3px;top:-2px;color:#fff;font-size:17px;font-weight:900}
    .setup-page #multiTime{pointer-events:none!important}
    @media(max-width:520px){#manageRoundsDialog .round-select-btn{min-width:130px!important;font-size:.92rem!important}}
  `;document.head.appendChild(s);
})();