/* Vendored from seo-command-center/integrations/posthog-web.js.
 * Anonymous, explicit website events via PostHog's capture API. No replay,
 * autocapture, form values, account IDs, URL queries or third-party scripts.
 * Renders no UI: the site's own cookie banner and footer Cookie settings own
 * consent and withdrawal. */
(() => {
  if (window.productAnalytics) return;
  const events = new Set(['$pageview', 'cta_clicked', 'signup_started', 'signup_completed', 'lead_submitted', 'activation_completed', 'checkout_started', 'subscription_started', 'app_store_clicked', 'contact_clicked', 'form_failed', 'resource_completed', 'resource_downloaded']);
  const resourceEvents = new Set(['resource_completed', 'resource_downloaded']);
  let config = null;
  let lastPath = null;
  const controllers = new Set();
  const privateKey = 'website_posthog_identity_v1';
  const sessionKey = 'website_posthog_session_v1';
  // Keep only our opaque campaign token in memory until consent. Never store
  // arbitrary UTM values, a query string, or a visitor-provided identifier.
  const campaignPattern = /^cc_[a-f0-9]{16}$/;
  let landingCampaign = null;
  function publicReferrerDomain(raw) {
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase().replace(/^www\./, '');
      const own = location.hostname.toLowerCase().replace(/^www\./, '');
      if (url.protocol !== 'https:' || url.username || url.password || url.port || host === own || host.endsWith(`.${own}`)
        || host.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)
        || /\.(?:local|localhost|internal|private|test|invalid|example|onion)$/.test(host)) return null;
      return host;
    } catch { return null; }
  }
  // Retain only a public hostname, never a referrer path, query or credentials.
  let landingReferrer = publicReferrerDomain(document.referrer);
  try {
    const candidates = new URL(location.href).searchParams.getAll('utm_campaign');
    if (candidates.length === 1 && campaignPattern.test(candidates[0])) landingCampaign = candidates[0];
  } catch { /* Malformed landing URL has no campaign. */ }
  const cookie = (key) => document.cookie?.split('; ').find((entry) => entry.startsWith(`${key}=`))?.slice(key.length + 1);
  const shared = () => Boolean(config?.sharedDomain && config.sharedDomain === config.product && location.hostname.endsWith(config.product));
  function share(key, value, seconds = 1800) {
    if (shared()) document.cookie = `${key}=${value}; Domain=.${config.product}; Path=/; Max-Age=${seconds}; SameSite=Lax; Secure`;
  }
  const optOut = () => navigator.globalPrivacyControl === true || ['1', 'yes'].includes(navigator.doNotTrack || window.doNotTrack);
  const storedChoice = () => {
    try {
      // Consent comes only from the site's own cookie banner; a site without
      // one never enables capture, including for visitors who accepted the
      // former built-in choices box (it no longer exists to withdraw from).
      if (!config?.consentKey) return null;
      const raw = localStorage.getItem(config.consentKey);
      if (config.consentKind === 'analytics') return raw ? (JSON.parse(raw).analytics === true ? 'accepted' : 'declined') : null;
      return raw === 'accepted' ? 'accepted' : raw ? 'declined' : null;
    } catch { return 'declined'; }
  };
  // SPAs may render a private dashboard at an otherwise public URL. Such sites
  // explicitly opt in each public document; an absent marker denies capture.
  const publicScope = () => config?.requirePublicScope !== true || document.documentElement.getAttribute('data-website-analytics-scope') === 'public';
  const allowed = () => { try { return Boolean(config && publicScope() && !optOut() && storedChoice() === 'accepted' && navigator.webdriver !== true && localStorage.getItem('website_posthog_internal') !== '1'); } catch { return false; } };
  function path() {
    // Public editorial slugs are authored content. Unknown/private app paths
    // deliberately lose their identifiers instead of guessing how to redact.
    const raw = config?.product === 'turfplanner.com' ? location.pathname.replace(/^\/turf(?:planner)?(?=\/|$)/, '') : location.pathname;
    const p = raw.replace(/\/+$/, '') || '/';
    return /^(\/|\/(?:es|en))$/.test(p) || /^\/(?:es\/|en\/)?(?:pricing|features|about|contact|demo|book|get-started|start|plumber|roofer|electrician|cleaner|landscaper|register|signup|sign-up|login|support|privacy|terms|cookies|blog|journal|debt-payoff-calculator|invoice-generator|posthog-privacy)(?:\.html)?$/.test(p) || /^\/(?:es\/|en\/)?(?:blog|journal|guides|glossary|help|compare|services|industries|templates|tools|resources|calculators)\/[a-z0-9-]{1,120}$/.test(p) ? p : '/:private';
  }
  function identity() {
    const now = Date.now();
    let id = shared() ? cookie(privateKey) : localStorage.getItem(privateKey);
    if (!/^[0-9a-f-]{36}$/.test(id || '')) { id = crypto.randomUUID(); localStorage.setItem(privateKey, id); }
    let session;
    try { session = JSON.parse(shared() ? decodeURIComponent(cookie(sessionKey) || 'null') : sessionStorage.getItem(sessionKey)); } catch { /* New session. */ }
    if (!session || !/^[0-9a-f-]{36}$/.test(session.id || '') || !Number.isFinite(session.at) || now - session.at >= 30 * 60_000) {
      session = { id: crypto.randomUUID(), ...(landingCampaign ? { campaign: landingCampaign } : {}), ...(landingReferrer ? { referrerDomain: landingReferrer } : {}) };
      landingReferrer = null;
      landingCampaign = null;
    }
    if (!campaignPattern.test(session.campaign || '')) delete session.campaign;
    if (!session.referrerDomain || publicReferrerDomain(`https://${session.referrerDomain}/`) !== session.referrerDomain) delete session.referrerDomain;
    session.at = now;
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    share(privateKey, id, 180 * 86400);
    share(sessionKey, encodeURIComponent(JSON.stringify(session)));
    return { id, session: session.id, campaign: session.campaign, referrerDomain: session.referrerDomain };
  }
  function channel() {
    try {
      const host = new URL(document.referrer).hostname;
      if (host.replace(/^www\./, '') === config.product) return 'internal';
      if (/(^|\.)(google\.[a-z.]+|bing.com|duckduckgo.com|yahoo.com)$/.test(host)) return 'search';
      if (/(^|\.)(facebook.com|instagram.com|linkedin.com|t.co|x.com|reddit.com)$/.test(host)) return 'social';
      return 'other';
    } catch { return 'direct'; }
  }
  function capture(name, target) {
    if (!events.has(name)) return false;
    if (!allowed()) { if (config) reset(publicScope() && storedChoice() === null && !optOut()); return false; }
    try {
      const safePath = path();
      if ((config.publicOnly || resourceEvents.has(name)) && safePath === '/:private') return false;
      const visitor = identity();
      const device = innerWidth < 768 ? 'mobile' : innerWidth < 1024 ? 'tablet' : 'desktop';
      const controller = new AbortController();
      controllers.add(controller);
      const timer = setTimeout(() => controller.abort(), 5000);
      fetch(`${config.host}/i/v0/e/`, {
        method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true, signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: config.key, event: name, distinct_id: visitor.id, timestamp: new Date().toISOString(), properties: {
          $process_person_profile: false, $session_id: visitor.session,
          product: config.product, surface: config.surface, environment: 'production', schema_version: 1,
          release: /^[a-f0-9]{7,40}$/.test(config.release || '') ? config.release : 'unknown',
          page_path: safePath, $pathname: safePath, $host: config.product, $current_url: `https://${config.product}${safePath}`,
          device, channel: channel(), language: ['en', 'es'].includes(document.documentElement.lang) ? document.documentElement.lang : 'other',
          ...(visitor.campaign ? { campaign: visitor.campaign } : {}),
          ...(visitor.referrerDomain ? { referrer_domain: visitor.referrerDomain } : {}),
          ...(['signup', 'pricing', 'contact', 'demo', 'app_store'].includes(target) ? { target } : {}),
        } }),
      }).catch(() => {}).finally(() => { clearTimeout(timer); controllers.delete(controller); });
      return true;
    } catch { return false; } // Storage/crypto/network must never break a user action.
  }
  function reset(preserveLandingCampaign = false) {
    for (const controller of controllers) controller.abort();
    try { localStorage.removeItem(privateKey); sessionStorage.removeItem(sessionKey); } catch { /* Storage unavailable. */ }
    share(privateKey, '', 0); share(sessionKey, '', 0);
    lastPath = null;
    if (preserveLandingCampaign !== true) { landingCampaign = null; landingReferrer = null; }
  }
  function pageview() {
    if (!allowed()) { reset(publicScope() && storedChoice() === null && !optOut()); return; }
    const p = path();
    if (p === lastPath) return;
    if (capture('$pageview')) {
      lastPath = p;
      if (/\/(register|signup|sign-up)$/.test(p)) capture('signup_started');
    }
  }
  function refresh() { if (allowed()) pageview(); else reset(publicScope() && storedChoice() === null && !optOut()); }
  window.productAnalytics = { capture: (name) => capture(name), reset, refresh };
  window.addEventListener('website:analytics-consent', refresh);
  window.addEventListener('venuebill:consent-updated', refresh);
  window.addEventListener('storage', refresh);
  window.addEventListener('website:analytics-event', (e) => capture(e.detail?.name));
  window.addEventListener('website:analytics-reset', reset);
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function (...args) { const result = original.apply(this, args); pageview(); return result; };
  }
  window.addEventListener('popstate', pageview);
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    try {
      const url = new URL(link.href, location.href);
      const store = url.hostname === 'apps.apple.com';
      const sameProduct = (config?.hosts || [config?.product, `www.${config?.product}`]).includes(url.hostname);
      const contact = url.protocol === 'mailto:' || url.protocol === 'tel:';
      const target = store ? 'app_store' : contact ? 'contact' : sameProduct ? /\/(register|signup|sign-up|get-started)/.test(url.pathname) ? 'signup' : /\/pricing/.test(url.pathname) || url.hash === '#pricing' ? 'pricing' : /\/contact/.test(url.pathname) || url.hash === '#contact' ? 'contact' : /\/(demo|book)/.test(url.pathname) ? 'demo' : null : null;
      if (target) { capture('cta_clicked', target); if (store) capture('app_store_clicked'); if (contact) capture('contact_clicked'); }
    } catch { /* Not an analytics target. */ }
  });
  async function boot() {
    try {
      const response = await fetch('/posthog-config.json', { credentials: 'omit', signal: AbortSignal.timeout(5000) });
      if (!response.ok) return;
      const value = await response.json();
      if (!/^phc_[a-zA-Z0-9_-]+$/.test(value.key || '') || !['https://us.i.posthog.com', 'https://eu.i.posthog.com'].includes(value.host) || !/^[a-z0-9.-]+$/.test(value.product || '') || value.product === 'pancakebudget.com' || !(value.hosts || [value.product, `www.${value.product}`]).includes(location.hostname) || !['marketing', 'web_app'].includes(value.surface)) return;
      config = value;
      window.websitePosthogConfigured = true;
      window.dispatchEvent(new Event('website:analytics-ready'));
      pageview();
    } catch { /* Missing configuration leaves analytics off. */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
