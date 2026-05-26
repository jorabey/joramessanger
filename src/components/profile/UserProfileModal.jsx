import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Send, Link2, ShieldAlert, X, UserCheck, UserX, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../config/supabaseClient';
import Button from '../ui/Button';
import { selectUser } from '../../redux/authSlice';
import { usePermissions } from '../../hooks/usePermissions';

// 🟢 MUKAMMAL YOSH HISOBLAGICH
const calcAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age > 0 ? age : null;
};

// 🟢 JSONB MA'LUMOTLARNI XAVFSIZ O'QISH
const parseSocials = (socials) => {
  if (!socials) return {};
  if (typeof socials === 'string') {
    try { return JSON.parse(socials); } catch { return {}; }
  }
  return socials;
};

const RoleBadge = ({ role }) => {
  const map = {
    owner: { label: 'Asoschi', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    admin: { label: 'Admin', color: 'bg-[#007aff]/15 text-[#007aff] border-[#007aff]/30' },
    user:  { label: 'A\'zo',  color: 'bg-white/10 text-white/70 border-white/10' },
  };
  const r = map[role] ?? map.user;
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-[8px] border uppercase tracking-widest ${r.color}`}>
      {r.label}
    </span>
  );
};

const SocialLink = ({ href, icon: Icon, label, colorCls }) => {
  if (!href) return null;
  return (
    <a
      href={href.startsWith('http') ? href : `https://${href}`}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className={`flex items-center justify-center w-[48px] h-[48px] rounded-full bg-[#2c2c2e] border border-white/5 shadow-sm hover:scale-105 transition-all duration-300 text-white/80 group active:scale-90 ${colorCls}`}
    >
      <Icon size={22} className="transition-transform group-hover:scale-110" strokeWidth={2} />
    </a>
  );
};

// 🟢 KATTALASHTIRILGAN TO'LIQ EKRAN RASM (Telegram style)
const FullscreenViewer = ({ src, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative flex items-center justify-center w-full h-full p-4"
        onClick={(e) => e.stopPropagation()} 
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.6}
        onDragEnd={(e, info) => {
          if (Math.abs(info.offset.y) > 80) onClose(); 
        }}
      >
        <img
          src={src}
          alt="To'liq rasm"
          className="max-w-full max-h-[85dvh] object-contain rounded-[24px] pointer-events-none select-none shadow-2xl"
        />
      </motion.div>

      <motion.button 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 right-6 p-3.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90 backdrop-blur-md"
        onClick={onClose}
      >
        <X size={24} />
      </motion.button>
    </motion.div>
  );
};

