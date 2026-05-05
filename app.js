const actionPool = [
  {
    title: "机の見える範囲を5分だけ整える",
    mode: "clear",
    energy: ["quiet", "steady"],
    minutes: 5,
    note: "始める場所を狭くすると、次の行動に移りやすくなります。",
    tags: ["片付け", "机", "整理"],
  },
  {
    title: "返信が必要な連絡を1件だけ確認する",
    mode: "clear",
    energy: ["quiet", "steady", "active"],
    minutes: 5,
    note: "返信を書く前に、必要かどうかだけ決めても前進です。",
    tags: ["メール", "返信", "連絡"],
  },
  {
    title: "アプリの次に変えたい点を3つ書く",
    mode: "move",
    energy: ["quiet", "steady", "active"],
    minutes: 5,
    note: "作る前に小さく書くと、次の作業が具体的になります。",
    tags: ["アプリ", "作成", "学習"],
  },
  {
    title: "15分だけ今の作業を進める",
    mode: "move",
    energy: ["steady", "active"],
    minutes: 15,
    note: "時間を区切ると、完璧にしようとして止まりにくくなります。",
    tags: ["作業", "集中", "進める"],
  },
  {
    title: "飲み物を用意して画面から離れる",
    mode: "rest",
    energy: ["quiet"],
    minutes: 5,
    note: "休憩を作業の一部にすると、戻るタイミングを決めやすいです。",
    tags: ["休憩", "回復", "疲れ"],
  },
  {
    title: "軽く歩いてから続きを決める",
    mode: "outside",
    energy: ["steady", "active"],
    minutes: 15,
    note: "外に出る行動は短く決めると、戻った後の切り替えが楽です。",
    tags: ["外出", "散歩", "切り替え"],
  },
  {
    title: "30分で小さな制作物を1つ仕上げる",
    mode: "move",
    energy: ["active"],
    minutes: 30,
    note: "完成度より、触れる形まで持っていくことを優先します。",
    tags: ["アプリ", "制作", "完成"],
  },
  {
    title: "今日やらないことを1つ決める",
    mode: "rest",
    energy: ["quiet", "steady"],
    minutes: 5,
    note: "やることを増やすより、やらないことを減らす方が効く日もあります。",
    tags: ["休む", "整理", "判断"],
  },
  {
    title: "明日の準備を15分だけ進める",
    mode: "clear",
    energy: ["steady", "active"],
    minutes: 15,
    note: "明日の開始を軽くするための一手です。",
    tags: ["準備", "明日", "片付け"],
  },
  {
    title: "外で済む小さな用事を1つ片付ける",
    mode: "outside",
    energy: ["active"],
    minutes: 30,
    note: "家の外で終わる用事は、先に済ませると残り時間が軽くなります。",
    tags: ["外出", "用事", "完了"],
  },
];

const state = {
  focus: null,
  suggestions: [],
  logs: [],
};

const storageKey = "iphone-action-pocket-v1";
const backupVersion = 1;
const todayKey = getDateKey(new Date());

const viewButtons = document.querySelectorAll(".nav-button");
const views = {
  today: document.querySelector("#view-today"),
  record: document.querySelector("#view-record"),
  history: document.querySelector("#view-history"),
  settings: document.querySelector("#view-settings"),
};

const pickerForm = document.querySelector("#picker-form");
const recordForm = document.querySelector("#record-form");
const suggestionList = document.querySelector("#suggestion-list");
const focusAction = document.querySelector("#focus-action");
const completeFocusButton = document.querySelector("#complete-focus");
const todayCount = document.querySelector("#today-count");
const todayLogList = document.querySelector("#today-log-list");
const historyList = document.querySelector("#history-list");
const totalCount = document.querySelector("#total-count");
const lastDate = document.querySelector("#last-date");
const todayLabel = document.querySelector("#today-label");
const backupText = document.querySelector("#backup-text");
const backupStatus = document.querySelector("#backup-status");
const exportDataButton = document.querySelector("#export-data");
const copyBackupButton = document.querySelector("#copy-backup");
const importDataButton = document.querySelector("#import-data");

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatTime(date) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function loadState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.focus = parsed.focus || null;
    state.logs = Array.isArray(parsed.logs) ? parsed.logs : [];
  } catch {
    state.focus = null;
    state.logs = [];
  }
}

