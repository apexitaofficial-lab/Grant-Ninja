import { clientEnv } from "@/config/env";

/**
 * Stored redirects, cached in the middleware instance.
 *
 * `seo_redirects` exists so that renaming a slug does not 404 every existing
 * link. Nothing read it until now, which meant the table was a promise the
 * site did not keep.
 *
 * Middleware runs on every matched request, so a database round trip per
 * request is not affordable. The whole table is small — one row per rename
 * ever performed — so it is loaded once and held for a short window. The cost
 * of the cache is that a rename takes up to a minute to take effect, which is
 * the right trade for something nobody does twice in an hour.
 *
 * A failed load caches an empty map briefly rather than retrying on every
 * request: if the database is down, hammering it from middleware makes the
 * outage worse, and a missing redirect degrades to a 404 rather than an error.
 */

const CACHE_TTL_MS = 60_000;

/**
 * Middleware runs in front of every page and Vercel kills the invocation at 25
 * seconds, so this call needs a bound of its own. Failing to resolve a redirect
 * costs one visitor a 404; hanging costs everyone the site.
 */
const FETCH_TIMEOUT_MS = 3_000;

interface RedirectRule {
  readonly destination: string;
  readonly statusCode: number;
}

let cache: ReadonlyMap<string, RedirectRule> | null = null;
let cachedAt = 0;
let inFlight: Promise<ReadonlyMap<string, RedirectRule>> | null = null;

async function fetchRedirects(): Promise<ReadonlyMap<string, RedirectRule>> {
  const url = `${clientEnv.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/seo_redirects?select=source_path,destination_path,status_code&enabled=eq.true`;

  try {
    const response = await fetch(url, {
      headers: {
        apikey: clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
      },
      // The TTL above is the cache; Next's own fetch cache would add a second
      // one with different semantics.
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return new Map();
    }

    const rows: unknown = await response.json();

    if (!Array.isArray(rows)) {
      return new Map();
    }

    const map = new Map<string, RedirectRule>();

    for (const row of rows) {
      if (
        typeof row === "object" &&
        row !== null &&
        "source_path" in row &&
        "destination_path" in row
      ) {
        const source = String((row as Record<string, unknown>)["source_path"]);
        const destination = String((row as Record<string, unknown>)["destination_path"]);
        const status = Number((row as Record<string, unknown>)["status_code"]);

        map.set(normalizePath(source), {
          destination,
          statusCode: status === 302 ? 302 : 301,
        });
      }
    }

    return map;
  } catch {
    return new Map();
  }
}

/** Trailing slashes are not a different page. */
function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
}

async function getRedirects(): Promise<ReadonlyMap<string, RedirectRule>> {
  const now = Date.now();

  if (cache !== null && now - cachedAt < CACHE_TTL_MS) {
    return cache;
  }

  // Several requests arriving on a cold cache share one fetch rather than
  // each starting their own.
  inFlight ??= fetchRedirects().then((result) => {
    cache = result;
    cachedAt = Date.now();
    inFlight = null;

    return result;
  });

  return inFlight;
}

export interface ResolvedRedirect {
  readonly destination: string;
  readonly statusCode: number;
}

export async function resolveRedirect(pathname: string): Promise<ResolvedRedirect | null> {
  const redirects = await getRedirects();

  if (redirects.size === 0) {
    return null;
  }

  const rule = redirects.get(normalizePath(pathname));

  if (rule === undefined) {
    return null;
  }

  // A redirect pointing at itself would loop the browser. The database has a
  // check constraint against it, but a chain repointed by a later rename could
  // still land here, so it is refused rather than served.
  if (normalizePath(rule.destination) === normalizePath(pathname)) {
    return null;
  }

  return { destination: rule.destination, statusCode: rule.statusCode };
}
