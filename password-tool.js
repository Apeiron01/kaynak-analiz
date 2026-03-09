const passwordInput = document.getElementById("passwordInput");
const passwordMeterBar = document.getElementById("passwordMeterBar");
const passwordStrengthText = document.getElementById("passwordStrengthText");

const generatePasswordBtn = document.getElementById("generatePasswordBtn");
const generatedPassword = document.getElementById("generatedPassword");
const copyPasswordBtn = document.getElementById("copyPasswordBtn");
const copyStatus = document.getElementById("copyStatus");

const passwordLength = document.getElementById("passwordLength");
const includeUppercase = document.getElementById("includeUppercase");
const includeLowercase = document.getElementById("includeLowercase");
const includeNumbers = document.getElementById("includeNumbers");
const includeSymbols = document.getElementById("includeSymbols");

function evaluatePassword(password) {
  let score = 0;

  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  if (score > 100) score = 100;

  let label = "Zayıf";
  if (score >= 70) label = "Güçlü";
  else if (score >= 45) label = "Orta";

  return { score, label };
}

if (passwordInput && passwordMeterBar && passwordStrengthText) {
  passwordInput.addEventListener("input", () => {
    const result = evaluatePassword(passwordInput.value);
    passwordMeterBar.style.width = `${result.score}%`;
    passwordStrengthText.textContent = `Parola seviyesi: ${result.label} (${result.score}/100)`;
  });
}

function generatePassword() {
  const length = Number(passwordLength.value);
  let charset = "";

  if (includeUppercase.checked) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeLowercase.checked) charset += "abcdefghijklmnopqrstuvwxyz";
  if (includeNumbers.checked) charset += "0123456789";
  if (includeSymbols.checked) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (!charset) {
    return "";
  }

  let password = "";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
}

if (generatePasswordBtn && generatedPassword) {
  generatePasswordBtn.addEventListener("click", () => {
    const password = generatePassword();

    if (!password) {
      generatedPassword.value = "";
      copyStatus.textContent = "En az bir karakter grubu seçmelisiniz.";
      return;
    }

    generatedPassword.value = password;
    copyStatus.textContent = "Yeni parola üretildi.";
  });
}

if (copyPasswordBtn && generatedPassword) {
  copyPasswordBtn.addEventListener("click", async () => {
    if (!generatedPassword.value) {
      copyStatus.textContent = "Kopyalanacak parola yok.";
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedPassword.value);
      copyStatus.textContent = "Parola kopyalandı.";
    } catch (error) {
      copyStatus.textContent = "Kopyalama başarısız oldu.";
    }
  });
}
