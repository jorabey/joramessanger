import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Image, FileText, Link2, Mic, Users, Settings, 
  Edit3, Camera, Loader2, Check, Info
} from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import Avatar from '../ui/Avatar';
import { selectIsAdmin, selectIsOwner } from '../../redux/authSlice';
import MediaTab from './media_gallery/MediaTab';
import FilesTab from './media_gallery/FilesTab';
import LinksTab from './media_gallery/LinksTab';
import VoiceTab from './media_gallery/VoiceTab';
import MembersList from './MembersList';
import GroupSettings from './GroupSettings';

const GROUP_ID = import.meta.env.VITE_GROUP_ID;

const TABS = [
  { id: 'members', label: "A'zolar", Icon: Users },
  { id: 'media', label: 'Media', Icon: Image },
  { id: 'files', label: 'Fayllar', Icon: FileText },
  { id: 'links', label: 'Havolalar', Icon: Link2 },
  { id: 'voice', label: 'Ovoz/Video', Icon: Mic },
];

const GroupSidebar = ({ isOpen, onClose, group: initialGroup, members = [], onlineCount = 0 }) => {
  const isAdmin = useSelector(selectIsAdmin);
  const isOwner = useSelector(selectIsOwner);
  const canEdit = isAdmin || isOwner;

  const [group, setGroup] = useState(initialGroup);
  const [activeTab, setActiveTab] = useState('members');
  const [scrollTop, setScrollTop] = useState(0);
  
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initialGroup) {
      setGroup(initialGroup);
      setForm({ name: initialGroup.name || '', description: initialGroup.description || '' });
    }
  }, [initialGroup]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await supabase.from('groups').update({ name: form.name, description: form.description }).eq('id', GROUP_ID);
      setIsEditing(false);
    } finally { setIsSaving(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const path = `groups/${GROUP_ID}_${Date.now()}.jpg`;
      await supabase.storage.from('media').upload(path, file);
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      await supabase.from('groups').update({ avatar_url: data.publicUrl }).eq('id', GROUP_ID);
    } finally { setIsUploading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full sm:max-w-[420px] h-full bg-[#1c1c1e] shadow-2xl flex flex-col select-none"
          >
            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-safe" onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
              
              {/* Hero Image Section */}
              <div className="relative h-[300px] w-full shrink-0">
                <img src={group?.avatar_url} className="w-full h-full object-cover" alt="Group" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1e] via-transparent to-transparent" />
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/30 text-white rounded-full backdrop-blur-md"><X size={20}/></button>
                
                <div className="absolute bottom-6 left-6 right-6">
                  {isEditing ? (
                    <input autoFocus value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full bg-white/20 text-white font-bold text-2xl rounded-lg px-2 py-1 outline-none" />
                  ) : (
                    <h1 className="text-2xl font-bold text-white">{group?.name}</h1>
                  )}
                  <p className="text-white/60 text-sm mt-1">{members.length} a'zo • {onlineCount} onlayn</p>
                </div>
              </div>

              {/* Bio & Edit Section */}
              <div className="px-6 py-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full bg-white/5 text-white/80 p-3 rounded-xl text-[15px] outline-none border border-white/10" rows={3} />
                    <div className="flex gap-2">
                       <Button onClick={handleSave} isLoading={isSaving} size="sm" className="flex-1">Saqlash</Button>
                       <Button onClick={() => setIsEditing(false)} variant="secondary" size="sm">Bekor</Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <p className="text-[15px] text-white/80 leading-relaxed">{group?.description || 'Guruh haqida ma\'lumot yo\'q'}</p>
                    {canEdit && <button onClick={() => setIsEditing(true)} className="absolute -top-6 right-0 p-2 text-white/30 hover:text-white"><Edit3 size={16}/></button>}
                  </div>
                )}
              </div>

              {/* Tabs Section */}
              <div className="sticky top-0 z-20 bg-[#1c1c1e] border-b border-white/5 p-1 flex gap-1">
                {TABS.map(({ id, Icon }) => (
                  <button 
                    key={id} 
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 flex flex-col items-center py-3 text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === id ? 'text-[#007aff]' : 'text-white/40'}`}
                  >
                    <Icon size={20} className="mb-1" />
                    {id === 'members' ? 'A\'zolar' : id}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {activeTab === 'members' && <MembersList members={members} />}
                    {activeTab === 'media' && <MediaTab />}
                    {activeTab === 'files' && <FilesTab />}
                    {activeTab === 'links' && <LinksTab />}
                    {activeTab === 'voice' && <VoiceTab />}
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
