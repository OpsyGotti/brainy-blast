/* Brainy Blast — game, rewards, player cards and leaderboard.
 * Works fully offline (progress saved in this browser). When the site runs on
 * Cloudflare Pages, it also syncs player cards to /api for the shared leaderboard. */

/* ================= Setup data ================= */
const ROUND = 10;
const TRIES = 3;
const POINTS = [10, 6, 3];      // XP for right on 1st / 2nd / 3rd try
const COINS = [3, 2, 1];

const SUBJECTS = [
  { id: "maths", name: "Maths", emoji: "➗", color: "#2E86FF", blurb: "Number, times tables, fractions, algebra and more" },
  { id: "english", name: "English", emoji: "📚", color: "#FF5A4E", blurb: "Grammar, punctuation, spelling and great books" },
  { id: "science", name: "Science", emoji: "🔬", color: "#22B573", blurb: "Living things, materials, forces and space" },
  { id: "tech", name: "Tech Skills", emoji: "💻", color: "#8A5CF6", blurb: "Coding, how computers work and staying safe online" },
  { id: "gk", name: "General Knowledge", emoji: "🌍", color: "#FF8A3D", blurb: "Animals, places, history and fun facts" },
];
const DAILY = { id: "daily", name: "Daily Challenge", emoji: "📅", color: "#FFC21A" };

const STAGES = [
  null,
  { n: 1, label: "Years 1–2", ks: "KS1 · age 5–7" },
  { n: 2, label: "Years 3–4", ks: "Lower KS2 · age 7–9" },
  { n: 3, label: "Years 5–6", ks: "Upper KS2 · age 9–11" },
  { n: 4, label: "Years 7–9", ks: "KS3 · age 11–14" },
  { n: 5, label: "Years 10–11", ks: "GCSE · age 14–16" },
];
const YEARS = ["Reception", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Sixth form / grown-up"];
const yearStage = (y) => (y <= 2 ? 1 : y <= 4 ? 2 : y <= 6 ? 3 : y <= 9 ? 4 : 5);

const FREE_AVATARS = ["🦁", "🐯", "🐼", "🦊", "🐸", "🐙", "🐧", "🐨", "🐶", "🐱", "🐵", "🐰"];
const SHOP = [
  { id: "🦄", kind: "avatar", name: "Unicorn", price: 40 },
  { id: "🦖", kind: "avatar", name: "T. rex", price: 60 },
  { id: "🤖", kind: "avatar", name: "Robot", price: 80 },
  { id: "👽", kind: "avatar", name: "Alien", price: 80 },
  { id: "fr-gold", kind: "frame", name: "Gold frame", price: 100 },
  { id: "🐉", kind: "avatar", name: "Dragon", price: 120 },
  { id: "🦸", kind: "avatar", name: "Superhero", price: 150 },
  { id: "🧙", kind: "avatar", name: "Wizard", price: 150 },
  { id: "fr-fire", kind: "frame", name: "Fire frame", price: 180 },
  { id: "🧑‍🚀", kind: "avatar", name: "Astronaut", price: 200 },
  { id: "fr-rainbow", kind: "frame", name: "Rainbow frame", price: 250 },
  { id: "fr-galaxy", kind: "frame", name: "Galaxy frame", price: 300 },
];
const ALL_AVATARS = [...FREE_AVATARS, ...SHOP.filter((s) => s.kind === "avatar").map((s) => s.id)];
const FRAMES = SHOP.filter((s) => s.kind === "frame").map((s) => s.id);

const RANKS = [
  [1, "Curious Cub", "🐣"], [3, "Bright Spark", "✨"], [5, "Quiz Explorer", "🧭"], [8, "Brain Builder", "🧱"],
  [12, "Knowledge Knight", "🛡️"], [16, "Genius Guardian", "🦉"], [20, "Trivia Titan", "⚡"], [25, "Legend of Learning", "👑"],
];
const xpFor = (L) => 30 * L * (L - 1);            // total XP needed to reach level L
const levelOf = (xp) => { let L = 1; while (xp >= xpFor(L + 1)) L++; return L; };
const rankOf = (L) => RANKS.filter((r) => L >= r[0]).pop();

const totalRounds = (p) => Object.values(p.rounds).reduce((a, b) => a + b, 0);
const BADGES = [
  ["first", "🚀", "Blast Off", "Finish your first round", (p) => totalRounds(p) >= 1],
  ["perfect", "💯", "Perfect 10", "Get all 10 right in one round", (p, r) => r && r.total >= ROUND && r.correct === r.total],
  ["sharp", "🎯", "Sharp Shooter", "Get all 10 right first time", (p, r) => r && r.total >= ROUND && r.first === r.total],
  ["grit", "💪", "Never Give Up", "Get one right on your third try", (p, r) => r && r.third > 0],
  ["fire", "🔥", "On Fire", "5 first-try answers in a row", (p) => p.bestStreak >= 5],
  ["unstoppable", "⚡", "Unstoppable", "15 first-try answers in a row", (p) => p.bestStreak >= 15],
  ["maths", "➗", "Mathlete", "Finish 5 Maths rounds", (p) => (p.rounds.maths || 0) >= 5],
  ["english", "📚", "Word Wizard", "Finish 5 English rounds", (p) => (p.rounds.english || 0) >= 5],
  ["science", "🔬", "Super Scientist", "Finish 5 Science rounds", (p) => (p.rounds.science || 0) >= 5],
  ["tech", "💻", "Code Cadet", "Finish 5 Tech Skills rounds", (p) => (p.rounds.tech || 0) >= 5],
  ["gk", "🌍", "World Explorer", "Finish 5 General Knowledge rounds", (p) => (p.rounds.gk || 0) >= 5],
  ["allround", "🌈", "All-Rounder", "Play every subject", (p) => SUBJECTS.every((s) => p.rounds[s.id])],
  ["daily", "📅", "Daily Hero", "Finish a Daily Challenge", (p) => (p.rounds.daily || 0) >= 1],
  ["streak3", "🗓️", "3-Day Streak", "Play 3 days in a row", (p) => p.dayStreak >= 3],
  ["streak7", "🏅", "Week Warrior", "Play 7 days in a row", (p) => p.dayStreak >= 7],
  ["climber", "🧗", "Brave Climber", "Finish a round above your school year", (p, r) => r && r.stage > yearStage(p.year)],
  ["century", "💬", "Question Crusher", "Answer 100 questions", (p) => p.answered >= 100],
  ["star", "⭐", "Rising Star", "Earn 500 XP", (p) => p.xp >= 500],
  ["superstar", "🌟", "Superstar", "Earn 2,000 XP", (p) => p.xp >= 2000],
  ["lvl10", "🏆", "Level 10", "Reach level 10", (p) => levelOf(p.xp) >= 10],
  ["collector", "🛍️", "Collector", "Unlock a prize in the shop", (p) => p.owned.length > 0],
];

/* ================= Small helpers ================= */
const $ = (id) => document.getElementById(id);
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const ymd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function weekKey(d = new Date()) { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return ymd(x); }
function yesterday() { const d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); }
const pretty = (s) => String(s).replace(/^-/, "−");
const num = (n) => Number(n).toLocaleString("en-GB");

