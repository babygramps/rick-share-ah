import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ScanOverlay, type ScanOverlayMode, type ScanOverlayOutput } from './ScanOverlay';
import { ScanResults, type ScanApplySelection } from './ScanResults';
import type { ReceiptLineItemAssignment } from '../../types';
import { computeLineItemSplitPercent } from './LineItemAssigner';
import { useReceiptScan } from '../../hooks/useReceiptScan';

export interface ReceiptScannerApplyPayload {
  description?: string;
  amountCents?: number;
  date?: string;
  category?: string;
  confidence?: number;
  imageKey?: string;
  splitType?: 'percentage';
  partner1SharePercent?: number;
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
  const [lineItemAssignments, setLineItemAssignments] = useState<ReceiptLineItemAssignment[]>([]);

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
    setLineItemAssignments([]);
    setSelection({ description: true, amount: true, date: true, category: true });
    setMode('camera');
  };

  useEffect(() => {
    const items = scan?.lineItems;
    if (!Array.isArray(items) || items.length === 0) {
      setLineItemAssignments([]);
      return;
    }

    const makeId =
      (globalThis.crypto as any)?.randomUUID?.bind((globalThis.crypto as any) || null) ||
      (() => `li_${Date.now()}_${Math.random().toString(16).slice(2)}`);

    const next: ReceiptLineItemAssignment[] = items.map((li: any, idx: number) => ({
      id: `${makeId()}_${idx}`,
      description: li?.description ?? null,
      price: li?.price ?? null,
      quantity: li?.quantity ?? null,
      assignTo: 'split',
      customPercent: undefined,
    }));

    console.log('[receipt-scan] lineItems.init', {
      scanId,
      count: next.length,
      priced: next.filter((x) => typeof x.price === 'number' && x.price > 0).length,
    });
    setLineItemAssignments(next);
  }, [scan?.lineItems, scanId]);

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

    // If we have line items, compute a clean percentage split for the total.
    if (
      selection.amount &&
      typeof scan.totalAmount === 'number' &&
      Array.isArray(lineItemAssignments) &&
      lineItemAssignments.length > 0
    ) {
      const { partner1Pct, basisCents } = computeLineItemSplitPercent(lineItemAssignments);
      if (basisCents > 0) {
        payload.splitType = 'percentage';
        payload.partner1SharePercent = partner1Pct;
      }
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
          lineItemAssignments={lineItemAssignments}
          onLineItemAssignmentsChange={setLineItemAssignments}
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


