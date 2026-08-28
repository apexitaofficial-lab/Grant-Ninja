import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { routes } from "@/config/routes";
import { resolveRedirect } from "@/lib/redirects";
import { hasAuthCookie, updateSession } from "@/lib/supabase/middleware";

/**
 * Session refresh, plus the authentication gate on /admin.
 *
 * This checks only whether someone is signed in. Whether they are an *active
 * administrator* is decided by the admin layout, which can query the database
 * — middleware runs on every matched request, and a role lookup here would
 * put a database round trip in front of the whole site.
 *
 * So: middleware answers "who are you", the layout answers "may you be here".
 *
 * Nothing here may block on a dependency without a bound. Middleware runs in
 * front of every page, so a hang is not a slow page — it is the whole site
 * returning 504.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // An anonymous visitor has no session to refresh, so there is nothing to ask
  // the auth service about. This is the overwhelming majority of traffic —
  // every reader and every search engine crawler — and skipping the round trip
  // takes them off the auth service's availability entirely.
  const { response, userId } = hasAuthCookie(request)
    ? await updateSession(request)
    : { response: NextResponse.next({ request }), userId: null };

  // Stored redirects run before anything else, and only on public paths.
  // Renaming a slug in the admin panel writes one of these, so without this
  // step a rename would 404 every existing link to the old address.
  if (!pathname.startsWith(routes.admin.root)) {
    const redirect = await resolveRedirect(pathname);

    if (redirect !== null) {
      const target = new URL(redirect.destination, request.url);

      // Query strings are carried over: a campaign link to a renamed page
      // should still arrive with its parameters intact.
      target.search = request.nextUrl.search;

      return NextResponse.redirect(target, redirect.statusCode);
    }
  }

  const isAdminArea =
    pathname === routes.admin.root || pathname.startsWith(`${routes.admin.root}/`);
  const isLoginPage = pathname === routes.admin.login;

  if (isAdminArea && !isLoginPage && userId === null) {
    const loginUrl = new URL(routes.admin.login, request.url);

    // Remember where they were headed so sign-in can return them there.
    if (pathname !== routes.admin.root) {
      loginUrl.searchParams.set("next", pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  // Already signed in and staring at the login form: send them inward.
  if (isLoginPage && userId !== null) {
    return NextResponse.redirect(new URL(routes.admin.root, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image optimisation. The session
     * still needs refreshing on public pages, otherwise an operator browsing
     * the site would have their token expire underneath them.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|logo-wordmark.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)",
  ],
};
