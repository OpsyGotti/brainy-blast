// Brainy Blast server for Cloudflare Pages (advanced mode).
// Handles /api/* for the leaderboard and serves every other file as normal.
// Needs a D1 database bound to the Pages project with the variable name DB.
//
//   POST   /api/player       create or update a player card (needs the player's secret token)
//   DELETE /api/player       remove a player card
//   GET    /api/leaderboard  ?period=week|all&week=YYYY-MM-DD&stage=0..5

const AVATARS = ["🦁", "🐯", "🐼", "🦊", "🐸", "🐙", "🐧", "🐨", "🐶", "🐱", "🐵", "🐰", "🦄", "🦖", "🤖", "👽", "🐉", "🦸", "🧙", "🧑‍🚀"];
const FRAMES = ["", "fr-gold", "fr-fire", "fr-rainbow", "fr-galaxy"];
const BLOCKED = ["fuck", "shit", "bitch", "cunt", "wank", "bastard", "slut", "whore", "nigg", "fag", "twat", "porn", "nazi", "rape", "penis", "vagina", "boob", "bollock"];
const MAX_XP_PER_SAVE = 800; // generous for one round plus bonuses; stops silly jumps
const STAGE_YEARS = { 1: [0, 2], 2: [3, 4], 3: [5, 6], 4: [7, 9], 5: [10, 12] };

const SCHEMA = `CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, name TEXT NOT NULL, year INTEGER NOT NULL DEFAULT 0,
  avatar TEXT, photo TEXT, frame TEXT, xp INTEGER NOT NULL DEFAULT 0, week_xp INTEGER NOT NULL DEFAULT 0,
  week_key TEXT, level INTEGER NOT NULL DEFAULT 1, created_at INTEGER, updated_at INTEGER)`;

const json = (data, status = 200, cache = "no-store") =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": cache } });

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function badName(name) {
  if (typeof name !== "string") return true;
  const n = name.trim();
  if (!n || n.length > 16 || !/^[\p{L}\p{N} _.'’-]+$/u.test(n)) return true;
  const flat = n.toLowerCase().replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/[^a-z]/g, "");
  return BLOCKED.some((w) => flat.includes(w));
}

const int = (v, max) => (Number.isFinite(Number(v)) ? Math.max(0, Math.min(max, Math.floor(Number(v)))) : 0);
const validIdentity = (b) =>
  b && typeof b.id === "string" && /^p_[a-z0-9]{16}$/.test(b.id) && typeof b.token === "string" && /^[a-z0-9]{32}$/.test(b.token);
async function readBody(request) { try { return await request.json(); } catch { return null; } }

// Creates the table the first time the site runs, so no manual database setup is needed.
let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  await db.prepare(SCHEMA).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_players_xp ON players (xp DESC)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_players_week ON players (week_key, week_xp DESC)").run();
  schemaReady = true;
}

async function savePlayer(request, db) {
  const b = await readBody(request);
  if (!validIdentity(b)) return json({ error: "bad identity" }, 400);
  if (badName(b.name)) return json({ error: "name" }, 400);

  const year = int(b.year, 12);
  const avatar = AVATARS.includes(b.avatar) ? b.avatar : "🦁";
  const frame = FRAMES.includes(b.frame) ? b.frame : "";
  const photo = typeof b.photo === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(b.photo) && b.photo.length < 60000 ? b.photo : null;
  const weekKey = typeof b.weekKey === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.weekKey) ? b.weekKey : "";
  let xp = int(b.xp, 10_000_000);
  let weekXp = int(b.weekXp, 10_000_000);
  const now = Date.now();
  const hash = await sha256(b.token);

  const existing = await db.prepare("SELECT token_hash, xp FROM players WHERE id = ?").bind(b.id).first();
  if (existing) {
    if (existing.token_hash !== hash) return json({ error: "forbidden" }, 403);
    xp = Math.min(xp, existing.xp + MAX_XP_PER_SAVE);
  } else {
    xp = Math.min(xp, MAX_XP_PER_SAVE);
  }
  weekXp = Math.min(weekXp, xp);
  let level = 1;
  while (xp >= 30 * (level + 1) * level) level++;

  if (existing) {
    await db.prepare(
      "UPDATE players SET name=?, year=?, avatar=?, photo=?, frame=?, xp=?, week_xp=?, week_key=?, level=?, updated_at=? WHERE id=?"
    ).bind(b.name.trim(), year, avatar, photo, frame, xp, weekXp, weekKey, level, now, b.id).run();
  } else {
    await db.prepare(
      "INSERT INTO players (id, token_hash, name, year, avatar, photo, frame, xp, week_xp, week_key, level, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
    ).bind(b.id, hash, b.name.trim(), year, avatar, photo, frame, xp, weekXp, weekKey, level, now, now).run();
  }
  return json({ ok: true, xp });
}

async function deletePlayer(request, db) {
  const b = await readBody(request);
  if (!validIdentity(b)) return json({ error: "bad identity" }, 400);
  await db.prepare("DELETE FROM players WHERE id = ? AND token_hash = ?").bind(b.id, await sha256(b.token)).run();
  return json({ ok: true });
}

async function leaderboard(url, db) {
  const period = url.searchParams.get("period") === "all" ? "all" : "week";
  const weekParam = url.searchParams.get("week") || "";
  const week = /^\d{4}-\d{2}-\d{2}$/.test(weekParam) ? weekParam : "";
  const stage = Number(url.searchParams.get("stage")) || 0;

  const where = [];
  const args = [];
  if (period === "week") { where.push("week_key = ?", "week_xp > 0"); args.push(week); }
  else where.push("xp > 0");
  if (STAGE_YEARS[stage]) { where.push("year BETWEEN ? AND ?"); args.push(...STAGE_YEARS[stage]); }
  const order = period === "week" ? "week_xp DESC" : "xp DESC";

  const { results } = await db.prepare(
    `SELECT id, name, year, avatar, photo, frame, xp, week_xp AS weekXp, week_key AS weekKey, level
     FROM players WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT 50`
  ).bind(...args).all();
  return json({ players: results }, 200, "public, max-age=15");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    if (!env.DB) return json({ error: "The leaderboard database isn't connected yet (add a D1 binding called DB)." }, 503);
    try {
      await ensureSchema(env.DB);
      if (url.pathname === "/api/player" && request.method === "POST") return await savePlayer(request, env.DB);
      if (url.pathname === "/api/player" && request.method === "DELETE") return await deletePlayer(request, env.DB);
      if (url.pathname === "/api/leaderboard" && request.method === "GET") return await leaderboard(url, env.DB);
      return json({ error: "not found" }, 404);
    } catch (e) {
      return json({ error: "server error" }, 500);
    }
  },
};
