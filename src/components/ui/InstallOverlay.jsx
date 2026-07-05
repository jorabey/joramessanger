import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabaseClient';

const LOCAL_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

const InstallOverlay = () => {
  const [visible, setVisible] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [installUrl, setInstallUrl] = useState('');
  const [loading, setLoading] = useState(true);

  const isUpdateNeeded = (remote, local) => {
    const rParts = remote.split('.').map(Number);
    const lParts = local.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((rParts[i] || 0) > (lParts[i] || 0)) return true;
      if ((rParts[i] || 0) < (lParts[i] || 0)) return false;
    }
    return false;
  };

  useEffect(() => {
    const hideUntil = sessionStorage.getItem('jora_install_hide_until');
    if (hideUntil && Date.now() < Number(hideUntil)) {
      setLoading(false);
      return;
    }

    const checkVersionFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('versions')
          .select('version, redirect') // Bazadagi column nomi 'url' ekanligini hisobga oldim
          .eq('active', true)
          .order('version', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;

        if (data && isUpdateNeeded(data.version, LOCAL_VERSION)) {
          setLatestVersion(data.version);
          setInstallUrl(data.redirect);
          setVisible(true);
        }
      } catch (err) {
        console.error("Yangilanishni tekshirishda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };

    checkVersionFromSupabase();
  }, []);

  const handleLater = () => {
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    const deferTime = Date.now() + twoHoursInMs;
    sessionStorage.setItem('jora_install_hide_until', deferTime.toString());
    setVisible(false);
  };

  const handleInstall = () => {
    if (!installUrl) return;

    // URL'dan http/https ni olib tashlaymiz
    const urlWithoutProtocol = installUrl.replace(/^https?:\/\//, '');
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isAndroid) {
      // ANDROID UCHUN:
      // launchFlags=0x10000000 - bu FLAG_ACTIVITY_NEW_TASK degani.
      // Bu tizimga "buni yangi oyna sifatida tashqarida och" deb buyruq beradi.
      const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;launchFlags=0x10000000;end;`;
      
      window.location.href = intentUrl;
    } 
    else if (isIOS) {
      // IOS UCHUN:
      // googlechrome:// sxemasi yordamida ochish
      window.location.href = `googlechrome://${urlWithoutProtocol}`;
      
      // Agar 1 soniya ichida Chrome ochilmasa, oddiy linkni bosadi
      setTimeout(() => {
        window.open(installUrl, '_system');
      }, 1000);
    } 
    else {
      // DESKTOP YOKI BOSHQALAR:
      // _blank - bu PWA rejimida ko'pincha tashqi brauzerni chaqiradi
      window.open(installUrl, '_blank');
    }
  };

  if (loading || !visible) return null;

  return (
    <div className="fixed inset-0 w-full h-full bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-between p-6 md:p-12 z-[999999] select-none animate-fade-in">
        {/* Kontent qismi o'zgarishsiz */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto text-center mt-12">
            <div className="w-24 h-24 rounded-[22%] bg-blue-600 flex items-center justify-center text-white font-black text-4xl mb-6 shadow-2xl shadow-blue-500/20 animate-bounce-subtle">
                <img src="/icon-512.png" alt="Jora" className="w-full h-full rounded-[22%] object-cover" onError={(e) => e.target.style.display = 'none'} />
                <span className="absolute">J</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white mb-2 tracking-tight">Jora Messenger</h1>
            <span className="px-3 py-1 text-[12px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full mb-6">Yangi versiya: {latestVersion}</span>
            <p className="text-[15px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Siz eski versiyadan foydalanmoqdasiz (Hozirgi: {LOCAL_VERSION}). Ilovani eng so'nggi imkoniyatlar bilan ishlatish uchun yangilang.
            </p>
        </div>

        <div className="w-full max-w-sm mx-auto flex flex-col gap-3 mb-4">
            <button onClick={handleInstall} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-[16px] font-bold shadow-lg shadow-blue-600/25 transition-all">O'rnatish</button>
            <button onClick={handleLater} className="w-full py-4 rounded-2xl bg-neutral-200/50 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 active:scale-[0.98] text-neutral-600 dark:text-neutral-400 text-[15px] font-medium transition-all">Keyinroq</button>
        </div>
    </div>
  );
};

export default InstallOverlay;
