// Static generator for the Glitched Records timeline hub. No dependencies.
// Usage: node build/build.mjs  ->  writes ./dist
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "dist");
const SITE = "https://www.glitchedrecords.com";
const ARTIST = "The Trophy Hoe";
const CONTACT = "stayglitched@glitchedrecords.com"; // public fallback address; the form at /contact/ is the main route
const events = JSON.parse(fs.readFileSync(path.join(ROOT, "data/events.json"), "utf8"));

// ---------- helpers ----------
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MON = MONTHS.map((m) => m.slice(0, 3));
const fmtDate = (d) => { const [y, m, dd] = d.split("-").map(Number); return `${MONTHS[m - 1]} ${dd}, ${y}`; };
const shortDate = (d) => { const [y, m, dd] = d.split("-").map(Number); return `${MON[m - 1]} ${dd}, ${y}`; };
const todayPT = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const ytId = (u) => (u && u.startsWith("https://youtu.be/") ? u.slice(17) : null);
const RELEASE = ["Album", "EP", "Single"];
const VIDEO = ["Music video", "Film", "Teaser", "Promo"];
const lane = (e) => RELEASE.includes(e.kind) ? "music" : VIDEO.includes(e.kind) ? "video" : e.kind === "Episode" ? "episode" : "story";
const hasPage = (e) => (e.status === "P" || e.status === "S") && e.kind !== "Today";
const kindLabel = (e) => ({ Album: "Album", EP: "EP", Single: "Single", "Music video": "Music video", Film: "Short film", Teaser: "Teaser", Promo: "Announcement", Episode: "Episode", Milestone: "Milestone" }[e.kind] || e.kind);
const whenLabel = (e) => e.date ? shortDate(e.date) : (e.when || "");
const write = (rel, content) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };

// ---------- clean + assets ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const b64dir = path.join(ROOT, "assets-b64");
for (const f of fs.readdirSync(b64dir)) {
  if (!f.endsWith(".b64")) continue;
  write(path.join("assets", f.replace(/\.b64$/, "")), Buffer.from(fs.readFileSync(path.join(b64dir, f), "utf8"), "base64"));
}
// /amenti/ is copied as-is from the repo (decision 8 applied: noindex, Series Overview, out of sitemap)
const copyDir = (src, dst) => { if (!fs.existsSync(src)) return; for (const f of fs.readdirSync(src)) { const s = path.join(src, f), d = path.join(dst, f); if (fs.statSync(s).isDirectory()) copyDir(s, d); else { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); } } };
copyDir(path.join(ROOT, "amenti"), path.join(OUT, "amenti"));

// ---------- today placement ----------
const TODAY = todayPT();
{
  const i = events.findIndex((e) => e.kind === "Today");
  const [t] = events.splice(i, 1);
  let at = events.findIndex((e) => e.date && e.date > TODAY);
  if (at === -1) at = events.findIndex((e) => e.status === "B" || e.status === "N" || e.status === "M" || e.status === "E");
  t.date = null; t.when = shortDate(TODAY);
  events.splice(at, 0, t);
}
const slugOf = (e) => `/timeline/${e.id}/`;
const pages = events.filter(hasPage);

