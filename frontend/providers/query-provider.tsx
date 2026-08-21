"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

/**
 * TanStack Query is only for client-side refetching (filters, autocomplete).
 * Initial data still comes from Server Components — MASTER_PROJECT_SPEC.md §121.
 */
export function QueryProvider({ children }: { readonly children: ReactNode }) {
  // Created in state so each browser session gets exactly one client, and it is
  // never shared between users during server rendering.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
