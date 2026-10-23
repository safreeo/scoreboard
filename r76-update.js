/* SCOREBOARD R76 — scoring/game workflow, presets, result output settings */

const SCOREBOARD_RELEASE = "R76";
const SCOREBOARD_VERSION = "1.0.1";
const SCOREBOARD_UPDATED = "23 October 2026";

/* ---------- Quick Presets display ---------- */
const r76Setup = setup;
setup = function() {
  r76Setup();
  document.querySelectorAll('.preset-row').forEach((row, i) => {
    const p = S.presets?.[i];
    const small = row.querySelector('.preset-select small');
    if (!p || !small) return;
    const game = p.practiceType && p.practiceType !== 'target';
    small.textContent = game
      ? `${p.gameMinDistance || 5}~${p.gameMaxDistance || 30}M • ${p.arrows}A × ${p.checkPoints || p.ends || 20}E × ${p.rounds || 1}R • ${p.matrix || '10-1, X'}`
      : `${p.distance || 30}M • ${p.target || 80}CM • ${p.arrows || 6}A × ${p.ends || 6}E × ${p.rounds || 1}R • ${p.matrix || '10-1, X'}`;
  });
};

/* ---------- Lane / Group required validation ---------- */
const r76StartSession = startSession;
startSession = async function() {
  syncSetup();
  const names = S.setup.mode === 'team' ? [...S.active] : ['__personal__'];
  if (S.setup.lane) {
    const missingLane = names.some(n => !String(S.lanes?.[n] || '').trim());
    if (missingLane) { await scoreboardAlert('Enter Lane No.', 'SCOREBOARD'); return; }
  }
  if (S.setup.group) {
    const missingGroup = names.some(n => !String(S.groups?.[n] || '').trim());
    if (missingGroup) { await scoreboardAlert('Enter Group No.', 'SCOREBOARD'); return; }
  }
  return r76StartSession();
};

/* ---------- 2D/3D: rotate Archer 1 -> Archer 2 at same CP ---------- */
const r76MoveAfterSubmit = moveAfterSubmit;
moveAfterSubmit = function() {
  if (!S.session || S.setup.practiceType === 'target') return r76MoveAfterSubmit();
  const round = currentRoundNo();
  const cp = currentEndNo();
  const submittedIndex = S.session.idx;
  const submitted = S.session.archers[submittedIndex];
  submitted.r = round;
  submitted.e = cp;

  for (let offset = 1; offset < S.session.archers.length; offset++) {
    const i = (submittedIndex + offset) % S.session.archers.length;
    const candidate = S.session.archers[i];
    if (!endLocked(candidate, round, cp)) {
      S.session.idx = i;
      candidate.r = round;
      candidate.e = cp;
      S.session.currentRound = round;
      S.session.currentEnd = cp;
      saveUnfinished();
      scoring();
      return;
    }
  }

  const total = Math.max(1, Number(S.setup.checkPoints || S.setup.ends) || 1);
  for (let next = cp + 1; next <= total; next++) {
    for (let i = 0; i < S.session.archers.length; i++) {
      const candidate = S.session.archers[i];
      if (!endLocked(candidate, round, next)) {
        S.session.idx = i;
        candidate.r = round;
        candidate.e = next;
        S.session.currentRound = round;
        S.session.currentEnd = next;
        saveUnfinished();
        scoring();
        return;
      }
    }
  }
  saveUnfinished();
  scoring();
};

