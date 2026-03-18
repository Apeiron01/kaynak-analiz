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
const loadingLogoPath = "assets/images/brand-mark.svg";

const renderToolLoading = (container, loadingText) => {
  if (!container) {
    return;
  }

  container.classList.remove("hidden");
  container.innerHTML = `
    <div class="tool-loading-card" aria-live="polite">
      <div class="tool-loading-mark">
        <img src="${loadingLogoPath}" alt="Lumina logo" width="64" height="64" />
      </div>
      <strong>${loadingText}</strong>
      <p>Arka planda sinyaller taranıyor, sonuç katmanı hazırlanıyor.</p>
      <div class="tool-loading-dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
};

const attachToolAction = (buttonId, resultId, loadingText, handler) => {
  const button = document.getElementById(buttonId);
  const result = document.getElementById(resultId);

  if (!button || !result) {
    return;
  }

  button.addEventListener("click", () => {
    if (button.dataset.loading === "true") {
      return;
    }

    button.dataset.loading = "true";
    button.setAttribute("disabled", "disabled");
    button.setAttribute("aria-busy", "true");

    renderToolLoading(result, loadingText);

    const delay = Math.floor(Math.random() * 1000) + 2200;
    window.setTimeout(() => {
      try {
        handler(result);
      } finally {
        button.dataset.loading = "false";
        button.removeAttribute("disabled");
        button.removeAttribute("aria-busy");
      }
    }, delay);
  });
};

const calculatorAppCta = {
  extraCtaText: "Daha fazla hesaplama aracina mi ihtiyaciniz var? Marjory uygulamasini indirerek ek hesaplara hizli ulasabilirsiniz.",
  extraCtaHref: "https://play.google.com/store/apps/details?id=com.marjory.app",
  extraCtaButtonText: "Uygulamayi Indir",
};

const calculatorResultIds = new Set([
  "roasResult",
  "discountResult",
  "percentageResult",
  "vatResult",
  "marginResult",
  "commissionResult",
]);

const normalizeSecondaryTitle = (title = "") => {
  const normalized = title.trim().toLowerCase();

  if (!normalized || normalized.includes("blur") || normalized.includes("kilitli")) {
    return "Ek degerlendirme notlari";
  }

  return title;
};

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
  extraCtaText = "",
  extraCtaHref = "",
  extraCtaButtonText = "Uygulamayi Indir",
}) => {
  if (!container) {
    return;
  }

  const safeVisibleItems = visibleItems.length ? visibleItems : ["Bu katmanda ek bir sinyal bulunmuyor."];
  const showCalculatorAppCta = calculatorResultIds.has(container.id);
  const resolvedExtraCtaHref = extraCtaHref || (showCalculatorAppCta ? calculatorAppCta.extraCtaHref : "");
  const resolvedExtraCtaText = extraCtaText || (showCalculatorAppCta ? calculatorAppCta.extraCtaText : "");
  const resolvedExtraCtaButtonText = extraCtaButtonText || calculatorAppCta.extraCtaButtonText;
  const normalizedLockedTitle = normalizeSecondaryTitle(lockedTitle);
  const safeLockedItems = [...new Set((lockedItems.length ? lockedItems : ["Bu panel sonucu ikinci katman notlariyla gruplar; ek gizli veri bulunmaz."]).filter(Boolean))];

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
          <div class="tool-result-mask" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="tool-result-panel-copy">
            <h3>${normalizedLockedTitle}</h3>
            <p class="tool-result-panel-note">Bu alanda ek gizli bilgi yok. Sonuc ayni container icinde ikinci katman notlariyla gosteriliyor.</p>
            <ul class="tool-result-list">${lockedHtml}</ul>
          </div>
        </div>
        <div class="tool-result-cta tool-result-cta-inline">
          <p class="tool-result-cta-label">${ctaLabel}</p>
          <p>${ctaText}</p>
          <a class="btn btn-primary" href="${ctaHref}">Inceleme Talebi Olustur</a>
        </div>
      </section>
    </div>
  `;

  if (resolvedExtraCtaHref) {
    const cta = container.querySelector(".tool-result-cta");

    if (cta) {
      const extraWrap = document.createElement("div");
      extraWrap.className = "tool-result-extra-actions";

      const extraButton = document.createElement("a");
      extraButton.className = "btn btn-secondary";
      extraButton.href = resolvedExtraCtaHref;
      extraButton.target = "_blank";
      extraButton.rel = "noreferrer";
      extraButton.textContent = resolvedExtraCtaButtonText;
      extraWrap.appendChild(extraButton);

      if (resolvedExtraCtaText) {
        const extraText = document.createElement("p");
        extraText.className = "tool-result-extra-cta";
        extraText.textContent = resolvedExtraCtaText;
        extraWrap.appendChild(extraText);
      }

      cta.appendChild(extraWrap);
    }
  }
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
  const adShare = revenue > 0 ? (adSpend / revenue) * 100 : 0;
  const breakEvenAdBudget = Math.max(0, contributionBeforeAds);

  const leaks = [
    { label: "Urun maliyeti", value: cogs },
    { label: "Reklam harcamasi", value: adSpend },
    { label: "Kargo / operasyon", value: shipping },
    { label: "Komisyon", value: fees },
    { label: "Iade kaybi", value: returnLoss },
    { label: "Sabit gider", value: fixed },
  ]
    .sort((left, right) => right.value - left.value)
    .slice(0, 3);

  const visibleNotes = [];
  if (netProfit < 0) {
    visibleNotes.push("Net tabloda zarar gorunuyor. Yuksek ROAS tek basina saglikli bir tablo kurmuyor.");
  } else {
    visibleNotes.push("Net tabloda kar kaliyor. Olcekleme oncesi marji korumak kritik.");
  }

  if (margin < 8) {
    visibleNotes.push("Kar marji dar. Reklam buyurken kucuk sapmalar bile karliligi silebilir.");
  } else if (margin < 18) {
    visibleNotes.push("Marj orta seviyede. Kanal bazli optimizasyonla rahatlama alani var.");
  } else {
    visibleNotes.push("Marj guvenli bolgede. Butce artisi oncesi olcek disiplini kurmak mantikli.");
  }

  if (actualRoas < 2) {
    visibleNotes.push("ROAS dusuk. Teklif, kreatif ve urun katki payi birlikte ele alinmali.");
  } else if (actualRoas < 3.5) {
    visibleNotes.push("ROAS fena degil ama maliyet tarafi siki yonetilmezse kar kolay erir.");
  } else {
    visibleNotes.push("ROAS guclu gorunuyor. Asil soru bunun surdurulebilir kar uretip uretmedigi.");
  }

  if (adShare > 30) {
    visibleNotes.push("Reklam payi ciroya gore cok yuksek. Olcekleme oncesi teklif yapisi ve sepet katkisi yeniden bakilmali.");
  } else if (adShare > 18) {
    visibleNotes.push("Reklam gideri ciro tarafinda hissedilir baski kuruyor. Karlilik oncesi dikkatli buyume gerekir.");
  } else {
    visibleNotes.push("Reklam payi kontrollu gorunuyor; asil belirleyici urun ve operasyon maliyetleri oluyor.");
  }

  const advancedNotes = [
    `Basabas ROAS esigi yaklasik ${formatNumber(breakevenRoas, 2)}. Bunun alti kampanya karliligini hizla asindirir.`,
    `Basabas reklam tavani yaklasik ${formatTry(breakEvenAdBudget)} seviyesinde. Bunun ustu kari eritmeye baslar.`,
    `Maksimum guvenli edinme baskisi yaklasik ${formatTry(maxCpa)} seviyesinde. Kanal bazli CPO bundan sapiyorsa butce revizyonu gerekir.`,
    `En buyuk kar sizintilari: ${leaks.map((item) => `${item.label} (${formatTry(item.value)})`).join(", ")}.`,
    margin < 10
      ? "Olcekleme yerine once teklif, urun sepeti ve operasyon maliyetlerini optimize etmeniz gerekir."
      : "Olcekleme mumkun, ancak kanal bazli karlilik kirilimi ve iade etkisiyle birlikte izlenmelidir.",
    returnRate > 5
      ? "Iade orani yukselmis gorunuyor. Kreatif vaatleri ve urun sayfasi beklentisini hizalamak kritik."
      : "Iade tarafi su an kontrol altinda; asil baski reklam veya urun maliyetinde yogunlasiyor.",
  ];

  return {
    summaryClass: netProfit >= 0 ? "is-good" : "is-alert",
    summaryValue: netProfit >= 0 ? "Karlilik var" : "Kritik kar baskisi",
    intro: `Ciro ${formatTry(revenue)}, reklam harcamasi ${formatTry(adSpend)} ve tum temel giderler birlikte ele alindiginda net sonuc ${formatTry(netProfit)} cikiyor.`,
    metrics: [
      { label: "Gerceklesen ROAS", value: formatNumber(actualRoas, 2) },
      { label: "Net kar", value: formatTry(netProfit) },
      { label: "Kar marji", value: `%${formatNumber(margin, 1)}` },
      { label: "Reklam payi", value: `%${formatNumber(adShare, 1)}` },
    ],
    visibleItems: visibleNotes.slice(0, 4),
    lockedItems: advancedNotes.slice(0, 5),
  };
};

