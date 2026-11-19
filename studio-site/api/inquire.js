// Vercel function: POST /api/inquire (preview only; production goes on Cloudflare Pages).
import { handleInquiry, redirectFor } from "../lib/inquire-core.mjs";

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const raw = typeof req.body === "string" ? req.body : await new Promise((ok) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => ok(d)); });
  if ((req.headers["content-type"] || "").includes("application/json")) { try { return JSON.parse(raw || "{}"); } catch { return {}; } }
  return Object.fromEntries(new URLSearchParams(raw));
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false, message: "Use the form to send an inquiry." }); }
  const out = await handleInquiry(await readBody(req), process.env);
  if ((req.headers.accept || "").includes("application/json")) return res.status(out.status).json({ ok: out.ok, message: out.message });
  res.statusCode = 303; res.setHeader("Location", redirectFor(out)); res.end();
}
