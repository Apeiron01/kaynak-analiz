const checkupForm = document.getElementById("checkupForm");
const checkupResult = document.getElementById("checkupResult");

const renderCheckupResult = ({ score = "", levelClass, levelText, paragraphs }) => {
  checkupResult.classList.remove("hidden");
  checkupResult.replaceChildren();

  if (score) {
    const scoreNode = document.createElement("div");
    scoreNode.className = "result-score";
    scoreNode.textContent = score;
    checkupResult.appendChild(scoreNode);
  }

  const levelNode = document.createElement("div");
  levelNode.className = `result-level ${levelClass}`.trim();
  levelNode.textContent = levelText;
  checkupResult.appendChild(levelNode);

  paragraphs.forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    checkupResult.appendChild(paragraph);
  });
};

if (checkupForm && checkupResult) {
  checkupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(checkupForm);
    const values = Array.from(formData.values());

    if (values.some((value) => value === "")) {
      renderCheckupResult({
        levelClass: "level-mid",
        levelText: "Tum sorulari secin",
        paragraphs: ["Skor uretmeden once tum sorular icin bir secim yapmaniz gerekiyor."],
      });
      return;
    }

    let total = 0;

    for (const value of values) {
      total += Number(value);
    }

    const maxScore = 24;
    const percent = Math.round((total / maxScore) * 100);

    let levelClass = "";
    let levelText = "";
    let advice = "";

    if (percent < 45) {
      levelClass = "level-low";
      levelText = "Risk seviyesi yuksek";
      advice = "Temel guvenlik aliskanliklariniz zayif gorunuyor. Iki adimli dogrulama, guclu parola kullanimi, mesaj dogrulama ve odeme oncesi kontrol aliskanliklarini guclendirmeniz gerekir.";
    } else if (percent < 75) {
      levelClass = "level-mid";
      levelText = "Orta seviye guvenlik";
      advice = "Genel farkindaliginiz var ancak bazi aliskanliklar tutarli degil. Parola tekrarini azaltin, cihaz bildirimlerini takip edin ve supheli link veya mesajlara karsi daha sistematik olun.";
    } else {
      levelClass = "level-good";
      levelText = "Iyi seviye guvenlik";
      advice = "Genel guvenlik farkindaliginiz iyi gorunuyor. Bunu surdurmek icin cihaz guncellemeleri, guclu parola kullanimi, giris bildirimleri ve odeme oncesi dogrulama aliskanligini devam ettirin.";
    }

    renderCheckupResult({
      score: `${percent} / 100`,
      levelClass,
      levelText,
      paragraphs: [
        advice,
        "Bu sonuc yon gosterici bir on degerlendirmedir. Daha kapsamli durumlar icin iletisim sayfasindan manuel inceleme talebi gonderebilirsiniz.",
      ],
    });
  });
}