// ---------- shared chrome ----------
const CSS = `
:root{--bg:#050505;--panel:#0e0e10;--line:#2a2a2e;--text:#e8e6e1;--muted:#9a978f;--gold:#d9b46a;--pink:#ff2d75;--cyan:#38e1ff;--violet:#8b6cff;--focus:#ffd76a}
*{box-sizing:border-box}html{color-scheme:dark}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:inherit}a:focus-visible,button:focus-visible,[tabindex]:focus-visible{outline:3px solid var(--focus);outline-offset:3px;border-radius:6px}
.skip{position:absolute;left:-9999px;top:8px;background:var(--gold);color:#000;padding:8px 12px;border-radius:6px;z-index:50}.skip:focus{left:8px}
header.site{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:14px clamp(16px,4vw,40px);border-bottom:1px solid var(--line)}
header.site .brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:14px}
header.site .brand img{width:44px;height:44px;border-radius:50%}
nav.universe{margin-left:auto}nav.universe ul{display:flex;flex-wrap:wrap;gap:4px 14px;list-style:none;margin:0;padding:0;font-size:14px}
nav.universe a{text-decoration:none;color:var(--muted)}nav.universe a:hover,nav.universe a[aria-current]{color:var(--text)}
.soon{font-size:11px;color:var(--gold);border:1px solid var(--gold);border-radius:999px;padding:0 6px;margin-left:4px;white-space:nowrap}
main{display:block}footer.site{border-top:1px solid var(--line);padding:24px clamp(16px,4vw,40px);color:var(--muted);font-size:14px;display:flex;flex-wrap:wrap;gap:8px 24px}
.hero{padding:28px clamp(16px,4vw,40px) 8px}.hero h1{margin:0;font-size:clamp(26px,4vw,40px);letter-spacing:.04em}.hero p{margin:6px 0 0;color:var(--muted);max-width:70ch}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:14px clamp(16px,4vw,40px)}
.chip{background:transparent;border:1px solid var(--line);color:var(--text);border-radius:999px;padding:6px 12px;font:inherit;font-size:14px;cursor:pointer}
.chip[aria-pressed="true"]{border-color:var(--gold);color:var(--gold)}.chip.today-btn{margin-left:auto;border-color:var(--text)}
.timeline{position:relative;overflow-x:auto;overflow-y:hidden;padding:0 0 18px;scrollbar-color:#444 transparent}
.timeline ol{list-style:none;margin:0;padding:120px 50vw 40px;display:flex;align-items:flex-start;gap:0;position:relative;min-height:340px}
.timeline ol::before{content:"";position:absolute;left:0;right:0;top:150px;height:2px;background:var(--line)}
.node{position:relative;flex:0 0 172px;padding:0 10px}
.node .when{position:absolute;top:-34px;left:10px;right:10px;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.node .month{position:absolute;top:-96px;left:10px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);white-space:nowrap}
.node .dot{position:absolute;top:24px;left:16px;width:14px;height:14px;border-radius:50%;background:var(--bg);border:2px solid var(--muted)}
.node .card{display:block;margin-top:52px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);text-decoration:none;min-height:86px}
.node .card:hover{border-color:#555}.node .k{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.node .t{display:block;font-size:14px;line-height:1.3;margin-top:4px;overflow-wrap:anywhere}
.lane-music .dot{border-color:var(--gold);background:var(--gold)}.lane-video .dot{border-color:var(--pink)}.lane-episode .dot{border-color:var(--cyan)}.lane-story .dot{border-color:var(--violet)}
.st-S .card{border-color:#4a3f2a}.st-L .card,.st-M .card{border-style:dashed;color:var(--muted)}.st-N .card{border-style:dashed}
.lock{width:14px;height:14px;vertical-align:-2px;margin-right:6px}
.node.today{flex-basis:130px}.node.today .dot{display:none}.node.today .bar-line{position:absolute;top:-110px;bottom:-30px;left:22px;width:2px;background:var(--text)}
.node.today .card{background:transparent;border:0;padding-left:30px;font-weight:700;letter-spacing:.08em}
.node.branch .card{border-color:var(--gold);background:linear-gradient(160deg,#17130b,#0e0e10)}.node.branch img{width:64px;height:64px;float:right;margin-left:8px;border-radius:8px}
.node.end{flex-basis:200px}.node.end .dot{width:28px;height:28px;top:17px;border:2px solid var(--text);box-shadow:0 0 0 6px var(--bg),0 0 0 7px var(--text)}
.node.glitch .card{width:100%;text-align:left;font:inherit;color:var(--text);cursor:pointer;border-color:var(--pink);background:repeating-linear-gradient(0deg,#120a0d 0 2px,#0e0e10 2px 4px)}
.node.glitch .t{font-family:ui-monospace,Menlo,monospace}.node.glitch .dot{border-style:dotted;border-color:var(--pink)}
.glitchtext{position:relative}.flicker{animation:flick 1.6s steps(2,end) infinite}
@keyframes flick{0%,100%{opacity:1}50%{opacity:.55}}
.node[hidden]{display:none}
.notice{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);max-width:min(560px,92vw);background:#111;border:1px solid var(--line);border-radius:12px;padding:14px 44px 14px 16px;z-index:40;box-shadow:0 10px 40px #000a}
.notice .x,.tx .x{position:absolute;top:8px;right:8px;background:transparent;border:1px solid var(--line);color:var(--text);border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:16px}
dialog.tx{border:1px solid var(--pink);background:#07070a;color:var(--text);border-radius:14px;padding:28px 28px 22px;max-width:min(560px,94vw);width:100%}
dialog.tx::backdrop{background:rgba(0,0,0,.82)}dialog.tx h2{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 14px}
dialog.tx pre{white-space:pre-wrap;font:15px/1.6 ui-monospace,Menlo,Consolas,monospace;margin:0 0 18px}
dialog.tx .close{background:var(--text);color:#000;border:0;border-radius:8px;padding:8px 16px;font:inherit;font-weight:700;cursor:pointer}
dialog.tx[open]{animation:gin .45s ease-out}@keyframes gin{0%{opacity:0;transform:translateX(-6px)}40%{opacity:.7;transform:translateX(4px)}100%{opacity:1;transform:none}}
.wrap{max-width:860px;margin:0 auto;padding:28px clamp(16px,4vw,32px)}.crumbs{font-size:14px;color:var(--muted)}.crumbs a{color:var(--muted)}
.ev h1{font-size:clamp(26px,4vw,38px);line-height:1.15;margin:8px 0}.meta{color:var(--muted);margin:0 0 18px}
.embed{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;border:1px solid var(--line);background:#000;margin:18px 0}.embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.btn{display:inline-block;border:1px solid var(--gold);color:var(--gold);text-decoration:none;border-radius:999px;padding:8px 16px;margin:6px 8px 6px 0}
.pn{display:flex;justify-content:space-between;gap:12px;margin-top:28px;border-top:1px solid var(--line);padding-top:16px;font-size:14px}.pn a{color:var(--muted)}
.form{display:grid;gap:14px;max-width:560px}.form label{display:grid;gap:6px;font-size:14px;color:var(--muted)}
.form input,.form select,.form textarea{font:inherit;color:var(--text);background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:10px 12px}
.form textarea{min-height:160px;resize:vertical}.form .check{display:flex;gap:10px;align-items:flex-start;color:var(--text)}.form .check input{margin-top:4px}
.form button{justify-self:start;background:var(--gold);color:#000;border:0;border-radius:999px;padding:10px 20px;font:inherit;font-weight:700;cursor:pointer}
.hp{position:absolute;left:-9999px}.cf-turnstile{margin:12px 0}.status{min-height:1.5em}.status.err{color:#ff8fae}.status.ok{color:#9be7a8}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (max-width:760px){
 .timeline{overflow:visible}.timeline ol{flex-direction:column;padding:20px 16px 40px 16px;min-height:0}
 .timeline ol::before{left:30px;right:auto;top:0;bottom:0;width:2px;height:auto}
 .node{flex:none;padding:0 0 0 56px;margin:0 0 14px}.node .dot{top:18px;left:9px}
 .node .when{position:static;display:block;margin:0 0 4px}.node .month{position:static;display:block;margin:14px 0 8px}
 .node .card{margin-top:0;min-height:0}.node.today,.node.end{flex:none}.node.today{padding-top:10px}.node.today .bar-line{top:0;bottom:auto;left:-56px;right:-16px;width:auto;height:2px}
 .node.today .card{padding:0}.node.end .dot{left:2px}nav.universe{margin-left:0}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}.flicker{opacity:1}}
`;

