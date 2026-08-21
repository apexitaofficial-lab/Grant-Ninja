import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { clientEnv } from "@/config/env";

/**
 * Refreshes the Supabase session on every request.
 *
 * Access tokens are short-lived. Without this, a signed-in operator is
 * silently logged out mid-session because nothing ever exchanges the refresh
 * token. The refreshed cookies must be written onto the response that is
 * actually returned, which is why the response object is threaded through
 * rather than created fresh at the end.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; userId: string | null }> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = NextResponse.next({ request });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser, not getSession: it revalidates the token with Supabase rather
  // than trusting a cookie the browser could have tampered with.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, userId: user?.id ?? null };
}
