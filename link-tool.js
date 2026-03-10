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
    "shorturl.at",
  ];

  return shorteners.includes(hostname.toLowerCase());
}

function analyzeUrlStructure(urlObject) {
  let risk = 0;
  const notes = [];

  if (urlObject.protocol !== "https:") {
    risk += 2;
    notes.push("Baglanti HTTPS kullanmiyor.");
  } else {
    notes.push("Baglanti HTTPS kullaniyor.");
  }

  if (looksLikeShortener(urlObject.hostname)) {
    risk += 2;
    notes.push("Kisa link servisi kullaniliyor. Nihai hedef dogrudan gorunmuyor.");
  }

  if (isIpAddress(urlObject.hostname)) {
    risk += 2;
    notes.push("Alan adi yerine IP adresi kullaniliyor.");
  }

  if (containsSuspiciousChars(urlObject.hostname)) {
    risk += 2;
    notes.push("Alan adinda olagandisi karakterler tespit edildi.");
  }

  if (urlObject.hostname.split(".").length > 3) {
    risk += 1;
    notes.push("Alan adi cok fazla alt alan iceriyor.");
  }

  if (urlObject.pathname.length > 60) {
    risk += 1;
    notes.push("URL yolu olagandan uzun gorunuyor.");
  }

  if (urlObject.search.length > 80) {
    risk += 1;
    notes.push("Sorgu parametreleri uzun ve karmasik gorunuyor.");
  }

  if (notes.length === 0) {
    notes.push("Belirgin bir yapisal risk sinyali gorulmedi.");
  }

  return { risk, notes };
}

function createParagraph(text, className = "") {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  if (className) {
    paragraph.className = className;
  }

  return paragraph;
}

function createLabeledParagraph(label, value) {
  const paragraph = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  paragraph.appendChild(strong);
  paragraph.appendChild(document.createTextNode(value));
  return paragraph;
}

function renderMessage(text) {
  urlResult.classList.remove("hidden");
  urlResult.replaceChildren(createParagraph(text));
}

function renderAnalysis(levelClass, levelText, parsedUrl, analysis) {
  urlResult.classList.remove("hidden");
  urlResult.replaceChildren();

  const levelNode = document.createElement("div");
  levelNode.className = `result-level ${levelClass}`;
  levelNode.textContent = levelText;
  urlResult.appendChild(levelNode);

  urlResult.appendChild(createLabeledParagraph("Alan adi", parsedUrl.hostname));
  urlResult.appendChild(createLabeledParagraph("Protokol", parsedUrl.protocol));
  urlResult.appendChild(createLabeledParagraph("Yol", parsedUrl.pathname || "/"));
  urlResult.appendChild(createLabeledParagraph("Degerlendirme", ""));

  const list = document.createElement("ul");
  analysis.notes.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    list.appendChild(listItem);
  });
  urlResult.appendChild(list);

  urlResult.appendChild(
    createParagraph(
      "Bu arac yalnizca tarayici icinde gorulebilen yapisal sinyalleri degerlendirir. Domain yasi, blacklist ve gercek yonlendirme hedefi gibi ileri kontroller bu surumde yoktur.",
      "note"
    )
  );
}

if (analyzeUrlBtn && urlInput && urlResult) {
  analyzeUrlBtn.addEventListener("click", () => {
    const rawValue = urlInput.value.trim();

    if (!rawValue) {
      renderMessage("Lutfen analiz etmek icin bir baglanti girin.");
      return;
    }

    let normalizedUrl = rawValue;
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      const parsedUrl = new URL(normalizedUrl);
      const analysis = analyzeUrlStructure(parsedUrl);

      let levelClass = "";
      let levelText = "";

      if (analysis.risk <= 1) {
        levelClass = "level-good";
        levelText = "Dusuk risk sinyali";
      } else if (analysis.risk <= 4) {
        levelClass = "level-mid";
        levelText = "Orta risk sinyali";
      } else {
        levelClass = "level-low";
        levelText = "Yuksek risk sinyali";
      }

      renderAnalysis(levelClass, levelText, parsedUrl, analysis);
    } catch (error) {
      renderMessage("Gecerli bir link formati girin.");
    }
  });
}
