(function () {
  "use strict";

  const menuButton = document.querySelector(".mj-menu-toggle");
  const navigation = document.querySelector(".mj-nav");

  if (menuButton && navigation) {
    menuButton.addEventListener("click", function () {
      const isOpen = navigation.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
      );
    });
  }

  document.querySelectorAll(".mj-dropdown-toggle").forEach(function (button) {
    button.addEventListener("click", function (event) {
      if (window.matchMedia("(max-width: 900px)").matches) {
        event.preventDefault();
        const dropdown = button.closest(".mj-dropdown");
        if (!dropdown) return;

        const isOpen = dropdown.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(isOpen));
      }
    });
  });

  document.querySelectorAll(".mj-submenu > a").forEach(function (link) {
    link.addEventListener("click", function (event) {
      const submenu = link.parentElement;
      const nestedMenu = submenu.querySelector(":scope > .mj-submenu-menu");

      if (
        window.matchMedia("(max-width: 900px)").matches &&
        nestedMenu
      ) {
        event.preventDefault();
        submenu.classList.toggle("is-open");
      }
    });
  });

  // Homepage highlights carousel: keep decorative slide numbers clipped to the carousel.
  const carousel = document.getElementById("itHighlightsCarousel");
  if (carousel) {
    const slides = Array.from(carousel.querySelectorAll(".it-slide"));
    const dots = Array.from(document.querySelectorAll(".it-dot"));
    const previous = document.querySelector(".it-prev");
    const next = document.querySelector(".it-next");
    const pause = document.querySelector(".it-pause");
    let active = Math.max(0, slides.findIndex(slide => slide.classList.contains("is-active")));
    let paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer = null;

    function showSlide(index) {
      if (!slides.length) return;
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const selected = i === active;
        slide.classList.toggle("is-active", selected);
        slide.setAttribute("aria-hidden", String(!selected));
      });
      dots.forEach((dot, i) => {
        const selected = i === active;
        dot.classList.toggle("is-active", selected);
        dot.setAttribute("aria-pressed", String(selected));
      });
    }

    function stopTimer() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }
    function startTimer() {
      stopTimer();
      if (!paused && slides.length > 1) {
        timer = window.setInterval(() => showSlide(active + 1), 7000);
      }
    }

    dots.forEach((dot, i) => dot.addEventListener("click", () => {
      showSlide(i);
      startTimer();
    }));
    if (previous) previous.addEventListener("click", () => {
      showSlide(active - 1);
      startTimer();
    });
    if (next) next.addEventListener("click", () => {
      showSlide(active + 1);
      startTimer();
    });
    if (pause) pause.addEventListener("click", () => {
      paused = !paused;
      pause.setAttribute("aria-label", paused ? "Resume automatic highlights" : "Pause automatic highlights");
      pause.textContent = paused ? "▶" : "Ⅱ";
      if (paused) stopTimer(); else startTimer();
    });

    carousel.addEventListener("mouseenter", stopTimer);
    carousel.addEventListener("mouseleave", startTimer);
    carousel.addEventListener("focusin", stopTimer);
    carousel.addEventListener("focusout", startTimer);
    showSlide(active);
    startTimer();
  }
})();