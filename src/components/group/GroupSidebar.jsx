import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Image, FileText, Link2, Mic, Users, Settings, 
  Edit3, Loader2
} from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { selectIsAdmin, selectIsOwner } from '../../redux/authSlice';
import MediaTab from './media_gallery/MediaTab';
import FilesTab from './media_gallery/FilesTab';
import LinksTab from './media_gallery/LinksTab';
import VoiceTab from './media_gallery/VoiceTab';
import MembersList from './MembersList';
import GroupSettings from './GroupSettings';

const GROUP_ID = import.meta.env.VITE_GROUP_ID;

const TABS = [
  { id: 'members', label: "A'zol", Icon: Users },
  { id: 'media', label: 'Media', Icon: Image },
  { id: 'files', label: 'Fayl', Icon: FileText },
  { id: 'links', label: 'Havola', Icon: Link2 },
  { id: 'voice', label: 'Ovoz', Icon: Mic },
  { id: 'settings', label: 'Sozlamalar', Icon: Settings },
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full sm:max-w-[420px] h-full bg-white dark:bg-[#1c1c1e] shadow-2xl flex flex-col select-none transition-colors duration-300"
          >
            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-safe" onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
              
              {/* Hero Image Section */}
              <div className="relative h-[300px] w-full shrink-0">
                <img src={group?.avatar_url} className="w-full h-full object-cover" alt="Group" />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#1c1c1e] via-transparent to-transparent transition-colors duration-300" />
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 dark:bg-black/30 text-white rounded-full backdrop-blur-md transition-colors">
                  <X size={20}/>
                </button>
                
                <div className="absolute bottom-6 left-6 right-6">
                  {isEditing ? (
                    <input autoFocus value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full bg-black/10 dark:bg-white/20 text-neutral-900 dark:text-white font-bold text-2xl rounded-lg px-2 py-1 outline-none transition-colors" />
                  ) : (
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white transition-colors">{group?.name}</h1>
                  )}
                  <p className="text-neutral-600 dark:text-white/60 text-sm mt-1 transition-colors">{members.length} a'zo • {onlineCount} onlayn</p>
                </div>
              </div>

              {/* Bio & Edit Section */}
              <div className="px-6 py-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white/80 p-3 rounded-xl text-[15px] outline-none border border-neutral-200 dark:border-white/10 transition-colors" rows={3} />
                    <div className="flex gap-2">
                       <button onClick={handleSave} className="flex-1 bg-[#007aff] text-white py-2 rounded-xl font-semibold text-sm hover:bg-blue-600 active:scale-95 transition-all">
                        {isSaving ? <Loader2 className="animate-spin mx-auto" size={16}/> : 'Saqlash'}
                       </button>
                       <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white rounded-xl font-semibold text-sm hover:bg-neutral-300 dark:hover:bg-white/20 active:scale-95 transition-all">Bekor</button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <p className="text-[15px] text-neutral-700 dark:text-white/80 leading-relaxed transition-colors">{group?.description || 'Guruh haqida ma\'lumot yo\'q'}</p>
                    {canEdit && <button onClick={() => setIsEditing(true)} className="absolute -top-6 right-0 p-2 text-neutral-400 dark:text-white/30 hover:text-neutral-900 dark:hover:text-white transition-colors"><Edit3 size={16}/></button>}
                  </div>
                )}
              </div>

              {/* Tabs Section */}
              <div className="sticky top-0 z-20 bg-white dark:bg-[#1c1c1e] border-b border-neutral-200 dark:border-white/5 p-1 flex gap-1 transition-colors duration-300">
                {TABS.map(({ id, Icon, label }) => (
                  <button 
                    key={id} 
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 flex flex-col items-center py-3 text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === id ? 'text-[#007aff]' : 'text-neutral-400 dark:text-white/40'}`}
                  >
                    <Icon size={20} className="mb-1" />
                    {id === 'members' ? "A'zolar" : label}
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
                    {activeTab === 'settings' && <GroupSettings group={group} />}
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
