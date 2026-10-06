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
});

test("llms.txt lists every canonical URL in the sitemap", () => {
  const llms = read("llms.txt");
  const sitemap = read("sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  for (const url of urls) assert.ok(llms.includes(url), `llms.txt is missing ${url}`);
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
