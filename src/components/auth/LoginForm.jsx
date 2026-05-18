import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/authSlice'; // O'zingizning redux actioningiz
import { ArrowRight, Loader2, ShieldCheck,Eye,EyeOff,Network } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import toast from 'react-hot-toast';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100dvh');

  const passwordRef = useRef(null);

  // ==========================================
  // 🔴 KLAVIATURA CHIQGANDA EKRAN SAKRASHINI DAVOLASH
  // ==========================================
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        // Klaviatura ochilganda oynani aynan ochiq maydon o'lchamiga tenglaydi
        setViewportHeight(`${window.visualViewport.height}px`);
        window.scrollTo(0, 0); // iOS dagi sahifa siljib ketishini to'xtatadi
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

  // ==========================================
  // 🔴 TOZA LOGIN VA FAOL BLOK TEKSHIRUVI
  // ==========================================
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) return toast.error("Ma'lumotlarni to'ldiring");

    setLoading(true);

    // Agar user adashib to'liq email yozsa ham faqat loginini ajratib olamiz
    const pureLogin = cleanUsername.includes('@') ? cleanUsername.split('@')[0] : cleanUsername;
    const generatedEmail = `${pureLogin}@jora.net`;

    try {
      // 1. PRE-AUTH REALTIME GUARD: Supabase Auth'ga so'rov ketishidan avval blokni tekshirish
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_blocked')
        .eq('email', generatedEmail)
        .maybeSingle();

      if (profile && profile.is_blocked === true) {
        toast.error("Ushbu akkaunt administrator tomonidan bloklangan!");
        setLoading(false);
        return; // 🛑 BLOK: Tizimga umuman kiritmaymiz
      }

      // 2. SUPABASE AUTH SIGN IN (Parol cheklovlarisiz toza kirish)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: generatedEmail,
        password: password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        dispatch(setUser({ user: authData.user, session: authData.session }));
        toast.success("Xush kelibsiz!");
        navigate('/chat', { replace: true });
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
      style={{ height: viewportHeight }} // 🔴 Klaviatura hisobiga dynamic moslashuvchi balandlik
    >
      {/* CHAP TOMON: BRANDING GRAPHIC SIDE (Faqat kompyuter va planshetda ko'rinadi) */}
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

      {/* O'NG TOMON: LOGIN CONTROL CENTER (Asosiy Oyna) */}
      <div className="flex-1 flex flex-col bg-black relative h-full">
        
        {/* APPLE UNIFIED BAR */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.04] bg-black/40 backdrop-blur-3xl shrink-0 z-30">
          <span className="text-[15px] font-black text-white tracking-widest uppercase flex items-center gap-2">
            JORA ID <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          </span>
        </header>

        {/* COMPONENT BODY */}
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
                {/* APPLE STYLED COMPACT CONTAINER (Inputlar Bloki) */}
                <div className="rounded-2xl border border-white/[0.05] overflow-hidden bg-[#161618]/40 backdrop-blur-2xl shadow-inner">
                  
                  {/* USERNAME FIELD */}
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

                  {/* PASSWORD FIELD */}
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

                {/* PREMIUM QALIN TUGMA (Siz yuborgan loyihadagi kabi qalin va baquvvat h-14) */}
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

        {/* FOOTER AREA (Xavfsizlik belgisi va pastki qism) */}
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