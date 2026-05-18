// ==========================================
// EditMyProfile.jsx — O'z profilini tahrirlash (iOS Style)
// ==========================================

import { useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Camera, Send,
  Sun, Moon, Monitor, Check, X, User,
  Calendar, ChevronDown, Link2, MonitorPlay
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { selectUser } from '../../redux/authSlice';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

// ==========================================
// Kichik, toza Input komponenti (iOS uslubida)
// ==========================================
const FormInput = ({ label, icon: Icon, ...props }) => (
  <div className="relative group">
    {label && <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 block">{label}</label>}
    <div className="relative flex items-center">
      {Icon && (
        <div className="absolute left-3 text-slate-500 group-focus-within:text-[#007aff] transition-colors">
          <Icon size={16} />
        </div>
      )}
      <input
        {...props}
        className={`w-full h-11 bg-white/5 text-white text-[15px] rounded-[14px] outline-none border border-white/5 focus:border-[#007aff]/50 focus:bg-white/10 transition-all placeholder:text-slate-500 ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
      />
    </div>
  </div>
);

// ==========================================
// THEME TANLAGICH (Segmented Control iOS)
// ==========================================
const ThemePicker = ({ value, onChange }) => {
  const options = [
    { id: 'light', label: "Yorug'", icon: Sun },
    { id: 'dark',  label: "Qorong'i", icon: Moon },
    { id: 'system',label: 'Avtomat', icon: Monitor },
  ];
  return (
    <div className="flex bg-white/5 p-1 rounded-[16px] border border-white/5">
      {options.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-[12px] text-[12px] font-medium transition-all duration-200 ${
            value === id
              ? 'bg-[#1c1c1e] text-white shadow-md'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Icon size={18} className={value === id ? 'text-[#007aff]' : ''} />
          {label}
        </button>
      ))}
    </div>
  );
};

// ==========================================
// iOS JINS TANLAGICH (Action Sheet kabi)
// ==========================================
const GenderSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const options = ['erkak', 'ayol', 'boshqa'];
  const labels = { erkak: 'Erkak', ayol: 'Ayol', boshqa: 'Boshqa' };

  return (
    <div className="relative">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Jins</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 h-11 rounded-[14px] text-[15px] transition-all border outline-none ${
          open ? 'border-[#007aff]/50 bg-white/10 text-white' : 'border-white/5 bg-white/5 text-slate-300 hover:bg-white/10'
        }`}
      >
        <span className={value ? 'text-white' : 'text-slate-500'}>
          {value ? labels[value] : 'Tanlanmagan'}
        </span>
        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${open ? 'rotate-180 text-[#007aff]' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute z-50 top-[110%] left-0 right-0 rounded-[16px] overflow-hidden border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] bg-[#2c2c2e]/95 backdrop-blur-xl p-1"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full px-4 py-3 text-left text-[15px] font-medium flex items-center justify-between rounded-[10px] transition-colors ${
                  value === opt ? 'bg-[#007aff]/15 text-[#007aff]' : 'text-white hover:bg-white/10'
                }`}
              >
                {labels[opt]}
                {value === opt && <Check size={16} strokeWidth={2.5} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// ASOSIY KOMPONENT
// ==========================================
const EditMyProfile = ({ isOpen, onClose }) => {
  const user = useSelector(selectUser);
  const { updateProfile, uploadAvatar, isLoading } = useAuth();

  const [form, setForm] = useState({
    first_name:   user?.first_name   ?? '',
    last_name:    user?.last_name    ?? '',
    bio:          user?.bio          ?? '',
    dob:          user?.dob          ?? '',
    gender:       user?.gender       ?? '',
    theme:        user?.theme        ?? 'dark',
    social_links: {
      instagram: user?.social_links?.instagram ?? '',
      telegram:  user?.social_links?.telegram  ?? '',
      youtube:   user?.social_links?.youtube   ?? '',
      other:     user?.social_links?.other     ?? '',
    },
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }, []);

  const handleSocialChange = useCallback((platform, value) => {
    setForm((prev) => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: value },
    }));
    setSaved(false);
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (avatarFile) await uploadAvatar(avatarFile);
      await updateProfile({
        first_name:   form.first_name.trim(),
        last_name:    form.last_name.trim(),
        bio:          form.bio.trim(),
        dob:          form.dob || null,
        gender:       form.gender || null,
        theme:        form.theme,
        social_links: form.social_links,
      });

      setSaved(true);
      setTimeout(() => { setSaved(false); onClose?.(); }, 1200);
    } catch (err) {
      console.error('Saqlash xatoligi:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setSaved(false);
    onClose?.();
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, y: '100%', scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: '100%', scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
            className="relative w-full max-w-[420px] rounded-t-[38px] sm:rounded-[38px] overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,0.5)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col bg-[#1c1c1e]"
            style={{ maxHeight: '92dvh' }}
            onClick={(e) => e.stopPropagation()}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => { if (info.offset.y > 150) handleClose(); }}
          >
            {/* Drag Handle (Pill) */}
            <div className="w-full flex justify-center pt-3 pb-2 absolute top-0 z-50 cursor-grab active:cursor-grabbing sm:hidden">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* HEADER */}
            <div className="flex items-center justify-between px-6 pt-8 sm:pt-6 pb-4 border-b border-white/5 shrink-0 bg-[#1c1c1e]/90 backdrop-blur-md z-40 sticky top-0">
              <h2 className="text-[20px] font-bold text-white tracking-tight">Tahrirlash</h2>
              <button onClick={handleClose} className="p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 active:scale-90 transition-all">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* SCROLL KONTENT */}
            <div className="overflow-y-auto flex-1 px-6 py-6 space-y-8 custom-scrollbar">

              {/* AVATAR */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group shadow-xl rounded-full">
                  <Avatar
                    src={avatarPreview ?? user.avatar_url}
                    firstName={form.first_name}
                    lastName={form.last_name}
                    userId={user.id}
                    size="3xl"
                    isRound
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 cursor-pointer backdrop-blur-sm"
                  >
                    <Camera size={28} className="text-white drop-shadow-md" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[13px] font-semibold text-[#007aff] hover:text-blue-400 transition-colors">
                  Rasmni o'zgartirish
                </button>
              </div>

              {/* SHAXSIY MA'LUMOTLAR */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <User size={16} className="text-slate-500" />
                  <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Shaxsiy</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="Ism" placeholder="Ismingiz" value={form.first_name} onChange={(e) => handleChange('first_name', e.target.value)} maxLength={30} />
                  <FormInput label="Familiya" placeholder="Familiyangiz" value={form.last_name} onChange={(e) => handleChange('last_name', e.target.value)} maxLength={30} />
                </div>

                <div className="relative group">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="O'zingiz haqingizda qisqacha..."
                    maxLength={160}
                    rows={3}
                    className="w-full bg-white/5 text-white text-[15px] rounded-[16px] outline-none border border-white/5 focus:border-[#007aff]/50 focus:bg-white/10 transition-all placeholder:text-slate-500 px-4 py-3 resize-none custom-scrollbar"
                  />
                  <div className="absolute bottom-3 right-3 text-[11px] font-medium text-slate-500 bg-[#1c1c1e] px-1.5 rounded">
                    {form.bio.length}/160
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* iOS Native Date Picker qismi */}
                  <div className="relative">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Tug'ilgan sana</label>
                    <div className="relative flex items-center">
                      <Calendar size={16} className="absolute left-3 text-slate-500 pointer-events-none" />
                      <input
                        type="date"
                        value={form.dob}
                        onChange={(e) => handleChange('dob', e.target.value)}
                        className="w-full h-11 bg-white/5 text-white text-[15px] rounded-[14px] outline-none border border-white/5 focus:border-[#007aff]/50 focus:bg-white/10 transition-all px-10 appearance-none [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  
                  <GenderSelect value={form.gender} onChange={(v) => handleChange('gender', v)} />
                </div>
              </div>

              {/* IJTIMOIY TARMOQLAR */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Link2 size={16} className="text-slate-500" />
                  <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Tarmoqlar</span>
                </div>
                
                <div className="space-y-3">
                  <FormInput icon={Camera} placeholder="Instagram username" value={form.social_links.instagram} onChange={(e) => handleSocialChange('instagram', e.target.value)} />
                  <FormInput icon={Send} placeholder="Telegram username" value={form.social_links.telegram} onChange={(e) => handleSocialChange('telegram', e.target.value)} />
                  <FormInput icon={MonitorPlay} placeholder="YouTube channel" value={form.social_links.youtube} onChange={(e) => handleSocialChange('youtube', e.target.value)} />
                </div>
              </div>

              {/* MAVZU (THEME) */}
              <div className="space-y-3 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sun size={16} className="text-slate-500" />
                  <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Tashqi ko'rinish</span>
                </div>
                <ThemePicker value={form.theme} onChange={(v) => handleChange('theme', v)} />
              </div>

            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 border-t border-white/5 shrink-0 bg-[#1c1c1e] mb-[env(safe-area-inset-bottom)]">
              <Button
                variant={saved ? 'success' : 'primary'}
                fullWidth
                size="lg"
                isLoading={isSaving}
                onClick={handleSave}
                leftIcon={saved ? <Check size={18} strokeWidth={2.5} /> : null}
                className="rounded-[16px] font-bold text-[16px] h-14"
              >
                {saved ? 'Saqlandi!' : 'Saqlash'}
              </Button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditMyProfile;