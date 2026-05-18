import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import { fetchLinkMetadata, getFirstUrl } from '../utils/linkParser';
import { extractUrls } from '../utils/validators';
import {
  setMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  prependMessages,
  updateMessageReactions,
  setLoading,
  setLoadingMore,
  setHasMoreMessages,
  setError,
  setShouldScrollToBottom,
  clearReplyTo,
  clearEditingMessage,
  selectMessages,
  selectReplyTo,
  selectEditingMessage,
  selectHasMoreMessages,
  selectIsLoadingMore,
} from '../redux/chatSlice';
import { selectUser } from '../redux/authSlice';

const GROUP_ID = import.meta.env.VITE_GROUP_ID;
const PAGE_SIZE = 40; // Bir marta nechta xabar yuklanadi

// ==========================================
// Xabarni to'liq ma'lumot bilan olish (JOIN)
// ==========================================
const MESSAGE_QUERY = `
  *,
  profiles:user_id (*),
  reply_message:reply_to_id (
    id, content, message_type, file_name,
    profiles:user_id ( first_name, last_name )
  ),
  reactions:message_reactions (
    reaction, user_id,
    profiles:user_id ( first_name, last_name, avatar_url )
  ),
  reads:message_reads (
    user_id, read_at,
    profiles:user_id ( first_name, last_name, avatar_url )
  )
`;

