// ==========================================
// AudioBubble.jsx — Oddiy audio fayl player
// ==========================================
// - Play / Pause tugmasi
// - Progress bar (bosilishi mumkin)
// - Vaqt ko'rsatkichi
// - Fayl nomi va hajmi
// ==========================================

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music } from 'lucide-react';
import BaseBubble from './BaseBubble';
import { formatDuration, formatFileSize } from '../../../utils/formatters';

// ==========================================
// AUDIO PLAYER
// ==========================================
const AudioPlayer = ({ url, fileName, fileSize, isMe }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Metadata yuklanganda
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [url]);

  // Play / Pause
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      await audio.play();
      setIsPlaying(true);
    }
  };

  // Progress bar bosilganda seek
  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="px-3 pt-2.5 pb-0 flex flex-col gap-2 min-w-[220px]">
      {/* Audio element (yashirin) */}
      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play/Pause tugmasi */}
        <button
          onClick={togglePlay}
          className={[
            'w-9 h-9 rounded-full shrink-0 flex items-center justify-center',
            'transition-all duration-150 active:scale-90',
            isMe
              ? 'bg-white/20 hover:bg-white/30 text-white'
              : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400',
          ].join(' ')}
        >
          {isPlaying
            ? <Pause size={16} fill="currentColor" />
            : <Play size={16} fill="currentColor" className="ml-0.5" />
          }
        </button>

        {/* Progress va vaqt */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          {/* Progress bar */}
          <div
            className="relative h-1.5 rounded-full overflow-hidden cursor-pointer"
            style={{ background: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }}
            onClick={handleSeek}
          >
            <div
              className={[
                'absolute left-0 top-0 h-full rounded-full transition-all duration-100',
                isMe ? 'bg-white' : 'bg-blue-400',
              ].join(' ')}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Vaqt va fayl nomi */}
          <div className="flex items-center justify-between">
            <span className={`text-[11px] tabular-nums ${isMe ? 'text-white/60' : 'text-slate-500'}`}>
              {formatDuration(isPlaying || currentTime > 0 ? currentTime : duration)}
            </span>
            {fileSize && (
              <span className={`text-[11px] ${isMe ? 'text-white/40' : 'text-slate-600'}`}>
                {formatFileSize(fileSize)}
              </span>
            )}
          </div>
        </div>

        {/* Musiqa ikonkasi */}
        <Music size={14} className={isMe ? 'text-white/40' : 'text-slate-600'} />
      </div>

      {/* Fayl nomi */}
      {fileName && (
        <p className={`text-[11px] truncate ${isMe ? 'text-white/50' : 'text-slate-500'}`}>
          {fileName}
        </p>
      )}
    </div>
  );
};

// ==========================================
// WRAPPER
// ==========================================
const AudioBubble = () => {
  const isMe = false; // BaseBubble ichida aniqlanadi, bu yerda style uchun keraksiz
  const { message } = props;
  return (
    <BaseBubble
    {...props}
    >
      <AudioPlayer
        url={message.file_url}
        fileName={message.file_name}
        fileSize={message.file_size}
        duration={message.duration}
        isMe={false}
      />
    </BaseBubble>
  );
};

export default AudioBubble;