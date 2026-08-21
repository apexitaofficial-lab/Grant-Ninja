import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/query-provider";

/**
 * Single composition point for application-wide providers, so `layout.tsx`
 * never grows a provider pyramid.
 */
export function AppProviders({ children }: { readonly children: ReactNode }) {
  return (
    <NuqsAdapter>
      <QueryProvider>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </QueryProvider>
    </NuqsAdapter>
  );
}
