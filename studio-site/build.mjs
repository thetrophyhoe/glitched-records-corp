// Sovereign Symptoms studio site generator. No dependencies: `node build.mjs` writes dist/.
import { mkdirSync, writeFileSync, copyFileSync, readdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { SERVICES, BUDGETS, TIMELINES } from "./lib/inquire-core.mjs";

const SITE = "https://studio.glitchedrecords.com";
const HUB = "https://www.glitchedrecords.com";
const ARTIST = "The Trophy Hoe";
const OUT = "dist";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/assets`, { recursive: true });
// Images: real binaries in src-assets/ when present, else base64 copies in assets.b64.json (the GitHub connector pushes text only).
if (existsSync("src-assets")) for (const f of readdirSync("src-assets")) copyFileSync(`src-assets/${f}`, `${OUT}/assets/${f}`);
else for (const [f, b64] of Object.entries(JSON.parse(readFileSync("assets.b64.json", "utf8")))) writeFileSync(`${OUT}/assets/${f}`, Buffer.from(b64, "base64"));
const write = (p, s) => { const full = `${OUT}/${p}`; mkdirSync(full.split("/").slice(0, -1).join("/"), { recursive: true }); writeFileSync(full, s); };

// ---------- content ----------
const SERVICE_LIST = [
  { key: "web", name: "Websites", form: "Websites", price: "$1,000", extra: "Care plan $100 a month", lead: "Sites that feel like a world, not a template.",
    starter: "A one-page site or artist EPK, built mobile-first, with basic SEO and a way for people to reach you.",
    more: "Multi-page sites, inquiry forms, archives and interactive story builds are quoted after a call." },
  { key: "brand", name: "Branding", form: "Branding", price: "$600", lead: "Marks that hold up from a favicon to a billboard.",
    starter: "A logo suite: primary logo, wordmark and mark, in light and dark versions, with web-ready files.",
    more: "Full identity systems with color, type, a mini brand guide, social kits and animated logos are quoted after a call." },
  { key: "music", name: "Music videos", form: "Music videos (Godkiller Graphics)", price: "$1,200", tag: "Godkiller Graphics", lead: "Story-first visuals cut for the song.",
    starter: "An edit-led or visualizer-style video from supplied or generated footage, one look, 2 revisions.",
    more: "Concept videos, location days, multi-scene stories and effects are quoted after a call. Crew, location and talent costs pass through at cost." },
  { key: "lyric", name: "Lyric videos", form: "Lyric videos (Godkiller Graphics)", price: "$250", tag: "Godkiller Graphics", lead: "Words that move with the beat.",
    starter: "One lyric video in one format (16:9 or 9:16), 2 revisions, about 7 days.",
    more: "Both formats, custom type direction, teasers and social cutdowns are quoted after a call." },
  { key: "ghost", name: "Ghostwriting", form: "Ghostwriting", price: "$300", unit: "per song", lead: "Your voice, sharpened.",
    starter: "Lyrics written to your beat and brief, 1 revision, with full ownership transferred to you.",
    more: "Structure and topline guidance, extra revisions and multi-song concept packages are quoted after a call." },
];

const YT = (id) => `https://www.youtube.com/watch?v=${id}`;
const WORK = [
  { svc: "web", title: "glitchedrecords.com", kind: "Website", img: "site-glitchedrecords.webp", w: 640, h: 400, href: HUB + "/", note: "The Glitched timeline: every release, video and episode on one line that opens on today." },
  { svc: "web", title: "thetrophyhoe.com", kind: "Website", img: "site-thetrophyhoe.webp", w: 640, h: 400, href: "https://thetrophyhoe.com/", note: `The home of ${ARTIST} and the AGAIN era.` },
  { svc: "music", title: "Terms Of Service", kind: "Music video", img: "yt-9ifMSa3Fz24.webp", w: 640, h: 360, href: YT("9ifMSa3Fz24"), note: `${ARTIST}, Official Irrevocable Consent Form.` },
  { svc: "music", title: "Never Heal (Shattered)", kind: "Music video", img: "yt-9vgCYHiimHw.webp", w: 640, h: 360, href: "https://www.youtube.com/shorts/9vgCYHiimHw", note: `${ARTIST}, Official 13 Hoes of Halloween.` },
  { svc: "music", title: "Loser Leaves Derry", kind: "Music video", img: "yt-QRolIrMx7ug.webp", w: 640, h: 360, href: YT("QRolIrMx7ug"), note: `${ARTIST}, Official Halloween Massacre.` },
  { svc: "music", title: "Cherry Bomb", kind: "Music video", img: "yt-iwZT5uY_EPw.webp", w: 640, h: 360, href: YT("iwZT5uY_EPw"), note: `${ARTIST}, Official Detonation.` },
  { svc: "music", title: "Bloody Gnosis: T.H.E. A.NAMNESIS of a GODKILLER", kind: "Short film", img: "yt-ZxDRKODERKQ.webp", w: 640, h: 360, href: YT("ZxDRKODERKQ"), note: "The Glitched Records short film that gave Godkiller Graphics its name." },
  { svc: "brand", title: "Glitched universe marks", kind: "Branding", marks: ["gr-mark-128.webp", "the-trophy-hoe-mark-128.webp", "ss-logo-256.webp"], href: HUB + "/", note: `Marks for Glitched Records, ${ARTIST} and Sovereign Symptoms.` },
  { svc: "lyric", title: "Official lyric videos", kind: "Lyric videos · Godkiller Graphics", href: "https://www.youtube.com/@TrophyHoe/videos", note: `Lyric videos for ${ARTIST} on YouTube.`, textOnly: true },
  { svc: "ghost", title: "AGAIN", kind: "Songwriting", href: "https://thetrophyhoe.com/", note: `Every song on ${ARTIST}'s AGAIN is written in-house by Indigo.`, textOnly: true },
];
// Clearly labeled placeholder slots for client work Indigo has permission to show.
const SLOTS = ["web", "brand", "music", "lyric", "ghost"].map((svc) => ({ svc, slot: true }));
const svcName = (k) => SERVICE_LIST.find((s) => s.key === k).name;

const FAQ = [
  ["How do we start?", "Send an inquiry with the form. Indigo replies by email, sets up a short call if it helps, then sends a written quote with scope, timeline and price."],
  ["What does \"Starting at\" mean?", "It is the price of the smallest version of each service. Bigger projects are quoted in writing before any work begins, so there are no surprises."],
  ["How many revisions do I get?", "The starting packages include the revisions listed with each service. Larger quotes spell out their own revision rounds."],
  ["How long does it take?", "Lyric videos take about a week. Everything else depends on scope, and your quote gives you a timeline."],
  ["Who owns the finished work?", "You do. Ghostwritten lyrics transfer fully to you. For sites, brand files and videos, ownership and credit terms are written into your quote."],
  ["Do you take payment on this site?", "No. Nothing is sold or charged here. Payment terms are part of your written quote."],
];

// ---------- shared chrome ----------
const OG = `${SITE}/assets/og-sovereign-symptoms.jpg`;
const ORG = {
  "@context": "https://schema.org", "@type": "ProfessionalService", "@id": `${SITE}/#studio`,
  name: "Sovereign Symptoms", alternateName: "Sovereign Symptoms studio", url: `${SITE}/`,
  logo: `${SITE}/assets/ss-logo-512.webp`, image: OG,
  description: "Sovereign Symptoms is the Glitched Records studio for websites, branding, music videos and lyric videos (as Godkiller Graphics), and ghostwriting.",
  founder: { "@type": "Person", name: "Indigo Holliday" },
  parentOrganization: { "@type": "Organization", "@id": `${HUB}/#org`, name: "Glitched Records", url: `${HUB}/` },
  brand: [{ "@type": "Brand", name: "Godkiller Graphics" }],
  priceRange: "$250+",
  knowsAbout: ["Web design", "Branding", "Music videos", "Lyric videos", "Ghostwriting"],
  sameAs: [`${HUB}/`, "https://thetrophyhoe.com/", "https://www.youtube.com/@TrophyHoe"],
  hasOfferCatalog: { "@type": "OfferCatalog", name: "Studio services", itemListElement: SERVICE_LIST.map((s) => ({
    "@type": "Offer", itemOffered: { "@type": "Service", name: s.tag ? `${s.name} (${s.tag})` : s.name, description: s.starter },
    priceSpecification: { "@type": "PriceSpecification", price: s.price.replace(/[$,]/g, ""), minPrice: s.price.replace(/[$,]/g, ""), priceCurrency: "USD" } })) },
  contactPoint: { "@type": "ContactPoint", contactType: "Project inquiries", url: `${SITE}/inquire/` },
};
const WEBSITE = { "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE}/#site`, name: "Sovereign Symptoms", url: `${SITE}/`, publisher: { "@id": `${SITE}/#studio` } };

const CSS = `:root{--bg:#050505;--panel:#0e0e10;--line:#2a2a2e;--text:#e8e6e1;--muted:#9a978f;--gold:#d9b46a;--pink:#ff2d75;--cyan:#38e1ff;--violet:#8b6cff;--focus:#ffd76a}
*{box-sizing:border-box}html{color-scheme:dark;scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:inherit}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--focus);outline-offset:3px;border-radius:6px}
img{max-width:100%;height:auto;display:block}
.skip{position:absolute;left:-9999px;top:8px;background:var(--gold);color:#000;padding:8px 12px;border-radius:6px;z-index:50}.skip:focus{left:8px}
.uni{display:flex;flex-wrap:wrap;gap:4px 14px;justify-content:center;padding:6px 16px;font-size:12px;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--line);background:#09090b}
.uni a{text-decoration:none;color:var(--muted)}.uni a:hover,.uni a[aria-current]{color:var(--gold)}
header.site{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:14px clamp(16px,4vw,40px);border-bottom:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:14px}.brand img{width:44px;height:44px;border-radius:10px}
nav.main{margin-left:auto}nav.main ul{display:flex;flex-wrap:wrap;gap:4px 16px;list-style:none;margin:0;padding:0;font-size:14px}
nav.main a{text-decoration:none;color:var(--muted)}nav.main a:hover,nav.main a[aria-current]{color:var(--text)}
.wrap{max-width:1120px;margin:0 auto;padding:0 clamp(16px,4vw,40px)}
section{padding:56px 0;border-bottom:1px solid var(--line)}section:last-of-type{border-bottom:0}
h1,h2,h3{line-height:1.15;margin:0}h2{font-size:clamp(24px,3.4vw,34px);letter-spacing:.02em}h3{font-size:19px}
.eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin:0 0 10px}
.lead{color:var(--muted);max-width:66ch;margin:10px 0 0}
.hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:40px;align-items:center;padding:56px 0 64px}
.hero h1{font-size:clamp(38px,6.4vw,72px);letter-spacing:.03em;text-transform:uppercase;color:var(--gold)}
.hero h1 .sub{display:block;font-size:.38em;letter-spacing:.2em;color:var(--text);margin-top:12px}
.hero p{font-size:clamp(17px,2vw,20px);color:var(--text);max-width:52ch;margin:18px 0 0}
.hero .logo{border-radius:20px;border:1px solid #3a3122;box-shadow:0 0 0 1px #000,0 30px 80px -30px #d9b46a55;width:100%;max-width:400px;justify-self:end}
.glitch{position:relative;display:inline-block}
@media (prefers-reduced-motion:no-preference){.glitch::after{content:attr(data-text);position:absolute;left:0;top:0;color:var(--pink);clip-path:inset(0 0 100% 0);animation:gl 6s steps(1,end) infinite;pointer-events:none}}
@keyframes gl{0%,92%,100%{clip-path:inset(0 0 100% 0);transform:none}93%{clip-path:inset(20% 0 55% 0);transform:translateX(-3px)}95%{clip-path:inset(60% 0 12% 0);transform:translateX(3px)}97%{clip-path:inset(40% 0 40% 0);transform:translateX(-2px)}}
.btn{display:inline-block;border:1px solid var(--gold);color:var(--gold);text-decoration:none;border-radius:999px;padding:10px 20px;font-weight:600;margin:6px 10px 6px 0;background:transparent;font:inherit;cursor:pointer}
.btn.solid{background:var(--gold);color:#000}.btn:hover{filter:brightness(1.1)}
.cta{margin-top:26px}
.grid{display:grid;gap:16px}.svc{grid-template-columns:repeat(auto-fill,minmax(300px,1fr));margin-top:28px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:10px}
.card .tag{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--pink)}
.price{font-size:14px;color:var(--muted)}.price b{display:block;font-size:30px;color:var(--gold);letter-spacing:.01em;line-height:1.2}.price i{font-style:normal;font-size:14px;color:var(--muted)}
.card p{margin:0}.card .more{color:var(--muted);font-size:14px}.card .care{font-size:14px;color:var(--text);border-top:1px dashed var(--line);padding-top:10px}
.card .btn{align-self:flex-start;margin-top:auto}
.gk{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;margin-top:28px;padding:22px;border:1px solid #3d1525;border-radius:14px;background:repeating-linear-gradient(0deg,#120a0d 0 2px,#0e0e10 2px 4px)}
.gk .sig{font:700 13px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.2em;color:var(--pink);border:1px solid var(--pink);border-radius:8px;padding:10px 12px;text-align:center}
.gk p{margin:0;color:var(--text)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 0}
.chip{background:transparent;border:1px solid var(--line);color:var(--text);border-radius:999px;padding:6px 14px;font:inherit;font-size:14px;cursor:pointer}.chip[aria-pressed="true"]{border-color:var(--gold);color:var(--gold)}
.work{grid-template-columns:repeat(auto-fill,minmax(250px,1fr));margin-top:22px}
.w{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden;text-decoration:none;display:flex;flex-direction:column}
.w:hover{border-color:#555}.w img{width:100%;aspect-ratio:16/9;object-fit:cover;background:#000}
.w .b{padding:14px 16px 16px;display:flex;flex-direction:column;gap:6px}.w .k{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}.w .t{font-weight:700}.w .n{font-size:14px;color:var(--muted)}
.w .marks{display:flex;gap:12px;justify-content:center;align-items:center;aspect-ratio:16/9;background:#000}.w .marks img{width:28%;aspect-ratio:1;border-radius:12px}
.w .txt{aspect-ratio:16/9;display:grid;place-items:center;background:linear-gradient(160deg,#17130b,#0e0e10);font:700 22px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:var(--gold);text-align:center;padding:12px}
.w.slot{border-style:dashed;background:transparent}.w.slot .txt{background:transparent;color:var(--muted);font-size:14px;letter-spacing:.14em}
.w[hidden]{display:none}
.steps{list-style:none;margin:28px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;counter-reset:s}
.steps li{counter-increment:s;border-top:2px solid var(--gold);padding-top:12px}.steps li::before{content:"0" counter(s);font:700 13px ui-monospace,Menlo,monospace;color:var(--gold);letter-spacing:.1em}
.steps h3{margin:6px 0 4px;font-size:17px}.steps p{margin:0;color:var(--muted);font-size:15px}
.about{display:grid;grid-template-columns:auto 1fr;gap:28px;align-items:start}.about img{width:120px;border-radius:14px}
.about p{margin:0 0 12px;max-width:66ch}
details{border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin:10px 0;background:var(--panel)}summary{cursor:pointer;font-weight:600}details p{color:var(--muted);margin:10px 0 0}
.form{display:grid;gap:14px;max-width:640px;margin-top:22px}.form label{display:grid;gap:6px;font-size:14px;color:var(--muted)}
.form .row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.form input,.form select,.form textarea{font:inherit;color:var(--text);background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:10px 12px;width:100%}
.form textarea{min-height:160px;resize:vertical}.form .check{display:flex;gap:10px;align-items:flex-start;color:var(--text)}.form .check input{width:auto;margin-top:4px}
.form button{justify-self:start;background:var(--gold);color:#000;border:0;border-radius:999px;padding:12px 24px;font:inherit;font-weight:700;cursor:pointer}
.hp{position:absolute;left:-9999px}.status{min-height:1.5em}.status.err{color:#ff8fae}.status.ok{color:#9be7a8}.small{font-size:14px;color:var(--muted)}
.prose{max-width:70ch;padding:48px 0}.prose h1{font-size:clamp(28px,4vw,40px);margin-bottom:16px}.prose h2{font-size:20px;margin:28px 0 8px}.prose p,.prose li{color:var(--muted)}
footer.site{border-top:1px solid var(--line);padding:28px clamp(16px,4vw,40px);color:var(--muted);font-size:14px;display:flex;flex-wrap:wrap;gap:8px 24px;align-items:center}
footer.site a{color:var(--muted)}
@media (max-width:800px){.hero{grid-template-columns:1fr;padding:36px 0 44px}.hero .logo{justify-self:start;max-width:220px;order:-1}nav.main{margin-left:0}.about{grid-template-columns:1fr}.form .row{grid-template-columns:1fr}.gk{grid-template-columns:1fr}section{padding:44px 0}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`;

const head = ({ title, desc, path, noindex = false, jsonld = [] }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">${noindex ? '<meta name="robots" content="noindex, follow">' : ""}
<link rel="canonical" href="${SITE}${path}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Sovereign Symptoms"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${path}"><meta property="og:image" content="${OG}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Sovereign Symptoms gold logo with the studio's services">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${OG}">
<link rel="icon" type="image/png" href="/assets/favicon-64.png"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><meta name="theme-color" content="#050505">
<style>${CSS}</style>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
</head>`;

const UNI = `<nav class="uni" aria-label="The Glitched universe"><a href="${HUB}/">Glitched Records</a><a href="https://thetrophyhoe.com/">${ARTIST}</a><a href="https://theantichrist.ai/">THEA</a><a href="https://matriarchives.theantichrist.ai/">MatriArchives</a><a href="/" aria-current="true">Studio</a></nav>`;
const HEADER = (cur) => `<a class="skip" href="#main">Skip to content</a>${UNI}
<header class="site"><a class="brand" href="/"><img src="/assets/ss-logo-256.webp" width="44" height="44" alt=""><span>Sovereign Symptoms</span></a>
<nav class="main" aria-label="Studio"><ul>
<li><a href="/#services">Services</a></li><li><a href="/#work">Work</a></li><li><a href="/#process">Process</a></li><li><a href="/#about">About</a></li><li><a href="/inquire/"${cur === "inquire" ? ' aria-current="page"' : ""}>Start a project</a></li>
</ul></nav></header>`;
const FOOTER = `<footer class="site"><span>© 2026 Sovereign Symptoms · A <a href="${HUB}/">Glitched Records</a> studio · Founded by Indigo Holliday</span><a href="/inquire/">Start a project</a><a href="/privacy/">Privacy</a><span>#STAYGLITCHED</span></footer>`;

const svcCard = (s) => `<article class="card" id="svc-${s.key}">
${s.tag ? `<span class="tag">${esc(s.tag)}</span>` : ""}<h3>${esc(s.name)}</h3>
<p class="price">Starting at<b>${esc(s.price)}${s.unit ? ` <i>${esc(s.unit)}</i>` : ""}</b></p>
<p>${esc(s.lead)} ${esc(s.starter)}</p>
${s.extra ? `<p class="care">${esc(s.extra)}: updates, uptime checks and small edits.</p>` : ""}
<p class="more">${esc(s.more)}</p>
<a class="btn" href="/inquire/?service=${s.key}">Start with this</a></article>`;

const workCard = (w) => {
  if (w.slot) return `<div class="w slot" data-svc="${w.svc}"><div class="txt">CLIENT SLOT · RESERVED</div><div class="b"><span class="k">${esc(svcName(w.svc))} · placeholder</span><span class="t">Client work coming</span><span class="n">Shared only with the client's permission.</span></div></div>`;
  const media = w.marks ? `<div class="marks">${w.marks.map((m) => `<img src="/assets/${m}" width="128" height="128" alt="" loading="lazy" decoding="async">`).join("")}</div>`
    : w.textOnly ? `<div class="txt" aria-hidden="true">${esc(w.title)}</div>`
    : `<img src="/assets/${w.img}" width="${w.w}" height="${w.h}" alt="${esc(w.title)}" loading="lazy" decoding="async">`;
  return `<a class="w" data-svc="${w.svc}" href="${w.href}" rel="noopener">${media}<div class="b"><span class="k">${esc(w.kind)}</span><span class="t">${esc(w.title)}</span><span class="n">${esc(w.note)}</span></div></a>`;
};

// ---------- home ----------
const HOME_DESC = "Sovereign Symptoms is the Glitched Records studio by Indigo Holliday: websites, branding, music and lyric videos by Godkiller Graphics, and ghostwriting. Starting at $250.";
const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
write("index.html", head({ title: "Sovereign Symptoms · Websites, branding, videos and ghostwriting", desc: HOME_DESC, path: "/", jsonld: [ORG, WEBSITE, faqLd] }) + `<body>${HEADER("home")}
<main id="main"><div class="wrap">
<section class="hero" aria-labelledby="h1"><div>
<p class="eyebrow">A Glitched Records studio</p>
<h1 id="h1"><span class="glitch" data-text="Sovereign Symptoms">Sovereign Symptoms</span><span class="sub">Websites · Branding · Videos · Ghostwriting</span></h1>
<p>The studio side of the Glitched universe. The same hands that build the sites, marks, videos and lyrics for ${ARTIST} can build yours.</p>
<div class="cta"><a class="btn solid" href="/inquire/">Start a project</a><a class="btn" href="#work">See the work</a></div>
</div><img class="logo" src="/assets/ss-logo-512.webp" width="512" height="512" alt="Sovereign Symptoms gold logo" fetchpriority="high"></section>

<section id="services" aria-labelledby="h-svc"><p class="eyebrow">Services</p><h2 id="h-svc">What the studio makes</h2>
<p class="lead">Every price is a starting point for the smallest version of the job. Bigger projects get a written quote before anything begins. Nothing is sold or charged on this site.</p>
<div class="grid svc">${SERVICE_LIST.map(svcCard).join("\n")}</div>
<div class="gk"><span class="sig" aria-hidden="true">GODKILLER<br>GRAPHICS</span><p><b>Godkiller Graphics</b> is the studio's video arm. It takes its name from <i>T.H.E. A.NAMNESIS OF A GODKILLER</i>, the Glitched Records short film <a href="${YT("ZxDRKODERKQ")}">Bloody Gnosis</a>. Same edit bay, same eye, now open for your release.</p></div>
</section>

<section id="work" aria-labelledby="h-work"><p class="eyebrow">Work</p><h2 id="h-work">Selected work</h2>
<p class="lead">In-house work from the Glitched universe, plus reserved slots for client projects shared with permission.</p>
<div class="chips" role="group" aria-label="Filter work by service"><button class="chip" type="button" data-f="all" aria-pressed="true">All</button>${SERVICE_LIST.map((s) => `<button class="chip" type="button" data-f="${s.key}" aria-pressed="false">${esc(s.name)}</button>`).join("")}</div>
<div class="grid work" id="work-grid">${[...WORK, ...SLOTS].map(workCard).join("\n")}</div>
</section>

<section id="process" aria-labelledby="h-proc"><p class="eyebrow">Process</p><h2 id="h-proc">How a project runs</h2>
<ol class="steps">
<li><h3>Inquiry</h3><p>Tell the studio what you need with the short form.</p></li>
<li><h3>Call</h3><p>A quick call or email thread to pin down the idea.</p></li>
<li><h3>Written quote</h3><p>Scope, timeline, revisions and price, in writing.</p></li>
<li><h3>Work</h3><p>Drafts and check-ins as it comes together.</p></li>
<li><h3>Delivery</h3><p>Final files, launch, and handover.</p></li>
</ol></section>

<section id="about" aria-labelledby="h-about"><p class="eyebrow">About</p><div class="about"><img src="/assets/ss-logo-256.webp" width="256" height="256" alt="" loading="lazy">
<div><h2 id="h-about">One founder, one point of contact</h2>
<p class="lead">Sovereign Symptoms is Indigo Holliday, solo. Indigo founded Glitched Records and builds its whole universe: the timeline site, the brand marks, the Godkiller Graphics videos and the lyrics for ${ARTIST}.</p>
<p class="lead">Working with the studio means talking to the person doing the work, from the first message to the final files.</p></div></div></section>

<section id="faq" aria-labelledby="h-faq"><p class="eyebrow">FAQ</p><h2 id="h-faq">Questions</h2>
${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n")}
<div class="cta"><a class="btn solid" href="/inquire/">Start a project</a></div></section>
</div></main>${FOOTER}
<script>
(()=>{const g=document.getElementById("work-grid"),cs=[...document.querySelectorAll(".chip")];cs.forEach(c=>c.addEventListener("click",()=>{const f=c.dataset.f;cs.forEach(x=>x.setAttribute("aria-pressed",String(x===c)));g.querySelectorAll("[data-svc]").forEach(w=>{w.hidden=f!=="all"&&w.dataset.svc!==f})}))})();
</script></body></html>`);

// ---------- inquire ----------
const opt = (list, sel) => list.map((v) => `<option${v === sel ? " selected" : ""}>${esc(v)}</option>`).join("");
const SVC_KEYS = Object.fromEntries(SERVICE_LIST.map((s) => [s.key, s.form]));
write("inquire/index.html", head({ title: "Start a project · Sovereign Symptoms", desc: "Tell Sovereign Symptoms about your website, branding, music video, lyric video or ghostwriting project. Indigo replies by email with a written quote.", path: "/inquire/", jsonld: [ORG] }) + `<body>${HEADER("inquire")}
<main id="main"><div class="wrap"><section aria-labelledby="h1">
<p class="eyebrow">Start a project</p><h1 id="h1" style="font-size:clamp(28px,4vw,42px)">Tell the studio what you're making</h1>
<p class="lead">A few details are enough to start. Indigo replies by email, usually with a question or two and then a written quote. No payment is taken here.</p>
<form class="form" id="inq" method="post" action="/api/inquire" novalidate>
<div class="row"><label>Your name<input name="name" autocomplete="name" required maxlength="120"></label>
<label>Email<input name="email" type="email" autocomplete="email" required maxlength="200"></label></div>
<div class="row"><label>Service<select name="service" id="service">${opt(SERVICES, "Not sure yet")}</select></label>
<label>Budget<select name="budget">${opt(BUDGETS, "Not sure yet")}</select></label></div>
<label>Timeline<select name="timeline">${opt(TIMELINES, "Flexible")}</select></label>
<label>Links (optional)<input name="links" maxlength="600" placeholder="Song, current site, references"></label>
<label>About the project<textarea name="message" required maxlength="5000"></textarea></label>
<label class="hp" aria-hidden="true">Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label>
<label class="check"><input type="checkbox" name="consent" value="yes" required><span>It's OK to email me back about this inquiry. See the <a href="/privacy/">privacy note</a>.</span></label>
<button type="submit">Send inquiry</button>
<p class="status" id="status" role="status" aria-live="polite"></p>
</form>
<p class="small">Prefer the main contact form? Use <a href="${HUB}/contact/">glitchedrecords.com/contact</a>.</p>
</section></div></main>${FOOTER}
<script>
(()=>{const K=${JSON.stringify(SVC_KEYS)},q=new URLSearchParams(location.search),s=document.getElementById("service"),st=document.getElementById("status"),f=document.getElementById("inq");
if(K[q.get("service")])s.value=K[q.get("service")];
if(q.get("sent")){st.textContent="Thanks, your inquiry is on its way. Indigo replies by email.";st.className="status ok"}
if(q.get("error")){st.textContent=q.get("error");st.className="status err"}
f.addEventListener("submit",async e=>{e.preventDefault();if(!f.reportValidity())return;const b=f.querySelector("button");b.disabled=true;st.className="status";st.textContent="Sending…";
try{const r=await fetch(f.action,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(f)))});const j=await r.json().catch(()=>({ok:false,message:"Something went wrong. Please use glitchedrecords.com/contact/ instead."}));
st.textContent=j.message;st.className="status "+(j.ok?"ok":"err");if(j.ok)f.reset()}catch{st.textContent="Something went wrong. Please use glitchedrecords.com/contact/ instead.";st.className="status err"}b.disabled=false})})();
</script></body></html>`);

// ---------- privacy ----------
write("privacy/index.html", head({ title: "Privacy · Sovereign Symptoms", desc: "What happens to the details you send through the Sovereign Symptoms inquiry form.", path: "/privacy/" }) + `<body>${HEADER("privacy")}
<main id="main"><div class="wrap"><div class="prose"><h1>Privacy</h1>
<p>This site has no ads, no tracking cookies and no checkout.</p>
<h2>The inquiry form</h2><p>When you send an inquiry, your name, email and message are emailed to Indigo Holliday through Resend, an email delivery service. They are used only to reply to you about your project and are never sold or shared for marketing.</p>
<h2>Keeping and deleting</h2><p>Inquiries stay in the studio inbox for as long as they are useful for your project. To have yours deleted, send a request through the <a href="/inquire/">inquiry form</a>.</p>
<h2>Other sites</h2><p>Links to YouTube and other Glitched universe sites follow those sites' own privacy policies.</p>
<p class="small">Updated November 2026.</p></div></div></main>${FOOTER}</body></html>`);

// ---------- 404 ----------
write("404.html", head({ title: "Signal lost · Sovereign Symptoms", desc: "This page does not exist.", path: "/404.html", noindex: true }) + `<body>${HEADER("404")}
<main id="main"><div class="wrap"><div class="prose"><p class="eyebrow">404</p><h1>Signal lost</h1><p>That page isn't here. Try the <a href="/">studio home</a> or <a href="/inquire/">start a project</a>.</p></div></div></main>${FOOTER}</body></html>`);

// ---------- robots, sitemap, headers ----------
const today = new Date().toISOString().slice(0, 10);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${["/", "/inquire/", "/privacy/"].map((p) => `  <url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
// Cloudflare Pages: keep *.pages.dev copies out of Google; cache assets.
write("_headers", `https://:project.pages.dev/*\n  X-Robots-Tag: noindex\n\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`);
console.log("built", readdirSync(OUT));
