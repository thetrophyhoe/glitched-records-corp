# Timeline hub (branch: timeline-hub)

Static site generated at deploy time. No dependencies.

- `data/events.json`: the timeline (from the plan Page's event table). Locked eras hold only a year mask.
- `build/build.mjs`: writes `dist/` (home timeline, one page per public event under `/timeline/<id>/`, `/contact/`, `sitemap.xml`, `robots.txt`, `events.json`). Copies `/amenti/` unchanged.
- `assets-b64/`: brand images stored as base64 text (decoded into `dist/assets/` at build). Swap for real binaries in a normal git push later.
- `api/contact.js`: contact form, sends with Resend. Needs env vars `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` and a verified `send.glitchedrecords.com` domain in Resend.

Local: `node build/build.mjs && python3 -m http.server -d dist 8080`
