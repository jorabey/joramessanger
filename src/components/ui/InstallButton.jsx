import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Brauzer PWA o'rnatishga tayyor bo'lganda shu eventni otadi
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Chrome'ning standart taklifini to'xtatamiz
      setDeferredPrompt(e); // O'zimizning tugma uchun saqlab qo'yamiz
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // O'rnatish oynasini chaqiramiz
    deferredPrompt.prompt();
    
    // Foydalanuvchi nima tanlaganini kutamiz
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('🍏 Ilova ornatilmoqda!');
      setDeferredPrompt(null); // Tugmani yashiramiz
    }
  };

  return (
    <AnimatePresence>
      {deferredPrompt && (
        <motion.button
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          onClick={handleInstallClick}
          className="fixed bottom-6 right-6 z-[999999] bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl border border-white/20"
        >
          📲 Ilovani O'rnatish
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default InstallButton;