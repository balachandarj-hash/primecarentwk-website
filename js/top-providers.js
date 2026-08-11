(function () {
  var root = document.querySelector("[data-top-providers-slider]");
  if (!root) return;

  var viewport = root.querySelector(".top-providers__viewport");
  var track = root.querySelector(".top-providers__track");
  var cards = Array.prototype.slice.call(root.querySelectorAll(".top-provider"));
  var prevBtn = root.querySelector("[data-tp-prev]");
  var nextBtn = root.querySelector("[data-tp-next]");
  var dotsWrap = root.querySelector("[data-tp-dots]");
  if (!track || !viewport || !cards.length) return;

  var page = 0;
  var timer = null;
  var GAP = 16;

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
    root.style.setProperty("--tp-per-view", String(perView()));
  }

  function renderDots() {
    if (!dotsWrap) return;
    var count = pageCount();
    var html = "";
    for (var i = 0; i < count; i++) {
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
  }

  function go(next) {
    syncVar();
    var max = pageCount() - 1;
    page = Math.max(0, Math.min(max, next));
    var pv = perView();
    var cardWidth = cards[0].getBoundingClientRect().width;
    var shift = page * pv * (cardWidth + GAP);
    // don't overscroll past end
    var maxShift = Math.max(0, track.scrollWidth - viewport.clientWidth);
    if (shift > maxShift) shift = maxShift;
    track.style.transform = "translateX(-" + shift + "px)";
    renderDots();
    if (prevBtn) prevBtn.disabled = page === 0;
    if (nextBtn) nextBtn.disabled = page >= max;
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

  root.addEventListener("mouseenter", stopAuto);
  root.addEventListener("mouseleave", startAuto);

  var resizeTimer;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      go(Math.min(page, pageCount() - 1));
    }, 120);
  });

  syncVar();
  go(0);
  startAuto();
})();