function load(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }

let toastTimer;
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 3200);
}

/* Nickname check (same rules as the server) */
const BLOCKED = ["fuck", "shit", "bitch", "cunt", "wank", "bastard", "slut", "whore", "nigg", "fag", "twat", "porn", "nazi", "rape", "penis", "vagina", "boob", "bollock"];
function nameProblem(name) {
  if (!name) return "Please type a name or nickname.";
  if (name.length > 16) return "Please use 16 letters or fewer.";
  if (!/^[\p{L}\p{N} _.'’-]+$/u.test(name)) return "Please use only letters, numbers and spaces.";
  const flat = name.toLowerCase().replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/[^a-z]/g, "");
  if (BLOCKED.some((w) => flat.includes(w))) return "Please choose a kinder nickname.";
  return "";
}

/* ================= Players (saved on this device) ================= */
let account = load("bb2-account", { kids: {}, active: null });
let prefs = load("bb2-prefs", { sound: true, voice: false });
const kids = () => Object.values(account.kids).sort((a, b) => a.created - b.created);
const me = () => account.kids[account.active] || null;
function saveAccount() { save("bb2-account", account); }

function randomId(len = 24) {
  const bytes = new Uint8Array(len); crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
}
function newKid({ name, year, avatar, photo, photoPublic }) {
  return {
    id: "p_" + randomId(16), token: randomId(32), name, year, avatar, photo, photoPublic, frame: "",
    xp: 0, coins: 20, weekKey: weekKey(), weekXp: 0, dayStreak: 0, lastDay: "", dailyDone: "",
    curStreak: 0, bestStreak: 0, answered: 0, rounds: {}, stats: {}, badges: {}, owned: [],
    stage: yearStage(year), created: Date.now(),
  };
}
function rollWeek(p) { const wk = weekKey(); if (p.weekKey !== wk) { p.weekKey = wk; p.weekXp = 0; } }

/* ================= Server sync (Cloudflare Pages Functions) ================= */
let serverUp = null; // null = not tried yet, true/false after the first call
const canUseServer = location.protocol.startsWith("http");
async function api(path, options = {}) {
  if (!canUseServer) throw new Error("offline");
  const res = await fetch(path, { ...options, headers: { "content-type": "application/json" } });
  if (!res.ok) { const e = new Error("http " + res.status); e.status = res.status; throw e; }
  return res.json();
}
const syncQueue = {};
function syncKid(p) {
  if (!canUseServer) return;
  const body = {
    id: p.id, token: p.token, name: p.name, year: p.year, avatar: p.avatar,
    photo: p.photoPublic && p.photo ? p.photo : null, frame: p.frame,
    xp: p.xp, weekXp: p.weekXp, weekKey: p.weekKey, level: levelOf(p.xp),
  };
  // One write at a time per player; later calls send the newest data.
  syncQueue[p.id] = (syncQueue[p.id] || Promise.resolve()).then(() =>
    api("/api/player", { method: "POST", body: JSON.stringify(body) })
      .then(() => { serverUp = true; })
      .catch((e) => { if (e.status === 400) toast("The leaderboard didn’t accept that nickname. Try another one."); else serverUp = false; })
  );
  return syncQueue[p.id];
}
function removeFromServer(p) {
  if (!canUseServer) return;
  api("/api/player", { method: "DELETE", body: JSON.stringify({ id: p.id, token: p.token }) }).catch(() => {});
}

let boardPeriod = "week";
let boardStage = 0;
let boardRows = [];
async function fetchBoard() {
  try {
    const q = new URLSearchParams({ period: boardPeriod, week: weekKey(), stage: String(boardStage) });
    const data = await api("/api/leaderboard?" + q);
    serverUp = true;
    boardRows = (data.players || []).map(cleanRow).filter(Boolean);
  } catch (e) {
    serverUp = false;
    boardRows = kids().map((k) => cleanRow({ ...k, photo: k.photo, level: levelOf(k.xp) })).filter(Boolean)
      .filter((r) => !boardStage || yearStage(r.year) === boardStage);
  }
  renderBoards();
}
function cleanRow(r) {
  if (!r || typeof r !== "object" || typeof r.name !== "string" || !r.name) return null;
  const photoOk = typeof r.photo === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(r.photo) && r.photo.length < 60000;
  const year = Number.isInteger(r.year) && r.year >= 0 && r.year < YEARS.length ? r.year : 0;
  return {
    id: String(r.id || ""), name: r.name.slice(0, 16), year,
    avatar: ALL_AVATARS.includes(r.avatar) ? r.avatar : "🙂",
    photo: photoOk ? r.photo : "", frame: FRAMES.includes(r.frame) ? r.frame : "",
    xp: Math.max(0, Number(r.xp) || 0), weekXp: Math.max(0, Number(r.weekXp) || 0),
    weekKey: String(r.weekKey || ""), level: levelOf(Math.max(0, Number(r.xp) || 0)),
  };
}

/* ================= Sound & speech ================= */
let audio;
function tones(notes, type = "triangle") {
  if (!prefs.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    let t = audio.currentTime;
    for (const [freq, dur] of notes) {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + dur);
      t += dur * 0.8;
    }
  } catch (e) {}
}
const sfx = {
  right: () => tones([[523, .12], [659, .12], [784, .22]]),
  wrong: () => tones([[330, .15], [262, .22]], "sine"),
  reveal: () => tones([[330, .18], [247, .3]], "sine"),
  win: () => tones([[523, .12], [659, .12], [784, .12], [1047, .35]]),
  coin: () => tones([[988, .07], [1319, .18]], "square"),
  click: () => tones([[700, .05]]),
};
function speakable(t) {
  return String(t).replace(/−/g, " minus ").replace(/×/g, " times ").replace(/÷/g, " divided by ")
    .replace(/²/g, " squared").replace(/³/g, " cubed").replace(/√/g, "root ").replace(/π/g, " pi").replace(/…/g, "");
}
function say(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text));
    u.rate = 0.92; u.pitch = 1.1; u.lang = "en-GB";
    speechSynthesis.speak(u);
  } catch (e) {}
}
function hush() { try { speechSynthesis.cancel(); } catch (e) {} }

