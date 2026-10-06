import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("homepage has one signup CTA and one merged FAQPage block", () => {
  const html = read("index.html");
  const signupLinks = html.match(/href="https:\/\/app\.frontstepsites\.com\/get-started"/g) || [];
  assert.equal(signupLinks.length, 1);

  const faqBlocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map((match) => JSON.parse(match[1]))
    .filter((value) => value["@type"] === "FAQPage");
  assert.equal(faqBlocks.length, 1);

  const questions = new Set(faqBlocks[0].mainEntity.map((entry) => entry.name));
  for (const question of [
    "What is the best option for best movie site free?",
    "What is the best option for artificial intelligence websites?",
    "What is the best option for define website?",
    "What is the best option for what is a site?",
    "What is the best option for what is website?",
    "What is the best option for what are website?",
    "What is the best option for musician website free?",
  ]) {
    assert.ok(questions.has(question), `missing FAQ question: ${question}`);
    assert.match(html, new RegExp(`<summary>${question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</summary>`));
  }
  assert.match(html, /Front Step Sites is a done-for-you website service for small businesses/);
});

test("priority article and hub changes are present in generated HTML", () => {
  const tree = read("blog/tree-service-local-seo-checklist/index.html");
  assert.match(tree, /Local SEO for a tree service means/);
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

test("llms.txt lists every canonical URL in the sitemap", () => {
  const llms = read("llms.txt");
  const sitemap = read("sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  for (const url of urls) assert.ok(llms.includes(url), `llms.txt is missing ${url}`);
});
