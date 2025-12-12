import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCamera } from '../../hooks/useCamera';

export type ScanOverlayMode = 'camera' | 'upload';

export interface ScanOverlayOutput {
  blob: Blob;
  filename: string;
  contentType: string;
  previewUrl: string;
}

interface ScanOverlayProps {
  mode: ScanOverlayMode;
  onModeChange: (mode: ScanOverlayMode) => void;
  onCaptured: (output: ScanOverlayOutput) => void;
}

export function ScanOverlay({ mode, onModeChange, onCaptured }: ScanOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const { stream, isActive, error, startCamera, stopCamera, captureImageBlob } = useCamera();

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
      return () => stopCamera();
    }
    stopCamera();
    return;
  }, [mode, startCamera, stopCamera]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const capture = async () => {
    if (!videoRef.current) return;
    try {
      const blob = await captureImageBlob(videoRef.current, { mimeType: 'image/jpeg', quality: 0.92 });
      const previewUrl = URL.createObjectURL(blob);
      console.log('[receipt-scan] camera.capture', { size: blob.size, type: blob.type });
      onCaptured({
        blob,
        filename: 'camera.jpg',
        contentType: blob.type || 'image/jpeg',
        previewUrl,
      });
    } catch (e: any) {
      console.error('[receipt-scan] camera.capture.failed', e);
      setFileError(e?.message || 'Failed to capture photo.');
    }
  };

  const onPickFile = (file: File | null) => {
    setFileError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFileError('Please choose an image file (JPG/PNG/WebP).');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    console.log('[receipt-scan] upload.file.selected', { name: file.name, type: file.type, size: file.size });
    onCaptured({
      blob: file,
      filename: file.name,
      contentType: file.type || 'image/jpeg',
      previewUrl,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'camera' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('camera')}
        >
          📷 Camera
        </Button>
        <Button
          type="button"
          variant={mode === 'upload' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('upload')}
        >
          ⬆️ Upload
        </Button>
      </div>

      {mode === 'camera' ? (
        <div className="space-y-3">
          <div className="border-[3px] border-[var(--color-plum)] bg-white shadow-[4px_4px_0px_var(--color-plum)] overflow-hidden">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-[360px] object-cover"
              />
              {/* viewfinder */}
              <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-[var(--color-sunshine)]/70 m-4" />
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-[2px] bg-[var(--color-coral)]/60 receipt-scanline" />
            </div>
          </div>

          {error && (
            <p className="font-mono text-sm text-[var(--color-coral)]">
              {error}
            </p>
          )}

          <Button type="button" onClick={capture} disabled={!isActive}>
            ✨ Capture Receipt
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="border-[3px] border-dashed border-[var(--color-plum)] bg-[var(--color-cream)] p-4">
            <Input
              label="Choose a receipt photo"
              type="file"
              accept="image/*"
              onChange={(e) => onPickFile(e.currentTarget.files?.[0] || null)}
            />
          </div>
          {fileError && (
            <p className="font-mono text-sm text-[var(--color-coral)]">{fileError}</p>
          )}
        </div>
      )}
    </div>
  );
}


