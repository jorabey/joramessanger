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

  const participantsCount = useMemo(() => participants.length, [participants]);

  const amIInCall = useMemo(() => {
    if (!currentUser?.id) return false;
    return participants.some(p => p.user_id === currentUser.id);
  }, [participants, currentUser?.id]);

  const handleJoin = useCallback(async (e) => {
    e.stopPropagation();
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
      dispatch(openCallRoom());
      if (onOpenCallRoom) onOpenCallRoom();
    } catch (err) {
      console.error("Qo'shilishda xato:", err);
    }
  }, [currentUser, activeCall, dispatch, onOpenCallRoom]);

  const handleOpenBar = useCallback(() => {
    if (!amIInCall) return;
    dispatch(openCallRoom());
    if (onOpenCallRoom) onOpenCallRoom();
  }, [amIInCall, dispatch, onOpenCallRoom]);

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
        <motion.div
          layout
          onClick={handleOpenBar}
          transition={{ type: 'spring', damping: 26, stiffness: 260, mass: 0.8 }}
          className={`pointer-events-auto flex items-center justify-between bg-white dark:bg-[#141416]/95 border border-neutral-200 dark:border-white/10 shadow-xl select-none antialiased backdrop-blur-3xl transition-colors duration-300
            ${amIInCall 
              ? 'w-full max-w-xl rounded-[28px] px-4 py-3 gap-4 border-emerald-500/20' 
              : 'w-full max-w-sm rounded-[22px] px-3.5 py-2.5 gap-3 border-neutral-200 dark:border-white/5'
            }
          `}
          style={{ WebkitTapHighlightColor: 'transparent', cursor: amIInCall ? 'pointer' : 'default' }}
        >
          <motion.div layout="position" className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`relative flex items-center justify-center w-9 h-9 rounded-full shrink-0 shadow-inner ${amIInCall ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5'}`}>
              <PhoneCall size={14} className={amIInCall ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-white/70'} />
              <motion.div
                animate={amIInCall ? { scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] } : { scale: [1, 1.4], opacity: [0.4, 0] }}
                transition={{ duration: amIInCall ? 2 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute inset-0 rounded-full ${amIInCall ? 'bg-emerald-500' : 'bg-neutral-400 dark:bg-white'}`}
              />
            </div>

            <div className="flex flex-col overflow-hidden">
              <span className="text-neutral-900 dark:text-white text-[13px] font-bold tracking-tight leading-tight flex items-center gap-1.5 transition-colors">
                {amIInCall ? "Siz aloqadasiz" : "Muloqot faol"}
                {amIInCall && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#34d399]" />}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Users size={11} className="text-neutral-500 dark:text-slate-400 transition-colors" />
                <span className="text-neutral-500 dark:text-slate-400 text-[11px] font-semibold tracking-wide truncate transition-colors">
                  {participantsCount > 0 ? `${participantsCount} kishi gaplashmoqda` : "Hozircha hech kim yo'q"}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div layout="position" className="flex items-center gap-2 shrink-0">
            <AnimatePresence mode="wait">
              {!amIInCall ? (
                <motion.button
                  key="join-only"
                  initial={{ opacity: 0, scale: 0.85, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.85, x: 10 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={handleJoin}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full text-[12px] font-black tracking-wide shadow-lg shadow-emerald-500/20 border border-emerald-400/20 transition-all active:scale-95"
                >
                  Qo'shilish
                </motion.button>
              ) : (
                <motion.div
                  key="active-island-controls"
                  initial={{ opacity: 0, scale: 0.9, x: -15 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -15 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 p-1 rounded-full backdrop-blur-md shadow-inner transition-colors">
                    <motion.button
                      whileTap={{ scale: 0.82 }}
                      onClick={handleToggleMute}
                      className={`p-2 rounded-full transition-colors ${myStatus.is_muted ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'text-neutral-600 dark:text-white/80 hover:bg-neutral-200 dark:hover:bg-white/5'}`}
                    >
                      {myStatus.is_muted ? <MicOff size={14} /> : <Mic size={14} />}
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.82 }}
                      onClick={handleToggleVideo}
                      className={`p-2 rounded-full transition-colors ${!myStatus.is_video_on ? 'text-neutral-500 dark:text-slate-500 hover:bg-neutral-200 dark:hover:bg-white/5' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}
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

                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); handleOpenBar(); }}
                    className="bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-white/70 p-2.5 rounded-full border border-neutral-200 dark:border-white/5 transition-colors shadow-inner"
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
