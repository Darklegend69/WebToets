/* The Car Deal-oog V2 - shared interface, motion and persistence helpers */
(function () {
  "use strict";

  const STORAGE_PREFIX = "tcd_";

  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(STORAGE_PREFIX + key);
        return value === null ? fallback : JSON.parse(value);
      } catch (error) {
        console.warn("Local storage kon niet worden gelezen:", error);
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn("Local storage kon niet worden bijgewerkt:", error);
        return false;
      }
    },
    remove(key) {
      localStorage.removeItem(STORAGE_PREFIX + key);
    }
  };

  function getBasePath() {
    return window.location.pathname.includes("/templates/") ? "../" : "";
  }

  function asset(path) {
    const value = String(path || "");
    if (/^(?:data:|blob:|https?:|\/\/)/i.test(value)) return value;
    return getBasePath() + value.replace(/^\.\//, "");
  }

  function uid(prefix) {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${random}`;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("nl-NL", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function toast(message, tone = "primary") {
    const container = document.querySelector("[data-toast-container]");
    if (!container || typeof bootstrap === "undefined") return;
    const item = document.createElement("div");
    item.className = `toast align-items-center text-bg-${tone} border-0`;
    item.setAttribute("role", "status");
    item.setAttribute("aria-live", "polite");
    item.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${escapeHTML(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Sluiten"></button>
      </div>`;
    container.appendChild(item);
    const instance = new bootstrap.Toast(item, { delay: 3600 });
    item.addEventListener("hidden.bs.toast", () => item.remove());
    instance.show();
  }

  function showSuccess(options = {}) {
    const modalElement = document.getElementById("successModal");
    if (!modalElement || typeof bootstrap === "undefined") {
      alert(options.message || "Actie succesvol uitgevoerd.");
      if (options.redirect) window.location.href = options.redirect;
      return;
    }
    modalElement.querySelector("[data-success-title]").textContent = options.title || "Gelukt!";
    modalElement.querySelector("[data-success-message]").textContent = options.message || "Uw aanvraag is verwerkt.";
    const okButton = modalElement.querySelector("[data-success-ok]");
    const replacement = okButton.cloneNode(true);
    okButton.replaceWith(replacement);
    if (options.redirect) {
      replacement.addEventListener("click", () => {
        window.location.href = options.redirect;
      });
    }
    bootstrap.Modal.getOrCreateInstance(modalElement).show();
  }

  function setActiveNavigation() {
    const current = document.body.dataset.page;
    if (!current) return;
    document.querySelectorAll(`[data-nav="${current}"]`).forEach((link) => {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    });
    const parentDropdown = document.querySelector(`[data-nav="${current}"]`)?.closest(".dropdown-menu");
    if (parentDropdown) {
      parentDropdown.parentElement?.querySelector(".dropdown-toggle")?.classList.add("active");
    }
  }

  function initLoadingScreen() {
    const screen = document.querySelector("[data-loading-screen]");
    if (!screen) return;
    window.setTimeout(() => screen.classList.add("is-hidden"), 280);
  }

  function normalizeTheme(value) {
    return value === "light" ? "light" : "dark";
  }

  function syncThemeControls(theme) {
    const isLight = theme === "light";
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-checked", String(isLight));
      button.setAttribute("aria-label", isLight ? "Schakel naar donkere modus" : "Schakel naar lichte modus");
      button.title = isLight ? "Donkere modus" : "Lichte modus";
      const label = button.querySelector("[data-theme-label]");
      if (label) label.textContent = isLight ? "Licht" : "Donker";
    });
  }

  function applyTheme(value, persist = true) {
    const theme = normalizeTheme(value);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    if (persist) storage.set("theme", theme);
    syncThemeControls(theme);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === "light" ? "#ffffff" : "#09090b";
    document.dispatchEvent(new CustomEvent("tcd:themechange", { detail: { theme } }));
  }

  function initThemeToggle() {
    applyTheme(document.documentElement.dataset.theme || storage.get("theme", "dark"), false);
    document.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-theme-toggle]");
      if (!toggle) return;
      const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      applyTheme(nextTheme);
    });
    window.addEventListener("storage", (event) => {
      if (event.key !== `${STORAGE_PREFIX}theme`) return;
      applyTheme(storage.get("theme", "dark"), false);
    });
  }

  function initRevealAnimations() {
    const items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
  }

  function initCounters() {
    const counters = document.querySelectorAll("[data-counter]");
    if (!counters.length) return;
    const animate = (element) => {
      const target = Number(element.dataset.counter || 0);
      const suffix = element.dataset.suffix || "";
      const duration = 900;
      const start = performance.now();
      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = `${Math.round(target * eased)}${suffix}`;
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    };
    if (!("IntersectionObserver" in window)) {
      counters.forEach(animate);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((counter) => observer.observe(counter));
  }

  function initHeroVideo() {
    const video = document.querySelector("[data-hero-video]");
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = Boolean(navigator.connection?.saveData);
    let inViewport = true;

    const updatePlayback = () => {
      const mayPlay = !document.hidden && inViewport && !reducedMotion && !saveData;
      if (mayPlay) video.play().catch(() => {});
      else video.pause();
    };

    if (reducedMotion || saveData) {
      video.removeAttribute("autoplay");
      video.pause();
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(([entry]) => {
        inViewport = entry.isIntersecting;
        updatePlayback();
      }, { threshold: 0.08 });
      observer.observe(video.closest("[data-video-hero]") || video);
    }

    document.addEventListener("visibilitychange", updatePlayback);
    updatePlayback();
  }

  function initTiltSurfaces() {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    const selector = ".car-card, .service-card, .stat-card, .content-card.video-card, .auth-card, .promo-panel";
    const bind = (element) => {
      if (element.dataset.tiltReady) return;
      element.dataset.tiltReady = "true";
      element.classList.add("tilt-surface");
      let animationFrame = null;

      element.addEventListener("pointermove", (event) => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => {
          const bounds = element.getBoundingClientRect();
          const x = Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1);
          const y = Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1);
          element.style.setProperty("--ry", `${((x - 0.5) * 8).toFixed(2)}deg`);
          element.style.setProperty("--rx", `${((0.5 - y) * 7).toFixed(2)}deg`);
          element.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
          element.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
        });
      });

      element.addEventListener("pointerleave", () => {
        element.style.setProperty("--rx", "0deg");
        element.style.setProperty("--ry", "0deg");
        element.style.setProperty("--mx", "50%");
        element.style.setProperty("--my", "50%");
      });
    };

    document.querySelectorAll(selector).forEach(bind);
    if ("MutationObserver" in window) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(selector)) bind(node);
          node.querySelectorAll?.(selector).forEach(bind);
        }));
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function initHeroParallax() {
    const hero = document.querySelector("[data-video-hero]");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!hero || !finePointer || reducedMotion) return;
    let animationFrame = null;

    hero.addEventListener("pointermove", (event) => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const bounds = hero.getBoundingClientRect();
        const x = Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1) - 0.5;
        const y = Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1) - 0.5;
        hero.style.setProperty("--hero-x", `${(-x * 13).toFixed(2)}px`);
        hero.style.setProperty("--hero-y", `${(-y * 9).toFixed(2)}px`);
        hero.style.setProperty("--grid-x", `${(x * 18).toFixed(2)}px`);
        hero.style.setProperty("--grid-y", `${(y * 14).toFixed(2)}px`);
      });
    });

    hero.addEventListener("pointerleave", () => {
      hero.style.setProperty("--hero-x", "0px");
      hero.style.setProperty("--hero-y", "0px");
      hero.style.setProperty("--grid-x", "0px");
      hero.style.setProperty("--grid-y", "0px");
    });
  }

  function initMagneticControls() {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;
    const selector = ".btn-tcd, .btn-cyan, .btn-glass, .theme-toggle";

    const bind = (element) => {
      if (element.dataset.magneticReady) return;
      element.dataset.magneticReady = "true";
      element.classList.add("magnetic-control");
      let animationFrame = null;
      element.addEventListener("pointermove", (event) => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => {
          const bounds = element.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width - 0.5;
          const y = (event.clientY - bounds.top) / bounds.height - 0.5;
          element.style.setProperty("--mag-x", `${(x * 10).toFixed(2)}px`);
          element.style.setProperty("--mag-y", `${(y * 7).toFixed(2)}px`);
          element.style.setProperty("--mag-rx", `${(-y * 5).toFixed(2)}deg`);
          element.style.setProperty("--mag-ry", `${(x * 6).toFixed(2)}deg`);
        });
      });
      element.addEventListener("pointerleave", () => {
        element.style.setProperty("--mag-x", "0px");
        element.style.setProperty("--mag-y", "0px");
        element.style.setProperty("--mag-rx", "0deg");
        element.style.setProperty("--mag-ry", "0deg");
      });
    };

    document.querySelectorAll(selector).forEach(bind);
    if ("MutationObserver" in window) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(selector)) bind(node);
          node.querySelectorAll?.(selector).forEach(bind);
        }));
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function initGlobalSearch() {
    const form = document.querySelector("[data-global-search-form]");
    const results = document.querySelector("[data-search-results]");
    if (!form || !results) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = new FormData(form).get("search")?.toString().trim().toLowerCase() || "";
      const cars = window.TCDCars?.getCars?.() || storage.get("cars", []);
      const matches = cars.filter((car) =>
        [car.brand, car.model, car.fuel, car.transmission, car.color]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
      if (!query) {
        results.innerHTML = '<div class="empty-state py-3">Typ een merk, model, brandstof of kleur.</div>';
        return;
      }
      if (!matches.length) {
        results.innerHTML = '<div class="empty-state py-3">Geen auto gevonden. Probeer een andere zoekterm.</div>';
        return;
      }
      results.innerHTML = matches.slice(0, 5).map((car) => `
        <a class="search-result" href="${asset(`templates/car-details.html?id=${encodeURIComponent(car.id)}`)}">
          <img src="${asset(car.image)}" alt="${escapeHTML(car.brand)} ${escapeHTML(car.model)}">
          <span><strong>${escapeHTML(car.brand)} ${escapeHTML(car.model)}</strong><small class="d-block text-muted">${car.year} · ${formatMoney(car.price)}</small></span>
          <span class="search-arrow" aria-hidden="true">→</span>
        </a>`).join("");
    });
  }

  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const messages = storage.get("contact_messages", []);
      const record = {
        id: uid("CONTACT"),
        ...data,
        status: "Nieuw",
        createdAt: new Date().toISOString()
      };
      messages.unshift(record);
      storage.set("contact_messages", messages);
      form.reset();
      form.classList.remove("was-validated");
      showSuccess({
        title: "Bericht ontvangen",
        message: `Uw bericht is succesvol verzonden. Uw referentienummer is ${record.id}.`
      });
    });
  }

  function initTooltips() {
    if (typeof bootstrap === "undefined") return;
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => {
      bootstrap.Tooltip.getOrCreateInstance(element);
    });
  }

  window.TCD = {
    storage,
    getBasePath,
    asset,
    uid,
    escapeHTML,
    formatMoney,
    formatDate,
    toast,
    showSuccess
  };

  document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initLoadingScreen();
    setActiveNavigation();
    initRevealAnimations();
    initCounters();
    initHeroVideo();
    initTiltSurfaces();
    initHeroParallax();
    initMagneticControls();
    initGlobalSearch();
    initContactForm();
    initTooltips();
    document.querySelectorAll("[data-current-year]").forEach((item) => {
      item.textContent = new Date().getFullYear();
    });
  });
}());
