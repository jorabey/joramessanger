import React, { useEffect, useRef, useCallback, useState, useMemo, memo, useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isToday, isYesterday, format, isSameDay } from 'date-fns';
import { uz } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, MessageSquareOff, Loader2, Clock, Reply, Ban } from 'lucide-react';

import { selectUser } from '../../redux/authSlice';
import {
  selectMessages,
  selectIsLoading,
  selectIsLoadingMore,
  selectHasMoreMessages,
  selectShouldScrollToBottom,
  setShouldScrollToBottom,
  selectSearchQuery,
  setReplyTo
} from '../../redux/chatSlice';

import Loader from '../ui/Loader';
import TextBubble from './bubbles/TextBubble';
import AudioBubble from './bubbles/AudioBubble';
import VoiceNoteBubble from './bubbles/VoiceNoteBubble';
import VideoBubble from './bubbles/VideoBubble';
import VideoNoteBubble from './bubbles/VideoNoteBubble';
import FileBubble from './bubbles/FileBubble';
import ImageBubble from './bubbles/ImageBubble';
import UserProfileModal from '../profile/UserProfileModal';

const DateDivider = memo(({ date }) => {
  const d = new Date(date);
  const label = isToday(d) ? 'Bugun' : isYesterday(d) ? 'Kecha' : format(d, "d MMMM, yyyy", { locale: uz });
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-4 my-2 select-none w-full clear-both pointer-events-none"
    >
      <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-3.5 py-1 rounded-full backdrop-blur-md">
        {label}
      </span>
    </motion.div>
  );
});
DateDivider.displayName = 'DateDivider';

const BUBBLE_COMPONENTS = {
  text: TextBubble,
  link: TextBubble,
  audio: AudioBubble,
  voice_note: VoiceNoteBubble,
  video: VideoBubble,
  video_note: VideoNoteBubble,
  file: FileBubble,
  image: ImageBubble,
};

