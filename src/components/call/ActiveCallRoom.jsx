import { useEffect, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, ChevronDown, Phone } from 'lucide-react';
import io from 'socket.io-client';
import { supabase } from '../../config/supabaseClient';
import {
  selectActiveCall, selectParticipants, selectMyStatus, selectIsCallRoomOpen,
  setParticipants, addParticipant, removeParticipant, updateParticipantStatus,
  toggleMyMute, toggleMyVideo, closeCallRoom, endCall,
} from '../../redux/callSlice';
import { selectUser, selectIsOwner, selectIsAdmin } from '../../redux/authSlice';
import ParticipantGrid from './ParticipantGrid';

const SERVER_URL = "https://sinfserver.onrender.com"; 

const ActiveCallRoom = () => {
  const dispatch = useDispatch();
  const activeCall = useSelector(selectActiveCall);
  const participants = useSelector(selectParticipants);
  const myStatus = useSelector(selectMyStatus);
  const isOpen = useSelector(selectIsCallRoomOpen);
  const currentUser = useSelector(selectUser);
  const canEndForAll = useSelector(selectIsOwner) || useSelector(selectIsAdmin);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const rtcPeersRef = useRef({}); 
  
  const [remoteStreams, setRemoteStreams] = useState({});
  const [localStream, setLocalStream] = useState(null);

  const iceConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
    ]
  };

  // 1. Ekranni qotirish mantiqi
  useEffect(() => {
    if (!isOpen) return;
    const preventZoom = (e) => { if (e.touches.length > 1) e.preventDefault(); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('touchmove', preventZoom, { passive: false });
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('touchmove', preventZoom);
    };
  }, [isOpen]);

  // 2. To'satdan brauzer yopilganda ishtirokchini tozalash (Crash/Tab close guard)
  const handleUnexpectedLeave = useCallback(async () => {
    if (!activeCall?.id || !currentUser?.id) return;
    await supabase.from('call_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('call_id', activeCall.id)
      .eq('user_id', currentUser.id);
  }, [activeCall, currentUser]);

  useEffect(() => {
    window.addEventListener('beforeunload', handleUnexpectedLeave);
    return () => window.removeEventListener('beforeunload', handleUnexpectedLeave);
  }, [handleUnexpectedLeave]);

  // 3. Supabase Realtime (Ishtirokchilar, Statuslar va Profillar sinxronizatsiyasi)
  useEffect(() => {
    const callId = activeCall?.id;
    if (!callId || !isOpen) return;

    const fetchParts = async () => {
      const { data } = await supabase.from('call_participants').select('*, profiles:user_id(id, first_name, last_name, avatar_url)').eq('call_id', callId).is('left_at', null);
      if (data) {
        dispatch(setParticipants(data));
        // Agar hamma chiqib ketgan bo'lsa va faqat o'zi qolgan bo'lsa ham tekshiramiz
        if (data.length === 0) autoCloseCall();
      }
    };
    fetchParts();

    // Xonani avtomat o'chirish
    const autoCloseCall = async () => {
      const { data } = await supabase.from('call_participants').select('id').eq('call_id', callId).is('left_at', null);
      if (!data || data.length === 0) {
        await supabase.from('active_calls').update({ is_active: false, ended_at: new Date().toISOString() }).eq('id', callId);
        dispatch(endCall());
      }
    };

    const channel = supabase.channel(`call-room-${callId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_participants', filter: `call_id=eq.${callId}` }, async (payload) => {
        const { data } = await supabase.from('call_participants').select('*, profiles:user_id(id, first_name, last_name, avatar_url)').eq('call_id', payload.new.call_id).eq('user_id', payload.new.user_id).maybeSingle();
        if (data) dispatch(addParticipant(data));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'call_participants', filter: `call_id=eq.${callId}` }, async (payload) => {
        if (payload.new.left_at) {
          dispatch(removeParticipant({ user_id: payload.new.user_id }));
          setTimeout(autoCloseCall, 1000); // Kimdir chiqsa tekshiramiz, hech kim qoldimi?
        } else if (payload.new.user_id === currentUser?.id) {
          // O'zimizning status o'zgargan bo'lsa ham setkaga ta'sir qilmasligi kerak
        } else {
          dispatch(updateParticipantStatus({ user_id: payload.new.user_id, is_muted: payload.new.is_muted, is_video_on: payload.new.is_video_on }));
        }
      })
      // 🔴 JONLI PROFIYAL SINXRONIZATSIYASI (Ism o'zgarganda darhol o'zgaradi)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, async (payload) => {
        const isParticipant = participants.some(p => p.user_id === payload.new.id);
        if (isParticipant) {
          fetchParts(); // Profil yangilansa ishtirokchilarni qayta yuklaymiz
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'active_calls', filter: `id=eq.${callId}` }, (payload) => {
        if (!payload.new.is_active) { dispatch(endCall()); }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, activeCall?.id, currentUser?.id, dispatch, participants]);

  // 4. WebRTC Ulanish Dvigateli
  useEffect(() => {
    if (!isOpen || !currentUser?.id || !activeCall?.id) return;

    const startCallEngine = async () => {
      let stream = new MediaStream();
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (e) {
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false }); } catch (err) {}
      }

      stream.getAudioTracks().forEach(t => t.enabled = !myStatus.is_muted);
      stream.getVideoTracks().forEach(t => t.enabled = myStatus.is_video_on);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      socket.emit('join-room', {
        callId: activeCall.id.toString(),
        userId: currentUser.id,
        userName: currentUser.first_name || 'User'
      });

      socket.on('current-room-users', async (users) => {
        for (const user of users) {
          await initiateCall(user.socketId, user.userId, stream);
        }
      });

      socket.on('user-joined', ({ socketId, userId }) => {
        createPeerConnection(socketId, userId, stream);
      });

      socket.on('webRTC-signal', async ({ fromSocketId, signalData }) => {
        let pc = Object.values(rtcPeersRef.current).find(p => p.targetSocketId === fromSocketId);
        if (!pc) return;

        if (signalData.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          if (signalData.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webRTC-signal', { toSocketId: fromSocketId, signalData: { sdp: pc.localDescription } });
          }
        } else if (signalData.ice) {
          try { await pc.addIceCandidate(new RTCIceCandidate(signalData.ice)); } catch (e) {}
        }
      });

      socket.on('user-left', ({ userId }) => {
        closePeerConnection(userId);
      });
    };

    startCallEngine();

    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      if (socketRef.current) socketRef.current.disconnect();
      Object.keys(rtcPeersRef.current).forEach(userId => closePeerConnection(userId));
    };
  }, [isOpen, activeCall?.id, currentUser?.id]);

  const createPeerConnection = (targetSocketId, targetUserId, stream) => {
    if (rtcPeersRef.current[targetUserId]) return rtcPeersRef.current[targetUserId];

    const pc = new RTCPeerConnection(iceConfig);
    pc.targetSocketId = targetSocketId;
    rtcPeersRef.current[targetUserId] = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webRTC-signal', { toSocketId: targetSocketId, signalData: { ice: event.candidate } });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStreams(prev => ({ ...prev, [targetUserId]: event.streams[0] }));
      }
    };

    return pc;
  };

  const initiateCall = async (targetSocketId, targetUserId, stream) => {
    const pc = createPeerConnection(targetSocketId, targetUserId, stream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current.emit('webRTC-signal', { toSocketId: targetSocketId, signalData: { sdp: pc.localDescription } });
  };

  const closePeerConnection = (userId) => {
    if (rtcPeersRef.current[userId]) {
      rtcPeersRef.current[userId].close();
      delete rtcPeersRef.current[userId];
    }
    setRemoteStreams(prev => { const u = {...prev}; delete u[userId]; return u; });
  };

  // Tugmalar va boshqaruv
  const handleToggleMute = async () => {
    const newMuted = !myStatus.is_muted;
    dispatch(toggleMyMute());
    if (localStreamRef.current) localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !newMuted);
    await supabase.from('call_participants').update({ is_muted: newMuted }).eq('call_id', activeCall.id).eq('user_id', currentUser.id);
  };

  const handleToggleVideo = async () => {
    const newVideoOn = !myStatus.is_video_on;
    dispatch(toggleMyVideo());
    if (localStreamRef.current) localStreamRef.current.getVideoTracks().forEach(t => t.enabled = newVideoOn);
    await supabase.from('call_participants').update({ is_video_on: newVideoOn }).eq('call_id', activeCall.id).eq('user_id', currentUser.id);
  };

  const handleMinimizeCall = () => {
    // 🔴 Modalni butunlay yo'qotib yopmaymiz, faqat oynani yopamiz. 
    // CallBar fonda suzib yuradi va aloqa uzilmaydi.
    dispatch(closeCallRoom()); 
  };

  const handleLeave = async () => {
    dispatch(closeCallRoom());
    await supabase.from('call_participants').update({ left_at: new Date().toISOString() }).eq('call_id', activeCall.id).eq('user_id', currentUser.id);
  };

  const handleEndForAll = async () => {
    dispatch(endCall());
    await supabase.from('active_calls').update({ is_active: false, ended_at: new Date().toISOString() }).eq('id', activeCall.id);
  };

  if (!isOpen || !activeCall) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-2xl flex flex-col justify-end sm:justify-center items-center"
        >
          <div className="w-full h-full flex flex-col relative">
            {/* 🔴 iMESSAGE STYLED ADAPTIVE SPRING FRAME */}
            <motion.div 
              initial={{ y: '100%', scale: 0.92 }} 
              animate={{ y: 0, scale: 1 }} 
              exit={{ y: '100%', scale: 0.92 }} 
              transition={{ type: 'spring', damping: 26, stiffness: 240, mass: 0.8 }}
              className="w-full max-w-5xl h-[100dvh] sm:h-[85dvh] bg-[#111112]/92 sm:rounded-[38px] flex flex-col overflow-hidden relative shadow-[0_25px_70px_rgba(0,0,0,0.7)] border border-white/10 mx-auto backdrop-blur-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-12 sm:pt-6 pb-4 border-b border-white/5 bg-white/5 backdrop-blur-md z-20 sticky top-0">
                <div className="flex items-center gap-3">
                  <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Jonli</span>
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-white tracking-tight leading-tight">Ovozli muloqot</span>
                    <span className="text-[11px] text-slate-400 font-medium mt-0.5">{participants.length} ishtirokchi</span>
                  </div>
                </div>
                
                {/* Pastga tushirish (Minimize) tugmasi */}
                <motion.button 
                  whileTap={{ scale: 0.85 }}
                  onClick={handleMinimizeCall} 
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition-all border border-white/5 shadow-inner"
                >
                  <ChevronDown size={22} strokeWidth={2.5} />
                </motion.button>
              </div>

              {/* O'ZINGIZNING KAMERANGIZ (Picture in Picture - Drag va Silliq harakatlar) */}
              <motion.div 
                drag dragConstraints={{ top: 0, bottom: 440, left: -220, right: 0 }}
                whileDrag={{ scale: 1.05 }}
                className="absolute top-24 right-6 w-[100px] h-[145px] bg-[#1a1a1c] rounded-[20px] overflow-hidden shadow-2xl border border-white/10 z-50 cursor-grab active:cursor-grabbing shadow-[0_15px_35px_rgba(0,0,0,0.5)]"
              >
                <video ref={el => { if (el && localStream && el.srcObject !== localStream) el.srcObject = localStream; }} autoPlay playsInline muted className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${myStatus.is_video_on ? 'opacity-100' : 'opacity-0'}`} />
                {!myStatus.is_video_on && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#18181a]">
                    <VideoOff size={20} className="text-slate-500 mb-1 opacity-60" />
                    <span className="text-[10px] text-slate-400 font-semibold tracking-wide">Siz</span>
                  </div>
                )}
                {myStatus.is_muted && <div className="absolute bottom-2 right-2 bg-black/60 p-1.5 rounded-full backdrop-blur-sm border border-white/5"><MicOff size={11} className="text-red-400" /></div>}
              </motion.div>

              {/* ISHTIROKCHILAR SETKASI */}
              <div className="flex-1 overflow-hidden relative bg-[#070708]">
                <ParticipantGrid remoteStreams={remoteStreams} />
              </div>

              {/* TUGMALAR PANELI */}
              <div className="px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+24px)] bg-[#18181a]/90 border-t border-white/5 z-20 flex justify-center items-center gap-4 sm:gap-6 backdrop-blur-xl">
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleToggleMute} className={`w-[66px] h-[66px] rounded-[24px] shadow-md flex justify-center items-center transition-all duration-300 ${myStatus.is_muted ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10' : 'bg-white text-black font-bold shadow-[0_0_25px_rgba(255,255,255,0.15)]'}`}>
                  {myStatus.is_muted ? <MicOff size={24} /> : <Mic size={24} />}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleToggleVideo} className={`w-[66px] h-[66px] rounded-[24px] shadow-md flex justify-center items-center transition-all duration-300 ${myStatus.is_video_on ? 'bg-white text-black font-bold shadow-[0_0_25px_rgba(255,255,255,0.15)]' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}>
                  {myStatus.is_video_on ? <Video size={24} /> : <VideoOff size={24} />}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleLeave} className="w-[66px] h-[66px] rounded-[24px] bg-[#ff3b30] text-white flex justify-center items-center shadow-[0_10px_25px_rgba(255,59,48,0.35)] hover:bg-[#ff453a] transition-all">
                  <PhoneOff size={24} />
                </motion.button>
                {canEndForAll && (
                  <motion.button whileTap={{ scale: 0.9 }} onClick={handleEndForAll} className="w-[66px] h-[66px] rounded-[24px] bg-[#ff3b30]/10 text-[#ff453a] border border-[#ff3b30]/20 flex justify-center items-center hover:bg-[#ff3b30]/20 transition-all">
                    <Phone size={24} className="rotate-[135deg]" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActiveCallRoom;