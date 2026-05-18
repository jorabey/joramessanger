 import { useEffect, useState, useCallback, useRef } from 'react';

import { useNavigate } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';

import { motion, AnimatePresence } from 'framer-motion';


import { supabase } from '../config/supabaseClient';

import { usePresence } from '../hooks/usePresence';

import { useMessages } from '../hooks/useMessages';

import { useMediaRecorder } from '../hooks/useMediaRecorder';


import { selectIsAuthenticated, selectIsInitialized } from '../redux/authSlice';

import { setShouldScrollToBottom } from '../redux/chatSlice';

import {

  setActiveCall,

  setParticipants,

  addParticipant,

  removeParticipant,

  updateParticipantStatus,

  endCall,

  selectIsCallRoomOpen,

  selectIsCallBarVisible,

} from '../redux/callSlice';


import ChatHeader from '../components/chat/ChatHeader';

import MessageList from '../components/chat/MessageList';

import ChatInput from '../components/chat/ChatInput';

import CallBar from '../components/call/CallBar';

import ActiveCallRoom from '../components/call/ActiveCallRoom';

import GroupSidebar from '../components/group/GroupSidebar';

import Loader from '../components/ui/Loader';

import VideoNoteModal from '../components/ui/VideoNoteModal';


const GROUP_ID = import.meta.env.VITE_GROUP_ID;


