/**
 * Declares the environment variables this app reads.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_*` by literal text match, so these
 * must be accessed with dot notation. Declaring them here keeps that legal
 * under `noPropertyAccessFromIndexSignature`.
 *
 * Values are `string | undefined` on purpose — `config/env.ts` is what proves
 * they are actually present.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_SUPABASE_URL?: string;
    readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
    readonly NEXT_PUBLIC_SITE_URL?: string;
    readonly NEXT_PUBLIC_SITE_NAME?: string;
    readonly SUPABASE_SECRET_KEY?: string;
  }
}
