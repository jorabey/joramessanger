// ==========================================
// FileBubble.jsx — Fayl/Hujjat xabari
// ==========================================
// - Fayl turi bo'yicha ikonka (PDF, Word, Excel, ZIP va h.k.)
// - Fayl nomi (truncate bilan)
// - Hajmi va MIME type
// - Yuklab olish tugmasi
// - BaseBubble wrapper
// ==========================================

import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FileText, FileSpreadsheet, FileArchive,
  File, Download, CheckCircle2,
} from 'lucide-react';
import BaseBubble from './BaseBubble';
import { formatFileSize, truncateText } from '../../../utils/formatters';

// ==========================================
// YORDAMCHI: MIME type bo'yicha ikonka va rang
// ==========================================
const getFileInfo = (mimeType = '', fileName = '') => {
  const mime = mimeType.toLowerCase();
  const ext  = fileName.split('.').pop()?.toLowerCase() ?? '';

  // PDF
  if (mime.includes('pdf') || ext === 'pdf') {
    return {
      icon: FileText,
      color: 'text-red-400',
      bg:    'bg-red-500/15',
      label: 'PDF',
    };
  }

  // Word
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    ['doc', 'docx'].includes(ext)
  ) {
    return {
      icon: FileText,
      color: 'text-blue-400',
      bg:    'bg-blue-500/15',
      label: 'Word',
    };
  }

  // Excel
  if (
    mime.includes('excel') ||
    mime.includes('spreadsheet') ||
    ['xls', 'xlsx', 'csv'].includes(ext)
  ) {
    return {
      icon: FileSpreadsheet,
      color: 'text-green-400',
      bg:    'bg-green-500/15',
      label: 'Excel',
    };
  }

  // Matn
  if (mime.includes('text') || ext === 'txt') {
    return {
      icon: FileText,
      color: 'text-slate-300',
      bg:    'bg-slate-500/15',
      label: 'TXT',
    };
  }

  // Arxiv
  if (
    mime.includes('zip') ||
    mime.includes('rar') ||
    mime.includes('archive') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return {
      icon: FileArchive,
      color: 'text-amber-400',
      bg:    'bg-amber-500/15',
      label: 'Arxiv',
    };
  }

  // Boshqa
  return {
    icon: File,
    color: 'text-slate-400',
    bg:    'bg-slate-500/10',
    label: ext.toUpperCase() || 'Fayl',
  };
};

// ==========================================
// FAYL PLAYER (ichki komponent)
// ==========================================
const FilePlayer = ({ url, fileName, fileSize, mimeType, isMe }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded]   = useState(false);

  const { icon: Icon, color, bg, label } = getFileInfo(mimeType, fileName ?? '');

  // ---- Yuklab olish ----
  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!url || downloading) return;

    setDownloading(true);
    try {
      // fetch orqali blob sifatida yuklab, <a> trigger qilamiz
      const res  = await fetch(url);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href     = href;
      a.download = fileName ?? 'fayl';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Yuklab olish xatoligi:', err);
    } finally {
      setDownloading(false);
    }
  };

  const displayName = truncateText(fileName ?? 'Nomsiz fayl', 28);

  // ---- Rang moslashuvi: isMe bo'lsa oq ——-
  const metaColor   = isMe ? 'text-white/50'  : 'text-slate-500';
  const nameColor   = isMe ? 'text-white/90'  : 'text-slate-100';
  const btnBg       = isMe
    ? 'bg-white/15 hover:bg-white/25 text-white'
    : 'bg-white/8 hover:bg-white/14 text-slate-300 hover:text-white';

  return (
    <div className="px-3 pt-2.5 pb-0 min-w-[220px] max-w-[280px]">
      <div className="flex items-center gap-3">

        {/* ---- Fayl ikonkasi ---- */}
        <div className={`shrink-0 w-11 h-11 rounded-xl ${bg} flex flex-col items-center justify-center gap-0.5`}>
          <Icon size={18} className={color} strokeWidth={1.8} />
          <span className={`text-[8px] font-bold uppercase tracking-wide ${color} opacity-80`}>
            {label}
          </span>
        </div>

        {/* ---- Matn qismi ---- */}
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          <span
            className={`text-sm font-medium leading-tight ${nameColor}`}
            title={fileName}
          >
            {displayName}
          </span>
          <span className={`text-[11px] ${metaColor}`}>
            {fileSize ? formatFileSize(fileSize) : ''}
            {fileSize && mimeType ? ' · ' : ''}
            {mimeType ? label : ''}
          </span>
        </div>

        {/* ---- Yuklab olish tugmasi ---- */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          title="Yuklab olish"
          className={[
            'shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
            'transition-all duration-150 active:scale-90',
            btnBg,
            downloading ? 'opacity-60 cursor-wait' : '',
          ].join(' ')}
        >
          {downloading ? (
            /* Mini spinner */
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : downloaded ? (
            <CheckCircle2 size={16} className="text-green-400" />
          ) : (
            <Download size={15} />
          )}
        </button>
      </div>
    </div>
  );
};

// ==========================================
// WRAPPER (BaseBubble bilan)
// ==========================================
const FileBubble = (props) => {
  // isMe ni aniqlash (FilePlayer ranglari uchun)
  const currentUser = useSelector((s) => s.auth.user);
  const { message } = props;
  const isMe = message?.user_id === currentUser?.id;

  return (
    <BaseBubble
   {...props}
    >
      <FilePlayer
        url={message.file_url}
        fileName={message.file_name}
        fileSize={message.file_size}
        mimeType={message.mime_type}
        isMe={isMe}
      />
    </BaseBubble>
  );
};

export default FileBubble;

// ==========================================
// ISHLATILISHI (USAGE):
// ==========================================
// <FileBubble
//   message={message}
//   onDelete={deleteMessage}
//   onReact={toggleReaction}
//   totalMembers={totalMembers}
//   showAvatar={showAvatar}
//   showName={showName}
// />