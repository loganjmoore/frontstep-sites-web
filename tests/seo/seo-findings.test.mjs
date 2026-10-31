import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const htmlFiles = (dir) => readdirSync(new URL(`../../${dir}/`, import.meta.url), { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory()
    ? htmlFiles(`${dir}/${entry.name}`)
    : entry.name.endsWith(".html") ? [`${dir}/${entry.name}`] : []);

test("homepage preserves buyer CTA and excludes unrelated query FAQs", () => {
  const html = read("index.html");
  assert.ok((html.match(/href="https:\/\/app\.frontstepsites\.com\/get-started"/g) || []).length >= 1);
  assert.ok((html.match(/Start Launch — \$99\/yr/g) || []).length >= 2);
  assert.match(html, /Next: secure checkout for the \$99\/year Launch plan; after payment, sign in and complete the 10-minute business questionnaire\./);
  assert.doesNotMatch(html, /free streaming site|website for anime|best movie site free|musician website free|What is the best option for/i);
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => JSON.parse(m[1])).filter(v => v["@type"] === "FAQPage");
  assert.equal(blocks.length, 1);
  for (const entry of blocks[0].mainEntity) assert.ok(html.includes(`<summary>${entry.name}</summary>`));
});

test("homepage answers website intent without displacing its buyer journey", () => {
  const home = read("index.html");
  assert.match(home, /href="\/blog\/what-is-a-website-four-parts\/">What a website is<\/a>/);
  assert.match(home, /href="\/blog\/how-to-create-a-small-business-website\/">How a website is created<\/a>/);
  assert.match(home, /href="\/blog\/best-website-builder-three-questions\/">Best website builders, ranked<\/a>/);
  assert.match(home, /<h2 id="website-definition">What is a website\?<\/h2>/);
  assert.match(home, /<h2 id="best-website-creators">Best website creators for a small business, ranked<\/h2>/);
  assert.match(home, /<th>Ranked creator<\/th><th>Published price<\/th><th>Main pro<\/th><th>Main con<\/th>/);
  for (const creator of ["Front Step Sites", "Wix", "Squarespace", "Google Sites"]) {
    assert.match(home, new RegExp(`<li><strong>${creator}:<\\/strong>`));
  }
  assert.ok(home.indexOf('class="shelf"') < home.indexOf('class="creator-guide"'), "the offer shelf must remain ahead of the comparison");
  assert.ok(home.indexOf('class="creator-guide"') < home.indexOf('class="sample-options"'), "the comparison must remain near the top");
  assert.doesNotMatch(home, /class="website-basics"|id="start-h"|id="maker-h"/);
});

test("intent-mismatch articles lead with the requested primary formats", () => {
  const builders = read("blog/best-web-builder-sites-for-a-small-business/index.html");
  assert.match(builders, /<title>Best Web Builder Sites for Small Businesses \(2026\)<\/title>/);
  assert.match(builders, /<h1>Best Web Builder Sites for Small Businesses \(2026\)<\/h1>/);
  assert.ok(builders.indexOf("Best web builder sites, ranked") < builders.indexOf("A website is a collection of linked pages"));
  assert.match(builders, /fit-and-cost comparison, not a hands-on product test/);
  assert.match(builders, /wix\.com, squarespace\.com, workspace\.google\.com, and frontstepsites\.com in October 2026/);
  assert.match(builders, /<strong>Verdict:<\/strong>/);

  const makers = read("blog/website-maker-or-done-for-you-three-year-cost/index.html");
  assert.match(makers, /<h1>Best Website Makers for Small Businesses: 3-Year Cost<\/h1>/);
  assert.match(makers, /Best website makers for a small business, ranked/);
  assert.match(makers, /<strong>Pro:<\/strong>/);
  assert.match(makers, /<strong>Con:<\/strong>/);
  assert.match(makers, /<th>Rank and option<\/th><th>Price checked<\/th><th>Main pro<\/th><th>Main con<\/th>/);
});

test("October 24 acquisition pages match metadata, schema, and cleaning journey requirements", () => {
  const builders = read("blog/best-web-builder-sites-for-a-small-business/index.html");
  const cleaning = read("blog/cleaning-local-seo-checklist/index.html");
  const schemas = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));

  for (const [html, title, canonical] of [
    [builders, "Best Web Builder Sites for Small Businesses (2026)", "https://frontstepsites.com/blog/best-web-builder-sites-for-a-small-business/"],
    [cleaning, "Local SEO for Cleaning Companies: 2026 Checklist", "https://frontstepsites.com/blog/cleaning-local-seo-checklist/"],
  ]) {
    assert.match(html, new RegExp(`<h1>${title.replace(/[()]/g, "\\$&")}<\\/h1>`));
    assert.match(html, new RegExp(`<meta property="og:title" content="${title.replace(/[()]/g, "\\$&")}">`));
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical}">`));
    assert.equal(schemas(html).find(schema => schema["@type"] === "BlogPosting")?.headline, title);
    assert.ok(schemas(html).find(schema => schema["@type"] === "FAQPage")?.mainEntity.length > 0);
  }

  assert.match(cleaning, /See the checklist in a fictional cleaning website/);
  assert.match(cleaning, /href="\/examples\/cleaning\/" aria-label="Open the fictional cleaning website shown"><img/);
  assert.match(cleaning, /recurring care, a detailed reset, and moving-home work/);
  assert.match(cleaning, /sends or saves nothing/);
  assert.match(cleaning, /href="https:\/\/app\.frontstepsites\.com\/get-started">Start your own Front Step Sites website<\/a>/);
});

test("October 24 plumber checklist and homepage price facts stay synchronized", () => {
  const plumbing = read("blog/website-plumbing/index.html");
  const home = read("index.html");
  const schemas = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
  const title = "Plumber Website Checklist and Working Example (2026)";

  assert.match(plumbing, new RegExp(`<title>${title.replace(/[()]/g, "\\$&")}<\\/title>`));
  assert.match(plumbing, new RegExp(`<h1>${title.replace(/[()]/g, "\\$&")}<\\/h1>`));
  assert.match(plumbing, new RegExp(`<meta property="og:title" content="${title.replace(/[()]/g, "\\$&")}">`));
  const posting = schemas(plumbing).find(schema => schema["@type"] === "BlogPosting");
  assert.equal(posting?.headline, title);
  assert.equal(posting?.datePublished, "2026-09-26");
  assert.equal(posting?.dateModified, "2026-10-24");
  assert.match(plumbing, /<meta name="description" content="[^"]*checklist[^"]*fictional working sample[^"]*">/);
  assert.ok(plumbing.indexOf("Walk through a fictional plumber website") > plumbing.indexOf("Short answer"));
  assert.match(plumbing, /Fictional sample: no customer, endorsement, or result is represented/);
  assert.match(plumbing, /href="\/plumber\/\?p=2025550147" aria-label="Open the fictional plumber website with a sample phone number"><img/);
  assert.match(plumbing, /<th>What to inspect<\/th><th>What the sample demonstrates<\/th>/);
  for (const label of ["First screen", "Services", "Service area", "Contact route"]) assert.match(plumbing, new RegExp(`<td>${label}<\\/td>`));
  assert.match(plumbing, /Your task:<\/strong> Confirm that the sample names the service, exposes a phone route when a sample number is supplied, explains the form boundary, and completes a sample inquiry\./);
  assert.match(plumbing, /href="https:\/\/app\.frontstepsites\.com\/get-started">Start my plumber website<\/a>/);
  assert.match(plumbing, /\$99\/year, domain included, no setup fee\./);

  const freshness = "Prices checked October 24, 2026 on wix.com and squarespace.com; annual billing shown; region, currency, taxes, renewal prices, and current terms may differ.";
  assert.ok(home.includes(freshness));
  assert.match(home, /Wix Light at \$17 a month billed yearly \(\$204 a year\) and Squarespace Basic at \$19 a month billed annually \(\$228 a year\), checked October 24, 2026/);
  assert.match(home, /Competitor prices checked October 24, 2026/);
  assert.doesNotMatch(home, /Prices checked Sept|Competitor prices checked September|tooltester\.com/);
  const structured = schemas(home);
  assert.ok(structured.find(schema => schema["@type"] === "Organization"));
  assert.match(structured.find(schema => schema["@type"] === "FAQPage").mainEntity.find(item => item.name === "Is this really cheaper than Wix?").acceptedAnswer.text, /Wix Light at \$17 a month billed yearly \(\$204 a year\) and Squarespace Basic at \$19 a month billed annually \(\$228 a year\)/);
});

test("October 13 ranking and acquisition findings are present in rendered pages", () => {

  const builders = read("blog/website-builders-vs-done-for-you-websites/index.html");
  assert.match(builders, /Best website builders and services for a small local business/);
  assert.match(builders, /What does an AI website builder do\?/);
  assert.match(builders, /website development in HTML and custom code fits/);

  const ranked = read("blog/best-website-builder-three-questions/index.html");
  assert.match(ranked, /<h1>Best Website Builders for Small Businesses, Ranked<\/h1>/);
  assert.match(ranked, /data-website-resource="brief"/);
  assert.ok(ranked.indexOf('data-website-resource="brief"') < ranked.indexOf("AI website builders, ranked for a small business test"));
  assert.match(ranked, /Download website brief/);
  for (const builder of ["Wix AI Website Builder", "Squarespace Blueprint AI", "Base44"]) {
    assert.match(ranked, new RegExp(`<strong>${builder}:<\\/strong>`));
  }
  assert.match(ranked, /<h2 id="best-website-builders-ranked-for-a-small-business">/);
  assert.match(ranked, /<th>Rank and option<\/th><th>Price confirmed in our guides<\/th><th>Main feature<\/th><th>Testing notes<\/th>/);
  assert.match(ranked, /What should you test in an AI website builder\?/);

  const canva = read("blog/can-you-run-a-business-website-on-canva/index.html");
  assert.match(canva, /Canva Websites review: pros, cons, and verdict/);
  assert.match(canva, /<th>Plan and published price<\/th><th>Main pro<\/th><th>Main con<\/th><th>Review verdict<\/th>/);
  assert.match(canva, /Canva Free \(\$0\)/);
  assert.match(canva, /Three example Canva websites to build and review/);
  for (const example of ["Local plumber brochure", "Salon service site", "One-off event site"]) {
    assert.match(canva, new RegExp(`<td>${example}<\\/td>`));
  }
  for (const label of ["Pros:", "Cons:", "Verdict:"]) assert.match(canva, new RegExp(`<strong>${label}<\\/strong>`));

  const html = read("blog/html-website-development-when-custom-code-fits/index.html");
  assert.match(html, /How do you build an HTML website step by step\?/);
});

test("ranking targets retain descriptive inbound links without homepage intent stuffing", () => {
  const renderedBlog = htmlFiles("blog").map(read).join("\n");
  for (const slug of [
    "website-builders-vs-done-for-you-websites",
    "best-web-builder-sites-for-a-small-business",
    "website-maker-or-done-for-you-three-year-cost",
    "can-you-run-a-business-website-on-canva",
    "website-subscription-vs-one-time-website-build",
    "one-page-site-vs-multi-page-website-for-a-business",
  ]) {
    assert.match(renderedBlog, new RegExp(`<a href="/blog/${slug}/">[^<]{5,}</a>`));
  }
});

