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
      <BaseBubble {...props}>
        <div 
          className="relative flex flex-col cursor-pointer group rounded-xl overflow-hidden select-none"
          onClick={() => setShowViewer(true)}
          onContextMenu={(e) => e.preventDefault()}
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
            <div className="px-3 py-2 text-[15px] text-white/90 break-words bg-[#1c1c1e]">
              {message.content}
            </div>
          )}
        </div>
      </BaseBubble>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {showViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4"
            onClick={() => setShowViewer(false)}
          >
            {/* Rasm va tugmalar konteyneri (Rasm atrofida "yopishtirilgan" tugmalar) */}
            <div 
              className="relative inline-block max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()} 
            >
              <img
                src={message.file_url}
                alt="Full view"
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />

              {/* TUGMALAR: Rasmni o'ziga yopishtirilgan */}
              <div className="absolute -top-3 -right-3 flex gap-2">
                {/* Yopish */}
                <button 
                  onClick={() => setShowViewer(false)}
                  className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-all active:scale-90 border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="absolute -bottom-3 -left-3">
                {/* Yuklab olish */}
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-all active:scale-90 shadow-lg border border-white/10"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageBubble;
