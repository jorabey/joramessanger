// ==========================================
// 1. FAYL VA MEDIA SOZLAMALARI
// ==========================================

// Maksimal fayl hajmlari (Baytda)
export const MAX_FILE_SIZE = {
  IMAGE: 10 * 1024 * 1024, // 10 MB
  VIDEO: 50 * 1024 * 1024, // 50 MB
  AUDIO: 20 * 1024 * 1024, // 20 MB
  DOCUMENT: 50 * 1024 * 1024, // 50 MB
};

// Ruxsat etilgan fayl formatlari (MIME types)
export const ALLOWED_FORMATS = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  DOCUMENT: [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ]
};

// ==========================================
// 2. FOYDALANUVCHI ROLLARI VA RUXSATLARI
// ==========================================

export const USER_ROLES = {
  OWNER: 'owner',     // Guruh egasi (Hamma narsaga ruxsati bor)
  ADMIN: 'admin',     // Yordamchi (O'chirish, tahrirlash kabi huquqlari bor)
  USER: 'user',       // Oddiy sinfdosh
};

// ==========================================
// 3. XABAR TURLARI
// ==========================================

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  VOICE_NOTE: 'voice_note', // Ovozli xabar
  VIDEO_NOTE: 'video_note', // Yumaloq videoxabar
  FILE: 'file',
  LINK: 'link'
};

// ==========================================
// 4. EMOJI REAKSIYALARI
// ==========================================
// Foydalanuvchilar xabarlarga bosa oladigan reaksiyalar ro'yxati
export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'];

// ==========================================
// 5. THEME (MAVZU) SOZLAMALARI
// ==========================================
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};