import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Maximize2 } from 'lucide-react';
import BaseBubble from './BaseBubble';

const ImageBubble = (props) => {
  const { message } = props;
  const [showViewer, setShowViewer] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Rasmni yuklab olish funksiyasi
  const handleDownload = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const response = await fetch(message.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.file_name || 'image.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Yuklashda xatolik:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <BaseBubble {...props}>
        <div 
          className="relative flex flex-col cursor-pointer group"
          onClick={() => setShowViewer(true)}
          onContextMenu={(e) => e.preventDefault()}
          style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          {/* Rasm qismi */}
          <div className="relative overflow-hidden bg-black/10 flex items-center justify-center min-h-[150px] max-h-[300px]">
            <img
              src={message.file_url}
              alt={message.file_name || 'Rasm'}
              className="max-w-[280px] sm:max-w-[320px] w-auto h-auto object-cover pointer-events-none"
              loading="lazy"
              draggable="false"
            />
            {/* Hover bo'lganda chiqadigan "Kattalashtirish" belgisi */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="text-white drop-shadow-md" size={32} />
            </div>
          </div>
          
          {/* Matn qismi */}
          {message.content && (
            <div className="px-3 py-2 text-[15px] leading-[1.3] text-white/90 break-words select-none">
              {message.content}
            </div>
          )}
        </div>
      </BaseBubble>

      {/* Fullscreen Viewer (Telegram uslubida) */}
      <AnimatePresence>
        {showViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-4"
            onClick={() => setShowViewer(false)}
          >
            {/* Close tugmasi */}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowViewer(false); }}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90"
            >
              <X size={24} />
            </button>

            {/* Download tugmasi */}
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="absolute bottom-10 p-4 rounded-full bg-[#007aff] text-white shadow-lg hover:bg-blue-600 transition-all active:scale-90"
            >
              <Download size={24} />
            </button>

            <img
              src={message.file_url}
              alt="Full view"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageBubble;
