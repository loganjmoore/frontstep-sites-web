import assert from 'node:assert/strict';
import { compareAnnualCost } from '../../assets/plan-cost.mjs';
const ownCost = compareAnnualCost('36.50');
assert.equal(ownCost.annual, 43800);
assert.deepEqual(ownCost.plans.map(p => p.difference), [33900, 9000, 14800]);
assert.deepEqual(compareAnnualCost('0').plans.map(p => p.difference), [-9900, -34800, -29000]);
assert.equal(compareAnnualCost('8.25').plans[0].difference, 0);
assert.equal(compareAnnualCost('0.29').annual, 348);
for (const bad of ['', ' ', '-1', '-0.001', 'nope', 'Infinity', '1000000.01']) assert.equal(compareAnnualCost(bad), null);
assert.equal(compareAnnualCost('1000000').annual, 1200000000);
console.log('Plan comparisons: decimals, zero cost, equality and invalid inputs passed.');


const { readFileSync } = await import('node:fs');
const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
assert.ok(html.includes('href="https://app.frontstepsites.com/get-started">Start Launch — $99/yr</a>'));
const section = html.slice(html.indexOf('<section id="plans"'), html.indexOf('</section>', html.indexOf('<section id="plans"')));
assert.ok(section.includes('Both Launch and Grow include four marketing updates per Central calendar month'));
assert.ok(!section.includes('?plan='));
assert.ok(!section.includes('Unlimited requests'));
assert.ok(!section.includes('2 requests/month'));
assert.ok(section.includes('href="#grow-h"'));

const inputTag = section.match(/<input id="current-cost"[^>]*>/)[0];
assert.match(inputTag, / disabled(?: |>)/);
assert.doesNotMatch(inputTag, / name=/);
assert.match(section, /type="submit" disabled>Compare my annual cost/);
