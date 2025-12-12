export type CsvDelimiter = ',' | ';' | '\t';

export interface ParsedCsv {
  delimiter: CsvDelimiter;
  headers: string[];
  /** Raw row arrays, excluding the header row */
  rows: string[][];
  /** Row objects keyed by header */
  records: Array<Record<string, string>>;
}

export function detectCsvDelimiter(text: string): CsvDelimiter {
  const firstLine = (text || '').split(/\r?\n/).find((l) => l.trim().length > 0) || '';
  const comma = (firstLine.match(/,/g) || []).length;
  const semi = (firstLine.match(/;/g) || []).length;
  const tab = (firstLine.match(/\t/g) || []).length;

  // Prefer tabs if present; then commas; then semicolons.
  if (tab > 0 && tab >= comma && tab >= semi) return '\t';
  if (comma >= semi) return ',';
  return ';';
}

/**
 * Minimal, dependency-free CSV parser with RFC4180-ish handling:
 * - Supports quoted fields with escaped quotes ("")
 * - Supports newlines inside quoted fields
 */
export function parseCsvToRows(text: string, delimiter: CsvDelimiter): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    // Skip completely empty trailing rows (all cells empty/whitespace)
    const isAllEmpty = row.length === 0 || row.every((c) => String(c).trim().length === 0);
    if (!isAllEmpty) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    // Not in quotes
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === delimiter) {
      pushField();
      i += 1;
      continue;
    }

    if (ch === '\n' || ch === '\r') {
      pushField();
      pushRow();
      // consume \r\n as a single newline
      if (ch === '\r' && text[i + 1] === '\n') i += 2;
      else i += 1;
      continue;
    }

    field += ch;
    i += 1;
  }

  // Flush last field/row
  pushField();
  pushRow();

  return rows;
}

export function parseCsv(text: string): ParsedCsv {
  const delimiter = detectCsvDelimiter(text);
  const allRows = parseCsvToRows(text, delimiter);

  if (allRows.length === 0) {
    return { delimiter, headers: [], rows: [], records: [] };
  }

  const headers = allRows[0].map((h) => String(h || '').trim());
  const rows = allRows.slice(1);
  const records = rows.map((r) => {
    const rec: Record<string, string> = {};
    for (let idx = 0; idx < headers.length; idx += 1) {
      const key = headers[idx] || `Column ${idx + 1}`;
      rec[key] = String(r[idx] ?? '').trim();
    }
    return rec;
  });

  return { delimiter, headers, rows, records };
}

export type CsvExpenseField = 'description' | 'amount' | 'date' | 'category' | 'paidBy' | 'note';

export type CsvColumnMapping = Partial<Record<CsvExpenseField, string>>;

function normHeader(s: string) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Best-effort mapping guesses based on header names.
 * Returns header strings (not indices) so UI can use Select options directly.
 */
export function guessCsvExpenseMapping(headers: string[]): CsvColumnMapping {
  const byNorm = new Map<string, string>();
  for (const h of headers) byNorm.set(normHeader(h), h);

  const pick = (candidates: string[]) => {
    for (const c of candidates) {
      const direct = byNorm.get(normHeader(c));
      if (direct) return direct;
    }
    // loose contains match
    const norms = Array.from(byNorm.keys());
    for (const c of candidates) {
      const n = normHeader(c);
      const found = norms.find((k) => k.includes(n) || n.includes(k));
      if (found) return byNorm.get(found);
    }
    return undefined;
  };

  return {
    description: pick(['description', 'merchant', 'name', 'what', 'item', 'vendor']),
    amount: pick(['amount', 'total', 'price', 'cost', 'value']),
    date: pick(['date', 'when', 'time', 'purchased', 'purchase date', 'transaction date']),
    category: pick(['category', 'type']),
    paidBy: pick(['paid by', 'payer', 'paid', 'who', 'owner']),
    note: pick(['note', 'notes', 'memo', 'comment', 'details']),
  };
}


