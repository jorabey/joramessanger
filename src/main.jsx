import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import store from './redux/store';
import App   from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />

      {/* 🍏 iMessage / Dynamic Island uslubidagi global bildirishnomalar */}
      <Toaster
        position="top-center"
        gutter={8}
        containerStyle={{
          top: 20, // Mobil qurilmalarda "safe-area" burchaklaridan qochish uchun
        }}
        toastOptions={{
          duration: 2500, // Native ilovalardagi tezkorlik uchun biroz qisqartirildi
          className: 'apple-toast', // Maxuus klass nomi
          style: {
            background: 'rgba(28, 28, 30, 0.85)', // 🍏 iOS Material To'q shaffof fon
            backdropFilter: 'blur(20px)', // iMessage blur effekti
            WebkitBackdropFilter: 'blur(20px)', // iOS Safari uchun xavfsizlik
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.06)', // O'ta ingichka Apple xrom hoshiyasi
            borderRadius: '20px', // Dumaloqlangan nafis burchaklar
            fontSize: '14px',
            fontWeight: '600', // Biroq qalinroq va oson o'qiladigan matn
            letterSpacing: '-0.24px', // iOS uchun moslashtirilgan harflar qisqarishi
            padding: '12px 20px',
            boxShadow: '0 12px 38px rgba(0, 0, 0, 0.5)', // Premium soya
            maxWidth: '350px',
          },
          success: {
            iconTheme: { 
              primary: '#34c759', // 🍏 Apple Premium Yashil rangi
              secondary: 'transparent' 
            },
          },
          error: {
            iconTheme: { 
              primary: '#ff3b30', // 🍏 Apple Premium Qizil rangi
              secondary: 'transparent' 
            },
            duration: 3500,
          },
        }}
      />
    </Provider>
  </React.StrictMode>
);