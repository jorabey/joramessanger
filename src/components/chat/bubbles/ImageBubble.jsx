import React from 'react';
import { useSelector } from 'react-redux';
import BaseBubble from './BaseBubble';

const ImageBubble = (props) => {
  const { message } = props;
  const currentUser = useSelector((s) => s.auth.user);
  const isMe = message?.user_id === currentUser?.id;

  // Agar rasm tagida matn bo'lmasa, pastki burchaklar ham yumaloq bo'ladi
  const borderRadiusStyle = message.content 
    ? '14px 14px 0 0' 
    : '14px';

  return (
    <BaseBubble {...props}>
      <div 
        className="flex flex-col select-none"
        onContextMenu={(e) => e.preventDefault()}
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        {/* Rasm qismi */}
        <div 
          className="relative overflow-hidden bg-black/10 flex items-center justify-center min-h-[100px]" 
          style={{ borderRadius: borderRadiusStyle }}
        >
          <img
            src={message.file_url}
            alt={message.file_name || 'Rasm'}
            className="max-w-[280px] sm:max-w-[320px] max-h-[350px] w-auto h-auto object-cover pointer-events-none"
            loading="lazy"
            style={{ borderRadius: borderRadiusStyle }}
          />
        </div>
        
        {/* Matn (Izoh/Caption) qismi - agar mavjud bo'lsa */}
        {message.content && (
          <div className="px-3 py-2 text-[15px] leading-[1.3] text-white/90 break-words pointer-events-none">
            {message.content}
          </div>
        )}
      </div>
    </BaseBubble>
  );
};

export default ImageBubble;
