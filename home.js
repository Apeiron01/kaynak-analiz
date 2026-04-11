const body = document.body;
const nativeFormSubmit = HTMLFormElement.prototype.submit;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const sharedShell = window.LuminaSharedShell?.init() || {};
const closeNavigation = sharedShell.closeNavigation || (() => {});
let activeScrollAnimationFrame = null;

const initQuickWhatsappIcon = () => {
  if (!document.body || document.querySelector("[data-lumina-whatsapp-widget]")) {
    return;
  }

  const defaultWhatsappNumber = "905376431123";
  const whatsappNumber = String(window.LUMINA_WHATSAPP_NUMBER || defaultWhatsappNumber).replace(/\D/g, "");
  const messageText = encodeURIComponent(
    ["Merhaba Lumina ekibi,", "Bilgi almak istiyorum.", `Sayfa: ${window.location.href}`].join("\n")
  );

  const href = whatsappNumber
    ? `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${messageText}`
    : `https://api.whatsapp.com/send?text=${messageText}`;

  const link = document.createElement("a");
  link.className = "lumina-wa-quick";
  link.dataset.luminaWhatsappWidget = "true";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", "WhatsApp ile iletisime gec");
  link.innerHTML = `<img src="assets/icons/whatsapp.svg" alt="" width="34" height="34" loading="eager" decoding="async" />`;

  document.body.appendChild(link);
};

document.querySelectorAll('link[data-async-stylesheet]').forEach((link) => {
  const activate = () => {
    link.media = "all";
  };

  if (link.sheet) {
    activate();
    return;
  }

  link.addEventListener("load", activate, { once: true });
  window.setTimeout(activate, 3000);
});

body.classList.add("is-ready");

if (document.readyState === "complete") {
  window.setTimeout(initQuickWhatsappIcon, 1200);
} else {
  window.addEventListener("load", () => window.setTimeout(initQuickWhatsappIcon, 1200), { once: true });
}

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

  try {
    const decodedId = decodeURIComponent(rawId);
    return document.getElementById(decodedId) || document.querySelector(`#${CSS.escape(decodedId)}`);
  } catch (_error) {
    return null;
  }
};

const scrollToHashTarget = (hash, options = {}) => {
  const target = getTargetFromHash(hash);
  if (!target) {
    return false;
  }

  const top = window.scrollY + target.getBoundingClientRect().top - getScrollOffset();
  animateWindowScrollTo(Math.max(0, top));

  if (options.updateHistory !== false) {
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

  return { isHashLink: samePath && Boolean(url.hash), hash: samePath ? url.hash : "" };
};

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href]');
  if (!link) {
    return;
  }

  const { isHashLink, hash } = isSamePageHashLink(link);
  if (!isHashLink || !getTargetFromHash(hash)) {
    return;
  }

  event.preventDefault();
  scrollToHashTarget(hash);
  closeNavigation();
});

window.addEventListener("load", () => {
  if (window.location.hash) {
    window.requestAnimationFrame(() => {
      scrollToHashTarget(window.location.hash, { updateHistory: false });
    });
  }
});

window.addEventListener("hashchange", () => {
  scrollToHashTarget(window.location.hash, { updateHistory: false });
});

const getHomepageThanksRedirectUrl = (form) => {
  const nextInput = form.querySelector('input[name="_next"]');
  if (nextInput?.value) {
    return nextInput.value;
  }

  return new URL("tesekkurler.html", window.location.href).toString();
};

const initHomepageForms = () => {
  document.querySelectorAll('form[data-formsubmit-ajax="true"]').forEach((form) => {
    if (form.dataset.ajaxBound === "true") {
      return;
    }

    form.dataset.ajaxBound = "true";

    form.addEventListener("submit", async (event) => {
      if (form.dataset.submitting === "true") {
        event.preventDefault();
        return;
      }

      const action = (form.getAttribute("action") || "").trim();
      const submitButton = event.submitter instanceof HTMLElement ? event.submitter : form.querySelector('[type="submit"]');

      form.dataset.submitting = "true";
      submitButton?.setAttribute("disabled", "disabled");
      submitButton?.setAttribute("aria-busy", "true");

      if (!action) {
        return;
      }

      event.preventDefault();

      try {
        const response = await fetch(action.replace("https://formsubmit.co/", "https://formsubmit.co/ajax/"), {
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
          } catch (_error) {
            payload = {};
          }
        }

        const isSuccess =
          response.ok &&
          (payload.success === undefined || payload.success === true || payload.success === "true");

        if (!isSuccess) {
          throw new Error("Homepage FormSubmit AJAX request failed.");
        }

        window.location.href = getHomepageThanksRedirectUrl(form);
      } catch (_error) {
        nativeFormSubmit.call(form);
      } finally {
        form.dataset.submitting = "false";
        submitButton?.removeAttribute("disabled");
        submitButton?.removeAttribute("aria-busy");
      }
    });
  });
};

if ("requestIdleCallback" in window) {
  window.requestIdleCallback(initHomepageForms, { timeout: 1800 });
} else {
  window.setTimeout(initHomepageForms, 500);
}

window.addEventListener("pageshow", () => {
  document.querySelectorAll('form[data-formsubmit-ajax="true"]').forEach((form) => {
    form.dataset.submitting = "false";
    form.querySelectorAll('[type="submit"]').forEach((button) => {
      button.removeAttribute("disabled");
      button.removeAttribute("aria-busy");
    });
  });
});

