/* The Car Deal-oog V2 - role-aware authentication */
(function () {
  "use strict";

  const builtInUsers = [
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
    const users = TCD.storage.get("users", []);
    const merged = [...users];
    builtInUsers.forEach((builtIn) => {
      if (!merged.some((user) => user.id === builtIn.id)) merged.unshift(builtIn);
    });
    TCD.storage.set("users", merged);
    return merged;
  }

  function saveUsers(users) {
    TCD.storage.set("users", users);
  }

  function getCurrentUser() {
    const session = TCD.storage.get("session", null);
    if (!session?.userId) return null;
    return getUsers().find((user) => user.id === session.userId && user.status !== "Geblokkeerd") || null;
  }

  function login(identifier, password) {
    const normalized = String(identifier).trim().toLowerCase();
    const user = getUsers().find((candidate) =>
      (candidate.email.toLowerCase() === normalized || candidate.username.toLowerCase() === normalized) &&
      candidate.password === password
    );
    if (!user) return { ok: false, message: "E-mailadres, gebruikersnaam of wachtwoord is onjuist." };
    if (user.status === "Geblokkeerd") return { ok: false, message: "Dit account is geblokkeerd. Neem contact op met de administrator." };
    TCD.storage.set("session", { userId: user.id, loggedInAt: new Date().toISOString() });
    return { ok: true, user };
  }

  function isStaff(user = getCurrentUser()) {
    return Boolean(user && ["Admin", "Manager"].includes(user.role));
  }

  function logout(event) {
    event?.preventDefault();
    TCD.storage.remove("session");
    updateAccountNavigation();
    window.location.replace(TCD.asset("Index.html"));
  }

  function can(permission) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.role === "Admin") return true;
    const managerPermissions = [
      "view_cars",
      "edit_cars",
      "view_offers",
      "process_offers",
      "view_services",
      "process_services"
    ];
    return user.role === "Manager" && managerPermissions.includes(permission);
  }

  function updateAccountNavigation() {
    const user = getCurrentUser();
    const staffAccess = isStaff(user);
    document.querySelectorAll("[data-auth-user]").forEach((element) => {
      element.textContent = user ? user.username : "Mijn account";
    });
    document.querySelectorAll("[data-staff-only]").forEach((element) => {
      element.hidden = !staffAccess;
      if (staffAccess) element.removeAttribute("aria-hidden");
      else element.setAttribute("aria-hidden", "true");
    });
    document.querySelectorAll("[data-logout-button]").forEach((button) => {
      button.hidden = !user;
    });
  }

  function initAuthActions() {
    document.addEventListener("click", (event) => {
      const logoutButton = event.target.closest("[data-logout-button]");
      if (logoutButton) logout(event);
    });

    window.addEventListener("storage", (event) => {
      if (event.key !== "tcd_session") return;
      updateAccountNavigation();
      if (document.querySelector("[data-backoffice-protected]") && !isStaff()) {
        window.location.reload();
      }
    });
  }

  function initLoginForm() {
    const form = document.querySelector("[data-login-form]");
    if (!form) return;
    const feedback = form.querySelector("[data-login-feedback]");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const result = login(data.identifier, data.password);
      if (!result.ok) {
        feedback.textContent = result.message;
        feedback.className = "alert alert-danger mt-3";
        return;
      }
      feedback.textContent = `Welkom ${result.user.username}. U wordt doorgestuurd…`;
      feedback.className = "alert alert-success mt-3";
      const destination = ["Admin", "Manager"].includes(result.user.role)
        ? TCD.asset("templates/backoffice.html")
        : TCD.asset("templates/account.html");
      window.setTimeout(() => { window.location.href = destination; }, 450);
    });
  }

  function initRegistrationForm() {
    const form = document.querySelector("[data-register-form]");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      if (data.password !== data.confirmPassword) {
        TCD.toast("De twee wachtwoorden zijn niet gelijk.", "danger");
        return;
      }
      const users = getUsers();
      const duplicate = users.some((user) =>
        user.email.toLowerCase() === data.email.toLowerCase() ||
        user.username.toLowerCase() === data.username.toLowerCase()
      );
      if (duplicate) {
        TCD.toast("Dit e-mailadres of deze gebruikersnaam bestaat al.", "danger");
        return;
      }
      const user = {
        id: TCD.uid("USER"),
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: "Customer",
        status: "Actief",
        createdAt: new Date().toISOString()
      };
      users.push(user);
      saveUsers(users);
      TCD.storage.set("session", { userId: user.id, loggedInAt: new Date().toISOString() });
      TCD.showSuccess({
        title: "Account aangemaakt",
        message: "Uw account is gereed. Klik op OK om naar Mijn Account te gaan.",
        redirect: TCD.asset("templates/account.html")
      });
    });
  }

  function initAccountPage() {
    const container = document.querySelector("[data-account-content]");
    if (!container) return;
    const user = getCurrentUser();
    if (!user) {
      container.innerHTML = `
        <div class="empty-state">
          <h2 class="h4">U bent nog niet ingelogd</h2>
          <p>Log in om uw account, offertes en aanvragen te bekijken.</p>
          <a class="btn btn-tcd" href="${TCD.asset("templates/login.html")}">Naar login</a>
        </div>`;
      return;
    }
    const offers = TCD.storage.get("offers", []).filter((offer) => offer.email.toLowerCase() === user.email.toLowerCase());
    const requests = TCD.storage.get("service_requests", []).filter((request) => request.email.toLowerCase() === user.email.toLowerCase());
    const requestRows = [
      ...offers.map((item) => ({ type: "Offerte", id: item.id, status: item.status, date: item.createdAt })),
      ...requests.map((item) => ({ type: item.serviceLabel, id: item.id, status: item.status, date: item.createdAt }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-4">
          <div class="content-card h-100">
            <span class="role-badge">${TCD.escapeHTML(user.role)}</span>
            <h2 class="h3 mt-3">${TCD.escapeHTML(user.name)}</h2>
            <dl class="mt-4">
              <dt>Gebruikersnaam</dt><dd>${TCD.escapeHTML(user.username)}</dd>
              <dt>E-mailadres</dt><dd>${TCD.escapeHTML(user.email)}</dd>
              <dt>Telefoon</dt><dd>${TCD.escapeHTML(user.phone || "-")}</dd>
              <dt>Status</dt><dd>${TCD.escapeHTML(user.status)}</dd>
            </dl>
            ${["Admin", "Manager"].includes(user.role) ? `<a class="btn btn-tcd w-100" href="${TCD.asset("templates/backoffice.html")}">Open backoffice</a>` : ""}
            <button class="btn btn-outline-danger w-100 mt-2" type="button" data-logout-button>Uitloggen</button>
          </div>
        </div>
        <div class="col-lg-8">
          <div class="dashboard-panel h-100">
            <div class="dashboard-toolbar">
              <div><span class="eyebrow">Overzicht</span><h2 class="h3 mb-0">Mijn aanvragen</h2></div>
              <span class="role-badge">${requestRows.length} totaal</span>
            </div>
            ${requestRows.length ? `
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead><tr><th>Referentie</th><th>Type</th><th>Datum</th><th>Status</th></tr></thead>
                  <tbody>${requestRows.map((item) => `<tr><td><strong>${TCD.escapeHTML(item.id)}</strong></td><td>${TCD.escapeHTML(item.type)}</td><td>${TCD.formatDate(item.date)}</td><td><span class="status-pill">${TCD.escapeHTML(item.status)}</span></td></tr>`).join("")}</tbody>
                </table>
              </div>` : '<div class="empty-state"><p class="mb-3">U heeft nog geen aanvragen.</p><a class="btn btn-tcd" href="' + TCD.asset("templates/cars.html") + '">Bekijk auto’s</a></div>'}
          </div>
        </div>
      </div>`;
  }

  window.TCDAuth = {
    builtInUsers,
    getUsers,
    saveUsers,
    getCurrentUser,
    isStaff,
    login,
    logout,
    can
  };

  document.addEventListener("DOMContentLoaded", () => {
    getUsers();
    initAuthActions();
    updateAccountNavigation();
    initLoginForm();
    initRegistrationForm();
    initAccountPage();
  });
}());
