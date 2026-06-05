import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import store from './redux/store';
import App   from './App';
import './index.css';

// 🟢 MAVZUNI OLDINDAN ANIQLASH (Toaster uchun)
const savedTheme = localStorage.getItem('app_theme') || 'dark';
const isDark = savedTheme === 'dark';

// 🟢 QORA EKRAN O'RNIGA XATONI KO'RSATUVCHI QOPQON
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#121212', color: '#ff3b30', padding: '20px', height: '100vh', width: '100%', overflow: 'auto', zIndex: 99999, fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Kutilmagan xatolik!</h2>
          <p style={{ color: '#fff', fontSize: '14px' }}>Iltimos ushbu yozuvni skrinshot qilib dasturchiga yuboring:</p>
          <pre style={{ fontSize: '12px', marginTop: '15px', background: '#000', padding: '15px', borderRadius: '12px', whiteSpace: 'pre-wrap', color: '#d1d1d1' }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <App />
        
        {/* Bildirishnomalar (Theme ga moslashuvchan) */}
        <Toaster
          position="top-center"
          gutter={8}
          containerStyle={{ top: 20 }}
          toastOptions={{
            duration: 2500,
            className: 'apple-toast',
            style: {
              background: isDark ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              color: isDark ? '#ffffff' : '#000000',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              padding: '12px 20px',
              boxShadow: isDark 
                ? '0 12px 38px rgba(0, 0, 0, 0.5)' 
                : '0 10px 25px rgba(0, 0, 0, 0.1)',
            },
            success: { iconTheme: { primary: '#34c759', secondary: 'transparent' } },
            error: { iconTheme: { primary: '#ff3b30', secondary: 'transparent' }, duration: 3500 },
          }}
        />
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
);
