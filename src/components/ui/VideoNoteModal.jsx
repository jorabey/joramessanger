import React, { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SwitchCamera } from 'lucide-react';
import { formatDuration } from '../../utils/formatters';

const VideoNoteModal = ({ stream, isRecording, duration, onFlip }) => {
  const videoRef = useRef(null);

  const isSelfie = useMemo(() => {
    if (!stream) return true;
    const track = stream.getVideoTracks()[0];
    const settings = track?.getSettings();
    return settings?.facingMode === 'user' || !settings?.facingMode;
  }, [stream]);

  useEffect(() => {
    let isMounted = true;
    const setupVideo = async () => {
      if (stream && videoRef.current && isMounted) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play(); 
        } catch (err) {
          console.error(err);
        }
      }
    };
    setupVideo();
    return () => { 
      isMounted = false; 
      if (videoRef.current) videoRef.current.srcObject = null; 
    };
  }, [stream]);

  if (!isRecording) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-[1] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto"
    >
      <div className="relative">
        <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full overflow-hidden border-[5px] border-[#007aff] shadow-[0_0_50px_rgba(0,122,255,0.4)] bg-[#1c1c1e]">
          {!stream && (
            <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs animate-pulse">
              Yuklanmoqda...
            </div>
          )}
          
          <video
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            webkit-playsinline="true"
            className={`w-full h-full object-cover transition-transform duration-500 ${isSelfie ? 'scale-x-[-1]' : 'scale-x-1'}`}
          />
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-xl px-3 py-1.5 rounded-full text-white font-bold text-[13px] tracking-wide shadow-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            {formatDuration(duration)}
          </div>
        </div>

       
      </div>
    </motion.div>
  );
};

export default VideoNoteModal;