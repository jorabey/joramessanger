import React, { useState, useRef, useEffect, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, Video, X, Smile, Sticker, CircleStop, Paperclip, Ban
} from 'lucide-react';

import { 
  selectReplyTo, 
  selectEditingMessage, 
  clearReplyTo, 
  clearEditingMessage 
} from '../../redux/chatSlice';
import { selectUser } from '../../redux/authSlice';
import { formatDuration } from '../../utils/formatters';

const ChatInput = ({ onSend, recorder, onTyping, groupSettings }) => {
  const dispatch = useDispatch();
  
  const replyTo = useSelector(selectReplyTo);
  const editingMessage = useSelector(selectEditingMessage);
  const currentUser = useSelector(selectUser);
  const membership = useSelector((state) => state.auth.membership);

  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [mediaMode, setMediaMode] = useState('voice');

  const {
    isRecording,
    duration,
    audioLevel,
    startVoiceRecording,
    startVideoRecording,
    stopRecording,
    cancelRecording
  } = recorder;

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const pressTimer = useRef(null);
  const startX = useRef(0);
  const isProcessingRef = useRef(false);

  const isOwner = membership?.role === 'owner';
  const isBlocked = currentUser?.is_blocked;

  const canSendText = isOwner || (!isBlocked && groupSettings?.allow_messages && membership?.can_send_messages);
  const canSendMedia = isOwner || (!isBlocked && groupSettings?.allow_files && membership?.can_send_media);
  const canSendVoiceVideo = isOwner || (!isBlocked && groupSettings?.allow_voice_notes && membership?.can_send_voice_video_notes);

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || '');
      textareaRef.current?.focus();
    } else {
      setText('');
    }
  }, [editingMessage]);

  const handleSend = () => {
    if ((!text.trim() && !file) || !currentUser) return;
    
    onSend({
      content: text.trim() || null,
      messageType: file ? 'file' : 'text',
      file: file,
      isEdit: !!editingMessage,
      msgId: editingMessage?.id
    });
    
    setText('');
    setFile(null);
    dispatch(clearReplyTo());
    dispatch(clearEditingMessage());
    if (textareaRef.current) textareaRef.current.style.height = '46px';
  };

  const onMediaPointerDown = (e) => {
    if (text.trim() || editingMessage || file || !canSendVoiceVideo) return;
    if (navigator.vibrate) navigator.vibrate(50);
    
    startX.current = e.clientX;
    isProcessingRef.current = false;

    pressTimer.current = setTimeout(() => {
      if (mediaMode === 'voice') startVoiceRecording();
      else startVideoRecording();
    }, 250);
  };

  const onMediaPointerUp = async (e) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);

    if (!isRecording) {
      if (!isProcessingRef.current) {
        setMediaMode(prev => prev === 'voice' ? 'video' : 'voice');
        if (navigator.vibrate) navigator.vibrate(15);
      }
      return;
    }

    if (isProcessingRef.current) return;

    const diff = startX.current - e.clientX;
    if (diff > 80) {
      isProcessingRef.current = true;
      cancelRecording();
      if (navigator.vibrate) navigator.vibrate([50, 50]);
      setTimeout(() => { isProcessingRef.current = false; }, 500);
      return;
    }

    try {
      isProcessingRef.current = true;
      const result = await stopRecording(); 
      if (result && result.file) {
        onSend({
          content: null,
          messageType: result.messageType,
          file: result.file,
          isEdit: false
        });
        if (navigator.vibrate) navigator.vibrate([30, 50]);
      }
    } catch (err) {
      cancelRecording();
    } finally {
      setTimeout(() => { isProcessingRef.current = false; }, 500);
    }
  };

  const audioScale = isRecording && audioLevel > 0 ? 1 + (audioLevel / 180) : 1;

  if (isBlocked) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="w-full bg-[#121214] border-t border-white/5 pb-safe z-[50] flex items-center justify-center p-4"
      >
        <div className="flex items-center gap-2 text-red-400/80 bg-red-500/10 px-5 py-3 rounded-2xl border border-red-500/20">
          <Ban size={20} />
          <span className="text-[15px] font-medium">Siz guruhda bloklangansiz</span>
        </div>
      </motion.div>
    );
  }

  if (!canSendText && !canSendMedia && !canSendVoiceVideo) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="w-full bg-[#121214] border-t border-white/5 pb-safe z-[51] flex items-center justify-center p-4"
      >
        <div className="flex items-center gap-2 text-white/40 bg-white/5 px-5 py-3 rounded-2xl border border-white/5">
          <Ban size={20} />
          <span className="text-[15px] font-medium">Sizga yozish ruxsat etilmagan</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      className="relative w-full bg-[#121214] border-t border-white/5 pb-safe z-[99]"
    >
      <AnimatePresence>
        {(replyTo || editingMessage || file) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center gap-3 overflow-hidden"
          >
            <div className={`w-1 h-8 rounded-full ${editingMessage ? 'bg-amber-400' : 'bg-[#007aff]'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase text-white/40">
                {editingMessage ? 'Tahrirlash' : file ? 'Fayl' : 'Javob'}
              </p>
              <p className="text-sm text-white/90 truncate">
                {editingMessage?.content || file?.name || replyTo?.content || 'Media biriktirildi'}
              </p>
            </div>
            <button 
              onClick={() => { setFile(null); dispatch(clearReplyTo()); dispatch(clearEditingMessage()); }} 
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors active:scale-90"
            >
              <X size={18} className="text-white/40" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end w-full px-2 py-3 gap-1.5 max-w-[100vw]">
        <AnimatePresence>
          {!isRecording && !editingMessage && canSendMedia && (
            <motion.button 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0, width: 0 }}
              onClick={() => fileInputRef.current?.click()} 
              className="p-2.5 rounded-full text-[#007aff] hover:bg-white/5 shrink-0 transition-all active:scale-90"
            >
              <Paperclip size={26} strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>

        <motion.div 
          layout
          className={`flex-1 min-w-0 flex items-end rounded-[24px] border transition-all overflow-hidden relative ${
            isRecording ? 'bg-red-500/10 border-red-500/30' : 'bg-[#1c1c1e] border-white/10 focus-within:border-white/20'
          }`}
        >
          {isRecording ? (
            <div className="flex items-center w-full px-4 h-[46px] gap-3">
              <motion.span 
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} 
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2.5 h-2.5 bg-red-500 rounded-full" 
              />
              <span className="flex-1 font-mono text-white text-[17px] tracking-wide">{formatDuration(duration)}</span>
              <motion.div 
                animate={{ x: [0, -6, 0] }} 
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="text-[11px] text-white/50 uppercase font-black tracking-tighter flex items-center gap-1"
              >
                <span>←</span> Bekor qilish
              </motion.div>
            </div>
          ) : (
            <>
              {canSendText && (
                <button className="p-3 text-white/30 hover:text-white shrink-0 transition-colors active:scale-90">
                  <Smile size={26} />
                </button>
              )}

              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => { setText(e.target.value); onTyping?.(); }}
                disabled={!canSendText}
                placeholder={!canSendText ? "Matn yozish ruxsat etilmagan" : file ? "Izoh yozing..." : "Xabar..."}
                className={`flex-1 py-3 bg-transparent text-white outline-none resize-none text-[17px] min-h-[46px] max-h-[140px] custom-scrollbar leading-[1.3] ${!canSendText ? 'opacity-50 cursor-not-allowed' : ''}`}
                rows={1}
                onInput={(e) => { 
                  e.target.style.height = 'auto'; 
                  e.target.style.height = e.target.scrollHeight + 'px'; 
                }}
              />

              {canSendText && (
                <button className="p-3 text-white/30 hover:text-white shrink-0 transition-colors active:scale-90">
                  <Sticker size={24} />
                </button>
              )}
            </>
          )}
        </motion.div>

        <div className="shrink-0 relative">
          <AnimatePresence mode="wait">
            {(text.trim() || file) && canSendText ? (
              <motion.button 
                key="send" 
                initial={{ scale: 0.5, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.5, opacity: 0 }} 
                onClick={handleSend} 
                className={`p-3 rounded-full text-white shadow-xl transition-all ${
                  editingMessage ? 'bg-amber-500 hover:bg-amber-600 active:scale-90' : 'bg-[#007aff] hover:bg-blue-600 active:scale-90'
                }`}
              >
                <Send size={24} fill="white" className="ml-0.5" />
              </motion.button>
            ) : canSendVoiceVideo ? (
              <motion.button
                key="media"
                initial={{ scale: 0.5 }} 
                animate={{ scale: isRecording ? audioScale : 1 }} 
                exit={{ scale: 0.5 }}
                style={{ touchAction: 'none' }}
                onContextMenu={(e) => e.preventDefault()}
                onPointerDown={onMediaPointerDown}
                onPointerUp={onMediaPointerUp}
                onPointerCancel={onMediaPointerUp} 
                onPointerLeave={(e) => { if (isRecording) onMediaPointerUp(e); }}
                className={`p-3 rounded-full transition-colors relative flex items-center justify-center ${
                  isRecording 
                    ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)]' 
                    : mediaMode === 'voice' ? 'text-white/50 bg-white/5 hover:bg-white/10' : 'text-[#007aff] bg-[#007aff]/10 hover:bg-[#007aff]/20'
                }`}
              >
                {isRecording ? <CircleStop size={28} /> : mediaMode === 'voice' ? <Mic size={28} /> : <Video size={28} />}
                
                {isRecording && (
                  <motion.div 
                    animate={{ scale: audioScale * 1.6, opacity: [0.6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 bg-red-500 rounded-full -z-10"
                  />
                )}
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      <input 
        ref={fileInputRef} 
        type="file" 
        className="hidden" 
        onChange={(e) => { if (e.target.files[0]) setFile(e.target.files[0]); }} 
      />
    </motion.div>
  );
};

export default memo(ChatInput);