import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create real client or mock for development
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      auth: {
        signInWithOtp: async () => ({ error: new Error("Supabase не настроен. Добавь ключи в .env.local") }),
        verifyOtp: async () => ({ error: new Error("Supabase не настроен"), data: null }),
        signInWithOAuth: async () => ({ error: new Error("Supabase не настроен"), data: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
      },
    } as unknown as SupabaseClient);
