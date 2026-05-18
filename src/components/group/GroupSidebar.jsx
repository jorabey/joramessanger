import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Image, FileText, Link2, Mic,
  Users, Settings, Edit3, Camera, Loader2
} from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import Avatar from '../ui/Avatar';
import { selectIsAdmin, selectIsOwner } from '../../redux/authSlice';
import MediaTab   from './media_gallery/MediaTab';
import FilesTab   from './media_gallery/FilesTab';
import LinksTab   from './media_gallery/LinksTab';
import VoiceTab   from './media_gallery/VoiceTab';
import MembersList   from './MembersList';
import GroupSettings from './GroupSettings';

const GROUP_ID = import.meta.env.VITE_GROUP_ID;

const TABS = [
  { id: 'members',  label: "A'zolar",  Icon: Users    },
  { id: 'media',    label: 'Media',   Icon: Image    },
  { id: 'files',    label: 'Fayllar', Icon: FileText },
  { id: 'links',    label: 'Havolalar',Icon: Link2    },
  { id: 'voice',    label: 'Ovoz va Video',    Icon: Mic      },
];

const StatBadge = ({ value, label }) => (
  <div className="flex flex-col items-center justify-center min-w-[70px] py-1.5 px-3">
    <span className="text-[17px] font-bold text-white tabular-nums tracking-tight">{value}</span>
    <span className="text-[11px] font-medium text-white/50 uppercase tracking-wide mt-0.5">{label}</span>
  </div>
);

