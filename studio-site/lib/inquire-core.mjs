// Shared inquiry logic for the studio form. Runtime-agnostic: used by the
// Cloudflare Pages Function (functions/api/inquire.js, the go-live host) and the
// Vercel function (api/inquire.js, preview only). Sends through Resend's REST API.
// Env: RESEND_API_KEY (secret), CONTACT_TO, CONTACT_FROM. No payment fields, ever.
export const SERVICES = ["Websites", "Branding", "Music videos (Godkiller Graphics)", "Lyric videos (Godkiller Graphics)", "Ghostwriting", "Not sure yet"];
export const BUDGETS = ["Under $500", "$500 to $1,500", "$1,500 to $5,000", "$5,000 and up", "Not sure yet"];
export const TIMELINES = ["As soon as possible", "Within a month", "1 to 3 months", "Flexible"];
const MAX = { name: 120, email: 200, links: 600, message: 5000 };
const isEmail = (s) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pick = (list, v, d) => (list.includes(v) ? v : d);
const FALLBACK = "Please use the contact form at glitchedrecords.com/contact/ instead.";

// Returns { status, ok, message }.
export async function handleInquiry(b, env, fetchImpl = fetch) {
  if (b.website) return { status: 200, ok: true, message: "Thanks, your inquiry is on its way." }; // honeypot
  const name = String(b.name || "").trim().slice(0, MAX.name);
  const email = String(b.email || "").trim().slice(0, MAX.email);
  const service = pick(SERVICES, b.service, "Not sure yet");
  const budget = pick(BUDGETS, b.budget, "Not sure yet");
  const timeline = pick(TIMELINES, b.timeline, "Flexible");
  const links = String(b.links || "").trim().slice(0, MAX.links);
  const message = String(b.message || "").trim().slice(0, MAX.message);
  if (!name || !isEmail(email) || message.length < 5) return { status: 400, ok: false, message: "Please add your name, a valid email and a few words about the project." };
  if (b.consent !== "yes" && b.consent !== true && b.consent !== "on") return { status: 400, ok: false, message: "Please tick the box so we can reply to you." };
  const { RESEND_API_KEY: key, CONTACT_TO: to, CONTACT_FROM: from } = env || {};
  if (!key || !to || !from) return { status: 503, ok: false, message: "The inquiry form is not switched on yet. " + FALLBACK };
  const text = `From: ${name} <${email}>\nService: ${service}\nBudget: ${budget}\nTimeline: ${timeline}\nLinks: ${links || "none"}\n\n${message}\n`;
  const html = `<p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;<br><strong>Service:</strong> ${esc(service)}<br><strong>Budget:</strong> ${esc(budget)}<br><strong>Timeline:</strong> ${esc(timeline)}<br><strong>Links:</strong> ${esc(links || "none")}</p><p style="white-space:pre-wrap">${esc(message)}</p>`;
  const r = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], reply_to: email, subject: `[Sovereign Symptoms] ${service}: ${name}`, text, html }),
  }).catch(() => null);
  if (!r || !r.ok) return { status: 502, ok: false, message: "The inquiry could not be sent right now. " + FALLBACK };
  return { status: 200, ok: true, message: "Thanks, your inquiry is on its way. Indigo replies by email." };
}

export const redirectFor = (res) => `/inquire/?${res.ok ? "sent=1" : "error=" + encodeURIComponent(res.message)}`;
