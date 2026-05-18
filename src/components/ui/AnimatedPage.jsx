import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, x: 20, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -20, scale: 0.98 }
};

const AnimatedPage = ({ children }) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
      className="w-full h-full absolute inset-0"
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;