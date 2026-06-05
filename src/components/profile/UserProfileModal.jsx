import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Send, Link2, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../config/supabaseClient';
import Avatar from '../ui/Avatar';
import { selectUser } from '../../redux/authSlice';
import { usePermissions } from '../../hooks/usePermissions';

const calcAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age > 0 ? age : null;
};

const parseSocials = (socials) => {
  try {
    if (!socials) return {};
    if (typeof socials === 'string') return JSON.parse(socials);
    return socials;
  } catch { return {}; }
};

const RoleBadge = ({ role }) => {
  const map = {
    owner: { label: 'Asoschi', color: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30' },
    admin: { label: 'Admin', color: 'bg-blue-100 dark:bg-[#007aff]/15 text-blue-700 dark:text-[#007aff] border-blue-300 dark:border-[#007aff]/30' },
    user:  { label: 'A\'zo',  color: 'bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-white/70 border-neutral-300 dark:border-white/10' },
  };
  const r = map[role] ?? map.user;
  return (
    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest transition-colors duration-300 ${r.color}`}>
      {r.label}
    </span>
  );
};

const UserProfileModal = ({ isOpen, onClose, user, role = 'user', isOnline = false }) => {
  const currentUser = useSelector(selectUser);
  const [isBlocked, setIsBlocked] = useState(user?.is_blocked ?? false);

  useEffect(() => { if (user) setIsBlocked(user.is_blocked ?? false); }, [user]);

  if (!user) return null;

  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Foydalanuvchi';
  const age = calcAge(user.dob);
  const sLinks = parseSocials(user.social_links);
  const avatarUrl = user.avatar_url ? `${user.avatar_url}${user.avatar_url.includes('?') ? '&' : '?'}v=${new Date(user.updated_at || Date.now()).getTime()}` : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full sm:max-w-[420px] bg-white dark:bg-[#1c1c1e] rounded-t-[32px] sm:rounded-[32px] overflow-hidden flex flex-col max-h-[90dvh] transition-colors duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Image Area */}
            <div className="relative h-[300px] w-full shrink-0 bg-neutral-200 dark:bg-[#2c2c2e]">
              {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500" />}
              <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 dark:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors"><X size={20} /></button>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-[#1c1c1e] to-transparent transition-colors duration-300">
                <h2 className="text-3xl font-bold text-neutral-900 dark:text-white transition-colors">{fullName}</h2>
                <p className={isOnline ? "text-emerald-600 dark:text-emerald-400 font-medium transition-colors" : "text-neutral-500 dark:text-white/60 transition-colors"}>{isOnline ? 'Onlayn' : 'Yaqinda kirdi'}</p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar">
              <div className="flex flex-wrap gap-2">
                <RoleBadge role={role} />
                {age && <span className="bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white/80 text-[11px] font-bold px-3 py-1 rounded-full transition-colors">{age} yosh</span>}
              </div>

              <div>
                <h4 className="text-[12px] text-blue-600 dark:text-[#007aff] font-bold uppercase mb-2 transition-colors">Bio</h4>
                <p className="text-neutral-900 dark:text-white/90 text-[15px] transition-colors">{user.bio || 'Ma\'lumot kiritilmagan'}</p>
              </div>

              {/* Social Links Grid */}
              {(sLinks.instagram || sLinks.telegram || sLinks.youtube) && (
                <div>
                   <h4 className="text-[12px] text-blue-600 dark:text-[#007aff] font-bold uppercase mb-3 transition-colors">Ijtimoiy tarmoqlar</h4>
                   <div className="flex gap-3">
                     {sLinks.instagram && <a href={`https://instagram.com/${sLinks.instagram.replace('@','')}`} target="_blank" className="p-3 bg-neutral-100 dark:bg-white/5 rounded-2xl text-neutral-900 dark:text-white transition-colors"><Link2 size={20} /></a>}
                     {sLinks.telegram && <a href={`https://t.me/${sLinks.telegram.replace('@','')}`} target="_blank" className="p-3 bg-neutral-100 dark:bg-white/5 rounded-2xl text-neutral-900 dark:text-white transition-colors"><Send size={20} /></a>}
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal;
