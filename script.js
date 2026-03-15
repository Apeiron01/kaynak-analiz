const body = document.body;
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const nativeFormSubmit = HTMLFormElement.prototype.submit;
const formsubmitEndpointConfig = window.LUMINA_FORMSUBMIT_ENDPOINTS || {};
let activeScrollAnimationFrame = null;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (menuToggle && menuToggle.querySelectorAll("span").length < 3) {
  const missingCount = 3 - menuToggle.querySelectorAll("span").length;

  for (let index = 0; index < missingCount; index += 1) {
    menuToggle.append(document.createElement("span"));
  }
}

document.documentElement.style.scrollBehavior = "smooth";

document.querySelectorAll('a[target="_blank"]').forEach((link) => {
  const relTokens = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
  relTokens.add("noopener");
  relTokens.add("noreferrer");
  link.setAttribute("rel", Array.from(relTokens).join(" "));
});

document.querySelectorAll("img").forEach((image) => {
  if (!image.hasAttribute("decoding")) {
    image.decoding = "async";
  }

  const markImageReady = () => {
    image.dataset.mediaReady = "true";
    const visualWrapper = image.closest(".hero-visual");
    if (visualWrapper) {
      visualWrapper.dataset.visualReady = "true";
    }
  };

  if (image.complete) {
    markImageReady();
  } else {
    image.addEventListener("load", markImageReady, { once: true });
    image.addEventListener("error", markImageReady, { once: true });
  }

  const isCriticalImage = Boolean(
    image.closest(".site-header, .home-hero, .consulting-stage, .page-hero, .hero-carousel, .consulting-showcase, .article-hero, .blog-hub-hero, .thanks-card")
  );

  if (!isCriticalImage && !image.hasAttribute("loading")) {
    image.loading = "lazy";
  }

  if (!isCriticalImage && !image.hasAttribute("fetchpriority")) {
    image.fetchPriority = "low";
  }
});

requestAnimationFrame(() => {
  body.classList.add("is-ready");
});

const closeNavigation = () => {
  if (!menuToggle || !navLinks) {
    return;
  }

  navLinks.classList.remove("active");
  menuToggle.setAttribute("aria-expanded", "false");
};

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNavigation);
  });
}

document.querySelectorAll("[data-site-switcher]").forEach((switcher) => {
  const toggle = switcher.querySelector(".site-switcher-toggle");

  if (!toggle) {
    return;
  }

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

document.addEventListener("click", (event) => {
  document.querySelectorAll("[data-site-switcher].is-open").forEach((switcher) => {
    if (!switcher.contains(event.target)) {
      switcher.classList.remove("is-open");
      const toggle = switcher.querySelector(".site-switcher-toggle");
      toggle?.setAttribute("aria-expanded", "false");
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  closeNavigation();

  document.querySelectorAll("[data-site-switcher].is-open").forEach((switcher) => {
    switcher.classList.remove("is-open");
    const toggle = switcher.querySelector(".site-switcher-toggle");
    toggle?.setAttribute("aria-expanded", "false");
  });
});

const getScrollOffset = () => {
  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".nav");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const navHeight = nav ? nav.getBoundingClientRect().height : 0;

  return Math.max(headerHeight, navHeight) + 24;
};

const easeInOutCubic = (progress) => {
  if (progress < 0.5) {
    return 4 * progress * progress * progress;
  }

  return 1 - Math.pow(-2 * progress + 2, 3) / 2;
};

const animateWindowScrollTo = (targetTop) => {
  if (activeScrollAnimationFrame) {
    window.cancelAnimationFrame(activeScrollAnimationFrame);
    activeScrollAnimationFrame = null;
  }

  const startTop = window.scrollY;
  const distance = targetTop - startTop;

  if (Math.abs(distance) < 2) {
    window.scrollTo(0, targetTop);
    return;
  }

  const duration = Math.min(920, Math.max(420, Math.abs(distance) * 0.6));
  let startTime = null;

  const step = (timestamp) => {
    if (startTime === null) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const progress = Math.min(1, elapsed / duration);
    const nextTop = startTop + distance * easeInOutCubic(progress);

    window.scrollTo(0, nextTop);

    if (progress < 1) {
      activeScrollAnimationFrame = window.requestAnimationFrame(step);
      return;
    }

    activeScrollAnimationFrame = null;
    window.scrollTo(0, targetTop);
  };

  activeScrollAnimationFrame = window.requestAnimationFrame(step);
};

const normalizePath = (path) => {
  const trimmed = (path || "").replace(/\/+$/g, "");

  if (trimmed === "" || trimmed === "/" || trimmed.toLowerCase() === "/index.html") {
    return "/";
  }

  return trimmed.replace(/\/index\.html$/i, "") || "/";
};

const getTargetFromHash = (hash) => {
  if (!hash || hash === "#") {
    return null;
  }

  const rawId = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!rawId) {
    return null;
  }

  let decodedId = rawId;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch (_error) {
    decodedId = rawId;
  }

  const byId = document.getElementById(decodedId);
  if (byId) {
    return byId;
  }

  try {
    return document.querySelector(`#${CSS.escape(decodedId)}`);
  } catch (_error) {
    return null;
  }
};

const scrollToHashTarget = (hash, options = {}) => {
  const { updateHistory = true } = options;

  const target = getTargetFromHash(hash);
  if (!target) {
    return false;
  }

  const top = window.scrollY + target.getBoundingClientRect().top - getScrollOffset();
  const destination = Math.max(0, top);

  animateWindowScrollTo(destination);

  if (updateHistory) {
    history.replaceState(null, "", hash);
  }

  return true;
};

const isSamePageHashLink = (link) => {
  const href = link.getAttribute("href");

  if (!href || href === "#") {
    return { isHashLink: false, hash: "" };
  }

  if (href.startsWith("#")) {
    return { isHashLink: true, hash: href };
  }

  if (!href.includes("#")) {
    return { isHashLink: false, hash: "" };
  }

  const url = new URL(href, window.location.href);
  const samePath =
    url.origin === window.location.origin &&
    normalizePath(url.pathname) === normalizePath(window.location.pathname);

  return {
    isHashLink: samePath && Boolean(url.hash),
    hash: samePath ? url.hash : "",
  };
};

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href]');
  if (!link) {
    return;
  }

  const { isHashLink, hash } = isSamePageHashLink(link);
  if (!isHashLink) {
    return;
  }

  if (!getTargetFromHash(hash)) {
    return;
  }

  event.preventDefault();

  if (!scrollToHashTarget(hash)) {
    return;
  }

  closeNavigation();
});

