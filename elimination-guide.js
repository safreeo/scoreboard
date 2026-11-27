/* R215 Elimination history: independent archived brackets */
(function(){
'use strict';
let count=16,view='list',namesOpen=false,pdfOpen=false,pdfNames=true,applied=false;
let names={},winners={},pending={};let paperSize='A4';let customTitle='',titleEnabled=false;
const t=(en,bm)=>typeof infoLang!=='undefined'&&infoLang==='BM'?bm:en;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Each category owns its bracket state; printing options are shared.
const freshCategory=i=>({label:'',count:16,view:'list',namesOpen:false,applied:false,names:{},winners:{},pending:{},scrollY:0});
let categories=[freshCategory(0)],activeCategory=0;
const categoryName=i=>categories[i].label.trim()||t('Category ','Kategori ')+(i+1);
const categoryPlaceholder=i=>t('Type Category '+(i+1)+' here','Taip Kategori '+(i+1)+' di sini');
function captureCategory(){Object.assign(categories[activeCategory],{count,view,namesOpen,applied,names,winners,pending});}
function loadCategory(i){activeCategory=i;({count,view,namesOpen,applied,names,winners,pending}=categories[i]);}
const STORAGE_KEY='as_elimination_session';
let savedAt='',storageWarning=false,archiveId='',archiveTitle='';
function snapshot(){captureCategory();return {version:1,categories,activeCategory,paperSize,pdfNames,customTitle,titleEnabled,savedAt,archiveId,archiveTitle};}
function normalizeSnapshot(data){
 if(!data||data.version!==1||!Array.isArray(data.categories)||data.categories.length<1||data.categories.length>12)throw Error('Invalid elimination session');
 const clean=data.categories.map(c=>{
  if(!c||!Number.isInteger(c.count)||c.count<4||c.count>40)throw Error('Invalid category count');
  const f=freshCategory(0);f.count=c.count;f.label=typeof c.label==='string'?c.label.slice(0,60):'';f.view=c.view==='bracket'?'bracket':'list';f.namesOpen=c.namesOpen===true;f.applied=c.applied===true;f.scrollY=Number.isFinite(c.scrollY)?Math.max(0,c.scrollY):0;
  for(let i=1;i<=c.count;i++){const v=c.names&&Object.prototype.hasOwnProperty.call(c.names,i)?c.names[i]:null;if(typeof v==='string')f.names[i]=v;}
  for(let i=1;i<=c.count;i++){const id='M'+i;for(const field of ['winners','pending']){const v=c[field]&&Object.prototype.hasOwnProperty.call(c[field],id)?c[field][id]:null;if(field==='pending'&&v==='')f[field][id]='';else if(typeof v==='string'&&/^s[1-9][0-9]*$/.test(v)&&Number(v.slice(1))<=c.count)f[field][id]=v;}}
  return f;
 });
 return {version:1,categories:clean,activeCategory:Number.isInteger(data.activeCategory)&&data.activeCategory>=0&&data.activeCategory<clean.length?data.activeCategory:0,paperSize:data.paperSize==='A3'?'A3':'A4',pdfNames:data.pdfNames!==false,customTitle:typeof data.customTitle==='string'?data.customTitle:'',titleEnabled:data.titleEnabled===true,savedAt:typeof data.savedAt==='string'?data.savedAt:'',archiveId:typeof data.archiveId==='string'?data.archiveId:'',archiveTitle:typeof data.archiveTitle==='string'?data.archiveTitle.slice(0,120):''};
}
function applySnapshot(d){categories=d.categories;paperSize=d.paperSize;pdfNames=d.pdfNames;customTitle=d.customTitle;titleEnabled=d.titleEnabled;savedAt=d.savedAt;archiveId=d.archiveId||'';archiveTitle=d.archiveTitle||'';loadCategory(d.activeCategory);}
function statusText(){return storageWarning?t('Auto Save unavailable. Back up before closing.','Simpanan automatik tidak tersedia. Sandarkan data sebelum menutup aplikasi.'):savedAt?t('Auto Saved on this device • Reopen to resume','Disimpan automatik pada peranti ini • Buka semula untuk menyambung'):t('Auto Save enabled','Simpanan automatik diaktifkan');}
function paintStatus(){const el=document.getElementById('el-save-status');if(el){el.textContent=statusText();el.style.color=storageWarning?'#b91c1c':'#17804e';}}
function saveState(){const previous=savedAt;try{savedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot()));storageWarning=false;paintStatus();return true;}catch(e){savedAt=previous;storageWarning=true;paintStatus();return false;}}
function restoreSavedState(){try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)applySnapshot(normalizeSnapshot(JSON.parse(raw)));}catch(e){storageWarning=true;}}
function freshTournament(){categories=[freshCategory(0)];loadCategory(0);paperSize='A4';pdfNames=true;customTitle='';titleEnabled=false;savedAt='';archiveId='';archiveTitle='';}
function elConfirm(title,message,actionLabel,action,onCancel,archiveAction=false){
 if(document.getElementById('el-confirm-dialog'))return;
 const overlay=document.createElement('div');overlay.id='el-confirm-dialog';overlay.className='modal-overlay';
 overlay.innerHTML='<div class="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="el-confirm-title" aria-describedby="el-confirm-message"><h3 id="el-confirm-title">'+esc(title)+'</h3><p id="el-confirm-message">'+esc(message)+'</p><div class="modal-actions"><button type="button" class="btn danger" data-el-confirm>'+esc(actionLabel)+'</button><button type="button" class="btn soft" data-el-cancel>'+t('CANCEL','BATAL')+'</button></div></div>';
 const close=()=>overlay.remove();
 const cancel=()=>{close();if(onCancel)onCancel();};
 overlay.querySelector('[data-el-confirm]').addEventListener('click',()=>{close();if(archiveAction||document.getElementById('elimination-results'))action();});
 overlay.querySelector('[data-el-cancel]').addEventListener('click',cancel);
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();cancel();}});
 document.body.appendChild(overlay);overlay.querySelector('[data-el-cancel]').focus();
}
window.elNewTournament=()=>elConfirm(t('NEW ELIMINATION ROUND','PUSINGAN PENYINGKIRAN BAHARU'),t('Start a new tournament? All existing categories and results will be replaced. Back up or export first if needed. Practice History will not be affected.','Mulakan pertandingan baharu? Semua kategori dan keputusan sedia ada akan diganti. Sandarkan atau eksport dahulu jika perlu. Sejarah Latihan tidak terjejas.'),t('START NEW ROUND','MULAKAN PUSINGAN BAHARU'),()=>{freshTournament();refreshCategoryControls();draw();window.scrollTo(0,0);});
window.elGetBackup=()=>JSON.parse(JSON.stringify(snapshot()));
window.elValidateBackup=data=>{if(data!==null)normalizeSnapshot(data);return true;};
window.elRestoreBackup=data=>{if(data===null)freshTournament();else applySnapshot(normalizeSnapshot(data));if(!saveState())throw Error('Unable to save elimination session');};
function savePosition(){if(!document.getElementById('elimination-results'))return;categories[activeCategory].scrollY=window.scrollY||0;saveState();}
if(typeof window.addEventListener==='function')window.addEventListener('pagehide',savePosition);
if(typeof document.addEventListener==='function')document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')savePosition();});
restoreSavedState();
const ARCHIVE_KEY='as_elimination_history';
let archiveSelectedId='',archiveCategory=0,archivePaper='A4',archiveNames=true;
function copy(v){return JSON.parse(JSON.stringify(v));}
function readArchives(){const raw=localStorage.getItem(ARCHIVE_KEY);return raw?normalizeArchives(JSON.parse(raw)):[];}
function normalizeArchives(data){
 if(!Array.isArray(data))throw Error('Invalid elimination history');
 const ids=new Set();
 return data.map(r=>{if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id)||typeof r.title!=='string'||!Number.isFinite(Date.parse(r.date)))throw Error('Invalid elimination history record');ids.add(r.id);return {id:r.id,title:r.title.slice(0,120),date:r.date,state:normalizeSnapshot(r.state)};});
}
function writeArchives(data){localStorage.setItem(ARCHIVE_KEY,JSON.stringify(data));}
window.elGetHistoryBackup=()=>copy(readArchives());
window.elValidateHistoryBackup=data=>{normalizeArchives(data);return true;};
window.elRestoreHistoryBackup=data=>writeArchives(normalizeArchives(data));
function archiveDate(r){return new Date(r.date).toLocaleString(typeof infoLang!=='undefined'&&infoLang==='BM'?'ms-MY':'en-GB');}
function archiveLabel(c,i){return c.label.trim()||t('Category ','Kategori ')+(i+1);}
function archiveNotice(msg){const node=document.getElementById('el-history-notice');if(node)node.textContent=msg;}
window.elHistoryEntryHTML=()=>{
 let n='';try{n=' ('+readArchives().length+')';}catch(e){}
 return '<section class="card" style="margin-bottom:12px"><button class="btn el-entry" style="width:100%" onclick="elHistoryPage()">'+t('ELIMINATION ROUND HISTORY','SEJARAH PUSINGAN PENYINGKIRAN')+n+'</button><p class="el-note" style="margin:8px 0 0">'+t('Saved tournament brackets and final results.','Carta pertandingan dan keputusan akhir yang disimpan.')+'</p></section>';
};
window.elSaveHistory=()=>{
 if(document.getElementById('el-save-history-dialog'))return;
 const overlay=document.createElement('div');overlay.id='el-save-history-dialog';overlay.className='modal-overlay';
 const defaultTitle=archiveTitle||(titleEnabled?customTitle.trim():'')||t('Elimination Round','Pusingan Penyingkiran');
 overlay.innerHTML='<div class="modal-card" role="dialog" aria-modal="true"><h3>'+t('SAVE TO HISTORY','SIMPAN KE SEJARAH')+'</h3><p>'+t('Save all categories as one tournament. Only confirmed winners appear in the chart. Saving again updates this record.','Simpan semua kategori sebagai satu pertandingan. Hanya pemenang yang telah disahkan dipaparkan dalam carta. Simpan semula untuk mengemas kini rekod.')+'</p><label class="modal-field-label" for="el-history-title">'+t('Tournament Title','Tajuk Pertandingan')+'</label><input id="el-history-title" type="text" maxlength="120" value="'+esc(defaultTitle)+'"/><div id="el-history-save-error" role="status" style="color:#b91c1c"></div><div class="modal-actions"><button class="btn green" data-el-save>'+t('SAVE','SIMPAN')+'</button><button class="btn soft" data-el-cancel>'+t('CANCEL','BATAL')+'</button></div></div>';
 overlay.querySelector('[data-el-cancel]').addEventListener('click',()=>overlay.remove());
 overlay.querySelector('[data-el-save]').addEventListener('click',()=>{
  const title=overlay.querySelector('#el-history-title').value.trim(),error=overlay.querySelector('#el-history-save-error');
  if(!title){error.textContent=t('Enter a title.','Masukkan tajuk.');return;}
  try{saveArchive(title);overlay.remove();archiveNotice(t('Saved to Practice History.','Disimpan ke Sejarah Latihan.'));}
  catch(e){error.textContent=t('Unable to save history. Check device storage.','Gagal menyimpan sejarah. Semak storan peranti.');}
 });
 document.body.appendChild(overlay);
};
function saveArchive(title){
 const records=readArchives(),id=archiveId&&records.some(r=>r.id===archiveId)?archiveId:(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
 const state=copy(snapshot());state.archiveId=id;state.archiveTitle=title;
 writeArchives([{id,title,date:new Date().toISOString(),state},...records.filter(r=>r.id!==id)]);
 archiveId=id;archiveTitle=title;saveState();
}
window.elHistoryPage=()=>{
 let records=[],error='';try{records=readArchives();}catch(e){error=t('Unable to read saved history.','Gagal membaca sejarah yang disimpan.');}
 const cards=records.map((r,i)=>'<section class="card"><h3 style="margin:0 0 6px">'+esc(r.title)+'</h3><p class="el-note">'+esc(archiveDate(r))+' • '+r.state.categories.length+' '+t('Categories','Kategori')+'</p><p class="el-note">'+r.state.categories.map((c,j)=>esc(archiveLabel(c,j))+' ('+c.count+')').join(' • ')+'</p><button class="btn el-entry" style="width:100%" onclick="elOpenArchive('+i+')">'+t('VIEW BRACKET','LIHAT CARTA')+'</button></section>').join('');
 page(head(t('ELIMINATION ROUND HISTORY','SEJARAH PUSINGAN PENYINGKIRAN')).replace('page-head-blue','page-head-green')+'<section class="card"><button class="btn soft" style="width:100%" onclick="eliminationGuide()">'+t('OPEN CURRENT ELIMINATION ROUND','BUKA PUSINGAN PENYINGKIRAN SEMASA')+'</button></section>'+(error?'<section class="card">'+esc(error)+'</section>':cards||'<section class="card"><p>'+t('No saved elimination rounds yet. Use SAVE TO HISTORY in Full Bracket.','Belum ada rekod. Gunakan SIMPAN KE SEJARAH dalam Carta Penuh.')+'</p></section>'),'el-history');
};
window.elOpenArchive=i=>{try{const r=readArchives()[i];if(!r)return;archiveSelectedId=r.id;archiveCategory=0;archivePaper=r.state.paperSize;archiveNames=r.state.pdfNames;window.elArchiveView();}catch(e){}};
function selectedArchive(){return readArchives().find(r=>r.id===archiveSelectedId);}
function withArchive(r,i,fn){const original=copy(snapshot());try{applySnapshot(copy(r.state));loadCategory(i);return fn();}finally{applySnapshot(original);}}
window.elArchiveView=()=>{
 let r;try{r=selectedArchive();}catch(e){}if(!r){window.elHistoryPage();return;}
 const i=Math.min(archiveCategory,r.state.categories.length-1),c=r.state.categories[i];archiveCategory=i;
 const body=withArchive(r,i,()=>{const m=build(count);return '<div class="el-scroll">'+svg(m,true)+'</div>'+finalResultsHtml(m,true);});
 page(head(t('SAVED ELIMINATION ROUND','PUSINGAN PENYINGKIRAN DISIMPAN')).replace('page-head-blue','page-head-green')+'<section class="card el-guide"><h2>'+esc(r.title)+'</h2><p class="el-note">'+esc(archiveDate(r))+' • '+t('Saved record • Read only','Rekod disimpan • Paparan sahaja')+'</p><div class="el-paper-field"><label for="el-archive-cat">'+t('Category','Kategori')+'</label><select id="el-archive-cat" onchange="elArchiveSwitch(Number(this.value))">'+r.state.categories.map((c,j)=>'<option value="'+j+'"'+(j===i?' selected':'')+'>'+esc(archiveLabel(c,j))+'</option>').join('')+'</select></div><p class="el-note">'+c.count+' '+t('Participants / Teams','Peserta / Pasukan')+'</p>'+body+'<div class="el-paper-field"><label for="el-archive-paper">'+t('PDF Paper Size','Saiz Kertas PDF')+'</label><select id="el-archive-paper" onchange="elArchivePaper(this.value)"><option value="A4" '+(archivePaper==='A4'?'selected':'')+'>A4 Landscape</option><option value="A3" '+(archivePaper==='A3'?'selected':'')+'>A3 Landscape</option></select></div><label class="el-pdf-name"><input type="checkbox" '+(archiveNames?'checked':'')+' onchange="elArchiveNames(this.checked)"/> '+t('Include names in PDF','Sertakan nama dalam PDF')+'</label><div class="modal-actions"><button class="btn el-entry" onclick="elArchivePrint()">'+t('SAVE AS PDF','SIMPAN PDF')+'</button><button class="btn danger" onclick="elDeleteArchive()">'+t('DELETE RECORD','PADAM REKOD')+'</button><button class="btn soft" onclick="elHistoryPage()">'+t('BACK TO HISTORY','KEMBALI KE SEJARAH')+'</button></div></section>','el-archive');
};
window.elArchiveSwitch=i=>{if(Number.isInteger(i)&&i>=0){archiveCategory=i;window.elArchiveView();}};
window.elArchivePaper=v=>{archivePaper=v==='A3'?'A3':'A4';};
window.elArchiveNames=v=>{archiveNames=!!v;};
window.elArchivePrint=()=>{const r=selectedArchive();if(!r||!r.state.categories[archiveCategory])return;withArchive(r,archiveCategory,()=>{paperSize=archivePaper;pdfNames=archiveNames;titleEnabled=true;customTitle=r.title;window.elPrint(r.date);});};
window.elDeleteArchive=()=>{const r=selectedArchive();if(!r)return;elConfirm(t('DELETE SAVED RECORD?','PADAM REKOD DISIMPAN?'),t('Delete this saved tournament? The current elimination round will not be changed.','Padam pertandingan yang disimpan ini? Pusingan penyingkiran semasa tidak berubah.'),t('DELETE','PADAM'),()=>{try{writeArchives(readArchives().filter(x=>x.id!==r.id));window.elHistoryPage();}catch(e){alert(t('Unable to delete record.','Gagal memadam rekod.'));}},null,true);};
function categoryOptions(selected){return categories.map((c,i)=>'<option value="'+i+'"'+(i===selected?' selected':'')+'>'+esc(categoryName(i))+'</option>').join('');}
function categoryNav(){
 return '<div style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:980px;box-sizing:border-box;z-index:40;background:#fff;padding:8px 14px calc(8px + env(safe-area-inset-bottom, 0px));border-top:1px solid #dbe3ec;box-shadow:0 -4px 14px #14345b18;'+(categories.length===1?'display:none;':'')+'" id="el-category-nav"><div id="el-active-category-name" style="display:block;font-weight:700;color:#14345b;margin-bottom:5px">'+t('Active Category','Kategori Aktif')+': '+esc(categoryName(activeCategory))+'</div><div style="display:flex;gap:6px;overflow-x:auto;padding:2px 0 5px">'+categories.map((c,i)=>'<button type="button" class="btn '+(i===activeCategory?'el-category-active':'soft')+'" style="flex:0 0 auto;min-width:76px;max-width:210px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:8px 10px" data-el-cat-tab="'+i+'" aria-pressed="'+(i===activeCategory)+'" title="'+esc(categoryName(i))+'" onclick="elSwitchCategory('+i+')">'+esc(categoryName(i))+'</button>').join('')+'</div>'+(categories.length>3?'<select id="el-cat-jump" style="width:100%;margin-top:4px" aria-label="'+t('Jump to category','Pergi ke kategori')+'" onchange="elSwitchCategory(Number(this.value))">'+categoryOptions(activeCategory)+'</select>':'')+'</div>';
}
function refreshCategoryControls(){
 const nav=document.getElementById('el-category-nav');if(nav)nav.outerHTML=categoryNav();
 const guide=document.querySelector('.el-guide');if(guide)guide.style.paddingBottom=categories.length>1?'calc('+(categories.length>3?155:110)+'px + env(safe-area-inset-bottom, 0px))':'';
 const name=document.getElementById('el-cat-name');if(name){name.value=categories[activeCategory].label;name.placeholder=categoryPlaceholder(activeCategory);}
 const input=document.getElementById('el-input');if(input)input.value=count;
 const total=document.getElementById('el-cat-count');if(total)total.textContent=categories.length;
 const minus=document.getElementById('el-cat-minus'),plus=document.getElementById('el-cat-plus');if(minus)minus.disabled=categories.length<=1;if(plus)plus.disabled=categories.length>=12;
}
window.elSwitchCategory=i=>{
 if(!Number.isInteger(i)||!categories[i]||i===activeCategory)return;
 captureCategory();categories[activeCategory].scrollY=window.scrollY||0;loadCategory(i);
 refreshCategoryControls();draw();
 requestAnimationFrame(()=>window.scrollTo(0,categories[i].scrollY||0));
};
function hasCategoryData(c){return !!(c.label.trim()||c.count!==16||Object.values(c.names).some(v=>String(v).trim())||Object.keys(c.winners).length||Object.values(c.pending).some(Boolean));}
window.elCategoryStep=delta=>window.elCategoryCount(categories.length+delta);
window.elCategoryCount=v=>{
 const n=Number(v),old=categories.length;
 if(!Number.isInteger(n)||n<1||n>12||n===old)return;
 captureCategory();
 const apply=()=>{captureCategory();if(n<old){categories.length=n;if(activeCategory>=n)loadCategory(n-1);}
 else while(categories.length<n)categories.push(freshCategory(categories.length));
 refreshCategoryControls();draw();};
 if(n<old&&categories.slice(n).some(hasCategoryData)){
 const labels=categories.slice(n).map((c,i)=>categoryName(n+i)).join(', ');
 elConfirm(t('REMOVE CATEGORY?','PADAM KATEGORI?'),t('Remove '+labels+' and all its category data? Other categories will be kept.','Padam '+labels+' dan semua data kategori tersebut? Kategori lain dikekalkan.'),t('REMOVE','PADAM'),apply,refreshCategoryControls);
 return;}
 apply();
};
window.elRenameCategory=v=>{
 categories[activeCategory].label=String(v).slice(0,60);
 const label=categoryName(activeCategory),heading=document.getElementById('el-active-category-name'),tab=document.querySelector('[data-el-cat-tab="'+activeCategory+'"]');
 if(heading)heading.textContent=t('Active Category','Kategori Aktif')+': '+label;
 if(tab){tab.textContent=label;tab.title=label;}
 for(const id of ['el-cat-jump','el-print-category']){const select=document.getElementById(id);if(select&&select.options&&select.options[activeCategory])select.options[activeCategory].textContent=label;}
 saveState();
};
const matchLabel=s=>String(s).replace(/\bM(\d+)\b/g,'Match $1');
const orderFor=size=>{let a=[1,2];while(a.length<size){const k=a.length*2+1;a=a.flatMap(v=>[v,k-v]);}return a;};
function build(n){
 const size=2**Math.floor(Math.log2(n)),bye=n===size?0:2*size-n,preCount=n-size;
 let id=1,rounds=[],all=[];
 const pre=Array.from({length:preCount},(_,i)=>({id:'M'+id++,round:'Preliminary',a:{seed:bye+i+1},b:{seed:n-i}}));
 if(pre.length){rounds.push({label:'Preliminary',matches:pre});all.push(...pre);}
 const preBySeed=new Map(pre.map(m=>[m.a.seed,m.id]));
 let slots=orderFor(size).map(s=>s<=bye||!preBySeed.has(s)?{seed:s}:{winner:preBySeed.get(s)});
 while(slots.length>1){
  const len=slots.length,label=len===2?'Final':len===4?'Semi Final':len===8?'Quarter Final':'Round of '+len;
  const matches=Array.from({length:len/2},(_,i)=>({id:'M'+id++,round:label,a:slots[2*i],b:slots[2*i+1]}));
  rounds.push({label,matches});all.push(...matches);slots=matches.map(m=>({winner:m.id}));
 }
 const semis=rounds.find(r=>r.label==='Semi Final');
 const third={id:'M'+id++,round:'3rd / 4th Place',a:{loser:semis.matches[0].id},b:{loser:semis.matches[1].id}};
 rounds.push({label:'3rd / 4th Place',matches:[third]});all.push(third);
 return {n,size,bye,preCount,rounds,all,third,map:new Map(all.map(m=>[m.id,m]))};
}
function slotResolve(m,slot,seen=[]){
 if(slot.seed)return {key:'s'+slot.seed,seed:slot.seed,text:'#'+slot.seed+(applied&&names[slot.seed]?' '+names[slot.seed]:'')};
 const src=slot.winner||slot.loser,match=m.map.get(src);
 const unresolved={key:null,text:(slot.loser?'Loser ':'Winner ')+src};
 if(!match||seen.includes(src))return unresolved;
 const a=slotResolve(m,match.a,[...seen,src]),b=slotResolve(m,match.b,[...seen,src]);
 const winner=winners[src];
 if(!winner||!a.key||!b.key)return unresolved;
 const selected=winner===a.key?a:winner===b.key?b:null;
 if(!selected)return unresolved;
 return slot.loser?(winner===a.key?b:a):selected;
}
function sanitize(){
 const n=Number(count);if(!Number.isInteger(n)||n<4||n>40)return;
 const m=build(n);
 for(let pass=0;pass<m.all.length;pass++){
  let changed=false;
  for(const match of m.all){
   const a=slotResolve(m,match.a),b=slotResolve(m,match.b),chosen=winners[match.id];
   if(chosen&&(!a.key||!b.key||(chosen!==a.key&&chosen!==b.key))){delete winners[match.id];changed=true;}
  }
  if(!changed)break;
 }
}
function row(m,match,controls){
 const a=slotResolve(m,match.a),b=slotResolve(m,match.b),selected=pending[match.id]!==undefined?pending[match.id]:(winners[match.id]||'');
 const canSelect=a.key&&b.key;
 return '<div class="el-match-card"><b>'+esc(matchLabel(match.id))+'</b><div class="el-participant">'+esc(matchLabel(a.text))+'</div><div class="el-participant">'+esc(matchLabel(b.text))+'</div>'+
 (controls&&canSelect?'<select class="el-winner" aria-label="'+esc(t('Winner of','Pemenang'))+' '+esc(matchLabel(match.id))+'" onchange="elWinner(\''+esc(match.id)+'\',this.value)"><option value="">'+esc(t('Select winner','Pilih pemenang'))+'</option><option value="'+esc(a.key)+'"'+(selected===a.key?' selected':'')+'>'+esc(matchLabel(a.text))+'</option><option value="'+esc(b.key)+'"'+(selected===b.key?' selected':'')+'>'+esc(matchLabel(b.text))+'</option></select>':'')+'</div>';
}
function svg(m,withNames=true){
 const stages=m.rounds.filter(r=>r.label!=='3rd / 4th Place');
 const pre=m.preCount>0,top=75,step=58,cw=225,boxW=196;
 const maxSlots=Math.max(m.preCount,m.size/2);
 const height=Math.max(400,top+maxSlots*step+90),width=stages.length*cw+22;
 let out='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Full elimination bracket"><rect width="100%" height="100%" fill="#f7f9fc"/>';
 const positions=[];
 stages.forEach((stage,k)=>{
  const x=12+k*cw,isPre=pre&&k===0,mainIdx=k-(pre?1:0);
  const ys=stage.matches.map((match,i)=>isPre?top+i*step:top+(Math.pow(2,mainIdx)*step-step)/2+i*Math.pow(2,mainIdx)*step);
  positions.push(ys);
  out+='<text x="'+x+'" y="30" font-size="14" font-weight="700" fill="#14345b">'+esc(stage.label)+'</text>';
  stage.matches.forEach((match,i)=>{
   const y=ys[i],a=slotResolve(m,match.a),b=slotResolve(m,match.b);
   const label=(s)=>{let txt=withNames?s.text:(s.seed?'#'+s.seed:s.text);return txt.length>30?txt.slice(0,29)+'…':txt;};
   out+='<rect x="'+x+'" y="'+y+'" width="'+boxW+'" height="48" rx="7" fill="#fff" stroke="#9aafc8"/><text x="'+(x+7)+'" y="'+(y+13)+'" font-size="11" font-weight="700" fill="#346194">'+esc(matchLabel(match.id))+'</text><text x="'+(x+7)+'" y="'+(y+28)+'" font-size="11" fill="#18324e">'+esc(matchLabel(label(a)))+'</text><text x="'+(x+7)+'" y="'+(y+42)+'" font-size="11" fill="#18324e">'+esc(matchLabel(label(b)))+'</text>';
  });
 });
 for(let k=(pre?1:0);k<stages.length-1;k++)positions[k].forEach((y,i)=>{
  const x=12+k*cw+boxW,mid=positions[k+1][Math.floor(i/2)]+24;
  out+='<path d="M '+x+' '+(y+24)+' H '+(x+10)+' V '+mid+' H '+(x+25)+'" stroke="#7691ac" fill="none" stroke-width="1.5"/>';
 });
 const x=12+(stages.length-1)*cw,finalY=positions[stages.length-1][0],thirdY=finalY+72;
 const third=m.third,a=slotResolve(m,third.a),b=slotResolve(m,third.b);
 out+='<rect x="'+x+'" y="'+thirdY+'" width="'+boxW+'" height="62" rx="7" fill="#fff" stroke="#9aafc8"/><text x="'+(x+7)+'" y="'+(thirdY+16)+'" font-size="11" font-weight="700" fill="#346194">'+esc(matchLabel(third.id)+' • 3rd / 4th Place')+'</text><text x="'+(x+7)+'" y="'+(thirdY+36)+'" font-size="11" fill="#18324e">'+esc(matchLabel(withNames?a.text:(a.seed?'#'+a.seed:a.text)))+'</text><text x="'+(x+7)+'" y="'+(thirdY+52)+'" font-size="11" fill="#18324e">'+esc(matchLabel(withNames?b.text:(b.seed?'#'+b.seed:b.text)))+'</text></svg>';
 return out;
}
function draw(){
 const root=document.getElementById('elimination-results');if(!root)return;
 const n=Number(count);
 if(!Number.isInteger(n)||n<4||n>40){root.innerHTML='<p style="color:#b91c1c">'+t('Enter a whole number from 4 to 40.','Masukkan nombor bulat antara 4 hingga 40.')+'</p>';return;}
 sanitize();const m=build(n);
 let h='<div class="el-stats el-stats-r176"><div><b>'+m.bye+'</b><small>Bye</small></div><div><b>'+m.preCount+'</b><small>Preliminary</small></div><div><b>'+n+'</b><small>'+t('Total Matches','Jumlah Perlawanan')+'</small></div><div><b>Top '+m.size+'</b><small>'+t('Main Bracket','Carta Utama')+'</small></div></div>';
 h+='<div class="el-switch"><button class="btn '+(view==='list'?'el-active':'soft')+'" onclick="elView(\'list\')">'+t('MATCH LIST','SENARAI PERLAWANAN')+'</button><button class="btn '+(view==='bracket'?'el-active':'soft')+'" onclick="elView(\'bracket\')">'+t('FULL BRACKET','CARTA PENUH')+'</button></div>';
 if(view==='bracket'){
  h+='<p class="el-note">'+t('Swipe sideways to view the bracket. Select winners below to advance names automatically.','Leret ke sisi untuk melihat carta. Pilih pemenang di bawah untuk mara secara automatik.')+'</p><div class="el-scroll" id="el-graph">'+svg(m)+'</div>';
  h+='<div class="el-actions"><button class="btn el-active" onclick="elToggleNames()">'+t('ENTER NAMES','MASUKKAN NAMA')+'</button></div>';
 }else{
  h+='<h3>'+t('Bye Allocation','Penentuan Bye')+'</h3><p>'+(m.bye?'#1'+(m.bye>1?'–#'+m.bye:'')+' → Top '+m.size:t('No Bye','Tiada Bye'))+'</p>';m.rounds.forEach(r=>{h+='<h3>'+esc(r.label)+'</h3>'+r.matches.map(match=>'<div class="el-match"><b>'+esc(matchLabel(match.id))+'</b><span>'+esc(matchLabel(slotResolve(m,match.a).text))+' vs '+esc(matchLabel(slotResolve(m,match.b).text))+'</span></div>').join('');});
 }
 if(view==='bracket'&&namesOpen){
  h+='<section class="el-editor"><h3>'+t('Enter Ranking Names','Masukkan Nama Mengikut Ranking')+'</h3><p class="el-note">'+t('Seed #1 is the highest ranked. Blank names are allowed.','Seed #1 ialah ranking tertinggi. Nama boleh dibiarkan kosong.')+'</p><div class="el-name-list">';
  for(let i=1;i<=n;i++)h+='<label class="el-name-row"><b>#'+i+'</b><input type="text" value="'+esc(names[i]||'')+'" placeholder="'+esc(t('Archer / Team','Pemanah / Pasukan'))+' '+i+'" oninput="elName('+i+',this.value)"/></label>';
  h+='</div><button class="btn el-active" onclick="elApplyNames()">'+t('APPLY NAMES','GUNAKAN NAMA')+'</button></section>';
 }
 if(view==='bracket'){h+='<h3>'+t('Match Results / Winner Selection','Keputusan / Pilihan Pemenang')+'</h3><p class="el-note">'+t('Select winners and tap UPDATE at the end of each round.','Pilih pemenang dan tekan UPDATE di akhir setiap pusingan.')+'</p>';m.rounds.forEach((r,i)=>{const complete=r.matches.every(match=>{const a=slotResolve(m,match.a),b=slotResolve(m,match.b);return a.key&&b.key&&winners[match.id]&&(winners[match.id]===a.key||winners[match.id]===b.key);})&&!r.matches.some(match=>Object.prototype.hasOwnProperty.call(pending,match.id));h+='<h3>'+esc(r.label)+'</h3><div class="el-match-grid">'+r.matches.map(match=>row(m,match,true)).join('')+'</div><div class="el-round-actions"><button data-el-round="'+i+'" class="btn '+(complete?'el-completed':'el-active')+'" onclick="elUpdateRound('+i+')">'+(complete?'COMPLETED':'UPDATE')+'</button><button class="btn soft" onclick="elGoGraph()">GRAPH ↑</button></div>';});h+=finalResultsHtml(m,true);h+='<div class="modal-actions"><button class="btn green" onclick="elSaveHistory()">'+t('SAVE TO HISTORY','SIMPAN KE SEJARAH')+'</button><div id="el-history-notice" role="status" style="color:#17804e;text-align:center"></div></div>';h+='<div class="el-paper-field"><label for="el-paper-select">'+t('PDF Paper Size','Saiz Kertas PDF')+'</label><select id="el-paper-select" aria-label="PDF Paper Size" onchange="elPaperSize(this.value)"><option value="A4" '+(paperSize==='A4'?'selected':'')+'>A4 Landscape</option><option value="A3" '+(paperSize==='A3'?'selected':'')+'>A3 Landscape</option></select></div><label class="el-pdf-name"><input type="checkbox" '+(pdfNames?'checked':'')+' onchange="elPdfMode(this.checked)"/> '+t('Include names in PDF','Sertakan nama dalam PDF')+'</label><label class="el-title-toggle"><input type="checkbox" '+(titleEnabled?'checked':'')+' onchange="elTitleToggle(this.checked)"/> '+t('Add New Title','Tambah Tajuk Baharu')+'</label>'+(titleEnabled?'<input class="el-custom-title" type="text" value="'+esc(customTitle)+'" placeholder="'+t('Enter PDF title','Masukkan tajuk PDF')+'" oninput="elTitleChange(this.value)"/>':'')+(categories.length>1?'<div class="el-paper-field"><label for="el-print-category">'+t('PDF Category','Kategori PDF')+'</label><select id="el-print-category">'+categoryOptions(activeCategory)+'</select></div>':'')+'<div class="el-pdf-bottom"><button class="btn el-active" onclick="elPrintSelected()">'+t('SAVE AS PDF','SIMPAN PDF')+'</button></div>';
}
 root.innerHTML=h;saveState();
}
window.elView=v=>{view=v;draw();};
window.elCount=v=>{
 const n=Number(v),input=document.getElementById('el-input');
 if(!Number.isInteger(n)||n<4||n>40){alert(t('Enter a whole number from 4 to 40.','Masukkan nombor bulat antara 4 hingga 40.'));if(input)input.value=count;return;}
 if(n===Number(count))return;
 const apply=()=>{count=n;namesOpen=false;pdfOpen=false;applied=false;names={};winners={};pending={};captureCategory();refreshCategoryControls();draw();};
 if(Object.values(names).some(v=>String(v).trim())||Object.keys(winners).length||Object.keys(pending).length){
 if(input)input.value=count;
 elConfirm(t('CHANGE PARTICIPANT COUNT?','TUKAR JUMLAH PESERTA?'),t('Changing the participant count clears names and results in this category only.','Menukar jumlah peserta memadam nama dan keputusan kategori ini sahaja.'),t('CONTINUE','TERUSKAN'),apply,refreshCategoryControls);return;}
 apply();
};
window.elName=(seed,value)=>{names[seed]=value;applied=false;saveState();};
window.elToggleNames=()=>{namesOpen=!namesOpen;draw();};
window.elApplyNames=()=>{applied=true;namesOpen=false;draw();};
window.elWinner=(id,key)=>{id=String(id).replace(/^Match\s+(\d+)$/i,'M$1');pending[id]=key;const m=build(Number(count)),idx=m.rounds.findIndex(r=>r.matches.some(match=>match.id===id));const btn=document.querySelector('[data-el-round="'+idx+'"]');if(btn){btn.textContent='UPDATE';btn.classList.remove('el-completed');btn.classList.add('el-active');}saveState();};
window.elGoGraph=()=>{const el=document.getElementById('el-graph');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});};
window.elUpdateRound=index=>{const m=build(Number(count)),r=m.rounds[index];if(!r)return;for(const match of r.matches){if(Object.prototype.hasOwnProperty.call(pending,match.id)){if(pending[match.id])winners[match.id]=pending[match.id];else delete winners[match.id];delete pending[match.id];}}sanitize();draw();};
window.elTogglePdf=()=>{pdfOpen=!pdfOpen;draw();};
window.elPdfMode=v=>{pdfNames=v;saveState();};
function finalStandings(m){
 const final=m.rounds.find(r=>r.label==='Final').matches[0],third=m.third;
 const a=slotResolve(m,final.a),b=slotResolve(m,final.b),x=slotResolve(m,third.a),y=slotResolve(m,third.b);
 const selected=(match,p,q)=>winners[match.id]===p.key?p:winners[match.id]===q.key?q:null;
 const first=selected(final,a,b),second=first?(first.key===a.key?b:a):null;
 const thirdPlace=selected(third,x,y),fourth=thirdPlace?(thirdPlace.key===x.key?y:x):null;
 return [first,second,thirdPlace,fourth];
}
function finalResultsHtml(m,includeNames=true){
 const labels=['1st','2nd','3rd','4th'];
 return '<section class="el-final-results"><h3>FINAL RESULTS</h3>'+finalStandings(m).map((v,i)=>'<div><b>'+labels[i]+':</b> '+(v?esc(includeNames?v.text:'#'+v.seed):'')+'</div>').join('')+'</section>';
}
window.elPaperSize=value=>{paperSize=value==='A3'?'A3':'A4';saveState();};
window.elTitleToggle=enabled=>{titleEnabled=enabled;draw();};
window.elTitleChange=value=>{customTitle=value;saveState();};
window.elPrintSelected=()=>{
 const selection=document.getElementById('el-print-category'),i=selection?Number(selection.value):activeCategory;
 if(!Number.isInteger(i)||!categories[i])return;
 captureCategory();const original=activeCategory;
 try{loadCategory(i);window.elPrint();}finally{loadCategory(original);}
};
window.elPrint=(archivedDate='')=>{
 const n=Number(count);if(!Number.isInteger(n)||n<4||n>40)return;
 const m=build(n),chart=svg(m,pdfNames),now=archivedDate?new Date(archivedDate):new Date();
 const categoryInfo=categories.length>1||categories[activeCategory].label?esc(categoryName(activeCategory)):'';
 const date=now.toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
 const time=now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
 const gpsEnabled=!archivedDate&&((typeof S!=='undefined'&&S&&S.gps===true)||(typeof localStorage!=='undefined'&&localStorage.getItem('as_gps')==='true'));
 const sessionLocation=typeof S!=='undefined'&&S&&S.session&&S.session.location?String(S.session.location):'';
 const cachedLocation=(()=>{try{return localStorage.getItem('el_last_gps_location')||'';}catch(e){return '';}})();
 const extraTitle=titleEnabled&&customTitle.trim()?'<h1>'+esc(customTitle.trim().toUpperCase())+'</h1>':'';
 const result=finalResultsHtml(m,pdfNames);
 // Crop only unused bottom SVG canvas; keep its native aspect ratio and text proportions.
 const firstStage=m.rounds.filter(r=>r.label!=='3rd / 4th Place')[0];
 const stagesForPrint=m.rounds.filter(r=>r.label!=='3rd / 4th Place');
 const visibleBottom=Math.max(...stagesForPrint.map((stage,k)=>{const mainIdx=k-(m.preCount>0?1:0);return 75+(mainIdx<0?(stage.matches.length-1)*58:(Math.pow(2,mainIdx)*58-58)/2+(stage.matches.length-1)*Math.pow(2,mainIdx)*58)+48;}),75+(Math.pow(2,stagesForPrint.length-(m.preCount>0?2:1))*58-58)/2+72+62)+12;

 const printWidth=stagesForPrint.length*225+22;
 const lastBoxRight=12+(stagesForPrint.length-1)*225+196;
 const resultsY=visibleBottom+7, resultsHeight=82, printHeight=resultsY+resultsHeight+18;
 const standingLabels=['1st','2nd','3rd','4th'];
 const standings=finalStandings(m);
 const resultLines=standings.map((v,i)=>'<text x="25" y="'+(resultsY+34+i*13)+'" font-size="11" fill="#14345b">'+standingLabels[i]+': '+esc(v?(pdfNames?v.text:'#'+v.seed):'')+'</text>').join('');
 const svgFooter='<rect x="12" y="'+resultsY+'" width="400" height="'+resultsHeight+'" rx="6" fill="#e3f3e9" stroke="#80ae94"/><text x="212" y="'+(resultsY+17)+'" text-anchor="middle" font-size="13" font-weight="700" fill="#14345b">FINAL RESULTS</text>'+resultLines+'<text x="'+lastBoxRight+'" y="'+(resultsY+resultsHeight-5)+'" text-anchor="end" font-size="12" font-weight="700" fill="#14345b">PWA: SCOREBOARD</text>';
 const printChart=chart.replace(/height="\d+" viewBox="0 0 (\d+) \d+"/,(_,w)=>'height="'+printHeight+'" viewBox="0 0 '+w+' '+printHeight+'"').replace('</svg>',svgFooter+'</svg>');
 const win=window.open('','_blank');if(!win){alert(t('Please allow pop-ups to print.','Sila benarkan pop-up untuk mencetak.'));return;}
 const writePrint=location=>{win.document.open();
 const pageWidth=paperSize==='A3'?420:297,pageHeight=paperSize==='A3'?297:210;
 const chartHeight=pageHeight-48;
 const pageCss='@page{size:'+paperSize+' landscape;margin:6mm 3mm 3mm}';
 win.document.write('<!doctype html><html><head><meta charset="utf-8"><title>ELIMINATION ROUND'+(categoryInfo?' - '+categoryInfo:'')+'</title><style>'+pageCss+'*{box-sizing:border-box}html,body{margin:0;padding:0;font-family:Arial,sans-serif;color:#14345b}body{width:100%;height:'+(pageHeight-9)+'mm;padding:0;overflow:hidden}.sheet{width:100%;height:'+(pageHeight-9)+'mm;min-height:0;display:flex;flex-direction:column;justify-content:flex-start;align-items:stretch;overflow:hidden;break-inside:avoid;page-break-inside:avoid}h1,h2{text-align:center;font-size:23pt;margin:0 0 2mm;font-weight:800}h2{font-size:20pt}.info{text-align:center;font-size:10pt;margin:1mm 0}.chart{flex:none;min-height:0;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;margin:2mm 0 0;background:#f7f9fc}.chart svg{display:block;width:100%;max-width:100%;height:auto;max-height:' +chartHeight+'mm;margin:0 auto;object-fit:contain}.footer{width:100%;margin:0;padding:0}.el-final-results{background:#e3f3e9;border:1px solid #80ae94;border-radius:7px;padding:3mm 5mm;width:40%;min-width:0;font-size:10pt}.el-final-results h3{text-align:center;margin:0 0 2mm;font-size:12pt}.el-final-results div{margin:1mm 0}.footer{position:static;width:100%;margin:0;display:flex;align-items:flex-end;justify-content:space-between;gap:12mm;min-height:18mm;padding:0 17mm 2mm 5mm}.brand{font-size:12pt;font-weight:700;white-space:nowrap;text-align:right;margin-left:auto}@media print{html,body{width:100%!important;height:'+(pageHeight-9)+'mm!important;overflow:hidden!important}body{padding:0!important}.sheet{width:100%!important;height:'+(pageHeight-9)+'mm!important;overflow:hidden!important;break-after:avoid!important;page-break-after:avoid!important}.chart svg{max-height:' +chartHeight+'mm!important}}</style></head><body><main class="sheet">'+extraTitle+'<'+(extraTitle?'h2':'h1')+'>ELIMINATION ROUND</'+(extraTitle?'h2':'h1')+'><p class="info">'+(categoryInfo?'Category: '+categoryInfo+' | ':'')+'Participants: '+n+' | Bye: '+m.bye+' | Preliminary: '+m.preCount+' | Total Matches: '+n+'</p><p class="info">Date: '+esc(date)+' | Time: '+esc(time)+'<span class="info-location">'+(location?' | Location: '+esc(location):'')+'</span></p><div class="chart">'+printChart+'</div></main><script>window.addEventListener("load",function(){var svg=document.querySelector(".chart svg"),footer=document.querySelector(".footer"),chart=document.querySelector(".chart");if(svg&&footer&&chart){var boxes=svg.querySelectorAll("rect[rx=7]");if(boxes.length){var left=boxes[0].getBoundingClientRect().left;var right=boxes[boxes.length-1].getBoundingClientRect().right;var outer=chart.getBoundingClientRect();footer.style.paddingLeft=Math.max(0,left-outer.left)+"px";footer.style.paddingRight=Math.max(0,outer.right-right)+"px";}}setTimeout(function(){window.print()},100)});<\/script></body></html>');
 win.document.close();};
 // Render the complete bracket immediately; never replace the popup document
 // after GPS resolves, as Android may detach the original about:blank tab.
 writePrint(gpsEnabled?(sessionLocation||cachedLocation):'');
 if(gpsEnabled&&navigator.geolocation){
  navigator.geolocation.getCurrentPosition(async position=>{
   const lat=position.coords.latitude,lon=position.coords.longitude;
   let locationText='';
   try{if(typeof resolveLocationName==='function')locationText=await resolveLocationName(lat,lon);}catch(e){}
   if(!locationText&&Number.isFinite(lat)&&Number.isFinite(lon))locationText=lat.toFixed(5)+', '+lon.toFixed(5);
   if(locationText)try{localStorage.setItem('el_last_gps_location',locationText);}catch(e){}
   try{if(!win.closed){const el=win.document.querySelector('.info-location');if(el&&locationText)el.textContent=' | Location: '+locationText;}}catch(e){}
  },error=>{try{if(!win.closed){const el=win.document.querySelector('.info-location');if(el&&!el.textContent.trim())el.textContent='';}}catch(e){}},{enableHighAccuracy:true,timeout:8000,maximumAge:300000});
 }
};
function preloadEliminationLocation(){
 const enabled=(typeof S!=='undefined'&&S&&S.gps===true)||(typeof localStorage!=='undefined'&&localStorage.getItem('as_gps')==='true');
 if(!enabled||!navigator.geolocation)return;
 navigator.geolocation.getCurrentPosition(async position=>{
  const lat=position.coords.latitude,lon=position.coords.longitude;
  let name='';
  try{if(typeof resolveLocationName==='function')name=await resolveLocationName(lat,lon);}catch(e){}
  if(!name)name=lat.toFixed(5)+', '+lon.toFixed(5);
  try{localStorage.setItem('el_last_gps_location',name);}catch(e){}
 },()=>{},{enableHighAccuracy:true,timeout:8000,maximumAge:300000});
}
window.eliminationGuide=()=>{
 const bm=typeof infoLang!=='undefined'&&infoLang==='BM';
 captureCategory();
 page(head(bm?'PANDUAN PUSINGAN PENYINGKIRAN':'ELIMINATION ROUND GUIDE').replace('page-head-blue','page-head-magenta')+'<section class="card el-guide"><h2>'+(bm?'Kalkulator Bye & Carta Perlawanan':'Bye Calculator & Match Bracket')+'</h2><div style="margin:10px 0 16px;padding:10px;border:1px solid #dbe3ec;border-radius:10px"><div id="el-save-status" role="status" style="font-size:13px;font-weight:600;color:#17804e">'+esc(statusText())+'</div><button class="btn soft" style="width:100%;margin-top:8px" onclick="elNewTournament()">'+t('NEW ELIMINATION ROUND','PUSINGAN PENYINGKIRAN BAHARU')+'</button><button class="btn soft" style="width:100%;margin-top:8px" onclick="elHistoryPage()">'+t('ELIMINATION ROUND HISTORY','SEJARAH PUSINGAN PENYINGKIRAN')+'</button></div><p class="el-note">'+(bm?'Seed #1 ialah peserta ranking tertinggi.':'Seed #1 is the highest-ranked participant.')+'</p><div class="el-input-row"><label id="el-cat-count-label">'+t('Number of Categories','Bilangan Kategori')+'</label><div class="stepper el-category-stepper" role="group" aria-labelledby="el-cat-count-label"><button type="button" id="el-cat-minus" aria-label="'+t('Reduce categories','Kurangkan kategori')+'" onclick="elCategoryStep(-1)"'+(categories.length<=1?' disabled':'')+'>−</button><strong id="el-cat-count" aria-live="polite">'+categories.length+'</strong><button type="button" id="el-cat-plus" aria-label="'+t('Add category','Tambah kategori')+'" onclick="elCategoryStep(1)"'+(categories.length>=12?' disabled':'')+'>+</button></div></div>'+categoryNav()+'<div class="el-input-row"><label for="el-cat-name">'+t('Category Name','Nama Kategori')+'<input id="el-cat-name" type="text" maxlength="60" value="'+esc(categories[activeCategory].label)+'" placeholder="'+esc(categoryPlaceholder(activeCategory))+'" oninput="elRenameCategory(this.value)"/></label></div><div class="el-input-row"><label for="el-input">'+(bm?'Jumlah Peserta / Pasukan':'Number of Participants / Teams')+'<input id="el-input" type="number" min="4" max="40" step="1" value="'+count+'" onchange="elCount(this.value)"/></label></div><div id="elimination-results"></div></section>','elimination');
 refreshCategoryControls();draw();
 requestAnimationFrame(()=>window.scrollTo(0,categories[activeCategory].scrollY||0));
 preloadEliminationLocation();
};
})();