/* SCOREBOARD v1.1.10 — final BM translation/UI patch
   Translation/UI metadata only. No scoring or session logic is changed. */
(() => {
  const isBM = () => (window.getScoreboardLanguage?.() || localStorage.getItem('scoreboard_language_v11')) === 'bm';
  const exact = new Map([
    ['UNFINISHED SESSION DETECTED','SESI BELUM SELESAI DIKESAN'],['RESUME','SAMBUNG'],['DISCARD','BUANG'],['Last saved:','Terakhir disimpan:'],
    ['Please Confirm','Sila Sahkan'],['Discard unfinished session?','Buang sesi yang belum selesai?'],['All scores in this unfinished session will be deleted.','Semua markah dalam sesi yang belum selesai ini akan dipadam.'],
    ['Select at least one active archer.','Pilih sekurang-kurangnya seorang pemanah aktif.'],['Enter Group No.','Masukkan No. Kumpulan.'],['Enter Lane No.','Masukkan No. Lorong.'],
    ['SAVE PRESET','SIMPAN PRESET'],['Preset name','Nama preset'],['EDIT PRESET','EDIT PRESET'],['Scoring Matrix','Matriks Pemarkahan'],
    ['Change Format, Timer, Lane or Matrix above, then Update.','Tukar Format, Pemasa, Lorong atau Matriks di atas, kemudian Kemas Kini.'],['UPDATE PRESET','KEMAS KINI PRESET'],['Delete this preset?','Padam preset ini?'],['DELETE','PADAM'],
    ['ADD / EDIT MATRIX','TAMBAH / EDIT MATRIKS'],['Matrix name','Nama matriks'],['SAVE MATRIX','SIMPAN MATRIKS'],['CUSTOM MATRICES','MATRIKS TERSUAI'],
    ['ARCHER LIST','SENARAI PEMANAH'],['DONE','SELESAI'],['Deleting an Archer List name does not delete Practice History.','Memadam nama dalam Senarai Pemanah tidak akan memadam Sejarah Latihan.'],
    ['ARCHERY TIMER','PEMASA MEMANAH'],['‹ Scoring','‹ Pemarkahan'],['READY','SEDIA'],['Press START','Tekan MULA'],['PAUSE / RESUME','JEDA / SAMBUNG'],['RESET','TETAP SEMULA'],
    ['Preparation','Persediaan'],['Shooting','Panahan'],['Warning','Amaran'],['Stop','Berhenti'],['PREPARATION','PERSEDIAAN'],['Get ready','Bersedia'],['SHOOTING','PANAHAN'],['Start shooting','Mula memanah'],
    ['WARNING','AMARAN'],['Time running out','Masa hampir tamat'],['STOP','BERHENTI'],['End complete','End selesai'],['PAUSED','DIJEDA'],['RESUMED','DISAMBUNG'],
    ['SEND VIA WHATSAPP','HANTAR MELALUI WHATSAPP'],['Timer','Pemasa'],
    ['Position','No.'],['POSITION','NO.']
  ]);
  const phrases = [
    ['Discard unfinished session?','Buang sesi yang belum selesai?'],['All scores in this unfinished session will be deleted.','Semua markah dalam sesi yang belum selesai ini akan dipadam.'],
    ['Delete this preset?','Padam preset ini?'],['Select at least one active archer.','Pilih sekurang-kurangnya seorang pemanah aktif.'],['Enter Group No.','Masukkan No. Kumpulan.'],['Enter Lane No.','Masukkan No. Lorong.']
  ];
  function bmText(s) {
    if (!isBM() || typeof s !== 'string') return s;
    const trimmed=s.trim();
    if (exact.has(trimmed)) return s.replace(trimmed,exact.get(trimmed));
    let out=s;
    for (const [a,b] of phrases) out=out.split(a).join(b);
    out=out.replace(/Cannot reduce Ends\. End (\d+) already contains scores\./gi,'Tidak boleh mengurangkan End. End $1 sudah mempunyai markah.');
    out=out.replace(/(\d+) Archer(?:s)? • Round (\d+)\/(\d+) • End (\d+)\/(\d+)/gi,'$1 Pemanah • Round $2/$3 • End $4/$5');
    return out;
  }
  const nativeAlert=window.alert.bind(window), nativeConfirm=window.confirm.bind(window), nativePrompt=window.prompt.bind(window);
  window.alert=message=>nativeAlert(bmText(String(message??'')));
  window.confirm=message=>nativeConfirm(bmText(String(message??'')));
  window.prompt=(message,value)=>nativePrompt(bmText(String(message??'')),value);
  function translateDOM(root=document.body){
    if(!isBM()||!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){const old=node.nodeValue,next=bmText(old);if(next!==old)node.nodeValue=next;}
    root.querySelectorAll?.('[placeholder]').forEach(el=>{const old=el.getAttribute('placeholder'),next=bmText(old);if(next!==old)el.setAttribute('placeholder',next);});
    root.querySelectorAll?.('*').forEach(el=>{if(el.children.length===0&&el.textContent.trim()==='17 October 2026')el.textContent='28 October 2026';});
  }
  function languageSwitchContrast(){
    if(document.getElementById('v1110-lang-style'))return;
    const style=document.createElement('style');
    style.id='v1110-lang-style';
    style.textContent=`
      .lang-switch-v11 button:not(.active){background:#cbd3dc !important;color:#0b2f5b !important;opacity:1 !important;}
      .lang-switch-v11 button.active{opacity:1 !important;}
    `;
    document.head.appendChild(style);
  }
  let queued=false;
  const run=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;translateDOM();languageSwitchContrast();});};
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  document.addEventListener('DOMContentLoaded',run,{once:true});
  setTimeout(run,0);
})();
