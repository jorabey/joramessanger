import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,           // Ochiq yoki yopiqligi (boolean)
  onClose,          // Yopish funksiyasi
  title,            // Modal sarlavhasi (ixtiyoriy)
  children,         // Modalning ichki qismi
  maxWidth = 'md',  // Oyna kengligi (sm, md, lg, xl)
  showCloseBtn = true // Yuqori o'ng burchakdagi 'X' tugmasi
}) => {

  // Kenglik o'lchamlari
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  };

  // ==========================================
  // ESC TUGMASI ORQALI YOPISH
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Orqa fon (body) skroll bo'lib ketmasligi uchun
      document.body.style.overflow = 'hidden'; 
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          
          {/* 1. QORAYTIRILGAN ORQA FON (Qora pardani ustiga bossa ham yopiladi) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 2. ASOSIY MODAL OYNASI */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden`}
            onClick={(e) => e.stopPropagation()} // Oynaning o'zini bossa yopilib ketmasligi uchun
          >
            
            {/* TEPADAGI HEADER QISMI (Agar sarlavha yoki yopish tugmasi bo'lsa) */}
            {(title || showCloseBtn) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                {title ? (
                  <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                ) : <div />}
                
                {showCloseBtn && (
                  <button
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            {/* OYNANING ICHKI TANA QISMI (Scroll bo'lishi mumkin) */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {children}
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;