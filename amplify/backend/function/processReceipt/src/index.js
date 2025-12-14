import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, AnalyzeExpenseCommand } from '@aws-sdk/client-textract';

function log(level, message, meta) {
  const payload = {
    level,
    message,
    ...(meta ? { meta } : {}),
    ts: new Date().toISOString(),
  };
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

/**
 * Normalize a date string to YYYY-MM-DD format for GraphQL AWSDate
 * Handles formats like: 12/09/25, 12/09/2025, 2025-12-09, Dec 9 2025, etc.
 */
function normalizeDateToISO(dateText) {
  if (!dateText) return null;
  
  const text = String(dateText).trim();
  if (!text) return null;
  
  log('debug', 'normalizeDateToISO.input', { dateText: text });
  
  // Try parsing with Date constructor first (handles many formats)
  let parsed = new Date(text);
  
  // If that didn't work, try common receipt formats
  if (isNaN(parsed.getTime())) {
    // Try MM/DD/YY or MM/DD/YYYY format
    const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (slashMatch) {
      let [, month, day, year] = slashMatch;
      // Convert 2-digit year to 4-digit
      if (year.length === 2) {
        const twoDigitYear = parseInt(year, 10);
        // Assume 00-50 is 2000s, 51-99 is 1900s
        year = twoDigitYear <= 50 ? `20${year}` : `19${year}`;
      }
      parsed = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    }
  }
  
  // Try DD-MM-YYYY or DD/MM/YYYY (European format) if still invalid
  if (isNaN(parsed.getTime())) {
    const euroMatch = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (euroMatch) {
      const [, day, month, year] = euroMatch;
      // Only use European format if day > 12 (unambiguous)
      if (parseInt(day, 10) > 12) {
        parsed = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      }
    }
  }
  
  // If still invalid, return null
  if (isNaN(parsed.getTime())) {
    log('warn', 'normalizeDateToISO.failed', { dateText: text });
    return null;
  }
  
  // Format as YYYY-MM-DD
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  
  const isoDate = `${year}-${month}-${day}`;
  log('debug', 'normalizeDateToISO.result', { dateText: text, isoDate });
  
  return isoDate;
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

/**
 * Pick the best total amount, preferring TOTAL over SUBTOTAL.
 * SUBTOTAL is only used as a fallback if no TOTAL or AMOUNT_DUE is found.
 */
function pickBestTotal(summaryFields) {
  // First, try to find TOTAL or AMOUNT_DUE (the actual total including tax)
  const actualTotal = pickBestSummaryField(summaryFields, ['TOTAL', 'AMOUNT_DUE']);
  if (actualTotal) {
    log('debug', 'pickBestTotal.foundActualTotal', { 
      type: actualTotal.typeText, 
      value: actualTotal.valueText,
      confidence: actualTotal.confidence 
    });
    return actualTotal;
  }
  
  // Fallback to SUBTOTAL only if no actual total found
  const subtotal = pickBestSummaryField(summaryFields, ['SUBTOTAL']);
  if (subtotal) {
    log('debug', 'pickBestTotal.fallbackToSubtotal', { 
      value: subtotal.valueText,
      confidence: subtotal.confidence 
    });
    return subtotal;
  }
  
  return null;
}

function parseAnalyzeExpenseResponse(resp) {
  const doc = resp?.ExpenseDocuments?.[0];
  const summaryFields = doc?.SummaryFields || [];

  const total = pickBestTotal(summaryFields);
  const vendor = pickBestSummaryField(summaryFields, ['VENDOR_NAME']);
  const date = pickBestSummaryField(summaryFields, ['INVOICE_RECEIPT_DATE', 'TRANSACTION_DATE']);

  const totalAmount = parseMoneyToCents(total?.valueText);
  const merchantName = vendor?.valueText ? String(vendor.valueText).trim() : null;
  const dateText = date?.valueText ? String(date.valueText).trim() : null;
  const normalizedDate = normalizeDateToISO(dateText);

  const confidenceCandidates = [total?.confidence, vendor?.confidence, date?.confidence].filter(
    (c) => typeof c === 'number' && Number.isFinite(c)
  );
  const confidence =
    confidenceCandidates.length > 0
      ? confidenceCandidates.reduce((a, b) => a + b, 0) / confidenceCandidates.length / 100
      : 0;

  // Textract line items (optional; not present for all receipts)
  const lineItems = [];
  const lineItemGroups = doc?.LineItemGroups || [];
  for (const group of lineItemGroups) {
    const items = group?.LineItems || [];
    for (const item of items) {
      const fields = item?.LineItemExpenseFields || [];

      let description = null;
      let priceCents = null;
      let quantity = null;

      for (const f of fields) {
        const typeText = f?.Type?.Text || f?.Type?.TextDetection?.Text;
        const valueText = f?.ValueDetection?.Text;
        if (!typeText || !valueText) continue;

        const t = String(typeText).toUpperCase();
        if (t === 'ITEM' || t === 'ITEM_DESCRIPTION' || t === 'DESCRIPTION') {
          description = String(valueText).trim();
        } else if (t === 'PRICE' || t === 'AMOUNT') {
          priceCents = parseMoneyToCents(valueText);
        } else if (t === 'QUANTITY') {
          const q = Number(String(valueText).replace(/[^\d.-]/g, ''));
          quantity = Number.isFinite(q) ? Math.max(0, Math.round(q)) : quantity;
        }
      }

      if (description || typeof priceCents === 'number') {
        lineItems.push({
          description: description || null,
          price: typeof priceCents === 'number' ? priceCents : null,
          quantity: typeof quantity === 'number' ? quantity : null,
        });
      }
    }
  }

  return {
    merchantName,
    totalAmount,
    date: normalizedDate,
    confidence,
    lineItems,
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
    process.env.STORAGE_RECEIPTS_BUCKETNAME ||
    process.env.RECEIPTS_BUCKET ||
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
      lineItems: parsed.lineItems || [],
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
      lineItems: [],
      rawText: null,
      imageUrl: null,
    };
  }
};
