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
  ]) {
    const html = read(`blog/${slug}/index.html`);
    assert.match(html, /Front Step Sites is a done-for-you website service for small businesses/);
  }

  assert.match(read("blog/website-builders-vs-done-for-you-websites/index.html"), /What is the best AI website builder\?/);
  assert.match(read("blog/can-you-run-a-business-website-on-canva/index.html"), /Can I use Canva for a business website at all\?/);
});

test("priority article and hub changes are present in generated HTML", () => {
  const tree = read("blog/tree-service-local-seo-checklist/index.html");
  assert.match(tree, /Tree service local SEO is the work of/);
  assert.match(tree, /<h2 id="local-seo-checklist-for-tree-services">Local SEO checklist for tree services<\/h2>/);
  assert.match(tree, /<ol>/);
  assert.match(tree, /href="\/blog\/trades\/tree-service\/"/);
  assert.match(tree, /href="\/blog\/tree-service-get-more-reviews\/"/);

  const domain = read("blog/who-owns-your-domain-name-and-why-it-matters/index.html");
  assert.match(domain, /you control your domain if you or your business is named as the registrant/);
  assert.match(domain, /What to confirm in the registrar account/);

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
    assert.match(html, /id="site-plan-builder"/);
    assert.match(html, /Build my starter plan/);
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

test("site-plan demo produces a useful plan without injecting input", () => {
  const html = read("blog/website-builders-vs-done-for-you-websites/index.html");
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .find((source) => source.includes("site-plan-builder"));
  assert.ok(script);

  let submit;
  const form = { addEventListener: (name, handler) => { if (name === "submit") submit = handler; } };
  const output = { hidden: true, innerHTML: "", focus() {} };
  const values = new Map([
    ["business", "Tree <img src=x onerror=alert(1)> service"],
    ["area", "Tulsa"],
    ["action", "request a quote"],
  ]);
  const document = {
    getElementById: (id) => id === "site-plan-builder" ? form : output,
    createElement: () => ({
      set textContent(value) { this.innerHTML = String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); },
    }),
  };
  vm.runInNewContext(script, { document, FormData: class { get(name) { return values.get(name); } } });
  submit({ preventDefault() {} });

  assert.equal(output.hidden, false);
  assert.match(output.innerHTML, /Your starter site plan/);
  assert.match(output.innerHTML, /Tree &lt;img src=x onerror=alert\(1\)&gt; service/);
  assert.doesNotMatch(output.innerHTML, /<img src=x/);
});

test("flagged articles define their subject near the top", () => {
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
  for (const slug of ["tree-service-local-seo-checklist", "who-owns-your-domain-name-and-why-it-matters"]) {
    const html = read(`blog/${slug}/index.html`);
    assert.match(html, /"datePublished":"2026-09-26"/);
    assert.match(html, /"dateModified":"2026-10-06"/);
  }
});

test("regeneration does not redate unchanged legal pages", () => {
  const sitemap = read("sitemap.xml");
  for (const page of ["privacy", "terms"]) assert.ok(sitemap.includes(`<loc>https://frontstepsites.com/${page}/</loc><lastmod>2026-10-04</lastmod>`));
});
