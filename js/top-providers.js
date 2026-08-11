(function () {
  var root = document.querySelector("[data-top-providers-slider]");
  if (!root) return;

  var viewport = root.querySelector(".top-providers__viewport");
  var track = root.querySelector(".top-providers__track");
  var cards = Array.prototype.slice.call(root.querySelectorAll(".top-provider"));
  var prevBtn = root.querySelector("[data-tp-prev]");
  var nextBtn = root.querySelector("[data-tp-next]");
  var dotsWrap = root.querySelector("[data-tp-dots]");
  if (!viewport || !track || !cards.length) return;

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

  function syncVar() {
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
    var pv = perView();
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
    syncVar();
    var max = pageCount() - 1;
    page = Math.max(0, Math.min(max, nextPage));
    var left = page * viewport.clientWidth;
    viewport.scrollTo({ left: left, behavior: smooth === false ? "auto" : "smooth" });
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

  syncVar();
  go(0, false);
  startAuto();
})();
