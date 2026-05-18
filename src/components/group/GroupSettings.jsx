import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Paperclip, Volume2, Video,
  Mic, Video as VideoIcon, Smile, ShieldCheck,
  AlertTriangle, Info
} from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { selectIsOwner } from '../../redux/authSlice';
import { usePermissions } from '../../hooks/usePermissions';

const GROUP_ID = import.meta.env.VITE_GROUP_ID;

const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-[30px] w-[50px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
      checked ? 'bg-emerald-500' : 'bg-white/15'
    } ${disabled ? 'opacity-50 cursor-wait' : 'active:scale-95'}`}
  >
    <span
      className={`pointer-events-none inline-block h-[26px] w-[26px] transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out ${
        checked ? 'translate-x-[20px]' : 'translate-x-0'
      }`}
    />
  </button>
);

const SettingRow = ({ icon: Icon, iconColor, iconBg, label, description, value, onChange, disabled }) => (
  <div className="flex items-center justify-between p-3.5 bg-transparent transition-colors hover:bg-white/5">
    <div className="flex items-center gap-3.5 min-w-0 pr-4">
      <div className={`shrink-0 w-9 h-9 rounded-[10px] ${iconBg} flex items-center justify-center`}>
        <Icon size={18} className={iconColor} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[16px] text-white font-semibold leading-tight truncate">{label}</span>
        {description && (
          <span className="text-[13px] text-slate-500 leading-snug truncate mt-0.5">{description}</span>
        )}
      </div>
    </div>
    <ToggleSwitch value={value} checked={value} onChange={onChange} disabled={disabled} />
  </div>
);

const GroupSettings = ({ group }) => {
  const isOwner = useSelector(selectIsOwner);
  const { canManageSettings } = usePermissions();

  const [settings, setSettings] = useState({
    allow_messages: group?.allow_messages ?? true,
    allow_files: group?.allow_files ?? true,
    allow_audio: group?.allow_audio ?? true,
    allow_video: group?.allow_video ?? true,
    allow_voice_notes: group?.allow_voice_notes ?? true,
    allow_video_notes: group?.allow_video_notes ?? true,
    allow_reactions: group?.allow_reactions ?? true,
  });

  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState('');

  const canEdit = isOwner || canManageSettings;

  useEffect(() => {
    if (group) {
      setSettings({
        allow_messages: group.allow_messages ?? true,
        allow_files: group.allow_files ?? true,
        allow_audio: group.allow_audio ?? true,
        allow_video: group.allow_video ?? true,
        allow_voice_notes: group.allow_voice_notes ?? true,
        allow_video_notes: group.allow_video_notes ?? true,
        allow_reactions: group.allow_reactions ?? true,
      });
    }
  }, [group]);

  const handleToggle = useCallback(async (key, newValue) => {
    if (!canEdit) return;

    setSettings((prev) => ({ ...prev, [key]: newValue }));
    setSavingKey(key);
    setError('');

    try {
      const { error: dbError } = await supabase
        .from('groups')
        .update({ [key]: newValue })
        .eq('id', GROUP_ID);

      if (dbError) throw dbError;
    } catch (err) {
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
      setError("Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setSavingKey(null);
    }
  }, [canEdit]);

  const settingsConfig = [
    {
      section: "Xabar turlari",
      items: [
        { key: 'allow_messages', Icon: MessageSquare, iconColor: 'text-[#007aff]', iconBg: 'bg-[#007aff]/10', label: 'Matnli xabarlar', description: "Oddiy matn yozish" },
        { key: 'allow_files', Icon: Paperclip, iconColor: 'text-purple-500', iconBg: 'bg-purple-500/10', label: 'Fayl va rasmlar', description: "Hujjat va media yuklash" },
        { key: 'allow_audio', Icon: Volume2, iconColor: 'text-green-500', iconBg: 'bg-green-500/10', label: 'Audio fayllar', description: "MP3 va musiqalar" },
        { key: 'allow_video', Icon: VideoIcon, iconColor: 'text-rose-500', iconBg: 'bg-rose-500/10', label: 'Video fayllar', description: "Galereyadan video yuklash" },
      ],
    },
    {
      section: "Jonli yozish",
      items: [
        { key: 'allow_voice_notes', Icon: Mic, iconColor: 'text-orange-500', iconBg: 'bg-orange-500/10', label: 'Ovozli xabarlar', description: "Mikrofon orqali yozish" },
        { key: 'allow_video_notes', Icon: Video, iconColor: 'text-cyan-500', iconBg: 'bg-cyan-500/10', label: 'Video xabarlar', description: "Kameradan yumaloq video" },
      ],
    },
    {
      section: "Interaktiv",
      items: [
        { key: 'allow_reactions', Icon: Smile, iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10', label: 'Reaksiyalar', description: "Xabarlarga emoji qo'yish" },
      ],
    },
  ];

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 h-full">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner mb-4">
          <ShieldCheck size={32} className="text-slate-400" />
        </div>
        <h3 className="text-[18px] font-bold text-white mb-2">Ruxsat yo'q</h3>
        <p className="text-[14px] text-slate-500 text-center leading-relaxed">
          Ushbu sozlamalarni faqat guruh asoschisi va maxsus ruxsatga ega adminlar boshqara oladi.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pb-10">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#007aff]/10 border border-[#007aff]/20">
          <Info size={18} className="text-[#007aff] shrink-0 mt-0.5" />
          <p className="text-[13px] text-blue-100/80 leading-relaxed font-medium">
            Global ruxsatlar guruhdagi barcha oddiy a'zolarga ta'sir qiladi. Adminlar bu cheklovlardan mustasno.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4"
          >
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 mb-2">
              <AlertTriangle size={18} className="text-red-500 shrink-0" />
              <p className="text-[13px] font-semibold text-red-400">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-6 px-4 py-2">
        {settingsConfig.map(({ section, items }) => (
          <div key={section} className="flex flex-col">
            <span className="text-[13px] font-bold text-slate-500 uppercase tracking-widest ml-4 mb-2">
              {section}
            </span>
            <div className="bg-[#1c1c1e] rounded-[20px] overflow-hidden border border-white/5 divide-y divide-white/5 shadow-sm">
              {items.map(({ key, Icon, iconColor, iconBg, label, description }) => (
                <SettingRow
                  key={key}
                  icon={Icon}
                  iconColor={iconColor}
                  iconBg={iconBg}
                  label={label}
                  description={description}
                  value={settings[key]}
                  onChange={(val) => handleToggle(key, val)}
                  disabled={savingKey === key}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupSettings;