// ==========================================
// Reactions.jsx — Xabar ostidagi emoji reaksiyalar paneli
// ==========================================
// - QUICK_REACTIONS ro'yxati (constants.js dan)
// - Animatsiyali emoji picker
// - Guruhlab ko'rsatish (kimlar bosgan)
// - O'z reaksiyamni highlight qilish
// ==========================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/authSlice';
import { QUICK_REACTIONS } from '../../config/constants';
import Tooltip from '../ui/Tooltip';

// ==========================================
// 1. EMOJI PICKER (kichik tanlash paneli)
// ==========================================
export const ReactionPicker = ({ onReact, onClose, isMe }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 8 }}
        transition={{ duration: 0.15, ease: [0.34, 1.4, 0.64, 1] }}
        className={[
          'flex items-center gap-1 px-3 py-2 rounded-2xl',
          'border border-white/10 shadow-xl shadow-black/40',
        ].join(' ')}
        style={{ background: '#1e2236' }}
      >
        {QUICK_REACTIONS.map((emoji, i) => (
          <motion.button
            key={emoji}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03, duration: 0.15 }}
            onClick={() => {
              onReact(emoji);
              onClose?.();
            }}
            className="text-xl hover:scale-130 active:scale-95 transition-transform duration-100 leading-none p-0.5 rounded-lg hover:bg-white/8"
            style={{ lineHeight: 1 }}
          >
            {emoji}
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

// ==========================================
// 2. REACTION BUBBLE — Bitta reaksiya tugmasi
// (xabar ostida ko'rsatiladigan guruhlar)
// ==========================================
export const ReactionBubble = ({ emoji, users = [], isMyReaction, onToggle }) => {
  const [showNames, setShowNames] = useState(false);

  const namesText = users
    .slice(0, 5)
    .map((u) => u.first_name ?? 'Foydalanuvchi')
    .join(', ') + (users.length > 5 ? ` va ${users.length - 5} ta boshqa` : '');

  return (
    <Tooltip content={namesText} placement="top" delay={300}>
      <motion.button
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className={[
          'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
          'border transition-all duration-150',
          isMyReaction
            ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30'
            : 'bg-white/6 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20',
        ].join(' ')}
      >
        <span className="text-sm leading-none">{emoji}</span>
        <span className="font-bold tabular-nums leading-none">{users.length}</span>
      </motion.button>
    </Tooltip>
  );
};

// ==========================================
// 3. REACTIONS LIST — Xabar ostidagi barcha reaksiyalar
// ==========================================
const Reactions = ({
  reactions = [],     // [{ reaction, user_id, profiles: { first_name, last_name } }]
  onToggle,           // (emoji) => void — reaksiyani qo'shish/olib tashlash
  isMe = false,       // Xabar mening xabarimmi?
}) => {
  const currentUser = useSelector(selectUser);

  if (!reactions || reactions.length === 0) return null;

  // Reaksiyalarni guruhlab hisoblash
  const grouped = reactions.reduce((acc, r) => {
    if (!acc[r.reaction]) {
      acc[r.reaction] = [];
    }
    const user = r.profiles ?? { first_name: 'Foydalanuvchi' };
    acc[r.reaction].push({ user_id: r.user_id, ...user });
    return acc;
  }, {});

  return (
    <motion.div
      layout
      className={[
        'flex flex-wrap gap-1 mt-1 px-1',
        isMe ? 'justify-end' : 'justify-start',
      ].join(' ')}
    >
      <AnimatePresence mode="popLayout">
        {Object.entries(grouped).map(([emoji, users]) => {
          const isMyReaction = users.some((u) => u.user_id === currentUser?.id);
          return (
            <ReactionBubble
              key={emoji}
              emoji={emoji}
              users={users}
              isMyReaction={isMyReaction}
              onToggle={() => onToggle?.(emoji)}
            />
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default Reactions;