/* ---------- 2D/3D Live Summary ---------- */
const r76Summary = summary;
summary = function() {
  if (!S.session || S.setup.practiceType === 'target') return r76Summary();
  const ranking = S.session.archers.map(a => {
    const totals = [];
    for (let r=1; r<=S.setup.rounds; r++) for (let cp=1; cp<=S.setup.ends; cp++) {
      if (endHasScore(a,r,cp)) totals.push(endTotal(a,r,cp));
    }
    const sorted = [...totals].sort((x,y)=>y-x);
    return { a, first: sorted[0] || 0, second: sorted[1] || 0, total: totals.reduce((x,y)=>x+y,0) };
  }).sort((x,y)=> y.total-x.total || y.first-x.first || y.second-x.second);
  const firstName = ranking[0]?.a?.name || '';
  const groupNo = String(S.session?.groups?.[firstName] || S.session?.groups?.['__personal__'] || '').trim();
  const title = `${S.setup.practiceType.toUpperCase()} GAME${S.setup.group && groupNo ? ` - GROUP ${esc(groupNo)}` : ''}`;
  const rows = ranking.map((x,i)=>`<tr><td>${i+1}</td><td class="summary-archer summary-archer-name"><b>${esc(x.a.name)}</b></td><td><b>${x.first}</b></td><td><b>${x.second}</b></td><td><b>${x.total}</b></td></tr>`).join('');
  page(`${head('LIVE SUMMARY')}<section class="card"><div class="summary-meta"><b>${title}</b><span>${S.setup.arrows}A × ${S.setup.checkPoints || S.setup.ends}CP × ${S.setup.rounds}R</span></div></section><section class="card"><div class="section">CURRENT RANKING</div><div class="responsive-scroll"><table class="summary-table live-summary-table"><thead><tr><th>Rank</th><th class="summary-archer">Archer</th><th>1st Highest</th><th>2nd Highest</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table></div></section><button class="btn primary full" onclick="scoring()">BACK TO SCORING</button>`, 'summary');
};

/* ---------- Manage Round selection: tap selects only; SELECT confirms ---------- */
let r76PendingRound = null;
const r76ManageRounds = manageRounds;
manageRounds = function() {
  r76ManageRounds();
  r76PendingRound = currentRoundNo();
  const modal = document.getElementById('manageRoundsDialog');
  if (!modal) return;
  modal.querySelectorAll('.round-select-btn').forEach((btn, i) => {
    btn.onclick = () => r76ChooseRound(i+1);
  });
  const note = modal.querySelector('.round-select-note');
  if (note) note.innerHTML = `<div style="text-align:left;line-height:1.8"><div><span class="round-green-dot"></span> Completed</div><div>🔵 Current Round</div><div>⚪ Incomplete</div></div>`;
  const actions = modal.querySelectorAll('.modal-actions');
  const last = actions[actions.length-1];
  if (last) last.innerHTML = `<button class="btn primary" onclick="r76ConfirmRound()">SELECT</button><button class="btn soft" onclick="closeModal('manageRoundsDialog')">CLOSE</button>`;
  r76PaintRoundSelection();
};
function r76ChooseRound(n){ r76PendingRound=n; r76PaintRoundSelection(); }
function r76PaintRoundSelection(){
  const modal=document.getElementById('manageRoundsDialog'); if(!modal)return;
  modal.querySelectorAll('.round-select-btn').forEach((b,i)=>b.classList.toggle('active',i+1===r76PendingRound));
}
function r76ConfirmRound(){ if(r76PendingRound!=null) selectRound(r76PendingRound); }

/* ---------- Select CP selection: tap selects only; SELECT confirms ---------- */
let r76PendingCP = null;
gameCPSelectorHTML = function() {
  if (!S.session || S.setup.practiceType === 'target') return '';
  const a=activeArcher(), round=currentRoundNo(), current=currentEndNo();
  const total=Math.max(1,Number(S.setup.checkPoints||S.setup.ends)||1);
  r76PendingCP=current;
  return `<div class="cp-select-block"><div class="round-select-title">SELECT CP</div><div class="cp-select-grid">${Array.from({length:total},(_,i)=>{const cp=i+1,complete=!!a&&endLocked(a,round,cp),active=cp===current;return `<button class="cp-select-btn ${complete?'complete':''} ${active?'active':''}" onclick="r76ChooseCP(${cp})">CP${cp}</button>`}).join('')}</div><div class="cp-select-note" style="text-align:left;line-height:1.8"><div><span class="cp-green-dot"></span> Completed</div><div>🔵 Current Checkpoint</div><div>⚪ Incomplete</div></div><div class="modal-actions"><button class="btn primary" onclick="r76ConfirmCP()">SELECT</button></div></div>`;
};
function r76ChooseCP(n){ r76PendingCP=n; const modal=document.getElementById('manageEndsDialog'); if(!modal)return; modal.querySelectorAll('.cp-select-btn').forEach((b,i)=>b.classList.toggle('active',i+1===n)); }
function r76ConfirmCP(){ if(r76PendingCP!=null) selectGameCP(r76PendingCP); }

