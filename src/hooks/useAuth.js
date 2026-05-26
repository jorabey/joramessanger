import { useEffect, useCallback, useRef } from 'react';
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
  
  const isMounted = useRef(true);

  // Parallel so'rovlar orqali 2x tezlik
  const fetchUserData = useCallback(async (userId) => {
    const [profileRes, memberRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('group_members').select('*').eq('user_id', userId).eq('group_id', GROUP_ID).single()
    ]);

    if (profileRes.error) throw profileRes.error;
    return { profile: profileRes.data, membership: memberRes.data || null };
  }, []);

  const loadUserData = useCallback(async (session) => {
    try {
      dispatch(setLoading(true));
      dispatch(setSession(session));

      const { profile, membership } = await fetchUserData(session.user.id);

      dispatch(setUser(profile));
      dispatch(setMembership(membership));
    } catch (err) {
      console.error("Auth load error:", err);
      dispatch(setError("Tizimga kirishda xatolik yuz berdi."));
    } finally {
      dispatch(setInitialized());
      dispatch(setLoading(false));
    }
  }, [dispatch, fetchUserData]);

  useEffect(() => {
    isMounted.current = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted.current) {
          await loadUserData(session);
        } else if (isMounted.current) {
          dispatch(setInitialized());
        }
      } catch (err) {
        if (isMounted.current) dispatch(setInitialized());
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) loadUserData(session);
        if (event === 'SIGNED_OUT') dispatch(clearAuth());
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [dispatch, loadUserData]);

  const login = useCallback(async (email, password) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await loadUserData(data.session);
      return { success: true };
    } catch (err) {
      dispatch(setError(err.message));
      return { success: false, error: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, loadUserData]);

  const logout = useCallback(async () => {
    dispatch(setLoading(true));
    try {
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
    dispatch(setLoading(true));
    try {
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
    dispatch(setLoading(true));
    try {
      const filePath = `media/${user.id}_${Date.now()}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      return await updateProfile({ avatar_url: data.publicUrl });
    } catch (err) {
      dispatch(setError(err.message));
      return { success: false, error: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, user, updateProfile]);

  return { user, isAuthenticated, isInitialized, isLoading, error, login, logout, updateProfile, uploadAvatar };
};
