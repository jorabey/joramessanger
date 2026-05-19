import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Loader = ({ type = 'spinner', fullScreen = false, size = 'md', color = 'text-blue-500' }) => {
  const [textIndex, setTextIndex] = useState(0);
  
  // 🟢 Psixologik chalg'ituvchi matnlar (Odamlar buni o'qish bilan band bo'ladi)
  const texts = [
    "Tarmoqqa ulanmoqda...",
    "Shifrlash kalitlari olinmoqda...",
    "Xavfsizlik tekshirilmoqda...",
    "Ma'lumotlar sinxronlanmoqda...",
    "Deyarli tayyor..."
  ];

  useEffect(() => {
    if (!fullScreen) return;
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, 1500); // Har 1.5 soniyada yangi matn chiqadi
    return () => clearInterval(interval);
  }, [fullScreen]);

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#000000] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
        {/* Orqa fondagi ko'k nur (Glow effect) */}
        <div className="absolute w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        {/* Markaziy Animatsiya */}
        <div className="relative flex items-center justify-center w-32 h-32 mb-6">
          {/* Tashqi aylanuvchi uzuq-uzuq chiziq */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute inset-0 border-[2px] border-dashed border-blue-500/30 rounded-full"
          />
          {/* Ichki aylanuvchi gradient chiziq */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-2 border-[3px] border-transparent border-t-cyan-400 border-l-blue-600 rounded-full"
          />
          {/* O'rtadagi yurak urishi kabi pulsatsiya */}
          <motion.div
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.8)]"
          />
        </div>

        {/* Dinamik o'zgaruvchi matnlar */}
        <div className="h-6 relative flex justify-center w-full mt-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={textIndex}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
              className="absolute text-sm font-semibold tracking-[0.15em] text-blue-400 uppercase drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]"
            >
              {texts[textIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Kiber-uslubdagi progress chiziqcha */}
        <div className="mt-12 w-64 h-[2px] bg-white/5 relative overflow-hidden rounded-full">
          <motion.div
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,1)]"
          />
        </div>
      </div>
    );
  }

  // Kichik yuklagichlar (Tugmalar va chat ichi uchun)
  if (type === 'dots') {
    return (
      <div className="flex space-x-1.5 justify-center items-center h-full">
        <div className={`w-2 h-2 ${color.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`w-2 h-2 ${color.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`w-2 h-2 ${color.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
    );
  }

  return (
    <div className={`inline-block animate-spin rounded-full border-[3px] border-solid border-current border-r-transparent align-[-0.125em] ${color} ${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'}`} />
  );
};

export default Loader;
