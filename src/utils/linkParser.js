const metadataCache = new Map();

// ==========================================
// 1. URL DAN MA'LUMOT OLISH (LINK PREVIEW)
// ==========================================
export const fetchLinkMetadata = async (url) => {
  if (!url || typeof url !== 'string') return null;

  // 2. Keshni tekshirish (Tezlikni 10 baravar oshiradi)
  if (metadataCache.has(url)) return metadataCache.get(url);

  try {
    /**
     * 3. Microlink API - CORS muammosiz ma'lumot olish.
     * AbortController qo'shamiz - agar API 5 sekunddan ko'p vaqt olsa, 
     * kutib o'tirmasdan xatoga o'tkazamiz (User qotib qolmasligi uchun).
     */
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeout);

    if (!response.ok) throw new Error("API_ERROR");

    const { data } = await response.json();

    // 4. Ma'lumotlarni tozalash va standartlashtirish
    const metadata = {
      title: data.title?.slice(0, 100) || "Sahifa nomi yo'q",
      description: data.description?.slice(0, 200) || "",
      image_url: data.image?.url || data.logo?.url || null,
      url: data.url || url,
      publisher: data.publisher || ""
    };

    // 5. Keshga saqlash
    if (metadataCache.size > 200) metadataCache.clear();
    metadataCache.set(url, metadata);

    return metadata;

  } catch (error) {
    // 6. Xavfsiz chiqish (Agar internet yo'q bo'lsa yoki API ishlamasa)
    const fallback = {
      title: url,
      description: "Ma'lumot yuklanmadi",
      image_url: null,
      url: url,
      publisher: ""
    };
    return fallback;
  }
};

// ==========================================
// 2. MATN ICHIDAN YAGONA URL NI AJRATIB OLISH
// ==========================================
// Bu funksiya asosan xabar matnidagi BIRINCHI havolani olish uchun ishlatiladi
export const getFirstUrl = (text) => {
  // 1. Dastlabki filtr: Matn bo'lmasa yoki juda qisqa bo'lsa (min link: http://a.u)
  if (typeof text !== 'string' || !text || text.length < 10) return null;

  /**
   * 2. Optimallashgan Regex:
   * Bu regex link oxiridagi nuqta (.), vergul (,), so'roq (?) kabi 
   * tinish belgilarini linkka qo'shib yubormaslik uchun aqlli "Lookahead" ishlatadi.
   */
  const urlRegex = /(https?:\/\/[^\s]+?)(?=[.,!?)]?(\s|$))/;

  // matchAll yoki g flagisiz ishlatish birinchi uchrashdayoq to'xtashini ta'minlaydi
  const match = text.match(urlRegex);

  // 3. Agar topilsa, birinchi elementni qaytaramiz, aks holda null
  return match ? match[0] : null;
};