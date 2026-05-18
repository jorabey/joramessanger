import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CornerUpLeft, Pencil, Trash2, Check, CheckCheck, Eye, Reply, Copy
} from 'lucide-react';

import { selectUser } from '../../../redux/authSlice';
import { setReplyTo, setEditingMessage } from '../../../redux/chatSlice';
import { usePermissions } from '../../../hooks/usePermissions';
import { formatMessageTime } from '../../../utils/formatters';
import Avatar from '../../ui/Avatar';
import ViewersModal from '../viewers/ViewersModal'; 

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

// ==========================================
// 1. APPLE STYLE KONTEKST MENYU + FOCUS
// ==========================================
const ContextMenuOverlay = ({
  isOpen, position, isMe, message, children,
  onReply, onEdit, onDelete, onReact, onCopy, onViewers, onClose,
  canEdit, canDelete, canReply, canReactGroup, canSeeViewersGroup
}) => {
  if (!isOpen) return null;

  const menuItems = [
    canReply && { icon: CornerUpLeft, label: 'Javob berish', action: onReply, color: 'text-white' },
    message.content && { icon: Copy, label: 'Nusxa olish', action: onCopy, color: 'text-white' },
    (isMe && canSeeViewersGroup) && { icon: Eye, label: "Ko'rganlar", action: onViewers, color: 'text-white' },
    (canEdit && isMe) && { icon: Pencil, label: 'Tahrirlash', action: onEdit, color: 'text-[#007aff]' },
    canDelete && { icon: Trash2, label: "O'chirish", action: onDelete, color: 'text-red-500' },
  ].filter(Boolean);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto" onClick={onClose}>
      {/* Orqa fonni xiralashtirish (iOS blur effect) */}
      <motion.div 
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
        animate={{ opacity: 1, backdropFilter: "blur(8px)" }} 
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/30" 
      />

      <div className="relative z-10 w-full h-full pointer-events-none">
        
        {/* Fokusdagi xabar (Kattalashadigan dublikat) */}
        <motion.div 
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.05, opacity: 1 }}
          exit={{ scale: 1, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="absolute pointer-events-auto"
          style={{ 
            top: position.bubbleTop, 
            left: position.bubbleLeft, 
            width: position.bubbleWidth,
            transformOrigin: isMe ? 'right center' : 'left center'
          }}
          onClick={(e) => e.stopPropagation()} // Xabarni bosganda menyu yopilmasligi uchun
        >
          {children}
        </motion.div>

        {/* Menyu blokirovkasi va Reaksiyalar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: position.isBottomSpace ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: position.isBottomSpace ? -10 : 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.05 }}
          className="absolute pointer-events-auto flex flex-col gap-2 min-w-[240px]"
          style={{
            top: position.menuTop,
            left: isMe ? undefined : Math.max(10, position.bubbleLeft),
            right: isMe ? Math.max(10, window.innerWidth - (position.bubbleLeft + position.bubbleWidth)) : undefined,
            transformOrigin: position.isBottomSpace ? 'top' : 'bottom'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Reaksiyalar qatori (Ruxsat bo'lsagina chiqadi) */}
          {canReactGroup && (
            <div className="flex items-center justify-between bg-[#1c1c1e]/80 backdrop-blur-2xl px-3 py-2.5 rounded-full border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { onReact(emoji); onClose(); }}
                  className="text-[22px] hover:scale-125 hover:-translate-y-1 transition-all duration-200 p-1 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Menyu tugmalari */}
          {menuItems.length > 0 && (
            <div className="bg-[#1c1c1e]/80 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col">
              {menuItems.map((item, idx) => (
                <button
                  key={item.label}
                  onClick={() => { item.action(); onClose(); }}
                  className={`flex items-center justify-between px-4 py-3.5 text-[15px] font-medium hover:bg-white/10 active:bg-white/20 transition-colors ${item.color} ${idx !== 0 ? 'border-t border-white/5' : ''}`}
                >
                  {item.label} <item.icon size={18} strokeWidth={2.5} />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>,
    document.body
  );
};

// ==========================================
// 2. ASOSIY BASE BUBBLE
// ==========================================
const BaseBubble = (props) => {
  const { message, children, onDelete, onReact, onUserClick, onScrollToMessage, role, showAvatar, showName } = props;
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  
  // Ruxsatlarni olish
  const { canDeleteMessage, canBlockUsers } = usePermissions(); // Guruh qoidalariga qarab kengaytirish mumkin
  const canReactGroup = message.group_settings?.allow_reactions ?? true; 
  const canSeeViewersGroup = true; // Buni Global guruh settingsdan olishingiz mumkin

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuData, setMenuData] = useState({});
  const [viewersOpen, setViewersOpen] = useState(false);

  const bubbleRef = useRef(null);
  const longPressTimer = useRef(null);
  const isMovedRef = useRef(false);

  const isMe = message.user_id === currentUser?.id;
  const isDeleted = message.is_deleted_for_all;
  const fullName = message.profiles ? `${message.profiles.first_name ?? ''} ${message.profiles.last_name ?? ''}`.trim() : 'Foydalanuvchi';

  // Menyuni dinamik ochish logikasi (Ekrandan chiqib ketmaslik)
  const handleOpenMenu = useCallback(() => {
    if (isDeleted) return;
    if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback

    const rect = bubbleRef.current.getBoundingClientRect();
    const menuHeightEstimate = 250; // Menyu balandligi taxminan
    const isBottomSpace = (window.innerHeight - rect.bottom) > menuHeightEstimate;
    
    // O'lchamlarni saqlash va scale effect uchun margin qoldirish
    setMenuData({
      bubbleTop: rect.top,
      bubbleLeft: rect.left,
      bubbleWidth: rect.width,
      menuTop: isBottomSpace ? rect.bottom + 12 : rect.top - menuHeightEstimate - 12,
      isBottomSpace,
    });
    
    setMenuOpen(true);
  }, [isDeleted]);

  // Touch Event Handlers (Scroll paytida menyu ochilib ketmasligi uchun)
  const onTouchStart = () => {
    isMovedRef.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!isMovedRef.current) handleOpenMenu();
    }, 350);
  };
  
  const onTouchMove = () => {
    isMovedRef.current = true;
    clearTimeout(longPressTimer.current);
  };
  
  const onTouchEnd = () => clearTimeout(longPressTimer.current);

  if (isDeleted) {
    return (
      <div className={`flex items-end gap-2 px-3 py-1 ${isMe ? 'flex-row-reverse' : ''}`}>
        <div className="px-3 py-1.5 rounded-[14px] text-[12px] font-medium text-white/40 border border-white/5 bg-white/5 flex items-center gap-1.5">
          <Trash2 size={12} className="opacity-60" /> Xabar o'chirildi
        </div>
      </div>
    );
  }

  const bubbleContent = (
    <div
      className={`relative overflow-hidden shadow-sm transition-all ${
        isMe ? 'bg-[#007aff] text-white rounded-[20px] rounded-br-sm' : 'bg-[#262628] text-white rounded-[20px] rounded-bl-sm border border-white/5'
      }`}
    >
      {children}
      <div className={`flex items-center gap-1.5 px-3 pb-1.5 pt-0.5 opacity-70 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <span className="text-[10px] font-medium tabular-nums">{formatMessageTime(message.created_at)}</span>
        {isMe && (
          <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setViewersOpen(true); }}>
            {(message.reads?.length > 0) ? <CheckCheck size={14} className="text-[#89CFF0]" /> : <Check size={14} />}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className={`relative flex items-end gap-2 px-2 py-0.5 w-full ${isMe ? 'flex-row-reverse' : ''}`}>
        
        {/* AVATAR */}
        {!isMe && showAvatar && (
          <div className="cursor-pointer z-10 active:scale-95 transition-transform" onClick={() => onUserClick?.()}>
            <Avatar src={message.profiles?.avatar_url} size="sm" />
          </div>
        )}

        {/* BUBBLE MAIN CONTAINER */}
        <div 
          ref={bubbleRef}
          className={`relative flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}
          onContextMenu={(e) => { e.preventDefault(); handleOpenMenu(); }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          {/* NAME & ROLE */}
          {!isMe && showName && (
            <div className="flex items-center gap-1.5 mb-1 ml-1 cursor-pointer active:opacity-70 transition-opacity" onClick={() => onUserClick?.()}>
              <span className="text-[12px] font-semibold text-[#89CFF0]">{fullName}</span>
              {role === 'owner' && <span className="text-[9px] font-bold bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wide">Asoschi</span>}
              {role === 'admin' && <span className="text-[9px] font-bold bg-[#007aff]/15 text-[#007aff] px-1.5 py-0.5 rounded border border-[#007aff]/20 uppercase tracking-wide">Admin</span>}
            </div>
          )}

          {/* REPLY PREVIEW */}
          {message.reply_message && (
            <div className="w-full mb-1 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => onScrollToMessage(message.reply_message.id)}>
              <div className="bg-white/10 backdrop-blur-sm border-l-[3px] border-[#89CFF0] px-2.5 py-1.5 rounded-lg text-[12px] truncate overflow-hidden">
                <p className="font-bold text-[#89CFF0] mb-0.5">{message.reply_message.profiles?.first_name}</p>
                <p className="truncate text-white/80 text-[11px]">{message.reply_message.content}</p>
              </div>
            </div>
          )}

          {bubbleContent}

          {/* REAKSIYALAR PILL */}
          {message.reactions?.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-[-8px] z-10 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {Object.entries(message.reactions.reduce((acc, r) => { acc[r.reaction] = (acc[r.reaction] || 0) + 1; return acc; }, {})).map(([emoji, count]) => (
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  key={emoji} 
                  className="bg-[#1c1c1e] border border-white/10 rounded-full px-1.5 py-0.5 text-[11px] flex items-center gap-1 shadow-sm backdrop-blur-md"
                >
                  {emoji} <span className="font-bold text-white/90">{count}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONTEXT MENU OVERLAY (FOCUS HOLATI) */}
      <AnimatePresence>
        {menuOpen && (
          <ContextMenuOverlay
            isOpen={menuOpen}
            position={menuData}
            isMe={isMe}
            message={message}
            canEdit={isMe}
            canDelete={canDeleteMessage(message.user_id, currentUser?.id)}
            canReply={true}
            canReactGroup={canReactGroup}
            canSeeViewersGroup={canSeeViewersGroup}
            onClose={() => setMenuOpen(false)}
            onReply={() => dispatch(setReplyTo(message))}
            onEdit={() => dispatch(setEditingMessage(message))}
            onCopy={() => navigator.clipboard.writeText(message.content)}
            onDelete={() => onDelete(message.id)}
            onReact={(emoji) => onReact(message.id, emoji)}
            onViewers={() => setViewersOpen(true)}
          >
            <div className={isMe ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
               {/* Fokus qilinganda xuddi shu xabar ustma-ust chiqadi */}
               {bubbleContent}
            </div>
          </ContextMenuOverlay>
        )}
      </AnimatePresence>

      {/* VIEWERS MODAL */}
      {viewersOpen && <ViewersModal isOpen={viewersOpen} onClose={() => setViewersOpen(false)} reads={message.reads} />}
    </>
  );
};

export default BaseBubble;