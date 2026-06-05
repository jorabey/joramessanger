import React from 'react';
import BaseBubble from './BaseBubble';
import LinkPreview from './LinkPreview'; 

const linkifyText = (text) => {
  if (!text) return null;

  // URL'larni aniqlash uchun regex
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-[#59aeff] underline underline-offset-2 hover:text-blue-500 dark:hover:text-[#7bbfff] break-all transition-colors duration-300"
          onClick={(e) => e.stopPropagation()}
          // Linkni bosganda ham nusxalash menyusi chiqmasligi uchun
          style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const TextBubble = (props) => {
  const { message } = props;
  const isLink = message?.message_type === 'link';

  return (
    // Anti-copy uchun inline uslublar:
    // WebkitUserSelect - Safari va Chrome mobilda
    // userSelect - standart usul
    // WebkitTouchCallout - bosib turganda chiqadigan "Copy/Share" menyuni o'chiradi
    <div
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
      className="select-none"
    >
      <BaseBubble {...props}>
        <div className="px-3.5 py-2.5">
          {/* Asosiy matn - Oq/Qora rejimga dinamik moslashgan */}
          {message.content && (
            <p className="text-[15px] leading-[1.4] whitespace-pre-wrap break-words text-neutral-900 dark:text-white font-normal transition-colors duration-300">
              {linkifyText(message.content)}
            </p>
          )}

          {/* Link preview */}
          {isLink && message.link_metadata && (
            <div className="mt-2">
              <LinkPreview metadata={message.link_metadata} />
            </div>
          )}
        </div>
      </BaseBubble>
    </div>
  );
};

export default TextBubble;
