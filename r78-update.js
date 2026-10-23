/* SCOREBOARD R78 — PDF/WhatsApp output and selector refinements */

/* ---------- Helpers ---------- */
function r78RoundTotal(archer, round, setup){
  const ends=Math.max(1,Number(setup.ends)||1); let total=0;
  for(let e=1;e<=ends;e++) (archer.scores?.[round-1]?.[e-1]||[]).forEach(v=>{if(v!=='')total+=scoreValue(v)});
  return total;
}
function r78Format(setup){
  const unit=setup.practiceType==='target'?'E':'CP';
  return `${setup.arrows}A × ${setup.practiceType==='target'?(setup.ends||1):(setup.checkPoints||setup.ends||1)}${unit} × ${setup.rounds||1}R`;
}
function r78Location(h){return String(h.location||'').trim()||'—'}
function r78Distance(setup){return setup.practiceType==='target'?`${resultDistanceText(setup)}`:`${setup.gameMinDistance||5}~${setup.gameMaxDistance||30}m`}
function r78Target(setup){return setup.practiceType==='target'?`${setup.target||80}cm`:'—'}

/* ---------- Live Summary: fixed equal matrix columns ---------- */
const r78Summary=summary;
summary=function(){
  r78Summary();
  if(!S.session||S.setup.practiceType==='target')return;
  document.querySelector('.live-summary-table')?.classList.add('r78-game-summary');
};

/* ---------- Round / CP selector wording + horizontal left legends ---------- */
const r78ManageRounds=manageRounds;
manageRounds=function(){
  r78ManageRounds();
  const modal=document.getElementById('manageRoundsDialog'); if(!modal)return;
  const note=modal.querySelector('.round-select-note');
  if(note)note.innerHTML=`<div class="r78-legend"><div><span class="r78-dot r78-green"></span>Completed</div><div><span class="r78-dot r78-blue"></span>Current Round</div><div><span class="r78-dot r78-grey"></span>Incomplete</div></div>`;
};
const r78GameCPSelectorHTML=gameCPSelectorHTML;
gameCPSelectorHTML=function(){
  const html=r78GameCPSelectorHTML();
  return html
    .replace('>SELECT CP<','>SELECT CHECKPOINTS (CP)<')
    .replace(/<div class="cp-select-note">[\s\S]*?<\/div><div class="modal-actions">/,`<div class="cp-select-note"><div class="r78-legend"><div><span class="r78-dot r78-green"></span>Completed</div><div><span class="r78-dot r78-blue"></span>Current CP</div><div><span class="r78-dot r78-grey"></span>Incomplete</div></div></div><div class="modal-actions">`);
};

/* ---------- PDF/WhatsApp settings defaults ---------- */
r76OutputDialog=function(kind,index=viewHistoryIndex){
  document.getElementById('resultOutputDialog')?.remove();
  const pdf=kind==='pdf',overlay=document.createElement('div'); overlay.id='resultOutputDialog';overlay.className='modal-overlay';
  const opts=pdf
    ? [['title','Edit Title',false],['summary','Scoring Summary',true],['arrowdetails','Arrow-by-Arrow End Details',true],['highest','Two Highest Matrix Scores',true],['score','Score %',true],['average','Average',true],['breakdown','Accuracy & Point Breakdown',false]]
    : [['title','Edit Title',false],['highest','Two Highest Matrix Scores',true],['score','Score %',true],['average','Average',true]];
  overlay.innerHTML=`<div class="modal-card"><h3>${pdf?'PRINT PDF':'WHATSAPP'} SETTINGS</h3><div style="display:grid;gap:10px;text-align:left">${opts.map(([id,label,checked])=>`<label><input type="checkbox" data-output="${id}" ${checked?'checked':''} onchange="r76TitleToggle(this)"> ${label}</label>`).join('')}<div id="r76TitleBox" hidden><label class="field-label">New Title</label><input id="r76OutputTitle" placeholder="Enter new title"></div></div><div class="modal-actions"><button class="btn ${pdf?'primary':'green'}" onclick="r76RunOutput('${kind}',${index})">${pdf?'PRINT / SAVE PDF':'SHARE TO WHATSAPP'}</button><button class="btn soft" onclick="closeModal('resultOutputDialog')">CLOSE</button></div></div>`;
  document.body.appendChild(overlay);
};

