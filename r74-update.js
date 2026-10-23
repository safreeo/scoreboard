/* SCOREBOARD R74 */

const previousShareSummary = shareSummary;
shareSummary = async function(index = viewHistoryIndex) {
  const result = S.history[index];
  if (result && S.gps && !result.location && result.coords && result.coords.lat != null && result.coords.lon != null) {
    const place = await resolveLocationName(result.coords.lat, result.coords.lon);
    result.location = place || (Number(result.coords.lat).toFixed(5) + ", " + Number(result.coords.lon).toFixed(5));
    save();
  }
  return previousShareSummary(index);
};

const previousProfileInfo = showScoreTrendInfo;
showScoreTrendInfo = function() {
  previousProfileInfo();
  const modal = document.getElementById("scoreTrendInfoDialog");
  if (!modal) return;
  const row = modal.querySelector(".score-info-lang-row");
  const eng = row && row.querySelector('[data-lang="eng"]');
  const bm = row && row.querySelector('[data-lang="bm"]');
  if (row && eng && bm) {
    row.appendChild(eng);
    row.appendChild(bm);
  }
  setScoreTrendInfoLang("eng");
};