const analyzeRoas = (result) => {
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
  const hasPath = /https?:\/\/[^/]+\/.+/i.test(rawDomain) || /^[^/]+\/.+/.test(rawDomain);
  const usesPunycode = hostname.includes("xn--");
  const indexHealth = indexedPages > 0 ? Math.max(0, 100 - (brokenPages / indexedPages) * 100) : 0;

  if (loadTime > 5) {
    score -= 28;
    criticalIssues.push("Mobil yuklenme suresi 5 saniyenin ustunde. Bu durum hem siralama hem donusum tarafini zorluyor.");
  } else if (loadTime > 3.5) {
    score -= 14;
    visibleNotes.push("Mobil hiz iyilestirmeye acik. 3.5 saniye ustu kullanici kaybini artirir.");
  } else {
    visibleNotes.push("Mobil hiz temel esik icinde gorunuyor.");
  }

  if (indexedPages < 10) {
    score -= 16;
    criticalIssues.push("Indeksli sayfa gorunurlugu zayif. Icerik ve teknik kesif akisi yeniden ele alinmali.");
  } else {
    visibleNotes.push(`Indeks tarafinda en az ${formatNumber(indexedPages, 0)} sayfalik gorunurluk sinyali var.`);
  }

  if (brokenPages > 5) {
    score -= 16;
    criticalIssues.push("Kirik sayfa veya hata sayisi yuksek. Tarama butcesi ve guven sinyali bu noktada zayiflar.");
  } else if (brokenPages > 0) {
    score -= 8;
    visibleNotes.push("Birkac hata sayfasi tespit edildi. Kullanici akisi ve yonlendirme kontrolu gerekli.");
  }

  if (titleCoverage < 70) {
    score -= 18;
    criticalIssues.push("Baslik ve meta kapsama orani dusuk. Arama gorunurlugu sistematik bicimde kaciyor.");
  } else if (titleCoverage < 90) {
    score -= 8;
    visibleNotes.push("Baslik ve meta kapsama orta seviyede. Sablon duzeni toparlanirsa hizli kazanim gelir.");
  } else {
    visibleNotes.push("Baslik ve meta kapsama guclu gorunuyor.");
  }

  if (schema === "none") {
    score -= 10;
    criticalIssues.push("Schema kullanimi yok. SERP gorunurlugu icin yapisal veri katmani eksik.");
  } else if (schema === "partial") {
    score -= 4;
    visibleNotes.push("Schema kismi. Kritik sayfalarda genisletme alani var.");
  }

  if (gsc === "no") {
    score -= 8;
    criticalIssues.push("Google Search Console aktif gorunmuyor. Teknik karar icin veri tabani eksik kaliyor.");
  }

  if (https === "no") {
    score -= 22;
    criticalIssues.push("HTTPS aktif degil. Bu dogrudan guven ve SEO problemi yaratir.");
  }

  if (usesPunycode) {
    score -= 8;
    criticalIssues.push("Alan adinda punycode gorunuyor. Marka guveni ve kullanici algisi ayrica kontrol edilmeli.");
  }

  if (hostname.includes("-")) {
    visibleNotes.push("Alan adinda tire kullanimi var. Markalasma ve hatirlanabilirlik tarafi ayrica degerlendirilmeli.");
  }

  if (hostname.split(".").length > 3) {
    visibleNotes.push("Alt alan yapisi karmasik gorunuyor. Teknik yonlendirme zinciri kontrol edilmeli.");
  }

  if (hasPath) {
    visibleNotes.push("Analize ana alan adi yerine tam URL girildi. Audit tarafinda sayfa tipi bazli ayri okuma gerekebilir.");
  }

  if (hostname.length > 28) {
    visibleNotes.push("Alan adi uzun gorunuyor. Arama sonucu tiklanabilirligi ve markalasma acisindan ayrica degerlendirilmeli.");
  }

  score = Math.max(12, Math.min(100, score));

  const summaryValue = score >= 80 ? "Saglam temel" : score >= 55 ? "Gelistirilebilir yapi" : "Teknik aciklar yuksek";
  const summaryClass = score >= 80 ? "is-good" : score >= 55 ? "is-mid" : "is-alert";

  if (!criticalIssues.length) {
    criticalIssues.push("Teknik tarafta acik bir kritik hata sinyali yok; yine de sayfa tipi bazli audit ayri okunabilir.");
  }

  return {
    summaryValue,
    summaryClass,
    intro: `${hostname} icin olusturulan teknik hazirlik skoru ${formatNumber(score, 0)}/100 seviyesinde. Bu skor tarama, hiz ve gorunurluk sinyallerinin birlesimidir.`,
    metrics: [
      { label: "SEO hazirlik skoru", value: `${formatNumber(score, 0)} / 100` },
      { label: "Mobil yuklenme", value: `${formatNumber(loadTime, 1)} sn` },
      { label: "Meta kapsama", value: `%${formatNumber(titleCoverage, 0)}` },
      { label: "Indeks sagligi", value: indexedPages > 0 ? `%${formatNumber(indexHealth, 0)}` : "Veri yok" },
    ],
    visibleItems: visibleNotes.slice(0, 4),
    lockedItems: criticalIssues.slice(0, 5),
  };
};