/* ---------- WhatsApp standard format for Target / 2D / 3D ---------- */
r76Share=function(h,o){
  const setup=h.setup||DEFAULT_SETUP,ranking=historyRanking(h),dt=shortDateTime(h.completedAt||h.date),lines=[];
  const title=h.title||'Archery Practice Summary';
  lines.push(`🎯 *${title}*`);
  lines.push(`${dt.date} | ${dt.day} | ${dt.time}`);
  if(setup.practiceType==='target') lines.push(`${resultDistanceText(setup)} | ${setup.target}cm | ${setup.matrix} | ${r78Format(setup)}`);
  else lines.push(`${r77GameHeading(h,setup)} | ${r78Distance(setup)} | ${setup.matrix} | ${r78Format(setup)}`);
  lines.push('--------------------------------------------------');
  const [l1,l2]=r77HighestLabels(setup.matrix), rounds=Math.max(1,Number(setup.rounds)||1);
  ranking.forEach((item,i)=>{
    const a=item.archer,m=item.metrics,[c1,c2]=r77HighestCounts(a,setup.matrix);
    lines.push(`${i+1}. *${a.name}*: ${m.total} pts`);
    const detail=[];
    if(rounds>1) for(let r=1;r<=rounds;r++) detail.push(`R${r}:${r78RoundTotal(a,r,setup)}`);
    if(o.has('highest')){detail.push(`${l1}:${c1}`);detail.push(`${l2}:${c2}`)}
    if(o.has('average'))detail.push(`Avg:${m.avg.toFixed(2)}`);
    if(o.has('score'))detail.push(`Score: ${m.score.toFixed(1)}%`);
    if(detail.length)lines.push(`    └ ${detail.join(' | ')}`);
    if(i<ranking.length-1)lines.push('');
  });
  lines.push('--------------------------------------------------');
  lines.push('App: SCOREBOARD');
  lines.push('');
  if(h.location)lines.push(`Loc: ${h.location}`);
  window.open('https://wa.me/?text='+encodeURIComponent(lines.join('\n')),'_blank');
};