const syncInitialHashScroll = () => {
  if (!window.location.hash) {
    return;
  }

  window.requestAnimationFrame(() => {
    scrollToHashTarget(window.location.hash, { updateHistory: false });
  });
};

window.addEventListener("load", syncInitialHashScroll);
window.addEventListener("hashchange", () => {
  scrollToHashTarget(window.location.hash, { updateHistory: false });
});

document.querySelectorAll(".faq-question").forEach((button) => {
  button.addEventListener("click", () => {
    const answer = button.nextElementSibling;
    const isExpanded = button.getAttribute("aria-expanded") === "true";

    button.setAttribute("aria-expanded", String(!isExpanded));

    if (answer) {
      answer.hidden = isExpanded;
    }

    const icon = button.querySelector(".faq-icon");
    if (icon) {
      icon.textContent = isExpanded ? "+" : "-";
    }
  });
});

const revealItems = document.querySelectorAll("[data-reveal]");
if (revealItems.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => {
    revealObserver.observe(item);
  });
}

const bindSwipeNavigation = (container, onPrev, onNext) => {
  let touchStartX = 0;
  let touchStartY = 0;

  container.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    },
    { passive: true }
  );

  container.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      if (Math.abs(deltaY) > Math.abs(deltaX) || Math.abs(deltaX) < 32) {
        return;
      }

      if (deltaX > 0) {
        onPrev();
      } else {
        onNext();
      }
    },
    { passive: true }
  );
};

const heroCarousel = document.querySelector("[data-carousel]");
if (heroCarousel) {
  const track = heroCarousel.querySelector("[data-carousel-track]");
  const slides = Array.from(heroCarousel.querySelectorAll("[data-slide]"));
  const dots = Array.from(heroCarousel.querySelectorAll("[data-slide-to]"));
  const prevButton = heroCarousel.querySelector("[data-prev]");
  const nextButton = heroCarousel.querySelector("[data-next]");
  const viewport = heroCarousel.querySelector(".hero-viewport") || heroCarousel;

  if (!track || !slides.length) {
    // no-op
  } else {
    let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
    let autoplayId = null;
    const mobileCarouselBreakpoint = window.matchMedia("(max-width: 900px)");

    if (activeIndex < 0) {
      activeIndex = 0;
    }

    const updateSlides = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      track.style.transform = `translate3d(-${activeIndex * 100}%, 0, 0)`;

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));

        if ("inert" in slide) {
          slide.inert = !isActive;
        }
      });

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-pressed", String(isActive));
      });
    };

    const moveSlide = (direction) => {
      if (slides.length < 2) {
        return;
      }

      updateSlides(activeIndex + direction);
    };

    const stopAutoplay = () => {
      if (!autoplayId) {
        return;
      }

      window.clearInterval(autoplayId);
      autoplayId = null;
    };

    const canAutoplayHero = () => slides.length > 1 && !prefersReducedMotion && !mobileCarouselBreakpoint.matches && !document.hidden;

    const restartAutoplay = () => {
      stopAutoplay();

      if (!canAutoplayHero()) {
        return;
      }

      autoplayId = window.setInterval(() => {
        moveSlide(1);
      }, 7000);
    };

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        if (index === activeIndex) {
          return;
        }

        updateSlides(index);
        restartAutoplay();
      });
    });

    prevButton?.addEventListener("click", () => {
      moveSlide(-1);
      restartAutoplay();
    });

    nextButton?.addEventListener("click", () => {
      moveSlide(1);
      restartAutoplay();
    });

    heroCarousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        moveSlide(-1);
        restartAutoplay();
      }

      if (event.key === "ArrowRight") {
        moveSlide(1);
        restartAutoplay();
      }
    });

    bindSwipeNavigation(
      viewport,
      () => {
        moveSlide(-1);
        restartAutoplay();
      },
      () => {
        moveSlide(1);
        restartAutoplay();
      }
    );

    heroCarousel.addEventListener("mouseenter", stopAutoplay);
    heroCarousel.addEventListener("mouseleave", restartAutoplay);
    heroCarousel.addEventListener("focusin", stopAutoplay);
    heroCarousel.addEventListener("focusout", restartAutoplay);
    document.addEventListener("visibilitychange", restartAutoplay);

    if (typeof mobileCarouselBreakpoint.addEventListener === "function") {
      mobileCarouselBreakpoint.addEventListener("change", restartAutoplay);
    } else if (typeof mobileCarouselBreakpoint.addListener === "function") {
      mobileCarouselBreakpoint.addListener(restartAutoplay);
    }

    updateSlides(activeIndex);
    restartAutoplay();
  }
}

