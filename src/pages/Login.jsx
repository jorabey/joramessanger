import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { selectIsAuthenticated, selectIsInitialized } from '../redux/authSlice';
import LoginForm from '../components/auth/LoginForm';
import { Spinner } from '../components/ui/Loader';

const Login = () => {
  const navigate = useNavigate();
  const isAuth = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);

  useEffect(() => {
    if (isInitialized && isAuth) {
      navigate('/chat', { replace: true });
    }
  }, [isAuth, isInitialized, navigate]);

  return (
    <AnimatePresence mode="wait">
      {!isInitialized ? (
        <motion.div
          key="auth-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 bg-[#000000] flex flex-col items-center justify-center z-50"
          style={{ height: '100dvh' }}
        >
          <motion.div
            animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 bg-blue-500/20 rounded-3xl blur-xl absolute"
          />
          <Spinner size="lg" className="text-blue-500 relative z-10" />
        </motion.div>
      ) : !isAuth ? (
        <motion.div
          key="auth-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 w-full bg-[#000000] overflow-hidden overscroll-none touch-none"
          style={{ height: '100dvh' }}
        >
          <LoginForm />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default Login;