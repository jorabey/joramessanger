import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Send, Link2, ShieldAlert, X, UserCheck, UserX, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../config/supabaseClient';
import Button from '../ui/Button';
import { selectUser } from '../../redux/authSlice';
import { usePermissions } from '../../hooks/usePermissions';

// Universal yosh hisoblagich
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
    user:  { label: 'A\'zo',  color: 'bg-white/5 text-slate-300 border-white/10' },
  };
  const r = map[role] ?? map.user;
  return (
    <span className={`text-[12px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${r.color}`}>
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
      className={`flex items-center justify-center w-[46px] h-[46px] rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 text-slate-300 ${color} group active:scale-95`}
    >
      <Icon size={22} className="transition-transform group-hover:scale-110" />
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
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
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
          className="max-w-full max-h-[85vh] object-contain rounded-2xl pointer-events-none select-none"
        />
      </motion.div>

      <motion.button 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all active:scale-90"
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
  
  // Universal ma'lumot qidiruv (qanday yozilgan bo'lsa ham topadi)
  const age = calcAge(user.dob || user.date_of_birth || user.birth_date);
  
  const instagram = user.instagram || user.social_links?.instagram;
  const telegram = user.telegram || user.social_links?.telegram || user.telegram_username;
  const youtube = user.youtube || user.social_links?.youtube;
  const otherLink = user.other_link || user.website || user.social_links?.other;
  const hasSocials = instagram || telegram || youtube || otherLink;

  // Keshdan qochish uchun
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
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleCloseModal} 
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300, mass: 0.8 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 400) handleCloseModal();
              }}
              className="relative w-full sm:max-w-[420px] rounded-t-[24px] sm:rounded-[24px] overflow-hidden bg-[#1c1c1e] shadow-[0_-10px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()} 
            >
              {/* Tepadan tortish chizig'i */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/30 rounded-full z-50 pointer-events-none" />

              {/* Tepadagi yopish tugmasi */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-md transition-all active:scale-90"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              <div className="flex-1 overflow-y-auto custom-scrollbar relative pb-8">
                
                {/* 🟢 TELEGRAM USLUBIDAGI YARIM EKRAN RASM */}
                <div 
                  className={`relative w-full h-[340px] sm:h-[380px] shrink-0 ${avatarUrl ? 'cursor-pointer' : ''}`}
                  onClick={() => { if (avatarUrl) setShowFullImage(true); }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, hsl(${(user.id?.charCodeAt(0) ?? 0) % 360}deg 80% 45%) 0%, hsl(${((user.id?.charCodeAt(0) ?? 0) + 60) % 360}deg 70% 20%) 100%)` }}
                    >
                      <span className="text-[100px] font-bold text-white/80">{displayInitial}</span>
                    </div>
                  )}

                  {/* Gradient Blur effekti (Rasm va Ismni birlashtirish) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1e] via-[#1c1c1e]/40 to-transparent pointer-events-none" />

                  {/* Ism va status rasmni pastida */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 pb-4 pointer-events-none">
                    <h2 className="text-[28px] font-bold text-white tracking-tight drop-shadow-md leading-none mb-1.5">
                      {fullName}
                    </h2>
                    <p className={`text-[15px] font-medium drop-shadow-md ${isOnline ? 'text-emerald-400' : 'text-white/60'}`}>
                      {isOnline ? 'Online' : 'Yaqinda kirdi'}
                    </p>
                  </div>
                </div>

                {/* 🟢 BIO VA MA'LUMOTLAR QISMI (Toza dizayn) */}
                <div className="px-5 pt-3 flex flex-col gap-6">
                  
                  {/* Bio */}
                  <div>
                    <p className="text-[16px] text-white/95 leading-relaxed font-normal whitespace-pre-wrap">
                      {user.bio || <span className="italic text-white/30">Ma'lumot kiritilmagan</span>}
                    </p>
                    <span className="text-[13px] text-white/40 font-medium block mt-1 uppercase tracking-wide">Haqida</span>
                  </div>

                  <div className="w-full h-px bg-white/5" /> {/* Divider */}

                  {/* Detallar (Yosh, Usernam, Rol) */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <RoleBadge role={role} />
                      {age && (
                        <span className="bg-white/5 text-white/80 text-[13px] font-medium px-3 py-1.5 rounded-lg border border-white/5">
                          {age} yosh
                        </span>
                      )}
                      {isBlocked && (
                        <span className="bg-red-500/10 text-red-400 text-[13px] font-medium px-3 py-1.5 rounded-lg border border-red-500/10 flex items-center gap-1.5">
                          <ShieldAlert size={14} /> Bloklangan
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-[16px] text-white/90 font-medium">
                        {user.email || '@username'}
                      </p>
                      <span className="text-[13px] text-white/40 font-medium block mt-1 uppercase tracking-wide">Foydalanuvchi nomi</span>
                    </div>
                  </div>

                  {/* Ijtimoiy tarmoqlar */}
                  {hasSocials && (
                    <>
                      <div className="w-full h-px bg-white/5" />
                      <div className="flex flex-wrap gap-3">
                        {instagram && <SocialLink href={`https://instagram.com/${instagram.replace('@', '')}`} icon={Link2} color="hover:text-pink-500" />}
                        {telegram && <SocialLink href={`https://t.me/${telegram.replace('@', '')}`} icon={Send} color="hover:text-[#34B7F1]" />}
                        {youtube && <SocialLink href={`https://youtube.com/${youtube}`} icon={Link2} color="hover:text-red-500" />}
                        {otherLink && <SocialLink href={otherLink} icon={Link2} color="hover:text-emerald-400" />}
                      </div>
                    </>
                  )}

                  {/* Tugma */}
                  {canBlock && (
                    <div className="mt-2">
                      <Button
                        variant={isBlocked ? 'secondary' : 'danger'}
                        size="lg"
                        fullWidth
                        isLoading={isBlocking}
                        leftIcon={isBlocked ? <UserCheck size={20} /> : <UserX size={20} />}
                        onClick={handleToggleBlock}
                        className="rounded-2xl font-semibold text-[16px] py-4"
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
          <FullscreenViewer src={avatarUrl} onClose={() => setShowFullImage(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default UserProfileModal;
