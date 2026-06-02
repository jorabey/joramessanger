import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Maximize2 } from 'lucide-react';
import BaseBubble from './BaseBubble';

const ImageBubble = (props) => {
  const { message } = props;
  const [showViewer, setShowViewer] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
      {/* Asosiy Bubble */}
      <BaseBubble {...props}>
        <div 
          className="relative flex flex-col cursor-pointer group rounded-xl overflow-hidden"
          onClick={() => setShowViewer(true)}
          onContextMenu={(e) => e.preventDefault()}
          style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          <div className="relative flex items-center justify-center bg-black/10 min-h-[150px] max-h-[300px]">
            <img
              src={message.file_url}
              alt="Chat image"
              className="max-w-[280px] sm:max-w-[320px] w-auto h-auto object-cover pointer-events-none"
              loading="lazy"
              draggable="false"
            />
            {/* Hover effekti */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="text-white" size={32} />
            </div>
          </div>
          
          {message.content && (
            <div className="px-3 py-2 text-[15px] text-white/90 break-words select-none bg-[#1c1c1e]">
              {message.content}
            </div>
          )}
        </div>
      </BaseBubble>

      {/* Fullscreen Viewer (Overlay) */}
      <AnimatePresence>
        {showViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex flex-col bg-black/95 backdrop-blur-2xl"
          >
            {/* Header: Faqat Yopish tugmasi */}
            <div className="flex items-center justify-between p-4 z-50">
              <span className="text-white/50 text-sm font-medium ml-2">Rasm</span>
              <button 
                onClick={() => setShowViewer(false)}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            {/* Rasm maydoni: Markazda tiniq ko'rinishi uchun */}
            <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
              <img
                src={message.file_url}
                alt="Full view"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Footer: Yuklab olish tugmasi */}
            <div className="p-6 pb-8 flex justify-center z-50">
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-3 px-10 py-4 bg-[#007aff] text-white font-bold rounded-2xl shadow-[0_10px_20px_rgba(0,122,255,0.3)] hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
              >
                <Download size={20} />
                {isDownloading ? 'Yuklanmoqda...' : 'Yuklab olish'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageBubble;
