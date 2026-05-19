import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ fullScreen = false }) => {
  // Samsung dot animatsiyasi uchun sozlamalar
  const dotVariants = {
    animate: {
      scale: [0.5, 1.2, 0.5], // Kichrayib, kattalashadi
      opacity: [0.3, 1, 0.3], // Xiralashib, yorqinlashadi
    }
  };

  const dotTransition = {
    duration: 0.8,
    repeat: Infinity,
    ease: "easeInOut",
  };

  const Dots = (
    <div className="flex gap-2 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          variants={dotVariants}
          animate="animate"
          transition={{ ...dotTransition, delay: i * 0.2 }} // Bir-biridan keyin kelishi
          className="w-3 h-3 bg-white rounded-full"
        />
      ))}
    </div>
  );

  // Fullscreen bo'lsa ekran markaziga qo'yadi
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#000000] flex items-center justify-center">
        {Dots}
      </div>
    );
  }

  // Oddiy holat (button yoki chat ichi)
  return Dots;
};

export default Loader;
