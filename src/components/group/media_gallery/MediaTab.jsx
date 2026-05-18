// ==========================================
// MediaTab.jsx — Rasmlar va Videolar galereyasi
// ==========================================
// - 3 ustunli grid (Telegram kabi)
// - Rasm: to'liq ekranda ochish (lightbox)
// - Video: inline player overlay
// - Lazy loading
// - Yuklanish skeleton
// ==========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../config/supabaseClient';
import { Play, X, ChevronLeft, ChevronRight, Download, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMessageTime } from '../../../utils/formatters';

const GROUP_ID = import.meta.env.VITE_GROUP_ID;

// ==========================================
// LIGHTBOX — To'liq ekran ko'rish
// ==========================================
const Lightbox = ({ items, startIndex, onClose }) => {
  const [current, setCurrent] = useState(startIndex);
  const item = items[current];

  // Klaviatura navigatsiyasi
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  setCurrent((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setCurrent((i) => Math.min(items.length - 1, i + 1));
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length, onClose]);

  if (!item) return null;

  const isVideo = item.message_type === 'video';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)' }}
    >
      {/* Backdrop bosish — yopish */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Yopish tugmasi */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
      >
        <X size={20} />
      </button>

      {/* Navigatsiya: chap */}
      {current > 0 && (
        <button
          onClick={() => setCurrent((i) => i - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Navigatsiya: o'ng */}
      {current < items.length - 1 && (
        <button
          onClick={() => setCurrent((i) => i + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Media */}
      <motion.div
        key={current}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={item.file_url}
            controls
            autoPlay
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
          />
        ) : (
          <img
            src={item.file_url}
            alt={item.file_name ?? ''}
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
            draggable={false}
          />
        )}
      </motion.div>

      {/* Pastda: sana + yuklab olish */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        <span className="text-xs text-white/50">{formatMessageTime(item.created_at)}</span>
        <a
          href={item.file_url}
          download={item.file_name}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
        >
          <Download size={14} />
        </a>
      </div>

      {/* Sahifa raqami */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/40 z-10">
        {current + 1} / {items.length}
      </div>
    </motion.div>
  );
};

// ==========================================
// SKELETON
// ==========================================
const GridSkeleton = () => (
  <div className="grid grid-cols-3 gap-0.5 p-0.5">
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="aspect-square bg-white/6 animate-pulse" />
    ))}
  </div>
);

// ==========================================
// ASOSIY KOMPONENT
// ==========================================
const MediaTab = () => {
  const [items, setItems]       = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('messages')
        .select('id, file_url, file_name, message_type, created_at, mime_type')
        .eq('group_id', GROUP_ID)
        .eq('is_deleted_for_all', false)
        .in('message_type', ['image', 'video'])
        .order('created_at', { ascending: false })
        .limit(120);

      setItems(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (isLoading) return <GridSkeleton />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
          <ZoomIn size={22} className="text-slate-600" />
        </div>
        <p className="text-sm text-slate-500">Rasm va video yo'q</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {items.map((item, idx) => {
          const isVideo = item.message_type === 'video';
          return (
            <button
              key={item.id}
              onClick={() => setLightboxIdx(idx)}
              className="relative aspect-square overflow-hidden bg-white/5 group"
            >
              {isVideo ? (
                <>
                  <video
                    src={item.file_url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
                      <Play size={16} fill="white" className="text-white ml-0.5" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={item.file_url}
                  alt={item.file_name ?? ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox
            items={items}
            startIndex={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default MediaTab;