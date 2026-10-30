/* SCOREBOARD R95 — direct fixes for scoring settings icon, timer BM and session settings */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';

  /* Rebuild Session Settings after the older R88/R89/R90 overrides. */
  window.openSessionSettings=function(){
    if(!S.session||document.getElementById('sessionSettingsDialog'))return;
    const bm=isBM(),o=document.createElement('div'),lang=bm?'bm':'en';
    const laneOn=S.setup.lane!==false,groupOn=S.setup.group!==false,first=S.session.archers?.[0];
    const laneValue=first?.lane ?? S.session.lane ?? S.setup.laneNumber ?? 1;
    const groupValue=first?.group ?? S.session.group ?? S.setup.groupNumber ?? 1;
    o.id='sessionSettingsDialog';o.className='modal-overlay';o.dataset.lang=lang;
    o.innerHTML=`<div class="modal-card r95-session-settings">
      <h3>${bm?'TETAPAN SESI':'SESSION SETTINGS'}</h3>
      <div class="r95-row"><b>${bm?'Bahasa':'Language'}</b><div data-session-language><button type="button" data-lang="en" class="${lang==='en'?'active':''}">ENG</button><button type="button" data-lang="bm" class="${lang==='bm'?'active':''}">BM</button></div></div>
      <div class="r95-row"><b>${bm?'Pemasa':'Timer'}</b><label><input id="r88Timer" type="checkbox" ${S.setup.timer?'checked':''}> ${bm?'Aktif':'On'}</label></div>
      <div class="r95-row"><b>${bm?'Lorong':'Lane'}</b><div class="r95-value"><label><input id="r90Lane" type="checkbox" ${laneOn?'checked':''}> ${bm?'Aktif':'On'}</label><input id="r90LaneValue" type="number" min="1" value="${laneValue}" ${laneOn?'':'disabled'}></div></div>
      <div class="r95-row"><b>${bm?'Kumpulan':'Group'}</b><div class="r95-value"><label><input id="r90Group" type="checkbox" ${groupOn?'checked':''}> ${bm?'Aktif':'On'}</label><input id="r90GroupValue" type="number" min="1" value="${groupValue}" ${groupOn?'':'disabled'}></div></div>
      <div class="r95-row"><b>${bm?'Arrow / End':'Arrows / End'}</b><div class="r95-step"><button type="button" data-step="-1">−</button><strong id="r88Arrow">${S.setup.arrows}</strong><button type="button" data-step="1">+</button></div></div>
      <small class="r95-note">${bm?'Arrow boleh diubah sebelum markah pertama dimasukkan. Untuk mode Team, nombor Lorong yang sama digunakan untuk semua pemanah kecuali Lorong berlainan telah ditetapkan semasa Tetapan Latihan.':'Arrows can be changed before the first score is entered. In Team mode, the same Lane number is used for all archers unless different Lanes were assigned in Practice Setup.'}</small>
      <div class="r95-actions"><button class="btn primary" type="button" data-apply>${bm?'GUNA':'APPLY'}</button><button class="btn soft" type="button" data-cancel>${bm?'BATAL':'CANCEL'}</button></div>
    </div>`;
    document.body.appendChild(o);
    const syncToggle=(id,val)=>{const c=o.querySelector(id),v=o.querySelector(val);if(c&&v)c.onchange=()=>v.disabled=!c.checked;};syncToggle('#r90Lane','#r90LaneValue');syncToggle('#r90Group','#r90GroupValue');
    o.querySelectorAll('[data-session-language] button').forEach(b=>b.onclick=()=>{o.dataset.lang=b.dataset.lang;o.querySelectorAll('[data-session-language] button').forEach(x=>x.classList.toggle('active',x===b));});
    o.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{const e=o.querySelector('#r88Arrow');e.textContent=Math.max(1,Math.min(12,(Number(e.textContent)||6)+Number(b.dataset.step)));});
    o.querySelector('[data-cancel]').onclick=()=>closeModal('sessionSettingsDialog');
    o.querySelector('[data-apply]').onclick=()=>{applySessionSettings();};
  };

  /* Keep existing apply logic, but language is taken from our dedicated control. */
  const applyBase=window.applySessionSettings;
  window.applySessionSettings=function(){const d=document.getElementById('sessionSettingsDialog'),lang=d?.dataset.lang|| (isBM()?'bm':'en');applyBase();window.setScoreboardLanguage?.(lang);};

  function timerFix(){
    const p=document.querySelector('.timer-page');if(!p)return;const bm=isBM();
    const map=bm?{Preparation:'Persediaan',Shooting:'Panahan',Warning:'Amaran',Stop:'Berhenti'}:{Persediaan:'Preparation',Panahan:'Shooting',Amaran:'Warning',Berhenti:'Stop'};
    p.querySelectorAll('*').forEach(el=>{if(el.children.length===0){const t=(el.textContent||'').trim();if(map[t])el.textContent=map[t];}});
    const buttons=[...p.querySelectorAll('button')],back=p.querySelector('.r89-back-scoring');
    if(back){back.textContent=bm?'KEMBALI KE SCORING':'BACK TO SCORING';back.onclick=e=>{e.preventDefault();scoring();};back.style.setProperty('display','block','important');}
    const reset=buttons.find(b=>/^\s*(RESET|SET SEMULA|TETAP SEMULA)\s*$/i.test(b.textContent||''));if(reset)reset.textContent='RESET';
  }

  function iconFix(){
    document.querySelectorAll('.compact-bottom-nav button').forEach(b=>{if(!/Settings|Tetapan/i.test(b.textContent||''))return;b.classList.add('r95-settings');const i=b.querySelector('.nav-icon');if(i){i.style.setProperty('color','#fff','important');i.style.setProperty('-webkit-text-fill-color','#fff','important');i.style.setProperty('filter','none','important');}});
  }
  function resultFix(){const title=isBM()?'Keputusan Latihan Memanah':'Archery Practice Results';document.querySelectorAll('h1,h2,h3,.page-title').forEach(e=>{if(/^(Archery Detailed Results|Keputusan Terperinci Memanah)$/i.test((e.textContent||'').trim()))e.textContent=title;});}
  function run(){timerFix();iconFix();resultFix();}
  document.addEventListener('click',()=>setTimeout(run,20),true);document.addEventListener('change',()=>setTimeout(run,20),true);new MutationObserver(()=>requestAnimationFrame(run)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});setTimeout(run,80);

  const s=document.createElement('style');s.textContent=`
    .compact-bottom-nav .r95-settings .nav-icon{color:#fff!important;-webkit-text-fill-color:#fff!important;filter:none!important}
    .r95-session-settings .r95-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;padding:12px 0!important;border-bottom:1px solid #e4e7ec!important}.r95-session-settings .r95-row>b{flex:0 0 auto}.r95-session-settings label{display:flex;align-items:center;gap:7px;font-weight:700}.r95-session-settings input[type=checkbox]{width:22px;height:22px}.r95-value{display:flex;align-items:center;gap:10px}.r95-value input[type=number]{width:70px;height:42px;text-align:center;font-weight:800;font-size:17px;border:1px solid #b8c3cf;border-radius:9px}.r95-value input:disabled{opacity:.38}.r95-step{display:flex;align-items:center;gap:10px}.r95-step button,[data-session-language] button{min-width:48px;height:40px;border:1px solid #b8c3cf;border-radius:9px;background:#eef2f6;color:#0b2f5b;font-weight:900}.r95-step strong{min-width:34px;text-align:center;font-size:20px}[data-session-language]{display:flex!important;gap:5px!important;visibility:visible!important;opacity:1!important}[data-session-language] button.active{background:#0b2f5b!important;color:#fff!important;border-color:#0b2f5b!important}.r95-note{display:block;color:#667085;line-height:1.45;margin:14px 0}.r95-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.r95-actions .btn{width:100%;margin:0}
    .timer-page .r89-back-scoring{display:block!important;width:100%!important;background:#0b2f5b!important;color:#fff!important;margin:0 0 12px!important}
  `;document.head.appendChild(s);
})();