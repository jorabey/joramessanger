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

// 🟢 PROMISE QOTIB QOLISHIGA QARSHI FUNKSIYA
const withTimeout = (promise, ms, name) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${name} vaqt tugadi!`)), ms))
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
    try {
      dispatch(setLoading(true));
      dispatch(setSession(session));

      // 🟢 5 SONIYALIK TIMEOUT BILAN MA'LUMOT TORTISH
      const [profile, membership] = await withTimeout(
        Promise.all([
          fetchUserProfile(session.user.id),
          fetchMembership(session.user.id),
        ]),
        5000,
        "loadUserData"
      );

      dispatch(setUser(profile));
      dispatch(setMembership(membership));
    } catch (err) {
      console.error("LoadUser xatosi:", err);
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, fetchUserProfile, fetchMembership]);

  useEffect(() => {
    let isMounted = true;

    // 🟢 FAVQULODDA QUTQARUV TAYMERI (Agar tarmoq mutlaqo qotsa ishlaydi)
    const emergencyTimer = setTimeout(() => {
      if (isMounted) {
        dispatch(setInitialized());
        dispatch(setLoading(false));
      }
    }, 6000);

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await withTimeout(supabase.auth.getSession(), 4000, "getSession");
        if (error) throw error;
        
        if (session && isMounted) {
          await loadUserData(session);
        }
      } catch (err) {
        console.error("Auth init xatosi:", err);
      } finally {
        if (isMounted) {
          dispatch(setInitialized());
          clearTimeout(emergencyTimer); // Ish muvaffaqiyatli bitsa taymerni o'chiramiz
        }
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
      clearTimeout(emergencyTimer);
      subscription.unsubscribe();
    };
  }, [dispatch, loadUserData]);

  const login = useCallback(async (email, password) => { /* O'zgarishsiz qoladi */ }, []);
  const logout = useCallback(async () => { /* O'zgarishsiz qoladi */ }, []);
  const updateProfile = useCallback(async (updates) => { /* O'zgarishsiz qoladi */ }, []);
  const uploadAvatar = useCallback(async (file) => { /* O'zgarishsiz qoladi */ }, []);

  return { user, isAuthenticated, isInitialized, isLoading, error, login, logout, updateProfile, uploadAvatar };
};
