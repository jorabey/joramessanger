// ==========================================
// VideoNoteBubble.jsx — Yumaloq videoxabar
// ==========================================
// - Doira shaklidagi video (Telegram uslubi)
// - Play/Pause overlay
// - Davomiylik progress ring
// - Hover da kontrol chiqadi
// ==========================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import BaseBubble from './BaseBubble';
import { formatDuration } from '../../../utils/formatters';
import { useSelector } from 'react-redux';

// ==========================================
// SVG DOIRA PROGRESS
// ==========================================
const CircleProgress = ({ progress = 0, size = 180, stroke = 4, color = '#3b82f6' }) => {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 pointer-events-none"
      style={{ transform: 'rotate(-90deg)' }}
    >
      {/* Orqa (kulrang) halqa */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={stroke}
      />
      {/* Faol progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.1s linear' }}
      />
    </svg>
  );
};

// ==========================================
// VIDEO PLAYER
// ==========================================
const VideoNotePlayer = ({ url, duration: msgDuration, isMe }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [isMuted, setIsMuted]         = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(msgDuration || 0);
  const [showControls, setShowControls] = useState(false);

  const SIZE = 180;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onMeta  = () => setDuration(video.duration || msgDuration || 0);
    const onTime  = () => setCurrentTime(video.currentTime);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('ended', onEnded);
    };
  }, [url, msgDuration]);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      await video.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const progress = duration > 0 ? currentTime / duration : 0;
  const displayTime = isPlaying || currentTime > 0 ? currentTime : duration;
  const progressColor = isMe ? 'rgba(255,255,255,0.9)' : '#60a5fa';

  return (
    <div className="px-2 pt-2 pb-0 flex flex-col items-center gap-1.5">
      {/* Doira video konteyner */}
      <div
        className="relative cursor-pointer select-none"
        style={{ width: SIZE, height: SIZE }}
        onClick={togglePlay}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Video — doira clip */}
        <video
          ref={videoRef}
          src={url}
          playsInline
          preload="metadata"
          loop={false}
          className="w-full h-full object-cover"
          style={{ borderRadius: '50%' }}
        />

        {/* Progress ring */}
        <CircleProgress
          progress={progress}
          size={SIZE}
          stroke={3}
          color={progressColor}
        />

        {/* Play/Pause overlay */}
        <div
          className={[
            'absolute inset-0 flex items-center justify-center rounded-full',
            'transition-opacity duration-200',
            isPlaying && !showControls ? 'opacity-0' : 'opacity-100',
            'bg-black/30',
          ].join(' ')}
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            {isPlaying
              ? <Pause size={20} fill="white" className="text-white" />
              : <Play  size={20} fill="white" className="text-white ml-0.5" />
            }
          </div>
        </div>

        {/* Ovoz tugmasi — pastda o'ngda */}
        {showControls && (
          <button
            onClick={toggleMute}
            className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            {isMuted
              ? <VolumeX size={13} />
              : <Volume2 size={13} />
            }
          </button>
        )}
      </div>

      {/* Vaqt */}
      <span className={`text-[11px] tabular-nums font-medium mb-0.5 ${isMe ? 'text-white/60' : 'text-slate-500'}`}>
        {formatDuration(displayTime)}
      </span>
    </div>
  );
};

// ==========================================
// WRAPPER
// ==========================================
const VideoNoteBubble = (props) => {
  const { message } = props;
  const currentUser = useSelector((s) => s.auth.user);
  const isMe = message?.user_id === currentUser?.id;

  return (
    <BaseBubble
      {...props}
    >
      <VideoNotePlayer
        url={message.file_url}
        duration={message.duration}
        isMe={isMe}
      />
    </BaseBubble>
  );
};

export default VideoNoteBubble;