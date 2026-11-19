// Cloudflare Pages Function: POST /api/inquire (go-live host).
import { handleInquiry, redirectFor } from "../../lib/inquire-core.mjs";

async function readBody(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) { try { return await request.json(); } catch { return {}; } }
  try { return Object.fromEntries(await request.formData()); } catch { return {}; }
}

export async function onRequestPost({ request, env }) {
  const res = await handleInquiry(await readBody(request), env);
  if ((request.headers.get("accept") || "").includes("application/json")) {
    return new Response(JSON.stringify({ ok: res.ok, message: res.message }), { status: res.status, headers: { "content-type": "application/json" } });
  }
  return new Response(null, { status: 303, headers: { Location: redirectFor(res) } });
}

export async function onRequest() {
  return new Response(JSON.stringify({ ok: false, message: "Use the form to send an inquiry." }), { status: 405, headers: { Allow: "POST", "content-type": "application/json" } });
}
