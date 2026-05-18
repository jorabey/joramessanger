import { ALLOWED_FORMATS, MAX_FILE_SIZE } from '../config/constants';
const urlCache = new Map();

// ==========================================
// 1. MAKTAB DOMENINI TEKSHIRISH
// ==========================================
export const isValidSchoolEmail = (email) => {
  // 1. Dastlabki filtr: Bo'sh bo'lsa yoki matn bo'lmasa srazu rad etish
  if (typeof email !== 'string' || !email) return false;

  // 2. Xavfsizlik: Email uzunligini cheklash (DDoS hujumlaridan himoya)
  // Dunyo bo'yicha eng uzun email 254 belgidan oshmaydi.
  if (email.length > 254) return false;

  /**
   * 3. Optimallashgan Regex (Muntazam ifoda):
   * [a-z0-9._-] - Faqat lotin harflari, sonlar va ruxsat berilgan belgilar.
   * +           - Kamida bitta belgi bo'lishi shart.
   * @124maktab\.uz - Aynan shu domen bo'lishi shart.
   * i           - Kichik va katta harflarni farqlamaydi (Ali@... va ali@... bir xil).
   */
  const schoolEmailRegex = /^[a-z0-9._-]+@124maktab\.uz$/i;

  return schoolEmailRegex.test(email);
};

// ==========================================
// 2. PAROL KUCHINI TEKSHIRISH
// ==========================================
export const isValidPassword = (password) => {
  // 1. Dastlabki filtr: Bo'sh bo'lsa yoki string bo'lmasa srazu rad etish
  if (typeof password !== 'string' || !password) return false;

  // 2. Xavfsizlik: Juda uzun parollardan himoya (DDoS/ReDoS hujumlariga qarshi)
  // Hech bir normal parol 128 tadan oshmaydi.
  const len = password.length;
  if (len < 6 || len > 128) return false;

  /**
   * 3. Aqlli tekshiruv (Smart Security Logic):
   * Haqiqiy xavfsiz parol uchun kamida:
   * - Bitta katta harf
   * - Bitta kichik harf
   * - Bitta raqam bo'lishi shart.
   * * Bu regex "Lookahead" algoritmi bilan ishlaydi - bu eng xavfsiz usuldir.
   */
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

  return strongPasswordRegex.test(password);
};

// ==========================================
// 3. FAYL HAJMI VA FORMATINI TEKSHIRISH
// ==========================================
export const validateFile = (file) => {
  // 2. Xavfsizlik: Fayl obyekti borligini tekshirish
  if (!file || !(file instanceof File)) {
    return { isValid: false, error: "Fayl yaroqsiz yoki topilmadi" };
  }

  const { type, size } = file;

  // 3. Algoritmni optimallashtirish: "Early Return" va mantiqiy bloklar
  
  // RASM
  if (ALLOWED_FORMATS.IMAGE.includes(type)) {
    return size <= MAX_FILE_SIZE.IMAGE 
      ? { isValid: true, type: 'image' } 
      : { isValid: false, error: "Rasm hajmi 10MB dan oshmasligi kerak" };
  }

  // VIDEO
  if (ALLOWED_FORMATS.VIDEO.includes(type)) {
    return size <= MAX_FILE_SIZE.VIDEO 
      ? { isValid: true, type: 'video' } 
      : { isValid: false, error: "Video hajmi 50MB dan oshmasligi kerak" };
  }

  // AUDIO
  if (ALLOWED_FORMATS.AUDIO.includes(type)) {
    return size <= MAX_FILE_SIZE.AUDIO 
      ? { isValid: true, type: 'audio' } 
      : { isValid: false, error: "Audio hajmi 20MB dan oshmasligi kerak" };
  }

  // HUJJAT (PDF, Word, Excel...)
  if (ALLOWED_FORMATS.DOCUMENT.includes(type)) {
    return size <= MAX_FILE_SIZE.DOCUMENT 
      ? { isValid: true, type: 'file' } 
      : { isValid: false, error: "Fayl hajmi 50MB dan oshmasligi kerak" };
  }

  // 4. Hech qaysi formatga tushmasa
  return { isValid: false, error: "Bunday turdagi faylni yuklash taqiqlangan" };
};

// ==========================================
// 4. MATN ICHIDAN URL HAVOLALARNI QIDIRISH
// ==========================================
export const extractUrls = (text) => {
  // 2. Xavfsizlik va tezkor chiqish
  if (typeof text !== 'string' || !text || text.length < 10) return [];

  // 3. Keshni tekshirish
  if (urlCache.has(text)) return urlCache.get(text);

  /**
   * 4. Aqlli Regex (Advanced Regular Expression):
   * - (https?:\/\/[^\s]+) : Eski variantda nuqtali linklarni ham qo'shib yuborishi mumkin.
   * - Quyidagi variant link oxiridagi [. , ! ? ) ] kabi belgilarni olib tashlaydi.
   * Chunki odamlar ko'pincha: "Mana link: https://google.com." (oxirida nuqta bilan) yozishadi.
   */
  const urlRegex = /(https?:\/\/[^\s]+?)(?=[.,!?)]?(\s|$))/g;
  
  const matches = text.match(urlRegex);
  const result = matches ? [...new Set(matches)] : []; // Set orqali dublikatlarni o'chiradi

  // 5. Keshni boshqarish (500 tadan oshsa tozalaydi)
  if (urlCache.size > 500) urlCache.clear();
  urlCache.set(text, result);

  return result;
};

// ==========================================
// 5. BO'SH XABARNI TEKSHIRISH
// ==========================================
export const isMessageEmpty = (content, file) => {
  // 1. Fayl bor bo'lsa, xabar bo'sh emas (Srazu true qaytaradi - eng tez yo'l)
  if (file) return false;

  // 2. Agar content string bo'lmasa yoki bo'sh bo'lsa
  if (typeof content !== 'string' || !content) return true;

  // 3. Matnni "trim" qilmasdan tekshirish (Xotirani tejash algoritmi)
  // .trim() yangi string yaratadi, bizga esa faqat ichida belgi bormi yoki yo'qmi shuni bilish kifoya.
  // RegEx \S - "bo'sh bo'lmagan belgi" degani.
  return !/\S/.test(content);
};