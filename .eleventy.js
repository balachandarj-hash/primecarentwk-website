module.exports = function (eleventyConfig) {
  const staticPages = [
    "index.html",
    "about.html",
    "care-coordination.html",
    "contact.html",
    "providers-network.html",
    "legal-nurse-case-manager.html",
  ];

  // Keep existing corporate pages as static passthroughs (not processed as templates)
  staticPages.forEach((page) => {
    eleventyConfig.ignores.add(page);
    eleventyConfig.addPassthroughCopy(page);
  });

  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("admin/**");
  eleventyConfig.ignores.add("node_modules/**");
  eleventyConfig.ignores.add("_site/**");
  eleventyConfig.ignores.add("package.json");
  eleventyConfig.ignores.add("package-lock.json");

  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("robots.txt");

  eleventyConfig.addCollection("blog", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("./content/blog/*.md")
      .filter((item) => item.data.draft !== true)
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    if (!dateObj) return "";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(dateObj));
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    if (!dateObj) return "";
    return new Date(dateObj).toISOString().slice(0, 10);
  });

  eleventyConfig.addWatchTarget("./css/");
  eleventyConfig.addWatchTarget("./content/blog/");

  return {
    pathPrefix: "/primecarentwk-website/",
    dir: {
      input: ".",
      includes: "src/_includes",
      data: "src/_data",
      output: "_site",
    },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};
