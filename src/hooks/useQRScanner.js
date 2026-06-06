import { useState, useEffect, useRef, useCallback } from 'react';
import { decodeQRFromImageData } from '../utils/qr.js';

export function useQRScanner({ onDecode, enabled = false }) {
  const [hasCamera, setHasCamera] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const decodedRef = useRef(false);

  const stopScanner = useCallback(() => {
    setScanning(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    decodedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setHasCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        scanFrame();
      }
    } catch (err) {
      setHasCamera(false);
      setError(err.message || 'Camera access denied');
    }
  }, []); // eslint-disable-line

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || decodedRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = decodeQRFromImageData(imageData);

      if (result) {
        decodedRef.current = true;
        stopScanner();
        if (onDecode) onDecode(result);
        return;
      }
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, [onDecode, stopScanner]);

  useEffect(() => {
    if (enabled) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [enabled]); // eslint-disable-line

  return {
    videoRef,
    canvasRef,
    scanning,
    hasCamera,
    error,
    startScanner,
    stopScanner,
  };
}
