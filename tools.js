const formatTry = (value) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const formatNumber = (value, digits = 1) =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

const getNumericValue = (id) => Number(document.getElementById(id)?.value || 0);
const getValue = (id) => document.getElementById(id)?.value || "";

const shorteners = new Set([
  "bit.ly",
  "t.co",
  "tinyurl.com",
  "ow.ly",
  "buff.ly",
  "cutt.ly",
  "is.gd",
  "rebrand.ly",
  "shorturl.at",
]);

const isIpAddress = (hostname) => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
const containsSuspiciousChars = (hostname) => /[^a-zA-Z0-9.-]/.test(hostname);

const renderToolResult = ({
  container,
  summaryLabel,
  summaryValue,
  summaryClass,
  intro,
  metrics = [],
  visibleTitle,
  visibleItems = [],
  lockedTitle,
  lockedItems = [],
  ctaLabel,
  ctaText,
  ctaHref,
}) => {
  if (!container) {
    return;
  }

  const safeVisibleItems = visibleItems.length ? visibleItems : ["Bu katmanda ek bir sinyal bulunmuyor."];
  const safeLockedItems = lockedItems.length ? lockedItems : ["Detaylı analiz katmanı uzman incelemede açılır."];

  const metricsHtml = metrics
    .map(
      (metric) => `
        <article class="tool-metric">
          <small>${metric.label}</small>
          <strong>${metric.value}</strong>
        </article>
      `
    )
    .join("");

  const visibleHtml = safeVisibleItems.map((item) => `<li>${item}</li>`).join("");
  const lockedHtml = safeLockedItems.map((item) => `<li>${item}</li>`).join("");

  container.classList.remove("hidden");
  container.innerHTML = `
    <div class="tool-result-summary ${summaryClass}">
      <span>${summaryLabel}</span>
      <strong>${summaryValue}</strong>
    </div>
    <p class="tool-result-intro">${intro}</p>
    <div class="tool-result-metrics">${metricsHtml}</div>
    <div class="tool-result-columns">
      <section class="tool-result-panel">
        <h3>${visibleTitle}</h3>
        <ul class="tool-result-list">${visibleHtml}</ul>
      </section>
      <section class="tool-result-panel tool-result-panel-locked">
        <div class="tool-result-blur">
          <h3>${lockedTitle}</h3>
          <ul class="tool-result-list">${lockedHtml}</ul>
        </div>
        <div class="tool-result-cta">
          <p class="tool-result-cta-label">${ctaLabel}</p>
          <p>${ctaText}</p>
          <a class="btn btn-primary" href="${ctaHref}">Detaylı Analizi Aç</a>
        </div>
      </section>
    </div>
  `;
};

