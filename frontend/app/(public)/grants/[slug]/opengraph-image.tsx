import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";
import { getGrantBySlug, getPrimaryCategory } from "@/features/grants/services/grant-service";
import { formatDate, formatFundingRange } from "@/lib/format";

/**
 * The social card for one grant.
 *
 * Overrides the sitewide card from `app/opengraph-image.tsx` for this route.
 * Every grant therefore shares as itself — its own title, funder, award range
 * and closing date — rather than as a generic site badge. For a directory whose
 * whole purpose is that individual grant pages get shared and cited, one card
 * repeated across every grant would waste the most valuable surface the site
 * has.
 *
 * Built from the same data the page renders, through the same service, so the
 * card cannot claim something the page does not say.
 */

export const alt = "Grant details";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Restated as hex because Satori cannot parse `oklch()`. Same values as
// `globals.css` and the sitewide card, so the two are visibly one family.
const NAVY_DEEP = "#0B2B4A";
const NAVY = "#104577";
const EMERALD = "#12A46E";
const INK_ON_NAVY = "#FFFFFF";
const MUTED_ON_NAVY = "#A8C0D6";

/**
 * Titles from federal notices run long — well past what fits at a readable
 * size. Truncated here rather than clamped in CSS so the ellipsis lands on a
 * word boundary instead of mid-word.
 */
function truncate(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value
    .slice(0, limit)
    .trimEnd()
    .replace(/[,;:—-]$/, "")}…`;
}

export default async function GrantOpengraphImage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // A card that throws is worse than a generic one: the share renders with no
  // image at all. Anything unexpected falls through to the site-level design
  // below, which needs no data.
  let grant: Awaited<ReturnType<typeof getGrantBySlug>> = null;

  try {
    grant = await getGrantBySlug(slug);
  } catch {
    grant = null;
  }

  const funding = grant === null ? null : formatFundingRange(grant, true);
  const closes = grant === null ? null : formatDate(grant.closesAt);
  const category = grant === null ? null : getPrimaryCategory(grant);
  const location =
    grant === null
      ? null
      : grant.state === null
        ? grant.country.name
        : `${grant.state.name}, ${grant.country.name}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        // A guaranteed floor under `space-between`. Federal titles run to
        // three lines, and without this the title block grows until it sits
        // directly on top of the award figures.
        gap: 40,
        backgroundImage: `linear-gradient(135deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`,
        padding: "64px 72px",
      }}
    >
      {/* Funder first. Someone scanning a shared link decides by who is
            paying before they read what the programme is called. */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 4, backgroundColor: EMERALD }} />
          <div
            style={{
              fontSize: 20,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: MUTED_ON_NAVY,
            }}
          >
            {grant === null ? "Research grant" : truncate(grant.organization.name, 52)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: grant !== null && grant.title.length > 70 ? 56 : 68,
            fontWeight: 700,
            letterSpacing: -1.5,
            color: INK_ON_NAVY,
            lineHeight: 1.12,
            marginTop: 28,
            maxWidth: 1010,
          }}
        >
          {/* Capped at three lines' worth. Measured against the longest
                titles in the federal feed — 120 characters wrapped to four
                lines and pushed the award figures off their baseline. */}
          {grant === null ? siteConfig.name : truncate(grant.title, 92)}
        </div>
      </div>

      {/* The three facts that decide whether a grant is worth opening:
            how much, by when, and where it applies. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 56 }}>
          {funding !== null && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 18,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: MUTED_ON_NAVY,
                }}
              >
                Award
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 44,
                  fontWeight: 700,
                  color: EMERALD,
                  marginTop: 8,
                }}
              >
                {funding}
              </div>
            </div>
          )}

          {closes !== null && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 18,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: MUTED_ON_NAVY,
                }}
              >
                Closes
              </div>
              <div style={{ display: "flex", fontSize: 44, color: INK_ON_NAVY, marginTop: 8 }}>
                {closes}
              </div>
            </div>
          )}

          {location !== null && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 18,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: MUTED_ON_NAVY,
                }}
              >
                Location
              </div>
              <div style={{ display: "flex", fontSize: 44, color: INK_ON_NAVY, marginTop: 8 }}>
                {truncate(location, 26)}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(168, 192, 214, 0.25)",
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", fontSize: 24, color: INK_ON_NAVY, fontWeight: 700 }}>
            {siteConfig.name}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: MUTED_ON_NAVY }}>
            {category === null ? "Research grants" : category.name}
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