const analyzeSeo = (result) => {
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
  let recommendedProgram = "Dijital pazarlama temeli";

  if (score <= 8) {
    level = "Temel seviye";
    summaryClass = "is-alert";
    nextTrack = "Once temel magaza ve reklam mantigi oturmali.";
  } else if (score <= 16) {
    level = "Gelisen seviye";
    summaryClass = "is-mid";
    nextTrack = "Sistem kurulduktan sonra olcum ve kreatif tekrarina gecilmesi gerekir.";
  } else {
    level = "Uygulayan seviye";
    summaryClass = "is-good";
    nextTrack = "Ileri modulde rapor okuma, optimizasyon ve olcekleme katmani acilabilir.";
  }

  if (values[0] + values[4] <= 4) {
    recommendedProgram = "Etsy veya Shopify temeli";
  } else if (values[1] + values[2] <= 4) {
    recommendedProgram = "Meta Ads ve Google Ads";
  } else if (values[3] <= 2) {
    recommendedProgram = "Kreatif ve teklif uygulamasi";
  }

  const gaps = [];
  if (values[0] <= 2) gaps.push("Magaza veya proje temeli");
  if (values[1] <= 2) gaps.push("Reklam paneli ve kampanya kurgusu");
  if (values[2] <= 2) gaps.push("Olcumleme ve rapor okuma");
  if (values[3] <= 2) gaps.push("Kreatif uretim ve test sistemi");
  if (values[4] <= 2) gaps.push("Urun / katalog duzeni");
  if (values[5] <= 2) gaps.push("Haftalik uygulama disiplini");

  while (gaps.length < 3) {
    gaps.push("Bir ust seviyede optimizasyon modulu");
  }

  const strengths = [];
  if (values[0] >= 4) strengths.push("Magaza veya operasyon temeliniz hazir.");
  if (values[1] >= 4) strengths.push("Reklam panelinde temel kararlari okuyabiliyorsunuz.");
  if (values[2] >= 4) strengths.push("Metrik okuma farkindaliginiz olusmus.");
  if (values[3] >= 4) strengths.push("Kreatif tekrar disiplini kurulmus.");
  if (values[4] >= 4) strengths.push("Urun ve teklif yapiniz duzenli gorunuyor.");
  if (values[5] >= 4) strengths.push("Sureklilik tarafi guclu gorunuyor.");

  if (strengths.length === 0) {
    strengths.push("Baslangic seviyesi icin dogru yerdesiniz; en buyuk avantajiniz temel akis kurabilecek olmaniz.");
  }

  return {
    summaryValue: level,
    summaryClass,
    intro: `Toplam skorunuz ${formatNumber(score, 0)}/24. ${nextTrack}`,
    metrics: [
      { label: "Seviye skoru", value: `${formatNumber(score, 0)} / 24` },
      { label: "Hazir olunan katman", value: level },
      { label: "Onerilen yon", value: score <= 16 ? "Temel + uygulama" : "Uygulama + optimizasyon" },
      { label: "Ilk oneri", value: recommendedProgram },
    ],
    visibleItems: strengths.slice(0, 3),
    lockedItems: [
      `Eksik oldugunuz ilk 3 konu: ${gaps.slice(0, 3).join(", ")}.`,
      `Ilk bakista size en yakin baslangic programi: ${recommendedProgram}.`,
      score <= 8
        ? "Onerilen mufredat sirasi: magaza temeli, icerik dili, reklam mantigi, temel metrikler."
        : score <= 16
        ? "Onerilen mufredat sirasi: katalog duzeni, olcumleme, kreatif test, reklam optimizasyonu."
        : "Onerilen mufredat sirasi: veri okuma, teklif optimizasyonu, kreatif rotasyonu, olcekleme disiplini.",
      "Canli ders ve tekrar izlenebilir modul akisi bu seviyeye gore kisisellestirilir.",
    ],
  };
};

