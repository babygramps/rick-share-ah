import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCameraState {
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImageBlob: (videoEl: HTMLVideoElement, options?: { mimeType?: string; quality?: number }) => Promise<Blob>;
}

export function useCamera(): UseCameraState {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;
    setStream(null);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera is not supported in this browser.');
        return;
      }

      // Prefer back camera on mobile
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (e: any) {
      const msg =
        e?.name === 'NotAllowedError'
          ? 'Camera permission denied. You can still upload a photo instead.'
          : e?.message || 'Failed to access camera.';
      setError(msg);
      setStream(null);
      streamRef.current = null;
    }
  }, []);

  const captureImageBlob = useCallback(
    async (videoEl: HTMLVideoElement, options?: { mimeType?: string; quality?: number }) => {
      const mimeType = options?.mimeType || 'image/jpeg';
      const quality = typeof options?.quality === 'number' ? options.quality : 0.92;

      const width = videoEl.videoWidth || 1280;
      const height = videoEl.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to capture image (canvas unavailable).');
      }

      ctx.drawImage(videoEl, 0, 0, width, height);

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
      if (!blob) throw new Error('Failed to capture image.');
      return blob;
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => stopCamera, [stopCamera]);

  return {
    stream,
    isActive: !!stream,
    error,
    startCamera,
    stopCamera,
    captureImageBlob,
  };
}


