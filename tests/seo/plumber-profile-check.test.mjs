import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('plumber self-check follows the existing setup table without claiming Google verification', () => {
  const html = read('blog/plumbing-google-business-profile/index.html');
  assert.match(html, /id="plumber-profile-check"/);
  assert.equal((html.match(/data-profile-check type="checkbox"/g) || []).length, 6);
  assert.ok(html.indexOf('Photos and reviews</td>') < html.indexOf('id="plumber-profile-check"'));
  assert.match(html, /Your own progress, not a Google verification result/);
  assert.match(html, /href="\/plumber\/">See these details on a fictional plumber site/);
  assert.match(html, /src="\/assets\/plumber-profile-check.js" defer/);
});

function harness(initial, deny = false) {
  const events = {}, values = new Map(initial ? [['frontstep_plumber_profile_check_v1', initial]] : []);
  const boxes = Array.from({ length: 6 }, (_, i) => ({ checked: false, addEventListener: (event, fn) => { events[i] = fn; } }));
  const nodes = { 'profile-check-fields': { disabled: true }, 'profile-check-count': { textContent: '' }, 'profile-check-result': { textContent: '' }, 'profile-check-storage': { textContent: '' }, 'profile-check-reset': { disabled: true, addEventListener: (event, fn) => { events.reset = fn; } } };
  const storage = { getItem: key => { if (deny) throw Error('denied'); return values.get(key) ?? null; }, setItem: (key, val) => { if (deny) throw Error('denied'); values.set(key, val); }, removeItem: key => { if (deny) throw Error('denied'); values.delete(key); } };
  vm.runInNewContext(read('assets/plumber-profile-check.js'), { document: { getElementById: id => id === 'plumber-profile-check' ? { querySelectorAll: () => boxes } : nodes[id] }, localStorage: storage });
  return { boxes, nodes, events, values };
}

test('actual local-state controller counts, restores and resets six boolean checks', () => {
  const h = harness();
  assert.equal(h.nodes['profile-check-count'].textContent, '0 of 6 public checks complete');
  assert.equal(h.nodes['profile-check-fields'].disabled, false);
  h.boxes.forEach((box, i) => { box.checked = true; h.events[i](); });
  assert.equal(h.nodes['profile-check-count'].textContent, '6 of 6 public checks complete');
  const saved = h.values.get('frontstep_plumber_profile_check_v1');
  assert.deepEqual(JSON.parse(saved), { version: 1, checked: [true, true, true, true, true, true] });
  const restored = harness(saved);
  assert.equal(restored.boxes.filter(box => box.checked).length, 6);
  restored.events.reset();
  assert.equal(restored.nodes['profile-check-count'].textContent, '0 of 6 public checks complete');
  assert.equal(restored.values.size, 0);
  assert.equal(harness().boxes.filter(box => box.checked).length, 0);
});

test('storage denial keeps live checks usable without promising persistence', () => {
  const h = harness(undefined, true);
  h.boxes[0].checked = true; h.events[0]();
  assert.equal(h.nodes['profile-check-count'].textContent, '1 of 6 public checks complete');
  assert.match(h.nodes['profile-check-storage'].textContent, /only while this page is open/);
  h.events.reset();
  assert.equal(h.boxes.filter(box => box.checked).length, 0);
});

test('malformed or nonboolean saved data cannot mark work complete', () => {
  for (const value of ['oops', '{"version":1,"checked":["true",false,false,false,false,false]}', '{"version":1,"checked":[true]}', '{"version":2,"checked":[true,true,true,true,true,true]}']) {
    assert.equal(harness(value).boxes.filter(box => box.checked).length, 0);
  }
  assert.doesNotMatch(read('assets/plumber-profile-check.js'), /fetch|XMLHttpRequest|sendBeacon|innerHTML|dispatchEvent/);
});
