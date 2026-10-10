import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("homepage preserves buyer CTA and excludes unrelated query FAQs", () => {
  const html = read("index.html");
  assert.ok((html.match(/href="https:\/\/app\.frontstepsites\.com\/get-started"/g) || []).length >= 1);
  assert.doesNotMatch(html, /best movie site free|What is the best option for/);
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => JSON.parse(m[1])).filter(v => v["@type"] === "FAQPage");
  assert.equal(blocks.length, 1);
  for (const entry of blocks[0].mainEntity) assert.ok(html.includes(`<summary>${entry.name}</summary>`));
});

test("AI visibility pages carry useful answers and plain product definitions", () => {
  const home = read("index.html");
  assert.match(home, /Front Step Sites is a done-for-you website service for small businesses/);
  assert.match(home, /Do I need to know HTML or code\?/);
  assert.match(home, /Do you build personal about-me sites\?/);

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

test("priority article and hub changes are present in generated HTML", () => {
  const tree = read("blog/tree-service-local-seo-checklist/index.html");
  assert.match(tree, /Tree service local SEO is the work of/);
  assert.match(tree, /<h2 id="local-seo-checklist-for-tree-services">Local SEO checklist for tree services<\/h2>/);
  assert.match(tree, /<ol>/);
  assert.match(tree, /href="\/blog\/trades\/tree-service\/"/);
  assert.match(tree, /href="\/blog\/tree-service-get-more-reviews\/"/);

  const domain = read("blog/who-owns-your-domain-name-and-why-it-matters/index.html");
  assert.match(domain, /Operational control of a domain belongs with the registrant named in the registration agreement/);
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

  for (const slug of [
    "website-maker-or-done-for-you-three-year-cost",
    "website-subscription-vs-one-time-website-build",
    "auto-repair-facebook-vs-website",
  ]) assert.match(read(`blog/${slug}/index.html`), /<table>/);

  const home = read("index.html");
  assert.match(home, /A website is a set of linked pages on a domain name/);
  assert.match(home, /How a small-business website is created/);
  assert.match(home, /<ol class="start">/);
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

test("homepage keeps third-party assets out of the initial rendering path", () => {
  const home = read("index.html");
  assert.match(home, /setTimeout\(s,8000\)/);
  assert.match(home, /display=optional/);
  assert.match(home, /rel="stylesheet" media="print" onload="this\.media='all'"/);
  assert.doesNotMatch(home, /display=swap/);
  assert.doesNotMatch(home, /<img\b/);
});

test("AI strategy articles lead with the requested direct answers and related links", () => {
  const plumbing = read("blog/plumbing-google-business-profile/index.html");
  assert.match(plumbing, /<h2 id="plumbing-google-business-profile-the-short-version">Plumbing Google Business Profile: the short version<\/h2>/);
  assert.match(plumbing, /To set up a plumbing Google Business Profile: claim the listing, pick the primary category Plumber, add your service area, hours and phone, then post a photo and ask your last five customers for a review\./);

  const pest = read("blog/pest-control-get-more-reviews/index.html");
  assert.match(pest, /<h2 id="how-to-get-more-google-reviews-for-pest-control">How to get more Google reviews for pest control<\/h2>/);
  assert.match(pest, /Pest control customers leave reviews when you ask by text within an hour of the job and make the link a single tap\./);

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
  assert.match(domain, /<h1>Who owns your domain name\?<\/h1>\n<p class="direct-answer">Operational control of a domain belongs with the registrant named in the registration agreement/);
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
  assert.match(phone, /"datePublished":"2026-09-26","dateModified":"2026-10-08"/);

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

test("llms.txt lists every canonical URL in the sitemap", () => {
  const llms = read("llms.txt");
  const sitemap = read("sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  for (const url of urls) assert.ok(llms.includes(url), `llms.txt is missing ${url}`);
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
  assert.match(tree, /"dateModified":"2026-10-06"/);

  const domain = read("blog/who-owns-your-domain-name-and-why-it-matters/index.html");
  assert.match(domain, /"datePublished":"2026-09-26"/);
  assert.match(domain, /"dateModified":"2026-10-10"/);
});

test("regeneration does not redate unchanged legal pages", () => {
  const sitemap = read("sitemap.xml");
  assert.ok(sitemap.includes(`<loc>https://frontstepsites.com/privacy/</loc><lastmod>2026-10-08</lastmod>`));
  assert.ok(sitemap.includes(`<loc>https://frontstepsites.com/terms/</loc><lastmod>2026-10-04</lastmod>`));
});
