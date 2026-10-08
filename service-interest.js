/* Prefill a visitor-chosen service; no network request or storage. */
(() => {
  const code = new URLSearchParams(window.location.search).get('hizmet');
  const en = document.documentElement.lang === 'en';
  const services = {
    web: ['Web sitesi geliştirme', 'Website development'],
    mobil: ['Mobil uygulama geliştirme', 'Mobile app development'],
    yazilim: ['Özel ve bilimsel yazılım', 'Custom and scientific software'],
    otomasyon: ['İş otomasyonu ve AI asistanı', 'Workflow automation and AI assistants'],
    shopify: ['Shopify mağazası kurulumu', 'Shopify store setup'],
    etsy: ['Etsy mağaza danışmanlığı', 'Etsy shop consulting'],
    'etsy-egitimi': ['Uygulamalı Etsy eğitimi', 'Practical Etsy training'],
    seo: ['SEO ve AI arama görünürlüğü', 'SEO and AI search visibility'],
    genel: ['Proje kapsamını belirleme', 'Help defining a project scope']
  };
  const field = document.querySelector('form input[name="hizmet"]');
  if (field && !field.value && Object.prototype.hasOwnProperty.call(services, code)) {
    field.value = services[code][en ? 1 : 0];
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }
})();
