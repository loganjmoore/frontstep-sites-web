const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const { chromium } = require('playwright-core');

(async () => {
  assert.equal(process.env.CI, 'true', 'Hosted validation only');
  const origin = process.env.FRONT_ORIGIN || 'http://127.0.0.1:8799';
  assert.ok(['http://127.0.0.1:8799', 'https://frontstepsites.com', 'https://frontstep-sites.onrender.com'].includes(origin));
  await mkdir('test-results/trades', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true, chromiumSandbox: true });
  try {
    for (const width of [390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => new URL(route.request().url()).origin === origin && route.request().method() === 'GET' ? route.continue() : route.abort());
      assert.equal((await page.goto(`${origin}/blog/`)).status(), 200);
      await page.getByRole('button', { name: 'Keep analytics off', exact: true }).click();
      await page.getByRole('button', { name: 'Keep analytics off', exact: true }).waitFor({ state: 'hidden' });
      for (const trade of ['restaurant', 'roofing', 'salon']) {
        const guide = page.locator(`a[href="/blog/website-${trade}/"]`);
        assert.equal(await guide.count(), 1);
        await guide.focus();
        await page.keyboard.press('Enter');
        await page.waitForURL(`${origin}/blog/website-${trade}/`);
        await page.locator('article h1').waitFor();
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://frontstepsites.com/blog/website-${trade}/`);
        await page.goBack();
      }
      await page.getByRole('link', { name: 'For your trade', exact: true }).click();
      await page.waitForURL(`${origin}/blog/trades/`);
      await page.getByRole('heading', { level: 1, name: 'Website guides by trade', exact: true }).waitFor();
      const links = page.locator('article .hub-list a');
      assert.equal(await links.count(), 19);
      const items = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)).find(item => item['@type'] === 'CollectionPage').hasPart.itemListElement);
      assert.deepEqual(await links.evaluateAll(nodes => nodes.map(node => [node.pathname, node.textContent])), items.map(item => [new URL(item.url).pathname, item.name]));
      for (const link of await links.all()) {
        await link.scrollIntoViewIfNeeded();
        assert.ok(await link.isVisible());
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.getByRole('heading', { level: 1 }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `test-results/trades/directory-${width}.png`, animations: 'disabled' });
      const tree = page.locator('article a[href="/blog/trades/tree-service/"]');
      await tree.focus();
      assert.equal(await tree.evaluate(node => node.matches(':focus-visible') && getComputedStyle(node).outlineStyle !== 'none'), true);
      await page.keyboard.press('Enter');
      await page.waitForURL(`${origin}/blog/trades/tree-service/`);
      await page.locator('article h1').waitFor();
      await page.goBack();
      await page.waitForURL(`${origin}/blog/trades/`);
      assert.equal((await page.goto(`${origin}/blog/structured-data-for-ai-search-what-small-businesses-need/`)).status(), 200);
      const schema = page.locator('article');
      assert.ok((await schema.innerText()).includes('Schema does not guarantee rich results or AI citations.'));
      await schema.getByRole('link', { name: 'local-business schema guide', exact: true }).click();
      await page.waitForURL(`${origin}/blog/local-business-schema-markup-explained-simply/`);
      assert.equal((await page.goto(`${origin}/blog/trade-business-website-examples-8-sections-in-order/`)).status(), 200);
      const example = page.getByRole('link', { name: 'five-section tree service website example', exact: true });
      await example.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `test-results/trades/example-${width}.png`, animations: 'disabled' });
      await example.click();
      await page.waitForURL(`${origin}/blog/trade-website-example-tree-service-five-sections/`);
      await page.locator('article h1').waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.equal((await page.goto(`${origin}/blog/how-to-make-a-google-site/`)).status(), 200);
      const limits = page.locator('#what-you-cannot-do-with-google-sites + ol');
      assert.equal(await limits.locator(':scope > li').count(), 3);
      assert.ok((await limits.innerText()).includes('that does not replace the surrounding Sites layout'));
      await limits.scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await limits.screenshot({ path: `test-results/trades/google-sites-limits-${width}.png`, animations: 'disabled' });
      const domain = limits.locator('a[href="/blog/put-a-google-sites-site-on-your-own-domain/"]');
      await domain.focus(); await page.keyboard.press('Enter');
      await page.waitForURL(`${origin}/blog/put-a-google-sites-site-on-your-own-domain/`);
      await page.locator('article h1').waitFor();
      await page.goBack();
      const alternatives = page.locator('#what-you-cannot-do-with-google-sites + ol + p a');
      await alternatives.focus(); await page.keyboard.press('Enter');
      await page.waitForURL(`${origin}/blog/google-sites-alternatives-for-a-business/`);
      await page.locator('article h1').waitFor();
      for (const slug of ['cleaning-google-business-profile', 'cleaning-local-seo-checklist', 'cleaning-homepage-copy']) {
        await page.goto(`${origin}/blog/`);
        const discover = page.locator(`a[href="/blog/${slug}/"]`);
        assert.equal(await discover.count(), 1);
        await discover.focus(); await page.keyboard.press('Enter');
        await page.waitForURL(`${origin}/blog/${slug}/`);
        await page.locator('article h1').waitFor();
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://frontstepsites.com/blog/${slug}/`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.locator('article h1').scrollIntoViewIfNeeded();
        await page.screenshot({ path: `test-results/trades/${slug}-${width}.png`, animations: 'disabled' });
        await page.goto(`${origin}/blog/trades/cleaning/`);
        const hub = page.locator(`article a[href="/blog/${slug}/"]`);
        assert.equal(await hub.count(), 1);
        await hub.focus(); await page.keyboard.press('Enter');
        await page.waitForURL(`${origin}/blog/${slug}/`);
        await page.locator('article h1').waitFor();
      }
      console.log(`PASS Google Sites limits, keyboard domain/alternative links and all three index/hub cleaning journeys at ${width}px on ${origin}`);
      assert.deepEqual(errors, []);
      console.log(`PASS directory, keyboard hub/Back, schema guidance and example navigation at ${width}px on ${origin}`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
