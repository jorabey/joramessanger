// ==========================================
// LinkPreview.jsx — Havolalar uchun chiroyli kartochka
// ==========================================
// link_metadata: { title, description, image_url, url, publisher }
// ==========================================

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
      className="block mt-2 mb-1 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors no-underline"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      {/* Rasm */}
      {image_url && (
        <div className="w-full aspect-video bg-white/5 overflow-hidden">
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
        <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide truncate">
          {publisher || domain}
        </span>

        {/* Sarlavha */}
        {title && (
          <p className="text-xs font-semibold text-white leading-tight line-clamp-2">
            {title}
          </p>
        )}

        {/* Tavsif */}
        {description && (
          <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </a>
  );
};

export default LinkPreview;