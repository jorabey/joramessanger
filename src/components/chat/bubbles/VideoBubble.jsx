import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Maximize2, Loader2, Volume2, VolumeX } from 'lucide-react';
import BaseBubble from './BaseBubble';

const VideoViewer = ({ url, onClose }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] bg-black flex items-center justify-center"
      onClick={onClose}
    >
      {/* Yopish tugmasi */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all z-50"
      >
        <X size={24} />
      </button>

      {/* Video pleyer */}
      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <video
          ref={videoRef}
          src={url}
          className="max-w-full max-h-[85vh] object-contain"
          playsInline
          onClick={togglePlay}
        />
        
        {/* Markaziy Play tugmasi */}
        {!isPlaying && (
          <button 
            onClick={togglePlay}
            className="absolute w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
          >
            <Play size={40} fill="white" className="text-white ml-2" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

const VideoBubble = (props) => {
  const { message } = props;
  const [showViewer, setShowViewer] = useState(false);

  return (
    <>
      <BaseBubble {...props}>
        <div 
          className="relative overflow-hidden cursor-pointer group rounded-xl"
          onClick={() => setShowViewer(true)}
          onContextMenu={(e) => e.preventDefault()}
          style={{ maxWidth: 280, WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          {/* Video poster (thumbnail) */}
          <div className="relative aspect-video bg-black flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Play size={20} fill="white" className="text-white ml-1" />
               </div>
            </div>
            {/* Videoni oddiy rasm kabi ko'rsatib turamiz */}
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded-md text-[10px] text-white font-bold uppercase">
              Video
            </div>
          </div>
          
          {message.content && (
            <div className="px-3 py-2 text-[15px] text-white/90 bg-[#1c1c1e]">
              {message.content}
            </div>
          )}
        </div>
      </BaseBubble>

      <AnimatePresence>
        {showViewer && <VideoViewer url={message.file_url} onClose={() => setShowViewer(false)} />}
      </AnimatePresence>
    </>
  );
};

export default VideoBubble;
