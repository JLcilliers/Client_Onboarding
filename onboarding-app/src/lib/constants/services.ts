export const DISPLAY_SERVICE_TO_KEY: Record<string, string> = {
  SEO: "seo",
  PPC: "ppc",
  "Social Media": "social",
  "Analytics and Tagging": "analytics",
  "Website Development": "webdev",
  "Email Marketing": "email",
  "Conversion Rate Optimization": "cro",
  "Local SEO and Listings": "local",
};

export const SERVICE_KEY_TO_DISPLAY = Object.fromEntries(
  Object.entries(DISPLAY_SERVICE_TO_KEY).map(([display, key]) => [key, display]),
);

export const SERVICE_KEYS = Object.values(DISPLAY_SERVICE_TO_KEY);
