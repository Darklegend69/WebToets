/* The Car Deal-oog - four service request workflows */
(function () {
  "use strict";

  const labels = {
    sell: "Auto verkopen",
    buy: "Auto inkopen",
    rent: "Auto huren",
    finance: "Financiering & Verzekering"
  };

  function summarize(type, data) {
    if (type === "sell") {
      return `${data.brand} ${data.model} (${data.year}), ${Number(data.mileage || 0).toLocaleString("nl-NL")} km`;
    }
    if (type === "buy") {
      return `Zoekopdracht: ${data.bodyType || "auto"}, budget tot ${data.budget || "niet opgegeven"}`;
    }
    if (type === "rent") {
      return `${data.carType} van ${data.startDate} t/m ${data.endDate}`;
    }
    return `${data.requestType}, aangevraagd bedrag ${data.requestedAmount || "niet opgegeven"}`;
  }

  function initServiceForms() {
    document.querySelectorAll("[data-service-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        form.classList.add("was-validated");
        if (!form.checkValidity()) return;

        const data = Object.fromEntries(new FormData(form).entries());
        const type = form.dataset.serviceForm;
        const requests = TCD.storage.get("service_requests", []);
        const record = {
          id: TCD.uid("SRV"),
          serviceType: type,
          serviceLabel: labels[type] || "Dienstaanvraag",
          name: data.name,
          email: data.email,
          phone: data.phone,
          summary: summarize(type, data),
          data,
          status: "Nieuw",
          createdAt: new Date().toISOString()
        };
        requests.unshift(record);
        TCD.storage.set("service_requests", requests);
        form.reset();
        form.classList.remove("was-validated");
        TCD.showSuccess({
          title: "Aanvraag succesvol verzonden!",
          message: `Uw aanvraag voor ${record.serviceLabel} is ontvangen onder referentie ${record.id}.`
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initServiceForms);
}());
