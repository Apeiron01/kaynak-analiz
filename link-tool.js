const analyzeUrlBtn = document.getElementById("analyzeUrlBtn");
const urlInput = document.getElementById("urlInput");
const urlResult = document.getElementById("urlResult");

function isIpAddress(hostname) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

function containsSuspiciousChars(hostname) {
  return /[^a-zA-Z0-9.-]/.test(hostname);
}

function looksLikeShortener(hostname) {
  const shorteners = [
    "bit.ly",
    "t.co",
    "tinyurl.com",
    "ow.ly",
    "buff.ly",
    "cutt.ly",
    "is.gd",
    "rebrand.ly",
    "shorturl.at"
  ];
  return shorteners.includes(hostname.toLowerCase());
}

function analyzeUrlStructure(urlObject) {
  let risk = 0;
  const notes = [];

  if (urlObject.protocol !== "https:") {
    risk += 2;
    notes.push("Bağlantı HTTPS kullanmıyor.");
  } else {
    notes.push("Bağlantı HTTPS kullanıyor.");
  }

  if (looksLikeShortener(urlObject.hostname)) {
    risk += 2;
    notes.push("Kısa link servisi kullanılıyor. Nihai hedef doğrudan görünmüyor.");
  }

  if (isIpAddress(urlObject.hostname)) {
    risk += 2;
    notes.push("Alan adı yerine IP adresi kullanılıyor.");
  }

  if (containsSuspiciousChars(urlObject.hostname)) {
    risk += 2;
    notes.push("Alan adında olağandışı karakterler tespit edildi.");
  }

  if (urlObject.hostname.split(".").length > 3) {
    risk += 1;
    notes.push("Alan adı çok fazla alt alan içeriyor.");
  }

  if (urlObject.pathname.length > 60) {
    risk += 1;
    notes.push("URL yolu olağandan uzun görünüyor.");
  }

  if (urlObject.search.length > 80) {
    risk += 1;
    notes.push("Sorgu parametreleri uzun ve karmaşık görünüyor.");
  }

  if (notes.length === 0) {
    notes.push("Belirgin bir yapısal risk sinyali görülmedi.");
  }

  return { risk, notes };
}

if (analyzeUrlBtn && urlInput && urlResult) {
  analyzeUrlBtn.addEventListener("click", () => {
    const rawValue = urlInput.value.trim();

    if (!rawValue) {
      urlResult.classList.remove("hidden");
      urlResult.innerHTML = `<p>Lütfen analiz etmek için bir bağlantı girin.</p>`;
      return;
    }

    let normalizedUrl = rawValue;
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    try {
      const parsedUrl = new URL(normalizedUrl);
      const analysis = analyzeUrlStructure(parsedUrl);

      let levelClass = "";
      let levelText = "";

      if (analysis.risk <= 1) {
        levelClass = "level-good";
        levelText = "Düşük risk sinyali";
      } else if (analysis.risk <= 4) {
        levelClass = "level-mid";
        levelText = "Orta risk sinyali";
      } else {
        levelClass = "level-low";
        levelText = "Yüksek risk sinyali";
      }

      urlResult.classList.remove("hidden");
      urlResult.innerHTML = `
        <div class="result-level ${levelClass}">${levelText}</div>
        <p><strong>Alan adı:</strong> ${parsedUrl.hostname}</p>
        <p><strong>Protokol:</strong> ${parsedUrl.protocol}</p>
        <p><strong>Yol:</strong> ${parsedUrl.pathname || "/"}</p>
        <p><strong>Değerlendirme:</strong></p>
        <ul>
          ${analysis.notes.map((item) => `<li>${item}</li>`).join("")}
        </ul>
        <p class="note">
          Bu araç yalnızca tarayıcı içinde görülebilen yapısal sinyalleri değerlendirir.
          Domain yaşı, blacklist ve gerçek yönlendirme hedefi gibi ileri kontroller bu sürümde yoktur.
        </p>
      `;
    } catch (error) {
      urlResult.classList.remove("hidden");
      urlResult.innerHTML = `<p>Geçerli bir link formatı girin.</p>`;
    }
  });
}
