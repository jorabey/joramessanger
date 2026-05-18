import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Diqqat: Supabase URL yoki Anon Key topilmadi!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // TUZATISH: Mobil brauzerlarda session yo'qolmasligi uchun
    // storage ni aniq ko'rsatamiz. Ba'zi Android/iOS brauzerlar
    // position:fixed + overflow:hidden bo'lganda localStorage ga
    // avtomatik kira olmaydi.
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
  }
});
