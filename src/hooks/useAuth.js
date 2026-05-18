import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import {
  setSession,
  setUser,
  setMembership,
  setLoading,
  setInitialized,
  setError,
  clearAuth,
  selectUser,
  selectIsAuthenticated,
  selectIsInitialized,
  selectIsLoading,
  selectAuthError,
} from '../redux/authSlice';

// Guruh ID sini environment dan olamiz (bitta guruh bo'lgani uchun)
const GROUP_ID = import.meta.env.VITE_GROUP_ID;

// ==========================================
// useAuth HOOK
// ==========================================
export const useAuth = () => {
  const dispatch = useDispatch();

  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectAuthError);

  // ----------------------------------------
  // Supabase dan foydalanuvchi profilini olish
  // ----------------------------------------
  const fetchUserProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }, []);

  // ----------------------------------------
  // Guruh a'zoligini va ruxsatlarini olish
  // ----------------------------------------
  const fetchMembership = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('user_id', userId)
      .eq('group_id', GROUP_ID)
      .single();

    if (error) throw error;
    return data;
  }, []);

  // ----------------------------------------
  // Session bo'yicha Redux ni to'ldirish
  // ----------------------------------------
  const loadUserData = useCallback(async (session) => {
    try {
      dispatch(setLoading(true));
      dispatch(setSession(session));

      const [profile, membership] = await Promise.all([
        fetchUserProfile(session.user.id),
        fetchMembership(session.user.id),
      ]);

      dispatch(setUser(profile));
      dispatch(setMembership(membership));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, fetchUserProfile, fetchMembership]);

  // ----------------------------------------
  // APP ISHGA TUSHGANDA: session tekshirish
  // ----------------------------------------
  useEffect(() => {
    // Mavjud sessionni tekshirish
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserData(session).finally(() => dispatch(setInitialized()));
      } else {
        dispatch(setInitialized());
      }
    });

    // Auth holati o'zgarganda (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await loadUserData(session);
        }
        if (event === 'SIGNED_OUT') {
          dispatch(clearAuth());
        }
        if (event === 'TOKEN_REFRESHED' && session) {
          dispatch(setSession(session));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [dispatch, loadUserData]);

  // ----------------------------------------
  // LOGIN
  // ----------------------------------------
  const login = useCallback(async (email, password) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // is_blocked tekshiruvi
      const profile = await fetchUserProfile(data.user.id);
      if (profile.is_blocked) {
        await supabase.auth.signOut();
        throw new Error("Sizning akkauntingiz bloklangan. Administrator bilan bog'laning.");
      }

      return { success: true };
    } catch (err) {
      dispatch(setError(err.message));
      return { success: false, error: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, fetchUserProfile]);

  // ----------------------------------------
  // LOGOUT
  // ----------------------------------------
  const logout = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      await supabase.auth.signOut();
      dispatch(clearAuth());
    } catch (err) {
      dispatch(setError(err.message));
    }
  }, [dispatch]);

  // ----------------------------------------
  // PROFILNI YANGILASH (EditMyProfile uchun)
  // ----------------------------------------
  const updateProfile = useCallback(async (updates) => {
    if (!user) return { success: false };

    try {
      dispatch(setLoading(true));

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Redux ni ham yangilash
      dispatch(setUser({ ...user, ...updates }));
      return { success: true };
    } catch (err) {
      dispatch(setError(err.message));
      return { success: false, error: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, user]);

  // ----------------------------------------
  // AVATAR YUKLASH
  // ----------------------------------------
  const uploadAvatar = useCallback(async (file) => {
    if (!user) return { success: false };

    try {
      dispatch(setLoading(true));

      const fileExt = file.name.split('.').pop();
      const filePath = `media/${user.id}.${fileExt}`;

      // Storage ga yuklash
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Public URL olish
      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      const avatarUrl = data.publicUrl;

      // Profilni yangilash
      await updateProfile({ avatar_url: avatarUrl });

      return { success: true, url: avatarUrl };
    } catch (err) {
      dispatch(setError(err.message));
      return { success: false, error: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, user, updateProfile]);

  return {
    // State
    user,
    isAuthenticated,
    isInitialized,
    isLoading,
    error,

    // Actions
    login,
    logout,
    updateProfile,
    uploadAvatar,
  };
};