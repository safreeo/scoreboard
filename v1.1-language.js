/* SCOREBOARD v1.1 - Bilingual UI layer (ENG / BM)
   UI-only translation layer. Scoring/data logic remains untouched. */
(() => {
  const KEY = "scoreboard_language_v11";
  const DEFAULT_MIGRATION = "scoreboard_language_v111_default";
  if (!localStorage.getItem(DEFAULT_MIGRATION)) {
    localStorage.setItem(KEY, "en");
    localStorage.setItem(DEFAULT_MIGRATION, "1");
  }
  let lang = localStorage.getItem(KEY) === "bm" ? "bm" : "en";

  const BM = {
    "START PRACTICE":"MULA LATIHAN","PRACTICE HISTORY":"SEJARAH LATIHAN","ARCHER PROFILE":"PROFIL PEMANAH","SETTINGS":"TETAPAN","APPLICATION INFO":"INFO APLIKASI",
    "PRACTICE SETUP":"TETAPAN LATIHAN","Practice Setup":"Tetapan Latihan","PRACTICE MODE":"MOD LATIHAN","Practice Mode":"Mod Latihan","PRACTICE FORMAT":"FORMAT LATIHAN","Practice Format":"Format Latihan",
    "Static":"Statik","Personal":"Individu","Team":"Pasukan","Group":"Kumpulan","Individual":"Individu","Target":"Sasaran","Target Practice":"Latihan Sasaran","Game":"Permainan",
    "Back":"Kembali","‹ Back":"‹ Kembali","Save":"Simpan","Cancel":"Batal","Close":"Tutup","Delete":"Padam","Edit":"Edit","Done":"Selesai","Next":"Seterusnya","Previous":"Sebelumnya","Continue":"Teruskan","Confirm":"Sahkan","Reset":"Tetapkan Semula","Clear":"Kosongkan","Print":"Cetak","Share":"Kongsi","View":"Lihat","Select":"Pilih","Selected":"Dipilih","Add":"Tambah","Remove":"Buang","Search":"Cari","Apply":"Guna","Update":"Kemas Kini","Create":"Cipta","Change":"Tukar","Choose":"Pilih",
    "Distance":"Jarak","DISTANCE":"JARAK","Target Face":"Muka Sasaran","TARGET FACE":"MUKA SASARAN","Rounds":"Round","Round":"Round","Ends":"End","End":"End","Arrows":"Arrow","Arrow":"Arrow","Timer":"Timer","Lane":"Lorong","Lanes":"Lorong","Scoring":"Pemarkahan","Score":"Markah","Scores":"Markah","Total":"Jumlah","Average":"Purata","Rank":"Kedudukan","Ranking":"Kedudukan","Result":"Keputusan","Results":"Keputusan","Summary":"Ringkasan","SUMMARY":"RINGKASAN","Detailed Result":"Keputusan Terperinci","DETAILED RESULT":"KEPUTUSAN TERPERINCI",
    "Archer":"Pemanah","Archers":"Pemanah","ARCHERS":"PEMANAH","Archer Name":"Nama Pemanah","ARCHER NAME":"NAMA PEMANAH","Name":"Nama","Date":"Tarikh","Time":"Masa","Location":"Lokasi","LOCATION":"LOKASI","Auto-Detect GPS Location":"Kesan Lokasi GPS Secara Automatik","GPS Location":"Lokasi GPS","Current Location":"Lokasi Semasa","Use Current Location":"Guna Lokasi Semasa",
    "Quick Preset":"Preset Pantas","QUICK PRESET":"PRESET PANTAS","Preset":"Preset","Presets":"Preset","Save Preset":"Simpan Preset","Load Preset":"Muat Preset","Custom":"Tersuai","Single Distance":"Jarak Tunggal","Multiple Distance":"Pelbagai Jarak","Multiple Distances":"Pelbagai Jarak","Single":"Tunggal","Multiple":"Pelbagai",
    "START":"MULA","START SCORING":"MULA PEMARKAHAN","FINISH":"TAMAT","FINISH PRACTICE":"TAMAT LATIHAN","END PRACTICE":"TAMAT LATIHAN","Resume":"Sambung","Resume Practice":"Sambung Latihan","New Practice":"Latihan Baru","Add Archer":"Tambah Pemanah","Remove Archer":"Buang Pemanah","Select Archer":"Pilih Pemanah","Active Archer":"Pemanah Aktif",
    "HISTORY":"SEJARAH","History":"Sejarah","All":"Semua","Today":"Hari Ini","Weekly":"Mingguan","Monthly":"Bulanan","Yearly":"Tahunan","Profile":"Profil","Performance":"Prestasi","Statistics":"Statistik","Best":"Terbaik","Highest":"Tertinggi","Lowest":"Terendah","Completed":"Selesai","Incomplete":"Belum Selesai","Completed Practice":"Latihan Selesai","Practice Details":"Butiran Latihan",
    "DISPLAY":"PAPARAN","Display":"Paparan","Font Size":"Saiz Font","Small":"Kecil","Normal":"Normal","Large":"Besar","Timer Settings":"Tetapan Timer","Preparation":"Persediaan","Shooting Time":"Masa Memanah","Warning":"Amaran","Whistle":"Wisel","Vibration":"Getaran","Volume":"Kelantangan",
    "Matrix":"Matriks","Score Matrix":"Matriks Markah","Matrix Manager":"Pengurus Matriks","Archer Manager":"Pengurus Pemanah","Manage Archers":"Urus Pemanah","Manage":"Urus","Settings":"Tetapan","Information":"Maklumat","Info":"Info","User Manual":"Manual Pengguna","Contact and Feedback":"Hubungi dan Maklum Balas","Contact & Feedback":"Hubungi & Maklum Balas",
    "Yes":"Ya","No":"Tidak","ON":"HIDUP","OFF":"MATI","On":"Hidup","Off":"Mati","Enabled":"Diaktifkan","Disabled":"Dinyahaktifkan","Required":"Diperlukan","Optional":"Pilihan",
    "Developed by Abu Danial":"Dibangunkan oleh Abu Danial",
    "This application is provided free of charge. Unauthorized sale, redistribution, or modification is prohibited without permission from the owner.":"Aplikasi ini disediakan secara percuma. Penjualan, pengedaran semula atau pengubahsuaian tanpa kebenaran pemilik adalah dilarang.",
    "May Allah forgive the developer, the users, their parents, families, and all Muslims.":"Semoga Allah mengampuni pembangun, para pengguna, ibu bapa dan keluarga mereka, serta seluruh umat Islam."
  };

  const EN = Object.fromEntries(Object.entries(BM).map(([e,b]) => [b,e]));
  const protectedText = new Set(["SCOREBOARD","Practice • Improve • Consistent","X","M","ENG","BM","3D","2D"]);

  function translateString(raw) {
    if (!raw || protectedText.has(raw.trim())) return raw;
    const lead = raw.match(/^\s*/)?.[0] || "";
    const trail = raw.match(/\s*$/)?.[0] || "";
    const s = raw.trim();
    if (!s) return raw;
    const map = lang === "bm" ? BM : EN;
    if (map[s]) return lead + map[s] + trail;
    return raw;
  }

  function cleanupUI(root=document) {
    root.querySelectorAll?.(".help,small").forEach(el => {
      const t=(el.textContent||"").replace(/\s+/g," ").trim();
      if (t === "The first registered archer on this device becomes the default name.") el.remove();
    });
    document.querySelectorAll(".lang-switch-v11").forEach(el => {
      if (!el.closest(".home")) el.remove();
    });
  }

  function translateTree(root=document.body) {
    if (!root) return;
    cleanupUI(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes=[]; let n;
    while ((n=walker.nextNode())) nodes.push(n);
    nodes.forEach(node => {
      if (node.parentElement?.closest("script,style,.lang-switch-v11")) return;
      const v=translateString(node.nodeValue);
      if (v !== node.nodeValue) node.nodeValue=v;
    });
    root.querySelectorAll?.("[placeholder],[title],[aria-label]").forEach(el => {
      ["placeholder","title","aria-label"].forEach(a => {
        if (!el.hasAttribute(a)) return;
        const old=el.getAttribute(a), v=translateString(old);
        if (v !== old) el.setAttribute(a,v);
      });
    });
    document.documentElement.lang = lang === "bm" ? "ms" : "en";
  }

  function ensureSwitch() {
    cleanupUI(document);
    const home=document.querySelector(".home");
    const menu=document.querySelector(".home-menu");
    if (!home || !menu) return;
    let box=home.querySelector(".lang-switch-v11");
    if (!box) {
      box=document.createElement("div");
      box.className="lang-switch-v11";
      box.setAttribute("aria-label","Language");
      box.innerHTML='<button type="button" data-lang="en">ENG</button><button type="button" data-lang="bm">BM</button>';
      menu.insertAdjacentElement("afterend",box);
      box.addEventListener("click",e=>{
        const b=e.target.closest("button[data-lang]"); if(!b) return;
        setLanguage(b.dataset.lang);
      });
    }
    box.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.lang===lang));
  }

  function setLanguage(next) {
    const requested = next === "bm" ? "bm" : "en";
    lang="en"; translateTree();
    lang=requested;
    localStorage.setItem(KEY,lang);
    translateTree(); ensureSwitch();
  }

  const style=document.createElement("style");
  style.textContent=`
    .home{padding-top:max(8px,env(safe-area-inset-top))!important}
    .home .club-logo{margin-top:0!important}
    .home .home-menu{margin-top:12px!important}
    .lang-switch-v11{display:flex;align-items:center;justify-content:center;width:max-content;margin:20px auto 4px;padding:4px;background:#0b2f5b;border-radius:999px;box-shadow:0 3px 10px rgba(11,47,91,.22)}
    .lang-switch-v11 button{min-width:58px;border:0;border-radius:999px;background:transparent;color:#fff;padding:8px 14px;font-size:13px;font-weight:800;letter-spacing:.4px;cursor:pointer;opacity:.72}
    .lang-switch-v11 button.active{background:#1769aa;color:#fff;opacity:1;box-shadow:0 2px 7px rgba(0,0,0,.18)}
  `;
  document.head.appendChild(style);

  let queued=false;
  const refresh=()=>{
    if(queued) return; queued=true;
    requestAnimationFrame(()=>{queued=false; translateTree(); ensureSwitch();});
  };
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});
  window.setScoreboardLanguage=setLanguage;
  window.getScoreboardLanguage=()=>lang;
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",refresh); else refresh();
})();
