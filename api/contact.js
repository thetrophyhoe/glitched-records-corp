// Contact form handler (Vercel Node function). Sends through Resend's REST API; no dependencies.
// Env: RESEND_API_KEY (sensitive), CONTACT_TO, CONTACT_FROM.
const MAX = { name: 120, email: 200, topic: 80, message: 5000 };
const TOPICS = ["General", "Music and licensing", "Press", "Studio: websites", "Studio: branding", "Studio: music or lyric videos", "Studio: ghostwriting", "Other"];
const isEmail = (s) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return reply(405, false, "Use the form to send a message."); }
  const b = await readBody(req);
  if (b.website) return reply(200, true, "Thanks, your message is on its way."); // honeypot: pretend success
  const name = String(b.name || "").trim().slice(0, MAX.name);
  const email = String(b.email || "").trim().slice(0, MAX.email);
  const topic = TOPICS.includes(b.topic) ? b.topic : "General";
  const message = String(b.message || "").trim().slice(0, MAX.message);
  if (!name || !isEmail(email) || message.length < 5) return reply(400, false, "Please add your name, a valid email and a message.");
  if (b.consent !== "yes" && b.consent !== true && b.consent !== "on") return reply(400, false, "Please tick the box so we can reply to you.");
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
  return reply(200, true, "Thanks, your message is on its way.");
};
