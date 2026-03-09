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
      advice = "Temel güvenlik alışkanlıklarınız zayıf görünüyor. Öncelikle iki adımlı doğrulama, güçlü parola kullanımı ve link kontrolü alışkanlıkları üzerinde çalışın.";
    } else if (percent < 75) {
      levelClass = "level-mid";
      levelText = "Orta seviye güvenlik";
      advice = "Temel farkındalığınız var ancak bazı alışkanlıklar tutarlı değil. Parola tekrarını azaltın, şüpheli mesajlara karşı daha sistematik olun.";
    } else {
      levelClass = "level-good";
      levelText = "İyi seviye güvenlik";
      advice = "Genel güvenlik farkındalığınız iyi görünüyor. Yine de düzenli parola güncelleme, cihaz güncellemesi ve şüpheli içerik kontrolü sürdürülmeli.";
    }

    checkupResult.classList.remove("hidden");
    checkupResult.innerHTML = `
      <div class="result-score">${percent} / 100</div>
      <div class="result-level ${levelClass}">${levelText}</div>
      <p>${advice}</p>
      <p>Bu skor yön gösterici bir ön değerlendirmedir. Daha kapsamlı inceleme gerekiyorsa manuel analiz talebi gönderebilirsiniz.</p>
    `;
  });
}
