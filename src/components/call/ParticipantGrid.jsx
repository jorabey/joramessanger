import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MicOff, VideoOff, Phone, Volume2 } from 'lucide-react';
import { selectParticipants } from '../../redux/callSlice';
import { selectUser } from '../../redux/authSlice';
import Avatar from '../ui/Avatar';

// 🎤 AVTOMATIK OVOZ SEZUVCHI HOOK (Tebranish oqimini silliqlashtirilgan versiyasi)
const useActiveSpeaker = (stream) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setIsSpeaking(false);
      return;
    }
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4; // Animatsiya sakrab-sakrab ketmasligi uchun silliqlash
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const interval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / dataArray.length;
        setIsSpeaking(avg > 12); 
      }, 200); // Tezlik oshirildi (Realtime rejim uchun)

      return () => { clearInterval(interval); audioCtx.close(); };
    } catch (e) {
      // AudioContext xavfsizlik cheklovlari uchun sokin rejim
    }
  }, [stream]);

  return isSpeaking;
};

// 🎥 NATIVE VIDEO PLAYER
const VideoPlayer = ({ stream, isVideoOn }) => {
  return (
    <>
      <video
        ref={el => { if (el && stream && el.srcObject !== stream) el.srcObject = stream; }}
        autoPlay
        playsInline
        className={`w-full h-full object-cover transition-transform duration-700 ease-out ${isVideoOn ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
      />
      <AnimatePresence>
        {!isVideoOn && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#161618]"
          >
            <VideoOff size={28} className="text-white/10" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// 👤 INDIVIDUAL ISHTIROKCHI KARTASI (iMessage & Telegram Dizayn)
const ParticipantCard = ({ p, stream, isFocused, onClick }) => {
  const isSpeaking = useActiveSpeaker(stream);

  return (
    <motion.div 
      layout // 🔴 LAYOUT ANIMATSIYASI: Kattalashganda o'ta silliq kengayadi
      transition={{ type: 'spring', damping: 28, stiffness: 220, mass: 0.9 }}
      onClick={onClick}
      className={`relative overflow-hidden bg-[#1c1c1e] cursor-pointer border select-none group flex flex-col items-center justify-center
        ${isFocused 
          ? 'w-full h-[55vh] sm:h-[65vh] rounded-[32px] z-30 shadow-[0_30px_60px_rgba(0,0,0,0.8)]' 
          : 'w-[150px] h-[200px] sm:w-[210px] sm:h-[270px] rounded-[24px] shadow-lg hover:scale-[1.02]'
        }
        ${isSpeaking 
          ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.25)]' 
          : 'border-white/5 hover:border-white/10'
        }
      `}
    >
      {/* Orqa fondagi video yoki avatar oqimi */}
      <VideoPlayer stream={stream} isVideoOn={p.is_video_on} />

      {/* Agar video o'chiq bo'lsa, markazda chiroyli neon effektli Avatar */}
      <AnimatePresence>
        {!p.is_video_on && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className={`relative flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'scale-105' : ''}`}>
              {/* 🟢 Telegram uslubidagi gapirish nuri (Profil atrofi) */}
              {isSpeaking && (
                <motion.span 
                  animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-emerald-500/30 blur-md"
                />
              )}
              <Avatar 
                src={p.profiles?.avatar_url} 
                firstName={p.profiles?.first_name} 
                lastName={p.profiles?.last_name} 
                size={isFocused ? '3xl' : 'xl'} 
                isRound 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pastki info panel (iMessage blur effekti) */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/40 backdrop-blur-xl px-3 py-2 rounded-[14px] z-20 border border-white/5 shadow-md transform translate-y-0 group-hover:bg-black/60 transition-all">
        <div className="flex items-center gap-1.5 min-w-0">
          {isSpeaking && <Volume2 size={14} className="text-emerald-400 shrink-0 animate-bounce" />}
          <span className={`font-semibold text-white truncate transition-all ${isFocused ? 'text-[14px]' : 'text-[12px]'}`}>
            {p.profiles?.first_name || 'Foydalanuvchi'}
          </span>
        </div>
        
        <AnimatePresence>
          {p.is_muted && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="bg-red-500/20 p-1 rounded-md border border-red-500/30">
              <MicOff size={12} className="text-red-400 shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ovoz to'lqinlari (Yuqori o'ng burchakda - Telegram kabi premium detail) */}
      {isSpeaking && (
         <div className="absolute top-3 right-3 flex items-end gap-[3px] z-20 h-4 bg-black/40 backdrop-blur-md p-1.5 px-2 rounded-full border border-white/5">
            <span className="w-[2px] bg-emerald-400 rounded-full animate-pulse h-2"></span>
            <span className="w-[2px] bg-emerald-400 rounded-full animate-pulse h-3.5 delay-75"></span>
            <span className="w-[2px] bg-emerald-400 rounded-full animate-pulse h-2.5 delay-150"></span>
         </div>
      )}
    </motion.div>
  );
};

// 👥 JAMIY ISHTIROKCHILAR GRIDI
const ParticipantGrid = ({ remoteStreams }) => {
  const participants = useSelector(selectParticipants);
  const currentUser = useSelector(selectUser);
  const [focusedId, setFocusedId] = useState(null);

  // O'zimizni katta setkadan olib tashlaymiz (Chunki biz doim tepadagi kichik PIP oynadamiz)
  const otherParticipants = participants.filter(p => p.user_id !== currentUser?.id);

  if (otherParticipants.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-4">
        <motion.div 
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl"
        >
          <Phone size={24} className="text-slate-400 fill-slate-400/10" />
        </motion.div>
        <p className="font-semibold text-[13px] tracking-wide text-slate-400">Suhbatdoshlar kutilmoqda...</p>
      </div>
    );
  }

  // Fokuslangan foydalanuvchi va qolganlar ro'yxati
  const focusedParticipant = otherParticipants.find(p => p.user_id === focusedId);
  const regularParticipants = otherParticipants.filter(p => p.user_id !== focusedId);

  return (
    <motion.div 
      layout
      className="w-full h-full p-4 sm:p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar gap-4"
    >
      <AnimatePresence mode="popLayout">
        {/* 🔴 Ssenariy A: Biror kim fokuslangan (Katta ekran rejim) */}
        {focusedId && focusedParticipant ? (
          <div className="w-full h-full flex flex-col gap-4">
            {/* Katta oyna */}
            <div className="flex-1 flex justify-center items-center">
              <ParticipantCard 
                p={focusedParticipant}
                stream={remoteStreams[focusedParticipant.user_id]}
                isFocused={true}
                onClick={() => setFocusedId(null)}
              />
            </div>
            {/* Pastdagi kichik ishtirokchilar iMessage lentasi */}
            <motion.div 
              layout
              className="flex items-center gap-3 overflow-x-auto py-2 px-1 max-w-full custom-scrollbar justify-start sm:justify-center"
            >
              {regularParticipants.map((p) => (
                <ParticipantCard 
                  key={p.user_id}
                  p={p}
                  stream={remoteStreams[p.user_id]}
                  isFocused={false}
                  onClick={() => setFocusedId(p.user_id)}
                />
              ))}
            </motion.div>
          </div>
        ) : (
          /* 🍏 Ssenariy B: Hech kim fokuslanmagan (Standart Grid ko'rinish) */
          <motion.div 
            layout
            className="w-full h-full flex flex-wrap justify-center content-center items-center gap-4"
          >
            {otherParticipants.map((p) => (
              <ParticipantCard 
                key={p.user_id}
                p={p}
                stream={remoteStreams[p.user_id]}
                isFocused={false}
                onClick={() => setFocusedId(p.user_id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ParticipantGrid;