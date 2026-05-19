import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ fullScreen = false }) => {
  // Nuqtalar harakati uchun variantlar
  const dotVariants = {
    animate: {
      scale: [1, 1.2, 1], // Pulsatsiya
      opacity: [0.5, 1, 0.5],
      y: [0, -6, 0], // Yuqoriga ko'tarilib tushish effekti
    }
  };

  const dotTransition = {
    duration: 0.8,
    repeat: Infinity,
    ease: "easeInOut",
  };

  const Dots = (
    <div className="flex gap-2 items-center justify-center">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          variants={dotVariants}
          animate="animate"
          // delayni 0.15 ga qo'ydik, shunda ular "bir-birini quvib" harakatlanadi
          transition={{ ...dotTransition, delay: i * 0.15 }} 
          className="w-2.5 h-2.5 bg-white rounded-full"
        />
      ))}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#000000] flex items-center justify-center">
        {Dots}
      </div>
    );
  }

  return Dots;
};

export default Loader;
