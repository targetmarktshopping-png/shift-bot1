const express = require("express");
const session = require("express-session");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "holiday-europe-rp-secret-2026",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const BOT_TOKEN    = process.env.BOT_TOKEN;
const GUILD_ID     = "1482483178055667965";
const MANAGER_ROLE = "1483836330877390899";
const CHANNEL_ID   = "1482654729527099452";
const DATA_FILE    = path.join(__dirname, "data", "shifts.json");

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

async function discordAPI(method, endpoint, body = null) {
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
    method,
    headers: { Authorization: `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) return null;
  return res.json();
}

async function hasManagerRole(discordUserId) {
  try {
    const member = await discordAPI("GET", `/guilds/${GUILD_ID}/members/${discordUserId}`);
    return member?.roles?.includes(MANAGER_ROLE);
  } catch { return false; }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function timeUntil(dateStr) {
  const diff = Math.floor((new Date(dateStr) - Date.now()) / 1000);
  if (diff < 0) return "now";
  if (diff < 3600) return `in ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `in ${Math.floor(diff / 3600)}h`;
  return `in ${Math.floor(diff / 86400)} days`;
}

const SHIFT_TYPES = {
  promotional: "📅 Promotional Shift",
  regular: "🔵 Regular Shift",
  special: "⭐ Special Shift",
};

const STATUS_COLORS = { pending: 0xf59e0b, active: 0x10b981, completed: 0x6366f1, cancelled: 0xef4444 };
const STATUS_EMOJI  = { pending: "🟡 Pending", active: "🟢 Live", completed: "✅ Completed", cancelled: "❌ Cancelled" };

function buildEmbed(shift) {
  return {
    title: SHIFT_TYPES[shift.type] || shift.type,
    color: STATUS_COLORS[shift.status],
    fields: [
      { name: "📅 Date", value: formatDate(shift.date), inline: false },
      { name: "⏰ Time Until", value: timeUntil(shift.date), inline: true },
      { name: "👑 Host", value: `@${shift.host}`, inline: true },
      ...(shift.cohost ? [{ name: "🤝 Co-Host", value: `@${shift.cohost}`, inline: true }] : []),
      { name: "🙋 Helpers", value: shift.helpers?.length ? shift.helpers.map(h => `@${h}`).join(", ") : "None", inline: true },
      { name: "👥 Subscribers", value: shift.subscribers?.toString() || "0", inline: true },
      { name: "📊 Status", value: STATUS_EMOJI[shift.status], inline: true },
    ],
    footer: { text: "Holiday in [europe rp] • Shifts Board" },
    timestamp: new Date().toISOString(),
  };
}

async function postToDiscord(shift) {
  const msg = await discordAPI("POST", `/channels/${CHANNEL_ID}/messages`, { embeds: [buildEmbed(shift)] });
  return msg?.id;
}

async function updateDiscordMessage(messageId, shift) {
  if (!messageId) return;
  await discordAPI("PATCH", `/channels/${CHANNEL_ID}/messages/${messageId}`, { embeds: [buildEmbed(shift)] });
}

app.post("/api/login", async (req, res) => {
  const { discordId } = req.body;
  if (!discordId || !/^\d{17,19}$/.test(discordId.trim()))
    return res.json({ success: false, error: "Invalid Discord User ID." });
  const id = discordId.trim();
  const allowed = await hasManagerRole(id);
  if (!allowed) return res.json({ success: false, error: "You don't have the required role in the server." });
  const member = await discordAPI("GET", `/guilds/${GUILD_ID}/members/${id}`);
  const username = member?.nick || member?.user?.username || id;
  req.session.user = { id, username, isManager: true };
  return res.json({ success: true, username });
});

app.post("/api/logout", (req, res) => { req.session.destroy(); res.json({ success: true }); });
app.get("/api/me", (req, res) => {
  if (req.session.user) return res.json({ loggedIn: true, ...req.session.user });
  res.json({ loggedIn: false });
});

function requireManager(req, res, next) {
  if (!req.session.user?.isManager) return res.status(403).json({ error: "Forbidden" });
  next();
}

app.get("/api/shifts", (req, res) => res.json(loadShifts()));

app.post("/api/shifts", requireManager, async (req, res) => {
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
    discordMessageId: null,
  };
  const msgId = await postToDiscord(shift);
  shift.discordMessageId = msgId;
  shifts.unshift(shift);
  saveShifts(shifts);
  res.json(shift);
});

app.put("/api/shifts/:id", requireManager, async (req, res) => {
  const shifts = loadShifts();
  const idx = shifts.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  shifts[idx] = { ...shifts[idx], ...req.body, id: shifts[idx].id, discordMessageId: shifts[idx].discordMessageId };
  await updateDiscordMessage(shifts[idx].discordMessageId, shifts[idx]);
  saveShifts(shifts);
  res.json(shifts[idx]);
});

app.patch("/api/shifts/:id/status", requireManager, async (req, res) => {
  const shifts = loadShifts();
  const idx = shifts.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  shifts[idx].status = req.body.status;
  if (req.body.status === "active") shifts[idx].startedAt = new Date().toISOString();
  if (req.body.status === "completed") shifts[idx].endedAt = new Date().toISOString();
  await updateDiscordMessage(shifts[idx].discordMessageId, shifts[idx]);
  saveShifts(shifts);
  res.json(shifts[idx]);
});

app.delete("/api/shifts/:id", requireManager, async (req, res) => {
  let shifts = loadShifts();
  const shift = shifts.find(s => s.id === req.params.id);
  if (shift?.discordMessageId) {
    await discordAPI("DELETE", `/channels/${CHANNEL_ID}/messages/${shift.discordMessageId}`);
  }
  shifts = shifts.filter(s => s.id !== req.params.id);
  saveShifts(shifts);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Holiday in [europe rp] Shifts running on port ${PORT}`));
