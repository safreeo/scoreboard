/* SCOREBOARD R75 — native-dialog cleanup */

function scoreboardDialog({ title = "SCOREBOARD", message = "", confirmText = "OK", cancelText = "", danger = false } = {}) {
  return new Promise(resolve => {
    document.getElementById("scoreboardSystemDialog")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "scoreboardSystemDialog";
    overlay.className = "modal-overlay";
    overlay.style.zIndex = "99999";
    const safe = value => typeof esc === "function" ? esc(value) : String(value ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
    overlay.innerHTML = `<div class="modal-card" style="max-width:430px;width:calc(100% - 36px);text-align:left">
      <div style="font-size:1.18rem;font-weight:900;margin-bottom:12px">${safe(title)}</div>
      <div style="line-height:1.55;margin-bottom:20px">${safe(message).replace(/\n/g,"<br>")}</div>
      <div style="display:flex;justify-content:flex-end;gap:10px">
        ${cancelText ? `<button type="button" data-dialog-cancel class="btn soft">${safe(cancelText)}</button>` : ""}
        <button type="button" data-dialog-ok class="btn ${danger ? "danger" : "blue"}">${safe(confirmText)}</button>
      </div></div>`;
    const done = value => { overlay.remove(); resolve(value); };
    overlay.querySelector("[data-dialog-ok]")?.addEventListener("click", () => done(true));
    overlay.querySelector("[data-dialog-cancel]")?.addEventListener("click", () => done(false));
    overlay.addEventListener("click", e => { if (e.target === overlay && cancelText) done(false); });
    document.body.appendChild(overlay);
  });
}

function scoreboardAlert(message, title = "SCOREBOARD") {
  return scoreboardDialog({ title, message, confirmText: "OK" });
}

function scoreboardConfirm(message, title = "Please Confirm", confirmText = "OK", danger = false) {
  const destructive = /delete|discard|reset|replace|finish/i.test(String(message));
  const label = /delete/i.test(String(message)) ? "DELETE" : /reset/i.test(String(message)) ? "RESET" : confirmText;
  return scoreboardDialog({ title, message, confirmText: label, cancelText: "CANCEL", danger: danger || destructive });
}

/* Convert every SCOREBOARD global function that still contains native alert()/confirm(). */
(function patchNativeDialogs() {
  const skip = new Set(["alert", "confirm", "scoreboardAlert", "scoreboardConfirm", "scoreboardDialog"]);
  for (const name of Object.getOwnPropertyNames(window)) {
    if (skip.has(name)) continue;
    let fn;
    try { fn = window[name]; } catch { continue; }
    if (typeof fn !== "function") continue;
    let src;
    try { src = Function.prototype.toString.call(fn); } catch { continue; }
    if (!/\b(?:alert|confirm)\s*\(/.test(src)) continue;
    if (!/^function\s+[A-Za-z_$][\w$]*\s*\(/.test(src)) continue;
    const hasConfirm = /\bconfirm\s*\(/.test(src);
    src = src.replace(/\balert\s*\(/g, "scoreboardAlert(");
    if (hasConfirm) {
      src = src.replace(/^function\s+/, "async function ");
      src = src.replace(/\bconfirm\s*\(/g, "await scoreboardConfirm(");
      if (name === "restoreBackup") {
        src = src.replace(/reader\.onload\s*=\s*\(\)\s*=>\s*\{/g, "reader.onload = async () => {");
      }
    }
    try { window[name] = (0, eval)(`(${src})`); }
    catch (error) { console.warn("R75 dialog patch skipped:", name, error); }
  }
})();

/* GPS: save a readable location as soon as coordinates become available. */
const r75CaptureLocation = captureLocation;
captureLocation = function(session) {
  r75CaptureLocation(session);
  if (!S.gps || !navigator.geolocation || !session) return;
  const started = Date.now();
  const timer = setInterval(async () => {
    if (!session || session.location || Date.now() - started > 12000) { clearInterval(timer); return; }
    if (session.coords?.lat != null && session.coords?.lon != null) {
      clearInterval(timer);
      const place = await resolveLocationName(session.coords.lat, session.coords.lon);
      session.location = place || `${Number(session.coords.lat).toFixed(5)}, ${Number(session.coords.lon).toFixed(5)}`;
      saveUnfinished();
    }
  }, 300);
};

/* WhatsApp: if GPS coordinates exist, ensure Loc is present before sharing. */
const r75ShareSummary = shareSummary;
shareSummary = async function(index = viewHistoryIndex) {
  const result = S.history[index];
  if (result && S.gps && !result.location && result.coords?.lat != null && result.coords?.lon != null) {
    const place = await resolveLocationName(result.coords.lat, result.coords.lon);
    result.location = place || `${Number(result.coords.lat).toFixed(5)}, ${Number(result.coords.lon).toFixed(5)}`;
    save();
  }
  return r75ShareSummary(index);
};

/* Archer Profile Info: ENG left, BM right, ENG default. */
const r75ProfileInfo = showScoreTrendInfo;
showScoreTrendInfo = function() {
  r75ProfileInfo();
  const modal = document.getElementById("scoreTrendInfoDialog");
  if (!modal) return;
  const row = modal.querySelector(".score-info-lang-row");
  const eng = row?.querySelector('[data-lang="eng"]');
  const bm = row?.querySelector('[data-lang="bm"]');
  if (row && eng && bm) { row.appendChild(eng); row.appendChild(bm); }
  setScoreTrendInfoLang("eng");
};
