// ==========================================
// VideoBubble.jsx — Oddiy to'rtburchak video xabari
// ==========================================
// - Thumbnail (birinchi kadr) avtomatik
// - Play overlay (hover da chiqadi)
// - Inline player (bosganda sahifadan tashqariga chiqmaydi)
// - To'liq ekran tugmasi
// - Ovoz va davomiylik ko'rsatkichi
// - BaseBubble wrapper
//
// ESLATMA: VideoNoteBubble = yumaloq (Telegram kabi)
//          VideoBubble     = to'rtburchak oddiy video
// ==========================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import BaseBubble from './BaseBubble';
import { formatDuration } from '../../../utils/formatters';
import { useSelector } from 'react-redux';

// ==========================================
// VIDEO PLAYER KOMPONENTI
// ==========================================
const VideoPlayer = ({ url, fileName, fileSize, duration: msgDuration, isMe }) => {
  const videoRef  = useRef(null);
  const wrapRef   = useRef(null);

  const [isPlaying,     setIsPlaying]     = useState(false);
  const [isMuted,       setIsMuted]       = useState(false);
  const [currentTime,   setCurrentTime]   = useState(0);
  const [duration,      setDuration]      = useState(msgDuration || 0);
  const [showControls,  setShowControls]  = useState(false);
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [isLoaded,      setIsLoaded]      = useState(false);

  // Mudd bo'yicha hisoblash
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayTime = isPlaying || currentTime > 0 ? currentTime : duration;

  // ---- Event listeners ----
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onMeta    = () => { setDuration(video.duration || msgDuration || 0); setIsLoaded(true); };
    const onTime    = () => setCurrentTime(video.currentTime);
    const onEnded   = () => { setIsPlaying(false); setCurrentTime(0); };
    const onWaiting = () => {};

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('ended', onEnded);

    // Fullscreen change
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);

    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('ended', onEnded);
      document.removeEventListener('fullscreenchange', onFSChange);
    };
  }, [url, msgDuration]);

  // ---- Play / Pause ----
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

  // ---- Ovoz ----
  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // ---- Progress seek ----
  const handleSeek = useCallback((e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * duration;
  }, [duration]);

  // ---- To'liq ekran ----
  const handleFullscreen = useCallback((e) => {
    e.stopPropagation();
    const container = wrapRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // ---- Rang moslashuvi ----
  const controlBg    = 'bg-black/50 backdrop-blur-sm';
  const progressFill = isMe ? '#fff' : '#60a5fa';

  return (
    <div className="px-0 pt-0 pb-0">
      {/* ---- Video wrapper ---- */}
      <div
        ref={wrapRef}
        className="relative overflow-hidden bg-black cursor-pointer select-none"
        style={{ borderRadius: '14px 14px 0 0', maxWidth: 280, aspectRatio: '16/9' }}
        onClick={togglePlay}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Video elementi */}
        <video
          ref={videoRef}
          src={url}
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />

        {/* ---- Play/Pause overlay ---- */}
        <div
          className={[
            'absolute inset-0 flex items-center justify-center',
            'transition-opacity duration-200',
            isPlaying && !showControls ? 'opacity-0' : 'opacity-100',
          ].join(' ')}
        >
          {/* Gradient overlay (faqat to'xtatilganda) */}
          {(!isPlaying || showControls) && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          )}

          {/* Katta play tugmasi — faqat to'xtatilganda yoki hover da */}
          <div
            className={[
              'relative z-10 w-14 h-14 rounded-full flex items-center justify-center',
              controlBg,
              'transition-all duration-200',
              isPlaying && !showControls ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
            ].join(' ')}
          >
            {isPlaying
              ? <Pause  size={22} fill="white" className="text-white" />
              : <Play   size={22} fill="white" className="text-white ml-0.5" />
            }
          </div>
        </div>

        {/* ---- Boshlanishdan oldin: davomiylik ko'rsatkichi ---- */}
        {!isPlaying && !isLoaded && msgDuration && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className={`text-[11px] font-semibold text-white/80 ${controlBg} px-2 py-0.5 rounded-full`}>
              {formatDuration(msgDuration)}
            </span>
          </div>
        )}

        {/* ---- Nazorat paneli (hover da yoki o'ynatilayotganda) ---- */}
        {(showControls || isPlaying) && (
          <div
            className="absolute bottom-0 left-0 right-0 z-10 px-2 pb-2 pt-6"
            style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress bar */}
            <div
              className="relative h-1 rounded-full cursor-pointer mb-2 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.2)' }}
              onClick={handleSeek}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-100"
                style={{ width: `${progress}%`, background: progressFill }}
              />
            </div>

            {/* Nazorat tugmalari qatori */}
            <div className="flex items-center justify-between">
              {/* Chap: vaqt */}
              <span className="text-[11px] text-white/70 tabular-nums font-medium">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </span>

              {/* O'ng: ovoz + to'liq ekran */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className={`w-6 h-6 rounded-full ${controlBg} flex items-center justify-center text-white hover:bg-black/70 transition-colors`}
                >
                  {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
                <button
                  onClick={handleFullscreen}
                  className={`w-6 h-6 rounded-full ${controlBg} flex items-center justify-center text-white hover:bg-black/70 transition-colors`}
                >
                  <Maximize2 size={11} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---- Pastda: fayl nomi (ixtiyoriy) ---- */}
      {fileName && (
        <div className="px-3 py-1">
          <p className={`text-[11px] truncate ${isMe ? 'text-white/50' : 'text-slate-500'}`}>
            {fileName}
          </p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// WRAPPER (BaseBubble bilan)
// ==========================================
const VideoBubble = (props) => {
  const { message } = props;
  const currentUser = useSelector((s) => s.auth.user);
  const isMe = message?.user_id === currentUser?.id;

  return (
    <BaseBubble
    {...props}
    >
      <VideoPlayer
        url={message.file_url}
        fileName={message.file_name}
        fileSize={message.file_size}
        duration={message.duration}
        isMe={isMe}
      />
    </BaseBubble>
  );
};

export default VideoBubble;

// ==========================================
// ISHLATILISHI (USAGE):
// ==========================================
// <VideoBubble
//   message={message}
//   onDelete={deleteMessage}
//   onReact={toggleReaction}
//   totalMembers={totalMembers}
//   showAvatar={showAvatar}
//   showName={showName}
// />