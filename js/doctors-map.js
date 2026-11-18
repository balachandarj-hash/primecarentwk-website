(function () {
  var base = (window.PRIMCARE_BASE || "/").replace(/\/?$/, "/");

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function providerUrl(slug) {
    return base + "doctors/provider/" + encodeURIComponent(slug) + "/";
  }

  function readFilters() {
    return {
      name: (($("#filter-name") || {}).value || "").trim().toLowerCase(),
      specialty: ($("#filter-specialty") || {}).value || "",
      city: ($("#filter-city") || {}).value || "",
      state: ($("#filter-state") || {}).value || "",
    };
  }

  function providerMatches(provider, filters, providersBySlug) {
    var full = providersBySlug[provider.slug];
    if (!full) return true;
    if (filters.name) {
      var hay = String(full.title || "").toLowerCase();
      if (hay.indexOf(filters.name) === -1) return false;
    }
    if (filters.specialty && (full.specialties || []).indexOf(filters.specialty) === -1) {
      return false;
    }
    if (filters.city && (full.cities || []).indexOf(filters.city) === -1) return false;
    if (filters.state && (full.states || []).indexOf(filters.state) === -1) return false;
    return true;
  }

  function locationMatches(loc, filters, providersBySlug) {
    if (!filters.name && !filters.specialty && !filters.city && !filters.state) return true;
    return (loc.providers || []).some(function (provider) {
      return providerMatches(provider, filters, providersBySlug);
    });
  }

  function popupHtml(loc) {
    var links = (loc.providers || [])
      .map(function (p) {
        return (
          '<li><a href="' +
          providerUrl(p.slug) +
          '">' +
          escapeHtml(p.title) +
          "</a></li>"
        );
      })
      .join("");
    return (
      '<div class="doctors-map__popup">' +
      '<p class="doctors-map__popup-address">' +
      escapeHtml(loc.address) +
      "</p>" +
      (links ? '<ul class="doctors-map__popup-providers">' + links + "</ul>" : "") +
      "</div>"
    );
  }

  function initMap() {
    var mapEl = $("#doctors-map");
    var countEl = $("#doctors-map-count");
    if (!mapEl || typeof window.L === "undefined") return;

    var providersBySlug = {};
    var dataEl = $("#doctors-data");
    if (dataEl) {
      try {
        (JSON.parse(dataEl.textContent || "[]") || []).forEach(function (p) {
          if (p && p.slug) providersBySlug[p.slug] = p;
        });
      } catch (e) {
        providersBySlug = {};
      }
    }

    var map = window.L.map(mapEl, {
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([31.0, -99.0], 6);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    var markerLayer = window.L.layerGroup().addTo(map);
    var allLocations = [];
    var brandIcon = window.L.divIcon({
      className: "doctors-map__marker",
      html: '<span class="doctors-map__marker-dot" aria-hidden="true"></span>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -10],
    });

    function renderMarkers() {
      var filters = readFilters();
      var visible = allLocations.filter(function (loc) {
        return locationMatches(loc, filters, providersBySlug);
      });

      markerLayer.clearLayers();
      var bounds = [];
      visible.forEach(function (loc) {
        if (typeof loc.lat !== "number" || typeof loc.lng !== "number") return;
        var marker = window.L.marker([loc.lat, loc.lng], { icon: brandIcon });
        marker.bindPopup(popupHtml(loc), { maxWidth: 280 });
        markerLayer.addLayer(marker);
        bounds.push([loc.lat, loc.lng]);
      });

      if (countEl) {
        countEl.textContent =
          visible.length +
          " location" +
          (visible.length === 1 ? "" : "s") +
          " on the map";
      }

      if (bounds.length === 1) {
        map.setView(bounds[0], 12);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 12 });
      }
    }

    var src = mapEl.getAttribute("data-locations-src") || base + "assets/data/provider-locations.json";
    fetch(src)
      .then(function (res) {
        if (!res.ok) throw new Error("Unable to load provider locations");
        return res.json();
      })
      .then(function (payload) {
        allLocations = (payload && payload.locations) || [];
        renderMarkers();
        window.setTimeout(function () {
          map.invalidateSize();
        }, 80);
      })
      .catch(function () {
        if (countEl) countEl.textContent = "Map locations unavailable right now.";
      });

    ["doctors-filter-form", "filter-state", "filter-city", "filter-specialty"].forEach(
      function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener(id === "doctors-filter-form" ? "submit" : "change", function () {
          window.setTimeout(renderMarkers, 0);
        });
      }
    );

    var nameInput = $("#filter-name");
    if (nameInput) {
      var timer;
      nameInput.addEventListener("input", function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(renderMarkers, 200);
      });
    }

    var clearBtn = $("#doctors-clear-filters");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        window.setTimeout(renderMarkers, 0);
      });
    }

    window.addEventListener("resize", function () {
      map.invalidateSize();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMap);
  } else {
    initMap();
  }
})();
