# Sovereign Symptoms studio site (studio.glitchedrecords.com)

Static site plus one form function. No dependencies.

- `build.mjs` writes `dist/` (home, `/inquire/`, `/privacy/`, `404.html`, `robots.txt`, `sitemap.xml`, `_headers`). Content (services, prices, work, FAQ) lives at the top of the file.
- `src-assets/` images (gold v1 logo only, never the LEGACY chrome version).
- `lib/inquire-core.mjs` inquiry logic (Resend REST API). Env: `RESEND_API_KEY` (secret), `CONTACT_TO=Indigoholliday@thetrophyhoe.com`, `CONTACT_FROM` on the verified `send.glitchedrecords.com` domain. Without them the form says it is not switched on yet and points to glitchedrecords.com/contact/.
- `functions/api/inquire.js` Cloudflare Pages Function (production host). `api/inquire.js` Vercel function (preview only).
- No checkout or payment code, by design.

Local: `node build.mjs && python3 -m http.server -d dist 8080`

Cloudflare Pages settings: root directory `studio-site`, build command `node build.mjs`, output directory `dist`.
