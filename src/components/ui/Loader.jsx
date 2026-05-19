import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ fullScreen = false }) => {
  // Samsung One UI uchun "yengil" pulsatsiya animatsiyasi
  const dotVariants = {
    animate: {
      scale: [0.8, 1.4, 0.8], // Nuqtalar kattalashib-kichrayadi
      opacity: [0.4, 1, 0.4], // Yorqinlik o'zgaradi
    }
  };

  const dotTransition = {
    duration: 0.9, // Biroz sekinroq va yumshoqroq
    repeat: Infinity,
    ease: "easeInOut",
  };

  const Dots = (
    <div className="flex gap-1.5 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          variants={dotVariants}
          animate="animate"
          // delay: i * 0.15 bu Samsungdagi o'sha "to'lqin" effektini beradi
          transition={{ ...dotTransition, delay: i * 0.15 }} 
          className="w-2.5 h-2.5 bg-white/90 rounded-full"
        />
      ))}
    </div>
  );

  // Fullscreen rejimida ekran markaziga joylash
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#000000] flex items-center justify-center pointer-events-none">
        {Dots}
      </div>
    );
  }

  return Dots;
};

export default Loader;