const UserProfileModal = ({ isOpen, onClose, user, role = 'user', isOnline = false }) => {
  const currentUser = useSelector(selectUser);
  const { canBlockUsers, isHigherThan } = usePermissions();

  const [isBlocking, setIsBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(user?.is_blocked ?? false);
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    if (user) setIsBlocked(user.is_blocked ?? false);
  }, [user]);

  useEffect(() => {
    if (!isOpen) setShowFullImage(false);
  }, [isOpen]);

  if (!user) return null;

  const isMe = currentUser?.id === user.id;
  const canBlock = !isMe && canBlockUsers && isHigherThan(role);
  
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Foydalanuvchi';
  const displayInitial = user.first_name ? user.first_name[0] : (user.email ? user.email[0].toUpperCase() : '?');
  
  // 🟢 MA'LUMOTLARNI TARTIBGA SOLISH
  const age = calcAge(user.dob);
  const sLinks = parseSocials(user.social_links);
  const insta = sLinks.instagram?.trim();
  const tg = sLinks.telegram?.trim();
  const yt = sLinks.youtube?.trim();
  const oth = sLinks.other?.trim();
  const hasSocials = insta || tg || yt || oth;

  // Rasm keshi muammosini oldini olish
  const avatarUrl = user.avatar_url ? `${user.avatar_url}${user.avatar_url.includes('?') ? '&' : '?'}v=${new Date(user.updated_at || Date.now()).getTime()}` : null;

  const handleToggleBlock = async () => {
    setIsBlocking(true);
    try {
      const newBlocked = !isBlocked;
      await supabase.from('profiles').update({ is_blocked: newBlocked }).eq('id', user.id);
      setIsBlocked(newBlocked);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleCloseModal = () => {
    if (showFullImage) setShowFullImage(false);
    else onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showFullImage && (
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
            
            {/* Fonni xiralashtirish */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
              onClick={handleCloseModal} 
            />

            {/* Asosiy Modal Oynasi */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.8 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.15}
              onDragEnd={(e, info) => {
                if (info.offset.y > 80 || info.velocity.y > 300) handleCloseModal();
              }}
              className="relative w-full sm:max-w-[420px] rounded-t-[28px] sm:rounded-[28px] overflow-hidden bg-[#1c1c1e] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col max-h-[90dvh] sm:max-h-[85vh]"
              onClick={(e) => e.stopPropagation()} 
            >
              {/* Tepadagi chiziqcha (Drag indicator) */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-white/40 rounded-full z-50 pointer-events-none" />

              {/* Yopish tugmasi */}
              <button
                onClick={handleCloseModal}
                className="absolute top-3.5 right-3.5 z-50 p-2 rounded-full bg-black/40 text-white/90 hover:bg-black/70 backdrop-blur-md transition-all active:scale-90"
              >
                <X size={20} strokeWidth={2.5} />
              </button>

              {/* 🟢 SCROLL BO'LADIGAN QISM (Mobilda qirqilmasligi uchun paddinglar qo'shildi) */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative flex flex-col pb-safe">
                
                {/* 🟢 YARIM EKRAN RASM */}
                <div 
                  className={`relative w-full h-[360px] sm:h-[400px] shrink-0 bg-[#2c2c2e] ${avatarUrl ? 'cursor-pointer active:opacity-90' : ''}`}
                  onClick={() => { if (avatarUrl) setShowFullImage(true); }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Cover" className="w-full h-full object-cover select-none" />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center select-none"
                      style={{ background: `linear-gradient(135deg, hsl(${(user.id?.charCodeAt(0) ?? 0) % 360}deg 80% 40%) 0%, hsl(${((user.id?.charCodeAt(0) ?? 0) + 60) % 360}deg 70% 15%) 100%)` }}
                    >
                      <span className="text-[110px] font-bold text-white/70 tracking-tighter">{displayInitial}</span>
                    </div>
                  )}

                  {/* Gradient (Silliq o'tish uchun) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1e] via-[#1c1c1e]/40 to-transparent pointer-events-none" />

                  {/* Ism va status */}
                  <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 pointer-events-none">
                    <h2 className="text-[32px] font-extrabold text-white tracking-tight drop-shadow-lg leading-tight mb-1">
                      {fullName}
                    </h2>
                    <p className={`text-[15px] font-semibold drop-shadow-md tracking-wide ${isOnline ? 'text-emerald-400' : 'text-white/50'}`}>
                      {isOnline ? 'Onlayn' : 'Yaqinda kirdi'}
                    </p>
                  </div>
                </div>

                {/* 🟢 BIO VA BOSHQA MA'LUMOTLAR */}
                <div className="px-6 pt-2 pb-10 flex flex-col gap-6">
                  
                  {/* Bio qismi */}
                  <div className="bg-[#2c2c2e]/50 rounded-[20px] p-4.5 border border-white/5">
                    <span className="text-[12px] text-[#007aff] font-bold block mb-1.5 uppercase tracking-wider">O'zi haqida</span>
                    <p className="text-[16px] text-white/95 leading-relaxed font-medium whitespace-pre-wrap">
                      {user.bio || <span className="italic text-white/30 font-normal">Ma'lumot yo'q</span>}
                    </p>
                  </div>

                  {/* Username va Yosh qismi */}
                  <div className="bg-[#2c2c2e]/50 rounded-[20px] p-4.5 border border-white/5 flex flex-col gap-4">
                    
                    <div>
                      <span className="text-[12px] text-[#007aff] font-bold block mb-1 uppercase tracking-wider">Foydalanuvchi nomi</span>
                      <p className="text-[16px] text-white/95 font-medium break-all">
                        {user.email || '@username'}
                      </p>
                    </div>

                    <div className="w-full h-px bg-white/5" />

                    <div className="flex items-center gap-3 flex-wrap">
                      <RoleBadge role={role} />
                      {age && (
                        <span className="flex items-center gap-1.5 bg-white/5 text-white/80 text-[12px] font-bold px-3 py-1 rounded-[8px] border border-white/5">
                          <Calendar size={14} /> {age} YOSH
                        </span>
                      )}
                      {isBlocked && (
                        <span className="flex items-center gap-1.5 bg-red-500/10 text-red-400 text-[12px] font-bold px-3 py-1 rounded-[8px] border border-red-500/10">
                          <ShieldAlert size={14} /> BLOKLANGAN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 🟢 IJTIMOIY TARMOQLAR KO'RINISHI */}
                  {hasSocials && (
                    <div className="flex flex-col gap-3">
                      <span className="text-[12px] text-white/40 font-bold uppercase tracking-wider px-2">Ijtimoiy tarmoqlar</span>
                      <div className="flex flex-wrap gap-3">
                        {insta && <SocialLink href={`https://instagram.com/${insta.replace('@', '')}`} icon={Link2} colorCls="hover:text-pink-500 hover:border-pink-500/30" />}
                        {tg && <SocialLink href={`https://t.me/${tg.replace('@', '')}`} icon={Send} colorCls="hover:text-[#34B7F1] hover:border-[#34B7F1]/30" />}
                        {yt && <SocialLink href={`https://youtube.com/${yt}`} icon={Link2} colorCls="hover:text-red-500 hover:border-red-500/30" />}
                        {oth && <SocialLink href={oth} icon={Link2} colorCls="hover:text-emerald-400 hover:border-emerald-400/30" />}
                      </div>
                    </div>
                  )}

                  {/* Bloklash tugmasi */}
                  {canBlock && (
                    <div className="pt-2">
                      <Button
                        variant={isBlocked ? 'secondary' : 'danger'}
                        size="lg"
                        fullWidth
                        isLoading={isBlocking}
                        leftIcon={isBlocked ? <UserCheck size={20} /> : <UserX size={20} />}
                        onClick={handleToggleBlock}
                        className="rounded-[18px] font-bold text-[16px] py-4 shadow-lg active:scale-[0.98] transition-transform"
                      >
                        {isBlocked ? 'Blokdan chiqarish' : 'Foydalanuvchini bloklash'}
                      </Button>
                    </div>
                  )}

                  {/* Mobilda eng pastdagi bo'sh joy */}
                  <div className="h-6 w-full shrink-0" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🟢 TO'LIQ EKRAN RASM */}
      <AnimatePresence>
        {showFullImage && avatarUrl && (
          <FullscreenViewer src={avatarUrl} onClose={() => setShowFullImage(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default UserProfileModal;
