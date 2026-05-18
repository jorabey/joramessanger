// ==========================================
// Button.jsx — Qayta ishlatiladigan tugma komponenti
// ==========================================
// Variantlar: primary, secondary, ghost, danger
// O'lchamlar: sm, md, lg
// Holat: loading, disabled
// ==========================================

import { Loader2 } from 'lucide-react'; // yoki o'zingizning Loader komponentingiz

const Button = ({
  children,
  variant = 'primary',   // 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size = 'md',           // 'sm' | 'md' | 'lg' | 'icon'
  isLoading = false,
  disabled = false,
  leftIcon = null,       // JSX icon
  rightIcon = null,      // JSX icon
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  title,
  ...props
}) => {
  // ---- Base styles ----
  const base = [
    'inline-flex items-center justify-center gap-2',
    'font-semibold rounded-xl',
    'transition-all duration-150 ease-out',
    'select-none outline-none',
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
    fullWidth ? 'w-full' : '',
    (disabled || isLoading) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-[0.97]',
  ].join(' ');

  // ---- Variant styles ----
  const variants = {
    primary: [
      'bg-blue-600 text-white',
      'hover:bg-blue-500',
      'focus-visible:ring-blue-500',
      'shadow-sm shadow-blue-900/30',
    ].join(' '),

    secondary: [
      'bg-white/10 text-white border border-white/15',
      'hover:bg-white/20 hover:border-white/25',
      'focus-visible:ring-white/40',
      'backdrop-blur-sm',
    ].join(' '),

    ghost: [
      'bg-transparent text-slate-300',
      'hover:bg-white/10 hover:text-white',
      'focus-visible:ring-white/30',
    ].join(' '),

    danger: [
      'bg-red-500/15 text-red-400 border border-red-500/25',
      'hover:bg-red-500/25 hover:text-red-300 hover:border-red-400/40',
      'focus-visible:ring-red-500',
    ].join(' '),

    success: [
      'bg-green-500 text-white',
      'hover:bg-green-400',
      'focus-visible:ring-green-500',
      'shadow-sm shadow-green-900/30',
    ].join(' '),
  };

  // ---- Size styles ----
  const sizes = {
    sm:   'h-8  px-3   text-xs  gap-1.5',
    md:   'h-10 px-4   text-sm',
    lg:   'h-12 px-6   text-base',
    icon: 'h-9  w-9    text-sm  p-0',        // Faqat ikonka (matn yo'q)
  };

  const cls = [base, variants[variant] ?? variants.primary, sizes[size] ?? sizes.md, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      {...props}
    >
      {/* Loading spinner */}
      {isLoading && (
        <svg
          className="animate-spin shrink-0"
          width={size === 'sm' ? 12 : 14}
          height={size === 'sm' ? 12 : 14}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}

      {/* Chap ikonka (loading bo'lganda ko'rsatilmaydi) */}
      {!isLoading && leftIcon && (
        <span className="shrink-0">{leftIcon}</span>
      )}

      {/* Matn */}
      {children && <span className="truncate">{children}</span>}

      {/* O'ng ikonka */}
      {!isLoading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};

export default Button;

// ==========================================
// ISHLATILISHI (USAGE):
// ==========================================
// <Button>Yuborish</Button>
// <Button variant="danger" size="sm">O'chirish</Button>
// <Button variant="ghost" size="icon" title="Sozlamalar">
//   <SettingsIcon size={16} />
// </Button>
// <Button isLoading={isSending} fullWidth>Saqlash</Button>
// <Button variant="secondary" leftIcon={<PhoneIcon size={16} />}>Qo'ng'iroq</Button>