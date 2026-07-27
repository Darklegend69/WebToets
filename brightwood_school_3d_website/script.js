const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const scene = document.querySelector("#schoolScene");
const model = document.querySelector(".school-model");
const glow = document.querySelector(".cursor-glow");
const tourModal = document.querySelector("#tourModal");
const tourButton = document.querySelector("#tourButton");
const contactForm = document.querySelector("#contactForm");
const formStatus = document.querySelector("#formStatus");

document.querySelector("#year").textContent = new Date().getFullYear();

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.classList.toggle("active", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

window.addEventListener("pointermove", (event) => {
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

if (scene && model && matchMedia("(pointer: fine)").matches) {
  scene.addEventListener("pointermove", (event) => {
    const rect = scene.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    model.style.transform =
      `rotateX(${57 - y * 8}deg) rotateZ(${-35 + x * 7}deg) rotateY(${x * 5}deg)`;
  });

  scene.addEventListener("pointerleave", () => {
    model.style.transform = "rotateX(57deg) rotateZ(-35deg) rotateY(0deg)";
  });
}

document.querySelectorAll(".tilt-card").forEach((card) => {
  if (!matchMedia("(pointer: fine)").matches) return;

  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform =
      `perspective(900px) rotateX(${-y * 7}deg) rotateY(${x * 8}deg) translateY(-5px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
  revealObserver.observe(element);
});

const counters = document.querySelectorAll("[data-count]");
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const element = entry.target;
      const target = Number(element.dataset.count);
      const suffix = element.dataset.suffix || "";
      const duration = 1400;
      const startTime = performance.now();

      const updateCounter = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = `${Math.floor(target * eased).toLocaleString()}${suffix}`;

        if (progress < 1) requestAnimationFrame(updateCounter);
      };

      requestAnimationFrame(updateCounter);
      counterObserver.unobserve(element);
    });
  },
  { threshold: 0.6 }
);

counters.forEach((counter) => counterObserver.observe(counter));

const openTour = () => {
  tourModal.classList.add("open");
  tourModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
};

const closeTour = () => {
  tourModal.classList.remove("open");
  tourModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
};

tourButton.addEventListener("click", openTour);
document.querySelectorAll("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", closeTour);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && tourModal.classList.contains("open")) closeTour();
});

document.querySelector("#startTour").addEventListener("click", (event) => {
  const button = event.currentTarget;
  button.textContent = "Tour loading...";
  button.disabled = true;

  setTimeout(() => {
    button.textContent = "Welcome to Brightwood ✓";
    document.querySelector(".tour-info p").textContent =
      "You are viewing a front-end demo. Replace this panel with your own school video or 360° tour.";
  }, 850);
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;

  submitButton.disabled = true;
  submitButton.textContent = "Sending...";
  formStatus.textContent = "";

  setTimeout(() => {
    submitButton.innerHTML = originalText;
    submitButton.disabled = false;
    formStatus.textContent = "Thank you! Your inquiry has been received.";
    contactForm.reset();
  }, 900);
});
