import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export const getSupabaseSession = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session;
});

export const getAuthenticatedUser = cache(async () => {
  const session = await getSupabaseSession();
  return session?.user ?? null;
});
