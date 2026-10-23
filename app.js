/* =========================================================
   SCOREBOARD
   app.js
   Compiled Test Build - Round Flow Update
   ========================================================= */

const A = document.getElementById("app");

const LS = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const put = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

const DEFAULT_SETUP = {
  mode: "personal",
  distance: 30,
  target: 80,
  rounds: 1,
  ends: 6,
  arrows: 6,
  matrix: "10-1, X",
  timer: false,
  lane: false,
  group: false,
  practiceType: "target",
  checkPoints: 20,
  gameMinDistance: 5,
  gameMaxDistance: 30,
  distanceMode: "single",
  multi: {
    count: 3,
    distances: [30, 40, 50],
    endsPerDistance: 5,
    timeEnd: 120,
    orders: ["asc", "desc"]
  }
};

const MATRIX_DEFAULTS = {
  "10-1, X": [
    "X", "10", "9", "8", "7", "6",
    "5", "4", "3", "2", "1", "M"
  ],
  "10-1": [
    "10", "9", "8", "7", "6",
    "5", "4", "3", "2", "1", "M"
  ],
  "5-1": ["5", "4", "3", "2", "1", "M"]
};

const S = {
  archers: LS("as_archers", []),

  history: LS("as_history", []),

  presets: LS("as_presets", [
    {
      name: "30M 10 Rings",
      ...DEFAULT_SETUP
    }
  ]),

  customMatrices: LS("as_matrices", {}),

  setup: {
    ...DEFAULT_SETUP
  },

  active: [],

  lanes: {},

  groups: {},

  session: null,

  gps: LS("as_gps", true),

  font: LS("as_font", "normal"),

  timer: LS("as_timer", {
    prep: 10,
    shoot: 120,
    warn: 10,
    whistle: true,
    vibration: true,
    volume: 100
  })
};


/* R25: GPS defaults ON. Existing installs are migrated once;
   after this, the user's own ON/OFF choice is preserved. */
if (!LS("as_gps_default_r25_applied", false)) {
  S.gps = true;
  put("as_gps", true);
  put("as_gps_default_r25_applied", true);
}


/* =========================================================
   RUNTIME STATE
   ========================================================= */

let currentView = "home";

let preserveNextScrollY = null;

let navReady = false;

let navRestoring = false;

let editingPreset = null;

let savePresetOpen = false;

let viewHistoryIndex = 0;
let detailedResultOrigin = "history";

let historyFilters = null;

let editMode = false;

let editEnd = null;

let editDirty = false;

let selectedScoreCell = null;

/* Scoring view stability state */
let lastScoringArcherIndex = null;
let lastScoringEnd = null;

let timerInt = null;

let timerPaused = false;

let profileArcher = "";

let profilePeriod = "weekly";

let profileMatrix = "10-1, X";

let audioCtx = null;
let historySelected = new Set();
let timerDraft = null;
let timerDirty = false;


/* =========================================================
   HELPERS
   ========================================================= */

const matrices = () => ({
  ...MATRIX_DEFAULTS,
  ...S.customMatrices
});


const esc = s =>
  String(s ?? "").replace(
    /[&<>"']/g,
    m =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[m]
  );


const escAttr = s =>
  String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");


function save() {

  put(
    "as_archers",
    S.archers
  );

  put(
    "as_history",
    S.history
  );

  put(
    "as_presets",
    S.presets
  );

  put(
    "as_matrices",
    S.customMatrices
  );

  put(
    "as_gps",
    S.gps
  );

  put(
    "as_font",
    S.font
  );

  put(
    "as_timer",
    S.timer
  );
}


function saveUnfinished() {

  if (!S.session) {
    return;
  }

  if (S.session.savedToHistory || allSessionComplete()) {
    clearUnfinished();
    return;
  }

  S.session.lastSaved =
    new Date().toISOString();

  put(
    "as_unfinished_session",
    {
      setup: S.setup,
      session: S.session
    }
  );
}


function clearUnfinished() {

  localStorage.removeItem(
    "as_unfinished_session"
  );
}


function getUnfinished() {

  return LS(
    "as_unfinished_session",
    null
  );
}


function defaultArcher() {

  return (
    localStorage.getItem(
      "as_default_archer"
    ) ||
    S.archers[0] ||
    ""
  );
}


function registerArcher(name) {

  name =
    (name || "").trim();

  if (!name) {
    return;
  }

  if (
    !localStorage.getItem(
      "as_default_archer"
    )
  ) {

    localStorage.setItem(
      "as_default_archer",
      name
    );
  }

  if (
    !S.archers.some(
      x =>
        x.toLowerCase() ===
        name.toLowerCase()
    )
  ) {

    S.archers.push(name);
  }

  save();
}


function matrixValues(matrix) {
  const values = matrices()[matrix] || [];
  return values.map(String).filter(v => v !== "M" && v !== "");
}

function topMatrixLabels(matrix) {
  const values = matrixValues(matrix);
  return [values[0] || "-", values[1] || values[0] || "-"];
}

function maxPointForMatrix(matrix) {
  const values = matrixValues(matrix);
  return Math.max(1, ...values.map(v => v === "X" ? 10 : (Number(v) || 0)));
}


function scoreValue(v) {

  if (v === "X") {
    return 10;
  }

  if (
    v === "M" ||
    v === "" ||
    v == null
  ) {
    return 0;
  }

  return Number(v) || 0;
}


function scoreClass(v) {

  if (
    ["X", "10", "9"].includes(v)
  ) {
    return "score-yellow";
  }

  if (
    ["8", "7"].includes(v)
  ) {
    return "score-red";
  }

  if (
    ["6", "5"].includes(v)
  ) {
    return "score-blue";
  }

  if (
    ["4", "3"].includes(v)
  ) {
    return "score-black";
  }

  if (
    ["2", "1"].includes(v)
  ) {
    return "score-white";
  }

  if (v === "M") {
    return "score-miss";
  }

  return "";
}


function pad2(n) {

  return String(n)
    .padStart(2, "0");
}


function shortDateTime(value) {

  const d =
    new Date(value);

  const date =
    `${pad2(d.getDate())}/` +
    `${pad2(
      d.getMonth() + 1
    )}/` +
    `${d.getFullYear()}`;

  const day =
    d.toLocaleDateString(
      "en-US",
      {
        weekday: "short"
      }
    );

  const time =
    `${pad2(
      d.getHours()
    )}:` +
    `${pad2(
      d.getMinutes()
    )}`;

  return {
    date,
    day,
    time
  };
}


/* =========================================================
   PAGE / NAVIGATION
   ========================================================= */

function page(
  html,
  view = "generic"
) {

  A.innerHTML =
    `<main class="page font-${S.font}">` +
    html +
    `</main>`;

  const restoreY = preserveNextScrollY;
  preserveNextScrollY = null;
  requestAnimationFrame(() => {
    window.scrollTo(0, restoreY === null ? 0 : restoreY);
  });

  if (navRestoring) {

    currentView = view;

    return;
  }

  if (!navReady) {

    history.replaceState(
      {
        view
      },
      "",
      location.href
    );

    navReady = true;

    currentView = view;

    return;
  }

  if (
    view !== currentView
  ) {

    history.pushState(
      {
        view
      },
      "",
      location.href
    );

    currentView = view;
  }
}


function renderView(view) {

  navRestoring = true;

  try {

    const map = {
      home,
      setup,
      scoring,
      summary,
      history: historyPage,
      detail: () => detailedResult(viewHistoryIndex, detailedResultOrigin),
      profiles,
      settings,
      info,
      timer: timerPage,
      matrixManager,
      archerManager
    };

    (
      map[view] ||
      home
    )();

  } finally {

    navRestoring = false;
  }
}


const head = title => {

  const headerClass = {
    "PRACTICE HISTORY": "page-head-green",
    "ARCHER PROFILE": "page-head-orange",
    "SETTINGS": "page-head-purple",
    "APPLICATION INFO": "page-head-magenta"
  }[title] || "page-head-blue";


  return `
  <div class="top page-main-header ${headerClass}">

    <h1>
      ${title}
    </h1>

    <button
      class="btn page-header-back"
      onclick="appBack()"
    >
      ‹ Back
    </button>

  </div>
  `;
};


/* =========================================================
   NAVIGATION / BACK
   ========================================================= */

window.addEventListener(
  "popstate",
  e => {

    if (
      currentView ===
        "scoring" &&
      S.session
    ) {

      history.pushState(
        {
          view: "scoring"
        },
        "",
        location.href
      );

      showExitDialog();

      return;
    }

    renderView(
      e.state?.view ||
      "home"
    );
  }
);


function appBack(
  fallback = home
) {

  if (
    currentView ===
      "scoring" &&
    S.session
  ) {

    showExitDialog();

    return;
  }

  if (
    history.state &&
    currentView !==
      "home"
  ) {

    history.back();

  } else {

    fallback();
  }
}


/* =========================================================
   HOME
   ========================================================= */

function home() {

  page(
    `
    <div class="home">

      <img
        class="club-logo"
        src="assets/scoreboard-logo.png"
        alt="SCOREBOARD"
      >

      <div class="app-title">
        SCOREBOARD
      </div>

      <div class="tagline">
        Practice • Improve • Consistent
      </div>

      <div class="menu home-menu">

        <button
          class="homebtn hb-blue"
          onclick="startPracticeSetup()"
        >

          <span class="home-icon">
            🎯
          </span>

          <b>
            START PRACTICE
          </b>

          <span class="home-arrow">
            ›
          </span>

        </button>


        <button
          class="homebtn hb-green"
          onclick="historyPage(true)"
        >

          <span class="home-icon">
            📊
          </span>

          <b>
            PRACTICE HISTORY
          </b>

          <span class="home-arrow">
            ›
          </span>

        </button>


        <button
          class="homebtn hb-orange"
          onclick="profiles()"
        >

          <span class="home-icon">
            👤
          </span>

          <b>
            ARCHER PROFILE
          </b>

          <span class="home-arrow">
            ›
          </span>

        </button>


        <button
          class="homebtn hb-purple"
          onclick="settings()"
        >

          <span class="home-icon">
            ⚙️
          </span>

          <b>
            SETTINGS
          </b>

          <span class="home-arrow">
            ›
          </span>

        </button>


        <button
          class="homebtn hb-magenta"
          onclick="info()"
        >

          <span class="home-icon">
            ℹ️
          </span>

          <b>
            APPLICATION INFO
          </b>

          <span class="home-arrow">
            ›
          </span>

        </button>

      </div>


      <div class="footer home-footer">
        Developed by Abu Danial
      </div>

    </div>
    `,
    "home"
  );
}


function rerenderKeepScroll(renderFn) {
  preserveNextScrollY = window.scrollY;
  renderFn();
}


/* =========================================================
   PRACTICE SETUP
   ========================================================= */
function startPracticeSetup() {
  S.setup = JSON.parse(JSON.stringify(DEFAULT_SETUP));
  S.active = [];
  S.lanes = {};
  S.groups = {};
  editingPreset = null;
  savePresetOpen = false;
  setup();
}

function resetFormatOptions() {
  S.setup.mode = "personal";
  S.setup.timer = false;
  S.setup.lane = false;
  S.setup.group = false;
  S.active = [];
  S.lanes = {};
  S.groups = {};
}


function ensureMultiSetup() {
  if (!S.setup.multi || typeof S.setup.multi !== "object") S.setup.multi = {};
  const m = S.setup.multi;
  m.count = Math.max(2, Math.min(8, Number(m.count) || 3));
  m.distances = Array.isArray(m.distances) ? m.distances.slice(0, m.count) : [];
  while (m.distances.length < m.count) m.distances.push((m.distances.length + 1) * 10 + 20);
  m.endsByDistance = Array.isArray(m.endsByDistance) ? m.endsByDistance.slice(0, m.count) : [];
  const fallbackEnds = Math.max(1, Number(m.endsPerDistance) || 5);
  while (m.endsByDistance.length < m.count) m.endsByDistance.push(fallbackEnds);
  m.endsByDistance = m.endsByDistance.map(v => Math.max(1, Number(v) || fallbackEnds));
  m.endsPerDistance = m.endsByDistance[0] || fallbackEnds; // legacy compatibility
  m.timeEnd = Math.max(1, Number(m.timeEnd) || Number(S.timer?.shoot) || 120);
  m.orders = Array.isArray(m.orders) ? m.orders.slice() : [];
  while (m.orders.length < Math.max(1, Number(S.setup.rounds) || 1)) m.orders.push(m.orders.length % 2 === 0 ? "asc" : "desc");
  S.setup.distanceMode = S.setup.distanceMode === "multiple" ? "multiple" : "single";
  return m;
}

function multiTotalEnds() {
  const m = ensureMultiSetup();
  return m.endsByDistance.reduce((sum, v) => sum + Math.max(1, Number(v) || 1), 0);
}

function multiSequence(roundNo) {
  const m = ensureMultiSetup();
  const base = m.distances.map((distance, originalIndex) => ({ distance: Number(distance), originalIndex }));
  const order = m.orders[Math.max(0, roundNo - 1)] || "asc";
  return order === "desc" ? [...base].reverse() : base;
}

function multiBlocks(roundNo = currentRoundNo()) {
  const m = ensureMultiSetup();
  let cursor = 1;
  return multiSequence(roundNo).map(item => {
    const ends = Math.max(1, Number(m.endsByDistance[item.originalIndex]) || 1);
    const block = { ...item, ends, start: cursor, end: cursor + ends - 1 };
    cursor += ends;
    return block;
  });
}

function currentDistanceBlock(roundNo = currentRoundNo(), endNo = currentEndNo()) {
  const blocks = multiBlocks(roundNo);
  return blocks.find(b => endNo >= b.start && endNo <= b.end) || blocks[0] || null;
}

function currentPracticeDistance(roundNo = currentRoundNo(), endNo = currentEndNo()) {
  if (S.setup.distanceMode !== "multiple") return Number(S.setup.distance) || 0;
  return currentDistanceBlock(roundNo, endNo)?.distance || Number(S.setup.distance) || 0;
}

function setDistanceMode(mode) {
  syncSetup();
  preserveNextScrollY = window.scrollY;
  const next = mode === "multiple" ? "multiple" : "single";
  if (S.setup.distanceMode !== next) resetFormatOptions();
  S.setup.distanceMode = next;
  if (S.setup.distanceMode === "multiple") S.setup.ends = multiTotalEnds();
  setup();
}

function setMultiCount(value) {
  syncSetup();
  preserveNextScrollY = window.scrollY;
  const m = ensureMultiSetup();
  m.count = Math.max(2, Math.min(8, Number(value) || 2));
  m.distances = m.distances.slice(0, m.count);
  m.endsByDistance = m.endsByDistance.slice(0, m.count);
  while (m.distances.length < m.count) m.distances.push((m.distances.length + 1) * 10 + 20);
  while (m.endsByDistance.length < m.count) m.endsByDistance.push(m.endsByDistance[0] || 5);
  S.setup.ends = multiTotalEnds();
  setup();
}

function setRoundOrder(index, value) {
  syncSetup();
  const m = ensureMultiSetup();
  m.orders[index] = value === "desc" ? "desc" : "asc";
  refreshSetupAt(`roundOrder${index}`);
}

function setPracticeType(type) {
  syncSetup();
  preserveNextScrollY = window.scrollY;
  const next = ["3d","2d"].includes(type) ? type : "target";
  if ((S.setup.practiceType || "target") !== next) resetFormatOptions();
  S.setup.practiceType = next;
  if (next !== "target") {
    S.setup.distanceMode = "single";
    S.setup.checkPoints = Math.max(1, Number(S.setup.checkPoints) || 20);
    S.setup.ends = S.setup.checkPoints;
    S.setup.gameMinDistance = Math.max(1, Number(S.setup.gameMinDistance) || 5);
    S.setup.gameMaxDistance = Math.max(S.setup.gameMinDistance, Number(S.setup.gameMaxDistance) || 30);
  }
  setup();
}

function practiceTypeSelectorHTML() {
  const t = S.setup.practiceType || "target";
  return `<div class="practice-type-row mini-format-switch">
    <button class="practice-type-btn ${t === "target" ? "active" : ""}" onclick="setPracticeType('target')">Normal</button>
    <button class="practice-type-btn ${t === "3d" ? "active" : ""}" onclick="setPracticeType('3d')">3D</button>
    <button class="practice-type-btn ${t === "2d" ? "active" : ""}" onclick="setPracticeType('2d')">2D</button>
  </div>`;
}

function formatFieldsHTML() {
  S.setup.practiceType = S.setup.practiceType || "target";
  if (S.setup.practiceType !== "target") {
    const game = S.setup.practiceType.toUpperCase();
    return `<div class="game-format-panel">
        <div class="game-title">${game} GAME</div>
        <div class="setup-format-grid game-format-grid">
          ${numField("Check Points (CP)", "checkPoints", S.setup.checkPoints || 20)}
          ${numField("Arrows / CP", "arrows", S.setup.arrows)}
          ${numField("Rounds", "rounds", S.setup.rounds)}
        </div>
        <div class="game-distance-title">Distance</div>
        <div class="game-distance-grid">
          ${numField("Min (m)", "gameMinDistance", S.setup.gameMinDistance || 5)}
          ${numField("Max (m)", "gameMaxDistance", S.setup.gameMaxDistance || 30)}
        </div>
      </div>`;
  }
  if (S.setup.distanceMode !== "multiple") {
    return `<div class="distance-mode-row">
        <button class="distance-mode-btn active" onclick="setDistanceMode('single')">SINGLE DISTANCE</button>
        <button class="distance-mode-btn" onclick="setDistanceMode('multiple')">MULTIPLE DISTANCES</button>
      </div>
      <div class="setup-format-grid">
        ${numField("Distance (m)", "distance", S.setup.distance)}
        ${numField("Target Face (cm)", "target", S.setup.target)}
        ${numField("Rounds", "rounds", S.setup.rounds)}
        ${numField("Ends / Round", "ends", S.setup.ends)}
        ${numField("Arrows / End", "arrows", S.setup.arrows)}
      </div>`;
  }

  const m = ensureMultiSetup();
  const distFields = m.distances.map((d, i) => `
    <div class="multi-distance-item">
      <div class="setup-field"><label>Distance ${i + 1} (m)</label><div class="input-unit">
        <input id="multiDistance${i}" type="number" min="1" value="${d}" onchange="syncSetup(); refreshSetupAt('multiDistance${i}')">
      </div></div>
      <div class="setup-field"><label>Ends</label><div class="input-unit">
        <input id="multiDistanceEnds${i}" type="number" min="1" value="${m.endsByDistance[i]}" onchange="syncSetup(); refreshSetupAt('multiDistanceEnds${i}')">
      </div></div>
    </div>`).join("");
  const rounds = Array.from({length: Math.max(1, Number(S.setup.rounds) || 1)}, (_, i) => {
    const order = m.orders[i] || (i % 2 === 0 ? "asc" : "desc");
    const seq = multiSequence(i + 1);
    return `<div class="multi-round-row">
      <div><b>ROUND ${i + 1}</b><small>${seq.map(x => `${x.distance}m (${m.endsByDistance[x.originalIndex]}E)`).join(" → ")}</small></div>
      <select id="roundOrder${i}" onchange="setRoundOrder(${i},this.value)">
        <option value="asc" ${order === "asc" ? "selected" : ""}>ASCENDING</option>
        <option value="desc" ${order === "desc" ? "selected" : ""}>DESCENDING</option>
      </select>
    </div>`;
  }).join("");
  const totalEnds = multiTotalEnds() * Math.max(1, Number(S.setup.rounds) || 1);
  const totalArrows = totalEnds * Math.max(1, Number(S.setup.arrows) || 1);

  return `<div class="distance-mode-row">
      <button class="distance-mode-btn" onclick="setDistanceMode('single')">SINGLE DISTANCE</button>
      <button class="distance-mode-btn active" onclick="setDistanceMode('multiple')">MULTIPLE DISTANCES</button>
    </div>
    <div class="multi-distance-panel">
      <div class="multi-top-grid multi-count-full">
        <div class="setup-field multi-count-field"><label>No. of Distances</label><div class="input-unit">
          <input id="multiCount" type="number" min="2" max="8" value="${m.count}" onchange="setMultiCount(this.value)">
        </div></div>
      </div>
      <div class="multi-distance-grid">${distFields}</div>
      <div class="multi-common-layout">
        <div class="multi-common-left">
          ${numField("Target Face (cm)", "target", S.setup.target)}
          ${numField("Arrows / End", "arrows", S.setup.arrows)}
        </div>
        <div class="multi-common-right">
          ${numField("Rounds", "rounds", S.setup.rounds)}
          ${numField("Time / End (sec)", "multiTime", m.timeEnd)}
        </div>
      </div>
      <div class="multi-round-title">ROUND SEQUENCE</div>
      <div class="multi-round-list">${rounds}</div>
      <div class="multi-preview">
        <b>FORMAT PREVIEW</b>
        ${Array.from({length: Math.max(1, Number(S.setup.rounds) || 1)}, (_,i) => `<div>R${i+1}: ${multiSequence(i+1).map(x => `${x.distance}m × ${m.endsByDistance[x.originalIndex]}E`).join(" → ")}</div>`).join("")}
        <small>${S.setup.arrows} Arrows/End • Total ${totalEnds} Ends • ${totalArrows} Arrows</small>
      </div>
    </div>`;
}

function syncSetup() {

  [
    "distance",
    "target",
    "rounds",
    "ends",
    "arrows",
    "gameMinDistance",
    "gameMaxDistance"
  ].forEach(k => {

    const el =
      document.getElementById(k);

    if (el) {

      S.setup[k] =
        Number(el.value) ||
        S.setup[k];
    }
  });


  const cpEl = document.getElementById("checkPoints");
  if (cpEl) {
    S.setup.checkPoints = Math.max(1, Number(cpEl.value) || 20);
    S.setup.ends = S.setup.checkPoints;
  }

  if (S.setup.distanceMode === "multiple" && S.setup.practiceType === "target") {
    const m = ensureMultiSetup();
    const countEl = document.getElementById("multiCount");
    if (countEl) m.count = Math.max(2, Number(countEl.value) || m.count);
    for (let i = 0; i < m.count; i++) {
      const el = document.getElementById(`multiDistance${i}`);
      const endsEl = document.getElementById(`multiDistanceEnds${i}`);
      if (el) m.distances[i] = Number(el.value) || m.distances[i];
      if (endsEl) m.endsByDistance[i] = Math.max(1, Number(endsEl.value) || m.endsByDistance[i]);
    }
    const timeEl = document.getElementById("multiTime");
    if (timeEl) m.timeEnd = Math.max(1, Number(timeEl.value) || m.timeEnd);
    S.setup.ends = multiTotalEnds();
    ensureMultiSetup();
  }

  const timer =
    document.getElementById(
      "timerOpt"
    );

  const lane =
    document.getElementById(
      "laneOpt"
    );

  const group =
    document.getElementById(
      "groupOpt"
    );


  if (timer) {

    S.setup.timer =
      timer.checked;
  }


  if (lane) {

    S.setup.lane =
      lane.checked;
  }

  if (group) {
    S.setup.group = group.checked;
  }


  document
    .querySelectorAll(
      "[data-lane]"
    )
    .forEach(el => {

      S.lanes[
        el.dataset.lane
      ] =
        el.value;
    });
}


function setup() {

  const unfinished =
    getUnfinished();


  page(
    `
    <div class="setup-page">

      <div class="setup-header page-main-header page-head-blue">

        <div>

          <h1>
            PRACTICE SETUP
          </h1>


        </div>


        <button
          class="btn page-header-back"
          onclick="home()"
        >
          ‹ Back
        </button>

      </div>


      ${
        unfinished
          ? unfinishedHTML(
              unfinished
            )
          : ""
      }


      <section class="setup-card">

        <div class="section">
          PRACTICE MODE
        </div>


        <div class="setup-mode">

          <button
            class="${
              S.setup.mode ===
              "personal"
                ? "active"
                : ""
            }"
            onclick="
              setMode('personal')
            "
          >
            PERSONAL
          </button>


          <button
            class="${
              S.setup.mode ===
              "team"
                ? "active"
                : ""
            }"
            onclick="
              setMode('team')
            "
          >
            TEAM
          </button>

        </div>


        <div id="archerArea">
        </div>

      </section>


      <section class="setup-card">

        <div class="section-row">

          <div class="section">
            QUICK PRESETS
          </div>

          <small>
            Tap preset to apply
          </small>

        </div>


        <div class="preset-list">

          ${
            S.presets
              .map(
                (p, i) => `
                <div class="preset-row">

                  <button
                    class="
                      preset-select
                      ${
                        presetMatch(p)
                          ? "selected"
                          : ""
                      }
                    "
                    onclick="
                      applyPreset(${i})
                    "
                  >

                    <b>
                      ${esc(p.name)}
                    </b>

                    <small>
                      ${p.distance}M •
                      ${p.target}CM •
                      ${p.arrows}A ×
                      ${p.ends}E ×
                      ${p.rounds}R
                    </small>

                  </button>


                  <button
                    class="preset-edit"
                    onclick="
                      editPreset(${i})
                    "
                  >
                    ✎
                  </button>


                  <button
                    class="preset-del"
                    onclick="
                      deletePreset(${i})
                    "
                  >
                    ×
                  </button>

                </div>
                `
              )
              .join("")
          }

        </div>


        ${
          editingPreset !==
          null
            ? presetEditor()
            : ""
        }

      </section>


      <section class="setup-card">

        <div class="section-row format-heading-row">
          <div class="section">FORMAT</div>
          ${practiceTypeSelectorHTML()}
        </div>

        ${formatFieldsHTML()}


        <div class="setup-options">

          <label>

            <input
              id="timerOpt"
              type="checkbox"
              ${
                S.setup.timer
                  ? "checked"
                  : ""
              }
            >

            Timer

          </label>


          <label>

            <input
              id="laneOpt"
              type="checkbox"
              ${
                S.setup.lane
                  ? "checked"
                  : ""
              }
              onchange="
                syncSetup();
                refreshSetupAt('laneOpt')
              "
            >

            Lane

          </label>

          <label>
            <input
              id="groupOpt"
              type="checkbox"
              ${S.setup.group ? "checked" : ""}
              onchange="syncSetup(); refreshSetupAt('groupOpt')"
            >
            Group
          </label>

        </div>


        ${laneHTML()}
        ${groupHTML()}

      </section>


      <section class="setup-card">

        <div class="section-row">

          <div class="section">
            SCORING MATRIX
          </div>


          <button
            class="linkbtn"
            onclick="
              syncSetup();
              matrixManager()
            "
          >
            Manage / + Add Matrix
          </button>

        </div>


        <div class="matrix-buttons">

          ${
            Object
              .keys(
                matrices()
              )
              .map(
                name => `
                <button
                  class="
                    matrix-btn
                    ${
                      S.setup.matrix ===
                      name
                        ? "active"
                        : ""
                    }
                  "
                  onclick="
                    syncSetup();
                    S.setup.matrix=
                    '${escAttr(name)}';
                    rerenderKeepScroll(setup)
                  "
                >
                  ${esc(name)}
                </button>
                `
              )
              .join("")
          }

        </div>


        <p class="help">
          M = Miss • X is recorded separately
          and scores 10 points.
        </p>

      </section>


      <section class="setup-card">

        <label class="save-toggle">

          <input
            type="checkbox"
            ${
              savePresetOpen
                ? "checked"
                : ""
            }
            onchange="
              savePresetOpen=this.checked;
              refreshSetupAt(
                'newPresetName',
                this.checked
              )
            "
          >


          <span>

            <b>
              Save as Quick Preset
            </b>

            <small>
              Save this setup for future practice.
            </small>

          </span>

        </label>


        ${
          savePresetOpen
            ? `
            <div class="save-preset">

              <input
                id="newPresetName"
                placeholder="Preset name"
              >


              <div class="row">

                <button
                  class="btn green"
                  onclick="
                    saveQuickPreset()
                  "
                >
                  SAVE PRESET
                </button>


                <button
                  class="btn soft"
                  onclick="
                    savePresetOpen=false;
                    setup()
                  "
                >
                  CANCEL
                </button>

              </div>

            </div>
            `
            : ""
        }

      </section>


      <div class="start-dock">

        <button
          class="setup-start"
          onclick="
            startSession()
          "
        >
          START SCORING SESSION ›
        </button>

      </div>

    </div>
    `,
    "setup"
  );


  renderArcherArea();
}


/* =========================================================
   UNFINISHED SESSION
   ========================================================= */

function unfinishedHTML(data) {

  const s =
    data.session;

  const setup =
    data.setup;


  if (
    !s?.archers?.length
  ) {

    return "";
  }


  const a =
    s.archers[
      s.idx || 0
    ];


  return `
    <section class="unfinished-card">

      <div class="unfinished-title">
        ⚠ UNFINISHED SESSION DETECTED
      </div>


      <b>
        ${setup.distance}M •
        TF ${setup.target}CM •
        ${
          String(
            setup.mode
          ).toUpperCase()
        }
      </b>


      <p>
        ${s.archers.length}
        Archer${
          s.archers.length > 1
            ? "s"
            : ""
        }
        • Round
        ${a?.r || 1}/${setup.rounds}
        • End
        ${a?.e || 1}/${setup.ends}
      </p>


      <small>
        Last saved:
        ${
          s.lastSaved
            ? new Date(
                s.lastSaved
              ).toLocaleString()
            : new Date(
                s.date
              ).toLocaleString()
        }
      </small>


      <div class="unfinished-actions">

        <button
          class="btn green"
          onclick="
            resumeUnfinished()
          "
        >
          RESUME
        </button>


        <button
          class="btn danger"
          onclick="
            discardUnfinished()
          "
        >
          DISCARD
        </button>

      </div>

    </section>
  `;
}


function resumeUnfinished() {

  const d =
    getUnfinished();


  if (!d) {
    return;
  }


  S.setup = {
    ...DEFAULT_SETUP,
    ...d.setup
  };


  S.session =
    d.session;


  normalizeSession();


  scoring();
}


function discardUnfinished() {

  if (
    !confirm(
      "Discard unfinished session?\n\n" +
      "All scores in this unfinished session " +
      "will be deleted."
    )
  ) {

    return;
  }


  clearUnfinished();


  setup();
}


/* =========================================================
   FORMAT FIELD
   ========================================================= */

function numField(
  label,
  id,
  value,
  unit = ""
) {

  return `
    <div class="setup-field">

      <label>
        ${label}
      </label>


      <div class="input-unit">

        <input
          id="${id}"
          type="number"
          min="1"
          value="${value}"
          onchange="
            syncSetup()
          "
        >


        ${
          unit
            ? `<span>${unit}</span>`
            : ""
        }

      </div>

    </div>
  `;
}


/* =========================================================
   ARCHER SETUP
   ========================================================= */

function renderArcherArea() {

  const e =
    document.getElementById(
      "archerArea"
    );


  if (!e) {
    return;
  }


  if (
    S.setup.mode ===
    "personal"
  ) {

    e.innerHTML = `

      <label class="field-label">
        Archer Name
      </label>


      <div class="archer-input">

        <input
          id="archerName"
          list="alist"
          value="${
            esc(
              defaultArcher()
            )
          }"
          placeholder="Archer name"
        >


        <button
          class="btn soft"
          onclick="
            localStorage.removeItem(
              'as_default_archer'
            );
            archerName.value=''
          "
        >
          Reset
        </button>

      </div>


      <datalist id="alist">

        ${
          S.archers
            .map(
              n =>
                `<option value="${esc(n)}">`
            )
            .join("")
        }

      </datalist>


      <small class="help">
        The first registered archer on this device
        becomes the default name.
      </small>
    `;

  } else {

    e.innerHTML = `

      <div class="section-row teamrow">

        <b>
          ACTIVE ARCHERS

          <span>
            ${S.active.length} ACTIVE
          </span>
        </b>


        <button
          class="btn soft mini"
          onclick="
            archerManager()
          "
        >
          MANAGE
        </button>

      </div>


      ${
        S.archers.length

          ? `
          <div class="chips">

            ${
              S.archers
                .map(
                  n => `
                  <button
                    class="
                      chip
                      ${
                        S.active.includes(n)
                          ? "active"
                          : ""
                      }
                    "
                    onclick="
                      toggleArcher(
                        '${escAttr(n)}'
                      )
                    "
                  >
                    ${esc(n)}
                  </button>
                  `
                )
                .join("")
            }

          </div>
          `

          : `
          <div class="notice dangertext">
            CREATE ARCHER LIST
          </div>
          `
      }


      <div class="add-row">

        <input
          id="newArcher"
          placeholder="New archer name"
        >


        <button
          class="btn soft"
          onclick="
            addArcher()
          "
        >
          + ADD
        </button>

      </div>
    `;
  }
}


function setMode(mode) {

  syncSetup();


  if (S.setup.mode !== mode) {
    S.setup.timer = false;
    S.setup.lane = false;
    S.setup.group = false;
    S.lanes = {};
    S.groups = {};
  }

  S.setup.mode = mode;


  if (
    mode ===
    "personal"
  ) {

    S.active = [];
  }


  setup();
}


function toggleArcher(name) {

  if (
    S.active.includes(name)
  ) {

    S.active =
      S.active.filter(
        x =>
          x !== name
      );

  } else {

    S.active.push(name);
  }


  setup();
}


function addArcher() {

  const el =
    document.getElementById(
      "newArcher"
    );


  const name =
    el?.value.trim();


  if (!name) {
    return;
  }


  registerArcher(name);


  if (
    !S.active.includes(name)
  ) {

    S.active.push(name);
  }


  setup();
}


function laneHTML() {

  if (
    !S.setup.lane
  ) {

    return "";
  }


  const names =
    S.setup.mode ===
      "team"

      ? S.active

      : [
          "__personal__"
        ];


  return `
    <div class="lane-box">

      <b>
        Lane No.
      </b>


      ${
        names.length

          ? names
              .map(
                n => `
                <div class="lane-row">

                  <span>
                    ${
                      n ===
                      "__personal__"

                        ? esc(
                            defaultArcher() ||
                            "Archer"
                          )

                        : esc(n)
                    }
                  </span>


                  <input
                    data-lane="${esc(n)}"
                    type="number"
                    min="1"
                    value="${
                      esc(
                        S.lanes[n] ||
                        ""
                      )
                    }"
                    oninput="
                      S.lanes[
                        this.dataset.lane
                      ]=
                      this.value
                    "
                  >

                </div>
                `
              )
              .join("")

          : `
          <small>
            Select active archers first.
          </small>
          `
      }

    </div>
  `;
}



