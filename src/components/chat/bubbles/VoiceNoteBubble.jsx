// ==========================================
// VoiceNoteBubble.jsx — Ovozli xabar (Voice Note)
// ==========================================
// - To'lqin (waveform) animatsiyasi
// - Play / Pause tugmasi
// - Davomiylik va joriy vaqt
// - Telegram uslubidagi minimalist dizayn
// ==========================================

import { useState, useRef, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Play, Pause, Mic } from 'lucide-react';
import BaseBubble from './BaseBubble';
import { formatDuration } from '../../../utils/formatters';

// ==========================================
// WAVEFORM — Soxta to'lqin chiziqlar
// Haqiqiy audio analiz qilish o'rniga
// deterministik tasodifiy balandliklar (seed asosida)
// ==========================================
const Waveform = ({ progress = 0, isMe, messageId }) => {
  const BAR_COUNT = 32;

  // Har bir message uchun bir xil (qayta render da o'zgarmasin)
  const bars = useMemo(() => {
    const heights = [];
    let seed = messageId
      ? messageId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      : 42;

    for (let i = 0; i < BAR_COUNT; i++) {
      // LCG — oddiy pseudo-random
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      const h = 20 + (Math.abs(seed) % 60); // 20px – 80px oralig'ida
      heights.push(h);
    }
    return heights;
  }, [messageId]);

  return (
    <div className="flex items-center gap-[2px] h-10">
      {bars.map((h, i) => {
        const ratio = i / BAR_COUNT;
        const isPlayed = ratio < progress;

        return (
          <div
            key={i}
            className="rounded-full transition-colors duration-100"
            style={{
              width: 2.5,
              height: `${h}%`,
              minHeight: 3,
              background: isPlayed
                ? isMe ? 'rgba(255,255,255,0.9)' : '#60a5fa'
                : isMe ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
            }}
          />
        );
      })}
    </div>
  );
};

// ==========================================
// VOICE PLAYER
// ==========================================
const VoicePlayer = ({ url, duration: msgDuration, isMe, messageId }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]     = useState(msgDuration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onMeta    = () => setDuration(audio.duration || msgDuration || 0);
    const onTime    = () => setCurrentTime(audio.currentTime);
    const onEnded   = () => { setIsPlaying(false); setCurrentTime(0); };

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [url, msgDuration]);

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

  // Waveform bosilganda seek
  const handleWaveformClick = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const displayTime = isPlaying || currentTime > 0 ? currentTime : duration;

  return (
    <div className="px-3 pt-2.5 pb-0 flex items-center gap-3 min-w-[220px] max-w-[280px]">
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Mikrofon ikonkasi + Play */}
      <div className="relative shrink-0">
        <div
          className={[
            'w-10 h-10 rounded-full flex items-center justify-center',
            'transition-all duration-150 active:scale-90 cursor-pointer',
            isMe
              ? 'bg-white/20 hover:bg-white/30'
              : 'bg-blue-500/20 hover:bg-blue-500/30',
          ].join(' ')}
          onClick={togglePlay}
        >
          {isPlaying
            ? <Pause  size={17} fill="currentColor" className={isMe ? 'text-white' : 'text-blue-400'} />
            : <Play   size={17} fill="currentColor" className={`ml-0.5 ${isMe ? 'text-white' : 'text-blue-400'}`} />
          }
        </div>
        {/* Mikrofon belgisi (pastda kichkina) */}
        <div
          className={[
            'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center',
            isMe ? 'bg-blue-600' : 'bg-[#1a1f35]',
          ].join(' ')}
        >
          <Mic size={9} className="text-white" />
        </div>
      </div>

      {/* Waveform + vaqt */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div
          className="cursor-pointer"
          onClick={handleWaveformClick}
        >
          <Waveform progress={progress} isMe={isMe} messageId={messageId} />
        </div>

        <span className={`text-[11px] tabular-nums font-medium ${isMe ? 'text-white/60' : 'text-slate-500'}`}>
          {formatDuration(displayTime)}
        </span>
      </div>
    </div>
  );
};

// ==========================================
// WRAPPER
// ==========================================
const VoiceNoteBubble = (props) => {
  // isMe ni BaseBubble ichidan olib, VoicePlayer ga uzatish uchun
  // currentUser bilan taqqoslaymiz
  const { message } = props;
  const currentUser = useSelector((s) => s.auth.user);
  const isMe = message?.user_id === currentUser?.id;

  return (
    <BaseBubble
      {...props}
    >
      <VoicePlayer
        url={message.file_url}
        duration={message.duration}
        isMe={isMe}
        messageId={message.id}
      />
    </BaseBubble>
  );
};

export default VoiceNoteBubble;