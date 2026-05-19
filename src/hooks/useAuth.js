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

// 1. Vaqtni biroz uzaytiramiz
const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Tarmoq kutilmoqda...")), ms))
  ]);
};

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
    let retryCount = 0;
    const maxRetries = 4; // 🔴 4 marta qayta urinish tizimi qo'shildi

    const tryLoad = async () => {
      try {
        dispatch(setLoading(true));
        dispatch(setSession(session));

        const [profile, membership] = await withTimeout(
          Promise.all([
            fetchUserProfile(session.user.id),
            fetchMembership(session.user.id),
          ]),
          8000 // 8 soniya kutadi
        );

        dispatch(setUser(profile));
        dispatch(setMembership(membership));
        dispatch(setInitialized()); // 🟢 FAQAT MUVAFFAQIYATLI BO'LSA OCHADI, AKS HOLDA LOGINGA OTMAYDI!
      } catch (err) {
        console.error("Ma'lumot yuklashda xato, qayta urinilmoqda...", err);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(tryLoad, 1500); // 1.5 soniyadan keyin yana bildirmasdan urinib ko'radi
        } else {
          dispatch(setError("Internet aloqasi juda yomon."));
          dispatch(setInitialized()); 
        }
      } finally {
        dispatch(setLoading(false));
      }
    };

    await tryLoad();
  }, [dispatch, fetchUserProfile, fetchMembership]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Sessiyani to'g'ridan-to'g'ri o'qiymiz (bunga timeout kerak emas)
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session && isMounted) {
          await loadUserData(session);
        } else if (isMounted) {
          dispatch(setInitialized()); // Haqiqatan ham akkauntdan chiqqan bo'lsagina login'ga otadi
        }
      } catch (err) {
        console.error("Auth init xatosi:", err);
        if (isMounted) dispatch(setInitialized());
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

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