function groupHTML() {

  if (!S.setup.group) return "";

  const names =
    S.setup.mode === "team"
      ? S.active
      : ["__personal__"];

  return `
    <div class="lane-box group-box">
      <b>Group No.</b>
      ${
        names.length
          ? names.map(n => `
              <div class="lane-row">
                <span>${n === "__personal__" ? esc(defaultArcher() || "Archer") : esc(n)}</span>
                <input
                  data-group="${esc(n)}"
                  type="number"
                  min="1"
                  value="${esc(S.groups[n] || "")}"
                  oninput="S.groups[this.dataset.group]=this.value"
                >
              </div>
            `).join("")
          : `<small>Select active archers first.</small>`
      }
    </div>
  `;
}


/* =========================================================
   PRESETS
   ========================================================= */

function presetMatch(p) {

  return [
    "distance",
    "target",
    "rounds",
    "ends",
    "arrows",
    "matrix",
    "timer",
    "lane"
  ].every(
    k =>
      String(
        p[k]
      ) ===
      String(
        S.setup[k]
      )
  );
}


function applyPreset(i) {

  syncSetup();


  Object.assign(
    S.setup,
    S.presets[i]
  );


  editingPreset =
    null;


  setup();
}


function editPreset(i) {

  syncSetup();


  editingPreset =
    i;


  Object.assign(
    S.setup,
    S.presets[i]
  );


  setup();
}


function presetEditor() {

  const p =
    S.presets[
      editingPreset
    ];


  return `
    <div class="preset-editor">

      <b>
        EDIT PRESET
      </b>


      <input
        id="editPresetName"
        value="${esc(p.name)}"
      >


      <label>
        Scoring Matrix
      </label>


      <select id="editPresetMatrix">

        ${
          Object
            .keys(
              matrices()
            )
            .map(
              n => `
              <option
                ${
                  n ===
                  S.setup.matrix
                    ? "selected"
                    : ""
                }
              >
                ${esc(n)}
              </option>
              `
            )
            .join("")
        }

      </select>


      <p class="help">
        Change Format, Timer, Lane or Matrix
        above, then Update.
      </p>


      <div class="row">

        <button
          class="btn primary"
          onclick="
            updatePreset()
          "
        >
          UPDATE PRESET
        </button>


        <button
          class="btn soft"
          onclick="
            editingPreset=null;
            setup()
          "
        >
          CANCEL
        </button>

      </div>

    </div>
  `;
}


function updatePreset() {

  syncSetup();


  S.setup.matrix =
    document.getElementById(
      "editPresetMatrix"
    ).value;


  const name =
    document.getElementById(
      "editPresetName"
    ).value.trim() ||
    "Practice Preset";


  S.presets[
    editingPreset
  ] = {

    ...S.setup,

    name
  };


  save();


  editingPreset =
    null;


  setup();
}


function deletePreset(i) {

  if (
    !confirm(
      "Delete this preset?"
    )
  ) {

    return;
  }


  S.presets.splice(
    i,
    1
  );


  save();


  setup();
}


function refreshSetupAt(id, focusField = false) {
  const y = window.scrollY;
  setup();
  requestAnimationFrame(() => {
    window.scrollTo(0, y);
    if (focusField) {
      const el = document.getElementById(id);
      if (el) {
        el.focus({ preventScroll: true });
        const len = el.value?.length || 0;
        try { el.setSelectionRange(len, len); } catch {}
      }
    }
  });
}


function saveQuickPreset() {

  syncSetup();


  const name =
    document.getElementById(
      "newPresetName"
    )?.value.trim();


  if (!name) {

    alert(
      "Enter preset name."
    );

    return;
  }


  S.presets.push({
    ...S.setup,
    name
  });


  save();


  savePresetOpen =
    false;


  setup();
}


/* =========================================================
   MATRIX MANAGER
   ========================================================= */

function matrixManager() {

  page(
    `
    ${head("SCORING MATRIX")}


    <section class="card">

      <div class="section">
        ADD / EDIT MATRIX
      </div>


      <input
        id="matrixName"
        placeholder="Matrix name"
      >


      <div class="matrix-point-grid">

        ${
          [
            "X",
            "10",
            "9",
            "8",
            "7",
            "6",
            "5",
            "4",
            "3",
            "2",
            "1",
            "M"
          ]
            .map(
              v => `
              <label class="matrix-point">

                <input
                  type="checkbox"
                  value="${v}"
                  ${
                    v === "M"
                      ? "checked disabled"
                      : ""
                  }
                >

                <span>
                  ${v}
                </span>

              </label>
              `
            )
            .join("")
        }

      </div>


      <div class="row">

        <button
          class="btn green"
          onclick="
            saveMatrix()
          "
        >
          SAVE MATRIX
        </button>


        <button
          class="btn soft"
          onclick="
            setup()
          "
        >
          CANCEL
        </button>

      </div>

    </section>


    <section class="card">

      <div class="section">
        CUSTOM MATRICES
      </div>


      ${
        Object
          .keys(
            S.customMatrices
          )
          .length

          ? Object
              .keys(
                S.customMatrices
              )
              .map(
                name => `
                <div class="matrix-list-row">

                  <button
                    class="matrix-list-select"
                    onclick="
                      S.setup.matrix=
                      '${escAttr(name)}';
                      rerenderKeepScroll(setup)
                    "
                  >

                    <b>
                      ${esc(name)}
                    </b>

                    <small>
                      ${
                        S.customMatrices[
                          name
                        ].join(", ")
                      }
                    </small>

                  </button>


                  <button
                    class="matrix-delete"
                    onclick="
                      deleteMatrix(
                        '${escAttr(name)}'
                      )
                    "
                  >
                    ×
                  </button>

                </div>
                `
              )
              .join("")

          : `
          <p class="help">
            No custom matrices yet.
          </p>
          `
      }

    </section>
    `,
    "matrixManager"
  );
}


function saveMatrix() {

  const name =
    document.getElementById(
      "matrixName"
    ).value.trim();


  let points = [
    ...document
      .querySelectorAll(
        ".matrix-point-grid input:checked"
      )
  ].map(
    x =>
      x.value
  );


  if (!name) {

    alert(
      "Enter matrix name."
    );

    return;
  }


  if (
    !points.includes(
      "M"
    )
  ) {

    points.push(
      "M"
    );
  }


  S.customMatrices[
    name
  ] =
    points;


  S.setup.matrix =
    name;


  save();


  setup();
}


function deleteMatrix(name) {

  if (
    !confirm(
      "Delete matrix?"
    )
  ) {

    return;
  }


  delete S.customMatrices[
    name
  ];


  if (
    S.setup.matrix ===
    name
  ) {

    S.setup.matrix =
      "10-1, X";
  }


  save();


  matrixManager();
}


/* =========================================================
   ARCHER MANAGER
   ========================================================= */

function archerManager() {

  page(
    `
    ${head("ARCHER LIST")}


    <section class="card">

      ${
        S.archers.length

          ? S.archers
              .map(
                n => `
                <label class="manage-archer-row">

                  <input
                    type="checkbox"
                    value="${esc(n)}"
                  >

                  <span>
                    ${esc(n)}
                  </span>

                </label>
                `
              )
              .join("")

          : `
          <p>
            No archers.
          </p>
          `
      }


      <div class="row">

        <button
          class="btn danger"
          onclick="
            deleteArchers()
          "
        >
          DELETE SELECTED
        </button>


        <button
          class="btn soft"
          onclick="
            setup()
          "
        >
          DONE
        </button>

      </div>


      <p class="help">
        Deleting an Archer List name does not
        delete Practice History.
      </p>

    </section>
    `,
    "archerManager"
  );
}


function deleteArchers() {

  const selected = [
    ...document
      .querySelectorAll(
        ".manage-archer-row input:checked"
      )
  ].map(
    x =>
      x.value
  );


  if (
    !selected.length
  ) {

    return;
  }


  if (
    !confirm(
      "Delete selected archer(s)?"
    )
  ) {

    return;
  }


  S.archers =
    S.archers.filter(
      n =>
        !selected.includes(n)
    );


  S.active =
    S.active.filter(
      n =>
        !selected.includes(n)
    );


  if (
    selected.includes(
      defaultArcher()
    )
  ) {

    localStorage.removeItem(
      "as_default_archer"
    );
  }


  save();


  archerManager();
}


/* =========================================================
   GPS
   ========================================================= */

function captureLocation(session) {

  session.location = "";


  if (
    !S.gps ||
    !navigator.geolocation
  ) {

    saveUnfinished();

    return;
  }


  navigator.geolocation
    .getCurrentPosition(

      async position => {

        const lat =
          position.coords.latitude;

        const lon =
          position.coords.longitude;


                  session.coords = {
          lat,
          lon
        };

        saveUnfinished();

      },

      () => {
        session.location = "";
        saveUnfinished();
      },

      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000
      }
    );
}


/* =========================================================
   SESSION CREATION
   ========================================================= */

function makeScoreArray() {

  return Array.from(
    {
      length: S.setup.rounds
    },
    () =>
      Array.from(
        {
          length: S.setup.ends
        },
        () =>
          Array(
            S.setup.arrows
          ).fill("")
      )
  );
}


function makeLockArray() {

  return Array.from(
    {
      length: S.setup.rounds
    },
    () =>
      Array(
        S.setup.ends
      ).fill(false)
  );
}


function startSession() {

  syncSetup();


  let names = [];


  if (
    S.setup.mode ===
    "personal"
  ) {

    const el =
      document.getElementById(
        "archerName"
      );

    const name =
      el?.value.trim();


    if (!name) {

      alert(
        "Enter archer name."
      );

      return;
    }


    registerArcher(name);


    names = [
      name
    ];


    if (
      S.setup.lane
    ) {

      S.lanes[name] =
        S.lanes[
          "__personal__"
        ] || "";
    }

  } else {

    names = [
      ...S.active
    ];


    if (
      !names.length
    ) {

      alert(
        "Select at least one active archer."
      );

      return;
    }
  }


  if (
    S.setup.rounds < 1 ||
    S.setup.ends < 1 ||
    S.setup.arrows < 1
  ) {

    alert(
      "Rounds, Ends and Arrows must be at least 1."
    );

    return;
  }


  if (S.setup.practiceType !== "target") {
    S.setup.checkPoints = Math.max(1, Number(S.setup.checkPoints) || 20);
    S.setup.ends = S.setup.checkPoints;
    S.setup.distanceMode = "single";
    S.setup.gameMinDistance = Math.max(1, Number(S.setup.gameMinDistance) || 5);
    S.setup.gameMaxDistance = Math.max(S.setup.gameMinDistance, Number(S.setup.gameMaxDistance) || 30);
  }

  if (S.setup.distanceMode === "multiple" && S.setup.practiceType === "target") {
    const m = ensureMultiSetup();
    S.setup.ends = multiTotalEnds();
    if (S.setup.timer && m.timeEnd) {
      S.timer.shoot = m.timeEnd;
      put("as_timer", S.timer);
    }
  }

  const now =
    new Date()
      .toISOString();


  S.session = {

    id:
      Date.now(),

    date:
      now,

    lastSaved:
      now,

    title:
      "Archery Detailed Results",

    idx:
      0,

    currentRound:
      1,

    currentEnd:
      1,

    roundReady:
      false,

    location:
      "",

    coords:
      null,

    setup: {
      ...S.setup
    },

    lanes: {
      ...S.lanes
    },

    groups: {
      ...S.groups
    },

    archers:
      names.map(
        name => ({

          name,

          r: 1,

          e: 1,

          scores:
            makeScoreArray(),

          locked:
            makeLockArray(),

          joinedAtRound:
            1,

          joinedAtEnd:
            1

        })
      )
  };


  editMode =
    false;

  editEnd =
    null;

  editDirty =
    false;

  selectedScoreCell =
    null;


  saveUnfinished();


  captureLocation(
    S.session

      );


  scoring();
}


/* =========================================================
   SESSION NORMALIZATION
   ========================================================= */

