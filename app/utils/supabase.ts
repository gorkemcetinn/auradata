import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are missing.\n" +
        "Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment."
    );
  }

  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",         // token URL'de asla görünmez
      detectSessionInUrl: true, // callback'teki code'u otomatik işle
    },
  });

  return _client;
}

// Proxy: mevcut `supabase.from(...)` kullanımları değişmeden çalışır
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});