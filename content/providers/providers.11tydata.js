module.exports = {
  layout: "layouts/provider.njk",
  tags: ["provider"],
  eleventyComputed: {
    permalink: (data) => `/doctors/provider/${data.page.fileSlug}/`,
    pageTitle: (data) => `${data.title} | Providers Directory`,
    description: (data) => {
      const specialty = (data.specialties || []).join(", ");
      const city = (data.cities || []).join(", ");
      const parts = [
        data.title,
        specialty ? `Specialty: ${specialty}` : "",
        city ? city : "",
        "PrimeCare Network provider directory",
      ].filter(Boolean);
      return parts.join(" · ");
    },
  },
};
