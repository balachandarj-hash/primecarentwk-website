(function () {
  const toggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  const backdrop = document.querySelector(".nav-backdrop");
  const closeBtn = document.querySelector(".mobile-nav__close");

  function setOpen(open) {
    if (!mobileNav || !toggle) return;
    mobileNav.classList.toggle("is-open", open);
    if (backdrop) {
      backdrop.classList.toggle("is-open", open);
      backdrop.setAttribute("aria-hidden", open ? "false" : "true");
    }
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      setOpen(!mobileNav.classList.contains("is-open"));
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      setOpen(false);
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", function () {
      setOpen(false);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setOpen(false);
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }
})();
