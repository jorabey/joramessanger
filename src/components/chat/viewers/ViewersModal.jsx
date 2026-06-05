import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Avatar from '../../ui/Avatar';
import { selectUser } from '../../../redux/authSlice';
import { formatMessageTime } from '../../../utils/formatters';

// ==========================================
// BITTA VIEWER QATORI
// ==========================================
const ViewerRow = ({ read, isCurrentUser }) => {
  const profile = read.profiles;

  const fullName = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
    : 'Foydalanuvchi';

  const readAt = read.read_at
    ? formatMessageTime(read.read_at)
    : '';

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors duration-200 ${
      isCurrentUser 
        ? 'bg-blue-500/10' 
        : 'hover:bg-neutral-200 dark:hover:bg-white/5'
    }`}>
      {/* Avatar */}
      <Avatar
        src={profile?.avatar_url}
        firstName={profile?.first_name}
        lastName={profile?.last_name}
        userId={read.user_id}
        size="sm"
      />

      {/* Ism + Ko'rgan vaqti */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight truncate ${isCurrentUser ? 'text-blue-600 dark:text-blue-300' : 'text-neutral-900 dark:text-slate-200'} transition-colors duration-300`}>
          {isCurrentUser ? `${fullName} (siz)` : fullName}
        </p>
        {readAt && (
          <p className="text-[11px] text-neutral-500 dark:text-slate-500 mt-0.5 transition-colors duration-300">
            {readAt}
          </p>
        )}
      </div>

      {/* Ko'rgan belgisi */}
      <Eye size={13} className="text-blue-500 dark:text-blue-400 shrink-0" />
    </div>
  );
};

// ==========================================
// ASOSIY KOMPONENT
// ==========================================
const ViewersModal = ({
  isOpen,
  onClose,
  reads = [],       
  totalMembers = 0, 
}) => {
  const currentUser = useSelector(selectUser);

  const sortedReads = useMemo(() => {
    if (!reads.length) return [];

    const me    = reads.filter((r) => r.user_id === currentUser?.id);
    const others = reads
      .filter((r) => r.user_id !== currentUser?.id)
      .sort((a, b) => new Date(b.read_at) - new Date(a.read_at));

    return [...me, ...others];
  }, [reads, currentUser]);

  const totalOthers   = Math.max(totalMembers - 1, 1);
  const readCount     = reads.length;
  const readPercent   = Math.round((readCount / totalOthers) * 100);

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal oyna */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{ opacity: 0, y: 40,  scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.34, 1.26, 0.64, 1] }}
        className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/20 flex flex-col max-h-[70dvh] bg-white dark:bg-[#1a1d2e] transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---- HEADER ---- */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Eye size={15} className="text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white leading-none transition-colors duration-300">
                Ko'rganlar
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-slate-500 mt-0.5 transition-colors duration-300">
                {readCount === 0
                  ? "Hali hech kim ko'rmagan"
                  : `${readCount} ta kishi`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/8 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* ---- FOIZ PROGRESS ---- */}
        {totalMembers > 1 && (
          <div className="px-5 pb-4 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-neutral-500 dark:text-slate-500 transition-colors duration-300">Ko'rish darajasi</span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 transition-colors duration-300">{readPercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-white/8 overflow-hidden transition-colors duration-300">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${readPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500"
              />
            </div>
          </div>
        )}

        {/* ---- DIVIDER ---- */}
        <div className="h-px bg-neutral-200 dark:bg-white/8 mx-5 shrink-0 transition-colors duration-300" />

        {/* ---- RO'YXAT ---- */}
        <div className="flex-1 overflow-y-auto overscroll-contain py-2 px-1">
          {sortedReads.length === 0 ? (
            /* Bo'sh holat */
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center transition-colors duration-300">
                <Eye size={22} className="text-neutral-400 dark:text-slate-600" />
              </div>
              <p className="text-sm text-neutral-500 dark:text-slate-500 text-center transition-colors duration-300">
                Hali hech kim ko'rmagan
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {sortedReads.map((read) => (
                <ViewerRow
                  key={read.user_id}
                  read={read}
                  isCurrentUser={read.user_id === currentUser?.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* ---- BOTTOM SAFE AREA (mobil uchun) ---- */}
        <div className="h-safe-area-inset-bottom shrink-0 sm:hidden" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </motion.div>
    </div>
  );

  return createPortal(
    <AnimatePresence>{isOpen && modal}</AnimatePresence>,
    document.body
  );
};

export default ViewersModal;