const getRoasState = () => {
  const revenue = getNumericValue("roasRevenue");
  const adSpend = getNumericValue("roasAdSpend");
  const cogs = getNumericValue("roasCogs");
  const shipping = getNumericValue("roasShipping");
  const feeRate = getNumericValue("roasFees");
  const returnRate = getNumericValue("roasReturns");
  const fixed = getNumericValue("roasFixed");

  if (revenue <= 0 || adSpend <= 0) {
    return null;
  }

  const returnLoss = revenue * (returnRate / 100);
  const netRevenue = revenue - returnLoss;
  const fees = revenue * (feeRate / 100);
  const contributionBeforeAds = netRevenue - cogs - shipping - fees - fixed;
  const netProfit = contributionBeforeAds - adSpend;
  const actualRoas = revenue / adSpend;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const breakevenRoas = contributionBeforeAds > 0 ? revenue / contributionBeforeAds : 0;
  const maxCpa = contributionBeforeAds > 0 ? contributionBeforeAds / Math.max(revenue / 1000, 1) : 0;

  const leaks = [
    { label: "Ürün maliyeti", value: cogs },
    { label: "Reklam harcaması", value: adSpend },
    { label: "Kargo / operasyon", value: shipping },
    { label: "Komisyon", value: fees },
    { label: "İade kaybı", value: returnLoss },
    { label: "Sabit gider", value: fixed },
  ]
    .sort((left, right) => right.value - left.value)
    .slice(0, 3);

  const visibleNotes = [];
  if (netProfit < 0) {
    visibleNotes.push("Net tabloda zarar görünür. Yüksek ROAS tek başına sağlıklı görünüm vermiyor.");
  } else {
    visibleNotes.push("Net tabloda kâr kalıyor. Ölçekleme öncesi marjı korumak kritik.");
  }

  if (margin < 8) {
    visibleNotes.push("Kâr marjı dar. Reklam büyürken küçük sapmalar bile kârlılığı silebilir.");
  } else if (margin < 18) {
    visibleNotes.push("Marj orta seviyede. Kanal bazlı optimizasyonla rahatlama alanı var.");
  } else {
    visibleNotes.push("Marj güvenli bölgede. Bütçe artışı için kontrol listesiyle ilerlemek mantıklı.");
  }

  if (actualRoas < 2) {
    visibleNotes.push("ROAS düşük. Teklif, kreatif ve ürün katkı payı birlikte ele alınmalı.");
  } else if (actualRoas < 3.5) {
    visibleNotes.push("ROAS fena değil ama maliyet tarafı sıkı yönetilmezse kâr kolay erir.");
  } else {
    visibleNotes.push("ROAS güçlü görünüyor. Asıl soru bunun sürdürülebilir kâr üretip üretmediği.");
  }

  const advancedNotes = [
    `Başabaş ROAS eşiği yaklaşık ${formatNumber(breakevenRoas, 2)}. Bunun altına düşen kampanya kârlılığı hızla aşındırır.`,
    `Maksimum güvenli edinme baskısı yaklaşık ${formatTry(maxCpa)} seviyesinde. Kanal bazlı CPO bundan sapıyorsa bütçe revizyonu gerekir.`,
    `En büyük kâr sızıntıları: ${leaks.map((item) => `${item.label} (${formatTry(item.value)})`).join(", ")}.`,
    margin < 10
      ? "Ölçekleme yerine önce teklif, ürün sepeti ve operasyon maliyetlerini optimize etmeniz gerekir."
      : "Ölçekleme mümkün, ancak kanal bazlı kârlılık kırılımı ve iade etkisiyle birlikte izlenmelidir.",
    returnRate > 5
      ? "İade oranı yükselmiş görünüyor. Kreatif vaatleri ve ürün sayfası beklentisini hizalamak kritik."
      : "İade tarafı şu an kontrol altında; asıl baskı reklam veya ürün maliyetinde yoğunlaşıyor.",
  ];

  return {
    summaryClass: netProfit >= 0 ? "is-good" : "is-alert",
    summaryValue: netProfit >= 0 ? "Kârlılık var" : "Kritik kâr baskısı",
    intro: `Ciro ${formatTry(revenue)}, reklam harcaması ${formatTry(adSpend)} ve tüm temel giderler birlikte ele alındığında net sonuç ${formatTry(netProfit)} çıkıyor.`,
    metrics: [
      { label: "Gerçekleşen ROAS", value: formatNumber(actualRoas, 2) },
      { label: "Net kâr", value: formatTry(netProfit) },
      { label: "Kâr marjı", value: `%${formatNumber(margin, 1)}` },
    ],
    visibleItems: visibleNotes,
    lockedItems: advancedNotes,
  };
};

