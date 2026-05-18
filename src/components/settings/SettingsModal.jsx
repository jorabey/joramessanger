import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, ChevronRight, ShieldCheck, Moon, Sun, Loader2 } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../redux/authSlice';
import PasscodeScreen from '../ui/PasscodeScreen'; 

const SettingsModal = ({ isOpen, onClose }) => {
  const currentUser = useSelector(selectUser);
  const dispatch = useDispatch(); // Agar authSlice orqali yozmoqchi bo'lsangiz

  const [passcodeMode, setPasscodeMode] = useState(null); // 'setup', 'remove', null
  const [loading, setLoading] = useState(false);
  
  // 🔴 1. Parol holatini UI-da darhol ko'rsatish uchun local state
  const [hasPasscode, setHasPasscode] = useState(Boolean(currentUser?.app_passcode));

  // 🔴 2. Dark/Light mode holati
  const [theme, setTheme] = useState(localStorage.getItem('app_theme') || 'dark');

  useEffect(() => {
    // Ekranga boshlang'ich mavzuni qo'llash
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // PAROLNI SAQLASH / O'CHIRISH FUNKSIYASI
  const handlePasscodeSuccess = async (code) => {
    setLoading(true);
    try {
      if (passcodeMode === 'setup') {
        // Parolni o'rnatish
        await supabase.from('profiles').update({ app_passcode: code }).eq('id', currentUser.id);
        setHasPasscode(true); // UI ni darhol o'zgartiramiz
      } else if (passcodeMode === 'remove') {
        // Parolni o'chirish
        await supabase.from('profiles').update({ app_passcode: null }).eq('id', currentUser.id);
        setHasPasscode(false); // UI ni darhol o'zgartiramiz
      }
      setPasscodeMode(null);
    } catch (err) {
      console.error("Parolni saqlashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  // MAVZUNI (THEME) O'ZGARTIRISH FUNKSIYASI
  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    // UI va LocalStorage ni yangilash
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Xohishga ko'ra bazaga ham saqlab qo'yamiz (Boshqa qurilmadan kirganda ham shu theme turishi uchun)
    if (currentUser?.id) {
      await supabase.from('profiles').update({ theme: newTheme }).eq('id', currentUser.id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[360px] bg-[#1c1c1e]/95 backdrop-blur-3xl border border-white/10 rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="text-[18px] font-bold text-white tracking-tight">Sozlamalar</h2>
              <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 active:scale-90 transition-all">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Xavfsizlik bo'limi */}
              <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 text-[12px] font-bold text-slate-400 uppercase tracking-widest bg-white/5">
                  Xavfsizlik
                </div>
                
                <button 
                  onClick={() => setPasscodeMode(hasPasscode ? 'remove' : 'setup')}
                  disabled={loading}
                  className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors ${loading ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors duration-300 ${hasPasscode ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#007aff]/15 text-[#007aff]'}`}>
                      {loading ? <Loader2 size={20} className="animate-spin" /> : hasPasscode ? <ShieldCheck size={20} /> : <Lock size={20} />}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[16px] font-semibold text-white">Ilova paroli</span>
                      <span className={`text-[12px] ${hasPasscode ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {hasPasscode ? 'Yoqilgan' : "O'chirilgan"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-500" />
                </button>
              </div>

              {/* Tashqi ko'rinish bo'limi */}
              <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 text-[12px] font-bold text-slate-400 uppercase tracking-widest bg-white/5">
                  Tashqi ko'rinish
                </div>
                
                <button 
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors duration-300 ${theme === 'dark' ? 'bg-purple-500/15 text-purple-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <span className="text-[16px] font-semibold text-white">Mavzu (Theme)</span>
                  </div>
                  <span className="text-[14px] font-medium text-slate-400 flex items-center gap-1 capitalize">
                    {theme} <ChevronRight size={16} />
                  </span>
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}

      {/* PASSCODE EKRANI (Ulama) */}
      <AnimatePresence>
        {passcodeMode && (
          <PasscodeScreen
            mode={passcodeMode}
            savedPasscode={currentUser?.app_passcode}
            onClose={() => setPasscodeMode(null)}
            onSuccess={handlePasscodeSuccess}
          />
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default SettingsModal;