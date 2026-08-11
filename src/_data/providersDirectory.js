const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
  );
}

module.exports = function () {
  const dir = path.join(__dirname, "../../content/providers");
  if (!fs.existsSync(dir)) {
    return { providers: [], specialties: [], cities: [], states: [] };
  }

  const providers = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const raw = fs.readFileSync(path.join(dir, name), "utf8");
      const { data } = matter(raw);
      if (data.draft === true) return null;
      const slug = name.replace(/\.md$/, "");
      return {
        slug,
        title: data.title || slug,
        rating: data.rating != null ? Number(data.rating) : 5,
        clinic: data.clinic || "",
        phone: data.phone || "",
        phoneDisplay: data.phoneDisplay || "",
        image: data.image || "",
        imageAlt: data.imageAlt || data.title || "",
        specialties: Array.isArray(data.specialties) ? data.specialties : [],
        cities: Array.isArray(data.cities) ? data.cities : [],
        states: Array.isArray(data.states) ? data.states : [],
        addresses: Array.isArray(data.addresses) ? data.addresses : [],
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      String(a.title).localeCompare(String(b.title), undefined, { sensitivity: "base" })
    );

  return {
    providers,
    specialties: uniqueSorted(providers.flatMap((p) => p.specialties)),
    cities: uniqueSorted(providers.flatMap((p) => p.cities)),
    states: uniqueSorted(providers.flatMap((p) => p.states)),
  };
};
