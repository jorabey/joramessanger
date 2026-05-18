import { createSlice } from '@reduxjs/toolkit';

// ==========================================
// INITIAL STATE
// ==========================================
const initialState = {
  // Faol qo'ng'iroq ma'lumotlari (active_calls jadvalidan)
  activeCall: null,
  /*
    activeCall = {
      id, group_id, started_by, is_active,
      started_at,
      // JOIN:
      starter: { first_name, last_name, avatar_url }
    }
  */

  // Qo'ng'iroqdagi barcha ishtirokchilar (call_participants jadvalidan)
  participants: [],
  /*
    participant = {
      call_id, user_id,
      is_muted, is_video_on,
      joined_at, left_at,
      // JOIN:
      profiles: { first_name, last_name, avatar_url }
    }
  */

  // Joriy foydalanuvchining o'z holati (UI uchun tez kirish)
  myStatus: {
    is_muted: true,
    is_video_on: false,
  },

  // Kimning ovozi eng baland (Speaking detection uchun)
  activeSpeakerId: null,

  // Qo'ng'iroq oynasi ko'rsatilsinmi?
  isCallRoomOpen: false,

  // "Guruhda qo'ng'iroq bo'lyapti" bildirishnomasi (CallBar uchun)
  isCallBarVisible: false,

  isLoading: false,
  error: null,
};

// ==========================================
// SLICE
// ==========================================
const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {

    // Faol qo'ng'iroq boshlandi (Realtime INSERT yoki birinchi yuklash)
    setActiveCall(state, action) {
      state.activeCall = action.payload;
      state.isCallBarVisible = !!action.payload;
    },

    // Qo'ng'iroq tugadi
    endCall(state) {
      state.activeCall = null;
      state.participants = [];
      state.myStatus = { is_muted: true, is_video_on: false };
      state.activeSpeakerId = null;
      state.isCallRoomOpen = false;
      state.isCallBarVisible = false;
    },

    // ---- ISHTIROKCHILAR ----

    // Birinchi yuklash
    setParticipants(state, action) {
      state.participants = action.payload;
    },

    // Realtime: yangi ishtirokchi kirdi
    addParticipant(state, action) {
      const exists = state.participants.some((p) => p.user_id === action.payload.user_id);
      if (!exists) {
        state.participants.push(action.payload);
      }
    },

    // Realtime: ishtirokchi chiqdi (left_at to'ldirildi)
    removeParticipant(state, action) {
      state.participants = state.participants.filter(
        (p) => p.user_id !== action.payload.user_id
      );
    },

    // Realtime: mikrofon / kamera holati o'zgardi
    updateParticipantStatus(state, action) {
      const { user_id, is_muted, is_video_on } = action.payload;
      const index = state.participants.findIndex((p) => p.user_id === user_id);
      if (index !== -1) {
        state.participants[index] = {
          ...state.participants[index],
          is_muted,
          is_video_on,
        };
      }
    },

    // ---- O'Z HOLATI ----

    // Mikrofonni yoq/o'chir
    toggleMyMute(state) {
      state.myStatus.is_muted = !state.myStatus.is_muted;
    },

    // Kamerani yoq/o'chir
    toggleMyVideo(state) {
      state.myStatus.is_video_on = !state.myStatus.is_video_on;
    },

    setMyStatus(state, action) {
      state.myStatus = { ...state.myStatus, ...action.payload };
    },

    // ---- SPEAKING ----

    setActiveSpeaker(state, action) {
      state.activeSpeakerId = action.payload; // user_id yoki null
    },

    // ---- UI ----

    openCallRoom(state) {
      state.isCallRoomOpen = true;
    },

    closeCallRoom(state) {
      state.isCallRoomOpen = false;
      // CallBar qoladi — foydalanuvchi hali qo'ng'iroqda
    },

    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    setError(state, action) {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

// ==========================================
// ACTIONS
// ==========================================
export const {
  setActiveCall,
  endCall,
  setParticipants,
  addParticipant,
  removeParticipant,
  updateParticipantStatus,
  toggleMyMute,
  toggleMyVideo,
  setMyStatus,
  setActiveSpeaker,
  openCallRoom,
  closeCallRoom,
  setLoading,
  setError,
} = callSlice.actions;

// ==========================================
// SELECTORS
// ==========================================
export const selectActiveCall = (state) => state.call.activeCall;
export const selectParticipants = (state) => state.call.participants;
export const selectMyStatus = (state) => state.call.myStatus;
export const selectActiveSpeakerId = (state) => state.call.activeSpeakerId;
export const selectIsCallRoomOpen = (state) => state.call.isCallRoomOpen;
export const selectIsCallBarVisible = (state) => state.call.isCallBarVisible;
export const selectCallIsLoading = (state) => state.call.isLoading;
export const selectCallError = (state) => state.call.error;

// Qo'ng'iroqda ishtirokchilar soni
export const selectParticipantsCount = (state) => state.call.participants.length;

// Bitta ishtirokchini user_id bo'yicha olish
export const selectParticipantById = (userId) => (state) =>
  state.call.participants.find((p) => p.user_id === userId) ?? null;

// Qo'ng'iroq faolmi?
export const selectIsCallActive = (state) => !!state.call.activeCall?.is_active;

export default callSlice.reducer;