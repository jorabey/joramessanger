import { createSlice } from '@reduxjs/toolkit';

// ==========================================
// INITIAL STATE
// ==========================================
const initialState = {
  // Xabarlar ro'yxati (Supabase Realtime dan keladi)
  messages: [],
  /*
    message = {
      id, group_id, user_id, content,
      message_type, file_url, file_name, file_size,
      mime_type, duration, link_metadata,
      reply_to_id, is_edited,
      is_deleted_for_all, deleted_by, deleted_at,
      created_at, updated_at,
      // JOIN qilingan:
      profiles: { first_name, last_name, avatar_url },
      reactions: [{ reaction, user_id, ... }],
      reads: [{ user_id, read_at }]
    }
  */

  // Javob berish (Reply) holati
  replyTo: null,
  /*
    replyTo = {
      id, content, message_type,
      file_name, profiles: { first_name, last_name }
    }
  */

  // Tahrirlash (Edit) holati
  editingMessage: null,
  /*
    editingMessage = { id, content }
  */

  // Xabar qidirish
  searchQuery: '',
  searchResults: [],
  isSearchOpen: false,

  // Yangi xabarlar yuklanishi (infinite scroll)
  isLoadingMore: false,
  hasMoreMessages: true,

  // Birinchi yuklash
  isLoading: false,
  error: null,

  // Yangi xabar kelganida scroll pastga tushishi kerakmi
  shouldScrollToBottom: true,
};

// ==========================================
// SLICE
// ==========================================
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {

    // ---- XABARLAR ----

    // Birinchi yuklashda (useMessages hook dan)
    setMessages(state, action) {
      state.messages = action.payload;
      state.isLoading = false;
      state.shouldScrollToBottom = true;
    },

    // Realtime: yangi xabar keldi (INSERT event)
    addMessage(state, action) {
      const exists = state.messages.some((m) => m.id === action.payload.id);
      if (!exists) {
        state.messages.push(action.payload);
        state.shouldScrollToBottom = true;
      }
    },

    // Realtime: xabar tahrirlandi (UPDATE event)
    updateMessage(state, action) {
      const index = state.messages.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = { ...state.messages[index], ...action.payload };
      }
    },

    // Realtime: xabar o'chirildi (UPDATE — tombstone arxitekturasi)
    deleteMessage(state, action) {
      const index = state.messages.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = {
          ...state.messages[index],
          is_deleted_for_all: true,
          deleted_by: action.payload.deleted_by,
          deleted_at: action.payload.deleted_at,
          content: null,
          file_url: null,
        };
      }
    },

    // Eski xabarlar (scroll yuqoriga ketganda — infinite scroll)
    prependMessages(state, action) {
      state.messages = [...action.payload, ...state.messages];
      state.isLoadingMore = false;
      state.shouldScrollToBottom = false;
    },

    // ---- REAKSIYALAR ----

    // Realtime: reaksiya qo'shildi yoki o'chirildi
    updateMessageReactions(state, action) {
      const { messageId, reactions } = action.payload;
      const index = state.messages.findIndex((m) => m.id === messageId);
      if (index !== -1) {
        state.messages[index].reactions = reactions;
      }
    },

    // ---- REPLY ----

    setReplyTo(state, action) {
      state.replyTo = action.payload;
      state.editingMessage = null; // Reply boshlansa edit bekor bo'ladi
    },

    clearReplyTo(state) {
      state.replyTo = null;
    },

    // ---- EDIT ----

    setEditingMessage(state, action) {
      state.editingMessage = action.payload;
      state.replyTo = null; // Edit boshlansa reply bekor bo'ladi
    },

    clearEditingMessage(state) {
      state.editingMessage = null;
    },

    // ---- QIDIRUV ----

    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },

    setSearchResults(state, action) {
      state.searchResults = action.payload;
    },

    toggleSearch(state) {
      state.isSearchOpen = !state.isSearchOpen;
      if (!state.isSearchOpen) {
        state.searchQuery = '';
        state.searchResults = [];
      }
    },

    // ---- YUKLASH HOLATLARI ----

    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    setLoadingMore(state, action) {
      state.isLoadingMore = action.payload;
    },

    setHasMoreMessages(state, action) {
      state.hasMoreMessages = action.payload;
    },

    setError(state, action) {
      state.error = action.payload;
      state.isLoading = false;
    },

    setShouldScrollToBottom(state, action) {
      state.shouldScrollToBottom = action.payload;
    },

    // Chat papkasidan chiqilganda tozalash
    clearChat(state) {
      state.messages = [];
      state.replyTo = null;
      state.editingMessage = null;
      state.searchQuery = '';
      state.searchResults = [];
      state.isSearchOpen = false;
      state.hasMoreMessages = true;
      state.shouldScrollToBottom = true;
      state.error = null;
    },
  },
});

// ==========================================
// ACTIONS
// ==========================================
export const {
  setMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  prependMessages,
  updateMessageReactions,
  setReplyTo,
  clearReplyTo,
  setEditingMessage,
  clearEditingMessage,
  setSearchQuery,
  setSearchResults,
  toggleSearch,
  setLoading,
  setLoadingMore,
  setHasMoreMessages,
  setError,
  setShouldScrollToBottom,
  clearChat,
} = chatSlice.actions;

// ==========================================
// SELECTORS
// ==========================================
export const selectMessages = (state) => state.chat.messages;
export const selectReplyTo = (state) => state.chat.replyTo;
export const selectEditingMessage = (state) => state.chat.editingMessage;
export const selectSearchQuery = (state) => state.chat.searchQuery;
export const selectSearchResults = (state) => state.chat.searchResults;
export const selectIsSearchOpen = (state) => state.chat.isSearchOpen;
export const selectIsLoading = (state) => state.chat.isLoading;
export const selectIsLoadingMore = (state) => state.chat.isLoadingMore;
export const selectHasMoreMessages = (state) => state.chat.hasMoreMessages;
export const selectShouldScrollToBottom = (state) => state.chat.shouldScrollToBottom;
export const selectChatError = (state) => state.chat.error;

// Bitta xabarni ID bo'yicha olish
export const selectMessageById = (id) => (state) =>
  state.chat.messages.find((m) => m.id === id) ?? null;

// O'chirilmagan xabarlar soni
export const selectActiveMessagesCount = (state) =>
  state.chat.messages.filter((m) => !m.is_deleted_for_all).length;

export default chatSlice.reducer;