const analyzeRoas = () => {
  const result = document.getElementById("roasResult");
  const state = getRoasState();

  if (!state) {
    renderToolResult({
      container: result,
      summaryLabel: "Durum",
      summaryValue: "Veri bekleniyor",
      summaryClass: "is-mid",
      intro: "En az aylık ciro ve reklam harcaması değerlerini girin. Diğer alanlar sonucu daha doğru hale getirir.",
      metrics: [],
      visibleTitle: "Gerekenler",
      visibleItems: ["Aylık ciro girin.", "Aylık reklam harcaması girin.", "Mümkünse ürün maliyeti ve komisyonu ekleyin."],
      lockedTitle: "Kilitli içgörüler",
      lockedItems: ["Başabaş ROAS", "Kanal bazlı ölçekleme kararı", "Kâr sızıntısı analizi"],
      ctaLabel: "Lumina Danışmanlık",
      ctaText: "Veri girdikten sonra bu bölüm kârlılık yorumunu açar.",
      ctaHref: "index.html#iletisim",
    });
    return;
  }

  renderToolResult({
    container: result,
    summaryLabel: "Ön karar",
    summaryValue: state.summaryValue,
    summaryClass: state.summaryClass,
    intro: state.intro,
    metrics: state.metrics,
    visibleTitle: "Açık sonuçlar",
    visibleItems: state.visibleItems,
    lockedTitle: "Kilitli stratejik katman",
    lockedItems: state.lockedItems,
    ctaLabel: "E-Ticaret Danışmanlığı",
    ctaText: "Bu analizin tam sürümünde kampanya ve ürün kârlılık katmanını birlikte açıyoruz.",
    ctaHref: "index.html#iletisim",
  });
};

