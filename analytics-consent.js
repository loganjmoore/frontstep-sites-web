(() => {
  if (window.frontStepAnalyticsConsent) return;
  const key = 'frontstep_analytics_consent';
  const privacySignal = () => navigator.globalPrivacyControl === true || ['1', 'yes'].includes(navigator.doNotTrack || window.doNotTrack);
  const choice = () => { try { return localStorage.getItem(key); } catch { return null; } };
  const notify = () => window.dispatchEvent(new Event('website:analytics-consent'));

  function save(value) {
    try { localStorage.setItem(key, value); } catch { /* Analytics remains off when storage is unavailable. */ }
    notify();
    render(false);
  }

  function render(open = choice() === null) {
    const panel = document.getElementById('analytics-consent-panel');
    if (!panel) return;
    const signal = privacySignal();
    panel.hidden = !open;
    panel.querySelector('[data-consent-status]').textContent = signal
      ? 'Your browser privacy signal keeps analytics off.'
      : choice() === 'accepted' ? 'Anonymous analytics are allowed.' : choice() === 'declined' ? 'Anonymous analytics are off.' : '';
    panel.querySelector('[data-consent-accept]').disabled = signal;
  }

  function mount() {
    const style = document.createElement('style');
    style.textContent = '.analytics-settings{position:fixed;z-index:9998;right:16px;bottom:16px;min-height:42px;padding:8px 12px;border:1.5px solid #111312;border-radius:3px;background:#fff;color:#111312;font:700 14px/1.2 "Archivo",Arial,sans-serif;cursor:pointer}.analytics-settings:hover{box-shadow:0 3px 0 #5d6563}.analytics-consent{position:fixed;z-index:9999;right:16px;bottom:70px;width:min(390px,calc(100% - 32px));padding:18px;border:1.5px solid #111312;border-radius:3px;background:#fff;color:#111312;box-shadow:0 5px 0 rgba(17,19,18,.22);font:16px/1.5 "Archivo",Arial,sans-serif}.analytics-consent[hidden]{display:none}.analytics-consent strong{display:block;margin-bottom:5px;font-size:18px}.analytics-consent p{margin:0 0 12px}.analytics-consent small{display:block;margin-top:10px;color:#474d4b}.analytics-consent-actions{display:flex;flex-wrap:wrap;gap:8px}.analytics-consent button{min-height:42px;padding:8px 12px;border:1.5px solid #111312;border-radius:3px;background:#111312;color:#ffd60a;font:700 14px/1.2 "Archivo",Arial,sans-serif;cursor:pointer}.analytics-consent button+button{background:#fff;color:#111312}.analytics-consent button:disabled{cursor:not-allowed;opacity:.55}.analytics-consent a{color:inherit}.analytics-settings:focus-visible,.analytics-consent button:focus-visible,.analytics-consent a:focus-visible{outline:3px solid #111312;outline-offset:2px;box-shadow:0 0 0 7px #ffd60a}@media(max-width:480px){.analytics-settings{right:10px;bottom:10px}.analytics-consent{right:10px;bottom:62px;width:calc(100% - 20px)}}';
    document.head.append(style);

    const settings = document.createElement('button');
    settings.type = 'button';
    settings.className = 'analytics-settings';
    settings.textContent = 'Cookie settings';
    settings.setAttribute('aria-controls', 'analytics-consent-panel');

    const panel = document.createElement('section');
    panel.id = 'analytics-consent-panel';
    panel.className = 'analytics-consent';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'analytics-consent-title');
    panel.innerHTML = '<strong id="analytics-consent-title">Anonymous site analytics</strong><p>May we measure page visits and which signup links people use? We do not send form entries or replay your visit. <a href="/privacy/">Privacy details</a>.</p><div class="analytics-consent-actions"><button type="button" data-consent-accept>Allow analytics</button><button type="button" data-consent-decline>Keep analytics off</button></div><small data-consent-status aria-live="polite"></small>';
    settings.addEventListener('click', () => render(panel.hidden));
    panel.querySelector('[data-consent-accept]').addEventListener('click', () => save('accepted'));
    panel.querySelector('[data-consent-decline]').addEventListener('click', () => save('declined'));
    document.body.append(panel, settings);
    render();
  }

  window.frontStepAnalyticsConsent = { key, choice, open: () => render(true) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
