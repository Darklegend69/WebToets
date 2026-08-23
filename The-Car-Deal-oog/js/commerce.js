/*
  The Car Deal-oog
  Bestand 2 van 3: auto's, filters, offertes, diensten en backoffice.
*/
(function () {
  "use strict";

  var seedCars = [
    {
      id: "car-aurora-e7",
      brand: "Aether",
      model: "Aurora E7",
      year: 2024,
      price: 46900,
      mileage: 8200,
      fuel: "Elektrisch",
      transmission: "Automaat",
      engine: "Dual motor · 82 kWh",
      power: "420 pk",
      color: "Midnight Blue",
      description: "Een elegante elektrische sportsedan met directe acceleratie, premium comfort en een actieradius tot 540 kilometer.",
      availability: "Beschikbaar",
      image: "images/cars/car-aurora.png",
      featured: true
    },
    {
      id: "car-crest-lx",
      brand: "Vantage",
      model: "Crest LX",
      year: 2023,
      price: 53900,
      mileage: 14750,
      fuel: "Hybride",
      transmission: "Automaat",
      engine: "2.5L Turbo Hybrid",
      power: "310 pk",
      color: "Pearl White",
      description: "Een ruime luxe-SUV die hybride prestaties combineert met stilte, comfort en moderne veiligheidstechniek.",
      availability: "Beschikbaar",
      image: "images/cars/car-velar.png",
      featured: true
    },
    {
      id: "car-pulse-gt",
      brand: "Novara",
      model: "Pulse GT",
      year: 2022,
      price: 41900,
      mileage: 22600,
      fuel: "Benzine",
      transmission: "Automaat",
      engine: "3.0L V6 Twin Turbo",
      power: "380 pk",
      color: "Metallic Red",
      description: "Een sportieve coupé met uitgebalanceerde rijeigenschappen, een luxe interieur en dagelijks comfort.",
      availability: "Gereserveerd",
      image: "images/cars/car-nova.png",
      featured: true
    },
    {
      id: "car-forge-hx",
      brand: "Titan",
      model: "Forge HX",
      year: 2024,
      price: 58900,
      mileage: 5100,
      fuel: "Hybride",
      transmission: "Automaat",
      engine: "3.5L V6 Hybrid",
      power: "430 pk",
      color: "Graphite Gray",
      description: "Een premium pickup met vierwielaandrijving, slimme laadruimte en een comfortabele moderne cabine.",
      availability: "Beschikbaar",
      image: "images/cars/car-titan.png",
      featured: true
    }
  ];

  var serviceLabels = {
    sell: "Auto verkopen",
    buy: "Auto inkopen",
    rent: "Auto huren",
    finance: "Financiering & Verzekering"
  };

  var requestStatuses = ["Nieuw", "In behandeling", "Afgerond", "Afgewezen"];
  var imageProcessing = false;

  function getCars() {
    var cars = TCD.storage.get("cars", null);
    if (!Array.isArray(cars) || cars.length === 0) {
      cars = seedCars.slice();
      TCD.storage.set("cars", cars);
    }
    return cars;
  }

  function saveCars(cars) {
    return TCD.storage.set("cars", cars);
  }

  function getCar(id) {
    return getCars().find(function (car) {
      return car.id === id;
    });
  }

  function homeCard(car) {
    return (
      '<div class="col-sm-6 col-xl-3">' +
        '<article class="home-car-card tilt-card">' +
          '<img src="' + TCD.asset(car.image) + '" alt="' + TCD.escapeHTML(car.color + " " + car.brand + " " + car.model) + '">' +
          '<div class="home-car-card-content">' +
            '<small class="text-soft">' + car.year + " · " + TCD.escapeHTML(car.fuel) + '</small>' +
            '<h3 class="h5 mt-1">' + TCD.escapeHTML(car.brand + " " + car.model) + '</h3>' +
            '<p class="home-price">' + TCD.formatMoney(car.price) + '</p>' +
            '<a class="btn btn-brand w-100" href="templates/autos.html?id=' + encodeURIComponent(car.id) + '">Bekijk details</a>' +
          '</div>' +
        '</article>' +
      '</div>'
    );
  }

  function renderHomeCars() {
    var grid = document.querySelector("[data-home-car-grid]");
    if (!grid) return;
    var cars = getCars().filter(function (car) { return car.featured; }).slice(0, 4);
    grid.innerHTML = cars.map(homeCard).join("");
    document.dispatchEvent(new CustomEvent("tcd:content-rendered"));
  }

  function carCard(car) {
    return (
      '<div class="col-md-6 col-xl-4">' +
        '<article class="card cars-card">' +
          '<div class="card-image-place">' +
            '<img src="' + TCD.asset(car.image) + '" alt="' + TCD.escapeHTML(car.color + " " + car.brand + " " + car.model) + '">' +
            '<span class="availability">' + TCD.escapeHTML(car.availability) + '</span>' +
          '</div>' +
          '<div class="card-body">' +
            '<small class="text-soft">' + car.year + " · " + TCD.escapeHTML(car.fuel) + '</small>' +
            '<h2 class="card-title h5 mt-1">' + TCD.escapeHTML(car.brand + " " + car.model) + '</h2>' +
            '<p class="cars-price">' + TCD.formatMoney(car.price) + '</p>' +
            '<ul class="cars-info-list">' +
              '<li>' + Number(car.mileage).toLocaleString("nl-NL") + ' km</li>' +
              '<li>' + TCD.escapeHTML(car.transmission) + '</li>' +
              '<li>' + TCD.escapeHTML(car.power) + '</li>' +
            '</ul>' +
            '<button class="btn btn-brand mt-auto" type="button" data-show-car="' + TCD.escapeHTML(car.id) + '">Bekijk details</button>' +
          '</div>' +
        '</article>' +
      '</div>'
    );
  }

  function renderCarGrid(cars) {
    var grid = document.querySelector("[data-cars-grid]");
    var count = document.querySelector("[data-car-count]");
    if (!grid) return;

    if (!cars.length) {
      grid.innerHTML = '<div class="col-12"><div class="empty-message">Geen auto gevonden. Pas de filters aan.</div></div>';
    } else {
      grid.innerHTML = cars.map(carCard).join("");
    }
    if (count) count.textContent = cars.length + (cars.length === 1 ? " resultaat" : " resultaten");
  }

  function applyCarFilters() {
    var form = document.querySelector("[data-car-filter]");
    if (!form) return;
    var values = Object.fromEntries(new FormData(form).entries());
    var cars = getCars().slice();

    if (values.query) {
      var query = values.query.toLowerCase();
      cars = cars.filter(function (car) {
        return (car.brand + " " + car.model + " " + car.color).toLowerCase().indexOf(query) !== -1;
      });
    }
    if (values.fuel) cars = cars.filter(function (car) { return car.fuel === values.fuel; });
    if (values.availability) cars = cars.filter(function (car) { return car.availability === values.availability; });
    if (values.maxPrice) cars = cars.filter(function (car) { return Number(car.price) <= Number(values.maxPrice); });

    cars.sort(function (a, b) {
      if (values.sort === "price-asc") return a.price - b.price;
      if (values.sort === "price-desc") return b.price - a.price;
      if (values.sort === "mileage") return a.mileage - b.mileage;
      return b.year - a.year;
    });
    renderCarGrid(cars);
  }

  function initCarFilters() {
    var form = document.querySelector("[data-car-filter]");
    if (!form) return;

    var urlQuery = new URLSearchParams(window.location.search).get("q");
    if (urlQuery && form.elements.query) form.elements.query.value = urlQuery;

    form.addEventListener("input", applyCarFilters);
    form.addEventListener("change", applyCarFilters);
    form.querySelector("[data-reset-filter]").addEventListener("click", function () {
      form.reset();
      applyCarFilters();
    });
    applyCarFilters();
  }

  function detailHTML(car) {
    var specifications = [
      ["Merk", car.brand],
      ["Model", car.model],
      ["Bouwjaar", car.year],
      ["Prijs", TCD.formatMoney(car.price)],
      ["Kilometerstand", Number(car.mileage).toLocaleString("nl-NL") + " km"],
      ["Brandstof", car.fuel],
      ["Transmissie", car.transmission],
      ["Motor", car.engine],
      ["Vermogen", car.power],
      ["Kleur", car.color],
      ["Beschikbaarheid", car.availability]
    ];

    var rows = specifications.map(function (specification) {
      return "<tr><td>" + TCD.escapeHTML(specification[0]) + "</td><td><strong>" + TCD.escapeHTML(specification[1]) + "</strong></td></tr>";
    }).join("");

    return (
      '<div class="row g-4 align-items-start">' +
        '<div class="col-lg-7"><img class="cars-detail-image" src="' + TCD.asset(car.image) + '" alt="' + TCD.escapeHTML(car.brand + " " + car.model) + '"></div>' +
        '<div class="col-lg-5">' +
          '<h3>' + TCD.escapeHTML(car.brand + " " + car.model) + '</h3>' +
          '<p class="cars-price fs-3">' + TCD.formatMoney(car.price) + '</p>' +
          '<p>' + TCD.escapeHTML(car.description) + '</p>' +
          '<table class="table cars-spec-table"><tbody>' + rows + '</tbody></table>' +
          '<button class="btn btn-brand btn-lg w-100" type="button" data-open-offer="' + TCD.escapeHTML(car.id) + '">Offerte aanvragen</button>' +
        '</div>' +
      '</div>'
    );
  }

  function showCarDetails(carId) {
    var car = getCar(carId);
    var modalElement = document.getElementById("carDetailModal");
    var content = document.querySelector("[data-car-detail]");
    if (!car || !modalElement || !content) return;

    content.innerHTML = detailHTML(car);
    document.getElementById("carDetailTitle").textContent = car.brand + " " + car.model;
    bootstrap.Modal.getOrCreateInstance(modalElement).show();
    history.replaceState(null, "", "autos.html?id=" + encodeURIComponent(car.id));
  }

  function prefillOfferForm(car) {
    var form = document.querySelector("[data-offer-form]");
    var summary = document.querySelector("[data-offer-summary]");
    if (!form || !car) return;

    form.reset();
    form.classList.remove("was-validated");
    form.elements.carId.value = car.id;
    summary.textContent = "Gekozen auto: " + car.brand + " " + car.model + " · " + TCD.formatMoney(car.price);

    var user = TCDAuth.getCurrentUser();
    if (user) {
      form.elements.name.value = user.name || "";
      form.elements.email.value = user.email || "";
      form.elements.phone.value = user.phone || "";
    }
  }

  function openOffer(carId) {
    var car = getCar(carId);
    var detailModal = document.getElementById("carDetailModal");
    var offerModal = document.getElementById("offerModal");
    if (!car || !offerModal) return;

    prefillOfferForm(car);
    var detailInstance = detailModal ? bootstrap.Modal.getInstance(detailModal) : null;
    if (detailInstance) detailInstance.hide();
    window.setTimeout(function () {
      bootstrap.Modal.getOrCreateInstance(offerModal).show();
    }, 180);
  }

  function initOfferForm() {
    var form = document.querySelector("[data-offer-form]");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) return;

      var values = Object.fromEntries(new FormData(form).entries());
      var car = getCar(values.carId);
      if (!car) {
        TCD.toast("De gekozen auto bestaat niet meer.", "danger");
        return;
      }

      var offers = TCD.storage.get("offers", []);
      var record = {
        id: TCD.uniqueId("OFF"),
        carId: car.id,
        carLabel: car.brand + " " + car.model,
        carPrice: car.price,
        name: values.name,
        email: values.email,
        phone: values.phone,
        preferredContact: values.preferredContact,
        tradeIn: values.tradeIn === "on",
        financing: values.financing === "on",
        message: values.message || "",
        status: "Nieuw",
        createdAt: new Date().toISOString()
      };
      offers.unshift(record);
      TCD.storage.set("offers", offers);
      form.reset();
      form.classList.remove("was-validated");

      var modalElement = document.getElementById("offerModal");
      bootstrap.Modal.getInstance(modalElement).hide();
      window.setTimeout(function () {
        TCD.showSuccess({
          title: "Offerteaanvraag succesvol verzonden!",
          message: "Uw aanvraag voor de " + record.carLabel + " is opgeslagen. Referentie: " + record.id + ".",
          redirect: TCD.asset("Index.html")
        });
      }, 220);
    });
  }

  function summarizeService(type, values) {
    if (type === "sell") {
      return values.brand + " " + values.model + " (" + values.year + "), " + Number(values.mileage || 0).toLocaleString("nl-NL") + " km";
    }
    if (type === "buy") {
      return "Zoekt " + (values.bodyType || "auto") + " tot USD " + (values.budget || "-");
    }
    if (type === "rent") {
      return values.carType + " van " + values.startDate + " tot " + values.endDate;
    }
    return values.requestType + " voor USD " + (values.requestedAmount || "-");
  }

  function initServiceForms() {
    document.querySelectorAll("[data-service-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        form.classList.add("was-validated");
        if (!form.checkValidity()) return;

        var values = Object.fromEntries(new FormData(form).entries());
        var type = form.getAttribute("data-service-form");

        if (type === "rent" && new Date(values.endDate) < new Date(values.startDate)) {
          TCD.toast("De einddatum moet na de startdatum liggen.", "danger");
          return;
        }

        var requests = TCD.storage.get("service_requests", []);
        var record = {
          id: TCD.uniqueId("SRV"),
          serviceType: type,
          serviceLabel: serviceLabels[type],
          name: values.name,
          email: values.email,
          phone: values.phone,
          summary: summarizeService(type, values),
          data: values,
          status: "Nieuw",
          createdAt: new Date().toISOString()
        };
        requests.unshift(record);
        TCD.storage.set("service_requests", requests);
        form.reset();
        form.classList.remove("was-validated");

        TCD.showSuccess({
          title: "Aanvraag succesvol verzonden!",
          message: "Uw aanvraag voor " + record.serviceLabel + " is opgeslagen. Referentie: " + record.id + "."
        });
      });
    });
  }

  function openServiceFromHash() {
    if (!document.getElementById("serviceAccordion")) return;
    var serviceId = window.location.hash.replace("#", "");
    var serviceItem = document.getElementById(serviceId);
    if (!serviceItem) return;
    var collapseElement = serviceItem.querySelector(".accordion-collapse");
    if (collapseElement) bootstrap.Collapse.getOrCreateInstance(collapseElement, { toggle: false }).show();
    window.setTimeout(function () {
      serviceItem.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
  }

  function statusSelect(kind, id, currentStatus) {
    var options = requestStatuses.map(function (status) {
      return '<option value="' + status + '"' + (status === currentStatus ? " selected" : "") + ">" + status + "</option>";
    }).join("");
    return '<select class="form-select form-select-sm" data-' + kind + '-status="' + TCD.escapeHTML(id) + '">' + options + "</select>";
  }

  function updateDashboardStats() {
    var values = {
      cars: getCars().length,
      offers: TCD.storage.get("offers", []).length,
      services: TCD.storage.get("service_requests", []).length,
      users: TCDAuth.getUsers().length
    };

    Object.keys(values).forEach(function (key) {
      document.querySelectorAll("[data-stat-" + key + "]").forEach(function (element) {
        element.textContent = values[key];
      });
    });
  }

  function renderBackofficeCars() {
    var tableBody = document.querySelector("[data-backoffice-cars]");
    if (!tableBody) return;
    var user = TCDAuth.getCurrentUser();

    tableBody.innerHTML = getCars().map(function (car) {
      return (
        "<tr>" +
          '<td><img class="car-table-photo" src="' + TCD.asset(car.image) + '" alt="' + TCD.escapeHTML(car.brand + " " + car.model) + '"></td>' +
          "<td><strong>" + TCD.escapeHTML(car.brand + " " + car.model) + "</strong><small class=\"d-block text-soft\">" + TCD.escapeHTML(car.id) + "</small></td>" +
          "<td>" + car.year + "</td>" +
          "<td>" + TCD.formatMoney(car.price) + "</td>" +
          "<td>" + Number(car.mileage).toLocaleString("nl-NL") + "</td>" +
          '<td><span class="status-badge">' + TCD.escapeHTML(car.availability) + "</span></td>" +
          '<td class="text-nowrap"><button class="btn btn-sm btn-outline-brand" type="button" data-edit-car="' + TCD.escapeHTML(car.id) + '">Bewerken</button> ' +
            (user && user.role === "Admin" ? '<button class="btn btn-sm btn-outline-danger" type="button" data-delete-car="' + TCD.escapeHTML(car.id) + '">Verwijderen</button>' : "") +
          "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderBackofficeOffers() {
    var tableBody = document.querySelector("[data-backoffice-offers]");
    if (!tableBody) return;
    var offers = TCD.storage.get("offers", []);

    tableBody.innerHTML = offers.length ? offers.map(function (offer) {
      return (
        "<tr>" +
          "<td><strong>" + TCD.escapeHTML(offer.id) + "</strong><small class=\"d-block text-soft\">" + TCD.formatDate(offer.createdAt) + "</small></td>" +
          "<td>" + TCD.escapeHTML(offer.name) + "<small class=\"d-block text-soft\">" + TCD.escapeHTML(offer.email) + "</small></td>" +
          "<td>" + TCD.escapeHTML(offer.carLabel) + "<small class=\"d-block text-soft\">" + TCD.formatMoney(offer.carPrice) + "</small></td>" +
          "<td>" + (offer.tradeIn ? "Ja" : "Nee") + "</td>" +
          "<td>" + (offer.financing ? "Ja" : "Nee") + "</td>" +
          "<td>" + statusSelect("offer", offer.id, offer.status) + "</td>" +
        "</tr>"
      );
    }).join("") : '<tr><td colspan="6">Nog geen offerteaanvragen.</td></tr>';
  }

  function renderBackofficeServices() {
    var tableBody = document.querySelector("[data-backoffice-services]");
    if (!tableBody) return;
    var requests = TCD.storage.get("service_requests", []);

    tableBody.innerHTML = requests.length ? requests.map(function (request) {
      return (
        "<tr>" +
          "<td><strong>" + TCD.escapeHTML(request.id) + "</strong><small class=\"d-block text-soft\">" + TCD.formatDate(request.createdAt) + "</small></td>" +
          "<td>" + TCD.escapeHTML(request.serviceLabel) + "</td>" +
          "<td>" + TCD.escapeHTML(request.name) + "<small class=\"d-block text-soft\">" + TCD.escapeHTML(request.email) + "</small></td>" +
          "<td>" + TCD.escapeHTML(request.summary) + "</td>" +
          "<td>" + statusSelect("service", request.id, request.status) + "</td>" +
        "</tr>"
      );
    }).join("") : '<tr><td colspan="5">Nog geen dienstaanvragen.</td></tr>';
  }

  function renderBackofficeUsers() {
    var tableBody = document.querySelector("[data-backoffice-users]");
    if (!tableBody) return;

    tableBody.innerHTML = TCDAuth.getUsers().map(function (user) {
      return (
        "<tr>" +
          "<td><strong>" + TCD.escapeHTML(user.name) + "</strong><small class=\"d-block text-soft\">@" + TCD.escapeHTML(user.username) + "</small></td>" +
          "<td>" + TCD.escapeHTML(user.email) + "<small class=\"d-block text-soft\">" + TCD.escapeHTML(user.phone || "-") + "</small></td>" +
          '<td><span class="role-badge">' + TCD.escapeHTML(user.role) + "</span></td>" +
          '<td><span class="status-badge">' + TCD.escapeHTML(user.status) + "</span></td>" +
          "<td>" + TCD.formatDate(user.createdAt) + "</td>" +
          '<td><button class="btn btn-sm btn-outline-brand" type="button" data-edit-user="' + TCD.escapeHTML(user.id) + '">Bewerken</button> ' +
            (user.id !== "user-admin" ? '<button class="btn btn-sm btn-outline-danger" type="button" data-delete-user="' + TCD.escapeHTML(user.id) + '">Verwijderen</button>' : "") +
          "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderBackoffice() {
    if (!document.querySelector("[data-backoffice-protected]")) return;
    if (!TCDAuth.prepareBackoffice()) return;
    updateDashboardStats();
    renderBackofficeCars();
    renderBackofficeOffers();
    renderBackofficeServices();
    renderBackofficeUsers();
  }

  function updateImagePreview(form, source, message, color) {
    var preview = form.querySelector("[data-car-image-preview]");
    var status = form.querySelector("[data-car-image-status]");
    if (preview) preview.src = source ? TCD.asset(source) : "";
    if (status) {
      status.className = "small mt-2 text-" + (color || "muted");
      status.textContent = message;
    }
  }

  function loadImage(source) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () { resolve(image); };
      image.onerror = function () { reject(new Error("De browser kan dit beeldformaat niet openen.")); };
      image.src = source;
    });
  }

  async function optimizeCarImage(file) {
    if (!file || (file.type && file.type.indexOf("image/") !== 0)) throw new Error("Kies een geldig afbeeldingsbestand.");
    if (file.size > 15 * 1024 * 1024) throw new Error("De bronfoto mag maximaal 15 MB zijn.");

    var source = URL.createObjectURL(file);
    var image;
    try {
      image = await loadImage(source);
    } finally {
      URL.revokeObjectURL(source);
    }

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var attempts = [
      { width: 1400, quality: 0.8 },
      { width: 1100, quality: 0.72 },
      { width: 850, quality: 0.64 }
    ];
    var result = "";

    for (var index = 0; index < attempts.length; index += 1) {
      var scale = Math.min(1, attempts[index].width / image.naturalWidth);
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      result = canvas.toDataURL("image/webp", attempts[index].quality);
      if (result.length < 720000) break;
    }

    if (!result || result.length >= 720000) throw new Error("De foto blijft te groot. Kies een kleinere afbeelding.");
    return result;
  }

  function openCarEditor(car) {
    if (!TCDAuth.can("edit_cars")) return;
    var form = document.querySelector("[data-car-editor]");
    var modalElement = document.getElementById("carEditorModal");
    if (!form || !modalElement) return;

    form.reset();
    form.classList.remove("was-validated");
    var values = car || {
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

    Object.keys(values).forEach(function (key) {
      var field = form.elements.namedItem(key);
      if (!field) return;
      if (field.type === "checkbox") field.checked = Boolean(values[key]);
      else field.value = values[key];
    });

    var fileInput = form.querySelector("[data-car-image-input]");
    fileInput.value = "";
    fileInput.setCustomValidity("");
    updateImagePreview(form, values.image, values.image ? "Huidige foto. Kies een bestand om te vervangen." : "Kies zelf een autofoto.", values.image ? "success" : "muted");
    modalElement.querySelector("[data-car-editor-title]").textContent = car ? "Auto bewerken" : "Auto toevoegen";
    bootstrap.Modal.getOrCreateInstance(modalElement).show();
  }

  function saveCarForm(form) {
    if (imageProcessing) {
      TCD.toast("Wacht tot de foto klaar is.", "warning");
      return;
    }

    var values = Object.fromEntries(new FormData(form).entries());
    var cars = getCars();
    var index = cars.findIndex(function (car) { return car.id === values.id; });
    var isNew = index === -1;

    if (isNew && !TCDAuth.can("add_cars")) {
      TCD.toast("Alleen Admin mag een auto toevoegen.", "danger");
      return;
    }
    if (!values.image) {
      var fileInput = form.querySelector("[data-car-image-input]");
      fileInput.setCustomValidity("Kies zelf een autofoto.");
      fileInput.reportValidity();
      return;
    }

    var record = {
      id: values.id || TCD.uniqueId("CAR").toLowerCase(),
      brand: values.brand,
      model: values.model,
      year: Number(values.year),
      price: Number(values.price),
      mileage: Number(values.mileage),
      fuel: values.fuel,
      transmission: values.transmission,
      engine: values.engine,
      power: values.power,
      color: values.color,
      description: values.description,
      availability: values.availability,
      image: values.image,
      featured: values.featured === "on"
    };

    if (isNew) cars.unshift(record);
    else cars[index] = record;
    if (!saveCars(cars)) {
      TCD.toast("De foto past niet in de browseropslag. Kies een kleinere foto.", "danger");
      return;
    }

    bootstrap.Modal.getInstance(document.getElementById("carEditorModal")).hide();
    renderBackoffice();
    renderHomeCars();
    TCD.toast(isNew ? "Auto toegevoegd." : "Auto bijgewerkt.", "success");
  }

  function deleteCar(carId) {
    if (!TCDAuth.can("delete_cars")) return;
    var car = getCar(carId);
    if (!car || !window.confirm("Wilt u " + car.brand + " " + car.model + " verwijderen?")) return;
    saveCars(getCars().filter(function (item) { return item.id !== carId; }));
    renderBackoffice();
    renderHomeCars();
    TCD.toast("Auto verwijderd.", "success");
  }

  function openUserEditor(user) {
    if (!TCDAuth.can("manage_users")) return;
    var form = document.querySelector("[data-user-editor]");
    var modalElement = document.getElementById("userEditorModal");
    if (!form || !modalElement) return;

    form.reset();
    form.classList.remove("was-validated");
    var values = user || { id: "", name: "", username: "", email: "", phone: "", password: "", role: "Manager", status: "Actief" };
    Object.keys(values).forEach(function (key) {
      if (form.elements[key]) form.elements[key].value = values[key];
    });
    modalElement.querySelector("[data-user-editor-title]").textContent = user ? "Gebruiker bewerken" : "Gebruiker toevoegen";
    bootstrap.Modal.getOrCreateInstance(modalElement).show();
  }

  function saveUserForm(form) {
    if (!TCDAuth.can("manage_users")) return;
    var values = Object.fromEntries(new FormData(form).entries());
    var users = TCDAuth.getUsers();
    var index = users.findIndex(function (user) { return user.id === values.id; });
    var duplicate = users.some(function (user, userIndex) {
      return userIndex !== index &&
        (user.email.toLowerCase() === values.email.toLowerCase() || user.username.toLowerCase() === values.username.toLowerCase());
    });
    if (duplicate) {
      TCD.toast("E-mail of gebruikersnaam bestaat al.", "danger");
      return;
    }

    var existing = index >= 0 ? users[index] : null;
    var record = {
      id: existing ? existing.id : TCD.uniqueId("USER"),
      name: values.name,
      username: values.username,
      email: values.email,
      phone: values.phone,
      password: values.password || (existing ? existing.password : "welcome123"),
      role: values.role,
      status: values.status,
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    };

    if (index >= 0) users[index] = record;
    else users.push(record);
    TCDAuth.saveUsers(users);
    bootstrap.Modal.getInstance(document.getElementById("userEditorModal")).hide();
    renderBackoffice();
    TCD.toast(existing ? "Gebruiker bijgewerkt." : "Gebruiker toegevoegd.", "success");
  }

  function deleteUser(userId) {
    if (!TCDAuth.can("manage_users") || userId === "user-admin") return;
    var user = TCDAuth.getUsers().find(function (item) { return item.id === userId; });
    if (!user || !window.confirm("Wilt u gebruiker " + user.username + " verwijderen?")) return;
    TCDAuth.saveUsers(TCDAuth.getUsers().filter(function (item) { return item.id !== userId; }));
    renderBackoffice();
    TCD.toast("Gebruiker verwijderd.", "success");
  }

  function updateRequestStatus(type, id, value) {
    var key = type === "offer" ? "offers" : "service_requests";
    var records = TCD.storage.get(key, []);
    var record = records.find(function (item) { return item.id === id; });
    if (!record) return;
    record.status = value;
    record.updatedAt = new Date().toISOString();
    TCD.storage.set(key, records);
    TCD.toast("Status bijgewerkt.", "success");
  }

  async function handleImageFile(input) {
    var form = input.closest("[data-car-editor]");
    var file = input.files && input.files[0];
    if (!form || !file) return;
    imageProcessing = true;
    input.setCustomValidity("");
    updateImagePreview(form, "", "Foto wordt kleiner gemaakt...", "info");

    try {
      var optimized = await optimizeCarImage(file);
      form.elements.image.value = optimized;
      updateImagePreview(form, optimized, "Foto is gereed voor de website.", "success");
    } catch (error) {
      form.elements.image.value = "";
      input.value = "";
      input.setCustomValidity(error.message);
      updateImagePreview(form, "", error.message, "danger");
      input.reportValidity();
    } finally {
      imageProcessing = false;
    }
  }

  function bindCommerceEvents() {
    if (document.body.getAttribute("data-commerce-events") === "ready") return;
    document.body.setAttribute("data-commerce-events", "ready");

    document.addEventListener("click", function (event) {
      var detailsButton = event.target.closest("[data-show-car]");
      var offerButton = event.target.closest("[data-open-offer]");
      var editCarButton = event.target.closest("[data-edit-car]");
      var deleteCarButton = event.target.closest("[data-delete-car]");
      var editUserButton = event.target.closest("[data-edit-user]");
      var deleteUserButton = event.target.closest("[data-delete-user]");

      if (detailsButton) showCarDetails(detailsButton.getAttribute("data-show-car"));
      if (offerButton) openOffer(offerButton.getAttribute("data-open-offer"));
      if (editCarButton) openCarEditor(getCar(editCarButton.getAttribute("data-edit-car")));
      if (deleteCarButton) deleteCar(deleteCarButton.getAttribute("data-delete-car"));
      if (editUserButton) {
        var user = TCDAuth.getUsers().find(function (item) { return item.id === editUserButton.getAttribute("data-edit-user"); });
        openUserEditor(user);
      }
      if (deleteUserButton) deleteUser(deleteUserButton.getAttribute("data-delete-user"));
    });

    document.addEventListener("change", function (event) {
      if (event.target.matches("[data-car-image-input]")) handleImageFile(event.target);
      if (event.target.matches("[data-offer-status]")) updateRequestStatus("offer", event.target.getAttribute("data-offer-status"), event.target.value);
      if (event.target.matches("[data-service-status]")) updateRequestStatus("service", event.target.getAttribute("data-service-status"), event.target.value);
    });

    var addCarButton = document.querySelector("[data-add-car]");
    if (addCarButton) addCarButton.addEventListener("click", function () { openCarEditor(null); });
    var addUserButton = document.querySelector("[data-add-user]");
    if (addUserButton) addUserButton.addEventListener("click", function () { openUserEditor(null); });

    var carForm = document.querySelector("[data-car-editor]");
    if (carForm) {
      carForm.addEventListener("submit", function (event) {
        event.preventDefault();
        carForm.classList.add("was-validated");
        if (carForm.checkValidity()) saveCarForm(carForm);
      });
    }

    var userForm = document.querySelector("[data-user-editor]");
    if (userForm) {
      userForm.addEventListener("submit", function (event) {
        event.preventDefault();
        userForm.classList.add("was-validated");
        if (userForm.checkValidity()) saveUserForm(userForm);
      });
    }
  }

  function openCarFromUrl() {
    if (!document.getElementById("carDetailModal")) return;
    var carId = new URLSearchParams(window.location.search).get("id");
    if (carId && getCar(carId)) {
      window.setTimeout(function () { showCarDetails(carId); }, 120);
    }
  }

  window.TCDCommerce = {
    seedCars: seedCars,
    getCars: getCars,
    getCar: getCar,
    saveCars: saveCars,
    renderBackoffice: renderBackoffice
  };

  document.addEventListener("tcd:backoffice-open", renderBackoffice);
  window.addEventListener("hashchange", openServiceFromHash);

  document.addEventListener("DOMContentLoaded", function () {
    getCars();
    renderHomeCars();
    initCarFilters();
    initOfferForm();
    initServiceForms();
    openServiceFromHash();
    bindCommerceEvents();
    openCarFromUrl();
  });
}());