const analyzeAcademy = (result) => {
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
  const urlFingerprint = `${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}`.toLowerCase();
  const suspiciousKeywordPattern = /(login|signin|verify|wallet|account|secure|bank|payment|checkout|odeme|kargo|cargo|confirm|auth|gift|claim)/i;
  const riskyTlds = [".xyz", ".top", ".click", ".live", ".shop", ".site"];
  const queryParamCount = Array.from(parsedUrl.searchParams.keys()).length;

  if (parsedUrl.protocol !== "https:") {
    risk += 3;
    lockedNotes.push("Baglanti HTTPS kullanmiyor. Bu, guven sinyalini dogrudan zayiflatiyor.");
  } else {
    visibleNotes.push("Baglanti HTTPS kullaniyor; bu tek basina guvenli oldugu anlamina gelmez.");
  }

  if (shorteners.has(parsedUrl.hostname.toLowerCase())) {
    risk += 3;
    lockedNotes.push("Kisa link servisi kullaniliyor. Nihai hedef kullanicidan saklaniyor olabilir.");
  }

  if (isIpAddress(parsedUrl.hostname)) {
    risk += 3;
    lockedNotes.push("Alan adi yerine IP adresi kullaniliyor. Bu davranis normal kurumsal akista nadir gorulur.");
  }

  if (containsSuspiciousChars(parsedUrl.hostname)) {
    risk += 3;
    lockedNotes.push("Hostname icinde olagandisi karakterler var. Taklit veya gizleme girisimi olabilir.");
  }

  if (parsedUrl.hostname.includes("xn--")) {
    risk += 2;
    lockedNotes.push("Alan adinda punycode kullanimi var. Taklit veya maskeleme ihtimali ayrica degerlendirilmeli.");
  }

  if (parsedUrl.username || parsedUrl.password) {
    risk += 3;
    lockedNotes.push("URL icinde kullanici adi veya parola bilgisi geciyor. Bu yuksek risk sinyalidir.");
  }

  if (suspiciousKeywordPattern.test(urlFingerprint)) {
    risk += 2;
    lockedNotes.push("URL yapisi giris, dogrulama veya odeme baskisi kuran anahtar kelimeler iceriyor.");
  }

  if (riskyTlds.some((suffix) => parsedUrl.hostname.endsWith(suffix))) {
    risk += 2;
    lockedNotes.push("Alan adi uzantisi yuksek riskli vakalarda sik gorulen bir gruba yakin.");
  }

  if (parsedUrl.hostname.split(".").length > 3) {
    risk += 1;
    visibleNotes.push("Alan adi yapisi fazla katmanli. Yonlendirme zinciri ayrica kontrol edilmeli.");
  }

  if (parsedUrl.pathname.length > 48 || parsedUrl.search.length > 70) {
    risk += 1;
    visibleNotes.push("URL yapisi normalden karmasik gorunuyor.");
  }

  if (queryParamCount >= 5) {
    risk += 1;
    visibleNotes.push("Baglanti cok sayida parametre iceriyor. Yonlendirme ve izleme davranisi kontrol edilmeli.");
  }

  if (payment >= 4) {
    visibleNotes.push("Odeme talebi bulundugu icin risk degerlendirmesi daha kritik hale geliyor.");
  }

  if (whatsapp >= 2) {
    lockedNotes.push("WhatsApp veya DM yonlendirmesi, kullaniciyi platform disina cekme sinyali uretiyor.");
  }

  if (docs >= 3) {
    lockedNotes.push("Kimlik veya kart gorseli talebi var. Bu, dolandiricilik vakalarinda sik gorulen yuksek risk gostergesi.");
  }

  if (urgency >= 4) {
    lockedNotes.push("Dil tonu acele ve baski iceriyor. Bu, phishing ve sahte tahsilat senaryolarinda sik gorulur.");
  }

  let summaryValue = "Dusuk risk sinyali";
  let summaryClass = "is-good";

  if (risk >= 12) {
    summaryValue = "Yuksek risk sinyali";
    summaryClass = "is-alert";
  } else if (risk >= 6) {
    summaryValue = "Orta risk sinyali";
    summaryClass = "is-mid";
  }

  if (!lockedNotes.length) {
    lockedNotes.push("URL tarafinda ek risk sinyali yakalanmadi; karar yine alan adi, talep tipi ve yonlendirme baglamiyla okunmali.");
  }

  return {
    summaryValue,
    summaryClass,
    intro: `${parsedUrl.hostname} icin olusturulan on tarama skoru ${formatNumber(risk, 0)} risk puani uretti. Bu sonuc gorunur URL ve davranis sinyallerine dayaniyor.`,
    metrics: [
      { label: "Risk puani", value: `${formatNumber(risk, 0)} / 20+` },
      { label: "Alan adi", value: parsedUrl.hostname },
      { label: "Protokol", value: parsedUrl.protocol.replace(":", "").toUpperCase() },
      { label: "Parametre sayisi", value: `${queryParamCount}` },
    ],
    visibleItems: visibleNotes.slice(0, 4),
    lockedItems: lockedNotes.slice(0, 4),
  };
};

