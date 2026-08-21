/**
 * URL hygiene.
 *
 * Tracking parameters must be stripped before any URL is stored or emitted in
 * structured data. A `sameAs` entry carrying `?utm_source=...` weakens the
 * entity match search engines make between the profile and the organization,
 * and leaks referral data into the page source.
 */

/** Prefixes cover vendor families such as `utm_*`, `_ga*`, `mc_*`. */
const TRACKING_PARAM_PREFIXES = ["utm_", "_ga", "_gl", "mc_", "pk_", "piwik_", "hsa_", "matomo_"];

const TRACKING_PARAM_NAMES = new Set([
  "gclid",
  "dclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "msclkid",
  "twclid",
  "ttclid",
  "igshid",
  "yclid",
  "li_fat_id",
  "mkt_tok",
  "vero_id",
  "vero_conv",
  "s_kwcid",
  "ref",
  "referrer",
  "source",
  "trk",
  "trkinfo",
  "originalsubdomain",
]);

function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase();

  return (
    TRACKING_PARAM_NAMES.has(lower) ||
    TRACKING_PARAM_PREFIXES.some((prefix) => lower.startsWith(prefix))
  );
}

/**
 * Removes tracking parameters and normalizes the URL.
 *
 * Returns `null` when the input is not a parseable http(s) URL, so callers are
 * forced to handle bad input rather than storing garbage.
 */
export function stripTrackingParams(rawUrl: string): string | null {
  let url: URL;

  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  for (const name of [...url.searchParams.keys()]) {
    if (isTrackingParam(name)) {
      url.searchParams.delete(name);
    }
  }

  // Fragments are never meaningful for a stored profile or canonical URL.
  url.hash = "";

  // Drop a bare "?" left behind once every parameter has been removed.
  const serialized = url.toString();

  return serialized.endsWith("?") ? serialized.slice(0, -1) : serialized;
}

/** Builds an absolute URL against the site origin, for canonicals and OpenGraph. */
export function absoluteUrl(path: string, siteUrl: string): string {
  return new URL(path, siteUrl).toString();
}
