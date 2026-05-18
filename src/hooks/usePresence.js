import { useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import { selectUser } from '../redux/authSlice';

const GROUP_ID = import.meta.env.VITE_GROUP_ID;
const TYPING_TIMEOUT_MS = 3000;

// ==========================================
// GLOBAL STATE (Barcha komponentlar uchun yagona)
// ==========================================
let globalChannel = null;
let onlineUsersGlobal = {};
let typingUsersGlobal = [];
const subscribers = new Set();

let typingTimer = null;
let isTypingGlobal = false;

// Barcha obuna bo'lgan komponentlarni yangilash
const notifySubscribers = () => {
  subscribers.forEach((setState) => {
    setState({
      onlineUsers: { ...onlineUsersGlobal },
      typingUsers: [...typingUsersGlobal],
    });
  });
};

export const usePresence = () => {
  const currentUser = useSelector(selectUser);

  const [state, setState] = useState({
    onlineUsers: onlineUsersGlobal,
    typingUsers: typingUsersGlobal,
  });

  useEffect(() => {
    if (!currentUser?.id) return;

    // Ushbu komponentni obunachilar ro'yxatiga qo'shamiz
    subscribers.add(setState);

    // Kanal faqat bir marta yaratiladi
    if (!globalChannel) {
      const channelName = `presence-${GROUP_ID}`;

      // Xavfsizlik: Keşda qolib ketgan eskirgan kanallarni tozalab tashlash (HMR va Strict Mode uchun)
      const existingChannels = supabase.getChannels();
      existingChannels.forEach((c) => {
        if (c.topic === `realtime:${channelName}`) {
          supabase.removeChannel(c);
        }
      });

      globalChannel = supabase.channel(channelName, {
        config: { presence: { key: currentUser.id } },
      });

      globalChannel
        .on('presence', { event: 'sync' }, () => {
          const pState = globalChannel.presenceState();
          const formatted = {};
          Object.entries(pState).forEach(([key, presences]) => {
            if (presences.length > 0) formatted[key] = presences[0];
          });
          onlineUsersGlobal = formatted;
          notifySubscribers();
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          newPresences.forEach((p) => {
            onlineUsersGlobal[p.user_id] = p;
          });
          notifySubscribers();
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          leftPresences.forEach((p) => {
            delete onlineUsersGlobal[p.user_id];
          });
          notifySubscribers();
        })
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload.user_id === currentUser.id) return;

          if (payload.isTyping) {
            if (!typingUsersGlobal.some((u) => u.user_id === payload.user_id)) {
              typingUsersGlobal.push(payload);
              notifySubscribers();
            }
          } else {
            typingUsersGlobal = typingUsersGlobal.filter((u) => u.user_id !== payload.user_id);
            notifySubscribers();
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await globalChannel.track({
              user_id: currentUser.id,
              first_name: currentUser.first_name,
              last_name: currentUser.last_name,
              avatar_url: currentUser.avatar_url,
              online_at: new Date().toISOString(),
            });
          }
        });
    }

    // Komponent ekrandan yo'qolganda obunani bekor qilish
    return () => {
      subscribers.delete(setState);
    };
  }, [currentUser]);

  const sendTyping = useCallback(async () => {
    if (!globalChannel || !currentUser) return;

    if (!isTypingGlobal) {
      isTypingGlobal = true;
      try {
        await globalChannel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: currentUser.id,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            isTyping: true,
          },
        });
      } catch (err) {}
    }

    clearTimeout(typingTimer);
    typingTimer = setTimeout(async () => {
      isTypingGlobal = false;
      try {
        await globalChannel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: currentUser.id,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            isTyping: false,
          },
        });
      } catch (err) {}
    }, TYPING_TIMEOUT_MS);
  }, [currentUser]);

  const stopTyping = useCallback(async () => {
    if (!globalChannel || !currentUser || !isTypingGlobal) return;

    clearTimeout(typingTimer);
    isTypingGlobal = false;

    try {
      await globalChannel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: currentUser.id,
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
          isTyping: false,
        },
      });
    } catch (err) {}
  }, [currentUser]);

  const isUserOnline = useCallback(
    (userId) => !!state.onlineUsers[userId],
    [state.onlineUsers]
  );

  const onlineCount = Object.keys(state.onlineUsers).length;

  const typingText = (() => {
    const tu = state.typingUsers;
    if (tu.length === 0) return null;
    if (tu.length === 1) return `${tu[0].first_name} yozmoqda...`;
    if (tu.length === 2) return `${tu[0].first_name} va ${tu[1].first_name} yozmoqda...`;
    return `${tu.length} kishi yozmoqda...`;
  })();

  return {
    onlineUsers: state.onlineUsers,
    onlineCount,
    typingUsers: state.typingUsers,
    typingText,
    isUserOnline,
    sendTyping,
    stopTyping,
  };
};