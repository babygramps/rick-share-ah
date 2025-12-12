import { useCallback, useMemo, useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import * as mutations from '../graphql/mutations';

export interface ReceiptScanResult {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;
  merchantName?: string | null;
  totalAmount?: number | null; // cents
  date?: string | null; // may be AWSDate or raw
  category?: string | null;
  confidence?: number | null; // 0-1
  rawText?: string | null;
  imageUrl?: string | null;
}

export interface UseReceiptScanState {
  isUploading: boolean;
  isProcessing: boolean;
  error: string | null;
  uploadAndProcess: (file: File | Blob, options?: { filename?: string; contentType?: string }) => Promise<{
    imageKey: string;
    scan: ReceiptScanResult | null;
  }>;
}

function makeKey(filename?: string) {
  const ext = filename?.split('.').pop()?.toLowerCase();
  const safeExt = ext && /^[a-z0-9]+$/.test(ext) ? ext : 'jpg';
  const id =
    (globalThis.crypto as any)?.randomUUID?.() ||
    `r_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return `receipts/${id}.${safeExt}`;
}

export function useReceiptScan(): UseReceiptScanState {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(() => generateClient({ authMode: 'userPool' }), []);

  const uploadAndProcess = useCallback(
    async (file: File | Blob, options?: { filename?: string; contentType?: string }) => {
      setError(null);
      setIsUploading(true);
      setIsProcessing(false);

      const filename = options?.filename || (file instanceof File ? file.name : undefined);
      const imageKey = makeKey(filename);
      const contentType =
        options?.contentType ||
        (file instanceof File ? file.type : '') ||
        'image/jpeg';

      try {
        console.log('[receipt-scan] upload.start', { imageKey, contentType, size: (file as any).size });

        const upload = uploadData({
          path: ({ identityId }) => (identityId ? `protected/${identityId}/${imageKey}` : imageKey),
          data: file,
          options: {
            contentType,
          },
        });
        const uploaded = await upload.result;

        const uploadedPath = (uploaded as any)?.path || imageKey;
        console.log('[receipt-scan] upload.done', { imageKey, uploadedPath });
        setIsUploading(false);
        setIsProcessing(true);

        console.log('[receipt-scan] processReceipt.start', { imageKey: uploadedPath });
        const resp = await client.graphql({
          query: (mutations as any).processReceipt,
          variables: { imageKey: uploadedPath },
          authMode: 'userPool',
        });

        const scan = (resp as any).data?.processReceipt as ReceiptScanResult | undefined;
        console.log('[receipt-scan] processReceipt.done', { imageKey: uploadedPath, scan });

        setIsProcessing(false);
        return { imageKey: uploadedPath, scan: scan || null };
      } catch (e: any) {
        console.error('[receipt-scan] failed', { imageKey, error: e });
        setIsUploading(false);
        setIsProcessing(false);
        setError(e?.message || 'Receipt scan failed.');
        return { imageKey, scan: null };
      }
    },
    [client]
  );

  return { isUploading, isProcessing, error, uploadAndProcess };
}


