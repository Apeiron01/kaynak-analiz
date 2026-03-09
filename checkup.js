const checkupForm = document.getElementById("checkupForm");
const checkupResult = document.getElementById("checkupResult");

if (checkupForm && checkupResult) {
  checkupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(checkupForm);
    let total = 0;

    for (const value of formData.values()) {
      total += Number(value);
    }

    const maxScore = 16;
    const percent = Math.round((total / maxScore) * 100);

    let levelClass = "";
    let levelText = "";
    let advice = "";

    if (percent < 45) {
      levelClass = "level-low";
      levelText = "Risk seviyesi yüksek";
      advice = "Temel güvenlik alışkanlıklarınız zayıf görünüyor. İki adımlı doğrulama, güçlü parola kullanımı ve link kontrolü alışkanlıklarını güçlendirmeniz gerekir.";
    } else if (percent < 75) {
      levelClass = "level-mid";
      levelText = "Orta seviye güvenlik";
      advice = "Genel farkındalığınız var ancak bazı alışkanlıklar tutarlı değil. Parola tekrarını azaltın ve şüpheli mesajlara karşı daha sistematik olun.";
    } else {
      levelClass = "level-good";
      levelText = "İyi seviye güvenlik";
      advice = "Genel güvenlik farkındalığınız iyi görünüyor. Bunu sürdürmek için cihaz güncellemeleri, güçlü parola kullanımı ve şüpheli içerik kontrolünü devam ettirin.";
    }

    checkupResult.classList.remove("hidden");
    checkupResult.innerHTML = `
      <div class="result-score">${percent} / 100</div>
      <div class="result-level ${levelClass}">${levelText}</div>
      <p>${advice}</p>
      <p>Bu sonuç yön gösterici bir ön değerlendirmedir. Daha kapsamlı durumlar için iletişim sayfasından manuel inceleme talebi gönderebilirsiniz.</p>
    `;
  });
}
