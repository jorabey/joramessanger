// pages/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MessageSquare } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0f1120 0%, #161828 60%, #1a1f35 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <p className="text-8xl font-black text-white/5 select-none mb-2">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Sahifa topilmadi</h1>
        <p className="text-sm text-slate-500 mb-8">Siz qidirayotgan sahifa mavjud emas yoki o'chirilgan.</p>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 text-slate-300 text-sm font-semibold transition-all border border-white/10"
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