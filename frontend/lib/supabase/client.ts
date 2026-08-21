import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/config/env";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client, authenticated with the publishable key.
 *
 * Only ever used by Client Components that need realtime or auth state.
 * Reads go through repositories on the server — AI_ENGINEERING_GUIDE.md §18.
 *
 * Typed from the live schema. Regenerate after every migration:
 * `npx supabase gen types typescript --linked --schema public > types/database.ts`
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