function normalizeSession() {

  if (
    !S.session
  ) {

    return;
  }


  if (
    !S.session.setup
  ) {

    S.session.setup = {
      ...S.setup
    };
  }


  S.setup = {
    ...DEFAULT_SETUP,
    ...S.session.setup,
    ...S.setup
  };


  if (
    !Array.isArray(
      S.session.archers
    )
  ) {

    S.session.archers = [];
  }


  if (
    typeof S.session.idx !==
    "number"
  ) {

    S.session.idx = 0;
  }


  if (
    !S.session.currentRound
  ) {

    S.session.currentRound =
      S.session.archers[
        S.session.idx
      ]?.r || 1;
  }


  if (
    !S.session.currentEnd
  ) {

    S.session.currentEnd =
      S.session.archers[
        S.session.idx
      ]?.e || 1;
  }


  if (
    typeof S.session.roundReady !==
    "boolean"
  ) {

    S.session.roundReady =
      false;
  }


  S.session.archers
    .forEach(a => {

      if (
        !Array.isArray(
          a.scores
        )
      ) {

        a.scores = [];
      }


      while (
        a.scores.length <
        S.setup.rounds
      ) {

        a.scores.push(
          Array.from(
            {
              length:
                S.setup.ends
            },
            () =>
              Array(
                S.setup.arrows
              ).fill("")
          )
        );
      }


      if (
        a.scores.length >
        S.setup.rounds
      ) {

        a.scores.length =
          S.setup.rounds;
      }


      a.scores =
        a.scores.map(
          round => {

            if (
              !Array.isArray(
                round
              )
            ) {

              round = [];
            }


            while (
              round.length <
              S.setup.ends
            ) {

              round.push(
                Array(
                  S.setup.arrows
                ).fill("")
              );
            }


            if (
              round.length >
              S.setup.ends
            ) {

              round.length =
                S.setup.ends;
            }


            return round.map(
              end => {

                if (
                  !Array.isArray(
                    end
                  )
                ) {

                  end = [];
                }


                while (
                  end.length <
                  S.setup.arrows
                ) {

                  end.push("");
                }


                if (
                  end.length >
                  S.setup.arrows
                ) {

                  end.length =
                    S.setup.arrows;
                }


                return end;
              }
            );
          }
        );


      if (
        !Array.isArray(
          a.locked
        )
      ) {

        a.locked = [];
      }


      while (
        a.locked.length <
        S.setup.rounds
      ) {

        a.locked.push(
          Array(
            S.setup.ends
          ).fill(false)
        );
      }


      if (
        a.locked.length >
        S.setup.rounds
      ) {

        a.locked.length =
          S.setup.rounds;
      }


      a.locked =
        a.locked.map(
          round => {

            if (
              !Array.isArray(
                round
              )
            ) {

              round = [];
            }


            while (
              round.length <
              S.setup.ends
            ) {

              round.push(
                false
              );
            }


            if (
              round.length >
              S.setup.ends
            ) {

              round.length =
                S.setup.ends;
            }


            return round;
          }
        );


      a.r =
        Math.max(
          1,
          Math.min(
            Number(a.r) || 1,
            S.setup.rounds
          )
        );


      a.e =
        Math.max(
          1,
          Math.min(
            Number(a.e) || 1,
            S.setup.ends
          )
        );
    });


  if (
    S.session.idx >=
    S.session.archers.length
  ) {

    S.session.idx = 0;
  }
}


/* =========================================================
   SCORING HELPERS
   ========================================================= */

function activeArcher() {

  if (
    !S.session
  ) {

    return null;
  }


  return (
    S.session.archers[
      S.session.idx
    ] ||
    null
  );
}


function currentRoundNo() {

  return (
    S.session?.currentRound ||
    activeArcher()?.r ||
    1
  );
}


function currentEndNo() {

  return (
    S.session?.currentEnd ||
    activeArcher()?.e ||
    1
  );
}


function getEnd(
  archer,
  round,
  end
) {

  return (
    archer?.scores?.[
      round - 1
    ]?.[
      end - 1
    ] ||
    []
  );
}


function endLocked(
  archer,
  round,
  end
) {

  return !!(
    archer?.locked?.[
      round - 1
    ]?.[
      end - 1
    ]
  );
}


function endComplete(
  archer,
  round,
  end
) {

  const values =
    getEnd(
      archer,
      round,
      end
    );


  return (
    values.length ===
      S.setup.arrows &&
    values.every(
      v =>
        v !== ""
    )
  );
}


function endHasScore(
  archer,
  round,
  end
) {

  return getEnd(
    archer,
    round,
    end
  ).some(
    v =>
      v !== ""
  );
}


function endTotal(
  archer,
  round,
  end
) {

  return getEnd(
    archer,
    round,
    end
  ).reduce(
    (sum, v) =>
      sum +
      scoreValue(v),
    0
  );
}


function archerRoundComplete(
  archer,
  round
) {

  for (
    let e = 1;
    e <= S.setup.ends;
    e++
  ) {

    if (
      !endLocked(
        archer,
        round,
        e
      )
    ) {

      return false;
    }
  }


  return true;
}


function allArchersRoundComplete(
  round
) {

  return (
    S.session.archers.length >
      0 &&
    S.session.archers.every(
      a =>
        archerRoundComplete(
          a,
          round
        )
    )
  );
}


function allSessionComplete() {

  if (
    !S.session?.archers?.length
  ) {

    return false;
  }


  return S.session.archers
    .every(
      a => {

        for (
          let r = 1;
          r <= S.setup.rounds;
          r++
        ) {

          if (
            !archerRoundComplete(
              a,
              r
            )
          ) {

            return false;
          }
        }


        return true;
      }
    );
}


function nextEmptyArrowIndex(
  archer,
  round,
  end
) {

  return getEnd(
    archer,
    round,
    end
  ).findIndex(
    v =>
      v === ""
  );
}


function scoreMetrics(
  archer
) {

  let total = 0;

  let x = 0;

  let ten = 0;

  let arrowsShot = 0;

  const rounds = [];


  for (
    let r = 0;
    r < S.setup.rounds;
    r++
  ) {

    let rt = 0;


    for (
      let e = 0;
      e < S.setup.ends;
      e++
    ) {

      const end =
        archer.scores?.[
          r
        ]?.[
          e
        ] || [];


      end.forEach(
        v => {

          if (
            v === ""
          ) {

            return;
          }


          arrowsShot++;


          const pts =
            scoreValue(v);


          total += pts;

          rt += pts;


          if (
            v === "X"
          ) {

            x++;
          }


          if (
            v === "10"
          ) {

            ten++;
          }
        }
      );
    }


    rounds.push(rt);
  }


  const max =
    S.setup.rounds *
    S.setup.ends *
    S.setup.arrows *
    maxPointForMatrix(
      S.setup.matrix
    );


  const avg =
    arrowsShot
      ? total /
        arrowsShot
      : 0;


  const score =
    max
      ? total /
        max *
        100
      : 0;


  return {
    total,
    x,
    ten,
    arrowsShot,
    rounds,
    max,
    avg,
    score
  };
}


function currentRanking() {

  if (
    !S.session
  ) {

    return [];
  }


  return S.session.archers
    .map(
      (
        archer,
        index
      ) => ({

        archer,

        index,

        metrics:
          scoreMetrics(
            archer
          )

      })
    )
    .sort(
      (a, b) =>

        b.metrics.total -
          a.metrics.total ||

        b.metrics.x -
          a.metrics.x ||

        b.metrics.ten -
          a.metrics.ten ||

        a.archer.name
          .localeCompare(
            b.archer.name
          )
    );
}


/* =========================================================
   SCORING PAGE
   ========================================================= */

function scoring() {
  if (!S.session) {
    setup();
    return;
  }

  normalizeSession();

  const a = activeArcher();
  if (!a) {
    setup();
    return;
  }

  const previousGrid = document.querySelector(".score-grid-scroll");
  const previousTabs = document.querySelector(".archer-tabs");
  const savedGridScroll = previousGrid ? previousGrid.scrollTop : 0;
  const savedTabScroll = previousTabs ? previousTabs.scrollLeft : 0;

  const round = currentRoundNo();
  const end = currentEndNo();

  a.r = round;
  a.e = end;

  const count = S.session.archers.length;
  const locked = endLocked(a, round, end);
  const complete = endComplete(a, round, end);
  const roundComplete = allArchersRoundComplete(round);
  const sessionComplete = allSessionComplete();

  const archerChanged = lastScoringArcherIndex !== S.session.idx;
  const endChanged = lastScoringEnd !== end;

  page(
    `
    <div class="scoring-page scoring-compact">
      <header class="score-header compact-score-header">
        <button
          class="score-header-action score-edit-top"
          onclick="beginEditEnd()"
        >
          <span class="score-action-icon">✎</span>
          <small>${editMode && editEnd ? "Update" : "Edit"}</small>
        </button>

        <div class="score-head-title">
          <b>${S.setup.practiceType !== "target" ? `${S.setup.practiceType.toUpperCase()} GAME${S.setup.group && (S.session.groups?.[a.name] || S.session.groups?.["__personal__"]) ? ` • GROUP ${esc(S.session.groups?.[a.name] || S.session.groups?.["__personal__"])}` : ""}` : `${currentPracticeDistance(round, end)}M • TF ${S.setup.target}CM`}</b>
          <small>${S.setup.practiceType !== "target" ? `CP ${completedCPCount(a, round)}/${S.setup.checkPoints || S.setup.ends}` : (S.setup.distanceMode === "multiple" ? `END ${end - currentDistanceBlock(round,end).start + 1}/${currentDistanceBlock(round,end).ends}` : `END ${end}/${S.setup.ends}`)} • ROUND ${round}/${S.setup.rounds}${S.setup.lane && S.session.lanes?.[a.name] ? ` • LANE ${esc(S.session.lanes[a.name])}` : ""}</small>
        </div>

        <button
          class="score-header-action score-undo-top"
          onclick="undoArrow()"
          ${locked && !editMode ? "disabled" : ""}
        >
          <span class="score-action-icon">↶</span>
          <small>Undo</small>
        </button>
      </header>

      ${count > 1 ? archerTabs() : ""}

      <div class="score-name-row compact-name-row">
        <div class="score-current-name">${esc(a.name)}</div>

        <div class="score-name-actions">
          ${
            S.session.roundReady && round < S.setup.rounds
              ? `<button class="round-next-btn" onclick="startNextRound()">ROUND ${round + 1}</button>`
              : ""
          }
          ${
            S.setup.timer
              ? `<button class="score-timer-btn" onclick="timerPage()" title="Timer">⏱</button>`
              : ""
          }
        </div>
      </div>

      <div class="score-grid-scroll compact-grid-scroll">
        ${scoreGrid(a)}
      </div>

      <div class="score-bottom-area compact-score-bottom">
        ${
          (editMode && editEnd) || (!editMode && !S.session.roundReady && !sessionComplete)
            ? keypadHTML(a, round, end, locked)
            : ""
        }

        ${scoreActionHTML(
          a,
          round,
          end,
          complete,
          locked,
          roundComplete,
          sessionComplete
        )}

        ${bottomNavHTML()}
      </div>
    </div>
    `,
    "scoring"
  );

  requestAnimationFrame(() => {
    const grid = document.querySelector(".score-grid-scroll");
    const tabs = document.querySelector(".archer-tabs");

    if (grid) {
      if (endChanged) {
        document.querySelector(".score-end-row.current, .score-end-row.active")?.scrollIntoView({
          behavior: "auto",
          block: "nearest"
        });
      } else {
        grid.scrollTop = savedGridScroll;
      }
    }

    if (tabs) {
      if (archerChanged) {
        document.querySelector(".archer-tab.active")?.scrollIntoView({
          behavior: "auto",
          inline: "center",
          block: "nearest"
        });
      } else {
        tabs.scrollLeft = savedTabScroll;
      }
    }

    lastScoringArcherIndex = S.session.idx;
    lastScoringEnd = end;
  });
}


function archerTabs() {
  return `
    <div class="archer-tabs compact-archer-tabs">
      ${S.session.archers
        .map(
          (a, i) => `
            <button
              class="archer-tab ${i === S.session.idx ? "active" : ""}"
              onclick="selectArcher(${i})"
            >
              <span>${esc(a.name)}</span>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}


function selectArcher(i) {
  if (!S.session?.archers?.[i]) return;

  if (editMode && editDirty && !confirm("Discard unsaved edits?")) return;

  editMode = false;
  editDirty = false;
  editEnd = null;
  selectedScoreCell = null;

  S.session.idx = i;

  const a = S.session.archers[i];
  S.session.currentRound = a.r || 1;
  S.session.currentEnd = a.e || 1;

  saveUnfinished();
  scoring();
}


function cumulativeEndTotal(a, round, endNo) {
  let total = 0;

  for (let e = 1; e <= endNo; e++) {
    total += endTotal(a, round, e);
  }

  return total;
}


function completedCPCount(a, roundNo = currentRoundNo()) {
  if (!a || S.setup.practiceType === "target") return 0;
  const total = Math.max(1, Number(S.setup.checkPoints || S.setup.ends) || 1);
  let done = 0;
  for (let cp = 1; cp <= total; cp++) {
    if (endLocked(a, roundNo, cp)) done++;
  }
  return done;
}

function scoreGrid(a) {
  const round = currentRoundNo();
  const activeEnd = currentEndNo();
  const block = S.setup.distanceMode === "multiple" ? currentDistanceBlock(round, activeEnd) : null;
  const firstEnd = block ? block.start : 1;
  const lastEnd = block ? block.end : S.setup.ends;

  const isGame = S.setup.practiceType !== "target";
  const header = `<div class="score-grid-header"><div class="score-end-head">${isGame ? "CP" : ""}</div>${Array.from({ length: S.setup.arrows }, (_, i) => `<div>${i + 1}</div>`).join("")}<div>${isGame ? "CP TOTAL" : "END"}</div><div>TOTAL</div></div>`;
  const rows = Array.from({ length: lastEnd - firstEnd + 1 }, (_, ei) => {
    const endNo = firstEnd + ei;
    const displayEnd = block ? ei + 1 : endNo;
    const values = getEnd(a, round, endNo);
    const locked = endLocked(a, round, endNo);
    const isCurrent = endNo === activeEnd && a === activeArcher();
    const isEdit = editMode && editEnd === endNo;
    const nextEmpty = values.findIndex(v => v === "");
    return `<div class="score-end-row ${isCurrent ? "current" : ""} ${locked ? "locked" : ""} ${isEdit ? "editing" : ""}" onclick="selectEndRow(${endNo})">
      <div class="end-number">${displayEnd}</div>
      ${values.map((v, ai) => {
        const manuallySelected = selectedScoreCell && selectedScoreCell.end === endNo && selectedScoreCell.arrow === ai;
        const autoSelected = isCurrent && !locked && !selectedScoreCell && nextEmpty === ai;
        return `<button class="score-cell ${scoreClass(v)} ${(manuallySelected || autoSelected) ? "selected" : ""}" onclick="event.stopPropagation(); selectScoreCell(${endNo}, ${ai})">${v || ""}</button>`;
      }).join("")}
      <div class="end-total">${endHasScore(a, round, endNo) ? endTotal(a, round, endNo) : ""}</div>
      <div class="running-total">${endHasScore(a, round, endNo) ? cumulativeEndTotal(a, round, endNo) : ""}</div>
    </div>`;
  }).join("");
  return `<div class="score-grid" style="--arrow-count:${S.setup.arrows};">${header}${rows}</div>`;
}

function selectEndRow(endNo) {
  const a = activeArcher();
  if (!a) return;

  const round = currentRoundNo();
  const current = currentEndNo();
  const locked = endLocked(a, round, endNo);

  // NORMAL SCORING MODE:
  // Only the current open End is available. Previous submitted Ends and
  // future Ends stay locked until the user deliberately presses Edit.
  if (!editMode) {
    if (endNo !== current || locked) return;
    selectedScoreCell = null;
    return;
  }

  // EDIT SELECTION MODE:
  // Only a previously submitted End may be selected for editing.
  if (!locked) return;

  if (editDirty && editEnd !== endNo && !confirm("Discard unsaved edits?")) return;

  S.session.currentEnd = endNo;
  a.r = round;
  a.e = endNo;
  editEnd = endNo;
  editDirty = false;
  selectedScoreCell = null;

  saveUnfinished();
  scoring();
}

function selectScoreCell(endNo, arrowIndex) {
  const a = activeArcher();
  if (!a) return;

  const round = currentRoundNo();
  const current = currentEndNo();
  const locked = endLocked(a, round, endNo);

  // Normal mode: only cells in the current open End can receive scores.
  if (!editMode) {
    if (endNo !== current || locked) return;
  } else {
    // Edit mode: only submitted Ends can be selected/edited.
    if (!locked) return;

    if (editDirty && editEnd !== endNo && !confirm("Discard unsaved edits?")) return;

    if (editEnd !== endNo) {
      S.session.currentEnd = endNo;
      a.r = round;
      a.e = endNo;
      editEnd = endNo;
      editDirty = false;
    }
  }

  selectedScoreCell = {
    end: endNo,
    arrow: arrowIndex
  };

  saveUnfinished();
  scoring();
}


/* =========================================================
   KEYPAD
   ========================================================= */

function keypadHTML(a, round, end, locked) {
  if (locked && !editMode) return "";

  const points = matrices()[S.setup.matrix] || MATRIX_DEFAULTS["10-1, X"];

  return `
    <div class="score-keypad">
      ${points
        .map(
          v => `
            <button
              class="key-score ${scoreClass(v)}"
              onclick="enterScore('${escAttr(v)}')"
            >
              ${v}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}


function enterScore(value) {
  const a = activeArcher();
  if (!a) return;

  const round = currentRoundNo();
  const end = currentEndNo();
  const locked = endLocked(a, round, end);

  if (locked && !editMode) return;

  const values = getEnd(a, round, end);
  let index = -1;

  if (selectedScoreCell && selectedScoreCell.end === end) {
    index = selectedScoreCell.arrow;
  } else {
    index = values.findIndex(v => v === "");
  }

  if (index < 0 || index >= S.setup.arrows) return;

  values[index] = value;

  if (editMode) editDirty = true;

  const next = values.findIndex((v, i) => i > index && v === "");

  selectedScoreCell = next >= 0 ? { end, arrow: next } : null;

  saveUnfinished();
  scoring();
}


/* =========================================================
   SUBMIT / EDIT END
   ========================================================= */

function scoreActionHTML(
  a,
  round,
  end,
  complete,
  locked,
  roundComplete,
  sessionComplete
) {
  if (editMode && editEnd === end) {
    return `
      <button
        class="score-main-action update"
        onclick="updateEditedEnd()"
        ${complete ? "" : "disabled"}
      >
        UPDATE ${S.setup.practiceType !== "target" ? `CP ${end}` : `END ${end}`}
      </button>
    `;
  }

  if (editMode && !editEnd) {
    return `<div class="score-locked-message">SELECT A SUBMITTED END TO EDIT</div>`;
  }

  if (sessionComplete) {
    if (S.session?.savedToHistory) {
      return `
        <button class="score-main-action finish-session" onclick="detailedResult(0, 'scoring')">
          VIEW DETAILED RESULT
        </button>
      `;
    }

    return `
      <button class="score-main-action finish-session" onclick="finishSession()">
        FINISH PRACTICE SESSION 🏁
      </button>
    `;
  }

  if (S.session.roundReady) {
    return `<div class="round-ready-message">ROUND ${round} COMPLETED</div>`;
  }

  if (roundComplete) {
    return `
      <button class="score-main-action finish-round" onclick="finishRound()">
        FINISH ROUND ${round}
      </button>
    `;
  }

  if (locked) {
    return `<div class="score-locked-message">${S.setup.practiceType !== "target" ? `CP ${end}` : `END ${end}`} SUBMITTED</div>`;
  }

  return `
    <button
      class="score-main-action submit-end"
      onclick="submitCurrentEnd()"
      ${complete ? "" : "disabled"}
    >
      ${S.setup.practiceType !== "target" ? `SUBMIT CP${end}` : `SUBMIT END ${end}`} (${esc(a.name).toUpperCase()})
    </button>
  `;
}


function submitCurrentEnd() {
  const a = activeArcher();
  if (!a) return;

  const round = currentRoundNo();
  const end = currentEndNo();

  if (endLocked(a, round, end)) return;

  if (!endComplete(a, round, end)) {
    alert(S.setup.practiceType !== "target" ? "Complete all arrows before submitting this CP." : "Complete all arrows before submitting this End.");
    return;
  }

  a.locked[round - 1][end - 1] = true;

  editMode = false;
  editEnd = null;
  editDirty = false;
  selectedScoreCell = null;

  saveUnfinished();
  moveAfterSubmit();
}


function nextSequentialEndForArcher(archer, round) {
  if (!archer) return null;

  // An archer may only advance in sequence. This is especially important
  // for late joiners: they start from End 1 while the other archers keep
  // their own progress and do not have to wait for them to catch up.
  for (let endNo = 1; endNo <= S.setup.ends; endNo++) {
    if (!endLocked(archer, round, endNo)) {
      const previousComplete =
        endNo === 1 || endLocked(archer, round, endNo - 1);

      if (previousComplete) return endNo;
      return null;
    }
  }

  return null;
}

function nextGameCPAfter(archer, round, afterCP) {
  if (!archer) return null;
  const total = Math.max(1, Number(S.setup.checkPoints || S.setup.ends) || 1);
  for (let cp = Math.max(1, Number(afterCP) + 1); cp <= total; cp++) {
    if (!endLocked(archer, round, cp)) return cp;
  }
  return null;
}

function moveAfterSubmit() {
  const round = currentRoundNo();
  const count = S.session.archers.length;
  const submittedIndex = S.session.idx;
  const submittedArcher = S.session.archers[submittedIndex];

  // 2D / 3D GAME: when a CP is selected manually (for example CP10),
  // continue forward to CP11, CP12, etc. Never jump back to CP1.
  if (S.setup.practiceType !== "target") {
    const submittedCP = currentEndNo();
    const nextCP = nextGameCPAfter(submittedArcher, round, submittedCP);
    submittedArcher.r = round;
    submittedArcher.e = nextCP || submittedCP;

    if (nextCP !== null) {
      S.session.currentRound = round;
      S.session.currentEnd = nextCP;
      saveUnfinished();
      scoring();
      return;
    }

    saveUnfinished();
    scoring();
    return;
  }

  // Keep each archer's End progression independent.
  // Example: Archer 1 can continue to End 4 even when a late Archer 2
  // is still completing End 1, End 2, etc.
  const submittedNextEnd = nextSequentialEndForArcher(submittedArcher, round);
  submittedArcher.r = round;
  submittedArcher.e = submittedNextEnd || S.setup.ends;

  // Continue normal team rotation, but send every archer to THEIR OWN
  // next sequential open End rather than forcing everyone onto one End.
  for (let offset = 1; offset <= count; offset++) {
    const i = (submittedIndex + offset) % count;
    const candidate = S.session.archers[i];
    const candidateEnd = nextSequentialEndForArcher(candidate, round);

    if (candidateEnd !== null) {
      S.session.idx = i;
      candidate.r = round;
      candidate.e = candidateEnd;
      S.session.currentRound = round;
      S.session.currentEnd = candidateEnd;

      saveUnfinished();
      scoring();
      return;
    }
  }

  // No open End remains in this round.
  S.session.idx = submittedIndex;
  S.session.currentRound = round;
  S.session.currentEnd = S.setup.ends;
  submittedArcher.r = round;
  submittedArcher.e = S.setup.ends;

  saveUnfinished();
  scoring();
}

function beginEditEnd() {
  const a = activeArcher();
  if (!a) return;

  // If a submitted End has already been selected, the same top button
  // acts as Update. This keeps the button useful without unlocking Ends
  // during normal scoring.
  if (editMode && editEnd) {
    updateEditedEnd();
    return;
  }

  const round = currentRoundNo();
  const hasSubmittedEnd = Array.from({ length: S.setup.ends }, (_, i) => i + 1)
    .some(endNo => endLocked(a, round, endNo));

  if (!hasSubmittedEnd) return;

  // Enter selection mode only. Do NOT jump to an End automatically.
  // The user must now tap the previous submitted End they want to edit.
  editMode = true;
  editEnd = null;
  editDirty = false;
  selectedScoreCell = null;

  saveUnfinished();
  scoring();
}

function findNextOpenScoringPosition(round) {
  for (let endNo = 1; endNo <= S.setup.ends; endNo++) {
    for (let i = 0; i < S.session.archers.length; i++) {
      const archer = S.session.archers[i];

      if (!endLocked(archer, round, endNo)) {
        return {
          idx: i,
          end: endNo
        };
      }
    }
  }

  return null;
}


