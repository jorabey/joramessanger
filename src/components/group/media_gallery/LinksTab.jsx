// ==========================================
// LinksTab.jsx — Guruhda yuborilgan havolalar
// ==========================================
// - link_metadata dan sarlavha, rasm, domain
// - Telegram "Links" tab uslubi
// - Bosilsa yangi tabda ochiladi
// ==========================================

import { useState, useEffect } from 'react';
import { Link2, ExternalLink } from 'lucide-react';
import { supabase } from '../../../config/supabaseClient';
import { formatMessageTime } from '../../../utils/formatters';

const GROUP_ID = import.meta.env.VITE_GROUP_ID;
const PAGE = 25;

// ---- Bitta havola kartochkasi ----
const LinkCard = ({ item }) => {
  const meta   = item.link_metadata ?? {};
  const url    = meta.url || item.content || '#';
  const title  = meta.title || url;
  const desc   = meta.description ?? '';
  const img    = meta.image_url ?? null;
  const publisher = meta.publisher ?? '';

  let domain = '';
  try { domain = new URL(url).hostname.replace('www.', ''); } catch { domain = url; }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-4 py-3 hover:bg-white/4 transition-colors rounded-xl group no-underline"
    >
      {/* Thumbnail yoki placeholder */}
      <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-white/6 flex items-center justify-center">
        {img ? (
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <Link2 size={20} className="text-slate-600" />
        )}
      </div>

      {/* Matn */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-blue-400 truncate">
          {publisher || domain}
        </p>
        <p className="text-sm font-medium text-slate-200 leading-tight line-clamp-2 mt-0.5">
          {title}
        </p>
        {desc && (
          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{desc}</p>
        )}
        <p className="text-[10px] text-slate-600 mt-1">{formatMessageTime(item.created_at)}</p>
      </div>

      {/* O'ng: tashqi havola ikonkasi */}
      <ExternalLink
        size={14}
        className="shrink-0 text-slate-600 group-hover:text-slate-400 transition-colors mt-0.5"
      />
    </a>
  );
};

// ==========================================
// ASOSIY KOMPONENT
// ==========================================
const LinksTab = () => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const load = async (offset = 0) => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('id, content, link_metadata, created_at')
      .eq('group_id', GROUP_ID)
      .eq('is_deleted_for_all', false)
      .eq('message_type', 'link')
      .not('link_metadata', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE - 1);

    const rows = data ?? [];
    setItems((p) => offset === 0 ? rows : [...p, ...rows]);
    setHasMore(rows.length === PAGE);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Skeleton
  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col gap-1 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <div className="w-14 h-14 rounded-xl bg-white/6 animate-pulse shrink-0" />
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <div className="h-2 w-1/4 rounded bg-white/6 animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-white/8 animate-pulse" />
              <div className="h-2 w-1/2 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
          <Link2 size={22} className="text-slate-600" />
        </div>
        <p className="text-sm text-slate-500">Havolalar yo'q</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 py-1 px-1">
      {items.map((item) => <LinkCard key={item.id} item={item} />)}

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

export default LinksTab;