/* The Car Deal-oog - vehicle data, cards, filters and details */
(function () {
  "use strict";

  const seedCars = [
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
      description: "Een elegante elektrische sportsedan met directe acceleratie, premium comfort en een actieradius tot 540 kilometer. Inclusief adaptieve cruise control, 360°-camera en verwarmde sportstoelen.",
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
      description: "Een ruime luxe-SUV die krachtige hybride prestaties combineert met stilte en comfort. Voorzien van panoramadak, zeven rijmodi, adaptieve LED-verlichting en een hoogwaardige audio-installatie.",
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
      description: "Een karaktervolle coupé met uitgebalanceerde rijeigenschappen, sportuitlaat en luxueus interieur. De Pulse GT biedt prestaties voor de liefhebber zonder dagelijks comfort op te offeren.",
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
      description: "Een robuuste premium pickup voor werk en avontuur. Met vierwielaandrijving, trekpakket, offroad-modus, slimme laadruimte en een comfortabele cabine met moderne veiligheidstechniek.",
      availability: "Beschikbaar",
      image: "images/cars/car-titan.png",
      featured: true
    }
  ];

  function ensureCars() {
    const current = TCD.storage.get("cars", null);
    if (!Array.isArray(current) || current.length === 0) {
      TCD.storage.set("cars", seedCars);
      return [...seedCars];
    }
    return current;
  }

  function getCars() {
    return ensureCars();
  }

  function saveCars(cars) {
    return TCD.storage.set("cars", cars);
  }

  function getCar(id) {
    return getCars().find((car) => car.id === id);
  }

  function statusClass(status) {
    const normalized = String(status).toLowerCase();
    if (normalized.includes("gereserveerd")) return "reserved";
    if (normalized.includes("verkocht") || normalized.includes("niet")) return "sold";
    return "";
  }

  function cardHTML(car) {
    const detailsUrl = TCD.asset(`templates/car-details.html?id=${encodeURIComponent(car.id)}`);
    return `
      <div class="col-sm-6 col-xl-4 col-xxl-3 reveal">
        <article class="car-card">
          <div class="car-image-wrap">
            <a href="${detailsUrl}" aria-label="Bekijk ${TCD.escapeHTML(car.brand)} ${TCD.escapeHTML(car.model)}">
              <img class="car-image" src="${TCD.asset(car.image)}" alt="${TCD.escapeHTML(car.color)} ${TCD.escapeHTML(car.brand)} ${TCD.escapeHTML(car.model)} in de showroom">
            </a>
            <span class="availability-badge ${statusClass(car.availability)}">${TCD.escapeHTML(car.availability)}</span>
          </div>
          <div class="car-card-body">
            <div class="car-kicker">${car.year} · ${TCD.escapeHTML(car.fuel)}</div>
            <h2 class="car-title h5">${TCD.escapeHTML(car.brand)} ${TCD.escapeHTML(car.model)}</h2>
            <div class="car-price">${TCD.formatMoney(car.price)}</div>
            <div class="car-meta">
              <span>↗ ${Number(car.mileage).toLocaleString("nl-NL")} km</span>
              <span>⚙ ${TCD.escapeHTML(car.transmission)}</span>
              <span>◈ ${TCD.escapeHTML(car.power)}</span>
              <span>● ${TCD.escapeHTML(car.color)}</span>
            </div>
            <a class="btn btn-tcd w-100" href="${detailsUrl}">Bekijk details</a>
          </div>
        </article>
      </div>`;
  }

  function renderGrid(container, cars) {
    if (!container) return;
    if (!cars.length) {
      container.innerHTML = '<div class="col-12"><div class="empty-state"><h2 class="h5">Geen auto’s gevonden</h2><p class="mb-0">Pas de filters aan om meer resultaten te zien.</p></div></div>';
      return;
    }
    container.innerHTML = cars.map(cardHTML).join("");
    window.requestAnimationFrame(() => {
      container.querySelectorAll(".reveal").forEach((card, index) => {
        window.setTimeout(() => card.classList.add("is-visible"), index * 70);
      });
    });
  }

  function initCarGrids() {
    document.querySelectorAll("[data-car-grid]").forEach((grid) => {
      const limit = Number(grid.dataset.limit || 0);
      const cars = getCars().filter((car) => !grid.dataset.featured || car.featured);
      renderGrid(grid, limit > 0 ? cars.slice(0, limit) : cars);
    });
  }

  function initFilters() {
    const form = document.querySelector("[data-car-filters]");
    const grid = document.querySelector("[data-car-catalog]");
    const count = document.querySelector("[data-car-count]");
    if (!form || !grid) return;

    function applyFilters() {
      const values = Object.fromEntries(new FormData(form).entries());
      let cars = getCars();
      if (values.query) {
        const query = values.query.toLowerCase();
        cars = cars.filter((car) => [car.brand, car.model, car.color].join(" ").toLowerCase().includes(query));
      }
      if (values.fuel) cars = cars.filter((car) => car.fuel === values.fuel);
      if (values.availability) cars = cars.filter((car) => car.availability === values.availability);
      if (values.maxPrice) cars = cars.filter((car) => Number(car.price) <= Number(values.maxPrice));
      const sort = values.sort || "newest";
      cars = [...cars].sort((a, b) => {
        if (sort === "price-asc") return a.price - b.price;
        if (sort === "price-desc") return b.price - a.price;
        if (sort === "mileage") return a.mileage - b.mileage;
        return b.year - a.year;
      });
      renderGrid(grid, cars);
      if (count) count.textContent = `${cars.length} resultaat${cars.length === 1 ? "" : "en"}`;
    }

    form.addEventListener("input", applyFilters);
    form.addEventListener("change", applyFilters);
    form.querySelector("[data-reset-filters]")?.addEventListener("click", () => {
      form.reset();
      applyFilters();
    });
    applyFilters();
  }

  function detailHTML(car) {
    const offerUrl = TCD.asset(`templates/offer.html?id=${encodeURIComponent(car.id)}`);
    const specs = [
      ["Bouwjaar", car.year],
      ["Kilometerstand", `${Number(car.mileage).toLocaleString("nl-NL")} km`],
      ["Brandstof", car.fuel],
      ["Transmissie", car.transmission],
      ["Motor", car.engine],
      ["Vermogen", car.power],
      ["Kleur", car.color],
      ["Beschikbaarheid", car.availability]
    ];
    return `
      <div class="row g-4 align-items-start">
        <div class="col-lg-7">
          <img class="detail-image" src="${TCD.asset(car.image)}" alt="Volledige weergave van ${TCD.escapeHTML(car.brand)} ${TCD.escapeHTML(car.model)}">
        </div>
        <div class="col-lg-5">
          <div class="content-card">
            <div class="car-kicker">${car.year} · ${TCD.escapeHTML(car.fuel)}</div>
            <h2 class="display-6 fw-bold">${TCD.escapeHTML(car.brand)} ${TCD.escapeHTML(car.model)}</h2>
            <p class="car-price fs-2">${TCD.formatMoney(car.price)}</p>
            <p>${TCD.escapeHTML(car.description)}</p>
            <div class="spec-grid my-4">
              ${specs.map(([label, value]) => `<div class="spec-item"><small>${TCD.escapeHTML(label)}</small><strong>${TCD.escapeHTML(value)}</strong></div>`).join("")}
            </div>
            <a class="btn btn-tcd btn-lg w-100" href="${offerUrl}">Offerte aanvragen</a>
            <a class="btn btn-outline-secondary mt-2 w-100" href="${TCD.asset("templates/cars.html")}">Terug naar alle auto’s</a>
          </div>
        </div>
      </div>`;
  }

  function initDetails() {
    const container = document.querySelector("[data-car-details]");
    if (!container) return;
    const id = new URLSearchParams(window.location.search).get("id");
    const car = getCar(id) || getCars()[0];
    if (!car) {
      container.innerHTML = '<div class="empty-state">Deze auto is niet meer beschikbaar.</div>';
      return;
    }
    document.title = `${car.brand} ${car.model} | The Car Deal-oog`;
    container.innerHTML = detailHTML(car);
  }

  window.TCDCars = {
    seedCars,
    getCars,
    getCar,
    saveCars,
    cardHTML,
    statusClass
  };

  document.addEventListener("DOMContentLoaded", () => {
    ensureCars();
    initCarGrids();
    initFilters();
    initDetails();
  });
}());