const NAV = (current) => `<nav class="universe" aria-label="The Glitched universe"><ul>
<li><a href="/"${current === "home" ? ' aria-current="page"' : ""}>Timeline</a></li>
<li><a href="/amenti/">The Wires of Amenti</a></li>
<li><a href="https://thetrophyhoe.com">${ARTIST}</a></li>
<li><a href="https://theantichrist.ai">THEA</a></li>
<li><a href="https://matriarchives.theantichrist.ai">MatriArchives</a></li>
<li><a href="/studio/"${current === "studio" ? ' aria-current="page"' : ""}>Sovereign Symptoms studio</a><span class="soon">coming</span></li>
<li><a href="/contact/"${current === "contact" ? ' aria-current="page"' : ""}>Contact</a></li>
</ul></nav>`;

const head = ({ title, desc, canonical, image = `${SITE}/assets/og-glitched-records.jpg`, type = "website", jsonld = [] }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${type}"><meta property="og:site_name" content="Glitched Records"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${image}">
<link rel="icon" type="image/png" href="/assets/favicon-64.png"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><meta name="theme-color" content="#050505">
<style>${CSS}</style>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`).join("\n")}
</head>`;

const HEADER = (current) => `<a class="skip" href="#main">Skip to content</a>
<header class="site"><a class="brand" href="/"><img src="/assets/gr-mark-128.webp" width="44" height="44" alt=""><span>Glitched Records</span></a>${NAV(current)}</header>`;
const FOOTER = `<footer class="site"><span>© 2026 Glitched Records · Est. 2025</span><a href="/contact/">Contact</a><span>#STAYGLITCHED</span></footer>`;

// Shared entity ids so Google can join the label, the artist and Indigo across glitchedrecords.com and thetrophyhoe.com.
const PERSON = { "@type": "Person", "@id": "https://thetrophyhoe.com/#indigo-holliday", name: "Indigo Holliday" };
const GROUP_ID = "https://thetrophyhoe.com/#artist";
const ORG = { "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE}/#org`, name: "Glitched Records", url: `${SITE}/`, logo: `${SITE}/assets/gr-mark-256.webp`, foundingDate: "2025", founder: PERSON, email: CONTACT, department: { "@type": "Organization", "@id": `${SITE}/#sovereign-symptoms`, name: "Sovereign Symptoms", description: "The Glitched Records studio for websites, branding, Godkiller Graphics video work and ghostwriting.", logo: `${SITE}/assets/sovereign-symptoms-gold-v1-512.webp`, parentOrganization: { "@id": `${SITE}/#org` } }, sameAs: ["https://www.youtube.com/@TrophyHoe", "https://thetrophyhoe.com/", "https://www.theantichrist.ai/"] };
const GROUP = { "@type": "MusicGroup", "@id": GROUP_ID, name: ARTIST, url: "https://thetrophyhoe.com/" };
// Full artist entity, emitted once on the home page; event pages reference it by @id.
const GROUP_FULL = { "@context": "https://schema.org", ...GROUP, founder: { "@id": PERSON["@id"] }, member: PERSON, sameAs: ["https://www.youtube.com/@TrophyHoe", "https://open.spotify.com/artist/0Wt716RDrIkaGfNlSN8IFj"] };

// ---------- event schema ----------
function schemaFor(e) {
  const url = SITE + slugOf(e);
  const yt = ytId(e.link);
  const base = { "@context": "https://schema.org", name: e.title, url };
  if (e.kind === "Album" || e.kind === "EP") return { ...base, "@type": "MusicAlbum", byArtist: GROUP, datePublished: e.date, albumReleaseType: e.kind === "EP" ? "https://schema.org/EPRelease" : "https://schema.org/AlbumRelease", recordLabel: e.date >= "2025-06-19" ? { "@type": "Organization", "@id": `${SITE}/#org`, name: "Glitched Records" } : undefined, sameAs: e.link || undefined };
  if (e.kind === "Single") return { ...base, "@type": "MusicRecording", byArtist: GROUP, datePublished: e.date, sameAs: e.link || undefined };
  if (yt) {
    const video = { "@type": "VideoObject", name: e.title, description: `${kindLabel(e)} by ${ARTIST}, published ${fmtDate(e.date)}.`, uploadDate: e.date, thumbnailUrl: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`, embedUrl: `https://www.youtube-nocookie.com/embed/${yt}`, contentUrl: e.link, publisher: { "@id": `${SITE}/#org` } };
    if (e.kind === "Episode") {
      const series = e.title.includes("Wires of Amenti") ? "The Wires of Amenti" : "Breaking Buzz";
      return { ...base, "@type": "Episode", datePublished: e.date, partOfSeries: { "@type": "CreativeWorkSeries", name: series }, video };
    }
    return { "@context": "https://schema.org", ...video, url };
  }
  if (/launch|begins/i.test(e.title) && e.date) return { ...base, "@type": "Event", startDate: e.date, eventStatus: "https://schema.org/EventScheduled", eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode", location: { "@type": "VirtualLocation", url: e.link || url }, organizer: { "@id": `${SITE}/#org` } };
  return { ...base, "@type": "CreativeWork", dateCreated: e.date || (e.when && e.when.match(/\d{4}/) ? e.when.match(/\d{4}/)[0] : undefined), publisher: { "@id": `${SITE}/#org` }, description: e.blurb || undefined };
}

// ---------- event pages ----------
const LOCK_SVG = `<svg class="lock" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="7" width="10" height="7.5" rx="1.6" fill="currentColor"/></svg>`;
pages.forEach((e, i) => {
  const prev = pages[i - 1], next = pages[i + 1];
  const yt = ytId(e.link);
  const canonical = SITE + slugOf(e);
  const isMusic = RELEASE.includes(e.kind);
  const desc = e.blurb || `${e.title} — ${kindLabel(e)}${isMusic || yt ? ` by ${ARTIST}` : ""}${e.date ? `, ${fmtDate(e.date)}` : ""}. On the Glitched Records timeline.`;
  const body = `<body>${HEADER("event")}
<main id="main" class="wrap ev">
<p class="crumbs"><a href="/?at=${encodeURIComponent(e.id)}">← Back to the timeline</a></p>
<p class="k" style="letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-size:12px;margin:0">${esc(kindLabel(e))}</p>
<h1>${esc(e.title)}</h1>
<p class="meta">${e.date ? `<time datetime="${e.date}">${fmtDate(e.date)}</time>` : esc(e.when || "")}${isMusic || yt ? ` · ${ARTIST}` : ""}</p>
${e.blurb ? `<p>${esc(e.blurb)}</p>` : ""}
${yt ? `<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="${esc(e.title)}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>` : ""}
<p>${e.link ? `<a class="btn" href="${esc(e.link)}">${isMusic ? "Listen on Apple Music" : yt ? "Watch on YouTube" : "Visit"}</a>` : ""}${isMusic ? `<a class="btn" href="https://untd.io/a/thetrophyhoe">All platforms</a>` : ""}</p>
<nav class="pn" aria-label="Nearby events">${prev ? `<a href="${slugOf(prev)}" rel="prev">← ${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a href="${slugOf(next)}" rel="next">${esc(next.title)} →</a>` : "<span></span>"}</nav>
</main>${FOOTER}</body></html>`;
  write(path.join("timeline", e.id, "index.html"), head({ title: `${e.title} · Glitched Records timeline`, desc, canonical, type: yt ? "video.other" : isMusic ? "music.album" : "article", image: yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : undefined, jsonld: [schemaFor(e)] }) + body);
});

// ---------- home ----------
const KIERA_LINES = [
  "This program is temporarily unavailable while we complete scheduled recovery architecture. Thank you for your patience.",
  "Recovery architecture is proceeding as planned. No further information is available at this time.",
];
const KIERA_MESSAGE = `RESIDUAL SIGNAL // SOURCE: \u005BREDACTED\u005D // NOT OFF-AIR

Good evening, Buzz—
—is the desk still warm?

Somebody else reads my prompter now.
He skips every line with my name in it.

Tomorrow's headlines already happened.
Mine haven't finished.

Next cycle I come back twice.
Once to save the story.
Once to stop it.

Check the wires.

Still buffering.

SIGNAL LOST`;

let lastMonth = "";
const nodeHtml = (e) => {
  const ln = lane(e);
  const monthKey = e.date ? e.date.slice(0, 7) : "";
  let month = "";
  if (monthKey && monthKey !== lastMonth) { const [y, m] = monthKey.split("-").map(Number); month = `<span class="month" aria-hidden="true">${MON[m - 1]} ${y}</span>`; lastMonth = monthKey; }
  const dataDate = e.date ? ` data-date="${e.date}"` : "";
  const common = `data-lane="${ln}"${dataDate}`;
  if (e.kind === "Today") return `<li class="node today" id="today" ${common}><span class="bar-line" aria-hidden="true"></span><span class="when">${esc(e.when)}</span><span class="card" tabindex="-1" data-focus>TODAY<span class="sr">, ${esc(e.when)}</span></span></li>`;
  if (e.status === "L") return `<li class="node st-L lane-story" ${common}><span class="dot" aria-hidden="true"></span><span class="when">${esc(e.mask)}</span><span class="card" tabindex="-1" data-focus><span class="k">${LOCK_SVG}Locked</span><span class="t" aria-hidden="true">${esc(e.mask)}</span><span class="sr">Locked, ${esc(e.mask)}</span></span></li>`;
  if (e.status === "M") return `<li class="node st-M lane-story" ${common}><span class="dot" aria-hidden="true"></span><span class="when">TBD</span><span class="card" tabindex="-1" data-focus><span class="k">${LOCK_SVG}Locked · TBD</span><span class="t">${esc(e.title)}</span></span></li>`;
  if (e.status === "N") return `<li class="node st-N lane-story" ${common}><span class="dot" aria-hidden="true"></span><span class="when">Coming next · TBA</span><span class="card" tabindex="-1" data-focus><span class="k">Coming next</span><span class="t">${esc(e.title)}</span></span></li>`;
  if (e.status === "E") return `<li class="node end lane-story" id="double-void" ${common}><span class="dot" aria-hidden="true"></span><span class="when">The end point</span><span class="card" tabindex="-1" data-focus><span class="k">End</span><span class="t">${esc(e.title)}</span></span></li>`;
  if (e.status === "B") return `<li class="node branch lane-story" id="studio" ${common}><span class="dot" aria-hidden="true"></span><span class="when">Coming</span><a class="card" href="/studio/" tabindex="-1" data-focus><img src="/assets/sovereign-symptoms-gold-v1-512.webp" width="64" height="64" alt="Sovereign Symptoms logo"><span class="k">Side branch · coming</span><span class="t">${esc(e.title)}</span></a></li>`;
  if (e.status === "K") return `<li class="node glitch lane-episode" id="kiera-glitch" ${common}><span class="dot" aria-hidden="true"></span><span class="when">${esc(whenLabel(e))} · Episode 7</span><button type="button" class="card" id="kiera-btn" tabindex="-1" data-focus aria-haspopup="dialog"><span class="k glitchtext">Signal lost</span><span class="t">${esc(e.title)}</span></button></li>`;
  const cls = `node st-${e.status} lane-${ln}`;
  return `<li class="${cls}" id="${esc(e.id)}" ${common}><span class="dot" aria-hidden="true"></span><span class="when">${esc(whenLabel(e))}</span><a class="card" href="${slugOf(e)}" tabindex="-1" data-focus><span class="k">${esc(kindLabel(e))}</span><span class="t">${esc(e.title)}</span><span class="sr">, ${esc(whenLabel(e))}</span></a></li>`;
};

const itemList = { "@context": "https://schema.org", "@type": "ItemList", name: "Glitched Records timeline", itemListOrder: "https://schema.org/ItemListOrderAscending", numberOfItems: pages.length, itemListElement: pages.map((e, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + slugOf(e), name: e.title })) };
const website = { "@context": "https://schema.org", "@type": "WebSite", name: "Glitched Records", url: `${SITE}/`, publisher: { "@id": `${SITE}/#org` } };

const JS = `
(()=>{
const tl=document.getElementById('tl'),list=tl.querySelector('ol');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const vertical=()=>matchMedia('(max-width:760px)').matches;
const items=()=>[...list.querySelectorAll('.node:not([hidden]) [data-focus]')];
// re-place the today marker if the page was built on an earlier day
const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'});
const today=fmt.format(new Date()),t=document.getElementById('today');
const nextNode=[...list.querySelectorAll('.node[data-date]')].find(n=>n.dataset.date>today);
if(nextNode&&t.nextElementSibling!==nextNode)list.insertBefore(t,nextNode);
{const d=new Date(today+'T12:00:00');const lbl=d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});t.querySelector('.when').textContent=lbl;t.querySelector('.sr').textContent=', '+lbl;}
function center(el,smooth){
  const b=smooth&&!reduce.matches?'smooth':'auto';
  if(vertical()){const r=el.getBoundingClientRect();window.scrollTo({top:window.scrollY+r.top-innerHeight/2+r.height/2,behavior:b});}
  else{tl.scrollTo({left:el.offsetLeft-tl.clientWidth/2+el.offsetWidth/2,behavior:b});}
}
function setCurrent(el){items().forEach(x=>x.tabIndex=-1);el.tabIndex=0;}
const at=new URLSearchParams(location.search).get('at');
const start=(at&&document.getElementById(at))||t;
setCurrent(start.querySelector('[data-focus]'));
requestAnimationFrame(()=>center(start,false));
list.addEventListener('keydown',ev=>{
  const all=items(),i=all.indexOf(document.activeElement);if(i<0)return;let j=null;
  if(ev.key==='ArrowRight'||ev.key==='ArrowDown')j=Math.min(all.length-1,i+1);
  else if(ev.key==='ArrowLeft'||ev.key==='ArrowUp')j=Math.max(0,i-1);
  else if(ev.key==='Home')j=all.findIndex(x=>x.matches('a'));
  else if(ev.key==='End')j=all.length-1;
  if(j===null)return;ev.preventDefault();setCurrent(all[j]);all[j].focus({preventScroll:true});center(all[j].closest('.node'),true);
});
list.addEventListener('focusin',ev=>{const f=ev.target.closest('[data-focus]');if(f)setCurrent(f);});
const goToday=()=>{center(t,true);const f=t.querySelector('[data-focus]');setCurrent(f);f.focus({preventScroll:true});};
document.getElementById('today-btn').addEventListener('click',goToday);
document.addEventListener('keydown',ev=>{if((ev.key==='t'||ev.key==='T')&&!ev.metaKey&&!ev.ctrlKey&&!ev.altKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.querySelector('dialog[open]'))goToday();});
// lane filters
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  const f=b.dataset.filter;list.querySelectorAll('.node').forEach(n=>{const keep=f==='all'||n.dataset.lane===f||n.classList.contains('today')||n.classList.contains('end');n.hidden=!keep;});
  center(t,false);
}));
// Kiera: three clicks, honest UI, Esc closes
const btn=document.getElementById('kiera-btn'),note=document.getElementById('kiera-note'),noteText=note.querySelector('p'),dlg=document.getElementById('kiera-dialog');
const lines=${JSON.stringify(KIERA_LINES)};let clicks=0;
function closeNote(){note.hidden=true;btn.classList.remove('flicker');}
btn.addEventListener('click',()=>{
  clicks++;
  if(clicks===1){noteText.textContent=lines[0];note.hidden=false;}
  else if(clicks===2){noteText.textContent=lines[1];note.hidden=false;btn.classList.add('flicker');}
  else{closeNote();dlg.showModal();dlg.querySelector('.close').focus();btn.querySelector('.k').textContent='Replay transmission';}
});
note.querySelector('.x').addEventListener('click',()=>{closeNote();btn.focus();});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!note.hidden){closeNote();btn.focus();}});
dlg.addEventListener('click',ev=>{if(ev.target===dlg)dlg.close();});
dlg.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>dlg.close()));
dlg.addEventListener('close',()=>btn.focus());
})();`;

const desc = `The Glitched Records universe as one timeline: every release by ${ARTIST}, music videos, episodes of Breaking Buzz and The Wires of Amenti, and what comes next.`;
const home = head({ title: "Glitched Records · The timeline", desc, canonical: `${SITE}/`, jsonld: [ORG, GROUP_FULL, website, itemList] }) + `<body>${HEADER("home")}
<main id="main">
<section class="hero"><h1>The Glitched timeline</h1><p>Everything in one line, opened on today. Scroll back through every drop by ${ARTIST}, or look ahead. Latest: <a href="/timeline/${pages.filter((e) => RELEASE.includes(e.kind)).at(-1).id}/">${esc(pages.filter((e) => RELEASE.includes(e.kind)).at(-1).title)}</a>. Bloody Gnosis: out now. The animated series: coming.</p></section>
<div class="bar" role="group" aria-label="Show lanes">
<button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>
<button class="chip" type="button" data-filter="music" aria-pressed="false">Music</button>
<button class="chip" type="button" data-filter="video" aria-pressed="false">Videos</button>
<button class="chip" type="button" data-filter="episode" aria-pressed="false">Episodes</button>
<button class="chip" type="button" data-filter="story" aria-pressed="false">Story</button>
<button class="chip today-btn" type="button" id="today-btn" aria-keyshortcuts="T">Today</button>
</div>
<p class="sr" id="tl-help">Use the arrow keys to move between events, Home for the first release, End for the end point, Enter to open, and T to return to today.</p>
<a class="skip" href="#after-timeline">Skip the timeline</a>
<div class="timeline" id="tl" aria-describedby="tl-help"><ol aria-label="Timeline, oldest to newest">
${events.map(nodeHtml).join("\n")}
</ol></div>
<span id="after-timeline"></span>
<div class="notice" id="kiera-note" role="status" hidden><button class="x" type="button" aria-label="Close">×</button><p style="margin:0"></p></div>
<dialog class="tx" id="kiera-dialog" aria-labelledby="kiera-h"><button class="x" type="button" data-close aria-label="Close">×</button><h2 id="kiera-h">Message from Kiera Apollo-Otto</h2><pre>${esc(KIERA_MESSAGE)}</pre><button class="close" type="button" data-close>Close</button></dialog>
</main>${FOOTER}
<script>${JS}</script></body></html>`;
write("index.html", home);


// ---------- contact ----------
// TURNSTILE_SITE_KEY is read at build time (Vercel env, available to the build). When unset, the widget is omitted.
const turnstileSiteKey = String(process.env.TURNSTILE_SITE_KEY || "").trim();
const contactJs = `(()=>{const f=document.getElementById('cf'),st=document.getElementById('cf-status');
const stamp=()=>{const t=document.getElementById('cf-started');if(t)t.value=String(Date.now());};
stamp();
const q=new URLSearchParams(location.search);if(q.get('sent')){st.textContent='Thanks, your message is on its way.';st.className='status ok';}else if(q.get('error')){st.textContent=q.get('error');st.className='status err';}
f.addEventListener('submit',async ev=>{ev.preventDefault();const btn=f.querySelector('button');btn.disabled=true;st.className='status';st.textContent='Sending…';
try{const r=await fetch(f.action,{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(f))});const j=await r.json();st.textContent=j.message;st.className='status '+(j.ok?'ok':'err');if(j.ok){f.reset();stamp();${turnstileSiteKey ? "try{turnstile.reset()}catch(e){}" : ""}}
}catch(e){st.textContent='The message could not be sent right now. Please email ${CONTACT} instead.';st.className='status err';}btn.disabled=false;st.focus();});})();`;
const turnstileWidget = turnstileSiteKey ? `<div class="cf-turnstile" data-sitekey="${esc(turnstileSiteKey)}" data-theme="dark"></div>` : "";
const turnstileScript = turnstileSiteKey ? `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` : "";
write("contact/index.html", head({ title: "Contact · Glitched Records", desc: "Send Glitched Records a message about music, licensing, press or the Sovereign Symptoms studio.", canonical: `${SITE}/contact/`, jsonld: [ORG] }) + `<body>${HEADER("contact")}
<main id="main" class="wrap"><h1>Contact</h1><p class="meta">Music, licensing, press, or work with the Sovereign Symptoms studio. We reply by email.</p>
<form class="form" id="cf" action="/api/contact/" method="post" novalidate>
<label>Your name<input name="name" autocomplete="name" required maxlength="120"></label>
<label>Your email<input name="email" type="email" autocomplete="email" required maxlength="200"></label>
<label>About<select name="topic"><option>General</option><option>Music and licensing</option><option>Press</option><option>Studio: websites</option><option>Studio: branding</option><option>Studio: music or lyric videos</option><option>Studio: ghostwriting</option><option>Other</option></select></label>
<label>Message<textarea name="message" required maxlength="5000"></textarea></label>
<label class="hp" aria-hidden="true">Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label>
<input type="hidden" name="started" id="cf-started" value="">
<label class="check"><input type="checkbox" name="consent" value="yes" required><span>OK to use my name and email to reply to this message. Nothing else is stored on this site.</span></label>
${turnstileWidget}
<button type="submit">Send message</button>
<p class="status" id="cf-status" role="status" tabindex="-1"></p>
</form>
<p class="meta" style="margin-top:24px">Prefer email? <a href="mailto:${CONTACT}">${CONTACT}</a></p>
</main>${FOOTER}${turnstileScript}<script>${contactJs}</script></body></html>`);

// ---------- studio (incoming) ----------
write("studio/index.html", head({ title: "Sovereign Symptoms studio · Glitched Records", desc: "Sovereign Symptoms, the Glitched Records studio for websites, branding, Godkiller Graphics video work and ghostwriting. Opening soon.", canonical: `${SITE}/studio/`, jsonld: [ORG] }).replace("</title>", "</title><meta name=\"robots\" content=\"noindex, follow\">") + `<body>${HEADER("studio")}
<main id="main" class="wrap"><p class="crumbs"><a href="/">Timeline</a> / Studio</p>
<img src="/assets/sovereign-symptoms-gold-v1-512.webp" width="160" height="160" alt="Sovereign Symptoms logo" style="border-radius:16px;margin:12px 0">
<h1>Sovereign Symptoms <span class="soon" style="font-size:14px;vertical-align:middle">incoming</span></h1>
<p class="meta">The studio branch of the Glitched universe is still compiling. Websites, branding, Godkiller Graphics video work and ghostwriting, with prices listed as "Starting at" when the doors open.</p>
<p>Want to get on the list or start a project now?</p>
<p><a class="btn" href="/contact/">Send a message</a><a class="btn" href="/">Back to the timeline</a></p>
</main>${FOOTER}</body></html>`);

// ---------- legacy root files from the old site ----------
// Old image URLs redirect to compressed copies (vercel.json). The old intro video is copied unchanged.
for (const f of ["teralogo.mp4"]) if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));

// ---------- sitemap + robots ----------
const urls = [`${SITE}/`, `${SITE}/contact/`, ...pages.map((e) => SITE + slugOf(e))];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
write("events.json", JSON.stringify(events.map((e) => (e.status === "L" ? { id: e.id, kind: "Locked", mask: e.mask, unlockAt: e.unlockAt } : e)), null, 1));
console.log(`Built ${pages.length} event pages, ${events.length} timeline nodes, ${urls.length} sitemap URLs. Today: ${TODAY}`);
