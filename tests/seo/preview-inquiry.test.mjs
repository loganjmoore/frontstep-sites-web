import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

test("custom-preview inquiries use the verified mailbox with encoded request details", () => {
  const links = [...home.matchAll(/<a\b([^>]*?)href="([^"]+)"([^>]*)>Request a custom preview<\/a>/g)];
  assert.equal(links.length, 2, "Inquiry links belong in hero and sample area");
  for (const [, before, href, after] of links) {
    const url = new URL(href.replaceAll("&amp;", "&"));
    assert.equal(url.protocol, "mailto:");
    assert.equal(url.pathname, "hello@frontstepsites.com");
    assert.equal(url.searchParams.get("subject"), "Custom website preview inquiry");
    assert.equal(url.searchParams.get("body"), "Business name:\r\nCurrent website (if any):\r\nServices:\r\nDesired look:");
    assert.equal(url.searchParams.has("cc"), false);
    assert.equal(url.searchParams.has("bcc"), false);
    const description = (before + after).match(/aria-describedby="([^"]+)"/);
    assert.ok(description, "Each email action has nearby request instructions");
    assert.ok(home.includes(`id="${description[1]}"`));
  }
  assert.match(home, /discuss whether a preview is a fit/);
  assert.doesNotMatch(home, /(?:free custom preview|preview (?:within|in) \d+|guaranteed preview)/i);
});

test("unpersonalized sample navigation is available outside the required-name form", () => {
  const sampleLink = home.match(/<a\b[^>]*href="\/plumber\/"[^>]*>View sample<\/a>/);
  assert.ok(sampleLink);
  assert.ok(sampleLink.index < home.indexOf('<form class="try"'));
  assert.match(home, /Example plumbing site; no business details needed/);
  assert.match(home, /<form class="try" id="try" action="\/plumber\/" method="get">/);
  assert.match(home, /name="n"[^>]*required/);
  assert.match(home, /href="https:\/\/app\.frontstepsites\.com\/get-started">Start Launch — \$99\/yr/);
});
