import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

function metadata(path) {
  const html = read(path);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
  return { canonical, description, title, webPage: schemas.find(schema => schema["@type"] === "WebPage") };
}

test("trade previews have unique canonical URLs and matching WebPage schema", () => {
  for (const slug of ["plumber", "roofer", "landscaper", "cleaner", "painter", "hvac"]) {
    const page = metadata(`${slug}/index.html`);
    const url = `https://frontstepsites.com/${slug}/`;
    assert.equal(page.canonical, url);
    assert.equal(page.webPage?.url, url);
    assert.equal(page.webPage?.name, page.title);
    assert.equal(page.webPage?.description, page.description);
    assert.equal(page.webPage?.isPartOf?.url, "https://frontstepsites.com/");
  }
});

test("the cleaning design example has matching WebPage schema", () => {
  const page = metadata("examples/cleaning/index.html");
  assert.equal(page.canonical, "https://frontstepsites.com/examples/cleaning/");
  assert.equal(page.webPage?.url, page.canonical);
  assert.equal(page.webPage?.description, page.description);
  assert.equal(page.webPage?.name, "Fictional cleaning design example");
});
