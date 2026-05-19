import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ fullScreen = false, size = 'md' }) => {
  // O'lchamlarni aniqlab olamiz
  const sizeClasses = {
    sm: 'w-4 h-4 border-[2px]',
    md: 'w-6 h-6 border-[2.5px]',
    lg: 'w-10 h-10 border-[3px]',
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  // Full screen rejimida
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#000000] flex items-center justify-center">
        <motion.div
          className={`rounded-full border-white/20 border-t-white ${sizeClasses.lg}`}
          animate={{ rotate: 360 }}
          transition={{ 
            repeat: Infinity, 
            duration: 0.8, 
            ease: "linear" 
          }}
        />
      </div>
    );
  }

  // Kichik rejimda (tugmalar yoki chat ichi uchun)
  return (
    <motion.div
      className={`rounded-full border-white/20 border-t-white ${currentSize}`}
      animate={{ rotate: 360 }}
      transition={{ 
        repeat: Infinity, 
        duration: 0.8, 
        ease: "linear" 
      }}
    />
  );
};

export default Loader;
