import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../types';
import { parseCurrencyInput } from '../../utils/helpers';
import { moneyTextToCents, normalizeDateToISO } from '../../utils/receiptParser';
import {
  guessCsvExpenseMapping,
  parseCsv,
  type CsvColumnMapping,
  type CsvExpenseField,
} from '../../utils/csvParser';

type Step = 'upload' | 'map' | 'preview' | 'done';

interface CSVUploaderProps {
  isOpen: boolean;
  onClose: () => void;
}

type PreviewRow = {
  rowNumber: number; // 1-based data row number (excluding header)
  raw: Record<string, string>;
  draft: {
    description: string;
    amount: number; // cents
    date: string; // yyyy-mm-dd
    category: string;
    paidBy: 'partner1' | 'partner2';
    note?: string;
  } | null;
  errors: string[];
};

function normalizeToken(s: string) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function categoryFromText(raw: string | undefined | null): string | null {
  const t = String(raw ?? '').trim();
  if (!t) return null;
  const n = normalizeToken(t);

  const hitById = CATEGORIES.find((c) => normalizeToken(c.id) === n);
  if (hitById) return hitById.id;

  const hitByLabel = CATEGORIES.find((c) => normalizeToken(c.label) === n || normalizeToken(c.label).includes(n));
  if (hitByLabel) return hitByLabel.id;

  return null;
}

