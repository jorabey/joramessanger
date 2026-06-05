import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Video, MoreVertical, Info, UserCircle, Settings, LogOut
} from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import Avatar from '../ui/Avatar';
import Tooltip from '../ui/Tooltip';
import EditMyProfile from '../profile/EditMyProfile';
import SettingsModal from '../settings/SettingsModal'; // Yangi sozlamalar modali
import {
  toggleSearch,
  setSearchQuery,
  selectIsSearchOpen,
  selectSearchQuery,
} from '../../redux/chatSlice';
import {
  setActiveCall,
  openCallRoom,
  selectIsCallBarVisible,
} from '../../redux/callSlice';
import { selectUser } from '../../redux/authSlice';

const GROUP_ID = import.meta.env.VITE_GROUP_ID;

const ChatHeader = ({
  group,
  onlineCount = 0,
  totalMembers = 0,
  typingText = '',
  onOpenSidebar,
}) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const isSearchOpen = useSelector(selectIsSearchOpen);
  const searchQuery = useSelector(selectSearchQuery);
  const isCallActive = useSelector(selectIsCallBarVisible);

  const [isStartingCall, setIsStartingCall] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Modallar holati
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const searchInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🔴 Tizimdan chiqish (Log Out)
  const handleLogout = async () => {
    setIsMenuOpen(false);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Chiqishda xatolik:", error);
    }
  };

  const handleStartCall = React.useCallback(async () => {
    if (isCallActive || isStartingCall || !currentUser) return;

    setIsStartingCall(true);
    try {
      const { data: call, error: callError } = await supabase
        .from('active_calls')
        .insert({
          group_id: GROUP_ID,
          started_by: currentUser.id,
          is_active: true,
        })
        .select()
        .maybeSingle();

      if (callError) throw callError;

      await supabase.from('call_participants').insert({
        call_id: call.id,
        user_id: currentUser.id,
        is_muted: true,
        is_video_on: false,
        joined_at: new Date().toISOString(),
      });

      dispatch(setActiveCall(call));
      dispatch(openCallRoom());
    } catch (err) {
      console.error(err);
    } finally {
      setIsStartingCall(false);
    }
  }, [dispatch, currentUser, isCallActive, isStartingCall]);

  const groupName = group?.name ?? "124-Maktab Sinfdoshlari";

  return (
    <>
      <header 
        className="relative z-40 flex items-center justify-between px-3 sm:px-5 h-[60px] sm:h-[68px] shrink-0 w-full bg-white/75 dark:bg-[#121214]/75 backdrop-blur-3xl saturate-150 border-b border-neutral-200 dark:border-white/10 transition-colors duration-300"
      >
        <div className="flex items-center flex-1 min-w-0 h-full overflow-hidden">
          <AnimatePresence mode="wait">
            {!isSearchOpen ? (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
                className="flex items-center gap-3 flex-1 min-w-0 h-full cursor-pointer group"
                onClick={onOpenSidebar}
                whileTap={{ scale: 0.97 }}
              >
                <div className="shrink-0 relative shadow-sm rounded-full">
                  <Avatar
                    src={group?.avatar_url}
                    firstName={groupName.split(' ')[0]}
                    lastName={groupName.split(' ')[1]}
                    size="md"
                    isRound={true}
                  />
                </div>

                <div className="flex flex-col min-w-0 justify-center">
                  <h1 className="text-[16px] sm:text-[17px] font-bold text-neutral-900 dark:text-white tracking-tight truncate leading-tight group-hover:text-[#007aff] transition-colors duration-300">
                    {groupName}
                  </h1>
                  
                  <AnimatePresence mode="wait">
                    {typingText ? (
                      <motion.div
                        key="typing"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-1.5"
                      >
                        <span className="text-[#007aff] text-[12px] sm:text-[13px] font-medium truncate tracking-wide">
                          {typingText}
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="status"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        {onlineCount > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        )}
                        <span className="text-[12px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 truncate transition-colors duration-300">
                          {onlineCount > 0 ? (
                            <span className="text-emerald-500 dark:text-emerald-400/90">{onlineCount} onlayn</span>
                          ) : null}
                          {onlineCount > 0 && totalMembers > 0 && <span className="mx-1.5 opacity-50">·</span>}
                          {totalMembers > 0 ? `${totalMembers} a'zo` : ''}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="search"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '100%' }}
                exit={{ opacity: 0, width: 0, transition: { duration: 0.15 } }}
                className="flex items-center flex-1 h-9 bg-neutral-100 dark:bg-white/10 rounded-[12px] px-3 border border-neutral-200 dark:border-white/5 shadow-inner backdrop-blur-md transition-colors duration-300"
              >
                <Search size={16} className="text-slate-400 dark:text-slate-500 shrink-0 mr-2 transition-colors duration-300" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                  placeholder="Xabarlardan izlash..."
                  className="flex-1 bg-transparent text-[15px] font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-slate-500 outline-none w-full transition-colors duration-300"
                />
                {searchQuery && (
                  <motion.button
                    释放Tap={{ scale: 0.9 }}
                    onClick={() => dispatch(setSearchQuery(''))}
                    className="p-1 rounded-full bg-neutral-200 dark:bg-white/20 hover:bg-neutral-300 dark:hover:bg-white/30 text-neutral-600 dark:text-white shrink-0 ml-2 transition-colors duration-300"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* O'ng tomon tugmalari */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-2">
          <Tooltip content={isSearchOpen ? 'Yopish' : 'Qidirish'} placement="bottom">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => dispatch(toggleSearch())}
              className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-colors duration-300 ${
                isSearchOpen ? 'bg-[#007aff]/15 text-[#007aff]' : 'text-[#007aff] hover:bg-[#007aff]/15'
              }`}
            >
              {isSearchOpen ? <X size={20} strokeWidth={2.5} /> : <Search size={20} strokeWidth={2.5} />}
            </motion.button>
          </Tooltip>

          {!isCallActive && !isSearchOpen && (
            <Tooltip content="Video qo'ng'iroq" placement="bottom">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleStartCall}
                disabled={isStartingCall}
                className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-colors duration-300 ${
                  isStartingCall ? 'opacity-50 cursor-wait' : 'text-[#007aff] hover:bg-[#007aff]/15'
                }`}
              >
                {isStartingCall ? (
                  <div className="w-5 h-5 border-[2.5px] border-[#007aff] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Video size={22} strokeWidth={2.2} />
                )}
              </motion.button>
            </Tooltip>
          )}

          {!isSearchOpen && (
            <div className="relative" ref={menuRef}>
              <Tooltip content="Menyu" placement="bottom">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-colors duration-300 ${
                    isMenuOpen ? 'bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white' : 'text-[#007aff] hover:bg-[#007aff]/15'
                  }`}
                >
                  <MoreVertical size={22} strokeWidth={2.2} />
                </motion.button>
              </Tooltip>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10, transformOrigin: 'top right' }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    className="absolute right-0 top-[calc(100%+8px)] w-[220px] bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-3xl border border-neutral-200 dark:border-white/10 rounded-[18px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col z-50 p-1.5 transition-colors duration-300"
                  >
                    <button
                      onClick={() => { setIsMenuOpen(false); setIsProfileModalOpen(true); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[15px] font-semibold text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10 active:scale-[0.98] transition-all duration-200"
                    >
                      <UserCircle size={18} className="text-[#007aff]" strokeWidth={2.5} />
                      Mening profilim
                    </button>
                    
                    <button
                      onClick={() => { setIsMenuOpen(false); onOpenSidebar(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[15px] font-semibold text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10 active:scale-[0.98] transition-all duration-200"
                    >
                      <Info size={18} className="text-[#007aff]" strokeWidth={2.5} />
                      Guruh ma'lumotlari
                    </button>

                    <button
                      onClick={() => { setIsMenuOpen(false); setIsSettingsOpen(true); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[15px] font-semibold text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10 active:scale-[0.98] transition-all duration-200"
                    >
                      <Settings size={18} className="text-neutral-500 dark:text-slate-400 transition-colors duration-200" strokeWidth={2.5} />
                      Sozlamalar
                    </button>

                    <div className="h-[1px] bg-neutral-200 dark:bg-white/10 my-1 mx-2 transition-colors duration-300" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[15px] font-semibold text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/15 active:scale-[0.98] transition-all"
                    >
                      <LogOut size={18} strokeWidth={2.5} />
                      Chiqish
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* PROFIL MODAL */}
      {isProfileModalOpen && (
        <EditMyProfile 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
        />
      )}

      {/* SOZLAMALAR MODAL (YANGI) */}
      {isSettingsOpen && (
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </>
  );
};

export default ChatHeader;
