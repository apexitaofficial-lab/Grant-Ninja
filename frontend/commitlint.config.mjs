/**
 * Commit convention — AI_ENGINEERING_GUIDE.md §27 / §51.
 * Example: feat(grants): add grant detail page
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "grants",
        "search",
        "countries",
        "organizations",
        "categories",
        "admin",
        "ai",
        "seo",
        "crawler",
        "ui",
        "config",
        "db",
        "deps",
        "docs",
      ],
    ],
  },
};

export default config;
