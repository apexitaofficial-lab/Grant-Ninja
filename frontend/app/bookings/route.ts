import { NextResponse } from "next/server";

import { siteConfig } from "@/config/site";

/**
 * /bookings — hands the visitor to the booking calendar.
 *
 * A Route Handler rather than a page, deliberately. A page would build a React
 * tree, run the public layout with its header, footer and settings reads, and
 * paint a frame the visitor is not meant to see, only to navigate away from it.
 * A route handler returns the redirect and nothing else: no layout, no render,
 * no flash of a page that immediately disappears.
 *
 * That also rules out the client-side alternatives. A `useEffect` redirect
 * needs JavaScript to run before it fires, and a `<meta http-equiv="refresh">`
 * needs the document parsed — both show something first, and neither is a real
 * HTTP redirect, so nothing downstream treats the URL as a redirect at all.
 *
 * 307 rather than 308: the destination is an appointment schedule that can be
 * recreated or repointed. A permanent redirect is cached hard by browsers and
 * would keep sending people to a dead calendar long after the variable changed.
 *
 * `dynamic = "force-dynamic"` stops the redirect being statically evaluated at
 * build time and baked into the output, so changing the destination takes
 * effect on the next request rather than the next build.
 */

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.redirect(siteConfig.bookingUrl, 307);
}
