import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/env/client";

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
