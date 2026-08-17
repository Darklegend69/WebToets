/* The Car Deal-oog - quotation request workflow */
(function () {
  "use strict";

  function initOfferPage() {
    const form = document.querySelector("[data-offer-form]");
    const summary = document.querySelector("[data-offer-car]");
    if (!form || !summary || !window.TCDCars) return;

    const id = new URLSearchParams(window.location.search).get("id");
    const car = TCDCars.getCar(id) || TCDCars.getCars()[0];
    if (!car) {
      summary.innerHTML = '<div class="empty-state">De gekozen auto is niet meer beschikbaar.</div>';
      form.hidden = true;
      return;
    }

    form.elements.carId.value = car.id;
    summary.innerHTML = `
      <div class="car-card">
        <div class="car-image-wrap">
          <img class="car-image" src="${TCD.asset(car.image)}" alt="${TCD.escapeHTML(car.brand)} ${TCD.escapeHTML(car.model)}">
          <span class="availability-badge ${TCDCars.statusClass(car.availability)}">${TCD.escapeHTML(car.availability)}</span>
        </div>
        <div class="car-card-body">
          <div class="car-kicker">Geselecteerde auto</div>
          <h2 class="car-title">${TCD.escapeHTML(car.brand)} ${TCD.escapeHTML(car.model)}</h2>
          <div class="car-price">${TCD.formatMoney(car.price)}</div>
          <p class="text-muted mt-3 mb-0">${car.year} · ${Number(car.mileage).toLocaleString("nl-NL")} km · ${TCD.escapeHTML(car.fuel)}</p>
        </div>
      </div>`;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.classList.add("was-validated");
      if (!form.checkValidity()) return;

      const data = Object.fromEntries(new FormData(form).entries());
      const offers = TCD.storage.get("offers", []);
      const record = {
        id: TCD.uid("OFF"),
        carId: car.id,
        carLabel: `${car.brand} ${car.model}`,
        carPrice: car.price,
        name: data.name,
        email: data.email,
        phone: data.phone,
        preferredContact: data.preferredContact,
        tradeIn: data.tradeIn === "on",
        financing: data.financing === "on",
        message: data.message || "",
        status: "Nieuw",
        createdAt: new Date().toISOString()
      };
      offers.unshift(record);
      TCD.storage.set("offers", offers);
      form.reset();
      form.classList.remove("was-validated");
      TCD.showSuccess({
        title: "Offerteaanvraag succesvol verzonden!",
        message: `Bedankt. Uw aanvraag voor de ${record.carLabel} is ontvangen onder referentie ${record.id}.`,
        redirect: TCD.asset("Index.html")
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initOfferPage);
}());
