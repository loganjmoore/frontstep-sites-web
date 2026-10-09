#!/usr/bin/env node
// Builds the blog: content/blog/<slug>.md -> blog/<slug>/index.html, hub pages,
// sitemap.xml, robots.txt, llms.txt. Zero dependencies. Rerun any time; it
// only reads content/, it never writes there.
//
//   node tools/build-blog.mjs
//
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const WEB = fileURLToPath(new URL("..", import.meta.url));
const CONTENT_DIR = join(WEB, "content", "blog");
const BLOG_DIR = join(WEB, "blog");
const HUB_DIR = join(WEB, "content", "hubs");
const READ_CSS = readFileSync(join(WEB, "assets", "read.css"), "utf8");
const SITE = "https://frontstepsites.com";
const LOGIN_URL = "https://app.frontstepsites.com/login";
const START_URL = "https://app.frontstepsites.com/get-started";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const ORG = {
  "@type": "Organization",
  name: "Front Step Sites",
  url: `${SITE}/`,
  description: "Front Step Sites (frontstepsites.com) is unrelated to FRONTSTEPS, the property-management/HOA software company.",
};

// ---------- small utilities ----------

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
const TITLE_CASE_STOPWORDS = new Set(["and", "or", "for", "of", "the", "a", "an", "in", "on"]);
function titleCaseWord(w, isFirst) {
  if (/^[A-Z]+$/.test(w)) return w;
  if (!isFirst && TITLE_CASE_STOPWORDS.has(w.toLowerCase())) return w.toLowerCase();
  return w.charAt(0).toUpperCase() + w.slice(1);
}
function titleCase(s) {
  return s.split(" ").map((w, i) => titleCaseWord(w, i === 0)).join(" ");
}
function formatDate(iso) {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(iso);
  const [, y, mo, d] = m;
  const month = MONTHS[Number(mo) - 1] || mo;
  return `${month} ${Number(d)}, ${y}`;
}
function firstSentence(text) {
  // A terminator only ends the sentence when whitespace or the end follows it, so "llms.txt" and "2.5" survive.
  const m = String(text).match(/^.*?[.!?](?=\s|$)/s);
  return (m ? m[0] : text).trim();
}
function stripMd(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}
function jsonLdScript(obj) {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;
}

function clarityScript() {
  return `<script>(function(c,l,a,r,i,t,y){var d=false,k="frontstep_analytics_consent";function o(){return navigator.globalPrivacyControl===true||["1","yes"].includes(navigator.doNotTrack||c.doNotTrack)}function g(){try{return !o()&&localStorage.getItem(k)==="accepted"}catch(e){return false}}function s(){if(d||!g())return;d=true;c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)}function u(){if(g()){if(d)c[a]("consentv2",{ad_Storage:"denied",analytics_Storage:"granted"});else s()}else if(d){c[a]("consentv2",{ad_Storage:"denied",analytics_Storage:"denied"});c[a]("consent",false)}}["pointerdown","keydown","touchstart"].forEach(function(e){c.addEventListener(e,s,{once:true,passive:true})});c.addEventListener("load",function(){c.setTimeout(s,8000)},{once:true});c.addEventListener("website:analytics-consent",u)})(window,document,"clarity","script","yqkzhoosjo");</script>`;
}

// ---------- front matter ----------

const REQUIRED_FIELDS = ["title", "description", "slug", "cluster", "answer", "updated"];

function parseFrontMatter(raw) {
  if (!raw.startsWith("---")) return { error: "missing front matter" };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { error: "unterminated front matter" };
  const fmBlock = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, "");
  const data = {};
  for (const line of fmBlock.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    const quoted = value.match(/^"(.*)"$/);
    if (quoted) value = quoted[1];
    data[key] = value;
  }
  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) return { error: `missing front matter field "${field}"` };
  }
  return { data, body };
}

// ---------- markdown (subset) ----------

