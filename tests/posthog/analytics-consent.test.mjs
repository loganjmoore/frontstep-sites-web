import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../../analytics-consent.js', import.meta.url), 'utf8');
const values = new Map();
const nodes = new Map();
const appended = [];
const documentListeners = new Map();
const windowListeners = [];

function element(tag = 'div') {
  const listeners = new Map();
  const children = new Map();
  return {
    tag, hidden: false, disabled: false, textContent: '', listeners,
    set id(value) { this._id = value; nodes.set(value, this); },
    get id() { return this._id; },
    set innerHTML(value) {
      this._innerHTML = value;
      for (const selector of ['[data-consent-status]', '[data-consent-accept]', '[data-consent-decline]']) children.set(selector, element(selector));
    },
    setAttribute() {},
    addEventListener(name, handler) { listeners.set(name, handler); },
    querySelector(selector) { return children.get(selector) || null; },
  };
}

const body = element('body');
body.append = (...items) => items.forEach((item) => { appended.push(item); if (item.id) nodes.set(item.id, item); });
const document = {
  readyState: 'loading', head: { append() {} }, body,
  createElement: (tag) => element(tag),
  getElementById: (id) => nodes.get(id) || null,
  addEventListener: (name, handler) => documentListeners.set(name, handler),
};
const navigator = { globalPrivacyControl: false, doNotTrack: null };
const window = {
  doNotTrack: null,
  addEventListener() {},
  dispatchEvent: (event) => { windowListeners.push(event.type); return true; },
};
const localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
};

vm.runInNewContext(source, { window, document, navigator, localStorage, Event });
documentListeners.get('DOMContentLoaded')();
const panel = nodes.get('analytics-consent-panel');
const accept = panel.querySelector('[data-consent-accept]');
const decline = panel.querySelector('[data-consent-decline]');
const settings = appended.find((node) => node.textContent === 'Cookie settings');

assert.equal(panel.hidden, false, 'First visit asks for an explicit choice');
assert.equal(accept.disabled, false);
accept.listeners.get('click')();
assert.equal(values.get('frontstep_analytics_consent'), 'accepted');
assert.equal(panel.hidden, true);
settings.listeners.get('click')();
assert.equal(panel.hidden, false, 'Persistent settings control reopens the choice');
decline.listeners.get('click')();
assert.equal(values.get('frontstep_analytics_consent'), 'declined', 'A prior acceptance can be withdrawn');
assert.ok(windowListeners.includes('website:analytics-consent'));

navigator.globalPrivacyControl = true;
settings.listeners.get('click')();
assert.equal(accept.disabled, true, 'GPC prevents acceptance from enabling analytics');
assert.equal(panel.querySelector('[data-consent-status]').textContent, 'Your browser privacy signal keeps analytics off.');
console.log('Analytics choice UI passed: explicit choice, persistence, withdrawal and browser privacy signal.');
