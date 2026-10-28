/* SCOREBOARD v1.1 - BM translation patch
   Completes dynamic labels/dialogs found during mobile UI review. */
(() => {
  const KEY = "scoreboard_language_v11";
  const BM = {
    "ADD NOTE":"TAMBAH NOTA",
    "No. of Distances":"Bilangan Jarak",
    "NO. OF DISTANCES":"BILANGAN JARAK",
    "Bil. Jarak":"Bilangan Jarak",
    "BIL. JARAK":"BILANGAN JARAK",
    "SEND VIA WHATSAPP":"HANTAR MELALUI WHATSAPP",
    "Please Confirm":"Sila Sahkan",
    "Finish this practice session?":"Tamatkan sesi latihan ini?",
    "OK":"SAHKAN",
    "Delete this preset?":"Padam preset ini?",
    "DELETE":"PADAM",
    "ADD / EDIT MATRIX":"TAMBAH / EDIT MATRIKS",
    "Matrix name":"Nama matriks",
    "SAVE MATRIX":"SIMPAN MATRIKS",
    "CUSTOM MATRICES":"MATRIKS TERSUAI",
    "ARCHER LIST":"SENARAI PEMANAH",
    "DONE":"SELESAI",
    "Deleting an Archer List name does not delete Practice History.":"Memadam nama dalam Senarai Pemanah tidak akan memadam Sejarah Latihan.",
    "Mon":"Isn","Tue":"Sel","Wed":"Rab","Thu":"Kha","Fri":"Jum","Sat":"Sab","Sun":"Aha"
  };
  const EN = Object.fromEntries(Object.entries(BM).map(([en,bm]) => [bm,en]));
  const phrasePairs = Object.entries(BM).sort((a,b) => b[0].length - a[0].length);
  const reversePairs = Object.entries(EN).sort((a,b) => b[0].length - a[0].length);

  function language(){ return localStorage.getItem(KEY) === "bm" ? "bm" : "en"; }
  function translate(raw){
    if(!raw) return raw;
    const lang = language();
    const direct = lang === "bm" ? BM : EN;
    if(direct[raw]) return direct[raw];
    const lead = raw.match(/^\s*/)?.[0] || "";
    const trail = raw.match(/\s*$/)?.[0] || "";
    let text = raw.trim();
    if(direct[text]) return lead + direct[text] + trail;
    const pairs = lang === "bm" ? phrasePairs : reversePairs;
    for(const [from,to] of pairs){
      if(text.includes(from)) text = text.split(from).join(to);
    }
    return lead + text + trail;
  }
  function apply(root=document.body){
    if(!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes=[]; let n;
    while((n=walker.nextNode())) nodes.push(n);
    nodes.forEach(node => {
      if(node.parentElement?.closest("script,style,.lang-switch-v11")) return;
      const value=translate(node.nodeValue);
      if(value!==node.nodeValue) node.nodeValue=value;
    });
    root.querySelectorAll?.("[placeholder],[title],[aria-label]").forEach(el => {
      ["placeholder","title","aria-label"].forEach(attr => {
        if(!el.hasAttribute(attr)) return;
        const old=el.getAttribute(attr), value=translate(old);
        if(value!==old) el.setAttribute(attr,value);
      });
    });
  }
  let queued=false;
  function refresh(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(() => { queued=false; apply(); });
  }
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  document.addEventListener("click", () => setTimeout(refresh,0), true);
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",refresh); else refresh();
})();
