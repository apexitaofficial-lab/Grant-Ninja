import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Chrome for the public site.
 *
 * Lives here rather than in the root layout so the admin portal does not
 * inherit the marketing header, footer and their database reads — an operator
 * signing in has no use for "Browse grants" navigation.
 */
export default function PublicLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
