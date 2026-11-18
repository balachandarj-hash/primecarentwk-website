(function () {
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function refreshMap() {
    window.setTimeout(function () {
      if (window.PRIMCARE_DOCTORS_MAP && window.PRIMCARE_DOCTORS_MAP.invalidateSize) {
        window.PRIMCARE_DOCTORS_MAP.invalidateSize();
      }
    }, 180);
  }

  function initExplorer() {
    var page = document.body;
    if (!page || !page.classList.contains("doctors-map-directory")) return;

    var toggle = $("#doctors-filters-toggle");
    var filters = $("#doctors-search-filters");
    var sheetBtns = $all("[data-sheet-size]");
    var panel = $("#doctors-results");
    var handle = panel ? panel.querySelector(".doctors-results__handle") : null;

    function setFiltersOpen(open) {
      if (!filters || !toggle) return;
      page.classList.toggle("doctors-filters-open", open);
      filters.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Hide" : "Filters";
      refreshMap();
    }

    if (toggle && filters) {
      toggle.addEventListener("click", function () {
        setFiltersOpen(filters.hidden);
      });
      setFiltersOpen(false);
    }

    function setSheetSize(size) {
      var mode = size === "full" || size === "half" ? size : "peek";
      page.classList.remove("doctors-sheet-peek", "doctors-sheet-half", "doctors-sheet-full");
      page.classList.add("doctors-sheet-" + mode);
      sheetBtns.forEach(function (btn) {
        var active = btn.getAttribute("data-sheet-size") === mode;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
      refreshMap();
    }

    sheetBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setSheetSize(btn.getAttribute("data-sheet-size") || "peek");
      });
    });

    if (handle) {
      handle.addEventListener("click", function () {
        if (page.classList.contains("doctors-sheet-peek")) setSheetSize("half");
        else if (page.classList.contains("doctors-sheet-half")) setSheetSize("full");
        else setSheetSize("peek");
      });
    }

    // Default: map-forward on small screens, split on larger screens.
    function applyDefaultSheet() {
      if (window.matchMedia("(max-width: 900px)").matches) setSheetSize("peek");
      else setSheetSize("half");
    }

    function syncStickyTop() {
      var header = $(".site-header");
      var topbar = $(".topbar");
      var offset =
        (header ? header.getBoundingClientRect().height : 0) +
        (topbar && getComputedStyle(topbar).display !== "none"
          ? topbar.getBoundingClientRect().height
          : 0);
      page.style.setProperty("--doctors-sticky-top", offset + "px");
      refreshMap();
    }

    applyDefaultSheet();
    syncStickyTop();
    window.addEventListener("resize", function () {
      syncStickyTop();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initExplorer);
  } else {
    initExplorer();
  }
})();