const ChatPage = () => {

  const dispatch = useDispatch();

  const navigate = useNavigate();

  

  const isAuth = useSelector(selectIsAuthenticated);

  const isInit = useSelector(selectIsInitialized);

  

  const isCallRoomOpen = useSelector(selectIsCallRoomOpen);

  const isCallBarVisible = useSelector(selectIsCallBarVisible);


  const { onlineCount, typingText, sendTyping, stopTyping } = usePresence();

  const { sendMessage, editMessage, fetchMoreMessages, deleteMessage, toggleReaction, markAsRead } = useMessages();

  

  const recorder = useMediaRecorder();

  

  const [group, setGroup] = useState(null);

  const [members, setMembers] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);


  const [viewportHeight, setViewportHeight] = useState('100dvh');


  const callChannelRef = useRef(null);

  const dataChannelRef = useRef(null);


  // ----------------------------------------

  // 🔴 ZOOM BLOCKER & VISUAL VIEWPORT ENGINE

  // ----------------------------------------

  useEffect(() => {

    if (!isInit) return;


    document.body.style.position = 'fixed';

    document.body.style.top = '0';

    document.body.style.left = '0';

    document.body.style.right = '0';

    document.body.style.bottom = '0';

    document.body.style.overflow = 'hidden';


    const preventZoom = (e) => {

      if (e.touches.length > 1) e.preventDefault();

    };

    

    let lastTouchEnd = 0;

    const preventDoubleTapZoom = (e) => {

      const now = (new Date()).getTime();

      if (now - lastTouchEnd <= 300) e.preventDefault();

      lastTouchEnd = now;

    };


    document.addEventListener('touchstart', preventZoom, { passive: false });

    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });


    let lastHeight = window.innerHeight;


    const handleResize = () => {

      if (window.visualViewport) {

        const currentHeight = window.visualViewport.height;

        setViewportHeight(`${currentHeight}px`);

        if (currentHeight < lastHeight - 100) {

          dispatch(setShouldScrollToBottom(true));

        }

        lastHeight = currentHeight;

        window.scrollTo(0, 0);

      } else {

        setViewportHeight(`${window.innerHeight}px`);

      }

    };


    if (window.visualViewport) {

      window.visualViewport.addEventListener('resize', handleResize);

      window.visualViewport.addEventListener('scroll', handleResize);

    } else {

      window.addEventListener('resize', handleResize);

    }

    

    handleResize();


    return () => {

      document.body.style.position = '';

      document.body.style.top = '';

      document.body.style.left = '';

      document.body.style.right = '';

      document.body.style.bottom = '';

      document.body.style.overflow = '';

      

      document.removeEventListener('touchstart', preventZoom);

      document.removeEventListener('touchend', preventDoubleTapZoom);


      if (window.visualViewport) {

        window.visualViewport.removeEventListener('resize', handleResize);

        window.visualViewport.removeEventListener('scroll', handleResize);

      } else {

        window.removeEventListener('resize', handleResize);

      }

    };

  }, [isInit, dispatch]);


  useEffect(() => {

    if (isInit && !isAuth) navigate('/login', { replace: true });

  }, [isAuth, isInit, navigate]);


  const fetchGroupData = useCallback(async () => {

    if (!GROUP_ID) return;

    try {

      const [groupRes, membersRes] = await Promise.all([

        supabase.from('groups').select('*').eq('id', GROUP_ID).maybeSingle(),

        supabase

          .from('group_members')

          .select('*, profiles:user_id(id, first_name, last_name, avatar_url, email, bio, is_blocked)')

          .eq('group_id', GROUP_ID),

      ]);


      if (groupRes.data) setGroup(groupRes.data);

      if (membersRes.data) setMembers(membersRes.data);

    } catch (err) {

      console.error(err);

    } finally {

      setIsLoading(false);

    }

  }, []);


  useEffect(() => {

    if (!isAuth) return;

    fetchGroupData();


    const dataChannel = supabase

      .channel(`chatpage_data_sync_${GROUP_ID}`)

      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'groups', filter: `id=eq.${GROUP_ID}` }, (payload) => {

        setGroup(payload.new);

      })

      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {

        setMembers((prev) => prev.map((m) => 

          m.user_id === payload.new.id ? { ...m, profiles: { ...m.profiles, ...payload.new } } : m

        ));

      })

      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'group_members', filter: `group_id=eq.${GROUP_ID}` }, (payload) => {

        setMembers((prev) => prev.map((m) => 

          m.user_id === payload.new.user_id ? { ...m, ...payload.new } : m

        ));

      })

      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_members', filter: `group_id=eq.${GROUP_ID}` }, () => fetchGroupData())

      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'group_members', filter: `group_id=eq.${GROUP_ID}` }, () => fetchGroupData())

      .subscribe();


    dataChannelRef.current = dataChannel;


    return () => {

      if (dataChannelRef.current) supabase.removeChannel(dataChannelRef.current);

    };

  }, [isAuth, fetchGroupData]);


  const fetchActiveCall = useCallback(async () => {

    const { data } = await supabase

      .from('active_calls')

      .select('*, starter:started_by(first_name, last_name, avatar_url)')

      .eq('group_id', GROUP_ID)

      .eq('is_active', true)

      .maybeSingle();


    if (data) {

      dispatch(setActiveCall(data));

      const { data: parts } = await supabase

        .from('call_participants')

        .select('*, profiles:user_id(first_name, last_name, avatar_url)')

        .eq('call_id', data.id)

        .is('left_at', null);

      if (parts) dispatch(setParticipants(parts));

    }

  }, [dispatch]);


  useEffect(() => {

    if (!isAuth) return;

    fetchActiveCall();


    const channel = supabase

      .channel(`calls-${GROUP_ID}`)

      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'active_calls', filter: `group_id=eq.${GROUP_ID}` }, async (payload) => {

        const { data } = await supabase.from('active_calls').select('*, starter:started_by(first_name, last_name, avatar_url)').eq('id', payload.new.id).maybeSingle();

        if (data) dispatch(setActiveCall(data));

      })

      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'active_calls', filter: `group_id=eq.${GROUP_ID}` }, (payload) => {

        if (!payload.new.is_active) dispatch(endCall());

      })

      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_participants' }, async (payload) => {

        const { data } = await supabase.from('call_participants').select('*, profiles:user_id(first_name, last_name, avatar_url)').eq('call_id', payload.new.call_id).eq('user_id', payload.new.user_id).maybeSingle();

        if (data) dispatch(addParticipant(data));

      })

      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'call_participants' }, (payload) => {

        if (payload.new.left_at) {

          dispatch(removeParticipant({ user_id: payload.new.user_id }));

        } else {

          dispatch(updateParticipantStatus({

            user_id: payload.new.user_id,

            is_muted: payload.new.is_muted,

            is_video_on: payload.new.is_video_on,

          }));

        }

      })

      .subscribe();


    callChannelRef.current = channel;

    return () => {

      if (callChannelRef.current) supabase.removeChannel(callChannelRef.current);

    };

  }, [isAuth, dispatch, fetchActiveCall]);


  const handleSendMessage = useCallback(async (payload) => {

    try {

      if (payload.isEdit && payload.msgId) {

        await editMessage(payload.msgId, payload.content);

        return; 

      }

      if (payload.file) {

        await sendMessage({ content: payload.content || null, file: payload.file, messageType: payload.messageType });

      } else {

        await sendMessage({ content: payload.content, messageType: 'text' });

      }

      dispatch(setShouldScrollToBottom(true));

    } catch (err) {

      console.error(err);

    }

  }, [sendMessage, editMessage, dispatch]);


  if (!isInit || isLoading) return <Loader fullScreen />;

  if (!isAuth) return null;


  return (

    <div 

      className="absolute top-0 left-0 w-full flex flex-col bg-[#000000] overflow-hidden select-none"

      style={{ 

        height: viewportHeight,

        overscrollBehavior: 'none',

        WebkitTapHighlightColor: 'transparent',

        touchAction: 'manipulation' 

      }}

    >

      {/* 🍏 CHAT CONTAINER: Toza Flexbox oqimi bilan hamma narsa tartiblandi */}

      <div className="flex flex-col flex-1 min-h-0 w-full relative pt-[env(safe-area-inset-top)]">

        

        {/* 1. HEADER (Doim eng tepada static holatda, unga hech narsa tegmaydi) */}

        <div className="w-full shrink-0 z-50">

          <ChatHeader

            group={group}

            onlineCount={onlineCount}

            totalMembers={members.length}

            typingText={typingText}

            onOpenSidebar={() => setSidebarOpen(true)}

          />

        </div>


        {/* 2. MESSAGES CONTAINER (O'rtadagi bo'shliqni to'ldiradi) */}

        <div className="relative flex-1 min-h-0 w-full bg-[#000000] z-10 flex flex-col">

          <MessageList 

            onLoadMore={fetchMoreMessages}

            onDelete={deleteMessage}         

            onReact={toggleReaction}

            onMarkAsRead={markAsRead}

            members={members} 

          />


          {/* Typing Indicator */}

          <AnimatePresence>

            {typingText && (

              <motion.div

                initial={{ opacity: 0, scale: 0.85, y: 8 }}

                animate={{ opacity: 1, scale: 1, y: 0 }}

                exit={{ opacity: 0, scale: 0.85, y: 8, transition: { duration: 0.15 } }}

                transition={{ type: 'spring', stiffness: 450, damping: 28 }}

                className="absolute bottom-2 left-4 z-20 flex flex-col items-start pointer-events-none"

              >

                <div className="bg-[#1c1c1e]/90 border border-white/5 shadow-2xl rounded-[18px] rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5 backdrop-blur-2xl">

                  {[0, 1, 2].map((i) => (

                    <motion.div

                      key={i}

                      animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}

                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}

                      className="w-1.5 h-1.5 rounded-full bg-[#007aff]"

                    />

                  ))}

                </div>

                <span className="text-[10.5px] text-slate-400 font-semibold mt-1 ml-1 tracking-wide">

                  {typingText.replace('yozmoqda...', '...')}

                </span>

              </motion.div>

            )}

          </AnimatePresence>

        </div>


        {/* 3. BOTTOM PANEL: CallBar va Input mana shu yerda pastga mixlangan */}

        <div className="w-full bg-[#121214] border-t border-white/5 flex flex-col z-40 shrink-0">

          

          {/* 🔴 CALL BAR INTEGRATSIYASI (Pastdan yuqoriga nafis ochiladi) */}

          <AnimatePresence mode="popLayout">

            {isCallBarVisible && (

              <motion.div

                layout

                initial={{ height: 0, opacity: 0, scale: 0.96 }}

                animate={{ height: 'auto', opacity: 1, scale: 1 }}

                exit={{ height: 0, opacity: 0, scale: 0.96 }}

                transition={{ type: 'spring', damping: 28, stiffness: 240 }}

                className="w-full px-4 pt-3 pb-1 overflow-hidden"

              >

                {/* 🔴 DIQQAT: CallBar-ning o'ziga borib fixed klassini "relative" yoki "w-full" ga almashtiring */}

                <CallBar onOpenCallRoom={() => {}} />

              </motion.div>

            )}

          </AnimatePresence>


          {/* Chat Input har doim eng pastki chiziqda */}

          <div className="pb-[env(safe-area-inset-bottom)]">

            <ChatInput

              onSend={handleSendMessage}

              groupSettings={group}

              onTyping={sendTyping}

              onStopTyping={stopTyping}

              recorder={recorder}

            />

          </div>

        </div>

      </div>


      {/* OVERLAYS & FULLSCREEN MODALS */}

      <AnimatePresence>

        {recorder.isRecording && recorder.recordingType === 'video' && (

          <VideoNoteModal stream={recorder.stream} isRecording={recorder.isRecording} duration={recorder.duration} onFlip={recorder.flipCamera} />

        )}

      </AnimatePresence>


      <AnimatePresence>

        {isCallRoomOpen && <ActiveCallRoom />}

      </AnimatePresence>


      <GroupSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} group={group} members={members} onlineCount={onlineCount} />

    </div>

  );

};


export default ChatPage; 