const analyzeCyber = (result) => {
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

const getDiscountState = () => {
  const originalPrice = getNumericValue("discountOriginalPrice");
  const salePrice = getNumericValue("discountSalePrice");
  const percent = getNumericValue("discountPercent");

  if (originalPrice <= 0 && salePrice <= 0 && percent <= 0) {
    return null;
  }

  let basePrice = originalPrice;
  let discountedPrice = salePrice;
  let discountPercent = percent;

  if (basePrice > 0 && discountPercent > 0 && discountedPrice <= 0) {
    discountedPrice = basePrice * (1 - discountPercent / 100);
  } else if (discountedPrice > 0 && discountPercent > 0 && basePrice <= 0 && discountPercent < 100) {
    basePrice = discountedPrice / (1 - discountPercent / 100);
  } else if (basePrice > 0 && discountedPrice > 0 && discountPercent <= 0 && discountedPrice <= basePrice) {
    discountPercent = ((basePrice - discountedPrice) / basePrice) * 100;
  } else if (basePrice > 0 && discountedPrice > 0 && discountPercent > 0) {
    discountPercent = ((basePrice - discountedPrice) / basePrice) * 100;
  } else {
    return { invalid: true };
  }

  if (!Number.isFinite(basePrice) || !Number.isFinite(discountedPrice) || !Number.isFinite(discountPercent) || basePrice <= 0 || discountedPrice < 0) {
    return { invalid: true };
  }

  const savings = basePrice - discountedPrice;
  const calculationMode =
    originalPrice <= 0
      ? "Indirimliden indirimsiz fiyat"
      : salePrice <= 0
      ? "Indirimsizden indirimli fiyat"
      : "Iki fiyat arasindan oran";

  return {
    summaryValue: discountPercent >= 40 ? "Guclu kampanya" : discountPercent >= 15 ? "Standart indirim" : "Dusuk indirim",
    summaryClass: discountPercent >= 40 ? "is-good" : discountPercent >= 15 ? "is-mid" : "is-alert",
    intro: `Indirimsiz fiyat ${formatTry(basePrice)}, indirimli fiyat ${formatTry(discountedPrice)} ve hesaplanan oran %${formatNumber(discountPercent, 1)}.`,
    metrics: [
      { label: "Indirimsiz fiyat", value: formatTry(basePrice) },
      { label: "Indirimli fiyat", value: formatTry(discountedPrice) },
      { label: "Indirim orani", value: `%${formatNumber(discountPercent, 1)}` },
      { label: "Tasarruf", value: formatTry(savings) },
    ],
    visibleItems: [
      `Toplam indirim tutari ${formatTry(savings)} seviyesinde.`,
      `Hesap modu: ${calculationMode}.`,
      discountPercent >= 40
        ? "Kampanya algisi guclu gorunuyor; marj tarafini ayrica kontrol etmek gerekir."
        : "Fiyat farki kullaniciya gorunur, ancak teklif mesaji ile desteklenirse daha iyi calisir.",
      originalPrice <= 0
        ? "Indirimli fiyattan indirimsiz fiyat geriye dogru hesaplandi."
        : salePrice <= 0
        ? "Indirimsiz fiyat ve oran uzerinden yeni fiyat hesaplandi."
        : "Iki fiyat uzerinden indirim orani netlesti.",
    ],
    lockedItems: [
      "Kademeli kampanya onerisi ve esik fiyat yorumu tam analizde acilir.",
      "Urun marji ve reklam maliyeti ile birlikte degerlendirilince daha dogru karar verilir.",
      "Ayni teklif icin psikolojik fiyat kirilimi ve paketleme onerileri ayri raporda sunulur.",
    ],
  };
};

const analyzeDiscount = (result) => {
  const state = getDiscountState();

  if (!state) {
    renderToolResult({
      container: result,
      summaryLabel: "Durum",
      summaryValue: "Hesap için veri bekleniyor",
      summaryClass: "is-mid",
      intro: "İndirimsiz fiyat, indirimli fiyat veya indirim oranı alanlarından en az ikisini doldurun. Araç eksik üçüncü değeri hesaplar.",
      metrics: [],
      visibleTitle: "Ne hesaplar?",
      visibleItems: [
        "İndirimsiz fiyattan indirimli fiyatı",
        "İndirimli fiyattan eski fiyatı",
        "İki fiyat arasındaki indirim oranını",
      ],
      lockedTitle: "Kilitli kampanya yorumu",
      lockedItems: [
        "Marj baskısı yorumu",
        "Psikolojik fiyat eşiği",
        "Teklif metni önerisi",
      ],
      ctaLabel: "Lumina Danışmanlık",
      ctaText: "Hesap sonucunu kampanya kurgusuna çevirmek için danışmanlık katmanına geçebilirsiniz.",
      ctaHref: "index.html#iletisim",
    });
    return;
  }

  if (state.invalid) {
    renderToolResult({
      container: result,
      summaryLabel: "Durum",
      summaryValue: "Geçersiz kombinasyon",
      summaryClass: "is-alert",
      intro: "Lütfen anlamlı bir hesap kombinasyonu girin. İndirimli fiyat, indirimsiz fiyattan yüksek olamaz ve oran %100'e ulaşamaz.",
      metrics: [],
      visibleTitle: "Geçerli örnekler",
      visibleItems: [
        "1.200 TL + %25",
        "1.200 TL + 899 TL",
        "899 TL + %25",
      ],
      lockedTitle: "Kilitli kampanya yorumu",
      lockedItems: [
        "Marj baskısı yorumu",
        "Fiyat eşiği analizi",
        "Teklif metni önerisi",
      ],
      ctaLabel: "Lumina Danışmanlık",
      ctaText: "Geçerli fiyat kombinasyonu girildiğinde kampanya çıktısı açılır.",
      ctaHref: "index.html#iletisim",
    });
    return;
  }

  renderToolResult({
    container: result,
    summaryLabel: "Hesap özeti",
    summaryValue: state.summaryValue,
    summaryClass: state.summaryClass,
    intro: state.intro,
    metrics: state.metrics,
    visibleTitle: "Açık sonuçlar",
    visibleItems: state.visibleItems,
    lockedTitle: "Kilitli kampanya katmanı",
    lockedItems: state.lockedItems,
    ctaLabel: "E-Ticaret Danışmanlığı",
    ctaText: "Fiyatı yalnız hesaplamak değil, satışa dönen teklif yapısına çevirmek için birlikte ilerleyebiliriz.",
    ctaHref: "index.html#iletisim",
  });
};

const getPercentageState = () => {
  const mode = getValue("percentageMode") || "part";
  const valueA = getNumericValue("percentageValueA");
  const valueB = getNumericValue("percentageValueB");
  const direction = getValue("percentageDirection") || "increase";

  if (valueA <= 0 || valueB <= 0) {
    return null;
  }

  if (mode === "part") {
    const result = (valueA * valueB) / 100;
    return {
      summaryValue: "Yuzde hesabi hazir",
      summaryClass: "is-good",
      intro: `${formatNumber(valueA, 2)} sayisinin %${formatNumber(valueB, 2)} degeri ${formatNumber(result, 2)} olarak hesaplandi.`,
      metrics: [
        { label: "Ana sayi", value: formatNumber(valueA, 2) },
        { label: "Yuzde orani", value: `%${formatNumber(valueB, 2)}` },
        { label: "Sonuc", value: formatNumber(result, 2) },
      ],
      visibleItems: [
        `Hesap modu: bir sayinin yuzdesi.`,
        `Sonuc dogrudan ${formatNumber(result, 2)} seviyesinde.`,
        valueB >= 50
          ? "Yuzde orani yuksek oldugu icin sonuc ana sayinin buyuk kismini temsil ediyor."
          : "Yuzde orani orta veya dusuk oldugu icin sonuc ana sayinin bir alt dilimini gosteriyor.",
      ],
      lockedItems: [
        "Fiyat kirilimi ve teklif dili yorumu detayli analizde acilir.",
        "Bu oran kampanya, zam veya indirim kurgusuna nasil doner ayrica planlanir.",
        "Ticari sayfalarda psikolojik esik kontrolu ayrica yorumlanir.",
      ],
    };
  }

  if (mode === "ratio") {
    const result = valueB === 0 ? 0 : (valueA / valueB) * 100;
    return {
      summaryValue: "Oran hesabi hazir",
      summaryClass: result <= 100 ? "is-good" : "is-mid",
      intro: `${formatNumber(valueA, 2)} degeri, ${formatNumber(valueB, 2)} sayisinin yaklasik %${formatNumber(result, 2)} karsiligina denk geliyor.`,
      metrics: [
        { label: "Ilk deger", value: formatNumber(valueA, 2) },
        { label: "Ikinci deger", value: formatNumber(valueB, 2) },
        { label: "Yuzde sonucu", value: `%${formatNumber(result, 2)}` },
      ],
      visibleItems: [
        "Hesap modu: bir sayi diger sayinin yuzde kaci.",
        result > 100
          ? "Ilk deger ikinci degerden buyuk oldugu icin oran %100'u asti."
          : "Ilk deger ikinci degerin altinda kaldigi icin oran %100'un altinda.",
        "Oran hesabi teklif, tamamlama ve hedef takibinde dogrudan kullanilabilir.",
      ],
      lockedItems: [
        "Oran yorumunun satis hedefiyle eslestirilmis surumu detayli katmanda acilir.",
        "Yuzde sonucunun kampanya ya da fiyatlandirma etkisi ayrica planlanir.",
        "Hedef tamamlama veya KPI esik yorumu profesyonel katmanda acilir.",
      ],
    };
  }

  const delta = (valueA * valueB) / 100;
  const result = direction === "decrease" ? valueA - delta : valueA + delta;

  return {
    summaryValue: direction === "decrease" ? "Azalis hesabi hazir" : "Artis hesabi hazir",
    summaryClass: "is-good",
    intro: `${formatNumber(valueA, 2)} degeri, %${formatNumber(valueB, 2)} ${direction === "decrease" ? "azalis" : "artis"} ile ${formatNumber(result, 2)} oluyor.`,
    metrics: [
      { label: "Baslangic", value: formatNumber(valueA, 2) },
      { label: "Degisim", value: `%${formatNumber(valueB, 2)}` },
      { label: "Yeni deger", value: formatNumber(result, 2) },
    ],
    visibleItems: [
      `Hesap modu: yuzde ${direction === "decrease" ? "azalis" : "artis"}.`,
      `Sayisal fark ${formatNumber(delta, 2)} seviyesinde.`,
      direction === "decrease"
        ? "Bu cikti indirim, kayip veya dusus hesaplarinda kullanilabilir."
        : "Bu cikti zam, artis veya hedef buyume hesaplarinda kullanilabilir.",
    ],
    lockedItems: [
      "Yeni degerin fiyat algisina etkisi detayli yorum katmaninda acilir.",
      "Oran buyudukce talep etkisi ve donusum farki ayrica degerlendirilir.",
      "Ticari senaryolarda kar marji uyumu ek katmanda incelenir.",
    ],
  };
};

const analyzePercentage = (result) => {
  const state = getPercentageState();

  if (!state) {
    renderToolResult({
      container: result,
      summaryLabel: "Durum",
      summaryValue: "Veri bekleniyor",
      summaryClass: "is-mid",
      intro: "Yuzde hesabi icin iki alan doldurun. Arac; bir sayinin yuzdesi, oran veya artis-azalis hesabini yapar.",
      metrics: [],
      visibleTitle: "Ne hesaplar?",
      visibleItems: [
        "Bir sayinin yuzdesini bulur.",
        "Bir sayinin diger sayinin yuzde kaci oldugunu hesaplar.",
        "Yuzde artis ve azalis sonucunu netlestirir.",
      ],
      lockedTitle: "Kilitli yorum katmani",
      lockedItems: [
        "Fiyatlama ve teklif etkisi",
        "Hedef tamamlama yorumu",
        "Psikolojik esik kontrolu",
      ],
      ctaLabel: "Lumina Danismanlik",
      ctaText: "Yuzde sonucu ticari bir karara donusecekse detayli yorum katmanina gecilebilir.",
      ctaHref: "index.html#iletisim",
    });
    return;
  }

  renderToolResult({
    container: result,
    summaryLabel: "Hesap ozeti",
    summaryValue: state.summaryValue,
    summaryClass: state.summaryClass,
    intro: state.intro,
    metrics: state.metrics,
    visibleTitle: "Acik sonuclar",
    visibleItems: state.visibleItems,
    lockedTitle: "Kilitli yorum katmani",
    lockedItems: state.lockedItems,
    ctaLabel: "Lumina Lab Pro",
    ctaText: "Sonucu fiyat, teklif veya buyume kararina cevirmek icin detayli katman acilabilir.",
    ctaHref: "index.html#iletisim",
  });
};

const getVatState = () => {
  const mode = getValue("vatMode") || "net-to-gross";
  const amount = getNumericValue("vatAmount");
  const rate = getNumericValue("vatRate");

  if (amount <= 0 || rate <= 0) {
    return null;
  }

  let netAmount = amount;
  let grossAmount = amount;
  let vatAmount = 0;

  if (mode === "net-to-gross") {
    vatAmount = amount * (rate / 100);
    grossAmount = amount + vatAmount;
  } else {
    netAmount = amount / (1 + rate / 100);
    vatAmount = amount - netAmount;
  }

  return {
    summaryValue: "KDV hesabi hazir",
    summaryClass: "is-good",
    intro:
      mode === "net-to-gross"
        ? `KDV haric ${formatTry(netAmount)} tutar icin %${formatNumber(rate, 0)} oraninda KDV eklendiginde toplam ${formatTry(grossAmount)} oluyor.`
        : `KDV dahil ${formatTry(grossAmount)} tutarin icinde %${formatNumber(rate, 0)} oraninda yaklasik ${formatTry(vatAmount)} KDV bulunuyor.`,
    metrics: [
      { label: "KDV haric", value: formatTry(netAmount) },
      { label: "KDV tutari", value: formatTry(vatAmount) },
      { label: "KDV dahil", value: formatTry(grossAmount) },
    ],
    visibleItems: [
      `Secilen KDV orani %${formatNumber(rate, 0)} olarak uygulandi.`,
      mode === "net-to-gross"
        ? "Bu hesap net fiyata KDV eklenmis son tutari verir."
        : "Bu hesap toplam tutarin icindeki vergi kirilimini ayirir.",
      "Fatura, teklif ve fiyat etiketi hazirlarken dogrudan kullanilabilir.",
    ],
    lockedItems: [
      "KDV dahil fiyat algisi ve teklif etkisi detayli yorum katmaninda acilir.",
      "Brut-net gecislerinin marj etkisi birlikte yorumlanir.",
      "KDV oranina gore listeleme ve teklif stratejisi ayrica planlanir.",
    ],
  };
};

const analyzeVat = (result) => {
  const state = getVatState();

  if (!state) {
    renderToolResult({
      container: result,
      summaryLabel: "Durum",
      summaryValue: "Veri bekleniyor",
      summaryClass: "is-mid",
      intro: "KDV haric ya da KDV dahil tutari ve KDV oranini girin. Arac net, vergi ve brut tutari otomatik hesaplar.",
      metrics: [],
      visibleTitle: "Ne hesaplar?",
      visibleItems: [
        "KDV haricten KDV dahil tutari",
        "KDV dahil tutarin vergi kirilimini",
        "Net, KDV ve toplam tutari birlikte",
      ],
      lockedTitle: "Kilitli yorum katmani",
      lockedItems: [
        "Fiyat algisi yorumu",
        "Marj etkisi analizi",
        "Teklif kurgusu onerisi",
      ],
      ctaLabel: "Lumina Danismanlik",
      ctaText: "KDV sonucunu teklif ve satis kararina cevirmek icin detayli katman acilabilir.",
      ctaHref: "index.html#iletisim",
    });
    return;
  }

  renderToolResult({
    container: result,
    summaryLabel: "Vergi ozeti",
    summaryValue: state.summaryValue,
    summaryClass: state.summaryClass,
    intro: state.intro,
    metrics: state.metrics,
    visibleTitle: "Acik sonuclar",
    visibleItems: state.visibleItems,
    lockedTitle: "Kilitli yorum katmani",
    lockedItems: state.lockedItems,
    ctaLabel: "Fiyatlandirma Danismanligi",
    ctaText: "Vergi dahil fiyat yapisinin satisa etkisini birlikte netlestirebiliriz.",
    ctaHref: "index.html#iletisim",
  });
};

const getMarginState = () => {
  const salePrice = getNumericValue("marginSalePrice");
  const costPrice = getNumericValue("marginCostPrice");
  const extraCost = getNumericValue("marginExtraCost");

  if (salePrice <= 0 || costPrice <= 0) {
    return null;
  }

  const totalCost = costPrice + extraCost;
  const profit = salePrice - totalCost;
  const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
  const markup = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  return {
    summaryValue: profit >= 0 ? "Marj gorunuyor" : "Zarar gorunuyor",
    summaryClass: profit >= 0 ? (margin >= 20 ? "is-good" : "is-mid") : "is-alert",
    intro: `Satis fiyati ${formatTry(salePrice)} ve toplam maliyet ${formatTry(totalCost)} icin birim sonuc ${formatTry(profit)} seviyesinde.`,
    metrics: [
      { label: "Toplam maliyet", value: formatTry(totalCost) },
      { label: "Birim kar", value: formatTry(profit) },
      { label: "Kar marji", value: `%${formatNumber(margin, 1)}` },
      { label: "Markup", value: `%${formatNumber(markup, 1)}` },
    ],
    visibleItems: [
      profit < 0
        ? "Satis fiyati maliyeti karsilamiyor; bu urun zararla ilerliyor."
        : "Satis fiyati maliyeti karsiliyor; asil konu marjin yeterli olup olmadigi.",
      margin < 10
        ? "Kar marji dar. Reklam ve operasyon sapmasi karliligi hizla silebilir."
        : margin < 20
        ? "Kar marji orta seviyede. Kanal maliyetleriyle birlikte takip edilmeli."
        : "Kar marji guvenli bolgede gorunuyor.",
      extraCost > 0
        ? "Ek maliyet girildigi icin sonuc operasyon giderlerini de hesaba katiyor."
        : "Ek maliyet alani bos; paketleme veya operasyon gideri varsa dahil etmek gerekir.",
    ],
    lockedItems: [
      "Reklam maliyeti eklendiginde net marj kirilimi detayli katmanda acilir.",
      "Psikolojik fiyat esigi ve bundle etkisi ayrica yorumlanir.",
      "Bu marj yapisinin kanal bazli buyume kapasitesi ayrica planlanir.",
    ],
  };
};

const analyzeMargin = (result) => {
  const state = getMarginState();

  if (!state) {
    renderToolResult({
      container: result,
      summaryLabel: "Durum",
      summaryValue: "Veri bekleniyor",
      summaryClass: "is-mid",
      intro: "Satis fiyati ve maliyeti girin. Arac; birim kar, kar marji ve markup hesabini birlikte yapar.",
      metrics: [],
      visibleTitle: "Ne hesaplar?",
      visibleItems: [
        "Birim kar tutarini",
        "Kar marji yuzdesini",
        "Markup oranini",
      ],
      lockedTitle: "Kilitli yorum katmani",
      lockedItems: [
        "Reklam maliyeti etkisi",
        "Fiyat esigi yorumu",
        "Buyume uygunlugu analizi",
      ],
      ctaLabel: "E-Ticaret Danismanligi",
      ctaText: "Marj hesabini urun ve reklam kararina cevirmek icin detayli katman acilabilir.",
      ctaHref: "index.html#iletisim",
    });
    return;
  }

  renderToolResult({
    container: result,
    summaryLabel: "Marj ozeti",
    summaryValue: state.summaryValue,
    summaryClass: state.summaryClass,
    intro: state.intro,
    metrics: state.metrics,
    visibleTitle: "Acik sonuclar",
    visibleItems: state.visibleItems,
    lockedTitle: "Kilitli stratejik katman",
    lockedItems: state.lockedItems,
    ctaLabel: "Lumina Danismanlik",
    ctaText: "Marj sonucunu fiyatlandirma ve reklam stratejisine birlikte cevirebiliriz.",
    ctaHref: "index.html#iletisim",
  });
};

const getCommissionState = () => {
  const saleAmount = getNumericValue("commissionSaleAmount");
  const rate = getNumericValue("commissionRate");
  const fixedFee = getNumericValue("commissionFixedFee");

  if (saleAmount <= 0 || rate <= 0) {
    return null;
  }

  const commissionAmount = saleAmount * (rate / 100) + fixedFee;
  const netAmount = saleAmount - commissionAmount;
  const effectiveRate = saleAmount > 0 ? (commissionAmount / saleAmount) * 100 : 0;

  return {
    summaryValue: netAmount >= 0 ? "Komisyon hesabi hazir" : "Tutar kontrol edilmeli",
    summaryClass: netAmount >= 0 ? "is-good" : "is-alert",
    intro: `${formatTry(saleAmount)} satis uzerinden toplam kesinti ${formatTry(commissionAmount)} ve elde kalan tutar ${formatTry(netAmount)} olarak hesaplandi.`,
    metrics: [
      { label: "Satis tutari", value: formatTry(saleAmount) },
      { label: "Toplam komisyon", value: formatTry(commissionAmount) },
      { label: "Elde kalan", value: formatTry(netAmount) },
      { label: "Efektif oran", value: `%${formatNumber(effectiveRate, 2)}` },
    ],
    visibleItems: [
      fixedFee > 0
        ? "Sabit kesinti de dahil edilerek efektif komisyon orani hesaplandi."
        : "Hesap yalnizca yuzdelik komisyon uzerinden yapildi.",
      effectiveRate > rate
        ? "Sabit kesinti nedeniyle efektif oran liste oranindan yukari cikti."
        : "Efektif oran komisyon oranina yakin gorunuyor.",
      "Pazaryeri, odeme altyapisi veya temsilci komisyonu icin dogrudan kullanilabilir.",
    ],
    lockedItems: [
      "Komisyon sonrasi net marjin yeterli olup olmadigi detayli katmanda acilir.",
      "Pazaryeri ve site satisi arasindaki farkli senaryo karsilastirmasi ayrica planlanir.",
      "Kesinti azaltma ve fiyat revizyon stratejisi profesyonel katmanda yorumlanir.",
    ],
  };
};

const analyzeCommission = (result) => {
  const state = getCommissionState();

  if (!state) {
    renderToolResult({
      container: result,
      summaryLabel: "Durum",
      summaryValue: "Veri bekleniyor",
      summaryClass: "is-mid",
      intro: "Satis tutari ve komisyon oranini girin. Sabit kesinti varsa ekleyin; arac net elinize kalan tutari hesaplar.",
      metrics: [],
      visibleTitle: "Ne hesaplar?",
      visibleItems: [
        "Toplam komisyon kesintisini",
        "Net elinize kalan tutari",
        "Efektif komisyon oranini",
      ],
      lockedTitle: "Kilitli yorum katmani",
      lockedItems: [
        "Net marj yorumu",
        "Kanal karsilastirmasi",
        "Fiyat revizyon onerisi",
      ],
      ctaLabel: "Lumina Danismanlik",
      ctaText: "Komisyon yukunu fiyat ve kanal stratejisine cevirmek icin detayli katman acilabilir.",
      ctaHref: "index.html#iletisim",
    });
    return;
  }

  renderToolResult({
    container: result,
    summaryLabel: "Kesinti ozeti",
    summaryValue: state.summaryValue,
    summaryClass: state.summaryClass,
    intro: state.intro,
    metrics: state.metrics,
    visibleTitle: "Acik sonuclar",
    visibleItems: state.visibleItems,
    lockedTitle: "Kilitli stratejik katman",
    lockedItems: state.lockedItems,
    ctaLabel: "Fiyat ve Kanal Danismanligi",
    ctaText: "Komisyon etkisini fiyatlandirma ve kanal secimine birlikte baglayabiliriz.",
    ctaHref: "index.html#iletisim",
  });
};

attachToolAction("roasAnalyzeBtn", "roasResult", "Karlılık analizi hazırlanıyor", analyzeRoas);
attachToolAction("seoAnalyzeBtn", "seoResult", "Teknik SEO taraması hazırlanıyor", analyzeSeo);
attachToolAction("academyAnalyzeBtn", "academyResult", "Seviye testi yorumlanıyor", analyzeAcademy);
attachToolAction("cyberAnalyzeBtn", "cyberResult", "Risk sinyalleri taranıyor", analyzeCyber);
attachToolAction("discountAnalyzeBtn", "discountResult", "İndirim hesabı hazırlanıyor", analyzeDiscount);
attachToolAction("percentageAnalyzeBtn", "percentageResult", "Yuzde hesabi hazirlaniyor", analyzePercentage);
attachToolAction("vatAnalyzeBtn", "vatResult", "KDV hesabi hazirlaniyor", analyzeVat);
attachToolAction("marginAnalyzeBtn", "marginResult", "Kar marji hesabi hazirlaniyor", analyzeMargin);
attachToolAction("commissionAnalyzeBtn", "commissionResult", "Komisyon hesabi hazirlaniyor", analyzeCommission);
