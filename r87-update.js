/* SCOREBOARD R87 — Pause / Resume Session
   Safely parks an unfinished scoring session so the user can visit Home,
   Settings or change language, then return to the exact scoring state. */
(function(){
  const isBM=()=> (window.getScoreboardLanguage?.()||localStorage.getItem('scoreboard_language_v11'))==='bm';

  function resetScoringUIState(){
    editMode=false; editEnd=null; editDirty=false; selectedScoreCell=null;
    lastScoringArcherIndex=null; lastScoringEnd=null;
  }

  window.pauseScoringSession=function(){
    if(!S.session)return;
    saveUnfinished();
    closeExitDialog();
    S.session=null;
    resetScoringUIState();
    home();
  };

  window.resumePausedSession=function(){
    const d=getUnfinished();
    if(!d?.session)return;
    S.setup={...DEFAULT_SETUP,...d.setup};
    S.session=d.session;
    resetScoringUIState();
    normalizeSession();
    scoring();
  };

  /* Exit from scoring now means Pause, Continue, or permanently discard. */
  showExitDialog=function(){
    if(document.getElementById('exitDialog'))return;
    const bm=isBM(),overlay=document.createElement('div');
    overlay.id='exitDialog';overlay.className='modal-overlay';
    overlay.innerHTML=`<div class="modal-card r87-pause-dialog">
      <h3>${bm?'Jeda Sesi?':'Pause Session?'}</h3>
      <p>${bm?'Simpan sesi semasa dan keluar seketika. Anda boleh menukar tetapan aplikasi atau bahasa, kemudian sambung semula dari markah terakhir.':'Save the current session and leave temporarily. You can change app settings or language, then resume from your last score.'}</p>
      <div class="modal-actions r87-pause-actions">
        <button class="btn green" onclick="pauseScoringSession()">⏸ ${bm?'JEDA SESI':'PAUSE SESSION'}</button>
        <button class="btn soft" onclick="closeExitDialog()">▶ ${bm?'TERUSKAN SCORING':'CONTINUE SCORING'}</button>
        <button class="btn danger" onclick="discardAndExit()">${bm?'BATALKAN SESI':'DISCARD SESSION'}</button>
      </div>
      <small class="r87-pause-note">${bm?'Nota: Struktur sesi seperti Round, End, Arrow, jarak dan matriks kekal dikunci untuk sesi yang sedang dijeda.':'Note: Session structure such as Rounds, Ends, Arrows, distance and matrix stays locked for the paused session.'}</small>
    </div>`;
    document.body.appendChild(overlay);
  };

  /* Put a clear Resume Session action on Home whenever an unfinished session exists. */
  const baseHome=home;
  home=function(){
    baseHome();
    const d=getUnfinished(),menu=document.querySelector('.home .home-menu');
    if(!d?.session||!menu||document.querySelector('.r87-resume-session'))return;
    const bm=isBM(),btn=document.createElement('button');
    btn.className='homebtn hb-green r87-resume-session';
    btn.onclick=resumePausedSession;
    btn.innerHTML=`<span class="home-icon">▶</span><b>${bm?'SAMBUNG SESI':'RESUME SESSION'}</b><span class="home-arrow">›</span>`;
    menu.insertBefore(btn,menu.firstElementChild);
  };

  /* Existing unfinished-session card uses the same clearer terminology. */
  const baseUnfinishedHTML=unfinishedHTML;
  unfinishedHTML=function(data){
    const html=baseUnfinishedHTML(data),bm=isBM();
    return html
      .replace('⚠ UNFINISHED SESSION DETECTED',bm?'⏸ SESI DIJEDA':'⏸ PAUSED SESSION')
      .replace('>\n          RESUME\n        <',`>\n          ${bm?'SAMBUNG SESI':'RESUME SESSION'}\n        <`);
  };

  const style=document.createElement('style');
  style.textContent=`
    .r87-resume-session{box-shadow:0 0 0 3px rgba(0,145,84,.12),0 8px 18px rgba(0,0,0,.08)!important}
    .r87-pause-actions{display:flex!important;flex-direction:column!important;gap:10px!important}
    .r87-pause-actions .btn{width:100%!important;margin:0!important}
    .r87-pause-note{display:block;margin-top:14px;line-height:1.45;color:#667085;text-align:left}
  `;
  document.head.appendChild(style);
})();
