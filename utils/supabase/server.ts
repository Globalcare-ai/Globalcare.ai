import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client for API routes / server components.
// Auth is handled by Privy, so no cookies are involved. Prefer the service-role
// key when present (server-only); fall back to the publishable key.
export function createServerClient(): SupabaseClient {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
