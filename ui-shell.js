(() => {
  const getLanguageFromPathname = () => (/\-en\.html$/i.test(window.location.pathname) ? "en" : "tr");

  const toLanguagePath = (targetLanguage) => {
    const currentPathname = window.location.pathname || "/";
    const normalizedPathname = currentPathname === "/" ? "/index.html" : currentPathname;
    const isEnglishPath = /\-en\.html$/i.test(normalizedPathname);
    let targetPathname = normalizedPathname;

    if (targetLanguage === "en" && !isEnglishPath) {
      targetPathname = normalizedPathname.replace(/\.html$/i, "-en.html");
    }

    if (targetLanguage === "tr" && isEnglishPath) {
      targetPathname = normalizedPathname.replace(/\-en\.html$/i, ".html");
    }

    if (targetPathname === "/index.html") {
      targetPathname = "/";
    }

    return `${targetPathname}${window.location.search}${window.location.hash}`;
  };

  const closeShellGroup = (selector, toggleSelector) => {
    document.querySelectorAll(`${selector}.is-open`).forEach((container) => {
      container.classList.remove("is-open");
      container.querySelector(toggleSelector)?.setAttribute("aria-expanded", "false");
    });
  };

  const syncMobileShellPanels = () => {
    document.querySelectorAll(".site-header .nav").forEach((nav) => {
      const navLinks = nav.querySelector(".nav-links");
      if (!navLinks) {
        return;
      }

      let panel = navLinks.querySelector("[data-mobile-shell-panel]");
      if (!panel) {
        panel = document.createElement("div");
        panel.className = "mobile-shell-panel";
        panel.dataset.mobileShellPanel = "true";
        navLinks.append(panel);
      }

      const currentLanguage = getLanguageFromPathname();
      const languageItems = [
        {
          href: toLanguagePath("tr"),
          label: "Türkçe",
          active: currentLanguage === "tr",
        },
        {
          href: toLanguagePath("en"),
          label: "English",
          active: currentLanguage === "en",
        },
      ];

      const siteItems = Array.from(nav.querySelectorAll("[data-site-switcher] .site-switcher-link")).map((link) => ({
        href: link.getAttribute("href") || "#",
        label: link.textContent.trim(),
        active: link.classList.contains("is-active"),
      }));

      const renderGroup = (title, items) => {
        if (!items.length) {
          return "";
        }

        const links = items
          .map(
            (item) =>
              `<a class="mobile-shell-link${item.active ? " is-active" : ""}" href="${item.href}"${
                item.active ? ' aria-current="page"' : ""
              }>${item.label}</a>`
          )
          .join("");

        return [
          '<section class="mobile-shell-group">',
          `<p class="mobile-shell-label">${title}</p>`,
          '<div class="mobile-shell-links">',
          links,
          "</div>",
          "</section>",
        ].join("");
      };

      panel.innerHTML = [
        renderGroup("Dil", languageItems),
        renderGroup("Site", siteItems),
      ].join("");
    });
  };

  const ensureLanguageSwitchers = () => {
    document.querySelectorAll(".site-header .nav").forEach((nav) => {
      if (nav.querySelector("[data-lang-switcher]")) {
        return;
      }

      const switcher = document.createElement("div");
      switcher.className = "lang-switcher";
      switcher.dataset.langSwitcher = "true";
      switcher.innerHTML = [
        '<button class="lang-switcher-toggle" type="button" aria-label="Dil se\u00e7imi" aria-expanded="false">',
        '<span class="lang-switcher-current" data-lang-current>TR</span>',
        "</button>",
        '<div class="lang-switcher-menu" role="menu">',
        '<a class="lang-switcher-link" href="#" data-lang-option="tr" role="menuitem">T\u00fcrk\u00e7e</a>',
        '<a class="lang-switcher-link" href="#" data-lang-option="en" role="menuitem">English</a>',
        "</div>",
      ].join("");

      const siteSwitcher = nav.querySelector("[data-site-switcher]");
      if (siteSwitcher && siteSwitcher.parentNode === nav) {
        nav.insertBefore(switcher, siteSwitcher);
        return;
      }

      nav.append(switcher);
    });

    const activeLanguage = getLanguageFromPathname();
    document.querySelectorAll("[data-lang-switcher]").forEach((switcher) => {
      const toggle = switcher.querySelector(".lang-switcher-toggle");
      if (!toggle) {
        return;
      }

      if (switcher.dataset.langBound !== "true") {
        switcher.dataset.langBound = "true";

        toggle.addEventListener("click", (event) => {
          event.stopPropagation();
          const isOpen = switcher.classList.toggle("is-open");
          toggle.setAttribute("aria-expanded", String(isOpen));
        });

        switcher.querySelectorAll("[data-lang-option]").forEach((option) => {
          option.addEventListener("click", (event) => {
            event.preventDefault();
            const targetLanguage = option.getAttribute("data-lang-option");
            if (targetLanguage) {
              window.location.href = toLanguagePath(targetLanguage);
            }
          });
        });
      }

      const currentLabel = switcher.querySelector("[data-lang-current]");
      if (currentLabel) {
        currentLabel.textContent = activeLanguage === "en" ? "EN" : "TR";
      }

      switcher.querySelectorAll("[data-lang-option]").forEach((option) => {
        const optionLanguage = option.getAttribute("data-lang-option");
        const isActive = optionLanguage === activeLanguage;
        option.classList.toggle("is-active", isActive);
        option.setAttribute("aria-current", isActive ? "true" : "false");
        option.setAttribute("href", toLanguagePath(optionLanguage));
      });
    });
  };

  const init = () => {
    if (document.documentElement.dataset.shellUiReady === "true") {
      return window.LuminaSharedShellApi;
    }

    document.documentElement.dataset.shellUiReady = "true";
    document.documentElement.style.scrollBehavior = "smooth";

    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (menuToggle && menuToggle.querySelectorAll("span").length < 3) {
      const missingCount = 3 - menuToggle.querySelectorAll("span").length;
      for (let index = 0; index < missingCount; index += 1) {
        menuToggle.append(document.createElement("span"));
      }
    }

    const closeNavigation = () => {
      if (!menuToggle || !navLinks) {
        return;
      }

      navLinks.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
    };

    if (menuToggle && navLinks && menuToggle.dataset.shellBound !== "true") {
      menuToggle.dataset.shellBound = "true";
      menuToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("active");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
      });

      navLinks.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
          closeNavigation();
        }
      });
    }

    document.querySelectorAll("[data-site-switcher]").forEach((switcher) => {
      const toggle = switcher.querySelector(".site-switcher-toggle");
      if (!toggle || switcher.dataset.shellBound === "true") {
        return;
      }

      switcher.dataset.shellBound = "true";
      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = switcher.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });

      switcher.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          switcher.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    });

    ensureLanguageSwitchers();
    syncMobileShellPanels();

    if (document.documentElement.dataset.shellUiGlobalEvents !== "true") {
      document.documentElement.dataset.shellUiGlobalEvents = "true";

      document.addEventListener("click", (event) => {
        document.querySelectorAll("[data-site-switcher].is-open").forEach((switcher) => {
          if (!switcher.contains(event.target)) {
            switcher.classList.remove("is-open");
            switcher.querySelector(".site-switcher-toggle")?.setAttribute("aria-expanded", "false");
          }
        });

        document.querySelectorAll("[data-lang-switcher].is-open").forEach((switcher) => {
          if (!switcher.contains(event.target)) {
            switcher.classList.remove("is-open");
            switcher.querySelector(".lang-switcher-toggle")?.setAttribute("aria-expanded", "false");
          }
        });
      });

      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
          return;
        }

        closeNavigation();
        closeShellGroup("[data-site-switcher]", ".site-switcher-toggle");
        closeShellGroup("[data-lang-switcher]", ".lang-switcher-toggle");
      });
    }

    window.LuminaSharedShellApi = { closeNavigation };
    return window.LuminaSharedShellApi;
  };

  window.LuminaSharedShell = { init };
})();
