/* SCOREBOARD v1.1.9 — final BM translation patch
   Translation/UI metadata only. No scoring or session logic is changed. */
(() => {
  const isBM = () => (window.getScoreboardLanguage?.() || localStorage.getItem('scoreboard_language_v11')) === 'bm';

  const exact = new Map([
    ['UNFINISHED SESSION DETECTED','SESI BELUM SELESAI DIKESAN'],
    ['RESUME','SAMBUNG'],['DISCARD','BUANG'],['Last saved:','Terakhir disimpan:'],
    ['Please Confirm','Sila Sahkan'],
    ['Discard unfinished session?','Buang sesi yang belum selesai?'],
    ['All scores in this unfinished session will be deleted.','Semua markah dalam sesi yang belum selesai ini akan dipadam.'],
    ['Select at least one active archer.','Pilih sekurang-kurangnya seorang pemanah aktif.'],
    ['Enter Group No.','Masukkan No. Kumpulan.'],['Enter Lane No.','Masukkan No. Lorong.'],
    ['SAVE PRESET','SIMPAN PRESET'],['Preset name','Nama preset'],
    ['EDIT PRESET','EDIT PRESET'],['Scoring Matrix','Matriks Pemarkahan'],
    ['Change Format, Timer, Lane or Matrix above, then Update.','Tukar Format, Pemasa, Lorong atau Matriks di atas, kemudian Kemas Kini.'],
    ['UPDATE PRESET','KEMAS KINI PRESET'],['Delete this preset?','Padam preset ini?'],['DELETE','PADAM'],
    ['ADD / EDIT MATRIX','TAMBAH / EDIT MATRIKS'],['Matrix name','Nama matriks'],['SAVE MATRIX','SIMPAN MATRIKS'],['CUSTOM MATRICES','MATRIKS TERSUAI'],
    ['ARCHER LIST','SENARAI PEMANAH'],['DONE','SELESAI'],
    ['Deleting an Archer List name does not delete Practice History.','Memadam nama dalam Senarai Pemanah tidak akan memadam Sejarah Latihan.'],
    ['ARCHERY TIMER','PEMASA MEMANAH'],['‹ Scoring','‹ Pemarkahan'],['READY','SEDIA'],['Press START','Tekan MULA'],
    ['PAUSE / RESUME','JEDA / SAMBUNG'],['RESET','TETAP SEMULA'],
    ['Preparation','Persediaan'],['Shooting','Panahan'],['Warning','Amaran'],['Stop','Berhenti'],
    ['PREPARATION','PERSEDIAAN'],['Get ready','Bersedia'],['SHOOTING','PANAHAN'],['Start shooting','Mula memanah'],
    ['WARNING','AMARAN'],['Time running out','Masa hampir tamat'],['STOP','BERHENTI'],['End complete','End selesai'],
    ['PAUSED','DIJEDA'],['RESUMED','DISAMBUNG'],
    ['Cannot reduce Ends. End 2 already contains scores.','Tidak boleh mengurangkan End. End 2 sudah mempunyai markah.'],
    ['SEND VIA WHATSAPP','HANTAR MELALUI WHATSAPP'],
    ['Timer','Pemasa']
  ]);

  function bmText(s) {
    if (!isBM() || typeof s !== 'string') return s;
    const trimmed = s.trim();
    if (exact.has(trimmed)) return s.replace(trimmed, exact.get(trimmed));
    let m = trimmed.match(/^(\d+) Archer(s?) • Round (\d+)\/(\d+) • End (\d+)\/(\d+)$/i);
    if (m) return `${m[1]} Pemanah • Round ${m[3]}/${m[4]} • End ${m[5]}/${m[6]}`;
    m = trimmed.match(/^Cannot reduce Ends\. End (\d+) already contains scores\.$/i);
    if (m) return `Tidak boleh mengurangkan End. End ${m[1]} sudah mempunyai markah.`;
    return s;
  }

  // Translate native browser alert/confirm/prompt text without changing their behaviour.
  const nativeAlert = window.alert.bind(window);
  const nativeConfirm = window.confirm.bind(window);
  const nativePrompt = window.prompt.bind(window);
  window.alert = message => nativeAlert(bmText(String(message ?? '')));
  window.confirm = message => nativeConfirm(bmText(String(message ?? '')));
  window.prompt = (message, value) => nativePrompt(bmText(String(message ?? '')), value);

  function translateDOM(root = document.body) {
    if (!isBM() || !root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const old = node.nodeValue;
      const next = bmText(old);
      if (next !== old) node.nodeValue = next;
    }
    root.querySelectorAll?.('[placeholder]').forEach(el => {
      const next = bmText(el.getAttribute('placeholder'));
      if (next !== el.getAttribute('placeholder')) el.setAttribute('placeholder', next);
    });
    // Application Info metadata requested for this release.
    root.querySelectorAll?.('*').forEach(el => {
      if (el.children.length === 0 && el.textContent.trim() === '17 October 2026') el.textContent = '28 October 2026';
    });
  }

  let queued = false;
  const run = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; translateDOM(); });
  };
  new MutationObserver(run).observe(document.documentElement, {childList:true, subtree:true, characterData:true});
  document.addEventListener('DOMContentLoaded', run, {once:true});
  setTimeout(run, 0);
})();
