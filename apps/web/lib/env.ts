/**
 * Public Supabase env (safe to expose to the browser — anon key + URL only).
 * The service-role key is read server-side in later stages, never here.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy apps/web/.env.example to apps/web/.env.local and fill in your Supabase project values.",
    );
  }
  return { url, anonKey };
}
