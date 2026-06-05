// pages/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MessageSquare } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-neutral-950 transition-colors duration-300"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <p className="text-8xl font-black text-neutral-200 dark:text-white/5 select-none mb-2 transition-colors">404</p>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 transition-colors">Sahifa topilmadi</h1>
        <p className="text-sm text-neutral-500 dark:text-slate-400 mb-8 transition-colors">Siz qidirayotgan sahifa mavjud emas yoki o'chirilgan.</p>
        
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all"
          >
            <MessageSquare size={15} />
            Chatga qaytish
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-slate-300 text-sm font-semibold transition-all border border-neutral-300 dark:border-white/10"
          >
            <Home size={15} />
            Bosh sahifa
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
