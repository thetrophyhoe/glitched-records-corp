// Contact form handler (Vercel Node function). Sends through Resend's REST API; no dependencies.
// Env: RESEND_API_KEY (sensitive), CONTACT_TO, CONTACT_FROM.
// Optional: TURNSTILE_SECRET_KEY — when set, verify Cloudflare Turnstile; otherwise skip.
// Rate limit is per-instance in-memory only (3 / 10 min). A real limit needs Vercel KV, Upstash, or Vercel Firewall rules.
const MAX = { name: 120, email: 200, topic: 80, message: 5000 };
const TOPICS = ["General", "Music and licensing", "Press", "Studio: websites", "Studio: branding", "Studio: music or lyric videos", "Studio: ghostwriting", "Other"];
const OWN_DOMAINS = ["glitchedrecords.com", "thetrophyhoe.com", "theantichrist.ai"];
const MIN_MS = 3000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SKEW_MS = 30 * 1000;
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const SUCCESS = "Thanks, your message is on its way.";
const hits = new Map(); // ip -> timestamps; per-instance only

const isEmail = (s) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function emailDomain(email) {
  const at = String(email).lastIndexOf("@");
  if (at < 0) return "";
  return String(email).slice(at + 1).toLowerCase().replace(/\.+$/, "");
}

function isOwnDomain(email) {
  const d = emailDomain(email);
  return OWN_DOMAINS.some((own) => d === own || d.endsWith("." + own));
}

function isLinkSpam(message) {
  const urlRe = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
  const urls = String(message).match(urlRe) || [];
  const words = String(message).replace(urlRe, " ").trim().split(/\s+/).filter(Boolean);
  if (urls.length > 3) return true;
  if (urls.length >= 1 && words.length < 8) return true;
  return false;
}

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];
  if (xff) return String(xff).split(",")[0].trim();
  const real = req.headers["x-real-ip"] || req.headers["X-Real-Ip"];
  if (real) return String(real).trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 1000) {
    for (const [k, v] of hits) {
      const kept = v.filter((t) => now - t < RATE_WINDOW_MS);
      if (!kept.length) hits.delete(k);
      else hits.set(k, kept);
    }
  }
  return false;
}

function parseStarted(v) {
  if (v == null || String(v).trim() === "") return { kind: "missing" };
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1e11) return { kind: "garbage" };
  return { kind: "ok", at: n };
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { active: false, ok: true };
  if (!token) return { active: true, ok: false };
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: String(token), remoteip: ip }),
  }).catch(() => null);
  if (!r || !r.ok) return { active: true, ok: false };
  const j = await r.json().catch(() => ({}));
  return { active: true, ok: !!j.success };
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const raw = typeof req.body === "string" ? req.body : await new Promise((ok) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => ok(d)); });
  const type = req.headers["content-type"] || "";
  if (type.includes("application/json")) { try { return JSON.parse(raw || "{}"); } catch { return {}; } }
  return Object.fromEntries(new URLSearchParams(raw));
}

module.exports = async (req, res) => {
  const wantsJson = (req.headers.accept || "").includes("application/json");
  const reply = (status, ok, message) => {
    if (wantsJson) { res.status(status).json({ ok, message }); return; }
    res.statusCode = 303; res.setHeader("Location", `/contact/?${ok ? "sent=1" : "error=" + encodeURIComponent(message)}`); res.end();
  };
  const drop = (reason) => {
    console.log(`contact: dropped ${reason}`);
    return reply(200, true, SUCCESS);
  };
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return reply(405, false, "Use the form to send a message."); }
  const b = await readBody(req);
  if (b.website) return drop("honeypot");
  const name = String(b.name || "").trim().slice(0, MAX.name);
  const email = String(b.email || "").trim().slice(0, MAX.email);
  const topic = TOPICS.includes(b.topic) ? b.topic : "General";
  const message = String(b.message || "").trim().slice(0, MAX.message);
  if (!name || !isEmail(email) || message.length < 5) return reply(400, false, "Please add your name, a valid email and a message.");
  if (b.consent !== "yes" && b.consent !== true && b.consent !== "on") return reply(400, false, "Please tick the box so we can reply to you.");
  if (isOwnDomain(email)) return drop(`own-domain email (${emailDomain(email)})`);
  if (isLinkSpam(message)) return drop("link-spam");

  const ip = clientIp(req);
  const started = parseStarted(b.started);
  const now = Date.now();
  let timingOk = false;
  if (started.kind === "ok") {
    const age = now - started.at;
    if (age > MAX_AGE_MS || age < -SKEW_MS) return drop("bad-timestamp");
    if (age < MIN_MS) return drop("too-fast");
    timingOk = true;
  }

  if (rateLimited(ip)) return drop("rate-limit");

  const ts = await verifyTurnstile(b["cf-turnstile-response"], ip);
  if (ts.active && !ts.ok) return reply(400, false, "Please complete the verification and try again.");
  // Missing/garbage timestamp: allow no-JS users when Turnstile is off; if Turnstile is on, allow only when it passed.
  if (!timingOk) {
    if (ts.active && ts.ok) {
      console.log(`contact: allowed suspicious timestamp (${started.kind}) after Turnstile`);
    } else if (!ts.active && started.kind === "missing") {
      // Turnstile not configured: do not break no-JS form posts.
    } else {
      return drop("bad-timestamp");
    }
  }

  const key = process.env.RESEND_API_KEY, to = process.env.CONTACT_TO, from = process.env.CONTACT_FROM;
  if (!key || !to || !from) return reply(503, false, "The form is not switched on yet. Please email stayglitched@glitchedrecords.com instead.");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [to], reply_to: email,
      subject: `[glitchedrecords.com] ${topic}: ${name}`,
      text: `From: ${name} <${email}>\nTopic: ${topic}\n\n${message}\n`,
      html: `<p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;<br><strong>Topic:</strong> ${esc(topic)}</p><p style="white-space:pre-wrap">${esc(message)}</p>`,
    }),
  }).catch(() => null);
  if (!r || !r.ok) return reply(502, false, "The message could not be sent right now. Please email stayglitched@glitchedrecords.com instead.");
  return reply(200, true, SUCCESS);
};
