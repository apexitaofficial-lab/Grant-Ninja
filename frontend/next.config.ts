import type { NextConfig } from "next";

/**
 * Response headers applied to every route.
 *
 * These are the ones that are safe to set without per-page testing. A full
 * Content-Security-Policy is deliberately absent: Next.js injects inline
 * scripts for hydration, so a CSP needs nonces wired through the document and
 * has to be verified page by page. Shipping a broken one silently breaks the
 * site; shipping none is merely a missing improvement.
 */
const securityHeaders = [
  // Stops a browser second-guessing a declared content type, which is how a
  // user-uploaded file becomes an executable script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The admin panel is a session-authenticated tool; framing it anywhere is
  // only useful to someone building a clickjacking overlay.
  { key: "X-Frame-Options", value: "DENY" },
  // Send the full URL within the site, only the origin when leaving it, and
  // nothing at all when downgrading to http.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here needs a camera, a microphone or a location.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Naming the framework and version in a header helps nobody but a scanner
  // looking for known issues.
  poweredByHeader: false,

  // Trailing-slash variants would otherwise be a second URL for every page,
  // splitting search-engine signals between them.
  trailingSlash: false,

  images: {
    // The logo and OpenGraph image can be served from Supabase storage once a
    // real asset exists; the settings page stores a URL rather than a file.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/**" }],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
