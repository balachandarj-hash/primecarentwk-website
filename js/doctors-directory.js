(function () {
  var PAGE_SIZE = 10;
  var base = (window.PRIMCARE_BASE || "/").replace(/\/?$/, "/");

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function starsHtml(rating) {
    var n = Math.round(Number(rating) || 5);
    var out = "";
    for (var i = 0; i < 5; i++) out += i < n ? "★" : "☆";
    return out;
  }

  function providerUrl(slug) {
    return base + "doctors/provider/" + encodeURIComponent(slug) + "/";
  }

  function renderCard(p) {
    var specialties = (p.specialties || []).join(", ");
    var address = (p.addresses || []).join(" · ");
    var photo = "";
    if (p.image) {
      var src = String(p.image);
      if (src.indexOf("http") !== 0 && src.charAt(0) === "/") {
        src = base.replace(/\/$/, "") + src;
      }
      photo =
        '<div class="doctors-card__photo"><img src="' +
        escapeHtml(src) +
        '" alt="' +
        escapeAttr(p.imageAlt || p.title || "") +
        '" width="88" height="88" loading="lazy" /></div>';
    }
    return (
      '<article class="doctors-card">' +
      photo +
      '<div class="doctors-card__main">' +
      '<h2 class="doctors-card__title"><a href="' +
      providerUrl(p.slug) +
      '">' +
      escapeHtml(p.title) +
      "</a></h2>" +
      '<p class="provider-rating" aria-label="Rating ' +
      escapeHtml(String(p.rating || 5)) +
      ' out of 5"><span class="provider-rating__stars" aria-hidden="true">' +
      starsHtml(p.rating) +
      "</span></p>" +
      (specialties
        ? '<p class="doctors-card__line"><span>Specialty:</span> ' +
          escapeHtml(specialties) +
          "</p>"
        : "") +
      (address
        ? '<p class="doctors-card__line"><span>Address:</span> ' +
          escapeHtml(address) +
          "</p>"
        : "") +
      "</div>" +
      '<div class="doctors-card__actions">' +
      '<button class="btn btn--primary btn--sm" type="button" data-book-appointment data-provider="' +
      escapeAttr(p.title) +
      '">Book Appointment</button>' +
      "</div>" +
      "</article>"
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function readFilters() {
    return {
      name: (($("#filter-name") || {}).value || "").trim(),
      specialty: ($("#filter-specialty") || {}).value || "",
      city: ($("#filter-city") || {}).value || "",
      state: ($("#filter-state") || {}).value || "",
    };
  }

  function normalizeName(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[.,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function matches(p, filters) {
    if (filters.name) {
      var needle = normalizeName(filters.name);
      var haystack = normalizeName(p.title || "");
      if (haystack.indexOf(needle) === -1) return false;
    }
    if (filters.specialty && (p.specialties || []).indexOf(filters.specialty) === -1) return false;
    if (filters.city && (p.cities || []).indexOf(filters.city) === -1) return false;
    if (filters.state && (p.states || []).indexOf(filters.state) === -1) return false;
    return true;
  }

  function initDirectory() {
    var dataEl = $("#doctors-data");
    var listEl = $("#doctors-results-list");
    if (!dataEl || !listEl) return;

    var providers = [];
    try {
      providers = JSON.parse(dataEl.textContent || "[]");
    } catch (e) {
      providers = [];
    }

    var citiesByState = {};
    var citiesByStateEl = $("#doctors-cities-by-state");
    if (citiesByStateEl) {
      try {
        citiesByState = JSON.parse(citiesByStateEl.textContent || "{}") || {};
      } catch (e) {
        citiesByState = {};
      }
    }

    var form = $("#doctors-filter-form");
    var countEl = $("#doctors-results-count");
    var clearBtn = $("#doctors-clear-filters");
    var pager = $("#doctors-pagination");
    var stateSelect = $("#filter-state");
    var citySelect = $("#filter-city");
    var state = { page: 1, filters: readFilters() };

    function citiesForState(stateCode) {
      var list = (citiesByState && citiesByState[stateCode]) || [];
      return list.slice().sort(function (a, b) {
        return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
      });
    }

    function syncCityOptions(preferredCity) {
      if (!citySelect) return;
      var selectedState = (stateSelect && stateSelect.value) || "";
      var keepCity = preferredCity != null ? preferredCity : citySelect.value;
      citySelect.innerHTML = "";

      if (!selectedState) {
        citySelect.disabled = true;
        citySelect.innerHTML = '<option value="">Select a state first</option>';
        return;
      }

      var cities = citiesForState(selectedState);
      var html = '<option value="">Select cities</option>';
      cities.forEach(function (city) {
        html +=
          '<option value="' +
          escapeAttr(city) +
          '"' +
          (city === keepCity ? " selected" : "") +
          ">" +
          escapeHtml(city) +
          "</option>";
      });
      citySelect.innerHTML = html;
      citySelect.disabled = cities.length === 0;
      if (keepCity && cities.indexOf(keepCity) === -1) {
        citySelect.value = "";
      }
    }

    function filtered() {
      return providers.filter(function (p) {
        return matches(p, state.filters);
      });
    }

    function render() {
      var items = filtered();
      var pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
      if (state.page > pages) state.page = pages;
      var start = (state.page - 1) * PAGE_SIZE;
      var pageItems = items.slice(start, start + PAGE_SIZE);

      listEl.innerHTML = pageItems.length
        ? pageItems.map(renderCard).join("")
        : '<p class="doctors-empty">No providers match these filters. Try another name, specialty, or city.</p>';

      if (countEl) {
        var hasFilters = !!(
          state.filters.name ||
          state.filters.specialty ||
          state.filters.city ||
          state.filters.state
        );
        countEl.textContent =
          items.length +
          " provider" +
          (items.length === 1 ? "" : "s") +
          (hasFilters ? " found" : " in the network");
      }

      if (clearBtn) {
        var has = !!(
          state.filters.name ||
          state.filters.specialty ||
          state.filters.city ||
          state.filters.state
        );
        clearBtn.hidden = !has;
      }

      if (pager) {
        if (pages <= 1) {
          pager.innerHTML = "";
        } else {
          var html = "";
          html +=
            '<button type="button" class="doctors-page-btn" data-page="' +
            Math.max(1, state.page - 1) +
            '" ' +
            (state.page === 1 ? "disabled" : "") +
            ">Previous</button>";
          for (var i = 1; i <= pages; i++) {
            html +=
              '<button type="button" class="doctors-page-btn' +
              (i === state.page ? " is-active" : "") +
              '" data-page="' +
              i +
              '">' +
              i +
              "</button>";
          }
          html +=
            '<button type="button" class="doctors-page-btn" data-page="' +
            Math.min(pages, state.page + 1) +
            '" ' +
            (state.page === pages ? "disabled" : "") +
            ">Next</button>";
          pager.innerHTML = html;
        }
      }
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        state.filters = readFilters();
        state.page = 1;
        render();
      });
    }

    if (stateSelect) {
      stateSelect.addEventListener("change", function () {
        syncCityOptions("");
        state.filters = readFilters();
        state.page = 1;
        render();
      });
    }

    if (citySelect) {
      citySelect.addEventListener("change", function () {
        state.filters = readFilters();
        state.page = 1;
        render();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        ["filter-name", "filter-specialty", "filter-city", "filter-state"].forEach(function (id) {
          var el = $("#" + id);
          if (el) el.value = "";
        });
        syncCityOptions("");
        state.filters = readFilters();
        state.page = 1;
        render();
      });
    }

    var nameInput = $("#filter-name");
    if (nameInput) {
      var nameTimer;
      nameInput.addEventListener("input", function () {
        window.clearTimeout(nameTimer);
        nameTimer = window.setTimeout(function () {
          state.filters = readFilters();
          state.page = 1;
          render();
        }, 180);
      });
    }

    if (pager) {
      pager.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-page]");
        if (!btn || btn.disabled) return;
        state.page = Number(btn.getAttribute("data-page")) || 1;
        render();
        var panel = $(".doctors-results");
        if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    // deep-link filters via query string
    try {
      var params = new URLSearchParams(window.location.search);
      ["name", "specialty", "state", "city"].forEach(function (key) {
        var val = params.get(key);
        var el = $("#filter-" + key);
        if (val && el && key !== "city") el.value = val;
      });
      syncCityOptions(params.get("city") || "");
      state.filters = readFilters();
    } catch (err) {
      syncCityOptions("");
    }

    render();
  }

  function initModal() {
    var modal = $("#appt-modal");
    if (!modal) return;
    var form = $("#appt-form");
    var providerInput = $("#appt-provider");
    var status = $("#appt-form-status");
    var scrollY = 0;

    function openModal(providerName) {
      if (providerInput) providerInput.value = providerName || "";
      if (status) status.textContent = "";
      scrollY = window.scrollY || window.pageYOffset || 0;
      modal.hidden = false;
      document.body.classList.add("modal-open");
      document.body.style.top = "-" + scrollY + "px";
      var first = modal.querySelector("input[name='name']");
      if (first) first.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove("modal-open");
      document.body.style.top = "";
      window.scrollTo(0, scrollY);
    }

    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-book-appointment]");
      if (btn) {
        e.preventDefault();
        openModal(btn.getAttribute("data-provider") || "");
        return;
      }
      if (e.target.closest("[data-appt-close]")) {
        closeModal();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var name = (fd.get("name") || "").toString().trim();
        var phone = (fd.get("phone") || "").toString().trim();
        var email = (fd.get("email") || "").toString().trim();
        var message = (fd.get("message") || "").toString().trim();
        var provider = (fd.get("provider") || "").toString().trim();

        var subject = encodeURIComponent(
          "Appointment request" + (provider ? ": " + provider : "")
        );
        var body = encodeURIComponent(
          [
            "Name: " + name,
            "Phone: " + phone,
            "Email: " + email,
            provider ? "Provider: " + provider : "",
            "",
            message || "(No additional message)",
          ]
            .filter(Boolean)
            .join("\n")
        );

        // Opens the visitor's email client to the care coordination line.
        window.location.href =
          "mailto:info@primecarentwk.com?subject=" + subject + "&body=" + body;

        if (status) {
          status.textContent =
            "Opening your email app… If nothing opens, call (888) 474-8473.";
        }
        form.reset();
        if (providerInput) providerInput.value = provider;
        setTimeout(closeModal, 1200);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initDirectory();
      initModal();
    });
  } else {
    initDirectory();
    initModal();
  }
})();
