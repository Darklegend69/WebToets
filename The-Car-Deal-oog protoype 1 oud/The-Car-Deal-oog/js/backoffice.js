/* The Car Deal-oog V2 - Admin and Manager backoffice */
(function () {
  "use strict";

  const requestStatuses = ["Nieuw", "In behandeling", "Afgerond", "Afgewezen"];
  const MAX_SOURCE_IMAGE_SIZE = 15 * 1024 * 1024;
  const MAX_STORED_DATA_LENGTH = 720_000;
  let imageProcessing = false;

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("De gekozen foto kon niet worden gelezen."));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Dit beeldformaat wordt niet door deze browser ondersteund."));
      image.src = source;
    });
  }

  async function optimizeCarImage(file) {
    if (!file?.type?.startsWith("image/")) {
      throw new Error("Kies een geldig afbeeldingsbestand.");
    }
    if (file.size > MAX_SOURCE_IMAGE_SIZE) {
      throw new Error("De bronfoto mag maximaal 15 MB zijn.");
    }

    let source = "";
    let revokeSource = false;
    try {
      source = URL.createObjectURL(file);
      revokeSource = true;
    } catch (error) {
      source = await fileToDataURL(file);
    }
    let image;
    try {
      image = await loadImage(source);
    } catch (objectUrlError) {
      if (!revokeSource) throw objectUrlError;
      const dataSource = await fileToDataURL(file);
      image = await loadImage(dataSource);
    } finally {
      if (revokeSource) URL.revokeObjectURL(source);
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("De foto kan in deze browser niet worden verwerkt.");

    const attempts = [
      { maxWidth: 1600, quality: 0.82 },
      { maxWidth: 1280, quality: 0.76 },
      { maxWidth: 1080, quality: 0.7 },
      { maxWidth: 900, quality: 0.64 }
    ];
    let optimized = "";

    for (const attempt of attempts) {
      const scale = Math.min(1, attempt.maxWidth / image.naturalWidth);
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      optimized = canvas.toDataURL("image/webp", attempt.quality);
      if (optimized.length <= MAX_STORED_DATA_LENGTH) break;
    }

    if (!optimized || optimized.length > MAX_STORED_DATA_LENGTH) {
      throw new Error("De foto blijft te groot. Kies een kleinere afbeelding.");
    }
    return optimized;
  }

  function updateImagePreview(form, source, message, tone = "muted") {
    const preview = form.querySelector("[data-car-image-preview]");
    const status = form.querySelector("[data-car-image-status]");
    if (preview) preview.src = source ? TCD.asset(source) : "";
    if (status) {
      status.className = `small mt-2 text-${tone}`;
      status.textContent = message;
    }
  }

  function requireBackofficeAccess() {
    const user = TCDAuth.getCurrentUser();
    const guard = document.querySelector("[data-backoffice-guard]");
    const protectedPage = document.querySelector("[data-backoffice-protected]");
    const content = document.querySelector("[data-backoffice-content]");
    if (!TCDAuth.isStaff(user)) {
      if (protectedPage) protectedPage.hidden = true;
      if (content) content.hidden = true;
      if (guard) {
        guard.hidden = false;
        const destination = user ? TCD.asset("templates/account.html") : TCD.asset("templates/login.html");
        const buttonLabel = user ? "Terug naar Mijn Account" : "Naar login";
        const explanation = user
          ? "Uw klantaccount heeft geen toegang tot het beheer. Alleen een Admin of Manager kan de backoffice openen."
          : "Log in met een Admin- of Manageraccount om het dashboard te openen.";
        guard.innerHTML = `
          <section class="page-hero secure-guard-hero">
            <div class="container position-relative">
              <span class="eyebrow">Beveiligde omgeving</span>
              <h1>Geen backoffice-toegang</h1>
              <p>${explanation}</p>
            </div>
          </section>
          <div class="container page-shell">
            <div class="content-card secure-guard-card mx-auto text-center">
              <span class="service-icon mx-auto" aria-hidden="true">⌁</span>
              <h2 class="h3">Rolcontrole actief</h2>
              <p class="text-muted">De dashboardgegevens blijven afgeschermd voor normale gebruikers.</p>
              <a class="btn btn-tcd" href="${destination}">${buttonLabel}</a>
            </div>
          </div>`;
      }
      return null;
    }
    if (guard) guard.hidden = true;
    if (protectedPage) protectedPage.hidden = false;
    if (content) content.hidden = false;
    document.querySelectorAll("[data-backoffice-name]").forEach((item) => { item.textContent = user.name; });
    document.querySelectorAll("[data-backoffice-role]").forEach((item) => { item.textContent = user.role; });
    document.querySelectorAll("[data-admin-only]").forEach((item) => { item.hidden = user.role !== "Admin"; });
    document.querySelectorAll("[data-manager-note]").forEach((item) => { item.hidden = user.role !== "Manager"; });
    return user;
  }

  function updateStats() {
    const values = {
      cars: TCDCars.getCars().length,
      offers: TCD.storage.get("offers", []).length,
      services: TCD.storage.get("service_requests", []).length,
      users: TCDAuth.getUsers().length
    };
    Object.entries(values).forEach(([key, value]) => {
      document.querySelectorAll(`[data-stat-${key}]`).forEach((item) => { item.textContent = value; });
    });
  }

  function renderCars() {
    const body = document.querySelector("[data-backoffice-cars]");
    if (!body) return;
    const user = TCDAuth.getCurrentUser();
    body.innerHTML = TCDCars.getCars().map((car) => `
      <tr>
        <td><img class="table-car-thumb" src="${TCD.asset(car.image)}" alt="${TCD.escapeHTML(car.brand)} ${TCD.escapeHTML(car.model)}"></td>
        <td><strong>${TCD.escapeHTML(car.brand)} ${TCD.escapeHTML(car.model)}</strong><small class="d-block text-muted">${TCD.escapeHTML(car.id)}</small></td>
        <td>${car.year}</td>
        <td>${TCD.formatMoney(car.price)}</td>
        <td>${Number(car.mileage).toLocaleString("nl-NL")} km</td>
        <td><span class="status-pill">${TCD.escapeHTML(car.availability)}</span></td>
        <td class="text-nowrap">
          <button class="btn btn-sm btn-outline-primary" type="button" data-edit-car="${TCD.escapeHTML(car.id)}">Bewerken</button>
          ${user?.role === "Admin" ? `<button class="btn btn-sm btn-outline-danger" type="button" data-delete-car="${TCD.escapeHTML(car.id)}">Verwijderen</button>` : ""}
        </td>
      </tr>`).join("");
  }

  function openCarEditor(car) {
    if (!TCDAuth.can("edit_cars")) return;
    const form = document.querySelector("[data-car-editor]");
    const modal = document.getElementById("carEditorModal");
    if (!form || !modal) return;
    form.reset();
    form.classList.remove("was-validated");
    const values = car || {
      id: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      price: "",
      mileage: 0,
      fuel: "Benzine",
      transmission: "Automaat",
      engine: "",
      power: "",
      color: "",
      description: "",
      availability: "Beschikbaar",
      image: "",
      featured: true
    };
    Object.entries(values).forEach(([key, value]) => {
      const field = form.elements.namedItem(key);
      if (!field) return;
      if (field.type === "checkbox") field.checked = Boolean(value);
      else field.value = value;
    });
    const imageInput = form.querySelector("[data-car-image-input]");
    if (imageInput) {
      imageInput.value = "";
      imageInput.setCustomValidity("");
    }
    updateImagePreview(
      form,
      values.image,
      values.image ? "Huidige autofoto. Kies een nieuw bestand om deze te vervangen." : "Kies een foto vanaf uw apparaat.",
      values.image ? "success" : "muted"
    );
    modal.querySelector("[data-car-editor-title]").textContent = car ? "Auto bewerken" : "Auto toevoegen";
    bootstrap.Modal.getOrCreateInstance(modal).show();
  }

  function saveCarFromForm(form) {
    if (imageProcessing) {
      TCD.toast("Wacht tot de foto volledig is verwerkt.", "warning");
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    const cars = TCDCars.getCars();
    const existingIndex = cars.findIndex((car) => car.id === data.id);
    const isNew = existingIndex < 0;
    if (isNew && !TCDAuth.can("add_cars")) {
      TCD.toast("Alleen de Admin kan nieuwe auto’s toevoegen.", "danger");
      return;
    }
    if (!data.image) {
      const input = form.querySelector("[data-car-image-input]");
      input?.setCustomValidity("Kies een autofoto.");
      input?.reportValidity();
      TCD.toast("Kies eerst zelf een autofoto.", "danger");
      return;
    }
    const record = {
      id: data.id || TCD.uid("CAR").toLowerCase(),
      brand: data.brand,
      model: data.model,
      year: Number(data.year),
      price: Number(data.price),
      mileage: Number(data.mileage),
      fuel: data.fuel,
      transmission: data.transmission,
      engine: data.engine,
      power: data.power,
      color: data.color,
      description: data.description,
      availability: data.availability,
      image: data.image,
      featured: data.featured === "on"
    };
    if (isNew) cars.unshift(record);
    else cars[existingIndex] = record;
    if (TCDCars.saveCars(cars) === false) {
      TCD.toast("De foto past niet in de lokale browseropslag. Kies een kleinere foto.", "danger");
      return;
    }
    bootstrap.Modal.getInstance(document.getElementById("carEditorModal"))?.hide();
    renderCars();
    updateStats();
    TCD.toast(isNew ? "Auto toegevoegd." : "Auto bijgewerkt.", "success");
  }

  function deleteCar(id) {
    if (!TCDAuth.can("delete_cars")) return;
    const car = TCDCars.getCar(id);
    if (!car || !confirm(`Wilt u ${car.brand} ${car.model} echt verwijderen?`)) return;
    TCDCars.saveCars(TCDCars.getCars().filter((item) => item.id !== id));
    renderCars();
    updateStats();
    TCD.toast("Auto verwijderd.", "success");
  }

  function statusSelectHTML(kind, id, status) {
    return `<select class="form-select form-select-sm" data-${kind}-status="${TCD.escapeHTML(id)}" aria-label="Status wijzigen">
      ${requestStatuses.map((option) => `<option value="${option}" ${option === status ? "selected" : ""}>${option}</option>`).join("")}
    </select>`;
  }

  function renderOffers() {
    const body = document.querySelector("[data-backoffice-offers]");
    if (!body) return;
    const offers = TCD.storage.get("offers", []);
    body.innerHTML = offers.length ? offers.map((offer) => `
      <tr>
        <td><strong>${TCD.escapeHTML(offer.id)}</strong><small class="d-block text-muted">${TCD.formatDate(offer.createdAt)}</small></td>
        <td>${TCD.escapeHTML(offer.name)}<small class="d-block text-muted">${TCD.escapeHTML(offer.email)}</small></td>
        <td>${TCD.escapeHTML(offer.carLabel)}<small class="d-block text-muted">${TCD.formatMoney(offer.carPrice)}</small></td>
        <td>${offer.tradeIn ? "Ja" : "Nee"}</td>
        <td>${offer.financing ? "Ja" : "Nee"}</td>
        <td>${statusSelectHTML("offer", offer.id, offer.status)}</td>
      </tr>`).join("") : '<tr><td colspan="6"><div class="empty-state m-3">Nog geen offerteaanvragen.</div></td></tr>';
  }

  function renderServices() {
    const body = document.querySelector("[data-backoffice-services]");
    if (!body) return;
    const requests = TCD.storage.get("service_requests", []);
    body.innerHTML = requests.length ? requests.map((request) => `
      <tr>
        <td><strong>${TCD.escapeHTML(request.id)}</strong><small class="d-block text-muted">${TCD.formatDate(request.createdAt)}</small></td>
        <td>${TCD.escapeHTML(request.serviceLabel)}</td>
        <td>${TCD.escapeHTML(request.name)}<small class="d-block text-muted">${TCD.escapeHTML(request.email)}</small></td>
        <td>${TCD.escapeHTML(request.summary)}</td>
        <td>${statusSelectHTML("service", request.id, request.status)}</td>
      </tr>`).join("") : '<tr><td colspan="5"><div class="empty-state m-3">Nog geen dienstaanvragen.</div></td></tr>';
  }

  function updateRequestStatus(kind, id, value) {
    const key = kind === "offer" ? "offers" : "service_requests";
    const records = TCD.storage.get(key, []);
    const record = records.find((item) => item.id === id);
    if (!record) return;
    record.status = value;
    record.updatedAt = new Date().toISOString();
    TCD.storage.set(key, records);
    TCD.toast("Status bijgewerkt.", "success");
  }

  function renderUsers() {
    const body = document.querySelector("[data-backoffice-users]");
    if (!body) return;
    body.innerHTML = TCDAuth.getUsers().map((user) => `
      <tr>
        <td><strong>${TCD.escapeHTML(user.name)}</strong><small class="d-block text-muted">@${TCD.escapeHTML(user.username)}</small></td>
        <td>${TCD.escapeHTML(user.email)}<small class="d-block text-muted">${TCD.escapeHTML(user.phone || "-")}</small></td>
        <td><span class="role-badge">${TCD.escapeHTML(user.role)}</span></td>
        <td><span class="status-pill">${TCD.escapeHTML(user.status)}</span></td>
        <td>${TCD.formatDate(user.createdAt)}</td>
        <td class="text-nowrap">
          <button class="btn btn-sm btn-outline-primary" type="button" data-edit-user="${TCD.escapeHTML(user.id)}">Bewerken</button>
          ${user.id !== "user-admin" ? `<button class="btn btn-sm btn-outline-danger" type="button" data-delete-user="${TCD.escapeHTML(user.id)}">Verwijderen</button>` : ""}
        </td>
      </tr>`).join("");
  }

  function openUserEditor(user) {
    if (!TCDAuth.can("manage_users")) return;
    const form = document.querySelector("[data-user-editor]");
    const modal = document.getElementById("userEditorModal");
    if (!form || !modal) return;
    form.reset();
    form.classList.remove("was-validated");
    const values = user || { id: "", name: "", username: "", email: "", phone: "", password: "", role: "Manager", status: "Actief" };
    Object.entries(values).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value;
    });
    modal.querySelector("[data-user-editor-title]").textContent = user ? "Gebruiker bewerken" : "Gebruiker aanmaken";
    bootstrap.Modal.getOrCreateInstance(modal).show();
  }

  function saveUserFromForm(form) {
    if (!TCDAuth.can("manage_users")) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const users = TCDAuth.getUsers();
    const index = users.findIndex((user) => user.id === data.id);
    const duplicate = users.some((user, candidateIndex) =>
      candidateIndex !== index &&
      (user.email.toLowerCase() === data.email.toLowerCase() || user.username.toLowerCase() === data.username.toLowerCase())
    );
    if (duplicate) {
      TCD.toast("E-mailadres of gebruikersnaam bestaat al.", "danger");
      return;
    }
    const existing = index >= 0 ? users[index] : null;
    const record = {
      id: existing?.id || TCD.uid("USER"),
      name: data.name,
      username: data.username,
      email: data.email,
      phone: data.phone,
      password: data.password || existing?.password || "welcome123",
      role: data.role,
      status: data.status,
      createdAt: existing?.createdAt || new Date().toISOString()
    };
    if (index >= 0) users[index] = record;
    else users.push(record);
    TCDAuth.saveUsers(users);
    bootstrap.Modal.getInstance(document.getElementById("userEditorModal"))?.hide();
    renderUsers();
    updateStats();
    TCD.toast(existing ? "Gebruiker bijgewerkt." : "Gebruiker aangemaakt en kan nu inloggen.", "success");
  }

  function deleteUser(id) {
    if (!TCDAuth.can("manage_users") || id === "user-admin") return;
    const user = TCDAuth.getUsers().find((item) => item.id === id);
    if (!user || !confirm(`Wilt u gebruiker ${user.username} verwijderen?`)) return;
    TCDAuth.saveUsers(TCDAuth.getUsers().filter((item) => item.id !== id));
    renderUsers();
    updateStats();
    TCD.toast("Gebruiker verwijderd.", "success");
  }

  async function handleCarImageChange(input) {
    const form = input.closest("[data-car-editor]");
    const file = input.files?.[0];
    if (!form || !file) return;
    imageProcessing = true;
    input.setCustomValidity("");
    updateImagePreview(form, "", "Foto wordt geoptimaliseerd…", "info");
    try {
      const optimized = await optimizeCarImage(file);
      form.querySelector('input[name="image"]').value = optimized;
      updateImagePreview(form, optimized, "Foto gereed en geoptimaliseerd voor snelle weergave.", "success");
    } catch (error) {
      form.querySelector('input[name="image"]').value = "";
      input.value = "";
      input.setCustomValidity(error.message);
      updateImagePreview(form, "", error.message, "danger");
      input.reportValidity();
    } finally {
      imageProcessing = false;
    }
  }

  function bindEvents() {
    document.querySelector("[data-add-car]")?.addEventListener("click", () => openCarEditor(null));
    document.querySelector("[data-car-editor]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      form.classList.add("was-validated");
      if (form.checkValidity()) saveCarFromForm(form);
    });
    document.querySelector("[data-add-user]")?.addEventListener("click", () => openUserEditor(null));
    document.querySelector("[data-user-editor]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      form.classList.add("was-validated");
      if (form.checkValidity()) saveUserFromForm(form);
    });

    document.addEventListener("click", (event) => {
      const editCar = event.target.closest("[data-edit-car]");
      const deleteCarButton = event.target.closest("[data-delete-car]");
      const editUser = event.target.closest("[data-edit-user]");
      const deleteUserButton = event.target.closest("[data-delete-user]");
      if (editCar) openCarEditor(TCDCars.getCar(editCar.dataset.editCar));
      if (deleteCarButton) deleteCar(deleteCarButton.dataset.deleteCar);
      if (editUser) openUserEditor(TCDAuth.getUsers().find((user) => user.id === editUser.dataset.editUser));
      if (deleteUserButton) deleteUser(deleteUserButton.dataset.deleteUser);
    });

    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-car-image-input]")) {
        handleCarImageChange(event.target);
      }
      if (event.target.matches("[data-offer-status]")) {
        updateRequestStatus("offer", event.target.dataset.offerStatus, event.target.value);
      }
      if (event.target.matches("[data-service-status]")) {
        updateRequestStatus("service", event.target.dataset.serviceStatus, event.target.value);
      }
    });
  }

  function init() {
    const user = requireBackofficeAccess();
    if (!user) return;
    updateStats();
    renderCars();
    renderOffers();
    renderServices();
    renderUsers();
    bindEvents();
  }

  document.addEventListener("DOMContentLoaded", init);
}());