function syncToggles() {
  $("soundBtn").setAttribute("aria-pressed", prefs.sound);
  $("soundIcon").textContent = prefs.sound ? "🔔" : "🔕";
  $("voiceBtn").setAttribute("aria-pressed", prefs.voice);
}
$("soundBtn").onclick = () => { prefs.sound = !prefs.sound; save("bb2-prefs", prefs); syncToggles(); };
$("voiceBtn").onclick = () => {
  prefs.voice = !prefs.voice; save("bb2-prefs", prefs); syncToggles();
  if (prefs.voice && !$("game").hidden && game) readQuestion(); else hush();
};

/* ================= Avatars ================= */
function avatarEl(k, size = "") {
  const w = el("span", `av ${size} ${k.frame ? "fr " + k.frame : ""}`);
  if (k.photo) { const img = new Image(); img.src = k.photo; img.alt = ""; w.appendChild(img); }
  else w.textContent = k.avatar || "🙂";
  return w;
}

/* ================= Screens & navigation ================= */
const SCREENS = ["play", "rewards", "board", "report", "game", "results"];
function show(name) {
  SCREENS.forEach((s) => ($(s).hidden = s !== name));
  $("nav").hidden = name === "game";
  document.querySelectorAll("#nav button").forEach((b) => b.setAttribute("aria-current", b.dataset.tab === name ? "page" : "false"));
  window.scrollTo(0, 0);
  if (name === "play") renderPlay();
  if (name === "rewards") renderRewards();
  if (name === "board") { renderBoards(); fetchBoard(); }
  if (name === "report") renderReport();
}
document.querySelectorAll("#nav button").forEach((b) => (b.onclick = () => { sfx.click(); show(b.dataset.tab); }));
$("homeLink").onclick = () => { if ($("game").hidden) show("play"); };
$("seeBoard").onclick = () => show("board");

function renderMeChip() {
  const p = me(), chip = $("meChip");
  chip.hidden = !p;
  if (!p) return;
  chip.replaceChildren(avatarEl(p, "sm"), el("span", "nm", p.name), el("span", "coins", `🪙 ${num(p.coins)}`));
}
$("meChip").onclick = () => openWho();

/* ================= Play screen ================= */
function renderPlay() {
  const p = me();
  renderMeChip();
  if (!p) return;
  rollWeek(p);
  const L = levelOf(p.xp), rank = rankOf(L), lo = xpFor(L), hi = xpFor(L + 1);
  const hello = $("hello");
  hello.replaceChildren();
  hello.appendChild(avatarEl(p, "xl"));
  const box = el("div");
  box.append(el("h1", "", `Hi, ${p.name}!`), el("div", "rank-line", `Level ${L} · ${rank[2]} ${rank[1]}`));
  const bar = el("div", "xpbar"); const fill = el("span"); fill.style.width = `${Math.round(((p.xp - lo) / (hi - lo)) * 100)}%`; bar.appendChild(fill);
  box.append(bar, el("div", "xpbar-label", `${num(p.xp - lo)} / ${num(hi - lo)} XP to level ${L + 1}`));
  hello.appendChild(box);
  const stats = el("div", "stat-row");
  stats.append(
    el("span", "stat", `🪙 ${num(p.coins)} coins`),
    el("span", "stat", `🔥 ${p.dayStreak} day streak`),
    el("span", "stat", `🏅 ${Object.keys(p.badges).length} / ${BADGES.length} badges`),
    el("span", "stat", `⭐ ${num(p.weekXp)} XP this week`),
  );
  hello.appendChild(stats);

  const stages = $("stages");
  stages.replaceChildren();
  for (let n = 1; n <= 5; n++) {
    const b = el("button", "stage");
    b.setAttribute("aria-pressed", p.stage === n);
    b.append(document.createTextNode(STAGES[n].label), el("small", "", STAGES[n].ks));
    b.onclick = () => { p.stage = n; saveAccount(); sfx.click(); renderPlay(); };
    stages.appendChild(b);
  }

  const tiles = $("tiles");
  tiles.replaceChildren();
  const today = ymd();
  const daily = el("button", "tile daily" + (p.dailyDone === today ? " done" : ""));
  daily.append(el("span", "emo", "📅"));
  const dText = el("span");
  dText.append(el("span", "name", "Daily Challenge"), el("br"), el("span", "blurb", "10 questions from every subject · double coins!"));
  daily.append(dText, el("span", "meta", p.dailyDone === today ? "✓ Done today, come back tomorrow" : "Ready!"));
  daily.onclick = () => { if (p.dailyDone !== today) { sfx.click(); startGame("daily"); } };
  tiles.appendChild(daily);

  for (const s of SUBJECTS) {
    const t = el("button", "tile");
    t.style.setProperty("--tc", s.color);
    const st = s.id === "gk" ? p.stats["gk-0"] : p.stats[`${s.id}-${p.stage}`];
    const meta = st && st.q ? `${Math.round((st.first / st.q) * 100)}% first try · ${st.q} answered` : "New! Tap to start";
    t.append(el("span", "emo", s.emoji), el("span", "name", s.name), el("span", "blurb", s.blurb), el("span", "meta", meta));
    t.onclick = () => { sfx.click(); startGame(s.id); };
    tiles.appendChild(t);
  }
  renderBoards();
}

