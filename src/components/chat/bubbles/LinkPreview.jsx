// ==========================================
// LinkPreview.jsx — Havolalar uchun chiroyli kartochka
// ==========================================
// link_metadata: { title, description, image_url, url, publisher }
// ==========================================

import React from 'react';

const LinkPreview = ({ metadata }) => {
  if (!metadata?.url) return null;

  const { title, description, image_url, url, publisher } = metadata;

  // Domain olish (masalan: "youtube.com")
  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    domain = url;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="block mt-2 mb-1 rounded-xl overflow-hidden border border-neutral-200 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20 bg-neutral-100/60 dark:bg-white/5 transition-colors duration-300 no-underline"
    >
      {/* Rasm */}
      {image_url && (
        <div className="w-full aspect-video bg-neutral-200 dark:bg-white/5 overflow-hidden border-b border-neutral-100 dark:border-white/5 transition-colors duration-300">
          <img
            src={image_url}
            alt={title ?? 'Preview'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Matn qismi */}
      <div className="px-3 py-2 flex flex-col gap-0.5">
        {/* Domain */}
        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide truncate transition-colors duration-300">
          {publisher || domain}
        </span>

        {/* Sarlavha - Oq fonda to'q, Qora fonda oq */}
        {title && (
          <p className="text-xs font-semibold text-neutral-900 dark:text-white leading-tight line-clamp-2 transition-colors duration-300">
            {title}
          </p>
        )}

        {/* Tavsif */}
        {description && (
          <p className="text-[11px] text-neutral-500 dark:text-slate-400 leading-snug line-clamp-2 transition-colors duration-300">
            {description}
          </p>
        )}
      </div>
    </a>
  );
};

export default LinkPreview;
