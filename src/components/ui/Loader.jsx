import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ fullScreen = false }) => {
  // Ranglar: 3 ta ko'k (to'qdan ochga), 1 ta yashil
  const colors = ["bg-blue-900", "bg-blue-700", "bg-blue-400", "bg-green-500"];

  // Tashqi konteyner aylanadi
  const containerVariants = {
    animate: {
      rotate: 360,
      transition: { repeat: Infinity, duration: 2, ease: "linear" }
    }
  };

  // Har bir nuqtaning nafas olish (pulsatsiya) animatsiyasi
  const dotVariants = {
    animate: {
      scale: [1, 1.4, 1],
      opacity: [0.6, 1, 0.6],
    }
  };

  const LoaderContent = (
    <motion.div 
      className="relative w-12 h-12 flex items-center justify-center"
      variants={containerVariants}
      animate="animate"
    >
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={`absolute w-3 h-3 ${colors[i]} rounded-full`}
          style={{
            // 4 nuqtani soat strelkasi bo'yicha joylashtirish
            top: i === 0 ? '0%' : i === 2 ? 'auto' : '50%',
            bottom: i === 2 ? '0%' : 'auto',
            left: i === 3 ? '0%' : i === 1 ? 'auto' : '50%',
            right: i === 1 ? '0%' : 'auto',
            transform: 'translate(-50%, -50%)'
          }}
          variants={dotVariants}
          animate="animate"
          transition={{ 
            duration: 1, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: i * 0.25 // Harakatning ketma-ketligi (bir-birini quvishi uchun)
          }}
        />
      ))}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#000000] flex items-center justify-center pointer-events-none">
        {LoaderContent}
      </div>
    );
  }

  return LoaderContent;
};

export default Loader;
