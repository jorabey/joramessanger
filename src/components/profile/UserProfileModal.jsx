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

const calcAge = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
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

const UserProfileModal = ({ isOpen, onClose, user, role = 'user', isOnline = false }) => {
  const currentUser = useSelector(selectUser);
  const { canBlockUsers, isHigherThan } = usePermissions();

  const [isBlocking, setIsBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(user?.is_blocked ?? false);

  useEffect(() => {
    if (user) {
      setIsBlocked(user.is_blocked ?? false);
    }
  }, [user]);

  if (!user) return null;

  const isMe = currentUser?.id === user.id;
  const canBlock = !isMe && canBlockUsers && isHigherThan(role);
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Foydalanuvchi';
  const age = user.dob;
  const social = user.social_links ?? {};

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          {/* iOS Blur Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />

          {/* iMessage Style Bottom Sheet / Modal */}
          <motion.div
            initial={{ y: '100%', scale: 1 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className="relative w-full max-w-[400px] rounded-t-[38px] sm:rounded-[38px] overflow-hidden border border-white/10 shadow-[0_-10px_60px_rgba(0,0,0,0.5)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col"
            style={{ 
              background: 'rgba(28, 28, 30, 0.75)', 
              backdropFilter: 'blur(40px) saturate(150%)',
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Indicator (Pill) */}
            <div className="w-full flex justify-center pt-3 pb-1 absolute top-0 z-50 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Close Button (Desktop) */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-all active:scale-90 backdrop-blur-md hidden sm:flex"
            >
              <X size={16} strokeWidth={3} />
            </button>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
              
              {/* Dynamic Cover Gradient */}
              <div className="relative h-[140px] w-full flex justify-center">
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    background: `linear-gradient(135deg, 
                      hsl(${(user.id?.charCodeAt(0) ?? 0) % 360}deg 80% 50%) 0%, 
                      hsl(${((user.id?.charCodeAt(0) ?? 0) + 60) % 360}deg 70% 20%) 100%)`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1e]/80 to-transparent" />
                
                {/* Floating Avatar */}
                <div className="absolute -bottom-12 shadow-2xl rounded-full p-1.5 bg-[#1c1c1e]/50 backdrop-blur-xl border border-white/10">
                  <Avatar
                    src={user.avatar_url}
                    firstName={user.first_name}
                    lastName={user.last_name}
                    userId={user.id}
                    size="3xl"
                    isRound
                  />
                  {/* Real-time Online Indicator */}
                  {isOnline && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-[3px] border-[#1c1c1e] rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                  )}
                </div>
              </div>

              {/* Main Info */}
              <div className="pt-16 px-6 flex flex-col items-center text-center">
                <h2 className="text-[26px] font-bold text-white tracking-tight leading-tight">{fullName}</h2>
                <p className="text-[14px] text-slate-400 font-medium mt-1 mb-3">
                  {user.email || '@foydalanuvchi'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                  <RoleBadge role={role} />
                  {age && (
                    <span className="flex items-center gap-1 bg-white/5 border border-white/5 text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      <Calendar size={10} strokeWidth={2.5} /> {age}
                    </span>
                  )}
                  {isBlocked && (
                    <span className="flex items-center gap-1 bg-red-500/15 border border-red-500/20 text-red-400 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      <ShieldAlert size={10} strokeWidth={2.5} /> Bloklangan
                    </span>
                  )}
                  {!isOnline && (
                    <span className="flex items-center gap-1 bg-white/5 border border-white/5 text-slate-400 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      <Clock size={10} strokeWidth={2.5} /> Yaqinda
                    </span>
                  )}
                </div>

                {/* Bio Block (iOS Inset Grouped Style) */}
                {user.bio ? (
                  <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/5 text-left mb-6 shadow-inner">
                    <p className="text-[15px] text-white/90 leading-relaxed font-medium">
                      {user.bio}
                    </p>
                  </div>
                ) : (
                  <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/5 text-center mb-6">
                    <p className="text-[14px] text-white/30 italic">Ma'lumot kiritilmagan</p>
                  </div>
                )}

                {/* Social Links */}
                {(social.instagram || social.telegram || social.youtube || social.other) && (
                  <div className="w-full flex justify-center gap-4 mb-6">
                    {social.instagram && <SocialLink href={`https://instagram.com/${social.instagram.replace('@', '')}`} icon={Link2} color="hover:text-pink-500 hover:border-pink-500/50 hover:bg-pink-500/10" />}
                    {social.telegram && <SocialLink href={`https://t.me/${social.telegram.replace('@', '')}`} icon={Send} color="hover:text-[#34B7F1] hover:border-[#34B7F1]/50 hover:bg-[#34B7F1]/10" />}
                    {social.youtube && <SocialLink href={`https://youtube.com/${social.youtube}`} icon={Link2} color="hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10" />}
                    {social.other && <SocialLink href={social.other} icon={Link2} color="hover:text-white hover:border-white/50 hover:bg-white/10" />}
                  </div>
                )}

                {/* Action Buttons */}
                {canBlock && (
                  <div className="w-full">
                    <Button
                      variant={isBlocked ? 'secondary' : 'danger'}
                      size="lg"
                      fullWidth
                      isLoading={isBlocking}
                      leftIcon={isBlocked ? <UserCheck size={18} /> : <UserX size={18} />}
                      onClick={handleToggleBlock}
                      className="rounded-2xl font-bold text-[16px] py-4"
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
  );
};

export default UserProfileModal;