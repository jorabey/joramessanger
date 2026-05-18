import { createClient } from '@supabase/supabase-js';

// .env faylidan URL va KEY ni olamiz (Vite ishlatayotgan bo'lsangiz import.meta.env orqali olinadi)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Xatolikni oldini olish uchun tekshiruv (agar .env to'ldirilmagan bo'lsa konsolga yozadi)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Diqqat: Supabase URL yoki Anon Key topilmadi! Iltimos, .env faylini tekshiring.");
}

// Barcha joyda ishlatish uchun supabase obyektini eksport qilamiz
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Foydalanuvchi tizimdan chiqib ketmaguncha sessiyani saqlaydi
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});