function updateEditedEnd() {
  const a = activeArcher();
  if (!a) return;

  const round = currentRoundNo();
  const end = editEnd;

  if (!end) return;

  if (!endComplete(a, round, end)) {
    alert("Complete all arrows before updating this End.");
    return;
  }

  a.locked[round - 1][end - 1] = true;

  if (S.session?.savedToHistory && S.history?.[0]) {
    const synced = JSON.parse(JSON.stringify(S.session));
    delete synced.savedToHistory;
    synced.completedAt = S.history[0].completedAt || new Date().toISOString();
    synced.setup = { ...S.setup };
    synced.title = S.history[0].title || synced.title || "Archery Detailed Results";
    synced.note = S.history[0].note || synced.note || "";
    S.history[0] = synced;
    save();
  }

  editMode = false;
  editEnd = null;
  editDirty = false;
  selectedScoreCell = null;

  const next = findNextOpenScoringPosition(round);

  if (next) {
    S.session.idx = next.idx;
    S.session.currentRound = round;
    S.session.currentEnd = next.end;

    const nextArcher = S.session.archers[next.idx];
    nextArcher.r = round;
    nextArcher.e = next.end;
  } else {
    S.session.idx = 0;
    S.session.currentRound = round;
    S.session.currentEnd = S.setup.ends;
  }

  saveUnfinished();
  scoring();
}


/* =========================================================
   ROUND FLOW
   ========================================================= */

function finishRound() {
  const round = currentRoundNo();

  if (!allArchersRoundComplete(round)) {
    alert(`Round ${round} is not complete.`);
    return;
  }

  if (round >= S.setup.rounds) {
    if (allSessionComplete()) scoring();
    return;
  }

  S.session.roundReady = true;
  S.session.idx = 0;

  saveUnfinished();
  scoring();
}


function startNextRound() {
  if (!S.session?.roundReady) return;

  const current = currentRoundNo();
  const next = current + 1;

  if (next > S.setup.rounds) return;

  S.session.currentRound = next;
  S.session.currentEnd = 1;
  S.session.idx = 0;
  S.session.roundReady = false;

  S.session.archers.forEach(a => {
    a.r = next;
    a.e = 1;
  });

  editMode = false;
  editEnd = null;
  editDirty = false;
  selectedScoreCell = null;

  saveUnfinished();
  scoring();
}



function undoArrow() {
  if (!S.session) return;

  const a = activeArcher();
  if (!a) return;

  const round = currentRoundNo();
  const end = currentEndNo();
  const locked = endLocked(a, round, end);

  if (locked && !editMode) return;

  const row = getEnd(a, round, end);
  if (!row) return;

  let index = -1;

  // If the user selected a cell, undo from that cell backwards.
  // Keep the cursor on the cell whose value was removed so the
  // replacement score can be entered immediately.
  if (
    selectedScoreCell &&
    selectedScoreCell.end === end &&
    Number.isInteger(selectedScoreCell.arrow)
  ) {
    for (let i = Math.min(selectedScoreCell.arrow, row.length - 1); i >= 0; i--) {
      if (row[i] !== "" && row[i] != null) {
        index = i;
        break;
      }
    }
  }

  if (index < 0) {
    for (let i = row.length - 1; i >= 0; i--) {
      if (row[i] !== "" && row[i] != null) {
        index = i;
        break;
      }
    }
  }

  if (index < 0) return;

  row[index] = "";
  selectedScoreCell = {
    end,
    arrow: index
  };

  if (editMode) editDirty = true;

  saveUnfinished();
  scoring();
}



/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

function bottomNavHTML() {
  const multi = S.setup.distanceMode === "multiple";
  return `<nav class="score-bottom-nav compact-bottom-nav ${multi ? "six-items" : ""}">
    <button onclick="showExitDialog()"><span class="nav-icon nav-back">‹</span><small>Back</small></button>
    ${multi ? `<button onclick="manageDistances()"><span class="nav-icon nav-distance">⇆</span><small>Distance</small></button>` : ""}
    <button onclick="manageRounds()"><span class="nav-icon nav-emoji">🔄</span><small>Round</small></button>
    <button onclick="manageEnds()"><span class="nav-icon nav-emoji">🎯</span><small>${S.setup.practiceType !== "target" ? "CP" : "End"}</small></button>
    <button onclick="summary()"><span class="nav-icon nav-emoji">📊</span><small>Summary</small></button>
    <button onclick="addArcherDuringSession()"><span class="nav-icon nav-archer">♙</span><small>Archer</small></button>
  </nav>`;
}

function manageDistances() {
  if (!S.session || S.setup.distanceMode !== "multiple" || document.getElementById("manageDistancesDialog")) return;
  const round = currentRoundNo();
  const current = currentDistanceBlock(round, currentEndNo());
  const blocks = multiBlocks(round);
  const overlay = document.createElement("div");
  overlay.id = "manageDistancesDialog";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal-card"><h3>SELECT DISTANCE</h3><div class="round-select-grid distance-select-grid">
    ${blocks.map(b => `<button class="round-select-btn ${current?.distance === b.distance ? "active" : ""}" onclick="selectDistanceBlock(${b.start})">${b.distance}M<br><small>${b.ends} Ends</small></button>`).join("")}
  </div><div class="modal-actions"><button class="btn soft" onclick="closeModal('manageDistancesDialog')">CLOSE</button></div></div>`;
  document.body.appendChild(overlay);
}

function selectDistanceBlock(startEnd) {
  const a = activeArcher();
  if (!a) return;
  const round = currentRoundNo();
  const block = multiBlocks(round).find(b => b.start === Number(startEnd));
  if (!block) return;
  let target = block.start;
  for (let e = block.start; e <= block.end; e++) { if (!endLocked(a, round, e)) { target = e; break; } target = e; }
  S.session.currentEnd = target; a.r = round; a.e = target;
  editMode = false; editEnd = null; editDirty = false; selectedScoreCell = null;
  saveUnfinished(); closeModal("manageDistancesDialog"); scoring();
}

function showExitDialog() {

  if (
    document.getElementById(
      "exitDialog"
    )
  ) {

    return;
  }


  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "exitDialog";


  overlay.className =
    "modal-overlay";


  overlay.innerHTML = `
    <div class="modal-card">

      <h3>
        Leave Scoring?
      </h3>


      <p>
        Do you want to save current scores
        before leaving?
      </p>


      <div class="modal-actions">

        <button
          class="btn green"
          onclick="
            saveAndExit()
          "
        >
          SAVE & EXIT
        </button>


        <button
          class="btn danger"
          onclick="
            discardAndExit()
          "
        >
          DISCARD & EXIT
        </button>


        <button
          class="btn soft"
          onclick="
            closeExitDialog()
          "
        >
          CANCEL
        </button>

      </div>

    </div>
  `;


  document.body.appendChild(
    overlay
  );
}


function closeExitDialog() {

  document.getElementById(
    "exitDialog"
  )?.remove();
}


function saveAndExit() {
  const completed =
    !!S.session &&
    (S.session.savedToHistory || allSessionComplete());

  if (completed) {
    clearUnfinished();
  } else {
    saveUnfinished();
  }

  closeExitDialog();

  S.session = null;
  editMode = false;
  editEnd = null;
  editDirty = false;
  selectedScoreCell = null;

  setup();
}


function discardAndExit() {
  if (document.getElementById("discardSessionDialog")) return;

  const overlay = document.createElement("div");
  overlay.id = "discardSessionDialog";
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <h3>Discard Session?</h3>
      <p>Discard this unfinished session and all current scores?</p>
      <div class="modal-actions">
        <button class="btn danger" onclick="confirmDiscardAndExit()">
          DISCARD
        </button>
        <button class="btn soft" onclick="closeModal('discardSessionDialog')">
          CANCEL
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function confirmDiscardAndExit() {
  clearUnfinished();
  closeModal("discardSessionDialog");
  closeExitDialog();

  S.session = null;
  editMode = false;
  editEnd = null;
  editDirty = false;
  selectedScoreCell = null;

  setup();
}


/* =========================================================
   MANAGE ${S.setup.practiceType !== "target" ? "CHECK POINTS" : "ENDS"}
   ========================================================= */

function manageEnds() {

  if (
    document.getElementById(
      "manageEndsDialog"
    )
  ) {

    return;
  }


  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "manageEndsDialog";


  overlay.className =
    "modal-overlay";


  overlay.innerHTML = `
    <div class="modal-card">

      <h3>
        MANAGE ${S.setup.practiceType !== "target" ? "CHECK POINTS" : "ENDS"}
      </h3>


      <div class="stepper">

        <button
          onclick="
            stepModalValue(
              'manageEndValue',
              -1
            )
          "
        >
          −
        </button>


        <strong
          id="manageEndValue"
        >
          ${S.setup.ends}
        </strong>


        <button
          onclick="
            stepModalValue(
              'manageEndValue',
              1
            )
          "
        >
          +
        </button>

      </div>


      <div class="modal-actions">

        <button
          class="btn primary"
          onclick="
            applyEnds()
          "
        >
          APPLY ${S.setup.practiceType !== "target" ? "CP" : "END"}
        </button>

      </div>

      ${S.setup.practiceType !== "target" ? gameCPSelectorHTML() : ""}

      <div class="modal-actions">
        <button
          class="btn soft"
          onclick="
            closeModal(
              'manageEndsDialog'
            )
          "
        >
          CLOSE
        </button>
      </div>

    </div>
  `;


  document.body.appendChild(
    overlay
  );
}


function gameCPSelectorHTML() {
  if (!S.session || S.setup.practiceType === "target") return "";

  const a = activeArcher();
  const round = currentRoundNo();
  const current = currentEndNo();
  const total = Math.max(1, Number(S.setup.checkPoints || S.setup.ends) || 1);

  return `
    <div class="cp-select-block">
      <div class="round-select-title">SELECT CP</div>
      <div class="cp-select-grid">
        ${Array.from({ length: total }, (_, i) => {
          const cp = i + 1;
          const complete = !!a && endLocked(a, round, cp);
          const active = cp === current;
          return `<button
            class="cp-select-btn ${complete ? "complete" : ""} ${active ? "active" : ""}"
            onclick="selectGameCP(${cp})"
            aria-label="Select CP ${cp}${complete ? ', complete' : ''}"
          >CP${cp}</button>`;
        }).join("")}
      </div>
      <div class="cp-select-note"><span class="cp-green-dot"></span> Green = Completed</div>
    </div>
  `;
}

function selectGameCP(cpNo) {
  if (!S.session || S.setup.practiceType === "target") return;

  const a = activeArcher();
  if (!a) return;

  const total = Math.max(1, Number(S.setup.checkPoints || S.setup.ends) || 1);
  const cp = Math.max(1, Math.min(Number(cpNo) || 1, total));
  const round = currentRoundNo();

  if (editMode && editDirty && !confirm("Discard unsaved edits?")) return;

  editMode = false;
  editEnd = null;
  editDirty = false;
  selectedScoreCell = null;

  S.session.currentEnd = cp;
  a.r = round;
  a.e = cp;

  saveUnfinished();
  closeModal("manageEndsDialog");
  scoring();
}

function stepModalValue(
  id,
  delta
) {

  const el =
    document.getElementById(
      id
    );


  if (!el) {
    return;
  }


  const current =
    Number(
      el.textContent
    ) || 1;


  el.textContent =
    Math.max(
      1,
      current + delta
    );
}


function applyEnds() {

  const el =
    document.getElementById(
      "manageEndValue"
    );


  const newEnds =
    Math.max(
      1,
      Number(
        el?.textContent
      ) || S.setup.ends
    );


  const oldEnds =
    S.setup.ends;


  if (
    newEnds ===
    oldEnds
  ) {

    closeModal(
      "manageEndsDialog"
    );

    return;
  }


  if (
    newEnds <
    oldEnds
  ) {

    for (
      let r = 1;
      r <= S.setup.rounds;
      r++
    ) {

      for (
        let e =
          newEnds + 1;
        e <= oldEnds;
        e++
      ) {

        for (
          const a of
          S.session.archers
        ) {

          if (
            endHasScore(
              a,
              r,
              e
            )
          ) {

            alert(
              `Cannot reduce Ends. End ${e} already contains scores.`
            );

            return;
          }
        }
      }
    }
  }


  S.session.archers
    .forEach(
      a => {

        a.scores =
          a.scores.map(
            round => {

              while (
                round.length <
                newEnds
              ) {

                round.push(
                  Array(
                    S.setup.arrows
                  ).fill("")
                );
              }


              if (
                round.length >
                newEnds
              ) {

                round.length =
                  newEnds;
              }


              return round;
            }
          );


        a.locked =
          a.locked.map(
            round => {

              while (
                round.length <
                newEnds
              ) {

                round.push(
                  false
                );
              }


              if (
                round.length >
                newEnds
              ) {

                round.length =
                  newEnds;
              }


              return round;
            }
          );


        a.e =
          Math.min(
            a.e,
            newEnds
          );
      }
    );


  S.setup.ends =
    newEnds;


  S.session.setup.ends =
    newEnds;


  // For 3D / 2D, Check Points is the session End count.
  // Keep every result surface in sync when CP is changed from Scoring.
  if (S.setup.practiceType !== "target") {
    S.setup.checkPoints = newEnds;
    S.session.setup.checkPoints = newEnds;
  }


  // If more Ends are added after the session had already been completed,
  // reopen the session and move scoring to the newly-created open End.
  if (newEnds > oldEnds) {
    if (S.session.savedToHistory) {
      S.history = S.history.filter(h => h.id !== S.session.id);
      delete S.session.savedToHistory;
      save();
    }

    const round = currentRoundNo();
    const active = activeArcher();
    let nextEnd = active ? nextSequentialEndForArcher(active, round) : null;

    if (nextEnd !== null && active) {
      active.r = round;
      active.e = nextEnd;
      S.session.currentRound = round;
      S.session.currentEnd = nextEnd;
    } else {
      const next = findNextOpenScoringPosition(round);
      if (next) {
        S.session.idx = next.idx;
        S.session.currentRound = round;
        S.session.currentEnd = next.end;
        S.session.archers[next.idx].r = round;
        S.session.archers[next.idx].e = next.end;
      }
    }
  } else {
    S.session.currentEnd =
      Math.min(
        S.session.currentEnd,
        newEnds
      );
  }


  // If this session already has a history record, keep its format metadata synced too.
  if (S.setup.practiceType !== "target" && S.session?.savedToHistory) {
    const hi = S.history.findIndex(h => h.id === S.session.id);
    if (hi >= 0) {
      S.history[hi].setup = {
        ...(S.history[hi].setup || {}),
        ends: newEnds,
        checkPoints: newEnds
      };
      save();
    }
  }


  saveUnfinished();


  closeModal(
    "manageEndsDialog"
  );


  scoring();
}


/* =========================================================
   MANAGE ROUNDS
   ========================================================= */

function manageRounds() {
  if (document.getElementById("manageRoundsDialog")) return;

  const overlay = document.createElement("div");
  overlay.id = "manageRoundsDialog";
  overlay.className = "modal-overlay";

  const current = currentRoundNo();

  overlay.innerHTML = `
    <div class="modal-card">
      <h3>MANAGE ROUNDS</h3>

      <div class="stepper">
        <button onclick="stepModalValue('manageRoundValue', -1)">−</button>
        <strong id="manageRoundValue">${S.setup.rounds}</strong>
        <button onclick="stepModalValue('manageRoundValue', 1)">+</button>
      </div>

      <div class="modal-actions">
        <button class="btn primary" onclick="applyRounds()">APPLY ROUND</button>
      </div>

      <div class="round-select-block round-mini-select-block">
        <div class="round-select-title">SELECT ROUND</div>
        <div class="round-select-grid round-mini-select-grid">
          ${Array.from(
            { length: S.setup.rounds },
            (_, i) => {
              const roundNo = i + 1;
              const completed = allArchersRoundComplete(roundNo);
              const active = roundNo === current;
              return `
                <button
                  class="round-select-btn round-mini-select-btn ${completed ? "complete" : ""} ${active ? "active" : ""}"
                  onclick="selectRound(${roundNo})"
                  aria-label="Select Round ${roundNo}${completed ? ', completed' : ''}"
                >
                  ROUND ${roundNo}
                </button>
              `;
            }
          ).join("")}
        </div>
        <div class="round-select-note"><span class="round-green-dot"></span> Green = Completed</div>
      </div>

      <div class="modal-actions">
        <button class="btn soft" onclick="closeModal('manageRoundsDialog')">CLOSE</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}


function selectRound(roundNo) {
  if (!S.session) return;

  const r = Math.max(1, Math.min(Number(roundNo) || 1, S.setup.rounds));
  const a = activeArcher();
  if (!a) return;

  if (editMode && editDirty && !confirm("Discard unsaved edits?")) return;

  editMode = false;
  editDirty = false;
  editEnd = null;
  selectedScoreCell = null;

  let targetEnd = 1;
  for (let e = 1; e <= S.setup.ends; e++) {
    if (!endLocked(a, r, e)) {
      targetEnd = e;
      break;
    }
  }

  S.session.currentRound = r;
  S.session.currentEnd = targetEnd;
  a.r = r;
  a.e = targetEnd;
  S.session.roundReady = allArchersRoundComplete(r);

  saveUnfinished();
  closeModal("manageRoundsDialog");
  scoring();
}


function applyRounds() {

  const el =
    document.getElementById(
      "manageRoundValue"
    );


  const newRounds =
    Math.max(
      1,
      Number(
        el?.textContent
      ) || S.setup.rounds
    );


  const oldRounds =
    S.setup.rounds;


  if (
    newRounds ===
    oldRounds
  ) {

    closeModal(
      "manageRoundsDialog"
    );

    return;
  }


  if (
    newRounds <
    oldRounds
  ) {

    for (
      let r =
        newRounds + 1;
      r <= oldRounds;
      r++
    ) {

      for (
        let e = 1;
        e <= S.setup.ends;
        e++
      ) {

        for (
          const a of
          S.session.archers
        ) {

          if (
            endHasScore(
              a,
              r,
              e
            )
          ) {

            alert(
              `Cannot reduce Rounds. Round ${r} already contains scores.`
            );

            return;
          }
        }
      }
    }


    if (
      currentRoundNo() >
      newRounds
    ) {

      alert(
        "Cannot remove the Round currently in use."
      );

      return;
    }
  }


  S.session.archers
    .forEach(
      a => {

        while (
          a.scores.length <
          newRounds
        ) {

          a.scores.push(
            Array.from(
              {
                length:
                  S.setup.ends
              },
              () =>
                Array(
                  S.setup.arrows
                ).fill("")
            )
          );
        }


        if (
          a.scores.length >
          newRounds
        ) {

          a.scores.length =
            newRounds;
        }


        while (
          a.locked.length <
          newRounds
        ) {

          a.locked.push(
            Array(
              S.setup.ends
            ).fill(false)
          );
        }


        if (
          a.locked.length >
          newRounds
        ) {

          a.locked.length =
            newRounds;
        }


        a.r =
          Math.min(
            a.r,
            newRounds
          );
      }
    );


  S.setup.rounds =
    newRounds;


  S.session.setup.rounds =
    newRounds;


  saveUnfinished();


  closeModal(
    "manageRoundsDialog"
  );


  scoring();
}


function closeModal(id) {

  document.getElementById(
    id
  )?.remove();
}


/* =========================================================
   ADD ARCHER DURING SESSION
   ========================================================= */

function addArcherDuringSession() {
  if (!S.session || document.getElementById("addArcherDialog")) return;

  const available = S.archers.filter(
    n => !S.session.archers.some(a => a.name.toLowerCase() === String(n).toLowerCase())
  );

  const overlay = document.createElement("div");
  overlay.id = "addArcherDialog";
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal-card">
      <h3>ADD ARCHER</h3>
      <p>New archers start from Round 1, End 1.</p>

      <label class="modal-field-label" for="sessionExistingArcher">Select Registered Archer</label>
      <select id="sessionExistingArcher">
        <option value="">-- Select Archer --</option>
        ${available.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join("")}
      </select>

      <label class="modal-field-label" for="sessionNewArchers">Or Add New Archer(s)</label>
      <textarea
        id="sessionNewArchers"
        rows="3"
        placeholder="Example: Ali, Abu, Ahmad"
      ></textarea>
      <small class="help">Separate multiple names with commas.</small>

      <div class="modal-actions">
        <button class="btn green" onclick="confirmAddArcher()">ADD ARCHER</button>
        <button class="btn soft" onclick="closeModal('addArcherDialog')">CANCEL</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}


function confirmAddArcher() {
  if (!S.session) return;

  const selected =
    document.getElementById("sessionExistingArcher")?.value.trim() || "";

  const typed =
    document.getElementById("sessionNewArchers")?.value || "";

  const names = [selected, ...typed.split(",")]
    .map(n => n.trim())
    .filter(Boolean)
    .filter(
      (name, index, arr) =>
        arr.findIndex(x => x.toLowerCase() === name.toLowerCase()) === index
    )
    .filter(
      name =>
        !S.session.archers.some(
          a => a.name.toLowerCase() === name.toLowerCase()
        )
    );

  if (!names.length) {
    alert("Select or enter at least one new archer.");
    return;
  }

  const joinedAtRound = currentRoundNo();
  const joinedAtEnd = currentEndNo();

  names.forEach(name => {
    registerArcher(name);

    S.session.archers.push({
      name,
      r: 1,
      e: 1,
      scores: makeScoreArray(),
      locked: makeLockArray(),
      joinedAtRound,
      joinedAtEnd
    });
  });

  S.session.idx = S.session.archers.length - names.length;
  S.session.currentRound = 1;
  S.session.currentEnd = 1;
  S.session.roundReady = false;

  saveUnfinished();
  closeModal("addArcherDialog");
  scoring();
}


function backFromDetailedResults() {
  if (history.length > 1) {
    history.back();
    return;
  }

  if (detailedResultOrigin === "profile") {
    navRestoring = true;
    try {
      profiles();
    } finally {
      navRestoring = false;
    }
    return;
  }

  if (detailedResultOrigin === "scoring" && S.session) {
    navRestoring = true;
    try {
      scoring();
    } finally {
      navRestoring = false;
    }
    return;
  }

  navRestoring = true;
  try {
    historyPage();
  } finally {
    navRestoring = false;
  }
}


