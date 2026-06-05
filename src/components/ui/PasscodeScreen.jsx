import React, { useState, useEffect, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Delete, X, Lock } from 'lucide-react';

const shakeVariants = {
  shake: { x: [-10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.4 } },
  normal: { x: 0 }
};

const PasscodeScreen = ({ 
  mode = 'verify',
  onSuccess,
  onClose,
  savedPasscode = null,
  passcodeLength = 4
}) => {
  const [passcode, setPasscode] = useState('');
  const [setupStep, setSetupStep] = useState(1);
  const [firstPasscode, setFirstPasscode] = useState('');
  const [errorText, setErrorText] = useState('');
  
  const controls = useAnimation();

  const [failedAttempts, setFailedAttempts] = useState(() => 
    parseInt(localStorage.getItem('app_failed_attempts') || '0')
  );
  const [lockoutUntil, setLockoutUntil] = useState(() => 
    parseInt(localStorage.getItem('app_lockout_time') || '0')
  );
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (lockoutUntil > 0) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setTimeLeft(0);
          setLockoutUntil(0);
          setFailedAttempts(0);
          localStorage.removeItem('app_lockout_time');
          localStorage.removeItem('app_failed_attempts');
          setErrorText('');
          clearInterval(interval);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);

  const handleKeyPress = useCallback((val) => {
    if (timeLeft > 0) return;
    if (passcode.length < passcodeLength) {
      setPasscode(prev => prev + val);
      setErrorText('');
    }
  }, [passcode, passcodeLength, timeLeft]);

  const handleDelete = useCallback(() => {
    if (timeLeft > 0) return;
    setPasscode(prev => prev.slice(0, -1));
    setErrorText('');
  }, [timeLeft]);

  const handleWrongPasscode = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    localStorage.setItem('app_failed_attempts', newAttempts.toString());
    
    if (newAttempts >= 5) {
      const lockTime = Date.now() + 30000;
      setLockoutUntil(lockTime);
      localStorage.setItem('app_lockout_time', lockTime.toString());
      setPasscode('');
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } else {
      setErrorText(`Parol xato. Qolgan urinishlar: ${5 - newAttempts}`);
      controls.start('shake');
      setTimeout(() => setPasscode(''), 400);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  };

  useEffect(() => {
    if (passcode.length === passcodeLength && timeLeft === 0) {
      const verifyInput = async () => {
        if (mode === 'verify' || mode === 'remove') {
          if (passcode === savedPasscode) {
            localStorage.removeItem('app_failed_attempts');
            localStorage.removeItem('app_lockout_time');
            onSuccess(passcode);
          } else {
            handleWrongPasscode();
          }
        } 
        else if (mode === 'setup') {
          if (setupStep === 1) {
            setFirstPasscode(passcode);
            setPasscode('');
            setSetupStep(2);
          } else {
            if (passcode === firstPasscode) {
              onSuccess(passcode);
            } else {
              setErrorText('Parollar mos tushmadi');
              controls.start('shake');
              setTimeout(() => { setPasscode(''); setFirstPasscode(''); setSetupStep(1); }, 400);
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
          }
        }
      };
      setTimeout(verifyInput, 100);
    }
  }, [passcode, passcodeLength, mode, savedPasscode, setupStep, firstPasscode, onSuccess, controls, timeLeft]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') handleKeyPress(e.key);
      if (e.key === 'Backspace') handleDelete();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, handleDelete]);

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-[#000000] text-neutral-900 dark:text-white transition-colors duration-300">
      {onClose && mode !== 'verify' && (
        <button onClick={onClose} className="absolute top-12 right-6 p-2 bg-neutral-200 dark:bg-white/10 rounded-full active:scale-90 transition-transform">
          <X size={24} />
        </button>
      )}

      <div className="flex flex-col items-center flex-1 w-full max-w-[320px] pt-[15vh]">
        
        {timeLeft > 0 ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 text-red-500">
              <Lock size={32} />
            </div>
            <h2 className="text-[20px] font-bold mb-2">Ilova qulflangan</h2>
            <p className="text-[15px] text-neutral-500 dark:text-slate-400 text-center">
              Ko'p marta xato urindingiz.<br/>
              <span className="text-red-500 font-bold text-[18px] block mt-2">{timeLeft} soniya</span> kuting.
            </p>
          </motion.div>
        ) : (
          <>
            <h2 className="text-[22px] font-bold mb-2 text-center">
              {mode === 'verify' ? 'Parolni kiriting' : 
               mode === 'remove' ? 'Joriy parolni kiriting' :
               setupStep === 1 ? 'Yangi parol kiriting' : 'Parolni qayta kiriting'}
            </h2>
            
            <p className="text-[14px] text-red-500 h-6 font-medium text-center">
              {errorText}
            </p>

            {/* Nuqtalar */}
            <motion.div animate={controls} variants={shakeVariants} className="flex items-center gap-4 my-8">
              {Array.from({ length: passcodeLength }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{
                    scale: passcode.length > i ? 1.2 : 1,
                    backgroundColor: passcode.length > i ? '#007aff' : 'rgba(156, 163, 175, 0.3)',
                    borderColor: passcode.length > i ? '#007aff' : 'rgba(156, 163, 175, 0.5)'
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-[14px] h-[14px] rounded-full border-[1.5px]"
                />
              ))}
            </motion.div>
          </>
        )}

        {/* Raqamlar paneli */}
        <div className={`grid grid-cols-3 gap-x-6 gap-y-4 mt-auto pb-12 w-full px-6 transition-opacity duration-300 ${timeLeft > 0 ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="w-[75px] h-[75px] rounded-full flex items-center justify-center bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 active:bg-neutral-300 dark:active:bg-white/30 transition-colors mx-auto"
            >
              <span className="text-[32px] font-normal">{num}</span>
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress('0')}
            className="w-[75px] h-[75px] rounded-full flex items-center justify-center bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 active:bg-neutral-300 dark:active:bg-white/30 transition-colors mx-auto"
          >
            <span className="text-[32px] font-normal">0</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={passcode.length === 0}
            className="w-[75px] h-[75px] rounded-full flex items-center justify-center text-neutral-500 dark:text-white/70 hover:bg-neutral-200 dark:hover:bg-white/10 active:bg-neutral-300 dark:active:bg-white/20 transition-colors disabled:opacity-30 mx-auto"
          >
            <Delete size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasscodeScreen;
