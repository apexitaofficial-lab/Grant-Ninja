import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { clientEnv } from "@/config/env";

/**
 * How long the auth service gets before we give up on it.
 *
 * Vercel kills a middleware invocation at 25 seconds, and middleware runs in
 * front of every page. An unbounded call here means one slow dependency takes
 * the entire site down — which is exactly what happened: intermittent Supabase
 * Auth latency produced MIDDLEWARE_INVOCATION_TIMEOUT on roughly two in five
 * requests, including to pages that need no authentication at all.
 *
 * Three seconds is far longer than a healthy response (~250ms) and far shorter
 * than the platform's patience, so a degraded auth service costs a signed-in
 * operator one re-login instead of costing everyone the site.
 */
const AUTH_TIMEOUT_MS = 3_000;

/** True when the request carries a Supabase session cookie to validate. */
export function hasAuthCookie(request: NextRequest): boolean {
  // `@supabase/ssr` stores the session as `sb-<project-ref>-auth-token`, split
  // across `.0`/`.1` suffixes when it exceeds the cookie size limit.
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"));
}

/**
 * Refreshes the Supabase session.
 *
 * Access tokens are short-lived. Without this, a signed-in operator is
 * silently logged out mid-session because nothing ever exchanges the refresh
 * token. The refreshed cookies must be written onto the response that is
 * actually returned, which is why the response object is threaded through
 * rather than created fresh at the end.
 *
 * Only call this when {@link hasAuthCookie} is true. An anonymous visitor has
 * no session to refresh, so asking the auth service about them is a network
 * round trip that can only fail.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; userId: string | null }> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      // `getUser()` takes no signal of its own, so the bound goes on the
      // transport underneath it.
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(AUTH_TIMEOUT_MS) }),
      },
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

  try {
    // getUser, not getSession: it revalidates the token with Supabase rather
    // than trusting a cookie the browser could have tampered with.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return { response, userId: user?.id ?? null };
  } catch {
    // Timed out or unreachable. Reporting "not signed in" is the safe answer in
    // both directions: a public page still renders, and the admin gate sends
    // the operator to the login screen. A failure here never grants access.
    return { response, userId: null };
  }
}
