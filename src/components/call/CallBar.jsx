import React, { memo, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneCall, Maximize2, Users, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import {
  selectActiveCall,
  selectParticipants,
  selectIsCallBarVisible,
  selectMyStatus,
  openCallRoom,
  toggleMyMute,
  toggleMyVideo,
  closeCallRoom
} from '../../redux/callSlice';
import { selectUser } from '../../redux/authSlice';

const CallBar = memo(({ onOpenCallRoom }) => {
  const dispatch = useDispatch();
  const activeCall = useSelector(selectActiveCall);
  const participants = useSelector(selectParticipants) || [];
  const isVisible = useSelector(selectIsCallBarVisible);
  const currentUser = useSelector(selectUser);
  const myStatus = useSelector(selectMyStatus);

  // Real vaqtda ishtirokchilar soni
  const participantsCount = useMemo(() => participants.length, [participants]);

  // Foydalanuvchi muloqotning haqiqiy a'zosimi?
  const amIInCall = useMemo(() => {
    if (!currentUser?.id) return false;
    return participants.some(p => p.user_id === currentUser.id);
  }, [participants, currentUser?.id]);

  // Xonaga birinchi marta faqat tugma orqali ulanish
  const handleJoin = useCallback(async (e) => {
    e.stopPropagation(); // Har ehtimolga qarshi bar bosilib ketishini to'xtatadi
    if (!currentUser || !activeCall) return;
    try {
      await supabase.from('call_participants').upsert(
        {
          call_id: activeCall.id,
          user_id: currentUser.id,
          is_muted: true,
          is_video_on: false,
          joined_at: new Date().toISOString(),
          left_at: null,
        },
        { onConflict: 'call_id,user_id' }
      );
      dispatch(openCallRoom()); // Faqat muvaffaqiyatli qo'shilgandan keyin xonani ochamiz
      if (onOpenCallRoom) onOpenCallRoom();
    } catch (err) {
      console.error("Qo'shilishda xato:", err);
    }
  }, [currentUser, activeCall, dispatch, onOpenCallRoom]);

  // Barga bosganda faqat agar u allaqachon qo'shilgan bo'lsa xona ochiladi
  const handleOpenBar = useCallback(() => {
    if (!amIInCall) return; // 🛑 QULF: Qo'shilmagan bo'lsa, barga bosilsa ham hech narsa ochilmaydi!
    dispatch(openCallRoom());
    if (onOpenCallRoom) onOpenCallRoom();
  }, [amIInCall, dispatch, onOpenCallRoom]);

  // Hardware boshqaruvlari
  const handleToggleMute = useCallback(async (e) => {
    e.stopPropagation();
    const newMuted = !myStatus.is_muted;
    dispatch(toggleMyMute());
    await supabase.from('call_participants')
      .update({ is_muted: newMuted })
      .eq('call_id', activeCall.id)
      .eq('user_id', currentUser.id);
  }, [dispatch, myStatus, activeCall, currentUser]);

  const handleToggleVideo = useCallback(async (e) => {
    e.stopPropagation();
    const newVideoOn = !myStatus.is_video_on;
    dispatch(toggleMyVideo());
    await supabase.from('call_participants')
      .update({ is_video_on: newVideoOn })
      .eq('call_id', activeCall.id)
      .eq('user_id', currentUser.id);
  }, [dispatch, myStatus, activeCall, currentUser]);

  const handleLeaveCall = useCallback(async (e) => {
    e.stopPropagation();
    dispatch(closeCallRoom());
    await supabase.from('call_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('call_id', activeCall.id)
      .eq('user_id', currentUser.id);
  }, [dispatch, activeCall, currentUser]);

  if (!isVisible || !activeCall) return null;

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 240 }}
        className="relative w-full flex justify-center items-center pointer-events-none"
      >
        {/* Apple Dynamic Elastic Layout Container */}
        <motion.div
          layout
          onClick={handleOpenBar}
          transition={{ type: 'spring', damping: 26, stiffness: 260, mass: 0.8 }}
          className={`pointer-events-auto flex items-center justify-between bg-[#141416]/95 border border-white/10 shadow-[0_25px_55px_rgba(0,0,0,0.6)] select-none antialiased backdrop-blur-3xl transition-colors duration-300
            ${amIInCall 
              ? 'w-full max-w-xl rounded-[28px] px-4 py-3 gap-4 border-emerald-500/10' // Ichkarida bo'lsa keng panel
              : 'w-full max-w-sm rounded-[22px] px-3.5 py-2.5 gap-3 border-white/5' // Tashqarida bo'lsa ixcham gumbaz
            }
          `}
          style={{ WebkitTapHighlightColor: 'transparent', cursor: amIInCall ? 'pointer' : 'default' }}
        >
          {/* Chap tomon: Jonli statuslar */}
          <motion.div layout="position" className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`relative flex items-center justify-center w-9 h-9 rounded-full shrink-0 shadow-inner ${amIInCall ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5 border border-white/5'}`}>
              <PhoneCall size={14} className={amIInCall ? 'text-emerald-400' : 'text-white/70'} />
              <motion.div
                animate={amIInCall ? { scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] } : { scale: [1, 1.4], opacity: [0.4, 0] }}
                transition={{ duration: amIInCall ? 2 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute inset-0 rounded-full ${amIInCall ? 'bg-emerald-500' : 'bg-white'}`}
              />
            </div>

            <div className="flex flex-col overflow-hidden">
              <span className="text-white text-[13px] font-bold tracking-tight leading-tight flex items-center gap-1.5">
                {amIInCall ? "Siz aloqadasiz" : "Muloqot faol"}
                {amIInCall && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Users size={11} className="text-slate-400" />
                <span className="text-slate-400 text-[11px] font-semibold tracking-wide truncate">
                  {participantsCount > 0 ? `${participantsCount} kishi gaplashmoqda` : "Hozircha hech kim yo'q"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* O'ng tomon: Dinamik boshqaruv pulti */}
          <motion.div layout="position" className="flex items-center gap-2 shrink-0">
            <AnimatePresence mode="wait">
              {!amIInCall ? (
                /* ➔ HOLAT 1: HALI QO'SHILMAGAN BO'LSA (Faqat bitta "Qo'shilish" tugmasi, Maximize umuman yo'q) */
                <motion.button
                  key="join-only"
                  initial={{ opacity: 0, scale: 0.85, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.85, x: 10 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={handleJoin}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-full text-[12px] font-black tracking-wide shadow-lg shadow-emerald-500/20 border border-emerald-400/20 transition-all active:scale-95"
                >
                  Qo'shilish
                </motion.button>
              ) : (
                /* ➔ HOLAT 2: QO'SHILGANDAN KEYIN (To'liq pult va Maximize tugmasi birgalikda ochiladi) */
                <motion.div
                  key="active-island-controls"
                  initial={{ opacity: 0, scale: 0.9, x: -15 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -15 }}
                  className="flex items-center gap-2"
                >
                  {/* Hardware Controller Bar */}
                  <div className="flex items-center gap-1 bg-white/5 border border-white/5 p-1 rounded-full backdrop-blur-md shadow-inner">
                    <motion.button
                      whileTap={{ scale: 0.82 }}
                      onClick={handleToggleMute}
                      className={`p-2 rounded-full transition-colors ${myStatus.is_muted ? 'bg-red-500/20 text-red-400' : 'text-white/80 hover:bg-white/5'}`}
                    >
                      {myStatus.is_muted ? <MicOff size={14} /> : <Mic size={14} />}
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.82 }}
                      onClick={handleToggleVideo}
                      className={`p-2 rounded-full transition-colors ${!myStatus.is_video_on ? 'text-slate-500 hover:bg-white/5' : 'bg-emerald-500/20 text-emerald-400'}`}
                    >
                      {myStatus.is_video_on ? <Video size={14} /> : <VideoOff size={14} />}
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.82 }}
                      onClick={handleLeaveCall}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-md shadow-red-500/20"
                    >
                      <PhoneOff size={14} />
                    </motion.button>
                  </div>

                  {/* Katta ekranga qaytarish (Faqat endi ruxsat etiladi) */}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); handleOpenBar(); }}
                    className="bg-white/5 hover:bg-white/10 text-white/70 p-2.5 rounded-full border border-white/5 transition-colors shadow-inner"
                  >
                    <Maximize2 size={13} strokeWidth={2.5} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

CallBar.displayName = 'CallBar';

export default CallBar;