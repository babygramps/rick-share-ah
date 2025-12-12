import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, AnalyzeExpenseCommand } from '@aws-sdk/client-textract';

function log(level, message, meta) {
  const payload = {
    level,
    message,
    ...(meta ? { meta } : {}),
    ts: new Date().toISOString(),
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

function guessMimeTypeFromKey(key) {
  const lower = key.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

async function streamToBuffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function parseMoneyToCents(text) {
  if (!text) return null;
  const cleaned = String(text)
    .replace(/[^\d.,-]/g, '')
    .replace(/,/g, '');
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100);
}

function pickBestSummaryField(summaryFields, wantedTypes) {
  if (!Array.isArray(summaryFields)) return null;
  const matches = summaryFields
    .map((f) => {
      const typeText = f?.Type?.Text || f?.Type?.TextDetection?.Text;
      const valueText = f?.ValueDetection?.Text;
      const confidence = f?.ValueDetection?.Confidence ?? f?.Type?.Confidence ?? 0;
      return { typeText, valueText, confidence };
    })
    .filter((m) => m.typeText && wantedTypes.includes(String(m.typeText).toUpperCase()) && m.valueText);

  if (matches.length === 0) return null;
  matches.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
  return matches[0];
}

function parseAnalyzeExpenseResponse(resp) {
  const doc = resp?.ExpenseDocuments?.[0];
  const summaryFields = doc?.SummaryFields || [];

  const total = pickBestSummaryField(summaryFields, ['TOTAL', 'AMOUNT_DUE', 'SUBTOTAL']);
  const vendor = pickBestSummaryField(summaryFields, ['VENDOR_NAME']);
  const date = pickBestSummaryField(summaryFields, ['INVOICE_RECEIPT_DATE', 'TRANSACTION_DATE']);

  const totalAmount = parseMoneyToCents(total?.valueText);
  const merchantName = vendor?.valueText ? String(vendor.valueText).trim() : null;

  // Textract date strings vary; we pass through and let frontend normalize if needed.
  const dateText = date?.valueText ? String(date.valueText).trim() : null;

  const confidenceCandidates = [total?.confidence, vendor?.confidence, date?.confidence].filter(
    (c) => typeof c === 'number' && Number.isFinite(c)
  );
  const confidence =
    confidenceCandidates.length > 0
      ? confidenceCandidates.reduce((a, b) => a + b, 0) / confidenceCandidates.length / 100
      : 0;

  return {
    merchantName,
    totalAmount,
    date: dateText,
    confidence,
  };
}

export const handler = async (event, context) => {
  const requestId = context?.awsRequestId;
  log('info', 'processReceipt.start', {
    requestId,
    eventShape: {
      hasArguments: !!event?.arguments,
      hasIdentity: !!event?.identity,
    },
  });

  const imageKey = event?.arguments?.imageKey;
  if (!imageKey) {
    log('warn', 'processReceipt.missingImageKey', { requestId });
    return {
      id: requestId || `req_${Date.now()}`,
      status: 'FAILED',
      merchantName: null,
      totalAmount: null,
      date: null,
      category: null,
      confidence: 0,
      rawText: null,
      imageUrl: null,
    };
  }

  const bucket =
    process.env.RECEIPTS_BUCKET ||
    process.env.STORAGE_RECEIPTS_BUCKETNAME ||
    process.env.STORAGE_RECEIPTS_BUCKET_NAME ||
    process.env.BUCKET_NAME;

  if (!bucket) {
    log('error', 'processReceipt.missingBucketEnv', { requestId, imageKey, envKeys: Object.keys(process.env) });
    return {
      id: requestId || `req_${Date.now()}`,
      status: 'FAILED',
      merchantName: null,
      totalAmount: null,
      date: null,
      category: null,
      confidence: 0,
      rawText: null,
      imageUrl: null,
    };
  }

  const s3 = new S3Client({});
  const textract = new TextractClient({});

  try {
    log('info', 'processReceipt.fetchingFromS3', { requestId, bucket, imageKey });
    const s3Resp = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: imageKey }));
    if (!s3Resp?.Body) {
      throw new Error('S3 object body missing');
    }
    const bytes = await streamToBuffer(s3Resp.Body);
    log('info', 'processReceipt.s3ObjectLoaded', {
      requestId,
      bucket,
      imageKey,
      bytes: bytes.length,
      contentType: s3Resp.ContentType || guessMimeTypeFromKey(imageKey),
    });

    log('info', 'processReceipt.textractAnalyzeExpense.request', { requestId });
    const textractResp = await textract.send(
      new AnalyzeExpenseCommand({
        Document: { Bytes: bytes },
      })
    );
    log('info', 'processReceipt.textractAnalyzeExpense.response', {
      requestId,
      expenseDocuments: textractResp?.ExpenseDocuments?.length || 0,
    });

    const parsed = parseAnalyzeExpenseResponse(textractResp);

    return {
      id: requestId || `req_${Date.now()}`,
      status: 'COMPLETED',
      merchantName: parsed.merchantName,
      totalAmount: parsed.totalAmount,
      date: parsed.date,
      category: null,
      confidence: parsed.confidence,
      rawText: null,
      imageUrl: null,
    };
  } catch (error) {
    log('error', 'processReceipt.failed', {
      requestId,
      bucket,
      imageKey,
      errorName: error?.name,
      errorMessage: error?.message,
      stack: error?.stack,
    });

    return {
      id: requestId || `req_${Date.now()}`,
      status: 'FAILED',
      merchantName: null,
      totalAmount: null,
      date: null,
      category: null,
      confidence: 0,
      rawText: null,
      imageUrl: null,
    };
  }
};