/* ================= Leaderboard ================= */
function boardList(target, limit) {
  const p = me();
  const wk = weekKey();
  const score = (r) => (boardPeriod === "week" ? (r.weekKey === wk ? r.weekXp : 0) : r.xp);
  let rows = boardRows.slice();
  if (target === "mini") rows = rows.filter((r) => r.weekKey === wk);
  const sc = (r) => (target === "mini" ? r.weekXp : score(r));
  rows = rows.filter((r) => sc(r) > 0).sort((a, b) => sc(b) - sc(a)).slice(0, limit);
  const list = $(target === "mini" ? "miniBoard" : "bigBoard");
  list.replaceChildren();
  if (!rows.length) {
    const li = el("li", "muted", target === "mini" || boardPeriod === "week" ? "No scores yet this week. Play a round to get on the board!" : "No scores yet. Play a round to get on the board!");
    list.appendChild(li);
    return;
  }
  rows.forEach((r, i) => {
    const li = el("li", "board-row" + (p && r.id === p.id ? " me" : ""));
    li.appendChild(el("span", "pos", ["🥇", "🥈", "🥉"][i] || String(i + 1)));
    li.appendChild(avatarEl(r, "sm"));
    const who = el("span", "who");
    who.append(el("b", "", r.name), el("span", "", `${YEARS[r.year]} · Level ${r.level}`));
    li.appendChild(who);
    const pts = el("span", "pts", num(sc(r)));
    pts.appendChild(el("small", "", "XP"));
    li.appendChild(pts);
    list.appendChild(li);
  });
}
function renderBoards() {
  boardList("mini", 5);
  boardList("big", 50);
  const note = $("boardNote");
  if (serverUp === false || !canUseServer) {
    note.hidden = false;
    note.textContent = "The shared leaderboard isn’t reachable right now, so only players on this device are shown. Your progress is still saved here.";
  } else note.hidden = true;
}
$("bWeek").onclick = () => { boardPeriod = "week"; $("bWeek").setAttribute("aria-pressed", true); $("bAll").setAttribute("aria-pressed", false); fetchBoard(); };
$("bAll").onclick = () => { boardPeriod = "all"; $("bAll").setAttribute("aria-pressed", true); $("bWeek").setAttribute("aria-pressed", false); fetchBoard(); };
(function fillStageFilter() {
  const s = $("bStage");
  s.appendChild(new Option("Every school year", "0"));
  for (let n = 1; n <= 5; n++) s.appendChild(new Option(STAGES[n].label, String(n)));
  s.onchange = () => { boardStage = Number(s.value); fetchBoard(); };
})();

/* ================= Rewards ================= */
function renderRewards() {
  const p = me(); if (!p) return;
  renderMeChip();
  const L = levelOf(p.xp);
  const ranks = $("ranks"); ranks.replaceChildren();
  for (const [lvl, name, icon] of RANKS) {
    const d = el("div", "rank " + (L >= lvl ? "got" : "locked"));
    d.append(el("b", "", `${icon} ${name}`), el("span", "", L >= lvl ? `Unlocked at level ${lvl}` : `Reach level ${lvl}`));
    ranks.appendChild(d);
  }
  $("badgeCount").textContent = `(${Object.keys(p.badges).length} of ${BADGES.length})`;
  const badges = $("badges"); badges.replaceChildren();
  for (const [id, icon, name, desc] of BADGES) {
    const got = !!p.badges[id];
    const d = el("div", "badge" + (got ? "" : " locked"));
    d.append(el("div", "ic", icon), el("b", "", name), el("span", "", desc));
    badges.appendChild(d);
  }
  $("shopCoins").textContent = `· you have 🪙 ${num(p.coins)}`;
  const shop = $("shop"); shop.replaceChildren();
  for (const item of SHOP) {
    const d = el("div", "item");
    if (item.kind === "avatar") d.appendChild(avatarEl({ avatar: item.id, frame: "" }, "lg"));
    else d.appendChild(avatarEl({ ...p, frame: item.id }, "lg"));
    d.appendChild(el("b", "", item.name));
    const owned = p.owned.includes(item.id);
    const using = item.kind === "avatar" ? !p.photo && p.avatar === item.id : p.frame === item.id;
    const btn = el("button");
    if (using) { btn.className = "using"; btn.textContent = "In use ✓"; btn.disabled = true; }
    else if (owned) { btn.className = "owned"; btn.textContent = "Use this"; }
    else { btn.textContent = `Unlock · 🪙 ${item.price}`; btn.disabled = p.coins < item.price; if (btn.disabled) btn.title = "Win more coins to unlock this"; }
    btn.onclick = () => {
      if (!owned) {
        if (p.coins < item.price) return;
        p.coins -= item.price; p.owned.push(item.id); sfx.coin(); burst(btn, 50);
        toast(`You unlocked ${item.name}!`);
        checkBadges(p, null);
      }
      if (item.kind === "avatar") { p.avatar = item.id; p.photo = ""; p.photoPublic = false; } else p.frame = item.id;
      saveAccount(); syncKid(p); renderRewards();
    };
    d.appendChild(btn);
    shop.appendChild(d);
  }
}

/* ================= Report card ================= */
function gradeFor(score, stage) {
  const primary = stage <= 3;
  if (score >= 0.85) return { label: primary ? "Greater depth" : "Excelling", color: "#B8F0D2" };
  if (score >= 0.6) return { label: primary ? "Expected standard" : "Secure", color: "#FFE9A8" };
  return { label: primary ? "Working towards" : "Developing", color: "#FFD3C9" };
}
function renderReport() {
  const p = me(); if (!p) return;
  const grid = $("reportGrid"); grid.replaceChildren();
  for (const s of SUBJECTS) {
    const card = el("section", "subj");
    const h = el("h3"); h.append(el("span", "", s.emoji), el("span", "", s.name)); card.appendChild(h);
    const stageList = s.id === "gk" ? [0] : [1, 2, 3, 4, 5];
    const rows = stageList.map((n) => [n, p.stats[`${s.id}-${n}`]]).filter(([, st]) => st && st.q);
    if (!rows.length) { card.appendChild(el("p", "muted", "Not played yet. Give it a go!")); grid.appendChild(card); continue; }
    const t = el("table"); const head = el("tr");
    ["Level", "First try", "Grade"].forEach((x) => head.appendChild(el("th", "", x)));
    t.appendChild(head);
    for (const [n, st] of rows) {
      const tr = el("tr");
      tr.appendChild(el("td", "", n ? STAGES[n].label : "All ages"));
      const td = el("td", "num"); const m = el("div", "meter"); const f = el("span"); f.style.width = `${Math.round((st.first / st.q) * 100)}%`; m.appendChild(f);
      td.append(el("span", "", `${Math.round((st.first / st.q) * 100)}% of ${st.q}`), m); tr.appendChild(td);
      const g = gradeFor((st.first + 0.5 * (st.right - st.first)) / st.q, n || yearStage(p.year));
      const gt = el("span", "gtag", g.label); gt.style.setProperty("--gt", g.color);
      const tdg = el("td"); tdg.appendChild(gt); tr.appendChild(tdg);
      t.appendChild(tr);
    }
    card.appendChild(t);
    grid.appendChild(card);
  }
}