const getSeoState = () => {
  const rawDomain = getValue("seoDomain").trim();
  const loadTime = getNumericValue("seoLoadTime");
  const indexedPages = getNumericValue("seoIndexedPages");
  const brokenPages = getNumericValue("seoBrokenPages");
  const titleCoverage = getNumericValue("seoTitleCoverage");
  const schema = getValue("seoSchema");
  const gsc = getValue("seoGsc");
  const https = getValue("seoHttps");

  if (!rawDomain || loadTime <= 0) {
    return null;
  }

  let hostname = rawDomain;
  try {
    const normalized = /^https?:\/\//i.test(rawDomain) ? rawDomain : `https://${rawDomain}`;
    hostname = new URL(normalized).hostname;
  } catch (_error) {
    hostname = rawDomain.replace(/^https?:\/\//i, "").split("/")[0];
  }

  let score = 100;
  const visibleNotes = [];
  const criticalIssues = [];

  if (loadTime > 5) {
    score -= 28;
    criticalIssues.push("Mobil yüklenme süresi 5 saniyenin üstünde. Bu durum hem sıralama hem dönüşüm tarafını zorluyor.");
  } else if (loadTime > 3.5) {
    score -= 14;
    visibleNotes.push("Mobil hız iyileştirmeye açık. 3.5 saniye üstü kullanıcı kaybını artırır.");
  } else {
    visibleNotes.push("Mobil hız temel eşik içinde görünüyor.");
  }

  if (indexedPages < 10) {
    score -= 16;
    criticalIssues.push("İndeksli sayfa görünürlüğü zayıf. İçerik ve teknik keşif akışı yeniden ele alınmalı.");
  } else {
    visibleNotes.push(`İndeks tarafında en az ${formatNumber(indexedPages, 0)} sayfalık görünürlük sinyali var.`);
  }

  if (brokenPages > 5) {
    score -= 16;
    criticalIssues.push("Kırık sayfa veya hata sayısı yüksek. Tarama bütçesi ve güven sinyali bu noktada zayıflar.");
  } else if (brokenPages > 0) {
    score -= 8;
    visibleNotes.push("Birkaç hata sayfası tespit edilmiş. Kullanıcı akışı ve yönlendirme kontrolü gerekli.");
  }

  if (titleCoverage < 70) {
    score -= 18;
    criticalIssues.push("Başlık ve meta kapsama oranı düşük. Arama görünürlüğü sistematik biçimde kaçıyor.");
  } else if (titleCoverage < 90) {
    score -= 8;
    visibleNotes.push("Başlık/meta kapsaması orta seviyede. Şablon düzeni toparlanırsa hızlı kazanım gelir.");
  } else {
    visibleNotes.push("Başlık/meta kapsaması güçlü görünüyor.");
  }

  if (schema === "none") {
    score -= 10;
    criticalIssues.push("Schema kullanımı yok. SERP görünürlüğü için yapısal veri katmanı eksik.");
  } else if (schema === "partial") {
    score -= 4;
    visibleNotes.push("Schema kısmi. Kritik sayfalarda genişletme alanı var.");
  }

  if (gsc === "no") {
    score -= 8;
    criticalIssues.push("Google Search Console aktif görünmüyor. Teknik karar için veri tabanı eksik kalır.");
  }

  if (https === "no") {
    score -= 22;
    criticalIssues.push("HTTPS aktif değil. Bu doğrudan güven ve SEO problemi yaratır.");
  }

  if (hostname.includes("-")) {
    visibleNotes.push("Alan adında tire kullanımı var. Markalaşma ve hatırlanabilirlik tarafı ayrıca değerlendirilmeli.");
  }

  if (hostname.split(".").length > 3) {
    visibleNotes.push("Alt alan yapısı karmaşık görünüyor. Teknik yönlendirme zinciri kontrol edilmeli.");
  }

  score = Math.max(12, Math.min(100, score));

  const summaryValue = score >= 80 ? "Sağlam temel" : score >= 55 ? "Geliştirilebilir yapı" : "Teknik açıklar yüksek";
  const summaryClass = score >= 80 ? "is-good" : score >= 55 ? "is-mid" : "is-alert";

  while (criticalIssues.length < 5) {
    criticalIssues.push("Derin audit katmanında açılan ek teknik kontroller burada blur ile gizlenir.");
  }

  return {
    summaryValue,
    summaryClass,
    intro: `${hostname} için oluşturulan teknik hazırlık skoru ${formatNumber(score, 0)}/100 seviyesinde. Bu skor doğrudan tarama, hız ve görünürlük sinyallerinin birleşimidir.`,
    metrics: [
      { label: "SEO hazırlık skoru", value: `${formatNumber(score, 0)} / 100` },
      { label: "Mobil yüklenme", value: `${formatNumber(loadTime, 1)} sn` },
      { label: "Meta kapsama", value: `%${formatNumber(titleCoverage, 0)}` },
    ],
    visibleItems: visibleNotes.slice(0, 3),
    lockedItems: criticalIssues.slice(0, 5),
  };
};

const analyzeSeo = () => {
  const result = document.getElementById("seoResult");
  const state = getSeoState();

  if (!state) {
    renderToolResult({
      container: result,
      summaryLabel: "Durum",
      summaryValue: "Analiz için veri bekleniyor",
      summaryClass: "is-mid",
      intro: "En az site adresi ve mobil yüklenme süresi alanlarını doldurun. Diğer alanlar teknik önceliklendirmeyi keskinleştirir.",
      metrics: [],
      visibleTitle: "Bu araç ne yapar?",
      visibleItems: ["Teknik SEO hazırlık skoru üretir.", "Hız ve kapsama açıklarını işaret eder.", "Audit öncesi öncelik alanı çıkarır."],
      lockedTitle: "Kilitli audit katmanı",
      lockedItems: ["Kritik 5 teknik hata", "Sayfa tipi bazlı öncelik sırası", "İlk 30 günlük audit yol haritası"],
      ctaLabel: "SEO Danışmanlığı",
      ctaText: "Site verisini girdikten sonra kritik açık listesi ve audit CTA'sı açılır.",
      ctaHref: "index.html#iletisim",
    });
    return;
  }

  renderToolResult({
    container: result,
    summaryLabel: "Teknik görünüm",
    summaryValue: state.summaryValue,
    summaryClass: state.summaryClass,
    intro: state.intro,
    metrics: state.metrics,
    visibleTitle: "Açık görünen sinyaller",
    visibleItems: state.visibleItems,
    lockedTitle: "Blur altında kalan kritik 5 hata",
    lockedItems: state.lockedItems,
    ctaLabel: "SEO Audit / Teknik Danışmanlık",
    ctaText: "Tam teknik audit ile bu açıkların sıralama ve dönüşüm etkisini birlikte netleştiriyoruz.",
    ctaHref: "index.html#iletisim",
  });
};

const getAcademyState = () => {
  const values = [
    getNumericValue("academyStoreStage"),
    getNumericValue("academyAds"),
    getNumericValue("academyAnalytics"),
    getNumericValue("academyCreative"),
    getNumericValue("academyCatalog"),
    getNumericValue("academyConsistency"),
  ];

  const score = values.reduce((total, value) => total + value, 0);

  let level = "";
  let summaryClass = "";
  let nextTrack = "";

  if (score <= 8) {
    level = "Temel seviye";
    summaryClass = "is-alert";
    nextTrack = "Önce temel mağaza ve reklam mantığı oturmalı.";
  } else if (score <= 16) {
    level = "Gelişen seviye";
    summaryClass = "is-mid";
    nextTrack = "Sistem kurulduktan sonra ölçüm ve kreatif tekrarına geçilmesi gerekir.";
  } else {
    level = "Uygulayan seviye";
    summaryClass = "is-good";
    nextTrack = "İleri modülde rapor okuma, optimizasyon ve ölçekleme katmanı açılabilir.";
  }

  const gaps = [];
  if (values[0] <= 2) gaps.push("Mağaza veya proje temeli");
  if (values[1] <= 2) gaps.push("Reklam paneli ve kampanya kurgusu");
  if (values[2] <= 2) gaps.push("Ölçümleme ve rapor okuma");
  if (values[3] <= 2) gaps.push("Kreatif üretim ve test sistemi");
  if (values[4] <= 2) gaps.push("Ürün / katalog düzeni");
  if (values[5] <= 2) gaps.push("Haftalık uygulama disiplini");

  while (gaps.length < 3) {
    gaps.push("Bir üst seviyede optimizasyon modülü");
  }

  const strengths = [];
  if (values[0] >= 4) strengths.push("Mağaza veya operasyon temeliniz hazır.");
  if (values[1] >= 4) strengths.push("Reklam panelinde temel kararları okuyabiliyorsunuz.");
  if (values[2] >= 4) strengths.push("Metrik okuma farkındalığınız oluşmuş.");
  if (values[3] >= 4) strengths.push("Kreatif tekrar disiplini kurulmuş.");
  if (values[4] >= 4) strengths.push("Ürün ve teklif yapınız düzenli görünüyor.");
  if (values[5] >= 4) strengths.push("Süreklilik tarafı güçlü görünüyor.");

  if (strengths.length === 0) {
    strengths.push("Başlangıç seviyesi için doğru yerdesiniz; en büyük avantajınız temel akışı sıfırdan düzgün kurabilecek olmanız.");
  }

  return {
    summaryValue: level,
    summaryClass,
    intro: `Toplam skorunuz ${formatNumber(score, 0)}/24. ${nextTrack}`,
    metrics: [
      { label: "Seviye skoru", value: `${formatNumber(score, 0)} / 24` },
      { label: "Hazır olunan katman", value: level },
      { label: "Önerilen yön", value: score <= 16 ? "Temel + uygulama" : "Uygulama + optimizasyon" },
    ],
    visibleItems: strengths.slice(0, 3),
    lockedItems: [
      `Eksik olduğunuz ilk 3 konu: ${gaps.slice(0, 3).join(", ")}.`,
      score <= 8
        ? "Önerilen müfredat sırası: mağaza temeli, içerik dili, reklam mantığı, temel metrikler."
        : score <= 16
        ? "Önerilen müfredat sırası: katalog düzeni, ölçümleme, kreatif test, reklam optimizasyonu."
        : "Önerilen müfredat sırası: veri okuma, teklif optimizasyonu, kreatif rotasyonu, ölçekleme disiplini.",
      "Canlı ders ve tekrar izlenebilir modül akışı bu seviyeye göre kişiselleştirilir.",
    ],
  };
};

const analyzeAcademy = () => {
  const result = document.getElementById("academyResult");
  const state = getAcademyState();

  renderToolResult({
    container: result,
    summaryLabel: "Eğitim seviyesi",
    summaryValue: state.summaryValue,
    summaryClass: state.summaryClass,
    intro: state.intro,
    metrics: state.metrics,
    visibleTitle: "Açık görünen güçlü taraflar",
    visibleItems: state.visibleItems,
    lockedTitle: "Blur altındaki eksik konular ve müfredat",
    lockedItems: state.lockedItems,
    ctaLabel: "Lumina Akademi",
    ctaText: "Eksik olduğunuz modülleri ve hangi eğitimle başlamanız gerektiğini birlikte netleştiriyoruz.",
    ctaHref: "akademi.html#iletisim",
  });
};

const getCyberState = () => {
  const rawUrl = getValue("cyberUrl").trim();
  if (!rawUrl) {
    return null;
  }

  const payment = getNumericValue("cyberPayment");
  const whatsapp = getNumericValue("cyberWhatsapp");
  const docs = getNumericValue("cyberDocs");
  const urgency = getNumericValue("cyberUrgency");

  let parsedUrl;
  try {
    const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    parsedUrl = new URL(normalized);
  } catch (_error) {
    return { invalid: true };
  }

  let risk = payment + whatsapp + docs + urgency;
  const visibleNotes = [];
  const lockedNotes = [];

  if (parsedUrl.protocol !== "https:") {
    risk += 3;
    lockedNotes.push("Bağlantı HTTPS kullanmıyor. Bu, güven sinyalini doğrudan zayıflatır.");
  } else {
    visibleNotes.push("Bağlantı HTTPS kullanıyor; bu tek başına güvenli olduğu anlamına gelmez.");
  }

  if (shorteners.has(parsedUrl.hostname.toLowerCase())) {
    risk += 3;
    lockedNotes.push("Kısa link servisi kullanılıyor. Nihai hedef kullanıcıdan saklanıyor olabilir.");
  }

  if (isIpAddress(parsedUrl.hostname)) {
    risk += 3;
    lockedNotes.push("Alan adı yerine IP adresi kullanılıyor. Bu davranış normal kurumsal akışlarda nadir görülür.");
  }

  if (containsSuspiciousChars(parsedUrl.hostname)) {
    risk += 3;
    lockedNotes.push("Hostname içinde olağandışı karakterler var. Taklit veya gizleme girişimi olabilir.");
  }

  if (parsedUrl.hostname.split(".").length > 3) {
    risk += 1;
    visibleNotes.push("Alan adı yapısı fazla katmanlı. Yönlendirme zinciri ayrıca kontrol edilmeli.");
  }

  if (parsedUrl.pathname.length > 48 || parsedUrl.search.length > 70) {
    risk += 1;
    visibleNotes.push("URL yapısı normalden karmaşık görünüyor.");
  }

  if (payment >= 4) {
    visibleNotes.push("Ödeme talebi bulunduğu için risk değerlendirmesi daha kritik hale gelir.");
  }

  if (whatsapp >= 2) {
    lockedNotes.push("WhatsApp veya DM yönlendirmesi, kullanıcıyı platform dışına çekme sinyali üretiyor.");
  }

  if (docs >= 3) {
    lockedNotes.push("Kimlik veya kart görseli talebi var. Bu, dolandırıcılık vakalarında sık görülen yüksek risk göstergesi.");
  }

  if (urgency >= 4) {
    lockedNotes.push("Dil tonu acele ve baskı içeriyor. Bu, phishing ve sahte tahsilat senaryolarında sık görülür.");
  }

  let summaryValue = "Düşük risk sinyali";
  let summaryClass = "is-good";

  if (risk >= 12) {
    summaryValue = "Yüksek risk sinyali";
    summaryClass = "is-alert";
  } else if (risk >= 6) {
    summaryValue = "Orta risk sinyali";
    summaryClass = "is-mid";
  }

  while (lockedNotes.length < 4) {
    lockedNotes.push("Detaylı port, altyapı ve davranışsal güvenlik katmanı uzman incelemede açılır.");
  }

  return {
    summaryValue,
    summaryClass,
    intro: `${parsedUrl.hostname} için oluşturulan ön tarama skoru ${formatNumber(risk, 0)} risk puanı üretti. Bu sonuç görünür URL ve davranış sinyallerine dayanır.`,
    metrics: [
      { label: "Risk puanı", value: `${formatNumber(risk, 0)} / 20+` },
      { label: "Alan adı", value: parsedUrl.hostname },
      { label: "Protokol", value: parsedUrl.protocol.replace(":", "").toUpperCase() },
    ],
    visibleItems: visibleNotes.slice(0, 3),
    lockedItems: lockedNotes.slice(0, 4),
  };
};

const analyzeCyber = () => {
  const result = document.getElementById("cyberResult");
  const state = getCyberState();

  if (!state) {
    renderToolResult({
      container: result,
      summaryLabel: "Durum",
      summaryValue: "Link bekleniyor",
      summaryClass: "is-mid",
      intro: "URL girmeden siber ön analiz üretilemez. İsterseniz ödeme, belge veya baskı dili gibi alanları da doldurarak skoru netleştirin.",
      metrics: [],
      visibleTitle: "Bu araç neyi okur?",
      visibleItems: ["URL yapısını", "Ödeme ve belge taleplerini", "Baskı ve yönlendirme sinyallerini"],
      lockedTitle: "Kilitli teknik katman",
      lockedItems: ["Detaylı port görünürlüğü", "Altyapı anomali işaretleri", "Vaka bazlı uzman yorumu"],
      ctaLabel: "Lumina Siber",
      ctaText: "Linki girdikten sonra detaylı yönlendirme katmanı açılır.",
      ctaHref: "iletisim.html",
    });
    return;
  }

  if (state.invalid) {
    renderToolResult({
      container: result,
      summaryLabel: "Durum",
      summaryValue: "Geçersiz URL",
      summaryClass: "is-alert",
      intro: "Analiz için geçerli bir link formatı girin. Gerekirse başına https:// ekleyin.",
      metrics: [],
      visibleTitle: "Örnek formatlar",
      visibleItems: ["https://ornek.com", "ornek.com/urun", "bit.ly/ornek-link"],
      lockedTitle: "Kilitli teknik katman",
      lockedItems: ["Hostname çözümleme", "Yönlendirme sinyal analizi", "Davranışsal risk katmanı"],
      ctaLabel: "Lumina Siber",
      ctaText: "Geçerli bir link girildiğinde ileri risk sinyalleri hesaplanır.",
      ctaHref: "iletisim.html",
    });
    return;
  }

  renderToolResult({
    container: result,
    summaryLabel: "Risk özeti",
    summaryValue: state.summaryValue,
    summaryClass: state.summaryClass,
    intro: state.intro,
    metrics: state.metrics,
    visibleTitle: "Açık görünen sinyaller",
    visibleItems: state.visibleItems,
    lockedTitle: "Blur altındaki detaylı güvenlik katmanı",
    lockedItems: state.lockedItems,
    ctaLabel: "Siber Güvenlik Paketi",
    ctaText: "Detaylı incelemede port, açık yüzey ve vaka sinyallerini uzman değerlendirmesiyle açıyoruz.",
    ctaHref: "iletisim.html",
  });
};

document.getElementById("roasAnalyzeBtn")?.addEventListener("click", analyzeRoas);
document.getElementById("seoAnalyzeBtn")?.addEventListener("click", analyzeSeo);
document.getElementById("academyAnalyzeBtn")?.addEventListener("click", analyzeAcademy);
document.getElementById("cyberAnalyzeBtn")?.addEventListener("click", analyzeCyber);
