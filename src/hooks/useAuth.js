import { useEffect, useCallback, useRef } from 'react';
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

const GROUP_ID = import.meta.env.VITE_GROUP_ID;

export const useAuth = () => {
  const dispatch = useDispatch();

  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectAuthError);

  // Race condition oldini olish uchun ref lar
  const isLoadingRef = useRef(false);
  const isInitializedRef = useRef(false);

  const fetchUserProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  }, []);

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

  const loadUserData = useCallback(async (session) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

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
      console.error('loadUserData xatoligi:', err);
      dispatch(setError(err.message));
      await supabase.auth.signOut().catch(() => {});
      dispatch(clearAuth());
    } finally {
      dispatch(setLoading(false));
      isLoadingRef.current = false;
    }
  }, [dispatch, fetchUserProfile, fetchMembership]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        // ASOSIY TUZATISH: INITIAL_SESSION mobilda getSession() o'rnini bosadi
        if (event === 'INITIAL_SESSION') {
          if (session) {
            await loadUserData(session);
          }
          if (!isInitializedRef.current) {
            isInitializedRef.current = true;
            dispatch(setInitialized());
          }
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          await loadUserData(session);
          return;
        }

        if (event === 'SIGNED_OUT') {
          dispatch(clearAuth());
          return;
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          dispatch(setSession(session));
          return;
        }

        if (event === 'USER_UPDATED' && session) {
          dispatch(setSession(session));
          return;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [dispatch, loadUserData]);

  const login = useCallback(async (email, password) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

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

  const logout = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      await supabase.auth.signOut();
      dispatch(clearAuth());
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const updateProfile = useCallback(async (updates) => {
    if (!user) return { success: false };
    try {
      dispatch(setLoading(true));
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
      dispatch(setUser({ ...user, ...updates }));
      return { success: true };
    } catch (err) {
      dispatch(setError(err.message));
      return { success: false, error: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, user]);

  const uploadAvatar = useCallback(async (file) => {
    if (!user) return { success: false };
    try {
      dispatch(setLoading(true));
      const fileExt = file.name.split('.').pop();
      const filePath = `media/${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('media').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      await updateProfile({ avatar_url: data.publicUrl });
      return { success: true, url: data.publicUrl };
    } catch (err) {
      dispatch(setError(err.message));
      return { success: false, error: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, user, updateProfile]);

  return {
    user, isAuthenticated, isInitialized, isLoading, error,
    login, logout, updateProfile, uploadAvatar,
  };
};
