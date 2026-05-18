import { useSelector } from 'react-redux';
import {
  selectMembership,
  selectIsOwner,
  selectIsAdmin,
  selectUserRole,
} from '../redux/authSlice';

// ==========================================
// usePermissions HOOK
// ==========================================
// Bu hook global guruh ruxsatlari (groups jadvali) va
// individual ruxsatlarni (group_members) birlashtirib qaytaradi.
// Qoida: IKKALASI ham true bo'lsagina ruxsat beriladi
// (owner va admin uchun ayrim cheklovlar qo'llanmaydi)
// ==========================================

export const usePermissions = (groupSettings = null) => {
  const membership = useSelector(selectMembership);
  const isOwner = useSelector(selectIsOwner);
  const isAdmin = useSelector(selectIsAdmin);
  const role = useSelector(selectUserRole);

  if (!membership) {
    // Hali yuklanmagan — hamma narsa false
    return {
      role: null,
      isOwner: false,
      isAdmin: false,

      canSendMessages: false,
      canSendMedia: false,
      canSendAudio: false,
      canSendVideo: false,
      canSendVoiceNotes: false,
      canSendVideoNotes: false,
      canReact: false,
      canSeeViewers: false,

      canDeleteOthersMessages: false,
      canEditGroupInfo: false,
      canManageSettings: false,
      canBlockUsers: false,
    };
  }

  // ----------------------------------------
  // Owner va Admin uchun maxsus holat:
  // Global cheklovlar ularga ta'sir qilmaydi
  // ----------------------------------------
  const isPrivileged = isOwner || isAdmin;

  // Global ruxsatlar (groupSettings null bo'lsa tekshirilmaydi)
  const globalAllowMessages  = groupSettings ? groupSettings.allow_messages   : true;
  const globalAllowFiles     = groupSettings ? groupSettings.allow_files      : true;
  const globalAllowAudio     = groupSettings ? groupSettings.allow_audio      : true;
  const globalAllowVideo     = groupSettings ? groupSettings.allow_video      : true;
  const globalAllowVoice     = groupSettings ? groupSettings.allow_voice_notes : true;
  const globalAllowVideoNote = groupSettings ? groupSettings.allow_video_notes : true;
  const globalAllowReactions = groupSettings ? groupSettings.allow_reactions   : true;

  // ----------------------------------------
  // RUXSATLARNI HISOBLASH
  // Oddiy user: global AND individual
  // Admin/Owner: faqat individual (global cheklov ularga yo'q)
  // ----------------------------------------

  const canSendMessages = isPrivileged
    ? membership.can_send_messages
    : globalAllowMessages && membership.can_send_messages;

  const canSendMedia = isPrivileged
    ? membership.can_send_media
    : globalAllowFiles && membership.can_send_media;

  const canSendAudio = isPrivileged
    ? membership.can_send_media
    : globalAllowAudio && membership.can_send_media;

  const canSendVideo = isPrivileged
    ? membership.can_send_media
    : globalAllowVideo && membership.can_send_media;

  const canSendVoiceNotes = isPrivileged
    ? membership.can_send_voice_video_notes
    : globalAllowVoice && membership.can_send_voice_video_notes;

  const canSendVideoNotes = isPrivileged
    ? membership.can_send_voice_video_notes
    : globalAllowVideoNote && membership.can_send_voice_video_notes;

  const canReact = isPrivileged
    ? membership.can_react
    : globalAllowReactions && membership.can_react;

  // Ko'rganlarni ko'rish — faqat individual ruxsat (global ta'sir yo'q)
  const canSeeViewers = membership.can_see_viewers;

  // ----------------------------------------
  // ADMIN RUXSATLAR
  // ----------------------------------------

  // Xabar o'chirish: o'z xabarini har doim o'chira oladi,
  // boshqalarnikini faqat ruxsat bo'lsa
  const canDeleteOthersMessages = membership.can_delete_others_messages;

  // Guruh ma'lumotini tahrirlash (nom, rasm)
  const canEditGroupInfo = membership.can_edit_group_info;

  // Guruh sozlamalarini boshqarish (ruxsatlar paneli)
  const canManageSettings = membership.can_manage_group_settings;

  // Foydalanuvchini bloklash
  const canBlockUsers = membership.can_block_users;

  // ----------------------------------------
  // HELPER: Boshqa user ning xabarini o'chira oladimi?
  // ----------------------------------------
  const canDeleteMessage = (messageUserId, currentUserId) => {
    if (messageUserId === currentUserId) return true; // O'z xabari
    return canDeleteOthersMessages;
  };

  // ----------------------------------------
  // HELPER: Boshqa userga nisbatan yuqori darajadami?
  // (MembersList da admin tugmasini ko'rsatish uchun)
  // ----------------------------------------
  const isHigherThan = (otherRole) => {
    const hierarchy = { owner: 3, admin: 2, user: 1 };
    return (hierarchy[role] ?? 0) > (hierarchy[otherRole] ?? 0);
  };

  return {
    // Rol
    role,
    isOwner,
    isAdmin,

    // Xabar yuborish ruxsatlari
    canSendMessages,
    canSendMedia,
    canSendAudio,
    canSendVideo,
    canSendVoiceNotes,
    canSendVideoNotes,
    canReact,
    canSeeViewers,

    // Admin ruxsatlar
    canDeleteOthersMessages,
    canEditGroupInfo,
    canManageSettings,
    canBlockUsers,

    // Helper funksiyalar
    canDeleteMessage,
    isHigherThan,
  };
};