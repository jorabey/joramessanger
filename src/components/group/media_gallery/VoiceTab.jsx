// ==========================================
// VoiceTab.jsx — Ovozli va Video xabarlar
// ==========================================
// - voice_note: waveform + player
// - video_note: doira thumbnail + player
// - Davomiylik, yuboruvchi, sana
// - Inline audio playback
// ==========================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Mic, Video } from 'lucide-react';
import { supabase } from '../../../config/supabaseClient';
import { formatDuration, formatMessageTime } from '../../../utils/formatters';

const GROUP_ID = import.meta.env.VITE_GROUP_ID;
const PAGE = 30;

// ---- Mini Waveform (VoiceTab uchun) ----
const MiniWave = ({ progress = 0, messageId }) => {
  const BAR_COUNT = 28;
  const bars = useMemo(() => {
    let seed = messageId
      ? messageId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      : 1;
    return Array.from({ length: BAR_COUNT }, () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return 20 + (Math.abs(seed) % 65);
    });
  }, [messageId]);

  return (
    <div className="flex items-center gap-[2px] h-7 flex-1">
      {bars.map((h, i) => (
        <div
          key={i}
          className="rounded-full transition-colors duration-75"
          style={{
            width: 2,
            height: `${h}%`,
            minHeight: 2,
            background: i / BAR_COUNT < progress
              ? '#60a5fa'
              : 'rgba(255,255,255,0.14)',
          }}
        />
      ))}
    </div>
  );
};

// ---- Voice Note qatori ----
const VoiceRow = ({ item }) => {
  const audioRef = useRef(null);
  const [playing,  setPlaying]  = useState(false);
  const [cur,      setCur]      = useState(0);
  const [dur,      setDur]      = useState(item.duration ?? 0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onMeta  = () => setDur(a.duration || item.duration || 0);
    const onTime  = () => setCur(a.currentTime);
    const onEnded = () => { setPlaying(false); setCur(0); };
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnded);
    };
  }, [item.file_url]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { await a.play(); setPlaying(true); }
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (!a || !dur) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * dur;
  };

  const progress  = dur > 0 ? cur / dur : 0;
  const profile   = item.profiles;
  const name      = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
    : 'Foydalanuvchi';

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/4 transition-colors rounded-xl">
      <audio ref={audioRef} src={item.file_url} preload="metadata" />

      {/* Play tugmasi */}
      <button
        onClick={toggle}
        className="shrink-0 w-10 h-10 rounded-full bg-blue-500/15 hover:bg-blue-500/25 flex items-center justify-center transition-all active:scale-90"
      >
        {playing
          ? <Pause size={16} fill="currentColor" className="text-blue-400" />
          : <Play  size={16} fill="currentColor" className="text-blue-400 ml-0.5" />
        }
      </button>

      {/* Waveform + info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 truncate">{name}</span>
          <span className="text-[10px] text-slate-600 shrink-0">{formatMessageTime(item.created_at)}</span>
        </div>
        <div className="cursor-pointer" onClick={seek}>
          <MiniWave progress={progress} messageId={item.id} />
        </div>
      </div>

      {/* Vaqt */}
      <span className="text-[11px] text-slate-500 tabular-nums shrink-0 font-medium">
        {formatDuration(playing || cur > 0 ? cur : dur)}
      </span>

      {/* Mikrofon belgisi */}
      <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
        <Mic size={11} className="text-blue-400" />
      </div>
    </div>
  );
};

// ---- Video Note qatori ----
const VideoNoteRow = ({ item }) => {
  const [open, setOpen] = useState(false);
  const profile = item.profiles;
  const name    = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
    : 'Foydalanuvchi';

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-white/4 transition-colors rounded-xl cursor-pointer"
        onClick={() => setOpen(true)}
      >
        {/* Doira thumbnail */}
        <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden bg-white/8 relative">
          <video
            src={item.file_url}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
            <Play size={14} fill="white" className="text-white ml-0.5" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate">{name}</p>
          <p className="text-[11px] text-slate-500">
            {item.duration ? formatDuration(item.duration) + ' · ' : ''}
            {formatMessageTime(item.created_at)}
          </p>
        </div>

        <div className="shrink-0 w-6 h-6 rounded-full bg-violet-500/12 flex items-center justify-center">
          <Video size={11} className="text-violet-400" />
        </div>
      </div>

      {/* Video modal */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
          onClick={() => setOpen(false)}
        >
          <video
            src={item.file_url}
            controls
            autoPlay
            className="w-64 h-64 rounded-full object-cover"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

// ==========================================
// ASOSIY KOMPONENT
// ==========================================
const VoiceTab = () => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const load = async (offset = 0) => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('id, file_url, file_name, duration, message_type, created_at, profiles:user_id(first_name, last_name, avatar_url)')
      .eq('group_id', GROUP_ID)
      .eq('is_deleted_for_all', false)
      .in('message_type', ['voice_note', 'video_note'])
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE - 1);

    const rows = data ?? [];
    setItems((p) => offset === 0 ? rows : [...p, ...rows]);
    setHasMore(rows.length === PAGE);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col gap-1 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-white/6 animate-pulse shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-2.5 w-1/3 rounded bg-white/6 animate-pulse" />
              <div className="h-6 w-full rounded bg-white/4 animate-pulse" />
            </div>
            <div className="w-8 h-3 rounded bg-white/5 animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
          <Mic size={22} className="text-slate-600" />
        </div>
        <p className="text-sm text-slate-500">Ovozli xabarlar yo'q</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 py-1 px-1">
      {items.map((item) =>
        item.message_type === 'video_note'
          ? <VideoNoteRow key={item.id} item={item} />
          : <VoiceRow     key={item.id} item={item} />
      )}

      {hasMore && (
        <button
          onClick={() => load(items.length)}
          disabled={loading}
          className="mx-4 mt-2 mb-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/6 transition-all border border-white/8"
        >
          {loading ? 'Yuklanmoqda...' : 'Ko\'proq ko\'rish'}
        </button>
      )}
    </div>
  );
};

export default VoiceTab;