function summary() {
  if (!S.session) return;
  const ranking = currentRanking();
  const pointsRange = (archer, roundNo, start, end) => {
    let total = 0; for (let e=start; e<=end; e++) total += (getEnd(archer, roundNo, e)||[]).reduce((sum,v)=>sum+scoreValue(v),0); return total;
  };
  let rankingHTML = "";
  if (S.setup.practiceType !== "target") {
    const cpTotal = Math.max(1, Number(S.setup.checkPoints || S.setup.ends) || 1);
    rankingHTML = Array.from({length:S.setup.rounds},(_,ri)=>{
      const roundNo = ri + 1;
      return `<div class="summary-round-block"><div class="summary-round-heading">ROUND ${roundNo}</div><div class="responsive-scroll"><table class="summary-table live-summary-table game-cp-summary-table"><thead><tr><th>Rank</th><th class="summary-archer">Archer</th><th class="game-total-col">Total</th>${Array.from({length:cpTotal},(_,i)=>`<th>CP${i+1}</th>`).join("")}</tr></thead><tbody>${ranking.map((item,rank)=>{ const vals=Array.from({length:cpTotal},(_,i)=>endTotal(item.archer,roundNo,i+1)); const total=vals.reduce((x,y)=>x+y,0); return `<tr><td>${rank+1}</td><td class="summary-archer summary-archer-name"><b>${esc(item.archer.name)}</b></td><td class="game-total-col"><b>${total}</b></td>${vals.map(v=>`<td>${v}</td>`).join("")}</tr>`; }).join("")}</tbody></table></div></div>`;
    }).join("");
  } else if (S.setup.distanceMode === "multiple") {
    rankingHTML = Array.from({length:S.setup.rounds},(_,ri)=>{
      const roundNo=ri+1, blocks=multiBlocks(roundNo);
      return `<div class="summary-round-block"><div class="summary-round-heading">ROUND ${roundNo}</div><div class="responsive-scroll"><table class="summary-table live-summary-table multi-summary-table"><colgroup><col class="summary-col-rank"><col class="summary-col-archer">${blocks.map(()=>`<col class="summary-col-round">`).join("")}<col class="summary-col-points"></colgroup><thead><tr><th>Rank</th><th class="summary-archer">Archer</th>${blocks.map(b=>`<th>${b.distance}m</th>`).join("")}<th>Points</th></tr></thead><tbody>${ranking.map((item,rank)=>{const vals=blocks.map(b=>pointsRange(item.archer,roundNo,b.start,b.end)); const total=vals.reduce((a,b)=>a+b,0); return `<tr><td>${rank+1}</td><td class="summary-archer summary-archer-name"><b>${esc(item.archer.name)}</b></td>${vals.map(v=>`<td>${v}</td>`).join("")}<td><b>${total}</b></td></tr>`}).join("")}</tbody></table></div></div>`;
    }).join("");
  } else {
    const roundPoints=(archer,roundNo)=>pointsRange(archer,roundNo,1,S.setup.ends);
    rankingHTML=`<div class="responsive-scroll"><table class="summary-table live-summary-table"><colgroup><col class="summary-col-rank"><col class="summary-col-archer">${Array.from({length:S.setup.rounds},()=>`<col class="summary-col-round">`).join("")}<col class="summary-col-points"></colgroup><thead><tr><th>Rank</th><th class="summary-archer">Archer</th>${Array.from({length:S.setup.rounds},(_,i)=>`<th>R${i+1}</th>`).join("")}<th>Points</th></tr></thead><tbody>${ranking.map((item,rank)=>`<tr><td>${rank+1}</td><td class="summary-archer summary-archer-name"><b>${esc(item.archer.name)}</b></td>${Array.from({length:S.setup.rounds},(_,i)=>`<td>${roundPoints(item.archer,i+1)}</td>`).join("")}<td><b>${item.metrics.total}</b></td></tr>`).join("")}</tbody></table></div>`;
  }
  const summaryFirstArcher = ranking[0]?.archer?.name || "";
  const summaryGroupNo = String(
    S.session?.groups?.[summaryFirstArcher] ||
    S.session?.groups?.["__personal__"] ||
    S.session?.setup?.groupNo ||
    S.setup.groupNo ||
    ""
  ).trim();
  const summaryGameTitle = S.setup.practiceType !== "target"
    ? `${S.setup.practiceType.toUpperCase()} GAME${S.setup.group && summaryGroupNo ? ` - GROUP ${esc(summaryGroupNo)}` : ""}`
    : `${S.setup.distanceMode === "multiple" ? `${ensureMultiSetup().distances.join("/")}M` : `${S.setup.distance}M`} • TF ${S.setup.target}CM`;

  page(`${head("LIVE SUMMARY")}<section class="card"><div class="summary-meta"><b>${summaryGameTitle}</b><span>${S.setup.practiceType !== "target" ? `${S.setup.arrows}A × ${S.setup.checkPoints || S.setup.ends}CP × ${S.setup.rounds}R` : `${S.setup.arrows}A × ${S.setup.ends}E × ${S.setup.rounds}R`}</span></div></section><section class="card"><div class="section">CURRENT RANKING</div>${rankingHTML}</section><button class="btn primary full" onclick="scoring()">BACK TO SCORING</button>`,"summary");
}

function finishSession() {

  if (
    !S.session
  ) {

    return;
  }


  if (
    !allSessionComplete()
  ) {

    alert(
      "The practice session is not complete."
    );

    return;
  }


  if (
    !confirm(
      "Finish this practice session?"
    )
  ) {

    return;
  }


  const finished =
    JSON.parse(
      JSON.stringify(
        S.session
      )
    );


  finished.completedAt =
    new Date()
      .toISOString();


  finished.setup = {
    ...S.setup
  };


  finished.title =
    finished.title ||
    "Archery Detailed Results";


  S.history.unshift(
    finished
  );


  save();


  clearUnfinished();

  // Keep the completed session in memory so Detailed Result can return
  // to the previous Scoring Page without creating a duplicate history entry.
  S.session.savedToHistory = true;


  editMode =
    false;

  editEnd =
    null;

  editDirty =

      false;

  selectedScoreCell =
    null;


  viewHistoryIndex =
    0;


  detailedResult(
    0,
    "scoring"
  );
}

/* =========================================================
   PRACTICE HISTORY
   ========================================================= */

function historyPage(
  resetFilters = false
) {

  if (
    resetFilters ||
    !historyFilters
  ) {

    historyFilters = {
      archer:
        defaultArcher() ||
        "ALL",
      period:
        "7",
      distance:
        "30"
    };
  }


  const names = [
    ...new Set(
      [
        ...S.archers,

        ...S.history.flatMap(
          h =>
            h.archers?.map(
              a => a.name
            ) || []
        )
      ]
    )
  ];


  page(
    `
    ${head("PRACTICE HISTORY")}


    <section class="card history-filter-card">

      <div class="history-filter-grid">

        <div>

          <div class="history-archer-label">
            <label class="field-label">Archer</label>
            <button type="button" class="history-clear" onclick="resetHistoryFilters()">Clear</button>
          </div>

          <select
            id="historyArcher"
            onchange="
              historyFilters.archer=
                this.value;
              historyPage()
            "
          >

            <option
              value="ALL"
              ${
                historyFilters.archer ===
                "ALL"
                  ? "selected"
                  : ""
              }
            >
              All Archers
            </option>

            ${
              names
                .map(
                  n => `
                  <option
                    value="${esc(n)}"
                    ${
                      historyFilters.archer ===
                        n
                        ? "selected"
                        : ""
                    }
                  >
                    ${esc(n)}
                  </option>
                  `
                )
                .join("")
            }

          </select>

        </div>


        <div>

          <label class="field-label">
            Period
          </label>

          <select
            id="historyPeriod"
            onchange="
              historyFilters.period=
                this.value;
              historyPage()
            "
          >

            <option
              value="7"
              ${
                historyFilters.period ===
                  "7"
                  ? "selected"
                  : ""
              }
            >
              Last 7 Days
            </option>

            <option
              value="30"
              ${
                historyFilters.period ===
                  "30"
                  ? "selected"
                  : ""
              }
            >
              Last 30 Days
            </option>

            <option
              value="90"
              ${
                historyFilters.period ===
                  "90"
                  ? "selected"
                  : ""
              }
            >
              Last 90 Days
            </option>

            <option
              value="365"
              ${
                historyFilters.period ===
                  "365"
                  ? "selected"
                  : ""
              }
            >
              Last 12 Months
            </option>

            <option
              value="ALL"
              ${
                historyFilters.period ===
                  "ALL"
                  ? "selected"
                  : ""
              }
            >
              All Time
            </option>

          </select>

        </div>


        <div>

          <label class="field-label">
            Distance
          </label>

          <select
            id="historyDistance"
            onchange="
              historyFilters.distance=
                this.value;
              historyPage()
            "
          >

            <option
              value="ALL"
              ${
                historyFilters.distance ===
                  "ALL"
                  ? "selected"
                  : ""
              }
            >
              All
            </option>

            ${
              historyDistances()
                .map(
                  d => `
                  <option
                    value="${d}"
                    ${
                      String(
                        historyFilters.distance
                      ) ===
                      String(d)
                        ? "selected"
                        : ""
                    }
                  >
                    ${d}m
                  </option>
                  `
                )
                .join("")
            }

          </select>

        </div>

      </div>

    </section>


    <div class="history-bulk-bar">
      <span id="historySelectedCount">${historySelected.size} selected</span>
      <div class="history-bulk-actions">
        <button type="button" class="btn danger mini" onclick="deleteSelectedHistory()" ${historySelected.size ? "" : "disabled"}>DELETE SELECTED</button>
        <button type="button" class="btn danger mini history-delete-all" onclick="deleteAllHistory()" ${S.history.length ? "" : "disabled"}>DELETE ALL</button>
      </div>
    </div>

    <div class="history-list">

      ${historyListHTML()}

    </div>
    `,
    "history"
  );
}


function resetHistoryFilters() {
  historyFilters = { archer: defaultArcher() || "ALL", period: "7", distance: "30" };
  historySelected.clear();
  historyPage();
}

function toggleHistorySelection(index, checked) {
  if (checked) historySelected.add(index);
  else historySelected.delete(index);

  // Keep the user at the selected History card instead of re-rendering
  // the whole page and jumping back to the header.
  const input = document.activeElement?.matches?.('.history-select input')
    ? document.activeElement
    : null;
  const card = input?.closest?.('.history-item');
  if (card) card.classList.toggle('selected', checked);

  const count = document.getElementById('historySelectedCount');
  if (count) count.textContent = `${historySelected.size} selected`;

  const deleteSelected = document.querySelector('.history-bulk-actions .btn:not(.history-delete-all)');
  if (deleteSelected) deleteSelected.disabled = historySelected.size === 0;
}

function deleteSelectedHistory() {
  const indexes = [...historySelected].filter(i => S.history[i]).sort((a,b) => b-a);
  if (!indexes.length) return;
  if (!confirm(`Delete ${indexes.length} selected practice session${indexes.length === 1 ? "" : "s"}?\n\nThis action cannot be undone.`)) return;
  indexes.forEach(i => S.history.splice(i, 1));
  historySelected.clear();
  save();
  historyPage();
}


function deleteAllHistory() {
  if (!S.history.length) return;
  if (!confirm(`Delete ALL ${S.history.length} practice sessions?\n\nThis action cannot be undone.`)) return;
  S.history = [];
  historySelected.clear();
  save();
  historyPage();
}


function historyDistances() {

  const values = [];

  S.history.forEach(h => {
    const setup = h?.setup || {};

    // Single-distance sessions.
    const single = Number(setup.distance);
    if (single) values.push(single);

    // Multiple-distance sessions: expose every distance ever used so
    // each one can be selected independently in Practice History.
    const multiDistances =
      setup.multi?.distances ||
      h.multi?.distances ||
      [];

    if (Array.isArray(multiDistances)) {
      multiDistances.forEach(d => {
        const n = Number(d);
        if (n) values.push(n);
      });
    }
  });

  values.push(30);

  return [...new Set(values)].sort((a, b) => a - b);
}


function filteredHistory() {

  const now =
    Date.now();


  return S.history
    .map(
      (
        h,
        index
      ) => ({
        h,
        index
      })
    )
    .filter(
      item => {

        const h =
          item.h;


        if (
          historyFilters.archer !==
            "ALL" &&
          !h.archers?.some(
            a =>
              a.name ===
              historyFilters.archer
          )
        ) {

          return false;
        }


        if (historyFilters.distance !== "ALL") {

          const wantedDistance = Number(historyFilters.distance);
          const setup = h.setup || {};
          const sessionDistances = [];

          const singleDistance = Number(setup.distance);
          if (singleDistance) sessionDistances.push(singleDistance);

          const multiDistances =
            setup.multi?.distances ||
            h.multi?.distances ||
            [];

          if (Array.isArray(multiDistances)) {
            multiDistances.forEach(d => {
              const n = Number(d);
              if (n) sessionDistances.push(n);
            });
          }

          if (!sessionDistances.includes(wantedDistance)) {
            return false;
          }
        }


        if (
          historyFilters.period !==
          "ALL"
        ) {

          const days =
            Number(
              historyFilters.period
            );


          const date =
            new Date(
              h.completedAt ||
              h.date
            ).getTime();


          const diff =
            now - date;


          if (
            diff >
            days *
            86400000
          ) {

            return false;
          }
        }


        return true;
      }
    );
}


function historyListHTML() {

  const list =
    filteredHistory();


  if (
    !list.length
  ) {

    return `
      <section class="card">

        <div class="notice">
          No practice history found.
        </div>

      </section>
    `;
  }


  return list
    .map(
      item => {

        const h =
          item.h;


        const index =
          item.index;


        const dt =
          shortDateTime(
            h.completedAt ||
            h.date
          );


        const ranking =
          historyRanking(h);


        const leader =
          ranking[0];


        return `
          <section class="card history-item ${historySelected.has(index) ? "selected" : ""}">
            <label class="history-select" onclick="event.stopPropagation()">
              <input type="checkbox" ${historySelected.has(index) ? "checked" : ""} onchange="toggleHistorySelection(${index}, this.checked)">
            </label>

            <div
              class="history-open"
              role="button"
              tabindex="0"
              onclick="detailedResult(${index}, 'history')"
              onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();detailedResult(${index}, 'history')}"
            >

              <div class="history-date">

                <b>
                  ${dt.date}
                </b>

                <span>
                  ${dt.day} •
                  ${dt.time}
                </span>

              </div>


              <div class="history-format">

                <b>
                  ${h.setup?.practiceType && h.setup.practiceType !== "target"
                    ? `${String(h.setup.practiceType).toUpperCase()} GAME`
                    : `${h.setup?.distanceMode === "multiple" ? resultDistanceText(h.setup) : `${h.setup?.distance || "-"}M`} • TF ${h.setup?.target || "-"}CM`}
                </b>

                <span>
                  ${h.setup?.practiceType && h.setup.practiceType !== "target"
                    ? `${h.setup?.arrows || "-"}A × ${h.setup?.checkPoints || h.setup?.ends || "-"}CP × ${h.setup?.rounds || "-"}R`
                    : `${h.setup?.arrows || "-"}A × ${h.setup?.ends || "-"}E × ${h.setup?.rounds || "-"}R`}
                </span>

              </div>


              <div class="history-result">

                <b>
                  ${leader ? `${leader.metrics.total} pts` : "-"}
                </b>

                ${!h.note ? `<div class="history-note-actions"><button class="history-note-inline" onclick="event.stopPropagation(); editHistoryNote(${index})">📝 ADD NOTE</button></div>` : ``}

              </div>

              ${h.note ? `
                <div class="history-note-row">
                  <span class="history-note-text">${esc(h.note)}</span>
                  <button class="history-note-icon" title="Edit note" aria-label="Edit note" onclick="event.stopPropagation(); editHistoryNote(${index})">✏️</button>
                  <button class="history-note-icon history-note-delete" title="Delete note" aria-label="Delete note" onclick="event.stopPropagation(); deleteHistoryNote(${index})">🗑️</button>
                </div>` : ``}

            </div>


          </section>
        `;
      }
    )
    .join("");
}


function historyRanking(h) {

  const setup =
    h.setup ||
    DEFAULT_SETUP;


  return (
    h.archers || []
  )
    .map(
      (
        archer,
        index
      ) => {

        const m =
          historyMetrics(
            archer,
            setup
          );


        return {
          archer,
          index,
          metrics: m
        };
      }
    )
    .sort(
      (a, b) =>

        b.metrics.total -
          a.metrics.total ||

        b.metrics.x -
          a.metrics.x ||

        b.metrics.ten -
          a.metrics.ten ||

        a.archer.name
          .localeCompare(
            b.archer.name
          )
    );
}


function historyMetrics(
  archer,
  setup
) {

  let total = 0;

  let x = 0;

  let ten = 0;

  let arrowsShot = 0;

  const rounds = [];


  const roundCount =
    Number(
      setup.rounds
    ) || 1;


  const endCount =
    Number(
      setup.ends
    ) || 1;


  const arrowCount =
    Number(
      setup.arrows
    ) || 1;


  for (
    let r = 0;
    r < roundCount;
    r++
  ) {

    let roundTotal = 0;


    for (
      let e = 0;
      e < endCount;
      e++
    ) {

      const values =
        archer.scores?.[
          r
        ]?.[
          e
        ] || [];


      values.forEach(
        v => {

          if (
            v === ""
          ) {

            return;
          }


          arrowsShot++;


          const value =
            scoreValue(v);


          total += value;

          roundTotal += value;


          if (
            v === "X"
          ) {

            x++;
          }


          if (
            v === "10"
          ) {

            ten++;
          }
        }
      );


    }


    rounds.push(
      roundTotal
    );
  }


  const max =
    roundCount *
    endCount *
    arrowCount *
    maxPointForMatrix(
      setup.matrix
    );


  return {

    total,

    x,

    ten,

    arrowsShot,

    rounds,

    max,

    avg:
      arrowsShot
        ? total /
          arrowsShot
        : 0,

    score:
      max
        ? total /
          max *
          100
        : 0
  };
}


/* =========================================================
   HISTORY NOTE / DELETE
   ========================================================= */

function editHistoryNote(index) {

  const h =
    S.history[index];


  if (!h) {
    return;
  }


  if (
    document.getElementById(
      "historyNoteDialog"
    )
  ) {

    return;
  }


  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "historyNoteDialog";


  overlay.className =
    "modal-overlay";


  overlay.innerHTML = `
    <div class="modal-card">

      <h3>
        PRACTICE NOTE
      </h3>


      <textarea
        id="historyNoteText"
        rows="5"
        placeholder="Add note for this session..."
      >${esc(h.note || "")}</textarea>


      <div class="modal-actions">

        <button
          class="btn green"
          onclick="
            saveHistoryNote(
              ${index}
            )
          "
        >
          SAVE NOTE
        </button>


        <button
          class="btn soft"
          onclick="
            closeModal(
              'historyNoteDialog'
            )
          "
        >
          CANCEL
        </button>

      </div>

    </div>
  `;


  document.body.appendChild(
    overlay
  );
}


function saveHistoryNote(
  index
) {

  const h =
    S.history[index];


  if (!h) {
    return;
  }


  const text =
    document.getElementById(
      "historyNoteText"
    )?.value.trim() || "";


  h.note =
    text;


  save();


  closeModal(
    "historyNoteDialog"
  );


  historyPage();
}


function deleteHistoryNote(index) {
  const h = S.history[index];
  if (!h || !h.note) return;
  if (!confirm("Delete this note?")) return;
  h.note = "";
  save();
  historyPage();
}


function deleteHistory(
  index
) {

  const h =
    S.history[index];


  if (!h) {
    return;
  }


  if (
    !confirm(
      "Delete this practice session?\n\n" +
      "This action cannot be undone."
    )
  ) {

    return;
  }


  S.history.splice(
    index,
    1
  );


  save();


  historyPage();
}


function resultMultiConfig(setup) {
  const m = setup?.multi || {};
  const distances = Array.isArray(m.distances) ? m.distances.map(Number).filter(Boolean) : [];
  const count = Math.max(1, Number(m.count) || distances.length || 1);
  const ds = distances.slice(0, count);
  while (ds.length < count) ds.push(Number(setup.distance) || 30);
  const ends = Array.isArray(m.endsByDistance) ? m.endsByDistance.slice(0, count).map(v => Math.max(1, Number(v) || 1)) : [];
  while (ends.length < count) ends.push(Math.max(1, Number(m.endsPerDistance) || Number(setup.ends) || 1));
  const sequences = Array.isArray(m.roundSequences) ? m.roundSequences : [];
  return { ...m, count, distances: ds, endsByDistance: ends, roundSequences: sequences };
}

function resultMultiBlocks(setup, roundNo) {
  const m = resultMultiConfig(setup);
  let order = m.distances.map((_, i) => i);
  const mode = String(m.roundSequences?.[roundNo - 1] || (roundNo % 2 ? 'ascending' : 'descending')).toLowerCase();
  if (mode === 'descending') order = [...order].reverse();
  let cursor = 1;
  return order.map(originalIndex => {
    const ends = m.endsByDistance[originalIndex];
    const block = { distance: m.distances[originalIndex], ends, start: cursor, end: cursor + ends - 1, originalIndex };
    cursor += ends;
    return block;
  });
}

function resultFormatLines(setup) {
  if (setup?.distanceMode !== 'multiple') return [];
  return Array.from({length: Math.max(1, Number(setup.rounds) || 1)}, (_, ri) => {
    const parts = resultMultiBlocks(setup, ri + 1).map(b => `${b.distance}m × ${b.ends}E`);
    return `R${ri + 1}: ${parts.join(' - ')}`;
  });
}

function resultDistanceText(setup) {
  if (setup?.distanceMode !== 'multiple') return `${setup.distance}m`;
  return resultMultiConfig(setup).distances.map(d => `${d}m`).join('/');
}

function scoreCountFor(archer, label) {
  let n = 0;
  archer?.scores?.flat(2).forEach(v => { if (String(v) === String(label)) n++; });
  return n;
}

function resultStatLabels(setup) {
  return topMatrixLabels(setup?.matrix || '10-1, X');
}

/* =========================================================
   DETAILED RESULTS
   ========================================================= */

function detailedResult(
  index,
  origin = null
) {

  if (origin) {
    detailedResultOrigin = origin;
  }

  const h =
    S.history[index];


  if (!h) {

    historyPage();

    return;
  }


  viewHistoryIndex =
    index;


  const setup =
    h.setup ||
    DEFAULT_SETUP;


  const ranking =
    historyRanking(h);


  const dt =
    shortDateTime(
      h.completedAt ||
      h.date
    );


  const title =
    h.title ||
    "Archery Detailed Results";


  page(
    `
    <div class="result-page">

      <div class="top result-top">

        <h1>
          DETAILED RESULT
        </h1>


        <button
          class="btn soft"
          onclick="backFromDetailedResults()"
        >
          ‹ Back
        </button>

      </div>


      <section
        class="card result-header-card"
      >

        <div class="result-brand">
          SCOREBOARD
        </div>


        <h2 class="result-title">
          ${esc(title)}
        </h2>


        <div class="result-meta">

          <span>
            <b>Date</b>
            ${dt.date}
            • ${dt.day}
            • ${dt.time}
          </span>


          ${
            h.location
              ? `
              <span>
                <b>Location</b>
                ${esc(h.location)}
              </span>
              `
              : ""
          }


          ${
            setup.group
              ? (() => {
                  const vals = [...new Set(Object.values(h.groups || {}).filter(Boolean))];
                  return vals.length
                    ? `<span><b>Group No.</b>${esc(vals.join(", "))}</span>`
                    : "";
                })()
              : ""
          }


          <span>
            <b>Distance</b>
            ${setup.practiceType !== "target" ? `${setup.gameMinDistance || 5}~${setup.gameMaxDistance || 30}m` : resultDistanceText(setup)}
          </span>

          ${setup.practiceType === "target" ? `<span><b>Target Face</b>${setup.target}cm</span>` : ""}


          <span>
            <b>Matrix</b>
            ${esc(setup.matrix)}
          </span>


          <span class="result-format-meta">
            <b>Format</b>
            ${setup.practiceType !== "target"
              ? `${setup.arrows}A × ${setup.checkPoints || setup.ends}CP × ${setup.rounds}R`
              : setup.distanceMode === "multiple"
                ? `${resultFormatLines(setup).map(line => `<em>${esc(line)}</em>`).join("")}<em>${setup.arrows} Arrows/End</em>`
                : `${setup.arrows}A × ${setup.ends}E × ${setup.rounds}R`}
          </span>

        </div>

      </section>


      <section class="card">

        <div class="section result-section-title">
          RANKING SUMMARY
        </div>


        <div class="responsive-scroll">

          <table class="result-ranking-table">

            <thead>

              <tr>

                <th>
                  Rank
                </th>

                <th>
                  Archer
                </th>

                ${
                  setup.lane
                    ? `
                    <th>
                      Lane
                    </th>
                    `
                    : ""
                }

                ${
                  setup.group
                    ? `
                    <th>
                      Group
                    </th>
                    `
                    : ""
                }

                <th>
                  Total
                </th>

                <th>${resultStatLabels(setup)[0]}</th>
                <th>${resultStatLabels(setup)[1]}</th>

                <th>
                  Avg
                </th>

                <th>
                  Score
                </th>

              </tr>

            </thead>


            <tbody>

              ${
                ranking
                  .map(
                    (
                      item,
                      rank
                    ) => {

                      const a =
                        item.archer;

                      const m =
                        item.metrics;


                      return `
                        <tr>

                          <td>
                            ${rank + 1}
                          </td>

                          <td>
                            <b>
                              ${esc(a.name)}
                            </b>
                          </td>

                          ${
                            setup.lane
                              ? `<td>${esc(h.lanes?.[a.name] || "-")}</td>`
                              : ""
                          }
                          ${
                            setup.group
                              ? `<td>${esc(h.groups?.[a.name] || h.groups?.["__personal__"] || "-")}</td>`
                              : ""
                          }

                          <td>
                            <b>
                              ${m.total}
                            </b>
                          </td>

                          <td>${scoreCountFor(a, resultStatLabels(setup)[0])}</td>
                          <td>${scoreCountFor(a, resultStatLabels(setup)[1])}</td>

                          <td>
                            ${m.avg.toFixed(2)}
                          </td>

                          <td>
                            ${m.score.toFixed(1)}%
                          </td>

                        </tr>
                      `;
                    }
                  )
                  .join("")
              }

            </tbody>

          </table>

        </div>

      </section>


      <section class="card">

        <div class="section result-section-title">
          DETAILED RESULTS
        </div>


        ${
          ranking
            .map(
              item =>
                detailedArcherHTML(
                  item.archer,
                  setup
                )
            )
            .join("")
        }

      </section>


      ${
        h.note
          ? `
          <section class="card result-note-card">

            <div class="section">
              PRACTICE NOTE
            </div>

            <p>
              ${esc(h.note)}
            </p>

          </section>
          `
          : ""
      }


      <div class="result-actions">

        <button
          class="btn soft"
          onclick="
            editResultTitle(
              ${index}
            )
          "
        >
          EDIT TITLE
        </button>


        <button
          class="btn green"
          onclick="
            shareSummary(
              ${index}
            )
          "
        >
          SHARE TO WHATSAPP
        </button>


        <button
          class="btn primary"
          onclick="
            window.print()
          "
        >
          PRINT / SAVE PDF
        </button>

      </div>


      <div class="footer result-footer">
        Developed by Abu Danial
      </div>

    </div>
    `,
    "detail"
  );
}