/* ================= Player card (onboarding) ================= */
let ob = { mode: "new", avatar: FREE_AVATARS[0], photo: "" };
(function fillYears() { YEARS.forEach((y, i) => $("obYear").appendChild(new Option(y, String(i)))); $("obYear").value = "3"; })();

function renderObAvatars() {
  const p = ob.mode === "edit" ? me() : null;
  const choices = [...FREE_AVATARS, ...(p ? p.owned.filter((o) => ALL_AVATARS.includes(o)) : [])];
  const wrap = $("obAvatars"); wrap.replaceChildren();
  for (const a of choices) {
    const b = el("button", "", a); b.type = "button";
    b.setAttribute("aria-pressed", !ob.photo && ob.avatar === a);
    b.setAttribute("aria-label", "Choose character " + a);
    b.onclick = () => { ob.avatar = a; ob.photo = ""; renderObAvatars(); };
    wrap.appendChild(b);
  }
  $("obPreview").replaceChildren(avatarEl({ avatar: ob.avatar, photo: ob.photo, frame: p ? p.frame : "" }, "lg"));
  $("obPhotoClear").hidden = !ob.photo;
  $("obPublicRow").hidden = !ob.photo;
}
function openOnboard(mode) {
  ob.mode = mode;
  const p = mode === "edit" ? me() : null;
  $("obTitle").textContent = p ? "Edit your player card" : kids().length ? "Add a new player" : "Welcome to Brainy Blast!";
  $("obSub").textContent = p ? "Change your nickname, year or picture." : "Let’s make your player card.";
  $("obName").value = p ? p.name : "";
  $("obYear").value = String(p ? p.year : 3);
  ob.avatar = p ? p.avatar : FREE_AVATARS[Math.floor(Math.random() * FREE_AVATARS.length)];
  ob.photo = p ? p.photo || "" : "";
  $("obPublic").checked = p ? !!p.photoPublic : false;
  $("obCancel").hidden = !kids().length;
  $("obRemove").hidden = !p;
  $("obRemove").dataset.armed = "";
  $("obRemove").textContent = "Remove this player";
  $("obErr").hidden = true;
  $("obSubmit").textContent = p ? "Save" : "Let’s go! 🚀";
  renderObAvatars();
  $("who").hidden = true;
  $("onboard").hidden = false;
  setTimeout(() => $("obName").focus(), 50);
}
$("obPhoto").onchange = async (e) => {
  const file = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try { ob.photo = await shrinkPhoto(file); renderObAvatars(); }
  catch (err) { $("obErr").hidden = false; $("obErr").textContent = "That picture couldn’t be opened. Try a JPG or PNG photo."; }
};
document.querySelector('label[for="obPhoto"]').onkeydown = (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("obPhoto").click(); }
};
$("obPhotoClear").onclick =() => { ob.photo = ""; $("obPublic").checked = false; renderObAvatars(); };
$("obCancel").onclick = () => { $("onboard").hidden = true; };
$("obRemove").onclick = () => {
  const btn = $("obRemove");
  if (!btn.dataset.armed) { btn.dataset.armed = "1"; btn.textContent = "Tap again to remove for good"; return; }
  const p = me(); if (!p) return;
  removeFromServer(p);
  delete account.kids[p.id];
  account.active = kids()[0] ? kids()[0].id : null;
  saveAccount();
  $("onboard").hidden = true;
  if (!me()) openOnboard("new"); else show("play");
};
$("obForm").onsubmit = (e) => {
  e.preventDefault();
  const name = $("obName").value.trim().replace(/\s+/g, " ");
  const problem = nameProblem(name);
  if (problem) { $("obErr").hidden = false; $("obErr").textContent = problem; $("obName").focus(); return; }
  const year = Number($("obYear").value);
  const photoPublic = !!ob.photo && $("obPublic").checked;
  if (ob.mode === "edit" && me()) {
    const p = me();
    const oldStage = yearStage(p.year);
    Object.assign(p, { name, year, avatar: ob.avatar, photo: ob.photo, photoPublic });
    if (yearStage(year) !== oldStage) p.stage = yearStage(year);
  } else {
    const p = newKid({ name, year, avatar: ob.avatar, photo: ob.photo, photoPublic });
    account.kids[p.id] = p;
    account.active = p.id;
    toast("🎁 Welcome gift: 20 coins to spend in the prize shop!");
  }
  saveAccount();
  syncKid(me());
  $("onboard").hidden = true;
  show("play");
};
function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const size = 128, c = document.createElement("canvas");
        c.width = c.height = size;
        const s = Math.min(img.width, img.height);
        c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Who's playing */
function openWho() {
  const list = $("whoList"); list.replaceChildren();
  for (const k of kids()) {
    const b = el("button");
    b.setAttribute("aria-pressed", k.id === account.active);
    const t = el("span"); t.append(document.createTextNode(k.name), el("small", "", `${YEARS[k.year]} · Level ${levelOf(k.xp)} · 🪙 ${num(k.coins)}`));
    b.append(avatarEl(k, "sm"), t);
    b.onclick = () => { account.active = k.id; saveAccount(); openWho(); renderPlay(); };
    list.appendChild(b);
  }
  $("who").hidden = false;
}
$("whoAdd").onclick = () => openOnboard("new");
$("whoEdit").onclick = () => openOnboard("edit");
$("whoClose").onclick = () => { $("who").hidden = true; show("play"); };
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!$("who").hidden) $("whoClose").click();
  else if (!$("onboard").hidden && kids().length) $("onboard").hidden = true;
});

