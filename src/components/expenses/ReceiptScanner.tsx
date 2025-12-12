import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ScanOverlay, type ScanOverlayMode, type ScanOverlayOutput } from './ScanOverlay';
import { ScanResults, type ScanApplySelection } from './ScanResults';
import { useReceiptScan } from '../../hooks/useReceiptScan';

export interface ReceiptScannerApplyPayload {
  description?: string;
  amountCents?: number;
  date?: string;
  category?: string;
  confidence?: number;
  imageKey?: string;
}

interface ReceiptScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (payload: ReceiptScannerApplyPayload) => void;
}

export function ReceiptScanner({ isOpen, onClose, onApply }: ReceiptScannerProps) {
  const [mode, setMode] = useState<ScanOverlayMode>('camera');
  const [capture, setCapture] = useState<ScanOverlayOutput | null>(null);
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [scan, setScan] = useState<any>(null);

  const { isUploading, isProcessing, error, uploadAndProcess } = useReceiptScan();

  const [selection, setSelection] = useState<ScanApplySelection>({
    description: true,
    amount: true,
    date: true,
    category: true,
  });

  const isBusy = isUploading || isProcessing;

  useEffect(() => {
    if (!isOpen) return;
    console.log('[receipt-scan] modal.open');
  }, [isOpen]);

  useEffect(() => {
    // cleanup object URL
    return () => {
      if (capture?.previewUrl) URL.revokeObjectURL(capture.previewUrl);
    };
  }, [capture?.previewUrl]);

  const title = useMemo(() => {
    if (scan) return '🧾 Receipt Results';
    if (capture) return '✨ Ready to Scan';
    return '📷 Scan Receipt';
  }, [capture, scan]);

  const reset = () => {
    console.log('[receipt-scan] reset');
    if (capture?.previewUrl) URL.revokeObjectURL(capture.previewUrl);
    setCapture(null);
    setImageKey(null);
    setScanId(null);
    setScan(null);
    setSelection({ description: true, amount: true, date: true, category: true });
    setMode('camera');
  };

  const doProcess = async () => {
    if (!capture) return;
    const { scan: respScan, imageKey: key } = await uploadAndProcess(capture.blob, {
      filename: capture.filename,
      contentType: capture.contentType,
    });
    setImageKey(key);
    setScanId(respScan?.id || null);
    setScan(respScan);
  };

  const apply = () => {
    if (!scan) return;

    const payload: ReceiptScannerApplyPayload = {
      imageKey: imageKey || undefined,
      confidence: scan?.confidence ?? undefined,
    };

    if (selection.description && scan.merchantName) {
      payload.description = String(scan.merchantName);
    }
    if (selection.amount && typeof scan.totalAmount === 'number') {
      payload.amountCents = scan.totalAmount;
    }
    if (selection.date && scan.date) {
      payload.date = String(scan.date);
    }
    if (selection.category && scan.category) {
      payload.category = String(scan.category);
    }

    console.log('[receipt-scan] apply', { scanId, payload });
    onApply(payload);
    reset();
    onClose();
  };

  const body = () => {
    if (scan) {
      return (
        <ScanResults
          previewUrl={capture?.previewUrl || ''}
          scan={scan}
          selection={selection}
          onSelectionChange={setSelection}
          onApply={apply}
          onRetry={() => {
            setScan(null);
            setScanId(null);
            setImageKey(null);
          }}
        />
      );
    }

    if (capture) {
      return (
        <div className="space-y-4">
          <div className="border-[3px] border-[var(--color-plum)] bg-white shadow-[4px_4px_0px_var(--color-plum)] overflow-hidden">
            <img src={capture.previewUrl} alt="Receipt preview" className="w-full max-h-[360px] object-contain bg-white" />
          </div>

          {error && (
            <p className="font-mono text-sm text-[var(--color-coral)]">{error}</p>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setCapture(null)} disabled={isBusy}>
              ↩️ Retake
            </Button>
            <Button type="button" className="flex-1" onClick={doProcess} isLoading={isBusy}>
              🪄 Scan & Autofill
            </Button>
          </div>

          <p className="font-mono text-xs text-[var(--color-plum)]/70">
            Tip: keep the receipt flat, avoid glare, and make sure the total is visible.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <ScanOverlay mode={mode} onModeChange={setMode} onCaptured={setCapture} />
        {error && <p className="font-mono text-sm text-[var(--color-coral)]">{error}</p>}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title={title}
      size="lg"
    >
      {body()}
    </Modal>
  );
}