test("October 13 trade journeys use the shared paid-path copy and factual checklists", () => {
  const tree = read("blog/website-tree-service/index.html");
  assert.match(tree, /data-website-resource="starter"/);
  assert.match(tree, /fictional\/private preview/);
  assert.match(tree, /What a tree service website needs before launch/);
  assert.match(tree, /<th>Page or proof<\/th><th>Business facts the owner supplies<\/th><th>Customer action to test<\/th>/);
  assert.match(tree, /Start Launch — \$99\/yr/);
  assert.equal((tree.match(/Start Launch — \$99\/yr/g) || []).length, 2, "tree page should have one header CTA and one in-content CTA");

  const plumbing = read("blog/plumbing-google-business-profile/index.html");
  assert.match(plumbing, /<title>Google Business Profile for Plumbers: Setup Checklist<\/title>/);
  assert.match(plumbing, /<h1>Google Business Profile for Plumbers: Setup Checklist<\/h1>/);
  assert.match(plumbing, /<h2 id="plumber-google-business-profile-setup-checklist">/);
  assert.match(plumbing, /<th>Setting<\/th><th>What the plumbing business supplies<\/th><th>Public check<\/th>/);
  assert.match(plumbing, /What Google Business Profile category should a plumber use\?/);
  const faq = [...plumbing.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map((match) => JSON.parse(match[1]))
    .find((value) => value["@type"] === "FAQPage");
  assert.ok(faq.mainEntity.some((item) => item.name === "What Google Business Profile category should a plumber use?"));

  for (const path of ["blog/website-tree-service/index.html", "blog/plumbing-google-business-profile/index.html"]) {
    const rendered = read(path);
    assert.match(rendered, /Next: secure checkout for the \$99\/year Launch plan; after payment, sign in and complete the 10-minute business questionnaire\./);
  }
});

test("AI visibility pages carry useful answers and plain product definitions", () => {
  const home = read("index.html");
  const entityDefinition = "Front Step Sites is a done-for-you website service for small businesses";
  assert.match(home, new RegExp(entityDefinition));
  assert.ok(home.indexOf(entityDefinition) < home.indexOf('<div class="shelf"'), "entity definition should precede the homepage offer shelf");
  assert.match(home, /<h2>What we do<\/h2>/);
  assert.match(home, /<h2>What we do not do<\/h2>/);
  for (const href of ["/blog/guides/", "/blog/compare/", "/blog/ai-search/"]) {
    assert.match(home, new RegExp(`href="${href}"`));
  }
  assert.match(home, /Do I need to know HTML or code\?/);
  assert.doesNotMatch(home, /about-me sites/i);

  for (const slug of [
    "best-web-builder-sites-for-a-small-business",
    "website-builders-vs-done-for-you-websites",
    "can-you-run-a-business-website-on-canva",
    "website-maker-or-done-for-you-three-year-cost",
  ]) {
    const html = read(`blog/${slug}/index.html`);
    assert.match(html, /Front Step Sites is a done-for-you website service for small businesses/);
  }

  assert.match(read("blog/website-builders-vs-done-for-you-websites/index.html"), /What is the best AI website builder\?/);
  assert.match(read("blog/can-you-run-a-business-website-on-canva/index.html"), /Can I use Canva for a business website at all\?/);
  assert.match(read("blog/html-website-development-when-custom-code-fits/index.html"), /Front Step Sites is a done-for-you website service for standard small-business sites, not a custom HTML development shop/);
});

test("October 24 product explainer and Canva limits match the verified journeys", () => {
  const explainer = read("blog/what-front-step-sites-does-and-who-its-for/index.html");
  assert.match(explainer, /answer the business questionnaire, review the site we build for your trade, and approve it before publication/);
  assert.match(explainer, /The "Get started" button opens secure checkout for the \$99\/year Launch plan/);
  assert.match(explainer, /href="\/plumber\/">fictional plumbing sample<\/a>/);
  assert.doesNotMatch(explainer, /live this week|shows a sample site|2 business days|same-day|unlimited (?:changes|updates)/i);

  const canva = read("blog/can-you-run-a-business-website-on-canva/index.html");
  assert.match(canva, /<h2 id="canva-websites-limits-to-check-verified-october-24-2026">Canva Websites limits to check \(verified October 24, 2026\)<\/h2>/);
  assert.match(canva, /<div class="table-wrap mobile-wide-table">/);
  for (const fact of [
    "Up to 45 pages",
    "Up to five published sites",
    "Unlimited published sites",
    "Up to five connected domains",
    "Design up to 20, but publish up to 10",
    "Publish up to 20",
  ]) assert.ok(canva.includes(`<td>${fact}</td>`), `missing Canva limit: ${fact}`);

  const faq = [...canva.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map((match) => JSON.parse(match[1]))
    .find((value) => value["@type"] === "FAQPage");
  const question = "Is Canva Websites free, and what are the current limits?";
  const answer = "Canva Free can publish up to five sites on the free my.canva.site domain, with as many as 45 pages per multipage site and up to 10 published sections per page. Eligible paid plans can publish unlimited sites on that free domain, publish up to 20 sections per page, and connect up to five externally purchased domains. Re-check Canva's help pages before publishing because these limits can change.";
  assert.equal(faq.mainEntity.find((item) => item.name === question)?.acceptedAnswer.text, answer);
  assert.match(canva, new RegExp(`<h3[^>]*>${question.replace("?", "\\?")}<\\/h3>\\n<p>${answer.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}<\\/p>`));
  assert.match(canva, /"datePublished":"2026-10-03","dateModified":"2026-10-27"/);
});

test("priority article and hub changes are present in generated HTML", () => {
  const tree = read("blog/tree-service-local-seo-checklist/index.html");
  assert.match(tree, /<title>Tree Service Local SEO Checklist: What to Fix First<\/title>/);
  assert.match(tree, /<meta name="description" content="Check tree service local SEO: accurate business listings, useful service pages, real coverage, honest reviews, contact routes, and matching schema\.">/);
  assert.match(tree, /<link rel="canonical" href="https:\/\/frontstepsites\.com\/blog\/tree-service-local-seo-checklist\/">/);
  assert.match(tree, /<h1>Tree Service Local SEO Checklist: What to Fix First<\/h1>/);
  assert.match(tree, /Tree service local SEO is the work of/);
  assert.doesNotMatch(tree, /Fix tree service local SEO in this order/);
  const priorityList = tree.match(/<h2 id="local-seo-checklist-for-tree-services">[\s\S]*?<ol>([\s\S]*?)<\/ol>/)?.[1] || "";
  assert.equal((priorityList.match(/<li>/g) || []).length, 5);

  for (const href of [
    "/blog/tree-service-google-business-profile/",
    "/blog/tree-service-get-more-reviews/",
    "/blog/website-tree-service/",
    "/blog/nap-consistency-why-your-name-address-and-phone-must-match-everywhere/",
    "/blog/local-business-schema-markup-explained-simply/",
  ]) {
    assert.match(priorityList, new RegExp(`<a href="${href}">`));
  }
  assert.match(tree, /<h2 id="local-seo-checklist-for-tree-services">Local SEO checklist for tree services<\/h2>/);
  assert.match(tree, /<ol>/);
  assert.match(tree, /href="\/blog\/trades\/tree-service\/"/);
  assert.match(tree, /href="\/blog\/tree-service-get-more-reviews\/"/);

  const treeProfile = read("blog/tree-service-google-business-profile/index.html");
  assert.match(treeProfile, /<a href="\/blog\/tree-service-local-seo-checklist\/">local SEO checklist for a tree service<\/a>/);

  const treeCalls = read("blog/tree-service-more-calls-from-google/index.html");
  assert.match(treeCalls, /<a href="\/blog\/tree-service-local-seo-checklist\/">local SEO checklist for tree service companies<\/a>/);

  const domain = read("blog/who-owns-your-domain-name-and-why-it-matters/index.html");
  assert.match(domain, /Domain ownership is the registration right held by the registrant named in the registrar agreement/);
  assert.match(domain, /Who controls the domain: registrant vs\. manager/);

  const guides = read("blog/guides/index.html");
  for (const slug of [
    "how-to-make-a-google-site",
    "website-maker-or-done-for-you-three-year-cost",
    "best-web-builder-sites-for-a-small-business",
  ]) assert.match(guides, new RegExp(`/blog/${slug}/`));

  const blog = read("blog/index.html");
  for (const slug of [
    "tree-service-local-seo-checklist",
    "who-owns-your-domain-name-and-why-it-matters",
    "pest-control-get-more-reviews",
  ]) assert.match(blog, new RegExp(`/blog/${slug}/`));
});

test("October 13 AI strategy changes are present in their citation surfaces", () => {
  const pestReviews = read("blog/pest-control-get-more-reviews/index.html");
  assert.doesNotMatch(pestReviews, /within an hour of the job/);
  assert.match(pestReviews, /Keep the invitation optional and provide a direct review link/);
  assert.match(pestReviews, /<p class="direct-answer">A pest control review request is an optional invitation/);
  assert.match(pestReviews, /<ol>\s*<li><strong>At the completion handoff:<\/strong>/);
  for (const moment of ["At the completion handoff", "After an agreed follow-up visit", "After a recurring-plan renewal"]) {
    assert.match(pestReviews, new RegExp(moment));
  }
  for (const slug of ["pest-control-local-seo-checklist", "pest-control-google-business-profile"]) {
    assert.match(pestReviews, new RegExp(`href="/blog/${slug}/"`));
  }

  const domain = read("blog/who-owns-your-domain-name-and-why-it-matters/index.html");
  assert.match(domain, /How to check who owns your domain right now/);
  assert.match(domain, /<ol>/);
  for (const detail of ["registrar account", "WHOIS or registry lookup", "hosting account separately", "renewal date"]) {
    assert.match(domain, new RegExp(detail, "i"));
  }
  for (const slug of ["how-to-choose-a-domain-name-for-a-small-business", "how-to-move-a-domain-to-a-new-provider"]) {
    assert.match(domain, new RegExp(`href="/blog/${slug}/"`));
  }

  const schema = read("blog/structured-data-for-ai-search-what-small-businesses-need/index.html");
  assert.match(schema, /Which schema types to use and when/);
  for (const type of ["LocalBusiness", "Service", "FAQPage", "BreadcrumbList"]) {
    assert.match(schema, new RegExp(`<td>${type}<\\/td>`));
  }
  assert.match(schema, /Schema does not guarantee rich results or AI citations/);
  assert.match(schema, /href="\/blog\/local-business-schema-markup-explained-simply\/"/);

  const clickToCallHref = /href="\/blog\/click-to-call-making-your-phone-number-work-on-every-page\/"/;
  assert.match(read("blog/contact-forms-that-actually-get-filled-out/index.html"), clickToCallHref);
  for (const hub of ["plumbing", "tree-service", "hvac"]) {
    assert.match(read(`blog/trades/${hub}/index.html`), clickToCallHref);
  }
});

test("October 16 AI strategy changes are present in all six requested pages", () => {
  const tree = read("blog/tree-service-local-seo-checklist/index.html");
  assert.match(tree, /<title>Tree Service Local SEO Checklist: What to Fix First<\/title>/);
  assert.match(tree, /<h1>Tree Service Local SEO Checklist: What to Fix First<\/h1>/);
  const treePriority = tree.split('<h2 id="what-to-fix-first-in-order">')[1].split('<h2 id="local-seo-checklist-for-tree-services">')[0];
  assert.match(treePriority, /<ol>/);
  const treePrioritySlugs = [
    "tree-service-google-business-profile",
    "nap-consistency-why-your-name-address-and-phone-must-match-everywhere",
    "website-tree-service",
    "tree-service-get-more-reviews",
  ];
  for (const slug of treePrioritySlugs) {
    assert.match(treePriority, new RegExp(`href="/blog/${slug}/"`));
  }
  const treePriorityPositions = treePrioritySlugs.map((slug) => treePriority.indexOf(`/blog/${slug}/`));
  assert.deepEqual(treePriorityPositions, [...treePriorityPositions].sort((a, b) => a - b));

  const domain = read("blog/who-owns-your-domain-name-and-why-it-matters/index.html");
  const ownershipCheck = domain.split('<h2 id="how-to-check-who-owns-your-domain-right-now">')[1].split('<h2 id="who-controls-the-domain-registrant-vs-manager">')[0];
  assert.match(ownershipCheck, /WHOIS or registry lookup/);
  assert.match(ownershipCheck, /registrar account/);
  assert.match(ownershipCheck, /hosting account separately, along with DNS records/);
  for (const slug of ["how-to-move-a-domain-to-a-new-provider", "how-to-choose-a-domain-name-for-a-small-business"]) {
    assert.match(ownershipCheck, new RegExp(`href="/blog/${slug}/"`));
  }

  const googleSite = read("blog/how-to-make-a-google-site/index.html");
  assert.match(googleSite, /<p class="direct-answer">Google Sites is a website builder from Google for making simple pages\. It fits someone who needs a small brochure or information site/);
  const optionFit = googleSite.split('<h2 id="which-option-fits-you">')[1].split('<h2 id="how-do-you-make-a-google-site">')[0];
  assert.match(optionFit, /<table>/);
  for (const slug of ["google-sites-alternatives-for-a-business", "put-a-google-sites-site-on-your-own-domain"]) {
    assert.match(optionFit, new RegExp(`href="/blog/${slug}/"`));
  }

  const schema = read("blog/structured-data-for-ai-search-what-small-businesses-need/index.html");
  assert.match(schema, /<th>Schema type<\/th><th>When to use it<\/th><th>Example<\/th>/);
  for (const type of ["LocalBusiness", "Service", "FAQPage", "BreadcrumbList"]) {
    assert.match(schema, new RegExp(`<td>${type}<\\/td>`));
  }
  assert.match(schema, /href="\/blog\/local-business-schema-markup-explained-simply\/"/);

  const pest = read("blog/pest-control-get-more-reviews/index.html");
  assert.match(pest, /<h2 id="what-to-ask-for-in-a-pest-control-review">What to ask for in a pest control review<\/h2>/);
  const reviewDetails = pest.split('<h2 id="what-to-ask-for-in-a-pest-control-review">')[1].split('<h2 id="choose-a-milestone-that-matches-the-service">')[0];
  for (const detail of ["Service type", "Timeliness"]) assert.match(reviewDetails, new RegExp(detail));
  assert.doesNotMatch(reviewDetails, /technician[’']?s? name|name.*technician/i);
  assert.match(pest, /Do not ask the customer to name the pest, treatment, address, or technician to improve your marketing/);
  for (const slug of ["how-to-get-customers-to-leave-reviews-on-google-without-being-pushy", "how-to-reply-to-a-bad-review"]) {
    assert.match(pest, new RegExp(`href="/blog/${slug}/"`));
  }

  const phone = read("blog/click-to-call-making-your-phone-number-work-on-every-page/index.html");
  assert.match(phone, /<h2 id="test-your-click-to-call-in-60-seconds">Test your click-to-call in 60 seconds<\/h2>/);
  const phoneTest = phone.split('<h2 id="test-your-click-to-call-in-60-seconds">')[1].split("<table>")[0];
  assert.match(phoneTest, /<ol>/);
  for (const detail of ["Open the page on a phone", "Open the page on a desktop", "tel:", "Google Business Profile"]) {
    assert.match(phoneTest, new RegExp(detail));
  }
  assert.match(phoneTest, /href="\/blog\/nap-consistency-why-your-name-address-and-phone-must-match-everywhere\/"/);

  const builders = read("blog/website-builders-vs-done-for-you-websites/index.html");
  const doneForYouScope = builders.split('<h2 id="what-this-done-for-you-plan-covers-beyond-a-builder">')[1].split('<h2 id="what-does-an-ai-website-builder-do">')[0];
  assert.match(doneForYouScope, /\$99 a year/);
  for (const detail of ["Domain:", "Hosting:", "Updates:", "Content edits:"]) {
    assert.match(doneForYouScope, new RegExp(`<strong>${detail}<\\/strong>`));
  }
  assert.match(doneForYouScope, /href="\/blog\/website-hosting-and-maintenance-what-99-covers\/"/);
});

test("October 21 acquisition changes are present in the first relevant block", () => {
  const tree = read("blog/tree-service-local-seo-checklist/index.html");
  const treePriority = tree.split('<h2 id="what-to-fix-first-in-order">What to fix first, in order</h2>')[1]
    .split('<h2 id="local-seo-checklist-for-tree-services">')[0];
  assert.equal((treePriority.match(/<li>/g) || []).length, 4);
  for (const slug of ["tree-service-google-business-profile", "website-tree-service"]) {
    assert.equal((treePriority.match(new RegExp(`href="/blog/${slug}/"`, "g")) || []).length, 1);
  }

  const googleSite = read("blog/how-to-make-a-google-site/index.html");
  const optionFit = googleSite.split('<h2 id="which-option-fits-you">Which option fits you</h2>')[1]
    .split('<h2 id="how-do-you-make-a-google-site">')[0];
  assert.match(optionFit, /<th>Option<\/th><th>Best fit<\/th>/);
  assert.match(optionFit, /<td>Google Sites<\/td>/);
  assert.match(optionFit, /<td>Done-for-you build<\/td>/);
  for (const slug of ["google-sites-alternatives-for-a-business", "put-a-google-sites-site-on-your-own-domain"]) {
    assert.equal((optionFit.match(new RegExp(`href="/blog/${slug}/"`, "g")) || []).length, 1);
  }

  const domain = read("blog/who-owns-your-domain-name-and-why-it-matters/index.html");
  const domainOpening = domain.split("</aside>")[1].split('<h2 id="how-to-check-who-owns-your-domain-right-now">')[0];
  assert.match(domainOpening, /If a web designer registers a domain for you, the person or business named as the registrant holds the registration rights\./);
  for (const slug of ["how-to-leave-a-web-designer-and-keep-your-domain-and-site", "how-to-move-a-domain-to-a-new-provider"]) {
    assert.equal((domainOpening.match(new RegExp(`href="/blog/${slug}/"`, "g")) || []).length, 1);
  }

  const pest = read("blog/pest-control-get-more-reviews/index.html");
  const requestOrder = pest.split('<h2 id="where-to-ask-in-order">Where to ask, in order</h2>')[1]
    .split('<h2 id="what-to-ask-for-in-a-pest-control-review">')[0];
  assert.match(requestOrder, /<ol>/);
  for (const moment of ["At the completion handoff", "After an agreed follow-up visit", "After a recurring-plan renewal"]) {
    assert.match(requestOrder, new RegExp(moment));
  }
  assert.equal((requestOrder.match(/href="\/blog\/how-to-get-customers-to-leave-reviews-on-google-without-being-pushy\/"/g) || []).length, 1);

  const home = read("index.html");
  const homeOpening = home.split('<section class="hero"')[1].split('<div class="shelf"')[0];
  assert.match(homeOpening, /Front Step Sites is a done-for-you website service for small businesses in the United States/);
  assert.match(homeOpening, /build, host, and maintain your site on the \$99\/yr Launch plan, with a domain included/);
  for (const slug of ["what-front-step-sites-does-and-who-its-for", "website-hosting-and-maintenance-what-99-covers"]) {
    assert.equal((home.match(new RegExp(`href="/blog/${slug}/"`, "g")) || []).length, 1);
    assert.match(homeOpening, new RegExp(`href="/blog/${slug}/"`));
  }
});

test("October 20 trade website example links into the tree-service cluster", () => {
  const example = read("blog/trade-website-example-tree-service-five-sections/index.html");
  const orderedSections = [
    ["1", "Hero", "Call or request an assessment"],
    ["2", "Services", "Open the relevant service detail"],
    ["3", "Proof", "Review a real project or credential"],
    ["4", "Service area", "Confirm the town and access details"],
    ["5", "Contact", "Submit a short request or call"],
  ];
  let previousSectionPosition = -1;
  for (const [position, section, action] of orderedSections) {
    const rowStart = `<tr><td>${position}</td><td>${section}</td>`;
    const sectionPosition = example.indexOf(rowStart);
    assert.ok(sectionPosition > previousSectionPosition);
    assert.match(example.slice(sectionPosition), new RegExp(`^${rowStart}<td>[^<]+<\\/td><td>${action}<\\/td><\\/tr>`));
    previousSectionPosition = sectionPosition;
  }
  for (const slug of [
    "website-tree-service",
    "tree-service-local-seo-checklist",
    "tree-service-google-business-profile",
  ]) {
    assert.match(example, new RegExp(`href="/blog/${slug}/"`));
  }
});

test("October 21 moving and locksmith AI strategy changes are present", () => {
  const moving = read("blog/moving-company-local-seo-checklist/index.html");
  assert.match(moving, /<title>Moving Company Local SEO Checklist: What to Fix First<\/title>/);
  assert.match(moving, /<meta name="description" content="Use this moving company local SEO checklist to verify your Google profile, mover credentials, service areas, quote path, and review process in priority order\.">/);
  assert.match(moving, /<link rel="canonical" href="https:\/\/frontstepsites\.com\/blog\/moving-company-local-seo-checklist\/">/);
  assert.match(moving, /<h1>Moving Company Local SEO Checklist: What to Fix First<\/h1>/);
  assert.match(moving, /"datePublished":"2026-10-01","dateModified":"2026-10-21"/);
  assert.match(moving, /Fix the public facts and quote path first: correct the Google Business Profile and contact details, verify mover or broker credentials when they apply, separate the moving services customers can actually book, describe real coverage, test the mobile quote path, and request neutral reviews after completed work\./);
  assert.match(moving, /<h2 id="what-to-fix-first">What to fix first<\/h2>/);
  assert.match(moving, /class="table-wrap mobile-wide-table readable-table" role="region" aria-label="Moving company local SEO priority checklist" tabindex="0"/);
  assert.match(moving, /<th>Priority<\/th><th>Evidence to collect<\/th><th>Pass condition<\/th><th>Next action<\/th>/);
  for (const priority of [
    "Business identity and profile",
    "Applicable FMCSA status",
    "Service and coverage pages",
    "Mobile quote path",
    "Review process",
  ]) assert.match(moving, new RegExp("<td>" + priority + "<\\/td>"));
  assert.match(moving, /Requirements depend on the operation and jurisdiction/);
  assert.doesNotMatch(moving, /9,430|97%|one profile per business for its whole service area|page for every city or zip|review request a day or two later/i);

  const locksmith = read("blog/locksmith-local-seo-checklist/index.html");
  assert.match(locksmith, /<title>Locksmith Local SEO Checklist: What to Verify First<\/title>/);
  assert.match(locksmith, /<meta name="description" content="Check locksmith local SEO with verified licensing, real dispatch hours, accurate service areas, service pages, tested call links, and neutral review requests\.">/);
  assert.match(locksmith, /<link rel="canonical" href="https:\/\/frontstepsites\.com\/blog\/locksmith-local-seo-checklist\/">/);
  assert.match(locksmith, /<h1>Locksmith Local SEO Checklist: What to Verify First<\/h1>/);
  assert.match(locksmith, /"datePublished":"2026-10-02","dateModified":"2026-10-21"/);
  assert.match(locksmith, /Verify trust and emergency-service facts before adding more pages: publish licensing only when current and applicable, make advertised hours match the real call and dispatch path, name only areas and locksmith services the business can serve, test the mobile phone route, and invite every eligible customer to leave an honest review without steering the rating\./);
  assert.match(locksmith, /<h2 id="what-to-verify-before-you-advertise-emergency-locksmith-service">What to verify before you advertise emergency locksmith service<\/h2>/);
  assert.match(locksmith, /class="table-wrap mobile-wide-table readable-table" role="region" aria-label="Emergency locksmith claim verification checklist" tabindex="0"/);
  assert.match(locksmith, /<th>Claim<\/th><th>Evidence to verify<\/th><th>Safer wording until verified<\/th>/);
  for (const claim of [
    "License or registration",
    "24/7 availability",
    "Response time",
    "Service area",
    "Residential, automotive, or commercial scope",
  ]) assert.match(locksmith, new RegExp("<td>" + claim.replace("/", "\\/") + "<\\/td>"));
  assert.match(locksmith, /Licensing requirements vary by state and locality/);
  assert.match(locksmith, /same neutral invitation to every eligible customer after a completed job/);
  assert.doesNotMatch(locksmith, /13 states|over 70%|4\.5-star|40 reviews|new 5-star reviews|satisfied customer/i);
});

test("October 21 restaurant review routine and locksmith description findings are resolved", () => {
  const restaurant = read("blog/restaurant-get-more-reviews/index.html");
  assert.match(restaurant, /<title>How Restaurants Can Get More Google Reviews<\/title>/);
  assert.match(restaurant, /<meta name="description" content="A policy-safe restaurant review routine for dine-in, takeout, and catering, with Google review links, QR codes, request wording, and reply steps\.">/);
  assert.match(restaurant, /<link rel="canonical" href="https:\/\/frontstepsites\.com\/blog\/restaurant-get-more-reviews\/">/);
  assert.match(restaurant, /<h1>How Restaurants Can Get More Google Reviews<\/h1>/);
  assert.match(restaurant, /"datePublished":"2026-09-26","dateModified":"2026-10-21"/);
  assert.match(restaurant, /<aside class="tag-box"><span class="label">Short answer<\/span><p>Invite restaurant guests to leave an honest Google review after they have experienced the meal and service\./);
  for (const preservedText of [
    "<strong>Read reviews</strong>",
    "<strong>Get more reviews</strong>",
    "Google prohibits incentives for reviews and selectively requesting positive reviews",
    "<th>Channel</th><th>Timing and neutral sample wording</th><th>Failure check</th>",
    "Can a restaurant put a Google review QR code on receipts?",
    "Can we offer a free appetizer for any honest review?",
    "Should servers ask guests to mention their names?",
    "Can we ask takeout customers as well as dine-in guests?",
  ]) assert.match(restaurant, new RegExp(preservedText.replace(/[?]/g, "\\?")));

  const channelTableEnd = restaurant.indexOf("</table></div>") + "</table></div>".length;
  const routineHeading = '<h2 id="put-the-review-routine-into-place-in-one-shift">Put the review routine into place in one shift</h2>';
  const routineStart = restaurant.indexOf(routineHeading);
  assert.equal(restaurant.slice(channelTableEnd, routineStart).trim(), "");
  const routineEnd = restaurant.indexOf("</table></div>", routineStart) + "</table></div>".length;
  const routine = restaurant.slice(routineStart, routineEnd);
  assert.match(routine, /class="table-wrap mobile-wide-table readable-table" role="region" aria-label="Restaurant review channels and shift routine" tabindex="0"/);
  assert.match(routine, /<th>When<\/th><th>Owner<\/th><th>Action<\/th><th>Pass check<\/th>/);
  assert.equal((routine.match(/<tr>/g) || []).length - 1, 6);
  for (const timing of ["Before rollout", "Before service", "Before the shift", "After the completed experience", "After a complaint", "Weekly"]) {
    assert.match(routine, new RegExp(`<td>${timing}<\\/td>`));
  }
  for (const detail of [
    "signed-out phone",
    "no incentives, satisfaction screening, or requested rating",
    "review QR code is not mixed with menu or payment actions",
    "guest can decline without friction",
    "Do not ask for a review change or expose booking or order details",
    "pickup-information problems are assigned for correction",
  ]) assert.match(routine, new RegExp(detail));
  assert.match(restaurant.slice(routineEnd), /^\n<p><a href="\/assets\/restaurant-review-routine\.csv">Download the restaurant review routine CSV<\/a><\/p>/);
  assert.match(restaurant, /Start Launch \u2014 \$99\/yr/);

  const csv = read("assets/restaurant-review-routine.csv").trim().split(/\r?\n/);
  assert.equal(csv[0], "When,Owner,Action,Pass check");
  assert.equal(csv.length - 1, 6);

  const locksmith = read("blog/locksmith-local-seo-checklist/index.html");
  const description = locksmith.match(/<meta name="description" content="([^"]+)">/)?.[1] || "";
  assert.equal(description, "Check locksmith local SEO with verified licensing, real dispatch hours, accurate service areas, service pages, tested call links, and neutral review requests.");
  assert.ok(description.length < 160, `locksmith meta description is ${description.length} characters`);
});

test("intent-mismatch articles lead with the requested formats", () => {
  for (const slug of [
    "website-builders-vs-done-for-you-websites",
    "best-web-builder-sites-for-a-small-business",
  ]) {
    const html = read(`blog/${slug}/index.html`);
    assert.match(html, /data-website-resource="(?:starter|brief)"/);
    assert.match(html, /src="\/assets\/website-resources.mjs"/);
    assert.match(html, /<ol>/);
    assert.match(html, /<table>/);
  }

  const builderHub = read("blog/best-web-builder-sites-for-a-small-business/index.html");
  assert.match(builderHub, /<th>Option<\/th><th>Annual cost and billing<\/th><th>Who makes edits<\/th><th>Fits best<\/th><th>Limits to check<\/th>/);
  for (const option of ["Wix", "Squarespace", "Google Sites", "Front Step Sites"]) {
    assert.match(builderHub, new RegExp(`<td>${option}<\\/td>`));
  }

  for (const slug of [
    "website-maker-or-done-for-you-three-year-cost",
    "website-subscription-vs-one-time-website-build",
    "auto-repair-facebook-vs-website",
  ]) assert.match(read(`blog/${slug}/index.html`), /<table>/);

  for (const slug of [
    "best-website-builder-three-questions",
    "website-maker-or-done-for-you-three-year-cost",
  ]) {
    assert.match(
      read(`blog/${slug}/index.html`),
      /href="\/blog\/best-web-builder-sites-for-a-small-business\/"/,
      `${slug} should link to the builder comparison hub`,
    );
  }

  const home = read("index.html");
  assert.match(home, /href="\/blog\/what-is-a-website-four-parts\/">What a website is<\/a>/);
  assert.match(home, /href="\/blog\/how-to-create-a-small-business-website\/">How a website is created<\/a>/);
  assert.match(home, /href="\/blog\/best-website-builder-three-questions\/">Best website builders, ranked<\/a>/);
});

test("resource tools retain useful plans and safe output instead of the old planning-only demo", async () => {
  const { aiWebsiteBrief } = await import('../../assets/website-resources.mjs');
  const brief = JSON.parse(aiWebsiteBrief({ businessName:'Tree <img src=x onerror=alert(1)> service', trade:'Tree service', city:'Tulsa',state:'OK',contact:'202-555-0123',services:'Pruning' }));
  assert.equal(brief.pagePlan.length,4);
  assert.match(brief.pagePlan[0], /Homepage/);
  const module = read('assets/website-resources.mjs');
  assert.match(module, /code.textContent = content/);
  assert.doesNotMatch(module, /output.innerHTML/);
  assert.match(read('blog/website-builders-vs-done-for-you-websites/index.html'), /Download website brief/);
});

test("flagged articles define their subject near the top", () => {
  const definitions = {
    "best-website-builder-three-questions": "A website builder is a service",
    "what-is-a-website-four-parts": "A website is a collection",
    "html-website-development-when-custom-code-fits": "HTML website development is the work",
  };
  for (const [slug, definition] of Object.entries(definitions)) {
    const html = read(`blog/${slug}/index.html`);
    assert.match(html, new RegExp(`<h1>[^<]+<\\/h1>\\n<p class="direct-answer">${definition}`));
  }

  const tree = read("blog/tree-service-local-seo-checklist/index.html");
  assert.match(tree, /Tree service local SEO is the work of/);

  const pest = read("blog/pest-control-get-more-reviews/index.html");
  assert.match(pest, /A pest control review request is an optional invitation/);

  const onePage = read("blog/one-page-site-vs-multi-page-website-for-a-business/index.html");
  assert.match(onePage, /<h1>[^<]+<\/h1>\n<p class="direct-answer">A one-page site is a website/);

  const mistakes = read("blog/seven-web-site-mistakes-that-make-customers-hesitate/index.html");
  assert.match(mistakes, /<h1>[^<]+<\/h1>\n<p class="direct-answer">A web site mistake is a problem/);

  const googleSites = read("blog/google-sites-launch-checklist-for-a-business-website/index.html");
  assert.match(googleSites, /<h1>[^<]+<\/h1>\n<p class="direct-answer">A Google Sites launch checklist is a pre-publication check/);

  const customDomain = read("blog/put-a-google-sites-site-on-your-own-domain/index.html");
  assert.match(customDomain, /<h1>[^<]+<\/h1>\n<p class="direct-answer">A Google Sites custom domain is a business-controlled web address/);

  const websiteMaker = read("blog/what-a-website-maker-does-12-task-example/index.html");
  assert.match(websiteMaker, /<h1>[^<]+<\/h1>\n<p class="direct-answer">A website maker is a tool, person, or service/);

  const brainpop = read("blog/is-brainpop-a-website-guide/index.html");
  assert.match(brainpop, /<h1>[^<]+<\/h1>\n<p class="direct-answer">BrainPOP is an educational website and web application/);
});

test("HTML website development guide is a hands-on tutorial", () => {
  const html = read("blog/html-website-development-when-custom-code-fits/index.html");
  assert.match(html, /<h2 id="how-do-you-build-an-html-website-step-by-step">/);
  assert.match(html, /<ol>\s*<li>Create a project folder and an index.html file.<\/li>/);
  assert.match(html, /<h2 id="step-1-create-the-project-files">/);
  assert.match(html, /<code class="language-html">&lt;!doctype html&gt;/);
  assert.match(html, /<h2 id="step-6-publish-the-html-files">/);
  assert.match(html, /<h2 id="when-does-custom-html-fit-a-small-business">/);

  const definition = read("blog/what-is-a-website-four-parts/index.html");
  assert.match(definition, /href="\/blog\/html-website-development-when-custom-code-fits\/">step-by-step HTML website development tutorial<\/a>/);
});

test("October 23 acquisition answers put the requested actions in order", () => {
  const pest = read("blog/pest-control-local-seo-checklist/index.html");
  const pestPriority = pest.split('<h2 id="what-to-fix-first">What to fix first</h2>')[1]
    .split('<h2 id="confirm-the-business-facts-customers-see">')[0];
  assert.equal((pestPriority.match(/<li>/g) || []).length, 6);
  assert.equal((pestPriority.match(/href="\/blog\/pest-control-google-business-profile\/"/g) || []).length, 1);
  for (const step of ["Correct the business name", "Give each important pest", "Check that coverage pages", "Test calls and inspection requests", "Add genuine work photos", "Measure suitable inquiries"]) {
    assert.match(pestPriority, new RegExp(step));
  }

  const tree = read("blog/tree-service-get-more-reviews/index.html");
  const treePriority = tree.split('<h2 id="what-to-do-first-in-order">What to do first, in order</h2>')[1]
    .split('<h2 id="define-completion-before-you-ask-for-feedback">')[0];
  assert.equal((treePriority.match(/<li>/g) || []).length, 6);
  assert.equal((treePriority.match(/href="\/blog\/tree-service-local-seo-checklist\/"/g) || []).length, 1);
  for (const step of ["Confirm the agreed removal", "Resolve or clearly record", "Find and test the direct review link", "Send the same short, optional request", "Record that the request was sent", "Review repeated customer questions"]) {
    assert.match(treePriority, new RegExp(step));
  }
});

test("citability pages put plain subject definitions in extractable article text", () => {
  const definitions = {
    "tree-service-local-seo-checklist": "Tree service local SEO is the work of",
    "pest-control-get-more-reviews": "A pest control review request is an optional invitation",
    "what-to-put-in-your-website-footer": "A website footer is the section at the bottom of a site",
    "seasonal-marketing-for-local-service-businesses": "Seasonal marketing is the practice of",
    "how-to-get-customers-to-leave-reviews-on-google-without-being-pushy": "A Google review request is an optional invitation",
    "what-makes-a-local-business-website-trustworthy": "A trustworthy local business website is a site",
    "how-to-handle-leads-from-your-website-fast": "Website lead handling is the process of",
    "should-your-business-use-a-com": "A .com is a top-level domain ending",
    "how-to-switch-website-providers-without-losing-google-rankings": "A website provider switch is the move",
    "how-to-create-a-small-business-website": "A small business website is a set of pages",
    "google-sites-launch-checklist-for-a-business-website": "A Google Sites launch checklist is a pre-publication check",
    "seven-web-site-mistakes-that-make-customers-hesitate": "A web site mistake is a problem",
    "website-subscription-vs-one-time-website-build": "A website subscription is an ongoing service",
    "is-a-99-website-worth-it": "A $99 website is a low-cost website offer",
    "what-to-ask-before-you-hire-someone-to-build-your-website": "A web builder is a person, company, or tool",
    "google-sites-alternatives-for-a-business": "Google Sites is a free website builder",
    "can-you-run-a-business-website-on-canva": "Canva Websites is a page builder inside Canva",
    "one-page-site-vs-multi-page-website-for-a-business": "A one-page site is a website",
    "faq-pages-that-answer-customers-and-ai-search": "An FAQ page is a collection of direct answers",
    "why-consistent-business-information-matters-for-ai-answers": "Consistent business information is the same accurate",
    "writing-website-content-ai-assistants-can-quote": "Website content for AI assistants is public page copy",
    "structured-data-for-ai-search-what-small-businesses-need": "Structured data is machine-readable markup",
    "how-reviews-influence-ai-recommendations-of-local-businesses": "A local business review is a customer's public account",
    "voice-search-for-local-businesses-what-still-matters": "Voice search is the use of a spoken request",
    "what-llms-txt-is-and-whether-a-small-business-needs-one": "An llms.txt file is an optional reading guide",
    "how-to-check-what-ai-assistants-say-about-your-business": "An AI-assistant business check is a repeatable review",
  };

  const bodyDefinitions = new Set([
    "what-to-put-in-your-website-footer",
    "seasonal-marketing-for-local-service-businesses",
    "how-to-get-customers-to-leave-reviews-on-google-without-being-pushy",
    "what-makes-a-local-business-website-trustworthy",
    "how-to-handle-leads-from-your-website-fast",
    "should-your-business-use-a-com",
    "how-to-switch-website-providers-without-losing-google-rankings",
    "is-a-99-website-worth-it",
    "what-to-ask-before-you-hire-someone-to-build-your-website",
    "faq-pages-that-answer-customers-and-ai-search",
    "why-consistent-business-information-matters-for-ai-answers",
    "writing-website-content-ai-assistants-can-quote",
    "structured-data-for-ai-search-what-small-businesses-need",
    "how-reviews-influence-ai-recommendations-of-local-businesses",
    "voice-search-for-local-businesses-what-still-matters",
    "what-llms-txt-is-and-whether-a-small-business-needs-one",
    "how-to-check-what-ai-assistants-say-about-your-business",
  ]);

  assert.equal(Object.keys(definitions).length, 26);
  assert.equal(new Set(Object.values(definitions)).size, 26);
  assert.equal(bodyDefinitions.size, 17);
  for (const [slug, definition] of Object.entries(definitions)) {
    const html = read("blog/" + slug + "/index.html");
    assert.ok(
      html.includes(bodyDefinitions.has(slug)
        ? "</aside>\n<p>" + definition
        : "</h1>\n<p class=\"direct-answer\">" + definition),
      slug + " should define its subject near the top in the intended content region",
    );
  }
});

test("cleaning Business Profile guide includes current constraints and the worked example", () => {
  const html = read("blog/cleaning-google-business-profile/index.html");
  const title = "Cleaning Company Google Business Profile Checklist (2026)";
  const h1 = "Google Business Profile for Cleaning Companies: Setup Checklist (2026)";
  assert.ok(title.length <= 60);
  assert.match(html, new RegExp(`<title>${title.replace(/[()]/g, "\\$&")}<\\/title>`));
  assert.match(html, new RegExp(`<h1>${h1.replace(/[()]/g, "\\$&")}<\\/h1>`));
  const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1] || "";
  assert.ok(description.length < 160);
  for (const phrase of ["service-area setup", "verification", "categories", "services", "photos", "estimate route"]) assert.ok(description.includes(phrase));
  assert.match(html, /<p class="direct-answer">A cleaning company that visits customers should keep one Google Business Profile for its whole service area and hide the address/);
  assert.match(html, /<h2 id="cleaning-company-profile-setup-checklist">Cleaning company profile setup checklist<\/h2>/);
  const checklist = html.split('<h2 id="cleaning-company-profile-setup-checklist">')[1].split("Source note:")[0];
  for (const phrase of ["up to 20 cities", "not a radius", "two hours", "up to 48 hours", "phone or text", "email", "video", "mail"]) assert.ok(checklist.includes(phrase));
  assert.match(html, /support\.google\.com<\/a>, including its linked service-area, verification, and photo guidance, was rechecked on October 31, 2026/);
  assert.ok(html.indexOf('class="cleaning-example"') > html.indexOf("Source note:"));
  assert.ok(html.indexOf('class="cleaning-example"') < html.indexOf('id="establish-the-correct-business-and-location"'));
  assert.match(html, /<link rel="canonical" href="https:\/\/frontstepsites\.com\/blog\/cleaning-google-business-profile\/">/);
  assert.match(html, /href="https:\/\/app\.frontstepsites\.com\/get-started"/);
  assert.match(html, /"datePublished":"2026-09-26","dateModified":"2026-10-31"/);
  const faq = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map((match) => JSON.parse(match[1]))
    .find((value) => value["@type"] === "FAQPage");
  assert.equal(faq.mainEntity.length, 4);
  assert.match(read("sitemap.xml"), /https:\/\/frontstepsites\.com\/blog\/cleaning-google-business-profile\/<\/loc><lastmod>2026-10-31/);
});

test("October 10 entity-definition findings use unique plain definitions immediately after the H1", () => {
  const definitions = {
    "how-to-make-a-google-site": "Google Sites is a website builder from Google for making simple pages. It fits someone who needs a small brochure or information site and is comfortable handling the content and updates.",
    "best-web-builder-sites-for-a-small-business": "Wix fits owners who want flexible page control, Squarespace fits owners who prefer structured templates, and Google Sites fits a few simple pages. Front Step Sites is a done-for-you service, not a self-serve builder, for owners who want someone else to build and update the site.",
    "click-to-call-making-your-phone-number-work-on-every-page": "Click-to-call is a phone link that opens a calling option on a supported device, and its HTML destination uses the tel:+12025550147 format.",
    "contact-forms-that-actually-get-filled-out": "A contact form is a set of website fields that lets a visitor send an inquiry to a business.",
    "how-to-write-an-about-page-for-a-local-business": "An About page is the part of a local business website that explains who runs the business, what it does, where it works, and what customers can expect.",
    "should-you-put-prices-on-your-website": "Website pricing is the fixed amount, realistic range, or estimate process a business publishes to help customers understand what a service may cost.",
    "how-to-take-photos-for-your-business-website-with-a-phone": "A business website photo is an image that shows customers the real people, work, place, or results behind a service.",
    "service-area-pages-when-they-help-and-when-they-hurt": "A service area page is a website page that explains how a business provides a specific service in a town or area it genuinely covers.",
    "nap-consistency-why-your-name-address-and-phone-must-match-everywhere": "NAP consistency is the use of accurate, recognizable business name, address, and phone information across a website and business listings.",
    "local-business-schema-markup-explained-simply": "Local business schema markup is structured website data that labels details such as a business name, phone number, location, and opening hours for search engines.",
    "how-to-set-up-google-search-console-for-a-small-business": "Google Search Console is a free Google service that reports how a verified website appears and performs in Google Search.",
    "how-to-tell-if-your-website-is-getting-you-customers": "Website customer measurement is the process of connecting calls, forms, and search visits with suitable inquiries and completed work.",
    "bing-places-and-apple-business-connect-the-listings-most-businesses-sk": "Bing Places and Apple Business Connect are services businesses use to manage details that may appear across Bing and Apple products.",
    "yelp-nextdoor-and-angi-which-listings-are-worth-your-time": "Yelp, Nextdoor, and Angi are online services where customers may find, discuss, or contact local businesses.",
    "how-to-reply-to-a-bad-review": "A bad-review reply is a short public response that acknowledges a concern without exposing customer details or arguing about the complaint.",
    "blogging-for-local-businesses-does-it-still-work": "Local business blogging is the practice of publishing useful answers to customer questions that relate to the services the business actually provides.",
    "how-to-write-a-service-page-that-ranks-and-converts": "A service page is a website page that explains one service, where it is available, what the work involves, and how a customer can request it.",
    "website-accessibility-basics-for-small-businesses": "Website accessibility is the practice of making website information and controls usable by people with disabilities.",
    "does-a-small-business-website-need-a-privacy-policy": "A website privacy policy is a statement explaining what personal information a site collects, how it uses that information, and which services receive it.",
    "how-to-get-your-business-on-google-maps": "A Google Business Profile is the business listing an eligible company can claim or create to manage information shown on Google Maps and Search.",
    "what-to-do-when-your-google-business-profile-gets-suspended": "A suspended Google Business Profile is a listing whose content or management access Google has restricted after a policy or eligibility review.",
    "keywords-for-local-businesses-how-customers-actually-search": "Local business keywords are the words customers use to name a service, describe a problem, or specify the area where they need help.",
    "what-a-website-redesign-should-cost-and-when-you-need-one": "A website redesign is a substantial change to a site's structure, content, or presentation made to solve a defined business or customer problem.",
    "emergency-service-businesses-how-to-show-you-re-open-now": "Emergency-service availability is a business's accurate statement of when urgent calls are answered, which jobs are handled, and where service is offered.",
    "how-to-add-a-google-map-to-your-website-the-right-way": "A website map is a linked or embedded map that helps customers locate a public business address or understand where service is available.",
  };

  assert.equal(new Set(Object.values(definitions)).size, 25);
  for (const [slug, definition] of Object.entries(definitions)) {
    const html = read(`blog/${slug}/index.html`);
    assert.ok(
      html.includes(`</h1>\n<p class="direct-answer">${definition}</p>`),
      `${slug} should define its subject immediately after the H1`,
    );
  }
});

test("homepage keeps third-party assets out of the initial rendering path", () => {
  const home = read("index.html");
  assert.match(home, /setTimeout\(s,8000\)/);
  assert.match(home, /display=optional/);
  assert.match(home, /rel="stylesheet" media="print" onload="this\.media='all'"/);
  assert.doesNotMatch(home, /display=swap/);
  assert.doesNotMatch(home, /<img\b/);
});

test("Google Sites next steps link from the matching publishing and domain instructions", () => {
  const html = read("blog/how-to-make-a-google-site/index.html");
  const publish = html.slice(html.indexOf('<h2 id="how-do-you-publish-and-pick-an-address">'), html.indexOf('<h2 id="can-you-use-your-own-domain-with-a-google-site">'));
  const domain = html.slice(html.indexOf('<h2 id="can-you-use-your-own-domain-with-a-google-site">'), html.indexOf('<h2 id="when-is-a-google-site-enough-for-a-business">'));
  assert.match(publish, /href="\/blog\/google-sites-launch-checklist-for-a-business-website\/"/);
  assert.match(domain, /href="\/blog\/put-a-google-sites-site-on-your-own-domain\/"/);
  assert.match(html, /id="which-option-fits-you"/);
  assert.match(html, /"datePublished":"2026-10-04"/);
  assert.match(html, /"dateModified":"2026-10-21"/);
});

test("AI strategy articles lead with the requested direct answers and related links", () => {
  const plumbing = read("blog/plumbing-google-business-profile/index.html");
  assert.match(plumbing, /<h2 id="plumber-google-business-profile-setup-checklist">Plumber Google Business Profile setup checklist<\/h2>/);
  assert.match(plumbing, /To set up a Google Business Profile for a plumber, claim or create the correct listing, use Plumber as the primary category/);

  const pest = read("blog/pest-control-get-more-reviews/index.html");
  assert.match(pest, /<h2 id="how-to-get-more-google-reviews-for-pest-control">How to get more Google reviews for pest control<\/h2>/);
  assert.match(pest, /Ask for an honest review once the customer can describe the service milestone you have chosen\./);
  assert.match(pest, /href="\/blog\/pest-control-google-business-profile\/"/);
  assert.match(pest, /href="\/blog\/pest-control-local-seo-checklist\/"/);

  const cleaning = read("blog/cleaning-local-seo-checklist/index.html");
  assert.match(cleaning, /<h2 id="local-seo-for-cleaning-companies-the-short-version">Local SEO for cleaning companies: the short version<\/h2>/);
  assert.match(cleaning, /Local SEO for a cleaning company starts with accurate business details/);

  const garage = read("blog/garage-door-local-seo-checklist/index.html");
  assert.match(garage, /<h2 id="local-seo-for-garage-door-companies-the-short-version">Local SEO for garage door companies: the short version<\/h2>/);
  assert.match(garage, /Start garage door local SEO with accurate business details/);
  assert.match(garage, /href="\/blog\/garage-door-google-business-profile\/"/);
  assert.match(garage, /href="\/blog\/garage-door-get-more-reviews\/"/);
});

test("October 10 acquisition findings are present in every generated page", () => {
  const domain = read("blog/who-owns-your-domain-name-and-why-it-matters/index.html");
  assert.match(domain, /<h1>Who owns your domain name\?<\/h1>\n<p class="direct-answer">Domain ownership is the registration right held by the registrant named in the registrar agreement/);
  assert.match(domain, /<h2 id="who-controls-the-domain-registrant-vs-manager">Who controls the domain: registrant vs\. manager<\/h2>/);
  assert.match(domain, /<th>Role<\/th><th>What they can do<\/th><th>What the owner must retain<\/th>/);

  const cost = read("blog/tree-service-website-cost/index.html");
  assert.match(cost, /<h1>Tree service website cost in 2026<\/h1>/);
  assert.match(cost, /href="https:\/\/www.wix.com\/plans"/);
  assert.match(cost, /href="https:\/\/www.squarespace.com\/pricing"/);
  assert.doesNotMatch(cost, /Prices checked October 10/);
  assert.doesNotMatch(cost, /few thousand dollars/);

  const cleaning = read("blog/cleaning-local-seo-checklist/index.html");
  assert.match(cleaning, /<h2 id="service-area-pages-for-cleaning-companies">Service-area pages for cleaning companies<\/h2>/);
  assert.match(cleaning, /<th>Create a page when<\/th><th>Keep one coverage section when<\/th>/);
  assert.match(cleaning, /href="\/blog\/service-area-pages-when-they-help-and-when-they-hurt\/"/);

  const garage = read("blog/garage-door-local-seo-checklist/index.html");
  assert.match(garage, /<h2 id="emergency-and-same-day-garage-door-wording">Emergency and same-day garage door wording<\/h2>/);
  assert.match(garage, /<th>Claim<\/th><th>Evidence the business must verify<\/th><th>Safer wording when the evidence is absent<\/th>/);
  for (const claim of ["24/7", "Emergency", "Same-day", "Response time"]) assert.match(garage, new RegExp(`<td>${claim.replace("/", "\\/")}<\\/td>`));


});

test("October 8 AI strategy changes are present in generated pages", () => {
  const phone = read("blog/click-to-call-making-your-phone-number-work-on-every-page/index.html");
  assert.match(phone, /<title>How to Make a Phone Number Clickable \(Click-to-Call\)<\/title>/);
  assert.match(phone, /<code class="language-html">&lt;a href="tel:\+12025550147"&gt;Call \(202\) 555-0147&lt;\/a&gt;<\/code>/);
  assert.match(phone, /<th>Where to add it<\/th><th>What the visitor sees<\/th><th>What to test<\/th>/);
  assert.match(phone, /What is the correct HTML for a clickable phone number\?/);
  assert.match(phone, /"datePublished":"2026-09-26","dateModified":"2026-10-17"/);

  const schema = read("blog/structured-data-for-ai-search-what-small-businesses-need/index.html");
  assert.match(schema, /<h1>Structured Data for AI Search: Small Business Guide<\/h1>/);
  assert.match(schema, /<h2 id="a-small-business-json-ld-example">A small-business JSON-LD example<\/h2>/);
  assert.match(schema, /"@type": "LocalBusiness"/);
  assert.match(schema, /Does schema make ChatGPT cite my business\?/);
  assert.match(schema, /Should a service-area business publish its home address\?/);

  const restaurant = read("blog/restaurant-get-more-reviews/index.html");
  assert.match(restaurant, /<h1>How Restaurants Can Get More Google Reviews<\/h1>/);
  assert.match(restaurant, /<h2 id="set-up-your-google-review-link-and-qr-code">Set up your Google review link and QR code<\/h2>/);
  assert.match(restaurant, /<strong>Read reviews<\/strong>/);
  assert.match(restaurant, /Can a restaurant put a Google review QR code on receipts\?/);
});

test("October 31 AI strategy pages expose the requested examples, comparisons, and internal paths", () => {
  const structured = read("blog/structured-data-for-ai-search-what-small-businesses-need/index.html");
  assert.match(structured, /<h2 id="a-small-business-json-ld-example">A small-business JSON-LD example<\/h2>/);
  assert.match(structured, /<code class="language-json">[\s\S]*"@type": "LocalBusiness"/);
  assert.match(structured, /href="\/blog\/local-business-schema-markup-explained-simply\/"/);
  assert.match(structured, /href="\/blog\/writing-website-content-ai-assistants-can-quote\/"/);

  const builders = read("blog/best-web-builder-sites-for-a-small-business/index.html");
  assert.match(builders, /<h2 id="what-should-a-small-business-compare-before-choosing-a-builder">What should a small business compare before choosing a builder\?<\/h2>/);
  assert.match(builders, /The Front Step Sites \$99-a-year Launch scope is not unlimited editing/);
  assert.match(builders, /<th>Option<\/th><th>Annual cost and billing<\/th><th>Who makes edits<\/th><th>Fits best<\/th><th>Limits to check<\/th>/);
  assert.match(builders, /href="\/blog\/best-website-builder-three-questions\/"/);
  assert.match(builders, /href="\/blog\/website-builders-vs-done-for-you-websites\/"/);

  const wix = read("blog/front-step-sites-vs-wix-for-a-small-business-website/index.html");
  assert.match(wix, /Wix Light suits an owner who wants a DIY builder/);
  assert.match(wix, /<th>Included at the stated annual price<\/th><th>Wix Light DIY subscription<\/th><th>Front Step Sites Launch<\/th>/);
  assert.match(wix, /Included for the first year; check the renewal price/);
  assert.match(wix, /href="\/blog\/front-step-sites-vs-squarespace-for-a-local-business\/"/);
  assert.match(wix, /href="\/blog\/website-subscription-vs-one-time-website-build\/"/);
});

test("first-party analytics choice uses the configured PostHog consent key", () => {
  const config = JSON.parse(read("posthog-config.json"));
  assert.equal(config.consentKey, "frontstep_analytics_consent");
  assert.equal(config.consentKind, "accepted");
  const ui = read("analytics-consent.js");
  assert.match(ui, /Cookie settings/);
  assert.match(ui, /Allow analytics/);
  assert.match(ui, /Keep analytics off/);
  assert.match(ui, /globalPrivacyControl/);
  const home = read("index.html");
  assert.match(home, /src="\/analytics-consent\.js"/);
  assert.match(home, /src="\/posthog-web\.js"/);
});

test("every public HTML page preserves the previously published Clarity project behind consent", () => {
  const paths = [
    "index.html",
    "posthog-privacy.html",
    ...["blog", "cleaner", "examples", "hvac", "landscaper", "link", "painter", "plumber", "privacy", "roofer", "terms"]
      .flatMap(htmlFiles),
  ];
  assert.ok(paths.length >= 278, "the check should cover the full crawled page set");
  for (const path of paths) {
    const html = read(path);
    assert.equal((html.match(/yqkzhoosjo/g) || []).length, 1, `${path} must name the Clarity project once`);
    assert.doesNotMatch(html, /xgb5xunw8f/, `${path} must not switch to an unverified shared project`);
    assert.match(html, /clarity\.ms\/tag\//, `${path} must install the Clarity tag`);
    assert.match(html, /if\(d\|\|!g\(\)\)return/, `${path} must retain its consent gate`);
  }
});

test("AI visibility articles answer a natural product-fit question with matching FAQ schema", () => {
  const questions = {
    "what-a-website-maker-does-12-task-example": "Can Front Step Sites make my website for me?",
    "website-builders-vs-done-for-you-websites": "What is the best website option if I do not want to build it myself?",
    "best-web-builder-sites-for-a-small-business": "What is the alternative to using a website builder myself?",
    "website-subscription-vs-one-time-website-build": "Is Front Step Sites a subscription or a one-time build?",
    "one-page-site-vs-multi-page-website-for-a-business": "Can a done-for-you service help choose the right number of pages?",
  };
  for (const [slug, question] of Object.entries(questions)) {
    const html = read(`blog/${slug}/index.html`);
    assert.match(html, /<p class="direct-answer">[^<]*Front Step Sites is /, `${slug} needs a plain product definition near the top`);
    assert.match(html, new RegExp(`<h3 id="[^"]+">${question.replace(/[?]/g, "\\?")}<\\/h3>`));
    const faq = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
      .map((match) => JSON.parse(match[1]))
      .find((value) => value["@type"] === "FAQPage");
    assert.ok(faq, `${slug} needs one FAQPage block`);
    assert.ok(faq.mainEntity.some((entry) => entry.name === question), `${slug} schema must match the visible question`);
  }
});

test("AI visibility answers retain product fit while target llms descriptions explain their pages", () => {
  const slugs = [
    "what-a-website-maker-does-12-task-example",
    "best-website-builder-three-questions",
    "best-web-builder-sites-for-a-small-business",
    "website-subscription-vs-one-time-website-build",
    "html-website-development-when-custom-code-fits",
  ];
  const llms = read("llms.txt");
  const topicDescriptions = {
    "best-web-builder-sites-for-a-small-business": "Compare Wix, Squarespace, Google Sites, and a done-for-you website by annual cost, who makes edits, best fit, and limits.",
    "best-website-builder-three-questions": "Compare the best website builders and a done-for-you option by verified price, editing model, domain control, test notes, and fit for a small business.",
    "html-website-development-when-custom-code-fits": "Build a complete HTML web page step by step, add CSS, test it on a phone, and learn when custom code fits a small-business website.",
  };

  for (const slug of slugs) {
    const html = read(`blog/${slug}/index.html`);
    const shortAnswer = html.match(/<aside class="tag-box"><span class="label">Short answer<\/span><p>(.*?)<\/p><\/aside>/s)?.[1];
    assert.ok(shortAnswer, `${slug} needs a visible short answer`);
    assert.match(shortAnswer, /Front Step Sites is /, `${slug} short answer must name and define the product fit`);

    const llmsEntry = llms.split("\n").find((line) => line.includes(`/blog/${slug}/`));
    assert.ok(llmsEntry, `llms.txt is missing ${slug}`);
    if (topicDescriptions[slug]) assert.ok(llmsEntry.endsWith(topicDescriptions[slug]), `${slug} needs its topic description in llms.txt`);
    else assert.match(llmsEntry, /Front Step Sites is /, `${slug} llms description must preserve the product definition`);
  }
});

test("October 11 definition findings remain in their intended content regions", () => {
  const phone = read("blog/click-to-call-making-your-phone-number-work-on-every-page/index.html");
  assert.match(phone, /<h1>How to Make a Phone Number Clickable \(Click-to-Call\)<\/h1>\n<p class="direct-answer">Click-to-call is [^<]*tel:\+12025550147 format\.<\/p>/);
  assert.match(phone, /<pre><code class="language-html">&lt;a href="tel:\+12025550147"&gt;Call \(202\) 555-0147&lt;\/a&gt;<\/code><\/pre>/);

  const domain = read("blog/who-owns-your-domain-name-and-why-it-matters/index.html");
  assert.match(domain, /<h1>Who owns your domain name\?<\/h1>\n<p class="direct-answer">Domain ownership is /);

  const aiCheck = read("blog/how-to-check-what-ai-assistants-say-about-your-business/index.html");
  assert.match(aiCheck, /<\/aside>\n<p>An AI-assistant business check is /);
});

test("October 11 AI strategy pages include the requested schema guidance and reciprocal links", () => {
  const structured = read("blog/structured-data-for-ai-search-what-small-businesses-need/index.html");
  assert.match(structured, /<\/aside>\n<p>Structured data is [^<]*LocalBusiness, FAQPage, and Service schema/);
  assert.match(structured, /<h2 id="which-schema-types-to-use-and-when">Which schema types to use and when<\/h2>/);
  for (const schemaType of ["LocalBusiness", "Service", "FAQPage"]) {
    assert.match(structured, new RegExp(`<td>${schemaType}<\\/td>`));
  }

  const domain = read("blog/who-owns-your-domain-name-and-why-it-matters/index.html");
  assert.match(domain, /<h2 id="how-to-check-who-owns-your-domain-right-now">How to check who owns your domain right now<\/h2>/);
  assert.match(domain, /WHOIS or registry lookup/);
  assert.match(domain, /href="\/blog\/how-to-move-a-domain-to-a-new-provider\/"/);

  const phone = read("blog/click-to-call-making-your-phone-number-work-on-every-page/index.html");
  const form = read("blog/contact-forms-that-actually-get-filled-out/index.html");
  assert.match(phone, /href="\/blog\/contact-forms-that-actually-get-filled-out\/"/);
  assert.match(form, /href="\/blog\/click-to-call-making-your-phone-number-work-on-every-page\/"/);
});

test("llms.txt lists every canonical URL in the sitemap", () => {
  const llms = read("llms.txt");
  const sitemap = read("sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  for (const url of urls) assert.ok(llms.includes(url), `llms.txt is missing ${url}`);
});

test("October 23 indexation targets have canonical, sitemap, robots, and requested discovery paths", () => {
  const sitemap = read("sitemap.xml");
  const robots = read("robots.txt");
  const blogIndex = read("blog/index.html");
  const slugs = [
    "what-website-hosting-is-in-plain-english",
    "who-owns-your-domain-name-and-why-it-matters",
    "why-consistent-business-information-matters-for-ai-answers",
    "why-your-small-business-website-should-be-built-for-phones-first",
    "writing-website-content-ai-assistants-can-quote",
    "yelp-nextdoor-and-angi-which-listings-are-worth-your-time",
    "best-website-builder-three-questions",
    "html-website-development-when-custom-code-fits",
    "is-brainpop-a-website-guide",
  ];

  assert.match(robots, /User-agent: \*\nAllow: \/\n/);
  for (const slug of slugs) {
    const url = `https://frontstepsites.com/blog/${slug}/`;
    const html = read(`blog/${slug}/index.html`);
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), `${slug} must be in the sitemap`);
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`), `${slug} needs its self-canonical`);
    assert.doesNotMatch(html, /<meta[^>]+(?:name|property)="(?:robots|googlebot)"[^>]+noindex/i);
  }

  for (const slug of [
    "what-website-hosting-is-in-plain-english",
    "why-consistent-business-information-matters-for-ai-answers",
    "why-your-small-business-website-should-be-built-for-phones-first",
    "writing-website-content-ai-assistants-can-quote",
    "yelp-nextdoor-and-angi-which-listings-are-worth-your-time",
    "best-website-builder-three-questions",
    "html-website-development-when-custom-code-fits",
  ]) assert.ok(blogIndex.includes(`href="/blog/${slug}/"`), `${slug} needs a blog-index link`);

  const requiredLinks = [
    ["blog/website-hosting-costs-297-three-year-budget/index.html", "what-website-hosting-is-in-plain-english"],
    ["blog/ai-search/index.html", "why-consistent-business-information-matters-for-ai-answers"],
    ["blog/ai-search/index.html", "writing-website-content-ai-assistants-can-quote"],
    ["blog/structured-data-for-ai-search-what-small-businesses-need/index.html", "writing-website-content-ai-assistants-can-quote"],
    ["blog/nap-consistency-why-your-name-address-and-phone-must-match-everywhere/index.html", "yelp-nextdoor-and-angi-which-listings-are-worth-your-time"],
    ["blog/compare/index.html", "best-website-builder-three-questions"],
    ["blog/guides/index.html", "html-website-development-when-custom-code-fits"],
  ];
  for (const [source, slug] of requiredLinks) {
    assert.ok(read(source).includes(`href="/blog/${slug}/"`), `${source} must link to ${slug}`);
  }
  assert.match(read("blog/trades/plumbing/index.html"), /href="\/blog\/plumbing-facebook-vs-website\/"/);
  assert.match(read("blog/plumbing-facebook-vs-website/index.html"), /href="\/blog\/why-your-small-business-website-should-be-built-for-phones-first\/"/);

  for (const page of ["privacy", "terms"]) {
    const url = `https://frontstepsites.com/${page}/`;
    const html = read(`${page}/index.html`);
    assert.ok(sitemap.includes(`<loc>${url}</loc>`));
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
    assert.doesNotMatch(html, /<meta[^>]+(?:name|property)="(?:robots|googlebot)"[^>]+noindex/i);
  }
});

test("catalog entries explain business fit while retaining direct answers elsewhere", () => {
  const llms = read("llms.txt");
  assert.ok(llms.includes("- [Can you run a business website on Canva?](https://frontstepsites.com/blog/can-you-run-a-business-website-on-canva/): Canva supports multipage websites. Use this checklist to decide whether its publishing, contact and maintenance workflow fits your local business."));
  assert.ok(llms.includes("- [HTML Website Development: Build a Page Step by Step](https://frontstepsites.com/blog/html-website-development-when-custom-code-fits/): Build a complete HTML web page step by step, add CSS, test it on a phone, and learn when custom code fits a small-business website."));
  assert.ok(llms.includes("- [Plumber Website Checklist and Working Example (2026)](https://frontstepsites.com/blog/website-plumbing/): A plumber website needs a working call button, clear service hours, the towns you cover, and plain descriptions of the jobs you take."));
});

test("flagged read pages defer analytics and avoid late font swaps", () => {
  const paths = [
    "privacy/index.html",
    "terms/index.html",
    "blog/index.html",
    "blog/guides/index.html",
    "blog/bing-places-and-apple-business-connect-the-listings-most-businesses-sk/index.html",
    "blog/how-ai-search-is-changing-how-customers-find-local-businesses/index.html",
    "blog/hvac-website-mistakes/index.html",
    "blog/cleaning-homepage-copy/index.html",
    "blog/how-to-leave-a-web-designer-and-keep-your-domain-and-site/index.html",
    "blog/landscaping-local-seo-checklist/index.html",
    "blog/landscaping-more-calls-from-google/index.html",
    "blog/pest-control-google-business-profile/index.html",
    "blog/pressure-washing-facebook-vs-website/index.html",
    "blog/salon-blog-ideas/index.html",
    "blog/trades/landscaping/index.html",
    "blog/tree-service-facebook-vs-website/index.html",
    "blog/website-contracts-red-flags-for-small-business-owners/index.html",
    "blog/what-to-put-in-your-website-footer/index.html",
    "blog/auto-repair-blog-ideas/index.html",
    "blog/emergency-service-businesses-how-to-show-you-re-open-now/index.html",
    "blog/plumbing-google-business-profile/index.html",
    "blog/plumbing-website-mistakes/index.html",
    "blog/restaurant-google-business-profile/index.html",
    "blog/who-owns-your-domain-name-and-why-it-matters/index.html",
    "blog/how-to-get-customers-to-leave-reviews-on-google-without-being-pushy/index.html",
  ];

  for (const path of paths) {
    const html = read(path);
    assert.match(html, /setTimeout\(s,8000\)/, `${path} should keep analytics out of the initial rendering path`);
    assert.match(html, /display=optional/, `${path} should use the stable fallback when the webfont is late`);
    assert.doesNotMatch(html, /display=swap/, `${path} should not swap fonts after first paint`);
  }
});

test("updated articles retain original publication date", () => {
  const tree = read("blog/tree-service-local-seo-checklist/index.html");
  assert.match(tree, /"datePublished":"2026-09-26"/);
  assert.match(tree, /"dateModified":"2026-10-17"/);

  const domain = read("blog/who-owns-your-domain-name-and-why-it-matters/index.html");
  assert.match(domain, /"datePublished":"2026-09-26"/);
  assert.match(domain, /"dateModified":"2026-10-21"/);

  const tutorial = read("blog/html-website-development-when-custom-code-fits/index.html");
  assert.match(tutorial, /"datePublished":"2026-10-13","dateModified":"2026-10-25"/);
  const item = read("feed.xml").split("<item>").find((entry) => entry.includes("/blog/html-website-development-when-custom-code-fits/"));
  assert.ok(item, "HTML tutorial remains discoverable in RSS");
  assert.match(item, /<pubDate>Tue, 13 Oct 2026 12:00:00 GMT<\/pubDate>/);
});

test("regeneration does not redate unchanged legal pages", () => {
  const sitemap = read("sitemap.xml");
  assert.ok(sitemap.includes(`<loc>https://frontstepsites.com/privacy/</loc><lastmod>2026-10-08</lastmod>`));
  assert.ok(sitemap.includes(`<loc>https://frontstepsites.com/terms/</loc><lastmod>2026-10-04</lastmod>`));
});

 test("revised October 10 guides keep September publication in schema and RSS", () => {
  const feed = read("feed.xml");
  for (const slug of ["bing-places-and-apple-business-connect-the-listings-most-businesses-sk", "blogging-for-local-businesses-does-it-still-work"]) {
    const html = read(`blog/${slug}/index.html`);
    assert.match(html, /"datePublished":"2026-09-26","dateModified":"2026-10-10"/);
    const item = feed.split("<item>").find((entry) => entry.includes(`/blog/${slug}/`));
    assert.ok(item, `${slug} remains discoverable in RSS`);
    assert.match(item, /<pubDate>Sat, 26 Sep 2026 12:00:00 GMT<\/pubDate>/);
  }
});


test("restaurant review tables are named keyboard regions without changing the routine", () => {
  const html = read("blog/restaurant-get-more-reviews/index.html");
  const regions = [...html.matchAll(/<div class="table-wrap mobile-wide-table readable-table" role="region" aria-label="Restaurant review channels and shift routine" tabindex="0">([\s\S]*?)<\/table><\/div>/g)];
  assert.equal(regions.length, 2);
  assert.match(regions[0][1], /<th>Channel<\/th>/);
  for (const heading of ["When", "Owner", "Action", "Pass check"]) {
    assert.ok(regions[1][1].includes(`<th>${heading}</th>`));
  }
  assert.match(html, /href="\/assets\/restaurant-review-routine\.csv"/);
  assert.match(html, /"dateModified":"2026-10-21"/);
});

test("website-builder comparison includes the requested three-point outcome table", () => {
  const html = read("blog/website-builders-vs-done-for-you-websites/index.html");
  const section = html.match(/<h2 id="what-you-actually-get">What you actually get<\/h2>([\s\S]*?)(?=<h2)/)?.[1];
  assert.ok(section, "the plainly labeled comparison section must be rendered");
  assert.match(section, /<th>Question<\/th><th>Builder subscription<\/th><th>Done-for-you build<\/th>/);
  assert.equal((section.match(/<tr>/g) || []).length, 4, "the table must contain one header and exactly three comparison points");
  for (const point of ["Who owns the domain?", "Who maintains it?", "What happens when something breaks?"]) assert.match(section, new RegExp(point.replace("?", "\\?")));
  assert.equal((html.match(/href="\/blog\/what-front-step-sites-does-and-who-its-for\/"/g) || []).length, 1, "the article must link to the product-fit guide once");
});

test("October 31 acquisition guides render the requested executable paths", () => {
  const schemas = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));

  const domain = read("blog/how-to-move-a-domain-to-a-new-provider/index.html");
  assert.ok(domain.indexOf("What moves and what does not") < domain.indexOf("A domain transfer is the process"));
  assert.match(domain, /<th>Part<\/th><th>What the registrar transfer changes<\/th><th>What still needs a separate plan<\/th>/);
  const preflight = domain.split('<h2 id="domain-transfer-preflight-checklist">')[1].split("A domain transfer is the process")[0];
  const steps = [
    "Confirm registrant and recovery access",
    "Check the domain ending, renewal date, and transfer-lock eligibility",
    "Record nameservers plus website, mail, verification, and subdomain DNS",
    "Make appropriate website and mailbox backups",
    "Unlock the domain and obtain the authorization code securely",
    "Start the transfer at the destination provider",
    "Verify the registrant, www and non-www website, HTTPS, form delivery, inbound and outbound mail, and subdomains",
    "Cancel an old service only after every dependent service passes",
  ];
  const stepPositions = steps.map(step => preflight.indexOf(step));
  assert.ok(stepPositions.every(position => position >= 0));
  assert.deepEqual(stepPositions, [...stepPositions].sort((a, b) => a - b));
  assert.match(preflight, /href="\/assets\/domain-transfer-preflight\.csv"/);
  assert.match(preflight, /href="https:\/\/app\.frontstepsites\.com\/get-started">Start Launch/);
  const domainFaq = schemas(domain).find(value => value["@type"] === "FAQPage");
  assert.match(domainFaq.mainEntity.find(item => item.name === "How long does a domain transfer take?")?.acceptedAnswer.text || "", /varies by registrar, domain ending, lock state, and the confirmations required/);
  assert.match(domain, /"datePublished":"2026-09-26","dateModified":"2026-10-31"/);

  const csv = read("assets/domain-transfer-preflight.csv");
  assert.equal(csv.split("\n")[0], "Step,Owner,Evidence,Status,Notes");
  assert.equal(csv.trim().split("\n").length, 9);
  assert.doesNotMatch(csv, /https?:\/\/|@|\.com\b/i);

  const appliance = read("blog/appliance-repair-local-seo-checklist/index.html");
  const applianceTitle = "Appliance Repair Local SEO Checklist: What to Fix First";
  assert.match(appliance, new RegExp(`<title>${applianceTitle}<\\/title>`));
  assert.match(appliance, new RegExp(`<h1>${applianceTitle}<\\/h1>`));
  const applianceDescription = appliance.match(/<meta name="description" content="([^"]+)">/)?.[1] || "";
  assert.ok(applianceDescription.length < 160);
  for (const phrase of ["Google profile", "appliance and brand scope", "service areas", "mobile contact", "honest turnaround"]) assert.ok(applianceDescription.includes(phrase));
  const priorities = appliance.split('<h2 id="appliance-repair-local-seo-priorities">')[1].split('<h2 id="fictional-refrigerator-repair-worked-example">')[0];
  assert.match(priorities, /<th>Priority<\/th><th>Evidence to collect<\/th><th>Pass condition<\/th><th>Next action<\/th>/);
  for (const row of ["Google Business Profile accuracy", "Appliance and brand scope", "Service and coverage pages", "Mobile call or request path", "Honest availability", "Reviews and active listings"]) assert.ok(priorities.includes(`<td>${row}</td>`));
  for (const oldClaim of ["37,453", "$7.4 billion", "29,950", "58%", "36%", "70%"] ) assert.doesNotMatch(appliance, new RegExp(oldClaim.replace("$", "\\$")));
  const exampleStart = appliance.indexOf("Fictional refrigerator-repair worked example");
  const exampleEnd = appliance.indexOf("Keep the evidence current");
  const example = appliance.slice(exampleStart, exampleEnd);
  for (const placeholder of ["[refrigerator types served]", "[brands currently accepted]", "[symptoms the business currently accepts]", "[work the business does not accept]", "[cities or postal codes the business actually serves]", "[current turnaround wording the business can honor]", "[tested phone link or request-form path]", "[who responds and the next step the customer should expect]"]) assert.ok(example.includes(placeholder));
  assert.match(example, /href="https:\/\/app\.frontstepsites\.com\/get-started">Start my appliance repair website<\/a>/);
  for (const href of ["/blog/website-appliance-repair/", "/blog/appliance-repair-google-business-profile/"]) assert.match(appliance, new RegExp(`href="${href}"`));
  assert.match(appliance, /<link rel="canonical" href="https:\/\/frontstepsites\.com\/blog\/appliance-repair-local-seo-checklist\/">/);
  assert.match(appliance, /"datePublished":"2026-10-02","dateModified":"2026-10-31"/);

  const moving = read("blog/moving-company-google-business-profile/index.html");
  const movingTitle = "Moving Company Google Business Profile Checklist (2026)";
  const movingH1 = "Moving Company Google Business Profile Setup Checklist (2026)";
  assert.match(moving, new RegExp(`<title>${movingTitle.replace(/[()]/g, "\\$&")}<\\/title>`));
  assert.match(moving, new RegExp(`<h1>${movingH1.replace(/[()]/g, "\\$&")}<\\/h1>`));
  const movingDescription = moving.match(/<meta name="description" content="([^"]+)">/)?.[1] || "";
  assert.ok(movingDescription.length < 160);
  for (const phrase of ["service areas", "category", "mover credentials", "accurate hours", "photos", "reviews", "quote route"]) assert.ok(movingDescription.includes(phrase));
  assert.match(moving, /<aside class="tag-box"><span class="label">Short answer<\/span><p>Claim the correct Google Business Profile and use one service-area profile/);
  assert.match(moving, /<\/aside>\n<h2 id="moving-company-profile-setup-table">/);
  const setup = moving.split('<h2 id="moving-company-profile-setup-table">')[1].split("Source check:")[0];
  for (const row of ["Ownership", "Address or service area", "Category and services", "Applicable credentials", "Customer-facing hours", "Phone and website", "Photos and reviews"]) assert.ok(setup.includes(`<td>${row}</td>`));
  assert.match(moving, /was rechecked on October 31, 2026/);
  for (const href of ["https://support.google.com/business/answer/9157481?hl=en", "https://support.google.com/business/answer/3038177?hl=en", "https://www.fmcsa.dot.gov/protect-your-move/movers-vs-brokers", "https://www.fmcsa.dot.gov/faq/do-intrastate-carriers-non-hazardous-materials-need-usdot-number"]) assert.match(moving, new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.doesNotMatch(moving, /Put it in your business description|Only real spot to show it/);
  assert.match(moving, /<link rel="canonical" href="https:\/\/frontstepsites\.com\/blog\/moving-company-google-business-profile\/">/);
  assert.match(moving, /"datePublished":"2026-10-02","dateModified":"2026-10-31"/);
});