const MessageList = ({ onLoadMore, onDelete, onReact, members = [], onMarkAsRead }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const messages = useSelector(selectMessages);
  const isLoading = useSelector(selectIsLoading);
  const isLoadingMore = useSelector(selectIsLoadingMore);
  const hasMoreMessages = useSelector(selectHasMoreMessages);
  const shouldScrollToBottom = useSelector(selectShouldScrollToBottom);
  const searchQuery = useSelector(selectSearchQuery);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [swipedMessageId, setSwipedMessageId] = useState(null);

  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const isInitialMount = useRef(true);

  const scrollToBottom = useCallback((smooth = true) => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  useEffect(() => {
    if (!messages || messages.length === 0 || !currentUser?.id) return;
    const unreadMessages = messages.filter(msg => {
      const isMe = msg.user_id === currentUser.id;
      const iHaveRead = (msg.reads || msg.message_reads || []).some(r => r.user_id === currentUser.id);
      return !isMe && !iHaveRead;
    });
    unreadMessages.forEach(msg => {
      if (onMarkAsRead) onMarkAsRead(msg.id);
    });
  }, [messages, currentUser, onMarkAsRead]);

  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom(true);
      dispatch(setShouldScrollToBottom(false));
    }
  }, [shouldScrollToBottom, scrollToBottom, dispatch]);

  useLayoutEffect(() => {
    if (!isLoading && messages.length > 0 && isInitialMount.current) {
      scrollToBottom(false);
      isInitialMount.current = false;
    } else if (!isLoading && messages.length > 0 && !isUserScrollingRef.current) {
      scrollToBottom(true);
    }
  }, [isLoading, messages.length, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    
    // Qayta renderlarni oldini olish uchun faqat o'zgargandagina state'ni yangilaymiz
    if (distanceFromBottom > 250) {
      isUserScrollingRef.current = true;
      if (!showScrollBtn) setShowScrollBtn(true);
    } else {
      isUserScrollingRef.current = false;
      if (showScrollBtn) setShowScrollBtn(false);
    }

    if (el.scrollTop < 150 && !isLoadingMore && hasMoreMessages) {
      prevScrollHeightRef.current = el.scrollHeight;
      if (onLoadMore) onLoadMore();
    }
  }, [isLoadingMore, hasMoreMessages, onLoadMore, showScrollBtn]);

  useLayoutEffect(() => {
    if (!isLoadingMore && prevScrollHeightRef.current) {
      const el = listRef.current;
      if (el) {
        const diff = el.scrollHeight - prevScrollHeightRef.current;
        el.scrollTop += diff;
      }
      prevScrollHeightRef.current = 0;
    }
  }, [isLoadingMore, messages.length]);

  const scrollToMessage = useCallback((msgId) => {
    if (!msgId) return; 
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-[#007aff]/20', 'scale-[1.02]', 'rounded-2xl', 'transition-all', 'duration-300', 'z-50', 'relative');
      setTimeout(() => {
        element.classList.remove('bg-[#007aff]/20', 'scale-[1.02]');
        setTimeout(() => element.classList.remove('transition-all', 'duration-300', 'z-50', 'relative', 'rounded-2xl'), 300);
      }, 1200);
    }
  }, []);

  const handleSwipeReply = useCallback((msg) => {
    dispatch(setReplyTo(msg));
    if (navigator.vibrate) navigator.vibrate(20);
  }, [dispatch]);

  // TEZLIK UCHUN OPTIMIZATSIYA: Members massivini O(1) xeshlash xaritasiga aylantiramiz
  const membersMap = useMemo(() => {
    const map = {};
    members.forEach(m => {
      map[m.user_id] = m;
    });
    return map;
  }, [members]);

  const groupedItems = useMemo(() => {
    if (!Array.isArray(messages)) return [];

    const filteredMessages = searchQuery
      ? messages.filter((m) =>
          !m.is_deleted_for_all && m.content?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : messages;

    const items = [];

    filteredMessages.forEach((msg, index) => {
      if (!msg || (!msg.created_at && !msg.isPending)) return;

      const msgDate = new Date(msg.created_at || Date.now());
      const prevMsg = filteredMessages[index - 1];
      const prevMsgDate = prevMsg ? new Date(prevMsg.created_at || Date.now()) : null;

      if (!prevMsgDate || !isSameDay(msgDate, prevMsgDate)) {
        items.push({ 
          type: 'date_separator', 
          id: `date-${msgDate.getTime()}-${index}`, 
          date: msg.created_at || Date.now()
        });
      }

      let showAvatar = true;
      let showName = true;
      const nextMsg = filteredMessages[index + 1];
      
      if (prevMsg?.user_id === msg.user_id && prevMsgDate && isSameDay(msgDate, prevMsgDate)) {
          showName = false;
      }
      if (nextMsg?.user_id === msg.user_id && isSameDay(new Date(nextMsg.created_at || Date.now()), msgDate)) {
          showAvatar = false; 
      }

      // O(1) tezlikda topamiz (eski sekin `.find()` o'rniga)
      const memberInfo = membersMap[msg.user_id];
      const realTimeProfile = memberInfo?.profiles || msg.profiles;
      
      const realTimeMsg = {
        ...msg,
        profiles: realTimeProfile 
      };

      items.push({ 
        type: 'message', 
        data: realTimeMsg, 
        showAvatar,
        showName,
        isOwn: msg.user_id === currentUser?.id,
        role: memberInfo?.role || 'user',
        isOnline: memberInfo?.is_online || false
      });
    });

    return items;
  }, [messages, searchQuery, currentUser, membersMap]);

  useEffect(() => {
    if (selectedUser) {
      const updatedMember = membersMap[selectedUser.id];
      if (updatedMember && updatedMember.profiles) {
        setSelectedUser({
          ...updatedMember.profiles,
          id: updatedMember.user_id,
          role: updatedMember.role,
          isOnline: updatedMember.is_online
        });
      }
    }
  }, [membersMap, selectedUser]);

  if (isLoading) {
    return <Loader fullScreen text="Xabarlar yuklanmoqda..." />; 
  }

  return (
    // ANTI-COPY: Barcha matnni nusxalash va select qilishni butunlay yopish
    <div 
      className="relative flex-1 min-h-0 bg-[#000000] select-none" 
      style={{ 
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none', 
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overflow-x-hidden px-2 sm:px-4 pt-4 pb-[130px] custom-scrollbar relative flex flex-col"
        style={{ WebkitOverflowScrolling: 'touch' }} 
      >
        {isLoadingMore && (
          <div className="flex justify-center py-4 w-full pointer-events-none">
            <Loader2 className="animate-spin text-[#007aff]" size={24} />
          </div>
        )}

        {groupedItems.length === 0 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full gap-4 py-16 opacity-60 flex-1 pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center shadow-inner">
              <MessageSquareOff size={32} className="text-white/40" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-medium text-white/70">
                {searchQuery ? 'Hech narsa topilmadi' : 'Hali xabarlar yo\'q'}
              </p>
              <p className="text-xs text-white/40 mt-1">
                {searchQuery ? `"${searchQuery}" bo'yicha natija yo'q` : 'Birinchi bo\'lib xabar yozing!'}
              </p>
            </div>
          </motion.div>
        )}

        {groupedItems.map((item) => {
          if (item.type === 'date_separator') {
            return <DateDivider key={item.id} date={item.date} />;
          }

          const msg = item.data;
          
          if (msg.is_deleted_for_all) {
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex w-full ${item.isOwn ? 'justify-end' : 'justify-start'} ${item.showAvatar ? 'mb-3' : 'mb-1'} pointer-events-none`}
              >
                <div className={`px-3 py-1.5 rounded-[14px] text-[12px] font-medium flex items-center gap-1.5 border ${item.isOwn ? 'bg-white/5 text-white/40 border-white/5' : 'bg-white/5 text-white/40 border-white/5'}`}>
                  <Ban size={12} className="opacity-60" /> Xabar o'chirildi
                </div>
              </motion.div>
            );
          }

          const BubbleComponent = BUBBLE_COMPONENTS[msg.message_type] || TextBubble;
          const isPending = msg.isPending || msg.status === 'pending' || !msg.id;
          
          return (
            <motion.div 
              key={msg.id || `pending-${msg.created_at}`} 
              id={`msg-${msg.id}`}
              layout="position"
              initial={{ opacity: 0, scale: 0.85, y: 25, originX: item.isOwn ? 1 : 0, originY: 1 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28, mass: 0.8 }}
              className={`flex items-end w-full relative group ${item.isOwn ? 'justify-end' : 'justify-start'} ${item.showAvatar ? 'mb-3.5' : 'mb-[3px]'}`}
            >
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDrag={(e, info) => {
                  if (Math.abs(info.offset.x) > 40 && swipedMessageId !== msg.id) {
                    setSwipedMessageId(msg.id);
                  }
                }}
                onDragEnd={(e, info) => {
                  setSwipedMessageId(null);
                  if (Math.abs(info.offset.x) > 50) {
                    handleSwipeReply(msg);
                  }
                }}
                className={`max-w-[85%] sm:max-w-[70%] relative flex items-end gap-2 ${item.isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className="relative flex items-end">
                  <BubbleComponent
                    message={msg}
                    isOwn={item.isOwn}
                    showAvatar={item.showAvatar}
                    showName={item.showName}
                    role={item.role}
                    onUserClick={() => {
                      setSelectedUser({
                        ...msg.profiles,
                        id: msg.user_id,
                        role: item.role,
                        isOnline: item.isOnline
                      });
                    }}
                    onDelete={onDelete}
                    onReact={onReact}
                    totalMembers={members}
                    onScrollToMessage={scrollToMessage}
                  />
                  {isPending && item.isOwn && (
                    <div className="absolute -right-5 bottom-1.5 flex items-center justify-center w-[18px] h-[18px] bg-black/60 rounded-full backdrop-blur-sm shadow-sm pointer-events-none">
                      <Clock size={10} className="text-white/80" />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {swipedMessageId === msg.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 shrink-0 mb-1 pointer-events-none"
                    >
                      <Reply size={16} className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            </motion.div>
          );
        })}

        <div ref={bottomRef} className="h-4 w-full float-left clear-both" />
      </div>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            key="scroll-bottom-btn"
            initial={{ opacity: 0, scale: 0.5, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 40, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => {
                isUserScrollingRef.current = false;
                scrollToBottom(true);
            }}
            className="absolute bottom-6 right-4 sm:right-6 z-30 w-[44px] h-[44px] rounded-full bg-[#1c1c1e]/90 backdrop-blur-2xl text-white border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center transition-transform active:scale-[0.85]"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ArrowDown size={22} strokeWidth={2.5} className="text-[#007aff]" />
          </motion.button>
        )}
      </AnimatePresence>

      <UserProfileModal 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        user={selectedUser} 
        role={selectedUser?.role}
        isOnline={selectedUser?.isOnline}
      />
    </div>
  );
};

export default MessageList;
