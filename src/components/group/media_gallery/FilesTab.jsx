// ==========================================
// FilesTab.jsx — Guruh fayllar ro'yxati
// ==========================================
// - Fayl turi ikonkasi va rangi (PDF, Word, Excel...)
// - Fayl nomi, hajmi, sana
// - Yuklab olish tugmasi
// - Infinite scroll (load more)
// ==========================================

import { useState, useEffect } from 'react';
import {
  FileText, FileSpreadsheet, FileArchive,
  File, Download, CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../../config/supabaseClient';
import { formatFileSize, formatMessageTime, truncateText } from '../../../utils/formatters';

const GROUP_ID = import.meta.env.VITE_GROUP_ID;
const PAGE = 30;

// ---- Fayl turi bo'yicha ikonka ----
const getFileStyle = (mime = '', name = '') => {
  const m = mime.toLowerCase();
  const ext = name.split('.').pop()?.toLowerCase() ?? '';

  if (m.includes('pdf') || ext === 'pdf')
    return { Icon: FileText,       color: 'text-red-400',   bg: 'bg-red-500/12',   label: 'PDF' };
  if (m.includes('word') || m.includes('document') || ['doc','docx'].includes(ext))
    return { Icon: FileText,       color: 'text-blue-400',  bg: 'bg-blue-500/12',  label: 'Word' };
  if (m.includes('excel') || m.includes('spreadsheet') || ['xls','xlsx','csv'].includes(ext))
    return { Icon: FileSpreadsheet,color: 'text-green-400', bg: 'bg-green-500/12', label: 'Excel' };
  if (m.includes('zip') || m.includes('rar') || ['zip','rar','7z','tar'].includes(ext))
    return { Icon: FileArchive,    color: 'text-amber-400', bg: 'bg-amber-500/12', label: 'Arxiv' };
  return   { Icon: File,           color: 'text-slate-400', bg: 'bg-slate-500/10', label: ext.toUpperCase() || 'Fayl' };
};

// ---- Bitta fayl qatori ----
const FileRow = ({ item }) => {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone]               = useState(false);
  const { Icon, color, bg, label }    = getFileStyle(item.mime_type, item.file_name ?? '');

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      const res  = await fetch(item.file_url);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = item.file_name ?? 'fayl';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/4 transition-colors rounded-xl">
      {/* Ikonka */}
      <div className={`shrink-0 w-10 h-10 rounded-xl ${bg} flex flex-col items-center justify-center gap-0.5`}>
        <Icon size={16} className={color} strokeWidth={1.8} />
        <span className={`text-[8px] font-bold uppercase ${color} opacity-70`}>{label}</span>
      </div>

      {/* Matn */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate leading-tight">
          {truncateText(item.file_name ?? 'Nomsiz', 32)}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {item.file_size ? formatFileSize(item.file_size) : ''}
          {item.file_size ? ' · ' : ''}
          {formatMessageTime(item.created_at)}
        </p>
      </div>

      {/* Yuklab olish */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="shrink-0 p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/8 transition-all active:scale-90"
      >
        {downloading ? (
          <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        ) : done ? (
          <CheckCircle2 size={15} className="text-green-400" />
        ) : (
          <Download size={15} />
        )}
      </button>
    </div>
  );
};

// ==========================================
// ASOSIY KOMPONENT
// ==========================================
const FilesTab = () => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const load = async (offset = 0) => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('id, file_url, file_name, file_size, mime_type, created_at')
      .eq('group_id', GROUP_ID)
      .eq('is_deleted_for_all', false)
      .in('message_type', ['file', 'audio'])
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
            <div className="w-10 h-10 rounded-xl bg-white/6 animate-pulse shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-3 w-3/4 rounded bg-white/6 animate-pulse" />
              <div className="h-2 w-1/3 rounded bg-white/5 animate-pulse" />
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
          <File size={22} className="text-slate-600" />
        </div>
        <p className="text-sm text-slate-500">Fayllar yo'q</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 py-1 px-1">
      {items.map((item) => <FileRow key={item.id} item={item} />)}

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

export default FilesTab;