import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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

      {/* Fullscreen Viewer - Fixed layout */}
      <AnimatePresence>
        {showViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black flex flex-col"
          >
            {/* Header - Yopish tugmasi */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-end z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowViewer(false); }}
                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            {/* Rasm maydoni - Drag va Pan funksiyasi bilan */}
            <motion.div 
              className="flex-1 flex items-center justify-center w-full h-full overflow-hidden"
              drag
              dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
              dragElastic={0.1}
            >
              <img
                src={message.file_url}
                alt="Full view"
                className="max-w-full max-h-[90vh] object-contain cursor-grab active:cursor-grabbing touch-none"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>

            {/* Footer - Yuklab olish */}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 px-8 py-4 bg-[#007aff] text-white font-bold rounded-full shadow-xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
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