const revealItems = document.querySelectorAll("[data-reveal]");
if (revealItems.length && "IntersectionObserver" in window) {
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

  const observeReveals = () => {
    revealItems.forEach((item) => revealObserver.observe(item));
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(observeReveals, { timeout: 1200 });
  } else {
    window.setTimeout(observeReveals, 250);
  }
}

const bindSwipeNavigation = (container, onPrev, onNext) => {
  let touchStartX = 0;
  let touchStartY = 0;

  container.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  container.addEventListener("touchend", (event) => {
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
  }, { passive: true });
};

const initConsultingCarousel = (() => {
  let initialized = false;

  return () => {
    if (initialized) {
      return;
    }

    const consultingCarousel = document.querySelector("[data-consulting-carousel]");
    const slides = consultingCarousel ? Array.from(consultingCarousel.querySelectorAll("[data-consulting-slide]")) : [];
    const nextButton = consultingCarousel?.querySelector("[data-consulting-next]");

    if (!consultingCarousel || !slides.length) {
      return;
    }

    initialized = true;

    let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
    let autoplayId = null;
    let cleanupId = null;

    if (activeIndex < 0) {
      activeIndex = 0;
    }

    const hydrateSlideAssets = (slide) => {
      slide?.querySelectorAll("img[data-src]").forEach((image) => {
        if (image.dataset.src) {
          image.src = image.dataset.src;
          delete image.dataset.src;
        }

        if (image.dataset.srcset) {
          image.srcset = image.dataset.srcset;
          delete image.dataset.srcset;
        }
      });
    };

    const hydrateRemainingSlides = () => {
      slides.forEach((slide, index) => {
        if (index !== activeIndex) {
          hydrateSlideAssets(slide);
        }
      });
    };

    const clearConsultingStates = (slide) => {
      slide.classList.remove("is-active", "is-entering-forward", "is-entering-backward", "is-exiting-forward", "is-exiting-backward");
    };

    const syncConsultingCarousel = (index, direction = 1) => {
      const previousIndex = activeIndex;
      const previousSlide = slides[previousIndex];
      const nextSlide = slides[index];

      if (!nextSlide) {
        return;
      }

      hydrateSlideAssets(nextSlide);
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

      if (slides.length < 2 || prefersReducedMotion) {
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

    hydrateSlideAssets(slides[activeIndex]);

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(hydrateRemainingSlides, { timeout: 2500 });
    } else {
      window.setTimeout(hydrateRemainingSlides, 1200);
    }

    syncConsultingCarousel(activeIndex);
    restartConsultingAutoplay();
  };
})();

const consultingCarousel = document.querySelector("[data-consulting-carousel]");
if (consultingCarousel) {
  const eagerInit = () => initConsultingCarousel();

  ["pointerenter", "touchstart", "focusin", "click"].forEach((eventName) => {
    consultingCarousel.addEventListener(eventName, eagerInit, { passive: true, once: true });
  });

  window.requestAnimationFrame(() => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(initConsultingCarousel, { timeout: 900 });
    } else {
      window.setTimeout(initConsultingCarousel, 300);
    }
  });
}

const initTickerStrip = (strip) => {
  const track = strip.querySelector(".ticker-track");
  const rows = track ? Array.from(track.querySelectorAll(".ticker-row")) : [];
  const firstRow = rows[0];
  const baseRowCount = rows.length;

  if (!track || !firstRow || strip.dataset.tickerReady === "true") {
    return;
  }

  strip.dataset.tickerReady = "true";

  const resetTickerLoop = () => {
    while (track.children.length > baseRowCount) {
      track.removeChild(track.lastElementChild);
    }
  };

  const readBaseWidth = () => Math.max(1, Math.ceil(firstRow.getBoundingClientRect().width));

  const ensureTickerLoop = (visibleWidth, baseWidth) => {
    resetTickerLoop();
    const targetRows = Math.max(2, Math.ceil((visibleWidth * 3) / baseWidth));
    const clonesNeeded = Math.max(0, targetRows - baseRowCount);
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < clonesNeeded; index += 1) {
      const clone = firstRow.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      fragment.appendChild(clone);
    }

    track.appendChild(fragment);
  };

  const measureTicker = () => {
    const visibleWidth = Math.max(1, Math.ceil(strip.getBoundingClientRect().width));
    const distance = readBaseWidth();
    ensureTickerLoop(visibleWidth, distance);
    const duration = Math.max(14, distance / 140);

    track.style.setProperty("--ticker-distance", `${distance}px`);
    track.style.setProperty("--ticker-duration", `${duration}s`);
    track.classList.remove("ticker-animate");
    window.requestAnimationFrame(() => {
      track.classList.add("ticker-animate");
    });
  };

  measureTicker();

  let resizeTimeout = null;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(measureTicker, 120);
  });

  track.querySelectorAll("img").forEach((image) => {
    if (!image.complete) {
      image.addEventListener("load", measureTicker, { once: true });
    }
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(measureTicker).catch(() => {});
  }
};

document.querySelectorAll(".ticker-strip").forEach((strip) => {
  if (!("IntersectionObserver" in window)) {
    initTickerStrip(strip);
    return;
  }

  const tickerObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        initTickerStrip(strip);
        tickerObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: "200px 0px" });

  tickerObserver.observe(strip);
});