const consultingCarousel = document.querySelector("[data-consulting-carousel]");
if (consultingCarousel) {
  const slides = Array.from(consultingCarousel.querySelectorAll("[data-consulting-slide]"));
  const nextButton = consultingCarousel.querySelector("[data-consulting-next]");
  if (!slides.length) {
    // no-op
  } else {
    let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
    let autoplayId = null;
    let cleanupId = null;

    if (activeIndex < 0) {
      activeIndex = 0;
    }

    const clearConsultingStates = (slide) => {
      slide.classList.remove(
        "is-active",
        "is-entering-forward",
        "is-entering-backward",
        "is-exiting-forward",
        "is-exiting-backward"
      );
    };

    const syncConsultingCarousel = (index, direction = 1) => {
    const previousIndex = activeIndex;
    const previousSlide = slides[previousIndex];
    const nextSlide = slides[index];

    if (!nextSlide) {
      return;
    }

    activeIndex = index;

    if (cleanupId) {
      window.clearTimeout(cleanupId);
      cleanupId = null;
    }

    slides.forEach((slide, slideIndex) => {
      slide.setAttribute("aria-hidden", String(slideIndex !== activeIndex));
      if (slideIndex !== previousIndex && slideIndex !== activeIndex) {
        clearConsultingStates(slide);
      }
    });

    if (!previousSlide || previousSlide === nextSlide) {
      slides.forEach(clearConsultingStates);
      nextSlide.classList.add("is-active");
      nextSlide.setAttribute("aria-hidden", "false");
      return;
    }

    clearConsultingStates(previousSlide);
    clearConsultingStates(nextSlide);

    previousSlide.classList.add(direction > 0 ? "is-exiting-forward" : "is-exiting-backward");
    nextSlide.classList.add(direction > 0 ? "is-entering-forward" : "is-entering-backward");

    window.requestAnimationFrame(() => {
      nextSlide.classList.add("is-active");
    });

    cleanupId = window.setTimeout(() => {
      clearConsultingStates(previousSlide);
      nextSlide.classList.remove("is-entering-forward", "is-entering-backward");
      nextSlide.classList.add("is-active");
      cleanupId = null;
    }, 760);
    };

    const moveConsultingSlide = (direction = 1) => {
      if (slides.length < 2) {
        return;
      }

      const nextIndex = (activeIndex + direction + slides.length) % slides.length;
      syncConsultingCarousel(nextIndex, direction);
    };

    const stopConsultingAutoplay = () => {
    if (!autoplayId) {
      return;
    }

    window.clearInterval(autoplayId);
    autoplayId = null;
    };

    const restartConsultingAutoplay = () => {
    stopConsultingAutoplay();

    if (slides.length < 2) {
      return;
    }

    autoplayId = window.setInterval(() => {
      moveConsultingSlide(1);
    }, 5600);
    };

    nextButton?.addEventListener("click", () => {
      moveConsultingSlide(1);
      restartConsultingAutoplay();
    });

    consultingCarousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        moveConsultingSlide(-1);
        restartConsultingAutoplay();
      }

      if (event.key === "ArrowRight") {
        moveConsultingSlide(1);
        restartConsultingAutoplay();
      }
    });

    bindSwipeNavigation(
      consultingCarousel,
      () => {
        moveConsultingSlide(-1);
        restartConsultingAutoplay();
      },
      () => {
        moveConsultingSlide(1);
        restartConsultingAutoplay();
      }
    );

    consultingCarousel.addEventListener("mouseenter", stopConsultingAutoplay);
    consultingCarousel.addEventListener("mouseleave", restartConsultingAutoplay);
    consultingCarousel.addEventListener("focusin", stopConsultingAutoplay);
    consultingCarousel.addEventListener("focusout", restartConsultingAutoplay);

    syncConsultingCarousel(activeIndex);
    restartConsultingAutoplay();
  }
}

