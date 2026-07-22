const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export const env = Object.freeze({
  supabaseUrl,
  supabaseAnonKey,
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local.",
    );
  }
}
