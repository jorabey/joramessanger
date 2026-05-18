// ==========================================
// Loader.jsx — Yuklash animatsiyalari to'plami
// ==========================================
// Variantlar:
//   spinner  — aylana spinner (tugmalar uchun)
//   dots     — uchta nuqta (typing indicator kabi)
//   skeleton — placeholder (xabarlar yuklanayotganda)
//   pulse    — to'liq ekran (birinchi yuklash)
// ==========================================

// ==========================================
// 1. SPINNER (Kichik, inline)
// ==========================================
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 14, md: 18, lg: 24, xl: 36 };
  const px = sizes[size] ?? sizes.md;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-label="Yuklanmoqda"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};

// ==========================================
// 2. DOTS (Typing indicator)
// ==========================================
export const Dots = ({ className = '' }) => (
  <div className={`flex items-center gap-1 ${className}`} aria-label="Yuklanmoqda">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-current opacity-60"
        style={{
          animation: 'dotBounce 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes dotBounce {
        0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
        40%           { transform: scale(1.2); opacity: 1;   }
      }
    `}</style>
  </div>
);

// ==========================================
// 3. MESSAGE SKELETON (Xabar placeholder)
// ==========================================
export const MessageSkeleton = ({ count = 5 }) => {
  // Har bir skeleton har xil kenglikda bo'lishi uchun
  const widths = ['w-2/3', 'w-1/2', 'w-3/4', 'w-2/5', 'w-3/5'];
  const sides  = [false, true, false, false, true]; // true = o'ng (o'zim)

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {Array.from({ length: count }).map((_, i) => {
        const isMe = sides[i % sides.length];
        const w = widths[i % widths.length];

        return (
          <div
            key={i}
            className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar placeholder */}
            {!isMe && (
              <div className="w-8 h-8 rounded-full bg-white/8 animate-pulse shrink-0" />
            )}

            {/* Bubble */}
            <div className={`flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
              {/* Ism (faqat chap tomonda) */}
              {!isMe && (
                <div className="w-20 h-2.5 rounded bg-white/8 animate-pulse" />
              )}
              {/* Matn satrlari */}
              <div
                className={[
                  'rounded-2xl bg-white/8 animate-pulse h-10',
                  w,
                  isMe ? 'rounded-br-sm' : 'rounded-bl-sm',
                ].join(' ')}
              />
              {/* Vaqt */}
              <div className="w-10 h-2 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// 4. FULL SCREEN LOADER (Birinchi ochilishda)
// ==========================================
export const PageLoader = ({ text = 'Yuklanmoqda...' }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#161828] gap-4">
    {/* Logo / Brand */}
    <div
      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-xl shadow-blue-900/40"
      style={{ animation: 'logoPulse 2s ease-in-out infinite' }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </div>

    <Spinner size="lg" className="text-blue-400" />

    <p className="text-slate-400 text-sm font-medium">{text}</p>

    <style>{`
      @keyframes logoPulse {
        0%, 100% { transform: scale(1);    box-shadow: 0 10px 40px rgba(99,102,241,0.3); }
        50%       { transform: scale(1.06); box-shadow: 0 10px 60px rgba(99,102,241,0.5); }
      }
    `}</style>
  </div>
);

// ==========================================
// DEFAULT EXPORT (Spinner)
// ==========================================
const Loader = Spinner;
export default Loader;

// ==========================================
// ISHLATILISHI (USAGE):
// ==========================================
// import Loader, { Spinner, Dots, MessageSkeleton, PageLoader } from './ui/Loader';
//
// Birinchi yuklash:
// {!isInitialized && <PageLoader text="Tizimga kirilmoqda..." />}
//
// Xabarlar yuklanayotganda:
// {isLoading ? <MessageSkeleton count={7} /> : <MessageList />}
//
// Typing indicator:
// {typingText && (
//   <div className="flex items-center gap-2 text-slate-400 text-xs">
//     <Dots /> <span>{typingText}</span>
//   </div>
// )}
//
// Tugma ichida:
// <Button isLoading={isSending}>Yuborish</Button>