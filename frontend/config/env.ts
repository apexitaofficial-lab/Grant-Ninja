import { z } from "zod";

/**
 * Environment validation.
 *
 * AI_ENGINEERING_GUIDE.md §20 — every variable is validated and the process
 * fails immediately rather than running with a missing secret.
 *
 * Naming follows Supabase's current API key model: a `publishable` key for the
 * browser and a `secret` key for the server. These replace the legacy
 * `anon` / `service_role` JWTs.
 *
 * Client variables are inlined by Next.js at build time, so each one must be
 * referenced as a literal `process.env.NEXT_PUBLIC_*` expression. The secret
 * key is only read through `getServerEnv()`, which keeps it out of the browser
 * bundle.
 */

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_SITE_URL: z.url("NEXT_PUBLIC_SITE_URL must be a valid URL"),
  NEXT_PUBLIC_SITE_NAME: z.string().min(1, "NEXT_PUBLIC_SITE_NAME is required"),
});

/**
 * There is no Gemini key here on purpose.
 *
 * Every AI call happens in the Python pipeline, which holds its own key. The
 * frontend never talks to Gemini, so requiring the key here would fail the
 * deploy without it and put a second copy of an AI credential on the hosting
 * platform for nothing.
 */
const serverEnvSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1, "SUPABASE_SECRET_KEY is required"),

  /**
   * Email (Resend). Optional on purpose.
   *
   * A contact message is saved to the database before any email is attempted,
   * so email is a notification, not the record. Requiring these would stop the
   * whole site booting over a feature that only makes an existing message
   * arrive faster — and would block local development for anyone without a
   * Resend account.
   *
   * With them unset, the form still works and the message is still stored; a
   * warning is logged once per send instead.
   */
  RESEND_API_KEY: z.string().optional(),
  /**
   * Must be an address on a domain verified in Resend. Until a domain is
   * verified, Resend only accepts `onboarding@resend.dev`, and only delivers
   * to the account owner's own address.
   */
  RESEND_FROM_EMAIL: z.email().optional(),
  /** Where contact form notifications are delivered. */
  CONTACT_NOTIFICATION_EMAIL: z.email().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function parseOrThrow<T>(schema: z.ZodType<T>, source: unknown, scope: string): T {
  const result = schema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Invalid ${scope} environment configuration:\n${issues}\n\n` +
        `Copy .env.example to .env.local and provide the missing values.`,
    );
  }

  return result.data;
}

export const clientEnv: ClientEnv = parseOrThrow(
  clientEnvSchema,
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  },
  "client",
);

/**
 * A production deployment still pointing at localhost is quietly catastrophic.
 *
 * `NEXT_PUBLIC_SITE_URL` feeds `metadataBase`, so it becomes every canonical
 * tag, every `og:url`, every JSON-LD `@id`, the sitemap and robots.txt. Left at
 * its `.env.example` default it tells search engines the entire catalogue lives
 * on a machine they cannot reach — while the site itself renders perfectly and
 * no build, test or lint fails.
 *
 * Keyed on Vercel's own environment rather than NODE_ENV, which is also
 * "production" for a local `next build` and would break that for no reason.
 */
if (process.env.VERCEL_ENV === "production") {
  const { hostname } = new URL(clientEnv.NEXT_PUBLIC_SITE_URL);

  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL is "${clientEnv.NEXT_PUBLIC_SITE_URL}" in a production deployment.\n\n` +
        `Canonical URLs, og:url, JSON-LD, the sitemap and robots.txt are all built from it, so ` +
        `this would publish the site telling search engines it lives on localhost.\n\n` +
        `Set it to the public origin in the Vercel project's environment variables (Production ` +
        `scope), then redeploy — NEXT_PUBLIC_* values are inlined at build time, so changing the ` +
        `variable without a rebuild does not update an existing deployment.`,
    );
  }
}

/**
 * Server-only secrets. Never import this from a Client Component — doing so
 * would pull the Supabase secret key into the browser bundle.
 */
export function getServerEnv(): ServerEnv {
  return parseOrThrow(
    serverEnvSchema,
    {
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
      CONTACT_NOTIFICATION_EMAIL: process.env.CONTACT_NOTIFICATION_EMAIL,
    },
    "server",
  );
}
