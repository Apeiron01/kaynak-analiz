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
const formsubmitEndpointConfig = window.LUMINA_FORMSUBMIT_ENDPOINTS || {};
const defaultToolLeadEndpoint = "https://formsubmit.co/iletisim@luminadigitale.com";
const toolLeadUnlockStorageKey = "lumina_tool_lead_unlock_v1";
const toolResultRenderCache = new WeakMap();

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getToolLeadUnlockState = () => {
  try {
    const rawState = window.sessionStorage.getItem(toolLeadUnlockStorageKey);
    if (!rawState) {
      return {};
    }

    const parsed = JSON.parse(rawState);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed;
  } catch (_error) {
    return {};
  }
};

let toolLeadUnlockState = getToolLeadUnlockState();

const persistToolLeadUnlockState = () => {
  try {
    window.sessionStorage.setItem(toolLeadUnlockStorageKey, JSON.stringify(toolLeadUnlockState));
  } catch (_error) {
    // Intentionally no-op for private mode or disabled storage.
  }
};

const getToolId = (container) => {
  if (!container) {
    return window.location.pathname || "tool-result";
  }

  return container.id || window.location.pathname || "tool-result";
};

const hasToolLeadAccess = (toolId) => {
  return Boolean(toolLeadUnlockState[toolId]);
};

const unlockToolLead = (toolId) => {
  toolLeadUnlockState = {
    ...toolLeadUnlockState,
    [toolId]: true,
  };

  persistToolLeadUnlockState();
};

const resolveEndpointByKeys = (keys = []) => {
  for (const key of keys) {
    const value = formsubmitEndpointConfig[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return defaultToolLeadEndpoint;
};

const resolveToolLeadEndpoint = () => {
  return resolveEndpointByKeys(["araclar", "tools", "toolLead"]);
};

const resolveEtsyAnalysisEndpoint = () => {
  return resolveEndpointByKeys(["etsy_analiz", "araclar", "tools", "toolLead"]);
};

const resolveFormsubmitAjaxEndpoint = (endpoint) => {
  if (/formsubmit\.co\/ajax\//i.test(endpoint)) {
    return endpoint;
  }

  if (/formsubmit\.co\//i.test(endpoint)) {
    return endpoint.replace(/formsubmit\.co\//i, "formsubmit.co/ajax/");
  }

  return endpoint;
};

const submitToolLead = async ({ email, phone, toolId, summaryLabel, summaryValue }) => {
  const endpoint = resolveToolLeadEndpoint();

  if (/formsubmit\.co/i.test(endpoint)) {
    const formData = new FormData();
    formData.append("eposta", email);
    formData.append("telefon", phone || "Belirtilmedi");
    formData.append("arac", toolId);
    formData.append("ozet_etiketi", summaryLabel);
    formData.append("ozet_degeri", summaryValue);
    formData.append("sayfa", window.location.href);
    formData.append("_subject", `Lumina Lab | Ücretsiz Araç Sonuç Talebi (${toolId})`);
    formData.append("_template", "table");
    formData.append("_captcha", "true");
    formData.append("_honey", "");

    const response = await fetch(resolveFormsubmitAjaxEndpoint(endpoint), {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Lead form submission failed.");
    }

    const rawBody = await response.text();
    if (!rawBody) {
      return;
    }

    let payload = {};
    try {
      payload = JSON.parse(rawBody);
    } catch (_error) {
      payload = {};
    }

    if (payload.success === false || payload.success === "false") {
      throw new Error("Lead form submission rejected.");
    }

    return;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      phone,
      toolId,
      summaryLabel,
      summaryValue,
      page: window.location.href,
      source: "lumina-lab-tool",
    }),
  });

  if (!response.ok) {
    throw new Error("Lead form submission failed.");
  }
};

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
  extraCtaText: "Daha fazla hesaplama aracına mı ihtiyacınız var? Marjory uygulamasını indirerek ek hesaplara hızlı ulaşabilirsiniz.",
  extraCtaHref: "https://play.google.com/store/apps/details?id=com.marjory.app",
  extraCtaButtonText: "Uygulamayı İndir",
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
    return "Değerlendirme Notları";
  }

  return title;
};

const getSafeToolFieldId = (toolId) => toolId.replace(/[^a-z0-9_-]/gi, "-");

const createToolLeadFormMarkup = (toolId) => {
  const safeToolId = escapeHtml(toolId);
  const fieldIdBase = getSafeToolFieldId(toolId);

  return `
    <div class="tool-lead-gate" data-tool-lead-gate>
      <p class="tool-result-gate-note">Detaylı sonucu açmak için e-posta zorunlu, telefon opsiyonel.</p>
      <form class="tool-lead-form" data-tool-lead-form>
        <input type="hidden" name="toolId" value="${safeToolId}" />
        <div class="tool-lead-grid">
          <label for="toolLeadEmail-${fieldIdBase}">E-posta</label>
          <input id="toolLeadEmail-${fieldIdBase}" type="email" name="eposta" placeholder="ornek@eposta.com" required />
          <label for="toolLeadPhone-${fieldIdBase}">Telefon (Opsiyonel)</label>
          <input id="toolLeadPhone-${fieldIdBase}" type="tel" name="telefon" placeholder="05xx xxx xx xx" inputmode="tel" />
          <label class="tool-lead-honey" for="toolLeadWebsite-${fieldIdBase}">Website</label>
          <input class="tool-lead-honey" id="toolLeadWebsite-${fieldIdBase}" type="text" name="_honey" tabindex="-1" autocomplete="off" />
        </div>
        <button class="btn btn-primary" type="submit">Detaylı Sonucu Aç</button>
        <p class="tool-lead-status" data-tool-lead-status aria-live="polite"></p>
      </form>
    </div>
  `;
};