/* ---------- Detailed Result output settings ---------- */
function r76Highest(archer, setup){
  const vals=[]; for(let r=1;r<=Math.max(1,Number(setup.rounds)||1);r++) for(let e=1;e<=Math.max(1,Number(setup.ends)||1);e++) { const row=archer.scores?.[r-1]?.[e-1]||[]; if(row.some(v=>v!=='')) vals.push(row.reduce((s,v)=>s+scoreValue(v),0)); }
  vals.sort((a,b)=>b-a); return [vals[0]||0, vals[1]||0];
}
function r76OutputDialog(kind,index=viewHistoryIndex){
  document.getElementById('resultOutputDialog')?.remove();
  const pdf=kind==='pdf'; const overlay=document.createElement('div'); overlay.id='resultOutputDialog'; overlay.className='modal-overlay';
  const opts=pdf
    ? [['title','Edit Title'],['summary','Scoring Summary'],['highest','Two highest scores'],['score','Score %'],['average','Average'],['breakdown','Accuracy & Point Breakdown']]
    : [['title','Edit Title'],['highest','Two highest scores'],['score','Score %'],['average','Average']];
  overlay.innerHTML=`<div class="modal-card"><h3>${pdf?'PRINT PDF':'WHATSAPP'} SETTINGS</h3><div style="display:grid;gap:10px;text-align:left">${opts.map(([id,label])=>`<label><input type="checkbox" data-output="${id}" ${id==='title'?'':'checked'} onchange="r76TitleToggle(this)"> ${label}</label>`).join('')}<div id="r76TitleBox" hidden><label class="field-label">New Title</label><input id="r76OutputTitle" placeholder="Enter new title"></div></div><div class="modal-actions"><button class="btn ${pdf?'primary':'green'}" onclick="r76RunOutput('${kind}',${index})">${pdf?'PRINT / SAVE PDF':'SHARE TO WHATSAPP'}</button><button class="btn soft" onclick="closeModal('resultOutputDialog')">CLOSE</button></div></div>`;
  document.body.appendChild(overlay);
}
function r76TitleToggle(el){ if(el.dataset.output==='title') document.getElementById('r76TitleBox').hidden=!el.checked; }
function r76Selected(){ return new Set([...document.querySelectorAll('#resultOutputDialog [data-output]:checked')].map(x=>x.dataset.output)); }
function r76ApplyTitle(h, selected){ const v=document.getElementById('r76OutputTitle')?.value.trim(); if(selected.has('title')&&v){h.title=v; if(S.session?.id===h.id)S.session.title=v; save();} }
function r76RunOutput(kind,index){ const h=S.history[index]; if(!h)return; const selected=r76Selected(); r76ApplyTitle(h,selected); closeModal('resultOutputDialog'); if(kind==='whatsapp')r76Share(h,selected); else r76Print(h,selected); }
function r76Share(h,o){
  const setup=h.setup||DEFAULT_SETUP, ranking=historyRanking(h), dt=shortDateTime(h.completedAt||h.date), lines=[];
  lines.push(`🎯 *${h.title||'Archery Practice Result'}*`); lines.push(`${dt.date} | ${dt.day} | ${dt.time}`);
  if(setup.practiceType!=='target') lines.push(`${setup.practiceType.toUpperCase()} GAME | ${setup.gameMinDistance||5}~${setup.gameMaxDistance||30}m | ${setup.matrix}`); else lines.push(`${resultDistanceText(setup)} | ${setup.target}cm | ${setup.matrix}`);
  lines.push('--------------------------------------------------');
  ranking.forEach((item,i)=>{ const a=item.archer,m=item.metrics,[hi1,hi2]=r76Highest(a,setup); let d=`*${i+1}. ${a.name}*: ${m.total} pts`; if(o.has('highest'))d+=` | 1st Highest:${hi1} | 2nd Highest:${hi2}`; if(o.has('score'))d+=` | Score:${m.score.toFixed(1)}%`; if(o.has('average'))d+=` | Avg:${m.avg.toFixed(2)}`; lines.push(d); });
  lines.push('--------------------------------------------------'); lines.push('PWA: SCOREBOARD'); if(h.location)lines.push(`Loc: ${h.location}`);
  window.open('https://wa.me/?text='+encodeURIComponent(lines.join('\n')),'_blank');
}
function r76Print(h,o){
  const setup=h.setup||DEFAULT_SETUP, ranking=historyRanking(h), dt=shortDateTime(h.completedAt||h.date); const w=window.open('','_blank'); if(!w)return;
  const rows=ranking.map((item,i)=>{const a=item.archer,m=item.metrics,[x,y]=r76Highest(a,setup);return `<tr><td>${i+1}</td><td>${esc(a.name)}</td><td>${m.total}</td>${o.has('highest')?`<td>${x}</td><td>${y}</td>`:''}${o.has('score')?`<td>${m.score.toFixed(1)}%</td>`:''}${o.has('average')?`<td>${m.avg.toFixed(2)}</td>`:''}</tr>`}).join('');
  const head=`<th>Rank</th><th>Archer</th><th>Total</th>${o.has('highest')?'<th>1st Highest</th><th>2nd Highest</th>':''}${o.has('score')?'<th>Score %</th>':''}${o.has('average')?'<th>Average</th>':''}`;
  const details=o.has('summary')?`<h2>Scoring Summary</h2><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`:'';
  const breakdown=o.has('breakdown')?ranking.map(item=>`<h3>${esc(item.archer.name)} — Accuracy & Point Breakdown</h3>${archerSessionBreakdownHTML(item.archer,setup.matrix)}`).join(''):'';
  w.document.write(`<!doctype html><html><head><title>${esc(h.title||'SCOREBOARD')}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{text-align:center}table{width:100%;border-collapse:collapse;margin:12px 0 24px}th,td{border:1px solid #999;padding:7px;text-align:center}.breakdown-row{display:grid;grid-template-columns:90px 1fr 60px;gap:8px;margin:6px 0}.breakdown-track{background:#ddd}.breakdown-fill{height:18px;background:#555}.footer{text-align:center;margin-top:30px;font-weight:bold}@media print{button{display:none}}</style></head><body><h1>${esc(h.title||'Archery Detailed Results')}</h1><p style="text-align:center">${dt.date} • ${dt.day} • ${dt.time}</p>${details}${breakdown}<div class="footer">PWA: SCOREBOARD</div><script>window.onload=()=>setTimeout(()=>window.print(),150)<\/script></body></html>`); w.document.close();
}

const r76DetailedResult=detailedResult;
detailedResult=function(index,origin=null){
  r76DetailedResult(index,origin);
  const actions=document.querySelector('.result-actions'); if(actions){ const buttons=actions.querySelectorAll('button'); if(buttons[1])buttons[1].onclick=()=>r76OutputDialog('whatsapp',index); if(buttons[2])buttons[2].onclick=()=>r76OutputDialog('pdf',index); }
  const footer=document.querySelector('.result-footer'); if(footer)footer.textContent='PWA: SCOREBOARD';
};

/* ---------- Application Info release metadata ---------- */
const r76Info=info;
info=function(tab=null){
  r76Info(tab);
  const meta=document.querySelector('.info-meta'); if(meta){ const spans=meta.querySelectorAll('span'); const bm=infoLang==='BM'; if(spans[0])spans[0].innerHTML=`<b>${bm?'Versi Aplikasi':'App Version'}:</b> ${SCOREBOARD_VERSION} (${SCOREBOARD_RELEASE})`; if(spans[1])spans[1].innerHTML=`<b>${bm?'Kemas Kini Terakhir':'Last Updated'}:</b> ${SCOREBOARD_UPDATED}`; }
};
