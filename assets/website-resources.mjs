const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export function websiteAnswers(raw) {
  const fields = {};
  for (const [key, max] of Object.entries({ businessName: 80, trade: 80, city: 100, state: 2, contact: 254, services: 1000 })) {
    const value = String(raw[key] ?? '').trim();
    if (!value || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error(`Check ${key === 'businessName' ? 'business name' : key}: enter up to ${max} characters.`);
    fields[key] = value;
  }
  if (!/^[a-z]{2}$/i.test(fields.state)) throw new Error('Enter a two-letter state abbreviation.');
  fields.state = fields.state.toUpperCase();
  fields.services = fields.services.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (!fields.services.length || fields.services.length > 8 || fields.services.some(s => s.length > 150)) throw new Error('Enter one to eight services, one per line, up to 150 characters each.');
  const email = /^[^\s@<>"'\r\n]+@[^\s@<>"'\r\n]+\.[a-z]{2,}$/i.test(fields.contact);
  const phone = /^[+()\d .-]{7,30}$/.test(fields.contact) && fields.contact.replace(/\D/g, '').length >= 7;
  if (!email && !phone) throw new Error('Enter a valid customer phone number or email address.');
  fields.contactHref = email ? `mailto:${fields.contact}` : `tel:${fields.contact.replace(/[^+\d]/g, '')}`;
  fields.phone = phone ? fields.contact : '';
  fields.email = email ? fields.contact : '';
  return fields;
}
export function starterWebsite(raw) {
  const a = websiteAnswers(raw), title = `${a.businessName} | ${a.trade} in ${a.city}, ${a.state}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(a.businessName)}: ${escape(a.trade)} in ${escape(a.city)}, ${escape(a.state)}."><style>body{margin:0;background:#faf7f0;color:#20241e;font:18px/1.6 system-ui,sans-serif}header,main,footer{max-width:900px;margin:auto;padding:28px 24px}header{border-bottom:1px solid #b9b7aa}h1{font-size:clamp(2rem,6vw,3.5rem);line-height:1.1;max-width:20ch}h2{margin-top:2.5rem}a{color:#20241e}header a,.contact{display:inline-block;padding:12px 18px;background:#f4d55c;border:2px solid #20241e;text-decoration:none;font-weight:700}li{margin:.5rem 0}footer{border-top:1px solid #b9b7aa;font-size:15px}:focus-visible{outline:3px solid #17493b;outline-offset:4px}</style></head><body><header><strong>${escape(a.businessName)}</strong></header><main><h1>${escape(a.trade)} in ${escape(a.city)}</h1><p>${escape(a.businessName)} serves ${escape(a.city)}, ${escape(a.state)}.</p><a class="contact" href="${escape(a.contactHref)}">Contact ${escape(a.businessName)}</a><section aria-labelledby="services"><h2 id="services">Services</h2><ul>${a.services.map(s => `<li>${escape(s)}</li>`).join('')}</ul></section><section aria-labelledby="contact"><h2 id="contact">Get in touch</h2><p>Ask about service availability and pricing.</p><p><a href="${escape(a.contactHref)}">${escape(a.contact)}</a></p></section></main><footer><p>Starter website. Confirm all details, add your own approved photos and policies, and arrange hosting before publishing. This file has no tracking, contact-form processing, booking or payment features.</p></footer></body></html>`;
}
export function aiWebsiteBrief(raw) {
  const a = websiteAnswers(raw);
  const answers = { businessName:a.businessName, trade:a.trade, city:a.city, state:a.state, phone:a.phone, email:a.email, services:a.services.join('\n') };
  return JSON.stringify({ purpose:'Website brief to review before giving it to an AI builder or a website provider', answers,
    pagePlan:[ 'Homepage: explain the supplied trade and service area, with the supplied contact link.', 'Services: describe each supplied service without inventing prices or qualifications.', 'About: ask for owner-approved experience and photographs.', 'Contact: repeat the verified phone or email; ask for opening hours before showing them.' ],
    instructions:[ 'Use only the supplied business facts. Ask before filling any missing facts.', 'Build accessible, responsive HTML with descriptive headings and a working contact link.', 'Do not invent reviews, qualifications, prices, opening hours, guarantees or service areas.', 'Do not embed external trackers or publish the result without owner review.', 'Flag contact forms, booking and payment integrations as separate work; a visual form does not send inquiries.' ],
    reviewBeforePublishing:[ 'Check phone/email, services and service area.', 'Test keyboard, narrow-screen and contact-link behavior.', 'Add approved photos, policies and hosting; review every generated claim.' ],
    missingForFrontStepIntake:a.phone ? [] : ['Add a customer phone number to the existing FrontStep questionnaire.'],
    limitations:'This is a locally generated brief, not AI-generated content or a published website. No AI provider is called. FrontStep builds require the existing sign-in and active-plan flow.' }, null, 2);
}
function mount(root) {
  const form = root.querySelector('form'), output = root.querySelector('[data-resource-output]'), code = root.querySelector('pre'), error = root.querySelector('[data-resource-error]'), download = root.querySelector('[data-resource-download]');
  const mode = root.dataset.websiteResource;
  let preview = root.querySelector('iframe');
  let artifact = null;
  form.addEventListener('input', () => { artifact = null; download.disabled = true; output.hidden = true; error.textContent = ''; });
  form.addEventListener('submit', event => {
    event.preventDefault(); window.productAnalytics?.capture('cta_clicked'); artifact = null; download.disabled = true; output.hidden = true;
    try {
      const raw = Object.fromEntries(new FormData(form)), content = mode === 'starter' ? starterWebsite(raw) : aiWebsiteBrief(raw);
      artifact = content; output.hidden = false;
      if (preview && preview.srcdoc !== content) {
        const freshPreview = preview.cloneNode(false);
        freshPreview.srcdoc = content;
        preview.replaceWith(freshPreview);
        preview = freshPreview;
      }
      if (code) {
        code.textContent = content;
        const brief = JSON.parse(content), summary = root.querySelector('[data-brief-summary]');
        const title = document.createElement('p'), contact = document.createElement('p'), services = document.createElement('ul'), list = document.createElement('ul');
        title.textContent = `${brief.answers.businessName}: ${brief.answers.trade} in ${brief.answers.city}, ${brief.answers.state}.`;
        contact.textContent = `Customer contact: ${brief.answers.phone || brief.answers.email}`;
        for (const service of brief.answers.services.split('\n')) { const item = document.createElement('li'); item.textContent = service; services.append(item); }
        for (const step of brief.pagePlan) { const item = document.createElement('li'); item.textContent = step; list.append(item); }
        summary.replaceChildren(title, contact, services, list);
      }
      error.textContent = ''; output.hidden = false; download.disabled = false; output.focus();
      window.productAnalytics?.capture('resource_completed');
    } catch (e) { error.textContent = e.message; error.focus(); }
  });
  download.addEventListener('click', () => {
    if (!artifact) return;
    try {
      const url = URL.createObjectURL(new Blob([artifact], {type: mode === 'starter' ? 'text/html;charset=utf-8' : 'application/json;charset=utf-8'}));
      const link = document.createElement('a'); link.href = url; link.download = mode === 'starter' ? 'website-starter.html' : 'website-brief.json';
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      window.productAnalytics?.capture('resource_downloaded');
    } catch { error.textContent = 'The download could not start. Your result is still here; try again.'; error.focus(); }
  });
}
if (typeof document !== 'undefined') document.querySelectorAll('[data-website-resource]').forEach(mount);
