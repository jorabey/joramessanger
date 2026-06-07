import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { supabase } from './config/supabaseClient'; 
import { selectIsAuthenticated, selectIsInitialized, selectUser, clearAuth } from './redux/authSlice'; 
import { useAuth } from './hooks/useAuth';

const Login = lazy(() => import('./pages/Login'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
import Loader   from './components/ui/Loader';
import PasscodeScreen from './components/ui/PasscodeScreen';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const VAPID_PUBLIC_KEY = "BKB--9KZ5l18Vf-a7f-eEeJ_AkvfTbDNlM2Sd97yw9Waqvudj0mVXcmuLCH847KCT5K2g4-taIOboye1hC7g7tA"; 

const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); 
      setDeferredPrompt(e); 
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt(); 
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <AnimatePresence>
      {deferredPrompt && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleInstallClick}
          className="fixed bottom-24 right-4 z-[999999] bg-[#0a84ff] text-white px-5 py-3 rounded-full font-bold shadow-[0_8px_30px_rgba(10,132,255,0.4)] flex items-center gap-2 border border-white/10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          O'rnatish
        </motion.button>
      )}
    </AnimatePresence>
  );
};

const AnimatedPage = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className="w-full h-full absolute inset-0 overflow-hidden"
  >
    {children}
  </motion.div>
);

const AppLockWrapper = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); 
  const isInit = useSelector(selectIsInitialized);
  const currentUser = useSelector(selectUser);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const preventZoom = (e) => { if (e.touches.length > 1) e.preventDefault(); };
    let lastTouchEnd = 0;
    const preventDoubleTap = (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    };
    const preventLongPressMenu = (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO' || e.target.tagName === 'A') e.preventDefault();
    };
    const preventDrag = (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') e.preventDefault();
    };

    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchend', preventDoubleTap, { passive: false });
    document.addEventListener('contextmenu', preventLongPressMenu, { passive: false });
    document.addEventListener('dragstart', preventDrag);

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchend', preventDoubleTap);
      document.removeEventListener('contextmenu', preventLongPressMenu);
      document.removeEventListener('dragstart', preventDrag);
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    const securityChannel = supabase
      .channel(`global_security_guard_${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentUser.id}` },
        async (payload) => {
          if (payload.new && payload.new.is_blocked === true) {
            try {
              setIsUnlocked(false);
              await supabase.auth.signOut(); 
              dispatch(clearAuth());      
              navigate('/login', { replace: true }); 
              toast.error("Sizning akkauntingiz administrator tomonidan bloklandi!");
            } catch (err) {
              window.location.href = '/login'; 
            }
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(securityChannel); };
  }, [currentUser?.id, dispatch, navigate]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const registerPushNotifications = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (Notification.permission === 'granted') {
            let subscription = await registration.pushManager.getSubscription();
            if (!subscription && VAPID_PUBLIC_KEY) {
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
              });
            }
            if (subscription) {
              await supabase
                .from('user_push_subscriptions')
                .upsert({
                  user_id: currentUser.id,
                  subscription: subscription.toJSON()
                }, { onConflict: 'user_id' });
            }
          }
        } catch (err) {
          console.error("Push xatosi:", err);
        }
      }
    };
    registerPushNotifications();
  }, [currentUser?.id]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') || 'dark';
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    if (!currentUser) setIsUnlocked(false);
  }, [currentUser]);

  if (!isInit) return <Loader fullScreen={true} />;

  const hasPasscode = Boolean(currentUser?.app_passcode);
  const shouldShowLock = currentUser && hasPasscode && !isUnlocked;

  return (
    <div className="w-full h-full relative bg-white dark:bg-black select-none transition-colors duration-300">
      <div className={`w-full h-full flex flex-col ${shouldShowLock ? 'pointer-events-none blur-sm opacity-40 scale-[0.98]' : 'opacity-100 scale-100'} transition-all duration-300 ease-out`}>
        {children}
        <PwaInstallPrompt />
      </div>

      <AnimatePresence>
        {shouldShowLock && (
          <motion.div
            key="global-app-lock"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100, scale: 1.05 }} 
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999999] bg-white dark:bg-black transition-colors duration-300"
          >
            <PasscodeScreen
              mode="verify"
              savedPasscode={currentUser.app_passcode}
              onSuccess={() => setIsUnlocked(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const isAuth = useSelector(selectIsAuthenticated);
  const isInit = useSelector(selectIsInitialized);
  if (!isInit) return null;
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const isAuth = useSelector(selectIsAuthenticated);
  const isInit = useSelector(selectIsInitialized);
  if (!isInit) return null;
  if (isAuth) return <Navigate to="/chat" replace />;
  return children;
};

const AppRoutes = () => {
  useAuth(); 

  // --- AUTOMATIC GLOBAL URL HISTORY TRACKER ---
  useEffect(() => {
    let historyCount = 0;

    const handleGlobalInteraction = (e) => {
      const interactiveElement = e.target.closest('button, a, svg, [role="button"], input, textarea, select, .modal-trigger');
      
      if (interactiveElement) {
        historyCount++;
        const randomId = Math.random().toString(36).substring(2, 12);
        const url = new URL(window.location.href);
        url.searchParams.set('on', randomId);
        
        if (historyCount > 10) {
          window.history.replaceState({ actionId: randomId }, '', url.toString());
          historyCount = 10; 
        } else {
          window.history.pushState({ actionId: randomId }, '', url.toString());
        }
      }
    };

    const handlePopState = () => {
      if (historyCount > 0) {
        historyCount--;
      }
    };

    document.addEventListener('click', handleGlobalInteraction, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleGlobalInteraction, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  // --------------------------------------------

  useEffect(() => {
    const goOnline = () => { toast.success("Tarmoqqa qayta ulandi", { id: 'net-status' }); };
    const goOffline = () => { toast.error("Internet aloqasi uzildi...", { id: 'net-status', duration: Infinity }); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <AppLockWrapper>
      <div className="w-full h-[100dvh] bg-white dark:bg-black overflow-hidden relative transition-colors duration-300">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/login" element={<PublicRoute><AnimatedPage><Login /></AnimatedPage></PublicRoute>} />
          <Route path="/chat" element={<ProtectedRoute><AnimatedPage><ChatPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
        </Routes>
      </div>
    </AppLockWrapper>
  );
};

const App = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(function (registration) {
          if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') console.log('Bildirishnomalarga ruxsat berildi!');
            });
          }
        }).catch(err => console.error('SW xatosi:', err));
    }
  }, []);

  return (
    <Suspense fallback={<Loader />}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Suspense>
  );
};

export default App;