/* ---------- PDF arrow details: archer name only ---------- */
r77ArrowDetailsHTML=function(archer,setup){
  const rounds=Math.max(1,Number(setup.rounds)||1),ends=Math.max(1,Number(setup.ends)||1),arrows=Math.max(1,Number(setup.arrows)||1);let html='';
  for(let r=1;r<=rounds;r++){
    const rows=Array.from({length:ends},(_,ei)=>{const vals=archer.scores?.[r-1]?.[ei]||Array(arrows).fill('');const total=vals.reduce((s,v)=>s+scoreValue(v),0);return `<tr><td>${ei+1}</td>${Array.from({length:arrows},(_,ai)=>`<td>${esc(vals[ai]||'-')}</td>`).join('')}<td><b>${total}</b></td></tr>`}).join('');
    html+=`<h4>${setup.practiceType!=='target'?'ROUND '+r+' — CHECKPOINTS':'ROUND '+r}</h4><table><thead><tr><th>${setup.practiceType!=='target'?'CP':'End'}</th>${Array.from({length:arrows},(_,i)=>`<th>A${i+1}</th>`).join('')}<th>Total</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  return `<h3>${esc(archer.name)}</h3>${html}`;
};

/* ---------- PDF: standard metadata always shown ---------- */
r76Print=function(h,o){
  const setup=h.setup||DEFAULT_SETUP,ranking=historyRanking(h),dt=shortDateTime(h.completedAt||h.date),w=window.open('','_blank');if(!w)return;
  const [l1,l2]=r77HighestLabels(setup.matrix);
  const rows=ranking.map((item,i)=>{const a=item.archer,m=item.metrics,[c1,c2]=r77HighestCounts(a,setup.matrix);return `<tr><td>${i+1}</td><td>${esc(a.name)}</td><td>${m.total}</td>${o.has('highest')?`<td>${c1}</td><td>${c2}</td>`:''}${o.has('score')?`<td>${m.score.toFixed(1)}%</td>`:''}${o.has('average')?`<td>${m.avg.toFixed(2)}</td>`:''}</tr>`}).join('');
  const head=`<th>Rank</th><th>Archer</th><th>Total</th>${o.has('highest')?`<th>${esc(l1)}</th><th>${esc(l2)}</th>`:''}${o.has('score')?'<th>Score %</th>':''}${o.has('average')?'<th>Average</th>':''}`;
  const meta=`<table class="meta"><tbody><tr><th>Date / Day / Time</th><td>${dt.date} | ${dt.day} | ${dt.time}</td></tr><tr><th>Location</th><td>${esc(r78Location(h))}</td></tr><tr><th>Distance</th><td>${esc(r78Distance(setup))}</td></tr><tr><th>Target Face</th><td>${esc(r78Target(setup))}</td></tr><tr><th>Matrix</th><td>${esc(setup.matrix||'')}</td></tr><tr><th>Format</th><td>${esc(r78Format(setup))}</td></tr></tbody></table>`;
  const gameMeta=setup.practiceType!=='target'?`<p style="text-align:center;font-weight:bold">${esc(r77GameHeading(h,setup))}</p>`:'';
  const details=o.has('summary')?`<h2>Scoring Summary</h2><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`:'';
  const arrowDetails=o.has('arrowdetails')?ranking.map(item=>r77ArrowDetailsHTML(item.archer,setup)).join(''):'';
  const breakdown=o.has('breakdown')?ranking.map(item=>`<h3>${esc(item.archer.name)} — Accuracy & Point Breakdown</h3>${archerSessionBreakdownHTML(item.archer,setup.matrix)}`).join(''):'';
  w.document.write(`<!doctype html><html><head><title>${esc(h.title||'SCOREBOARD')}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{text-align:center}h2{margin-top:26px}table{width:100%;border-collapse:collapse;margin:12px 0 24px}th,td{border:1px solid #999;padding:7px;text-align:center}.meta{max-width:760px;margin:12px auto 28px}.meta th{width:35%;text-align:left;background:#f1f3f5}.meta td{text-align:left}.breakdown-row{display:grid;grid-template-columns:90px 1fr 60px;gap:8px;margin:6px 0}.breakdown-track{background:#ddd}.breakdown-fill{height:18px;background:#555}.footer{text-align:center;margin-top:30px;font-weight:bold}@media print{button{display:none}}</style></head><body><h1>${esc(h.title||'Archery Detailed Results')}</h1>${gameMeta}${meta}${details}${arrowDetails}${breakdown}<div class="footer">PWA: SCOREBOARD</div><script>window.onload=()=>setTimeout(()=>window.print(),150)<\/script></body></html>`);w.document.close();
};

/* ---------- Styling ---------- */
const r78Style=document.createElement('style');
r78Style.textContent=`
.r78-legend{display:flex;flex-direction:row;justify-content:flex-start;align-items:center;flex-wrap:wrap;gap:7px 12px;margin:12px 0;text-align:left;font-size:.80rem;font-weight:700;color:#667381}
.r78-legend>div{display:flex;align-items:center;gap:5px;white-space:nowrap;font-size:inherit;line-height:1.2}
.r78-dot{display:inline-block!important;width:12px!important;height:12px!important;min-width:12px!important;min-height:12px!important;border-radius:50%!important;margin:0!important;padding:0!important;box-sizing:border-box!important}
.r78-green{background:#15945f!important;border:0!important}.r78-blue{background:#1677ed!important;border:0!important}.r78-grey{background:#d8dde5!important;border:1px solid #b7c0cc!important}
.live-summary-table.r78-game-summary{table-layout:fixed!important;width:100%!important;min-width:0!important}
.live-summary-table.r78-game-summary th:nth-child(1),.live-summary-table.r78-game-summary td:nth-child(1){width:11%!important}
.live-summary-table.r78-game-summary th:nth-child(2),.live-summary-table.r78-game-summary td:nth-child(2){width:35%!important}
.live-summary-table.r78-game-summary th:nth-child(3),.live-summary-table.r78-game-summary td:nth-child(3),.live-summary-table.r78-game-summary th:nth-child(4),.live-summary-table.r78-game-summary td:nth-child(4){width:18%!important;white-space:normal!important;overflow-wrap:anywhere!important}
.live-summary-table.r78-game-summary th:nth-child(5),.live-summary-table.r78-game-summary td:nth-child(5){width:18%!important}
@media(max-width:520px){.r78-legend{gap:6px 9px;font-size:.74rem}.live-summary-table.r78-game-summary th,.live-summary-table.r78-game-summary td{padding:8px 4px!important;font-size:.78rem!important}}
`;
document.head.appendChild(r78Style);

/* ---------- Application Info R78 ---------- */
const r78Info=info;
info=function(tab=null){r78Info(tab);const meta=document.querySelector('.info-meta');if(meta){const spans=meta.querySelectorAll('span'),bm=infoLang==='BM';if(spans[0])spans[0].innerHTML=`<b>${bm?'Versi Aplikasi':'App Version'}:</b> 1.0.3 (R78)`;if(spans[1])spans[1].innerHTML=`<b>${bm?'Kemas Kini Terakhir':'Last Updated'}:</b> 23 October 2026`}};
