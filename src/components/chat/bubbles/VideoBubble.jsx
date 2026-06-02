import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Play } from 'lucide-react';
import BaseBubble from './BaseBubble';

const VideoBubble = (props) => {
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
      a.download = message.file_name || 'video.mp4';
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
        {/* Chat bubble ichidagi ko'rinish */}
        <div 
          className="relative cursor-pointer group rounded-xl overflow-hidden select-none bg-black"
          onClick={() => setShowViewer(true)}
          style={{ width: '280px', aspectRatio: '16/9' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Video ikonka */}
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play size={24} fill="white" className="text-white ml-1" />
            </div>
            {/* "Video" yorlig'i */}
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-[10px] text-white font-bold uppercase tracking-wider">
              Video
            </div>
          </div>
        </div>
        
        {message.content && (
          <div className="px-3 py-2 text-[15px] text-white/90 break-words bg-[#1c1c1e] max-w-[280px]">
            {message.content}
          </div>
        )}
      </BaseBubble>

      {/* Fullscreen Viewer - Telegram Style */}
      <AnimatePresence>
        {showViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black flex flex-col"
          >
            {/* 1. Header (Yopish) */}
            <div className="flex items-center justify-between p-4 z-50">
              <span className="text-white/50 text-sm font-medium ml-2">Video</span>
              <button 
                onClick={() => setShowViewer(false)}
                className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            {/* 2. Video maydoni (Kattaroq va joylashtirilgan) */}
            <div className="flex-1 flex items-center justify-center overflow-hidden p-2">
              <video
                src={message.file_url}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* 3. Footer (Yuklab olish) */}
            <div className="p-6 flex justify-center z-50">
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-3 px-8 py-4 bg-[#007aff] text-white font-bold rounded-2xl shadow-xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
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

export default VideoBubble;
