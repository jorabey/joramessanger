import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import store from './redux/store';
import App   from './App';
import './index.css';

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
        <div style={{ background: '#000', color: '#ff3b30', padding: '20px', height: '100vh', width: '100%', overflow: 'auto', zIndex: 99999 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Kutilmagan xatolik!</h2>
          <p style={{ color: '#fff', fontSize: '14px' }}>Iltimos ushbu yozuvni skrinshot qilib dasturchiga yuboring:</p>
          <pre style={{ fontSize: '12px', marginTop: '15px', background: '#1c1c1e', padding: '10px', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
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
        
        {/* Bildirishnomalar */}
        <Toaster
          position="top-center"
          gutter={8}
          containerStyle={{ top: 20 }}
          toastOptions={{
            duration: 2500,
            className: 'apple-toast',
            style: {
              background: 'rgba(28, 28, 30, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              padding: '12px 20px',
              boxShadow: '0 12px 38px rgba(0, 0, 0, 0.5)',
            },
            success: { iconTheme: { primary: '#34c759', secondary: 'transparent' } },
            error: { iconTheme: { primary: '#ff3b30', secondary: 'transparent' }, duration: 3500 },
          }}
        />
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
);