const tickerStrips = document.querySelectorAll(".ticker-strip");
if (tickerStrips.length) {
  const tickerMeasures = [];
  const refreshAllTickers = () => {
    tickerMeasures.forEach((measure) => measure());
  };

  tickerStrips.forEach((strip) => {
    const track = strip.querySelector(".ticker-track");
    const rows = track ? Array.from(track.querySelectorAll(".ticker-row")) : [];
    const firstRow = rows[0];
    const baseRowCount = rows.length;

    if (!track || !firstRow) {
      return;
    }

    const resetTickerLoop = () => {
      while (track.children.length > baseRowCount) {
        track.removeChild(track.lastElementChild);
      }
    };

    const ensureTickerLoop = () => {
      resetTickerLoop();
      const visibleWidth = strip.clientWidth;
      const baseWidth = Math.max(1, firstRow.getBoundingClientRect().width);
      const targetRows = Math.max(2, Math.ceil((visibleWidth * 3) / baseWidth));
      const clonesNeeded = Math.max(0, targetRows - baseRowCount);

      for (let index = 0; index < clonesNeeded; index += 1) {
        const clone = firstRow.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      }
    };

    const measureTicker = () => {
      ensureTickerLoop();
      const distance = Math.ceil(firstRow.getBoundingClientRect().width);
      const duration = Math.max(14, distance / 140);

      track.style.setProperty("--ticker-distance", `${distance}px`);
      track.style.setProperty("--ticker-duration", `${duration}s`);
      track.classList.remove("ticker-animate");
      window.requestAnimationFrame(() => {
        track.classList.add("ticker-animate");
      });
    };

    measureTicker();
    tickerMeasures.push(measureTicker);

    track.querySelectorAll("img").forEach((image) => {
      if (!image.complete) {
        image.addEventListener("load", measureTicker, { once: true });
      }
    });
  });

  let resizeTimeout = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      refreshAllTickers();
    }, 120);
  });

  window.addEventListener("load", () => {
    refreshAllTickers();
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(refreshAllTickers).catch(() => {});
  }

  window.setTimeout(refreshAllTickers, 180);
}

const getCurrentPageName = () => {
  const fileName = window.location.pathname.split("/").pop() || "index.html";
  return fileName.replace(/\.html$/i, "") || "index";
};

const getThanksRedirectUrl = (form) => {
  const thanksUrl = new URL("tesekkurler.html", window.location.href);
  const source = form.dataset.thanksSource || getCurrentPageName();

  thanksUrl.searchParams.set("kaynak", source);
  return thanksUrl.toString();
};

const resolveFormsubmitEndpoint = (form) => {
  const endpointKey = form.dataset.formsubmitEndpointKey;
  const configuredEndpoint = endpointKey ? formsubmitEndpointConfig[endpointKey] : "";
  const fallbackEndpoint = form.getAttribute("action") || "";

  if (typeof configuredEndpoint === "string" && configuredEndpoint.trim()) {
    return configuredEndpoint.trim();
  }

  return fallbackEndpoint.trim();
};

const formsubmitForms = Array.from(
  document.querySelectorAll('form[action*="formsubmit.co"], form[data-formsubmit-endpoint-key]')
);
formsubmitForms.forEach((form) => {
  const nextInput = form.querySelector('input[name="_next"]');
  const applyDynamicRedirect = () => {
    const redirectUrl = getThanksRedirectUrl(form);

    if (nextInput) {
      nextInput.value = redirectUrl;
    }

    return redirectUrl;
  };

  const applyEndpoint = () => {
    const resolvedEndpoint = resolveFormsubmitEndpoint(form);

    if (resolvedEndpoint) {
      form.setAttribute("action", resolvedEndpoint);
    }

    return resolvedEndpoint;
  };

  const isAjaxEligible = () => {
    return form.dataset.formsubmitAjax === "true";
  };

  applyDynamicRedirect();
  applyEndpoint();

  form.addEventListener("submit", async (event) => {
    if (form.dataset.submitting === "true") {
      event.preventDefault();
      return;
    }

    const redirectUrl = applyDynamicRedirect();
    const resolvedEndpoint = applyEndpoint();
    const submitButton = event.submitter instanceof HTMLElement ? event.submitter : form.querySelector('[type="submit"]');

    form.dataset.submitting = "true";
    submitButton?.setAttribute("disabled", "disabled");
    submitButton?.setAttribute("aria-busy", "true");

    if (!resolvedEndpoint || !isAjaxEligible()) {
      return;
    }

    event.preventDefault();
    const ajaxAction = resolvedEndpoint.replace("https://formsubmit.co/", "https://formsubmit.co/ajax/");

    try {
      const response = await fetch(ajaxAction, {
        method: (form.getAttribute("method") || "POST").toUpperCase(),
        headers: {
          Accept: "application/json",
        },
        body: new FormData(form),
      });

      const rawBody = await response.text();
      let payload = {};

      if (rawBody) {
        try {
          payload = JSON.parse(rawBody);
        } catch (error) {
          payload = {};
        }
      }

      const isSuccess =
        response.ok &&
        (payload.success === undefined || payload.success === true || payload.success === "true");

      if (isSuccess) {
        window.location.href = redirectUrl;
        return;
      }

      throw new Error("FormSubmit AJAX request failed.");
    } catch (error) {
      nativeFormSubmit.call(form);
    } finally {
      form.dataset.submitting = "false";
      submitButton?.removeAttribute("disabled");
      submitButton?.removeAttribute("aria-busy");
    }
  });
});

window.addEventListener("pageshow", () => {
  formsubmitForms.forEach((form) => {
    form.dataset.submitting = "false";
    form.querySelectorAll('[type="submit"]').forEach((button) => {
      button.removeAttribute("disabled");
      button.removeAttribute("aria-busy");
    });
  });
});

