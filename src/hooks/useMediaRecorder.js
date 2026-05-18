import { useState, useRef, useCallback } from 'react';

export const useMediaRecorder = () => {
  const [recordingState, setRecordingState] = useState('idle');
  const [recordingType, setRecordingType] = useState(null); 
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [previewStream, setPreviewStream] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const durationRef = useRef(0);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);
  const facingModeRef = useRef('user');

  // TAYMER BOSHQARUVI
  const startTimer = useCallback(() => {
    setDuration(0);
    durationRef.current = 0;
    timerRef.current = setInterval(() => {
      setDuration((prev) => {
        durationRef.current = prev + 1;
        return prev + 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // AUDIO TO'LQINLAR
  const startAudioAnalyser = useCallback((stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animationRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.error("Audio analyser error:", e);
    }
  }, []);

  const stopAudioAnalyser = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (analyserRef.current) analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setPreviewStream(null);
  }, []);

  // OVOZ YOZISH
  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(); // <-- XATOLIK SABABI (100) OLIB TASHLANDI!
      setRecordingState('recording');
      setRecordingType('voice');
      startTimer();
      startAudioAnalyser(stream);
    } catch (err) {
      console.error("Mic error:", err);
    }
  }, [startTimer, startAudioAnalyser]);

  // VIDEO YOZISH
  const startVideoRecording = useCallback(async (isFlip = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: facingModeRef.current,
          width: { ideal: 400 },
          height: { ideal: 400 },
          aspectRatio: 1,
        },
      });

      streamRef.current = stream;
      setPreviewStream(stream);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus' : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      if (!isFlip) chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(); // <-- XATOLIK SABABI (100) OLIB TASHLANDI!
      setRecordingState('recording');
      setRecordingType('video');
      
      if (!isFlip) startTimer();
      startAudioAnalyser(stream);
    } catch (err) {
      console.error("Video error:", err);
    }
  }, [startTimer, startAudioAnalyser]);

  const flipCamera = useCallback(async () => {
    if (recordingState !== 'recording' || recordingType !== 'video') return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    facingModeRef.current = facingModeRef.current === 'user' ? 'environment' : 'user';
    stopStream();
    await startVideoRecording(true);
  }, [recordingState, recordingType, startVideoRecording, stopStream]);

  // TO'XTATISH VA YUBORISH (ENG MUHIM QISM - Qotib qolmaslik uchun Timeout qo'shildi)
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      let isResolved = false; // Dublikat yuborishni oldini olish

      const finalize = () => {
        if (isResolved) return;
        isResolved = true;

        try {
          const mimeType = recordingType === 'video' ? 'video/webm' : 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const file = new File([blob], `${recordingType}_${Date.now()}.webm`, { type: mimeType });

          const result = {
            file,
            duration: durationRef.current,
            type: recordingType,
            messageType: recordingType === 'video' ? 'video_note' : 'voice_note',
          };

          cleanup();
          resolve(result); // Yuborish uchun tayyor faylni qaytaradi
        } catch (e) {
          console.error("Fayl yaratishda xato:", e);
          cleanup();
          resolve(null);
        }
      };

      function cleanup() {
        stopTimer();
        stopAudioAnalyser();
        stopStream();
        setRecordingState('idle');
        setRecordingType(null);
        setDuration(0);
        durationRef.current = 0;
        chunksRef.current = [];
      }

      // Agar oldinroq o'chgan bo'lsa
      if (!recorder || recorder.state === 'inactive') {
        finalize();
        return;
      }

      // Brauzer faylni yig'ishni tugatganda ishlaydi
      recorder.onstop = finalize;

      try {
        recorder.requestData(); // Qolgan qismlarni majburiy yig'ib olish
        recorder.stop();
      } catch (err) {
        console.error("Recorder stop xatosi:", err);
        finalize();
      }

      // SAFARI BUG FIX: Agar onstop ishlamay qotsa, 1 sekunddan keyin majburiy jo'natadi!
      setTimeout(() => {
        if (!isResolved) {
          console.warn("MediaRecorder osilib qoldi, majburiy jo'natilmoqda...");
          finalize();
        }
      }, 1000);
    });
  }, [recordingType, stopTimer, stopAudioAnalyser, stopStream]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopTimer();
    stopAudioAnalyser();
    stopStream();
    chunksRef.current = [];
    setRecordingState('idle');
    setRecordingType(null);
    setDuration(0);
    durationRef.current = 0;
  }, [stopTimer, stopAudioAnalyser, stopStream]);

  return {
    isRecording: recordingState === 'recording',
    recordingState,
    recordingType,
    duration,
    audioLevel,
    stream: previewStream,
    flipCamera,
    startVoiceRecording,
    startVideoRecording,
    stopRecording,
    cancelRecording,
  };
};