/* ================= Question files (questions/*.csv) ================= */
const QUESTION_FILES = { english: "english.csv", science: "science.csv", tech: "tech.csv", gk: "general-knowledge.csv" };
const BANK = { english: [], science: [], tech: [], gk: [] };

// Reads CSV the way Excel and GitHub write it: quoted fields, "" inside quotes, commas and line breaks inside quotes.
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}
function csvToQuestions(text) {
  const [head, ...rows] = parseCSV(text);
  const col = (name) => head.findIndex((h) => h.trim().toLowerCase() === name);
  const c = { level: col("level"), q: col("question"), a: col("answer"), w1: col("wrong1"), w2: col("wrong2"), w3: col("wrong3"), f: col("explanation"), h: col("hint") };
  const get = (r, i) => (i >= 0 && r[i] != null ? r[i].trim() : "");
  const out = [];
  for (const r of rows) {
    const q = get(r, c.q), a = get(r, c.a);
    const w = [get(r, c.w1), get(r, c.w2), get(r, c.w3)].filter((x) => x && x !== a);
    if (!q || !a || w.length < 2) continue; // skip blank or unfinished rows
    const lv = get(r, c.level).toLowerCase();
    out.push({ level: lv === "all" || lv === "" ? 0 : Number(lv) || 0, q, a, w: [...new Set(w)], f: get(r, c.f), h: get(r, c.h) });
  }
  return out;
}
const questionsReady = Promise.all(Object.entries(QUESTION_FILES).map(async ([sub, file]) => {
  try {
    const res = await fetch(`questions/${file}`, { cache: "no-cache" });
    if (res.ok) BANK[sub] = csvToQuestions(await res.text());
  } catch (e) {}
})).then(() => {
  const total = Object.values(BANK).reduce((n, b) => n + b.length, 0);
  if (total) $("qCount").textContent = `${num(total)} written questions plus endless maths`;
});

/* ================= Questions for a round ================= */
const recent = load("bb2-recent", {});
// Prefer this level's questions (plus "all" for General Knowledge), topping up from the nearest levels.
function pool(sub, stage) {
  const rows = BANK[sub];
  const exact = rows.filter((r) => r.level === stage || (sub === "gk" && r.level === 0));
  if (exact.length >= ROUND) return exact;
  const others = rows.filter((r) => !exact.includes(r)).sort((x, y) => Math.abs((x.level || stage) - stage) - Math.abs((y.level || stage) - stage));
  return [...exact, ...others.slice(0, ROUND - exact.length)];
}
function fromBank(rows, sub, key, count) {
  const seen = new Set(recent[key] || []);
  let fresh = rows.filter((r) => !seen.has(r.q));
  if (fresh.length < count) { seen.clear(); fresh = rows; }
  const chosen = shuffle(fresh).slice(0, count);
  chosen.forEach((r) => seen.add(r.q));
  recent[key] = [...seen].slice(-400);
  save("bb2-recent", recent);
  return chosen.map((r) => ({ q: r.q, a: r.a, w: r.w.slice(0, 3), f: r.f, h: r.h, sub }));
}
function mathsQs(stage, count) {
  const out = [], seen = new Set();
  const gens = MATHS[stage];
  let order = shuffle(gens), tries = 0;
  while (out.length < count && tries++ < 200) {
    if (!order.length) order = shuffle(gens);
    const o = order.pop()();
    if (seen.has(o.q)) continue;
    seen.add(o.q);
    out.push({ q: o.q, a: String(o.a), w: o.w ? o.w.map(String) : null, f: o.f || "", h: o.h || "", sub: "maths" });
  }
  return out;
}
function questionsFor(sub, stage, count) {
  if (sub === "maths") return mathsQs(stage, count);
  return fromBank(pool(sub, stage), sub, `${sub}-${stage}`, count);
}

/* ================= The game ================= */
let game = null;
function subjectInfo(id) { return SUBJECTS.find((s) => s.id === id) || DAILY; }

async function startGame(mode) {
  const p = me(); if (!p) return;
  await questionsReady;
  const stage = p.stage;
  const list = mode === "daily"
    ? shuffle(["maths", "english", "science", "tech", "gk"].flatMap((s) => questionsFor(s, stage, 2)))
    : questionsFor(mode, stage, ROUND);
  if (!list.length) { toast("Those questions couldn’t be loaded. Check your internet connection and try again."); return; }
  game = { mode, stage, list, i: 0, xp: 0, coins: 0, first: 0, correct: 0, third: 0, points: 0, results: [], xpStart: p.xp };
  const info = subjectInfo(mode);
  $("catChip").textContent = `${info.emoji} ${info.name}`;
  $("catChip").style.setProperty("--tc", info.color);
  $("stageChip").textContent = mode === "gk" ? "All ages" : STAGES[stage].label;
  $("quitBtn").textContent = "← Quit";
  $("quitBtn").dataset.armed = "";
  show("game");
  renderQuestion();
}

function renderDots() {
  const dots = $("dots"); dots.replaceChildren();
  for (let k = 0; k < game.list.length; k++) {
    const r = game.results[k];
    dots.appendChild(el("span", "dot" + (r === 0 ? " first" : r === 1 || r === 2 ? " later" : r === -1 ? " miss" : k === game.i ? " now" : "")));
  }
}
function renderHearts() { $("hearts").textContent = "❤️".repeat(TRIES - game.tries) + "🤍".repeat(game.tries); $("hearts").setAttribute("aria-label", `${TRIES - game.tries} tries left`); }

