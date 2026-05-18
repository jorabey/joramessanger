// ==========================================
// Tooltip.jsx — Hover qilganda chiqadigan izoh
// ==========================================
// - CSS-only, JS state minimal
// - Yo'nalish: top, bottom, left, right
// - Kechikish bilan chiqadi (flicker yo'q)
// ==========================================

const Tooltip = ({
  children,
  content,                 // Ko'rsatiladigan matn
  placement = 'top',       // 'top' | 'bottom' | 'left' | 'right'
  delay = 500,             // ms — hover dan keyin qancha kutilsin
  disabled = false,
  className = '',
}) => {
  if (!content || disabled) return <>{children}</>;

  // ---- Tooltip pozitsiyasi ----
  const placements = {
    top: {
      tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      arrow:   'top-full left-1/2 -translate-x-1/2 border-t-[#2d3252] border-x-transparent border-b-transparent',
    },
    bottom: {
      tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2',
      arrow:   'bottom-full left-1/2 -translate-x-1/2 border-b-[#2d3252] border-x-transparent border-t-transparent',
    },
    left: {
      tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2',
      arrow:   'left-full top-1/2 -translate-y-1/2 border-l-[#2d3252] border-y-transparent border-r-transparent',
    },
    right: {
      tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2',
      arrow:   'right-full top-1/2 -translate-y-1/2 border-r-[#2d3252] border-y-transparent border-l-transparent',
    },
  };

  const pos = placements[placement] ?? placements.top;

  return (
    <div className={`relative inline-flex group ${className}`}>
      {/* Trigger element */}
      {children}

      {/* Tooltip */}
      <div
        className={[
          'absolute z-50 pointer-events-none',
          'opacity-0 scale-95',
          'group-hover:opacity-100 group-hover:scale-100',
          'transition-all duration-150 ease-out',
          pos.tooltip,
        ].join(' ')}
        style={{ transitionDelay: `${delay}ms` }}
        role="tooltip"
      >
        {/* Matn qutisi */}
        <div className="relative px-2.5 py-1.5 rounded-lg bg-[#2d3252] border border-white/10 shadow-xl shadow-black/40">
          <span className="text-xs font-medium text-white whitespace-nowrap leading-none">
            {content}
          </span>

          {/* O'q (arrow) */}
          <span
            className={[
              'absolute w-0 h-0 border-4',
              pos.arrow,
            ].join(' ')}
          />
        </div>
      </div>
    </div>
  );
};

export default Tooltip;

// ==========================================
// ISHLATILISHI (USAGE):
// ==========================================
// <Tooltip content="Yuborish (Enter)" placement="top">
//   <Button size="icon">
//     <SendIcon size={16} />
//   </Button>
// </Tooltip>
//
// <Tooltip content="Mikrofon o'chiq" placement="bottom" delay={300}>
//   <MicOffIcon size={16} />
// </Tooltip>