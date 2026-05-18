import { createSlice } from '@reduxjs/toolkit';

// ==========================================
// INITIAL STATE
// ==========================================
const initialState = {
  // Supabase auth session
  session: null,

  // profiles jadvalidagi ma'lumotlar
  user: null,
  /*
    user = {
      id, email, first_name, last_name,
      avatar_url, dob, gender, bio, theme,
      social_links, is_blocked
    }
  */

  // group_members jadvalidagi rol va ruxsatlar
  membership: null,
  /*
    membership = {
      role: 'owner' | 'admin' | 'user',

      // Oddiy ruxsatlar
      can_send_messages: true,
      can_send_media: true,
      can_send_voice_video_notes: true,
      can_react: true,
      can_see_viewers: true,

      // Admin ruxsatlar
      can_delete_others_messages: false,
      can_edit_group_info: false,
      can_manage_group_settings: false,
      can_block_users: false,
    }
  */

  // Yuklash holatlari
  isLoading: false,
  isInitialized: false, // App birinchi ochilganda session tekshirilganmi
  error: null,
};

// ==========================================
// SLICE
// ==========================================
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {

    // App ishga tushganda onAuthStateChange dan keladi
    setSession(state, action) {
      state.session = action.payload;
    },

    // profiles jadvalidan olingan to'liq user ma'lumotlari
    setUser(state, action) {
      state.user = action.payload;
    },

    // group_members jadvalidan olingan rol + ruxsatlar
    setMembership(state, action) {
      state.membership = action.payload;
    },

    // Profilni yangilash (EditMyProfile dan keyin)
    updateUserProfile(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // Mavzuni (theme) almashtirish
    setTheme(state, action) {
      if (state.user) {
        state.user.theme = action.payload;
      }
    },

    // Yuklanish boshlanishi
    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    // App birinchi marta session tekshirib bo'lgandan keyin
    setInitialized(state) {
      state.isInitialized = true;
    },

    // Xatolik saqlash
    setError(state, action) {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Tizimdan chiqish — barcha holatni tozalash
    clearAuth(state) {
      state.session = null;
      state.user = null;
      state.membership = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

// ==========================================
// ACTIONS
// ==========================================
export const {
  setSession,
  setUser,
  setMembership,
  updateUserProfile,
  setTheme,
  setLoading,
  setInitialized,
  setError,
  clearAuth,
} = authSlice.actions;

// ==========================================
// SELECTORS
// ==========================================

// Asosiy
export const selectSession = (state) => state.auth.session;
export const selectUser = (state) => state.auth.user;
export const selectMembership = (state) => state.auth.membership;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectIsInitialized = (state) => state.auth.isInitialized;
export const selectAuthError = (state) => state.auth.error;

// Qulay selector: foydalanuvchi tizimga kirganmi?
export const selectIsAuthenticated = (state) => !!state.auth.session && !!state.auth.user;

// Rol selector
export const selectUserRole = (state) => state.auth.membership?.role ?? null;
export const selectIsOwner = (state) => state.auth.membership?.role === 'owner';
export const selectIsAdmin = (state) =>
  state.auth.membership?.role === 'admin' || state.auth.membership?.role === 'owner';

// Ruxsat selectorlari (global + individual birga tekshiriladi — hook ichida ishlatiladi)
export const selectCanSendMessages = (state) => state.auth.membership?.can_send_messages ?? false;
export const selectCanSendMedia = (state) => state.auth.membership?.can_send_media ?? false;
export const selectCanSendVoiceVideoNotes = (state) => state.auth.membership?.can_send_voice_video_notes ?? false;
export const selectCanReact = (state) => state.auth.membership?.can_react ?? false;
export const selectCanSeeViewers = (state) => state.auth.membership?.can_see_viewers ?? false;
export const selectCanDeleteOthers = (state) => state.auth.membership?.can_delete_others_messages ?? false;
export const selectCanEditGroupInfo = (state) => state.auth.membership?.can_edit_group_info ?? false;
export const selectCanManageSettings = (state) => state.auth.membership?.can_manage_group_settings ?? false;
export const selectCanBlockUsers = (state) => state.auth.membership?.can_block_users ?? false;

export default authSlice.reducer;