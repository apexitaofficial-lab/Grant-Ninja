import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

/**
 * The sitewide social card.
 *
 * Next.js's file convention: placing this at the app root emits `og:image` and
 * its dimensions on every route that does not define its own. Grant pages do
 * (see `(public)/grants/[slug]/opengraph-image.tsx`); everything else — home,
 * services, about, contact, the directories — resolves here.
 *
 * Generated rather than shipped as a PNG on purpose. A static asset has to be
 * re-exported by a designer every time the wordmark or tagline changes, and in
 * practice that means it silently goes stale. This reads `config/site.ts`, so
 * the card cannot disagree with the site it represents.
 *
 * Deliberately does not touch the database. This is the fallback that has to
 * work when everything else is failing, and a card that needs a query is a
 * card that can 500.
 */

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori has no `oklch()` support, so the design tokens are restated here as
// hex. These are the same values `globals.css` documents: the brand navy
// sampled from the logo, and the emerald accent (D4).
const NAVY_DEEP = "#0B2B4A";
const NAVY = "#104577";
const EMERALD = "#12A46E";
const INK_ON_NAVY = "#FFFFFF";
const MUTED_ON_NAVY = "#A8C0D6";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundImage: `linear-gradient(135deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`,
        padding: "72px 80px",
      }}
    >
      {/* Eyebrow. Uppercase and widely tracked, which is how the site's own
            section labels are set — the card should look like the pages. */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 4, backgroundColor: EMERALD }} />
        <div
          style={{
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: MUTED_ON_NAVY,
          }}
        >
          Research grants database
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: -2,
            color: INK_ON_NAVY,
            lineHeight: 1.05,
          }}
        >
          {siteConfig.name}
        </div>
        <div
          style={{
            fontSize: 36,
            color: MUTED_ON_NAVY,
            marginTop: 20,
            lineHeight: 1.3,
            maxWidth: 900,
          }}
        >
          {siteConfig.tagline}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid rgba(168, 192, 214, 0.25)`,
          paddingTop: 28,
        }}
      >
        <div style={{ display: "flex", gap: 40, fontSize: 24, color: MUTED_ON_NAVY }}>
          <div style={{ display: "flex" }}>Grants</div>
          <div style={{ display: "flex" }}>Agencies</div>
          <div style={{ display: "flex" }}>Countries</div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: EMERALD }}>
          {siteConfig.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    </div>,
    size,
  );
}