function renderQuestion() {
  const q = game.list[game.i];
  game.tries = 0; game.over = false;
  game.options = q.w ? shuffle([q.a, ...q.w]) : null;
  const subj = subjectInfo(q.sub);
  $("qNum").textContent = `Question ${game.i + 1} of ${game.list.length}` + (game.mode === "daily" ? ` · ${subj.emoji} ${subj.name}` : "");
  $("qText").textContent = q.q;
  $("xpChip").textContent = `+${game.xp} XP`;
  $("feedback").hidden = true;
  $("nudge").replaceChildren();
  $("guesses").replaceChildren();
  renderHearts();
  renderDots();

  const box = $("answers"); box.replaceChildren();
  const typed = $("typed");
  if (game.options) {
    typed.hidden = true; box.hidden = false;
    game.options.forEach((opt, k) => {
      const b = el("button", "ans");
      const letter = el("span", "letter"); letter.appendChild(el("span", "", "ABCD"[k]));
      b.append(letter, el("span", "", pretty(opt)));
      b.onclick = () => tryAnswer(opt, b);
      box.appendChild(b);
    });
  } else {
    box.hidden = true; typed.hidden = false;
    const input = $("typedInput");
    input.value = ""; input.disabled = false; $("checkBtn").disabled = false;
    input.setAttribute("inputmode", game.stage <= 2 ? "numeric" : "text");
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  }
  if (prefs.voice) readQuestion();
}
function readQuestion() {
  const q = game.list[game.i];
  say(game.options ? `${q.q} ... ${game.options.map((o, k) => `${"ABCD"[k]}: ${o}`).join(". ")}` : q.q);
}
$("speakBtn").onclick = () => readQuestion();

function norm(s) {
  return String(s).toLowerCase().trim().replace(/[−–—]/g, "-").replace(/[£,\s]/g, "").replace(/(cm²|cm2|cm|p|°c|°|degrees|pence)$/, "");
}
function matches(input, ans) {
  const a = norm(input), b = norm(ans);
  if (!a) return false;
  if (a === b) return true;
  const na = Number(a), nb = Number(b);
  return Number.isFinite(na) && Number.isFinite(nb) && Math.abs(na - nb) < 1e-9;
}

$("typed").onsubmit = (e) => {
  e.preventDefault();
  const input = $("typedInput");
  if (!input.value.trim() || game.over) return;
  tryAnswer(input.value.trim(), null);
};

function tryAnswer(value, btn) {
  if (game.over) return;
  const q = game.list[game.i];
  const right = btn ? value === q.a : matches(value, q.a);
  if (right) return finishQuestion(true, btn);
  game.tries++;
  renderHearts();
  if (btn) { btn.classList.add("crossed"); btn.disabled = true; }
  else {
    const input = $("typedInput");
    input.classList.remove("shake"); void input.offsetWidth; input.classList.add("shake");
    $("guesses").appendChild(el("span", "", value));
    input.value = ""; input.focus({ preventScroll: true });
  }
  if (game.tries >= TRIES) return finishQuestion(false, null);
  sfx.wrong();
  const left = TRIES - game.tries;
  const nudge = $("nudge"); nudge.replaceChildren();
  nudge.appendChild(document.createTextNode(`${["Not quite!", "Oops, have another go!", "Keep thinking!"][game.tries - 1] || "Try again!"} ${left} ${left === 1 ? "try" : "tries"} left.`));
  if (game.tries >= 1 && q.h) nudge.appendChild(el("span", "hint", `💡 Hint: ${q.h}`));
  if (prefs.voice) say(`Not quite. ${left} ${left === 1 ? "try" : "tries"} left.` + (q.h ? ` Hint: ${q.h}` : ""));
}

const CHEERS = ["Awesome!", "You got it!", "Super smart!", "Brilliant!", "Yes! Well done!", "Great job!", "Brain power!"];
const LATER = ["Got it! Great thinking!", "Yes! You worked it out!", "Well done for not giving up!"];
function finishQuestion(correct, btn) {
  game.over = true;
  const p = me();
  const q = game.list[game.i];
  const tries = game.tries;
  $("nudge").replaceChildren();
  // lock answers
  if (game.options) {
    [...$("answers").children].forEach((b, j) => {
      b.disabled = true;
      if (game.options[j] === q.a) b.classList.add("is-right");
      else if (!b.classList.contains("crossed")) b.classList.add("dim");
    });
  } else { $("typedInput").disabled = true; $("checkBtn").disabled = true; }

  // score
  let gainXp = 0, gainCoins = 0, extra = "";
  const key = game.mode === "daily" && q.sub !== "gk" ? `${q.sub}-${game.stage}` : q.sub === "gk" ? "gk-0" : `${q.sub}-${game.stage}`;
  const st = (p.stats[key] = p.stats[key] || { q: 0, first: 0, right: 0 });
  st.q++;
  if (correct) {
    gainXp = POINTS[tries];
    gainCoins = COINS[tries] * (game.mode === "daily" ? 2 : 1);
    st.right++;
    game.correct++;
    game.points += POINTS[tries];
    if (tries === 0) {
      st.first++; game.first++;
      p.curStreak++; p.bestStreak = Math.max(p.bestStreak, p.curStreak);
      if (p.curStreak >= 3) { gainXp += 2; extra = ` · 🔥 ${p.curStreak} in a row +2`; }
    } else p.curStreak = 0;
    if (tries === 2) game.third++;
    sfx.right(); burst(btn || $("typedInput"));
  } else { p.curStreak = 0; sfx.reveal(); }
  game.results[game.i] = correct ? tries : -1;
  game.xp += gainXp; game.coins += gainCoins;

  const fb = $("feedback");
  fb.className = "feedback " + (correct ? "good" : "try");
  $("fbFace").textContent = correct ? (tries === 0 ? ["🤩", "🥳", "😎", "🎉", "🙌"][Math.floor(Math.random() * 5)] : "💪") : "🤔";
  $("fbTitle").textContent = correct
    ? (tries === 0 ? CHEERS[Math.floor(Math.random() * CHEERS.length)] : LATER[Math.floor(Math.random() * LATER.length)])
    : `Good try! The answer is ${pretty(q.a)}.`;
  $("fbGain").textContent = correct ? `+${gainXp} XP · +${gainCoins} 🪙${extra}` : "Three tries used. You’ll get the next one!";
  $("fbFact").textContent = q.f ? `💡 ${q.f}` : "";
  $("nextBtn").textContent = game.i === game.list.length - 1 ? "See my results ⭐" : "Next →";
  fb.hidden = false;
  $("xpChip").textContent = `+${game.xp} XP`;
  renderHearts();
  renderDots();
  $("nextBtn").focus({ preventScroll: true });
  fb.scrollIntoView({ block: "nearest", behavior: "smooth" });
  if (prefs.voice) say(`${$("fbTitle").textContent} ${q.f}`);
}
$("nextBtn").onclick = () => {
  hush(); sfx.click();
  game.i++;
  if (game.i >= game.list.length) endRound(); else renderQuestion();
};
$("quitBtn").onclick = () => {
  const b = $("quitBtn");
  if (!b.dataset.armed) { b.dataset.armed = "1"; b.textContent = "Tap again to quit"; setTimeout(() => { b.dataset.armed = ""; b.textContent = "← Quit"; }, 3000); return; }
  hush(); saveAccount(); game = null; show("play");
};

