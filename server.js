const express = require("express");
const session = require("express-session");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "romart-shifts-secret-key-2026",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ── CONFIG ──────────────────────────────────────────────────────────────────
const BOT_TOKEN   = "MTQ4MzgzNjk2ODMzMTY0MDk4NA.GhiRPr.PQ8CkvV-Mj8ZSx-USGUK4DYyTBI_nRRWRMpqq8";
const GUILD_ID    = "1482483178055667965";
const MANAGER_ROLE = "1483836330877390899";
const DATA_FILE   = path.join(__dirname, "data", "shifts.json");

// ── DATA HELPERS ─────────────────────────────────────────────────────────────
function loadShifts() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch { return []; }
}

function saveShifts(shifts) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(shifts, null, 2));
}

// ── DISCORD ROLE CHECK ───────────────────────────────────────────────────────
async function hasManagerRole(discordUserId) {
  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordUserId}`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );
    if (!res.ok) return false;
    const member = await res.json();
    return member.roles && member.roles.includes(MANAGER_ROLE);
  } catch { return false; }
}

// ── AUTH ROUTES ──────────────────────────────────────────────────────────────
// Login: provide Discord User ID, bot checks their role
app.post("/api/login", async (req, res) => {
  const { discordId } = req.body;
  if (!discordId || !/^\d{17,19}$/.test(discordId.trim())) {
    return res.json({ success: false, error: "Invalid Discord User ID." });
  }
  const id = discordId.trim();
  const allowed = await hasManagerRole(id);
  if (!allowed) {
    return res.json({ success: false, error: "You don't have the required role in the server." });
  }
  // Fetch username for display
  try {
    const r = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${id}`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } });
    const member = await r.json();
    const username = member.nick || member.user?.username || id;
    req.session.user = { id, username, isManager: true };
    return res.json({ success: true, username });
  } catch {
    req.session.user = { id, username: id, isManager: true };
    return res.json({ success: true, username: id });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get("/api/me", (req, res) => {
  if (req.session.user) return res.json({ loggedIn: true, ...req.session.user });
  res.json({ loggedIn: false });
});

// ── MIDDLEWARE: require manager ───────────────────────────────────────────────
function requireManager(req, res, next) {
  if (!req.session.user?.isManager) return res.status(403).json({ error: "Forbidden" });
  next();
}

// ── SHIFTS API ────────────────────────────────────────────────────────────────
app.get("/api/shifts", (req, res) => {
  res.json(loadShifts());
});

app.post("/api/shifts", requireManager, (req, res) => {
  const shifts = loadShifts();
  const shift = {
    id: Date.now().toString(),
    type: req.body.type || "regular",
    date: req.body.date,
    host: req.body.host,
    cohost: req.body.cohost || "",
    helpers: req.body.helpers || [],
    status: "pending",
    subscribers: Number(req.body.subscribers) || 0,
    createdAt: new Date().toISOString(),
    createdBy: req.session.user.username,
  };
  shifts.unshift(shift);
  saveShifts(shifts);
  res.json(shift);
});

app.put("/api/shifts/:id", requireManager, (req, res) => {
  const shifts = loadShifts();
  const idx = shifts.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  shifts[idx] = { ...shifts[idx], ...req.body, id: shifts[idx].id };
  saveShifts(shifts);
  res.json(shifts[idx]);
});

app.patch("/api/shifts/:id/status", requireManager, (req, res) => {
  const shifts = loadShifts();
  const idx = shifts.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  shifts[idx].status = req.body.status;
  if (req.body.status === "active") shifts[idx].startedAt = new Date().toISOString();
  if (req.body.status === "completed") shifts[idx].endedAt = new Date().toISOString();
  saveShifts(shifts);
  res.json(shifts[idx]);
});

app.delete("/api/shifts/:id", requireManager, (req, res) => {
  let shifts = loadShifts();
  shifts = shifts.filter(s => s.id !== req.params.id);
  saveShifts(shifts);
  res.json({ success: true });
});

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RoMart Shifts running on port ${PORT}`));
