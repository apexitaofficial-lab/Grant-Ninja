import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { clientEnv, getServerEnv } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Request-scoped Supabase client for Server Components, Server Actions and
 * Route Handlers. Uses the publishable key, so Row Level Security applies
 * against the caller's session.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. Session refresh is handled
            // by middleware instead, so this is safe to ignore.
          }
        },
      },
    },
  );
}

/**
 * Secret-key client. Bypasses Row Level Security entirely.
 *
 * Restricted to trusted server-side jobs (crawler callbacks, admin
 * maintenance). Never expose it through a public Server Action.
 */
export function createSupabaseAdminClient() {
  const { SUPABASE_SECRET_KEY } = getServerEnv();

  return createServerClient<Database>(clientEnv.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    cookies: {
      getAll: () => [],
      setAll: () => undefined,
    },
  });
}