function getBackupPayload() {
  return {
    app: "一手ログ",
    version: backupVersion,
    exportedAt: new Date().toISOString(),
    data: {
      focus: state.focus,
      logs: state.logs,
    },
  };
}

function exportBackup() {
  backupText.value = JSON.stringify(getBackupPayload(), null, 2);
  backupStatus.textContent = "バックアップJSONを書き出しました。";
}

async function copyBackup() {
  if (!backupText.value.trim()) exportBackup();

  try {
    await navigator.clipboard.writeText(backupText.value);
    backupStatus.textContent = "クリップボードにコピーしました。";
  } catch {
    backupText.select();
    backupStatus.textContent = "自動コピーできませんでした。テキストを選択して手動でコピーしてください。";
  }
}

function importBackup() {
  const raw = backupText.value.trim();
  if (!raw) {
    backupStatus.textContent = "復元するJSONを貼り付けてください。";
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    backupStatus.textContent = "JSONとして読み取れませんでした。";
    return;
  }

  const data = parsed.data || parsed;
  const nextLogs = Array.isArray(data.logs) ? data.logs : null;
  if (!nextLogs) {
    backupStatus.textContent = "一手ログのバックアップ形式ではありません。";
    return;
  }

  const confirmed = window.confirm("現在の一手ログの保存内容を、貼り付けたバックアップで置き換えます。実行しますか？");
  if (!confirmed) {
    backupStatus.textContent = "復元をキャンセルしました。";
    return;
  }

  state.focus = data.focus || null;
  state.logs = nextLogs;
  saveState();
  renderAll();
  backupStatus.textContent = "バックアップから復元しました。";
}

function saveState() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      focus: state.focus,
      logs: state.logs,
    }),
  );
}

function getPickerState() {
  const data = new FormData(pickerForm);
  return {
    energy: data.get("energy"),
    minutes: Number(data.get("minutes")),
    mode: data.get("mode"),
    memo: document.querySelector("#context-note").value.trim(),
  };
}

function scoreAction(action, picker) {
  let score = 50;

  if (action.mode === picker.mode) score += 28;
  if (action.energy.includes(picker.energy)) score += 18;
  if (action.minutes <= picker.minutes) score += 16;
  if (action.minutes > picker.minutes) score -= (action.minutes - picker.minutes) * 1.2;

  if (picker.memo) {
    const haystack = [action.title, action.note, ...action.tags].join(" ");
    for (const token of ["返信", "片付け", "アプリ", "作成", "明日", "外", "疲れ"]) {
      if (picker.memo.includes(token) && haystack.includes(token)) score += 12;
    }
  }

  return Math.max(1, Math.round(score));
}

function makeSuggestions() {
  const picker = getPickerState();
  state.suggestions = actionPool
    .map((action) => ({ ...action, score: scoreAction(action, picker) }))
    .sort((a, b) => b.score - a.score || a.minutes - b.minutes)
    .slice(0, 3);
  renderSuggestions();
}

function setFocus(action) {
  state.focus = {
    title: action.title,
    note: action.note,
    minutes: action.minutes,
    mode: action.mode,
    selectedAt: new Date().toISOString(),
  };
  saveState();
  renderAll();
}

function addLog({ title, note, minutes = null, mode = "move" }) {
  const now = new Date();
  state.logs.unshift({
    id: `${now.getTime()}-${Math.random().toString(16).slice(2)}`,
    title,
    note,
    minutes,
    mode,
    date: getDateKey(now),
    time: formatTime(now),
    createdAt: now.toISOString(),
  });
  saveState();
  renderAll();
}

function completeFocus() {
  if (!state.focus) return;
  addLog({
    title: state.focus.title,
    note: state.focus.note,
    minutes: state.focus.minutes,
    mode: state.focus.mode,
  });
  state.focus = null;
  saveState();
  renderAll();
}

function switchView(name) {
  Object.entries(views).forEach(([viewName, element]) => {
    element.classList.toggle("active", viewName === name);
  });

  viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === name);
  });
}

