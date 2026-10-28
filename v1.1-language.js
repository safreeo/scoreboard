/* SCOREBOARD v1.1 - Bilingual UI layer (ENG / BM)
   UI-only translation layer. Scoring/data logic remains untouched. */
(() => {
  const KEY="scoreboard_language_v11", DEFAULT_MIGRATION="scoreboard_language_v111_default";
  if(!localStorage.getItem(DEFAULT_MIGRATION)){localStorage.setItem(KEY,"en");localStorage.setItem(DEFAULT_MIGRATION,"1");}
  let lang=localStorage.getItem(KEY)==="bm"?"bm":"en";

  const BM={
    "START PRACTICE":"MULA LATIHAN","PRACTICE HISTORY":"SEJARAH LATIHAN","ARCHER PROFILE":"PROFIL PEMANAH","SETTINGS":"TETAPAN","APPLICATION INFO":"INFO APLIKASI",
    "PRACTICE SETUP":"TETAPAN LATIHAN","Practice Setup":"Tetapan Latihan","PRACTICE MODE":"MOD LATIHAN","Practice Mode":"Mod Latihan","PRACTICE FORMAT":"FORMAT LATIHAN","Practice Format":"Format Latihan",
    "Static":"Statik","Personal":"Individu","PERSONAL":"INDIVIDU","Team":"Pasukan","TEAM":"PASUKAN","Group":"Kumpulan","Individual":"Individu","Target":"Sasaran","Target Practice":"Latihan Sasaran","Game":"Permainan",
    "Back":"Kembali","‹ Back":"‹ Kembali","Save":"Simpan","SAVE NOTE":"SIMPAN NOTA","Cancel":"Batal","CANCEL":"BATAL","Close":"Tutup","CLOSE":"TUTUP","Delete":"Padam","Edit":"Edit","Done":"Selesai","Next":"Seterusnya","Previous":"Sebelumnya","Continue":"Teruskan","Confirm":"Sahkan","Reset":"Tetapkan Semula","Clear":"Kosongkan","Print":"Cetak","Share":"Kongsi","View":"Lihat","Select":"Pilih","Selected":"Dipilih","Add":"Tambah","Remove":"Buang","Search":"Cari","Apply":"Guna","Update":"Kemas Kini","Create":"Cipta","Change":"Tukar","Choose":"Pilih",
    "Distance":"Jarak","DISTANCE":"JARAK","Distance (m)":"Jarak (m)","Target Face":"Target Face","TARGET FACE":"TARGET FACE","Target Face (cm)":"Target Face (cm)","Rounds":"Round","Round":"Round","Ends":"End","End":"End","Ends / Round":"End / Round","Arrows":"Arrow","Arrow":"Arrow","Arrows / End":"Arrow / End","Timer":"Timer","Lane":"Lorong","Lanes":"Lorong","Scoring":"Pemarkahan","Score":"Markah","Scores":"Markah","Total":"Jumlah","Average":"Purata","Rank":"Kedudukan","Ranking":"Kedudukan","Result":"Keputusan","Results":"Keputusan","Summary":"Ringkasan","SUMMARY":"RINGKASAN","Detailed Result":"Keputusan Terperinci","DETAILED RESULT":"KEPUTUSAN TERPERINCI",
    "Archer":"Pemanah","Archers":"Pemanah","ARCHERS":"PEMANAH","Archer Name":"Nama Pemanah","ARCHER NAME":"NAMA PEMANAH","Name":"Nama","Date":"Tarikh","Time":"Masa","Location":"Lokasi","LOCATION":"LOKASI","Auto-Detect GPS Location":"Kesan Lokasi GPS Secara Automatik","Auto Detect GPS":"Kesan GPS Secara Automatik","Add location to new practice sessions when permission is available.":"Tambah lokasi pada sesi latihan baharu apabila kebenaran tersedia.","If OFF, permission is denied or location cannot be resolved, Loc is omitted from WhatsApp and Detailed Results.":"Jika DIMATIKAN, kebenaran ditolak atau lokasi tidak dapat dikesan, lokasi tidak akan dipaparkan dalam WhatsApp dan Keputusan Terperinci.","GPS Location":"Lokasi GPS","Current Location":"Lokasi Semasa","Use Current Location":"Guna Lokasi Semasa",
    "Quick Preset":"Preset Pantas","QUICK PRESET":"PRESET PANTAS","QUICK PRESETS":"PRESET PANTAS","Tap preset to apply":"Tekan preset untuk guna","Preset":"Preset","Presets":"Preset","Save Preset":"Simpan Preset","Load Preset":"Muat Preset","Custom":"Tersuai","Single Distance":"Jarak Tunggal","SINGLE DISTANCE":"JARAK TUNGGAL","Multiple Distance":"Pelbagai Jarak","Multiple Distances":"Pelbagai Jarak","MULTIPLE DISTANCES":"PELBAGAI JARAK","Single":"Tunggal","Multiple":"Pelbagai",
    "START":"MULA","START SCORING":"MULA PEMARKAHAN","START SCORING SESSION ›":"MULA SESI PEMARKAHAN ›","FINISH":"TAMAT","FINISH PRACTICE":"TAMAT LATIHAN","END PRACTICE":"TAMAT LATIHAN","Resume":"Sambung","Resume Practice":"Sambung Latihan","New Practice":"Latihan Baru","Add Archer":"Tambah Pemanah","+ ADD":"+ TAMBAH","Remove Archer":"Buang Pemanah","Select Archer":"Pilih Pemanah","Active Archer":"Pemanah Aktif","ACTIVE ARCHERS":"PEMANAH AKTIF","MANAGE":"URUS","Manage":"Urus","New archer name":"Nama pemanah baharu",
    "HISTORY":"SEJARAH","History":"Sejarah","All":"Semua","Today":"Hari Ini","Weekly":"Mingguan","WEEKLY":"MINGGUAN","Monthly":"Bulanan","MONTHLY":"BULANAN","Yearly":"Tahunan","YEARLY":"TAHUNAN","Profile":"Profil","Performance":"Prestasi","Statistics":"Statistik","Best":"Terbaik","Highest":"Tertinggi","Lowest":"Terendah","Completed":"Selesai","Incomplete":"Belum Selesai","Completed Practice":"Latihan Selesai","Practice Details":"Butiran Latihan","Period":"Tempoh","Last 7 Days":"7 Hari Terakhir","DELETE SELECTED":"PADAM DIPILIH","DELETE ALL":"PADAM SEMUA","ADD NOTE":"TAMBAH NOTA","PRACTICE NOTE":"NOTA LATIHAN","Add note for this session...":"Tambah nota untuk sesi ini...",
    "DISPLAY":"PAPARAN","Display":"Paparan","Font Size":"Saiz Font","Small":"Kecil","Normal":"Normal","Large":"Besar","TIMER":"TIMER","Timer Settings":"Tetapan Timer","Preparation":"Persediaan","Shooting":"Panahan","Shooting Time":"Masa Panahan","Warning":"Amaran","Whistle":"Wisel","Whistle Volume":"Kelantangan Wisel","TEST WHISTLE":"UJI WISEL","Whistle volume is limited by your phone/tablet system volume.":"Kelantangan wisel dihadkan oleh tetapan kelantangan sistem telefon/tablet anda.","Vibration":"Getaran","Volume":"Kelantangan","sec":"saat",
    "DATA":"DATA","EXPORT EXCEL":"EKSPORT EXCEL","BACKUP DATA":"SANDARAN DATA","RESTORE DATA":"PULIHKAN DATA","FACTORY RESET":"TETAPAN SEMULA KILANG","Delete all Archer Lists, Practice History, Presets, Settings and unfinished sessions stored on this device.":"Padam semua Senarai Pemanah, Sejarah Latihan, Preset, Tetapan dan sesi yang belum selesai yang disimpan pada peranti ini.",
    "Matrix":"Matriks","Score Matrix":"Matriks Markah","SCORING MATRIX":"MATRIKS PEMARKAHAN","Matrix Manager":"Pengurus Matriks","Manage / + Add Matrix":"Urus / + Tambah Matriks","Archer Manager":"Pengurus Pemanah","Manage Archers":"Urus Pemanah","Save as Quick Preset":"Simpan sebagai Preset Pantas","Save this setup for future practice.":"Simpan tetapan ini untuk latihan akan datang.",
    "SCORE TREND (%)":"TREND MARKAH (%)","PERSONAL BEST SCORES (per distance)":"MARKAH PERIBADI TERBAIK (mengikut jarak)","ACCURACY & POINT BREAKDOWN":"KETEPATAN & PECAHAN MATA","80–100% Best":"80–100% Terbaik","50–79% Good":"50–79% Baik","1–49% Average":"1–49% Sederhana","pts":"mata",
    "SCORE %":"MARKAH %","AVERAGE PER ARROW (AVG)":"PURATA SETIAP ARROW (AVG)","The percentage of the actual score achieved compared with the maximum possible score based on the practice format and scoring matrix. Example:":"Peratus markah sebenar yang dicapai berbanding markah maksimum berdasarkan format latihan dan matriks pemarkahan. Contoh:","Maximum Score:":"Markah Maksimum:","Final Score:":"Markah Akhir:","Formula:":"Formula:","The average points obtained for each arrow that has been recorded. Example:":"Purata mata yang diperoleh bagi setiap arrow yang telah direkodkan. Contoh:","Total Score:":"Jumlah Markah:","Total Arrows:":"Jumlah Arrow:","Average per Arrow:":"Purata setiap Arrow:",
    "App Version:":"Versi Aplikasi:","Last Updated:":"Kemas Kini Terakhir:","USER MANUAL":"MANUAL PENGGUNA","CONTACT & FEEDBACK":"HUBUNGI & MAKLUM BALAS","DISCLAIMER & PERMISSION":"PENAFIAN & KEBENARAN","PRAYER":"DOA",
    "Settings":"Tetapan","Information":"Maklumat","Info":"Info","User Manual":"Manual Pengguna","Contact and Feedback":"Hubungi dan Maklum Balas","Contact & Feedback":"Hubungi & Maklum Balas",
    "Yes":"Ya","No":"Tidak","ON":"HIDUP","OFF":"MATI","On":"Hidup","Off":"Mati","Enabled":"Diaktifkan","Disabled":"Dinyahaktifkan","Required":"Diperlukan","Optional":"Pilihan",
    "Developed by Abu Danial":"Dibangunkan oleh Abu Danial","This application is provided free of charge. Unauthorized sale, redistribution, or modification is prohibited without permission from the owner.":"Aplikasi ini disediakan secara percuma. Penjualan, pengedaran semula atau pengubahsuaian tanpa kebenaran pemilik adalah dilarang.","May Allah forgive the developer, the users, their parents, families, and all Muslims.":"Semoga Allah mengampuni pembangun, para pengguna, ibu bapa dan keluarga mereka, serta seluruh umat Islam."
  };
  const EN=Object.fromEntries(Object.entries(BM).filter(([e,b])=>e!==b).map(([e,b])=>[b,e]));
  const protectedText=new Set(["SCOREBOARD","Practice • Improve • Consistent","X","M","ENG","BM","3D","2D","Target Face","TARGET FACE","Target Face (cm)"]);

  function translateString(raw){
    if(!raw)return raw; const lead=raw.match(/^\s*/)?.[0]||"",trail=raw.match(/\s*$/)?.[0]||"",s=raw.trim(); if(!s||protectedText.has(s))return raw;
    const normalized=s.replace(/\s+/g," "),map=lang==="bm"?BM:EN;
    if(map[s])return lead+map[s]+trail; if(map[normalized])return lead+map[normalized]+trail;
    if(lang==="bm"){let m=normalized.match(/^(\d+) ACTIVE$/);if(m)return lead+`${m[1]} AKTIF`+trail;m=normalized.match(/^(\d+) selected$/);if(m)return lead+`${m[1]} dipilih`+trail;m=normalized.match(/^(\d+(?:\.\d+)?) pts$/);if(m)return lead+`${m[1]} mata`+trail;}
    return raw;
  }

  function removeNativeLanguageSwitches(){
    document.querySelectorAll("button").forEach(btn=>{
      if(btn.closest(".home .lang-switch-v11"))return;
      const t=(btn.textContent||"").trim(); if(t!=="ENG"&&t!=="BM")return;
      let p=btn.parentElement; if(!p)return;
      const labels=[...p.querySelectorAll("button")].map(b=>(b.textContent||"").trim());
      if(labels.includes("ENG")&&labels.includes("BM"))p.remove(); else btn.remove();
    });
  }
  function cleanupUI(root=document){
    root.querySelectorAll?.(".help,small").forEach(el=>{const t=(el.textContent||"").replace(/\s+/g," ").trim();if(t==="The first registered archer on this device becomes the default name."||t==="M = Miss • X is recorded separately and scores 10 points.")el.remove();});
    document.querySelectorAll(".lang-switch-v11").forEach(el=>{if(!el.closest(".home"))el.remove();}); removeNativeLanguageSwitches();
  }
  function syncLegacyInfoLanguage(){
    try{if(typeof infoLang!=="undefined")infoLang=lang==="bm"?"BM":"ENG";}catch(e){}
  }
  function translateTree(root=document.body){
    if(!root)return;cleanupUI(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let n;while((n=walker.nextNode()))nodes.push(n);
    nodes.forEach(node=>{if(node.parentElement?.closest("script,style,.lang-switch-v11"))return;const v=translateString(node.nodeValue);if(v!==node.nodeValue)node.nodeValue=v;});
    root.querySelectorAll?.("[placeholder],[title],[aria-label]").forEach(el=>["placeholder","title","aria-label"].forEach(a=>{if(!el.hasAttribute(a))return;const old=el.getAttribute(a),v=translateString(old);if(v!==old)el.setAttribute(a,v);}));
    document.documentElement.lang=lang==="bm"?"ms":"en";
  }
  function ensureSwitch(){
    cleanupUI(document);const home=document.querySelector(".home"),menu=document.querySelector(".home-menu");if(!home||!menu)return;let box=home.querySelector(".lang-switch-v11");
    if(!box){box=document.createElement("div");box.className="lang-switch-v11";box.setAttribute("aria-label","Language");box.innerHTML='<button type="button" data-lang="en">ENG</button><button type="button" data-lang="bm">BM</button>';menu.insertAdjacentElement("afterend",box);box.addEventListener("click",e=>{const b=e.target.closest("button[data-lang]");if(b)setLanguage(b.dataset.lang);});}
    box.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.lang===lang));
  }
  function setLanguage(next){
    const requested=next==="bm"?"bm":"en";lang="en";translateTree();lang=requested;localStorage.setItem(KEY,lang);syncLegacyInfoLanguage();
    if(currentView==="info"&&typeof info==="function"){try{info();}catch(e){}} translateTree();ensureSwitch();
  }
  const style=document.createElement("style");style.textContent=`
    .home{padding-top:max(8px,env(safe-area-inset-top))!important}.home .club-logo{margin-top:0!important}.home .home-menu{margin-top:12px!important}
    .lang-switch-v11{display:flex;align-items:center;justify-content:center;gap:5px;width:max-content;margin:22px auto 4px;padding:4px;background:#fff;border:0;border-radius:9px;box-shadow:none}
    .lang-switch-v11 button{min-width:43px;border:0;border-radius:6px;background:#e7ebf0;color:#0b2f5b;padding:6px 9px;font-size:11px;font-weight:800;letter-spacing:.25px;cursor:pointer;opacity:1}
    .lang-switch-v11 button.active{background:#0b2f5b;color:#fff;box-shadow:none}
  `;document.head.appendChild(style);
  let queued=false;const refresh=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;syncLegacyInfoLanguage();translateTree();ensureSwitch();});};
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});window.setScoreboardLanguage=setLanguage;window.getScoreboardLanguage=()=>lang;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",refresh);else refresh();
})();