const thanksPage = document.querySelector("[data-thanks-page]");
if (thanksPage) {
  const source = new URLSearchParams(window.location.search).get("kaynak") || "iletisim";
  const copy = {
    iletisim: {
      kicker: "Mesaj Alındı",
      title: "Teşekkürler, mesajınız ulaştı.",
      description: "Talebiniz e-posta akışına düştü. Uygunluk ve kapsam kontrolünden sonra sizinle dönüş yapılacaktır.",
      primaryLabel: "Ana Sayfaya Dön",
      primaryHref: "siber.html",
      secondaryLabel: "Yeni Mesaj Gönder",
      secondaryHref: "iletisim.html",
      pageTitle: "Teşekkürler | Lumina Siber",
    },
    danismanlik: {
      kicker: "Talep Alındı",
      title: "Teşekkürler, danışmanlık talebinizi aldık.",
      description: "Danışmanlık formunuz ekibe ulaştı. Hizmet kapsamınız ve uygun sonraki adım için size geri dönüş yapılacaktır.",
      primaryLabel: "Danışmanlığa Dön",
      primaryHref: "index.html",
      secondaryLabel: "Yeni Talep Gönder",
      secondaryHref: "index.html#iletisim",
      pageTitle: "Teşekkürler | Lumina Danışmanlık",
    },
    akademi: {
      kicker: "Talep Alındı",
      title: "Teşekkürler, eğitim talebinizi aldık.",
      description: "Akademi formunuz ekibe ulaştı. Size uygun eğitim akışını netleştirmek için en kısa sürede dönüş yapılacaktır.",
      primaryLabel: "Akademiye Dön",
      primaryHref: "akademi.html",
      secondaryLabel: "Formu Yeniden Aç",
      secondaryHref: "akademi.html#iletisim",
      pageTitle: "Teşekkürler | Lumina Akademi",
    },
  };

  const localizedCopy = {
    iletisim: {
      kicker: "Mesaj Alındı",
      title: "Teşekkürler, mesajınız ulaştı.",
      description: "Talebiniz e-posta akışına düştü. Uygunluk ve kapsam kontrolünden sonra sizinle dönüş yapılacaktır.",
      primaryLabel: "Ana Sayfaya Dön",
      primaryHref: "siber.html",
      secondaryLabel: "Yeni Mesaj Gönder",
      secondaryHref: "iletisim.html",
      pageTitle: "Teşekkürler | Lumina Siber",
    },
    danismanlik: {
      kicker: "Talep Alındı",
      title: "Teşekkürler, danışmanlık talebinizi aldık.",
      description: "Danışmanlık formunuz ekibe ulaştı. Hizmet kapsamınız ve uygun sonraki adım için size geri dönüş yapılacaktır.",
      primaryLabel: "Danışmanlığa Dön",
      primaryHref: "index.html",
      secondaryLabel: "Yeni Talep Gönder",
      secondaryHref: "index.html#iletisim",
      pageTitle: "Teşekkürler | Lumina Danışmanlık",
    },
    akademi: {
      kicker: "Talep Alındı",
      title: "Teşekkürler, eğitim talebinizi aldık.",
      description: "Akademi formunuz ekibe ulaştı. Size uygun eğitim akışını netleştirmek için en kısa sürede dönüş yapılacaktır.",
      primaryLabel: "Akademiye Dön",
      primaryHref: "akademi.html",
      secondaryLabel: "Formu Yeniden Aç",
      secondaryHref: "akademi.html#iletisim",
      pageTitle: "Teşekkürler | Lumina Akademi",
    },
  };

  const safeCopy = {
    iletisim: {
      kicker: "Mesaj Al\u0131nd\u0131",
      title: "Te\u015fekk\u00fcrler, mesaj\u0131n\u0131z ula\u015ft\u0131.",
      description: "Talebiniz e-posta ak\u0131\u015f\u0131na d\u00fc\u015ft\u00fc. Uygunluk ve kapsam kontrol\u00fcnden sonra size d\u00f6n\u00fc\u015f yap\u0131lacakt\u0131r.",
      primaryLabel: "Ana Sayfaya D\u00f6n",
      primaryHref: "siber.html",
      secondaryLabel: "Yeni Mesaj G\u00f6nder",
      secondaryHref: "iletisim.html",
      pageTitle: "Te\u015fekk\u00fcrler | Lumina Siber",
    },
    danismanlik: {
      kicker: "Talep Al\u0131nd\u0131",
      title: "Te\u015fekk\u00fcrler, dan\u0131\u015fmanl\u0131k talebinizi ald\u0131k.",
      description: "Dan\u0131\u015fmanl\u0131k formunuz ekibe ula\u015ft\u0131. Hizmet kapsam\u0131n\u0131z ve uygun sonraki ad\u0131m i\u00e7in size geri d\u00f6n\u00fc\u015f yap\u0131lacakt\u0131r.",
      primaryLabel: "Dan\u0131\u015fmanl\u0131\u011fa D\u00f6n",
      primaryHref: "index.html",
      secondaryLabel: "Yeni Talep G\u00f6nder",
      secondaryHref: "index.html#iletisim",
      pageTitle: "Te\u015fekk\u00fcrler | Lumina Dan\u0131\u015fmanl\u0131k",
    },
    akademi: {
      kicker: "Talep Al\u0131nd\u0131",
      title: "Te\u015fekk\u00fcrler, e\u011fitim talebinizi ald\u0131k.",
      description: "Akademi formunuz ekibe ula\u015ft\u0131. Size uygun e\u011fitim ak\u0131\u015f\u0131n\u0131 netle\u015ftirmek i\u00e7in en k\u0131sa s\u00fcrede d\u00f6n\u00fc\u015f yap\u0131lacakt\u0131r.",
      primaryLabel: "Akademiye D\u00f6n",
      primaryHref: "akademi.html",
      secondaryLabel: "Formu Yeniden A\u00e7",
      secondaryHref: "akademi.html#iletisim",
      pageTitle: "Te\u015fekk\u00fcrler | Lumina Akademi",
    },
  };

  const selectedCopy = safeCopy[source] || safeCopy.iletisim || localizedCopy[source] || localizedCopy.iletisim || copy[source] || copy.iletisim;
  const kicker = thanksPage.querySelector("[data-thanks-kicker]");
  const title = thanksPage.querySelector("[data-thanks-title]");
  const description = thanksPage.querySelector("[data-thanks-description]");
  const primaryLink = thanksPage.querySelector("[data-thanks-primary]");
  const secondaryLink = thanksPage.querySelector("[data-thanks-secondary]");

  document.title = selectedCopy.pageTitle;

  if (kicker) {
    kicker.textContent = selectedCopy.kicker;
  }

  if (title) {
    title.textContent = selectedCopy.title;
  }

  if (description) {
    description.textContent = selectedCopy.description;
  }

  if (primaryLink) {
    primaryLink.textContent = selectedCopy.primaryLabel;
    primaryLink.setAttribute("href", selectedCopy.primaryHref);
  }

  if (secondaryLink) {
    secondaryLink.textContent = selectedCopy.secondaryLabel;
    secondaryLink.setAttribute("href", selectedCopy.secondaryHref);
  }
}

const getRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

const buildSocialProofMessageLegacy = () => {
  const names = [
    "Ayşe",
    "Fatma",
    "Zeynep",
    "Elif",
    "Merve",
    "Esra",
    "Büşra",
    "Sıla",
    "Ceren",
    "Ece",
    "Melis",
    "Beyza",
    "Aleyna",
    "Nazlı",
    "Derya",
    "Gizem",
    "Seda",
    "Selin",
    "Yağmur",
    "Yasemin",
    "Ahmet",
    "Mehmet",
    "Ali",
    "Mustafa",
    "Murat",
    "Can",
    "Emre",
    "Burak",
    "Oğuz",
    "Kerem",
    "Tolga",
    "Hakan",
    "Onur",
    "Eren",
    "Serkan",
    "Barış",
    "Kaan",
    "Arda",
    "Deniz",
    "Yusuf",
  ];

  const cities = [
    "İstanbul",
    "Ankara",
    "İzmir",
    "Bursa",
    "Antalya",
    "Kocaeli",
    "Adana",
    "Konya",
    "Gaziantep",
    "Mersin",
    "Kayseri",
    "Eskişehir",
    "Samsun",
    "Trabzon",
    "Diyarbakır",
    "Tekirdağ",
    "Sakarya",
    "Denizli",
    "Balıkesir",
    "Muğla",
  ];

  const services = [
    "SEO danışmanlığını",
    "Shopify kurulumu",
    "Etsy danışmanlığını",
    "Meta Ads yönetimini",
    "Google Ads desteğini",
    "siber incelemeyi",
    "teknik SEO analizini",
    "e-ticaret büyüme danışmanlığını",
    "marka güvenliği analizini",
    "eğitim görüşmesini",
  ];

  const toolNames = [
    "Ücretsiz ROAS Hesaplayıcı",
    "Ücretsiz Teknik SEO Açık Analizi",
    "Ücretsiz Dijital Pazarlama Seviye Testi",
    "Ücretsiz Site ve Link Risk Analizi",
    "Şüpheli Link Kontrolü",
    "Güvenlik Kontrolü",
    "Parola Araçları",
    "İndirim Hesaplayıcı",
  ];

  const courses = [
    "Shopify Kurulum ve Yönetim",
    "Etsy Eğitim Programı",
    "Meta Ads ve Google Ads",
    "Dijital Pazarlama Temelleri",
    "ROAS ve Karlılık Okuma",
    "Teknik SEO Temelleri",
  ];

  const pages = [
    "ücretsiz araçlar sayfasını",
    "SEO analiz sayfasını",
    "indirim hesaplayıcıyı",
    "site risk analizi sayfasını",
    "Shopify eğitim sayfasını",
    "iletişim formunu",
  ];

  const pageNames = {
    "siber.html": "Lumina Siber",
    "index.html": "Lumina Danışmanlık",
    "akademi.html": "Lumina Akademi",
    "araclar.html": "Lumina Lab",
    "roas-hesaplayici.html": "ROAS Hesaplayıcı",
    "seo-teknik-analiz.html": "SEO Açık Analizi",
    "dijital-pazarlama-seviye-testi.html": "Seviye Testi",
    "site-risk-analizi.html": "Site Risk Analizi",
    "indirim-hesaplayici.html": "İndirim Hesaplayıcı",
    "blog.html": "Blog Merkezi",
  };

  const timeLabels = [
    "Az önce",
    "2 dakika önce",
    "5 dakika önce",
    "Biraz önce",
    "Şu anda",
    "Bugün",
  ];

  const pathname = window.location.pathname.split("/").pop() || "index.html";
  const currentPageName = pageNames[pathname] || "Lumina";
  const currentVisitors = Math.floor(Math.random() * 6) + 3;
  const dailyToolUsers = Math.floor(Math.random() * 38) + 27;
  const tool = getRandomItem(toolNames);
  const service = getRandomItem(services);
  const course = getRandomItem(courses);
  const name = getRandomItem(names);
  const city = getRandomItem(cities);
  const timeLabel = getRandomItem(timeLabels);
  const page = getRandomItem(pages);

  const templates = [
    {
      title: timeLabel,
      body: `${name}, "${tool}" aracını kullandı.`,
    },
    {
      title: `${city}'den ilgi var`,
      body: `${city}'den bir ziyaretçi ${service} inceledi.`,
    },
    {
      title: "Canlı trafik",
      body: `Şu anda ${currentPageName} sayfasında ${currentVisitors} kişi geziyor.`,
    },
    {
      title: "Son 24 saat",
      body: `Son 24 saatte ${dailyToolUsers} kişi ücretsiz araçları kullandı.`,
    },
    {
      title: `${timeLabel}`,
      body: `${name}, ${course} eğitim sayfasını inceledi.`,
    },
    {
      title: "Araçlara ilgi var",
      body: `${city}'den bir ziyaretçi ${page} açtı.`,
    },
    {
      title: "Şu anda ilgi artıyor",
      body: `${name}, ${tool} sayfasına göz attı.`,
    },
  ];

  return getRandomItem(templates);
};

