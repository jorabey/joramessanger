// ==========================================
// Input.jsx — Qayta ishlatiladigan input komponenti
// ==========================================
// Variantlar: default, filled
// Holat: error, disabled, loading
// Qo'shimcha: leftIcon, rightIcon, label, hint
// ==========================================

import { useState, forwardRef } from 'react';

const Input = forwardRef(({
  label = '',
  hint = '',             // Pastdagi yordam matni
  error = '',            // Xatolik matni (bo'sh bo'lsa ko'rsatilmaydi)
  leftIcon = null,       // JSX ikonka (chap)
  rightElement = null,   // JSX (o'ng) — ikonka yoki tugma bo'lishi mumkin
  variant = 'default',   // 'default' | 'filled'
  size = 'md',           // 'sm' | 'md' | 'lg'
  disabled = false,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {

  const [isFocused, setIsFocused] = useState(false);

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || undefined;
  const hasError = !!error;

  // ---- Konteyner (wrapper) ----
  const wrapperCls = [
    'relative flex items-center rounded-xl overflow-hidden',
    'transition-all duration-150',
    // Border/background
    variant === 'filled'
      ? 'bg-white/8'
      : 'bg-transparent',
    // Border
    hasError
      ? 'ring-2 ring-red-500/60 bg-red-500/5'
      : isFocused
        ? 'ring-2 ring-blue-500/60 bg-blue-500/5'
        : 'ring-1 ring-white/12 hover:ring-white/20',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
  ].join(' ');

  // ---- Input o'zi ----
  const sizes = {
    sm: 'h-8  text-xs  px-3',
    md: 'h-10 text-sm  px-3',
    lg: 'h-12 text-base px-4',
  };

  const inputCls = [
    'w-full bg-transparent outline-none',
    'text-white placeholder-white/30',
    'caret-blue-400',
    sizes[size] ?? sizes.md,
    leftIcon   ? 'pl-9'  : '',
    rightElement ? 'pr-10' : '',
    disabled ? 'cursor-not-allowed' : '',
    className,
  ].join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-400 tracking-wide uppercase pl-0.5"
        >
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div className={wrapperCls}>
        {/* Chap ikonka */}
        {leftIcon && (
          <span className={[
            'absolute left-3 shrink-0',
            hasError ? 'text-red-400' : isFocused ? 'text-blue-400' : 'text-slate-500',
            'transition-colors duration-150',
            'pointer-events-none',
          ].join(' ')}>
            {leftIcon}
          </span>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={inputCls}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {/* O'ng element (ikonka yoki tugma) */}
        {rightElement && (
          <span className="absolute right-3 shrink-0 flex items-center">
            {rightElement}
          </span>
        )}
      </div>

      {/* Xatolik yoki hint matni */}
      {(hasError || hint) && (
        <p className={[
          'text-xs pl-0.5',
          hasError ? 'text-red-400' : 'text-slate-500',
        ].join(' ')}>
          {hasError ? error : hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

// ==========================================
// ISHLATILISHI (USAGE):
// ==========================================
// Oddiy:
// <Input placeholder="Xabar yozing..." />
//
// Label + xatolik:
// <Input
//   label="Email"
//   type="email"
//   error={errors.email}
//   leftIcon={<MailIcon size={14} />}
// />
//
// Parol + ko'rish tugmasi:
// <Input
//   type={showPass ? 'text' : 'password'}
//   rightElement={
//     <button onClick={() => setShowPass(p => !p)}>
//       <EyeIcon size={14} />
//     </button>
//   }
// />