import Script from "next/script";

import { getZendeskWidgetKey } from "@/features/shared/services/settings-service";

/**
 * Zendesk Web Widget.
 *
 * A Server Component that renders `next/script`, which is the framework's own
 * mechanism for third-party scripts. Three things follow from that and none of
 * them do if the tag is pasted into a page:
 *
 *   - `afterInteractive` loads it once hydration is done, so a support widget
 *     never competes with the page's own JavaScript for the first paint
 *   - Next.js keeps a registry keyed on `id`, so client-side navigation between
 *     grant pages does not load a second copy
 *   - it renders no markup during SSR, so there is nothing for React to
 *     mismatch against on hydration
 *
 * The key comes from settings rather than the source, so support can be turned
 * off or moved to another account without a deploy. No key, no script — and
 * `getZendeskWidgetKey` already falls back to null if settings are unreachable,
 * so a database outage degrades to a site without chat rather than no site.
 */
export async function SupportWidget() {
  const key = await getZendeskWidgetKey();

  if (key === null) {
    return null;
  }

  return (
    <Script
      id="ze-snippet"
      src={`https://static.zdassets.com/ekr/snippet.js?key=${encodeURIComponent(key)}`}
      strategy="afterInteractive"
    />
  );
}