const GroupSidebar = ({
  isOpen,
  onClose,
  group: initialGroup,
  members = [],
  onlineCount = 0,
}) => {
  const isAdmin = useSelector(selectIsAdmin);
  const isOwner = useSelector(selectIsOwner);

  const [group, setGroup] = useState(initialGroup);
  const [activeTab, setActiveTab] = useState('members');
  const [scrollTop, setScrollTop] = useState(0);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState('');
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [groupBio, setGroupBio] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Real-time ma'lumotlarni qabul qilish
  useEffect(() => {
    if (initialGroup) {
      setGroup(initialGroup);
      setGroupName(initialGroup.name || '');
      setGroupBio(initialGroup.description || '');
    }
  }, [initialGroup]);

  // Supabase jonli sinxronizatsiya
  useEffect(() => {
    const channel = supabase
      .channel('public:groups')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'groups', filter: `id=eq.${GROUP_ID}` },
        (payload) => {
          setGroup(payload.new);
          if (!isEditingName) setGroupName(payload.new.name || '');
          if (!isEditingBio) setGroupBio(payload.new.description || '');
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isEditingName, isEditingBio]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSaveName = useCallback(async () => {
    const trimmed = groupName.trim();
    if (!trimmed || trimmed === group?.name) {
      setIsEditingName(false);
      setGroupName(group?.name ?? '');
      return;
    }
    setIsSaving(true);
    try {
      await supabase.from('groups').update({ name: trimmed }).eq('id', GROUP_ID);
      setIsEditingName(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [groupName, group?.name]);

  const handleSaveBio = useCallback(async () => {
    const trimmed = groupBio.trim();
    if (trimmed === group?.description) {
      setIsEditingBio(false);
      setGroupBio(group?.description ?? '');
      return;
    }
    setIsSaving(true);
    try {
      await supabase.from('groups').update({ description: trimmed }).eq('id', GROUP_ID);
      setIsEditingBio(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [groupBio, group?.description]);

  const handleAvatarUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const ext  = file.name.split('.').pop();
      const path = `groups/${GROUP_ID}_${Date.now()}.${ext}`;
      await supabase.storage.from('media').upload(path, file, { upsert: true });
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      await supabase.from('groups').update({ avatar_url: data.publicUrl }).eq('id', GROUP_ID);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  }, []);

  const canEdit = isAdmin || isOwner;
  const totalMembers = members.length;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'members': return <MembersList members={members} />;
      case 'media':   return <MediaTab />;
      case 'files':   return <FilesTab />;
      case 'links':   return <LinksTab />;
      case 'voice':   return <VoiceTab />;
      case 'settings':return <GroupSettings group={group} />;
      default:        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[50] flex justify-end pointer-events-none">
          {/* Orqa qoraytirilgan fon */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-auto bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="relative w-full sm:max-w-[420px] h-full flex flex-col pointer-events-auto shadow-2xl bg-[#121214] border-l border-white/5 overflow-hidden"
          >
            {/* 1-QISM: YAGONA SCROLL KONTAYNER (Telegram/iMessage uslubi) */}
            <div 
              className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar relative"
              onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            >
              
              {/* STICKY TOP BAR (Scroll qilinganda fon oladi va kichik info chiqadi) */}
              <div 
                className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-[64px] transition-all duration-300"
                style={{ 
                  backgroundColor: scrollTop > 80 ? 'rgba(28, 28, 30, 0.95)' : 'transparent', 
                  backdropFilter: scrollTop > 80 ? 'blur(16px)' : 'none',
                  borderBottom: scrollTop > 80 ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent'
                }}
              >
                {/* Asosiy Sarlavha (Scroll bo'lganda yo'qoladi) */}
                <span 
                  className="absolute left-5 text-[13px] font-bold text-white/50 uppercase tracking-widest transition-opacity duration-300"
                  style={{ opacity: scrollTop > 60 ? 0 : 1, pointerEvents: scrollTop > 60 ? 'none' : 'auto' }}
                >
                  Guruh haqida
                </span>

                {/* Ixcham Ma'lumot (Faqat scroll qilinganda chiqadi) */}
                <div 
                  className="flex items-center gap-3 transition-opacity duration-300"
                  style={{ opacity: scrollTop > 100 ? 1 : 0, pointerEvents: scrollTop > 100 ? 'auto' : 'none' }}
                >
                  <Avatar src={group?.avatar_url} size="sm" isRound />
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-white leading-tight truncate max-w-[160px]">{group?.name}</span>
                    <span className="text-[11px] font-medium text-slate-400 mt-0.5">{totalMembers} a'zo</span>
                  </div>
                </div>

                {/* Yopish tugmasi */}
                <button
                  onClick={onClose}
                  className="p-2 ml-auto rounded-full bg-white/5 text-white/80 hover:text-white hover:bg-white/15 transition-all active:scale-90 z-50 shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              {/* HERO PROFIL (Katta rasm va ma'lumotlar - scroll bilan tepaga yashirinadi) */}
              <div className="flex flex-col items-center gap-4 pt-4 pb-6 px-6 bg-[#1c1c1e] rounded-b-[32px] shadow-sm relative z-10 mt-[-64px] pt-[80px]">
                
                {/* AVATAR */}
                <div className="relative group shadow-xl rounded-full">
                  <Avatar
                    src={group?.avatar_url}
                    firstName={group?.name?.split(' ')[0]}
                    lastName={group?.name?.split(' ')[1]}
                    size="3xl"
                    isRound={true}
                  />
                  {canEdit && (
                    <label className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer backdrop-blur-sm transition-all duration-300 ${isUploadingAvatar ? 'opacity-100' : ''}`}>
                      {isUploadingAvatar ? <Loader2 className="animate-spin text-white" size={28} /> : <Camera size={28} className="text-white drop-shadow-md" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                  )}
                </div>

                <div className="flex flex-col items-center w-full gap-3">
                  {/* NOMI (NAME) */}
                  <div className="flex flex-col items-center justify-center w-full group/name relative">
                    {isEditingName ? (
                      <div className="flex items-center gap-2 w-full mt-1 px-2">
                        {/* 🔴 TEXT-[16px] ZOOM MUAMMOSINI OLDINI OLADI */}
                        <input
                          autoFocus
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName();
                            if (e.key === 'Escape') { setIsEditingName(false); setGroupName(group?.name ?? ''); }
                          }}
                          className="flex-1 bg-white/10 border border-[#007aff]/50 rounded-[12px] px-3 py-2 text-[16px] font-bold text-white outline-none text-center shadow-inner"
                        />
                        <button
                          onClick={handleSaveName}
                          disabled={isSaving}
                          className="p-2.5 rounded-[12px] bg-[#007aff] hover:bg-blue-600 text-white transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-md"
                        >
                          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <X size={18} className="rotate-45" />}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center relative w-full px-8">
                        <h2 className="text-[22px] font-bold text-white text-center leading-tight truncate px-2">
                          {group?.name ?? 'Guruh Nomi'}
                        </h2>
                        {canEdit && (
                          <button onClick={() => setIsEditingName(true)} className="absolute right-0 p-1.5 opacity-0 group-hover/name:opacity-100 text-slate-400 hover:text-white transition-opacity shrink-0">
                            <Edit3 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* BIO (DESCRIPTION) */}
                  <div className="flex flex-col items-center w-full group/bio relative">
                    {isEditingBio ? (
                      <div className="flex flex-col gap-2 w-full px-2">
                         {/* 🔴 TEXT-[16px] ZOOM MUAMMOSINI OLDINI OLADI */}
                        <textarea
                          autoFocus
                          rows={2}
                          value={groupBio}
                          onChange={(e) => setGroupBio(e.target.value)}
                          placeholder="Guruh haqida ma'lumot..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveBio(); }
                            if (e.key === 'Escape') { setIsEditingBio(false); setGroupBio(group?.description ?? ''); }
                          }}
                          className="w-full bg-white/10 border border-[#007aff]/50 rounded-[12px] px-3 py-2 text-[16px] text-white/90 outline-none text-center shadow-inner resize-none custom-scrollbar"
                        />
                        <div className="flex justify-center gap-2">
                          <button onClick={() => { setIsEditingBio(false); setGroupBio(group?.description ?? ''); }} className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-[13px] font-semibold active:scale-95 transition-transform">Bekor qilish</button>
                          <button onClick={handleSaveBio} disabled={isSaving} className="px-4 py-1.5 rounded-lg bg-[#007aff] text-white text-[13px] font-semibold active:scale-95 transition-transform disabled:opacity-50">
                            {isSaving ? <Loader2 size={16} className="animate-spin inline" /> : 'Saqlash'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center relative w-full px-8 min-h-[24px]">
                        <p className="text-[14px] text-white/60 text-center leading-snug">
                          {group?.description || <span className="italic opacity-50">Guruh haqida ma'lumot yo'q</span>}
                        </p>
                        {canEdit && (
                          <button onClick={() => setIsEditingBio(true)} className="absolute right-0 p-1.5 opacity-0 group-hover/bio:opacity-100 text-slate-400 hover:text-white transition-opacity shrink-0">
                            <Edit3 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* STATISTIKA */}
                <div className="flex items-center bg-white/5 rounded-2xl p-1 mt-3 shadow-inner border border-white/5">
                  <StatBadge value={totalMembers} label="A'zolar" />
                  <div className="w-px h-8 bg-white/10 mx-1" />
                  <StatBadge value={onlineCount}  label="Onlayn" />
                </div>
              </div>

              {/* 2-QISM: STICKY TABS (Tepaga yetganda yopishib qoladi) */}
              <div
                className="sticky top-[64px] z-40 bg-[#121214]/95 backdrop-blur-2xl border-b border-white/5 px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto shadow-sm"
                style={{ scrollbarWidth: 'none' }}
              >
                {TABS.map(({ id, label, Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-[14px] text-[14px] font-semibold whitespace-nowrap transition-all duration-300 shrink-0 ${
                        isActive
                          ? 'bg-[#007aff] text-white shadow-[0_4px_12px_rgba(0,122,255,0.3)]'
                          : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                      {label}
                    </button>
                  );
                })}

                {canEdit && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[14px] text-[14px] font-semibold whitespace-nowrap ml-auto transition-all duration-300 shrink-0 ${
                      activeTab === 'settings'
                        ? 'bg-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]'
                        : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Settings size={16} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
                  </button>
                )}
              </div>

              {/* 3-QISM: TAB KONTENTI (Pastki scroll hudud) */}
              <div className="min-h-[85vh] bg-[#121214]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="h-full pt-2"
                  >
                    {renderTabContent()}
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GroupSidebar;