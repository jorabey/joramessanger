import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import {
  setSession, setUser, setMembership, setLoading,
  setInitialized, setError, clearAuth,
  selectUser, selectIsAuthenticated, selectIsInitialized,
  selectIsLoading, selectAuthError,
} from '../redux/authSlice';

const GROUP_ID = import.meta.env.VITE_GROUP_ID;

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectAuthError);

  const fetchUserProfile = useCallback(async (userId) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  }, []);

  const fetchMembership = useCallback(async (userId) => {
    const { data, error } = await supabase.from('group_members').select('*').eq('user_id', userId).eq('group_id', GROUP_ID).single();
    if (error) throw error;
    return data;
  }, []);

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

  // 🔴 XATO DAVOLANDI: try/catch va finally orqali himoyalangan tekshiruv
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          await loadUserData(session);
        }
      } catch (err) {
        console.error("Auth init xatosi:", err);
      } finally {
        dispatch(setInitialized()); // Nima bo'lishidan qat'iy nazar ochib beradi
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) await loadUserData(session);
        if (event === 'SIGNED_OUT') dispatch(clearAuth());
        if (event === 'TOKEN_REFRESHED' && session) dispatch(setSession(session));
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
        throw new Error("Sizning akkauntingiz bloklangan.");
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
      const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file, { upsert: true });
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

  return { user, isAuthenticated, isInitialized, isLoading, error, login, logout, updateProfile, uploadAvatar };
};
