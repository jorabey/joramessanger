// Global kesh - hisoblangan vaqtlarni saqlash uchun
const timeCache = new Map();

// Standart formatlar (bir marta yaratiladi, xotira va vaqtni tejaydi)
const hourMinFormatter = new Intl.DateTimeFormat('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });
const dayMonthFormatter = new Intl.DateTimeFormat('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const fullDateFormatter = new Intl.DateTimeFormat('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

// 1. O'zgarmaslarni funksiya tashqarisiga chiqaramiz (Xotirani tejash uchun)
const FILE_SIZES = ['B', 'KB', 'MB', 'GB', 'TB'];
const K_UNIT = 1024;

// 2. Kesh (Memoizatsiya) - bir xil hajmdagi fayllarni qayta hisoblamaslik uchun
const sizeCache = new Map();

const durationCache = new Map();

// ==========================================
// 1. VAQTNI FORMATLASH (XABARLAR UCHUN)
// ==========================================
export const formatMessageTime = (dateString) => {
  if (!dateString) return '';

  // 1. Keshni tekshirish (Agar avval hisoblangan bo'lsa, 0.0001 ms da javob beradi)
  if (timeCache.has(dateString)) return timeCache.get(dateString);

  const date = new Date(dateString);
  const timestamp = date.getTime();
  
  if (isNaN(timestamp)) return ''; // Noto'g'ri sana kelsa xavfsizlik uchun bo'sh qaytaradi

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 86400000; // Bir sutka millisekundlarda

  let result = '';

  // 2. Mantiqiy algoritmlar (Matematik solishtirish eng tezi hisoblanadi)
  if (timestamp >= todayStart) {
    // Bugun
    result = hourMinFormatter.format(date);
  } else if (timestamp >= todayStart - dayMs) {
    // Kecha
    result = `Kecha, ${hourMinFormatter.format(date)}`;
  } else if (date.getFullYear() === now.getFullYear()) {
    // Shu yil
    result = dayMonthFormatter.format(date).replace(',', '');
  } else {
    // Eski yillar
    result = fullDateFormatter.format(date);
  }

  // 3. Natijani keshga yozish (Kelajakda foydalanish uchun)
  // Kesh to'lib ketmasligi uchun kichik tozalash logikasi qo'shsa ham bo'ladi
  if (timeCache.size > 1000) timeCache.clear(); 
  timeCache.set(dateString, result);

  return result;
};
// ==========================================
// 2. FAYL HAJMINI FORMATLASH (MB, KB)
// ==========================================
export const formatFileSize = (bytes) => {
  // 3. Xavfsizlik filtri: manfiy son yoki noto'g'ri qiymat kelsa
  if (bytes <= 0 || isNaN(bytes)) return '0 B';

  // 4. Keshni tekshirish (Agar avval hisoblangan bo'lsa, javob tayyor)
  if (sizeCache.has(bytes)) return sizeCache.get(bytes);

  // 5. Algoritmni optimallashtirish: Math.log o'rniga oddiy tsikl
  // Bu usul protsessor uchun Math.log dan ko'ra yengilroq
  let i = 0;
  let tempBytes = bytes;
  
  while (tempBytes >= K_UNIT && i < FILE_SIZES.length - 1) {
    tempBytes /= K_UNIT;
    i++;
  }

  // 6. Natijani shakllantirish
  // .toFixed(i > 0 ? 1 : 0) - Agar Bayt bo'lsa butun son, KB/MB bo'lsa vergul bilan chiqaradi
  const result = `${i === 0 ? tempBytes : tempBytes.toFixed(1)} ${FILE_SIZES[i]}`;

  // 7. Keshga yozish (Kesh hajmini nazorat qilgan holda)
  if (sizeCache.size > 500) sizeCache.clear();
  sizeCache.set(bytes, result);

  return result;
};

// ==========================================
// 3. MEDIA DAVOMIYLIGINI FORMATLASH (Audio/Video uchun)
// ==========================================
// Kiruvchi parametr: 105 (sekund) -> Natija: "01:45"
export const formatDuration = (seconds) => {
  // 2. Xavfsizlik: minus sonlar yoki noto'g'ri qiymat kelsa
  if (!seconds || seconds <= 0 || isNaN(seconds)) return '00:00';

  // 3. Keshni tekshirish (Hisoblashdan ko'ra xotiradan olish har doim tezroq)
  // Masalan, 120 soniya kelgan bo'lsa, srazu "02:00" qaytaradi
  if (durationCache.has(seconds)) return durationCache.get(seconds);

  // 4. Bitwise NOT (~~) operatori. 
  // Bu Math.floor dan 2-3 baravar tezroq ishlaydi, chunki u 
  // protsessor darajasidagi bitlar bilan ishlaydi.
  const m = (seconds / 60) | 0; // Minut
  const s = (seconds % 60) | 0; // Sekund

  // 5. Native padStart (ES6+ standart)
  // Bu if-else yoki ternary operatorlardan ko'ra "aqlliroq" va tezroq
  const result = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  // 6. Keshni boshqarish
  if (durationCache.size > 500) durationCache.clear();
  durationCache.set(seconds, result);

  return result;
};
// ==========================================
// 4. MATNNI QISQARTIRISH (Truncate)
// ==========================================
// Juda uzun fayl nomlarini yoki URL larni qisqartirib ko'rsatish uchun
export const truncateText = (text, maxLength = 20) => {
  // 1. Xavfsizlik: Agar matn bo'sh bo'lsa yoki string bo'lmasa, srazu chiqib ketamiz
  if (typeof text !== 'string' || !text) return '';

  const textLength = text.length;

  // 2. Agar matn uzunligi maxLength dan kichik bo'lsa, hech qanday amal bajarmaymiz
  // Bu protsessorni ortiqcha substring amallaridan qutqaradi
  if (textLength <= maxLength) return text;

  // 3. Algoritmni optimallashtirish (Bitwise shift orqali yarmini hisoblash)
  // (maxLength >> 1) — bu Math.floor(maxLength / 2) dan tezroq ishlaydi
  const half = maxLength >> 1;

  // 4. O'rtasidan qisqartirish
  // Slice substring dan ko'ra zamonaviyroq va barqarorroq
  return `${text.slice(0, half)}...${text.slice(textLength - half)}`;
};