import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Agar manualChunks xato berayotgan bo'lsa, uni olib tashlang
    // yoki faqat juda katta fayllarni ajrating:
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js']
          // vendor'ni bitta qilib qoldiramiz, custom funksiyani olib tashlang
        }
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true, // ES va CommonJS aralash qatlamlarni to'g'irlaydi
    }
  }
});
