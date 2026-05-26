import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Send, Link2, ShieldAlert, Calendar, X, UserCheck, UserX, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../config/supabaseClient';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { selectUser } from '../../redux/authSlice';
import { usePermissions } from '../../hooks/usePermissions';

// Yoshni hisoblash (xatoliklarni oldini olish uchun tekshiruvlar qo'shildi)
const calcAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const diff = Date.now() - birthDate.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const RoleBadge = ({ role }) => {
  const map = {
    owner: { label: 'Asoschi', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    admin: { label: 'Admin', color: 'bg-[#007aff]/10 text-[#007aff] border-[#007aff]/20' },
    user:  { label: 'A\'zo',  color: 'bg-white/5 text-slate-400 border-white/10' },
  };
  const r = map[role] ?? map.user;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${r.color}`}>
      {r.label}
    </span>
  );
};

const SocialLink = ({ href, icon: Icon, label, color }) => {
  if (!href) return null;
  return (
    <a
      href={href.startsWith('http') ? href : `https://${href}`}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className={`flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 text-slate-300 ${color} group active:scale-90 shadow-sm`}
    >
      <Icon size={20} className="transition-transform group-hover:scale-110" />
    </a>
  );
};

// 🟢 TELEGRAM USLUBIDAGI RASM KO'RSATGICH (Zo'r va chiroyli dizayn)
const TelegramImageViewer = ({ src, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative overflow-hidden rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10"
        onClick={(e) => e.stopPropagation()} // Ichiga bosganda yopilmasligi uchun
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={(e, info) => {
          if (Math.abs(info.offset.y) > 80) onClose(); // Tepaga yoki pastga tortganda yopiladi
        }}
      >
        <img
          src={src}
          alt="Avatar"
          className="w-[85vw] max-w-[380px] aspect-square object-cover select-none pointer-events-none"
        />
      </motion.div>

      {/* Yopish tugmasi */}
      <motion.button 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="absolute bottom-10 p-4 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-md transition-all active:scale-90"
        onClick={onClose}
      >
        <X size={26} />
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
    if (user) {
      setIsBlocked(user.is_blocked ?? false);
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) setShowFullImage(false);
  }, [isOpen]);

  if (!user) return null;

  const isMe = currentUser?.id === user.id;
  const canBlock = !isMe && canBlockUsers && isHigherThan(role);
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Foydalanuvchi';
  
  // 🟢 UNIVERSAL QIDIRUV: Bazangizda maydonlar qanday nomlangan bo'lishidan qat'iy nazar topib oladi
  const age = calcAge(user.dob || user.date_of_birth || user.birth_date);
  
  const instagram = user.instagram || user.social_links?.instagram;
  const telegram = user.telegram || user.social_links?.telegram || user.telegram_username;
  const youtube = user.youtube || user.social_links?.youtube;
  const otherLink = user.other_link || user.website || user.social_links?.other;
  
  const hasSocials = instagram || telegram || youtube || otherLink;

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
    if (showFullImage) {
      setShowFullImage(false);
    } else {
      onClose();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showFullImage && (
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-md"
              onClick={handleCloseModal} 
            />

            <motion.div
              initial={{ y: '100%', scale: 1 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: '100%', scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) handleCloseModal();
              }}
              className="relative w-full max-w-[420px] rounded-t-[38px] sm:rounded-[38px] overflow-hidden border border-white/10 shadow-[0_-10px_60px_rgba(0,0,0,0.5)] flex flex-col"
              style={{ 
                background: 'rgba(28, 28, 30, 0.85)', 
                backdropFilter: 'blur(40px) saturate(150%)',
                paddingBottom: 'env(safe-area-inset-bottom)'
              }}
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="w-full flex justify-center pt-3 pb-1 absolute top-0 z-50 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-white/20 rounded-full pointer-events-none" />
              </div>

              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all active:scale-90 backdrop-blur-md hidden sm:flex"
              >
                <X size={16} strokeWidth={3} />
              </button>

              <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
                
                <div className="relative h-[160px] w-full flex justify-center">
                  <div
                    className="absolute inset-0 opacity-50"
                    style={{
                      background: `linear-gradient(135deg, 
                        hsl(${(user.id?.charCodeAt(0) ?? 0) % 360}deg 80% 50%) 0%, 
                        hsl(${((user.id?.charCodeAt(0) ?? 0) + 60) % 360}deg 70% 20%) 100%)`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(28,28,30,0.85)] to-transparent" />
                  
                  {/* 🟢 AVATAR KATTALASHTIRILDI */}
                  <div 
                    className={`absolute -bottom-16 shadow-2xl rounded-full p-[4px] bg-[rgba(28,28,30,0.85)] backdrop-blur-xl ${avatarUrl ? 'cursor-pointer hover:scale-105 transition-transform active:scale-95' : ''}`}
                    onClick={() => { if (avatarUrl) setShowFullImage(true); }}
                  >
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden relative border border-white/10 bg-[#1c1c1e]">
                      <Avatar
                        src={avatarUrl}
                        firstName={user.first_name}
                        lastName={user.last_name}
                        userId={user.id}
                        isRound
                      />
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-[4px] border-[#1c1c1e] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    )}
                  </div>
                </div>

                <div className="pt-20 px-6 flex flex-col items-center text-center">
                  <h2 className="text-[28px] font-bold text-white tracking-tight leading-tight">{fullName}</h2>
                  <p className="text-[15px] text-slate-400 font-medium mt-1 mb-4">
                    {user.email || '@foydalanuvchi'}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 mb-7">
                    <RoleBadge role={role} />
                    {age && (
                      <span className="flex items-center gap-1.5 bg-white/5 border border-white/5 text-slate-300 text-[12px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        <Calendar size={12} strokeWidth={2.5} /> {age} YOSH
                      </span>
                    )}
                    {isBlocked && (
                      <span className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/20 text-red-400 text-[12px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        <ShieldAlert size={12} strokeWidth={2.5} /> BLOKLANGAN
                      </span>
                    )}
                    {!isOnline && (
                      <span className="flex items-center gap-1.5 bg-white/5 border border-white/5 text-slate-400 text-[12px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        <Clock size={12} strokeWidth={2.5} /> YAQINDA
                      </span>
                    )}
                  </div>

                  {user.bio ? (
                    <div className="w-full bg-white/5 rounded-[20px] p-4.5 border border-white/5 text-left mb-7 shadow-inner">
                      <p className="text-[15px] text-white/90 leading-relaxed font-medium">
                        {user.bio}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full bg-white/5 rounded-[20px] p-4 border border-white/5 text-center mb-7">
                      <p className="text-[14px] text-white/30 italic">Ma'lumot kiritilmagan</p>
                    </div>
                  )}

                  {/* 🟢 IJTIMOIY TARMOQLAR KO'RINISHI */}
                  {hasSocials && (
                    <div className="w-full flex justify-center gap-4 mb-7">
                      {instagram && <SocialLink href={`https://instagram.com/${instagram.replace('@', '')}`} icon={Link2} color="hover:text-pink-500 hover:border-pink-500/50 hover:bg-pink-500/10" />}
                      {telegram && <SocialLink href={`https://t.me/${telegram.replace('@', '')}`} icon={Send} color="hover:text-[#34B7F1] hover:border-[#34B7F1]/50 hover:bg-[#34B7F1]/10" />}
                      {youtube && <SocialLink href={`https://youtube.com/${youtube}`} icon={Link2} color="hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10" />}
                      {otherLink && <SocialLink href={otherLink} icon={Link2} color="hover:text-white hover:border-white/50 hover:bg-white/10" />}
                    </div>
                  )}

                  {canBlock && (
                    <div className="w-full">
                      <Button
                        variant={isBlocked ? 'secondary' : 'danger'}
                        size="lg"
                        fullWidth
                        isLoading={isBlocking}
                        leftIcon={isBlocked ? <UserCheck size={18} /> : <UserX size={18} />}
                        onClick={handleToggleBlock}
                        className="rounded-[18px] font-bold text-[16px] py-4"
                      >
                        {isBlocked ? 'Blokdan chiqarish' : 'Foydalanuvchini bloklash'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFullImage && avatarUrl && (
          <TelegramImageViewer src={avatarUrl} onClose={() => setShowFullImage(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default UserProfileModal;