function parseBlocks(md) {
  const lines = md.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = line.match(/^```([a-z0-9-]*)\s*$/i);
    if (fence) {
      const code = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push({ type: "code", language: fence[1], text: code.join("\n") });
      continue;
    }
    if (/^###\s+/.test(line)) { blocks.push({ type: "h3", text: line.replace(/^###\s+/, "").trim() }); i++; continue; }
    if (/^##\s+/.test(line)) { blocks.push({ type: "h2", text: line.replace(/^##\s+/, "").trim() }); i++; continue; }
    if (/^-\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^-\s+/.test(lines[i])) { items.push(lines[i].replace(/^-\s+/, "").trim()); i++; }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, "").trim()); i++; }
      blocks.push({ type: "ol", items });
      continue;
    }
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      blocks.push({ type: "img", alt: imgMatch[1], src: imgMatch[2] });
      i++;
      continue;
    }
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(lines[i + 1])) {
      const splitRow = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      const headers = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
      blocks.push({ type: "table", headers, rows });
      continue;
    }
    const paraLines = [];
    while (i < lines.length && lines[i].trim() && !/^#{2,3}\s+/.test(lines[i]) && !/^-\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i]) && !/^!\[([^\]]*)\]\(([^)]+)\)\s*$/.test(lines[i]) && !/^\|.*\|\s*$/.test(lines[i])) {
      paraLines.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "p", text: paraLines.join(" ") });
  }
  return blocks;
}

function inline(text, ctx) {
  let out = escapeHtml(text);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (whole, label, url) => {
    const bare = url.match(/^\/blog\/([a-z0-9-]+)\/$/);
    if (bare && !ctx.allowedBareSlugs.has(bare[1])) {
      ctx.deadLinks.push({ label, url });
      return label;
    }
    return `<a href="${escapeAttr(url)}">${label}</a>`;
  });
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return out;
}

// Renders the markdown body to HTML, pulling out the FAQ section (### question
// / answer paragraphs under "## Frequently asked questions") for JSON-LD.
function renderMarkdown(body, ctx) {
  const blocks = parseBlocks(body);
  const usedIds = new Set();
  let html = "";
  let inFaq = false;
  const faqItems = [];
  let currentFaq = null;

  const flushFaq = () => {
    if (currentFaq) {
      faqItems.push({ question: currentFaq.question, answer: currentFaq.answerParts.join(" ") });
      currentFaq = null;
    }
  };

  for (const block of blocks) {
    if (block.type === "h2") {
      flushFaq();
      inFaq = ["frequently-asked-questions", "what-are-the-frequently-asked-questions"].includes(slugify(block.text));
      let id = slugify(block.text) || "section";
      let unique = id, n = 2;
      while (usedIds.has(unique)) unique = `${id}-${n++}`;
      usedIds.add(unique);
      html += `<h2 id="${unique}">${inline(block.text, ctx)}</h2>\n`;
    } else if (block.type === "h3") {
      let id = slugify(block.text) || "section";
      let unique = id, n = 2;
      while (usedIds.has(unique)) unique = `${id}-${n++}`;
      usedIds.add(unique);
      html += `<h3 id="${unique}">${inline(block.text, ctx)}</h3>\n`;
      if (inFaq) {
        flushFaq();
        currentFaq = { question: stripMd(block.text), answerParts: [] };
      }
    } else if (block.type === "p") {
      html += `<p>${inline(block.text, ctx)}</p>\n`;
      if (inFaq && currentFaq) currentFaq.answerParts.push(stripMd(block.text));
    } else if (block.type === "ul" || block.type === "ol") {
      const tag = block.type;
      html += `<${tag}>\n${block.items.map((it) => `<li>${inline(it, ctx)}</li>`).join("\n")}\n</${tag}>\n`;
    } else if (block.type === "img") {
      html += `<figure class="doc-figure"><img src="${escapeAttr(block.src)}" alt="${escapeAttr(block.alt)}" loading="lazy"></figure>\n`;
    } else if (block.type === "table") {
      html += `<div class="table-wrap"><table><thead><tr>${block.headers
        .map((h) => `<th>${inline(h, ctx)}</th>`)
        .join("")}</tr></thead><tbody>${block.rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c, ctx)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table></div>\n`;
    } else if (block.type === "code") {
      const language = block.language ? ` class="language-${escapeAttr(block.language)}"` : "";
      html += `<pre><code${language}>${escapeHtml(block.text)}</code></pre>\n`;
    }
  }
  flushFaq();
  return { html, faqItems };
}

// ---------- cluster naming ----------

function clusterHumanName(cluster, topicsByCluster) {
  if (cluster === "guides") return "Website guides";
  if (cluster === "ai-search") return "AI search (GEO)";
  if (cluster === "compare") return "Comparisons";
  const topics = topicsByCluster.get(cluster);
  const trade = topics && topics[0] && topics[0].trade;
  return trade ? titleCase(trade) : titleCase(cluster.replace(/^trades\//, "").replace(/-/g, " "));
}

// ---------- page shell ----------

function brandSvg() {
  return `<svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" fill="#ffd60a"/><path d="M6 27h22v-5H17v-5h-5v-5H6z" fill="#111312"/></svg>`;
}

const SITE_PLAN_CSS = `
/* interactive article demo */
.site-plan{margin:1.5rem 0 2rem;padding:1.15rem;border:1.5px solid var(--ink);background:var(--tag)}
.site-plan h2{margin-top:0}
.site-plan form{display:grid;gap:.85rem;margin-top:1rem}
.site-plan label{display:grid;gap:.3rem;font-weight:700}
.site-plan input,.site-plan select{width:100%;min-height:46px;padding:.55rem .65rem;border:1.5px solid var(--ink);border-radius:3px;background:#fff;color:var(--ink);font:inherit}
.site-plan .btn{justify-self:start;background:var(--yellow);color:var(--ink)}
.site-plan-output{margin-top:1rem;padding-top:1rem;border-top:1.5px dashed var(--ink)}
.site-plan-output h3{margin-top:0}
.site-plan-output ol{margin-bottom:.8rem}
@media(min-width:760px){.site-plan form{grid-template-columns:1fr 1fr}.site-plan label:last-of-type{grid-column:1/-1}.site-plan .btn{grid-column:1/-1}}
`;

const RESOURCE_CSS = `.site-plan iframe{width:100%;height:460px;border:1px solid var(--ink);background:#fff}
.site-plan .resource-help{grid-column:1/-1;margin:0;font-size:.85rem}
.site-plan pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.85rem}
.site-plan button:disabled{opacity:.55;cursor:not-allowed}
.site-plan [role="alert"]{color:#9c241c}
.site-plan a.btn{display:inline-flex;margin-top:1rem}
.site-plan textarea{width:100%;padding:.55rem .65rem;border:1.5px solid var(--ink);border-radius:3px;background:#fff;color:var(--ink);font:inherit}
`;
function pageShell({ title, description, canonical, ogType = "website", ogImage, preloadImage, bodyHtml, jsonLd = [] }) {
  const fontHref = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&display=optional";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(description)}">
<link rel="canonical" href="${escapeAttr(canonical)}">
<link rel="alternate" type="application/rss+xml" title="Front Step Sites blog" href="${SITE}/feed.xml">
<meta name="google-site-verification" content="o99-pefOA6pR2C5f_pPemZCLI9MPywug-MAAubRePjQ" />
${clarityScript()}
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(description)}">
<meta property="og:type" content="${escapeAttr(ogType)}">
<meta property="og:url" content="${escapeAttr(canonical)}">
${ogImage ? `<meta property="og:image" content="${escapeAttr(ogImage)}">\n` : ""}${preloadImage ? `<link rel="preload" as="image" href="${escapeAttr(preloadImage)}" fetchpriority="high">\n` : ""}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fontHref}" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="${fontHref}" rel="stylesheet"></noscript>
<style>${READ_CSS}${(bodyHtml.includes('id="site-plan-builder"') || bodyHtml.includes('data-website-resource=')) ? SITE_PLAN_CSS : ""}${bodyHtml.includes("data-website-resource=") ? RESOURCE_CSS : ""}</style>
${jsonLd.map(jsonLdScript).join("\n")}
<script defer src="/analytics-consent.js"></script>
<script defer src="/posthog-web.js"></script>
</head>
<body>
<header class="site"><div class="wrap">
  <a class="brand" href="/" aria-label="Front Step Sites home">${brandSvg()}Front Step Sites</a>
  <nav>
    <a class="hide-sm" href="/blog/">Blog</a>
    <a class="hide-sm" href="${LOGIN_URL}">Sign in</a>
    <a class="btn" href="${START_URL}">Get started</a>
  </nav>
