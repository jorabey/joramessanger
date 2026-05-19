import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ fullScreen = false }) => {
  // Ranglar ketma-ketligi: 3 ta ko'k, 1 ta yashil
  const colors = ["bg-blue-900", "bg-blue-600", "bg-blue-400", "bg-green-500"];

  const containerVariants = {
    animate: {
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "linear"
      }
    }
  };

  const dotVariants = {
    animate: {
      scale: [1, 1.4, 1], // Pulsatsiya
      opacity: [0.6, 1, 0.6],
    }
  };

  const dotTransition = {
    duration: 0.8,
    repeat: Infinity,
    ease: "easeInOut",
  };

  const LoaderContent = (
    <motion.div 
      className="relative w-12 h-12"
      variants={containerVariants}
      animate="animate"
    >
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={`absolute w-3 h-3 ${colors[i]} rounded-full`}
          style={{
            // Nuqtalarni 4 ta burchakka joylash
            top: i === 0 || i === 1 ? '0' : 'auto',
            bottom: i === 2 || i === 3 ? '0' : 'auto',
            left: i === 0 || i === 3 ? '0' : 'auto',
            right: i === 1 || i === 2 ? '0' : 'auto',
          }}
          variants={dotVariants}
          animate="animate"
          transition={{ ...dotTransition, delay: i * 0.2 }}
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
