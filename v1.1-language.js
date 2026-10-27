/* SCOREBOARD v1.1 - Bilingual UI layer (ENG / BM)
   Non-invasive: translates rendered UI only; scoring/data logic is untouched. */
(() => {
  const KEY = "scoreboard_language_v11";
  let lang = localStorage.getItem(KEY) === "bm" ? "bm" : "en";

  const BM = {
    "START PRACTICE":"MULA LATIHAN","PRACTICE HISTORY":"SEJARAH LATIHAN","ARCHER PROFILE":"PROFIL PEMANAH","SETTINGS":"TETAPAN","APPLICATION INFO":"INFO APLIKASI",
    "Back":"Kembali","‹ Back":"‹ Kembali","Save":"Simpan","Cancel":"Batal","Close":"Tutup","Delete":"Padam","Edit":"Edit","Done":"Selesai","Next":"Seterusnya","Previous":"Sebelumnya","Continue":"Teruskan","Confirm":"Sahkan","Reset":"Tetapkan Semula","Clear":"Kosongkan","Print":"Cetak","Share":"Kongsi","View":"Lihat","Select":"Pilih","Selected":"Dipilih","Add":"Tambah","Remove":"Buang","Search":"Cari",
    "PRACTICE SETUP":"TETAPAN LATIHAN","Practice Setup":"Tetapan Latihan","Practice Format":"Format Latihan","Static":"Statik","Personal":"Individu","Team":"Pasukan","Group":"Kumpulan","Distance":"Jarak","Target":"Sasaran","Target Face":"Muka Sasaran","Rounds":"Round","Round":"Round","Ends":"End","End":"End","Arrows":"Arrow","Arrow":"Arrow","Timer":"Timer","Lane":"Lorong","Lanes":"Lorong","Scoring":"Pemarkahan","Score":"Markah","Scores":"Markah","Total":"Jumlah","Average":"Purata","Rank":"Kedudukan","Ranking":"Kedudukan","Result":"Keputusan","Results":"Keputusan","Summary":"Ringkasan","Detailed Result":"Keputusan Terperinci","DETAILED RESULT":"KEPUTUSAN TERPERINCI",
    "Archer":"Pemanah","Archers":"Pemanah","Archer Name":"Nama Pemanah","Name":"Nama","Date":"Tarikh","Time":"Masa","Location":"Lokasi","Auto-Detect GPS Location":"Kesan Lokasi GPS Secara Automatik","GPS Location":"Lokasi GPS","Current Location":"Lokasi Semasa",
    "Quick Preset":"Preset Pantas","Preset":"Preset","Presets":"Preset","Save Preset":"Simpan Preset","Load Preset":"Muat Preset","Custom":"Tersuai","Single Distance":"Jarak Tunggal","Multiple Distance":"Pelbagai Jarak","Multiple Distances":"Pelbagai Jarak",
    "START":"MULA","START SCORING":"MULA PEMARKAHAN","START PRACTICE":"MULA LATIHAN","FINISH":"TAMAT","FINISH PRACTICE":"TAMAT LATIHAN","END PRACTICE":"TAMAT LATIHAN","Resume":"Sambung","Resume Practice":"Sambung Latihan","New Practice":"Latihan Baru",
    "HISTORY":"SEJARAH","History":"Sejarah","All":"Semua","Today":"Hari Ini","Weekly":"Mingguan","Monthly":"Bulanan","Yearly":"Tahunan","Profile":"Profil","Performance":"Prestasi","Statistics":"Statistik","Best":"Terbaik","Highest":"Tertinggi","Lowest":"Terendah","Completed":"Selesai","Incomplete":"Belum Selesai",
    "Timer Settings":"Tetapan Timer","Preparation":"Persediaan","Shooting Time":"Masa Memanah","Warning":"Amaran","Whistle":"Wisel","Vibration":"Getaran","Volume":"Kelantangan","Font Size":"Saiz Font","Normal":"Normal","Large":"Besar",
    "Matrix":"Matriks","Score Matrix":"Matriks Markah","Matrix Manager":"Pengurus Matriks","Archer Manager":"Pengurus Pemanah","Manage Archers":"Urus Pemanah","Manage":"Urus",
    "Yes":"Ya","No":"Tidak","ON":"HIDUP","OFF":"MATI","On":"Hidup","Off":"Mati","Enabled":"Diaktifkan","Disabled":"Dinyahaktifkan",
    "Developed by Abu Danial":"Dibangunkan oleh Abu Danial",
    "This application is provided free of charge. Unauthorized sale, redistribution, or modification is prohibited without permission from the owner.":"Aplikasi ini disediakan secara percuma. Penjualan, pengedaran semula atau pengubahsuaian tanpa kebenaran pemilik adalah dilarang.",
    "May Allah forgive the developer, the users, their parents, families, and all Muslims.":"Semoga Allah mengampuni pembangun, para pengguna, ibu bapa dan keluarga mereka, serta seluruh umat Islam."
  };

  const EN = Object.fromEntries(Object.entries(BM).map(([e,b]) => [b,e]));
  const protectedText = new Set(["SCOREBOARD","Practice • Improve • Consistent","X","M","ENG","BM"]);

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

  function translateTree(root=document.body) {
    if (!root) return;
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
    const home=document.querySelector(".home");
    const menu=document.querySelector(".home-menu");
    if (!home || !menu) return;
    let box=home.querySelector(".lang-switch-v11");
    if (!box) {
      box=document.createElement("div");
      box.className="lang-switch-v11";
      box.innerHTML='<button type="button" data-lang="en">ENG</button><span>│</span><button type="button" data-lang="bm">BM</button>';
      menu.insertAdjacentElement("afterend",box);
      box.addEventListener("click",e=>{
        const b=e.target.closest("button[data-lang]"); if(!b) return;
        setLanguage(b.dataset.lang);
      });
    }
    box.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.lang===lang));
  }

  function setLanguage(next) {
    lang = next === "bm" ? "bm" : "en";
    localStorage.setItem(KEY,lang);
    // First normalize visible translated labels to English, then apply requested language.
    const old=lang; lang="en"; translateTree(); lang=old; translateTree();
    ensureSwitch();
  }

  const style=document.createElement("style");
  style.textContent=`
    .home{padding-top:max(8px,env(safe-area-inset-top))!important}
    .home .club-logo{margin-top:0!important}
    .home .home-menu{margin-top:12px!important}
    .lang-switch-v11{display:flex;align-items:center;justify-content:center;gap:10px;margin:10px auto 2px;font-size:13px;font-weight:800;letter-spacing:.5px}
    .lang-switch-v11 button{border:0;background:transparent;color:inherit;opacity:.48;padding:5px 7px;font:inherit;cursor:pointer}
    .lang-switch-v11 button.active{opacity:1;text-decoration:underline;text-underline-offset:4px}
    .lang-switch-v11 span{opacity:.35}
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
