import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// We authenticate with Privy, not Supabase Auth — so no cookie/session handling
// is needed. A single browser client is reused across the app.
let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;
  browserClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return browserClient;
}
