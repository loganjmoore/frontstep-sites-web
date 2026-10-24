import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("hosting and maintenance scope excludes application systems without offering a separate quote", () => {
  for (const path of [
    "content/blog/website-hosting-and-maintenance-what-99-covers.md",
    "blog/website-hosting-and-maintenance-what-99-covers/index.html",
  ]) {
    const article = read(path);
    assert.match(article, /Store, booking, payment, or custom backend\/database systems/);
    assert.match(article, /These systems are not offered by Front Step Sites/);
    assert.match(article, /custom static marketing pages, blogs, and contact forms/);
    assert.match(article, /four accepted coherent marketing updates per America\/Chicago calendar month, with no rollover/);
    assert.doesNotMatch(article, /These require a separate quote before work begins/);
  }
});

test("new three-year budget article preserves pricing and the accepted marketing scope", () => {
  for (const path of [
    "content/blog/website-hosting-costs-297-three-year-budget.md",
    "blog/website-hosting-costs-297-three-year-budget/index.html",
  ]) {
    const article = read(path);
    assert.match(article, /\$99 \+ \$99 \+ \$99 = \$297/);
    assert.match(article, /four accepted coherent marketing updates per America\/Chicago calendar month/);
    assert.match(article, /with no rollover/);
    assert.match(article, /midnight on the first day of each month/);
    assert.match(article, /Existing paid unlimited contracts keep their entitlement/);
    assert.match(article, /Grow is a standalone website plan with its own domain, hosting, and SSL/);
    assert.match(article, /Marketing pages, contact forms, and blog posts fit the service/);
    assert.match(article, /bespoke backend or database applications are not offered/);
    assert.match(article, /Ordinary links to customer-owned providers are allowed/);
    assert.doesNotMatch(article, /2 change requests|2 requested changes|2 business days|24 request|24 website changes|Two requests a month/);
    assert.doesNotMatch(article, /(?:Build online scheduling|Accept deposits on the site)(?:\s*\|\s*|<\/td><td>)Separate quote/);
  }
});

test("comparison and cost articles use the current monthly update scope", () => {
  const slugs = [
    "front-step-sites-vs-hiring-a-freelancer",
    "front-step-sites-vs-a-marketing-agency",
    "auto-repair-website-cost",
    "locksmith-website-cost",
    "appliance-repair-website-cost",
  ];

  for (const slug of slugs) {
    for (const path of [`content/blog/${slug}.md`, `blog/${slug}/index.html`]) {
      const article = read(path);
      assert.match(article, /four accepted coherent marketing updates per America\/Chicago calendar month, with no rollover/);
      assert.match(article, /Existing paid unlimited contracts retain their existing entitlement/);
      assert.doesNotMatch(article, /four marketing updates per Central calendar month changes/i);
      assert.doesNotMatch(article, /Launch.{0,80}(?:two|2) (?:requests|updates)|Grow.{0,80}unlimited\b/i);
    }
  }

  for (const [slug, published] of [
    ["front-step-sites-vs-hiring-a-freelancer", "2026-09-26"],
    ["front-step-sites-vs-a-marketing-agency", "2026-09-26"],
    ["auto-repair-website-cost", "2026-09-30"],
    ["locksmith-website-cost", "2026-09-30"],
    ["appliance-repair-website-cost", "2026-09-30"],
  ]) {
    const article = read(`blog/${slug}/index.html`);
    assert.match(article, new RegExp(`"datePublished":"${published}"`));
    assert.match(article, /"dateModified":"2026-10-24"/);
  }
});