const buildSocialProofMessage = () => {
  const names = [
    "Ayşe",
    "Fatma",
    "Zeynep",
    "Elif",
    "Merve",
    "Esra",
    "Büşra",
    "Sıla",
    "Ceren",
    "Ece",
    "Melis",
    "Beyza",
    "Aleyna",
    "Nazlı",
    "Derya",
    "Gizem",
    "Seda",
    "Selin",
    "Yağmur",
    "Yasemin",
    "Ahmet",
    "Mehmet",
    "Ali",
    "Mustafa",
    "Murat",
    "Can",
    "Emre",
    "Burak",
    "Oğuz",
    "Kerem",
    "Tolga",
    "Hakan",
    "Onur",
    "Eren",
    "Serkan",
    "Barış",
    "Kaan",
    "Arda",
    "Deniz",
    "Yusuf",
  ];

  const cities = [
    "İstanbul",
    "Ankara",
    "İzmir",
    "Bursa",
    "Antalya",
    "Kocaeli",
    "Adana",
    "Konya",
    "Gaziantep",
    "Mersin",
    "Kayseri",
    "Eskişehir",
    "Samsun",
    "Trabzon",
    "Diyarbakır",
    "Tekirdağ",
    "Sakarya",
    "Denizli",
    "Balıkesir",
    "Muğla",
  ];

  const pageNames = {
    "siber.html": "Lumina Siber",
    "hizmetler.html": "Lumina Siber",
    "index.html": "Lumina Danışmanlık",
    "danismanlik-hizmetleri.html": "Lumina Danışmanlık",
    "akademi.html": "Lumina Akademi",
    "akademi-egitimleri.html": "Lumina Akademi",
    "araclar.html": "Lumina Lab",
    "roas-hesaplayici.html": "ROAS Hesaplayıcı",
    "seo-teknik-analiz.html": "SEO Açık Analizi",
    "dijital-pazarlama-seviye-testi.html": "Seviye Testi",
    "site-risk-analizi.html": "Site Risk Analizi",
    "indirim-hesaplayici.html": "İndirim Hesaplayıcı",
    "blog.html": "Blog Merkezi",
  };

  const pathname = window.location.pathname.split("/").pop() || "index.html";
  const currentPageName = pageNames[pathname] || "Lumina";
  const currentVisitors = Math.floor(Math.random() * 5) + 3;
  const dailyToolUsers = Math.floor(Math.random() * 29) + 31;
  const name = getRandomItem(names);
  const city = getRandomItem(cities);
  const timeLabel = getRandomItem(["Az önce", "2 dakika önce", "5 dakika önce", "Biraz önce", "Şu anda", "Bugün"]);

  const consultingMessages = [
    { title: timeLabel, body: `${name}, ücretsiz ROAS ve kârlılık hesaplayıcıyı kullandı.` },
    { title: `${city} kaynaklı ilgi`, body: `${city}'den bir ziyaretçi Shopify danışmanlığı sayfasını inceledi.` },
    { title: "Canlı ilgi", body: `Şu anda ${currentPageName} sayfasında ${currentVisitors} kişi geziniyor.` },
    { title: "Bugün", body: `${name}, ücretsiz indirim hesaplayıcıdan sonra danışmanlık sayfasına geçti.` },
    { title: "Son 24 saat", body: `Son 24 saatte ${dailyToolUsers} kişi danışmanlık ön analiz araçlarını kullandı.` },
  ];

  const academyMessages = [
    { title: timeLabel, body: `${name}, dijital pazarlama seviye testini tamamladı.` },
    { title: `${city}'den ilgi`, body: `${city}'den bir ziyaretçi Shopify eğitimi sayfasını inceledi.` },
    { title: "Canlı ilgi", body: `Şu anda ${currentPageName} sayfasında ${currentVisitors} kişi geziniyor.` },
    { title: "Program incelemesi", body: `${name}, Meta Ads ve Google Ads eğitim programına göz attı.` },
    { title: "Son 24 saat", body: `Son 24 saatte ${dailyToolUsers} kişi akademi araçlarını kullandı.` },
  ];

  const cyberMessages = [
    { title: timeLabel, body: `${name}, şüpheli link kontrolü aracını kullandı.` },
    { title: `${city}'den kontrol`, body: `${city}'den bir ziyaretçi site ve link risk analizini açtı.` },
    { title: "Canlı ilgi", body: `Şu anda ${currentPageName} sayfasında ${currentVisitors} kişi geziniyor.` },
    { title: "Güvenlik incelemesi", body: `${name}, parola araçları sayfasına göz attı.` },
    { title: "Son 24 saat", body: `Son 24 saatte ${dailyToolUsers} kişi siber kontrol araçlarını kullandı.` },
  ];

  const labMessages = [
    { title: timeLabel, body: `${name}, ücretsiz indirim hesaplayıcıyı kullandı.` },
    { title: "Araç kullanımı", body: `${city}'den bir ziyaretçi ücretsiz teknik SEO açık analizini açtı.` },
    { title: "Canlı ilgi", body: `Şu anda ${currentPageName} sayfasında ${currentVisitors} kişi geziniyor.` },
    { title: "Son 24 saat", body: `Son 24 saatte ${dailyToolUsers} kişi Lumina Lab araçlarını kullandı.` },
  ];

  if (
    pathname.includes("siber") ||
    pathname.includes("risk") ||
    pathname.includes("link-kontrolu") ||
    pathname.includes("guvenlik-checkup") ||
    pathname.includes("parola")
  ) {
    return getRandomItem(cyberMessages);
  }

  if (
    pathname.includes("akademi") ||
    pathname.includes("egitimi") ||
    pathname.includes("seviye-testi")
  ) {
    return getRandomItem(academyMessages);
  }

  if (
    pathname.includes("araclar") ||
    pathname.includes("hesaplayici") ||
    pathname.includes("analiz")
  ) {
    return getRandomItem(labMessages);
  }

  return getRandomItem(consultingMessages);
};