function detailedArcherHTML(archer, setup) {
  const m = historyMetrics(archer, setup);
  const statLabels = resultStatLabels(setup);
  const isMulti = setup.distanceMode === "multiple";

  const sections = [];
  for (let ri = 0; ri < Math.max(1, Number(setup.rounds) || 1); ri++) {
    const round = archer.scores?.[ri] || [];
    const blocks = isMulti
      ? resultMultiBlocks(setup, ri + 1)
      : [{ distance: Number(setup.distance) || 0, ends: Number(setup.ends) || 1, start: 1, end: Number(setup.ends) || 1 }];

    blocks.forEach(block => {
      let blockTotal = 0;
      const rows = Array.from({length: block.ends}, (_, localIndex) => {
        const globalEndIndex = block.start - 1 + localIndex;
        const values = round[globalEndIndex] || Array(Number(setup.arrows) || 1).fill("");
        const total = values.reduce((sum, v) => sum + scoreValue(v), 0);
        blockTotal += total;
        return `<tr><td>${localIndex + 1}</td>${[...values].sort((a,b)=>scoreValue(b)-scoreValue(a)).map(v=>`<td>${v || "-"}</td>`).join("")}<td><b>${total}</b></td></tr>`;
      }).join("");

      sections.push(`
        <div class="result-round">
          <h4>ROUND ${ri + 1}${isMulti ? ` - ${block.distance}m` : ""}</h4>
          <div class="responsive-scroll"><table class="detail-table">
            <thead><tr><th>${setup.practiceType !== "target" ? "CP" : "End"}</th>${Array.from({length:Number(setup.arrows)||1},(_,ai)=>`<th>${ai+1}</th>`).join("")}<th>Total</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td colspan="${(Number(setup.arrows)||1)+1}">${isMulti ? `${block.distance}m TOTAL` : `ROUND ${ri+1} TOTAL`}</td><td><b>${blockTotal}</b></td></tr></tfoot>
          </table></div>
        </div>`);
    });
  }

  return `<div class="result-archer">
    <h3>${esc(archer.name)}</h3>
    ${sections.join("")}
    <div class="result-archer-total">
      <span><b>TOTAL</b>${m.total}</span>
      <span><b>${statLabels[0]}</b>${scoreCountFor(archer, statLabels[0])}</span>
      <span><b>${statLabels[1]}</b>${scoreCountFor(archer, statLabels[1])}</span>
      <span><b>AVG</b>${m.avg.toFixed(2)}</span>
      <span><b>SCORE</b>${m.score.toFixed(1)}%</span>
    </div>
    <div class="session-breakdown-block"><div class="section session-breakdown-title">ACCURACY & POINT BREAKDOWN</div>${archerSessionBreakdownHTML(archer, setup.matrix)}</div>
  </div>`;
}

function archerSessionBreakdownHTML(archer, matrix) {
  const counts = {};
  let totalArrows = 0;

  archer.scores?.flat(2).forEach(v => {
    if (v === "") return;
    counts[v] = (counts[v] || 0) + 1;
    totalArrows++;
  });

  if (!totalArrows) return `<div class="notice">No scoring data yet.</div>`;

  const groups = [...matrixValues(matrix), "M"].map(value => ({ label: value, values: [value] }));

  return `<div class="breakdown-list">${groups.map(group => {
    const count = group.values.reduce((sum, value) => sum + (counts[value] || 0), 0);
    const pct = count / totalArrows * 100;
    return `
      <div class="breakdown-row">
        <div class="breakdown-label"><b>${group.label}</b><span>${count}</span></div>
        <div class="breakdown-track"><div class="breakdown-fill" style="width:${pct}%;"></div></div>
        <div class="breakdown-pct">${pct.toFixed(1)}%</div>
      </div>`;
  }).join("")}</div>`;
}


/* =========================================================
   EDIT RESULT TITLE
   ========================================================= */

function editResultTitle(
  index
) {

  const h =
    S.history[index];


  if (!h) {
    return;
  }


  if (
    document.getElementById(
      "resultTitleDialog"
    )
  ) {

    return;
  }


  const current =
    h.title ||
    "Archery Detailed Results";


  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "resultTitleDialog";


  overlay.className =
    "modal-overlay";


  overlay.innerHTML = `
    <div class="modal-card">

      <h3>
        EDIT TITLE
      </h3>


      <label class="field-label">
        Current Title
      </label>


      <div class="current-title-box">
        ${esc(current)}
      </div>


      <label class="field-label">
        New Title
      </label>


      <input
        id="newResultTitle"
        value=""
        placeholder="Enter new title"
      >


      <div class="modal-actions">

        <button
          class="btn green"
          onclick="
            saveResultTitle(
              ${index}
            )
          "
        >
          SAVE
        </button>


        <button
          class="btn soft"
          onclick="
            closeModal(
              'resultTitleDialog'
            )
          "
        >
          CANCEL
        </button>

      </div>

    </div>
  `;


  document.body.appendChild(
    overlay
  );
}


function saveResultTitle(
  index
) {

  const h =
    S.history[index];


  if (!h) {
    return;
  }


  const value =
    document.getElementById(
      "newResultTitle"
    )?.value.trim();


  if (!value) {

    alert(
      "Enter report title."
    );

    return;
  }


  h.title =
    value;

  // An edited Detailed Result title is also stored as the Practice History note.
  h.note =
    value;

  // Keep the active completed session in sync when the result was opened
  // directly from Scoring.
  if (S.session && S.session.id === h.id) {
    S.session.title = value;
    S.session.note = value;
  }


  save();


  closeModal(
    "resultTitleDialog"
  );


  detailedResult(
    index,
    detailedResultOrigin
  );
}


/* =========================================================
   WHATSAPP SUMMARY
   ========================================================= */

function shareSummary(
  index = viewHistoryIndex
) {

  const h =
    S.history[index];


  if (!h) {

    alert(
      "Practice result not found."
    );

    return;
  }


  const setup =
    h.setup ||
    DEFAULT_SETUP;


  const ranking =
    historyRanking(h);


  const dt =
    shortDateTime(
      h.completedAt ||
      h.date
    );


  const lines = [];


  const customShareTitle = String(h.title || "").trim();
  const defaultResultTitles = ["Archery Detailed Results", "Archery Practice Result", "Archery Practice Summary"];
  const shareTitle = customShareTitle && !defaultResultTitles.includes(customShareTitle)
    ? customShareTitle
    : "Archery Practice Result";

  lines.push(
    `🎯 *${shareTitle}*`
  );


  let dateLine =
    `${dt.date} | ` +
    `${dt.day} | ` +
    `${dt.time}`;


  if (
    setup.lane &&
    ranking.length === 1
  ) {

    const lane =
      h.lanes?.[
        ranking[0]
          .archer.name
      ];


    if (lane) {

      dateLine +=
        ` | Lane ${lane}`;
    }
  }

  if (setup.group && ranking.length === 1 && setup.practiceType === "target") {
    const groupNo =
      h.groups?.[ranking[0].archer.name] ||
      h.groups?.["__personal__"];
    if (groupNo) dateLine += ` | Group ${groupNo}`;
  }


  lines.push(
    dateLine
  );


  if (setup.practiceType !== "target") {
    let gameLine = `${setup.practiceType.toUpperCase()} GAME | ${setup.gameMinDistance || 5}~${setup.gameMaxDistance || 30}m | ${setup.matrix}`;
    if (setup.group) {
      const firstArcher = ranking[0]?.archer?.name;
      const groupNo = h.groups?.[firstArcher] || h.groups?.["__personal__"];
      if (groupNo) gameLine += ` | Group ${groupNo}`;
    }
    lines.push(gameLine);
    lines.push(`${setup.arrows}A x ${setup.checkPoints || setup.ends}CP x ${setup.rounds}R`);
  } else if (setup.distanceMode === "multiple") {
    lines.push(`${resultDistanceText(setup)} | ${setup.target}cm | ${setup.matrix}`);
    resultFormatLines(setup).forEach(line => lines.push(String(line).replace(/\s+-\s+/g, " → ")));
    lines.push(`${setup.arrows} Arrows/End`);
  } else {
    lines.push(`${setup.distance}m | ${setup.target}cm | ${setup.matrix} | ${setup.arrows}A x ${setup.ends}E x ${setup.rounds}R`);
  }


  lines.push(
    "--------------------------------------------------"
  );


  ranking.forEach(
    (
      item,
      rank
    ) => {

      const a =
        item.archer;


      const m =
        item.metrics;


      lines.push(
        `*${rank + 1}. ${a.name}*: ` +
        `${m.total} pts`
      );


      const roundText =
        m.rounds
          .map(
            (
              total,
              ri
            ) =>
              `R${ri + 1}:${total}`
          )
          .join(" | ");


      const statLabels = resultStatLabels(setup);
      const distanceText = setup.distanceMode === "multiple"
        ? Array.from({length: Math.max(1, Number(setup.rounds)||1)}, (_,ri) => {
            const rt = resultMultiBlocks(setup, ri+1).map(b => {
              let t = 0;
              for (let e=b.start-1; e<b.end; e++) (a.scores?.[ri]?.[e] || []).forEach(v => t += scoreValue(v));
              return `${b.distance}m:${t}`;
            }).join(" | ");
            return `R${ri+1} [${rt}]`;
          }).join(" | ")
        : roundText;
      let detail =
        `     └ ${distanceText}` +
        ` | ${statLabels[0]}:${scoreCountFor(a, statLabels[0])}` +
        ` | ${statLabels[1]}:${scoreCountFor(a, statLabels[1])}` +
        ` | Avg:${m.avg.toFixed(2)}` +
        ` | Score: ${m.score.toFixed(1)}%`;


      if (
        setup.lane &&
        ranking.length > 1
      ) {

        const lane =
          h.lanes?.[
            a.name
          ];


        if (lane) {

          detail +=
            ` | Lane:${lane}`;
        }
      }

      if (setup.group && ranking.length > 1) {
        const groupNo =
          h.groups?.[a.name] ||
          h.groups?.["__personal__"];
        if (groupNo) detail += ` | Group:${groupNo}`;
      }


      lines.push(
        detail
      );


      lines.push("");
    }
  );


  lines.push(
    "--------------------------------------------------"
  );


  lines.push(
    "App: SCOREBOARD"
  );


  if (
    h.location
  ) {

    lines.push(
      `Loc: ${h.location}`
    );
  }


  const text =
    lines.join("\n");


  const url =
    "https://wa.me/?text=" +
    encodeURIComponent(
      text
    );


  window.open(
    url,
    "_blank"
  );
}


/* =========================================================
   LOCATION NAME
   ========================================================= */

async function resolveLocationName(
  lat,
  lon
) {

  /*
   * GPS coordinates are stored even when
   * reverse geocoding is unavailable.
   *
   * The application intentionally does not
   * force a default location such as Putatan.
   */

  try {

    const controller =
      new AbortController();


    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        5000
      );


    const response =
      await fetch(
        "https://nominatim.openstreetmap.org/reverse" +
        `?format=jsonv2&lat=${encodeURIComponent(lat)}` +
        `&lon=${encodeURIComponent(lon)}`,
        {
          signal:
            controller.signal,
          headers: {
            "Accept":
              "application/json"
          }
        }
      );


    clearTimeout(
      timeout
    );


    if (
      !response.ok
    ) {

      return "";
    }


    const data =
      await response.json();


    const address =
      data.address ||
      {};


    const town =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      "";


    const state =
      address.state ||
      "";


    if (
      town &&
      state &&
      town !== state
    ) {

      return `${town}, ${state}`;
    }


    return (
      town ||
      state ||
      data.display_name ||
      ""
    );

  } catch {

    return "";
  }
}


/* =========================================================
   UPDATE GPS LOCATION AFTER CAPTURE
   ========================================================= */

async function updateSessionLocation(
  session,
  lat,
  lon
) {

  if (
    !session ||
    !S.gps
  ) {

    return;
  }


  const name =
    await resolveLocationName(
      lat,
      lon
    );


  if (
    name
  ) {

    session.location =
      name;


    saveUnfinished();
  }
}


/* =========================================================
   PROFILE HELPERS
   ========================================================= */

function profileSessions(
  archerName
) {

  return S.history
    .filter(
      h =>
        h.archers?.some(
          a =>
            a.name ===
            archerName
        )
    )
    .sort(
      (a, b) =>
        new Date(
          a.completedAt ||
          a.date
        ) -
        new Date(
          b.completedAt ||
          b.date
        )
    );
}


function profileScoreForSession(
  h,
  archerName
) {

  const a =
    h.archers?.find(
      x =>
        x.name ===
        archerName
    );


  if (!a) {

    return null;
  }


  return historyMetrics(
    a,
    h.setup ||
    DEFAULT_SETUP
  );
}


/* =========================================================
   ARCHER PROFILE
   ========================================================= */

function profiles() {

  const names = [
    ...new Set(
      [
        ...S.archers,

        ...S.history.flatMap(
          h =>
            h.archers?.map(
              a => a.name
            ) || []
        )
      ]
    )
  ];


  if (
    !profileArcher ||
    !names.includes(
      profileArcher
    )
  ) {

    profileArcher =
      defaultArcher() ||
      names[0] ||
      "";
  }


  const sessions =
    profileArcher
      ? profileSessions(
          profileArcher
        )
      : [];

  const availableProfileMatrices = [...new Set([
    "10-1, X",
    ...sessions.map(h => h.setup?.matrix).filter(Boolean)
  ])];
  if (!availableProfileMatrices.includes(profileMatrix)) profileMatrix = "10-1, X";


  page(
    `
    ${head("ARCHER PROFILE")}


    <section class="card">

      <div class="profile-select-row">

        <div>

          <label class="field-label">
            Select Archer
          </label>


          <select
            id="profileArcher"
            onchange="
              profileArcher=
                this.value;
              profiles()
            "
          >

            ${
              names.length

                ? names
                    .map(
                      n => `
                      <option
                        value="${esc(n)}"
                        ${
                          n ===
                          profileArcher
                            ? "selected"
                            : ""
                        }
                      >
                        ${esc(n)}
                      </option>
                      `
                    )
                    .join("")

                : `
                <option value="">
                  No Archer
                </option>
                `
            }

          </select>

        </div>


        <button
          class="profile-delete"
          onclick="
            deleteProfileArcher()
          "
          title="Delete Archer"
          ${
            profileArcher
              ? ""
              : "disabled"
          }
        >
          🗑
        </button>

      </div>

    </section>


    ${
      profileArcher

        ? `
        <section class="card">

          <div class="section-row">

            <div class="section">
              SCORE TREND (%)
            </div>

            <button class="profile-info-link" onclick="showScoreTrendInfo()">Info</button>

          </div>


          <div class="profile-period-tabs">

            <button
              class="${
                profilePeriod ===
                  "weekly"
                  ? "active"
                  : ""
              }"
              onclick="
                profilePeriod='weekly';
                profiles()
              "
            >
              WEEKLY
            </button>


            <button
              class="${
                profilePeriod ===
                  "monthly"
                  ? "active"
                  : ""
              }"
              onclick="
                profilePeriod='monthly';
                profiles()
              "
            >
              MONTHLY
            </button>


            <button
              class="${
                profilePeriod ===
                  "yearly"
                  ? "active"
                  : ""
              }"
              onclick="
                profilePeriod='yearly';
                profiles()
              "
            >
              YEARLY
            </button>

          </div>


          ${profileTrendHTML(
            sessions
          )}

        </section>


        <section class="card">

          <div class="section">
            PERSONAL BEST SCORES (per distance)
          </div>


          ${personalBestHTML(
            sessions
          )}

        </section>


        <section class="card">

          <div class="section">
            ACCURACY & POINT BREAKDOWN
          </div>


          <div class="matrix-buttons">

            ${
              [...new Set([
                "10-1, X",
                ...sessions.map(h => h.setup?.matrix).filter(m => m && m !== "10-1, X")
              ])]
                .map(
                  matrix => `
                  <button
                    class="
                      matrix-btn
                      ${
                        profileMatrix ===
                          matrix
                          ? "active"
                          : ""
                      }
                    "
                    onclick="
                      profileMatrix=
                        '${escAttr(matrix)}';
                      rerenderKeepScroll(profiles)
                    "
                  >
                    ${matrix}
                  </button>
                  `
                )
                .join("")
            }

          </div>


          ${profileBreakdownHTML(
            sessions
          )}

        </section>
        `

        : `
        <section class="card">

          <div class="notice">
            No Archer Profile available.
          </div>

        </section>
        `
    }
    `,
    "profiles"
  );
}


/* =========================================================
   DELETE PROFILE ARCHER
   ========================================================= */

function deleteProfileArcher() {

  if (
    !profileArcher
  ) {

    return;
  }


  if (
    !confirm(
      `Delete "${profileArcher}" from Archer List?\n\n` +
      "Practice History will not be deleted."
    )
  ) {

    return;
  }


  S.archers =
    S.archers.filter(
      n =>
        n !==
        profileArcher
    );


  S.active =
    S.active.filter(
      n =>
        n !==
        profileArcher
    );


  if (
    defaultArcher() ===
    profileArcher
  ) {

    localStorage.removeItem(
      "as_default_archer"
    );
  }


  save();


  profileArcher =
    "";


  profiles();
}


/* =========================================================
   PROFILE TREND
   ========================================================= */

function profileTrendHTML(
  sessions
) {

  const grouped =
    groupProfileSessions(
      sessions,
      profilePeriod
    );


  if (
    !grouped.length
  ) {

    return `
      <div class="notice">
        No practice data yet.
      </div>
    `;
  }


  const maxBars =
    12;


  const data =
    grouped.slice(
      -maxBars
    );


  return `
    <div class="trend-chart">

      ${
        data
          .map(
            item => {

              const value =
                Math.max(
                  0,
                  Math.min(
                    100,
                    item.score
                  )
                );


              return `
                <div class="trend-item">

                  <div class="trend-value">
                    ${value.toFixed(1)}%
                  </div>


                  <div class="trend-bar-wrap">

                    <div
                      class="trend-bar ${value < 50 ? "trend-average" : value < 80 ? "trend-good" : "trend-best"}"
                      style="
                        height:
                        ${Math.max(
                          3,
                          value
                        )}%;
                      "
                    >
                    </div>

                  </div>


                  <div class="trend-label">
                    ${esc(item.label)}
                  </div>

                </div>
              `;
            }
          )
          .join("")
      }

    </div>
    <div class="trend-legend">
      <span><i class="legend-dot legend-best"></i>80–100% Best</span>
      <span><i class="legend-dot legend-good"></i>50–79% Good</span>
      <span><i class="legend-dot legend-average"></i>1–49% Average</span>
    </div>
  `;
}

function showScoreTrendInfo() {
  if (document.getElementById("scoreTrendInfoDialog")) return;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "scoreTrendInfoDialog";
  overlay.innerHTML = `
    <div class="modal-card profile-info-modal">
      <div class="score-info-lang-row">
        <button class="score-info-lang active" data-lang="bm" onclick="setScoreTrendInfoLang('bm')">BM</button>
        <button class="score-info-lang" data-lang="eng" onclick="setScoreTrendInfoLang('eng')">ENG</button>
      </div>

      <div class="score-info-copy" data-copy-lang="bm">
        <div class="score-info-section-title">SCORE %</div>
        <div class="score-info-body">
          <p>Peratus markah sebenar yang diperoleh berbanding markah maksimum yang boleh dicapai berdasarkan format latihan dan scoring matrix. Contoh:</p>
          <div class="score-info-example">
            Format: 6A × 6E × 1R • 10-1, X<br>
            Markah Maksimum: 6 × 6 × 10 = 360<br>
            Markah Akhir: 280<br>
            Formula: (280 ÷ 360) × 100<br>
            <strong>Score: 77.8%</strong>
          </div>
        </div>

        <div class="score-info-section-title">AVERAGE PER ARROW (AVG)</div>
        <div class="score-info-body">
          <p>Purata mata yang diperoleh bagi setiap anak panah yang telah direkodkan. Contoh:</p>
          <div class="score-info-example">
            Jumlah Markah: 280<br>
            Jumlah Arrow: 6 × 6 = 36<br>
            Formula: 280 ÷ 36 = 7.78<br>
            <strong>Average per Arrow: 7.78</strong>
          </div>
        </div>
      </div>

      <div class="score-info-copy" data-copy-lang="eng" hidden>
        <div class="score-info-section-title">SCORE %</div>
        <div class="score-info-body">
          <p>The percentage of the actual score achieved compared with the maximum possible score based on the practice format and scoring matrix. Example:</p>
          <div class="score-info-example">
            Format: 6A × 6E × 1R • 10-1, X<br>
            Maximum Score: 6 × 6 × 10 = 360<br>
            Final Score: 280<br>
            Formula: (280 ÷ 360) × 100<br>
            <strong>Score: 77.8%</strong>
          </div>
        </div>

        <div class="score-info-section-title">AVERAGE PER ARROW (AVG)</div>
        <div class="score-info-body">
          <p>The average points obtained for each arrow that has been recorded. Example:</p>
          <div class="score-info-example">
            Total Score: 280<br>
            Total Arrows: 6 × 6 = 36<br>
            Formula: 280 ÷ 36 = 7.78<br>
            <strong>Average per Arrow: 7.78</strong>
          </div>
        </div>
      </div>

      <button class="btn blue" onclick="closeModal('scoreTrendInfoDialog')">CLOSE</button>
    </div>`;
  document.body.appendChild(overlay);
}

function setScoreTrendInfoLang(lang) {
  const modal = document.getElementById("scoreTrendInfoDialog");
  if (!modal) return;
  modal.querySelectorAll("[data-copy-lang]").forEach(el => {
    el.hidden = el.dataset.copyLang !== lang;
  });
  modal.querySelectorAll(".score-info-lang").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}