</div></header>
<main class="read"><div class="wrap">
${bodyHtml}
</div></main>
<footer class="site"><div class="wrap">
  <span>Front Step Sites &middot; <a href="mailto:hello@frontstepsites.com">hello@frontstepsites.com</a></span>
  <span><a href="/blog/">Blog</a> &middot; <a href="/privacy/">Privacy</a> &middot; <a href="/terms/">Terms</a> &middot; <a href="${LOGIN_URL}">Customer sign in</a></span>
  <span class="disambig">Front Step Sites (frontstepsites.com) is unrelated to FRONTSTEPS, the property-management/HOA software company.</span>
<address style="font-style: normal; font-size: 14px; line-height: 1.6; margin-top: 16px;"><strong>Mailing address</strong><br />3060 Mercer University Dr Ste 110<br />Atlanta, GA 30341</address></div></footer>${bodyHtml.includes('id="site-plan-builder"') ? `
<script>
(function () {
  var form = document.getElementById("site-plan-builder");
  var output = document.getElementById("site-plan-output");
  if (!form || !output) return;
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var business = String(data.get("business") || "local business").trim() || "local business";
    var area = String(data.get("area") || "your service area").trim() || "your service area";
    var action = String(data.get("action") || "request a quote");
    output.innerHTML = "<h3>Your starter site plan</h3><ol><li><strong>Homepage:</strong> Say what your " + escapeText(business) + " does in " + escapeText(area) + " and make it easy to " + escapeText(action) + ".</li><li><strong>Services:</strong> Give each main service its own plain-language explanation.</li><li><strong>About:</strong> Show who does the work and why customers can trust the business.</li><li><strong>Contact:</strong> Repeat the service area, hours, and the next step.</li></ol><p>This is a planning demo. A builder or provider still needs your real services, photos, policies, and contact details.</p>";
    output.hidden = false;
    output.focus();
  });
  function escapeText(value) {
    var span = document.createElement("span");
    span.textContent = value;
    return span.innerHTML;
  }
})();
</script>` : ""}
${bodyHtml.includes("data-website-resource=") ? `<script type="module" src="/assets/website-resources.mjs"></script>\n` : ""}</body>
</html>
`;
}

function renderWebsiteResource(mode) {
  if (!["starter", "brief"].includes(mode)) return "";
  const starter = mode === "starter";
  return `<section class="site-plan" data-website-resource="${mode}" aria-labelledby="website-resource-title">
  <h2 id="website-resource-title">${starter ? "Build a downloadable website starter" : "Prepare a brief for an AI website builder"}</h2>
  <p>${starter ? "Make a small HTML website from your own business details. Preview it here, then download a file you can open in a browser or edit." : "Turn your business details into a structured brief for an AI builder or a website provider. Download it, review it, and choose where to use it."}</p>
  <p>${starter ? "This uses a fixed template; it does not call AI or publish a website." : "This generates a brief, not a website. No AI provider is called. FrontStep’s finished build uses its existing signed-in, active-plan workflow."} Your answers stay in this page and the file you download. They are not sent or saved. Optional analytics records only the public resource action.</p>
  <form>
    <label>Business name<input name="businessName" required maxlength="80" autocomplete="organization" placeholder="Example Tree Care"></label>
    <label>Trade or business type<input name="trade" required maxlength="80" placeholder="Tree care"></label>
    <label>City or service area<input name="city" required maxlength="100" placeholder="Tulsa"></label>
    <label>State abbreviation<input name="state" required minlength="2" maxlength="2" pattern="[A-Za-z]{2}" placeholder="OK"></label>
    <label>Customer phone or email<input name="contact" required maxlength="254" placeholder="202-555-0123"></label>
    <label>Services, one per line<textarea name="services" aria-describedby="website-services-help" required maxlength="1000" rows="4" placeholder="Tree pruning&#10;Storm cleanup"></textarea></label>
    <p class="resource-help" id="website-services-help">One to eight services, up to 150 characters per line and 1,000 characters total.</p>
    <button class="btn" type="submit">${starter ? "Build my website starter" : "Build my website brief"}</button>
  </form>
  <p data-resource-error role="alert" tabindex="-1"></p>
  <div data-resource-output class="site-plan-output" tabindex="-1" hidden>
    <h3>${starter ? "Your website preview" : "Your website brief"}</h3>
    ${starter ? '<iframe sandbox="" title="Your generated website preview"></iframe>' : '<div data-brief-summary></div><details><summary>View the full structured brief</summary><pre aria-label="Generated website brief"></pre></details>'}
    <p>${starter ? "The file includes your services and a phone or email link. It has no contact-form delivery, booking, payment or hosting. Check every detail before publishing." : "Copy the full brief into your chosen builder, or upload the file if it supports JSON. Ask for a draft, then check every fact before publishing. This brief follows FrontStep’s existing business questionnaire fields. If you entered an email, add a customer phone number before completing that questionnaire. AI output still needs your review."}</p>
    <button class="btn" data-resource-download type="button" disabled>${starter ? "Download website HTML" : "Download website brief"}</button>
    <p>Prefer a finished site and ongoing changes? <a href="${START_URL}">Start with FrontStep’s existing plans</a>.</p>
  </div>
  <noscript><p>This local tool needs JavaScript. The guide below and our <a href="${START_URL}">existing signup flow</a> remain available.</p></noscript>
  </section>`;
}

function renderSitePlanBuilder() {
  return `<section class="site-plan" aria-labelledby="site-plan-title">
  <h2 id="site-plan-title">Try the site-plan builder</h2>
  <p>Enter three details to turn a blank website into a practical four-page starting plan. Nothing is sent or saved.</p>
  <form id="site-plan-builder">
    <label>Business type<input name="business" autocomplete="organization-title" required placeholder="Tree service"></label>
    <label>Service area<input name="area" autocomplete="address-level2" required placeholder="Tulsa and nearby towns"></label>
    <label>Main customer action<select name="action"><option>call the business</option><option>request a quote</option><option>book an appointment</option><option>visit the location</option></select></label>
    <button class="btn" type="submit">Build my starter plan</button>
  </form>
  <div id="site-plan-output" class="site-plan-output" tabindex="-1" hidden aria-live="polite"></div>
