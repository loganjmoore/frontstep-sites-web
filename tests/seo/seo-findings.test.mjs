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
  const entityDefinition = "Front Step Sites is a done-for-you website service for small businesses";
  assert.match(home, new RegExp(entityDefinition));
  assert.ok(home.indexOf(entityDefinition) < home.indexOf('<div class="shelf"'), "entity definition should precede the homepage offer shelf");
  assert.match(home, /<h2>What we do<\/h2>/);
  assert.match(home, /<h2>What we do not do<\/h2>/);
  for (const href of ["/blog/guides/", "/blog/compare/", "/blog/ai-search/"]) {
    assert.match(home, new RegExp(`href="${href}"`));
  }
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

test("October 11 citability pages define their subject immediately after the H1", () => {
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
  };

  assert.equal(Object.keys(definitions).length, 25);
  assert.equal(new Set(Object.values(definitions)).size, 25);
  for (const [slug, definition] of Object.entries(definitions)) {
    const html = read("blog/" + slug + "/index.html");
    assert.ok(
      html.includes("</h1>\n<p class=\"direct-answer\">" + definition),
      slug + " should define its subject immediately after the H1",
    );
  }
});

test("cleaning Business Profile guide has the requested setup checklist", () => {
  const html = read("blog/cleaning-google-business-profile/index.html");
  assert.match(html, /<title>Cleaning Company Google Business Profile Checklist<\/title>/);
  assert.match(html, /<meta name="description" content="Follow a truthful cleaning company profile setup sequence covering eligibility, service areas, categories, services, hours, photos, your website, and reviews\.">/);
  assert.match(html, /<h1>Google Business Profile for Cleaning Companies: Setup Checklist<\/h1>\n<p class="direct-answer">Your cleaning company Google Business Profile should explain/);
  assert.match(html, /<h2 id="cleaning-company-profile-setup-order">Cleaning company profile setup order<\/h2>/);
  assert.match(html, /<div class="table-wrap mobile-wide-table"><table><thead><tr><th>Step<\/th><th>What to enter<\/th><th>What to verify<\/th><th>Common mistake<\/th>/);
  const checklist = html.split('<h2 id="cleaning-company-profile-setup-order">')[1].split("Source note:")[0];
  assert.equal((checklist.match(/<tbody><tr>|<\/tr><tr>/g) || []).length, 7);
  assert.match(html, /support\.google\.com<\/a> was rechecked on October 11, 2026/);
  assert.match(html, /<link rel="canonical" href="https:\/\/frontstepsites\.com\/blog\/cleaning-google-business-profile\/">/);
  assert.match(html, /href="https:\/\/app\.frontstepsites\.com\/get-started"/);
  assert.match(html, /"datePublished":"2026-09-26","dateModified":"2026-10-11"/);
  const faq = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map((match) => JSON.parse(match[1]))
    .find((value) => value["@type"] === "FAQPage");
  assert.equal(faq.mainEntity.length, 4);
  assert.match(read("sitemap.xml"), /https:\/\/frontstepsites\.com\/blog\/cleaning-google-business-profile\/<\/loc><lastmod>2026-10-11/);
});

test("October 10 entity-definition findings use unique plain definitions immediately after the H1", () => {
  const definitions = {
    "how-to-make-a-google-site": "Google Sites is a website builder from Google for making simple pages, and this guide walks through making one step by step.",
    "best-web-builder-sites-for-a-small-business": "A website builder is a self-serve tool for making and editing your own site, and this comparison is for small business owners choosing between Wix, Squarespace, Google Sites, and a done-for-you site.",
    "click-to-call-making-your-phone-number-work-on-every-page": "Click-to-call is a phone link that opens a calling option on a supported device when a website visitor selects it.",
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

test("AI strategy articles lead with the requested direct answers and related links", () => {
  const plumbing = read("blog/plumbing-google-business-profile/index.html");
  assert.match(plumbing, /<h2 id="plumbing-google-business-profile-the-short-version">Plumbing Google Business Profile: the short version<\/h2>/);
  assert.match(plumbing, /To set up a plumbing Google Business Profile: claim the listing, pick the primary category Plumber, add your service area, hours and phone, then post a photo and ask your last five customers for a review\./);

  const pest = read("blog/pest-control-get-more-reviews/index.html");
  assert.match(pest, /<h2 id="how-to-get-more-google-reviews-for-pest-control">How to get more Google reviews for pest control<\/h2>/);
  assert.match(pest, /Pest control customers leave reviews when you ask by text within an hour of the job and make the link a single tap\./);
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
  assert.match(phone, /"datePublished":"2026-09-26","dateModified":"2026-10-10"/);

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