function groupProfileSessions(
  sessions,
  period
) {

  const map =
    new Map();


  sessions.forEach(
    h => {

      const d =
        new Date(
          h.completedAt ||
          h.date
        );


      const metric =
        profileScoreForSession(
          h,
          profileArcher
        );


      if (!metric) {
        return;
      }


      let key = "";

      let label = "";


      if (
        period ===
        "weekly"
      ) {

        key =
          `${d.getFullYear()}-` +
          `${pad2(
            d.getMonth() + 1
          )}-` +
          `${pad2(
            d.getDate()
          )}`;

        label =
          `${pad2(
            d.getDate()
          )}/` +
          `${pad2(
            d.getMonth() + 1
          )}`;

      } else if (
        period ===
        "monthly"
      ) {

        const first =
          new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate() -
              d.getDay()
          );


        key =
          first.toISOString()
            .slice(
              0,
              10
            );


        label =
          `${pad2(
            first.getDate()
          )}/` +
          `${pad2(
            first.getMonth() + 1
          )}`;

      } else {

        key =
          `${d.getFullYear()}-` +
          `${pad2(
            d.getMonth() + 1
          )}`;

        label =
          d.toLocaleDateString(
            "en-US",
            {
              month: "short",
              year: "2-digit"
            }
          );
      }


      if (
        !map.has(key)
      ) {

        map.set(
          key,
          {
            label,
            total:
              0,
            count:
              0
          }
        );
      }


      const item =
        map.get(key);


      item.total +=
        metric.score;

      item.count++;
    }
  );


  return [
    ...map.values()
  ].map(
    item => ({
      label:
        item.label,
      score:
        item.count
          ? item.total /
            item.count
          : 0
    })
  );
}


/* =========================================================
   PERSONAL BEST
   ========================================================= */

function personalBestHTML(
  sessions
) {

  const best = new Map();

  sessions.forEach(h => {
    const setup = h.setup || DEFAULT_SETUP;
    const archer = h.archers?.find(x => x.name === profileArcher);
    if (!archer) return;

    const historyIndex = S.history.indexOf(h);
    const date = h.completedAt || h.date;

    if (setup.distanceMode === "multiple") {
      const distances = [...new Set((setup.multi?.distances || []).map(Number).filter(Boolean))];

      distances.forEach(distance => {
        let total = 0;
        let arrowsShot = 0;
        const rounds = Math.max(1, Number(setup.rounds) || 1);

        for (let r = 1; r <= rounds; r++) {
          resultMultiBlocks(setup, r)
            .filter(b => Number(b.distance) === distance)
            .forEach(b => {
              for (let e = b.start - 1; e < b.end; e++) {
                (archer.scores?.[r - 1]?.[e] || []).forEach(v => {
                  if (v === "") return;
                  total += scoreValue(v);
                  arrowsShot++;
                });
              }
            });
        }

        if (!arrowsShot) return;
        const maxPoint = maxPointForMatrix(setup.matrix);
        const score = maxPoint > 0 ? (total / (arrowsShot * maxPoint)) * 100 : 0;
        const current = best.get(distance);

        if (!current || total > current.total) {
          best.set(distance, { total, score, date, historyIndex });
        }
      });

      return;
    }

    const metric = profileScoreForSession(h, profileArcher);
    if (!metric) return;

    const distance = Number(setup.distance) || 0;
    if (!distance) return;

    const current = best.get(distance);
    if (!current || metric.total > current.total) {
      best.set(distance, {
        total: metric.total,
        score: metric.score,
        date,
        historyIndex
      });
    }
  });


  if (
    !best.size
  ) {

    return `
      <div class="notice">
        No Personal Best recorded yet.
      </div>
    `;
  }


  return `
    <div class="pb-list">

      ${
        [
          ...best.entries()
        ]
          .sort(
            (
              a,
              b
            ) =>
              a[0] -
              b[0]
          )
          .map(
            (
              [
                distance,
                data
              ]
            ) => {

              const dt =
                shortDateTime(
                  data.date
                );


              return `
                <div class="pb-row pb-row-clickable" role="button" tabindex="0"
                  onclick="openPersonalBestResult(${data.historyIndex})"
                  onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openPersonalBestResult(${data.historyIndex})}">

                  <div>
                    <b>
                      ${distance}M
                    </b>

                    <small>
                      ${dt.date}
                    </small>
                  </div>


                  <div>
                    <b>
                      ${data.total} pts
                    </b>

                    <small>
                      ${data.score.toFixed(1)}%
                    </small>
                  </div>

                </div>
              `;
            }
          )
          .join("")
      }

    </div>
  `;
}


function openPersonalBestResult(index) {
  if (index < 0 || !S.history[index]) return;
  detailedResult(index, "profile");
}


/* =========================================================
   PROFILE POINT BREAKDOWN
   ========================================================= */

function profileBreakdownHTML(
  sessions
) {

  const counts = {};

  let totalArrows = 0;


  sessions.forEach(
    h => {

      if (
        h.setup?.matrix !==
        profileMatrix
      ) {

        return;
      }


      const a =
        h.archers?.find(
          x =>
            x.name ===
            profileArcher
        );


      if (!a) {
        return;
      }


      a.scores
        ?.flat(2)
        .forEach(
          v => {

            if (
              v === ""
            ) {

              return;
            }


            counts[v] =
              (
                counts[v] ||
                0
              ) + 1;


            totalArrows++;
          }
        );
    }
  );


  if (
    !totalArrows
  ) {

    return `
      <div class="notice">
        No ${esc(profileMatrix)}
        practice data yet.
      </div>
    `;
  }


  const groups = [...matrixValues(profileMatrix), "M"].map(value => ({ label: value, values: [value] }));

  return `
    <div class="breakdown-list">

      ${
        groups
          .map(
            group => {

              const count =
                group.values
                  .reduce(
                    (
                      sum,
                      value
                    ) =>
                      sum +
                      (
                        counts[
                          value
                        ] || 0
                      ),
                    0
                  );


              const pct =
                count /
                totalArrows *
                100;


              return `
                <div class="breakdown-row">

                  <div class="breakdown-label">

                    <b>
                      ${group.label}
                    </b>

                    <span>
                      ${count}
                    </span>

                  </div>


                  <div class="breakdown-track">

                    <div
                      class="breakdown-fill"
                      style="
                        width:
                        ${pct}%;
                      "
                    >
                    </div>

                  </div>


                  <div class="breakdown-pct">
                    ${pct.toFixed(1)}%
                  </div>

                </div>
              `;
            }
          )
          .join("")
      }

    </div>
  `;
}

/* =========================================================
   SETTINGS
   ========================================================= */

function settings() {

  if (!timerDraft) timerDraft = { ...S.timer };

  page(
    `
    ${head("SETTINGS")}


    <section class="card">

      <div class="section">
        DISPLAY
      </div>


      <label class="field-label">
        Font Size
      </label>


      <div class="setting-choice">

        ${
          [
            ["small", "Small"],
            ["normal", "Normal"],
            ["large", "Large"]
          ]
            .map(
              ([value, label]) => `
              <button
                class="
                  ${
                    S.font === value
                      ? "active"
                      : ""
                  }
                "
                onclick="
                  setFont(
                    '${value}'
                  )
                "
              >
                ${label}
              </button>
              `
            )
            .join("")
        }

      </div>

    </section>


    <section class="card">

      <div class="section">
        LOCATION
      </div>


      <label class="setting-toggle">

        <div>

          <b>
            Auto Detect GPS
          </b>

          <small>
            Add location to new practice sessions
            when permission is available.
          </small>

        </div>


        <input
          type="checkbox"
          ${
            S.gps
              ? "checked"
              : ""
          }
          onchange="
            setGPS(
              this.checked
            )
          "
        >

      </label>


      <p class="help">
        If OFF, permission is denied or location
        cannot be resolved, Loc is omitted from
        WhatsApp and Detailed Results.
      </p>

    </section>


    <section class="card">

      <div class="section">
        TIMER
      </div>


      <div class="settings-grid">

        <label>

          <span>
            Preparation
          </span>

          <div class="input-unit">

            <input
              id="timerPrepSetting"
              type="number"
              min="1"
              value="${timerDraft.prep}"
              oninput="timerSettingChanged()"
            >

            <span>
              sec
            </span>

          </div>

        </label>


        <label>

          <span>
            Shooting
          </span>

          <div class="input-unit">

            <input
              id="timerShootSetting"
              type="number"
              min="1"
              value="${timerDraft.shoot}"
              oninput="timerSettingChanged()"
            >

            <span>
              sec
            </span>

          </div>

        </label>


        <label>

          <span>
            Warning
          </span>

          <div class="input-unit">

            <input
              id="timerWarnSetting"
              type="number"
              min="1"
              value="${timerDraft.warn}"
              oninput="timerSettingChanged()"
            >

            <span>
              sec
            </span>

          </div>

        </label>

      </div>


      <label class="field-label">
        Whistle Volume
      </label>


      <div class="volume-row">

        <input
          id="whistleVolume"
          type="range"
          min="0"
          max="100"
          value="${timerDraft.volume ?? 100}"
          oninput="
            whistleVolumeValue.textContent=this.value + '%';
            timerSettingChanged()
          "
        >


        <b
          id="whistleVolumeValue"
        >
          ${timerDraft.volume ?? 100}%
        </b>

      </div>


      <div class="row">

        <button
          class="btn primary"
          onclick="
            testWhistle()
          "
        >
          TEST WHISTLE
        </button>

      </div>


      <div id="timerSaveActions" class="timer-save-actions ${timerDirty ? "show" : ""}">
        <button class="btn green" onclick="saveTimerDraft()">SAVE</button>
        <button class="btn soft" onclick="cancelTimerDraft()">CANCEL</button>
      </div>

      <p class="help">
        Whistle volume is limited by your
        phone/tablet system volume.
      </p>

    </section>


    <section class="card">

      <div class="section">
        DATA
      </div>


      <div class="settings-actions">

        <button
          class="btn primary"
          onclick="
            exportExcelDialog()
          "
        >
          EXPORT EXCEL
        </button>


        <button
          class="btn soft"
          onclick="
            exportBackup()
          "
        >
          BACKUP DATA
        </button>


        <label class="btn soft file-import-btn">

          RESTORE DATA

          <input
            type="file"
            accept=".json,application/json"
            onchange="
              restoreBackup(
                this
              )
            "
          >

        </label>

      </div>

    </section>


    <section class="card danger-zone">

      <div class="section">
        FACTORY RESET
      </div>


      <p>
        Delete all Archer Lists, Practice History,
        Presets, Settings and unfinished sessions
        stored on this device.
      </p>


      <button
        class="btn danger full"
        onclick="
          factoryReset()
        "
      >
        FACTORY RESET
      </button>

    </section>
    `,
    "settings"
  );
}


function setFont(value) {

  S.font = value;
  document.documentElement.classList.remove("font-small", "font-normal", "font-large");
  document.documentElement.classList.add(`font-${value}`);
  save();
  settings();
}


function setGPS(value) {

  S.gps =
    !!value;


  save();
}


function readTimerDraftFromForm() {
  const prep = document.getElementById("timerPrepSetting");
  const shoot = document.getElementById("timerShootSetting");
  const warn = document.getElementById("timerWarnSetting");
  const volume = document.getElementById("whistleVolume");
  timerDraft = {
    ...S.timer,
    prep: Math.max(1, Number(prep?.value) || 10),
    shoot: Math.max(1, Number(shoot?.value) || 120),
    warn: Math.max(1, Number(warn?.value) || 10),
    volume: Math.max(0, Math.min(100, Number(volume?.value) || 0))
  };
}

function timerSettingChanged() {
  readTimerDraftFromForm();
  timerDirty = true;
  document.getElementById("timerSaveActions")?.classList.add("show");
}

function saveTimerSettings() { saveTimerDraft(); }

function saveTimerDraft() {
  readTimerDraftFromForm();
  S.timer = { ...timerDraft };
  timerDirty = false;
  save();
  settings();
}

function cancelTimerDraft() {
  timerDraft = { ...S.timer };
  timerDirty = false;
  settings();
}


/* =========================================================
   WHISTLE
   ========================================================= */

function whistleAsset() {

  return "assets/referee-whistle.mp3?v=32";
}


function playWhistleOnce(
  maxDurationMs = null
) {

  const volume =
    Math.max(
      0,
      Math.min(
        1,
        (
          (timerDirty && timerDraft ? timerDraft.volume : S.timer.volume) ??
          100
        ) / 100
      )
    );


  /*
   * Use real whistle audio when
   * assets/referee-whistle.mp3 is available.
   */

  const audio =
    new Audio(
      whistleAsset()
    );


  audio.volume =
    volume;


  audio
    .play()
    .then(
      () => {
        if (
          Number.isFinite(maxDurationMs) &&
          maxDurationMs > 0
        ) {
          setTimeout(
            () => {
              try {
                audio.pause();
                audio.currentTime = 0;
              } catch {}
            },
            maxDurationMs
          );
        }
      }
    )
    .catch(
      () => {

        /*
         * Fallback tone only when the
         * whistle asset is unavailable
         * or cannot be played.
         */

        fallbackWhistleTone(
          volume
        );
      }
    );
}


function fallbackWhistleTone(
  volume = 1
) {

  try {

    audioCtx =
      audioCtx ||
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();


    const osc =
      audioCtx.createOscillator();


    const gain =
      audioCtx.createGain();


    osc.type =
      "sine";


    osc.frequency.value =
      1850;


    gain.gain.value =
      Math.min(
        0.25,
        volume * 0.25
      );


    osc.connect(
      gain
    );


    gain.connect(
      audioCtx.destination
    );


    osc.start();


    gain.gain
      .exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime +
        0.22
      );


    osc.stop(
      audioCtx.currentTime +
      0.23
    );

  } catch {
    /* no audio */
  }
}


function whistle(
  count = 1,
  maxDurationMs = null,
  gapMs = 500
) {

  for (
    let i = 0;
    i < count;
    i++
  ) {

    setTimeout(
      () =>
        playWhistleOnce(maxDurationMs),
      i * gapMs
    );
  }
}


function testWhistle() {

  // Short preview only; timer whistles keep their configured duration.
  whistle(1, 650);
}


/* =========================================================
   TIMER
   ========================================================= */

function timerPage() {

  if (
    !S.session
  ) {

    setup();

    return;
  }


  clearInterval(
    timerInt
  );


  timerInt =
    null;


  timerPaused =
    false;


  page(
    `
    <div class="timer-page">

      <div class="top">

        <h1>
          ARCHERY TIMER
        </h1>


        <button
          class="btn soft"
          onclick="
            scoring()
          "
        >
          ‹ Scoring
        </button>

      </div>


      <section
        id="timerDisplay"
        class="
          timer-display
          timer-idle
        "
      >

        <div
          id="timerStage"
          class="timer-stage"
        >
          READY
        </div>


        <div
          id="timerClock"
          class="timer-clock"
        >
          ${
            formatTimer(
              S.timer.prep
            )
          }
        </div>


        <div
          id="timerHint"
          class="timer-hint"
        >
          Press START
        </div>

      </section>


      <div class="timer-actions">

        <button
          class="btn green"
          onclick="
            startArcheryTimer()
          "
        >
          START
        </button>


        <button
          class="btn soft timer-pause-btn"
          onclick="
            pauseArcheryTimer()
          "
        >
          PAUSE / RESUME
        </button>


        <button
          class="btn danger"
          onclick="
            resetArcheryTimer()
          "
        >
          RESET
        </button>

      </div>


      <section class="card">

        <div class="timer-legend">

          <span>
            🔴 Preparation
          </span>

          <span>
            🟢 Shooting
          </span>

          <span>
            🟠 Warning
          </span>

          <span>
            🔴 Stop
          </span>

        </div>

      </section>

    </div>
    `,
    "timer"
  );
}


function formatTimer(
  seconds
) {

  seconds =
    Math.max(
      0,
      Math.ceil(seconds)
    );


  const min =
    Math.floor(
      seconds / 60
    );


  const sec =
    seconds % 60;


  return (
    `${pad2(min)}:` +
    `${pad2(sec)}`
  );
}


function timerRender(
  stage,
  seconds,
  className,
  hint = ""
) {

  const display =
    document.getElementById(
      "timerDisplay"
    );


  const stageEl =
    document.getElementById(
      "timerStage"
    );


  const clock =
    document.getElementById(
      "timerClock"
    );


  const hintEl =
    document.getElementById(
      "timerHint"
    );


  if (display) {

    display.className =
      `timer-display ${className}`;
  }


  if (stageEl) {

    stageEl.textContent =
      stage;
  }


  if (clock) {

    clock.textContent =
      formatTimer(
        seconds
      );
  }


  if (hintEl) {

    hintEl.textContent =
      hint;
  }
}


function startArcheryTimer() {

  clearInterval(
    timerInt
  );


  timerPaused =
    false;


  const prep =
    Math.max(
      1,
      Number(
        S.timer.prep
      ) || 10
    );


  const shoot =
    Math.max(
      1,
      Number(
        S.timer.shoot
      ) || 120
    );


  const warning =
    Math.max(
      1,
      Math.min(
        shoot,
        Number(
          S.timer.warn
        ) || 10
      )
    );


  let stage =
    "prep";


  let remaining =
    prep;


  whistle(2);


  timerRender(
    "PREPARATION",
    remaining,
    "timer-prep",
    "Get ready"
  );


  timerInt =
    setInterval(
      () => {

        if (
          timerPaused
        ) {

          return;
        }


        remaining--;


        if (
          stage ===
            "prep" &&
          remaining <= 0
        ) {

          stage =
            "shoot";


          remaining =
            shoot;


          whistle(1);


          timerRender(
            "SHOOTING",
            remaining,
            "timer-shoot",
            "Start shooting"
          );


          return;
        }


        if (
          stage ===
            "shoot"
        ) {

          if (
            remaining ===
            warning
          ) {

            timerRender(
              "WARNING",
              remaining,
              "timer-warning",
              "Time running out"
            );

          } else {

            timerRender(
              remaining <=
                warning
                ? "WARNING"
                : "SHOOTING",

              remaining,

              remaining <=
                warning
                ? "timer-warning"
                : "timer-shoot",

              remaining <=
                warning
                ? "Time running out"
                : "Shooting"
            );
          }


          if (
            remaining <= 0
          ) {

            clearInterval(
              timerInt
            );


            timerInt =
              null;


            whistle(
              2,
              null,
              1250
            );


            if (
              navigator.vibrate &&
              S.timer.vibration
            ) {

              navigator.vibrate(
                [
                  200,
                  100,
                  200,
                  100,
                  200
                ]
              );
            }


            timerRender(
              "STOP",
              0,
              "timer-stop",
              "End complete"
            );
          }

        } else {

          timerRender(
            "PREPARATION",
            remaining,
            "timer-prep",
            "Get ready"
          );
        }

      },
      1000
    );
}


function pauseArcheryTimer() {

  if (
    !timerInt
  ) {

    return;
  }


  timerPaused =
    !timerPaused;


  const hint =
    document.getElementById(
      "timerHint"
    );


  if (hint) {

    hint.textContent =
      timerPaused
        ? "PAUSED"
        : "RESUMED";
  }
}


function resetArcheryTimer() {

  clearInterval(
    timerInt
  );


  timerInt =
    null;


  timerPaused =
    false;


  timerRender(
    "READY",
    S.timer.prep,
    "timer-idle",
    "Press START"
  );
}


/* =========================================================
   CSV EXPORT
   ========================================================= */

function exportExcelDialog() {

  if (
    !S.history.length
  ) {

    alert(
      "No Practice History to export as Excel (.xlsx)."
    );

    return;
  }


  if (
    document.getElementById(
      "csvDialog"
    )
  ) {

    return;
  }


  const overlay =
    document.createElement(
      "div"
    );


  overlay.id =
    "csvDialog";


  overlay.className =
    "modal-overlay";


  overlay.innerHTML = `
    <div class="modal-card csv-modal">

      <h3>
        EXPORT EXCEL
      </h3>


      <p>
        Select the practice session(s)
        to export.
      </p>


      <div class="csv-select-all">

        <label>

          <input
            id="csvAll"
            type="checkbox"
            onchange="
              toggleAllCSV(
                this.checked
              )
            "
          >

          Select All

        </label>

      </div>


      <div class="csv-session-list">

        ${
          S.history
            .map(
              (
                h,
                index
              ) => {

                const dt =
                  shortDateTime(
                    h.completedAt ||
                    h.date
                  );


                return `
                  <label class="csv-session-row">

                    <input
                      class="csv-session-check"
                      type="checkbox"
                      value="${index}"
                    >


                    <span>

                      <b>
                        ${dt.date}
                      </b>

                      <small>
                        ${
                          h.setup?.distance ||
                          "-"
                        }M •
                        ${
                          h.setup?.arrows ||
                          "-"
                        }A ×
                        ${
                          h.setup?.ends ||
                          "-"
                        }E ×
                        ${
                          h.setup?.rounds ||
                          "-"
                        }R
                      </small>

                    </span>

                  </label>
                `;
              }
            )
            .join("")
        }

      </div>


      <div class="modal-actions">

        <button
          class="btn green"
          onclick="
            exportSelectedExcel()
          "
        >
          EXPORT
        </button>


        <button
          class="btn soft"
          onclick="
            closeModal(
              'csvDialog'
            )
          "
        >
          CANCEL
        </button>

      </div>

    </div>
  `;


  document.body.appendChild(
    overlay
  );
}


function toggleAllCSV(
  checked
) {

  document
    .querySelectorAll(
      ".csv-session-check"
    )
    .forEach(
      el => {

        el.checked =
          checked;
      }
    );
}


