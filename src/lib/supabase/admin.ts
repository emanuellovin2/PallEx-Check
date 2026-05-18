import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { SUPABASE_URL, getServiceRoleKey } from "@/lib/config";

// NEVER import this in Client Components — server-side only.
export function createAdminClient() {
  return createClient<Database>(SUPABASE_URL, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
