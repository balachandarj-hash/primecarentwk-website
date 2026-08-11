(function () {
  function siteBase() {
    if (window.PRIMCARE_BASE) {
      return String(window.PRIMCARE_BASE).replace(/\/?$/, "/");
    }
    var parts = location.pathname.split("/").filter(Boolean);
    if (parts.length && /\.html?$/i.test(parts[parts.length - 1])) {
      parts.pop();
    }
    var doctorsIdx = parts.indexOf("doctors");
    if (doctorsIdx >= 0) {
      parts = parts.slice(0, doctorsIdx);
    }
    return "/" + (parts.length ? parts.join("/") + "/" : "");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function resolveImage(item, base) {
    var img = item.image ? String(item.image).trim() : "";
    if (!img) {
      return base + "assets/images/providers/" + encodeURIComponent(item.slug || "") + ".svg";
    }
    if (/^https?:\/\//i.test(img)) return img;
    return base + img.replace(/^\//, "");
  }

  function cardHtml(item, base) {
    var slug = item.slug || "";
    var href = base + "doctors/provider/" + encodeURIComponent(slug) + "/";
    var image = resolveImage(item, base);
    var clinic = item.clinic
      ? '<p class="top-provider__clinic">' + escapeHtml(item.clinic) + "</p>"
      : "";
    var specialty = item.specialty || (item.specialties || []).slice(0, 2).join(", ");
    var location =
      item.location ||
      []
        .concat(item.cities || [])
        .slice(0, 1)
        .concat(item.states || [])
        .slice(0, 1)
        .join(", ");

    return (
      '<article class="top-provider">' +
      '<a class="top-provider__link" href="' +
      escapeHtml(href) +
      '">' +
      '<div class="top-provider__media">' +
      '<img src="' +
      escapeHtml(image) +
      '" alt="' +
      escapeHtml(item.title || "") +
      '" width="240" height="240" loading="lazy" />' +
      "</div>" +
      '<div class="top-provider__body">' +
      "<h3>" +
      escapeHtml(item.title || "") +
      "</h3>" +
      '<p class="top-provider__stars" aria-label="Rating ' +
      escapeHtml(String(item.rating || 5)) +
      ' out of 5">★★★★★</p>' +
      (specialty
        ? '<p class="top-provider__specialty">' + escapeHtml(specialty) + "</p>"
        : "") +
      clinic +
      (location
        ? '<p class="top-provider__location">' + escapeHtml(location) + "</p>"
        : "") +
      "</div></a></article>"
    );
  }

  function initSlider(root, providers) {
    var viewport = root.querySelector(".top-providers__viewport");
    var track = root.querySelector(".top-providers__track");
    var prevBtn = root.querySelector("[data-tp-prev]");
    var nextBtn = root.querySelector("[data-tp-next]");
    var dotsWrap = root.querySelector("[data-tp-dots]");
    if (!viewport || !track) return;

    if (!track.children.length) {
      var base = siteBase();
      track.innerHTML = providers.map(function (item) {
        return cardHtml(item, base);
      }).join("");
    }

    var cards = Array.prototype.slice.call(root.querySelectorAll(".top-provider"));
    if (!cards.length) return;

    var timer = null;
    var page = 0;

    function perView() {
      var w = viewport.getBoundingClientRect().width || window.innerWidth;
      if (w < 520) return 1;
      if (w < 780) return 2;
      if (w < 1040) return 3;
      return 5;
    }

    function pageCount() {
      return Math.max(1, Math.ceil(cards.length / perView()));
    }

    function syncSizes() {
      var pv = perView();
      root.style.setProperty("--tp-per-view", String(pv));
      var gap = 16;
      var width = (viewport.clientWidth - gap * (pv - 1)) / pv;
      cards.forEach(function (card) {
        card.style.flex = "0 0 auto";
        card.style.width = width + "px";
        card.style.minWidth = width + "px";
        card.style.maxWidth = width + "px";
      });
    }

    function currentPage() {
      var step = viewport.clientWidth;
      if (step <= 0) return 0;
      return Math.round(viewport.scrollLeft / step);
    }

    function renderDots() {
      if (!dotsWrap) return;
      page = Math.max(0, Math.min(pageCount() - 1, currentPage()));
      var html = "";
      for (var i = 0; i < pageCount(); i++) {
        html +=
          '<button type="button" class="top-providers__dot' +
          (i === page ? " is-active" : "") +
          '" data-page="' +
          i +
          '" aria-label="Show providers group ' +
          (i + 1) +
          '"></button>';
      }
      dotsWrap.innerHTML = html;
      if (prevBtn) prevBtn.disabled = page <= 0;
      if (nextBtn) nextBtn.disabled = page >= pageCount() - 1;
    }

    function go(nextPage, smooth) {
      syncSizes();
      var max = pageCount() - 1;
      page = Math.max(0, Math.min(max, nextPage));
      viewport.scrollTo({
        left: page * viewport.clientWidth,
        behavior: smooth === false ? "auto" : "smooth",
      });
      renderDots();
    }

    function next() {
      var max = pageCount() - 1;
      go(page >= max ? 0 : page + 1);
    }

    function prev() {
      var max = pageCount() - 1;
      go(page <= 0 ? max : page - 1);
    }

    function startAuto() {
      stopAuto();
      timer = window.setInterval(next, 6000);
    }

    function stopAuto() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        stopAuto();
        prev();
        startAuto();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        stopAuto();
        next();
        startAuto();
      });
    }
    if (dotsWrap) {
      dotsWrap.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-page]");
        if (!btn) return;
        stopAuto();
        go(Number(btn.getAttribute("data-page")) || 0);
        startAuto();
      });
    }

    viewport.addEventListener(
      "scroll",
      function () {
        window.clearTimeout(viewport._tpScrollTimer);
        viewport._tpScrollTimer = window.setTimeout(renderDots, 80);
      },
      { passive: true }
    );

    root.addEventListener("mouseenter", stopAuto);
    root.addEventListener("mouseleave", startAuto);
    viewport.addEventListener("pointerdown", stopAuto);

    var resizeTimer;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        go(Math.min(currentPage(), pageCount() - 1), false);
      }, 120);
    });

    syncSizes();
    go(0, false);
    startAuto();
  }

  function boot() {
    var roots = Array.prototype.slice.call(
      document.querySelectorAll("[data-top-providers-slider]")
    );
    if (!roots.length) return;

    var base = siteBase();
    var src =
      (roots[0].getAttribute("data-tp-src") ||
        base + "assets/data/top-providers.json");

    // If any track already has cards, init immediately without fetch.
    var needsFetch = roots.some(function (root) {
      var track = root.querySelector(".top-providers__track");
      return track && !track.children.length;
    });

    function start(providers) {
      roots.forEach(function (root) {
        initSlider(root, providers || []);
      });
    }

    if (!needsFetch) {
      start([]);
      return;
    }

    fetch(src, { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load providers");
        return res.json();
      })
      .then(start)
      .catch(function () {
        start([]);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