function renderFocus() {
  if (!state.focus) {
    focusAction.textContent = "まだ選ばれていません。";
    completeFocusButton.disabled = true;
    return;
  }

  focusAction.textContent = state.focus.title;
  completeFocusButton.disabled = false;
}

function renderSuggestions() {
  suggestionList.innerHTML = "";

  if (!state.suggestions.length) {
    suggestionList.append(createEmptyState("候補はまだありません。"));
    return;
  }

  state.suggestions.forEach((action, index) => {
    const card = document.createElement("article");
    const selected = state.focus && state.focus.title === action.title;
    card.className = "suggestion-card";
    card.innerHTML = `
      <header>
        <div>
          <span class="section-kicker">Candidate</span>
          <h3>${escapeHtml(action.title)}</h3>
        </div>
        <span class="rank">${index + 1}</span>
      </header>
      <p>${escapeHtml(action.note)}</p>
      <div class="meta-row">
        <span>${action.minutes}分</span>
        <span>${modeLabel(action.mode)}</span>
        <span>${Math.min(100, action.score)}%</span>
      </div>
      <button class="select-button${selected ? " selected" : ""}" type="button">
        ${selected ? "選択中" : "今日の一手にする"}
      </button>
    `;
    card.querySelector("button").addEventListener("click", () => setFocus(action));
    suggestionList.append(card);
  });
}

function renderLogs() {
  const todayLogs = state.logs.filter((log) => log.date === todayKey);
  todayCount.textContent = String(todayLogs.length);
  todayLogList.innerHTML = "";

  if (!todayLogs.length) {
    todayLogList.append(createEmptyState("今日の記録はまだありません。"));
  } else {
    todayLogs.forEach((log) => todayLogList.append(createLogCard(log)));
  }

  totalCount.textContent = String(state.logs.length);
  lastDate.textContent = state.logs[0] ? state.logs[0].date.slice(5).replace("-", "/") : "-";
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";

  if (!state.logs.length) {
    historyList.append(createEmptyState("履歴はまだありません。"));
    return;
  }

  state.logs.slice(0, 20).forEach((log) => {
    historyList.append(createLogCard(log, true));
  });
}

function createLogCard(log, showDate = false) {
  const card = document.createElement("article");
  card.className = "log-card";
  card.innerHTML = `
    <header>
      <h3>${escapeHtml(log.title)}</h3>
      <span class="log-time">${showDate ? escapeHtml(log.date.slice(5).replace("-", "/")) : escapeHtml(log.time)}</span>
    </header>
    <p>${escapeHtml(log.note || "メモなし")}</p>
    <div class="meta-row">
      ${log.minutes ? `<span>${log.minutes}分</span>` : ""}
      <span>${modeLabel(log.mode)}</span>
    </div>
  `;
  return card;
}

function createEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.innerHTML = `<p>${escapeHtml(message)}</p>`;
  return empty;
}

function modeLabel(mode) {
  return {
    clear: "整える",
    move: "進める",
    rest: "休む",
    outside: "出る",
  }[mode] || "進める";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderAll() {
  todayLabel.textContent = formatDateLabel(new Date());
  renderFocus();
  renderSuggestions();
  renderLogs();
}

pickerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  makeSuggestions();
});

pickerForm.addEventListener("change", makeSuggestions);

recordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const titleInput = document.querySelector("#custom-title");
  const noteInput = document.querySelector("#custom-note");
  const title = titleInput.value.trim();
  const note = noteInput.value.trim();

  if (!title) {
    titleInput.focus();
    return;
  }

  addLog({ title, note, mode: "move" });
  titleInput.value = "";
  noteInput.value = "";
  switchView("today");
});

completeFocusButton.addEventListener("click", completeFocus);

viewButtons.forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

exportDataButton.addEventListener("click", exportBackup);
copyBackupButton.addEventListener("click", copyBackup);
importDataButton.addEventListener("click", importBackup);

if ("serviceWorker" in navigator && ["https:", "http:"].includes(location.protocol)) {
  const localSecureHost = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (location.protocol === "https:" || localSecureHost) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
}

loadState();
makeSuggestions();
renderAll();
