/* SCOREBOARD R94 — session language, timer BM labels, stable settings icon, practice-result titles */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';

  function sessionLanguage(){
    const d=document.getElementById('sessionSettingsDialog'); if(!d)return;
    const rows=[...d.querySelectorAll('.r88-setting-row')];
    const row=rows.find(r=>/^(Language|Bahasa)/i.test((r.textContent||'').trim())); if(!row)return;
    /* Build outside the old choice classes: the language cleanup removes those outside Home. */
    let box=row.querySelector('[data-r94-language]');
    if(!box){box=document.createElement('div');box.dataset.r94Language='1';box.className='r94-language';row.appendChild(box);}
    const lang=d.dataset.lang|| (isBM()?'bm':'en');
    box.innerHTML='<button type="button" data-r94="en">ENG</button><button type="button" data-r94="bm">BM</button>';
    box.querySelectorAll('button').forEach(b=>{
      b.classList.toggle('active',b.dataset.r94===lang);
      b.onclick=e=>{e.preventDefault();e.stopPropagation();const next=b.dataset.r94;d.dataset.lang=next;window.setScoreboardLanguage?.(next);setTimeout(()=>{sessionLanguage();localizeSession();},60);};
    });
  }

  function localizeSession(){
    const d=document.getElementById('sessionSettingsDialog');if(!d)return;const bm=isBM();
    const replacements=bm?{'SESSION SETTINGS':'TETAPAN SESI','Language':'Bahasa','Timer':'Pemasa','Lane':'Lorong','Group':'Kumpulan','Arrows / End':'Arrow / End','APPLY':'GUNA','CANCEL':'BATAL','On':'Aktif'}:{'TETAPAN SESI':'SESSION SETTINGS','Bahasa':'Language','Pemasa':'Timer','Lorong':'Lane','Kumpulan':'Group','Arrow / End':'Arrows / End','GUNA':'APPLY','BATAL':'CANCEL','Aktif':'On'};
    d.querySelectorAll('h3,b,button,label').forEach(el=>{if(el.children.length===0){const t=(el.textContent||'').trim();if(replacements[t])el.textContent=replacements[t];}});
  }

  function timer(){
    const p=document.querySelector('.timer-page');if(!p)return;const bm=isBM();
    const buttons=[...p.querySelectorAll('button')];
    const reset=buttons.find(b=>/^\s*(RESET|TETAP SEMULA|SET SEMULA)\s*$/i.test(b.textContent||''));if(reset)reset.textContent='RESET';
    const back=buttons.find(b=>/BACK TO SCORING|KEMBALI KE SCORING/i.test(b.textContent||''));
    if(back){back.textContent=bm?'KEMBALI KE SCORING':'BACK TO SCORING';back.onclick=e=>{e.preventDefault();e.stopPropagation();scoring();};}
    const map=bm?{'Preparation':'Persediaan','Shooting':'Panahan','Warning':'Amaran','Stop':'Berhenti'}:{'Persediaan':'Preparation','Panahan':'Shooting','Amaran':'Warning','Berhenti':'Stop'};
    p.querySelectorAll('span,b,div').forEach(el=>{if(!el.children.length){const t=(el.textContent||'').trim();if(map[t])el.textContent=map[t];}});
    /* Settings icons are always white immediately, including first paint after render. */
    p.querySelectorAll('.r90-timer-settings-btn,.r89-back-scoring').forEach(b=>{if(/SETTINGS|TETAPAN/i.test(b.textContent||''))b.style.setProperty('color','#fff','important');});
  }

  /* Standardize Detailed Result wording throughout visible UI. */
  function resultTitles(){
    const bm=isBM(),title=bm?'Keputusan Latihan Memanah':'Archery Practice Results';
    document.querySelectorAll('h1,h2,h3,.page-title').forEach(el=>{const t=(el.textContent||'').trim();if(/^(Archery Detailed Results|Keputusan Terperinci Memanah)$/i.test(t))el.textContent=title;});
  }

  /* Override print title only; keep R86 PDF body/layout and output functions intact. */
  const basePrint=window.r76Print;
  if(typeof basePrint==='function') window.r76Print=function(h,o){
    const old=h?.title;if(h && (!old||/^(Archery Detailed Results|Keputusan Terperinci Memanah)$/i.test(old)))h.title=isBM()?'Keputusan Latihan Memanah':'Archery Practice Results';
    try{return basePrint(h,o);}finally{if(h)h.title=old;}
  };

  function run(){sessionLanguage();localizeSession();timer();resultTitles();}
  document.addEventListener('click',()=>setTimeout(run,25),true);document.addEventListener('change',()=>setTimeout(run,25),true);
  new MutationObserver(()=>setTimeout(run,0)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});setTimeout(run,80);

  const s=document.createElement('style');s.textContent=`
    #sessionSettingsDialog [data-r94-language]{display:flex!important;visibility:visible!important;opacity:1!important;margin-left:auto!important;gap:4px!important;position:relative!important;z-index:999!important;min-width:112px!important;justify-content:flex-end!important}
    #sessionSettingsDialog [data-r94-language] button{display:block!important;visibility:visible!important;opacity:1!important;width:52px!important;height:38px!important;padding:0!important;border:1px solid #b8c3cf!important;border-radius:9px!important;background:#eef2f6!important;color:#0b2f5b!important;font-weight:900!important;font-size:14px!important}
    #sessionSettingsDialog [data-r94-language] button.active{background:#0b2f5b!important;color:#fff!important;border-color:#0b2f5b!important}
    .timer-page .r90-timer-settings-btn,.timer-page .r89-back-scoring{color:#fff!important}
  `;document.head.appendChild(s);
})();
