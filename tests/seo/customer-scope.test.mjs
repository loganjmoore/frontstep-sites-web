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