const initSocialProofWidget = () => {
  if (thanksPage) {
    return;
  }

  const proofDismissKey = "lumina-proof-dismissed-v3";
  let widgetDismissed = false;
  try {
    widgetDismissed = sessionStorage.getItem(proofDismissKey) === "1";
  } catch (_error) {
    widgetDismissed = false;
  }

  if (widgetDismissed) {
    return;
  }

  const wrapper = document.createElement("aside");
  wrapper.className = "lumina-proof-widget";
  wrapper.setAttribute("aria-live", "polite");
  wrapper.innerHTML = `
    <div class="lumina-proof-card">
      <span class="lumina-proof-live" aria-hidden="true"></span>
      <div class="lumina-proof-copy">
        <strong data-proof-title>Canlı ilgi</strong>
        <p data-proof-body>Bu sayfadaki güncel ilgi burada görünür.</p>
      </div>
      <button class="lumina-proof-close" type="button" aria-label="Bildirimi kapat">x</button>
    </div>
  `;

  document.body.appendChild(wrapper);

  const titleNode = wrapper.querySelector("[data-proof-title]");
  const bodyNode = wrapper.querySelector("[data-proof-body]");
  const closeButton = wrapper.querySelector(".lumina-proof-close");

  let timeoutId = null;
  let intervalStopped = false;
  let previousBody = "";

  const clearScheduled = () => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const scheduleNext = (delay) => {
    clearScheduled();
    timeoutId = window.setTimeout(showMessage, delay);
  };

  const hideMessage = () => {
    if (intervalStopped) {
      return;
    }

    wrapper.classList.remove("is-visible");
    wrapper.classList.add("is-leaving");

    scheduleNext(Math.floor(Math.random() * 30000) + 45000);
  };

  const showMessage = () => {
    if (intervalStopped) {
      return;
    }

    wrapper.classList.remove("is-leaving");

    let nextMessage = buildSocialProofMessage();
    let guard = 0;
    while (nextMessage.body === previousBody && guard < 4) {
      nextMessage = buildSocialProofMessage();
      guard += 1;
    }

    previousBody = nextMessage.body;
    if (titleNode) {
      titleNode.textContent = nextMessage.title;
    }

    if (bodyNode) {
      bodyNode.textContent = nextMessage.body;
    }

    if (prefersReducedMotion) {
      wrapper.classList.add("is-visible");
    } else {
      requestAnimationFrame(() => {
        wrapper.classList.add("is-visible");
      });
    }

    clearScheduled();
    timeoutId = window.setTimeout(hideMessage, Math.floor(Math.random() * 1500) + 6000);
  };

  closeButton?.addEventListener("click", () => {
    intervalStopped = true;
    clearScheduled();
    wrapper.remove();

    try {
      sessionStorage.setItem(proofDismissKey, "1");
    } catch (_error) {
      // Session storage is optional.
    }
  });

  scheduleNext(Math.floor(Math.random() * 4000) + 8000);
};

initSocialProofWidget();