</section>`;
}

// crumbs: array of {name, url|null}. url === null means "current page", rendered as plain text.
function renderCrumbs(crumbs) {
  const parts = crumbs.map((c) => (c.url ? `<a href="${escapeAttr(c.url)}">${escapeHtml(c.name)}</a>` : `<span>${escapeHtml(c.name)}</span>`));
  return `<nav class="crumbs" aria-label="Breadcrumb">${parts.join('<span class="sep">&rsaquo;</span>')}</nav>`;
}

// ---------- article page ----------

function renderArticlePage(article, related, clusterName, clusterUrl) {
  const canonical = `${SITE}/blog/${article.slug}/`;
  const ogImage = article.image ? `${SITE}${article.image}` : undefined;
  const crumbs = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog/" },
    { name: clusterName, url: clusterUrl },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.title,
      description: article.description,
      datePublished: article.published || article.updated,
      dateModified: article.updated,
      ...(ogImage ? { image: ogImage } : {}),
      author: article.author ? { "@type": "Person", name: article.author } : ORG,
      publisher: ORG,
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${SITE}${c.url}` })),
    },
  ];
  if (article.faqItems.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: article.faqItems.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  const relatedHtml = related.length
    ? `<div class="related"><h2>Related articles</h2><ul>${related
        .map((r) => `<li><a href="/blog/${r.slug}/">${escapeHtml(r.title)}</a><p>${escapeHtml(r.answer)}</p></li>`)
        .join("")}</ul></div>`
    : "";

  const bodyHtml = `<article class="doc">
${renderCrumbs(crumbs)}
<h1>${escapeHtml(article.title)}</h1>
${article.lead ? `<p class="direct-answer">${escapeHtml(article.lead)}</p>\n` : ""}<p class="updated">${article.author ? `By ${escapeHtml(article.author)} &middot; ` : ""}Updated ${formatDate(article.updated)}</p>
${article.image ? `<figure class="doc-figure doc-cover"><img src="${escapeAttr(article.image)}" alt="${escapeAttr(article.imageAlt || "")}" width="1200" height="630" fetchpriority="high"></figure>\n` : ""}<aside class="tag-box"><span class="label">Short answer</span><p>${escapeHtml(article.answer)}</p></aside>${article.sitePlanner === "true" ? `\n${renderSitePlanBuilder()}` : ""}
${article.resourceTool ? renderWebsiteResource(article.resourceTool) + "\n" : ""}${article.bodyHtml}
<aside class="tag-box tag-offer">
  <span class="label">Front Step Sites &middot; Launch</span>
  <p>$99/yr, domain included, no setup fee.</p>
  <a class="btn" href="${START_URL}">Get started</a>
</aside>
${relatedHtml}
</article>`;

  // Keep the <title> under 60 characters: drop the brand suffix when it would not fit.
  const fullTitle = `${article.title} | Front Step Sites`;
  return pageShell({
    title: fullTitle.length < 60 ? fullTitle : article.title,
    description: article.description,
    canonical,
    ogType: "article",
    ogImage,
    preloadImage: article.image,
    bodyHtml,
    jsonLd,
  });
}