export function CSVUploader({ isOpen, onClose }: CSVUploaderProps) {
  const { couple, addExpenseBatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  const [csvText, setCsvText] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<Array<Record<string, string>>>([]);

  const [mapping, setMapping] = useState<CsvColumnMapping>({});
  const [mappingErrors, setMappingErrors] = useState<Record<string, string>>({});

  const [skipInvalid, setSkipInvalid] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; failed: number; skipped: number } | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  // Row-level overrides for editable fields (paidBy, category) keyed by row index
  const [rowOverrides, setRowOverrides] = useState<Record<number, { paidBy?: 'partner1' | 'partner2'; category?: string }>>({});

  const resetAll = () => {
    setStep('upload');
    setIsDragging(false);
    setFileName(null);
    setFileSize(null);
    setCsvText(null);
    setHeaders([]);
    setRecords([]);
    setMapping({});
    setMappingErrors({});
    setSkipInvalid(true);
    setIsImporting(false);
    setImportResult(null);
    setFatalError(null);
    setRowOverrides({});
  };

  useEffect(() => {
    if (!isOpen) {
      resetAll();
      return;
    }
    console.log('[csv-import] modal.open');
  }, [isOpen]);

  const headerOptions = useMemo(() => {
    return [
      { value: '', label: '— Not in CSV —' },
      ...headers.map((h) => ({ value: h, label: h })),
    ];
  }, [headers]);

  const requiredFields: Array<{ key: CsvExpenseField; label: string; required: boolean; icon: string }> = [
    { key: 'description', label: 'Description', required: true, icon: '📝' },
    { key: 'amount', label: 'Amount', required: true, icon: '💵' },
    { key: 'date', label: 'Date', required: true, icon: '📅' },
    { key: 'category', label: 'Category', required: false, icon: '🏷️' },
    { key: 'paidBy', label: 'Paid by', required: false, icon: '👤' },
    { key: 'note', label: 'Note', required: false, icon: '🗒️' },
  ];

  const validateMapping = (next: CsvColumnMapping) => {
    const errs: Record<string, string> = {};
    for (const f of requiredFields) {
      if (f.required) {
        const v = next[f.key];
        if (!v) errs[f.key] = 'Required';
      }
    }
    setMappingErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isMappingValid = useMemo(() => {
    for (const f of requiredFields) {
      if (!f.required) continue;
      const v = mapping[f.key];
      if (!v) return false;
    }
    return true;
  }, [mapping]);

  const readFileAsText = async (file: File) => {
    console.log('[csv-import] file.selected', { name: file.name, size: file.size, type: file.type });
    setFileName(file.name);
    setFileSize(file.size);
    setFatalError(null);

    const text = await file.text();
    setCsvText(text);

    const parsed = parseCsv(text);
    console.log('[csv-import] parsed', { delimiter: parsed.delimiter, headers: parsed.headers.length, rows: parsed.records.length });

    if (parsed.headers.length === 0) {
      setFatalError('Could not find a header row. Make sure the first row contains column names.');
      return;
    }

    setHeaders(parsed.headers);
    setRecords(parsed.records);

    const guessed = guessCsvExpenseMapping(parsed.headers);
    setMapping(guessed);
    validateMapping(guessed);
    setStep('map');
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    try {
      await readFileAsText(file);
    } catch (e: any) {
      console.error('[csv-import] read.error', e);
      setFatalError(e?.message || 'Failed to read CSV file.');
    }
  };

  const paidByFromText = (raw: string | undefined | null): 'partner1' | 'partner2' => {
    const t = String(raw ?? '').trim();
    if (!t) return 'partner1';

    const n = normalizeToken(t);
    const p1n = normalizeToken(couple?.partner1Name || '');
    const p2n = normalizeToken(couple?.partner2Name || '');

    if (n === 'partner2' || n === 'p2' || n === '2') return 'partner2';
    if (n === 'partner1' || n === 'p1' || n === '1') return 'partner1';

    if (p2n && n.includes(p2n)) return 'partner2';
    if (p1n && n.includes(p1n)) return 'partner1';

    // Heuristic: look for "wife/husband/her/him" etc. as a last resort (avoid being too clever).
    if (/(partner2|her|wife|girlfriend)/i.test(t)) return 'partner2';
    if (/(partner1|him|husband|boyfriend)/i.test(t)) return 'partner1';

    return 'partner1';
  };

  const getCell = (rec: Record<string, string>, field: CsvExpenseField) => {
    const h = mapping[field];
    if (!h) return '';
    return rec[h] ?? '';
  };

  const validateRecord = (
    rec: Record<string, string>,
    overrides?: { paidBy?: 'partner1' | 'partner2'; category?: string }
  ) => {
    const errors: string[] = [];

    const description = String(getCell(rec, 'description')).trim();
    if (!description) errors.push('Missing description');

    const amountRaw = String(getCell(rec, 'amount')).trim();
    const amountCents = moneyTextToCents(amountRaw) ?? parseCurrencyInput(amountRaw);
    if (!amountCents || amountCents <= 0) errors.push('Invalid amount');

    const dateRaw = String(getCell(rec, 'date')).trim();
    const iso = normalizeDateToISO(dateRaw);
    if (!iso) errors.push('Invalid date');

    const catRaw = String(getCell(rec, 'category')).trim();
    const category = overrides?.category ?? categoryFromText(catRaw) ?? 'other';

    const paidByRaw = String(getCell(rec, 'paidBy')).trim();
    const paidBy = overrides?.paidBy ?? paidByFromText(paidByRaw);

    const note = String(getCell(rec, 'note')).trim();

    return {
      errors,
      draft:
        errors.length > 0
          ? null
          : {
              description,
              amount: amountCents,
              date: iso!,
              category,
              paidBy,
              note: note || undefined,
            },
    };
  };

  const previewRows: PreviewRow[] = useMemo(() => {
    if (records.length === 0) return [];
    const out: PreviewRow[] = [];
    const maxPreviewRows = Math.min(records.length, 250);

    for (let idx = 0; idx < maxPreviewRows; idx += 1) {
      const rec = records[idx];
      const { errors, draft } = validateRecord(rec, rowOverrides[idx]);
      out.push({ rowNumber: idx + 1, raw: rec, draft, errors });
    }

    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, mapping, couple?.partner1Name, couple?.partner2Name, rowOverrides]);

  const counts = useMemo(() => {
    if (records.length === 0) return { total: 0, valid: 0, invalid: 0 };

    // Count across ALL rows (not just preview), so button + summary are truthful.
    let invalid = 0;
    for (let idx = 0; idx < records.length; idx += 1) {
      const { errors } = validateRecord(records[idx], rowOverrides[idx]);
      if (errors.length > 0) invalid += 1;
    }
    const valid = records.length - invalid;
    return { total: records.length, valid, invalid };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, mapping, couple?.partner1Name, couple?.partner2Name, rowOverrides]);

  const importNow = async () => {
    if (!validateMapping(mapping)) return;

    const validDrafts: Array<NonNullable<PreviewRow['draft']>> = [];
    let invalidCount = 0;

    for (let idx = 0; idx < records.length; idx += 1) {
      const { draft, errors } = validateRecord(records[idx], rowOverrides[idx]);
      if (errors.length > 0 || !draft) invalidCount += 1;
      else validDrafts.push(draft);
    }

    if (!skipInvalid && invalidCount > 0) {
      setFatalError('This CSV has invalid rows. Enable “Skip invalid rows” or fix the CSV and try again.');
      return;
    }

    setFatalError(null);
    setIsImporting(true);
    console.log('[csv-import] import.start', { total: records.length, valid: validDrafts.length, invalid: invalidCount, skipInvalid });

    try {
      const resp = await addExpenseBatch(
        validDrafts.map((d) => ({
          description: d.description,
          amount: d.amount,
          paidBy: d.paidBy,
          splitType: 'equal',
          partner1Share: 50,
          partner2Share: 50,
          category: d.category,
          date: d.date,
          note: d.note,
        }))
      );

      const created = Number(resp?.created ?? validDrafts.length);
      const failed = Number(resp?.failed ?? 0);

      console.log('[csv-import] import.done', { created, failed, skipped: invalidCount });
      setImportResult({ created, failed, skipped: invalidCount });
      setStep('done');
    } catch (e: any) {
      console.error('[csv-import] import.error', e);
      setFatalError(e?.message || 'Import failed. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const stepPills = (
    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
      <span className={`px-2 py-1 border-2 ${step === 'upload' ? 'bg-[var(--color-sunshine)]' : 'bg-white'} border-[var(--color-plum)]`}>1 Upload</span>
      <span className={`px-2 py-1 border-2 ${step === 'map' ? 'bg-[var(--color-sunshine)]' : 'bg-white'} border-[var(--color-plum)]`}>2 Map</span>
      <span className={`px-2 py-1 border-2 ${step === 'preview' ? 'bg-[var(--color-sunshine)]' : 'bg-white'} border-[var(--color-plum)]`}>3 Preview</span>
    </div>
  );

  const uploadBody = (
    <div className="space-y-4">
      <div
        className={`
          border-[3px]
          border-dashed
          ${isDragging ? 'bg-[var(--color-sunshine)]/30' : 'bg-[var(--color-cream)]'}
          border-[var(--color-plum)]
          p-6
          text-center
          transition-colors
        `}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          const file = e.dataTransfer?.files?.[0] || null;
          void onPickFile(file);
        }}
      >
        <p className="text-lg font-bold">📄 Drop your CSV here</p>
        <p className="font-mono text-xs text-[var(--color-plum)]/70 mt-2">
          We’ll parse it locally, then you’ll map columns before anything is imported.
        </p>

        <div className="mt-5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              void onPickFile(file);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            Choose CSV File
          </Button>
        </div>
      </div>

      {fatalError && <p className="font-mono text-sm text-[var(--color-coral)]">{fatalError}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white border-2 border-[var(--color-plum)]/20">
          <p className="font-mono text-xs uppercase text-[var(--color-plum)]/60">Recommended columns</p>
          <p className="font-mono text-xs mt-1">description, amount, date</p>
        </div>
        <div className="p-3 bg-white border-2 border-[var(--color-plum)]/20">
          <p className="font-mono text-xs uppercase text-[var(--color-plum)]/60">Accepted formats</p>
          <p className="font-mono text-xs mt-1">$12.34, 12.34, 12 | 2025-12-31 or 12/31/2025</p>
        </div>
      </div>
    </div>
  );

  const mapBody = (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-lg">🧩 Map your CSV columns</p>
          <p className="font-mono text-xs text-[var(--color-plum)]/70">
            {fileName && <span className="font-bold">{fileName}</span>}
            {fileName && fileSize && <span> ({(fileSize / 1024).toFixed(1)} KB)</span>}
            {fileName && ' — '}
            Detected <span className="font-bold">{records.length}</span> rows and{' '}
            <span className="font-bold">{headers.length}</span> columns.
          </p>
        </div>
        {stepPills}
      </div>

      {fatalError && <p className="font-mono text-sm text-[var(--color-coral)]">{fatalError}</p>}

      <div className="grid grid-cols-1 gap-4">
        {requiredFields.map((f) => (
          <div key={f.key} className="bg-white border-2 border-[var(--color-plum)]/20 p-4">
            <div className="flex items-center justify-between">
              <p className="font-bold">
                {f.icon} {f.label} {f.required ? <span className="font-mono text-xs text-[var(--color-coral)]">REQUIRED</span> : null}
              </p>
            </div>
            <div className="mt-3">
              <Select
                label="CSV column"
                options={headerOptions}
                value={mapping[f.key] || ''}
                onChange={(e) => {
                  const next = { ...mapping, [f.key]: e.target.value || undefined };
                  setMapping(next);
                  validateMapping(next);
                }}
                error={mappingErrors[f.key]}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            resetAll();
          }}
        >
          Start Over
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={() => {
            if (!validateMapping(mapping)) return;
            setFatalError(null);
            setStep('preview');
          }}
          disabled={!isMappingValid}
        >
          Preview Import
        </Button>
      </div>
    </div>
  );

  const previewBody = (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-lg">🔎 Preview</p>
          <p className="font-mono text-xs text-[var(--color-plum)]/70">
            Valid: <span className="font-bold">{counts.valid}</span> · Invalid:{' '}
            <span className="font-bold text-[var(--color-coral)]">{counts.invalid}</span>
          </p>
        </div>
        {stepPills}
      </div>

      {counts.total === 0 && (
        <p className="font-mono text-sm text-[var(--color-coral)]">
          No rows found. Make sure your CSV has a header row and at least one data row.
        </p>
      )}

      {fatalError && <p className="font-mono text-sm text-[var(--color-coral)]">{fatalError}</p>}

      <Card padding="sm" className="bg-[var(--color-cream)]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="font-mono text-xs uppercase tracking-wider text-[var(--color-plum)]">
              Skip invalid rows
            </label>
            <button
              type="button"
              className={`
                border-[3px] border-[var(--color-plum)] px-3 py-1 font-mono text-xs uppercase
                ${skipInvalid ? 'bg-[var(--color-sage)]' : 'bg-white'}
              `}
              onClick={() => setSkipInvalid((v) => !v)}
            >
              {skipInvalid ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="pt-2 border-t border-[var(--color-plum)]/20">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-plum)] mb-2">
              Bulk assign all rows
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-[var(--color-plum)] bg-[var(--color-coral)] text-white hover:bg-[#ff5252] transition-colors"
                onClick={() => {
                  const all: Record<number, { paidBy?: 'partner1' | 'partner2'; category?: string }> = {};
                  for (let i = 0; i < records.length; i++) {
                    all[i] = { ...rowOverrides[i], paidBy: 'partner1' };
                  }
                  setRowOverrides(all);
                }}
              >
                All → {couple?.partner1Name || 'Partner 1'}
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-[var(--color-plum)] bg-[var(--color-sage)] text-[var(--color-plum)] hover:bg-[#7bc9a0] transition-colors"
                onClick={() => {
                  const all: Record<number, { paidBy?: 'partner1' | 'partner2'; category?: string }> = {};
                  for (let i = 0; i < records.length; i++) {
                    all[i] = { ...rowOverrides[i], paidBy: 'partner2' };
                  }
                  setRowOverrides(all);
                }}
              >
                All → {couple?.partner2Name || 'Partner 2'}
              </button>
            </div>
          </div>
        </div>
      </Card>

      <div className="border-[3px] border-[var(--color-plum)] bg-white shadow-[4px_4px_0px_var(--color-plum)] overflow-auto max-h-[45vh]">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-white border-b-[3px] border-[var(--color-plum)]">
            <tr className="font-mono text-xs uppercase tracking-wider">
              <th className="p-3 w-16">Row</th>
              <th className="p-3">Description</th>
              <th className="p-3 w-28">Amount</th>
              <th className="p-3 w-28">Date</th>
              <th className="p-3 w-28">Paid by</th>
              <th className="p-3 w-32">Category</th>
              <th className="p-3 w-64">Status</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((r) => {
              const bad = r.errors.length > 0;
              const rowIdx = r.rowNumber - 1; // 0-based index
              const currentPaidBy = r.draft?.paidBy || rowOverrides[rowIdx]?.paidBy || 'partner1';
              const currentCategory = r.draft?.category || rowOverrides[rowIdx]?.category || 'other';

              return (
                <tr
                  key={r.rowNumber}
                  className={`
                    border-b border-[var(--color-plum)]/10
                    ${bad ? 'bg-[var(--color-coral)]/10' : ''}
                  `}
                >
                  <td className="p-3 font-mono text-xs">{r.rowNumber}</td>
                  <td className="p-3 max-w-[180px] truncate" title={r.draft?.description || ''}>
                    {r.draft?.description || ''}
                  </td>
                  <td className="p-3 font-mono text-sm">{r.draft ? `$${(r.draft.amount / 100).toFixed(2)}` : ''}</td>
                  <td className="p-3 font-mono text-sm">{r.draft?.date || ''}</td>
                  <td className="p-2">
                    <select
                      className="w-full px-2 py-1 text-xs font-mono border-2 border-[var(--color-plum)]/30 bg-white cursor-pointer focus:border-[var(--color-plum)] outline-none"
                      value={currentPaidBy}
                      onChange={(e) => {
                        const val = e.target.value as 'partner1' | 'partner2';
                        setRowOverrides((prev) => ({
                          ...prev,
                          [rowIdx]: { ...prev[rowIdx], paidBy: val },
                        }));
                      }}
                    >
                      <option value="partner1">{couple?.partner1Name || 'Partner 1'}</option>
                      <option value="partner2">{couple?.partner2Name || 'Partner 2'}</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      className="w-full px-2 py-1 text-xs font-mono border-2 border-[var(--color-plum)]/30 bg-white cursor-pointer focus:border-[var(--color-plum)] outline-none"
                      value={currentCategory}
                      onChange={(e) => {
                        setRowOverrides((prev) => ({
                          ...prev,
                          [rowIdx]: { ...prev[rowIdx], category: e.target.value },
                        }));
                      }}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.emoji} {c.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    {bad ? (
                      <div className="space-y-1">
                        {r.errors.map((e) => (
                          <p key={e} className="font-mono text-xs text-[var(--color-coral)]">
                            {e}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="font-mono text-xs text-[var(--color-plum)]/70">OK</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {records.length > 250 && (
        <p className="font-mono text-xs text-[var(--color-plum)]/60">
          Showing first 250 rows in preview. Import will still use all {records.length} parsed rows.
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={() => setStep('map')} disabled={isImporting}>
          Back
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={importNow}
          isLoading={isImporting}
          disabled={counts.valid === 0 || isImporting}
        >
          Import {counts.valid} Expense{counts.valid === 1 ? '' : 's'}
        </Button>
      </div>
    </div>
  );

  const doneBody = (
    <div className="space-y-4 text-center">
      <p className="text-2xl font-bold">✅ Import Complete</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-[var(--color-sage)]/25 border-2 border-[var(--color-sage)]">
          <p className="font-mono text-2xl font-bold">{importResult?.created ?? 0}</p>
          <p className="font-mono text-xs uppercase text-[var(--color-plum)]/70">Created</p>
        </div>
        <div className="p-3 bg-[var(--color-coral)]/15 border-2 border-[var(--color-coral)]">
          <p className="font-mono text-2xl font-bold">{importResult?.failed ?? 0}</p>
          <p className="font-mono text-xs uppercase text-[var(--color-plum)]/70">Failed</p>
        </div>
        <div className="p-3 bg-[var(--color-sunshine)]/25 border-2 border-[var(--color-sunshine)]">
          <p className="font-mono text-2xl font-bold">{importResult?.skipped ?? 0}</p>
          <p className="font-mono text-xs uppercase text-[var(--color-plum)]/70">Skipped</p>
        </div>
      </div>

      <p className="font-mono text-xs text-[var(--color-plum)]/70">
        Tip: if something looks off, re-import with different column mapping (imports don’t dedupe automatically yet).
      </p>

      <Button
        type="button"
        className="w-full"
        onClick={() => {
          console.log('[csv-import] modal.close.after.done', { importResult });
          onClose();
        }}
      >
        Done
      </Button>
    </div>
  );

  const title = step === 'upload' ? '📦 Import Expenses (CSV)' : step === 'map' ? '🧩 Map Columns' : step === 'preview' ? '🔎 Preview Import' : '✅ Imported';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        console.log('[csv-import] modal.close');
        onClose();
      }}
      title={title}
      size="lg"
    >
      {step === 'upload' && uploadBody}
      {step === 'map' && mapBody}
      {step === 'preview' && previewBody}
      {step === 'done' && doneBody}

      {/* Hidden debug field to keep state visible during development if needed */}
      {false && (
        <Input label="debug" value={csvText || ''} onChange={() => {}} />
      )}
    </Modal>
  );
}