/* ================= End of round & rewards ================= */
function checkBadges(p, round) {
  const fresh = [];
  for (const [id, icon, name, desc, test] of BADGES) {
    if (!p.badges[id] && test(p, round)) { p.badges[id] = Date.now(); fresh.push([icon, name]); }
  }
  return fresh;
}
function endRound() {
  const p = me();
  const g = game;
  const bonuses = [];
  const levelBefore = levelOf(g.xpStart);
  rollWeek(p);

  // daily streak
  const today = ymd();
  if (p.lastDay !== today) {
    p.dayStreak = p.lastDay === yesterday() ? p.dayStreak + 1 : 1;
    p.lastDay = today;
    const streakCoins = Math.min(p.dayStreak, 5) * 2;
    g.coins += streakCoins;
    bonuses.push(`🔥 Day ${p.dayStreak} streak: +${streakCoins} coins`);
  }
  if (g.correct === g.list.length) { g.xp += 25; g.coins += 10; bonuses.push("💯 Perfect round: +25 XP, +10 coins"); }
  if (g.mode === "daily") { p.dailyDone = today; bonuses.push("📅 Daily Challenge: double coins!"); }
  if (g.mode !== "gk" && g.stage > yearStage(p.year)) { const b = Math.round(g.xp * 0.2); g.xp += b; bonuses.push(`🧗 Brave climber (harder level): +${b} XP`); }

  p.xp += g.xp; p.weekXp += g.xp; p.coins += g.coins;
  p.answered += g.list.length;
  p.rounds[g.mode] = (p.rounds[g.mode] || 0) + 1;
  const newBadges = checkBadges(p, { total: g.list.length, correct: g.correct, first: g.first, third: g.third, stage: g.stage });
  saveAccount();
  syncKid(p)?.then(() => fetchBoard());

  // screen
  const stars = g.correct >= 9 ? 3 : g.correct >= 6 ? 2 : g.correct >= 3 ? 1 : 0;
  $("trophy").replaceChildren(...[0, 1, 2].map((n) => el("span", "s" + (n < stars ? " on" : ""), "★")));
  $("resTitle").textContent = ["Good try! Practice makes progress!", "Nice work, keep going!", "Wow, you’re a quiz star!", g.first === g.list.length ? "PERFECT! Every one first time!" : "Amazing! Brain champion!"][stars];
  const grade = gradeFor(g.points / (g.list.length * POINTS[0]), g.mode === "gk" ? yearStage(p.year) : g.stage);
  $("resGrade").textContent = `Practice grade: ${grade.label}`;
  $("resGrade").style.setProperty("--gp", grade.color);
  const tally = $("tally"); tally.replaceChildren();
  [[`${g.correct}/${g.list.length}`, "correct"], [`${g.first}`, "right first time"], [`+${g.xp}`, "XP earned"], [`+${g.coins}`, "coins won"]].forEach(([b, s]) => {
    const d = el("div"); d.append(el("b", "", b), el("span", "", s)); tally.appendChild(d);
  });
  const L = levelOf(p.xp);
  const lu = $("levelUp");
  if (L > levelBefore) {
    const r = rankOf(L);
    lu.hidden = false;
    lu.textContent = `⬆️ Level up! You’re now level ${L}` + (rankOf(levelBefore)[1] !== r[1] ? `, a ${r[2]} ${r[1]}!` : "!");
  } else lu.hidden = true;
  const bl = $("bonusList"); bl.replaceChildren(...bonuses.map((b) => el("li", "", b)));
  const nb = $("newBadges"); nb.replaceChildren(...newBadges.map(([icon, name]) => el("span", "badge-mini", `${icon} New badge: ${name}`)));
  show("results");
  renderMeChip();
  if (stars >= 2 || L > levelBefore || newBadges.length) { sfx.win(); burst(null, 160); }
  if (prefs.voice) say(`${$("resTitle").textContent} You got ${g.correct} out of ${g.list.length}. ${grade.label}.`);
}
$("againBtn").onclick = () => { if (game.mode === "daily") show("play"); else startGame(game.mode); };
$("menuBtn").onclick = () => show("play");
$("toBoardBtn").onclick = () => show("board");

/* ================= Confetti ================= */
const canvas = $("confetti"), ctx = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let bits = [], raf = null;
function sizeCanvas() { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; }
addEventListener("resize", sizeCanvas); sizeCanvas();
function burst(fromEl, count = 70) {
  if (reduceMotion) return;
  const r = fromEl ? fromEl.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 3, width: 0, height: 0 };
  const dpr = devicePixelRatio, cx = (r.left + r.width / 2) * dpr, cy = (r.top + r.height / 2) * dpr;
  const colors = ["#FFC21A", "#FF5A4E", "#2E86FF", "#22B573", "#8A5CF6", "#FF5FA2"];
  for (let n = 0; n < count; n++) {
    const a = Math.random() * Math.PI * 2, sp = (4 + Math.random() * 8) * dpr;
    bits.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6 * dpr, s: (6 + Math.random() * 6) * dpr, rot: Math.random() * 6, vr: Math.random() * .3 - .15, c: colors[n % colors.length], life: 90 + Math.random() * 40 });
  }
  if (!raf) raf = requestAnimationFrame(tick);
}
function tick() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  bits = bits.filter((b) => b.life-- > 0 && b.y < canvas.height + 40);
  for (const b of bits) {
    b.vy += 0.35 * devicePixelRatio; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.rot += b.vr;
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); ctx.restore();
  }
  raf = bits.length ? requestAnimationFrame(tick) : (ctx.clearRect(0, 0, canvas.width, canvas.height), null);
}

/* ================= Start ================= */
syncToggles();
if (!me() && kids().length) account.active = kids()[0].id;
if (me()) { show("play"); kids().forEach((k) => syncKid(k)); } else { show("play"); openOnboard("new"); }
fetchBoard();
