/* Categorise enquiries without analytics cookies or a new collection endpoint. */
(() => {
  const key = 'lumina-enquiry-source-v1';
  const allowedChannels = new Set(['google', 'bing', 'linkedin', 'instagram', 'facebook', 'newsletter', 'referral']);
  const source = new URLSearchParams(location.search).get('utm_source')?.toLowerCase();
  let channel = allowedChannels.has(source) ? source : '';
  if (!channel && document.referrer) {
    try {
      const host = new URL(document.referrer).hostname;
      if (/(^|\.)google\.[a-z.]+$/.test(host)) channel = 'google';
      else if (/(^|\.)bing\.com$/.test(host)) channel = 'bing';
      else if (/(^|\.)linkedin\.com$/.test(host)) channel = 'linkedin';
      else if (host !== location.hostname) channel = 'referral';
    } catch (_) { /* A malformed referrer does not prevent form submission. */ }
  }
  let attribution;
  try { attribution = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch (_) {}
  if (!attribution || channel) {
    attribution = { channel: channel || 'direct-or-unknown', landing: location.pathname };
    try { sessionStorage.setItem(key, JSON.stringify(attribution)); } catch (_) {}
  }
  for (const form of document.querySelectorAll('form[data-formsubmit-ajax="true"]')) {
    for (const [name, value] of Object.entries({ source_channel: attribution.channel, landing_page: attribution.landing })) {
      const field = document.createElement('input');
      field.type = 'hidden'; field.name = name; field.value = value;
      form.append(field);
    }
  }
})();
