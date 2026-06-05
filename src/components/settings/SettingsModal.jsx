import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, ChevronRight, ShieldCheck, Moon, Sun, Loader2 } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/authSlice';
import PasscodeScreen from '../ui/PasscodeScreen'; 

const SettingsModal = ({ isOpen, onClose }) => {
  const currentUser = useSelector(selectUser);

  const [passcodeMode, setPasscodeMode] = useState(null); 
  const [loading, setLoading] = useState(false);
  
  const [hasPasscode, setHasPasscode] = useState(Boolean(currentUser?.app_passcode));
  const [theme, setTheme] = useState(localStorage.getItem('app_theme') || 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handlePasscodeSuccess = async (code) => {
    setLoading(true);
    try {
      if (passcodeMode === 'setup') {
        await supabase.from('profiles').update({ app_passcode: code }).eq('id', currentUser.id);
        setHasPasscode(true);
      } else if (passcodeMode === 'remove') {
        await supabase.from('profiles').update({ app_passcode: null }).eq('id', currentUser.id);
        setHasPasscode(false);
      }
      setPasscodeMode(null);
    } catch (err) {
      console.error("Parolni saqlashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[360px] bg-white dark:bg-[#1c1c1e] border border-neutral-200 dark:border-white/10 rounded-[28px] overflow-hidden shadow-2xl transition-colors duration-300"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-white/5 transition-colors">
              <h2 className="text-[18px] font-bold text-neutral-900 dark:text-white tracking-tight">Sozlamalar</h2>
              <button onClick={onClose} className="p-1.5 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-white/70 hover:bg-neutral-200 dark:hover:bg-white/20 active:scale-90 transition-all">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Xavfsizlik bo'limi */}
              <div className="bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 rounded-2xl overflow-hidden transition-colors">
                <div className="px-4 py-2.5 text-[12px] font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-widest bg-neutral-200 dark:bg-white/5 transition-colors">
                  Xavfsizlik
                </div>
                
                <button 
                  onClick={() => setPasscodeMode(hasPasscode ? 'remove' : 'setup')}
                  disabled={loading}
                  className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-neutral-200 dark:hover:bg-white/5 active:bg-neutral-300 dark:active:bg-white/10 transition-colors ${loading ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors duration-300 ${hasPasscode ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/15 text-blue-600 dark:text-[#007aff]'}`}>
                      {loading ? <Loader2 size={20} className="animate-spin" /> : hasPasscode ? <ShieldCheck size={20} /> : <Lock size={20} />}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[16px] font-semibold text-neutral-900 dark:text-white transition-colors">Ilova paroli</span>
                      <span className={`text-[12px] ${hasPasscode ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-slate-400'}`}>
                        {hasPasscode ? 'Yoqilgan' : "O'chirilgan"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-neutral-400 dark:text-slate-500" />
                </button>
              </div>

              {/* Tashqi ko'rinish bo'limi */}
              <div className="bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 rounded-2xl overflow-hidden transition-colors">
                <div className="px-4 py-2.5 text-[12px] font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-widest bg-neutral-200 dark:bg-white/5 transition-colors">
                  Tashqi ko'rinish
                </div>
                
                <button 
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-neutral-200 dark:hover:bg-white/5 active:bg-neutral-300 dark:active:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors duration-300 ${theme === 'dark' ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
                      {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <span className="text-[16px] font-semibold text-neutral-900 dark:text-white transition-colors">Mavzu (Theme)</span>
                  </div>
                  <span className="text-[14px] font-medium text-neutral-500 dark:text-slate-400 flex items-center gap-1 capitalize transition-colors">
                    {theme} <ChevronRight size={16} />
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* PASSCODE EKRANI */}
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
