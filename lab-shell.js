const labBody = document.body;
const labMenuToggle = document.getElementById("menuToggle");
const labNavLinks = document.getElementById("navLinks");

requestAnimationFrame(() => {
  labBody?.classList.add("is-ready");
});

if (labMenuToggle && labNavLinks) {
  labMenuToggle.addEventListener("click", () => {
    const isOpen = labNavLinks.classList.toggle("active");
    labMenuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  labNavLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      labNavLinks.classList.remove("active");
      labMenuToggle.setAttribute("aria-expanded", "false");
    });
  });
}
