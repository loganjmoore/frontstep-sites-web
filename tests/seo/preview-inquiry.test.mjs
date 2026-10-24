import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const home = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const plumber = readFileSync(new URL("../../plumber/index.html", import.meta.url), "utf8");

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

test("fictional plumber sample exposes the supplied phone and completes only after required fields", () => {
  const scripts = [...plumber.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const personalization = scripts.at(-1)[1];
  const phoneLinks = [{ hidden: true }, { hidden: true }];
  const phoneText = [{ textContent: "" }, { textContent: "" }];
  const telLinks = [{ href: "" }, { href: "" }];
  const smsLinks = [{ href: "" }];
  const area = { hidden: true };
  const areaLink = { hidden: true };
  const sinceSection = { hidden: true };
  const year = { textContent: "" };
  let focused = "";
  let submit;
  let replacement;
  const form = {
    name: { value: "", focus() { focused = "name"; } },
    phone: { value: "", focus() { focused = "phone"; } },
    addEventListener(type, handler) { if (type === "submit") submit = handler; },
    replaceChildren(node) { replacement = node; },
  };
  const all = new Map([
    ["[data-name]", []], ["[data-for-line]", []], ["[data-van]", []], ["[data-city]", []],
    ["[data-phone-link]", phoneLinks], ["[data-phone]", phoneText], ["[data-tel]", telLinks],
    ["[data-sms]", smsLinks], ["[data-since]", []],
  ]);
  const document = {
    title: "Sample Plumbing Site",
    documentElement: { style: { setProperty() {} } },
    querySelectorAll(selector) { return all.get(selector) || []; },
    querySelector(selector) { return selector === "[data-area-link]" ? areaLink : selector === "[data-since-section]" ? sinceSection : null; },
    getElementById(id) { return id === "quote" ? form : id === "area" ? area : id === "yr" ? year : null; },
    createElement() { return { className: "", innerHTML: "" }; },
  };

  vm.runInNewContext(personalization, { document, location: { search: "?p=2025550147" }, URLSearchParams, Date });
  assert.ok(phoneLinks.every(link => link.hidden === false));
  assert.ok(telLinks.every(link => link.href === "tel:2025550147"));
  assert.ok(smsLinks.every(link => link.href === "sms:2025550147"));

  submit({ preventDefault() {}, target: form });
  assert.equal(focused, "name");
  form.name.value = "Taylor Example";
  submit({ preventDefault() {}, target: form });
  assert.equal(focused, "phone");
  form.phone.value = "202-555-0147";
  submit({ preventDefault() {}, target: form });
  assert.match(replacement.innerHTML, /Preview complete\. Nothing was sent\./);
  assert.match(plumber, /This form is a preview\. It does not send a message to this business\./);
  assert.match(plumber, /Nothing entered here is sent or stored\./);
});