// ==========================================
// useMessages HOOK
// ==========================================
export const useMessages = () => {
  const dispatch = useDispatch();

  const messages = useSelector(selectMessages);
  const replyTo = useSelector(selectReplyTo);
  const editingMessage = useSelector(selectEditingMessage);
  const hasMoreMessages = useSelector(selectHasMoreMessages);
  const isLoadingMore = useSelector(selectIsLoadingMore);
  const currentUser = useSelector(selectUser);

  // Realtime subscription ref (cleanup uchun)
  const channelRef = useRef(null);

  // ----------------------------------------
  // BIRINCHI YUKLASH
  // ----------------------------------------
  const fetchMessages = useCallback(async () => {
    try {
      dispatch(setLoading(true));

      const { data, error } = await supabase
        .from('messages')
        .select(MESSAGE_QUERY)
        .eq('group_id', GROUP_ID)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      // Vaqt bo'yicha to'g'ri tartib (eski → yangi)
      dispatch(setMessages(data.reverse()));
      dispatch(setHasMoreMessages(data.length === PAGE_SIZE));
    } catch (err) {
      dispatch(setError(err.message));
    }
  }, [dispatch]);

  // ----------------------------------------
  // ESKI XABARLAR (Infinite scroll — yuqoriga tortganda)
  // ----------------------------------------
  const fetchMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages || messages.length === 0) return;

    try {
      dispatch(setLoadingMore(true));

      const oldestMessage = messages[0];

      const { data, error } = await supabase
        .from('messages')
        .select(MESSAGE_QUERY)
        .eq('group_id', GROUP_ID)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      dispatch(prependMessages(data.reverse()));
      dispatch(setHasMoreMessages(data.length === PAGE_SIZE));
    } catch (err) {
      dispatch(setError(err.message));
      dispatch(setLoadingMore(false));
    }
  }, [dispatch, messages, isLoadingMore, hasMoreMessages]);

  // ----------------------------------------
  // XABAR YUBORISH
  // ----------------------------------------
  const sendMessage = useCallback(async ({ content, file, messageType }) => {
    if (!currentUser) return { success: false };

    try {
      let fileData = {};
      let finalType = messageType || 'text';
      let linkMetadata = null;

      // --- Fayl yuklash ---
      if (file) {
        const fileExt = file.name?.split('.').pop() || 'bin';
        const filePath = `messages/${GROUP_ID}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        fileData = {
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        };
      }

      // --- Link detection (matn xabar bo'lsa) ---
      if (finalType === 'text' && content) {
        const firstUrl = getFirstUrl(content);
        if (firstUrl) {
          finalType = 'link';
          linkMetadata = await fetchLinkMetadata(firstUrl);
        }
      }

      // --- Databazaga yozish ---
      const { data, error } = await supabase
        .from('messages')
        .insert({
          group_id: GROUP_ID,
          user_id: currentUser.id,
          content: content || null,
          message_type: finalType,
          reply_to_id: replyTo?.id || null,
          link_metadata: linkMetadata,
          ...fileData,
        })
        .select(MESSAGE_QUERY)
        .single();

      if (error) throw error;

      dispatch(clearReplyTo());
      dispatch(setShouldScrollToBottom(true));

      return { success: true, message: data };
    } catch (err) {
      dispatch(setError(err.message));
      return { success: false, error: err.message };
    }
  }, [dispatch, currentUser, replyTo]);

  // ----------------------------------------
  // XABARNI TAHRIRLASH
  // ----------------------------------------
  const editMessage = useCallback(async (messageId, newContent) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent, is_edited: true })
        .eq('id', messageId)
        .eq('user_id', currentUser.id); // Faqat o'z xabarini

      if (error) throw error;

      dispatch(clearEditingMessage());
      return { success: true };
    } catch (err) {
      dispatch(setError(err.message));
      return { success: false, error: err.message };
    }
  }, [dispatch, currentUser]);

  // ----------------------------------------
  // XABARNI O'CHIRISH (Tombstone)
  // ----------------------------------------
  const deleteMessageById = useCallback(async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          is_deleted_for_all: true,
          deleted_by: currentUser.id,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      dispatch(setError(err.message));
      return { success: false, error: err.message };
    }
  }, [dispatch, currentUser]);

  // ----------------------------------------
  // XABARNI O'QILGAN DEYISH (Read receipt)
  // ----------------------------------------
// useMessages.js ichiga qo'shing:
const markAsRead = async (messageId) => {
  if (!currentUser?.id) return;
  
  try {
    // Bazaga o'qilganini yozamiz
    await supabase.from('message_reads').upsert({
      message_id: messageId,
      user_id: currentUser.id,
      read_at: new Date().toISOString()
    }, { onConflict: 'message_id, user_id' });
  } catch (error) {
    console.error("O'qildi qilishda xato:", error);
  }
};

  // ----------------------------------------
  // REAKSIYA QO'SHISH / OLIB TASHLASH
  // ----------------------------------------
  const toggleReaction = useCallback(async (messageId, reaction) => {
    if (!currentUser) return;

    // Mavjudligini tekshirish
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId)
      .eq('user_id', currentUser.id)
      .eq('reaction', reaction)
      .single();

    if (existing) {
      // Olib tashlash
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', currentUser.id)
        .eq('reaction', reaction);
    } else {
      // Qo'shish
      await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: currentUser.id, reaction });
    }
  }, [currentUser]);

  // ----------------------------------------
  // REALTIME SUBSCRIPTION
  // ----------------------------------------
  useEffect(() => {
    fetchMessages();

    // Supabase Realtime channel
    const channel = supabase
      .channel(`group-chat-${GROUP_ID}`)

      // Yangi xabar keldi
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${GROUP_ID}` },
        async (payload) => {
          // To'liq ma'lumot bilan qayta olish (JOIN uchun)
          const { data } = await supabase
            .from('messages')
            .select(MESSAGE_QUERY)
            .eq('id', payload.new.id)
            .single();

          if (data) dispatch(addMessage(data));
        }
      )

      // Xabar tahrirlandi yoki o'chirildi
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `group_id=eq.${GROUP_ID}` },
        async (payload) => {
          if (payload.new.is_deleted_for_all) {
            dispatch(deleteMessage(payload.new));
          } else {
            const { data } = await supabase
              .from('messages')
              .select(MESSAGE_QUERY)
              .eq('id', payload.new.id)
              .single();

            if (data) dispatch(updateMessage(data));
          }
        }
      )

      // Reaksiya qo'shildi / o'chirildi
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        async (payload) => {
          const messageId = payload.new?.message_id || payload.old?.message_id;
          if (!messageId) return;

          // Shu xabarning barcha reaksiyalarini qayta olish
          const { data } = await supabase
            .from('message_reactions')
            .select('reaction, user_id, profiles:user_id(first_name, last_name, avatar_url)')
            .eq('message_id', messageId);

          dispatch(updateMessageReactions({ messageId, reactions: data || [] }));
        }
      )

      // O'qilganlar yangilandi
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reads' },
        async (payload) => {
          const messageId = payload.new.message_id;

          const { data } = await supabase
            .from('message_reads')
            .select('user_id, read_at, profiles:user_id(first_name, last_name, avatar_url)')
            .eq('message_id', messageId);

          // updateMessage orqali reads ni yangilash
          dispatch(updateMessage({ id: messageId, reads: data || [] }));
        }
      )

      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [dispatch, fetchMessages]);

  return {
    // State
    messages,
    replyTo,
    editingMessage,
    hasMoreMessages,
    isLoadingMore,

    // Actions
    fetchMoreMessages,
    sendMessage,
    editMessage,
    deleteMessage: deleteMessageById,
    markAsRead,
    toggleReaction,
  };
};