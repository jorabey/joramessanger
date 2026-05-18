// ==========================================
// ContextMenu.jsx — Xabar ustiga bosilganda chiqadigan menyu
// ==========================================
// - Reaksiya emoji qatori (tez bosish uchun)
// - Javob berish, Tahrirlash, O'chirish amallar
// - Animatsiyali (framer-motion)
// - Backdrop (tashqariga bossa yopiladi)
// - isMe ga qarab pozitsiya (chap/o'ng)
// ==========================================

import { motion, AnimatePresence } from 'framer-motion';
import { CornerUpLeft, Pencil, Trash2, Copy, Info } from 'lucide-react';
import { QUICK_REACTIONS } from '../../config/constants';

// ==========================================
// ASOSIY KOMPONENT
// ==========================================
const ContextMenu = ({
  isOpen,
  position,           // { x, y } — ekrandagi koordinata
  isMe,               // Xabar mening xabarimmi?
  isDeleted,          // O'chirilgan xabarmi?
  canEdit,            // Tahrirlash ruxsati
  canDelete,          // O'chirish ruxsati
  canReply,           // Javob berish ruxsati
  onReply,
  onEdit,
  onDelete,
  onReact,
  onCopy,
  onClose,
}) => {
  if (!isOpen) return null;

  const menuItems = [
    canReply && !isDeleted && {
      icon: CornerUpLeft,
      label: 'Javob berishl',
      action: onReply,
      color: 'text-slate-300',
      hoverBg: 'hover:bg-white/6',
    },
    !isDeleted && {
      icon: Copy,
      label: 'Nusxa olish',
      action: onCopy,
      color: 'text-slate-300',
      hoverBg: 'hover:bg-white/6',
    },
    canEdit && !isDeleted && isMe && {
      icon: Pencil,
      label: 'Tahrirlash',
      action: onEdit,
      color: 'text-blue-400',
      hoverBg: 'hover:bg-blue-500/10',
    },
    canDelete && !isDeleted && {
      icon: Trash2,
      label: "O'chirish",
      action: onDelete,
      color: 'text-red-400',
      hoverBg: 'hover:bg-red-500/10',
    },
  ].filter(Boolean);

  // Menyu o'ng tomonga chiqib ketmasligi uchun x ni tuzatish
  const safeX = Math.min(position.x, window.innerWidth - 200);
  const safeY = Math.min(position.y, window.innerHeight - (60 + menuItems.length * 44));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — tashqariga bossa yopiladi */}
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
            onContextMenu={(e) => { e.preventDefault(); onClose(); }}
          />

          {/* Menyu oynasi */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -6 }}
            transition={{ duration: 0.14, ease: [0.34, 1.3, 0.64, 1] }}
            className="fixed z-50 min-w-[175px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
            style={{
              background: '#1e2236',
              top: safeY,
              left: safeX,
              transformOrigin: isMe ? 'top right' : 'top left',
            }}
          >
            {/* ---- REAKSIYALAR QATORI ---- */}
            {!isDeleted && (
              <div className="flex items-center gap-0.5 px-2.5 py-2 border-b border-white/8">
                {QUICK_REACTIONS.map((emoji, i) => (
                  <motion.button
                    key={emoji}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.025, duration: 0.15 }}
                    onClick={() => { onReact?.(emoji); onClose(); }}
                    className="text-[20px] p-1 rounded-lg hover:bg-white/8 hover:scale-125 active:scale-95 transition-all duration-100 leading-none"
                    style={{ lineHeight: 1 }}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            )}

            {/* ---- AMALLAR RO'YXATI ---- */}
            <div className="py-1">
              {menuItems.map(({ icon: Icon, label, action, color, hoverBg }, idx) => (
                <motion.button
                  key={label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + idx * 0.03 }}
                  onClick={() => { action?.(); onClose(); }}
                  className={[
                    'w-full flex items-center gap-3 px-4 py-2.5',
                    'text-sm font-medium text-left',
                    'transition-colors duration-100',
                    color, hoverBg,
                  ].join(' ')}
                >
                  <Icon size={15} strokeWidth={2} />
                  <span>{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContextMenu;