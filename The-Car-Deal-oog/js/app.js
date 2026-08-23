/*
  The Car Deal-oog
  Bestand 1 van 3: algemene websitefuncties, thema, account en rollen.
*/
(function () {
  "use strict";

  var storagePrefix = "tcd_";

  var storage = {
    get: function (key, fallback) {
      try {
        var savedValue = localStorage.getItem(storagePrefix + key);
        return savedValue === null ? fallback : JSON.parse(savedValue);
      } catch (error) {
        return fallback;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(storagePrefix + key, JSON.stringify(value));
        return true;
      } catch (error) {
        return false;
      }
    },
    remove: function (key) {
      localStorage.removeItem(storagePrefix + key);
    }
  };

  function isTemplatePage() {
    return window.location.pathname.indexOf("/templates/") !== -1;
  }

  function asset(path) {
    var value = String(path || "");
    if (/^(data:|blob:|https?:|\/\/)/i.test(value)) return value;
    return (isTemplatePage() ? "../" : "") + value.replace(/^\.\//, "");
  }

  function uniqueId(prefix) {
    return prefix + "-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  function escapeHTML(value) {
    return String(value === undefined || value === null ? "" : value)
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

  function showToast(message, color) {
    var container = document.querySelector("[data-toast-container]");
    if (!container || typeof bootstrap === "undefined") {
      window.alert(message);
      return;
    }

    var toastElement = document.createElement("div");
    toastElement.className = "toast align-items-center text-bg-" + (color || "primary") + " border-0";
    toastElement.setAttribute("role", "status");
    toastElement.innerHTML =
      '<div class="d-flex">' +
        '<div class="toast-body">' + escapeHTML(message) + '</div>' +
        '<button class="btn-close btn-close-white me-2 m-auto" type="button" data-bs-dismiss="toast" aria-label="Sluiten"></button>' +
      '</div>';
    container.appendChild(toastElement);

    var toast = new bootstrap.Toast(toastElement, { delay: 3200 });
    toastElement.addEventListener("hidden.bs.toast", function () {
      toastElement.remove();
    });
    toast.show();
  }

  function showSuccess(options) {
    var settings = options || {};
    var modalElement = document.getElementById("successModal");
    if (!modalElement || typeof bootstrap === "undefined") {
      window.alert(settings.message || "De actie is uitgevoerd.");
      if (settings.redirect) window.location.href = settings.redirect;
      return;
    }

    var title = modalElement.querySelector("[data-success-title]");
    var message = modalElement.querySelector("[data-success-message]");
    var oldButton = modalElement.querySelector("[data-success-ok]");
    if (title) title.textContent = settings.title || "Gelukt";
    if (message) message.textContent = settings.message || "De actie is uitgevoerd.";

    if (oldButton) {
      var newButton = oldButton.cloneNode(true);
      oldButton.replaceWith(newButton);
      if (settings.redirect) {
        newButton.addEventListener("click", function () {
          window.location.href = settings.redirect;
        });
      }
    }

    bootstrap.Modal.getOrCreateInstance(modalElement).show();
  }

  function applyTheme(theme, saveChoice) {
    var chosenTheme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", chosenTheme);
    document.documentElement.style.colorScheme = chosenTheme;
    if (saveChoice !== false) storage.set("theme", chosenTheme);

    document.querySelectorAll("[data-theme-text]").forEach(function (text) {
      text.textContent = chosenTheme === "light" ? "Licht" : "Donker";
    });

    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      button.setAttribute("aria-pressed", chosenTheme === "light" ? "true" : "false");
      button.setAttribute("aria-label", chosenTheme === "light" ? "Schakel naar donker thema" : "Schakel naar licht thema");
    });

    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = chosenTheme === "light" ? "#ffffff" : "#08090b";
  }

  function initTheme() {
    applyTheme(storage.get("theme", "dark"), false);

    document.addEventListener("click", function (event) {
      var button = event.target.closest("[data-theme-toggle]");
      if (!button) return;
      var nextTheme = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(nextTheme, true);
    });
  }

  function initLoadingScreen() {
    var loadingScreen = document.querySelector("[data-loading-screen]");
    if (!loadingScreen) return;
    window.setTimeout(function () {
      loadingScreen.classList.add("is-hidden");
    }, 240);
  }

  function initActiveNavigation() {
    var page = document.body.getAttribute("data-page");
    if (!page) return;
    document.querySelectorAll('[data-nav="' + page + '"]').forEach(function (link) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    });
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal-item");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (item) { item.classList.add("show"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach(function (item) { observer.observe(item); });
  }

  function initCounters() {
    document.querySelectorAll("[data-counter]").forEach(function (counter) {
      var endNumber = Number(counter.getAttribute("data-counter")) || 0;
      var suffix = counter.getAttribute("data-suffix") || "";
      var current = 0;
      var step = Math.max(1, Math.ceil(endNumber / 35));

      var timer = window.setInterval(function () {
        current += step;
        if (current >= endNumber) {
          current = endNumber;
          window.clearInterval(timer);
        }
        counter.textContent = current + suffix;
      }, 28);
    });
  }

  function initHeroVideo() {
    var video = document.querySelector("[data-hero-video]");
    if (!video) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var saveData = navigator.connection && navigator.connection.saveData;
    var visible = true;

    function updateVideo() {
      if (!document.hidden && visible && !reduceMotion && !saveData) {
        video.play().catch(function () {});
      } else {
        video.pause();
      }
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        updateVideo();
      }, { threshold: 0.08 });
      observer.observe(video);
    }

    document.addEventListener("visibilitychange", updateVideo);
    updateVideo();
  }

  function initHomeMotion() {
    var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduceMotion) return;

    document.querySelectorAll(".tilt-card").forEach(function (card) {
      if (card.getAttribute("data-tilt-ready") === "yes") return;
      card.setAttribute("data-tilt-ready", "yes");
      card.addEventListener("pointermove", function (event) {
        var box = card.getBoundingClientRect();
        var x = (event.clientX - box.left) / box.width;
        var y = (event.clientY - box.top) / box.height;
        card.style.setProperty("--rotate-y", ((x - 0.5) * 9).toFixed(2) + "deg");
        card.style.setProperty("--rotate-x", ((0.5 - y) * 8).toFixed(2) + "deg");
        card.style.setProperty("--mouse-x", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--mouse-y", (y * 100).toFixed(1) + "%");
      });

      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--rotate-y", "0deg");
        card.style.setProperty("--rotate-x", "0deg");
      });
    });

    var hero = document.querySelector("[data-home-hero]");
    if (hero) {
      hero.addEventListener("pointermove", function (event) {
        var box = hero.getBoundingClientRect();
        var x = (event.clientX - box.left) / box.width - 0.5;
        var y = (event.clientY - box.top) / box.height - 0.5;
        hero.style.setProperty("--video-x", (-x * 12).toFixed(1) + "px");
        hero.style.setProperty("--video-y", (-y * 8).toFixed(1) + "px");
        hero.style.setProperty("--grid-x", (x * 16).toFixed(1) + "px");
        hero.style.setProperty("--grid-y", (y * 12).toFixed(1) + "px");
      });
    }
  }

  var builtInUsers = [
    {
      id: "user-admin",
      name: "Administrator",
      username: "Admin",
      email: "admin@cardeal-oog.com",
      phone: "+597 888-2233",
      password: "admin",
      role: "Admin",
      status: "Actief",
      createdAt: "2026-08-01T09:00:00.000Z"
    },
    {
      id: "user-manager",
      name: "Showroom Manager",
      username: "Manager",
      email: "manager@cardeal-oog.com",
      phone: "+597 888-2244",
      password: "manager2026",
      role: "Manager",
      status: "Actief",
      createdAt: "2026-08-01T09:10:00.000Z"
    }
  ];

  function getUsers() {
    var users = storage.get("users", []);
    if (!Array.isArray(users)) users = [];

    builtInUsers.forEach(function (builtInUser) {
      var exists = users.some(function (user) {
        return user.id === builtInUser.id;
      });
      if (!exists) users.unshift(builtInUser);
    });

    storage.set("users", users);
    return users;
  }

  function saveUsers(users) {
    return storage.set("users", users);
  }

  function getCurrentUser() {
    var session = storage.get("session", null);
    if (!session || !session.userId) return null;
    return getUsers().find(function (user) {
      return user.id === session.userId && user.status !== "Geblokkeerd";
    }) || null;
  }

  function isStaff(user) {
    var current = user || getCurrentUser();
    return Boolean(current && (current.role === "Admin" || current.role === "Manager"));
  }

  function login(identifier, password) {
    var normalized = String(identifier || "").trim().toLowerCase();
    var user = getUsers().find(function (candidate) {
      return (candidate.email.toLowerCase() === normalized || candidate.username.toLowerCase() === normalized) &&
        candidate.password === password;
    });

    if (!user) return { ok: false, message: "E-mail, gebruikersnaam of wachtwoord is onjuist." };
    if (user.status === "Geblokkeerd") return { ok: false, message: "Dit account is geblokkeerd." };

    storage.set("session", {
      userId: user.id,
      loggedInAt: new Date().toISOString()
    });
    return { ok: true, user: user };
  }

  function can(permission) {
    var user = getCurrentUser();
    if (!user) return false;
    if (user.role === "Admin") return true;

    var managerRights = [
      "view_cars",
      "edit_cars",
      "view_offers",
      "process_offers",
      "view_services",
      "process_services"
    ];
    return user.role === "Manager" && managerRights.indexOf(permission) !== -1;
  }

  function updateAuthInterface() {
    var user = getCurrentUser();
    var staff = isStaff(user);

    document.querySelectorAll("[data-auth-name]").forEach(function (element) {
      element.textContent = user ? user.username : "Mijn account";
    });

    document.querySelectorAll("[data-staff-only]").forEach(function (element) {
      element.hidden = !staff;
      element.setAttribute("aria-hidden", staff ? "false" : "true");
    });

    document.querySelectorAll("[data-logout-button]").forEach(function (element) {
      element.hidden = !user;
    });
  }

  function logout() {
    storage.remove("session");
    updateAuthInterface();
    window.location.replace(asset("Index.html"));
  }

  function renderAccount() {
    var container = document.querySelector("[data-account-content]");
    if (!container) return;
    var user = getCurrentUser();

    if (!user) {
      container.innerHTML =
        '<div class="empty-message">' +
          '<h3 class="h5">U bent nog niet ingelogd</h3>' +
          '<p>Open het tabblad Inloggen of maak een klantaccount.</p>' +
        '</div>';
      return;
    }

    var offers = storage.get("offers", []).filter(function (offer) {
      return offer.email.toLowerCase() === user.email.toLowerCase();
    });
    var requests = storage.get("service_requests", []).filter(function (request) {
      return request.email.toLowerCase() === user.email.toLowerCase();
    });
    var allRequests = offers.map(function (item) {
      return { id: item.id, type: "Offerte", date: item.createdAt, status: item.status };
    }).concat(requests.map(function (item) {
      return { id: item.id, type: item.serviceLabel, date: item.createdAt, status: item.status };
    }));

    allRequests.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    var rows = allRequests.length ? allRequests.map(function (item) {
      return "<tr><td>" + escapeHTML(item.id) + "</td><td>" + escapeHTML(item.type) + "</td><td>" + formatDate(item.date) + "</td><td><span class=\"status-badge\">" + escapeHTML(item.status) + "</span></td></tr>";
    }).join("") : '<tr><td colspan="4">Nog geen aanvragen.</td></tr>';

    container.innerHTML =
      '<div class="row g-4">' +
        '<div class="col-lg-4">' +
          '<div class="account-shell h-100">' +
            '<span class="role-badge">' + escapeHTML(user.role) + '</span>' +
            '<h3 class="h4 mt-3">' + escapeHTML(user.name) + '</h3>' +
            '<p><strong>Gebruikersnaam:</strong><br>' + escapeHTML(user.username) + '</p>' +
            '<p><strong>E-mail:</strong><br>' + escapeHTML(user.email) + '</p>' +
            '<p><strong>Telefoon:</strong><br>' + escapeHTML(user.phone || "-") + '</p>' +
            (isStaff(user) ? '<button class="btn btn-brand w-100 mb-2" type="button" data-open-backoffice>Open backoffice</button>' : '') +
            '<button class="btn btn-outline-danger w-100" type="button" data-logout-button>Uitloggen</button>' +
          '</div>' +
        '</div>' +
        '<div class="col-lg-8">' +
          '<div class="account-shell h-100">' +
            '<h3 class="h4">Mijn aanvragen</h3>' +
            '<div class="table-responsive"><table class="table"><thead><tr><th>Referentie</th><th>Type</th><th>Datum</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function showAccountTab(tabName) {
    var accountPage = document.querySelector("[data-account-page]");
    if (!accountPage) {
      window.location.href = asset("templates/mijnaccount.html#" + tabName);
      return;
    }
    if (typeof bootstrap === "undefined") return;

    var buttonId = "loginTab";
    if (tabName === "register") buttonId = "registerTab";
    if (tabName === "account") buttonId = "accountTab";

    renderAccount();
    var tabButton = document.getElementById(buttonId);
    if (tabButton) bootstrap.Tab.getOrCreateInstance(tabButton).show();
  }

  function prepareBackoffice() {
    var user = getCurrentUser();
    var guard = document.querySelector("[data-backoffice-guard]");
    var protectedContent = document.querySelector("[data-backoffice-protected]");

    if (!isStaff(user)) {
      if (protectedContent) protectedContent.hidden = true;
      if (guard) {
        guard.hidden = false;
        guard.innerHTML =
          "<h3>Geen toegang</h3>" +
          "<p>Alleen een Admin of Manager kan de backoffice bekijken. Een normale gebruiker ziet geen beheerdata.</p>";
      }
      return false;
    }

    if (guard) guard.hidden = true;
    if (protectedContent) protectedContent.hidden = false;
    document.querySelectorAll("[data-backoffice-name]").forEach(function (element) {
      element.textContent = user.name;
    });
    document.querySelectorAll("[data-backoffice-role]").forEach(function (element) {
      element.textContent = user.role;
    });
    document.querySelectorAll("[data-admin-only]").forEach(function (element) {
      element.hidden = user.role !== "Admin";
    });
    document.querySelectorAll("[data-manager-note]").forEach(function (element) {
      element.hidden = user.role !== "Manager";
    });
    return true;
  }

  function openBackoffice() {
    var modalElement = document.getElementById("backofficeModal");
    if (!modalElement || typeof bootstrap === "undefined") {
      window.location.href = asset("Index.html#backoffice");
      return;
    }

    var allowed = prepareBackoffice();
    bootstrap.Modal.getOrCreateInstance(modalElement).show();
    if (allowed) {
      document.dispatchEvent(new CustomEvent("tcd:backoffice-open"));
    }
  }

  function initLoginForm() {
    var form = document.querySelector("[data-login-form]");
    if (!form) return;
    var feedback = form.querySelector("[data-login-feedback]");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) return;

      var values = Object.fromEntries(new FormData(form).entries());
      var result = login(values.identifier, values.password);
      if (!result.ok) {
        feedback.hidden = false;
        feedback.className = "alert alert-danger mt-3";
        feedback.textContent = result.message;
        return;
      }

      feedback.hidden = false;
      feedback.className = "alert alert-success mt-3";
      feedback.textContent = "Welkom " + result.user.username + ".";
      updateAuthInterface();
      renderAccount();
      form.reset();
      form.classList.remove("was-validated");

      if (isStaff(result.user)) {
        history.replaceState(null, "", "#backoffice");
        openBackoffice();
      } else {
        history.replaceState(null, "", "#account");
        showAccountTab("account");
      }
    });
  }

  function initRegisterForm() {
    var form = document.querySelector("[data-register-form]");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) return;

      var values = Object.fromEntries(new FormData(form).entries());
      if (values.password !== values.confirmPassword) {
        showToast("De wachtwoorden zijn niet hetzelfde.", "danger");
        return;
      }

      var users = getUsers();
      var duplicate = users.some(function (user) {
        return user.email.toLowerCase() === values.email.toLowerCase() ||
          user.username.toLowerCase() === values.username.toLowerCase();
      });
      if (duplicate) {
        showToast("Dit e-mailadres of deze gebruikersnaam bestaat al.", "danger");
        return;
      }

      var user = {
        id: uniqueId("USER"),
        name: values.name,
        username: values.username,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: "Customer",
        status: "Actief",
        createdAt: new Date().toISOString()
      };
      users.push(user);
      saveUsers(users);
      storage.set("session", { userId: user.id, loggedInAt: new Date().toISOString() });
      updateAuthInterface();
      renderAccount();
      form.reset();
      form.classList.remove("was-validated");
      history.replaceState(null, "", "#account");
      showAccountTab("account");
      showToast("Uw klantaccount is aangemaakt.", "success");
    });
  }

  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) return;

      var values = Object.fromEntries(new FormData(form).entries());
      var messages = storage.get("contact_messages", []);
      var record = {
        id: uniqueId("CONTACT"),
        name: values.name,
        email: values.email,
        phone: values.phone || "",
        subject: values.subject,
        message: values.message,
        status: "Nieuw",
        createdAt: new Date().toISOString()
      };
      messages.unshift(record);
      storage.set("contact_messages", messages);
      form.reset();
      form.classList.remove("was-validated");
      showSuccess({
        title: "Bericht ontvangen",
        message: "Uw bericht is verzonden. Referentie: " + record.id + "."
      });
    });
  }

  function initAccountButtons() {
    document.addEventListener("click", function (event) {
      var logoutButton = event.target.closest("[data-logout-button]");
      if (logoutButton) {
        event.preventDefault();
        logout();
        return;
      }

      if (event.target.closest("[data-open-login]")) {
        event.preventDefault();
        history.replaceState(null, "", "#login");
        showAccountTab("login");
        return;
      }

      if (event.target.closest("[data-open-register]")) {
        event.preventDefault();
        history.replaceState(null, "", "#register");
        showAccountTab("register");
        return;
      }

      if (event.target.closest("[data-open-account]")) {
        event.preventDefault();
        history.replaceState(null, "", "#account");
        showAccountTab(getCurrentUser() ? "account" : "login");
        return;
      }

      if (event.target.closest("[data-open-backoffice]")) {
        event.preventDefault();
        history.replaceState(null, "", "#backoffice");
        openBackoffice();
      }
    });

    window.addEventListener("storage", function (event) {
      if (event.key === storagePrefix + "session") {
        updateAuthInterface();
        renderAccount();
      }
    });
  }

  function openHashView() {
    var view = window.location.hash.replace("#", "").toLowerCase();
    if (view === "backoffice") {
      openBackoffice();
      return;
    }
    if (view === "login") showAccountTab("login");
    if (view === "register") showAccountTab("register");
    if (view === "account") showAccountTab(getCurrentUser() ? "account" : "login");
  }

  window.TCD = {
    storage: storage,
    asset: asset,
    uniqueId: uniqueId,
    escapeHTML: escapeHTML,
    formatMoney: formatMoney,
    formatDate: formatDate,
    toast: showToast,
    showSuccess: showSuccess
  };

  window.TCDAuth = {
    builtInUsers: builtInUsers,
    getUsers: getUsers,
    saveUsers: saveUsers,
    getCurrentUser: getCurrentUser,
    isStaff: isStaff,
    login: login,
    logout: logout,
    can: can,
    updateInterface: updateAuthInterface,
    prepareBackoffice: prepareBackoffice
  };

  document.addEventListener("tcd:content-rendered", initHomeMotion);

  document.addEventListener("DOMContentLoaded", function () {
    getUsers();
    initTheme();
    initLoadingScreen();
    initActiveNavigation();
    initReveal();
    initCounters();
    initHeroVideo();
    initHomeMotion();
    initLoginForm();
    initRegisterForm();
    initContactForm();
    initAccountButtons();
    updateAuthInterface();
    renderAccount();
    document.querySelectorAll("[data-current-year]").forEach(function (element) {
      element.textContent = new Date().getFullYear();
    });
    window.addEventListener("hashchange", openHashView);
    window.setTimeout(openHashView, 80);
  });
}());