const bindToolLeadForm = ({ container, toolId, summaryLabel, summaryValue }) => {
  const leadForm = container.querySelector("[data-tool-lead-form]");
  if (!leadForm) {
    return;
  }

  const emailInput = leadForm.querySelector('input[name="eposta"]');
  const phoneInput = leadForm.querySelector('input[name="telefon"]');
  const honeyInput = leadForm.querySelector('input[name="_honey"]');
  const statusNode = leadForm.querySelector("[data-tool-lead-status]");
  const submitButton = leadForm.querySelector('button[type="submit"]');

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (leadForm.dataset.submitting === "true") {
      return;
    }

    const emailValue = emailInput?.value?.trim() || "";
    const phoneValue = phoneInput?.value?.trim() || "";
    const honeyValue = honeyInput?.value?.trim() || "";

    if (!emailValue) {
      statusNode.textContent = "Lütfen geçerli bir e-posta girin.";
      statusNode.classList.remove("is-success");
      statusNode.classList.add("is-error");
      emailInput?.focus();
      return;
    }

    if (phoneValue && !/^[0-9+\s().-]{7,20}$/.test(phoneValue)) {
      statusNode.textContent = "Telefon alanını boş bırakabilir veya geçerli bir formatta girebilirsiniz.";
      statusNode.classList.remove("is-success");
      statusNode.classList.add("is-error");
      phoneInput?.focus();
      return;
    }

    if (honeyValue) {
      return;
    }

    leadForm.dataset.submitting = "true";
    submitButton?.setAttribute("disabled", "disabled");
    submitButton?.setAttribute("aria-busy", "true");
    statusNode.textContent = "Veri güvenli bağlantı ile aktarılıyor...";
    statusNode.classList.remove("is-error");
    statusNode.classList.remove("is-success");

    let isSuccess = false;

    try {
      await submitToolLead({
        email: emailValue,
        phone: phoneValue,
        toolId,
        summaryLabel,
        summaryValue,
      });

      isSuccess = true;
      unlockToolLead(toolId);
    } catch (_error) {
      statusNode.textContent = "Gönderim sırasında bir sorun oluştu. Lütfen tekrar deneyin.";
      statusNode.classList.remove("is-success");
      statusNode.classList.add("is-error");
    } finally {
      leadForm.dataset.submitting = "false";

      if (!isSuccess) {
        submitButton?.removeAttribute("disabled");
        submitButton?.removeAttribute("aria-busy");
      }
    }

    if (!isSuccess) {
      return;
    }

    statusNode.textContent = "Başarılı. Detaylı sonuç açılıyor...";
    statusNode.classList.remove("is-error");
    statusNode.classList.add("is-success");

    const lastRenderState = toolResultRenderCache.get(container);
    if (lastRenderState) {
      renderToolResult(lastRenderState);
    }
  });
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
  extraCtaButtonText = "Uygulamayı İndir",
}) => {
  if (!container) {
    return;
  }

  const toolId = getToolId(container);
  toolResultRenderCache.set(container, {
    container,
    summaryLabel,
    summaryValue,
    summaryClass,
    intro,
    metrics,
    visibleTitle,
    visibleItems,
    lockedTitle,
    lockedItems,
    ctaLabel,
    ctaText,
    ctaHref,
    extraCtaText,
    extraCtaHref,
    extraCtaButtonText,
  });

  const safeVisibleItems = visibleItems.length ? visibleItems : ["Bu katmanda ek bir sinyal bulunmuyor."];
  const showCalculatorAppCta = calculatorResultIds.has(container.id);
  const resolvedExtraCtaHref = extraCtaHref || (showCalculatorAppCta ? calculatorAppCta.extraCtaHref : "");
  const resolvedExtraCtaText = extraCtaText || (showCalculatorAppCta ? calculatorAppCta.extraCtaText : "");
  const resolvedExtraCtaButtonText = extraCtaButtonText || calculatorAppCta.extraCtaButtonText;
  const normalizedLockedTitle = normalizeSecondaryTitle(lockedTitle);
  const safeLockedItems = [...new Set(lockedItems.filter(Boolean))];
  const hasLockedInsights = safeLockedItems.length > 0;

  const isUnlocked = !hasLockedInsights || hasToolLeadAccess(toolId);

  const metricsHtml = metrics
    .map(
      (metric) => `
        <article class="tool-metric">
          <small>${escapeHtml(metric.label)}</small>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>
      `
    )
    .join("");

  const visibleHtml = safeVisibleItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const revealedLockedItems = isUnlocked ? safeLockedItems : [];
  const lockedHtml = revealedLockedItems.length
    ? `<ul class="tool-result-list">${revealedLockedItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p class="tool-result-panel-note">Detaylı katman gizli. E-posta girdikten sonra otomatik açılır.</p>`;
  const gateHtml = hasLockedInsights && !isUnlocked ? createToolLeadFormMarkup(toolId) : "";
  const lockedPanelStateClass = isUnlocked ? "is-unlocked" : "is-locked";
  const maskHtml = isUnlocked
    ? ""
    : `
      <div class="tool-result-mask" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

  const safeSummaryClass = ["is-good", "is-mid", "is-alert"].includes(summaryClass) ? summaryClass : "is-mid";
  const safeCtaHref = escapeHtml(ctaHref || "#");

  container.classList.remove("hidden");
  container.innerHTML = `
    <div class="tool-result-summary ${safeSummaryClass}">
      <span>${escapeHtml(summaryLabel)}</span>
      <strong>${escapeHtml(summaryValue)}</strong>
    </div>
    <p class="tool-result-intro">${escapeHtml(intro)}</p>
    <div class="tool-result-metrics">${metricsHtml}</div>
    <div class="tool-result-columns">
      <section class="tool-result-panel">
        <h3>${escapeHtml(visibleTitle)}</h3>
        <ul class="tool-result-list">${visibleHtml}</ul>
      </section>
      <section class="tool-result-panel tool-result-panel-locked ${lockedPanelStateClass}">
        <div class="tool-result-blur">
          ${maskHtml}
          <div class="tool-result-panel-copy">
            <h3>${escapeHtml(normalizedLockedTitle)}</h3>
            ${lockedHtml}
          </div>
        </div>
        <div class="tool-result-cta tool-result-cta-inline">
          ${gateHtml}
          <p class="tool-result-cta-label">${escapeHtml(ctaLabel)}</p>
          <p>${escapeHtml(ctaText)}</p>
          <a class="btn btn-primary" href="${safeCtaHref}">Inceleme Talebi Olustur</a>
        </div>
      </section>
    </div>
  `;

  if (!isUnlocked && hasLockedInsights) {
    bindToolLeadForm({
      container,
      toolId,
      summaryLabel,
      summaryValue,
    });
  }

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
    visibleNotes.push("Net tabloda zarar görünüyor. Yüksek ROAS tek başına sağlıklı bir tablo kurmuyor.");
  } else {
    visibleNotes.push("Net tabloda kâr kalıyor. Ölçekleme öncesi marjı korumak kritik.");
  }

  if (margin < 8) {
    visibleNotes.push("Kâr marjı dar. Reklam büyürken küçük sapmalar bile kârlılığı silebilir.");
  } else if (margin < 18) {
    visibleNotes.push("Marj orta seviyede. Kanal bazlı optimizasyonla rahatlama alanı var.");
  } else {
    visibleNotes.push("Marj güvenli bölgede. Bütçe artışı öncesi ölçek disiplini kurmak mantıklı.");
  }

  if (actualRoas < 2) {
    visibleNotes.push("ROAS düşük. Teklif, kreatif ve ürün katkı payı birlikte ele alınmalı.");
  } else if (actualRoas < 3.5) {
    visibleNotes.push("ROAS fena değil ama maliyet tarafı sıkı yönetilmezse kâr kolay erir.");
  } else {
    visibleNotes.push("ROAS güçlü görünüyor. Asıl soru bunun sürdürülebilir kâr üretip üretmediği.");
  }

  if (adShare > 30) {
    visibleNotes.push("Reklam payı ciroya göre çok yüksek. Ölçekleme öncesi teklif yapısı ve sepet katkısı yeniden bakılmalı.");
  } else if (adShare > 18) {
    visibleNotes.push("Reklam gideri ciro tarafında hissedilir baskı kuruyor. Kârlılık öncesi dikkatli büyüme gerekir.");
  } else {
    visibleNotes.push("Reklam payı kontrollü görünüyor; asıl belirleyici ürün ve operasyon maliyetleri oluyor.");
  }

  const advancedNotes = [
    `Başabaş ROAS eşiği yaklaşık ${formatNumber(breakevenRoas, 2)}. Bunun altı kampanya kârlılığını hızla aşındırır.`,
    `Başabaş reklam tavanı yaklaşık ${formatTry(breakEvenAdBudget)} seviyesinde. Bunun üstü kârı eritmeye başlar.`,
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
      { label: "Reklam payı", value: `%${formatNumber(adShare, 1)}` },
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
    visibleNotes.push("Birkaç hata sayfası tespit edildi. Kullanıcı akışı ve yönlendirme kontrolü gerekli.");
  }

  if (titleCoverage < 70) {
    score -= 18;
    criticalIssues.push("Başlık ve meta kapsama oranı düşük. Arama görünürlüğü sistematik biçimde kaçıyor.");
  } else if (titleCoverage < 90) {
    score -= 8;
    visibleNotes.push("Başlık ve meta kapsama orta seviyede. Şablon düzeni toparlanırsa hızlı kazanım gelir.");
  } else {
    visibleNotes.push("Başlık ve meta kapsama güçlü görünüyor.");
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
    criticalIssues.push("Google Search Console aktif görünmüyor. Teknik karar için veri tabanı eksik kalıyor.");
  }

  if (https === "no") {
    score -= 22;
    criticalIssues.push("HTTPS aktif değil. Bu doğrudan güven ve SEO problemi yaratır.");
  }

  if (usesPunycode) {
    score -= 8;
    criticalIssues.push("Alan adında punycode görünüyor. Marka güveni ve kullanıcı algısı ayrıca kontrol edilmeli.");
  }

  if (hostname.includes("-")) {
    visibleNotes.push("Alan adında tire kullanımı var. Markalaşma ve hatırlanabilirlik tarafı ayrıca değerlendirilmelidir.");
  }

  if (hostname.split(".").length > 3) {
    visibleNotes.push("Alt alan yapısı karmaşık görünüyor. Teknik yönlendirme zinciri kontrol edilmeli.");
  }

  if (hasPath) {
    visibleNotes.push("Analize ana alan adı yerine tam URL girildi. Audit tarafında sayfa tipi bazlı ayrı okuma gerekebilir.");
  }

  if (hostname.length > 28) {
    visibleNotes.push("Alan adı uzun görünüyor. Arama sonucu tıklanabilirliği ve markalaşma açısından ayrıca değerlendirilmelidir.");
  }

  score = Math.max(12, Math.min(100, score));

  const summaryValue = score >= 80 ? "Sağlam temel" : score >= 55 ? "Geliştirilebilir yapı" : "Teknik açıklar yüksek";
  const summaryClass = score >= 80 ? "is-good" : score >= 55 ? "is-mid" : "is-alert";

  if (!criticalIssues.length) {
    criticalIssues.push("Teknik tarafta açık bir kritik hata sinyali yok; yine de sayfa tipi bazlı audit ayrı okunabilir.");
  }

  return {
    summaryValue,
    summaryClass,
    intro: `${hostname} için oluşturulan teknik hazırlık skoru ${formatNumber(score, 0)}/100 seviyesinde. Bu skor tarama, hız ve görünürlük sinyallerinin birleşimidir.`,
    metrics: [
      { label: "SEO hazırlık skoru", value: `${formatNumber(score, 0)} / 100` },
      { label: "Mobil yüklenme", value: `${formatNumber(loadTime, 1)} sn` },
      { label: "Meta kapsama", value: `%${formatNumber(titleCoverage, 0)}` },
      { label: "İndeks sağlığı", value: indexedPages > 0 ? `%${formatNumber(indexHealth, 0)}` : "Veri yok" },
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

  if (values[0] + values[4] <= 4) {
    recommendedProgram = "Etsy veya Shopify temeli";
  } else if (values[1] + values[2] <= 4) {
    recommendedProgram = "Meta Ads ve Google Ads";
  } else if (values[3] <= 2) {
    recommendedProgram = "Kreatif ve teklif uygulaması";
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
    strengths.push("Başlangıç seviyesi için doğru yerdesiniz; en büyük avantajınız temel akış kurabilecek olmanız.");
  }

  return {
    summaryValue: level,
    summaryClass,
    intro: `Toplam skorunuz ${formatNumber(score, 0)}/24. ${nextTrack}`,
    metrics: [
      { label: "Seviye skoru", value: `${formatNumber(score, 0)} / 24` },
      { label: "Hazır olunan katman", value: level },
      { label: "Önerilen yön", value: score <= 16 ? "Temel + uygulama" : "Uygulama + optimizasyon" },
      { label: "İlk öneri", value: recommendedProgram },
    ],
    visibleItems: strengths.slice(0, 3),
    lockedItems: [
      `Eksik olduğunuz ilk 3 konu: ${gaps.slice(0, 3).join(", ")}.`,
      `İlk bakışta size en yakın başlangıç programı: ${recommendedProgram}.`,
      score <= 8
        ? "Önerilen müfredat sırası: mağaza temeli, içerik dili, reklam mantığı, temel metrikler."
        : score <= 16
        ? "Önerilen müfredat sırası: katalog düzeni, ölçümleme, kreatif test, reklam optimizasyonu."
        : "Önerilen müfredat sırası: veri okuma, teklif optimizasyonu, kreatif rotasyonu, ölçekleme disiplini.",
      "Canlı ders ve tekrar izlenebilir modül akışı bu seviyeye göre kişiselleştirilir.",
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
    lockedNotes.push("Bağlantı HTTPS kullanmıyor. Bu, güven sinyalini doğrudan zayıflatıyor.");
  } else {
    visibleNotes.push("Bağlantı HTTPS kullanıyor; bu tek başına güvenli olduğu anlamına gelmez.");
  }

  if (shorteners.has(parsedUrl.hostname.toLowerCase())) {
    risk += 3;
    lockedNotes.push("Kısa link servisi kullanılıyor. Nihai hedef kullanıcıdan saklanıyor olabilir.");
  }

  if (isIpAddress(parsedUrl.hostname)) {
    risk += 3;
    lockedNotes.push("Alan adı yerine IP adresi kullanılıyor. Bu davranış normal kurumsal akışta nadir görülür.");
  }

  if (containsSuspiciousChars(parsedUrl.hostname)) {
    risk += 3;
    lockedNotes.push("Hostname içinde olağandışı karakterler var. Taklit veya gizleme girişimi olabilir.");
  }

  if (parsedUrl.hostname.includes("xn--")) {
    risk += 2;
    lockedNotes.push("Alan adında punycode kullanımı var. Taklit veya maskeleme ihtimali ayrıca değerlendirilmelidir.");
  }

  if (parsedUrl.username || parsedUrl.password) {
    risk += 3;
    lockedNotes.push("URL içinde kullanıcı adı veya parola bilgisi geçiyor. Bu yüksek risk sinyalidir.");
  }

  if (suspiciousKeywordPattern.test(urlFingerprint)) {
    risk += 2;
    lockedNotes.push("URL yapısı giriş, doğrulama veya ödeme baskısı kuran anahtar kelimeler içeriyor.");
  }

  if (riskyTlds.some((suffix) => parsedUrl.hostname.endsWith(suffix))) {
    risk += 2;
    lockedNotes.push("Alan adı uzantısı yüksek riskli vakalarda sık görülen bir gruba yakın.");
  }

  if (parsedUrl.hostname.split(".").length > 3) {
    risk += 1;
    visibleNotes.push("Alan adı yapısı fazla katmanlı. Yönlendirme zinciri ayrıca kontrol edilmeli.");
  }

  if (parsedUrl.pathname.length > 48 || parsedUrl.search.length > 70) {
    risk += 1;
    visibleNotes.push("URL yapısı normalden karmaşık görünüyor.");
  }

  if (queryParamCount >= 5) {
    risk += 1;
    visibleNotes.push("Bağlantı çok sayıda parametre içeriyor. Yönlendirme ve izleme davranışı kontrol edilmeli.");
  }

  if (payment >= 4) {
    visibleNotes.push("Ödeme talebi bulunduğu için risk değerlendirmesi daha kritik hale geliyor.");
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

  if (!lockedNotes.length) {
    lockedNotes.push("URL tarafında ek risk sinyali yakalanmadı; karar yine alan adı, talep tipi ve yönlendirme bağlamıyla okunmalı.");
  }

  return {
    summaryValue,
    summaryClass,
    intro: `${parsedUrl.hostname} için oluşturulan ön tarama skoru ${formatNumber(risk, 0)} risk puanı üretti. Bu sonuç görünür URL ve davranış sinyallerine dayanıyor.`,
    metrics: [
      { label: "Risk puanı", value: `${formatNumber(risk, 0)} / 20+` },
      { label: "Alan adı", value: parsedUrl.hostname },
      { label: "Protokol", value: parsedUrl.protocol.replace(":", "").toUpperCase() },
      { label: "Parametre sayısı", value: `${queryParamCount}` },
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
      ? "İndirimliden indirimsiz fiyat"
      : salePrice <= 0
      ? "İndirimsizden indirimli fiyat"
      : "İki fiyat arasından oran";

  return {
    summaryValue: discountPercent >= 40 ? "Güçlü kampanya" : discountPercent >= 15 ? "Standart indirim" : "Düşük indirim",
    summaryClass: discountPercent >= 40 ? "is-good" : discountPercent >= 15 ? "is-mid" : "is-alert",
    intro: `İndirimsiz fiyat ${formatTry(basePrice)}, indirimli fiyat ${formatTry(discountedPrice)} ve hesaplanan oran %${formatNumber(discountPercent, 1)}.`,
    metrics: [
      { label: "İndirimsiz fiyat", value: formatTry(basePrice) },
      { label: "İndirimli fiyat", value: formatTry(discountedPrice) },
      { label: "İndirim oranı", value: `%${formatNumber(discountPercent, 1)}` },
      { label: "Tasarruf", value: formatTry(savings) },
    ],
    visibleItems: [
      `Toplam indirim tutarı ${formatTry(savings)} seviyesinde.`,
      `Hesap modu: ${calculationMode}.`,
      discountPercent >= 40
        ? "Kampanya algısı güçlü görünüyor; marj tarafını ayrıca kontrol etmek gerekir."
        : "Fiyat farkı kullanıcıya görünür, ancak teklif mesajı ile desteklenirse daha iyi çalışır.",
      originalPrice <= 0
        ? "İndirimli fiyattan indirimsiz fiyat geriye doğru hesaplandı."
        : salePrice <= 0
        ? "İndirimsiz fiyat ve oran üzerinden yeni fiyat hesaplandı."
        : "İki fiyat üzerinden indirim oranı netleşti.",
    ],
    lockedItems: [
      "Kademeli kampanya önerisi ve eşik fiyat yorumu tam analizde açılır.",
      "Ürün marjı ve reklam maliyeti ile birlikte değerlendirilince daha doğru karar verilir.",
      "Aynı teklif için psikolojik fiyat kırılımı ve paketleme önerileri ayrı raporda sunulur.",
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
      summaryValue: "Yüzde hesabı hazır",
      summaryClass: "is-good",
      intro: `${formatNumber(valueA, 2)} sayısının %${formatNumber(valueB, 2)} değeri ${formatNumber(result, 2)} olarak hesaplandı.`,
      metrics: [
        { label: "Ana sayı", value: formatNumber(valueA, 2) },
        { label: "Yüzde oranı", value: `%${formatNumber(valueB, 2)}` },
        { label: "Sonuç", value: formatNumber(result, 2) },
      ],
      visibleItems: [
        `Hesap modu: bir sayının yüzdesi.`,
        `Sonuç doğrudan ${formatNumber(result, 2)} seviyesinde.`,
        valueB >= 50
          ? "Yüzde oranı yüksek olduğu için sonuç ana sayının büyük kısmını temsil ediyor."
          : "Yüzde oranı orta veya düşük olduğu için sonuç ana sayının bir alt dilimini gösteriyor.",
      ],
      lockedItems: [
        "Fiyat kırılımı ve teklif dili yorumu detaylı analizde açılır.",
        "Bu oran kampanya, zam veya indirim kurgusuna nasıl döner ayrıca planlanır.",
        "Ticari sayfalarda psikolojik eşik kontrolü ayrıca yorumlanır.",
      ],
    };
  }

  if (mode === "ratio") {
    const result = valueB === 0 ? 0 : (valueA / valueB) * 100;
    return {
      summaryValue: "Oran hesabı hazır",
      summaryClass: result <= 100 ? "is-good" : "is-mid",
      intro: `${formatNumber(valueA, 2)} değeri, ${formatNumber(valueB, 2)} sayısının yaklaşık %${formatNumber(result, 2)} karşılığına denk geliyor.`,
      metrics: [
        { label: "İlk değer", value: formatNumber(valueA, 2) },
        { label: "İkinci değer", value: formatNumber(valueB, 2) },
        { label: "Yüzde sonucu", value: `%${formatNumber(result, 2)}` },
      ],
      visibleItems: [
        "Hesap modu: bir sayı diğer sayının yüzde kaçı.",
        result > 100
          ? "İlk değer ikinci değerden büyük olduğu için oran %100'ü aştı."
          : "İlk değer ikinci değerin altında kaldığı için oran %100'ün altında.",
        "Oran hesabı teklif, tamamlama ve hedef takibinde doğrudan kullanılabilir.",
      ],
      lockedItems: [
        "Oran yorumunun satış hedefiyle eşleştirilmiş sürümü detaylı katmanda açılır.",
        "Yüzde sonucunun kampanya ya da fiyatlandırma etkisi ayrıca planlanır.",
        "Hedef tamamlama veya KPI eşik yorumu profesyonel katmanda açılır.",
      ],
    };
  }

  const delta = (valueA * valueB) / 100;
  const result = direction === "decrease" ? valueA - delta : valueA + delta;

  return {
    summaryValue: direction === "decrease" ? "Azalış hesabı hazır" : "Artış hesabı hazır",
    summaryClass: "is-good",
    intro: `${formatNumber(valueA, 2)} değeri, %${formatNumber(valueB, 2)} ${direction === "decrease" ? "azalış" : "artış"} ile ${formatNumber(result, 2)} oluyor.`,
    metrics: [
      { label: "Başlangıç", value: formatNumber(valueA, 2) },
      { label: "Değişim", value: `%${formatNumber(valueB, 2)}` },
      { label: "Yeni değer", value: formatNumber(result, 2) },
    ],
    visibleItems: [
      `Hesap modu: yüzde ${direction === "decrease" ? "azalış" : "artış"}.`,
      `Sayısal fark ${formatNumber(delta, 2)} seviyesinde.`,
      direction === "decrease"
        ? "Bu çıktı indirim, kayıp veya düşüş hesaplarında kullanılabilir."
        : "Bu çıktı zam, artış veya hedef büyüme hesaplarında kullanılabilir.",
    ],
    lockedItems: [
      "Yeni değerin fiyat algısına etkisi detaylı yorum katmanında açılır.",
      "Oran büyüdükçe talep etkisi ve dönüşüm farkı ayrıca değerlendirilir.",
      "Ticari senaryolarda kâr marjı uyumu ek katmanda incelenir.",
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
      intro: "Yüzde hesabı için iki alan doldurun. Araç; bir sayının yüzdesi, oran veya artış-azalış hesabını yapar.",
      metrics: [],
      visibleTitle: "Ne hesaplar?",
      visibleItems: [
        "Bir sayının yüzdesini bulur.",
        "Bir sayının diğer sayının yüzde kaçı olduğunu hesaplar.",
        "Yüzde artış ve azalış sonucunu netleştirir.",
      ],
      lockedTitle: "Kilitli yorum katmanı",
      lockedItems: [
        "Fiyatlama ve teklif etkisi",
        "Hedef tamamlama yorumu",
        "Psikolojik eşik kontrolü",
      ],
      ctaLabel: "Lumina Danışmanlık",
      ctaText: "Yüzde sonucu ticari bir karara dönüşecekse detaylı yorum katmanına geçilebilir.",
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
    lockedTitle: "Kilitli yorum katmanı",
    lockedItems: state.lockedItems,
    ctaLabel: "Lumina Lab Pro",
    ctaText: "Sonucu fiyat, teklif veya büyüme kararına çevirmek için detaylı katman açılabilir.",
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
    summaryValue: "KDV hesabı hazır",
    summaryClass: "is-good",
    intro:
      mode === "net-to-gross"
        ? `KDV hariç ${formatTry(netAmount)} tutar için %${formatNumber(rate, 0)} oranında KDV eklendiğinde toplam ${formatTry(grossAmount)} oluyor.`
        : `KDV dahil ${formatTry(grossAmount)} tutarın içinde %${formatNumber(rate, 0)} oranında yaklaşık ${formatTry(vatAmount)} KDV bulunuyor.`,
    metrics: [
      { label: "KDV hariç", value: formatTry(netAmount) },
      { label: "KDV tutarı", value: formatTry(vatAmount) },
      { label: "KDV dahil", value: formatTry(grossAmount) },
    ],
    visibleItems: [
      `Seçilen KDV oranı %${formatNumber(rate, 0)} olarak uygulandı.`,
      mode === "net-to-gross"
        ? "Bu hesap net fiyata KDV eklenmiş son tutarı verir."
        : "Bu hesap toplam tutarın içindeki vergi kırılımını ayırır.",
      "Fatura, teklif ve fiyat etiketi hazırlarken doğrudan kullanılabilir.",
    ],
    lockedItems: [
      "KDV dahil fiyat algısı ve teklif etkisi detaylı yorum katmanında açılır.",
      "Brüt-net geçişlerinin marj etkisi birlikte yorumlanır.",
      "KDV oranına göre listeleme ve teklif stratejisi ayrıca planlanır.",
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
      intro: "KDV hariç ya da KDV dahil tutarı ve KDV oranını girin. Araç net, vergi ve brüt tutarı otomatik hesaplar.",
      metrics: [],
      visibleTitle: "Ne hesaplar?",
      visibleItems: [
        "KDV hariçten KDV dahil tutarı",
        "KDV dahil tutarın vergi kırılımını",
        "Net, KDV ve toplam tutarı birlikte",
      ],
      lockedTitle: "Kilitli yorum katmanı",
      lockedItems: [
        "Fiyat algısı yorumu",
        "Marj etkisi analizi",
        "Teklif kurgusu önerisi",
      ],
      ctaLabel: "Lumina Danışmanlık",
      ctaText: "KDV sonucunu teklif ve satış kararına çevirmek için detaylı katman açılabilir.",
      ctaHref: "index.html#iletisim",
    });
    return;
  }

  renderToolResult({
    container: result,
    summaryLabel: "Vergi özeti",
    summaryValue: state.summaryValue,
    summaryClass: state.summaryClass,
    intro: state.intro,
    metrics: state.metrics,
    visibleTitle: "Açık sonuçlar",
    visibleItems: state.visibleItems,
    lockedTitle: "Kilitli yorum katmanı",
    lockedItems: state.lockedItems,
    ctaLabel: "Fiyatlandırma Danışmanlığı",
    ctaText: "Vergi dahil fiyat yapısının satışa etkisini birlikte netleştirebiliriz.",
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
    summaryValue: profit >= 0 ? "Marj görünüyor" : "Zarar görünüyor",
    summaryClass: profit >= 0 ? (margin >= 20 ? "is-good" : "is-mid") : "is-alert",
    intro: `Satış fiyatı ${formatTry(salePrice)} ve toplam maliyet ${formatTry(totalCost)} için birim sonuç ${formatTry(profit)} seviyesinde.`,
    metrics: [
      { label: "Toplam maliyet", value: formatTry(totalCost) },
      { label: "Birim kâr", value: formatTry(profit) },
      { label: "Kâr marjı", value: `%${formatNumber(margin, 1)}` },
      { label: "Markup", value: `%${formatNumber(markup, 1)}` },
    ],
    visibleItems: [
      profit < 0
        ? "Satış fiyatı maliyeti karşılamıyor; bu ürün zararla ilerliyor."
        : "Satış fiyatı maliyeti karşılıyor; asıl konu marjın yeterli olup olmadığı.",
      margin < 10
        ? "Kâr marjı dar. Reklam ve operasyon sapması kârlılığı hızla silebilir."
        : margin < 20
        ? "Kâr marjı orta seviyede. Kanal maliyetleriyle birlikte takip edilmeli."
        : "Kâr marjı güvenli bölgede görünüyor.",
      extraCost > 0
        ? "Ek maliyet girildiği için sonuç operasyon giderlerini de hesaba katıyor."
        : "Ek maliyet alanı boş; paketleme veya operasyon gideri varsa dahil etmek gerekir.",
    ],
    lockedItems: [
      "Reklam maliyeti eklendiğinde net marj kırılımı detaylı katmanda açılır.",
      "Psikolojik fiyat eşiği ve bundle etkisi ayrıca yorumlanır.",
      "Bu marj yapısının kanal bazlı büyüme kapasitesi ayrıca planlanır.",
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
      intro: "Satış fiyatı ve maliyeti girin. Araç; birim kâr, kâr marjı ve markup hesabını birlikte yapar.",
      metrics: [],
      visibleTitle: "Ne hesaplar?",
      visibleItems: [
        "Birim kâr tutarını",
        "Kâr marjı yüzdesini",
        "Markup oranını",
      ],
      lockedTitle: "Kilitli yorum katmanı",
      lockedItems: [
        "Reklam maliyeti etkisi",
        "Fiyat eşiği yorumu",
        "Büyüme uygunluğu analizi",
      ],
      ctaLabel: "E-Ticaret Danışmanlığı",
      ctaText: "Marj hesabını ürün ve reklam kararına çevirmek için detaylı katman açılabilir.",
      ctaHref: "index.html#iletisim",
    });
    return;
  }

  renderToolResult({
    container: result,
    summaryLabel: "Marj özeti",
    summaryValue: state.summaryValue,
    summaryClass: state.summaryClass,
    intro: state.intro,
    metrics: state.metrics,
    visibleTitle: "Açık sonuçlar",
    visibleItems: state.visibleItems,
    lockedTitle: "Kilitli stratejik katman",
    lockedItems: state.lockedItems,
    ctaLabel: "Lumina Danışmanlık",
    ctaText: "Marj sonucunu fiyatlandırma ve reklam stratejisine birlikte çevirebiliriz.",
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
    summaryValue: netAmount >= 0 ? "Komisyon hesabı hazır" : "Tutar kontrol edilmeli",
    summaryClass: netAmount >= 0 ? "is-good" : "is-alert",
    intro: `${formatTry(saleAmount)} satış üzerinden toplam kesinti ${formatTry(commissionAmount)} ve elde kalan tutar ${formatTry(netAmount)} olarak hesaplandı.`,
    metrics: [
      { label: "Satış tutarı", value: formatTry(saleAmount) },
      { label: "Toplam komisyon", value: formatTry(commissionAmount) },
      { label: "Elde kalan", value: formatTry(netAmount) },
      { label: "Efektif oran", value: `%${formatNumber(effectiveRate, 2)}` },
    ],
    visibleItems: [
      fixedFee > 0
        ? "Sabit kesinti de dahil edilerek efektif komisyon oranı hesaplandı."
        : "Hesap yalnızca yüzdelik komisyon üzerinden yapıldı.",
      effectiveRate > rate
        ? "Sabit kesinti nedeniyle efektif oran liste oranından yukarı çıktı."
        : "Efektif oran komisyon oranına yakın görünüyor.",
      "Pazaryeri, ödeme altyapısı veya temsilci komisyonu için doğrudan kullanılabilir.",
    ],
    lockedItems: [
      "Komisyon sonrası net marjın yeterli olup olmadığı detaylı katmanda açılır.",
      "Pazaryeri ve site satışı arasındaki farklı senaryo karşılaştırması ayrıca planlanır.",
      "Kesinti azaltma ve fiyat revizyon stratejisi profesyonel katmanda yorumlanır.",
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
      intro: "Satış tutarı ve komisyon oranını girin. Sabit kesinti varsa ekleyin; araç net elinize kalan tutarı hesaplar.",
      metrics: [],
      visibleTitle: "Ne hesaplar?",
      visibleItems: [
        "Toplam komisyon kesintisini",
        "Net elinize kalan tutarı",
        "Efektif komisyon oranını",
      ],
      lockedTitle: "Kilitli yorum katmanı",
      lockedItems: [
        "Net marj yorumu",
        "Kanal karşılaştırması",
        "Fiyat revizyon önerisi",
      ],
      ctaLabel: "Lumina Danışmanlık",
      ctaText: "Komisyon yükünü fiyat ve kanal stratejisine çevirmek için detaylı katman açılabilir.",
      ctaHref: "index.html#iletisim",
    });
    return;
  }

  renderToolResult({
    container: result,
    summaryLabel: "Kesinti özeti",
    summaryValue: state.summaryValue,
    summaryClass: state.summaryClass,
    intro: state.intro,
    metrics: state.metrics,
    visibleTitle: "Açık sonuçlar",
    visibleItems: state.visibleItems,
    lockedTitle: "Kilitli stratejik katman",
    lockedItems: state.lockedItems,
    ctaLabel: "Fiyat ve Kanal Danışmanlığı",
    ctaText: "Komisyon etkisini fiyatlandırma ve kanal seçimine birlikte bağlayabiliriz.",
    ctaHref: "index.html#iletisim",
  });
};

const submitEtsyAnalysisRequest = async (payload) => {
  const endpoint = resolveEtsyAnalysisEndpoint();

  if (/formsubmit\.co/i.test(endpoint)) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value || "Belirtilmedi");
    });

    formData.append("_subject", "Lumina Lab | Etsy Ürün Analiz Talebi");
    formData.append("_template", "table");
    formData.append("_captcha", "true");
    formData.append("_honey", "");
    formData.append("sayfa", window.location.href);

    const response = await fetch(resolveFormsubmitAjaxEndpoint(endpoint), {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Etsy analysis form submission failed.");
    }

    const rawBody = await response.text();
    if (!rawBody) {
      return;
    }

    let body = {};
    try {
      body = JSON.parse(rawBody);
    } catch (_error) {
      body = {};
    }

    if (body.success === false || body.success === "false") {
      throw new Error("Etsy analysis form rejected.");
    }

    return;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      ...payload,
      source: "etsy-urun-analizi",
      page: window.location.href,
    }),
  });

  if (!response.ok) {
    throw new Error("Etsy analysis form submission failed.");
  }
};

const attachEtsyManualForm = () => {
  const form = document.getElementById("etsyManualForm");
  const result = document.getElementById("etsyManualResult");

  if (!form || !result) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (form.dataset.submitting === "true") {
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const payload = {
      ad_soyad: String(formData.get("ad_soyad") || "").trim(),
      eposta: String(formData.get("eposta") || "").trim(),
      telefon: String(formData.get("telefon") || "").trim(),
      magaza_adi: String(formData.get("magaza_adi") || "").trim(),
      magaza_linki: String(formData.get("magaza_linki") || "").trim(),
      ana_kategori: String(formData.get("ana_kategori") || "").trim(),
      aylik_siparis_adedi: String(formData.get("aylik_siparis_adedi") || "").trim(),
      ortalama_sepet_tutari: String(formData.get("ortalama_sepet_tutari") || "").trim(),
      hedef_ulke: String(formData.get("hedef_ulke") || "").trim(),
      analiz_hedefi: String(formData.get("analiz_hedefi") || "").trim(),
      ek_notlar: String(formData.get("ek_notlar") || "").trim(),
    };

    form.dataset.submitting = "true";
    submitButton?.setAttribute("disabled", "disabled");
    submitButton?.setAttribute("aria-busy", "true");

    renderToolLoading(result, "Etsy ürün analiz talebi gönderiliyor");

    try {
      await submitEtsyAnalysisRequest(payload);

      const submittedAt = new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date());

      result.classList.remove("hidden");
      result.innerHTML = `
        <div class="tool-result-summary is-good">
          <span>Talep Durumu</span>
          <strong>Talep Alındı</strong>
        </div>
        <p class="tool-result-intro">Etsy ürün analizi talebiniz başarıyla ulaştı. Analizin sonucu mail ile iletilecektir.</p>
        <div class="tool-result-metrics">
          <article class="tool-metric">
            <small>İletişim e-postası</small>
            <strong>${escapeHtml(payload.eposta)}</strong>
          </article>
          <article class="tool-metric">
            <small>Ürün / mağaza bilgisi</small>
            <strong>${escapeHtml(payload.magaza_adi || payload.magaza_linki || "Belirtilmedi")}</strong>
          </article>
          <article class="tool-metric">
            <small>Talep zamanı</small>
            <strong>${escapeHtml(submittedAt)}</strong>
          </article>
        </div>
        <section class="tool-result-panel">
          <h3>Sonraki Adım</h3>
          <ul class="tool-result-list">
            <li>Talebiniz ekip tarafından manuel olarak değerlendirilecektir.</li>
            <li>Öncelikli aksiyonlar ve ürün notları e-posta ile paylaşılacaktır.</li>
            <li>Gerekirse ek veri için sizinle yine e-posta üzerinden iletişime geçilecektir.</li>
          </ul>
        </section>
      `;

      form.reset();
    } catch (_error) {
      result.classList.remove("hidden");
      result.innerHTML = `
        <div class="tool-result-summary is-alert">
          <span>Talep Durumu</span>
          <strong>Gönderim Başarısız</strong>
        </div>
        <p class="tool-result-intro">Form gönderimi sırasında bir sorun oluştu. Lütfen tekrar deneyin.</p>
      `;
    } finally {
      form.dataset.submitting = "false";
      submitButton?.removeAttribute("disabled");
      submitButton?.removeAttribute("aria-busy");
    }
  });
};

attachEtsyManualForm();

attachToolAction("roasAnalyzeBtn", "roasResult", "Karlılık analizi hazırlanıyor", analyzeRoas);
attachToolAction("seoAnalyzeBtn", "seoResult", "Teknik SEO taraması hazırlanıyor", analyzeSeo);
attachToolAction("academyAnalyzeBtn", "academyResult", "Seviye testi yorumlanıyor", analyzeAcademy);
attachToolAction("cyberAnalyzeBtn", "cyberResult", "Risk sinyalleri taranıyor", analyzeCyber);
attachToolAction("discountAnalyzeBtn", "discountResult", "İndirim hesabı hazırlanıyor", analyzeDiscount);
attachToolAction("percentageAnalyzeBtn", "percentageResult", "Yüzde hesabı hazırlanıyor", analyzePercentage);
attachToolAction("vatAnalyzeBtn", "vatResult", "KDV hesabı hazırlanıyor", analyzeVat);
attachToolAction("marginAnalyzeBtn", "marginResult", "Kâr marjı hesabı hazırlanıyor", analyzeMargin);
attachToolAction("commissionAnalyzeBtn", "commissionResult", "Komisyon hesabı hazırlanıyor", analyzeCommission);


