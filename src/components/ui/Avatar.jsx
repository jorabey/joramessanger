// ==========================================
// Avatar.jsx — Foydalanuvchi rasmi komponenti
// ==========================================
// - Rasm bo'lsa → rasm ko'rsatadi
// - Rasm bo'lmasa → initials (harflar)
// - Online indicator (yashil nuqta)
// - O'lchamlar: xs, sm, md, lg, xl
// - Guruh avatar (bir nechta kichik avatar)
// ==========================================

// Ismdan initials olish: "Ali Valiyev" → "AV"
const getInitials = (firstName = '', lastName = '') => {
  const f = firstName?.[0]?.toUpperCase() ?? '';
  const l = lastName?.[0]?.toUpperCase() ?? '';
  return f + l || '?';
};

// Ismdan rang hisoblash (har xil foydalanuvchi har xil rang)
const getAvatarColor = (userId = '') => {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-teal-500 to-green-600',
    'from-red-500 to-orange-600',
  ];
  const index = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

// ==========================================
// ASOSIY AVATAR
// ==========================================
const Avatar = ({
  src = null,             // Rasm URL
  firstName = '',
  lastName = '',
  userId = '',            // Rang hisoblash uchun
  size = 'md',            // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isOnline = false,       // Online indicator
  isRound = true,         // false → kvadrat (guruh avatar)
  className = '',
  onClick,
}) => {
  const sizes = {
    xs: { wrap: 'w-6 h-6',   text: 'text-[9px]',  dot: 'w-2 h-2 border' },
    sm: { wrap: 'w-8 h-8',   text: 'text-xs',      dot: 'w-2.5 h-2.5 border' },
    md: { wrap: 'w-10 h-10', text: 'text-sm',      dot: 'w-3 h-3 border-2' },
    lg: { wrap: 'w-14 h-14', text: 'text-lg',      dot: 'w-3.5 h-3.5 border-2' },
    xl: { wrap: 'w-20 h-20', text: 'text-2xl',     dot: 'w-4 h-4 border-2' },
  };

  const s = sizes[size] ?? sizes.md;
  const gradient = getAvatarColor(userId || firstName);
  const initials = getInitials(firstName, lastName);
  const radius = isRound ? 'rounded-full' : 'rounded-xl';
  const isClickable = !!onClick;

  return (
    <div
      className={[
        'relative inline-flex shrink-0',
        isClickable ? 'cursor-pointer' : '',
        className,
      ].join(' ')}
      onClick={onClick}
    >
      {/* Avatar o'zi */}
      <div
        className={[
          s.wrap, radius,
          'overflow-hidden',
          'select-none',
          isClickable ? 'hover:opacity-90 transition-opacity' : '',
        ].join(' ')}
      >
        {src ? (
          <img
            src={src}
            alt={`${firstName} ${lastName}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className={`${s.text} font-bold text-white leading-none`}>
              {initials}
            </span>
          </div>
        )}
      </div>

      {/* Online indicator */}
      {isOnline && (
        <span
          className={[
            'absolute -bottom-px -right-px',
            s.dot,
            'rounded-full bg-green-500',
            'border-[#161828]', // App background rangi bilan mos
            'ring-1 ring-green-400/30',
          ].join(' ')}
        />
      )}
    </div>
  );
};

// ==========================================
// GURUH AVATAR (bir nechta kichikcha)
// ==========================================
export const AvatarGroup = ({
  users = [],     // [{ id, first_name, last_name, avatar_url }]
  max = 3,        // Ko'pi bilan nechta ko'rsatilsin
  size = 'sm',
}) => {
  const visible = users.slice(0, max);
  const extra = users.length - max;

  const sizes = {
    xs: { wrap: 'w-5 h-5', overlap: '-ml-1.5', text: 'text-[8px]' },
    sm: { wrap: 'w-7 h-7', overlap: '-ml-2',   text: 'text-[10px]' },
    md: { wrap: 'w-9 h-9', overlap: '-ml-2.5', text: 'text-xs' },
  };
  const s = sizes[size] ?? sizes.sm;

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <div
          key={user.id ?? i}
          className={[s.wrap, 'rounded-full ring-2 ring-[#161828]', i > 0 ? s.overlap : ''].join(' ')}
        >
          <Avatar
            src={user.avatar_url}
            firstName={user.first_name}
            lastName={user.last_name}
            userId={user.id}
            size={size}
          />
        </div>
      ))}

      {extra > 0 && (
        <div
          className={[
            s.wrap, s.overlap,
            'rounded-full ring-2 ring-[#161828]',
            'bg-slate-600 flex items-center justify-center',
          ].join(' ')}
        >
          <span className={`${s.text} font-semibold text-white leading-none`}>+{extra}</span>
        </div>
      )}
    </div>
  );
};

export default Avatar;

// ==========================================
// ISHLATILISHI (USAGE):
// ==========================================
// <Avatar
//   src={user.avatar_url}
//   firstName={user.first_name}
//   lastName={user.last_name}
//   userId={user.id}
//   size="md"
//   isOnline={isUserOnline(user.id)}
// />
//
// <AvatarGroup
//   users={onlineUsersList}
//   max={4}
//   size="sm"
// />