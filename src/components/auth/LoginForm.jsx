import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Eye, EyeOff, Network } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import toast from 'react-hot-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100dvh');

  const passwordRef = useRef(null);

  // ----------------------------------------
  // 🔴 1-XATOLIK DAVOLANDI: Ekran Nolga aylanishi himoyasi
  // ----------------------------------------
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        // XAVFSIZLIK: Balandlik 100px dan kichiklashib (yoki 0) bo'lib qolsa uni qutqaramiz
        if (currentHeight > 100) {
          setViewportHeight(`${currentHeight}px`);
        } else {
          setViewportHeight('100dvh');
        }
        window.scrollTo(0, 0); 
      } else {
        setViewportHeight(`${window.innerHeight}px`);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    handleResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const handleIdentifierKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) return toast.error("Ma'lumotlarni to'ldiring");

    setLoading(true);

    const pureLogin = cleanUsername.includes('@') ? cleanUsername.split('@')[0] : cleanUsername;
    const generatedEmail = `${pureLogin}@jora.net`;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_blocked')
        .eq('email', generatedEmail)
        .maybeSingle();

      if (profile && profile.is_blocked === true) {
        toast.error("Ushbu akkaunt administrator tomonidan bloklangan!");
        setLoading(false);
        return; 
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: generatedEmail,
        password: password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        // 🔴 2-XATOLIK DAVOLANDI: dispatch va navigate olib tashlandi
        // App.jsx va useAuth.js bu ishlarni orqa fonda juda toza o'zi bajaradi
        toast.success("Xush kelibsiz!");
      }

    } catch (err) {
      toast.error(err.message || "Login yoki parol noto'g'ri!", { duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 w-full flex flex-col md:flex-row bg-[#000000] overflow-hidden select-none"
      style={{ height: viewportHeight }} 
    >
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-[#0a0a0c] to-[#000000] items-center justify-center border-r border-white/[0.04] relative">
        <div className="absolute top-[-20%] left-[-10%] w-[50dvw] h-[50dvw] bg-[#007aff]/10 blur-[130px] rounded-full pointer-events-none" />
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center z-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-[#007aff] to-[#1d9ffe] rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#007aff]/20 border border-white/10">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 14.84 3.19 17.4 5.09 19.22L4.05 22L7 21C8.5 21.6 10.2 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="white"/>
            </svg>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none">Xush<br/>Kelibsiz</h1>
          <p className="text-slate-500 text-[14px] font-bold mt-4 tracking-widest uppercase">JORA NET Ekotizimi</p>
        </motion.div>
      </div>

      <div className="flex-1 flex flex-col bg-black relative h-full">
        <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.04] bg-black/40 backdrop-blur-3xl shrink-0 z-30">
          <span className="text-[15px] font-black text-white tracking-widest uppercase flex items-center gap-2">
            JORA ID <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          </span>
        </header>

        <main className="flex-1 flex flex-col justify-center px-6 sm:px-16 md:px-20 relative overflow-y-auto custom-scrollbar">
          <div className="max-w-[360px] w-full mx-auto py-8">
            <motion.div 
              initial={{ opacity: 0, x: -16, scale: 0.98 }} 
              animate={{ opacity: 1, x: 0, scale: 1 }} 
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="space-y-8"
            >
              <header className="space-y-2 text-center md:text-left select-none">
                <h2 className="text-[32px] font-black text-white tracking-tight">Kirish</h2>
                <p className="text-slate-500 text-[15px] font-semibold">Tizimga ulanish uchun hisobingiz</p>
              </header>

              <div className="space-y-5">
                <div className="rounded-2xl border border-white/[0.05] overflow-hidden bg-[#161618]/40 backdrop-blur-2xl shadow-inner">
                  <div className="relative border-b border-white/[0.04] flex items-center group">
                    <input 
                      type="text" 
                      autoCorrect="off"
                      autoCapitalize="none"
                      placeholder="Foydalanuvchi nomi" 
                      className="w-full bg-transparent p-4 pr-24 text-[15px] font-semibold outline-none text-white focus:bg-white/[0.02] transition-all"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                      onKeyDown={handleIdentifierKeyDown}
                    />
                    <span className="absolute right-4 text-[11px] font-black text-slate-500 tracking-wider bg-white/[0.02] border border-white/[0.05] px-2.5 py-1 rounded-lg pointer-events-none group-focus-within:text-blue-500 group-focus-within:border-blue-500/20 transition-all">
                      @jora.net
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <input 
                      ref={passwordRef}
                      type={showPass ? "text" : "password"} 
                      placeholder="Parol" 
                      className="w-full bg-transparent p-4 pr-24 text-[15px] font-semibold outline-none text-white focus:bg-white/[0.02] transition-all tracking-wide"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 text-[#007aff] font-bold text-[12px] uppercase tracking-wider active:opacity-50 select-none p-1"
                    >
                      {showPass ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                    </button>
                  </div>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.97 }}
                  disabled={loading}
                  onClick={handleLogin}
                  className="w-full h-14 bg-white hover:bg-neutral-200 text-black text-[15px] font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-white/5 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <><Loader2 className="animate-spin" size={18} /> Tekshirilmoqda...</>
                  ) : (
                    <>Davom etish <ArrowRight size={16} strokeWidth={2.5} /></>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </main>

        <footer className="pb-8 pt-4 px-6 shrink-0 flex flex-col items-center gap-4 select-none">
          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-black uppercase tracking-widest bg-white/[0.01] px-4 py-1.5 rounded-full border border-white/[0.03]">
            <Network size={13} className="text-emerald-500" />
            <span>JORA NET</span>
          </div>
          <div className="h-1 w-24 bg-neutral-800 rounded-full" />
        </footer>
      </div>
    </div>
  );
};

export default Login;
