import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import chatReducer from './chatSlice';
import callReducer from './callSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    call: callReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Supabase session objectida non-serializable qiymatlar bo'lishi mumkin
        ignoredActions: ['auth/setSession'],
        ignoredPaths: ['auth.session'],
      },
    }),
});

export default store;