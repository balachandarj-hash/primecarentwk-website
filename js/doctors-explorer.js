(function () {
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function initExplorer() {
    var page = document.body;
    if (!page || !page.classList.contains("doctors-page")) return;

    var toggle = $("#doctors-filters-toggle");
    var filters = $("#doctors-search-filters");
    var explorer = $("#doctors-explorer");
    var mapSection = $("#doctors-map-section");
    var viewBtns = $all("[data-doctors-view]");

    function setFiltersOpen(open) {
      if (!filters || !toggle) return;
      page.classList.toggle("doctors-filters-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Hide filters" : "Filters";
    }

    if (toggle && filters) {
      toggle.addEventListener("click", function () {
        setFiltersOpen(!page.classList.contains("doctors-filters-open"));
        window.setTimeout(function () {
          if (window.PRIMCARE_DOCTORS_MAP && window.PRIMCARE_DOCTORS_MAP.invalidateSize) {
            window.PRIMCARE_DOCTORS_MAP.invalidateSize();
          }
        }, 180);
      });
      setFiltersOpen(false);
    }

    function setView(view) {
      var mode = view === "list" ? "list" : "split";
      page.classList.toggle("doctors-view-list", mode === "list");
      page.classList.toggle("doctors-view-split", mode !== "list");
      viewBtns.forEach(function (btn) {
        var active = btn.getAttribute("data-doctors-view") === mode;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
      window.setTimeout(function () {
        if (window.PRIMCARE_DOCTORS_MAP && window.PRIMCARE_DOCTORS_MAP.invalidateSize) {
          window.PRIMCARE_DOCTORS_MAP.invalidateSize();
        }
        if (mode === "list") {
          var results = $("#doctors-results");
          if (results) results.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (mapSection) {
          mapSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 60);
    }

    viewBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setView(btn.getAttribute("data-doctors-view") || "split");
      });
    });
    setView("split");

    // Keep sticky explorer height in sync for CSS var usage.
    function syncExplorerOffset() {
      if (!explorer) return;
      var header = $(".site-header");
      var topbar = $(".topbar");
      var offset =
        (header ? header.getBoundingClientRect().height : 0) +
        (topbar && getComputedStyle(topbar).display !== "none"
          ? topbar.getBoundingClientRect().height
          : 0);
      page.style.setProperty("--doctors-sticky-top", offset + "px");
    }

    syncExplorerOffset();
    window.addEventListener("resize", function () {
      syncExplorerOffset();
      if (window.PRIMCARE_DOCTORS_MAP && window.PRIMCARE_DOCTORS_MAP.invalidateSize) {
        window.PRIMCARE_DOCTORS_MAP.invalidateSize();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initExplorer);
  } else {
    initExplorer();
  }
})();