// ---------- hub pages ----------

const HUB_FAQ = [
  { question: "How much does a Front Step Sites website cost?", answer: "$99 a year, with your domain included and no setup fee." },
  { question: "How do I ask for a change to my site?", answer: "Sign in to your account and write the request in plain English. Launch includes 2 requests a month, done within 2 business days." },
];

function renderClusterHub(cluster, clusterName, articles, introHtml = "") {
  const canonical = `${SITE}/blog/${cluster}/`;
  const crumbs = [{ name: "Home", url: "/" }, { name: "Blog", url: "/blog/" }, { name: clusterName, url: null }];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: clusterName,
      url: canonical,
      hasPart: {
        "@type": "ItemList",
        itemListElement: articles.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/blog/${a.slug}/` })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url ? `${SITE}${c.url}` : canonical })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HUB_FAQ.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    },
  ];
  const faqHtml = `<h2 id="frequently-asked-questions">Frequently asked questions</h2>
${HUB_FAQ.map((f) => `<h3>${escapeHtml(f.question)}</h3>\n<p>${escapeHtml(f.answer)}</p>`).join("\n")}`;
  const bodyHtml = `<article class="doc">
${renderCrumbs(crumbs)}
<h1>${escapeHtml(clusterName)}</h1>
<p class="updated">${articles.length} article${articles.length === 1 ? "" : "s"}</p>
${introHtml}<p>Front Step Sites is a done-for-you website service for small businesses, priced at $99 a year with the domain included and no setup fee. The ${escapeHtml(clusterName)} hub is a section of the Front Step Sites blog with ${articles.length} article${articles.length === 1 ? "" : "s"} of practical, specific guidance, with 2 change requests a month included on the Launch plan.</p>
<ul class="article-list">
${articles.map((a) => `<li><a href="/blog/${a.slug}/">${escapeHtml(a.title)}</a><p>${escapeHtml(a.answer)}</p></li>`).join("\n")}
</ul>
${faqHtml}
</article>`;
  return pageShell({
    title: `${clusterName} | Front Step Sites blog`,
    description: `${clusterName} articles from Front Step Sites: practical, specific guidance, no fluff.`,
    canonical,
    bodyHtml,
    jsonLd,
  });
}

const BLOG_FAQ = [
  { question: "Is frontstepsites.com the same company as FRONTSTEPS?", answer: "No. Front Step Sites (frontstepsites.com) is unrelated to FRONTSTEPS, the property-management/HOA software company." },
  { question: "What does Front Step Sites do, and who is it for?", answer: "Front Step Sites is a done-for-you website service. You answer a 10-minute questionnaire, we write and build your site, keep it running, and make changes when you ask in plain English. It is for small local businesses in the United States, at $99 a year with the domain included and no setup fee." },
  { question: "How is Front Step Sites different from Wix or Squarespace?", answer: "Wix and Squarespace are website builders you use yourself. As of September 2026, Wix Light is $204 a year billed yearly and Squarespace Basic is $19 a month. Front Step Sites is a done-for-you service that builds the site and makes your changes for $99 a year with the domain included." },
];

function renderBlogHub(tradeRows, guideRows, aiRows, compareRows, latestRows, featuredRows) {
  const canonical = `${SITE}/blog/`;
  const crumbs = [{ name: "Home", url: "/" }, { name: "Blog", url: null }];
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url ? `${SITE}${c.url}` : canonical })) },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: BLOG_FAQ.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    },
  ];

  const renderTradeList = (rows) =>
    `<ul class="hub-list">${rows
      .map((r) =>
        r.url
          ? `<li><a href="${r.url}">${escapeHtml(r.name)}</a><span class="count">${r.count} article${r.count === 1 ? "" : "s"}</span></li>`
          : `<li><span class="muted">${escapeHtml(r.name)}</span><span class="count">coming soon</span></li>`
      )
      .join("")}</ul>`;

  const renderArticleRows = (rows) =>
    rows.length
      ? `<ul class="hub-list">${rows.map((r) => `<li><a href="/blog/${r.slug}/">${escapeHtml(r.title)}</a></li>`).join("")}</ul>`
      : `<p class="updated">Coming soon.</p>`;

  const rowHeading = (name, url) => (url ? `<h2><a href="${escapeAttr(url)}">${escapeHtml(name)}</a></h2>` : `<h2>${escapeHtml(name)}</h2>`);

  const bodyHtml = `<article class="doc">
${renderCrumbs(crumbs)}
<h1>The Front Step Sites blog</h1>
<p>Front Step Sites is a done-for-you website service for small local businesses. This blog gives straight answers for owners about websites, local search, and getting found by customers. No jargon, no filler, checkable facts.</p>

<div class="hub-rail">
  <h2>Start with these posts</h2>
  ${renderArticleRows(featuredRows)}
</div>

<div class="hub-rail">
  <h2>For your trade</h2>
  ${renderTradeList(tradeRows)}
</div>

<div class="hub-rail">
  <h2>Newest posts</h2>
  ${renderArticleRows(latestRows)}
</div>

<div class="hub-rail">
  ${rowHeading("Website guides", guideRows.url)}
  ${renderArticleRows(guideRows.top)}
</div>

<div class="hub-rail">
  ${rowHeading("AI search (GEO)", aiRows.url)}
  ${renderArticleRows(aiRows.top)}
</div>

<div class="hub-rail">
  ${rowHeading("Comparisons", compareRows.url)}
  ${renderArticleRows(compareRows.top)}
</div>

<h2 id="frequently-asked-questions">Frequently asked questions</h2>
${BLOG_FAQ.map((f) => `<h3>${escapeHtml(f.question)}</h3>\n<p>${escapeHtml(f.answer)}</p>`).join("\n")}
</article>`;

  return pageShell({
    title: "Blog | Front Step Sites",
    description: "Practical, specific answers for small business owners about websites, local SEO, and showing up when customers search.",
    canonical,
    bodyHtml,
    jsonLd,
  });
}

// ---------- main build ----------

function main() {
  const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  let topics = [];
  try {
    topics = JSON.parse(readFileSync(join(WEB, "content", "topics.json"), "utf8"));
  } catch {
    console.warn("warning: could not read content/topics.json, hub trade list will be limited to built articles");
  }
  const topicsBySlug = new Map(topics.map((t) => [t.slug, t]));
  const topicsByCluster = new Map();
  for (const t of topics) {
    if (!topicsByCluster.has(t.cluster)) topicsByCluster.set(t.cluster, []);
    topicsByCluster.get(t.cluster).push(t);
  }

  const skipped = [];
  const parsedArticles = [];

  for (const file of files) {
    const raw = readFileSync(join(CONTENT_DIR, file), "utf8");
    if (raw.includes("\u2014")) {
      skipped.push({ file, reason: "contains an em dash (U+2014)" });
      continue;
    }
    const { data, body, error } = parseFrontMatter(raw);
    if (error) {
      skipped.push({ file, reason: error });
      continue;
    }
    parsedArticles.push({ file, data, body });
  }

  // Every article we're about to successfully render is a valid link target.
  const allowedBareSlugs = new Set(parsedArticles.map((a) => a.data.slug));
  allowedBareSlugs.add("guides");
  allowedBareSlugs.add("ai-search");
  allowedBareSlugs.add("compare");

  const articles = [];
  const deadLinksReport = [];

  for (const { file, data, body } of parsedArticles) {
    const ctx = { allowedBareSlugs, deadLinks: [] };
    const { html, faqItems } = renderMarkdown(body, ctx);
    if (ctx.deadLinks.length) {
      deadLinksReport.push({ file, links: ctx.deadLinks });
    }
    articles.push({
      slug: data.slug,
      title: data.title,
      description: data.description,
      cluster: data.cluster,
      answer: data.answer,
      lead: data.lead,
      updated: data.updated,
      published: data.published,
      author: data.author,
      image: data.image,
      imageAlt: data.imageAlt,
      sitePlanner: data.sitePlanner,
      resourceTool: data.resourceTool,
      bodyHtml: html,
      faqItems,
    });
  }

  // Deterministic order: topics.json order first, then anything not listed there.
  const topicOrderIndex = new Map(topics.map((t, i) => [t.slug, i]));
  articles.sort((a, b) => {
    const ia = topicOrderIndex.has(a.slug) ? topicOrderIndex.get(a.slug) : Infinity;
    const ib = topicOrderIndex.has(b.slug) ? topicOrderIndex.get(b.slug) : Infinity;
    return ia - ib || a.slug.localeCompare(b.slug);
  });

  const articlesByCluster = new Map();
  for (const a of articles) {
    if (!articlesByCluster.has(a.cluster)) articlesByCluster.set(a.cluster, []);
    articlesByCluster.get(a.cluster).push(a);
  }

  // Reset and rebuild the output directory so removed/renamed articles don't
  // leave stale pages behind.
  rmSync(BLOG_DIR, { recursive: true, force: true });
  mkdirSync(BLOG_DIR, { recursive: true });

  function relatedFor(article) {
    const sameCluster = (articlesByCluster.get(article.cluster) || []).filter((a) => a.slug !== article.slug);
    const picks = [...sameCluster];
    if (article.cluster !== "guides") {
      const guides = (articlesByCluster.get("guides") || []).filter((a) => a.slug !== article.slug);
      for (const g of guides) if (!picks.includes(g)) picks.push(g);
    }
    return picks.slice(0, 4);
  }

  // Article pages
  for (const article of articles) {
    const clusterName = clusterHumanName(article.cluster, topicsByCluster);
    const clusterUrl = `/blog/${article.cluster}/`;
    const html = renderArticlePage(article, relatedFor(article), clusterName, clusterUrl);
    const dir = join(BLOG_DIR, article.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
  }

  // Cluster hub pages (only for clusters with at least one built article)
  const hubClusters = [];
  for (const [cluster, list] of articlesByCluster) {
    if (!list.length) continue;
    const clusterName = clusterHumanName(cluster, topicsByCluster);
    // Optional intro for a hub: content/hubs/<cluster>.md (Markdown body, same subset as articles).
    let introHtml = "";
    const introFile = join(HUB_DIR, `${cluster}.md`);
    if (existsSync(introFile)) {
      const ctx = { allowedBareSlugs, deadLinks: [] };
      introHtml = renderMarkdown(readFileSync(introFile, "utf8"), ctx).html;
      if (ctx.deadLinks.length) deadLinksReport.push({ file: `content/hubs/${cluster}.md`, links: ctx.deadLinks });
    }
    const html = renderClusterHub(cluster, clusterName, list, introHtml);
    const dir = join(BLOG_DIR, cluster);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
    hubClusters.push({ cluster, name: clusterName, count: list.length });
  }

  // Blog index hub
  const tradeClusterSlugs = [...topicsByCluster.keys()].filter((c) => c.startsWith("trades/"));
  const tradeRows = tradeClusterSlugs
    .map((cluster) => {
      const name = clusterHumanName(cluster, topicsByCluster);
      const built = articlesByCluster.get(cluster) || [];
      return { name, count: built.length, url: built.length ? `/blog/${cluster}/` : null };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const topPicks = (cluster) => (articlesByCluster.get(cluster) || []).slice(0, 4);
  const hubRow = (cluster) => ({
    url: (articlesByCluster.get(cluster) || []).length ? `/blog/${cluster}/` : null,
    top: topPicks(cluster),
  });

  // topics.json lists new posts last, so the last six built articles are the newest.
  const latestRows = articles.slice(-6).reverse();
  const featuredSlugs = [
    "tree-service-local-seo-checklist",
    "who-owns-your-domain-name-and-why-it-matters",
    "pest-control-get-more-reviews",
  ];
  const articlesBySlug = new Map(articles.map((article) => [article.slug, article]));
  const featuredRows = featuredSlugs.map((slug) => articlesBySlug.get(slug)).filter(Boolean);

  writeFileSync(join(BLOG_DIR, "index.html"), renderBlogHub(tradeRows, hubRow("guides"), hubRow("ai-search"), hubRow("compare"), latestRows, featuredRows));

  // sitemap.xml
  const today = new Date().toISOString().slice(0, 10);
  const priorDates = new Map([...readFileSync(join(WEB, "sitemap.xml"), "utf8").matchAll(/<url><loc>(.*?)<\/loc><lastmod>(.*?)<\/lastmod><\/url>/g)].map(m => [m[1], m[2]]));
  const unchangedDate = path => priorDates.get(`${SITE}${path}`) || today;
  const urls = [
    { loc: "/", lastmod: unchangedDate("/") },
    { loc: "/privacy/", lastmod: "2026-10-08" },
    { loc: "/terms/", lastmod: unchangedDate("/terms/") },
    { loc: "/blog/", lastmod: unchangedDate("/blog/") },
    ...hubClusters.map((h) => ({ loc: `/blog/${h.cluster}/`, lastmod: unchangedDate(`/blog/${h.cluster}/`) })),
    ...articles.map((a) => ({ loc: `/blog/${a.slug}/`, lastmod: a.updated })),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE}${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`;
  writeFileSync(join(WEB, "sitemap.xml"), sitemap);

  // feed.xml (RSS 2.0), newest post first
  // Ties on date go to the entry later in topics.json, so the newest-added posts lead.
  const feedItems = articles
    .map((a, i) => ({ a, i }))
    .sort((x, y) => (x.a.updated < y.a.updated ? 1 : x.a.updated > y.a.updated ? -1 : y.i - x.i))
    .map((x) => x.a);
  const rssDate = (iso) => {
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return new Date().toUTCString();
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)).toUTCString();
  };
  const feed = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n  <title>Front Step Sites blog</title>\n  <link>${SITE}/blog/</link>\n  <description>Practical, specific answers for small business owners about websites, local SEO, and showing up when customers search.</description>\n  <language>en-us</language>\n  <lastBuildDate>${feedItems.length ? rssDate(feedItems[0].updated) : new Date().toUTCString()}</lastBuildDate>\n${feedItems
    .map(
      (a) =>
        `  <item>\n    <title>${escapeHtml(a.title)}</title>\n    <link>${SITE}/blog/${a.slug}/</link>\n    <guid isPermaLink="true">${SITE}/blog/${a.slug}/</guid>\n    <pubDate>${rssDate(a.published || a.updated)}</pubDate>\n    <description>${escapeHtml(a.description)}</description>\n  </item>`
    )
    .join("\n")}\n</channel></rss>\n`;
  writeFileSync(join(WEB, "feed.xml"), feed);

  // robots.txt (keep the existing disallow rules, add Allow + Sitemap)
  const robots = `User-agent: *\nAllow: /\nDisallow: /plumber/\nDisallow: /link/\n\nSitemap: ${SITE}/sitemap.xml\n`;
  writeFileSync(join(WEB, "robots.txt"), robots);

  // llms.txt
  const llmsLines = [];
  llmsLines.push("# Front Step Sites");
  llmsLines.push("");
  llmsLines.push(
    "> Front Step Sites builds, hosts, and maintains websites for small businesses. Plans start at $99 a year with the domain included and no setup fee, and the domain is registered in the customer's own name. Customers ask for changes by writing in their account: 2 requests a month within 2 business days on the Launch plan, or unlimited requests the same business day on Grow ($29 a month or $290 a year), which also shows the customer's Google reviews on the site. New pages, blog posts, and local SEO setup are included, and customers can leave any time and take their domain with them, with no transfer fee. Front Step Sites (frontstepsites.com) is unrelated to FRONTSTEPS, the property-management/HOA software company."
  );
  llmsLines.push("");
  llmsLines.push("## Pages");
  llmsLines.push("");
  llmsLines.push(`- [Front Step Sites](${SITE}/): Done-for-you websites for small businesses, $99 a year with the domain included and no setup fee.`);
  llmsLines.push(`- [Privacy policy](${SITE}/privacy/)`);
  llmsLines.push(`- [Terms of service](${SITE}/terms/)`);
  llmsLines.push(`- [Blog](${SITE}/blog/): Practical, specific answers for small business owners about websites and local search.`);
  for (const h of hubClusters.sort((a, b) => a.name.localeCompare(b.name))) {
    llmsLines.push(`- [${h.name}](${SITE}/blog/${h.cluster}/)`);
  }
  llmsLines.push("");
  llmsLines.push("## Articles");
  llmsLines.push("");
  for (const a of articles) {
    llmsLines.push(`- [${a.title}](${SITE}/blog/${a.slug}/): ${firstSentence(a.answer)}`);
  }
  writeFileSync(join(WEB, "llms.txt"), llmsLines.join("\n") + "\n");

  // ---- summary ----
  console.log(`Built ${articles.length} article page(s) and ${hubClusters.length} cluster hub page(s).`);
  if (skipped.length) {
    console.log(`Skipped ${skipped.length} file(s):`);
    for (const s of skipped) console.log(`  - ${s.file}: ${s.reason}`);
  } else {
    console.log("Skipped 0 files.");
  }
  if (deadLinksReport.length) {
    const total = deadLinksReport.reduce((n, d) => n + d.links.length, 0);
    console.log(`Converted ${total} dead internal link(s) to plain text:`);
    for (const d of deadLinksReport) {
      for (const link of d.links) console.log(`  - ${d.file}: [${link.label}](${link.url})`);
    }
  } else {
    console.log("No dead internal links found.");
  }
  console.log("Wrote sitemap.xml, feed.xml, robots.txt, llms.txt.");
}

main();
