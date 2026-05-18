import BaseBubble from './BaseBubble';
import LinkPreview from './LinkPreview'; 

const linkifyText = (text) => {
  if (!text) return null;

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
          className="underline underline-offset-2 opacity-80 hover:opacity-100 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

// ==========================================
// ASOSIY KOMPONENT (Aynan shu yerda xato bor edi)
// ==========================================
// DIQQAT: Biz endi hamma funksiyalarni (props) orqali to'liq qabul qilyapmiz!
const TextBubble = (props) => {
  const { message } = props; // Xabarni ajratib olamiz
  const isLink = message?.message_type === 'link';

  return (
    // {...props} orqali MessageList'dan kelgan hamma narsa BaseBubble'ga o'tib ketadi!
    <BaseBubble {...props}>
      <div className="px-3 pt-2 pb-0">
        {/* Asosiy matn */}
        {message.content && (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words text-white">
            {linkifyText(message.content)}
          </p>
        )}

        {/* Link preview */}
        {isLink && message.link_metadata && (
          <LinkPreview metadata={message.link_metadata} />
        )}
      </div>
    </BaseBubble>
  );
};

export default TextBubble;