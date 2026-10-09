import { test } from 'node:test';
import assert from 'node:assert/strict';
import { starterWebsite, aiWebsiteBrief } from '../../assets/website-resources.mjs';
const sample = { businessName:'Example Tree Care', trade:'Tree care', city:'Tulsa', state:'ok', contact:'202-555-0123', services:'Tree pruning\nStorm cleanup' };
test('starter is a standalone accessible HTML file with the actual business facts and working contact link', () => {
 const html = starterWebsite(sample);
 assert.match(html, /^<!doctype html>/); assert.match(html, /<meta name="viewport"/); assert.match(html, /<h1>Tree care in Tulsa<\/h1>/);
 assert.match(html, /href="tel:2025550123"/); assert.match(html, /<li>Storm cleanup<\/li>/);
 assert.doesNotMatch(html, /<script|<iframe|<form|https?:\/\//); assert.match(html, /no tracking/);
});
test('email contacts work, hostile entered markup remains text, and local output never invents business claims', () => {
 const html = starterWebsite({ ...sample, contact:'hello@example.com', businessName:'<script>alert(1)</script>' });
 assert.match(html, /href="mailto:hello@example.com"/); assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script/);
 assert.doesNotMatch(html, /five.star|licensed|insured|guaranteed|testimonial/i);
});
test('invalid/oversize/control-character inputs and too many services produce no artifact', () => {
 for (const raw of [{...sample,businessName:'   '},{...sample,state:'O'},{...sample,contact:'javascript:alert(1)'},{...sample,contact:'12'},{...sample,services:'x\n'.repeat(9)},{...sample,services:'x'.repeat(1001)},{...sample,city:'x\u0000'}]) assert.throws(() => starterWebsite(raw));
 assert.doesNotThrow(() => starterWebsite({...sample,businessName:'x'.repeat(80),services:'x'.repeat(150)}));
});
test('brief follows the real intake names, distinguishes missing phone, and makes AI/publication limits explicit', () => {
 const brief = JSON.parse(aiWebsiteBrief({...sample,contact:'hello@example.com'}));
 assert.deepEqual(brief.answers,{ businessName:sample.businessName,trade:sample.trade,city:sample.city,state:'OK',phone:'',email:'hello@example.com',services:sample.services });
 assert.equal(brief.missingForFrontStepIntake.length,1); assert.match(brief.limitations,/No AI provider is called/); assert.match(brief.instructions.join(' '),/Do not invent reviews/);
 assert.equal(JSON.parse(aiWebsiteBrief(sample)).missingForFrontStepIntake.length,0);
});
