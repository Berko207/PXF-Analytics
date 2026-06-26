import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getServiceRoleKey } from "@/lib/supabase/env";

/** Server-side Supabase client. Uses anon key by default; pass `admin: true` for service role. */
export function createClient(options?: { admin?: boolean }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (options?.admin) {
    const serviceKey = getServiceRoleKey();
    if (!serviceKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    }
    return createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