function csvEscape(value) {

  const s =
    String(
      value ?? ""
    );


  if (
    /[",\n]/.test(s)
  ) {

    return (
      '"' +
      s.replace(
        /"/g,
        '""'
      ) +
      '"'
    );
  }


  return s;
}



function currentPracticeDistanceForSetup(setup, round, end) {
  if (!setup || setup.distanceMode !== "multiple") return Number(setup?.distance) || 30;
  const m = setup.multi || {};
  const distances = Array.isArray(m.distances) && m.distances.length ? m.distances.map(Number) : [30,40,50];
  const ends = Array.isArray(m.endsByDistance) && m.endsByDistance.length ? m.endsByDistance.map(Number) : distances.map(()=>Math.max(1, Number(m.endsPerDistance)||5));
  const order = Array.isArray(m.orders) ? (m.orders[Math.max(0, round-1)] || "asc") : "asc";
  const seq = order === "desc" ? [...distances].reverse() : [...distances];
  let cursor = 1;
  for (const d of seq) {
    const idx = distances.indexOf(Number(d));
    const count = Math.max(1, Number(ends[idx]) || 1);
    if (end >= cursor && end < cursor + count) return Number(d);
    cursor += count;
  }
  return Number(seq[seq.length-1] || distances[0] || 30);
}


function exportSelectedExcel() {
  const indexes = [...document.querySelectorAll(".csv-session-check:checked")].map(el => Number(el.value));
  if (!indexes.length) {
    alert("Select at least one session.");
    return;
  }

  const rows = [];
  indexes.forEach((index, sessionPos) => {
    const h = S.history[index];
    if (!h) return;
    const setup = h.setup || DEFAULT_SETUP;
    const dt = shortDateTime(h.completedAt || h.date);
    const statLabels = resultStatLabels(setup);
    const isGame = setup.practiceType && setup.practiceType !== "target";
    const isMulti = !isGame && setup.distanceMode === "multiple";
    const sessionTitle = String(h.title || "").trim() || "Archery Practice Result";
    const groupValues = [...new Set(Object.values(h.groups || {}).filter(Boolean))];
    const laneValues = [...new Set(Object.values(h.lanes || {}).filter(Boolean))];

    if (sessionPos) rows.push([]);
    rows.push([sessionTitle]);
    rows.push(["Date", dt.date, "Day", dt.day, "Time", dt.time]);
    if (isGame) {
      rows.push(["Format", `${String(setup.practiceType).toUpperCase()} GAME`, "Distance", `${setup.gameMinDistance || 5}~${setup.gameMaxDistance || 30}m`]);
      rows.push(["Matrix", setup.matrix, "Rounds", setup.rounds, "Check Points", setup.checkPoints || setup.ends, "Arrows / CP", setup.arrows]);
    } else if (isMulti) {
      rows.push(["Distance", resultDistanceText(setup), "Target Face", `${setup.target}cm`, "Matrix", setup.matrix]);
      resultFormatLines(setup).forEach((line, i) => rows.push([`Round ${i + 1}`, String(line).replace(/\s+-\s+/g, " → ")]));
      rows.push(["Arrows / End", setup.arrows]);
    } else {
      rows.push(["Distance", `${setup.distance}m`, "Target Face", `${setup.target}cm`, "Matrix", setup.matrix]);
      rows.push(["Format", `${setup.arrows}A × ${setup.ends}E × ${setup.rounds}R`]);
    }
    if (setup.lane && laneValues.length) rows.push(["Lane", laneValues.join(", ")]);
    if (setup.group && groupValues.length) rows.push(["Group", groupValues.join(", ")]);
    if (h.location) rows.push(["Location", h.location]);
    rows.push([]);

    (h.archers || []).forEach((archer, archerIndex) => {
      const metrics = historyMetrics(archer, setup);
      rows.push([`${archerIndex + 1}. ${archer.name}`, `${metrics.total} pts`]);
      if (setup.lane && h.lanes?.[archer.name]) rows.push(["Lane", h.lanes[archer.name]]);
      if (setup.group && (h.groups?.[archer.name] || h.groups?.["__personal__"])) rows.push(["Group", h.groups?.[archer.name] || h.groups?.["__personal__"]]);

      const maxArrows = Math.max(1, Number(setup.arrows) || 1);
      const tableHeader = ["Round", isGame ? "CP" : "Distance", isGame ? "CP No." : "End", ...Array.from({length:maxArrows}, (_,i)=>`A${i+1}`), isGame ? "CP Total" : "End Total", "Cumulative"];
      rows.push(tableHeader);
      let cumulative = 0;
      for (let r=0; r<Math.max(1, Number(setup.rounds)||1); r++) {
        const endCount = Math.max(1, Number(setup.ends)||1);
        for (let e=0; e<endCount; e++) {
          const vals = archer.scores?.[r]?.[e] || [];
          const endTotal = vals.reduce((sum,v)=>sum+scoreValue(v),0);
          cumulative += endTotal;
          let distanceLabel = "";
          if (isGame) distanceLabel = `${setup.gameMinDistance || 5}~${setup.gameMaxDistance || 30}m`;
          else if (isMulti) distanceLabel = `${currentPracticeDistanceForSetup(setup, r+1, e+1)}m`;
          else distanceLabel = `${setup.distance}m`;
          rows.push([r+1, distanceLabel, e+1, ...Array.from({length:maxArrows},(_,i)=>vals[i] || ""), endTotal, cumulative]);
        }
      }
      rows.push(["TOTAL", metrics.total, statLabels[0], scoreCountFor(archer, statLabels[0]), statLabels[1], scoreCountFor(archer, statLabels[1]), "AVG", metrics.avg.toFixed(2), "SCORE %", metrics.score.toFixed(1)]);
      rows.push([]);
    });
  });

  const xlsxBlob = buildCenteredXLSX(rows);
  downloadBlobFile(`scoreboard-${Date.now()}.xlsx`, xlsxBlob);
  closeModal("csvDialog");
}


/* =========================================================
   EXCEL XLSX EXPORT
   All worksheet cells use a centered alignment style.
   ========================================================= */

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function excelColumnName(index) {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function u16(n) {
  return new Uint8Array([n & 255, (n >>> 8) & 255]);
}

function u32(n) {
  return new Uint8Array([
    n & 255,
    (n >>> 8) & 255,
    (n >>> 16) & 255,
    (n >>> 24) & 255
  ]);
}

function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  parts.forEach(part => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}

function zipStore(files) {
  const enc = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach(file => {
    const name = enc.encode(file.name);
    const data = typeof file.data === "string" ? enc.encode(file.data) : file.data;
    const crc = crc32(data);

    const local = concatBytes([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length),
      u16(name.length), u16(0), name, data
    ]);
    localParts.push(local);

    const central = concatBytes([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length),
      u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name
    ]);
    centralParts.push(central);
    offset += local.length;
  });

  const localData = concatBytes(localParts);
  const centralData = concatBytes(centralParts);
  const end = concatBytes([
    u32(0x06054b50), u16(0), u16(0),
    u16(files.length), u16(files.length),
    u32(centralData.length), u32(localData.length), u16(0)
  ]);

  return concatBytes([localData, centralData, end]);
}

function buildCenteredXLSX(rows) {
  const sheetRows = rows.map((row, r) => {
    const cells = row.map((value, c) => {
      const ref = `${excelColumnName(c)}${r + 1}`;
      if (typeof value === "number" && Number.isFinite(value)) {
        return `<c r="${ref}" s="1"><v>${value}</v></c>`;
      }
      return `<c r="${ref}" s="1" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
    }).join("");
    return `<row r="${r + 1}">${cells}</row>`;
  }).join("");

  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Scoreboard" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const bytes = zipStore([
    { name: "[Content_Types].xml", data: contentTypes },
    { name: "_rels/.rels", data: rootRels },
    { name: "xl/workbook.xml", data: workbook },
    { name: "xl/_rels/workbook.xml.rels", data: workbookRels },
    { name: "xl/worksheets/sheet1.xml", data: sheet },
    { name: "xl/styles.xml", data: styles }
  ]);

  return new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

function downloadBlobFile(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* =========================================================
   BACKUP / RESTORE
   ========================================================= */

function downloadTextFile(
  filename,
  text,
  type
) {

  const blob =
    new Blob(
      [text],
      {
        type
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const a =
    document.createElement(
      "a"
    );


  a.href =
    url;


  a.download =
    filename;


  document.body.appendChild(
    a
  );


  a.click();


  a.remove();


  setTimeout(
    () =>
      URL.revokeObjectURL(
        url
      ),
    1000
  );
}


function exportBackup() {

  const data = {

    version:
      2,

    exportedAt:
      new Date()
        .toISOString(),

    archers:
      S.archers,

    history:
      S.history,

    presets:
      S.presets,

    customMatrices:
      S.customMatrices,

    gps:
      S.gps,

    font:
      S.font,

    timer:
      S.timer,

    defaultArcher:
      localStorage.getItem(
        "as_default_archer"
      ),

    unfinished:
      getUnfinished()
  };


  downloadTextFile(
    `scoreboard-backup-${Date.now()}.json`,
    JSON.stringify(
      data,
      null,
      2
    ),
    "application/json"
  );
}


function restoreBackup(
  input
) {

  const file =
    input.files?.[0];


  if (!file) {
    return;
  }


  const reader =
    new FileReader();


  reader.onload =
    () => {

      try {

        const data =
          JSON.parse(
            reader.result
          );


        if (
          !confirm(
            "Restore this backup?\n\n" +
            "Current local app data will be replaced."
          )
        ) {

          input.value =
            "";

          return;
        }


        S.archers =
          Array.isArray(
            data.archers
          )
            ? data.archers
            : [];


        S.history =
          Array.isArray(
            data.history
          )
            ? data.history
            : [];


        S.presets =
          Array.isArray(
            data.presets
          )
            ? data.presets
            : [];


        S.customMatrices =
          data.customMatrices &&
          typeof data.customMatrices ===
            "object"
            ? data.customMatrices
            : {};


        S.gps =
          !!data.gps;


        S.font =
          data.font ||
          "normal";


        S.timer = {
          ...S.timer,
          ...(
            data.timer ||
            {}
          )
        };


        if (
          data.defaultArcher
        ) {

          localStorage.setItem(
            "as_default_archer",
            data.defaultArcher
          );

        } else {

          localStorage.removeItem(
            "as_default_archer"
          );
        }


        if (
          data.unfinished
        ) {

          put(
            "as_unfinished_session",
            data.unfinished
          );

        } else {

          clearUnfinished();
        }


        save();


        alert(
          "Backup restored successfully."
        );


        settings();

      } catch {

        alert(
          "Unable to restore backup. Invalid backup file."
        );
      }


      input.value =
        "";
    };


  reader.readAsText(
    file
  );
}


/* =========================================================
   FACTORY RESET
   ========================================================= */

function factoryReset() {

  const first =
    confirm(
      "FACTORY RESET\n\n" +
      "This will delete ALL local SCOREBOARD data " +
      "on this device.\n\nContinue?"
    );


  if (!first) {
    return;
  }


  const second =
    confirm(
      "FINAL CONFIRMATION\n\n" +
      "Practice History, Archer Lists, Presets, Settings " +
      "and unfinished scores will be permanently deleted.\n\n" +
      "Factory Reset now?"
    );


  if (!second) {
    return;
  }


  [
    "as_archers",
    "as_history",
    "as_presets",
    "as_matrices",
    "as_gps",
    "as_font",
    "as_timer",
    "as_default_archer",
    "as_unfinished_session"
  ].forEach(
    key =>
      localStorage.removeItem(
        key
      )
  );


  location.reload();
}


/* =========================================================
   APPLICATION INFO
   ========================================================= */

let infoTab = "";
let infoLang = "ENG";
const feedbackRatings = [0,0,0,0,0,0,0];

function setInfoLang(lang) {
  infoLang = lang === "ENG" ? "ENG" : "BM";
  info();
}

function info(tab = null) {
  if (tab === "manual" || tab === "feedback") infoTab = infoTab === tab ? "" : tab;
  const bm = infoLang === "BM";
  const manualActive = infoTab === "manual";
  const feedbackActive = infoTab === "feedback";
  page(`
    ${head("APPLICATION INFO")}
    <section class="card app-info-card scoreboard-info-head">
      <div class="info-brand-row">
        <div class="info-brand"><h2>SCOREBOARD</h2></div>
        <div class="info-lang-toggle">
          <button class="${infoLang==='ENG'?'active':''}" onclick="setInfoLang('ENG')">ENG</button>
          <button class="${infoLang==='BM'?'active':''}" onclick="setInfoLang('BM')">BM</button>
        </div>
      </div>
      <div class="info-meta">
        <span><b>${bm?'Versi Aplikasi':'App Version'}:</b> 1.0.0</span>
        <span><b>${bm?'Kemas Kini Terakhir':'Last Updated'}:</b> 17 October 2026</span>
      </div>
      <div class="info-tab-row">
        <button class="btn ${manualActive ? "blue" : "soft"}" onclick="info('manual')">${bm?'MANUAL PENGGUNA':'USER MANUAL'}</button>
        <button class="btn ${feedbackActive ? "blue" : "soft"}" onclick="info('feedback')">${bm?'HUBUNGI & MAKLUM BALAS':'CONTACT & FEEDBACK'}</button>
      </div>
    </section>
    ${manualActive ? userManualHTML() : ""}
    ${feedbackActive ? feedbackHTML() : ""}
    <section class="card info-legal-card">
      <div class="section">${bm?'PENAFIAN & KEBENARAN':'DISCLAIMER & PERMISSION'}</div>
      <p>${bm?'Aplikasi ini disediakan secara percuma. Penjualan, pengedaran semula atau pengubahsuaian tanpa kebenaran pemilik adalah dilarang.':'This application is provided free of charge. Unauthorized sale, redistribution, or modification is prohibited without permission from the owner.'}</p>
    </section>
    <section class="card info-legal-card info-prayer">
      <div class="section">${bm?'DOA':'PRAYER'}</div>
      <p>${bm?'Semoga Allah mengampuni pembangun, para pengguna, ibu bapa dan keluarga mereka serta seluruh umat Islam.':'May Allah forgive the developer, the users, their parents, families, and all Muslims.'}</p>
    </section>
    <div class="footer info-footer">© 2026 SCOREBOARD. All rights reserved.</div>
  `,"info");
}

function userManualHTML() {
  const bm = infoLang === "BM";
  if (!bm) return `
    <section class="card user-manual-card">
      <div class="section">USER MANUAL</div>
      <p><b>SCOREBOARD</b> is a practical archery score-tracking application for recording practice, monitoring progress and reviewing performance over time.</p>
      <div class="quick-guide"><b>Quick Guide:</b><br>Setup → Score → Submit End → Summary → Finish → Detailed Results → Share</div>
      <h3>1. Installing the Application</h3><p>• Android (Chrome): menu → Add to Home screen / Install App.<br>• iPhone (Safari): Share → Add to Home Screen.</p>
      <h3>2. Start Practice</h3><p>Select Personal or Team, archer, practice format, scoring matrix and optional Timer, Lane or Group. Use the FORMAT switch <b>Normal | 3D | 2D</b>. Normal is the default. 3D/2D uses Check Points (CP), Arrows/CP, Rounds and a Min/Max distance range instead of Ends/Target Face. Use <b>Single Distance</b> for one shooting distance. For <b>Multiple Distances</b>, set the number of distances, each distance and Ends, Target Face, Arrows/End, Time/End and Rounds. Each Round may use an Ascending or Descending sequence.</p>
      <h3>3. Scoring</h3><p>Tap score values in Arrow order. Submit End becomes active after all arrows are entered. A late-joining archer starts from their own End 1 and can complete the remaining Ends independently. In Multiple Distances mode, use <b>Distance</b> and <b>Round</b> navigation to move through the configured sequence.</p>
      <h3>4. Practice History</h3><p>Practice History stores completed sessions for later review. Filter records by archer, period and distance, add or edit notes, open a session to view its Detailed Results, or delete selected records when required.</p>
      <h3>5. Archer Profile</h3><p>Archer Profile provides longer-term performance information including Score Trend, Personal Best Scores by distance, and Accuracy & Point Breakdown. Point Breakdown follows the selected scoring matrix and reports its <b>two highest scoring values</b>; for example X & 10 for 10-1, X, or 5 & 4 for 5-1.</p>
      <h3>6. Settings & Archery Timer</h3><p>Settings provides application preferences, data backup/export and Archery Timer controls. The timer supports preparation, shooting, warning and stop phases with whistle signals. Saved timer settings remain available for later sessions.</p>
      <h3>7. Detailed Results</h3><p>Detailed Results shows session information, Round/Distance score tables, Total, the two highest scoring values for the active matrix, Avg/Arrow, Score %, and session-specific Accuracy & Point Breakdown. Results can be shared through WhatsApp or printed/saved as PDF. If the result title is edited, the edited title is used for sharing and the Practice History note.</p>
    </section>`;
  return `
    <section class="card user-manual-card">
      <div class="section">MANUAL PENGGUNA</div>
      <p><b>SCOREBOARD</b> ialah aplikasi penjejakan skor memanah untuk merekod latihan, memantau kemajuan dan menyemak prestasi dari semasa ke semasa.</p>
      <div class="quick-guide"><b>Panduan Ringkas:</b><br>Setup → Score → Submit End → Summary → Finish → Detailed Results → Share</div>
      <h3>1. Memasang Aplikasi</h3><p>• Android (Chrome): menu → Add to Home screen / Install App.<br>• iPhone (Safari): Share → Add to Home Screen.</p>
      <h3>2. Memulakan Latihan</h3><p>Pilih Peribadi atau Pasukan, pemanah, format latihan, matriks pemarkahan serta pilihan Timer, Lane atau Group jika diperlukan. Gunakan suis FORMAT <b>Normal | 3D | 2D</b>. Normal ialah tetapan asal. 3D/2D menggunakan Check Points (CP), Arrows/CP, Pusingan serta julat jarak Min/Max menggantikan End/Target Face. Gunakan <b>Single Distance</b> untuk satu jarak. Bagi <b>Multiple Distances</b>, tetapkan bilangan jarak, setiap jarak dan End, Target Face, Arrows/End, Time/End dan Pusingan. Setiap Pusingan boleh menggunakan turutan Ascending atau Descending.</p>
      <h3>3. Pemarkahan</h3><p>Tekan nilai skor mengikut turutan Arrow. Submit End aktif selepas semua arrow lengkap. Pemanah yang join lewat bermula dari End 1 sendiri dan boleh menghabiskan baki End secara berasingan. Dalam Multiple Distances, gunakan navigation <b>Distance</b> dan <b>Round</b> untuk bergerak mengikut susunan yang ditetapkan.</p>
      <h3>4. Sejarah Latihan</h3><p>Sejarah Latihan menyimpan sesi yang telah selesai untuk semakan kemudian. Rekod boleh ditapis mengikut pemanah, tempoh dan jarak, ditambah atau diedit nota, dibuka untuk melihat Keputusan Terperinci, atau dipadam apabila diperlukan.</p>
      <h3>5. Profil Pemanah</h3><p>Profil Pemanah memaparkan prestasi jangka panjang termasuk Score Trend, Personal Best Scores mengikut jarak serta Accuracy & Point Breakdown. Point Breakdown mengikut matriks yang digunakan dan memaparkan <b>dua nilai markah tertinggi</b>; contohnya X & 10 bagi 10-1, X, atau 5 & 4 bagi 5-1.</p>
      <h3>6. Tetapan & Pemasa Memanah</h3><p>Settings menyediakan tetapan aplikasi, backup/eksport data dan kawalan Archery Timer. Pemasa menyokong fasa preparation, shooting, warning dan stop berserta isyarat wisel. Tetapan pemasa yang disimpan boleh digunakan semula pada sesi berikutnya.</p>
      <h3>7. Keputusan Terperinci</h3><p>Keputusan Terperinci memaparkan maklumat sesi, jadual markah mengikut Pusingan/Jarak, Total, dua nilai markah tertinggi bagi matriks aktif, Avg/Arrow, Score %, serta Accuracy & Point Breakdown khusus untuk sesi tersebut. Keputusan boleh dikongsi melalui WhatsApp atau dicetak/disimpan sebagai PDF. Jika tajuk keputusan diedit, tajuk tersebut digunakan untuk perkongsian dan nota di Sejarah Latihan.</p>
    </section>`;
}

function feedbackHTML() {
  const bm = infoLang === "BM";
  const labels = bm ? [
    "Kekemasan Antaramuka (Interface)", "Kelajuan & Prestasi Sistem", "Kemudahan Penggunaan",
    "Ketepatan Pengiraan Markah", "Fungsi Pemasa (Timer)", "Perkongsian WhatsApp", "Kepuasan Keseluruhan Aplikasi"
  ] : [
    "Interface Appearance", "System Speed & Performance", "Ease of Use", "Scoring Accuracy",
    "Timer Function", "WhatsApp Sharing", "Overall Application Satisfaction"
  ];
  return `
    <section class="card feedback-card">
      <div class="feedback-heading-row">
        <div class="section feedback-title">${bm?'CONTACT & FEEDBACK':'CONTACT & FEEDBACK'}</div>
        <p class="help feedback-intro">${bm?'Sila berikan pendapat anda tentang aplikasi ini':'Please share your feedback about this application'}</p>
        <button class="btn soft feedback-reset" onclick="resetFeedback()">RESET</button>
      </div>
      <div class="feedback-list">
        ${labels.map((label,i)=>`<div class="feedback-item"><b>${i+1}. ${label}</b><div class="feedback-stars" data-rating-row="${i}">${[1,2,3,4,5].map(n=>`<button type="button" class="${n<=feedbackRatings[i]?'active':''}" onclick="setFeedbackCategory(${i},${n})">${n<=feedbackRatings[i]?'★':'☆'}</button>`).join('')}</div></div>`).join('')}
      </div>
      <label class="field-label" for="feedbackComment">${bm?'Tulis cadangan atau pendapat tambahan di sini (jika ada)':'Write any additional suggestions or comments here (if any)'}</label>
      <textarea id="feedbackComment" rows="5"></textarea>
      <p class="feedback-thanks">${bm?'Terima kasih atas sokongan anda!':'Thank you for your support!'}</p>
      <button class="btn green full" onclick="sendFeedback()">SEND VIA WHATSAPP</button>
    </section>`;
}

function setFeedbackCategory(index, rating) {
  feedbackRatings[index] = Math.max(1, Math.min(5, Number(rating)||1));
  const row = document.querySelector(`[data-rating-row="${index}"]`);
  if (!row) return;
  [...row.querySelectorAll("button")].forEach((button, i) => {
    const active = i < feedbackRatings[index];
    button.classList.toggle("active", active);
    button.textContent = active ? "★" : "☆";
  });
}

function resetFeedback() {
  feedbackRatings.fill(0);
  document.querySelectorAll(".feedback-stars").forEach(row => row.querySelectorAll("button").forEach(button => { button.classList.remove("active"); button.textContent = "☆"; }));
  const comment = document.getElementById("feedbackComment");
  if (comment) comment.value = "";
}

function sendFeedback() {
  const comment = document.getElementById("feedbackComment")?.value.trim() || "";
  const labels = infoLang === "BM"
    ? ["Kekemasan Antaramuka", "Kelajuan & Prestasi Sistem", "Kemudahan Penggunaan", "Ketepatan Pengiraan Markah", "Fungsi Pemasa", "Perkongsian WhatsApp", "Kepuasan Keseluruhan Aplikasi"]
    : ["Interface Neatness", "System Speed & Performance", "Ease of Use", "Score Calculation Accuracy", "Timer Function", "WhatsApp Sharing", "Overall Application Satisfaction"];
  if (!feedbackRatings.some(Boolean) && !comment) { alert("Please select a rating or write a comment."); return; }
  const line = "--------------------------------------------------";
  const rows = labels.flatMap((label, i) => { const rating=feedbackRatings[i]; const stars=rating?"⭐".repeat(rating)+` (${rating}/5)`:"-"; return [`${i+1}. ${label}:`, `   ${stars}`, ""]; });
  const message = ["*SCOREBOARD FEEDBACK*", line, ...rows, "*Cadangan / Komen:*", comment || "-"].join("\n");
  window.open("https://wa.me/60192841910?text=" + encodeURIComponent(message), "_blank");
}


/* =========================================================
   INSTALL / PWA
   ========================================================= */

let deferredInstallPrompt =
  null;


window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();


    deferredInstallPrompt =
      event;
  }
);


async function installApp() {

  if (
    !deferredInstallPrompt
  ) {

    alert(
      "Use your browser menu and select " +
      '"Install app" or "Add to Home screen".'
    );

    return;
  }


  deferredInstallPrompt
    .prompt();


  try {

    await deferredInstallPrompt
      .userChoice;

  } catch {
    /* ignored */
  }


  deferredInstallPrompt =
    null;
}


/* =========================================================
   KEYBOARD / SAFETY
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      [
        "exitDialog",
        "manageEndsDialog",
        "manageRoundsDialog",
        "addArcherDialog",
        "historyNoteDialog",
        "resultTitleDialog",
        "csvDialog"
      ].forEach(
        id =>
          closeModal(id)
      );
    }
  }
);


/* =========================================================
   APP START
   ========================================================= */

function initialiseApp() {

  if (localStorage.getItem("as_gps") === null) {
    S.gps = true;
    put("as_gps", true);
  }

  document.documentElement
    .classList.remove(
      "font-small",
      "font-normal",
      "font-large"
    );


  document.documentElement
    .classList.add(
      `font-${S.font}`
    );


  /*
   * Upgrade older timer data.
   */

  S.timer = {
    prep: 10,
    shoot: 120,
    warn: 10,
    whistle: true,
    vibration: true,
    volume: 100,
    ...S.timer
  };


  /*
   * Upgrade older presets.
   */

  S.presets =
    S.presets.map(
      p => ({
        ...DEFAULT_SETUP,
        ...p
      })
    );


  save();


  home();
}


/* =========================================================
   SERVICE WORKER
   ========================================================= */

if (
  "serviceWorker" in
  navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register(
          "service-worker.js"
        )
        .catch(
          error => {

            console.warn(
              "Service Worker registration failed:",
              error
            );
          }
        );
    }
  );
}


/* =========================================================
   START SCOREBOARD
   ========================================================= */

initialiseApp();