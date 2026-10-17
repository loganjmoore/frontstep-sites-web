import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const html = read("examples/cleaning/index.html");

test("distinct cleaning example stays fictional, discoverable and within marketing scope", () => {
  assert.match(html, /Fictional design example/);
  assert.match(html, /No real cleaning business or customer is represented/);
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /Illustrative services, not an offer from an operating cleaning company/);
  assert.match(html, /Regular home care/);
  assert.match(html, /A more detailed reset/);
  assert.doesNotMatch(html, /class="van"|Big Shoulders|testimonials|certified|five.star|guaranteed/i);
  assert.match(read("index.html"), /href="\/examples\/cleaning\/">View cleaning design<\/a>/);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id));
  const mailto = html.match(/href="(mailto:[^"]+)"/)[1].replaceAll("&amp;", "&");
  const url = new URL(mailto);
  assert.equal(url.pathname, "hello@frontstepsites.com");
  assert.equal(url.searchParams.get("subject"), "Custom website preview inquiry");
  assert.match(html, /href="\/">Return to Front Step Sites/);
});

test("cleaning brief never submits and handles entered markup as text", () => {
  const listeners = {};
  const controls = {
    "demo-form": { addEventListener: (event, fn) => { listeners[`form:${event}`] = fn; } },
    "demo-button": { disabled: true, addEventListener: (event, fn) => { listeners[`button:${event}`] = fn; } },
    "demo-result": { textContent: "" },
    "cleaning-type": { value: "A detailed reset" },
    "example-notes": { value: '<img src=x onerror="throw 1">' },
  };
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
  vm.runInNewContext(script, { document: { getElementById: id => controls[id] } });
  assert.equal(controls["demo-button"].disabled, false);
  let prevented = false;
  listeners["form:submit"]({ preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  listeners["button:click"]();
  assert.match(controls["demo-result"].textContent, /A detailed reset/);
  assert.ok(controls["demo-result"].textContent.includes(controls["example-notes"].value));
  assert.match(controls["demo-result"].textContent, /Nothing was sent or saved. No booking was created/);
  assert.match(html, /id="demo-button" type="button" disabled/);
  assert.match(html, /Please do not enter personal information/);
  assert.doesNotMatch(script, /fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|innerHTML/);
});
