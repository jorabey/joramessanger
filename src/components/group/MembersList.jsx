import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Crown, ShieldCheck, ShieldOff,
  UserX, UserCheck, MoreVertical, User, SlidersHorizontal, Settings2, Image, Mic
} from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import Avatar from '../ui/Avatar';
import { selectUser, selectIsOwner, selectIsAdmin } from '../../redux/authSlice';
import { usePermissions } from '../../hooks/usePermissions';
import { usePresence } from '../../hooks/usePresence';
import UserProfileModal from '../profile/UserProfileModal';

const GROUP_ID = import.meta.env.VITE_GROUP_ID;

const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${checked ? 'bg-emerald-500' : 'bg-white/10'} ${disabled ? 'opacity-50 cursor-wait' : 'active:scale-95'}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

const RoleBadge = ({ role }) => {
  const config = {
    owner: { label: 'Asoschi', icon: Crown, cls: 'text-amber-400 bg-amber-500/15 border-amber-500/20' },
    admin: { label: 'Admin', icon: ShieldCheck, cls: 'text-[#007aff] bg-[#007aff]/15 border-[#007aff]/20' },
    user: { label: null, icon: null, cls: null },
  };

  const c = config[role] ?? config.user;
  if (!c.label) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${c.cls}`}>
      {c.icon && <c.icon size={10} strokeWidth={2.5} />}
      {c.label}
    </span>
  );
};

const PermissionsModal = ({ member, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [perms, setPerms] = useState({
    can_send_messages: member.can_send_messages ?? true,
    can_send_media: member.can_send_media ?? true,
    can_send_voice_video_notes: member.can_send_voice_video_notes ?? true,
  });

  const handleToggle = async (key, value) => {
    setPerms(p => ({ ...p, [key]: value }));
    setLoading(true);
    try {
      await supabase
        .from('group_members')
        .update({ [key]: value })
        .eq('user_id', member.user_id)
        .eq('group_id', GROUP_ID);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fullName = `${member.profiles?.first_name ?? ''} ${member.profiles?.last_name ?? ''}`.trim();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[340px] rounded-[24px] overflow-hidden shadow-2xl border border-white/10 bg-[#1c1c1e]/95 backdrop-blur-2xl"
      >
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-[17px] font-bold text-white tracking-tight">Ruxsatlar</h3>
            <p className="text-[13px] text-slate-400 truncate max-w-[200px] mt-0.5">{fullName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 active:scale-90 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[10px] bg-[#007aff]/10 text-[#007aff]"><Settings2 size={18} /></div>
              <span className="text-[15px] font-semibold text-white">Xabar yozish</span>
            </div>
            <ToggleSwitch disabled={loading} checked={perms.can_send_messages} onChange={(v) => handleToggle('can_send_messages', v)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[10px] bg-purple-500/10 text-purple-400"><Image size={18} /></div>
              <span className="text-[15px] font-semibold text-white">Media yuborish</span>
            </div>
            <ToggleSwitch disabled={loading} checked={perms.can_send_media} onChange={(v) => handleToggle('can_send_media', v)} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[10px] bg-orange-500/10 text-orange-400"><Mic size={18} /></div>
              <span className="text-[15px] font-semibold text-white">Ovozli/Video xabar</span>
            </div>
            <ToggleSwitch disabled={loading} checked={perms.can_send_voice_video_notes} onChange={(v) => handleToggle('can_send_voice_video_notes', v)} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// iOS uslubidagi Bottom Sheet (Action Sheet)
const MemberMenu = ({
  member, onClose, canPromote, canDemote, canBlock, canManagePerms,
  onPromote, onDemote, onBlock, onUnblock, onOpenPerms
}) => {
  const isBlocked = member.profiles?.is_blocked ?? false;
  const isAdmin = member.role === 'admin';
  const fullName = `${member.profiles?.first_name ?? ''} ${member.profiles?.last_name ?? ''}`.trim();

  const actions = [
    canManagePerms && !isAdmin && member.role !== 'owner' && {
      icon: SlidersHorizontal, label: 'Ruxsatlarni sozlash', color: 'text-[#007aff]', action: onOpenPerms,
    },
    canPromote && !isAdmin && member.role === 'user' && {
      icon: ShieldCheck, label: 'Admin qilish', color: 'text-emerald-500', action: onPromote,
    },
    canDemote && isAdmin && {
      icon: ShieldOff, label: 'Adminlikdan olish', color: 'text-orange-500', action: onDemote,
    },
    canBlock && !isBlocked && member.role !== 'owner' && {
      icon: UserX, label: 'Bloklash', color: 'text-red-500', action: onBlock,
    },
    canBlock && isBlocked && {
      icon: UserCheck, label: 'Blokdan chiqarish', color: 'text-emerald-500', action: onUnblock,
    },
  ].filter(Boolean);

  if (actions.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-0">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ y: '100%', opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: '100%', opacity: 0 }} 
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-[380px] flex flex-col gap-2 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-4 py-3 border-b border-white/5 text-center">
            <span className="text-[13px] font-medium text-slate-400">{fullName}</span>
          </div>
          <div className="flex flex-col">
            {actions.map(({ icon: Icon, label, color, action }, idx) => (
              <button
                key={label}
                onClick={() => { action(); onClose(); }}
                className={`w-full flex items-center justify-between px-5 py-4 text-[16px] font-semibold active:bg-white/10 transition-colors ${color} ${idx !== 0 ? 'border-t border-white/5' : ''}`}
              >
                {label}
                <Icon size={20} strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-2xl px-5 py-4 text-[16px] font-bold text-white active:bg-white/10 transition-colors shadow-2xl"
        >
          Bekor qilish
        </button>
      </motion.div>
    </div>
  );
};

const MemberRow = ({
  member, isMe, isOnline, canManage, canPromote, canDemote, canBlock, canManagePerms, onUpdate, onSelectUser
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [permsOpen, setPermsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const profile = member.profiles;
  const fullName = profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : 'Foydalanuvchi';
  const isBlocked = profile?.is_blocked ?? false;
  const showMenu = (canManage || canManagePerms) && !isMe && member.role !== 'owner';

  const handlePromote = async () => {
    setLoading(true);
    await supabase.from('group_members').update({ role: 'admin', can_delete_others_messages: true, can_edit_group_info: true }).eq('user_id', member.user_id).eq('group_id', GROUP_ID);
    setLoading(false);
    if (onUpdate) onUpdate();
  };

  const handleDemote = async () => {
    setLoading(true);
    await supabase.from('group_members').update({ role: 'user', can_delete_others_messages: false, can_edit_group_info: false, can_manage_group_settings: false, can_block_users: false }).eq('user_id', member.user_id).eq('group_id', GROUP_ID);
    setLoading(false);
    if (onUpdate) onUpdate();
  };

  const handleBlock = async () => {
    setLoading(true);
    await supabase.from('profiles').update({ is_blocked: true }).eq('id', member.user_id);
    setLoading(false);
    if (onUpdate) onUpdate();
  };

  const handleUnblock = async () => {
    setLoading(true);
    await supabase.from('profiles').update({ is_blocked: false }).eq('id', member.user_id);
    setLoading(false);
    if (onUpdate) onUpdate();
  };

  return (
    <>
      <div 
        onClick={() => onSelectUser(member.user_id)}
        className={`flex z-[52] items-center gap-3 px-3 py-2.5 rounded-2xl transition-all cursor-pointer ${isBlocked ? 'opacity-60 grayscale-[50%]' : 'hover:bg-white/5 active:scale-[0.98]'}`}
      >
        <div className="shrink-0 relative">
          <Avatar src={profile?.avatar_url} firstName={profile?.first_name} lastName={profile?.last_name} userId={member.user_id} size="md" />
          {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1c1c1e] rounded-full" />}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[15.5px] font-bold leading-tight tracking-tight truncate ${isMe ? 'text-[#007aff]' : 'text-white'}`}>
              {isMe ? 'Siz' : fullName}
            </span>
            <RoleBadge role={member.role} />
            {isBlocked && (
              <span className="text-[9px] text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 uppercase tracking-wider">
                Bloklangan
              </span>
            )}
            {!member.can_send_messages && member.role === 'user' && (
              <span className="text-[9px] text-slate-400 font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-wider">
                Cheklangan
              </span>
            )}
          </div>
          <p className="text-[12px] font-medium text-slate-500 mt-0.5 truncate">
            {isOnline ? <span className="text-emerald-400">onlayn</span> : profile?.email ?? ''}
          </p>
        </div>

        {showMenu && (
          <div className="relative shrink-0 ml-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(true); }} 
              disabled={loading} 
              className={`p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90 ${loading ? 'opacity-50 cursor-wait' : ''}`}
            >
              {loading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <MoreVertical size={18} />}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {menuOpen && (
          <MemberMenu
            member={member} onClose={() => setMenuOpen(false)}
            canPromote={canPromote} canDemote={canDemote} canBlock={canBlock} canManagePerms={canManagePerms}
            onPromote={handlePromote} onDemote={handleDemote} onBlock={handleBlock} onUnblock={handleUnblock}
            onOpenPerms={() => { setMenuOpen(false); setTimeout(() => setPermsOpen(true), 200); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {permsOpen && <PermissionsModal member={member} onClose={() => setPermsOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

const MembersList = ({ members: initialMembers = [] }) => {
  const currentUser = useSelector(selectUser);
  const isOwner = useSelector(selectIsOwner);
  const isAdmin = useSelector(selectIsAdmin);
  const { canBlockUsers, isHigherThan } = usePermissions();
  const { isUserOnline } = usePresence();

  const [search, setSearch] = useState('');
  const [localMembers, setLocalMembers] = useState(initialMembers);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Prop orqali kelgan real-time data ni saqlaymiz
  useEffect(() => {
    setLocalMembers(initialMembers);
  }, [initialMembers]);

  // Qo'shimcha ehtiyot chorasi: Local channel
  useEffect(() => {
    const channel = supabase.channel('members_list_realtime_local')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'group_members', filter: `group_id=eq.${GROUP_ID}` }, (payload) => {
        setLocalMembers(prev => prev.map(m => m.user_id === payload.new.user_id ? { ...m, ...payload.new } : m));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        setLocalMembers(prev => prev.map(m => m.user_id === payload.new.id ? { ...m, profiles: { ...m.profiles, ...payload.new } } : m));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return localMembers;
    return localMembers.filter((m) => {
      const fn = m.profiles?.first_name?.toLowerCase() ?? '';
      const ln = m.profiles?.last_name?.toLowerCase() ?? '';
      return fn.includes(q) || ln.includes(q);
    });
  }, [localMembers, search]);

  const sorted = useMemo(() => {
    const order = { owner: 0, admin: 1, user: 2 };
    return [...filtered].sort((a, b) => (order[a.role] ?? 2) - (order[b.role] ?? 2));
  }, [filtered]);

  const groups = useMemo(() => {
    const g = { owner: [], admin: [], user: [] };
    sorted.forEach((m) => { (g[m.role] ?? g.user).push(m); });
    return g;
  }, [sorted]);

  const sectionLabels = {
    owner: { label: 'Asoschi', count: groups.owner.length },
    admin: { label: 'Adminlar', count: groups.admin.length },
    user:  { label: "A'zolar", count: groups.user.length  },
  };

  // Tanlangan userni real vaqtda topish (profil modal uchun)
  const activeSelectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    const member = localMembers.find(m => m.user_id === selectedUserId);
    if (!member) return null;
    return {
      ...member.profiles,
      id: member.user_id,
      role: member.role,
      isOnline: isUserOnline(member.user_id)
    };
  }, [selectedUserId, localMembers, isUserOnline]);

  return (
    <div className="flex flex-col h-full relative z-[51]">
      {/* QIDIRUV (SEARCH) - Xavfsiz z-index */}
      <div className="px-4 pt-4 pb-3 sticky top-0 bg-[#121214]/80 backdrop-blur-xl z-[0] border-b border-transparent shadow-sm">
        <div className="flex items-center gap-2 bg-white/10 focus-within:bg-white/15 focus-within:ring-2 ring-[#007aff]/50 rounded-[14px] px-3.5 py-2.5 transition-all shadow-inner">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="A'zolarni qidirish..."
            className="flex-1 bg-transparent text-[15px] font-medium text-white placeholder-slate-400 outline-none caret-[#007aff]"
          />
          {search && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setSearch('')} className="p-1 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors active:scale-90">
              <X size={14} strokeWidth={2.5} />
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-8 custom-scrollbar z-0 relative">
        {(['owner', 'admin', 'user']).map((roleKey) => {
          const section = groups[roleKey];
          if (section.length === 0) return null;
          const { label, count } = sectionLabels[roleKey];

          return (
            <div key={roleKey} className="mb-5">
              <div className="flex items-center gap-2 px-3 mb-2 sticky top-0 py-1.5 bg-[#121214]/90 backdrop-blur-md z-10 rounded-lg">
                <span className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                <span className="text-[10px] font-bold text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{count}</span>
              </div>

              <div className="flex flex-col bg-[#1c1c1e] rounded-[24px] p-1.5 shadow-sm border border-white/5">
                <AnimatePresence mode="popLayout">
                  {section.map((member) => {
                    const isMe = member.user_id === currentUser?.id;
                    const online = isUserOnline(member.user_id);
                    const canManage = !isMe && (isOwner || isAdmin);
                    const canPromote = isOwner || (isAdmin && isHigherThan(member.role));
                    const canDemote = isOwner && member.role === 'admin';
                    const canBlock = canBlockUsers && isHigherThan(member.role);
                    const canManagePerms = isOwner || isAdmin;

                    return (
                      <motion.div key={member.user_id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                        <MemberRow
                          member={member} isMe={isMe} isOnline={online}
                          canManage={canManage} canPromote={canPromote} canDemote={canDemote} canBlock={canBlock} canManagePerms={canManagePerms}
                          onSelectUser={setSelectedUserId}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center gap-4 py-20 opacity-60">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shadow-inner">
              <User size={28} className="text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-[16px] font-semibold text-white">Topilmadi</p>
              <p className="text-[13px] text-slate-400 mt-1">Boshqa so'z bilan qidirib ko'ring</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* PROFIL MODAL - Real-time Data */}
      <UserProfileModal 
        isOpen={!!selectedUserId} 
        onClose={() => setSelectedUserId(null)} 
        user={activeSelectedUser} 
        role={activeSelectedUser?.role}
        isOnline={activeSelectedUser?.isOnline}
      />
    </div>
  );
};

export default MembersList;